from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class GiftFilterRequest(BaseModel):
    occasion: str
    recipient_type: str
    budget_range: Literal["low", "mid", "high"]
    prefer_local: bool = True
    user_id: Optional[int] = None


class CBFRequest(BaseModel):
    user_id: int
    occasion: Optional[str] = None
    recipient_type: Optional[str] = None
    top_k: int = 10


class DeliveryOptimizeRequest(BaseModel):
    order_id: int
    time_slot: Literal["Morning", "PM", "Eve"]
    barangay: str
    lat: float
    lng: float


class BaselineRequestModel(BaseModel):
    scenario_type: Literal["gift_filter", "delivery_assignment"]
    payload: Dict[str, Any] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    ok: bool
    service: str
    supabase_configured: bool


class AuthSession(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: Optional[str] = None
    expires_in: Optional[int] = None
    expires_at: Optional[int] = None


class AuthUser(BaseModel):
    id: str
    email: Optional[str] = None
    app_metadata: Dict[str, Any] = Field(default_factory=dict)
    user_metadata: Dict[str, Any] = Field(default_factory=dict)


class AuthSignInRequest(BaseModel):
    email: str
    password: str


class AuthSignUpRequest(BaseModel):
    email: str
    password: str
    role: Literal["buyer", "store_owner", "driver", "admin"] = "buyer"


class AuthSignInResponse(BaseModel):
    user: AuthUser
    session: AuthSession


class AuthSignUpResponse(BaseModel):
    user: Optional[AuthUser] = None
    session: Optional[AuthSession] = None
    email_confirmation_required: bool = False


class AuthSignOutResponse(BaseModel):
    signed_out: bool = True


class AuthProfileUpdateRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    barangay: Optional[str] = None
    address_line: Optional[str] = None


class GenericRunResponse(BaseModel):
    run_id: Optional[int | str] = None


class GiftFilterResponse(GenericRunResponse):
    results: List[Dict[str, Any]]


class RecommendationResponse(GenericRunResponse):
    results: List[Dict[str, Any]]


class DeliveryResponse(GenericRunResponse):
    rider_id: int | str
    rider_name: Optional[str] = None
    distance_km: Optional[float] = None
    estimated_minutes: Optional[float] = None
    score: Optional[float] = None
    reason: Optional[str] = None
    method: Optional[str] = None
    status: str = "assigned"
    stops: List[Dict[str, Any]] = Field(default_factory=list)
    path: List[Dict[str, float]] = Field(default_factory=list)


class BaselineResponse(GenericRunResponse):
    baseline: Any
    intelligent: Any
    comparison: Dict[str, Any]


class CatalogSearchRequest(BaseModel):
    search: Optional[str] = None
    occasion: Optional[str] = None
    recipient_type: Optional[str] = None
    budget_range: Optional[Literal["low", "mid", "high"]] = None
    prefer_local: bool = True
    user_id: Optional[int] = None
    top_k: int = 20


class CatalogResponse(GenericRunResponse):
    role: Literal["guest", "buyer"] = "guest"
    results: List[Dict[str, Any]]


class BuyerProfileRequest(BaseModel):
    user_id: int
    role: Literal["buyer", "store_owner", "driver", "admin"] = "buyer"
    full_name: str
    email: str
    phone: Optional[str] = None
    barangay: Optional[str] = None
    address_line: Optional[str] = None


class BuyerProfileLookupResponse(BaseModel):
    user_id: int
    exists: bool = False
    role: Optional[Literal["buyer", "store_owner", "driver", "admin"]] = None
    onboarding_completed: bool = False
    profile: Dict[str, Any] = Field(default_factory=dict)


class BuyerOrderItem(BaseModel):
    product_id: int | str
    quantity: int = Field(default=1, ge=1)


class BuyerOrderRequest(BaseModel):
    buyer_user_id: int
    occasion: str
    recipient_type: str
    notes: Optional[str] = None
    items: List[BuyerOrderItem] = Field(default_factory=list)
    gift_pack: Dict[str, Any] = Field(default_factory=dict)
    delivery: Dict[str, Any] = Field(default_factory=dict)


class BuyerOrderResponse(GenericRunResponse):
    order_id: int | str
    status: str
    subtotal: float
    gift_pack_fee: float
    delivery_fee: float
    total_price: float
    recommendations: List[Dict[str, Any]] = Field(default_factory=list)


class FraudReportRequest(BaseModel):
    reporter_user_id: int
    accused_role: Literal["buyer", "store_owner", "driver"]
    accused_user_id: Optional[int] = None
    accused_store_id: Optional[int | str] = None
    reason: str
    details: Optional[str] = None
    evidence_url: Optional[str] = None


class FraudReportResponse(GenericRunResponse):
    report_id: int | str
    status: str


class StoreOwnerApplicationRequest(BaseModel):
    applicant_user_id: int
    full_name: str
    email: str
    contact_no: str
    bir_tin: str = Field(min_length=9, max_length=15)
    dti_registration_no: str
    business_name: str
    business_address: str
    barangay: str
    documents: Dict[str, str] = Field(default_factory=dict)


class StoreOwnerApplicationResponse(GenericRunResponse):
    application_id: int | str
    status: str


class StorePayload(BaseModel):
    owner_user_id: int
    store_name: str
    description: Optional[str] = None
    barangay: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_active: bool = True


class StoreProductPayload(BaseModel):
    owner_user_id: int
    store_id: int | str
    name: str
    description: Optional[str] = None
    category: str = "gift"
    price: float = Field(ge=0)
    stock: int = Field(default=0, ge=0)
    occasion_tags: List[str] = Field(default_factory=list)
    recipient_tags: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    local_vendor: bool = True


class DriverTaskStatusRequest(BaseModel):
    status: Literal["assigned", "picked_up", "in_transit", "delivered", "failed", "cancelled"]
    note: Optional[str] = None


class DriverTaskResponse(BaseModel):
    tasks: List[Dict[str, Any]] = Field(default_factory=list)


class AdminDashboardResponse(BaseModel):
    metrics: Dict[str, Any]
    charts: Dict[str, Any]
    pending_reports: List[Dict[str, Any]] = Field(default_factory=list)


class ModerationActionRequest(BaseModel):
    status: Literal["pending", "reviewing", "resolved", "dismissed"]
    action_taken: str


class StoreOwnerApplicationModerationRequest(BaseModel):
    status: Literal["pending_review", "approved", "rejected"]
    action_taken: Optional[str] = None
