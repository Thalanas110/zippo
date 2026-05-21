from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional

from fastapi import HTTPException
from supabase import Client, create_client

from zippo_api.core.config import Settings


class ZippoRepository:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._client: Optional[Client] = None
        if settings.supabase_configured:
            self._client = create_client(settings.supabase_url, settings.supabase_data_key)

    @staticmethod
    def _format_error(operation: str, exc: Exception) -> str:
        parts: list[str] = []
        message = getattr(exc, "message", None)
        details = getattr(exc, "details", None)
        hint = getattr(exc, "hint", None)
        code = getattr(exc, "code", None)

        if message:
            parts.append(str(message))
        if details:
            parts.append(str(details))
        if hint:
            parts.append(f"hint={hint}")
        if code:
            parts.append(f"code={code}")

        if not parts:
            parts.append(str(exc))
        return f"{operation} failed: {' | '.join(part for part in parts if part)}"

    def _raise_query_error(self, operation: str, exc: Exception) -> None:
        detail = self._format_error(operation, exc)
        lowered = detail.lower()
        if "permission denied" in lowered or "42501" in lowered:
            if "schema zippo" in lowered:
                detail = (
                    f"{detail}. Apply frontend/supabase/20260508_z_zippo_schema_grants.sql "
                    "in Supabase SQL Editor, then restart the backend."
                )
            raise HTTPException(status_code=403, detail=detail) from exc
        if "42p01" in lowered or "does not exist" in lowered:
            raise HTTPException(status_code=500, detail=detail) from exc
        raise HTTPException(status_code=500, detail=detail) from exc

    def _run(self, operation: str, action):
        try:
            return action()
        except HTTPException:
            raise
        except Exception as exc:
            self._raise_query_error(operation, exc)

    def _schema(self):
        if self._client is None:
            raise HTTPException(status_code=500, detail="Supabase not configured on the server.")
        try:
            return self._client.schema(self.settings.schema_name)
        except Exception as exc:
            self._raise_query_error("select schema", exc)

    def fetch_products(self, limit: int = 2000) -> List[Dict[str, Any]]:
        res = self._run(
            "fetch products",
            lambda: self._schema().table("products").select("*").limit(limit).execute(),
        )
        return res.data or []

    def fetch_marketplace_products(self, limit: int = 2000) -> List[Dict[str, Any]]:
        try:
            res = self._schema().table("marketplace_products").select("*").limit(limit).execute()
            return res.data or []
        except Exception:
            return []

    def fetch_riders(self, limit: int = 500) -> List[Dict[str, Any]]:
        res = self._run(
            "fetch riders",
            lambda: self._schema().table("riders").select("*").limit(limit).execute(),
        )
        return res.data or []

    def fetch_orders(self, limit: int = 500) -> List[Dict[str, Any]]:
        res = self._run(
            "fetch orders",
            lambda: self._schema().table("orders").select("*").limit(limit).execute(),
        )
        return res.data or []

    def fetch_orders_for_user(self, user_id: int, limit: int = 200) -> List[Dict[str, Any]]:
        res = self._run(
            "fetch orders for user",
            lambda: self._schema().table("orders").select("*").eq("user_id", user_id).limit(limit).execute(),
        )
        return res.data or []

    def fetch_order_by_id(self, order_id: int) -> Optional[Dict[str, Any]]:
        res = self._run(
            "fetch order by id",
            lambda: self._schema().table("orders").select("*").eq("order_id", order_id).maybe_single().execute(),
        )
        return res.data

    def insert_one(self, table: str, payload: Dict[str, Any]) -> Optional[int | str]:
        res = self._run(
            f"insert into {table}",
            lambda: self._schema().table(table).insert(payload).execute(),
        )
        row = (res.data or [{}])[0]
        return (
            row.get("id")
            or row.get("run_id")
            or row.get("order_id")
            or row.get("product_id")
            or row.get("store_id")
            or row.get("task_id")
            or row.get("report_id")
            or row.get("application_id")
        )

    def insert_many(self, table: str, payload: List[Dict[str, Any]]) -> None:
        if payload:
            self._run(
                f"insert many into {table}",
                lambda: self._schema().table(table).insert(payload).execute(),
            )

    def upsert_one(self, table: str, payload: Dict[str, Any], on_conflict: str) -> Optional[int | str]:
        res = self._run(
            f"upsert into {table}",
            lambda: self._schema().table(table).upsert(payload, on_conflict=on_conflict).execute(),
        )
        row = (res.data or [{}])[0]
        return row.get("id") or row.get("profile_id") or row.get("user_id")

    def update_by_id(self, table: str, id_column: str, id_value: int | str, payload: Dict[str, Any]) -> bool:
        self._run(
            f"update {table}",
            lambda: self._schema().table(table).update(payload).eq(id_column, id_value).execute(),
        )
        return True

    def delete_by_id(self, table: str, id_column: str, id_value: int | str) -> bool:
        self._run(
            f"delete from {table}",
            lambda: self._schema().table(table).delete().eq(id_column, id_value).execute(),
        )
        return True

    def fetch_table(
        self,
        table: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 200,
        order_by: Optional[str] = None,
        ascending: bool = False,
    ) -> List[Dict[str, Any]]:
        query = self._schema().table(table).select("*").limit(limit)
        for key, value in (filters or {}).items():
            if value is None:
                continue
            if isinstance(value, Iterable) and not isinstance(value, (str, bytes, dict)):
                values = list(value)
                if values:
                    query = query.in_(key, values)
                continue
            query = query.eq(key, value)
        if order_by:
            query = query.order(order_by, desc=not ascending)
        res = self._run(f"fetch table {table}", query.execute)
        return res.data or []
