import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Gift,
  Package,
  User,
  Bell,
  Search,
  ChevronRight,
  ShoppingBag,
  Truck,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { ZippoLogo } from "../components/ZippoLogo";
import { useGift } from "../context/GiftContext";

const BRAND = "#8B1520";
const BRAND_LIGHT = "#FFF1F2";

const navItems = [
  { icon: Home, label: "Home", path: "/app/home" },
  { icon: Gift, label: "Gifts", path: "/app/gift" },
  { icon: Package, label: "Orders", path: "/app/orders" },
  { icon: User, label: "Profile", path: "/app/profile" },
];

const aiModules = [
  { num: 1, label: "Gift Intelligence", color: "#2563EB" },
  { num: 2, label: "Personalizer", color: "#7C3AED" },
  { num: 3, label: "Delivery Optimizer", color: "#059669" },
];

const portals = [
  { label: "Vendor Dashboard", path: "/vendor/dashboard", icon: ShoppingBag, color: "#2563EB", role: "store_owner" },
  { label: "Rider Dashboard", path: "/rider/dashboard", icon: Truck, color: "#059669", role: "driver" },
  { label: "Admin Dashboard", path: "/admin/dashboard", icon: LayoutDashboard, color: "#7C3AED", role: "admin" },
];

const pageTitles: Record<string, { title: string; sub: string }> = {
  "/app/home": { title: "Home", sub: "Good to see you" },
  "/app/gift": { title: "Find a Gift", sub: "AI Module 1 + 2 active" },
  "/app/recommendations": { title: "Recommendations", sub: "AI-curated just for you" },
  "/app/delivery": { title: "Delivery", sub: "AI Module 3 - Rider Assignment" },
  "/app/confirmed": { title: "Order Confirmed", sub: "Sit back and relax" },
  "/app/orders": { title: "My Orders", sub: "All your gift deliveries" },
  "/app/profile": { title: "My Profile", sub: "Account & preferences" },
};

function SidebarBody({
  navigate,
  isActive,
  visiblePortals,
  onNav,
}: {
  navigate: (path: string) => void;
  isActive: (path: string) => boolean;
  visiblePortals: typeof portals;
  onNav?: () => void;
}) {
  const go = (path: string) => {
    navigate(path);
    onNav?.();
  };

  return (
    <>
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest px-4 pb-2" style={{ fontWeight: 700 }}>
          Customer
        </p>

        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => go(item.path)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left"
              style={{ background: active ? BRAND_LIGHT : undefined }}
            >
              <item.icon
                style={{ color: active ? BRAND : "#9CA3AF", width: 18, height: 18 }}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className="text-sm flex-1" style={{ color: active ? BRAND : "#374151", fontWeight: active ? 700 : 500 }}>
                {item.label}
              </span>
              {active && <div className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND }} />}
            </button>
          );
        })}

        {visiblePortals.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest px-4 pb-2" style={{ fontWeight: 700 }}>
              Portals
            </p>
            {visiblePortals.map((portal) => (
              <button
                key={portal.path}
                onClick={() => go(portal.path)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left hover:bg-gray-50 group"
              >
                <portal.icon style={{ color: portal.color, width: 18, height: 18 }} strokeWidth={1.8} />
                <span className="text-xs text-gray-500 flex-1" style={{ fontWeight: 500 }}>{portal.label}</span>
                <ChevronRight className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        )}
      </nav>

      <div className="px-4 pb-5 shrink-0">
        <div className="rounded-xl p-3 border border-gray-100" style={{ background: "#FAFAFA" }}>
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-green-700" style={{ fontWeight: 700 }}>3 AI Systems Active</span>
          </div>
          {aiModules.map((module) => (
            <div key={module.num} className="flex items-center gap-2 py-0.5">
              <div
                className="w-4 h-4 rounded shrink-0 flex items-center justify-center text-white"
                style={{ background: module.color, fontSize: 9, fontWeight: 800 }}
              >
                {module.num}
              </div>
              <span className="text-[11px] text-gray-600 flex-1">{module.label}</span>
              <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: module.color }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authLoading, isAuthenticated, authRole, userName } = useGift();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const initials = useMemo(
    () => userName.split(" ").map((name) => name[0]).join("").slice(0, 2).toUpperCase(),
    [userName],
  );

  const isActive = (path: string) => {
    if (path === "/app/gift") {
      return (
        location.pathname === "/app/gift" ||
        location.pathname.startsWith("/app/recommendations") ||
        location.pathname === "/app/delivery" ||
        location.pathname === "/app/confirmed"
      );
    }
    return location.pathname === path;
  };

  const meta = pageTitles[location.pathname] ?? { title: "ZIPPO", sub: "Premium Gifting" };
  const visiblePortals = useMemo(
    () => portals.filter((portal) => portal.role === authRole),
    [authRole],
  );

  return (
    <div className="min-h-screen flex bg-gray-50 overflow-x-hidden">
      <aside className="hidden md:flex flex-col w-60 lg:w-64 min-h-screen bg-white border-r border-gray-100 fixed top-0 left-0 z-20 shadow-sm">
        <div className="px-5 py-5 shrink-0" style={{ background: BRAND }}>
          <ZippoLogo size="sm" light />
        </div>
        <SidebarBody navigate={navigate} isActive={isActive} visiblePortals={visiblePortals} />
      </aside>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="md:hidden fixed top-0 left-0 w-72 max-w-[85vw] min-h-screen bg-white flex flex-col shadow-2xl z-50"
            >
              <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ background: BRAND }}>
                <ZippoLogo size="sm" light />
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <SidebarBody navigate={navigate} isActive={isActive} visiblePortals={visiblePortals} onNav={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 md:ml-60 lg:ml-64 flex flex-col min-h-screen">
        <header
          className="md:hidden flex items-center gap-2 px-3 py-3 sticky top-0 z-10 shrink-0"
          style={{ background: BRAND }}
        >
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Menu className="w-4 h-4 text-white" />
          </button>
          <div className="min-w-0 flex-1 flex justify-center px-1">
            <ZippoLogo size="sm" light compact className="max-w-[150px] w-full items-center" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <Search className="w-4 h-4 text-white" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors relative">
              <Bell className="w-4 h-4 text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full border border-red-800" />
            </button>
          </div>
        </header>

        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="text-gray-900" style={{ fontWeight: 800, fontSize: 17 }}>{meta.title}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{meta.sub}</p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2 border border-gray-100 cursor-text"
              style={{ minWidth: 200 }}
            >
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-400">Search gifts...</span>
            </div>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors relative">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-400 rounded-full border-2 border-white" />
            </button>
            <button
              onClick={() => navigate("/app/profile")}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white hover:opacity-90 transition-opacity"
              style={{ background: BRAND, fontSize: 12, fontWeight: 800 }}
            >
              {initials || "ZU"}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
          <Outlet />
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around py-3 px-2 border-t border-gray-100 bg-white z-10">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex-1 min-w-0 flex flex-col items-center gap-1 py-1 rounded-xl transition-all"
              >
                <item.icon
                  style={{ color: active ? BRAND : "#9CA3AF", width: 20, height: 20 }}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                <span className="text-[11px]" style={{ color: active ? BRAND : "#9CA3AF", fontWeight: active ? 700 : 500 }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
