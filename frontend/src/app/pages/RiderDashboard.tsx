import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import {
  Truck, MapPin, Clock, Star, CheckCircle2, Navigation,
  TrendingUp, Bell, LogOut, Settings, LayoutDashboard,
  Package, ArrowLeft, Menu, X, Zap, Route, Phone, Store,
} from "lucide-react";
import { ZippoLogo } from "../components/ZippoLogo";
import { useGift } from "../context/GiftContext";
import { api } from "@/lib/api";

const COLOR = "#059669";

const fallbackEarningsData = [
  { day: "Mon", earned: 480 }, { day: "Tue", earned: 640 },
  { day: "Wed", earned: 320 }, { day: "Thu", earned: 720 },
  { day: "Fri", earned: 560 }, { day: "Sat", earned: 880 },
  { day: "Sun", earned: 440 },
];

const fallbackQueue = [
  { id: "ZIP-0042", gift: "Barrio Fiesta Hamper", store: "Gordon's Market", address: "Barangay 5, Olongapo", customer: "Maria Cruz", distance: "1.8 km", eta: "18 min", amount: 499, priority: "high" },
  { id: "ZIP-0043", gift: "Gordon's Bibingka Box", store: "Gordon's Market", address: "East Bajac-Bajac", customer: "Juan Santos", distance: "3.2 km", eta: "31 min", amount: 250, priority: "normal" },
  { id: "ZIP-0044", gift: "Premium Gift Box", store: "ZC Gift Gallery", address: "Sta. Rita", customer: "Ana Garcia", distance: "4.6 km", eta: "45 min", amount: 699, priority: "normal" },
];

const fallbackToday = [
  { id: "ZIP-0038", gift: "Bibingka Box", store: "Gordon's Market", time: "8:15 AM", status: "delivered", amount: 250 },
  { id: "ZIP-0039", gift: "Mango Set", store: "SBMA Pasalubong", time: "9:02 AM", status: "delivered", amount: 180 },
  { id: "ZIP-0040", gift: "Fiesta Hamper", store: "Gordon's Market", time: "9:45 AM", status: "delivered", amount: 499 },
  { id: "ZIP-0041", gift: "Gordon's Bibingka", store: "Gordon's Market", time: "10:20 AM", status: "active", amount: 250 },
];

type Tab = "overview" | "deliveries" | "earnings" | "profile";

const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "deliveries", label: "Deliveries", icon: Package },
  { id: "earnings", label: "Earnings", icon: TrendingUp },
  { id: "profile", label: "Profile", icon: Settings },
];

function SidebarNav({
  tab,
  setTab,
  online,
  setOnline,
  onClose,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  online: boolean;
  setOnline: (v: boolean) => void;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between rounded-xl p-3" style={{ background: online ? "#ECFDF5" : "#F9FAFB" }}>
          <div>
            <div className="text-xs" style={{ color: online ? COLOR : "#6B7280", fontWeight: 700 }}>{online ? "● Online" : "○ Offline"}</div>
            <div className="text-[10px] text-gray-400">Tap to {online ? "go offline" : "go online"}</div>
          </div>
          <button
            onClick={() => setOnline(!online)}
            className="w-10 rounded-full relative transition-all"
            style={{ background: online ? COLOR : "#D1D5DB", height: 22 }}
          >
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: online ? "calc(100% - 18px)" : 2 }} />
          </button>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setTab(item.id);
              onClose?.();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left"
            style={{ background: tab === item.id ? "#ECFDF5" : undefined }}
          >
            <item.icon style={{ color: tab === item.id ? COLOR : "#9CA3AF", width: 18, height: 18 }} strokeWidth={tab === item.id ? 2.5 : 1.8} />
            <span className="text-sm" style={{ color: tab === item.id ? COLOR : "#374151", fontWeight: tab === item.id ? 700 : 500 }}>{item.label}</span>
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

export default function RiderDashboard() {
  const { numericUserId, authLoading, isAuthenticated, userName } = useGift();
  const [tab, setTab] = useState<Tab>("overview");
  const [online, setOnline] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [driverTasks, setDriverTasks] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    const loadTasks = async () => {
      if (!numericUserId) return;
      try {
        const response = await api.getDriverTasks(numericUserId);
        setDriverTasks(response.tasks as Array<Record<string, unknown>>);
      } catch {
        // Keep fallback data if backend fails.
      }
    };

    void loadTasks();
  }, [numericUserId]);

  const todayDeliveries = useMemo(() => {
    const mapped = driverTasks.map((task) => ({
      id: `ZIP-${String(task.order_id ?? task.task_id ?? "0000")}`,
      gift: String(task.dropoff_label ?? "Delivery Task"),
      store: String(task.pickup_label ?? "Pickup Point"),
      time: String(task.created_at ?? "Today"),
      status: String(task.status ?? "assigned") === "delivered" ? "delivered" : "active",
      amount: 0,
    }));
    return mapped.length > 0 ? mapped : fallbackToday;
  }, [driverTasks]);

  const deliveryQueue = useMemo(() => {
    const mapped = driverTasks
      .filter((task) => String(task.status ?? "") !== "delivered")
      .slice(0, 8)
      .map((task, idx) => ({
        id: `ZIP-${String(task.order_id ?? task.task_id ?? idx + 1)}`,
        gift: String(task.dropoff_label ?? "Delivery Task"),
        store: String(task.pickup_label ?? "Pickup Point"),
        address: String(task.dropoff_label ?? "Olongapo"),
        customer: "Recipient",
        distance: "—",
        eta: "Pending",
        amount: 0,
        priority: idx === 0 ? "high" : "normal",
      }));
    return mapped.length > 0 ? mapped : fallbackQueue;
  }, [driverTasks]);

  const earningsData = useMemo(() => {
    if (todayDeliveries.length === 0) return fallbackEarningsData;
    return fallbackEarningsData.map((row, idx) => ({
      ...row,
      earned: row.earned + idx * 10,
    }));
  }, [todayDeliveries.length]);

  const kpis = [
    { label: "Deliveries Today", value: String(todayDeliveries.length), delta: "+2", color: COLOR, icon: Truck },
    { label: "Earnings Today", value: "₱640", delta: "+₱80", color: "#2563EB", icon: TrendingUp },
    { label: "Avg Rating", value: "4.9 ⭐", delta: "—", color: "#D97706", icon: Star },
    { label: "Distance (km)", value: String((todayDeliveries.length * 3.2).toFixed(1)), delta: "+3.2", color: "#7C3AED", icon: Route },
  ];

  const riderLabel = `${userName} · Rider #04`;

  return (
    <div className="min-h-screen flex" style={{ background: "#F0FDF8" }}>
      <aside className="hidden md:flex flex-col w-56 lg:w-60 min-h-screen bg-white border-r border-green-100 fixed top-0 left-0 z-20 shadow-sm">
        <div className="px-5 py-5 shrink-0" style={{ background: COLOR }}>
          <ZippoLogo size="sm" light />
          <div className="mt-2 text-green-200 text-xs" style={{ fontWeight: 600 }}>Rider Portal</div>
        </div>
        <SidebarNav tab={tab} setTab={setTab} online={online} setOnline={setOnline} />
      </aside>

      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 w-64 min-h-screen bg-white flex flex-col shadow-2xl">
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: COLOR }}>
              <div>
                <ZippoLogo size="sm" light />
                <div className="text-green-200 text-xs mt-1" style={{ fontWeight: 600 }}>Rider Portal</div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <SidebarNav tab={tab} setTab={setTab} online={online} setOnline={setOnline} onClose={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 md:ml-56 lg:ml-60 flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-5 md:px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 border" onClick={() => setDrawerOpen(true)}>
              <Menu className="w-4 h-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-gray-900" style={{ fontWeight: 800, fontSize: 16 }}>{navItems.find((n) => n.id === tab)?.label}</h1>
              <p className="text-xs text-gray-400">{riderLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background: online ? "#ECFDF5" : "#F3F4F6", color: online ? COLOR : "#6B7280", fontWeight: 700 }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: online ? COLOR : "#9CA3AF" }} />
              {online ? "Online" : "Offline"}
            </div>
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
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                  <div key={kpi.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                        <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F0FDF4", color: COLOR, fontWeight: 700 }}>{kpi.delta}</span>
                    </div>
                    <div className="text-2xl" style={{ color: kpi.color, fontWeight: 900 }}>{kpi.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{kpi.label}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ background: `linear-gradient(135deg, ${COLOR} 0%, #047857 100%)` }}>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    <span className="text-white text-xs" style={{ fontWeight: 700 }}>
                      ACTIVE DELIVERY · {todayDeliveries.find((d) => d.status === "active")?.id ?? "No active task"}
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="text-white text-lg" style={{ fontWeight: 800 }}>
                        {todayDeliveries.find((d) => d.status === "active")?.gift ?? "Awaiting assignment"}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-green-200 text-sm">
                        <Store className="w-3.5 h-3.5" />Pickup: {todayDeliveries.find((d) => d.status === "active")?.store ?? "—"}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-green-200 text-sm">
                        <MapPin className="w-3.5 h-3.5" />{deliveryQueue[0]?.address ?? "Olongapo"}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-green-200 text-sm">
                        <Phone className="w-3.5 h-3.5" />{deliveryQueue[0]?.customer ?? "Recipient"}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="bg-white/20 rounded-xl p-3 text-center">
                        <div className="text-white text-xl" style={{ fontWeight: 900 }}>25</div>
                        <div className="text-green-200 text-[10px]">MIN ETA</div>
                      </div>
                      <div className="bg-white/20 rounded-xl p-3 text-center">
                        <div className="text-white text-xl" style={{ fontWeight: 900 }}>1.2</div>
                        <div className="text-green-200 text-[10px]">KM AWAY</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button className="flex-1 py-2.5 rounded-xl bg-white flex items-center justify-center gap-2 text-sm" style={{ color: COLOR, fontWeight: 700 }}>
                      <Navigation className="w-4 h-4" />Navigate
                    </button>
                    <button className="flex-1 py-2.5 rounded-xl bg-white/20 flex items-center justify-center gap-2 text-white text-sm" style={{ fontWeight: 700 }}>
                      <CheckCircle2 className="w-4 h-4" />Mark Delivered
                    </button>
                  </div>
                </div>
                <div className="h-1.5" style={{ background: "rgba(0,0,0,0.2)" }}>
                  <div className="h-full w-1/3 bg-yellow-400 animate-pulse" />
                </div>
              </div>

              <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Upcoming Queue</h3>
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#ECFDF5", color: COLOR, fontWeight: 700 }}>{deliveryQueue.length} queued</span>
                  </div>
                  <div className="space-y-3">
                    {deliveryQueue.map((d, i) => (
                      <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-green-200 transition-colors">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs shrink-0" style={{ background: d.priority === "high" ? "#DC2626" : COLOR, fontWeight: 800 }}>#{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{d.gift}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Store className="w-2.5 h-2.5 text-green-400" />
                            <span className="text-xs text-green-600" style={{ fontWeight: 600 }}>{d.store}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-gray-400" />
                            <span className="text-xs text-gray-400">{d.address}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs" style={{ color: COLOR, fontWeight: 700 }}>{d.distance}</div>
                          <div className="text-[10px] text-gray-400">~{d.eta}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Weekly Earnings</h3>
                    <div className="text-2xl mt-1" style={{ color: COLOR, fontWeight: 900 }}>₱4,040</div>
                    <div className="text-xs text-green-600" style={{ fontWeight: 600 }}>↑ 12% vs last week</div>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={earningsData} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip formatter={(v: number) => [`₱${v}`, "Earned"]} contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
                      <Bar dataKey="earned" fill={COLOR} radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {tab === "deliveries" && (
            <div className="space-y-4">
              <h2 className="text-gray-900" style={{ fontWeight: 800 }}>Today's Deliveries</h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr style={{ background: "#F0FDF8", borderBottom: "1px solid #D1FAE5" }}>
                        {["Order", "Gift", "Time", "Status", "Amount"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider" style={{ color: COLOR, fontWeight: 700 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {todayDeliveries.map((d) => (
                        <tr key={d.id} className="border-t border-gray-50 hover:bg-green-50/30 transition-colors">
                          <td className="px-4 py-3.5"><span className="font-mono text-xs text-gray-500">{d.id}</span></td>
                          <td className="px-4 py-3.5">
                            <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{d.gift}</div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Store className="w-2.5 h-2.5 text-green-400" />
                              <span className="text-xs text-green-600" style={{ fontWeight: 500 }}>{d.store}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5"><span className="text-xs text-gray-400">{d.time}</span></td>
                          <td className="px-4 py-3.5">
                            {d.status === "delivered" ? (
                              <div className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full" style={{ background: "#ECFDF5" }}>
                                <CheckCircle2 className="w-3 h-3" style={{ color: COLOR }} />
                                <span className="text-[11px]" style={{ color: COLOR, fontWeight: 700 }}>Delivered</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full" style={{ background: "#EFF6FF" }}>
                                <Truck className="w-3 h-3 text-blue-600" />
                                <span className="text-[11px] text-blue-600" style={{ fontWeight: 700 }}>En Route</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5"><span style={{ color: COLOR, fontWeight: 800 }}>₱{d.amount}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === "earnings" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Today", value: "₱640", icon: Zap },
                  { label: "This Week", value: "₱4,040", icon: TrendingUp },
                  { label: "This Month", value: "₱17,280", icon: Star },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "#ECFDF5" }}>
                      <s.icon className="w-4 h-4" style={{ color: COLOR }} />
                    </div>
                    <div className="text-2xl" style={{ color: COLOR, fontWeight: 900 }}>{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="text-gray-900 mb-4" style={{ fontWeight: 700 }}>Weekly Earnings Breakdown</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={earningsData} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${v}`} />
                    <Tooltip formatter={(v: number) => [`₱${v}`, "Earnings"]} contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
                    <Bar dataKey="earned" fill={COLOR} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {tab === "profile" && (
            <div className="max-w-2xl space-y-5">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white" style={{ background: COLOR, fontSize: 22, fontWeight: 800 }}>
                    {userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-gray-900" style={{ fontWeight: 800, fontSize: 18 }}>{userName}</div>
                    <div className="text-gray-500 text-sm">Rider #04 · East Bajac-Bajac</div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />)}
                      <span className="text-xs text-gray-400 ml-1">5.0</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[{ l: "Total Deliveries", v: String(todayDeliveries.length) }, { l: "Acceptance Rate", v: "98%" }, { l: "Total Earnings", v: "₱68k" }].map((s) => (
                    <div key={s.l} className="rounded-xl p-3 text-center border border-gray-100">
                      <div className="text-lg" style={{ color: COLOR, fontWeight: 800 }}>{s.v}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
