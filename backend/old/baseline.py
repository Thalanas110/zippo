"""
baseline.py
Baseline wrapper for ZIPPO intelligent systems project.

Purpose:
    Provide a simple comparable baseline against the intelligent modules.

Baseline behavior:
    - baseline_filter(): only checks stock, occasion match, and budget.
    - baseline_assign(): assigns each order to the nearest available rider by
      distance to pickup only.
    - run_baseline(): wraps both into a single output so you can compare against:
        Module 1: Gift Intelligence Filter
        Module 2: Content-Based Recommendation System
        Module 3: Delivery Optimizer

Why this matters for the final project:
    A baseline gives your professor a fair comparison point. You can report:
    "Our intelligent model improves over baseline by ranking better gift matches
    and reducing estimated delivery distance/time."
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Sequence

try:
    from delivery_optimizer import haversine_km, order_points, rider_point, estimate_minutes
except ImportError:  # Allows package-style imports if placed inside a package.
    from .delivery_optimizer import haversine_km, order_points, rider_point, estimate_minutes


GiftItem = Dict[str, Any]
GiftQuery = Dict[str, Any]
Order = Dict[str, Any]
Rider = Dict[str, Any]


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        if value is None or value == "":
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def _normalize(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple, set)):
        value = " ".join(str(v) for v in value)
    return str(value).strip().lower()


def baseline_filter(gifts: Iterable[GiftItem], query: GiftQuery, top_k: int = 10) -> List[Dict[str, Any]]:
    """
    Simple gift filter baseline.

    Rules:
        1. Keep in-stock gifts.
        2. Keep gifts at or below budget_max when budget_max is provided.
        3. Prefer exact occasion match.
        4. Sort by rating, then lower price.
    """
    occasion = _normalize(query.get("occasion"))
    budget_max = query.get("budget_max")
    budget_max_f = None if budget_max in (None, "") else _safe_float(budget_max)

    output: List[Dict[str, Any]] = []
    for item in gifts:
        item = dict(item)
        stock = _safe_int(item.get("stock"), 0)
        price = _safe_float(item.get("price"), 0.0)
        item_occasions = _normalize(item.get("occasions", []))

        if stock <= 0:
            continue
        if budget_max_f is not None and price > budget_max_f:
            continue

        occasion_match = 1 if occasion and occasion in item_occasions else 0
        baseline_score = occasion_match + (_safe_float(item.get("rating"), 0.0) / 5.0)

        item.update(
            {
                "baseline_score": round(baseline_score, 4),
                "passed_filter": True,
                "method": "baseline_filter",
                "explanation": ["in stock", "within budget"] + (["occasion match"] if occasion_match else []),
            }
        )
        output.append(item)

    output.sort(key=lambda row: (row["baseline_score"], -_safe_float(row.get("price"), 0.0)), reverse=True)
    return output[: max(top_k, 0)]


def baseline_assign(orders: Iterable[Order], riders: Iterable[Rider]) -> List[Dict[str, Any]]:
    """
    Simple delivery assignment baseline.

    Each order is assigned independently to the nearest available rider based on
    distance from rider's current location to pickup. It does not optimize route
    order, rider load, or batching beyond capacity.
    """
    rider_states: Dict[Any, Dict[str, Any]] = {}
    for rider in riders:
        rider = dict(rider)
        if rider.get("available", True) is False:
            continue
        rider_states[rider.get("id")] = {
            "rider": rider,
            "capacity": max(_safe_int(rider.get("capacity"), 3), 1),
            "orders": [],
        }

    assignments: List[Dict[str, Any]] = []

    for order in [dict(order) for order in orders]:
        pickup, dropoff = order_points(order)
        best_rider_id = None
        best_distance = float("inf")

        for rider_id, state in rider_states.items():
            if len(state["orders"]) >= state["capacity"]:
                continue
            distance_to_pickup = haversine_km(rider_point(state["rider"]), pickup)
            if distance_to_pickup < best_distance:
                best_distance = distance_to_pickup
                best_rider_id = rider_id

        if best_rider_id is None:
            assignments.append(
                {
                    "order_id": order.get("id"),
                    "rider_id": None,
                    "status": "unassigned",
                    "method": "baseline_nearest_rider",
                }
            )
            continue

        state = rider_states[best_rider_id]
        state["orders"].append(order)
        direct_distance = haversine_km(pickup, dropoff)
        total_distance = best_distance + direct_distance
        speed = _safe_float(state["rider"].get("speed_kmph"), 22.0)

        assignments.append(
            {
                "order_id": order.get("id"),
                "rider_id": best_rider_id,
                "rider_name": state["rider"].get("name"),
                "distance_to_pickup_km": round(best_distance, 3),
                "direct_delivery_distance_km": round(direct_distance, 3),
                "estimated_total_distance_km": round(total_distance, 3),
                "estimated_minutes": round(estimate_minutes(total_distance, speed_kmph=speed), 2),
                "status": "assigned",
                "method": "baseline_nearest_rider",
            }
        )

    return assignments


def run_baseline(
    gifts: Iterable[GiftItem],
    query: GiftQuery,
    orders: Optional[Iterable[Order]] = None,
    riders: Optional[Iterable[Rider]] = None,
    top_k: int = 10,
) -> Dict[str, Any]:
    """Run baseline gift filtering and optional delivery assignment together."""
    gift_results = baseline_filter(gifts, query, top_k=top_k)
    delivery_results = baseline_assign(orders or [], riders or []) if orders is not None and riders is not None else []

    assigned_count = sum(1 for row in delivery_results if row.get("status") == "assigned")
    unassigned_count = sum(1 for row in delivery_results if row.get("status") == "unassigned")

    return {
        "gift_results": gift_results,
        "delivery_results": delivery_results,
        "summary": {
            "gift_count": len(gift_results),
            "assigned_delivery_count": assigned_count,
            "unassigned_delivery_count": unassigned_count,
            "method": "baseline_filter_plus_baseline_assign",
        },
    }
