from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from zippo_api.controllers.routes import build_router
from zippo_api.core.config import get_settings
from zippo_api.core.request_context import set_auth_bearer_token
from zippo_api.repositories.zippo_repository import ZippoRepository
from zippo_api.services.baseline_service import BaselineService
from zippo_api.services.delivery_service import DeliveryService
from zippo_api.services.gift_service import GiftService
from zippo_api.services.auth_service import AuthService
from zippo_api.services.platform_service import PlatformService
from zippo_api.services.recommendation_service import RecommendationService


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("zippo-api")


def create_app() -> FastAPI:
    settings = get_settings()
    if not settings.supabase_data_configured:
        logger.warning("SUPABASE_URL and a data key (service role or publishable) are not configured.")
    elif not settings.supabase_service_role_configured:
        logger.warning(
            "SUPABASE_SERVICE_ROLE_KEY is not configured. Data endpoints will rely on caller bearer tokens and RLS."
        )

    repo = ZippoRepository(settings)

    gift_service = GiftService(repo)
    recommendation_service = RecommendationService(repo)
    delivery_service = DeliveryService(repo)
    baseline_service = BaselineService(repo)
    platform_service = PlatformService(repo)
    auth_service = AuthService(settings)

    app = FastAPI(title=settings.app_name, version=settings.app_version)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def attach_bearer_token(request, call_next):
        raw = request.headers.get("authorization", "")
        token: str | None = None
        if raw.startswith("Bearer "):
            parsed = raw.removeprefix("Bearer ").strip()
            token = parsed or None
        set_auth_bearer_token(token)
        try:
            response = await call_next(request)
            return response
        finally:
            set_auth_bearer_token(None)

    app.include_router(
        build_router(
            gift_service=gift_service,
            recommendation_service=recommendation_service,
            delivery_service=delivery_service,
            baseline_service=baseline_service,
            platform_service=platform_service,
            auth_service=auth_service,
            supabase_configured=settings.supabase_data_configured,
            supabase_auth_configured=settings.supabase_auth_configured,
        )
    )

    return app


app = create_app()
