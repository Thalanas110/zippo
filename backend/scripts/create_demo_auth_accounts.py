from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any
from urllib.error import HTTPError
from urllib.request import Request, urlopen


def env_value(name: str, default: str = "") -> str:
    value = os.environ.get(name, default).strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if key in os.environ:
            continue
        os.environ[key] = env_value(key, value.strip())


def auth_admin_request(
    base_url: str,
    service_role_key: str,
    method: str,
    path: str,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    url = f"{base_url.rstrip('/')}/auth/v1{path}"
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
    }
    request = Request(url=url, headers=headers, data=body, method=method)
    try:
        with urlopen(request, timeout=30) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except HTTPError as exc:
        raw = exc.read().decode("utf-8")
        details = raw.strip() or exc.reason
        raise RuntimeError(f"{method} {path} failed: {details}") from exc


def data_request(
    base_url: str,
    service_role_key: str,
    method: str,
    path: str,
    payload: dict[str, Any] | None = None,
) -> list[dict[str, Any]] | dict[str, Any]:
    url = f"{base_url.rstrip('/')}/rest/v1/{path}"
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
    }
    request = Request(url=url, headers=headers, data=body, method=method)
    with urlopen(request, timeout=30) as response:
        raw = response.read().decode("utf-8")
        return json.loads(raw) if raw else {}


def numeric_user_id_from_uuid(user_id: str) -> int:
    cleaned = user_id.replace("-", "")
    first_twelve = cleaned[:12]
    return (int(first_twelve, 16) % 1_000_000_000) + 1


def create_user(base_url: str, service_role_key: str, email: str, password: str, role: str, full_name: str) -> dict[str, Any]:
    payload = {
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {
            "role": role,
            "full_name": full_name,
        },
        "app_metadata": {
            "role": role,
        },
    }
    return auth_admin_request(base_url, service_role_key, "POST", "/admin/users", payload)


def patch_store_owner(
    base_url: str,
    service_role_key: str,
    store_id: int,
    owner_user_id: int,
) -> None:
    path = f"stores?store_id=eq.{store_id}"
    data_request(
        base_url,
        service_role_key,
        "PATCH",
        path,
        {"owner_user_id": owner_user_id},
    )


def main() -> int:
    backend_root = Path(__file__).resolve().parents[1]
    load_env_file(backend_root / ".env")

    supabase_url = env_value("SUPABASE_URL", env_value("VITE_SUPABASE_URL"))
    service_role_key = env_value("SUPABASE_SERVICE_ROLE_KEY", env_value("VITE_SUPABASE_SERVICE_ROLE_KEY"))
    if not supabase_url or not service_role_key:
        raise SystemExit("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")

    password = "ZippoDemo!2026"
    accounts = [
        ("demo-buyer-20260514@zippo.local", "buyer", "ZIPPO Demo Buyer"),
        ("demo-vendor-20260514@zippo.local", "store_owner", "ZIPPO Demo Vendor"),
        ("demo-admin-20260514@zippo.local", "admin", "ZIPPO Demo Admin"),
    ]

    created: list[tuple[str, str, str, int]] = []
    for email, role, full_name in accounts:
        user = create_user(supabase_url, service_role_key, email, password, role, full_name)
        auth_user_id = str(user["id"])
        numeric_user_id = numeric_user_id_from_uuid(auth_user_id)
        created.append((email, role, auth_user_id, numeric_user_id))

    vendor_numeric_id = next(numeric for email, role, _, numeric in created if role == "store_owner")
    patch_store_owner(supabase_url, service_role_key, 700000006, vendor_numeric_id)

    print(json.dumps(
        {
            "password": password,
            "accounts": [
                {
                    "email": email,
                    "role": role,
                    "auth_user_id": auth_user_id,
                    "numeric_user_id": numeric_user_id,
                }
                for email, role, auth_user_id, numeric_user_id in created
            ],
            "vendor_store_id": 700000006,
            "vendor_store_name": "Datablitz",
        },
        indent=2,
    ))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
