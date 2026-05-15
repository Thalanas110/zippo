from __future__ import annotations

import csv
import os
import sys
from collections import OrderedDict, defaultdict
from pathlib import Path
from typing import Any, Iterable

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from supabase import create_client


USERS_BASE = 200_000_000
PRODUCTS_BASE = 300_000_000
ORDERS_BASE = 400_000_000
DELIVERIES_BASE = 500_000_000
RIDERS_BASE = 600_000_000


def env_value(name: str, default: str = "") -> str:
    value = os.environ.get(name, default)
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
      return value[1:-1]
    return value


def read_csv_deduped(path: Path, key: str) -> list[dict[str, str]]:
    ordered: "OrderedDict[str, dict[str, str]]" = OrderedDict()
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            ordered[str(row[key])] = row
    return list(ordered.values())


def split_to_array(value: str) -> list[str]:
    return [entry.strip() for entry in value.split(",") if entry.strip()] if value else []


def deterministic_map(values: Iterable[str], base: int) -> dict[str, int]:
    unique = sorted({str(value) for value in values})
    return {value: base + index + 1 for index, value in enumerate(unique)}


def to_bool(value: str) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


def batch_upsert(schema, table: str, conflict_column: str, rows: list[dict[str, Any]], batch_size: int = 200) -> None:
    if not rows:
        print(f"Skipping {table}: no rows to import.")
        return

    for offset in range(0, len(rows), batch_size):
        batch = rows[offset : offset + batch_size]
        schema.table(table).upsert(batch, on_conflict=conflict_column).execute()
        print(f"Imported {len(batch)} rows into zippo.{table} ({offset + len(batch)}/{len(rows)})")


def most_common(values: list[str]) -> str | None:
    if not values:
        return None
    counts: dict[str, int] = defaultdict(int)
    for value in values:
        counts[value] += 1
    return sorted(counts.items(), key=lambda item: (-item[1], item[0]))[0][0]


def build_rows(import_root: Path) -> tuple[
    list[dict[str, Any]],
    list[dict[str, Any]],
    list[dict[str, Any]],
    list[dict[str, Any]],
    list[dict[str, Any]],
]:
    users_src = read_csv_deduped(import_root / "users.csv", "user_id")
    products_src = read_csv_deduped(import_root / "products.csv", "product_id")
    orders_src = read_csv_deduped(import_root / "orders.csv", "order_id")
    deliveries_src = read_csv_deduped(import_root / "deliveries.csv", "delivery_id")

    user_id_map = deterministic_map((row["user_id"] for row in users_src), USERS_BASE)
    product_id_map = deterministic_map((row["product_id"] for row in products_src), PRODUCTS_BASE)
    order_id_map = deterministic_map((row["order_id"] for row in orders_src), ORDERS_BASE)
    delivery_id_map = deterministic_map((row["delivery_id"] for row in deliveries_src), DELIVERIES_BASE)

    rider_codes = sorted({row["rider_id"] for row in deliveries_src})
    rider_id_map = {
        rider_code: RIDERS_BASE + int("".join(ch for ch in rider_code if ch.isdigit()) or "0")
        for rider_code in rider_codes
    }

    users = [
        {
            "user_id": user_id_map[row["user_id"]],
            "full_name": row["full_name"],
            "age_group": row["age_group"],
            "gender": row["gender"],
            "barangay": row["barangay"],
            "budget_range": row["budget_range"].strip().lower(),
            "preferred_occasions": split_to_array(row["preferred_occasions"]),
            "lat": float(row["lat"]),
            "lng": float(row["lng"]),
            "created_at": row["created_at"],
        }
        for row in users_src
    ]

    products = [
        {
            "product_id": product_id_map[row["product_id"]],
            "vendor_id": None,
            "name": row["name"],
            "description": None,
            "category": row["category"].strip().lower(),
            "price": round(float(row["price"]), 2),
            "occasion_tags": split_to_array(row["occasion_tags"]),
            "recipient_tags": [entry.lower() for entry in split_to_array(row["recipient_tags"])],
            "tags": [],
            "delivery_zones": [],
            "local_vendor": to_bool(row["local_vendor"]),
            "avg_rating": round(float(row["avg_rating"]), 1),
            "stock": int(row["stock"]),
            "vendor_name": row["vendor_name"],
            "popularity_score": 0,
            "weight_score": float(row["weight_score"]),
        }
        for row in products_src
    ]

    rider_groups: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in deliveries_src:
        rider_groups[row["rider_id"]].append(row)

    riders = []
    for rider_code, rows in rider_groups.items():
        latitudes = [float(entry["lat"]) for entry in rows]
        longitudes = [float(entry["lng"]) for entry in rows]
        barangay = most_common([entry["barangay"] for entry in rows])
        riders.append(
            {
                "rider_id": rider_id_map[rider_code],
                "rider_name": f"Rider {rider_code}",
                "barangay": barangay,
                "current_lat": round(sum(latitudes) / len(latitudes), 5),
                "current_lng": round(sum(longitudes) / len(longitudes), 5),
                "capacity": 3,
                "speed_kmph": 22.0,
                "average_rating": None,
                "available": True,
            }
        )

    orders = [
        {
            "order_id": order_id_map[row["order_id"]],
            "user_id": user_id_map[row["user_id"]],
            "product_id": product_id_map[row["product_id"]],
            "occasion": row["occasion"],
            "recipient_type": row["recipient_type"].strip().lower(),
            "rating": int(row["rating"]),
            "order_date": row["order_date"],
            "total_price": round(float(row["total_price"]), 2),
            "status": row["status"].strip().lower(),
            "priority": 0,
            "promised_minutes": 60,
        }
        for row in orders_src
    ]

    deliveries = [
        {
            "delivery_id": delivery_id_map[row["delivery_id"]],
            "order_id": order_id_map[row["order_id"]],
            "rider_id": rider_id_map[row["rider_id"]],
            "barangay": row["barangay"],
            "lat": float(row["lat"]),
            "lng": float(row["lng"]),
            "time_slot": row["time_slot"],
            "distance_km": round(float(row["distance_km"]), 2),
            "assigned_at": row["assigned_at"],
            "status": row["status"].strip().lower(),
        }
        for row in deliveries_src
    ]

    return users, products, riders, orders, deliveries


def main() -> int:
    import_root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/imports")
    supabase_url = env_value("SUPABASE_URL", env_value("VITE_SUPABASE_URL"))
    supabase_key = env_value(
        "SUPABASE_SERVICE_ROLE_KEY",
        env_value("SUPABASE_SECRET_KEY", env_value("SUPABASE_PUBLISHABLE_KEY", env_value("VITE_SUPABASE_PUBLISHABLE_KEY"))),
    )
    schema_name = env_value("SUPABASE_SCHEMA_NAME", env_value("VITE_SUPABASE_SCHEMA_NAME", "zippo"))
    client = create_client(supabase_url, supabase_key)
    schema = client.schema(schema_name)

    users, products, riders, orders, deliveries = build_rows(import_root)

    batch_upsert(schema, "users", "user_id", users)
    batch_upsert(schema, "products", "product_id", products)
    batch_upsert(schema, "riders", "rider_id", riders)
    batch_upsert(schema, "orders", "order_id", orders)
    batch_upsert(schema, "deliveries", "delivery_id", deliveries)

    print("")
    print("Import complete.")
    print(f"users: {len(users)}")
    print(f"products: {len(products)}")
    print(f"riders: {len(riders)}")
    print(f"orders: {len(orders)}")
    print(f"deliveries: {len(deliveries)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
