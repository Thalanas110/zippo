"""
delivery_optimizer.py
Module 3 — Delivery Optimizer for ZIPPO.

Purpose:
    Assign delivery orders to riders and produce simple route plans.

Algorithm:
    - Uses Haversine distance for coordinates.
    - Assigns orders greedily to the rider with the lowest incremental cost.
    - Builds route legs using A* search on a local geospatial grid.
    - Estimates delivery minutes using distance, rider speed, traffic multiplier,
      and service time.

Expected order fields:
    id: str | int
    vendor_id: str | int
    pickup_lat: float
    pickup_lng: float
    dropoff_lat: float
    dropoff_lng: float
    promised_minutes: int, optional
    priority: int, optional; higher means more urgent

Expected rider fields:
    id: str | int
    name: str
    current_lat: float
    current_lng: float
    capacity: int, optional
    speed_kmph: float, optional
    rating: float, optional
    available: bool, optional
"""

from __future__ import annotations

from heapq import heappop, heappush
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple
import math


Point = Tuple[float, float]
Order = Dict[str, Any]
Rider = Dict[str, Any]
Assignment = Dict[str, Any]


EARTH_RADIUS_KM = 6371.0088
DEFAULT_SPEED_KMPH = 22.0
DEFAULT_SERVICE_MINUTES = 4.0
GOOD_DISTANCE_KM = 1.4
GOOD_MAX_MINUTES = 15.0
GOOD_RATING_MIN = 4.5
LOW_TRAFFIC_MAX_MULTIPLIER = 1.20
# A* configuration: keep grid bounded so route search stays fast and predictable.
MAX_ASTAR_NODES = 12_000
ASTAR_PADDING_DEG = 0.01
ASTAR_BASE_STEP_DEG = 0.0018
ASTAR_MAX_PATH_POINTS = 30


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


def haversine_km(a: Point, b: Point) -> float:
    """Great-circle distance between two lat/lng points."""
    lat1, lon1 = map(math.radians, a)
    lat2, lon2 = map(math.radians, b)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(h))


def _clamp(value: int, lower: int, upper: int) -> int:
    return max(lower, min(value, upper))


def _astar_grid(
    start: Point,
    goal: Point,
    base_step_deg: float = ASTAR_BASE_STEP_DEG,
    padding_deg: float = ASTAR_PADDING_DEG,
) -> Tuple[float, float, float, int, int]:
    """
    Create a compact local grid for A*.

    Returns:
        (min_lat, min_lng, step_deg, rows, cols)
    """
    # Expand bounding box around both endpoints so search has maneuvering space.
    min_lat = min(start[0], goal[0]) - padding_deg
    max_lat = max(start[0], goal[0]) + padding_deg
    min_lng = min(start[1], goal[1]) - padding_deg
    max_lng = max(start[1], goal[1]) + padding_deg

    # Pick initial cell size (degrees) and convert bbox span into grid size.
    step = max(base_step_deg, 0.0006)
    rows = max(int(math.ceil((max_lat - min_lat) / step)) + 1, 2)
    cols = max(int(math.ceil((max_lng - min_lng) / step)) + 1, 2)

    # If grid is too large, coarsen cell size so A* remains within node budget.
    cell_count = rows * cols
    if cell_count > MAX_ASTAR_NODES:
        growth = math.sqrt(cell_count / MAX_ASTAR_NODES)
        step *= growth
        rows = max(int(math.ceil((max_lat - min_lat) / step)) + 1, 2)
        cols = max(int(math.ceil((max_lng - min_lng) / step)) + 1, 2)

    return min_lat, min_lng, step, rows, cols


def _idx_to_point(idx: Tuple[int, int], min_lat: float, min_lng: float, step: float) -> Point:
    return min_lat + idx[0] * step, min_lng + idx[1] * step


def _point_to_idx(
    point: Point,
    min_lat: float,
    min_lng: float,
    step: float,
    rows: int,
    cols: int,
) -> Tuple[int, int]:
    # Convert geographic point to nearest grid row/col.
    row = int(round((point[0] - min_lat) / step))
    col = int(round((point[1] - min_lng) / step))
    # Clamp to valid bounds in case rounding spills outside the grid edges.
    return _clamp(row, 0, rows - 1), _clamp(col, 0, cols - 1)


def _astar_neighbors(node: Tuple[int, int], rows: int, cols: int) -> List[Tuple[int, int]]:
    # 8-direction movement (N, NE, E, SE, S, SW, W, NW) on local grid.
    r, c = node
    neighbors: List[Tuple[int, int]] = []
    for dr in (-1, 0, 1):
        for dc in (-1, 0, 1):
            if dr == 0 and dc == 0:
                continue
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                neighbors.append((nr, nc))
    return neighbors


def _reconstruct_astar_path(
    came_from: Dict[Tuple[int, int], Tuple[int, int]],
    current: Tuple[int, int],
) -> List[Tuple[int, int]]:
    # Walk parent links backward from goal to start.
    path = [current]
    while current in came_from:
        current = came_from[current]
        path.append(current)
    # Reverse so caller gets start -> goal ordering.
    path.reverse()
    return path


def _downsample_path(path: List[Point], max_points: int = ASTAR_MAX_PATH_POINTS) -> List[Point]:
    # Keep polyline compact for API/UI payload sizes.
    if len(path) <= max_points:
        return path
    stride = max((len(path) - 1) // (max_points - 1), 1)
    sampled = [path[i] for i in range(0, len(path), stride)]
    # Ensure endpoint is always preserved.
    if sampled[-1] != path[-1]:
        sampled.append(path[-1])
    return sampled


def astar_path(start: Point, goal: Point) -> List[Point]:
    """
    Compute an A* polyline between two coordinates.

    Notes:
      - Operates on a local synthetic grid around the two points.
      - Falls back to a direct two-point line when search fails.
    """
    # Trivial case: origin and destination are identical.
    if start == goal:
        return [start]

    # Build local search grid and map endpoints to grid indices.
    min_lat, min_lng, step, rows, cols = _astar_grid(start, goal)
    start_idx = _point_to_idx(start, min_lat, min_lng, step, rows, cols)
    goal_idx = _point_to_idx(goal, min_lat, min_lng, step, rows, cols)

    # A* core structures:
    # - open_heap: frontier priority queue storing (f, g, node).
    # - came_from: parent pointers for path reconstruction.
    # - g_score: best-known cost from start to each node.
    open_heap: List[Tuple[float, float, Tuple[int, int]]] = []
    came_from: Dict[Tuple[int, int], Tuple[int, int]] = {}
    g_score: Dict[Tuple[int, int], float] = {start_idx: 0.0}

    # Seed frontier with start node; f = g + h, where g(start)=0.
    start_h = haversine_km(start, goal)
    heappush(open_heap, (start_h, 0.0, start_idx))
    # Closed set tracks finalized nodes so we do not re-expand them.
    closed: set[Tuple[int, int]] = set()
    # Hard iteration cap to prevent pathological runtime.
    iterations = 0
    max_iterations = rows * cols * 4

    # Standard A* loop: pop lowest-f node, relax neighbors, repeat.
    while open_heap and iterations < max_iterations:
        iterations += 1
        # Current best frontier candidate by f-score.
        _, current_g, current = heappop(open_heap)
        # Ignore stale queue entries already finalized earlier.
        if current in closed:
            continue
        # Goal reached: reconstruct index-path, convert to lat/lng, return.
        if current == goal_idx:
            idx_path = _reconstruct_astar_path(came_from, current)
            point_path = [
                _idx_to_point(idx, min_lat, min_lng, step)
                for idx in idx_path
            ]
            # Snap first/last coordinates to exact caller points.
            if point_path:
                point_path[0] = start
                point_path[-1] = goal
            # Trim path density for transport/rendering efficiency.
            return _downsample_path(point_path)

        # Mark node finalized; best path to it is now known.
        closed.add(current)
        current_point = _idx_to_point(current, min_lat, min_lng, step)

        # Evaluate all adjacent nodes and relax their costs.
        for neighbor in _astar_neighbors(current, rows, cols):
            # Skip already-finalized nodes.
            if neighbor in closed:
                continue
            neighbor_point = _idx_to_point(neighbor, min_lat, min_lng, step)
            # Tentative cost to neighbor through current node.
            tentative_g = current_g + haversine_km(current_point, neighbor_point)
            # Compare against best known cost (if any).
            best_known = g_score.get(neighbor)
            # If not an improvement, skip.
            if best_known is not None and tentative_g >= best_known:
                continue

            # Improvement found: update parent and best-known g-score.
            came_from[neighbor] = current
            g_score[neighbor] = tentative_g
            # Heuristic h(n): straight-line distance from neighbor to goal.
            heuristic = haversine_km(neighbor_point, goal)
            # Push back to frontier with updated f = g + h.
            heappush(open_heap, (tentative_g + heuristic, tentative_g, neighbor))

    # Fallback behavior if search exceeds cap or no path is found.
    return [start, goal]


def path_distance_km(path: Sequence[Point]) -> float:
    if len(path) < 2:
        return 0.0
    total = 0.0
    for idx in range(1, len(path)):
        total += haversine_km(path[idx - 1], path[idx])
    return total


def order_points(order: Order) -> Tuple[Point, Point]:
    pickup = (_safe_float(order.get("pickup_lat")), _safe_float(order.get("pickup_lng")))
    dropoff = (_safe_float(order.get("dropoff_lat")), _safe_float(order.get("dropoff_lng")))
    return pickup, dropoff


def rider_point(rider: Rider) -> Point:
    return (_safe_float(rider.get("current_lat")), _safe_float(rider.get("current_lng")))


def rider_rating(rider: Rider) -> float:
    return _safe_float(rider.get("average_rating"), 0.0)


def direct_order_distance_km(order: Order) -> float:
    pickup, dropoff = order_points(order)
    return haversine_km(pickup, dropoff)


def estimate_minutes(
    distance_km: float,
    speed_kmph: float = DEFAULT_SPEED_KMPH,
    traffic_multiplier: float = 1.15,
    service_minutes: float = DEFAULT_SERVICE_MINUTES,
) -> float:
    """Estimate travel plus service time in minutes."""
    speed = max(speed_kmph, 1.0)
    travel_minutes = (distance_km / speed) * 60.0 * max(traffic_multiplier, 0.1)
    return travel_minutes + service_minutes


def urgency_penalty(order: Order) -> float:
    """Small negative cost for urgent orders so they get selected earlier."""
    priority = _safe_int(order.get("priority"), 0)
    promised = _safe_int(order.get("promised_minutes"), 0)
    penalty = priority * 0.20
    if promised and promised <= 30:
        penalty += 0.25
    return penalty


def incremental_cost(
    rider: Rider,
    order: Order,
    rider_current_point: Optional[Point] = None,
    traffic_multiplier: float = 1.15,
) -> float:
    """
    Estimate cost of assigning an order to a rider.

    Cost = distance from rider to pickup + pickup to dropoff, adjusted for urgency.
    """
    current = rider_current_point or rider_point(rider)
    pickup, dropoff = order_points(order)
    distance = haversine_km(current, pickup) + haversine_km(pickup, dropoff)
    speed = _safe_float(rider.get("speed_kmph"), DEFAULT_SPEED_KMPH)
    minutes = estimate_minutes(distance, speed_kmph=speed, traffic_multiplier=traffic_multiplier)
    return max(minutes - urgency_penalty(order), 0.0)


def is_good_match(
    rider: Rider,
    order: Order,
    traffic_multiplier: float,
    rider_current_point: Optional[Point] = None,
) -> bool:
    """
    Business logic for a "goods" match.

    A rider is a good match when:
    - within GOOD_DISTANCE_KM from both pickup (store) and dropoff (buyer)
    - total trip is reachable within GOOD_MAX_MINUTES
    - traffic is light (traffic_multiplier <= LOW_TRAFFIC_MAX_MULTIPLIER)
    - rider rating is at or above GOOD_RATING_MIN
    """
    current = rider_current_point or rider_point(rider)
    pickup, dropoff = order_points(order)

    to_pickup = haversine_km(current, pickup)
    to_dropoff = haversine_km(current, dropoff)
    if to_pickup > GOOD_DISTANCE_KM or to_dropoff > GOOD_DISTANCE_KM:
        return False

    if traffic_multiplier > LOW_TRAFFIC_MAX_MULTIPLIER:
        return False

    rating = rider_rating(rider)
    if rating and rating < GOOD_RATING_MIN:
        return False
    if rating <= 0:
        return False

    speed = _safe_float(rider.get("speed_kmph"), DEFAULT_SPEED_KMPH)
    total_distance = to_pickup + haversine_km(pickup, dropoff)
    minutes = estimate_minutes(total_distance, speed_kmph=speed, traffic_multiplier=traffic_multiplier)
    return minutes <= GOOD_MAX_MINUTES


def sort_orders_by_priority(orders: Iterable[Order]) -> List[Order]:
    """Urgent, closer-deadline orders go first."""
    return sorted(
        [dict(order) for order in orders],
        key=lambda order: (
            -_safe_int(order.get("priority"), 0),
            _safe_int(order.get("promised_minutes"), 10_000),
            direct_order_distance_km(order),
        ),
    )


def assign_orders(
    orders: Iterable[Order],
    riders: Iterable[Rider],
    traffic_multiplier: float = 1.15,
) -> List[Assignment]:
    """
    Assign orders to available riders using greedy minimum incremental cost.

    Returns one assignment per rider with assigned orders and estimated route.
    """
    rider_states: Dict[Any, Dict[str, Any]] = {}
    for rider in riders:
        rider = dict(rider)
        if rider.get("available", True) is False:
            continue
        rider_id = rider.get("id")
        capacity = _safe_int(rider.get("capacity"), 3)
        rider_states[rider_id] = {
            "rider": rider,
            "capacity": max(capacity, 1),
            "orders": [],
            "current_point": rider_point(rider),
            "estimated_minutes": 0.0,
        }

    if not rider_states:
        return []

    for order in sort_orders_by_priority(orders):
        eligible_riders: Dict[Any, Dict[str, Any]] = {}
        for rider_id, state in rider_states.items():
            if len(state["orders"]) >= state["capacity"]:
                continue
            if is_good_match(
                state["rider"],
                order,
                traffic_multiplier=traffic_multiplier,
                rider_current_point=state["current_point"],
            ):
                eligible_riders[rider_id] = state

        candidate_riders = eligible_riders or {
            rider_id: state
            for rider_id, state in rider_states.items()
            if len(state["orders"]) < state["capacity"]
        }

        best_rider_id = None
        best_cost = float("inf")
        for rider_id, state in candidate_riders.items():
            cost = incremental_cost(
                state["rider"],
                order,
                rider_current_point=state["current_point"],
                traffic_multiplier=traffic_multiplier,
            )
            if cost < best_cost:
                best_cost = cost
                best_rider_id = rider_id

        if best_rider_id is None:
            # All riders are at capacity. The order remains unassigned.
            continue

        state = rider_states[best_rider_id]
        state["orders"].append(order)
        _, dropoff = order_points(order)
        state["current_point"] = dropoff
        state["estimated_minutes"] += best_cost

    assignments = []
    for state in rider_states.values():
        if not state["orders"]:
            continue
        route = build_route_plan(
            state["rider"],
            state["orders"],
            traffic_multiplier=traffic_multiplier,
        )
        assignments.append(route)

    assignments.sort(key=lambda row: row["estimated_total_minutes"])
    return assignments


def build_route_plan(
    rider: Rider,
    orders: Sequence[Order],
    traffic_multiplier: float = 1.15,
) -> Assignment:
    """
    Build a route plan for a rider's assigned orders.

    For each order, the rider must visit pickup before dropoff. The chosen order
    sequence is a nearest-neighbor approximation, while each leg path is
    computed with A* on a local geospatial grid.
    """
    remaining = [dict(order) for order in orders]
    current = rider_point(rider)
    speed = _safe_float(rider.get("speed_kmph"), DEFAULT_SPEED_KMPH)

    route_steps: List[Dict[str, Any]] = []
    total_distance = 0.0
    total_minutes = 0.0

    while remaining:
        best_idx = 0
        best_distance_to_pickup = float("inf")
        for idx, order in enumerate(remaining):
            pickup, _ = order_points(order)
            d = haversine_km(current, pickup)
            # Urgent orders are artificially pulled closer.
            d = max(d - urgency_penalty(order) * 0.05, 0.0)
            if d < best_distance_to_pickup:
                best_distance_to_pickup = d
                best_idx = idx

        order = remaining.pop(best_idx)
        pickup, dropoff = order_points(order)

        # A* invocation #1: rider current location -> pickup.
        to_pickup_path = astar_path(current, pickup)
        # A* invocation #2: pickup -> buyer dropoff.
        dropoff_path = astar_path(pickup, dropoff)
        to_pickup = path_distance_km(to_pickup_path)
        pickup_to_dropoff = path_distance_km(dropoff_path)

        pickup_minutes = estimate_minutes(
            to_pickup,
            speed_kmph=speed,
            traffic_multiplier=traffic_multiplier,
            service_minutes=1.0,
        )
        dropoff_minutes = estimate_minutes(
            pickup_to_dropoff,
            speed_kmph=speed,
            traffic_multiplier=traffic_multiplier,
            service_minutes=DEFAULT_SERVICE_MINUTES,
        )

        total_distance += to_pickup + pickup_to_dropoff
        total_minutes += pickup_minutes + dropoff_minutes

        # Add A* waypoint steps from rider current point to pickup.
        if len(to_pickup_path) >= 2:
            for path_idx in range(1, len(to_pickup_path)):
                prev_pt = to_pickup_path[path_idx - 1]
                cur_pt = to_pickup_path[path_idx]
                segment_km = haversine_km(prev_pt, cur_pt)
                is_terminal = path_idx == len(to_pickup_path) - 1
                route_steps.append(
                    {
                        "order_id": order.get("id"),
                        "action": "pickup" if is_terminal else "route",
                        "lat": cur_pt[0],
                        "lng": cur_pt[1],
                        "distance_from_previous_km": round(segment_km, 3),
                        "estimated_minutes_from_previous": round(
                            estimate_minutes(
                                segment_km,
                                speed_kmph=speed,
                                traffic_multiplier=traffic_multiplier,
                                service_minutes=1.0 if is_terminal else 0.0,
                            ),
                            2,
                        ),
                    }
                )
        else:
            route_steps.append(
                {
                    "order_id": order.get("id"),
                    "action": "pickup",
                    "lat": pickup[0],
                    "lng": pickup[1],
                    "distance_from_previous_km": round(to_pickup, 3),
                    "estimated_minutes_from_previous": round(pickup_minutes, 2),
                }
            )

        # Add A* waypoint steps from pickup to dropoff.
        if len(dropoff_path) >= 2:
            for path_idx in range(1, len(dropoff_path)):
                prev_pt = dropoff_path[path_idx - 1]
                cur_pt = dropoff_path[path_idx]
                segment_km = haversine_km(prev_pt, cur_pt)
                is_terminal = path_idx == len(dropoff_path) - 1
                route_steps.append(
                    {
                        "order_id": order.get("id"),
                        "action": "dropoff" if is_terminal else "route",
                        "lat": cur_pt[0],
                        "lng": cur_pt[1],
                        "distance_from_previous_km": round(segment_km, 3),
                        "estimated_minutes_from_previous": round(
                            estimate_minutes(
                                segment_km,
                                speed_kmph=speed,
                                traffic_multiplier=traffic_multiplier,
                                service_minutes=DEFAULT_SERVICE_MINUTES if is_terminal else 0.0,
                            ),
                            2,
                        ),
                    }
                )
        else:
            route_steps.append(
                {
                    "order_id": order.get("id"),
                    "action": "dropoff",
                    "lat": dropoff[0],
                    "lng": dropoff[1],
                    "distance_from_previous_km": round(pickup_to_dropoff, 3),
                    "estimated_minutes_from_previous": round(dropoff_minutes, 2),
                }
            )

        current = dropoff

    return {
        "rider_id": rider.get("id"),
        "rider_name": rider.get("name"),
        "order_ids": [order.get("id") for order in orders],
        "route_steps": route_steps,
        "total_distance_km": round(total_distance, 3),
        "estimated_total_minutes": round(total_minutes, 2),
        "method": "astar_delivery_optimizer",
    }


def find_unassigned_orders(orders: Iterable[Order], assignments: Sequence[Assignment]) -> List[Order]:
    assigned_ids = {order_id for assignment in assignments for order_id in assignment.get("order_ids", [])}
    return [dict(order) for order in orders if order.get("id") not in assigned_ids]


def optimize_delivery(
    orders: Iterable[Order],
    riders: Iterable[Rider],
    traffic_multiplier: float = 1.15,
) -> Dict[str, Any]:
    """One-shot optimizer output for API use."""
    order_list = [dict(order) for order in orders]
    assignments = assign_orders(order_list, riders, traffic_multiplier=traffic_multiplier)
    unassigned = find_unassigned_orders(order_list, assignments)
    return {
        "assignments": assignments,
        "unassigned_orders": unassigned,
        "summary": {
            "assigned_count": sum(len(a.get("order_ids", [])) for a in assignments),
            "unassigned_count": len(unassigned),
            "rider_count_used": len(assignments),
            "method": "astar_delivery_optimizer",
        },
    }
