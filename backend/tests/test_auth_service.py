import importlib.util
import sys
import types
import unittest
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
AUTH_SERVICE_PATH = BACKEND_ROOT / "zippo_api" / "services" / "auth_service.py"


def load_auth_service():
    fastapi_module = types.ModuleType("fastapi")

    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str):
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail

    fastapi_module.HTTPException = HTTPException
    sys.modules["fastapi"] = fastapi_module

    config_module = types.ModuleType("zippo_api.core.config")

    class Settings:
        def __init__(
            self,
            supabase_url: str,
            supabase_service_role_key: str,
            supabase_publishable_key: str,
            frontend_app_url: str = "http://127.0.0.1:5173/login",
        ):
            self.supabase_url = supabase_url
            self.supabase_service_role_key = supabase_service_role_key
            self.supabase_publishable_key = supabase_publishable_key
            self.frontend_app_url = frontend_app_url

        @property
        def supabase_auth_configured(self) -> bool:
            return bool(self.supabase_url and self.supabase_publishable_key)

    config_module.Settings = Settings
    sys.modules["zippo_api.core.config"] = config_module

    spec = importlib.util.spec_from_file_location("auth_service_under_test", AUTH_SERVICE_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module.AuthService, HTTPException, Settings


AuthService, HTTPException, Settings = load_auth_service()


class AuthServiceConfigurationTests(unittest.TestCase):
    def test_sign_up_raises_clear_error_when_supabase_auth_is_not_configured(self):
        settings = Settings(
            supabase_url="",
            supabase_service_role_key="",
            supabase_publishable_key="",
        )
        service = AuthService(settings)

        with self.assertRaises(HTTPException) as ctx:
            service.sign_up("test@example.com", "password123", "buyer")

        self.assertEqual(ctx.exception.status_code, 500)
        self.assertIn("Supabase Auth is not configured", ctx.exception.detail)


if __name__ == "__main__":
    unittest.main()
