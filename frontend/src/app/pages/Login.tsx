import { useState } from "react";
import { useNavigate } from "react-router";
import { ZippoLogo } from "../components/ZippoLogo";
import { Eye, EyeOff, ArrowLeft, User, ShoppingBag, Truck, LayoutDashboard } from "lucide-react";
import { useGift } from "../context/GiftContext";

const BRAND = "#8B1520";

const roles = [
  {
    id: "user",
    label: "Customer",
    icon: User,
    desc: "Browse, gift & order",
    color: BRAND,
    bg: "#FFF1F2",
    route: "/app/home",
  },
  {
    id: "vendor",
    label: "Vendor",
    icon: ShoppingBag,
    desc: "Manage your store",
    color: "#2563EB",
    bg: "#EFF6FF",
    route: "/vendor/dashboard",
  },
  {
    id: "rider",
    label: "Rider",
    icon: Truck,
    desc: "Manage deliveries",
    color: "#059669",
    bg: "#ECFDF5",
    route: "/rider/dashboard",
  },
  {
    id: "admin",
    label: "Admin",
    icon: LayoutDashboard,
    desc: "Platform control",
    color: "#7C3AED",
    bg: "#F5F3FF",
    route: "/admin/dashboard",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useGift();
  const [selectedRole, setSelectedRole] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const role = roles.find((r) => r.id === selectedRole)!;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate(role.route);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required to sign up.");
      return;
    }
    setError("");
    setInfo("");
    setLoading(true);

    const roleMap = {
      user: "buyer",
      vendor: "store_owner",
      rider: "driver",
      admin: "admin",
    } as const;

    try {
      const result = await signUp(email.trim(), password, roleMap[selectedRole as keyof typeof roleMap]);
      if (result.emailConfirmationRequired) {
        setInfo("Sign-up succeeded. Please confirm your email, then sign in.");
        return;
      }
      navigate(role.route);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#FBF8F7" }}>
      <div className="hidden lg:flex flex-col justify-between w-[420px] p-10 text-white" style={{ background: BRAND }}>
        <div>
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-red-200 hover:text-white transition-colors mb-12">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </button>
          <ZippoLogo size="md" light />
          <div className="mt-10">
            <h2 className="text-3xl text-white mb-3" style={{ fontWeight: 800 }}>
              Welcome back to ZIPPO
            </h2>
            <p className="text-red-200 leading-relaxed">
              The smartest gifting & delivery platform for Olongapo City. Powered by 3 intelligent AI modules.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { icon: "🧠", text: "Gift Intelligence — Finds your perfect match" },
            { icon: "✨", text: "Personalizer — Ranked just for your recipient" },
            { icon: "🛵", text: "Delivery Optimizer — Guaranteed time slots" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-red-100">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-6 lg:hidden" style={{ color: BRAND }}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>

          <div className="lg:hidden mb-8">
            <ZippoLogo size="sm" />
          </div>

          <h1 className="text-2xl text-gray-900 mb-1" style={{ fontWeight: 800 }}>Sign In</h1>
          <p className="text-gray-500 text-sm mb-7">Choose your role to continue</p>

          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className="flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left"
                style={{
                  borderColor: selectedRole === r.id ? r.color : "#E5E7EB",
                  background: selectedRole === r.id ? r.bg : "white",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: r.color }}
                >
                  <r.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm" style={{ color: selectedRole === r.id ? r.color : "#1A1A1A", fontWeight: 700 }}>
                    {r.label}
                  </div>
                  <div className="text-[11px] text-gray-400">{r.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700 mb-1.5 block" style={{ fontWeight: 600 }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder={`${selectedRole}@zippo.app`}
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all"
                style={{ borderColor: "#E5E7EB", background: "white" }}
                onFocus={(e) => (e.target.style.borderColor = role.color)}
                onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1.5 block" style={{ fontWeight: 600 }}>Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="••••••••"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all pr-12"
                  style={{ borderColor: "#E5E7EB", background: "white" }}
                  onFocus={(e) => (e.target.style.borderColor = role.color)}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-gray-500">Remember me</span>
              </label>
              <button className="text-sm hover:opacity-80" style={{ color: role.color }}>Forgot password?</button>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: role.color, fontWeight: 700 }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                `Sign in as ${role.label}`
              )}
            </button>

            {error && (
              <div className="text-sm text-red-600" style={{ fontWeight: 600 }}>
                {error}
              </div>
            )}
            {info && (
              <div className="text-sm text-emerald-600" style={{ fontWeight: 600 }}>
                {info}
              </div>
            )}
          </div>

          <div className="mt-5 text-center">
            <span className="text-sm text-gray-500">Don't have an account? </span>
            <button onClick={handleSignUp} className="text-sm hover:opacity-80" style={{ color: role.color, fontWeight: 600 }}>
              Sign up
            </button>
          </div>

          <div className="mt-6 rounded-xl p-3 text-center" style={{ background: "#FFF1F2" }}>
            <span className="text-xs" style={{ color: BRAND }}>
              Sign in with your backend account credentials.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
