import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, LineChart, Line,
} from "recharts";
import {
  ShoppingBag, Package, TrendingUp, Star, MapPin, Phone,
  Plus, Search, Bell, LogOut, LayoutDashboard, Settings,
  CheckCircle2, Clock, X, Menu, ArrowLeft, Edit, Trash2,
  Store, ChevronRight, Camera, Globe, Mail, AlertCircle,
  Sparkles, Zap,
} from "lucide-react";
import { ZippoLogo } from "../components/ZippoLogo";
import { useGift } from "../context/GiftContext";
import { api } from "@/lib/api";

const COLOR = "#2563EB";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type VendorOrderRow = {
  id: string;
  product: string;
  customer: string;
  status: "pending" | "active" | "delivered";
  amount: number;
  time: string;
  occasion: string;
};

type VendorProductRow = {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: string;
  sales: number;
  category: string;
  source: "seller_catalog" | "legacy_catalog";
};

const statusCfg = {
  pending:   { label: "Pending",   color: "#D97706", bg: "#FEF3C7", icon: Clock        },
  active:    { label: "En Route",  color: "#2563EB", bg: "#EFF6FF", icon: Package      },
  delivered: { label: "Delivered", color: "#059669", bg: "#ECFDF5", icon: CheckCircle2 },
};

const productStatusCfg: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: "Active",       color: "#059669", bg: "#ECFDF5" },
  low_stock: { label: "Low Stock",    color: "#D97706", bg: "#FEF3C7" },
  out_stock: { label: "Out of Stock", color: "#DC2626", bg: "#FEF2F2" },
};

const storeCategories = [
  { id: "food",      label: "Food & Snacks",     emoji: "ðŸ±" },
  { id: "bakery",    label: "Bakery & Cakes",     emoji: "ðŸ°" },
  { id: "flowers",   label: "Flowers & Plants",   emoji: "ðŸ’" },
  { id: "hampers",   label: "Hampers & Gift Sets",emoji: "ðŸ“¦" },
  { id: "beauty",    label: "Beauty & Wellness",  emoji: "ðŸ§´" },
  { id: "lifestyle", label: "Lifestyle & Home",   emoji: "ðŸª´" },
  { id: "mixed",     label: "Mixed Gifts",        emoji: "ðŸŽ" },
];

function parseDayLabel(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return WEEK_DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
}

function formatOrderTime(value: unknown): string {
  if (!value) return "N/A";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

function toVendorOrderStatus(value: unknown): VendorOrderRow["status"] {
  const raw = String(value ?? "").toLowerCase();
  if (raw === "delivered") return "delivered";
  if (raw === "in_transit" || raw === "processing" || raw === "ready_for_pickup" || raw === "paid") {
    return "active";
  }
  return "pending";
}

type Tab = "overview" | "store" | "orders" | "products" | "analytics" | "settings";

interface StoreData {
  name: string;
  category: string;
  categoryEmoji: string;
  description: string;
  location: string;
  phone: string;
  email: string;
  website: string;
}

// â”€â”€ Sidebar nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard; needsStore?: boolean }[] = [
  { id: "overview",  label: "Overview",  icon: LayoutDashboard },
  { id: "store",     label: "My Store",  icon: Store           },
  { id: "orders",    label: "Orders",    icon: Package,        needsStore: true },
  { id: "products",  label: "Products",  icon: ShoppingBag,    needsStore: true },
  { id: "analytics", label: "Analytics", icon: TrendingUp,     needsStore: true },
  { id: "settings",  label: "Settings",  icon: Settings        },
];

function SidebarNav({
  tab, setTab, hasStore, onClose,
}: {
  tab: Tab; setTab: (t: Tab) => void; hasStore: boolean; onClose?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const locked = item.needsStore && !hasStore;
          return (
            <button
              key={item.id}
              onClick={() => { if (!locked) { setTab(item.id); onClose?.(); } }}
              disabled={locked}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-left"
              style={{ background: tab === item.id ? "#EFF6FF" : undefined, opacity: locked ? 0.4 : 1, cursor: locked ? "not-allowed" : "pointer" }}
            >
              <item.icon style={{ color: tab === item.id ? COLOR : "#9CA3AF", width: 18, height: 18 }} strokeWidth={tab === item.id ? 2.5 : 1.8} />
              <span className="text-sm flex-1" style={{ color: tab === item.id ? COLOR : "#374151", fontWeight: tab === item.id ? 700 : 500 }}>
                {item.label}
              </span>
              {locked && <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center shrink-0" title="Create a store first"><AlertCircle className="w-2.5 h-2.5 text-gray-400" /></div>}
            </button>
          );
        })}
      </nav>
      <div className="px-4 pb-5 space-y-1 shrink-0">
        <button onClick={() => { window.location.href = "/login"; }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-left">
          <LogOut style={{ color: "#9CA3AF", width: 16, height: 16 }} />
          <span className="text-sm text-gray-500">Sign Out</span>
        </button>
        <button onClick={() => { window.location.href = "/"; }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-left">
          <ArrowLeft style={{ color: "#9CA3AF", width: 16, height: 16 }} />
          <span className="text-sm text-gray-500">Back to Home</span>
        </button>
      </div>
    </>
  );
}

// â”€â”€ Store creation onboarding (step-based) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CreateStoreFlow({ onComplete }: { onComplete: (data: StoreData) => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", category: "food", description: "",
    location: "", phone: "", email: "", website: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const selectedCat = storeCategories.find(c => c.id === form.category)!;

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      onComplete({
        name:          form.name,
        category:      selectedCat.label,
        categoryEmoji: selectedCat.emoji,
        description:   form.description,
        location:      form.location,
        phone:         form.phone,
        email:         form.email,
        website:       form.website,
      });
    }, 1400);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 min-h-full">
      {/* Progress */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex items-center gap-2 mb-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                style={{ background: s <= step ? COLOR : "#E5E7EB", color: s <= step ? "white" : "#9CA3AF", fontWeight: 800 }}
              >
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span className="text-xs hidden sm:block" style={{ color: s === step ? COLOR : "#9CA3AF", fontWeight: s === step ? 700 : 400 }}>
                {s === 1 ? "Store Identity" : "Contact & Location"}
              </span>
              {s < 2 && <div className="flex-1 h-px mx-2" style={{ background: step > s ? COLOR : "#E5E7EB" }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-xl">
        {/* â”€â”€ STEP 1: Identity â”€â”€ */}
        {step === 1 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "#EFF6FF" }}>
                {selectedCat.emoji}
              </div>
              <div>
                <h2 className="text-gray-900" style={{ fontWeight: 800, fontSize: 18 }}>Create Your Store</h2>
                <p className="text-xs text-gray-400">You need a store to start selling on ZIPPO.</p>
              </div>
            </div>

            {/* Store name */}
            <div className="mb-4">
              <label className="text-xs text-gray-600 mb-1.5 block" style={{ fontWeight: 700 }}>STORE NAME *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Gordon's Market, Bea's Bibingka Hub"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="text-xs text-gray-600 mb-2 block" style={{ fontWeight: 700 }}>STORE CATEGORY *</label>
              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
                {storeCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setForm({ ...form, category: cat.id })}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: form.category === cat.id ? COLOR : "#E5E7EB",
                      background:  form.category === cat.id ? "#EFF6FF" : "white",
                    }}
                  >
                    <span className="text-lg shrink-0">{cat.emoji}</span>
                    <span className="text-xs" style={{ color: form.category === cat.id ? COLOR : "#374151", fontWeight: form.category === cat.id ? 700 : 500 }}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="text-xs text-gray-600 mb-1.5 block" style={{ fontWeight: 700 }}>STORE DESCRIPTION</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                placeholder="Tell customers what makes your store specialâ€¦"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 transition-colors resize-none"
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.name.trim()}
              className="w-full py-3.5 rounded-2xl text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: COLOR, fontWeight: 700 }}
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* â”€â”€ STEP 2: Contact & Location â”€â”€ */}
        {step === 2 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-7 shadow-sm">
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-xs text-gray-400 mb-5 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
            <h2 className="text-gray-900 mb-1" style={{ fontWeight: 800, fontSize: 18 }}>Location & Contact</h2>
            <p className="text-xs text-gray-400 mb-6">Help customers find and reach your store.</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs text-gray-600 mb-1.5 block" style={{ fontWeight: 700 }}>
                  <MapPin className="w-3 h-3 inline mr-1" />STORE ADDRESS *
                </label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Gordon's Market, Olongapo City"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1.5 block" style={{ fontWeight: 700 }}>
                    <Phone className="w-3 h-3 inline mr-1" />PHONE
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+63 912 345 6789"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1.5 block" style={{ fontWeight: 700 }}>
                    <Mail className="w-3 h-3 inline mr-1" />EMAIL
                  </label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="store@zippo.app"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1.5 block" style={{ fontWeight: 700 }}>
                  <Globe className="w-3 h-3 inline mr-1" />WEBSITE / SOCIAL (optional)
                </label>
                <input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://facebook.com/yourstore"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 transition-colors"
                />
              </div>
            </div>

            {/* Preview card */}
            <div className="rounded-2xl p-4 mb-6 border border-blue-100" style={{ background: "#EFF6FF" }}>
              <div className="text-xs text-blue-600 mb-2" style={{ fontWeight: 700 }}>STORE PREVIEW</div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: "white" }}>
                  {selectedCat.emoji}
                </div>
                <div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{form.name || "Your Store Name"}</div>
                  <div className="text-xs text-blue-500">{selectedCat.label}</div>
                  {form.location && <div className="text-[10px] text-gray-400 mt-0.5">ðŸ“ {form.location}</div>}
                </div>
                <div className="ml-auto flex">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-gray-200" />)}
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!form.location.trim() || submitting}
              className="w-full py-3.5 rounded-2xl text-white flex items-center justify-center gap-2.5 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: COLOR, fontWeight: 800, fontSize: 15 }}
            >
              {submitting ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating your storeâ€¦</>
              ) : (
                <><Store className="w-5 h-5" />Create Store & Start Selling</>
              )}
            </button>
          </div>
        )}

        {/* Info strip */}
        <div className="mt-5 flex items-start gap-2.5 px-4 py-3 rounded-2xl border border-gray-100 bg-white">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Your store will be reviewed by ZIPPO admin within 24 hours. Once approved, customers can find your store and place orders through the platform.
          </p>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ "My Store" tab content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MyStoreTab({
  store,
  onUpdate,
  totalOrders,
  activeProducts,
}: {
  store: StoreData;
  onUpdate: (s: StoreData) => void;
  totalOrders: number;
  activeProducts: number;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(store);

  const storeStats = [
    { label: "Profile Views",  value: "N/A", color: COLOR },
    { label: "Total Orders",   value: String(totalOrders), color: "#059669" },
    { label: "Avg Rating",     value: "N/A", color: "#D97706" },
    { label: "Active Products",value: String(activeProducts), color: "#7C3AED" },
  ];

  const hours = [
    { day: "Operating Hours", time: "Not configured from database", open: false },
  ];

  return (
    <div className="space-y-6">
      {/* Store header card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Cover */}
        <div className="h-28 relative" style={{ background: `linear-gradient(135deg, ${COLOR} 0%, #1D4ED8 100%)` }}>
          <button className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-white text-xs hover:bg-white/30 transition-colors" style={{ fontWeight: 600 }}>
            <Camera className="w-3 h-3" />Change Cover
          </button>
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-end gap-4 -mt-7 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-4 border-white shadow-md shrink-0" style={{ background: "#EFF6FF" }}>
              {store.categoryEmoji}
            </div>
            <div className="flex-1 pb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-gray-900" style={{ fontWeight: 800, fontSize: 18 }}>{store.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#ECFDF5", color: "#059669", fontWeight: 700 }}>âœ“ Approved</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-blue-500" style={{ fontWeight: 600 }}>{store.category}</span>
                <span className="text-gray-300">Â·</span>
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">{store.location}</span>
              </div>
            </div>
            <button onClick={() => setEditing(!editing)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-sm hover:bg-gray-50 transition-colors">
              <Edit className="w-3.5 h-3.5 text-gray-500" />
              <span style={{ color: "#374151", fontWeight: 600 }}>{editing ? "Cancel" : "Edit Store"}</span>
            </button>
          </div>

          {/* Rating row */}
          <div className="flex items-center gap-1 mb-3">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 text-gray-300" />)}
            <span className="text-xs text-gray-500 ml-1">No rating data from database</span>
          </div>

          {store.description && (
            <p className="text-sm text-gray-500 leading-relaxed">{store.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-4">
        {storeStats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
            <div className="text-2xl" style={{ color: s.color, fontWeight: 900 }}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Edit form or info display */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Store details */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-gray-900 mb-4" style={{ fontWeight: 700 }}>Store Details</h3>
          <div className="space-y-4">
            {[
              { label: "Store Name",   icon: Store,  value: form.name,     key: "name"     as const },
              { label: "Location",     icon: MapPin, value: form.location, key: "location" as const },
              { label: "Phone",        icon: Phone,  value: form.phone,    key: "phone"    as const },
              { label: "Email",        icon: Mail,   value: form.email,    key: "email"    as const },
              { label: "Website",      icon: Globe,  value: form.website,  key: "website"  as const },
            ].map((f) => (
              <div key={f.key}>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 mb-1" style={{ fontWeight: 600 }}>
                  <f.icon className="w-3 h-3" />{f.label}
                </label>
                {editing ? (
                  <input
                    value={form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 transition-colors"
                  />
                ) : (
                  <div className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{form[f.key] || <span className="text-gray-300 italic">Not set</span>}</div>
                )}
              </div>
            ))}
            {editing && (
              <button
                onClick={() => { onUpdate(form); setEditing(false); }}
                className="w-full py-2.5 rounded-xl text-white text-sm"
                style={{ background: COLOR, fontWeight: 700 }}
              >
                Save Changes
              </button>
            )}
          </div>
        </div>

        {/* Operating hours */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Operating Hours</h3>
              <button className="text-xs" style={{ color: COLOR }}>Edit</button>
            </div>
            <div className="space-y-2.5">
              {hours.map((h) => (
                <div key={h.day} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">{h.day}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: h.open ? "#ECFDF5" : "#F3F4F6", color: h.open ? "#059669" : "#6B7280", fontWeight: 700 }}>
                    {h.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Store photos placeholder */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Store Photos</h3>
              <button className="text-xs flex items-center gap-1" style={{ color: COLOR }}>
                <Plus className="w-3 h-3" />Add
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[store.categoryEmoji, "ðŸ“¸", "ðŸ“¸"].map((e, i) => (
                <div key={i} className="aspect-square rounded-xl flex items-center justify-center text-2xl border-2 border-dashed" style={{ borderColor: i === 0 ? "#E5E7EB" : "#E5E7EB", background: i === 0 ? "#EFF6FF" : "#FAFAFA" }}>
                  {i === 0 ? e : <Camera className="w-5 h-5 text-gray-300" />}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Add photos to attract more customers.</p>
          </div>
        </div>
      </div>

      {/* AI tips for store */}
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "#EFF6FF", border: "1px solid #DBEAFE" }}>
        <Zap className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs text-blue-700 mb-1" style={{ fontWeight: 700 }}>ZIPPO AI STORE TIPS</div>
          <div className="text-[11px] text-blue-600 space-y-0.5">
            <p>â€¢ Add at least 5 products to appear in Gift Intelligence recommendations.</p>
            <p>â€¢ Stores with photos get 3Ã— more profile views on average.</p>
            <p>â€¢ Respond to orders within 15 min to maintain your â­ rating.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function VendorDashboard() {
  const { numericUserId, authLoading, isAuthenticated, authRole } = useGift();
  const [hasStore, setHasStore] = useState(false);
  const [store, setStore] = useState<StoreData | null>(null);
  const [storeId, setStoreId] = useState<number | string | null>(null);
  const [tab, setTab]     = useState<Tab>("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [displayProducts, setDisplayProducts] = useState<VendorProductRow[]>([]);
  const [recentOrders, setRecentOrders] = useState<VendorOrderRow[]>([]);
  const [salesData, setSalesData] = useState(WEEK_DAYS.map((day) => ({ day, sales: 0, orders: 0 })));
  const [loadError, setLoadError] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (authRole !== "store_owner") {
      window.location.href = "/app/home";
    }
  }, [authLoading, isAuthenticated, authRole]);

  const loadVendorData = useCallback(async () => {
    if (!numericUserId) return;
    setLoadError("");
    try {
      const [stores, adminProducts, orderRows] = await Promise.all([
        api.getAdminStores(),
        api.getAdminProducts(),
        api.getStoreOwnerOrders(numericUserId),
      ]);
      const myStore = stores.find((s) => Number(s.owner_user_id) === numericUserId);
      if (!myStore) {
        setHasStore(false);
        setStoreId(null);
        setStore(null);
        setDisplayProducts([]);
        setRecentOrders([]);
        setSalesData(WEEK_DAYS.map((day) => ({ day, sales: 0, orders: 0 })));
        return;
      }

      setHasStore(true);
      setStoreId(myStore.store_id ?? null);
      setStore({
        name: String(myStore.store_name ?? "My Store"),
        category: "Mixed Gifts",
        categoryEmoji: "ðŸŽ",
        description: "",
        location: String(myStore.barangay ?? "Olongapo"),
        phone: "",
        email: "",
        website: "",
      });

      const mine = adminProducts.filter((row) => String(row.store_id ?? "") === String(myStore.store_id ?? ""));
      const productSales = new Map<string, number>();
      (orderRows ?? []).forEach((row) => {
        const key = String(row.product_id ?? "");
        if (!key) return;
        productSales.set(key, (productSales.get(key) ?? 0) + Number(row.quantity ?? 0));
      });
      setDisplayProducts(
        mine.map((row, idx) => {
          const stock = Number(row.stock ?? 0);
          return {
            id: Number(row.product_id ?? idx + 1),
            name: String(row.name ?? "Untitled Product"),
            price: Number(row.price ?? 0),
            stock,
            status: stock === 0 ? "out_stock" : stock < 8 ? "low_stock" : "active",
            sales: productSales.get(String(row.product_id ?? "")) ?? 0,
            category: String(row.category ?? "gift"),
            source: String(row.source ?? "seller_catalog") === "legacy_catalog" ? "legacy_catalog" : "seller_catalog",
          };
        }),
      );

      const mappedOrders: VendorOrderRow[] = (orderRows ?? []).map((row) => ({
        id: `ZIP-${String(row.order_id ?? row.order_item_id ?? "0")}`,
        product: String(row.product_name ?? "Order Item"),
        customer: `Buyer #${String(row.buyer_user_id ?? "N/A")}`,
        status: toVendorOrderStatus(row.status),
        amount: Number(row.line_total ?? row.total_price ?? 0),
        time: formatOrderTime(row.created_at),
        occasion: String(row.occasion ?? "General"),
      }));
      setRecentOrders(mappedOrders);

      const orderCountsByDay = new Map<string, number>(WEEK_DAYS.map((day) => [day, 0]));
      const salesByDay = new Map<string, number>(WEEK_DAYS.map((day) => [day, 0]));
      (orderRows ?? []).forEach((row) => {
        const day = parseDayLabel(row.created_at);
        if (!day) return;
        orderCountsByDay.set(day, (orderCountsByDay.get(day) ?? 0) + 1);
        salesByDay.set(day, (salesByDay.get(day) ?? 0) + Number(row.line_total ?? row.total_price ?? 0));
      });
      setSalesData(
        WEEK_DAYS.map((day) => ({
          day,
          sales: Number((salesByDay.get(day) ?? 0).toFixed(2)),
          orders: orderCountsByDay.get(day) ?? 0,
        })),
      );
    } catch {
      setLoadError("Failed to load vendor data. Please try again.");
      setDisplayProducts([]);
      setRecentOrders([]);
      setSalesData(WEEK_DAYS.map((day) => ({ day, sales: 0, orders: 0 })));
    }
  }, [numericUserId]);

  useEffect(() => {
    void loadVendorData();
  }, [loadVendorData]);

  const handleStoreCreated = async (data: StoreData) => {
    setStore(data);
    setHasStore(true);
    setTab("store");
    try {
      await api.createStore({
        owner_user_id: numericUserId || 1,
        store_name: data.name,
        description: data.description,
        barangay: data.location.split(",")[0]?.trim() || "Olongapo",
        is_active: true,
      });
      await loadVendorData();
    } catch {
      // Keep optimistic UI update.
    }
  };

  const handleStoreUpdated = async (updated: StoreData) => {
    setStore(updated);
    if (!storeId) return;
    try {
      await api.updateStore(storeId, {
        owner_user_id: numericUserId || 1,
        store_name: updated.name,
        description: updated.description,
        barangay: updated.location.split(",")[0]?.trim() || "Olongapo",
        is_active: true,
      });
      await loadVendorData();
    } catch {
      // Keep UI state even when backend update fails.
    }
  };

  const handleAddProduct = async () => {
    if (!storeId) return;
    const name = window.prompt("Product name");
    if (!name) return;
    const priceInput = window.prompt("Price in PHP", "100");
    if (!priceInput) return;
    const stockInput = window.prompt("Stock quantity", "10");
    if (!stockInput) return;
    const price = Number(priceInput);
    const stock = Number(stockInput);
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) {
      setActionMessage("Price and stock must be valid positive numbers.");
      return;
    }
    try {
      await api.createStoreProduct({
        owner_user_id: numericUserId || 1,
        store_id: Number(storeId),
        name,
        description: "",
        category: "gift",
        price,
        stock,
        occasion_tags: [],
        recipient_tags: [],
        tags: [],
        local_vendor: true,
      });
      setActionMessage(`Added "${name}" to your marketplace product list.`);
      await loadVendorData();
    } catch {
      setActionMessage("Failed to add product. Please try again.");
    }
  };

  const handleEditProduct = async (product: VendorProductRow) => {
    if (product.source === "legacy_catalog") {
      setActionMessage("Legacy synced products are read-only. Add a new vendor product to test edit actions.");
      return;
    }
    if (!storeId) return;
    const nextName = window.prompt("Product name", product.name);
    if (!nextName) return;
    const nextPriceInput = window.prompt("Price in PHP", String(product.price));
    if (!nextPriceInput) return;
    const nextStockInput = window.prompt("Stock quantity", String(product.stock));
    if (!nextStockInput) return;
    const nextPrice = Number(nextPriceInput);
    const nextStock = Number(nextStockInput);
    if (!Number.isFinite(nextPrice) || nextPrice < 0 || !Number.isFinite(nextStock) || nextStock < 0) {
      setActionMessage("Price and stock must be valid positive numbers.");
      return;
    }
    try {
      await api.updateStoreProduct(product.id, {
        owner_user_id: numericUserId || 1,
        store_id: Number(storeId),
        name: nextName,
        description: "",
        category: product.category,
        price: nextPrice,
        stock: nextStock,
        occasion_tags: [],
        recipient_tags: [],
        tags: [],
        local_vendor: true,
      });
      setActionMessage(`Updated "${nextName}".`);
      await loadVendorData();
    } catch {
      setActionMessage("Failed to update product. Please try again.");
    }
  };

  const handleDeleteProduct = async (product: VendorProductRow) => {
    if (product.source === "legacy_catalog") {
      setActionMessage("Legacy synced products are read-only. Add a new vendor product to test delete actions.");
      return;
    }
    try {
      await api.deleteStoreProduct(product.id);
      setActionMessage(`Deleted "${product.name}".`);
      await loadVendorData();
    } catch {
      setActionMessage("Failed to delete product. Please try again.");
    }
  };

  const kpis = [
    {
      label: "Revenue (Week)",
      value: `PHP ${salesData.reduce((sum, row) => sum + row.sales, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      delta: "",
      color: COLOR,
      icon: TrendingUp,
    },
    {
      label: "Orders (Week)",
      value: String(salesData.reduce((sum, row) => sum + row.orders, 0)),
      delta: "",
      color: "#059669",
      icon: Package,
    },
    {
      label: "Products Listed",
      value: String(displayProducts.length),
      delta: "",
      color: "#7C3AED",
      icon: ShoppingBag,
    },
    {
      label: "Avg Rating",
      value: "N/A",
      delta: "",
      color: "#D97706",
      icon: Star,
    },
  ];

  const filteredRecentOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();
    if (!query) return recentOrders;
    return recentOrders.filter((order) =>
      order.id.toLowerCase().includes(query)
      || order.product.toLowerCase().includes(query)
      || order.customer.toLowerCase().includes(query)
      || order.occasion.toLowerCase().includes(query),
    );
  }, [orderSearch, recentOrders]);

  const handleExportOrders = () => {
    if (filteredRecentOrders.length === 0) {
      setActionMessage("There are no visible orders to export.");
      return;
    }
    const rows = [
      ["Order ID", "Product", "Customer", "Occasion", "Status", "Amount", "Time"],
      ...filteredRecentOrders.map((order) => [
        order.id,
        order.product,
        order.customer,
        order.occasion,
        order.status,
        String(order.amount),
        order.time,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "zippo-vendor-orders.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setActionMessage("Exported the current vendor order list.");
  };

  const storeName = store?.name ?? (hasStore ? "My Store" : "â€”");

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{ background: "#F0F4FF" }}>

      {/* â”€â”€ Desktop sidebar â”€â”€ */}
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-blue-100 fixed top-0 left-0 z-20 shadow-sm">
        <div className="px-5 py-5 shrink-0" style={{ background: COLOR }}>
          <ZippoLogo size="sm" light />
          <div className="mt-2 text-blue-200 text-xs" style={{ fontWeight: 600 }}>Vendor Portal</div>
        </div>

        {/* Store badge in sidebar */}
        {!hasStore ? (
          <div className="mx-3 mt-3 rounded-xl p-3 border border-dashed border-blue-200" style={{ background: "#EFF6FF" }}>
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] text-blue-600" style={{ fontWeight: 700 }}>No Store Yet</span>
            </div>
            <p className="text-[10px] text-blue-400">Create a store to unlock selling features.</p>
          </div>
        ) : (
          <div className="mx-3 mt-3 rounded-xl p-3 border border-blue-100" style={{ background: "#EFF6FF" }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base shrink-0" style={{ background: "white" }}>{store!.categoryEmoji}</div>
              <div className="min-w-0">
                <div className="text-xs text-gray-900 truncate" style={{ fontWeight: 700 }}>{store!.name}</div>
                <div className="text-[10px] text-green-600" style={{ fontWeight: 600 }}>âœ“ Store Active</div>
              </div>
            </div>
          </div>
        )}

        <SidebarNav tab={tab} setTab={setTab} hasStore={hasStore} />
      </aside>

      {/* â”€â”€ Mobile drawer â”€â”€ */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 w-64 min-h-screen bg-white flex flex-col shadow-2xl">
            <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ background: COLOR }}>
              <div>
                <ZippoLogo size="sm" light />
                <div className="text-blue-200 text-xs mt-1" style={{ fontWeight: 600 }}>Vendor Portal</div>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            {!hasStore && (
              <div className="mx-3 mt-3 rounded-xl p-3 border border-dashed border-blue-200" style={{ background: "#EFF6FF" }}>
                <div className="flex items-center gap-2 mb-1"><Store className="w-3.5 h-3.5 text-blue-400" /><span className="text-[11px] text-blue-600" style={{ fontWeight: 700 }}>No Store Yet</span></div>
                <p className="text-[10px] text-blue-400">Create a store to unlock selling features.</p>
              </div>
            )}
            <SidebarNav tab={tab} setTab={setTab} hasStore={hasStore} onClose={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* â”€â”€ Main area â”€â”€ */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="flex items-center justify-between px-5 md:px-8 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 border" onClick={() => setDrawerOpen(true)}>
              <Menu className="w-4 h-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-gray-900" style={{ fontWeight: 800, fontSize: 16 }}>
                {!hasStore ? "Vendor Portal" : navItems.find(n => n.id === tab)?.label}
              </h1>
              <p className="text-xs text-gray-400">
                {!hasStore ? "Set up your store to start selling" : `${storeName} Â· Vendor #GOM-042`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hasStore ? (
              <button
                onClick={() => setTab("overview")}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm"
                style={{ background: COLOR, fontWeight: 700 }}
              >
                <Store className="w-4 h-4" />Create Store
              </button>
            ) : (
              <button className="hidden md:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm text-gray-400">Searchâ€¦</span>
              </button>
            )}
            <button className="w-8 h-8 rounded-xl border border-gray-100 flex items-center justify-center relative">
              <Bell className="w-4 h-4 text-gray-600" />
              {!hasStore && <span className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full" />}
            </button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs" style={{ background: hasStore ? COLOR : "#9CA3AF", fontWeight: 800 }}>
              {hasStore ? (store?.name[0] ?? "V") : "V"}
            </div>
          </div>
        </header>

        {loadError && (
          <div className="px-5 md:px-8 pt-4">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
          </div>
        )}
        {actionMessage && (
          <div className="px-5 md:px-8 pt-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm" style={{ color: COLOR }}>
              {actionMessage}
            </div>
          </div>
        )}

        {/* â”€â”€ Content area â”€â”€ */}
        {!hasStore ? (
          /* â”€â”€ No store: creation flow â”€â”€ */
          <CreateStoreFlow onComplete={handleStoreCreated} />
        ) : (
          <main className="flex-1 overflow-y-auto p-5 md:p-8">

            {/* â”€â”€ MY STORE â”€â”€ */}
            {tab === "store" && store && (
              <MyStoreTab
                store={store}
                onUpdate={handleStoreUpdated}
                totalOrders={recentOrders.length}
                activeProducts={displayProducts.filter((p) => p.stock > 0).length}
              />
            )}

            {/* â”€â”€ OVERVIEW â”€â”€ */}
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-4">
                  {kpis.map((kpi) => (
                    <div key={kpi.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                          <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                        </div>
                        {kpi.delta && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F0FDF4", color: "#059669", fontWeight: 700 }}>{kpi.delta}</span>
                        )}
                      </div>
                      <div className="text-2xl" style={{ color: kpi.color, fontWeight: 900 }}>{kpi.value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{kpi.label}</div>
                    </div>
                  ))}
                </div>

                {/* Store info banner */}
                <div className="rounded-2xl p-4 flex items-center gap-4 border border-blue-100" style={{ background: "#EFF6FF" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: "white" }}>{store?.categoryEmoji}</div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{store?.name}</div>
                    <div className="text-xs text-blue-500">{store?.category} Â· {store?.location}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">No rating data from database</div>
                  </div>
                  <button onClick={() => setTab("store")} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl" style={{ color: COLOR, fontWeight: 700 }}>
                    Manage Store <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Weekly Sales</h3>
                        <p className="text-xs text-gray-400">Revenue from store-owner orders</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl" style={{ color: COLOR, fontWeight: 900 }}>
                          PHP {salesData.reduce((sum, row) => sum + row.sales, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-green-600" style={{ fontWeight: 600 }}>
                          {salesData.reduce((sum, row) => sum + row.orders, 0)} order items this week
                        </div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={salesData} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `PHP ${v}`} />
                        <Tooltip formatter={(v: number) => [`PHP ${v.toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
                        <Bar dataKey="sales" fill={COLOR} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Recent Orders</h3>
                      <button onClick={() => setTab("orders")} className="text-xs" style={{ color: COLOR }}>View all</button>
                    </div>
                    <div className="space-y-3">
                      {recentOrders.length === 0 ? (
                        <div className="text-sm text-gray-400 py-4">No store-owner orders found in the database yet.</div>
                      ) : (
                        recentOrders.slice(0, 4).map((order) => {
                          const cfg = statusCfg[order.status as keyof typeof statusCfg];
                          return (
                            <div key={order.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-900 truncate" style={{ fontWeight: 600 }}>{order.product}</div>
                                <div className="text-[10px] text-gray-400">{order.customer} - {order.time}</div>
                              </div>
                              <div>
                                <div className="text-xs" style={{ color: COLOR, fontWeight: 700 }}>PHP {order.amount.toLocaleString()}</div>
                                <div className="text-[10px] px-1.5 py-0.5 rounded-full text-center mt-0.5" style={{ background: cfg.bg, color: cfg.color, fontWeight: 600 }}>{cfg.label}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900" style={{ fontWeight: 700 }}>Top Products</h3>
                    <button onClick={() => setTab("products")} className="text-xs" style={{ color: COLOR }}>Manage</button>
                  </div>
                  <div className="space-y-3">
                    {displayProducts.slice(0, 3).map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shrink-0" style={{ background: COLOR, fontWeight: 800 }}>#{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{p.name}</div>
                          <div className="h-1.5 rounded-full bg-gray-100 mt-1">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, p.sales * 10)}%`, background: COLOR }} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm" style={{ color: COLOR, fontWeight: 800 }}>{p.sales} sold</div>
                          <div className="text-xs text-gray-400">PHP {p.price} each</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* â”€â”€ ORDERS â”€â”€ */}
            {tab === "orders" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      value={orderSearch}
                      onChange={(event) => setOrderSearch(event.target.value)}
                      className="flex-1 text-sm outline-none bg-transparent text-gray-700"
                      placeholder="Search orders..."
                    />
                  </div>
                  <button
                    onClick={handleExportOrders}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm"
                    style={{ background: COLOR, fontWeight: 700 }}
                  >
                    <Plus className="w-4 h-4" />Export
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="md:hidden p-4 space-y-3">
                    {filteredRecentOrders.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">
                        {recentOrders.length === 0 ? "No order rows found in Supabase for this store owner yet." : "No orders match that search."}
                      </div>
                    ) : (
                      filteredRecentOrders.map((order) => {
                        const cfg = statusCfg[order.status as keyof typeof statusCfg];
                        return (
                          <div key={order.id} className="rounded-xl border border-gray-100 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs text-gray-500">{order.id}</span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color, fontWeight: 700 }}>
                                {cfg.label}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-900" style={{ fontWeight: 700 }}>{order.product}</div>
                            <div className="mt-1 text-xs text-gray-500">{order.customer} - {order.occasion}</div>
                            <div className="mt-1 text-xs text-gray-400">{order.time}</div>
                            <div className="mt-2 text-sm" style={{ color: COLOR, fontWeight: 800 }}>
                              PHP {order.amount.toLocaleString()}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E0E7FF" }}>
                          {["Order", "Product", "Customer", "Occasion", "Status", "Amount", "Time"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider" style={{ color: COLOR, fontWeight: 700 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecentOrders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                              {recentOrders.length === 0 ? "No order rows found in Supabase for this store owner yet." : "No orders match that search."}
                            </td>
                          </tr>
                        ) : (
                          filteredRecentOrders.map((order) => {
                            const cfg = statusCfg[order.status as keyof typeof statusCfg];
                            const Icon = cfg.icon;
                            return (
                              <tr key={order.id} className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors">
                                <td className="px-4 py-3.5"><span className="font-mono text-xs text-gray-500">{order.id}</span></td>
                                <td className="px-4 py-3.5"><span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{order.product}</span></td>
                                <td className="px-4 py-3.5"><span className="text-sm text-gray-600">{order.customer}</span></td>
                                <td className="px-4 py-3.5"><span className="text-xs text-gray-500">{order.occasion}</span></td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full" style={{ background: cfg.bg }}>
                                    <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                                    <span className="text-[11px]" style={{ color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5"><span style={{ color: COLOR, fontWeight: 800 }}>PHP {order.amount.toLocaleString()}</span></td>
                                <td className="px-4 py-3.5"><span className="text-xs text-gray-400">{order.time}</span></td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* â”€â”€ PRODUCTS â”€â”€ */}
            {tab === "products" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-gray-900" style={{ fontWeight: 800 }}>Products Â· {store?.name}</h2>
                  <button onClick={handleAddProduct} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm" style={{ background: COLOR, fontWeight: 700 }}>
                    <Plus className="w-4 h-4" />Add Product
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="md:hidden p-4 space-y-3">
                    {displayProducts.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">No products listed yet.</div>
                    ) : (
                      displayProducts.map((p) => {
                        const scfg = productStatusCfg[p.status];
                        return (
                          <div key={p.id} className="rounded-xl border border-gray-100 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{p.name}</div>
                                <div className="text-xs text-gray-500 mt-1">{p.category}</div>
                              </div>
                              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: scfg.bg, color: scfg.color, fontWeight: 700 }}>
                                {scfg.label}
                              </span>
                            </div>
                            <div className="mt-2 grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 text-xs text-gray-600">
                              <div>Price: PHP {p.price}</div>
                              <div>Stock: {p.stock}</div>
                              <div>Sales: {p.sales}</div>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <button
                                onClick={() => handleEditProduct(p)}
                                className="flex-1 h-8 rounded-lg border border-blue-100 text-blue-600 text-xs flex items-center justify-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p)}
                                className="flex-1 h-8 rounded-lg border border-red-100 text-red-500 text-xs flex items-center justify-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-[640px]">
                      <thead>
                        <tr style={{ background: "#F8FAFF", borderBottom: "1px solid #E0E7FF" }}>
                          {["Product", "Category", "Price", "Stock", "Sales", "Status", "Actions"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-[11px] uppercase tracking-wider" style={{ color: COLOR, fontWeight: 700 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayProducts.map((p) => {
                          const scfg = productStatusCfg[p.status];
                          return (
                            <tr key={p.id} className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors">
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: "#EFF6FF" }}>{store?.categoryEmoji ?? "ðŸ±"}</div>
                                  <span className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{p.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4"><span className="text-xs text-gray-500">{p.category}</span></td>
                              <td className="px-4 py-4"><span style={{ color: COLOR, fontWeight: 800 }}>PHP {p.price}</span></td>
                              <td className="px-4 py-4">
                                <span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{p.stock}</span>
                                <span className="text-xs text-gray-400 ml-1">units</span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-16 rounded-full bg-gray-100">
                                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, p.sales * 10)}%`, background: COLOR }} />
                                  </div>
                                  <span className="text-xs text-gray-500">{p.sales}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: scfg.bg, color: scfg.color, fontWeight: 700 }}>{scfg.label}</span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEditProduct(p)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-50 transition-colors"
                                  >
                                    <Edit className="w-3.5 h-3.5" style={{ color: COLOR }} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* â”€â”€ ANALYTICS â”€â”€ */}
            {tab === "analytics" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total Revenue",
                      value: `PHP ${salesData.reduce((sum, row) => sum + row.sales, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                      color: COLOR,
                    },
                    {
                      label: "Total Orders",
                      value: String(recentOrders.length),
                      color: "#059669",
                    },
                    {
                      label: "Avg Order Value",
                      value: recentOrders.length > 0
                        ? `PHP ${(recentOrders.reduce((sum, row) => sum + row.amount, 0) / recentOrders.length).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                        : "N/A",
                      color: "#7C3AED",
                    },
                    {
                      label: "Return Rate",
                      value: "N/A",
                      color: "#D97706",
                    },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100">
                      <div className="text-2xl" style={{ color: s.color, fontWeight: 900 }}>{s.value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 mb-4" style={{ fontWeight: 700 }}>Daily Orders (This Week)</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
                      <Line dataKey="orders" stroke={COLOR} strokeWidth={2.5} dot={{ fill: COLOR, r: 4 }} name="Orders" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* â”€â”€ SETTINGS â”€â”€ */}
            {tab === "settings" && (
              <div className="max-w-2xl space-y-5">
                {[
                  { title: "Store Information", fields: [{ l: "Store Name", v: store?.name ?? "" }, { l: "Category", v: store?.category ?? "" }, { l: "Location", v: store?.location ?? "" }] },
                  { title: "Contact Details",   fields: [{ l: "Email", v: store?.email ?? "" }, { l: "Phone", v: store?.phone ?? "" }] },
                ].map((section) => (
                  <div key={section.title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h3 className="text-gray-900 mb-4" style={{ fontWeight: 700 }}>{section.title}</h3>
                    <div className="space-y-3">
                      {section.fields.map((f) => (
                        <div key={f.l}>
                          <label className="text-xs text-gray-500 mb-1 block" style={{ fontWeight: 600 }}>{f.l}</label>
                          <input defaultValue={f.v} className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 transition-colors" />
                        </div>
                      ))}
                    </div>
                    <button className="mt-4 px-5 py-2 rounded-xl text-white text-sm" style={{ background: COLOR, fontWeight: 700 }}>Save Changes</button>
                  </div>
                ))}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="text-gray-900 mb-4" style={{ fontWeight: 700 }}>Danger Zone</h3>
                  <button className="px-5 py-2 rounded-xl text-red-600 border border-red-200 text-sm hover:bg-red-50 transition-colors" style={{ fontWeight: 700 }}>
                    Deactivate Store
                  </button>
                </div>
              </div>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
