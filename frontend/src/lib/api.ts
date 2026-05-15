const BASE =
  (import.meta.env.VITE_PYTHON_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const AUTH_STORAGE_KEY = "zippo.auth.session";

class PublicApiError extends Error {
  status: number;
  path: string;

  constructor(path: string, status: number, message: string) {
    super(message);
    this.name = "PublicApiError";
    this.path = path;
    this.status = status;
  }
}

function parseErrorDetail(rawText: string): string | null {
  if (!rawText) return null;
  try {
    const parsed = JSON.parse(rawText) as {
      detail?: unknown;
      message?: unknown;
      error?: unknown;
    };
    const candidate = parsed.detail ?? parsed.message ?? parsed.error;
    return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
  } catch {
    return null;
  }
}

function getPublicErrorMessage(path: string, status: number, detail?: string | null): string {
  if (detail) {
    return detail;
  }
  if (path === "/api/auth/signin" && (status === 400 || status === 401)) {
    return "Invalid email or password.";
  }
  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  if (status === 403) {
    return "You do not have permission to perform this action.";
  }
  if (status === 404) {
    return "Requested data was not found.";
  }
  if (status >= 500) {
    return "Server error. Please try again in a moment.";
  }
  return "Request failed. Please try again.";
}

function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      session?: { access_token?: string | null };
    };
    const token = parsed.session?.access_token;
    return token ? String(token) : null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BASE) {
    throw new Error(
      "VITE_PYTHON_API_BASE_URL is not set. Configure it to point to your FastAPI backend.",
    );
  }

  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Authorization")) {
    const token = getStoredAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const rawError = await res.text();
    const detail = parseErrorDetail(rawError);
    throw new PublicApiError(path, res.status, getPublicErrorMessage(path, res.status, detail));
  }
  if (res.status === 204) {
    return {} as T;
  }
  return (await res.json()) as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

async function put<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

async function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

async function del<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

export type AuthRole = "buyer" | "store_owner" | "driver" | "admin";

export interface AuthApiUser {
  id: string;
  email?: string | null;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}

export interface AuthApiSession {
  access_token: string;
  refresh_token?: string | null;
  token_type?: string | null;
  expires_in?: number | null;
  expires_at?: number | null;
}

export interface AuthSignInRequest {
  email: string;
  password: string;
}

export interface AuthSignUpRequest {
  email: string;
  password: string;
  role: AuthRole;
}

export interface AuthPasswordRecoveryRequest {
  email: string;
}

export interface AuthSignInResponse {
  user: AuthApiUser;
  session: AuthApiSession;
}

export interface AuthSignUpResponse {
  user?: AuthApiUser | null;
  session?: AuthApiSession | null;
  email_confirmation_required: boolean;
}

export interface AuthPasswordRecoveryResponse {
  recovery_requested: boolean;
}

export interface AuthProfileUpdateRequest {
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
  barangay?: string;
  address_line?: string;
}

export interface HealthResponse {
  ok: boolean;
  service: string;
  supabase_configured: boolean;
  supabase_auth_configured: boolean;
}

export type BudgetRange = "low" | "mid" | "high";
export type TimeSlot = "Morning" | "PM" | "Eve";

export interface RankedProduct {
  id: number | string;
  product_id?: number | string;
  source_id?: number | string;
  name: string;
  category?: string;
  price?: number;
  vendor_name?: string;
  vendor_id?: number | string;
  local?: boolean;
  rating?: number;
  stock?: number;
  score?: number;
  explanation?: string;
  image_url?: string;
  store_name?: string;
  tags?: string[];
  occasion_tags?: string[];
  recipient_tags?: string[];
  popularity?: number;
}

export interface GiftFilterRequest {
  occasion: string;
  recipient_type: string;
  budget_range: BudgetRange;
  prefer_local: boolean;
  user_id: number | null;
}

export interface GiftFilterResponse {
  run_id?: number | string;
  results: RankedProduct[];
}

export interface CBFRequest {
  user_id: number;
  occasion: string | null;
  recipient_type: string | null;
  top_k: number;
}

export interface CBFResponse {
  run_id?: number | string;
  results: RankedProduct[];
}

export interface DeliveryOptimizeRequest {
  order_id: number;
  time_slot: TimeSlot;
  barangay: string;
  lat: number;
  lng: number;
}

export interface DeliveryRoutePoint {
  lat: number;
  lng: number;
}

export interface DeliveryRouteStop extends DeliveryRoutePoint {
  sequence: number;
  type: "pickup" | "dropoff";
}

export interface DeliveryOptimizeResponse {
  run_id?: number | string;
  rider_id: number | string;
  rider_name?: string;
  distance_km?: number;
  estimated_minutes?: number;
  score?: number;
  reason?: string;
  method?: string;
  status?: string;
  stops?: DeliveryRouteStop[];
  path?: DeliveryRoutePoint[];
}

export type MarketplaceRole = "guest" | "buyer";

export interface CatalogSearchRequest {
  search?: string | null;
  occasion?: string | null;
  recipient_type?: string | null;
  budget_range?: BudgetRange | null;
  prefer_local: boolean;
  user_id?: number | null;
  top_k: number;
}

export interface CatalogSearchResponse {
  run_id?: number | string;
  role: MarketplaceRole;
  results: RankedProduct[];
}

export interface BuyerProfileRequest {
  user_id: number;
  role?: AuthRole;
  full_name: string;
  email: string;
  phone?: string | null;
  barangay?: string | null;
  address_line?: string | null;
}

export interface BuyerProfileResponse {
  profile_id: number | string;
  status: "saved" | "already_completed";
  role: AuthRole;
  onboarding_completed?: boolean;
}

export interface BuyerProfileLookupResponse {
  user_id: number;
  exists: boolean;
  role?: AuthRole;
  onboarding_completed: boolean;
  profile: Record<string, unknown>;
}

export interface BuyerOrderItem {
  product_id: number | string;
  quantity: number;
}

export interface BuyerOrderRequest {
  buyer_user_id: number;
  occasion: string;
  recipient_type: string;
  notes?: string | null;
  items: BuyerOrderItem[];
  gift_pack: {
    enabled: boolean;
    style: "standard" | "premium" | "luxury";
    add_ons: string[];
    card_message?: string;
  };
  delivery: {
    recipient_name?: string;
    recipient_phone?: string;
    address?: string;
    fee?: number;
    timeslot?: TimeSlot;
  };
}

export interface BuyerOrderResponse {
  order_id: number | string;
  status: string;
  subtotal: number;
  gift_pack_fee: number;
  delivery_fee: number;
  total_price: number;
  recommendations: RankedProduct[];
}

export interface BuyerOrderHistoryRow {
  order_id: number | string;
  status: string;
  occasion?: string | null;
  recipient_type?: string | null;
  total_price?: number;
  created_at?: string | null;
  primary_product_name?: string;
  item_count?: number;
  store_id?: number | string | null;
  store_name?: string;
  rider_user_id?: number | string | null;
  rider_name?: string | null;
  recipient_name?: string | null;
  delivery_address?: string | null;
  raw_order_status?: string | null;
  raw_task_status?: string | null;
}

export interface StoreOwnerApplicationRequest {
  applicant_user_id: number;
  full_name: string;
  email: string;
  contact_no: string;
  bir_tin: string;
  dti_registration_no: string;
  business_name: string;
  business_address: string;
  barangay: string;
  documents: Record<string, string>;
}

export interface StorePayload {
  owner_user_id: number;
  store_name: string;
  description?: string;
  barangay: string;
  lat?: number;
  lng?: number;
  is_active: boolean;
}

export interface StoreProductPayload {
  owner_user_id: number;
  store_id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  stock: number;
  occasion_tags: string[];
  recipient_tags: string[];
  tags: string[];
  local_vendor: boolean;
}

export interface StoreOwnerOrderRow {
  order_item_id?: number | string | null;
  order_id?: number | string | null;
  product_id?: number | string | null;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  line_total?: number;
  status?: string;
  occasion?: string;
  recipient_type?: string;
  buyer_user_id?: number | string | null;
  total_price?: number;
  store_id?: number | string | null;
  store_name?: string;
  created_at?: string;
}

export interface DriverTask {
  task_id: number | string;
  order_id?: number | string;
  pickup_label?: string;
  dropoff_label?: string;
  status: "assigned" | "picked_up" | "in_transit" | "delivered" | "failed" | "cancelled";
  last_note?: string;
  created_at?: string;
}

export interface DriverTasksResponse {
  tasks: DriverTask[];
}

export interface AdminDashboardResponse {
  metrics: Record<string, number>;
  charts: Record<string, Record<string, number>>;
  pending_reports: Record<string, unknown>[];
}

export interface ModerationActionRequest {
  status: "pending" | "reviewing" | "resolved" | "dismissed";
  action_taken: string;
}

export interface AdminStore {
  store_id?: number | string | null;
  store_name?: string;
  owner_user_id?: number | string | null;
  barangay?: string | null;
  is_active?: boolean;
  product_count?: number;
  [key: string]: unknown;
}

export interface AdminUserProfile {
  user_id?: number | string | null;
  role?: string;
  full_name?: string;
  email?: string;
  phone?: string | null;
  barangay?: string | null;
  address_line?: string | null;
  order_count?: number;
  [key: string]: unknown;
}

export interface AdminProduct {
  product_id?: number | string | null;
  name?: string;
  category?: string;
  price?: number;
  stock?: number;
  store_id?: number | string | null;
  store_name?: string;
  owner_user_id?: number | string | null;
  local_vendor?: boolean;
  source?: string;
  [key: string]: unknown;
}

export interface AdminStoreOwnerApplication {
  application_id?: number | string | null;
  applicant_user_id?: number | string | null;
  full_name?: string;
  email?: string;
  contact_no?: string;
  business_name?: string;
  barangay?: string;
  status?: "pending_review" | "approved" | "rejected" | string;
  created_at?: string;
  [key: string]: unknown;
}

export interface StoreOwnerApplicationModerationRequest {
  status: "pending_review" | "approved" | "rejected";
  action_taken?: string;
}

export const api = {
  getHealth: () => get<HealthResponse>("/health"),
  signIn: (b: AuthSignInRequest) => post<AuthSignInResponse>("/api/auth/signin", b),
  signUp: (b: AuthSignUpRequest) => post<AuthSignUpResponse>("/api/auth/signup", b),
  requestPasswordRecovery: (b: AuthPasswordRecoveryRequest) =>
    post<AuthPasswordRecoveryResponse>("/api/auth/recover", b),
  getSessionUser: (accessToken: string) =>
    request<AuthApiUser>("/api/auth/session", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  signOut: (accessToken: string) =>
    request<{ signed_out: boolean }>("/api/auth/signout", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  updateProfile: (b: AuthProfileUpdateRequest) => patch<AuthApiUser>("/api/auth/profile", b),
  giftFilter: (b: GiftFilterRequest) => post<GiftFilterResponse>("/api/gift-intelligence/filter", b),
  cbf: (b: CBFRequest) => post<CBFResponse>("/api/recommendations/cbf", b),
  optimizeDelivery: (b: DeliveryOptimizeRequest) =>
    post<DeliveryOptimizeResponse>("/api/delivery/optimize", b),
  catalogSearch: (b: CatalogSearchRequest) => post<CatalogSearchResponse>("/api/catalog/search", b),
  saveBuyerProfile: (b: BuyerProfileRequest) => post<BuyerProfileResponse>("/api/buyer/profile", b),
  getBuyerProfile: (userId: number) => get<BuyerProfileLookupResponse>(`/api/buyer/profile/${userId}`),
  createBuyerOrder: (b: BuyerOrderRequest) => post<BuyerOrderResponse>("/api/buyer/orders", b),
  getBuyerOrders: (buyerUserId: number) => get<BuyerOrderHistoryRow[]>(`/api/buyer/${buyerUserId}/orders`),
  applyStoreOwner: (b: StoreOwnerApplicationRequest) =>
    post<{ application_id: number | string; status: string }>("/api/store-owner/apply", b),
  createStore: (b: StorePayload) =>
    post<{ store_id: number | string; status: string }>("/api/store-owner/stores", b),
  updateStore: (storeId: number | string, b: StorePayload) =>
    put<{ store_id: number | string; status: string }>(`/api/store-owner/stores/${storeId}`, b),
  deleteStore: (storeId: number | string) =>
    del<{ store_id: number | string; status: string }>(`/api/store-owner/stores/${storeId}`),
  createStoreProduct: (b: StoreProductPayload) =>
    post<{ product_id: number | string; status: string }>("/api/store-owner/products", b),
  updateStoreProduct: (productId: number | string, b: StoreProductPayload) =>
    put<{ product_id: number | string; status: string }>(`/api/store-owner/products/${productId}`, b),
  deleteStoreProduct: (productId: number | string) =>
    del<{ product_id: number | string; status: string }>(`/api/store-owner/products/${productId}`),
  getStoreOwnerOrders: (ownerUserId: number) =>
    get<StoreOwnerOrderRow[]>(`/api/store-owner/${ownerUserId}/orders`),
  getDriverTasks: (driverUserId: number) => get<DriverTasksResponse>(`/api/driver/${driverUserId}/tasks`),
  updateDriverTask: (taskId: number | string, b: { status: DriverTask["status"]; note?: string }) =>
    patch<{ task_id: number | string; status: string }>(`/api/driver/tasks/${taskId}`, b),
  getAdminDashboard: () => get<AdminDashboardResponse>("/api/admin/dashboard"),
  getAdminReports: () => get<Record<string, unknown>[]>("/api/admin/reports"),
  moderateReport: (reportId: number | string, b: ModerationActionRequest) =>
    patch<{ report_id: number | string; status: string }>(`/api/admin/reports/${reportId}`, b),
  getAdminStores: () => get<AdminStore[]>("/api/admin/stores"),
  getAdminUsers: () => get<AdminUserProfile[]>("/api/admin/users"),
  getAdminProducts: () => get<AdminProduct[]>("/api/admin/products"),
  getAdminStoreOwnerApplications: () => get<AdminStoreOwnerApplication[]>("/api/admin/store-owner-applications"),
  moderateStoreOwnerApplication: (
    applicationId: number | string,
    b: StoreOwnerApplicationModerationRequest,
  ) =>
    patch<{ application_id: number | string; status: string }>(
      `/api/admin/store-owner-applications/${applicationId}`,
      b,
    ),
};
