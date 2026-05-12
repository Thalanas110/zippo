from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import HTTPException

try:
    import backend.old.delivery_optimizer as do
except ModuleNotFoundError:
    import old.delivery_optimizer as do

from zippo_api.models.schemas import DeliveryOptimizeRequest
from zippo_api.repositories.zippo_repository import ZippoRepository


logger = logging.getLogger("zippo-api")


class DeliveryService:
    def __init__(self, repo: ZippoRepository):
        self.repo = repo

    def optimize(self, req: DeliveryOptimizeRequest) -> Dict[str, Any]:
        order_row = None
        try:
            order_row = self.repo.fetch_order_by_id(req.order_id)
        except Exception:
            order_row = None

        riders = self.repo.fetch_riders()
        pickup_lat = (order_row or {}).get("pickup_lat") or req.lat
        pickup_lng = (order_row or {}).get("pickup_lng") or req.lng
        order = {
            "id": req.order_id,
            "pickup_lat": pickup_lat,
            "pickup_lng": pickup_lng,
            "dropoff_lat": req.lat,
            "dropoff_lng": req.lng,
            "time_slot": req.time_slot,
        }

        plan = do.optimize_delivery([order], riders)
        assignments = plan.get("assignments", []) if isinstance(plan, dict) else plan
        if not assignments:
            raise HTTPException(status_code=404, detail="No suitable rider found.")

        best = assignments[0]
        route_steps = best.get("route_steps") or []
        stop_steps = [
            step
            for step in route_steps
            if str(step.get("action", "")).lower() in {"pickup", "dropoff"}
        ]
        stops = [
            {
                "sequence": idx,
                "type": str(step.get("action", "dropoff")),
                "lat": float(step.get("lat", 0.0) or 0.0),
                "lng": float(step.get("lng", 0.0) or 0.0),
            }
            for idx, step in enumerate(stop_steps, start=1)
        ]
        path = [
            {
                "lat": float(step.get("lat", 0.0) or 0.0),
                "lng": float(step.get("lng", 0.0) or 0.0),
            }
            for step in route_steps
            if step.get("lat") is not None and step.get("lng") is not None
        ]

        estimated_minutes = best.get("estimated_total_minutes")
        score = None
        if isinstance(estimated_minutes, (int, float)):
            score = round(1000.0 / max(float(estimated_minutes), 1.0), 4)
        method = str(best.get("method", "astar_delivery_optimizer"))
        reason = f"Selected by {method} with A* route planning."

        run_id = None
        try:
            run_id = self.repo.insert_one(
                "delivery_optimizer_runs",
                {
                    "order_id": req.order_id,
                    "time_slot": req.time_slot,
                    "barangay": req.barangay,
                    "lat": req.lat,
                    "lng": req.lng,
                },
            )
            if run_id:
                assignment_id = self.repo.insert_one(
                    "delivery_assignments",
                    {
                        "run_id": run_id,
                        "order_id": req.order_id,
                        "rider_id": best.get("rider_id"),
                        "distance_km": best.get("total_distance_km"),
                        "estimated_minutes": estimated_minutes,
                        "score": score,
                        "reason": reason,
                    },
                )
                if assignment_id and stops:
                    self.repo.insert_many(
                        "delivery_assignment_stops",
                        [{"assignment_id": assignment_id, **s} for s in stops],
                    )
        except Exception as exc:
            logger.warning("[delivery] persistence skipped: %s", exc)

        return {
            "run_id": run_id,
            "rider_id": best.get("rider_id"),
            "rider_name": best.get("rider_name"),
            "distance_km": best.get("total_distance_km"),
            "estimated_minutes": estimated_minutes,
            "score": score,
            "reason": reason,
            "method": method,
            "status": "assigned",
            "stops": stops,
            "path": path,
        }
