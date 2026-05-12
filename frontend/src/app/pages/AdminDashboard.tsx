import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  ShieldCheck,
  Bell,
  LogOut,
  LayoutDashboard,
  Store,
  Users,
  Boxes,
  AlertTriangle,
  Menu,
  X,
  ArrowLeft,
  CheckCircle2,
  RefreshCcw,
} from "lucide-react";
import { ZippoLogo } from "../components/ZippoLogo";
import { useGift } from "../context/GiftContext";
import { api, type AdminDashboardResponse, type AdminProduct, type AdminStore, type AdminStoreOwnerApplication, type AdminUserProfile } from "@/lib/api";

const COLOR = "#7C3AED";

type Tab = "overview" | "stores" | "users" | "products" | "moderation";

const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "stores", label: "Stores", icon: Store },
  { id: "users", label: "Users", icon: Users },
  { id: "products", label: "Products", icon: Boxes },
  { id: "moderation", label: "Moderation", icon: AlertTriangle },
];

type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";
type ApplicationStatus = "pending_review" | "approved" | "rejected";

function SidebarNav({
  tab,
  setTab,
  onClose,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  onClose?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setTab(item.id);
              onClose?.();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left"
            style={{ background: tab === item.id ? "#F5F3FF" : undefined }}
          >
            <item.icon
              style={{ color: tab === item.id ? COLOR : "#9CA3AF", width: 18, height: 18 }}
              strokeWidth={tab === item.id ? 2.5 : 1.8}
            />
            <span className="text-sm" style={{ color: tab === item.id ? COLOR : "#374151", fontWeight: tab === item.id ? 700 : 500 }}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
      <div className="px-4 pb-5 space-y-1 shrink-0">
        <button onClick={() => { window.location.href = "/login"; }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-left">
          <LogOut style={{ color: "#9CA3AF", width: 16, height: 16 }} />
          <span className="text-sm text-gray-500">Sign Out</span>
        </button>
        <button onClick={() => { window.location.href = "/"; }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-left">
          <ArrowLeft style={{ color: "#9CA3AF", width: 16, height: 16 }} />
          <span className="text-sm text-gray-500">Home</span>
        </button>
      </div>
    </>
  );
}

function toChartData(source: Record<string, number | string | undefined>): { label: string; value: number }[] {
  return Object.entries(source).map(([label, value]) => ({
    label,
    value: Number(value ?? 0),
  }));
}

function toHuman(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function numberValue(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function safeText(value: unknown, fallback = "N/A"): string {
  if (value === null || value === undefined) return fallback;
  const asText = String(value).trim();
  return asText.length > 0 ? asText : fallback;
}

export default function AdminDashboard() {
  const { authLoading, isAuthenticated, authRole, userName } = useGift();
  const [tab, setTab] = useState<Tab>("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [reports, setReports] = useState<Record<string, unknown>[]>([]);
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [applications, setApplications] = useState<AdminStoreOwnerApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [lastLoadedAt, setLastLoadedAt] = useState<string>("");

  const [reportId, setReportId] = useState("");
  const [reportStatus, setReportStatus] = useState<ReportStatus>("reviewing");
  const [reportNote, setReportNote] = useState("");
  const [moderatingReport, setModeratingReport] = useState(false);
  const [reportResult, setReportResult] = useState("");

  const [applicationId, setApplicationId] = useState("");
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("approved");
  const [applicationNote, setApplicationNote] = useState("");
  const [moderatingApplication, setModeratingApplication] = useState(false);
  const [applicationResult, setApplicationResult] = useState("");

  const [productSourceFilter, setProductSourceFilter] = useState<"all" | "seller_catalog" | "legacy_catalog">("all");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [authLoading, isAuthenticated]);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [
        dashboardResponse,
        reportsResponse,
        storesResponse,
        usersResponse,
        productsResponse,
        applicationsResponse,
      ] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminReports(),
        api.getAdminStores(),
        api.getAdminUsers(),
        api.getAdminProducts(),
        api.getAdminStoreOwnerApplications(),
      ]);

      setDashboard(dashboardResponse);
      setReports(reportsResponse ?? []);
      setStores(storesResponse ?? []);
      setUsers(usersResponse ?? []);
      setProducts(productsResponse ?? []);
      setApplications(applicationsResponse ?? []);
      setLastLoadedAt(new Date().toLocaleString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && authRole === "admin") {
      void loadAdminData();
    }
  }, [authLoading, isAuthenticated, authRole, loadAdminData]);

  const filteredProducts = useMemo(() => {
    if (productSourceFilter === "all") {
      return products;
    }
    return products.filter((product) => String(product.source ?? "") === productSourceFilter);
  }, [productSourceFilter, products]);

  const roleCounts = useMemo(
    () => [
      { label: "buyers", value: numberValue(dashboard?.metrics?.buyers ?? 0) },
      { label: "store_owners", value: numberValue(dashboard?.metrics?.store_owners ?? 0) },
      { label: "drivers", value: numberValue(dashboard?.metrics?.drivers ?? 0) },
      { label: "admins", value: numberValue(dashboard?.metrics?.admins ?? 0) },
    ],
    [dashboard],
  );

  const ordersByStatus = useMemo(
    () => toChartData((dashboard?.charts?.marketplace_orders_by_status ?? {}) as Record<string, number | string>),
    [dashboard],
  );

  const reportsByStatus = useMemo(
    () => toChartData((dashboard?.charts?.reports_by_status ?? {}) as Record<string, number | string>),
    [dashboard],
  );

  const topStoresByProducts = useMemo(
    () =>
      [...stores]
        .sort((a, b) => numberValue(b.product_count) - numberValue(a.product_count))
        .slice(0, 8)
        .map((s) => ({
          label: safeText(s.store_name, `Store ${safeText(s.store_id, "")}`),
          value: numberValue(s.product_count),
        })),
    [stores],
  );

  const kpis = useMemo(
    () => [
      { label: "Users", value: users.length, color: COLOR, icon: Users },
      { label: "Stores", value: stores.length, color: "#2563EB", icon: Store },
      { label: "Products", value: products.length, color: "#059669", icon: Boxes },
      { label: "Reports", value: reports.length, color: "#DC2626", icon: AlertTriangle },
    ],
    [users.length, stores.length, products.length, reports.length],
  );

  const moderateReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reportId.trim() || !reportNote.trim()) return;
    setModeratingReport(true);
    setReportResult("");
    setError("");
    try {
      const response = await api.moderateReport(reportId, {
        status: reportStatus,
        action_taken: reportNote.trim(),
      });
      setReportResult(`Report #${response.report_id} marked as ${response.status}.`);
      setReportNote("");
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update report.");
    } finally {
      setModeratingReport(false);
    }
  };

  const moderateApplication = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!applicationId.trim()) return;
    setModeratingApplication(true);
    setApplicationResult("");
    setError("");
    try {
      const response = await api.moderateStoreOwnerApplication(applicationId, {
        status: applicationStatus,
        action_taken: applicationNote.trim() || undefined,
      });
      setApplicationResult(`Application #${response.application_id} marked as ${response.status}.`);
      setApplicationNote("");
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update application.");
    } finally {
      setModeratingApplication(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F3FF" }}>
        <div className="text-sm text-gray-500">Checking admin access...</div>
      </div>
    );
  }

  if (isAuthenticated && authRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F5F3FF" }}>
        <div className="max-w-md w-full rounded-2xl border border-purple-100 bg-white p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#F5F3FF" }}>
            <ShieldCheck className="w-6 h-6" style={{ color: COLOR }} />
          </div>
          <h2 className="text-gray-900 mb-2" style={{ fontWeight: 800 }}>Admin Access Required</h2>
          <p className="text-sm text-gray-500 mb-5">
            This portal is only available to administrator accounts.
          </p>
          <button
            onClick={() => { window.location.href = "/app/home"; }}
            className="px-4 py-2 rounded-xl text-white text-sm"
            style={{ background: COLOR, fontWeight: 700 }}
          >
            Go to Customer Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#F5F3FF" }}>
      <aside className="hidden md:flex flex-col w-56 lg:w-60 min-h-screen bg-white border-r border-purple-100 fixed top-0 left-0 z-20 shadow-sm">
        <div className="px-5 py-5 shrink-0" style={{ background: COLOR }}>
          <ZippoLogo size="sm" light />
          <div className="mt-2 text-purple-200 text-xs" style={{ fontWeight: 600 }}>Admin Portal</div>
        </div>
        <SidebarNav tab={tab} setTab={setTab} />
      </aside>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 w-64 min-h-screen bg-white flex flex-col shadow-2xl">
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: COLOR }}>
              <div>
                <ZippoLogo size="sm" light />
                <div className="text-purple-200 text-xs mt-1" style={{ fontWeight: 600 }}>Admin Portal</div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <SidebarNav tab={tab} setTab={setTab} onClose={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 md:ml-56 lg:ml-60 flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-5 md:px-8 py-4 bg-white border-b border-purple-100 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 border" onClick={() => setDrawerOpen(true)}>
              <Menu className="w-4 h-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-gray-900" style={{ fontWeight: 800, fontSize: 16 }}>{navItems.find((n) => n.id === tab)?.label}</h1>
              <p className="text-xs text-gray-400">{userName} · Administrator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { void loadAdminData(); }}
              disabled={loading}
              className="h-8 px-3 rounded-xl border border-purple-100 text-xs flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: COLOR, fontWeight: 700 }}
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button className="w-8 h-8 rounded-xl border border-gray-100 flex items-center justify-center relative">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs" style={{ background: COLOR, fontWeight: 800 }}>
              {userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-8">
          <div className="mb-4 text-xs text-gray-500">
            Last loaded: {lastLoadedAt || "Not loaded yet"}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                  <div key={kpi.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                        <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                      </div>
                    </div>
                    <div className="text-2xl" style={{ color: kpi.color, fontWeight: 900 }}>{kpi.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{kpi.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 mb-4" style={{ fontWeight: 700 }}>Marketplace Orders by Status</h3>
                  <div className="h-[240px]">
                    {ordersByStatus.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-sm text-gray-400">No order status data yet.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ordersByStatus} barSize={30}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
                          <Bar dataKey="value" fill={COLOR} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 mb-4" style={{ fontWeight: 700 }}>Fraud Reports by Status</h3>
                  <div className="h-[240px]">
                    {reportsByStatus.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-sm text-gray-400">No report status data yet.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportsByStatus} barSize={30}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
                          <Bar dataKey="value" fill="#A78BFA" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 mb-4" style={{ fontWeight: 700 }}>Users by Role</h3>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roleCounts} barSize={30}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
                        <Bar dataKey="value" fill={COLOR} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 mb-4" style={{ fontWeight: 700 }}>Top Stores by Product Count</h3>
                  <div className="h-[240px]">
                    {topStoresByProducts.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-sm text-gray-400">No store product data yet.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topStoresByProducts} barSize={30}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                          <XAxis dataKey="label" tick={false} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
                          <Bar dataKey="value" fill="#C4B5FD" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {dashboard && (
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 mb-4" style={{ fontWeight: 700 }}>Core Metrics</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(dashboard.metrics).map(([key, value]) => (
                      <div key={key} className="rounded-xl border border-purple-100 p-3 bg-purple-50/40">
                        <div className="text-[11px] uppercase tracking-wide text-purple-500" style={{ fontWeight: 700 }}>
                          {toHuman(key)}
                        </div>
                        <div className="text-xl text-gray-900 mt-1" style={{ fontWeight: 800 }}>
                          {numberValue(value).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "stores" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-gray-900" style={{ fontWeight: 800 }}>All Stores</h2>
                <p className="text-xs text-gray-400">Global seller inventory and status.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr style={{ background: "#F5F3FF", borderBottom: "1px solid #E9D5FF" }}>
                      {["Store ID", "Name", "Owner User ID", "Barangay", "Products", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider" style={{ color: COLOR, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stores.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">No stores found.</td>
                      </tr>
                    ) : (
                      stores.map((store) => (
                        <tr key={`${store.store_id}-${store.owner_user_id}`} className="border-t border-gray-50 hover:bg-purple-50/20 transition-colors">
                          <td className="px-4 py-3.5"><span className="font-mono text-xs text-gray-500">{safeText(store.store_id, "-")}</span></td>
                          <td className="px-4 py-3.5"><span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{safeText(store.store_name)}</span></td>
                          <td className="px-4 py-3.5"><span className="text-sm text-gray-600">{safeText(store.owner_user_id, "-")}</span></td>
                          <td className="px-4 py-3.5"><span className="text-sm text-gray-600">{safeText(store.barangay, "-")}</span></td>
                          <td className="px-4 py-3.5"><span style={{ color: COLOR, fontWeight: 700 }}>{numberValue(store.product_count)}</span></td>
                          <td className="px-4 py-3.5">
                            <span
                              className="text-[11px] px-2.5 py-1 rounded-full"
                              style={{
                                background: store.is_active ? "#ECFDF5" : "#F3F4F6",
                                color: store.is_active ? "#059669" : "#6B7280",
                                fontWeight: 700,
                              }}
                            >
                              {store.is_active ? "active" : "inactive"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "users" && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-gray-900" style={{ fontWeight: 800 }}>User Directory</h2>
                <p className="text-xs text-gray-400">Profiles synced from marketplace onboarding.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr style={{ background: "#F5F3FF", borderBottom: "1px solid #E9D5FF" }}>
                      {["User ID", "Role", "Name", "Email", "Phone", "Barangay", "Orders"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider" style={{ color: COLOR, fontWeight: 700 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No users found.</td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={`${user.user_id}-${user.email}`} className="border-t border-gray-50 hover:bg-purple-50/20 transition-colors">
                          <td className="px-4 py-3.5"><span className="font-mono text-xs text-gray-500">{safeText(user.user_id, "-")}</span></td>
                          <td className="px-4 py-3.5">
                            <span className="text-[11px] px-2.5 py-1 rounded-full bg-purple-100 text-purple-700" style={{ fontWeight: 700 }}>
                              {safeText(user.role, "buyer")}
                            </span>
                          </td>
                          <td className="px-4 py-3.5"><span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{safeText(user.full_name)}</span></td>
                          <td className="px-4 py-3.5"><span className="text-sm text-gray-600">{safeText(user.email)}</span></td>
                          <td className="px-4 py-3.5"><span className="text-sm text-gray-600">{safeText(user.phone, "-")}</span></td>
                          <td className="px-4 py-3.5"><span className="text-sm text-gray-600">{safeText(user.barangay, "-")}</span></td>
                          <td className="px-4 py-3.5"><span style={{ color: COLOR, fontWeight: 700 }}>{numberValue(user.order_count)}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "products" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Source:</label>
                <select
                  value={productSourceFilter}
                  onChange={(e) => setProductSourceFilter(e.target.value as "all" | "seller_catalog" | "legacy_catalog")}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white outline-none"
                >
                  <option value="all">All products</option>
                  <option value="seller_catalog">Seller catalog</option>
                  <option value="legacy_catalog">Legacy catalog</option>
                </select>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[940px]">
                    <thead>
                      <tr style={{ background: "#F5F3FF", borderBottom: "1px solid #E9D5FF" }}>
                        {["Product ID", "Name", "Category", "Store", "Price", "Stock", "Source"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider" style={{ color: COLOR, fontWeight: 700 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No products found for this filter.</td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => (
                          <tr key={`${product.product_id}-${product.source}-${product.name}`} className="border-t border-gray-50 hover:bg-purple-50/20 transition-colors">
                            <td className="px-4 py-3.5"><span className="font-mono text-xs text-gray-500">{safeText(product.product_id, "-")}</span></td>
                            <td className="px-4 py-3.5"><span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{safeText(product.name)}</span></td>
                            <td className="px-4 py-3.5"><span className="text-sm text-gray-600">{safeText(product.category, "-")}</span></td>
                            <td className="px-4 py-3.5"><span className="text-sm text-gray-600">{safeText(product.store_name, "-")}</span></td>
                            <td className="px-4 py-3.5"><span style={{ color: COLOR, fontWeight: 700 }}>PHP {numberValue(product.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></td>
                            <td className="px-4 py-3.5"><span className="text-sm text-gray-600">{numberValue(product.stock)}</span></td>
                            <td className="px-4 py-3.5"><span className="text-xs text-gray-500">{toHuman(safeText(product.source, "unknown"))}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "moderation" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-gray-900" style={{ fontWeight: 800 }}>Fraud Reports</h2>
                  <p className="text-xs text-gray-400">Review and resolve reported incidents.</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="max-h-56 overflow-auto border border-gray-100 rounded-xl">
                    <table className="w-full min-w-[520px]">
                      <thead>
                        <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                          {["ID", "Role", "Reason", "Status"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reports.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-xs text-gray-400">No reports available.</td>
                          </tr>
                        ) : (
                          reports.slice(0, 50).map((row) => (
                            <tr key={`${safeText(row.report_id, Math.random().toString())}`} className="border-t border-gray-50">
                              <td className="px-3 py-2 text-xs font-mono text-gray-500">{safeText(row.report_id, "-")}</td>
                              <td className="px-3 py-2 text-xs text-gray-600">{safeText(row.accused_role, "-")}</td>
                              <td className="px-3 py-2 text-xs text-gray-600">{safeText(row.reason, "-")}</td>
                              <td className="px-3 py-2 text-xs text-gray-500">{safeText(row.status, "-")}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <form onSubmit={moderateReport} className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Report ID</label>
                      <input
                        value={reportId}
                        onChange={(e) => setReportId(e.target.value)}
                        type="number"
                        required
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Status</label>
                      <select
                        value={reportStatus}
                        onChange={(e) => setReportStatus(e.target.value as ReportStatus)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Action Taken</label>
                      <textarea
                        value={reportNote}
                        onChange={(e) => setReportNote(e.target.value)}
                        rows={3}
                        required
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={moderatingReport}
                      className="px-4 py-2 rounded-xl text-white text-sm flex items-center gap-1.5 disabled:opacity-50"
                      style={{ background: COLOR, fontWeight: 700 }}
                    >
                      {moderatingReport ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {moderatingReport ? "Applying..." : "Apply Moderation"}
                    </button>
                    {reportResult && (
                      <div className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-700">
                        {reportResult}
                      </div>
                    )}
                  </form>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-gray-900" style={{ fontWeight: 800 }}>Store Owner Applications</h2>
                  <p className="text-xs text-gray-400">Approve or reject incoming seller applications.</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="max-h-56 overflow-auto border border-gray-100 rounded-xl">
                    <table className="w-full min-w-[560px]">
                      <thead>
                        <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                          {["ID", "Business", "Applicant", "Status"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {applications.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-xs text-gray-400">No applications available.</td>
                          </tr>
                        ) : (
                          applications.slice(0, 50).map((row) => (
                            <tr key={`${safeText(row.application_id, Math.random().toString())}`} className="border-t border-gray-50">
                              <td className="px-3 py-2 text-xs font-mono text-gray-500">{safeText(row.application_id, "-")}</td>
                              <td className="px-3 py-2 text-xs text-gray-600">{safeText(row.business_name, "-")}</td>
                              <td className="px-3 py-2 text-xs text-gray-600">{safeText(row.full_name, "-")}</td>
                              <td className="px-3 py-2 text-xs text-gray-500">{safeText(row.status, "-")}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <form onSubmit={moderateApplication} className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Application ID</label>
                      <input
                        value={applicationId}
                        onChange={(e) => setApplicationId(e.target.value)}
                        type="number"
                        required
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Decision</label>
                      <select
                        value={applicationStatus}
                        onChange={(e) => setApplicationStatus(e.target.value as ApplicationStatus)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400"
                      >
                        <option value="pending_review">Pending review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Action Note (optional)</label>
                      <textarea
                        value={applicationNote}
                        onChange={(e) => setApplicationNote(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-400 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={moderatingApplication}
                      className="px-4 py-2 rounded-xl text-white text-sm flex items-center gap-1.5 disabled:opacity-50"
                      style={{ background: COLOR, fontWeight: 700 }}
                    >
                      {moderatingApplication ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {moderatingApplication ? "Applying..." : "Apply Decision"}
                    </button>
                    {applicationResult && (
                      <div className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-700">
                        {applicationResult}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
