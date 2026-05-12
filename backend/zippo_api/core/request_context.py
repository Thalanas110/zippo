from __future__ import annotations

from contextvars import ContextVar


_AUTH_BEARER_TOKEN: ContextVar[str | None] = ContextVar("zippo_auth_bearer_token", default=None)


def set_auth_bearer_token(token: str | None) -> None:
    _AUTH_BEARER_TOKEN.set(token)


def get_auth_bearer_token() -> str | None:
    return _AUTH_BEARER_TOKEN.get()
