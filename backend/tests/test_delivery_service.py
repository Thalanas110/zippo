import importlib.util
import sys
import types
import unittest
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
DELIVERY_SERVICE_PATH = BACKEND_ROOT / "zippo_api" / "services" / "delivery_service.py"


def load_delivery_service_module():
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

    schemas_module = types.ModuleType("zippo_api.models.schemas")

    class DeliveryOptimizeRequest:
        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)

    schemas_module.DeliveryOptimizeRequest = DeliveryOptimizeRequest
    sys.modules["zippo_api.models.schemas"] = schemas_module

    repository_module = types.ModuleType("zippo_api.repositories.zippo_repository")
    repository_module.ZippoRepository = object
    sys.modules["zippo_api.repositories.zippo_repository"] = repository_module

    optimizer_module = types.ModuleType("old.delivery_optimizer")
    optimizer_module.optimize_delivery = lambda *_args, **_kwargs: {"assignments": []}
    sys.modules["old.delivery_optimizer"] = optimizer_module
    sys.modules["backend.old.delivery_optimizer"] = optimizer_module

    spec = importlib.util.spec_from_file_location("delivery_service_under_test", DELIVERY_SERVICE_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


delivery_module = load_delivery_service_module()
DeliveryService = delivery_module.DeliveryService


class FakeRepo:
    def __init__(self):
        self.inserted_one = []
        self.inserted_many = []

    def fetch_order_by_id(self, order_id):
        return None

    def fetch_riders(self):
        return [
            {
                "rider_id": 600000014,
                "rider_name": "Rider RID014",
                "current_lat": 14.81,
                "current_lng": 120.3,
                "capacity": 3,
                "speed_kmph": 22.0,
                "average_rating": None,
                "available": True,
            }
        ]

    def insert_one(self, table, payload):
        self.inserted_one.append((table, payload))
        if table == "delivery_optimizer_runs":
            return 99
        if table == "delivery_assignments":
            return 199
        return 1

    def insert_many(self, table, payload):
        self.inserted_many.append((table, payload))


class DeliveryServiceTests(unittest.TestCase):
    def test_optimize_normalizes_legacy_riders_before_assignment(self):
        captured = {}

        def fake_optimize_delivery(orders, riders):
            captured["orders"] = orders
            captured["riders"] = riders
            return {
                "assignments": [
                    {
                        "rider_id": riders[0]["id"],
                        "rider_name": riders[0]["name"],
                        "route_steps": [
                            {"action": "pickup", "lat": 14.8386, "lng": 120.2842},
                            {"action": "dropoff", "lat": 14.8386, "lng": 120.2842},
                        ],
                        "total_distance_km": 1.1,
                        "estimated_total_minutes": 9.5,
                        "method": "astar_delivery_optimizer",
                    }
                ]
            }

        delivery_module.do.optimize_delivery = fake_optimize_delivery
        repo = FakeRepo()
        service = DeliveryService(repo)
        req = types.SimpleNamespace(
            order_id=123456,
            time_slot="Morning",
            barangay="Barangay 5",
            lat=14.8386,
            lng=120.2842,
        )

        result = service.optimize(req)

        self.assertEqual(captured["riders"][0]["id"], 600000014)
        self.assertEqual(captured["riders"][0]["name"], "Rider RID014")
        self.assertEqual(captured["riders"][0]["average_rating"], 4.8)
        self.assertEqual(result["rider_id"], 600000014)
        self.assertEqual(result["rider_name"], "Rider RID014")
        self.assertEqual(result["status"], "assigned")


if __name__ == "__main__":
    unittest.main()
