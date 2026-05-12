import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Star, MapPin, Users, TrendingUp, BarChart2 } from "lucide-react";
import { useGift } from "../context/GiftContext";
import { AIBadge } from "../components/AIBadge";
import type { Product } from "../context/GiftContext";

const BRAND = "#8B1520";

const bibingkaImg = "https://images.unsplash.com/photo-1718934628487-f600d3861d0e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxGaWxpcGlubyUyMHJpY2UlMjBjYWtlJTIwdHJhZGl0aW9uYWwlMjBkZXNzZXJ0fGVufDF8fHx8MTc3ODUwMTYxN3ww&ixlib=rb-4.1.0&q=80&w=400";
const mangoImg = "https://images.unsplash.com/photo-1693165236987-c1ae0418fa89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcmllZCUyMG1hbmdvJTIwdHJvcGljYWwlMjBzbmFjayUyMHBhY2thZ2V8ZW58MXx8fHwxNzc4NTAxNjEwfDA&ixlib=rb-4.1.0&q=80&w=400";
const hamperImg = "https://images.unsplash.com/photo-1773450970959-cef81e9b1053?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwZm9vZCUyMGhhbXBlciUyMGdpZnQlMjJiYXNrZXR8ZW58MXx8fHwxNzc4NTAxNjA3fDA&ixlib=rb-4.1.0&q=80&w=400";
const giftBoxImg = "https://images.unsplash.com/photo-1545844568-98bb15133ec0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBnaWZ0JTIwYm94JTIwcmVkJTIwcmliYm9uJTIwZWxlZ2FudHxlbnwxfHx8fDE3Nzg1MDE2MDZ8MA&ixlib=rb-4.1.0&q=80&w=400";

const defaultRecommendations: Product[] = [
  {
    id: 1,
    name: "Gordon's Bibingka Box",
    store: "Gordon's Market",
    location: "Local store",
    price: 250,
    match: 95,
    image: bibingkaImg,
    badge: "#1 Pick",
    tags: ["95% match", "users like you bought this"],
  },
  {
    id: 2,
    name: "Subic Bay Dried Mango Set",
    store: "SBMA Pasalubong",
    location: "Local",
    price: 180,
    match: 88,
    image: mangoImg,
    badge: "",
    tags: ["88% match", "Bestseller"],
  },
  {
    id: 3,
    name: "Barrio Fiesta Hamper",
    store: "ZC Gift Gallery",
    location: "Olongapo",
    price: 499,
    match: 81,
    image: hamperImg,
    badge: "",
    tags: ["81% match", "Premium pick"],
  },
];

export default function Recommendations() {
  const navigate = useNavigate();
  const { giftParams, userName, setSelectedProduct, recommendations: backendRecommendations } = useGift();
  const [selected, setSelected] = useState<number | null>(null);

  const recommendationList = useMemo(
    () => (backendRecommendations.length > 0 ? backendRecommendations : defaultRecommendations),
    [backendRecommendations],
  );

  const baselineComparison = useMemo(
    () =>
      recommendationList.slice(0, 3).map((item, idx) => ({
        name: item.name.split(" ").slice(0, 2).join(" "),
        is: item.match,
        baseline: ["iPhone Case", "Face Cream", "Notebook"][idx] ?? "Generic Gift",
        baselineScore: "pop",
      })),
    [recommendationList],
  );

  const handleSelect = (product: Product) => {
    setSelectedProduct(product);
    navigate("/app/delivery");
  };

  return (
    <div style={{ background: "#FAFAFA" }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => navigate("/app/gift")}
            className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-200"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h2 className="text-gray-900" style={{ fontWeight: 800, fontSize: 17 }}>Top picks for you</h2>
          </div>
        </div>

        {/* Context tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            Personalised for <strong>{userName.split(" ")[0]}</strong>
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            🎂 {giftParams.occasion}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            👨‍👩‍👧 {giftParams.recipient}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            ₱{giftParams.budget.toLocaleString()}
          </span>
        </div>

        <AIBadge module={2} label="IS Recommendations Active" />
      </div>

      {/* Desktop 2-col */}
      <div className="flex flex-col md:flex-row md:items-start">

        {/* ── Cards column ── */}
        <div className="flex-1 px-5 py-5 space-y-4">
          {recommendationList.map((product, i) => (
            <div
              key={product.id}
              onClick={() => setSelected(product.id)}
              className="rounded-2xl border-2 bg-white overflow-hidden cursor-pointer transition-all"
              style={{
                borderColor: selected === product.id ? BRAND : i === 0 ? `${BRAND}30` : "#E5E7EB",
                boxShadow: i === 0 ? "0 4px 20px rgba(139,21,32,0.12)" : undefined,
              }}
            >
              {i === 0 && (
                <div className="px-4 py-2 flex items-center gap-2" style={{ background: BRAND }}>
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-white text-xs" style={{ fontWeight: 700 }}>#1 IS RECOMMENDATION</span>
                  <AIBadge module={2} variant="mini" />
                </div>
              )}
              <div className="p-4 flex gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs text-gray-400 mb-0.5 block">#{i + 1} · {product.store}</span>
                      <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{product.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-gray-400" />
                        <span className="text-xs text-gray-400">{product.location}</span>
                      </div>
                    </div>
                    <span className="text-sm shrink-0" style={{ color: BRAND, fontWeight: 800 }}>₱{product.price}</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-500">AI Match Score</span>
                      <span className="text-[10px]" style={{ color: "#059669", fontWeight: 700 }}>{product.match}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div className="h-full rounded-full" style={{ width: `${product.match}%`, background: product.match >= 90 ? "#059669" : product.match >= 80 ? "#2563EB" : BRAND }} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {product.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#F0FDF4", color: "#059669", fontWeight: 600 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-4 pb-4">
                <button
                  onClick={(e) => { e.stopPropagation(); handleSelect(product); }}
                  className="w-full py-2.5 rounded-xl text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: i === 0 ? BRAND : "#374151", fontWeight: 700, fontSize: 13 }}
                >
                  {i === 0 ? "✓ Select #1 — Gordon's Bibingka" : `Select #${i + 1} — ${product.name.split(" ").slice(0, 2).join(" ")}`}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Desktop right sidebar ── */}
        <div className="hidden md:flex flex-col gap-4 w-72 lg:w-80 shrink-0 border-l border-gray-100 px-5 py-5 bg-white">

          {/* IS vs Baseline */}
          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-gray-900" style={{ fontWeight: 700 }}>IS Picks vs Baseline</span>
              </div>
              <AIBadge module={2} variant="mini" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 mb-2">
              <span style={{ fontWeight: 700 }}>IS PICKS</span>
              <span style={{ fontWeight: 700 }}>BASELINE</span>
            </div>
            {baselineComparison.map((item) => (
              <div key={item.name} className="grid grid-cols-2 gap-2 py-1.5 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-700">{item.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600" style={{ fontWeight: 700 }}>{item.is}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">{item.baseline}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500">{item.baselineScore}</span>
                </div>
              </div>
            ))}
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5">
              <Users className="w-3 h-3 text-purple-500" />
              <span className="text-[10px] text-gray-500">Users who gifted for {giftParams.occasion} · {giftParams.recipient} also chose these</span>
            </div>
          </div>

          {/* Match score visual */}
          <div className="rounded-2xl border border-gray-100 p-4" style={{ background: "#F5F3FF" }}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-purple-700" style={{ fontWeight: 700 }}>MATCH COMPARISON</span>
            </div>
            {recommendationList.map((r, i) => (
              <div key={r.id} className="mb-2 last:mb-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-gray-700">#{i+1} {r.name.split(" ").slice(0,2).join(" ")}</span>
                  <span className="text-[11px]" style={{ color: i === 0 ? "#059669" : "#7C3AED", fontWeight: 700 }}>{r.match}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-purple-100">
                  <div className="h-full rounded-full transition-all" style={{ width: `${r.match}%`, background: i === 0 ? "#059669" : "#7C3AED" }} />
                </div>
              </div>
            ))}
          </div>

          {/* AI explanation */}
          <div className="rounded-xl p-4 border border-blue-100" style={{ background: "#EFF6FF" }}>
            <div className="text-xs text-blue-700 mb-2" style={{ fontWeight: 700 }}>WHY THESE PICKS?</div>
            <div className="text-[11px] text-blue-600 leading-relaxed">
              Module 2 analyzed <strong>1,247 similar orders</strong> for {giftParams.occasion} · {giftParams.recipient} within ₱{giftParams.budget.toLocaleString()} budget. Local food gifts ranked highest by satisfaction score (4.9★).
            </div>
          </div>

          {/* Store info */}
          <div className="rounded-xl p-4 border border-gray-100" style={{ background: "#FAFAFA" }}>
            <div className="text-xs text-gray-900 mb-3" style={{ fontWeight: 700 }}>TOP STORE</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl shrink-0">🍱</div>
              <div>
                <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>Gordon's Market</div>
                <div className="text-xs text-gray-500">Local store · 142 orders</div>
                <div className="flex items-center gap-0.5 mt-0.5">{[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
