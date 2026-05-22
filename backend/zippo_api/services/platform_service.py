from __future__ import annotations

import logging
import re
from collections import Counter
from typing import Any, Dict, List

try:
    import backend.old.gift_intelligence as gi
    import backend.old.recommendations as rec
except ModuleNotFoundError:
    import old.gift_intelligence as gi
    import old.recommendations as rec
from fastapi import HTTPException

from zippo_api.core.config import BUDGET_BANDS
from zippo_api.models.schemas import (
    AdminDashboardResponse,
    BuyerOrderRequest,
    BuyerOrderResponse,
    BuyerProfileLookupResponse,
    BuyerProfileRequest,
    CatalogResponse,
    CatalogSearchRequest,
    DriverTaskResponse,
    DriverTaskStatusRequest,
    FraudReportRequest,
    FraudReportResponse,
    ModerationActionRequest,
    StoreOwnerApplicationModerationRequest,
    StoreOwnerApplicationRequest,
    StoreOwnerApplicationResponse,
    StorePayload,
    StoreProductPayload,
)
from zippo_api.repositories.zippo_repository import ZippoRepository
from zippo_api.services.common import normalize_ranked_product


logger = logging.getLogger("zippo-api")
TIN_RE = re.compile(r"^\d{9,15}$")
VALID_MARKETPLACE_ROLES = {"buyer", "store_owner", "driver", "admin"}
GIFT_PACK_STYLE_FEES = {
    "standard": 59.0,
    "premium": 129.0,
    "luxury": 229.0,
}
GIFT_PACK_ADDON_FEE = 25.0


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value in (None, ""):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _text_blob(item: Dict[str, Any]) -> str:
    parts = [
        item.get("name"),
        item.get("description"),
        item.get("category"),
        item.get("vendor_name"),
        " ".join(item.get("tags") or []),
        " ".join(item.get("occasion_tags") or item.get("occasions") or []),
        " ".join(item.get("recipient_tags") or item.get("recipients") or []),
    ]
    return " ".join(str(part).lower() for part in parts if part)


def _normalize_marketplace_role(value: Any) -> str:
    role = str(value or "buyer").lower()
    return role if role in VALID_MARKETPLACE_ROLES else "buyer"


class PlatformService:
    def __init__(self, repo: ZippoRepository):
        self.repo = repo

    def _safe_fetch_table(
        self,
        table: str,
        *,
        filters: Dict[str, Any] | None = None,
        limit: int = 200,
        order_by: str | None = None,
        ascending: bool = False,
    ) -> List[Dict[str, Any]]:
        try:
            return self.repo.fetch_table(
                table=table,
                filters=filters,
                limit=limit,
                order_by=order_by,
                ascending=ascending,
            )
        except HTTPException as exc:
            logger.warning("[admin] table fetch failed for %s: %s", table, exc.detail)
            return []

    def _safe_fetch_orders(self, limit: int = 4000) -> List[Dict[str, Any]]:
        try:
            return self.repo.fetch_orders(limit=limit)
        except HTTPException as exc:
            logger.warning("[admin] legacy orders fetch failed: %s", exc.detail)
            return []

    def _map_marketplace_product(self, row: Dict[str, Any]) -> Dict[str, Any]:
        local = bool(row.get("local_vendor", True))
        return {
            "id": f"mkt-{row.get('product_id')}",
            "name": row.get("name"),
            "description": row.get("description", ""),
            "image_url": row.get("image_url"),
            "price": _safe_float(row.get("price"), 0.0),
            "category": row.get("category", "gift"),
            "vendor_id": row.get("store_id"),
            "vendor_name": row.get("store_name", "Marketplace Store"),
            "stock": int(row.get("stock") or 0),
            "rating": _safe_float(row.get("avg_rating"), 4.4),
            "popularity": _safe_float(row.get("popularity_score"), 0.4),
            "local": local,
            "tags": row.get("tags") or [],
            "occasions": row.get("occasion_tags") or [],
            "recipients": row.get("recipient_tags") or [],
            "delivery_zones": row.get("delivery_zones") or [],
            "source_table": "marketplace_products",
            "source_id": row.get("product_id"),
        }

    def _catalog_items(self) -> List[Dict[str, Any]]:
        base_products = self.repo.fetch_products()
        marketplace_rows = self.repo.fetch_marketplace_products()
        mapped = [self._map_marketplace_product(row) for row in marketplace_rows]
        return [*base_products, *mapped]

    def _gift_pack_fee(self, gift_pack: Dict[str, Any]) -> float:
        if not gift_pack or not gift_pack.get("enabled"):
            return 0.0
        style = str(gift_pack.get("style") or "standard").lower()
        base_fee = GIFT_PACK_STYLE_FEES.get(style, GIFT_PACK_STYLE_FEES["standard"])
        add_ons = gift_pack.get("add_ons") or []
        add_on_fee = len(add_ons) * GIFT_PACK_ADDON_FEE
        return round(base_fee + add_on_fee, 2)

    def search_catalog(self, req: CatalogSearchRequest) -> CatalogResponse:
        items = self._catalog_items()

        filtered = items
        if req.search:
            needle = req.search.strip().lower()
            filtered = [item for item in filtered if needle in _text_blob(item)]
        if req.prefer_local:
            filtered = [item for item in filtered if bool(item.get("local", True))]

        if req.budget_range:
            budget_min, budget_max = BUDGET_BANDS[req.budget_range]
            filtered = [
                item
                for item in filtered
                if budget_min <= _safe_float(item.get("price"), 0.0) <= budget_max
            ]

        intent_query = {
            "occasion": req.occasion,
            "recipient": req.recipient_type,
            "budget_min": BUDGET_BANDS.get(req.budget_range or "mid", (0, 999999))[0],
            "budget_max": BUDGET_BANDS.get(req.budget_range or "mid", (0, 999999))[1],
            "preferences": [req.search] if req.search else [],
        }

        if req.occasion or req.recipient_type:
            filtered = gi.intelligent_filter(
                filtered,
                intent_query,
                top_k=max(req.top_k * 2, req.top_k),
                config=gi.GiftFilterConfig(),
            )
        else:
            filtered = sorted(
                filtered,
                key=lambda row: (
                    _safe_float(row.get("popularity"), 0.0),
                    _safe_float(row.get("rating"), 0.0),
                ),
                reverse=True,
            )

        role = "buyer" if req.user_id else "guest"
        if req.user_id:
            try:
                reranker = rec.ContentBasedRecommender().fit(filtered)
                filtered = reranker.rerank_candidates(
                    query=intent_query,
                    candidates=filtered,
                    top_k=req.top_k,
                    cbf_weight=0.62,
                    existing_score_key="score",
                )
            except Exception as exc:
                logger.warning("[catalog] CBF rerank skipped: %s", exc)

        results = [normalize_ranked_product(item) for item in filtered[: req.top_k]]
        return CatalogResponse(role=role, results=results)

    def get_buyer_profile(self, user_id: int) -> BuyerProfileLookupResponse:
        rows = self.repo.fetch_table(
            table="marketplace_profiles",
            filters={"user_id": user_id},
            limit=1,
        )
        if not rows:
            return BuyerProfileLookupResponse(
                user_id=user_id,
                exists=False,
                onboarding_completed=False,
                profile={},
            )

        profile = dict(rows[0])
        role = _normalize_marketplace_role(profile.get("role"))
        full_name = str(profile.get("full_name") or "").strip()
        email = str(profile.get("email") or "").strip()
        onboarding_completed = bool(full_name and email and role == "driver")
        return BuyerProfileLookupResponse(
            user_id=user_id,
            exists=True,
            role=role,  # type: ignore[arg-type]
            onboarding_completed=onboarding_completed,
            profile=profile,
        )

    def upsert_buyer_profile(self, req: BuyerProfileRequest) -> Dict[str, Any]:
        role = _normalize_marketplace_role(req.role)
        existing = self.get_buyer_profile(req.user_id)
        if role == "driver" and existing.exists and existing.role == "driver" and existing.onboarding_completed:
            return {
                "profile_id": req.user_id,
                "status": "already_completed",
                "role": "driver",
                "onboarding_completed": True,
            }

        payload = {
            "user_id": req.user_id,
            "role": role,
            "full_name": req.full_name,
            "email": req.email,
            "phone": req.phone,
            "barangay": req.barangay,
            "address_line": req.address_line,
        }
        profile_id = self.repo.upsert_one("marketplace_profiles", payload, on_conflict="user_id")
        onboarding_completed = bool(role != "driver" or (req.full_name.strip() and req.email.strip()))
        return {
            "profile_id": profile_id or req.user_id,
            "status": "saved",
            "role": role,
            "onboarding_completed": onboarding_completed,
        }

    def delete_buyer_profile(self, user_id: int) -> Dict[str, Any]:
        self.repo.delete_by_id("marketplace_profiles", "user_id", user_id)
        return {"deleted": True, "user_id": user_id}

    def create_buyer_order(self, req: BuyerOrderRequest) -> BuyerOrderResponse:
        if not req.items:
            raise HTTPException(status_code=400, detail="At least one product is required to place an order.")

        catalog = self._catalog_items()
        index: Dict[str, Dict[str, Any]] = {}
        for product in catalog:
            pid = product.get("id") or product.get("product_id")
            source_id = product.get("source_id")
            if pid is not None:
                index[str(pid)] = product
            if source_id is not None:
                index[str(source_id)] = product

        line_items: List[Dict[str, Any]] = []
        subtotal = 0.0
        for item in req.items:
            product = index.get(str(item.product_id))
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id!r} does not exist.")
            price = _safe_float(product.get("price"), 0.0)
            quantity = max(int(item.quantity), 1)
            line_total = round(price * quantity, 2)
            line_items.append(
                {
                    "product_id": product.get("source_id") or product.get("product_id") or item.product_id,
                    "name": product.get("name"),
                    "quantity": quantity,
                    "unit_price": price,
                    "line_total": line_total,
                }
            )
            subtotal += line_total

        gift_pack_fee = self._gift_pack_fee(req.gift_pack)
        delivery_fee = _safe_float((req.delivery or {}).get("fee"), 49.0)
        total_price = round(subtotal + gift_pack_fee + delivery_fee, 2)

        order_payload = {
            "buyer_user_id": req.buyer_user_id,
            "occasion": req.occasion,
            "recipient_type": req.recipient_type,
            "notes": req.notes,
            "gift_pack": req.gift_pack,
            "delivery": req.delivery,
            "subtotal": round(subtotal, 2),
            "gift_pack_fee": gift_pack_fee,
            "delivery_fee": delivery_fee,
            "total_price": total_price,
            "status": "pending",
        }

        order_id: int | str = "draft-order"
        try:
            order_id = self.repo.insert_one("buyer_orders", order_payload) or order_id
            self.repo.insert_many(
                "buyer_order_items",
                [{"order_id": order_id, **line_item} for line_item in line_items],
            )
        except Exception as exc:
            logger.warning("[buyer-order] persistence skipped: %s", exc)

        query = {
            "occasion": req.occasion,
            "recipient": req.recipient_type,
            "budget_max": max(total_price, 300),
            "preferences": [req.notes] if req.notes else [],
        }
        recommendations: List[Dict[str, Any]] = []
        try:
            recommendations = rec.recommend_gifts(self._catalog_items(), query=query, top_k=4)
        except Exception as exc:
            logger.warning("[buyer-order] recommendation refresh skipped: %s", exc)

        return BuyerOrderResponse(
            order_id=order_id,
            status="pending",
            subtotal=round(subtotal, 2),
            gift_pack_fee=gift_pack_fee,
            delivery_fee=delivery_fee,
            total_price=total_price,
            recommendations=[normalize_ranked_product(item) for item in recommendations],
        )

    def list_buyer_orders(self, buyer_user_id: int) -> List[Dict[str, Any]]:
        orders = self._safe_fetch_table(
            "buyer_orders",
            filters={"buyer_user_id": buyer_user_id},
            limit=1000,
            order_by="created_at",
        )
        if not orders:
            return []

        order_ids = [row.get("order_id") for row in orders if row.get("order_id") is not None]
        order_items = self._safe_fetch_table(
            "buyer_order_items",
            filters={"order_id": order_ids},
            limit=5000,
            order_by="created_at",
            ascending=True,
        ) if order_ids else []

        product_ids = [row.get("product_id") for row in order_items if row.get("product_id") is not None]
        products = self._safe_fetch_table(
            "marketplace_products",
            filters={"product_id": product_ids},
            limit=5000,
        ) if product_ids else []
        products_by_id = {
            str(row.get("product_id")): row for row in products if row.get("product_id") is not None
        }
        missing_product_ids = [
            product_id for product_id in product_ids if str(product_id) not in products_by_id
        ]
        if missing_product_ids:
            legacy_products = self._safe_fetch_table(
                "products",
                filters={"product_id": missing_product_ids},
                limit=5000,
            )
            for row in legacy_products:
                product_id = row.get("product_id")
                if product_id is None:
                    continue
                products_by_id[str(product_id)] = {
                    "product_id": product_id,
                    "store_id": None,
                    "store_name": row.get("vendor_name"),
                    "vendor_name": row.get("vendor_name"),
                    "name": row.get("name"),
                }

        store_ids = [row.get("store_id") for row in products if row.get("store_id") is not None]
        stores = self._safe_fetch_table(
            "stores",
            filters={"store_id": store_ids},
            limit=2000,
        ) if store_ids else []
        stores_by_id = {
            str(row.get("store_id")): row for row in stores if row.get("store_id") is not None
        }

        tasks = self._safe_fetch_table(
            "driver_tasks",
            filters={"order_id": order_ids},
            limit=5000,
            order_by="created_at",
        ) if order_ids else []
        latest_task_by_order: Dict[str, Dict[str, Any]] = {}
        for task in tasks:
            order_id = task.get("order_id")
            if order_id is not None:
                latest_task_by_order[str(order_id)] = task

        driver_ids = [
            task.get("driver_user_id")
            for task in latest_task_by_order.values()
            if task.get("driver_user_id") is not None
        ]
        driver_profiles = self._safe_fetch_table(
            "marketplace_profiles",
            filters={"user_id": driver_ids},
            limit=2000,
        ) if driver_ids else []
        drivers_by_id = {
            str(row.get("user_id")): row for row in driver_profiles if row.get("user_id") is not None
        }
        missing_driver_ids = [
            driver_id for driver_id in driver_ids if str(driver_id) not in drivers_by_id
        ]
        if missing_driver_ids:
            legacy_riders = self._safe_fetch_table(
                "riders",
                filters={"rider_id": missing_driver_ids},
                limit=2000,
            )
            for row in legacy_riders:
                rider_id = row.get("rider_id")
                if rider_id is None:
                    continue
                drivers_by_id[str(rider_id)] = {
                    "user_id": rider_id,
                    "full_name": row.get("rider_name"),
                }

        items_by_order: Dict[str, List[Dict[str, Any]]] = {}
        for item in order_items:
            order_id = item.get("order_id")
            if order_id is None:
                continue
            items_by_order.setdefault(str(order_id), []).append(item)

        normalized: List[Dict[str, Any]] = []
        for order in orders:
            order_id = order.get("order_id")
            if order_id is None:
                continue

            order_key = str(order_id)
            items = items_by_order.get(order_key, [])
            primary_item = items[0] if items else {}
            product = products_by_id.get(str(primary_item.get("product_id")), {})
            store = stores_by_id.get(str(product.get("store_id")), {})
            task = latest_task_by_order.get(order_key, {})
            driver = drivers_by_id.get(str(task.get("driver_user_id")), {})
            delivery = order.get("delivery") if isinstance(order.get("delivery"), dict) else {}

            normalized.append(
                {
                    "order_id": order_id,
                    "status": str(task.get("status") or order.get("status") or "pending"),
                    "occasion": order.get("occasion"),
                    "recipient_type": order.get("recipient_type"),
                    "total_price": _safe_float(order.get("total_price"), 0.0),
                    "created_at": order.get("created_at"),
                    "primary_product_name": primary_item.get("name") or product.get("name") or "Gift order",
                    "item_count": max(len(items), 1 if primary_item else 0),
                    "store_id": product.get("store_id"),
                    "store_name": store.get("store_name") or product.get("store_name") or "ZIPPO Marketplace",
                    "rider_user_id": task.get("driver_user_id"),
                    "rider_name": driver.get("full_name"),
                    "recipient_name": delivery.get("recipient_name"),
                    "delivery_address": delivery.get("address"),
                    "raw_order_status": order.get("status"),
                    "raw_task_status": task.get("status"),
                }
            )

        normalized.sort(key=lambda row: str(row.get("created_at") or ""), reverse=True)
        return normalized

    def submit_fraud_report(self, req: FraudReportRequest) -> FraudReportResponse:
        payload = {
            "reporter_user_id": req.reporter_user_id,
            "accused_role": req.accused_role,
            "accused_user_id": req.accused_user_id,
            "accused_store_id": req.accused_store_id,
            "reason": req.reason,
            "details": req.details,
            "evidence_url": req.evidence_url,
            "status": "pending",
        }
        report_id = self.repo.insert_one("fraud_reports", payload) or "pending-report"
        return FraudReportResponse(report_id=report_id, status="pending")

    def submit_store_owner_application(
        self,
        req: StoreOwnerApplicationRequest,
    ) -> StoreOwnerApplicationResponse:
        if not TIN_RE.match(req.bir_tin):
            raise HTTPException(status_code=400, detail="BIR TIN must be 9 to 15 numeric digits.")

        payload = {
            "applicant_user_id": req.applicant_user_id,
            "full_name": req.full_name,
            "email": req.email,
            "contact_no": req.contact_no,
            "bir_tin": req.bir_tin,
            "dti_registration_no": req.dti_registration_no,
            "business_name": req.business_name,
            "business_address": req.business_address,
            "barangay": req.barangay,
            "documents": req.documents,
            "status": "pending_review",
        }
        application_id = self.repo.insert_one("store_owner_applications", payload) or "pending-application"
        return StoreOwnerApplicationResponse(application_id=application_id, status="pending_review")

    def create_store(self, req: StorePayload) -> Dict[str, Any]:
        payload = {
            "owner_user_id": req.owner_user_id,
            "store_name": req.store_name,
            "description": req.description,
            "barangay": req.barangay,
            "lat": req.lat,
            "lng": req.lng,
            "is_active": req.is_active,
        }
        store_id = self.repo.insert_one("stores", payload) or "draft-store"
        return {"store_id": store_id, "status": "created"}

    def update_store(self, store_id: int | str, req: StorePayload) -> Dict[str, Any]:
        payload = {
            "store_name": req.store_name,
            "description": req.description,
            "barangay": req.barangay,
            "lat": req.lat,
            "lng": req.lng,
            "is_active": req.is_active,
        }
        self.repo.update_by_id("stores", "store_id", store_id, payload)
        return {"store_id": store_id, "status": "updated"}

    def delete_store(self, store_id: int | str) -> Dict[str, Any]:
        self.repo.delete_by_id("stores", "store_id", store_id)
        return {"store_id": store_id, "status": "deleted"}

    def create_store_product(self, req: StoreProductPayload) -> Dict[str, Any]:
        payload = {
            "store_id": req.store_id,
            "owner_user_id": req.owner_user_id,
            "name": req.name,
            "description": req.description,
            "category": req.category,
            "price": req.price,
            "stock": req.stock,
            "occasion_tags": req.occasion_tags,
            "recipient_tags": req.recipient_tags,
            "tags": req.tags,
            "local_vendor": req.local_vendor,
        }
        product_id = self.repo.insert_one("marketplace_products", payload) or "draft-product"
        return {"product_id": product_id, "status": "created"}

    def update_store_product(self, product_id: int | str, req: StoreProductPayload) -> Dict[str, Any]:
        payload = {
            "store_id": req.store_id,
            "name": req.name,
            "description": req.description,
            "category": req.category,
            "price": req.price,
            "stock": req.stock,
            "occasion_tags": req.occasion_tags,
            "recipient_tags": req.recipient_tags,
            "tags": req.tags,
            "local_vendor": req.local_vendor,
        }
        self.repo.update_by_id("marketplace_products", "product_id", product_id, payload)
        return {"product_id": product_id, "status": "updated"}

    def delete_store_product(self, product_id: int | str) -> Dict[str, Any]:
        self.repo.delete_by_id("marketplace_products", "product_id", product_id)
        return {"product_id": product_id, "status": "deleted"}

    def list_store_owner_orders(self, owner_user_id: int) -> List[Dict[str, Any]]:
        stores = self._safe_fetch_table(
            "stores",
            filters={"owner_user_id": owner_user_id},
            limit=2000,
            order_by="store_id",
        )
        if not stores:
            return []

        store_ids = [row.get("store_id") for row in stores if row.get("store_id") is not None]
        if not store_ids:
            return []

        store_by_id = {str(row.get("store_id")): row for row in stores if row.get("store_id") is not None}
        store_by_name = {
            str(row.get("store_name") or "").strip(): row
            for row in stores
            if str(row.get("store_name") or "").strip()
        }
        store_names = set(store_by_name.keys())
        products = self._safe_fetch_table(
            "marketplace_products",
            filters={"store_id": store_ids},
            limit=8000,
            order_by="product_id",
        )
        product_by_id = {str(row.get("product_id")): row for row in products if row.get("product_id") is not None}
        try:
            legacy_products = self.repo.fetch_products(limit=8000)
        except HTTPException as exc:
            logger.warning("[vendor] legacy products fetch failed: %s", exc.detail)
            legacy_products = []

        legacy_products = [
            row for row in legacy_products if str(row.get("vendor_name") or "").strip() in store_names
        ]
        legacy_products_by_id = {}
        for row in legacy_products:
            raw_product_id = row.get("product_id") or row.get("id")
            if raw_product_id is None:
                continue
            matched_store = store_by_name.get(str(row.get("vendor_name") or "").strip(), {})
            legacy_products_by_id[str(raw_product_id)] = {
                "product_id": raw_product_id,
                "store_id": matched_store.get("store_id"),
                "store_name": matched_store.get("store_name") or row.get("vendor_name") or "Store",
                "owner_user_id": matched_store.get("owner_user_id"),
                "name": row.get("name"),
                "vendor_name": row.get("vendor_name"),
                "category": row.get("category"),
            }

        product_ids = [*product_by_id.keys(), *legacy_products_by_id.keys()]
        if not product_ids:
            return []

        order_items = self._safe_fetch_table(
            "buyer_order_items",
            filters={"product_id": product_ids},
            limit=10000,
            order_by="created_at",
        )
        if not order_items:
            return []

        order_ids = [row.get("order_id") for row in order_items if row.get("order_id") is not None]
        if not order_ids:
            return []

        orders = self._safe_fetch_table(
            "buyer_orders",
            filters={"order_id": order_ids},
            limit=10000,
            order_by="created_at",
        )
        order_by_id = {str(row.get("order_id")): row for row in orders if row.get("order_id") is not None}

        normalized: List[Dict[str, Any]] = []
        for item in order_items:
            order_id = item.get("order_id")
            product_id = item.get("product_id")
            order = order_by_id.get(str(order_id), {})
            product = product_by_id.get(str(product_id)) or legacy_products_by_id.get(str(product_id), {})
            store_id = product.get("store_id")
            store = store_by_id.get(str(store_id), {})
            store_name = store.get("store_name") or product.get("store_name") or product.get("vendor_name") or "Store"

            normalized.append(
                {
                    "order_item_id": item.get("order_item_id"),
                    "order_id": order_id,
                    "product_id": product_id,
                    "product_name": item.get("name") or product.get("name"),
                    "quantity": int(item.get("quantity") or 0),
                    "unit_price": _safe_float(item.get("unit_price"), 0.0),
                    "line_total": _safe_float(item.get("line_total"), 0.0),
                    "status": str(order.get("status") or "pending"),
                    "occasion": order.get("occasion"),
                    "recipient_type": order.get("recipient_type"),
                    "buyer_user_id": order.get("buyer_user_id"),
                    "total_price": _safe_float(order.get("total_price"), 0.0),
                    "store_id": store_id,
                    "store_name": store_name,
                    "created_at": order.get("created_at") or item.get("created_at"),
                }
            )

        if store_names:
            if legacy_products_by_id:
                legacy_orders = self._safe_fetch_orders(limit=10000)
                for order in legacy_orders:
                    product = legacy_products_by_id.get(str(order.get("product_id")))
                    if not product:
                        continue
                    store = store_by_name.get(str(product.get("vendor_name") or "").strip(), {})
                    normalized.append(
                        {
                            "order_item_id": None,
                            "order_id": order.get("order_id"),
                            "product_id": order.get("product_id"),
                            "product_name": product.get("name") or "Order Item",
                            "quantity": 1,
                            "unit_price": _safe_float(product.get("price"), 0.0),
                            "line_total": _safe_float(order.get("total_price"), 0.0),
                            "status": str(order.get("status") or "pending"),
                            "occasion": order.get("occasion"),
                            "recipient_type": order.get("recipient_type"),
                            "buyer_user_id": order.get("user_id"),
                            "total_price": _safe_float(order.get("total_price"), 0.0),
                            "store_id": store.get("store_id"),
                            "store_name": store.get("store_name") or product.get("vendor_name") or "Store",
                            "created_at": order.get("order_date") or order.get("created_at"),
                        }
                    )

        normalized.sort(key=lambda row: str(row.get("created_at") or ""), reverse=True)
        return normalized[:1000]

    def list_driver_tasks(self, driver_user_id: int) -> DriverTaskResponse:
        tasks = self.repo.fetch_table(
            table="driver_tasks",
            filters={"driver_user_id": driver_user_id},
            limit=200,
            order_by="created_at",
        )
        return DriverTaskResponse(tasks=tasks)

    def update_driver_task_status(
        self,
        task_id: int | str,
        req: DriverTaskStatusRequest,
    ) -> Dict[str, Any]:
        payload = {"status": req.status, "last_note": req.note}
        self.repo.update_by_id("driver_tasks", "task_id", task_id, payload)
        return {"task_id": task_id, "status": req.status}

    def admin_dashboard(self) -> AdminDashboardResponse:
        profiles = self._safe_fetch_table("marketplace_profiles", limit=4000)
        marketplace_orders = self._safe_fetch_table("buyer_orders", limit=4000)
        legacy_orders = self._safe_fetch_orders(limit=4000)
        reports = self._safe_fetch_table("fraud_reports", limit=2000)
        applications = self._safe_fetch_table("store_owner_applications", limit=2000)
        driver_tasks = self._safe_fetch_table("driver_tasks", limit=4000)

        role_counts = Counter(str(row.get("role") or "unknown") for row in profiles)
        order_status_counts = Counter(str(row.get("status") or "unknown") for row in marketplace_orders)
        legacy_status_counts = Counter(str(row.get("status") or "unknown") for row in legacy_orders)
        report_status_counts = Counter(str(row.get("status") or "unknown") for row in reports)

        metrics = {
            "buyers": role_counts.get("buyer", 0),
            "store_owners": role_counts.get("store_owner", 0),
            "drivers": role_counts.get("driver", 0),
            "admins": role_counts.get("admin", 0),
            "marketplace_orders": len(marketplace_orders),
            "legacy_orders": len(legacy_orders),
            "fraud_reports": len(reports),
            "pending_store_owner_applications": sum(
                1 for row in applications if str(row.get("status", "")).startswith("pending")
            ),
            "active_driver_tasks": sum(
                1
                for row in driver_tasks
                if str(row.get("status")) in {"assigned", "picked_up", "in_transit"}
            ),
        }

        charts = {
            "marketplace_orders_by_status": dict(order_status_counts),
            "legacy_orders_by_status": dict(legacy_status_counts),
            "reports_by_status": dict(report_status_counts),
        }

        pending_reports = [
            row
            for row in reports
            if str(row.get("status") or "").lower() in {"pending", "reviewing"}
        ][:20]

        return AdminDashboardResponse(
            metrics=metrics,
            charts=charts,
            pending_reports=pending_reports,
        )

    def list_reports(self) -> List[Dict[str, Any]]:
        return self._safe_fetch_table("fraud_reports", limit=500, order_by="created_at")

    def moderate_report(self, report_id: int | str, req: ModerationActionRequest) -> Dict[str, Any]:
        payload = {
            "status": req.status,
            "moderation_note": req.action_taken,
        }
        self.repo.update_by_id("fraud_reports", "report_id", report_id, payload)
        return {"report_id": report_id, "status": req.status}

    def list_admin_stores(self) -> List[Dict[str, Any]]:
        stores = self._safe_fetch_table("stores", limit=4000, order_by="store_id")
        products = self._safe_fetch_table("marketplace_products", limit=4000)
        store_product_counts = Counter(str(row.get("store_id")) for row in products if row.get("store_id") is not None)
        legacy_product_counts: Counter[str] = Counter()
        try:
            legacy_products = self.repo.fetch_products(limit=5000)
            legacy_product_counts = Counter(
                str(row.get("vendor_name") or "").strip()
                for row in legacy_products
                if str(row.get("vendor_name") or "").strip()
            )
        except HTTPException as exc:
            logger.warning("[admin] legacy products fetch failed for stores: %s", exc.detail)

        normalized: List[Dict[str, Any]] = []
        for row in stores:
            store_id = row.get("store_id")
            store_name = row.get("store_name", "Unnamed Store")
            normalized.append(
                {
                    **row,
                    "store_id": store_id,
                    "store_name": store_name,
                    "owner_user_id": row.get("owner_user_id"),
                    "barangay": row.get("barangay"),
                    "is_active": bool(row.get("is_active", True)),
                    "product_count": int(store_product_counts.get(str(store_id), 0))
                    + int(legacy_product_counts.get(str(store_name).strip(), 0)),
                }
            )
        return normalized

    def list_admin_users(self) -> List[Dict[str, Any]]:
        profiles = self._safe_fetch_table("marketplace_profiles", limit=5000, order_by="user_id")
        orders = self._safe_fetch_table("buyer_orders", limit=5000)
        order_counts = Counter(str(row.get("buyer_user_id")) for row in orders if row.get("buyer_user_id") is not None)

        normalized: List[Dict[str, Any]] = []
        for row in profiles:
            user_id = row.get("user_id")
            normalized.append(
                {
                    **row,
                    "user_id": user_id,
                    "role": str(row.get("role") or "buyer"),
                    "full_name": row.get("full_name") or "N/A",
                    "email": row.get("email") or "N/A",
                    "phone": row.get("phone"),
                    "barangay": row.get("barangay"),
                    "address_line": row.get("address_line"),
                    "order_count": int(order_counts.get(str(user_id), 0)),
                }
            )
        return normalized

    def list_admin_products(self) -> List[Dict[str, Any]]:
        stores = self._safe_fetch_table("stores", limit=4000)
        store_names = {str(row.get("store_id")): row.get("store_name", "Marketplace Store") for row in stores}
        stores_by_name = {
            str(row.get("store_name") or "").strip(): row
            for row in stores
            if str(row.get("store_name") or "").strip()
        }

        marketplace_products = self._safe_fetch_table("marketplace_products", limit=5000, order_by="product_id")
        normalized_marketplace: List[Dict[str, Any]] = []
        for row in marketplace_products:
            store_id = row.get("store_id")
            normalized_marketplace.append(
                {
                    "product_id": row.get("product_id"),
                    "name": row.get("name"),
                    "category": row.get("category"),
                    "price": _safe_float(row.get("price"), 0.0),
                    "stock": int(row.get("stock") or 0),
                    "store_id": store_id,
                    "store_name": store_names.get(str(store_id), row.get("store_name", "Marketplace Store")),
                    "owner_user_id": row.get("owner_user_id"),
                    "local_vendor": bool(row.get("local_vendor", True)),
                    "source": "seller_catalog",
                }
            )

        legacy_products: List[Dict[str, Any]] = []
        try:
            base_products = self.repo.fetch_products(limit=5000)
            for row in base_products:
                matched_store = stores_by_name.get(str(row.get("vendor_name") or "").strip())
                legacy_products.append(
                    {
                        "product_id": row.get("id") or row.get("product_id"),
                        "name": row.get("name"),
                        "category": row.get("category"),
                        "price": _safe_float(row.get("price"), 0.0),
                        "stock": int(row.get("stock") or 0),
                        "store_id": matched_store.get("store_id") if matched_store else row.get("vendor_id"),
                        "store_name": matched_store.get("store_name") if matched_store else row.get("vendor_name") or "Legacy Catalog",
                        "owner_user_id": matched_store.get("owner_user_id") if matched_store else None,
                        "local_vendor": bool(row.get("local_vendor", row.get("local", True))),
                        "source": "legacy_catalog",
                    }
                )
        except HTTPException as exc:
            logger.warning("[admin] legacy products fetch failed: %s", exc.detail)

        return [*normalized_marketplace, *legacy_products]

    def list_store_owner_applications(self) -> List[Dict[str, Any]]:
        return self._safe_fetch_table("store_owner_applications", limit=2000, order_by="created_at")

    def moderate_store_owner_application(
        self,
        application_id: int | str,
        req: StoreOwnerApplicationModerationRequest,
    ) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"status": req.status}
        if req.action_taken:
            payload["review_note"] = req.action_taken
        self.repo.update_by_id("store_owner_applications", "application_id", application_id, payload)
        return {"application_id": application_id, "status": req.status}
