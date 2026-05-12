from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Tuple


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_service_role_key: str
    supabase_publishable_key: str
    app_name: str = "ZIPPO Intelligent Systems API"
    app_version: str = "2.0.0"
    schema_name: str = "zippo"

    @property
    def supabase_configured(self) -> bool:
        return self.supabase_data_configured

    @property
    def supabase_service_role_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)

    @property
    def supabase_data_key(self) -> str:
        return self.supabase_service_role_key or self.supabase_publishable_key

    @property
    def supabase_data_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_data_key)

    @property
    def supabase_auth_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_publishable_key)


BUDGET_BANDS: Dict[str, Tuple[int, int]] = {
    "low": (0, 300),
    "mid": (300, 800),
    "high": (800, 100000),
}


def _parse_env_file(path: Path) -> Dict[str, str]:
    values: Dict[str, str] = {}
    if not path.exists() or not path.is_file():
        return values

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if value and len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        values[key] = value
    return values


def _build_file_env_values() -> Dict[str, str]:
    current_file = Path(__file__).resolve()
    repo_root = current_file.parents[3]
    backend_root = current_file.parents[2]

    # Priority: backend/.env overrides frontend/.env.
    values: Dict[str, str] = {}
    values.update(_parse_env_file(repo_root / "frontend" / ".env"))
    values.update(_parse_env_file(backend_root / ".env"))
    return values


def _pick_env_value(file_values: Dict[str, str], *keys: str) -> str:
    for key in keys:
        env_value = os.environ.get(key)
        if env_value:
            return env_value
    for key in keys:
        file_value = file_values.get(key)
        if file_value:
            return file_value
    return ""


def get_settings() -> Settings:
    file_env_values = _build_file_env_values()
    schema_name = _pick_env_value(file_env_values, "SUPABASE_SCHEMA_NAME", "VITE_SUPABASE_SCHEMA_NAME") or "zippo"

    return Settings(
        supabase_url=_pick_env_value(file_env_values, "SUPABASE_URL", "VITE_SUPABASE_URL"),
        supabase_service_role_key=_pick_env_value(
            file_env_values,
            "SUPABASE_SERVICE_ROLE_KEY",
            "SUPABASE_SECRET_KEY",
            "VITE_SUPABASE_SERVICE_ROLE_KEY",
        ),
        supabase_publishable_key=_pick_env_value(
            file_env_values, "SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY"
        ),
        schema_name=schema_name,
    )
