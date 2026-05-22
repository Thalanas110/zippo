import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Package,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  Filter,
  Search,
  TrendingUp,
  Star,
  XCircle,
} from "lucide-react";
import { useGift } from "../context/GiftContext";
import { api, type BuyerOrderHistoryRow } from "@/lib/api";

const BRAND = "#8B1520";

const statusConfig = {
  active: { label: "En Route", color: "#2563EB", bg: "#EFF6FF", icon: Truck },
  delivered: { label: "Delivered", color: "#059669", bg: "#ECFDF5", icon: CheckCircle2 },
  pending: { label: "Pending", color: "#D97706", bg: "#FEF3C7", icon: Clock },
  cancelled: { label: "Cancelled", color: "#B91C1C", bg: "#FEF2F2", icon: XCircle },
};

type UiOrderStatus = keyof typeof statusConfig;
type OrderFilter = "All" | "Active" | "Delivered" | "Pending" | "Cancelled";

interface UiOrder {
  id: string;
  gift: string;
  store: string;
  date: string;
  total: number;
  status: UiOrderStatus;
  rider: string;
  occasion: string;
  rating: number | null;
}

const FILTERS: readonly OrderFilter[] = ["All", "Active", "Delivered", "Pending", "Cancelled"];

function normalizeOrderStatus(status: string | null | undefined): UiOrderStatus {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "delivered") return "delivered";
  if (["cancelled", "refunded", "failed"].includes(normalized)) return "cancelled";
  if (["assigned", "picked_up", "in_transit"].includes(normalized)) return "active";
  return "pending";
}

function formatOrderDate(value: string | null | undefined): string {
  if (!value) return "Recently";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function titleCase(value: string | null | undefined, fallback: string): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  return raw
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getRiderInitials(name: string): string {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return initials || "--";
}

function mapApiOrder(row: BuyerOrderHistoryRow): UiOrder {
  return {
    id: `ZIP-${row.order_id}`,
    gift: row.primary_product_name || "Gift order",
    store: row.store_name || "ZIPPO Marketplace",
    date: formatOrderDate(row.created_at),
    total: Number(row.total_price ?? 0) || 0,
    status: normalizeOrderStatus(row.status),
    rider: row.rider_name || "Rider pending",
    occasion: titleCase(row.occasion, "Gift order"),
    rating: null,
  };
}

export default function Orders() {
  const navigate = useNavigate();
  const { orderHistory, numericUserId } = useGift();
  const [filter, setFilter] = useState<OrderFilter>("All");
  const [search, setSearch] = useState("");
  const [remoteOrders, setRemoteOrders] = useState<UiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hasActiveFilters = filter !== "All" || search.trim().length > 0;

  const localOrders = useMemo<UiOrder[]>(
    () =>
      orderHistory.map((item) => ({
        id: item.id,
        gift: item.gift,
        store: item.store,
        date: item.date,
        total: item.total,
        status: item.status,
        rider: item.rider,
        occasion: item.occasion,
        rating: item.rating,
      })),
    [orderHistory],
  );

  useEffect(() => {
    if (!numericUserId) {
      setRemoteOrders([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    void api
      .getBuyerOrders(numericUserId)
      .then((rows) => {
        if (!active) return;
        setRemoteOrders(rows.map(mapApiOrder));
      })
      .catch(() => {
        if (!active) return;
        setRemoteOrders([]);
        setError("Live order history is unavailable right now.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [numericUserId]);

  const orders = remoteOrders.length > 0 ? remoteOrders : localOrders;

  const filtered = orders.filter((order) => {
    const matchStatus = filter === "All" || order.status === filter.toLowerCase();
    const term = search.trim().toLowerCase();
    const matchSearch =
      term.length === 0 ||
      order.gift.toLowerCase().includes(term) ||
      order.id.toLowerCase().includes(term) ||
      order.store.toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  const deliveredOrders = orders.filter((order) => order.status === "delivered");
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const ratings = orders.map((order) => order.rating).filter((rating): rating is number => typeof rating === "number");
  const averageRating =
    ratings.length > 0 ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1) : "N/A";

  const stats = [
    { label: "Total Orders", value: orders.length, icon: Package },
    { label: "Delivered", value: deliveredOrders.length, icon: CheckCircle2 },
    { label: "Total Spent", value: `P${totalSpent.toLocaleString()}`, icon: TrendingUp },
    { label: "Avg Rating", value: averageRating === "N/A" ? "N/A" : `${averageRating}/5`, icon: Star },
  ];

  const activeOrder = orders.find((order) => order.status === "active");

  return (
    <div className="overflow-x-hidden" style={{ background: "#FAFAFA" }}>
      <div className="px-5 pt-5 pb-4 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-gray-900" style={{ fontWeight: 800, fontSize: 18 }}>
            My Orders
          </h2>
          <button
            onClick={() => {
              setFilter("All");
              setSearch("");
            }}
            disabled={!hasActiveFilters}
            className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={hasActiveFilters ? "Clear filters" : "No filters to clear"}
          >
            <Filter className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="hidden md:grid grid-cols-4 gap-4 px-6 py-5">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FFF1F2" }}>
              <stat.icon className="w-4 h-4" style={{ color: BRAND }} />
            </div>
            <div>
              <div className="text-lg" style={{ color: BRAND, fontWeight: 800 }}>
                {stat.value}
              </div>
              <div className="text-[11px] text-gray-400">{stat.label}</div>
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
              {activeOrder ? `${activeOrder.id} | Active` : "No active orders"}
            </div>
            <div className="text-red-200 text-xs">
              {activeOrder ? `${activeOrder.rider} | Tracking in progress` : "Your live delivery updates will appear here"}
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
        {error && orders.length === 0 && (
          <div
            className="rounded-2xl px-4 py-3 mb-3 text-sm"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", fontWeight: 600 }}
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2 mb-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search orders..."
            className="flex-1 text-sm outline-none text-gray-700 bg-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className="px-3.5 py-1.5 rounded-full text-xs shrink-0 border transition-all"
              style={{
                background: filter === value ? BRAND : "white",
                color: filter === value ? "white" : "#374151",
                borderColor: filter === value ? BRAND : "#E5E7EB",
                fontWeight: filter === value ? 700 : 500,
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 pb-6">
        {loading && orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-500">
            Loading your live order history...
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {filtered.map((order) => {
                const config = statusConfig[order.status];
                const Icon = config.icon;
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate("/app/confirmed")}
                    className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="text-xs text-gray-400">{order.id}</div>
                        <div className="text-sm text-gray-900 mt-0.5" style={{ fontWeight: 700 }}>
                          {order.gift}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {order.store} | {order.occasion}
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] shrink-0"
                        style={{ background: config.bg, color: config.color, fontWeight: 700 }}
                      >
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                      <div className="text-xs text-gray-400">
                        {order.date} | {order.rider}
                      </div>
                      <div className="text-sm" style={{ color: BRAND, fontWeight: 800 }}>
                        P{order.total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                    {["Order ID", "Gift", "Store", "Occasion", "Rider", "Date", "Status", "Amount", "Rating"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 text-left text-[11px] text-gray-500 uppercase tracking-wider"
                          style={{ fontWeight: 700 }}
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order, index) => {
                    const config = statusConfig[order.status];
                    const Icon = config.icon;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate("/app/confirmed")}
                        className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                        style={{ background: index % 2 === 0 ? "white" : "#FAFAFA" }}
                      >
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-500 font-mono">{order.id}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>
                            {order.gift}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-600">{order.store}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-600">{order.occasion}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                              style={{ background: BRAND, fontSize: 9, fontWeight: 800 }}
                            >
                              {getRiderInitials(order.rider)}
                            </div>
                            <span className="text-xs text-gray-600">{order.rider}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-gray-500">{order.date}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full" style={{ background: config.bg }}>
                            <Icon className="w-3 h-3" style={{ color: config.color }} />
                            <span className="text-[11px]" style={{ color: config.color, fontWeight: 700 }}>
                              {config.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span style={{ color: BRAND, fontWeight: 800 }}>P{order.total.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            {typeof order.rating === "number"
                              ? Array.from({ length: order.rating }).map((_, starIndex) => (
                                  <Star key={starIndex} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                ))
                              : <span className="text-xs text-gray-400">N/A</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-gray-400 text-sm">
                  {orders.length === 0 ? "No live orders yet." : "No orders found for that filter."}
                </div>
              )}
            </div>
          </>
        )}
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
