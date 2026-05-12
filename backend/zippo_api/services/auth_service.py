from __future__ import annotations

import json
from typing import Any, Dict, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException

from zippo_api.core.config import Settings


class AuthService:
    def __init__(self, settings: Settings):
        self.settings = settings

    def _ensure_configured(self) -> None:
        if not self.settings.supabase_auth_configured:
            raise HTTPException(
                status_code=500,
                detail="Supabase Auth is not configured on the server. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.",
            )

    def _auth_url(self, path: str) -> str:
        base = self.settings.supabase_url.rstrip("/")
        safe_path = path if path.startswith("/") else f"/{path}"
        return f"{base}/auth/v1{safe_path}"

    @staticmethod
    def _parse_json(text: str) -> Dict[str, Any]:
        if not text:
            return {}
        try:
            payload = json.loads(text)
        except json.JSONDecodeError:
            return {}
        return payload if isinstance(payload, dict) else {}

    @staticmethod
    def _extract_error_message(raw_body: str, fallback: str) -> str:
        payload = AuthService._parse_json(raw_body)
        return (
            str(
                payload.get("error_description")
                or payload.get("msg")
                or payload.get("message")
                or payload.get("error")
                or fallback
            )
            if payload
            else fallback
        )

    def _call_auth(
        self,
        method: str,
        path: str,
        payload: Optional[Dict[str, Any]] = None,
        access_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        self._ensure_configured()
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        headers: Dict[str, str] = {
            "apikey": self.settings.supabase_publishable_key,
        }
        if body is not None:
            headers["Content-Type"] = "application/json"
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"

        request = Request(url=self._auth_url(path), data=body, headers=headers, method=method)
        try:
            with urlopen(request, timeout=20) as response:
                raw = response.read().decode("utf-8")
                return self._parse_json(raw)
        except HTTPError as exc:
            raw_error = exc.read().decode("utf-8")
            detail = self._extract_error_message(raw_error, "Supabase auth request failed.")
            raise HTTPException(status_code=exc.code, detail=detail) from exc
        except URLError as exc:
            raise HTTPException(status_code=502, detail="Unable to reach Supabase auth service.") from exc

    @staticmethod
    def _build_user(raw_user: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not raw_user:
            return None
        user_id = raw_user.get("id")
        if not user_id:
            return None
        app_metadata = raw_user.get("app_metadata")
        user_metadata = raw_user.get("user_metadata")
        return {
            "id": str(user_id),
            "email": raw_user.get("email"),
            "app_metadata": app_metadata if isinstance(app_metadata, dict) else {},
            "user_metadata": user_metadata if isinstance(user_metadata, dict) else {},
        }

    @staticmethod
    def _build_session(raw_payload: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not raw_payload:
            return None
        access_token = raw_payload.get("access_token")
        if not access_token:
            return None
        return {
            "access_token": str(access_token),
            "refresh_token": raw_payload.get("refresh_token"),
            "token_type": raw_payload.get("token_type"),
            "expires_in": raw_payload.get("expires_in"),
            "expires_at": raw_payload.get("expires_at"),
        }

    def sign_in(self, email: str, password: str) -> Dict[str, Any]:
        raw = self._call_auth(
            method="POST",
            path="/token?grant_type=password",
            payload={"email": email, "password": password},
        )
        user = self._build_user(raw.get("user"))
        session = self._build_session(raw)
        if not user or not session:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        return {
            "user": user,
            "session": session,
        }

    def sign_up(self, email: str, password: str, role: str) -> Dict[str, Any]:
        raw = self._call_auth(
            method="POST",
            path="/signup",
            payload={
                "email": email,
                "password": password,
                "data": {"role": role},
            },
        )
        raw_session = raw.get("session")
        session_source = raw_session if isinstance(raw_session, dict) else raw
        session = self._build_session(session_source)
        user_source = raw.get("user")
        if not isinstance(user_source, dict) and isinstance(raw_session, dict):
            nested_user = raw_session.get("user")
            user_source = nested_user if isinstance(nested_user, dict) else None
        user = self._build_user(user_source if isinstance(user_source, dict) else None)
        return {
            "user": user,
            "session": session,
            "email_confirmation_required": session is None,
        }

    def get_user(self, access_token: str) -> Dict[str, Any]:
        raw = self._call_auth(method="GET", path="/user", access_token=access_token)
        user = self._build_user(raw)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired auth token.")
        return user

    def sign_out(self, access_token: str) -> Dict[str, Any]:
        self._call_auth(method="POST", path="/logout?scope=local", access_token=access_token)
        return {"signed_out": True}

    def update_user(
        self,
        access_token: str,
        *,
        email: Optional[str] = None,
        password: Optional[str] = None,
        full_name: Optional[str] = None,
        phone: Optional[str] = None,
        barangay: Optional[str] = None,
        address_line: Optional[str] = None,
    ) -> Dict[str, Any]:
        data: Dict[str, Any] = {}
        if full_name is not None:
            data["full_name"] = full_name
        if phone is not None:
            data["phone"] = phone
        if barangay is not None:
            data["barangay"] = barangay
        if address_line is not None:
            data["address_line"] = address_line

        payload: Dict[str, Any] = {}
        if email is not None:
            payload["email"] = email
        if password is not None:
            payload["password"] = password
        if data:
            payload["data"] = data

        if not payload:
            raise HTTPException(status_code=400, detail="No profile fields were provided.")

        raw = self._call_auth(
            method="PUT",
            path="/user",
            payload=payload,
            access_token=access_token,
        )
        user = self._build_user(raw)
        if not user:
            raise HTTPException(status_code=500, detail="Profile was updated but user response is invalid.")
        return user
