import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Package, ChevronRight, Clock, CheckCircle2, Truck,
  Filter, Search, TrendingUp, Star,
} from "lucide-react";
import { useGift } from "../context/GiftContext";

const BRAND = "#8B1520";

const fallbackOrders = [
  { id: "ZIP-2026-0041", gift: "Gordon's Bibingka Box", store: "Gordon's Market", date: "May 6, 2026", total: 300, status: "active", rider: "Carlos Reyes", occasion: "🎂 Birthday", rating: null },
  { id: "ZIP-2026-0038", gift: "Subic Bay Dried Mango Set", store: "SBMA Pasalubong", date: "May 2, 2026", total: 230, status: "delivered", rider: "Maria Santos", occasion: "🎓 Graduation", rating: 5 },
  { id: "ZIP-2026-0031", gift: "Barrio Fiesta Hamper", store: "ZC Gift Gallery", date: "Apr 25, 2026", total: 549, status: "delivered", rider: "Bong Dela Cruz", occasion: "💍 Anniversary", rating: 5 },
  { id: "ZIP-2026-0024", gift: "Premium Gift Box", store: "Olongapo Fresh", date: "Apr 12, 2026", total: 749, status: "delivered", rider: "Ana Villanueva", occasion: "🎁 Thank You", rating: 4 },
  { id: "ZIP-2026-0017", gift: "Gordon's Bibingka Box", store: "Gordon's Market", date: "Mar 30, 2026", total: 300, status: "delivered", rider: "Carlos Reyes", occasion: "🎂 Birthday", rating: 5 },
];

const statusConfig = {
  active: { label: "En Route", color: "#2563EB", bg: "#EFF6FF", icon: Truck },
  delivered: { label: "Delivered", color: "#059669", bg: "#ECFDF5", icon: CheckCircle2 },
  pending: { label: "Pending", color: "#D97706", bg: "#FEF3C7", icon: Clock },
};

type StatusKey = keyof typeof statusConfig;
const FILTERS = ["All", "Active", "Delivered", "Pending"] as const;

export default function Orders() {
  const navigate = useNavigate();
  const { orderHistory } = useGift();
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState("");

  const orders = useMemo(
    () =>
      orderHistory.length > 0
        ? orderHistory.map((item) => ({
            id: item.id,
            gift: item.gift,
            store: item.store,
            date: item.date,
            total: item.total,
            status: item.status,
            rider: item.rider,
            occasion: item.occasion,
            rating: item.rating,
          }))
        : fallbackOrders,
    [orderHistory],
  );

  const filtered = orders.filter((o) => {
    const matchStatus = filter === "All" || o.status.toLowerCase() === filter.toLowerCase();
    const matchSearch = o.gift.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = [
    { label: "Total Orders", value: orders.length, icon: Package },
    { label: "Delivered", value: orders.filter((o) => o.status === "delivered").length, icon: CheckCircle2 },
    { label: "Total Spent", value: `₱${orders.reduce((a, o) => a + o.total, 0).toLocaleString()}`, icon: TrendingUp },
    { label: "Avg Rating", value: "5.0 ⭐", icon: Star },
  ];

  const activeOrder = orders.find((o) => o.status === "active");

  return (
    <div className="overflow-x-hidden" style={{ background: "#FAFAFA" }}>
      <div className="px-5 pt-5 pb-4 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-gray-900" style={{ fontWeight: 800, fontSize: 18 }}>My Orders</h2>
          <button className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <p className="text-xs text-gray-400">All your gift deliveries</p>
      </div>

      <div className="hidden md:grid grid-cols-4 gap-4 px-6 py-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FFF1F2" }}>
              <s.icon className="w-4 h-4" style={{ color: BRAND }} />
            </div>
            <div>
              <div className="text-lg" style={{ color: BRAND, fontWeight: 800 }}>{s.value}</div>
              <div className="text-[11px] text-gray-400">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-5 mt-4 md:mt-0 rounded-2xl overflow-hidden" style={{ background: BRAND }}>
        <div className="px-4 py-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm" style={{ fontWeight: 700 }}>
              {activeOrder ? `${activeOrder.id} · Active` : "No active orders"}
            </div>
            <div className="text-red-200 text-xs">
              {activeOrder ? `Rider ${activeOrder.rider} · ETA in progress` : "Place a new order to start tracking"}
            </div>
          </div>
          <button onClick={() => navigate("/app/confirmed")} className="text-white">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="h-1.5 bg-red-900">
          <div className="h-full w-1/4 bg-yellow-400 animate-pulse" />
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2 mb-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders..."
            className="flex-1 text-sm outline-none text-gray-700 bg-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3.5 py-1.5 rounded-full text-xs shrink-0 border transition-all"
              style={{
                background: filter === f ? BRAND : "white",
                color: filter === f ? "white" : "#374151",
                borderColor: filter === f ? BRAND : "#E5E7EB",
                fontWeight: filter === f ? 700 : 500,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 pb-6">
        <div className="md:hidden space-y-3">
          {filtered.map((order) => {
            const cfg = statusConfig[order.status as StatusKey];
            const Icon = cfg.icon;
            return (
              <div key={order.id} onClick={() => navigate("/app/confirmed")} className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="text-xs text-gray-400">{order.id}</div>
                    <div className="text-sm text-gray-900 mt-0.5" style={{ fontWeight: 700 }}>{order.gift}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{order.store} · {order.occasion}</div>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] shrink-0" style={{ background: cfg.bg, color: cfg.color, fontWeight: 700 }}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                  <div className="text-xs text-gray-400">{order.date} · {order.rider}</div>
                  <div className="text-sm" style={{ color: BRAND, fontWeight: 800 }}>₱{order.total}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                {["Order ID", "Gift", "Store", "Occasion", "Rider", "Date", "Status", "Amount", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider" style={{ fontWeight: 700 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, idx) => {
                const cfg = statusConfig[order.status as StatusKey];
                const Icon = cfg.icon;
                return (
                  <tr
                    key={order.id}
                    onClick={() => navigate("/app/confirmed")}
                    className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    style={{ background: idx % 2 === 0 ? "white" : "#FAFAFA" }}
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-500 font-mono">{order.id}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{order.gift}</div>
                      <div className="text-xs text-gray-400">{order.store}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-600">{order.occasion}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: BRAND, fontSize: 9, fontWeight: 800 }}>
                          {order.rider.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-xs text-gray-600">{order.rider}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-gray-500">{order.date}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full" style={{ background: cfg.bg }}>
                        <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                        <span className="text-[11px]" style={{ color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span style={{ color: BRAND, fontWeight: 800 }}>₱{order.total}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        {order.rating && Array.from({ length: order.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">No orders found.</div>
          )}
        </div>
      </div>

      <div className="mx-5 mb-6">
        <button
          onClick={() => navigate("/app/gift")}
          className="w-full py-3.5 rounded-2xl text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ background: BRAND, fontWeight: 700 }}
        >
          <Package className="w-4 h-4" />
          Send a New Gift
        </button>
      </div>
    </div>
  );
}
