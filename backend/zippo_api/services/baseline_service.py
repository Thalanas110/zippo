from __future__ import annotations

import logging
from typing import Any, Dict

try:
    import backend.old.baseline as bl
    import backend.old.delivery_optimizer as do
    import backend.old.gift_intelligence as gi
except ModuleNotFoundError:
    import old.baseline as bl
    import old.delivery_optimizer as do
    import old.gift_intelligence as gi

from zippo_api.core.config import BUDGET_BANDS
from zippo_api.models.schemas import BaselineRequestModel
from zippo_api.repositories.zippo_repository import ZippoRepository


logger = logging.getLogger("zippo-api")


class BaselineService:
    def __init__(self, repo: ZippoRepository):
        self.repo = repo

    def run(self, req: BaselineRequestModel) -> Dict[str, Any]:
        if req.scenario_type == "gift_filter":
            products = self.repo.fetch_products()
            bmin, bmax = BUDGET_BANDS.get(req.payload.get("budget_range", "mid"), (0, 100000))
            query = {
                "occasion": req.payload.get("occasion"),
                "recipient": req.payload.get("recipient_type"),
                "budget_min": bmin,
                "budget_max": bmax,
            }
            baseline_out = bl.baseline_filter(products, query, top_k=20)
            intelligent_out = gi.intelligent_filter(products, query, top_k=20)
            comparison = {
                "baseline_count": len(baseline_out),
                "intelligent_count": len(intelligent_out),
                "intelligent_avg_score": round(
                    sum(float(r.get("score") or 0) for r in intelligent_out) / max(1, len(intelligent_out)),
                    4,
                ),
            }
        else:
            riders = self.repo.fetch_riders()
            order = {
                "id": req.payload.get("order_id", 0),
                "pickup_lat": req.payload.get("pickup_lat", req.payload.get("lat", 0)),
                "pickup_lng": req.payload.get("pickup_lng", req.payload.get("lng", 0)),
                "dropoff_lat": req.payload.get("lat", 0),
                "dropoff_lng": req.payload.get("lng", 0),
            }
            baseline_out = bl.baseline_assign([order], riders)
            intelligent_out = do.optimize_delivery([order], riders)
            comparison = {
                "baseline_assignments": len(baseline_out),
                "intelligent_assignments": len(intelligent_out.get("assignments", [])),
            }

        run_id = None
        try:
            run_id = self.repo.insert_one(
                "baseline_runs",
                {
                    "scenario_type": req.scenario_type,
                    "payload": req.payload,
                },
            )
        except Exception as exc:
            logger.warning("[baseline] persistence skipped: %s", exc)

        return {
            "run_id": run_id,
            "baseline": baseline_out,
            "intelligent": intelligent_out,
            "comparison": comparison,
        }
