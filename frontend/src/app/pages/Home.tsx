import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Search, MapPin, Star, Plus, ChevronRight, Flame,
  Gift, Sparkles, Brain, Route, TrendingUp, Clock, Zap,
} from "lucide-react";
import { useGift } from "../context/GiftContext";
import { AIBadge } from "../components/AIBadge";
import { api } from "@/lib/api";
import { rankedProductToUiProduct } from "@/lib/zippo-mappers";

const BRAND = "#8B1520";

const fallbackTopPicks = [
  { id: 1, name: "Gordon's Bibingka Box", store: "Gordon's Market", location: "Local", price: 250, match: 95, image: "https://images.unsplash.com/photo-1718934628487-f600d3861d0e?w=400&auto=format&fit=crop", badge: "🏆 #1 Pick" },
  { id: 2, name: "Subic Bay Pasalubong Set", store: "SBMA Pasalubong", location: "Local", price: 480, match: 88, image: "https://images.unsplash.com/photo-1693165236987-c1ae0418fa89?w=400&auto=format&fit=crop" },
  { id: 3, name: "Barrio Fiesta Hamper", store: "ZC Gift Gallery", location: "Olongapo", price: 499, match: 81, image: "https://images.unsplash.com/photo-1773450970959-cef81e9b1053?w=400&auto=format&fit=crop" },
  { id: 4, name: "Premium Gift Box", store: "Olongapo Fresh", location: "Olongapo", price: 699, match: 78, image: "https://images.unsplash.com/photo-1545844568-98bb15133ec0?w=400&auto=format&fit=crop" },
];

const occasions = [
  { id: "birthday", emoji: "🎂", label: "Birthday" },
  { id: "graduation", emoji: "🎓", label: "Graduation" },
  { id: "anniversary", emoji: "💍", label: "Anniversary" },
  { id: "christmas", emoji: "🎄", label: "Christmas" },
  { id: "valentines", emoji: "❤️", label: "Valentine's" },
];

const categories = [
  { emoji: "🍱", label: "Food" },
  { emoji: "💐", label: "Flowers" },
  { emoji: "🧴", label: "Beauty" },
  { emoji: "📦", label: "Hampers" },
  { emoji: "🍰", label: "Cakes" },
  { emoji: "🪴", label: "Lifestyle" },
];

const aiModuleCards = [
  { num: 1, icon: Brain, label: "Gift Intelligence", desc: "NLP-powered matching", color: "#2563EB", bg: "#EFF6FF" },
  { num: 2, icon: Sparkles, label: "Personalizer", desc: "ML-ranked just for you", color: "#7C3AED", bg: "#F5F3FF" },
  { num: 3, icon: Route, label: "Delivery Optimizer", desc: "GPS rider auto-assignment", color: "#059669", bg: "#ECFDF5" },
];

const quickStats = [
  { value: "500+", label: "Local Stores", icon: MapPin },
  { value: "98%", label: "On-Time", icon: Clock },
  { value: "10K+", label: "Customers", icon: Star },
];

export default function Home() {
  const navigate = useNavigate();
  const { userName, numericUserId } = useGift();
  const [activeOccasion, setActiveOccasion] = useState("birthday");
  const [searchQuery, setSearchQuery] = useState("");
  const [topPicks, setTopPicks] = useState(fallbackTopPicks);

  const selectedOccasionLabel = useMemo(
    () => occasions.find((occ) => occ.id === activeOccasion)?.label ?? null,
    [activeOccasion],
  );

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await api.catalogSearch({
          search: searchQuery || null,
          occasion: selectedOccasionLabel,
          recipient_type: null,
          budget_range: null,
          prefer_local: true,
          user_id: numericUserId || null,
          top_k: 4,
        });
        const mapped = response.results.map((row, idx) => {
          const item = rankedProductToUiProduct(row, idx);
          return {
            ...item,
            badge: idx === 0 ? "🏆 #1 Pick" : undefined,
          };
        });
        if (mapped.length) {
          setTopPicks(mapped);
        }
      } catch {
        // Keep local fallback picks if backend fetch fails.
      }
    };

    void loadCatalog();
  }, [numericUserId, searchQuery, selectedOccasionLabel]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="overflow-x-hidden">
      <div className="px-5 pt-4 pb-5" style={{ background: BRAND }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-red-200 text-xs mb-0.5">{greeting},</p>
            <div className="flex items-center gap-1.5">
              <h2 className="text-white" style={{ fontWeight: 800, fontSize: 18 }}>{userName}</h2>
              <Flame className="w-4 h-4 text-yellow-400" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white" style={{ fontWeight: 800, fontSize: 14 }}>
              {userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl px-4 py-2 mb-4">
          <p className="text-xs text-gray-400 mb-1">What's the occasion?</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Birthday, Anniversary, Thank You"
              className="flex-1 text-sm outline-none text-gray-700 bg-transparent"
            />
            <button
              onClick={() => navigate("/app/gift")}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ background: BRAND }}
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <AIBadge module={1} variant="mini" />
          <AIBadge module={2} variant="mini" />
          <AIBadge module={3} variant="mini" />
          <span className="text-red-200 text-[10px]">All systems active</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-start">
        <div className="flex-1 min-w-0">
          <div className="px-4 sm:px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {occasions.map((occ) => (
                <button
                  key={occ.id}
                  onClick={() => setActiveOccasion(occ.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm flex-shrink-0 border transition-all"
                  style={{
                    background: activeOccasion === occ.id ? BRAND : "white",
                    color: activeOccasion === occ.id ? "white" : "#374151",
                    borderColor: activeOccasion === occ.id ? BRAND : "#E5E7EB",
                    fontWeight: activeOccasion === occ.id ? 700 : 500,
                  }}
                >
                  <span>{occ.emoji}</span>
                  <span>{occ.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mx-4 sm:mx-5 mb-4 rounded-2xl p-4 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #C0192A 100%)` }}>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white text-sm" style={{ fontWeight: 700 }}>Find the perfect gift</div>
              <div className="text-red-200 text-xs">Tell us more and our AI does the rest</div>
            </div>
            <button
              onClick={() => navigate("/app/gift")}
              className="text-white text-xs px-3 py-1.5 rounded-xl bg-white/20 flex items-center gap-1 hover:bg-white/30 transition-colors shrink-0"
              style={{ fontWeight: 700 }}
            >
              Start <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="px-4 sm:px-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>Categories</span>
              <button className="text-xs flex items-center gap-0.5" style={{ color: BRAND }}>
                All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => navigate("/app/gift")}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border border-gray-100 hover:border-red-200 transition-colors bg-white"
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="text-[10px] text-gray-600">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 sm:px-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>Top Picks For You</span>
                <AIBadge module={2} variant="mini" />
              </div>
              <button className="text-xs flex items-center gap-0.5" style={{ color: BRAND }}>
                See all <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topPicks.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-2xl p-3 border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate("/app/gift")}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {product.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full text-white mb-1 inline-block" style={{ background: BRAND, fontWeight: 700 }}>
                        {product.badge}
                      </span>
                    )}
                    <div className="text-sm text-gray-900 truncate" style={{ fontWeight: 700 }}>{product.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      <MapPin className="w-2.5 h-2.5 text-gray-400" />
                      <span className="text-xs text-gray-400 truncate">{product.store} · {product.location}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm" style={{ color: BRAND, fontWeight: 800 }}>₱{product.price}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600" style={{ fontWeight: 700 }}>
                        {product.match}% match
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/app/gift");
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                    style={{ background: BRAND }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-4 sm:mx-5 mb-5 rounded-2xl p-4 flex items-center gap-3 border border-gray-100 bg-white">
            <div className="text-2xl">📍</div>
            <div>
              <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>Shop Local. Support Local.</div>
              <div className="text-xs text-gray-400">Best vendors in Olongapo City</div>
            </div>
            <div className="flex ml-auto">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-4 w-72 lg:w-80 shrink-0 border-l border-gray-100 px-5 py-5 bg-white min-h-full">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Zap className="w-3.5 h-3.5" style={{ color: BRAND }} />
              <span className="text-xs text-gray-900" style={{ fontWeight: 700 }}>AI SYSTEMS</span>
            </div>
            <div className="space-y-2">
              {aiModuleCards.map((m) => (
                <div key={m.num} className="flex items-center gap-3 rounded-xl p-3 border" style={{ background: m.bg, borderColor: `${m.color}20` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: m.color }}>
                    <m.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs" style={{ color: m.color, fontWeight: 700 }}>{m.label}</div>
                    <div className="text-[10px] text-gray-500">{m.desc}</div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: m.color }} />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate("/app/gift")}
            className="w-full py-3.5 rounded-2xl text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: BRAND, fontWeight: 700 }}
          >
            <Gift className="w-4 h-4" />
            Start Gifting Now
          </button>

          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-900" style={{ fontWeight: 700 }}>PLATFORM STATS</span>
            </div>
            <div className="space-y-2">
              {quickStats.map((s) => (
                <div key={s.label} className="flex items-center gap-3 py-2 border-b border-gray-50">
                  <s.icon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-600 flex-1">{s.label}</span>
                  <span className="text-sm" style={{ color: BRAND, fontWeight: 800 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-900 mb-2" style={{ fontWeight: 700 }}>TRENDING NOW</div>
            <div className="flex flex-wrap gap-1.5">
              {["🎂 Birthday", "🍱 Food Gifts", "💐 Flowers", "📦 Hampers", "🌿 Local"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate("/app/gift")}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-gray-200 hover:border-red-200 transition-colors bg-white text-gray-600"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4 border border-gray-100" style={{ background: "#FBF8F7" }}>
            <div className="text-xs text-gray-900 mb-2" style={{ fontWeight: 700 }}>STORE SPOTLIGHT</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl shrink-0">🍱</div>
              <div>
                <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>Gordon's Market</div>
                <div className="text-xs text-gray-500">Top local store · 142 orders</div>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />)}
                  <span className="text-[10px] text-gray-400 ml-1">5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
