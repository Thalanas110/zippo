import importlib.util
import sys
import types
import unittest
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
PLATFORM_SERVICE_PATH = BACKEND_ROOT / "zippo_api" / "services" / "platform_service.py"


def load_platform_service():
    backend_module = types.ModuleType("backend")
    backend_old_module = types.ModuleType("backend.old")
    old_module = types.ModuleType("old")
    backend_module.old = backend_old_module
    sys.modules["backend"] = backend_module
    sys.modules["backend.old"] = backend_old_module
    sys.modules["old"] = old_module

    fastapi_module = types.ModuleType("fastapi")

    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail

    fastapi_module.HTTPException = HTTPException
    sys.modules["fastapi"] = fastapi_module

    config_module = types.ModuleType("zippo_api.core.config")
    config_module.BUDGET_BANDS = {
        "low": (0, 300),
        "mid": (300, 800),
        "high": (800, 100000),
    }
    sys.modules["zippo_api.core.config"] = config_module

    common_module = types.ModuleType("zippo_api.services.common")
    common_module.normalize_ranked_product = lambda item: item
    sys.modules["zippo_api.services.common"] = common_module

    repository_module = types.ModuleType("zippo_api.repositories.zippo_repository")
    repository_module.ZippoRepository = object
    sys.modules["zippo_api.repositories.zippo_repository"] = repository_module

    schemas_module = types.ModuleType("zippo_api.models.schemas")

    def schema_model(name):
        class SchemaModel:
            def __init__(self, **kwargs):
                for key, value in kwargs.items():
                    setattr(self, key, value)

        SchemaModel.__name__ = name
        return SchemaModel

    for name in [
        "AdminDashboardResponse",
        "BuyerOrderRequest",
        "BuyerOrderResponse",
        "BuyerProfileLookupResponse",
        "BuyerProfileRequest",
        "CatalogResponse",
        "CatalogSearchRequest",
        "DriverTaskResponse",
        "DriverTaskStatusRequest",
        "FraudReportRequest",
        "FraudReportResponse",
        "ModerationActionRequest",
        "StoreOwnerApplicationModerationRequest",
        "StoreOwnerApplicationRequest",
        "StoreOwnerApplicationResponse",
        "StorePayload",
        "StoreProductPayload",
    ]:
        setattr(schemas_module, name, schema_model(name))
    sys.modules["zippo_api.models.schemas"] = schemas_module

    gi_module = types.ModuleType("old.gift_intelligence")

    class GiftFilterConfig:
        pass

    gi_module.GiftFilterConfig = GiftFilterConfig
    gi_module.intelligent_filter = lambda items, *_args, **_kwargs: items
    sys.modules["old.gift_intelligence"] = gi_module
    sys.modules["backend.old.gift_intelligence"] = gi_module

    rec_module = types.ModuleType("old.recommendations")

    class ContentBasedRecommender:
        def fit(self, items):
            self.items = items
            return self

        def rerank_candidates(self, *, candidates, **_kwargs):
            return candidates

    rec_module.ContentBasedRecommender = ContentBasedRecommender
    rec_module.recommend_gifts = lambda *_args, **_kwargs: []
    sys.modules["old.recommendations"] = rec_module
    sys.modules["backend.old.recommendations"] = rec_module

    spec = importlib.util.spec_from_file_location("platform_service_under_test", PLATFORM_SERVICE_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module.PlatformService


PlatformService = load_platform_service()


class FakeRepo:
    def __init__(self, tables):
        self.tables = tables
        self.inserted_one = []
        self.inserted_many = []

    def fetch_table(self, table, filters=None, limit=200, order_by=None, ascending=False):
        rows = [dict(row) for row in self.tables.get(table, [])]
        for key, value in (filters or {}).items():
            if isinstance(value, list):
                allowed = {str(item) for item in value}
                rows = [row for row in rows if str(row.get(key)) in allowed]
            else:
                rows = [row for row in rows if row.get(key) == value]
        if order_by:
            rows.sort(key=lambda row: str(row.get(order_by) or ""), reverse=not ascending)
        return rows[:limit]

    def fetch_products(self, limit=2000):
        return [dict(row) for row in self.tables.get("products", [])][:limit]

    def fetch_marketplace_products(self, limit=2000):
        return [dict(row) for row in self.tables.get("marketplace_products", [])][:limit]

    def fetch_orders(self, limit=2000):
        return [dict(row) for row in self.tables.get("orders", [])][:limit]

    def insert_one(self, table, payload):
        self.inserted_one.append((table, payload))
        return payload.get("order_id", 12345)

    def insert_many(self, table, payload):
        self.inserted_many.append((table, payload))


class PlatformServiceBuyerOrdersTests(unittest.TestCase):
    def test_list_buyer_orders_returns_normalized_order_history(self):
        repo = FakeRepo(
            {
                "buyer_orders": [
                    {
                        "order_id": 1001,
                        "buyer_user_id": 7,
                        "occasion": "Birthday",
                        "recipient_type": "Parent",
                        "total_price": 300.0,
                        "status": "pending",
                        "created_at": "2026-05-10T09:30:00Z",
                    },
                    {
                        "order_id": 9999,
                        "buyer_user_id": 99,
                        "occasion": "Graduation",
                        "recipient_type": "Friend",
                        "total_price": 500.0,
                        "status": "delivered",
                        "created_at": "2026-05-01T09:30:00Z",
                    },
                ],
                "buyer_order_items": [
                    {
                        "order_item_id": 1,
                        "order_id": 1001,
                        "product_id": 501,
                        "name": "Gordon's Bibingka Box",
                        "quantity": 1,
                        "unit_price": 250.0,
                        "line_total": 250.0,
                    },
                    {
                        "order_item_id": 2,
                        "order_id": 1001,
                        "product_id": 502,
                        "name": "Greeting Card",
                        "quantity": 1,
                        "unit_price": 50.0,
                        "line_total": 50.0,
                    },
                ],
                "marketplace_products": [
                    {"product_id": 501, "store_id": 88, "name": "Gordon's Bibingka Box"},
                    {"product_id": 502, "store_id": 88, "name": "Greeting Card"},
                ],
                "stores": [
                    {"store_id": 88, "store_name": "Gordon's Market"},
                ],
                "driver_tasks": [
                    {
                        "task_id": 3001,
                        "order_id": 1001,
                        "driver_user_id": 444,
                        "status": "in_transit",
                        "created_at": "2026-05-10T10:00:00Z",
                    }
                ],
                "marketplace_profiles": [
                    {"user_id": 444, "full_name": "Carlos Reyes"},
                ],
            }
        )

        service = PlatformService(repo)

        orders = service.list_buyer_orders(7)

        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]["order_id"], 1001)
        self.assertEqual(orders[0]["primary_product_name"], "Gordon's Bibingka Box")
        self.assertEqual(orders[0]["store_name"], "Gordon's Market")
        self.assertEqual(orders[0]["item_count"], 2)
        self.assertEqual(orders[0]["rider_name"], "Carlos Reyes")
        self.assertEqual(orders[0]["status"], "in_transit")

    def test_list_buyer_orders_handles_orders_without_tasks_or_items(self):
        repo = FakeRepo(
            {
                "buyer_orders": [
                    {
                        "order_id": 2002,
                        "buyer_user_id": 7,
                        "occasion": "Anniversary",
                        "recipient_type": "Partner",
                        "total_price": 799.0,
                        "status": "processing",
                        "created_at": "2026-05-11T09:30:00Z",
                    }
                ]
            }
        )

        service = PlatformService(repo)

        orders = service.list_buyer_orders(7)

        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]["status"], "processing")
        self.assertEqual(orders[0]["primary_product_name"], "Gift order")
        self.assertEqual(orders[0]["store_name"], "ZIPPO Marketplace")
        self.assertIsNone(orders[0]["rider_name"])

    def test_list_buyer_orders_falls_back_to_legacy_products_and_riders(self):
        repo = FakeRepo(
            {
                "buyer_orders": [
                    {
                        "order_id": 3003,
                        "buyer_user_id": 7,
                        "occasion": "Christmas",
                        "recipient_type": "Friend",
                        "total_price": 999.0,
                        "status": "processing",
                        "created_at": "2026-05-12T09:30:00Z",
                    }
                ],
                "buyer_order_items": [
                    {
                        "order_item_id": 33,
                        "order_id": 3003,
                        "product_id": 9001,
                        "name": None,
                        "quantity": 1,
                        "unit_price": 999.0,
                        "line_total": 999.0,
                    }
                ],
                "products": [
                    {
                        "product_id": 9001,
                        "name": "Legacy Gift Box",
                        "vendor_name": "Legacy Vendor",
                    }
                ],
                "driver_tasks": [
                    {
                        "task_id": 9002,
                        "order_id": 3003,
                        "driver_user_id": 600000014,
                        "status": "assigned",
                        "created_at": "2026-05-12T10:00:00Z",
                    }
                ],
                "riders": [
                    {
                        "rider_id": 600000014,
                        "rider_name": "Rider RID014",
                    }
                ],
            }
        )

        service = PlatformService(repo)

        orders = service.list_buyer_orders(7)

        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]["primary_product_name"], "Legacy Gift Box")
        self.assertEqual(orders[0]["store_name"], "Legacy Vendor")
        self.assertEqual(orders[0]["rider_name"], "Rider RID014")
        self.assertEqual(orders[0]["status"], "assigned")

    def test_create_buyer_order_accepts_legacy_product_ids(self):
        repo = FakeRepo(
            {
                "products": [
                    {
                        "product_id": 300000011,
                        "name": "Power Supply",
                        "price": 225.75,
                    }
                ]
            }
        )

        service = PlatformService(repo)
        req = types.SimpleNamespace(
            buyer_user_id=7,
            occasion="Birthday",
            recipient_type="Friend",
            notes="Demo order",
            items=[types.SimpleNamespace(product_id=300000011, quantity=2)],
            gift_pack={"enabled": False, "style": "standard", "add_ons": []},
            delivery={"fee": 49},
        )

        response = service.create_buyer_order(req)

        self.assertEqual(response.order_id, 12345)
        self.assertEqual(response.subtotal, 451.5)
        self.assertEqual(response.total_price, 500.5)
        self.assertEqual(len(repo.inserted_many), 1)
        inserted_items = repo.inserted_many[0][1]
        self.assertEqual(inserted_items[0]["product_id"], 300000011)
        self.assertEqual(inserted_items[0]["quantity"], 2)


class PlatformServiceAdminFallbackTests(unittest.TestCase):
    def test_list_admin_stores_counts_legacy_products_by_store_name(self):
        repo = FakeRepo(
            {
                "stores": [
                    {"store_id": 700000001, "owner_user_id": 710000001, "store_name": "Datablitz", "barangay": "Pag-asa", "is_active": True},
                ],
                "products": [
                    {"product_id": 3001, "vendor_name": "Datablitz"},
                    {"product_id": 3002, "vendor_name": "Datablitz"},
                    {"product_id": 3003, "vendor_name": "Other Vendor"},
                ],
            }
        )

        service = PlatformService(repo)

        stores = service.list_admin_stores()

        self.assertEqual(len(stores), 1)
        self.assertEqual(stores[0]["product_count"], 2)

    def test_list_admin_products_maps_legacy_products_to_seeded_stores(self):
        repo = FakeRepo(
            {
                "stores": [
                    {"store_id": 700000001, "owner_user_id": 710000001, "store_name": "Datablitz"},
                ],
                "products": [
                    {
                        "product_id": 3001,
                        "name": "Graphics Card",
                        "category": "food",
                        "price": 2266.96,
                        "stock": 197,
                        "vendor_name": "Datablitz",
                        "local_vendor": True,
                    }
                ],
            }
        )

        service = PlatformService(repo)

        products = service.list_admin_products()

        self.assertEqual(len(products), 1)
        self.assertEqual(products[0]["store_id"], 700000001)
        self.assertEqual(products[0]["owner_user_id"], 710000001)
        self.assertEqual(products[0]["source"], "legacy_catalog")


class PlatformServiceVendorFallbackTests(unittest.TestCase):
    def test_list_store_owner_orders_includes_marketplace_orders_for_legacy_products(self):
        repo = FakeRepo(
            {
                "stores": [
                    {
                        "store_id": 700000006,
                        "owner_user_id": 46460273,
                        "store_name": "Datablitz",
                    }
                ],
                "products": [
                    {
                        "product_id": 300000023,
                        "name": "Gaming Mouse",
                        "vendor_name": "Datablitz",
                        "category": "craft",
                    }
                ],
                "buyer_order_items": [
                    {
                        "order_item_id": 3,
                        "order_id": 3,
                        "product_id": 300000023,
                        "name": "Gaming Mouse",
                        "quantity": 1,
                        "unit_price": 2247.76,
                        "line_total": 2247.76,
                        "created_at": "2026-05-15T11:31:38.351182+00:00",
                    }
                ],
                "buyer_orders": [
                    {
                        "order_id": 3,
                        "buyer_user_id": 46460271,
                        "occasion": "Birthday",
                        "recipient_type": "Friend",
                        "total_price": 2297.76,
                        "status": "pending",
                        "created_at": "2026-05-15T11:31:37.9642+00:00",
                    }
                ],
            }
        )

        service = PlatformService(repo)

        orders = service.list_store_owner_orders(46460273)

        self.assertEqual(len(orders), 1)
        self.assertEqual(orders[0]["product_id"], 300000023)
        self.assertEqual(orders[0]["product_name"], "Gaming Mouse")
        self.assertEqual(orders[0]["store_id"], 700000006)
        self.assertEqual(orders[0]["store_name"], "Datablitz")
        self.assertEqual(orders[0]["buyer_user_id"], 46460271)
        self.assertEqual(orders[0]["status"], "pending")


if __name__ == "__main__":
    unittest.main()
