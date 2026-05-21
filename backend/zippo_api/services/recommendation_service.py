from __future__ import annotations

import logging
from typing import Any, Dict, List

try:
    import backend.old.recommendations as rec
except ModuleNotFoundError:
    import old.recommendations as rec

from zippo_api.models.schemas import CBFRequest
from zippo_api.repositories.zippo_repository import ZippoRepository
from zippo_api.services.common import normalize_ranked_product, to_text


logger = logging.getLogger("zippo-api")


class RecommendationService:
    def __init__(self, repo: ZippoRepository):
        self.repo = repo

    def recommend(self, req: CBFRequest) -> Dict[str, Any]:
        products = self.repo.fetch_products()

        user_history: List[Dict[str, Any]] = []
        try:
            user_history = self.repo.fetch_orders_for_user(req.user_id)
        except Exception:
            user_history = []

        query = {
            "occasion": req.occasion,
            "recipient": req.recipient_type,
        }
        exclude_ids = [
            row.get("product_id")
            for row in user_history
            if isinstance(row, dict) and row.get("product_id") is not None
        ]

        results = rec.recommend_gifts(
            products,
            query=query,
            top_k=req.top_k,
            exclude_ids=exclude_ids,
        )

        run_id = None
        try:
            run_id = self.repo.insert_one(
                "recommendation_runs",
                {
                    "user_id": req.user_id,
                    "occasion": req.occasion,
                    "recipient_type": req.recipient_type,
                    "top_k": req.top_k,
                    "result_count": len(results),
                },
            )
            if run_id and results:
                self.repo.insert_many(
                    "recommendation_results",
                    [
                        {
                            "run_id": run_id,
                            "product_id": r.get("id"),
                            "rank": i + 1,
                            "score": r.get("recommendation_score") or r.get("score"),
                            "explanation": to_text(r.get("matched_terms") or r.get("explanation")),
                        }
                        for i, r in enumerate(results)
                    ],
                )
        except Exception as exc:
            logger.warning("[cbf] persistence skipped: %s", exc)

        return {"run_id": run_id, "results": [normalize_ranked_product(r) for r in results]}
