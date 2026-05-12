import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  User, MapPin, Bell, Shield, HelpCircle, LogOut,
  ChevronRight, Star, Package, Heart, Edit2,
  TrendingUp, Gift, Brain, Sparkles, Route,
} from "lucide-react";
import { useGift } from "../context/GiftContext";
import { api } from "@/lib/api";

const BRAND = "#8B1520";

const menuSections = [
  {
    section: "Account",
    items: [
      { icon: User, label: "Personal Information", sub: "Name, email, phone" },
      { icon: MapPin, label: "Saved Addresses", sub: "2 addresses saved" },
      { icon: Bell, label: "Notifications", sub: "Push, email, SMS" },
    ],
  },
  {
    section: "Preferences",
    items: [
      { icon: Heart, label: "Saved Gift Ideas", sub: "12 items in wishlist" },
      { icon: Star, label: "Favorite Vendors", sub: "5 vendors followed" },
    ],
  },
  {
    section: "Support",
    items: [
      { icon: Shield, label: "Privacy & Security", sub: "Data & permissions" },
      { icon: HelpCircle, label: "Help Center", sub: "FAQs & contact support" },
    ],
  },
];

const aiInsights = [
  { icon: Brain, label: "Gift Intelligence", detail: "Learned 8 preferences", color: "#2563EB", bg: "#EFF6FF" },
  { icon: Sparkles, label: "Personalizer", detail: "95% avg match score", color: "#7C3AED", bg: "#F5F3FF" },
  { icon: Route, label: "Delivery Opt.", detail: "All deliveries on time", color: "#059669", bg: "#ECFDF5" },
];

interface ProfileMeta {
  location: string;
  email: string;
  phone: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { userName, numericUserId, signOut, setUserName, orderHistory } = useGift();
  const [meta, setMeta] = useState<ProfileMeta>({
    location: "Olongapo City, Zambales",
    email: "user@zippo.app",
    phone: "Not set",
  });

  useEffect(() => {
    if (!numericUserId) return;
    const loadProfile = async () => {
      try {
        const profile = await api.getBuyerProfile(numericUserId);
        if (!profile.exists) return;
        const raw = profile.profile ?? {};
        const fullName = typeof raw.full_name === "string" ? raw.full_name : "";
        const email = typeof raw.email === "string" ? raw.email : "";
        const barangay = typeof raw.barangay === "string" ? raw.barangay : "";
        const address = typeof raw.address_line === "string" ? raw.address_line : "";
        const phone = typeof raw.phone === "string" ? raw.phone : "";

        if (fullName.trim()) setUserName(fullName.trim());
        setMeta({
          location: [barangay, address].filter(Boolean).join(", ") || "Olongapo City, Zambales",
          email: email || "user@zippo.app",
          phone: phone || "Not set",
        });
      } catch {
        // Keep UI fallback values when profile fetch fails.
      }
    };

    void loadProfile();
  }, [numericUserId, setUserName]);

  const initials = useMemo(() => userName.split(" ").map((n) => n[0]).join("").slice(0, 2), [userName]);
  const totalSpent = useMemo(() => orderHistory.reduce((sum, row) => sum + row.total, 0), [orderHistory]);
  const profileStats = useMemo(
    () => [
      { value: String(orderHistory.length || 3), label: "Orders" },
      { value: String(orderHistory.length || 12), label: "Gifts Sent" },
      { value: `₱${(totalSpent || 1079).toLocaleString()}`, label: "Total Spent" },
    ],
    [orderHistory.length, totalSpent],
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div style={{ background: "#FAFAFA" }}>
      <div className="flex flex-col md:flex-row md:items-start">
        <div className="md:w-72 lg:w-80 shrink-0 md:border-r md:border-gray-100 md:min-h-screen bg-white">
          <div className="px-5 pt-6 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white" style={{ background: BRAND, fontSize: 22, fontWeight: 800 }}>
                  {initials}
                </div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center" style={{ borderColor: BRAND }}>
                  <Edit2 className="w-2.5 h-2.5" style={{ color: BRAND }} />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-gray-900" style={{ fontWeight: 800, fontSize: 18 }}>{userName}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-400">{meta.location}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3 h-3 text-yellow-400 fill-yellow-400" />)}
                  <span className="text-xs text-gray-500 ml-1">Verified User</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-5">
              {profileStats.map((stat) => (
                <div key={stat.label} className="rounded-xl p-3 text-center border border-gray-100 bg-white">
                  <div className="text-lg" style={{ color: BRAND, fontWeight: 800 }}>{stat.value}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-xs text-gray-900 mb-3" style={{ fontWeight: 700 }}>AI PERSONALIZATION</div>
            <div className="space-y-2">
              {aiInsights.map((m) => (
                <div key={m.label} className="flex items-center gap-3 rounded-xl p-3 border" style={{ background: m.bg, borderColor: `${m.color}20` }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: m.color }}>
                    <m.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs" style={{ color: m.color, fontWeight: 700 }}>{m.label}</div>
                    <div className="text-[10px] text-gray-500">{m.detail}</div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: m.color }} />
                </div>
              ))}
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="text-xs text-gray-900 mb-2" style={{ fontWeight: 700 }}>YOUR GIFTING PERSONA</div>
            <div className="flex flex-wrap gap-1.5">
              {["Birthday Pro 🎂", "Food Gifter 🍱", "Local Fan 📍", "Morning Shopper 🌅"].map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50" style={{ color: "#7C3AED", fontWeight: 600 }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 px-5 py-5 space-y-5">
          <div className="hidden md:grid grid-cols-3 gap-3 mb-2">
            {[
              { icon: Gift, label: "Send a Gift", path: "/app/gift", bg: "#FFF1F2", color: BRAND },
              { icon: Package, label: "My Orders", path: "/app/orders", bg: "#EFF6FF", color: "#2563EB" },
              { icon: TrendingUp, label: "Analytics", path: "/app/profile", bg: "#F5F3FF", color: "#7C3AED" },
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:shadow-sm transition-all"
                style={{ background: a.bg }}
              >
                <a.icon className="w-5 h-5" style={{ color: a.color }} />
                <span className="text-xs" style={{ color: a.color, fontWeight: 700 }}>{a.label}</span>
              </button>
            ))}
          </div>

          {menuSections.map((section) => (
            <div key={section.section}>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2" style={{ fontWeight: 700 }}>
                {section.section}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {section.items.map((item) => (
                  <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#FFF1F2" }}>
                      <item.icon className="w-4 h-4" style={{ color: BRAND }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900" style={{ fontWeight: 600 }}>{item.label}</div>
                      <div className="text-xs text-gray-400">{item.sub}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="text-xs text-gray-500 mb-1" style={{ fontWeight: 600 }}>Account Email</div>
            <div className="text-sm text-gray-800" style={{ fontWeight: 700 }}>{meta.email}</div>
            <div className="text-xs text-gray-500 mt-3 mb-1" style={{ fontWeight: 600 }}>Phone</div>
            <div className="text-sm text-gray-800" style={{ fontWeight: 700 }}>{meta.phone}</div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" style={{ color: BRAND }} />
            </div>
            <span className="text-sm" style={{ color: BRAND, fontWeight: 700 }}>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
