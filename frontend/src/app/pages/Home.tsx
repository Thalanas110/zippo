import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  MapPin,
  Star,
  Plus,
  ChevronRight,
  Flame,
  Gift,
  Sparkles,
  Brain,
  Route,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useGift } from "../context/GiftContext";
import { AIBadge } from "../components/AIBadge";
import { api, type RankedProduct } from "@/lib/api";
import { rankedProductToUiProduct } from "@/lib/zippo-mappers";

const BRAND = "#8B1520";

const OCCASIONS = [
  { id: "all", label: "All" },
  { id: "birthday", label: "Birthday" },
  { id: "graduation", label: "Graduation" },
  { id: "anniversary", label: "Anniversary" },
  { id: "christmas", label: "Christmas" },
  { id: "valentines", label: "Valentine's" },
];

const aiModuleCards = [
  { num: 1, icon: Brain, label: "Gift Intelligence", desc: "NLP-powered matching", color: "#2563EB", bg: "#EFF6FF" },
  { num: 2, icon: Sparkles, label: "Personalizer", desc: "ML-ranked just for you", color: "#7C3AED", bg: "#F5F3FF" },
  { num: 3, icon: Route, label: "Delivery Optimizer", desc: "GPS rider auto-assignment", color: "#059669", bg: "#ECFDF5" },
];

function titleCase(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "Uncategorized";
  return raw
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean);
}

export default function Home() {
  const navigate = useNavigate();
  const { userName, numericUserId, setSelectedProduct } = useGift();
  const [activeOccasion, setActiveOccasion] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [catalogRows, setCatalogRows] = useState<RankedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedOccasionLabel = useMemo(
    () => OCCASIONS.find((occasion) => occasion.id === activeOccasion)?.label ?? null,
    [activeOccasion],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    void api
      .catalogSearch({
        search: deferredSearchQuery.trim() || null,
        occasion: activeOccasion === "all" ? null : selectedOccasionLabel,
        recipient_type: null,
        budget_range: null,
        prefer_local: true,
        user_id: numericUserId || null,
        top_k: 24,
      })
      .then((response) => {
        if (!active) return;
        setCatalogRows(response.results);
      })
      .catch(() => {
        if (!active) return;
        setCatalogRows([]);
        setError("Live catalog data is unavailable right now.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeOccasion, deferredSearchQuery, numericUserId, selectedOccasionLabel]);

  const topPicks = useMemo(
    () =>
      catalogRows.slice(0, 4).map((row, index) => {
        const item = rankedProductToUiProduct(row, index);
        return {
          ...item,
          badge: index === 0 ? "#1 Pick" : undefined,
          stock: typeof row.stock === "number" ? row.stock : Number(row.stock ?? 0) || 0,
          category: titleCase(row.category),
        };
      }),
    [catalogRows],
  );

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of catalogRows) {
      const category = titleCase(row.category);
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label]) => label);
  }, [catalogRows]);

  useEffect(() => {
    if (categories.length === 0) {
      setActiveCategory(null);
      return;
    }
    setActiveCategory((current) => (current && categories.includes(current) ? current : categories[0]));
  }, [categories]);

  const categoryProducts = useMemo(() => {
    const grouped = new Map<
      string,
      Array<ReturnType<typeof rankedProductToUiProduct> & { category: string }>
    >();

    catalogRows.forEach((row, index) => {
      const category = titleCase(row.category);
      const product = rankedProductToUiProduct(row, index);
      const current = grouped.get(category) ?? [];
      current.push({
        ...product,
        category,
        stock: typeof row.stock === "number" ? row.stock : Number(row.stock ?? 0) || 0,
      });
      grouped.set(category, current);
    });

    return grouped;
  }, [catalogRows]);

  const activeCategoryProducts = useMemo(() => {
    if (!activeCategory) return [];
    return (categoryProducts.get(activeCategory) ?? []).slice(0, 6);
  }, [activeCategory, categoryProducts]);

  const uniqueStores = useMemo(() => {
    const stores = new Set(
      catalogRows
        .map((row) => String(row.vendor_name ?? row.store_name ?? "").trim())
        .filter(Boolean),
    );
    return stores.size;
  }, [catalogRows]);

  const localPickCount = useMemo(
    () => catalogRows.filter((row) => row.local !== false).length,
    [catalogRows],
  );

  const averageMatch = useMemo(() => {
    if (topPicks.length === 0) return null;
    const total = topPicks.reduce((sum, item) => sum + item.match, 0);
    return Math.round(total / topPicks.length);
  }, [topPicks]);

  const quickStats = [
    { value: uniqueStores > 0 ? String(uniqueStores) : "--", label: "Active Stores", icon: MapPin },
    { value: localPickCount > 0 ? String(localPickCount) : "--", label: "Local Picks", icon: Gift },
    { value: averageMatch !== null ? `${averageMatch}%` : "--", label: "Avg Match", icon: TrendingUp },
  ];

  const trendingTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of catalogRows) {
      const values = [
        ...toStringList(row.tags),
        ...toStringList(row.occasion_tags),
        ...toStringList(row.recipient_tags),
      ];
      for (const entry of values) {
        const label = titleCase(entry);
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }
    const ranked = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label]) => label);
    return ranked.length > 0 ? ranked : categories.slice(0, 5);
  }, [catalogRows, categories]);

  const storeSpotlight = useMemo(() => {
    const storeMap = new Map<
      string,
      { name: string; items: number; scoreTotal: number; local: boolean }
    >();

    for (const row of catalogRows) {
      const name = String(row.vendor_name ?? row.store_name ?? "").trim();
      if (!name) continue;
      const current = storeMap.get(name) ?? {
        name,
        items: 0,
        scoreTotal: 0,
        local: row.local !== false,
      };
      current.items += 1;
      current.scoreTotal += typeof row.score === "number" ? row.score : 0;
      current.local = current.local && row.local !== false;
      storeMap.set(name, current);
    }

    const ranked = [...storeMap.values()].sort((a, b) => {
      if (b.items !== a.items) return b.items - a.items;
      return b.scoreTotal - a.scoreTotal;
    });

    return ranked[0] ?? null;
  }, [catalogRows]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const handleQuickSelect = (product: ReturnType<typeof rankedProductToUiProduct>) => {
    setSelectedProduct(product);
    navigate("/app/delivery");
  };

  return (
    <div className="overflow-x-hidden">
      <div className="px-5 pt-4 pb-5" style={{ background: BRAND }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-red-200 text-xs mb-0.5">{greeting},</p>
            <div className="flex items-center gap-1.5">
              <h2 className="text-white" style={{ fontWeight: 800, fontSize: 18 }}>
                {userName}
              </h2>
              <Flame className="w-4 h-4 text-yellow-400" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white" style={{ fontWeight: 800, fontSize: 14 }}>
              {userName.split(" ").map((name) => name[0]).join("").slice(0, 2)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl px-4 py-2 mb-4">
          <p className="text-xs text-gray-400 mb-1">Search live gifts from your marketplace catalog</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search gifts, vendors, or tags"
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
          <span className="text-red-200 text-[10px]">
            {loading ? "Refreshing live catalog" : error ? "Live catalog needs attention" : "Catalog synced from backend"}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-start">
        <div className="flex-1 min-w-0">
          <div className="px-4 sm:px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((occasion) => (
                <button
                  key={occasion.id}
                  onClick={() => setActiveOccasion(occasion.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm flex-shrink-0 border transition-all"
                  style={{
                    background: activeOccasion === occasion.id ? BRAND : "white",
                    color: activeOccasion === occasion.id ? "white" : "#374151",
                    borderColor: activeOccasion === occasion.id ? BRAND : "#E5E7EB",
                    fontWeight: activeOccasion === occasion.id ? 700 : 500,
                  }}
                >
                  <span>{occasion.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div
              className="mx-4 sm:mx-5 mb-4 rounded-2xl p-4 text-sm"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", fontWeight: 600 }}
            >
              {error}
            </div>
          )}

          <div
            className="mx-4 sm:mx-5 mb-4 rounded-2xl p-4 flex items-center gap-3"
            style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #C0192A 100%)` }}
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-white text-sm" style={{ fontWeight: 700 }}>
                Live recommendations from your marketplace
              </div>
              <div className="text-red-200 text-xs">
                {uniqueStores > 0
                  ? `${uniqueStores} stores are contributing to your current feed`
                  : "Connect the backend catalog to see real recommendations"}
              </div>
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
              <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                Live Categories
              </span>
              <span className="text-xs text-gray-400">
                {activeCategory ? `${categoryProducts.get(activeCategory)?.length ?? 0} gifts` : "Pick a category"}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors bg-white"
                    style={{
                      borderColor: activeCategory === category ? BRAND : "#F3F4F6",
                      background: activeCategory === category ? "#FFF1F2" : "white",
                    }}
                  >
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm text-white"
                      style={{ background: activeCategory === category ? BRAND : "#B91C1C" }}
                    >
                      {category.slice(0, 1)}
                    </span>
                    <span
                      className="text-[10px] text-center"
                      style={{ color: activeCategory === category ? BRAND : "#4B5563", fontWeight: activeCategory === category ? 700 : 500 }}
                    >
                      {category}
                    </span>
                  </button>
                ))
              ) : (
                <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-4 text-sm text-gray-500">
                  No category data yet from the live catalog.
                </div>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                  {activeCategory ? `${activeCategory} Gifts` : "Category Gift List"}
                </span>
                {activeCategory && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50" style={{ color: BRAND, fontWeight: 700 }}>
                    Linked to category
                  </span>
                )}
              </div>
              {activeCategory && (
              <button
                onClick={() => navigate("/app/gift")}
                className="text-xs flex items-center gap-0.5"
                style={{ color: BRAND, fontWeight: 700 }}
              >
                  More gifts <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {activeCategoryProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeCategoryProducts.map((product, index) => (
                  <div
                    key={`${product.category}-${product.id}-${index}`}
                    className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm text-gray-900 truncate" style={{ fontWeight: 700 }}>
                              {product.name}
                            </div>
                            <div className="text-[11px] mt-0.5" style={{ color: BRAND, fontWeight: 600 }}>
                              {product.category}
                            </div>
                          </div>
                          <span className="text-sm shrink-0" style={{ color: BRAND, fontWeight: 800 }}>
                            P{product.price}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 min-w-0">
                          <MapPin className="w-2.5 h-2.5 text-gray-400" />
                          <span className="text-xs text-gray-400 truncate">
                            {product.store} | {product.location}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background: (product.stock ?? 0) > 0 ? "#ECFDF5" : "#FEF2F2",
                              color: (product.stock ?? 0) > 0 ? "#059669" : "#B91C1C",
                              fontWeight: 700,
                            }}
                          >
                            {(product.stock ?? 0) > 0 ? `${product.stock} in stock` : "Out of stock"}
                          </span>
                          {product.tags.slice(0, 2).map((tag) => (
                            <span
                              key={`${product.id}-${tag}`}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-600"
                              style={{ fontWeight: 600 }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleQuickSelect(product)}
                        disabled={(product.stock ?? 0) <= 0}
                        className="flex-1 py-2.5 rounded-xl text-white text-sm"
                        style={{
                          background: (product.stock ?? 0) > 0 ? BRAND : "#9CA3AF",
                          fontWeight: 700,
                        }}
                      >
                        {(product.stock ?? 0) > 0 ? "Buy Now" : "Unavailable"}
                      </button>
                      <button
                        onClick={() => setSearchQuery(product.name)}
                        className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700"
                        style={{ fontWeight: 700 }}
                      >
                        Search
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-sm text-gray-500">
                {loading
                  ? "Loading category gifts from the live catalog..."
                  : "This category does not have any matching gifts yet."}
              </div>
            )}
          </div>

          <div className="px-4 sm:px-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                  Top Picks For You
                </span>
                <AIBadge module={2} variant="mini" />
              </div>
              <button className="text-xs flex items-center gap-0.5" style={{ color: BRAND }}>
                See all <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {loading && topPicks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-sm text-gray-500">
                Loading live recommendations...
              </div>
            ) : topPicks.length > 0 ? (
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
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full text-white mb-1 inline-block"
                          style={{ background: BRAND, fontWeight: 700 }}
                        >
                          {product.badge}
                        </span>
                      )}
                      <div className="text-sm text-gray-900 truncate" style={{ fontWeight: 700 }}>
                        {product.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                        <MapPin className="w-2.5 h-2.5 text-gray-400" />
                        <span className="text-xs text-gray-400 truncate">
                          {product.store} | {product.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm" style={{ color: BRAND, fontWeight: 800 }}>
                          P{product.price}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600" style={{ fontWeight: 700 }}>
                          {product.match}% match
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: (product.stock ?? 0) > 0 ? "#ECFDF5" : "#FEF2F2",
                            color: (product.stock ?? 0) > 0 ? "#059669" : "#B91C1C",
                            fontWeight: 700,
                          }}
                        >
                          {(product.stock ?? 0) > 0 ? "Buyable" : "Out of stock"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleQuickSelect(product);
                      }}
                      disabled={(product.stock ?? 0) <= 0}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 disabled:opacity-60"
                      style={{ background: (product.stock ?? 0) > 0 ? BRAND : "#9CA3AF" }}
                      title={(product.stock ?? 0) > 0 ? "Buy this gift now" : "This gift is currently unavailable"}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-sm text-gray-500">
                No products matched the current live catalog filters.
              </div>
            )}
          </div>

          <div className="mx-4 sm:mx-5 mb-5 rounded-2xl p-4 flex items-center gap-3 border border-gray-100 bg-white">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#FFF1F2" }}>
              <MapPin className="w-5 h-5" style={{ color: BRAND }} />
            </div>
            <div>
              <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                Shop Local. Support Local.
              </div>
              <div className="text-xs text-gray-400">
                {uniqueStores > 0
                  ? `Featuring ${uniqueStores} stores from the live marketplace catalog`
                  : "Connect Supabase-backed catalog data to spotlight local vendors"}
              </div>
            </div>
            <div className="flex ml-auto">
              {[1, 2, 3].map((value) => (
                <Star key={value} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-4 w-72 lg:w-80 shrink-0 border-l border-gray-100 px-5 py-5 bg-white min-h-full">
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Zap className="w-3.5 h-3.5" style={{ color: BRAND }} />
              <span className="text-xs text-gray-900" style={{ fontWeight: 700 }}>
                AI SYSTEMS
              </span>
            </div>
            <div className="space-y-2">
              {aiModuleCards.map((moduleCard) => (
                <div
                  key={moduleCard.num}
                  className="flex items-center gap-3 rounded-xl p-3 border"
                  style={{ background: moduleCard.bg, borderColor: `${moduleCard.color}20` }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: moduleCard.color }}>
                    <moduleCard.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs" style={{ color: moduleCard.color, fontWeight: 700 }}>
                      {moduleCard.label}
                    </div>
                    <div className="text-[10px] text-gray-500">{moduleCard.desc}</div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: moduleCard.color }} />
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
              <span className="text-xs text-gray-900" style={{ fontWeight: 700 }}>
                PLATFORM STATS
              </span>
            </div>
            <div className="space-y-2">
              {quickStats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 py-2 border-b border-gray-50">
                  <stat.icon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-600 flex-1">{stat.label}</span>
                  <span className="text-sm" style={{ color: BRAND, fontWeight: 800 }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-900 mb-2" style={{ fontWeight: 700 }}>
              TRENDING NOW
            </div>
            <div className="flex flex-wrap gap-1.5">
              {trendingTags.length > 0 ? (
                trendingTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-gray-200 hover:border-red-200 transition-colors bg-white text-gray-600"
                  >
                    {tag}
                  </button>
                ))
              ) : (
                <span className="text-xs text-gray-400">No live trend tags available yet.</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-4 border border-gray-100" style={{ background: "#FBF8F7" }}>
            <div className="text-xs text-gray-900 mb-2" style={{ fontWeight: 700 }}>
              STORE SPOTLIGHT
            </div>
            {storeSpotlight ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-sm text-red-700 shrink-0" style={{ fontWeight: 800 }}>
                  {storeSpotlight.name.slice(0, 1)}
                </div>
                <div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>
                    {storeSpotlight.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {storeSpotlight.items} live listing{storeSpotlight.items === 1 ? "" : "s"} | {storeSpotlight.local ? "Local vendor" : "Marketplace"}
                  </div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star key={value} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400">No live store data available yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
