from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException

from zippo_api.models.schemas import (
    AdminDashboardResponse,
    AuthPasswordRecoveryRequest,
    AuthPasswordRecoveryResponse,
    AuthSignInRequest,
    AuthSignInResponse,
    AuthSignOutResponse,
    AuthProfileUpdateRequest,
    AuthSignUpRequest,
    AuthSignUpResponse,
    AuthUser,
    BaselineRequestModel,
    BaselineResponse,
    BuyerOrderRequest,
    BuyerOrderResponse,
    BuyerProfileLookupResponse,
    BuyerProfileRequest,
    CatalogResponse,
    CatalogSearchRequest,
    CBFRequest,
    DeliveryOptimizeRequest,
    DeliveryResponse,
    DriverTaskResponse,
    DriverTaskStatusRequest,
    FraudReportRequest,
    FraudReportResponse,
    GiftFilterRequest,
    GiftFilterResponse,
    HealthResponse,
    ModerationActionRequest,
    RecommendationResponse,
    StoreOwnerApplicationModerationRequest,
    StoreOwnerApplicationRequest,
    StoreOwnerApplicationResponse,
    StorePayload,
    StoreProductPayload,
)
from zippo_api.services.baseline_service import BaselineService
from zippo_api.services.delivery_service import DeliveryService
from zippo_api.services.gift_service import GiftService
from zippo_api.services.auth_service import AuthService
from zippo_api.services.platform_service import PlatformService
from zippo_api.services.recommendation_service import RecommendationService


def build_router(
    gift_service: GiftService,
    recommendation_service: RecommendationService,
    delivery_service: DeliveryService,
    baseline_service: BaselineService,
    platform_service: PlatformService,
    auth_service: AuthService,
    supabase_configured: bool,
    supabase_auth_configured: bool,
) -> APIRouter:
    router = APIRouter()

    def _require_bearer_token(authorization: str | None) -> str:
        if not authorization:
            raise HTTPException(status_code=401, detail="Missing Authorization header.")
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Authorization header must use Bearer token.")
        token = authorization.removeprefix("Bearer ").strip()
        if not token:
            raise HTTPException(status_code=401, detail="Bearer token is empty.")
        return token

    @router.get("/health", response_model=HealthResponse)
    def health() -> HealthResponse:
        return HealthResponse(
            ok=True,
            service="zippo-fastapi",
            supabase_configured=supabase_configured,
            supabase_auth_configured=supabase_auth_configured,
        )

    @router.post("/api/auth/signin", response_model=AuthSignInResponse)
    def auth_signin(req: AuthSignInRequest) -> AuthSignInResponse:
        return AuthSignInResponse(**auth_service.sign_in(req.email, req.password))

    @router.post("/api/auth/signup", response_model=AuthSignUpResponse)
    def auth_signup(req: AuthSignUpRequest) -> AuthSignUpResponse:
        return AuthSignUpResponse(**auth_service.sign_up(req.email, req.password, req.role))

    @router.post("/api/auth/recover", response_model=AuthPasswordRecoveryResponse)
    def auth_recover(req: AuthPasswordRecoveryRequest) -> AuthPasswordRecoveryResponse:
        return AuthPasswordRecoveryResponse(**auth_service.request_password_recovery(req.email))

    @router.get("/api/auth/session", response_model=AuthUser)
    def auth_session(authorization: str | None = Header(default=None)) -> AuthUser:
        token = _require_bearer_token(authorization)
        return AuthUser(**auth_service.get_user(token))

    @router.post("/api/auth/signout", response_model=AuthSignOutResponse)
    def auth_signout(authorization: str | None = Header(default=None)) -> AuthSignOutResponse:
        token = _require_bearer_token(authorization)
        return AuthSignOutResponse(**auth_service.sign_out(token))

    @router.patch("/api/auth/profile", response_model=AuthUser)
    def auth_update_profile(
        req: AuthProfileUpdateRequest,
        authorization: str | None = Header(default=None),
    ) -> AuthUser:
        token = _require_bearer_token(authorization)
        user = auth_service.update_user(
            token,
            email=req.email,
            password=req.password,
            full_name=req.full_name,
            phone=req.phone,
            barangay=req.barangay,
            address_line=req.address_line,
        )
        return AuthUser(**user)

    @router.post("/api/gift-intelligence/filter", response_model=GiftFilterResponse)
    def gift_filter(req: GiftFilterRequest) -> GiftFilterResponse:
        return GiftFilterResponse(**gift_service.filter(req))

    @router.post("/api/recommendations/cbf", response_model=RecommendationResponse)
    def cbf(req: CBFRequest) -> RecommendationResponse:
        return RecommendationResponse(**recommendation_service.recommend(req))

    @router.post("/api/delivery/optimize", response_model=DeliveryResponse)
    def delivery_optimize(req: DeliveryOptimizeRequest) -> DeliveryResponse:
        return DeliveryResponse(**delivery_service.optimize(req))

    @router.post("/api/baseline/run", response_model=BaselineResponse)
    def baseline_run(req: BaselineRequestModel) -> BaselineResponse:
        return BaselineResponse(**baseline_service.run(req))

    @router.post("/api/catalog/search", response_model=CatalogResponse)
    def catalog_search(req: CatalogSearchRequest) -> CatalogResponse:
        return platform_service.search_catalog(req)

    @router.post("/api/buyer/profile")
    def upsert_buyer_profile(req: BuyerProfileRequest) -> dict:
        return platform_service.upsert_buyer_profile(req)

    @router.get("/api/buyer/profile/{user_id}", response_model=BuyerProfileLookupResponse)
    def get_buyer_profile(user_id: int) -> BuyerProfileLookupResponse:
        return platform_service.get_buyer_profile(user_id)

    @router.delete("/api/buyer/profile/{user_id}")
    def delete_buyer_profile(user_id: int) -> dict:
        return platform_service.delete_buyer_profile(user_id)

    @router.post("/api/buyer/orders", response_model=BuyerOrderResponse)
    def create_buyer_order(req: BuyerOrderRequest) -> BuyerOrderResponse:
        return platform_service.create_buyer_order(req)

    @router.get("/api/buyer/{buyer_user_id}/orders")
    def list_buyer_orders(buyer_user_id: int) -> list[dict]:
        return platform_service.list_buyer_orders(buyer_user_id)

    @router.post("/api/reports/fraud", response_model=FraudReportResponse)
    def submit_fraud_report(req: FraudReportRequest) -> FraudReportResponse:
        return platform_service.submit_fraud_report(req)

    @router.post("/api/store-owner/apply", response_model=StoreOwnerApplicationResponse)
    def submit_store_owner_application(req: StoreOwnerApplicationRequest) -> StoreOwnerApplicationResponse:
        return platform_service.submit_store_owner_application(req)

    @router.post("/api/store-owner/stores")
    def create_store(req: StorePayload) -> dict:
        return platform_service.create_store(req)

    @router.put("/api/store-owner/stores/{store_id}")
    def update_store(store_id: int, req: StorePayload) -> dict:
        return platform_service.update_store(store_id, req)

    @router.delete("/api/store-owner/stores/{store_id}")
    def delete_store(store_id: int) -> dict:
        return platform_service.delete_store(store_id)

    @router.post("/api/store-owner/products")
    def create_store_product(req: StoreProductPayload) -> dict:
        return platform_service.create_store_product(req)

    @router.put("/api/store-owner/products/{product_id}")
    def update_store_product(product_id: int, req: StoreProductPayload) -> dict:
        return platform_service.update_store_product(product_id, req)

    @router.delete("/api/store-owner/products/{product_id}")
    def delete_store_product(product_id: int) -> dict:
        return platform_service.delete_store_product(product_id)

    @router.get("/api/store-owner/{owner_user_id}/orders")
    def list_store_owner_orders(owner_user_id: int) -> list[dict]:
        return platform_service.list_store_owner_orders(owner_user_id)

    @router.get("/api/driver/{driver_user_id}/tasks", response_model=DriverTaskResponse)
    def list_driver_tasks(driver_user_id: int) -> DriverTaskResponse:
        return platform_service.list_driver_tasks(driver_user_id)

    @router.patch("/api/driver/tasks/{task_id}")
    def update_driver_task(task_id: int, req: DriverTaskStatusRequest) -> dict:
        return platform_service.update_driver_task_status(task_id, req)

    @router.get("/api/admin/dashboard", response_model=AdminDashboardResponse)
    def admin_dashboard() -> AdminDashboardResponse:
        return platform_service.admin_dashboard()

    @router.get("/api/admin/reports")
    def admin_reports() -> list[dict]:
        return platform_service.list_reports()

    @router.patch("/api/admin/reports/{report_id}")
    def moderate_report(report_id: int, req: ModerationActionRequest) -> dict:
        return platform_service.moderate_report(report_id, req)

    @router.get("/api/admin/stores")
    def admin_stores() -> list[dict]:
        return platform_service.list_admin_stores()

    @router.get("/api/admin/users")
    def admin_users() -> list[dict]:
        return platform_service.list_admin_users()

    @router.get("/api/admin/products")
    def admin_products() -> list[dict]:
        return platform_service.list_admin_products()

    @router.get("/api/admin/store-owner-applications")
    def admin_store_owner_applications() -> list[dict]:
        return platform_service.list_store_owner_applications()

    @router.patch("/api/admin/store-owner-applications/{application_id}")
    def moderate_store_owner_application(
        application_id: int,
        req: StoreOwnerApplicationModerationRequest,
    ) -> dict:
        return platform_service.moderate_store_owner_application(application_id, req)

    return router
