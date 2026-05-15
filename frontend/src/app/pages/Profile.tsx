import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  User, MapPin, Bell, Shield, HelpCircle, LogOut,
  ChevronRight, Star, Package, Heart, Edit2,
  TrendingUp, Gift, Brain, Sparkles, Route,
} from "lucide-react";
import { useGift } from "../context/GiftContext";
import { api } from "@/lib/api";
import { updateCurrentUserProfile } from "@/lib/auth";

const BRAND = "#8B1520";

const NOTIFICATION_PREFS_KEY = "zippo.profile.notifications";

const menuSections = [
  {
    section: "Account",
    items: [
      { icon: User, label: "Personal Information", sub: "Name, email, phone", action: "personal_info" },
      { icon: MapPin, label: "Saved Addresses", sub: "Delivery location details", action: "saved_addresses" },
      { icon: Bell, label: "Notifications", sub: "Push, email, SMS", action: "notifications" },
    ],
  },
  {
    section: "Preferences",
    items: [
      { icon: Heart, label: "Saved Gift Ideas", sub: "Open recommendations", action: "saved_gifts" },
      { icon: Star, label: "Favorite Vendors", sub: "Browse your top stores", action: "favorite_vendors" },
    ],
  },
  {
    section: "Support",
    items: [
      { icon: Shield, label: "Privacy & Security", sub: "Password recovery & access", action: "privacy_security" },
      { icon: HelpCircle, label: "Help Center", sub: "FAQs & contact support", action: "help_center" },
    ],
  },
] as const;

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

interface ProfileDraft {
  fullName: string;
  email: string;
  phone: string;
  barangay: string;
  addressLine: string;
}

type MenuAction =
  | "personal_info"
  | "saved_addresses"
  | "notifications"
  | "saved_gifts"
  | "favorite_vendors"
  | "privacy_security"
  | "help_center";

export default function Profile() {
  const navigate = useNavigate();
  const { userName, numericUserId, signOut, setUserName, orderHistory, authRole } = useGift();
  const [meta, setMeta] = useState<ProfileMeta>({
    location: "Olongapo City, Zambales",
    email: "user@zippo.app",
    phone: "Not set",
  });
  const [draft, setDraft] = useState<ProfileDraft>({
    fullName: userName,
    email: "user@zippo.app",
    phone: "",
    barangay: "",
    addressLine: "",
  });
  const [savedDraft, setSavedDraft] = useState<ProfileDraft>({
    fullName: userName,
    email: "user@zippo.app",
    phone: "",
    barangay: "",
    addressLine: "",
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [notificationMode, setNotificationMode] = useState("Push, email, SMS");

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
        const nextDraft = {
          fullName: fullName.trim() || userName,
          email: email || "user@zippo.app",
          phone: phone || "",
          barangay,
          addressLine: address,
        };
        setDraft(nextDraft);
        setSavedDraft(nextDraft);
      } catch {
        // Keep UI fallback values when profile fetch fails.
      }
    };

    void loadProfile();
  }, [numericUserId, setUserName, userName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (stored?.trim()) {
      setNotificationMode(stored);
    }
  }, []);

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

  const setMessage = (message: string) => {
    setActionMessage(message);
  };

  const updateDraft = (field: keyof ProfileDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async () => {
    if (!numericUserId) {
      setMessage("Sign in again before updating your profile.");
      return;
    }
    const fullName = draft.fullName.trim();
    const email = draft.email.trim();
    const phone = draft.phone.trim();
    const barangay = draft.barangay.trim();
    const addressLine = draft.addressLine.trim();

    if (!fullName || !email) {
      setMessage("Full name and email are required.");
      return;
    }

    setSaving(true);
    setActionMessage("");
    try {
      await updateCurrentUserProfile({
        full_name: fullName,
        email,
        phone,
        barangay,
        address_line: addressLine,
      });
      await api.saveBuyerProfile({
        user_id: numericUserId,
        role: authRole === "guest" ? "buyer" : authRole,
        full_name: fullName,
        email,
        phone: phone || null,
        barangay: barangay || null,
        address_line: addressLine || null,
      });
      setUserName(fullName);
      setMeta({
        location: [barangay, addressLine].filter(Boolean).join(", ") || "Olongapo City, Zambales",
        email,
        phone: phone || "Not set",
      });
      setSavedDraft({
        fullName,
        email,
        phone,
        barangay,
        addressLine,
      });
      setEditing(false);
      setMessage("Profile changes saved.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save profile.";
      setMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const handleMenuAction = async (action: MenuAction) => {
    switch (action) {
      case "personal_info":
        setEditing(true);
        setMessage("You can edit your name, email, phone, and delivery details below.");
        break;
      case "saved_addresses":
        setEditing(true);
        setMessage("Update your barangay and delivery address in the account details card below.");
        break;
      case "notifications": {
        const nextMode = notificationMode === "Push, email, SMS" ? "Email only" : "Push, email, SMS";
        setNotificationMode(nextMode);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(NOTIFICATION_PREFS_KEY, nextMode);
        }
        setMessage(`Notification preference updated to ${nextMode}.`);
        break;
      }
      case "saved_gifts":
        navigate("/app/recommendations");
        break;
      case "favorite_vendors":
        navigate("/app/home");
        break;
      case "privacy_security":
        try {
          await api.requestPasswordRecovery({ email: draft.email.trim() || meta.email });
          setMessage("Password recovery email sent. Check your inbox for the reset link.");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Could not start password recovery.";
          setMessage(message);
        }
        break;
      case "help_center":
        if (typeof window !== "undefined") {
          window.location.href = `mailto:support@zippo.app?subject=${encodeURIComponent("ZIPPO Help Request")}`;
        }
        setMessage("Opening your email app so you can contact support.");
        break;
    }
  };

  return (
    <div className="overflow-x-hidden" style={{ background: "#FAFAFA" }}>
      <div className="flex flex-col md:flex-row md:items-start">
        <div className="md:w-72 lg:w-80 shrink-0 md:border-r md:border-gray-100 md:min-h-screen bg-white">
          <div className="px-5 pt-6 pb-5 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white" style={{ background: BRAND, fontSize: 22, fontWeight: 800 }}>
                  {initials}
                </div>
                <button
                  onClick={() => {
                    setEditing(true);
                    setMessage("Profile editing is now enabled below.");
                  }}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center"
                  style={{ borderColor: BRAND }}
                >
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-5">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
            {[
              { icon: Gift, label: "Send a Gift", path: "/app/gift", bg: "#FFF1F2", color: BRAND },
              { icon: Package, label: "My Orders", path: "/app/orders", bg: "#EFF6FF", color: "#2563EB" },
              { icon: TrendingUp, label: "Edit Profile", path: "", bg: "#F5F3FF", color: "#7C3AED" },
            ].map((a) => (
              <button
                key={a.label}
                onClick={() => {
                  if (a.path) {
                    navigate(a.path);
                    return;
                  }
                  setEditing(true);
                  setMessage("Your profile details are ready to edit below.");
                }}
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
                  <button
                    key={item.label}
                    onClick={() => void handleMenuAction(item.action)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
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

          {actionMessage && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {actionMessage}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-gray-900" style={{ fontWeight: 800 }}>Account Details</div>
                <div className="text-xs text-gray-500 mt-0.5">Keep your buyer profile and auth profile in sync.</div>
              </div>
              {!editing && (
                <button
                  onClick={() => {
                    setEditing(true);
                    setMessage("Editing enabled. Update any fields and save when ready.");
                  }}
                  className="px-3 py-2 rounded-xl text-sm text-white"
                  style={{ background: BRAND, fontWeight: 700 }}
                >
                  Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <div className="text-xs text-gray-500 mb-1" style={{ fontWeight: 600 }}>Full Name</div>
                <input
                  value={draft.fullName}
                  onChange={(event) => updateDraft("fullName", event.target.value)}
                  disabled={!editing || saving}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>
              <label className="block">
                <div className="text-xs text-gray-500 mb-1" style={{ fontWeight: 600 }}>Email</div>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(event) => updateDraft("email", event.target.value)}
                  disabled={!editing || saving}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>
              <label className="block">
                <div className="text-xs text-gray-500 mb-1" style={{ fontWeight: 600 }}>Phone</div>
                <input
                  value={draft.phone}
                  onChange={(event) => updateDraft("phone", event.target.value)}
                  disabled={!editing || saving}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>
              <label className="block">
                <div className="text-xs text-gray-500 mb-1" style={{ fontWeight: 600 }}>Barangay</div>
                <input
                  value={draft.barangay}
                  onChange={(event) => updateDraft("barangay", event.target.value)}
                  disabled={!editing || saving}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>
            </div>

            <label className="block">
              <div className="text-xs text-gray-500 mb-1" style={{ fontWeight: 600 }}>Address Line</div>
              <input
                value={draft.addressLine}
                onChange={(event) => updateDraft("addressLine", event.target.value)}
                disabled={!editing || saving}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm disabled:bg-gray-50 disabled:text-gray-500"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void saveProfile()}
                disabled={!editing || saving}
                className="px-4 py-2.5 rounded-xl text-sm text-white disabled:opacity-50"
                style={{ background: BRAND, fontWeight: 700 }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setDraft(savedDraft);
                  setMessage("Profile editing cancelled.");
                }}
                disabled={!editing || saving}
                className="px-4 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-700 disabled:opacity-50"
                style={{ fontWeight: 700 }}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleMenuAction("privacy_security")}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-700"
                style={{ fontWeight: 700 }}
              >
                Reset Password
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="text-xs text-gray-500 mb-1" style={{ fontWeight: 600 }}>Account Email</div>
            <div className="text-sm text-gray-800" style={{ fontWeight: 700 }}>{meta.email}</div>
            <div className="text-xs text-gray-500 mt-3 mb-1" style={{ fontWeight: 600 }}>Phone</div>
            <div className="text-sm text-gray-800" style={{ fontWeight: 700 }}>{meta.phone}</div>
            <div className="text-xs text-gray-500 mt-3 mb-1" style={{ fontWeight: 600 }}>Notifications</div>
            <div className="text-sm text-gray-800" style={{ fontWeight: 700 }}>{notificationMode}</div>
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
