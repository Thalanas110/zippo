from __future__ import annotations

import os
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from supabase import create_client


def env_value(name: str, default: str = "") -> str:
    value = os.environ.get(name, default).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def fetch_all(schema, table: str, limit: int = 5000) -> list[dict[str, Any]]:
    response = schema.table(table).select("*").limit(limit).execute()
    return response.data or []


def batch_upsert(schema, table: str, conflict_column: str, rows: list[dict[str, Any]], batch_size: int = 200) -> None:
    if not rows:
        print(f"Skipping {table}: no rows to seed.")
        return

    for offset in range(0, len(rows), batch_size):
        batch = rows[offset : offset + batch_size]
        schema.table(table).upsert(batch, on_conflict=conflict_column).execute()
        print(f"Seeded {len(batch)} rows into zippo.{table} ({offset + len(batch)}/{len(rows)})")


def map_order_status(value: Any) -> str:
    status = str(value or "").strip().lower()
    return {
        "completed": "delivered",
        "delivered": "delivered",
        "processing": "processing",
        "pending": "pending",
        "cancelled": "cancelled",
        "refunded": "refunded",
        "paid": "paid",
        "ready_for_pickup": "ready_for_pickup",
        "in_transit": "in_transit",
    }.get(status, "pending")


def map_task_status(value: Any) -> str:
    status = str(value or "").strip().lower()
    return {
        "completed": "delivered",
        "delivered": "delivered",
        "assigned": "assigned",
        "picked_up": "picked_up",
        "in_transit": "in_transit",
        "cancelled": "cancelled",
        "failed": "failed",
    }.get(status, "assigned")


def map_time_slot(value: Any) -> str:
    slot = str(value or "").strip()
    return {
        "Morning": "Morning",
        "PM": "PM",
        "Eve": "Eve",
    }.get(slot, "PM")


def build_seed_rows(schema) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    users = fetch_all(schema, "users")
    products = fetch_all(schema, "products")
    orders = fetch_all(schema, "orders")
    deliveries = fetch_all(schema, "deliveries")
    riders = fetch_all(schema, "riders")

    users_by_id = {str(row.get("user_id")): row for row in users if row.get("user_id") is not None}
    products_by_id = {str(row.get("product_id")): row for row in products if row.get("product_id") is not None}
    deliveries_by_order: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in deliveries:
        order_id = row.get("order_id")
        if order_id is not None:
            deliveries_by_order[str(order_id)].append(row)

    marketplace_profiles: list[dict[str, Any]] = []
    for row in users:
        user_id = row.get("user_id")
        if user_id is None:
            continue
        marketplace_profiles.append(
            {
                "user_id": user_id,
                "role": "buyer",
                "full_name": row.get("full_name") or f"Buyer {user_id}",
                "email": f"user-{user_id}@zippo.local",
                "barangay": row.get("barangay"),
                "address_line": row.get("barangay"),
                "is_active": True,
            }
        )
    for row in riders:
        rider_id = row.get("rider_id")
        if rider_id is None:
            continue
        marketplace_profiles.append(
            {
                "user_id": rider_id,
                "role": "driver",
                "full_name": row.get("rider_name") or f"Rider {rider_id}",
                "email": f"driver-{rider_id}@zippo.local",
                "barangay": row.get("barangay"),
                "address_line": row.get("barangay"),
                "is_active": bool(row.get("available", True)),
            }
        )

    buyer_orders: list[dict[str, Any]] = []
    buyer_order_items: list[dict[str, Any]] = []
    driver_tasks: list[dict[str, Any]] = []

    for order in orders:
        order_id = order.get("order_id")
        buyer_user_id = order.get("user_id")
        product_id = order.get("product_id")
        if order_id is None or buyer_user_id is None:
            continue

        user = users_by_id.get(str(buyer_user_id), {})
        product = products_by_id.get(str(product_id), {})
        order_deliveries = deliveries_by_order.get(str(order_id), [])
        primary_delivery = sorted(
            order_deliveries,
            key=lambda row: str(row.get("assigned_at") or ""),
            reverse=True,
        )[0] if order_deliveries else {}

        total_price = round(float(order.get("total_price") or 0.0), 2)
        recipient_name = user.get("full_name") or "ZIPPO Customer"
        delivery_barangay = primary_delivery.get("barangay") or user.get("barangay")
        delivery_fee = round(float(primary_delivery.get("distance_km") or 0.0) * 15, 2) if primary_delivery else 0.0

        buyer_orders.append(
            {
                "order_id": order_id,
                "buyer_user_id": buyer_user_id,
                "occasion": order.get("occasion") or "Gift",
                "recipient_type": order.get("recipient_type") or "Friend",
                "notes": None,
                "gift_pack": {},
                "delivery": {
                    "recipient_name": recipient_name,
                    "address": f"{delivery_barangay}, Olongapo City" if delivery_barangay else "Olongapo City",
                    "fee": delivery_fee,
                    "timeslot": map_time_slot(primary_delivery.get("time_slot")),
                },
                "subtotal": total_price,
                "gift_pack_fee": 0,
                "delivery_fee": delivery_fee,
                "total_price": total_price,
                "status": map_order_status(order.get("status")),
                "created_at": order.get("order_date"),
            }
        )
        buyer_order_items.append(
            {
                "order_item_id": order_id,
                "order_id": order_id,
                "product_id": product_id,
                "name": product.get("name") or "Gift order",
                "quantity": 1,
                "unit_price": total_price,
                "line_total": total_price,
                "created_at": order.get("order_date"),
            }
        )

    for delivery in deliveries:
        delivery_id = delivery.get("delivery_id")
        order_id = delivery.get("order_id")
        rider_id = delivery.get("rider_id")
        if delivery_id is None or order_id is None or rider_id is None:
            continue
        order = next((row for row in orders if row.get("order_id") == order_id), {})
        product = products_by_id.get(str(order.get("product_id")), {})
        driver_tasks.append(
            {
                "task_id": delivery_id,
                "driver_user_id": rider_id,
                "order_id": order_id,
                "pickup_label": product.get("vendor_name") or "Marketplace Store",
                "dropoff_label": f"{delivery.get('barangay')}, Olongapo City" if delivery.get("barangay") else "Olongapo City",
                "status": map_task_status(delivery.get("status")),
                "last_note": f"Assigned for {map_time_slot(delivery.get('time_slot'))} delivery window.",
                "created_at": delivery.get("assigned_at"),
            }
        )

    return marketplace_profiles, buyer_orders, buyer_order_items, driver_tasks


def main() -> int:
    supabase_url = env_value("SUPABASE_URL", env_value("VITE_SUPABASE_URL"))
    supabase_key = env_value(
        "SUPABASE_SERVICE_ROLE_KEY",
        env_value("SUPABASE_SECRET_KEY", env_value("SUPABASE_PUBLISHABLE_KEY", env_value("VITE_SUPABASE_PUBLISHABLE_KEY"))),
    )
    schema_name = env_value("SUPABASE_SCHEMA_NAME", env_value("VITE_SUPABASE_SCHEMA_NAME", "zippo"))
    client = create_client(supabase_url, supabase_key)
    schema = client.schema(schema_name)

    marketplace_profiles, buyer_orders, buyer_order_items, driver_tasks = build_seed_rows(schema)

    batch_upsert(schema, "marketplace_profiles", "user_id", marketplace_profiles)
    batch_upsert(schema, "buyer_orders", "order_id", buyer_orders)
    batch_upsert(schema, "buyer_order_items", "order_item_id", buyer_order_items)
    batch_upsert(schema, "driver_tasks", "task_id", driver_tasks)

    print("")
    print("Marketplace history seed complete.")
    print(f"marketplace_profiles: {len(marketplace_profiles)}")
    print(f"buyer_orders: {len(buyer_orders)}")
    print(f"buyer_order_items: {len(buyer_order_items)}")
    print(f"driver_tasks: {len(driver_tasks)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
