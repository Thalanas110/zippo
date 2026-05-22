import { useNavigate } from "react-router";
import { ZippoLogo } from "../components/ZippoLogo";
import {
  Gift, Zap, Heart, Users, Briefcase, Building2, GraduationCap,
  Star, MapPin, ChevronRight, CheckCircle2, Brain, Route, Sparkles,
  ArrowRight, Package, Clock, ShieldCheck
} from "lucide-react";

const BRAND = "#8B1520";
const BRAND_BRIGHT = "#C0192A";

const giftBoxImg = "https://images.unsplash.com/photo-1545844568-98bb15133ec0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBnaWZ0JTIwYm94JTIwcmVkJTIwcmliYm9uJTIwZWxlZ2FudHxlbnwxfHx8fDE3Nzg1MDE2MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080";
const hamperImg = "https://images.unsplash.com/photo-1773450970959-cef81e9b1053?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwZm9vZCUyMGhhbXBlciUyMGdpZnQlMjBiYXNrZXR8ZW58MXx8fHwxNzc4NTAxNjA3fDA&ixlib=rb-4.1.0&q=80&w=1080";
const riderImg = "https://images.unsplash.com/photo-1774977866843-eef12e4b6e59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpdmVyeSUyMHJpZGVyJTIwbW90b3JjeWNsZSUyMHJlZHxlbnwxfHx8fDE3Nzg1MDE2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080";
const waterfrontImg = "https://images.unsplash.com/photo-1774681972371-d87f13a3996c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGNpdHklMjBoYXJib3IlMjBiYXklMjB3YXRlcmZyb250fGVufDF8fHx8MTc3ODUwMTYxN3ww&ixlib=rb-4.1.0&q=80&w=1080";

const aiSystems = [
  {
    icon: Brain,
    title: "Gift Intelligence",
    module: "Module 1",
    desc: "Our NLP engine understands the occasion, the person, and your budget to surface perfectly matching gifts — automatically.",
    color: "#2563EB",
    bg: "#EFF6FF",
    tags: ["NLP Processing", "Context-Aware", "Budget Smart"],
  },
  {
    icon: Sparkles,
    title: "Personalized Recommendations",
    module: "Module 2",
    desc: "ML-powered personalization engine that scores and ranks gifts based on recipient profile, purchase history, and local trends.",
    color: "#7C3AED",
    bg: "#F5F3FF",
    tags: ["95% Match Rate", "ML Powered", "Real-Time"],
  },
  {
    icon: Route,
    title: "Delivery Optimizer",
    module: "Module 3",
    desc: "Smart rider assignment algorithm that picks the nearest available rider, guarantees time slots, and tracks delivery in real-time.",
    color: "#059669",
    bg: "#ECFDF5",
    tags: ["GPS Tracking", "Slot Guaranteed", "Auto-Assign"],
  },
];

const features = [
  {
    icon: Gift,
    title: "Smart Gifting",
    desc: "We understand the occasion, the person, and your budget.",
  },
  {
    icon: Zap,
    title: "Fast & Reliable",
    desc: "Optimized delivery that never misses a time slot.",
  },
  {
    icon: Heart,
    title: "Local First",
    desc: "We support local vendors and local products in Olongapo City.",
  },
];

const audiences = [
  { icon: GraduationCap, label: "Students" },
  { icon: Users, label: "Families" },
  { icon: Briefcase, label: "Professionals" },
  { icon: Building2, label: "Businesses" },
];

const stats = [
  { value: "500+", label: "Local Vendors" },
  { value: "98%", label: "On-Time Delivery" },
  { value: "10K+", label: "Happy Customers" },
  { value: "3", label: "AI Modules" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <ZippoLogo size="sm" />
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-red-700 transition-colors">Features</a>
            <a href="#ai" className="hover:text-red-700 transition-colors">AI Systems</a>
            <a href="#about" className="hover:text-red-700 transition-colors">About</a>
            <a href="#local" className="hover:text-red-700 transition-colors">Local Partners</a>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ borderColor: BRAND, color: BRAND }}
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/login")}
              className="text-xs sm:text-sm px-3 sm:px-5 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ background: BRAND }}
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #fff 0%, #FFF1F2 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {/* Label */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-6" style={{ background: "#FFF1F2", color: BRAND }}>
              <MapPin className="w-3.5 h-3.5" />
              <span style={{ fontWeight: 600 }}>Proudly serving Olongapo City</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl mb-6 text-gray-900" style={{ fontWeight: 900, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
              THE <span style={{ color: BRAND }}>SMARTEST</span> WAY TO GIFT AND DELIVER.
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-lg" style={{ lineHeight: 1.7 }}>
              From simple surprises to life's big moments — Zippo helps you find the right gift, for the right person, on time. Every time.
            </p>

            {/* Feature list */}
            <div className="flex flex-col gap-3 mb-10">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#FFF1F2" }}>
                    <f.icon className="w-4 h-4" style={{ color: BRAND }} />
                  </div>
                  <div>
                    <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{f.title} — </span>
                    <span className="text-sm text-gray-500">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-3.5 rounded-xl text-white transition-all hover:opacity-90 hover:shadow-lg"
                style={{ background: BRAND, fontSize: "15px", fontWeight: 700 }}
              >
                Start Gifting Now
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-3.5 rounded-xl transition-all hover:bg-gray-50 border"
                style={{ borderColor: "#E5E7EB", color: "#374151", fontSize: "15px" }}
              >
                <Package className="w-4 h-4" />
                Track an Order
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-gray-100">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl" style={{ color: BRAND, fontWeight: 900 }}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Image stack */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Main gift image */}
              <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ height: 420 }}>
                <img src={giftBoxImg} alt="Premium gifts" className="w-full h-full object-cover" />
                <div className="absolute inset-0 rounded-3xl" style={{ background: "linear-gradient(to top, rgba(139,21,32,0.4) 0%, transparent 60%)" }} />
              </div>

              {/* Floating card: AI Active */}
              <div className="absolute -left-8 top-10 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 max-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-600" style={{ fontWeight: 700 }}>3 AI Systems Active</span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-blue-500 flex items-center justify-center text-white" style={{ fontSize: 7, fontWeight: 800 }}>1</div>
                    <span>Gift Intelligence</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-purple-500 flex items-center justify-center text-white" style={{ fontSize: 7, fontWeight: 800 }}>2</div>
                    <span>Personalizer</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-emerald-500 flex items-center justify-center text-white" style={{ fontSize: 7, fontWeight: 800 }}>3</div>
                    <span>Delivery Optimizer</span>
                  </div>
                </div>
              </div>

              {/* Floating card: Match */}
              <div className="absolute -right-6 bottom-16 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">AI Gift Match</div>
                <div className="text-3xl" style={{ color: BRAND, fontWeight: 900 }}>95%</div>
                <div className="text-xs text-gray-500">Perfect for Birthday · Parent</div>
              </div>

              {/* Floating card: Delivery */}
              <div className="absolute -bottom-6 left-8 bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#ECFDF5" }}>
                  <Clock className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">ETA Guaranteed</div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>8:00 AM – 12:00 PM</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative red wave */}
        <div className="absolute bottom-0 left-0 right-0 h-2" style={{ background: BRAND }} />
      </section>

      {/* AI SYSTEMS SECTION */}
      <section id="ai" className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-4" style={{ background: "#F5F3FF", color: "#7C3AED" }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span style={{ fontWeight: 600 }}>Powered by Artificial Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4" style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>
              3 Intelligent Systems,{" "}
              <span style={{ color: BRAND }}>One Seamless Experience</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              ZIPPO's backend is wired to a FastAPI-powered AI infrastructure with three independent intelligent modules working together.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {aiSystems.map((sys, i) => (
              <div
                key={sys.title}
                className="rounded-2xl p-7 border transition-all hover:-translate-y-1 hover:shadow-lg cursor-default"
                style={{ borderColor: `${sys.color}20`, background: sys.bg }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: sys.color }}>
                    <sys.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs px-2.5 py-1 rounded-full" style={{ background: `${sys.color}15`, color: sys.color, fontWeight: 700 }}>
                    Module {i + 1}
                  </div>
                </div>
                <h3 className="text-lg mb-2" style={{ color: "#1A1A1A", fontWeight: 800 }}>
                  {sys.title}
                </h3>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">{sys.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {sys.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2.5 py-1 rounded-full"
                      style={{ background: `${sys.color}15`, color: sys.color, fontWeight: 600 }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-14 sm:py-20" style={{ background: "#FBF8F7" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4" style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>
              How ZIPPO Works
            </h2>
            <p className="text-gray-500">5 simple steps from idea to delivered gift</p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { step: 1, icon: "🏠", title: "Browse Home", desc: "Discover top picks & trending gifts" },
              { step: 2, icon: "🎁", title: "Tell Us More", desc: "Set occasion, recipient & budget" },
              { step: 3, icon: "✨", title: "AI Picks", desc: "Our AI recommends the perfect match" },
              { step: 4, icon: "🛵", title: "Choose Delivery", desc: "Pick a time slot, confirm your order" },
              { step: 5, icon: "📦", title: "Track & Enjoy", desc: "Real-time tracking & guaranteed delivery" },
            ].map((item, i) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                {i < 4 && (
                  <div className="absolute top-6 left-[60%] w-full h-0.5 hidden md:block" style={{ background: `${BRAND}20` }}>
                    <ChevronRight className="absolute -right-2 -top-2.5 w-5 h-5" style={{ color: BRAND }} />
                  </div>
                )}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-sm" style={{ background: "white", border: `2px solid ${BRAND}15` }}>
                  {item.icon}
                </div>
                <div className="text-xs mb-1 px-2 py-0.5 rounded-full" style={{ background: `${BRAND}10`, color: BRAND, fontWeight: 700 }}>
                  Step {item.step}
                </div>
                <div className="text-sm mt-1 text-gray-900" style={{ fontWeight: 700 }}>{item.title}</div>
                <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERFECT FOR EVERYONE */}
      <section id="about" className="py-14 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-6" style={{ background: "#FFF1F2", color: BRAND }}>
                <Star className="w-3.5 h-3.5" />
                <span style={{ fontWeight: 600 }}>Perfect for Everyone</span>
              </div>
              <h2 className="text-3xl sm:text-4xl text-gray-900 mb-6" style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>
                Built for every{" "}
                <span style={{ color: BRAND }}>person</span> in Olongapo
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Whether you're a student surprising a friend, a parent gifting family abroad, a professional sending corporate packages, or a business managing bulk deliveries — ZIPPO handles it all.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {audiences.map((a) => (
                  <div key={a.label} className="flex items-center gap-3 rounded-xl p-4 border border-gray-100 hover:border-red-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#FFF1F2" }}>
                      <a.icon className="w-5 h-5" style={{ color: BRAND }} />
                    </div>
                    <span className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{a.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2.5">
                {[
                  "Shop Local. Support Local Vendors.",
                  "Time-slot guaranteed deliveries.",
                  "AI-curated gift recommendations.",
                  "Real-time rider tracking.",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: BRAND }} />
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ height: 460 }}>
                <img src={riderImg} alt="Delivery" className="w-full h-full object-cover" />
                <div className="absolute inset-0 rounded-3xl" style={{ background: "linear-gradient(to top, rgba(139,21,32,0.6) 0%, transparent 50%)" }} />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/90 backdrop-blur rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white" style={{ fontWeight: 800 }}>CR</div>
                      <div>
                        <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>Carlos Reyes — Rider #04</div>
                        <div className="text-xs text-gray-500">East Bajac-Bajac · 1.2 km away</div>
                      </div>
                      <div className="ml-auto px-2.5 py-1 rounded-full text-xs text-emerald-700 bg-emerald-50" style={{ fontWeight: 700 }}>
                        ETA 25 min
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOCAL SECTION */}
      <section id="local" className="py-14 sm:py-20" style={{ background: "#FBF8F7" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="rounded-3xl overflow-hidden shadow-xl" style={{ height: 380 }}>
              <img src={waterfrontImg} alt="Olongapo City" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm mb-6" style={{ background: "#ECFDF5", color: "#059669" }}>
                <MapPin className="w-3.5 h-3.5" />
                <span style={{ fontWeight: 600 }}>Shop Local. Support Local.</span>
              </div>
              <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4" style={{ fontWeight: 900 }}>
                The best of <span style={{ color: BRAND }}>Olongapo City</span>, delivered.
              </h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                We feature the best local vendors and products — from Gordon's Market bibingka to Subic Bay pasalubong sets. Every purchase supports a local business.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {[
                  { img: hamperImg, name: "Gordon's Bibingka Box", vendor: "Gordon's Market", price: "₱250" },
                  { img: "https://images.unsplash.com/photo-1693165236987-c1ae0418fa89?w=200", name: "Subic Bay Dried Mango Set", vendor: "SBMA Pasalubong", price: "₱180" },
                ].map((p) => (
                  <div key={p.name} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="h-28 overflow-hidden">
                      <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-gray-500">{p.vendor}</div>
                      <div className="text-sm text-gray-900 mt-0.5" style={{ fontWeight: 700 }}>{p.name}</div>
                      <div className="text-sm mt-1" style={{ color: BRAND, fontWeight: 700 }}>{p.price}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: BRAND }}>
                <ShieldCheck className="w-4 h-4" />
                <span style={{ fontWeight: 600 }}>Quality-checked by the ZIPPO team</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-14 sm:py-20" style={{ background: BRAND }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-4xl sm:text-5xl mb-4">🎁</div>
          <h2 className="text-3xl sm:text-4xl text-white mb-4" style={{ fontWeight: 900 }}>
            GIFT SMARTER. DELIVER FASTER.
          </h2>
          <p className="text-red-200 mb-8 text-lg">
            Start your first intelligent gifting experience today.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-4 rounded-xl bg-white transition-all hover:opacity-90 hover:shadow-lg"
            style={{ color: BRAND, fontWeight: 800, fontSize: "16px" }}
          >
            Get Started — It's Free
          </button>
          <div className="mt-6 text-red-300 text-sm">
            Serving Olongapo City · Powered by AI · Backed by Local Vendors
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <ZippoLogo size="sm" light />
              <p className="text-gray-400 text-sm mt-3 max-w-sm leading-relaxed">
                Intelligent gifting and on-demand delivery for everyone in Olongapo City. Powered by 3 AI modules wired to a FastAPI backend.
              </p>
            </div>
            <div>
              <div className="text-white text-sm mb-3" style={{ fontWeight: 700 }}>Quick Links</div>
              {["Home", "Gift Now", "Track Order", "Local Vendors", "About"].map((l) => (
                <div key={l} className="text-gray-400 text-sm py-1 hover:text-white cursor-pointer transition-colors">{l}</div>
              ))}
            </div>
            <div>
              <div className="text-white text-sm mb-3" style={{ fontWeight: 700 }}>Contact</div>
              <div className="text-gray-400 text-sm py-1">📍 Olongapo City, Zambales</div>
              <div className="text-gray-400 text-sm py-1">📧 hello@zippo.app</div>
              <div className="text-gray-400 text-sm py-1">📱 @zippo.app</div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-500 text-xs">© 2026 ZIPPO. All rights reserved.</div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-white cursor-pointer transition-colors">Vendor Portal</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
