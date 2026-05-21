from __future__ import annotations

import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from supabase import create_client


STORES_BASE = 700_000_000
STORE_OWNERS_BASE = 710_000_000


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


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return cleaned or "store-owner"


def most_common(values: list[str], fallback: str) -> str:
    if not values:
        return fallback
    counts = Counter(values)
    return counts.most_common(1)[0][0]


def build_rows(schema) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    products = fetch_all(schema, "products")
    orders = fetch_all(schema, "orders")
    deliveries = fetch_all(schema, "deliveries")

    vendor_names = sorted(
        {
            str(row.get("vendor_name") or "").strip()
            for row in products
            if str(row.get("vendor_name") or "").strip()
        }
    )

    product_by_id = {
        str(row.get("product_id")): row
        for row in products
        if row.get("product_id") is not None
    }
    delivery_by_order: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in deliveries:
        order_id = row.get("order_id")
        if order_id is not None:
            delivery_by_order[str(order_id)].append(row)

    vendor_barangays: dict[str, str] = {}
    for vendor_name in vendor_names:
        barangays: list[str] = []
        for order in orders:
            product = product_by_id.get(str(order.get("product_id")))
            if not product or str(product.get("vendor_name") or "").strip() != vendor_name:
                continue
            for delivery in delivery_by_order.get(str(order.get("order_id")), []):
                barangay = str(delivery.get("barangay") or "").strip()
                if barangay:
                    barangays.append(barangay)
        vendor_barangays[vendor_name] = most_common(barangays, "Pag-asa")

    store_owner_profiles: list[dict[str, Any]] = []
    stores: list[dict[str, Any]] = []
    for index, vendor_name in enumerate(vendor_names, start=1):
        owner_user_id = STORE_OWNERS_BASE + index
        store_id = STORES_BASE + index
        barangay = vendor_barangays.get(vendor_name, "Pag-asa")
        slug = slugify(vendor_name)

        store_owner_profiles.append(
            {
                "user_id": owner_user_id,
                "role": "store_owner",
                "full_name": f"{vendor_name} Owner",
                "email": f"{slug}@zippo.local",
                "barangay": barangay,
                "address_line": barangay,
                "is_active": True,
            }
        )
        stores.append(
            {
                "store_id": store_id,
                "owner_user_id": owner_user_id,
                "store_name": vendor_name,
                "description": f"Legacy vendor storefront synced for demo use: {vendor_name}",
                "barangay": barangay,
                "is_active": True,
            }
        )

    return store_owner_profiles, stores


def main() -> int:
    supabase_url = env_value("SUPABASE_URL", env_value("VITE_SUPABASE_URL"))
    supabase_key = env_value(
        "SUPABASE_SERVICE_ROLE_KEY",
        env_value("SUPABASE_SECRET_KEY", env_value("SUPABASE_PUBLISHABLE_KEY", env_value("VITE_SUPABASE_PUBLISHABLE_KEY"))),
    )
    schema_name = env_value("SUPABASE_SCHEMA_NAME", env_value("VITE_SUPABASE_SCHEMA_NAME", "zippo"))
    client = create_client(supabase_url, supabase_key)
    schema = client.schema(schema_name)

    profiles, stores = build_rows(schema)
    batch_upsert(schema, "marketplace_profiles", "user_id", profiles)
    batch_upsert(schema, "stores", "store_id", stores)

    print("")
    print("Storefront seed complete.")
    print(f"store_owner_profiles: {len(profiles)}")
    print(f"stores: {len(stores)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
