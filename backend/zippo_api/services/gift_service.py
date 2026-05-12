from __future__ import annotations

import logging
from typing import Any, Dict

try:
    import backend.old.gift_intelligence as gi
except ModuleNotFoundError:
    import old.gift_intelligence as gi

from zippo_api.core.config import BUDGET_BANDS
from zippo_api.models.schemas import GiftFilterRequest
from zippo_api.repositories.zippo_repository import ZippoRepository
from zippo_api.services.common import normalize_ranked_product


logger = logging.getLogger("zippo-api")


class GiftService:
    def __init__(self, repo: ZippoRepository):
        self.repo = repo

    def filter(self, req: GiftFilterRequest) -> Dict[str, Any]:
        products = self.repo.fetch_products()
        bmin, bmax = BUDGET_BANDS[req.budget_range]
        query = {
            "occasion": req.occasion,
            "recipient": req.recipient_type,
            "budget_min": bmin,
            "budget_max": bmax,
            "preferences": [],
        }

        config = gi.GiftFilterConfig()
        ranked = gi.intelligent_filter(products, query, config=config, top_k=20)

        run_id = None
        try:
            run_id = self.repo.insert_one(
                "gift_filter_runs",
                {
                    "user_id": req.user_id,
                    "occasion": req.occasion,
                    "recipient_type": req.recipient_type,
                    "budget_range": req.budget_range,
                    "prefer_local": req.prefer_local,
                    "result_count": len(ranked),
                },
            )
            if run_id and ranked:
                self.repo.insert_many(
                    "gift_filter_results",
                    [
                        {
                            "run_id": run_id,
                            "product_id": r.get("id"),
                            "rank": i + 1,
                            "score": r.get("score"),
                        }
                        for i, r in enumerate(ranked)
                    ],
                )
        except Exception as exc:
            logger.warning("[gift_filter] persistence skipped: %s", exc)

        return {"run_id": run_id, "results": [normalize_ranked_product(r) for r in ranked]}
