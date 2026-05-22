import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Star, MapPin, Users, TrendingUp, BarChart2, Gift } from "lucide-react";
import { useGift } from "../context/GiftContext";
import type { Product } from "../context/GiftContext";
import { ProductDetailModal } from "../components/ProductDetailModal";

const BRAND = "#8B1520";

export default function Recommendations() {
  const navigate = useNavigate();
  const { giftParams, userName, setSelectedProduct, recommendations } = useGift();
  const [selected, setSelected] = useState<number | string | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const recommendationList = recommendations;

  const averageMatch = useMemo(() => {
    if (recommendationList.length === 0) return null;
    const total = recommendationList.reduce((sum, item) => sum + item.match, 0);
    return Math.round(total / recommendationList.length);
  }, [recommendationList]);

  const localPickCount = useMemo(
    () => recommendationList.filter((item) => item.location.toLowerCase().includes("local")).length,
    [recommendationList],
  );

  const topStore = useMemo(() => {
    const storeMap = new Map<string, { name: string; items: number }>();
    for (const item of recommendationList) {
      const key = item.store.trim();
      const current = storeMap.get(key) ?? { name: key, items: 0 };
      current.items += 1;
      storeMap.set(key, current);
    }
    return [...storeMap.values()].sort((a, b) => b.items - a.items)[0] ?? null;
  }, [recommendationList]);

  const handleSelect = (product: Product) => {
    setSelectedProduct(product);
    navigate("/app/delivery");
  };

  const firstName = userName.split(" ")[0] || "Buyer";

  return (
    <div className="overflow-x-hidden" style={{ background: "#FAFAFA" }}>
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

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            Personalized for <strong>{firstName}</strong>
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            Occasion: {giftParams.occasion}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            Recipient: {giftParams.recipient}
          </span>
          {giftParams.giftType !== "Any" && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              Type: {giftParams.giftType}
            </span>
          )}
          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            Budget: P{giftParams.budget.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-start">
        <div className="flex-1 px-5 py-5 space-y-4">
          {recommendationList.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#FFF1F2" }}>
                <Gift className="w-6 h-6" style={{ color: BRAND }} />
              </div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 800 }}>No live recommendations yet</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Run the gift search again after the catalog is reachable so this page can show products from the database instead of placeholders.
              </p>
              <button
                onClick={() => navigate("/app/gift")}
                className="mt-5 px-4 py-2.5 rounded-xl text-white"
                style={{ background: BRAND, fontWeight: 700 }}
              >
                Back to Gift Search
              </button>
            </div>
          ) : (
            recommendationList.map((product, index) => (
              <div
                key={product.id}
                onClick={() => setSelected(product.id)}
                className="rounded-2xl border-2 bg-white overflow-hidden cursor-pointer transition-all"
                style={{
                  borderColor: selected === product.id ? BRAND : index === 0 ? `${BRAND}30` : "#E5E7EB",
                  boxShadow: index === 0 ? "0 4px 20px rgba(139,21,32,0.12)" : undefined,
                }}
              >
                {index === 0 && (
                  <div className="px-4 py-2 flex items-center gap-2" style={{ background: BRAND }}>
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white text-xs" style={{ fontWeight: 700 }}>TOP PERSONALIZED PICK</span>
                  </div>
                )}
                <div className="p-4 flex gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        if (product.fallbackImage && event.currentTarget.src !== product.fallbackImage) {
                          event.currentTarget.src = product.fallbackImage;
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs text-gray-400 mb-0.5 block">#{index + 1} | {product.store}</span>
                        <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{product.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 min-w-0">
                          {product.storeLogo ? (
                            <img
                              src={product.storeLogo}
                              alt={product.store}
                              className="w-5 h-5 rounded-md border border-gray-100 bg-white shrink-0"
                            />
                          ) : null}
                          <MapPin className="w-2.5 h-2.5 text-gray-400" />
                          <span className="text-xs text-gray-400 truncate">{product.location}</span>
                        </div>
                      </div>
                      <span className="text-sm shrink-0" style={{ color: BRAND, fontWeight: 800 }}>P{product.price}</span>
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
                      {product.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#F0FDF4", color: "#059669", fontWeight: 600 }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setDetailProduct(product);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm"
                    style={{ fontWeight: 700 }}
                  >
                    Details
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSelect(product);
                    }}
                    className="flex-1 py-2.5 rounded-xl text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                    style={{ background: index === 0 ? BRAND : "#374151", fontWeight: 700, fontSize: 13 }}
                  >
                    {index === 0 ? "Select this top pick" : `Select #${index + 1}`}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:flex flex-col gap-4 w-72 lg:w-80 shrink-0 border-l border-gray-100 px-5 py-5 bg-white">
          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-gray-900" style={{ fontWeight: 700 }}>RECOMMENDATION PULSE</span>
                </div>
            </div>
            <div className="space-y-2">
              {[
                { label: "Shortlisted Gifts", value: recommendationList.length > 0 ? String(recommendationList.length) : "--" },
                { label: "Average Match", value: averageMatch !== null ? `${averageMatch}%` : "--" },
                { label: "Local Picks", value: recommendationList.length > 0 ? String(localPickCount) : "--" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className="text-sm" style={{ color: BRAND, fontWeight: 800 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 p-4" style={{ background: "#F5F3FF" }}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-purple-700" style={{ fontWeight: 700 }}>MATCH COMPARISON</span>
            </div>
            {recommendationList.length > 0 ? (
              recommendationList.slice(0, 5).map((item, index) => (
                <div key={item.id} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-gray-700">#{index + 1} {item.name.split(" ").slice(0, 2).join(" ")}</span>
                    <span className="text-[11px]" style={{ color: index === 0 ? "#059669" : "#7C3AED", fontWeight: 700 }}>{item.match}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-purple-100">
                    <div className="h-full rounded-full transition-all" style={{ width: `${item.match}%`, background: index === 0 ? "#059669" : "#7C3AED" }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500">Recommendation bars will appear here after a live search.</div>
            )}
          </div>

          <div className="rounded-xl p-4 border border-blue-100" style={{ background: "#EFF6FF" }}>
            <div className="text-xs text-blue-700 mb-2" style={{ fontWeight: 700 }}>WHY THESE PICKS?</div>
            <div className="text-[11px] text-blue-600 leading-relaxed">
              Module 2 ranked these gifts for <strong>{giftParams.occasion}</strong> and <strong>{giftParams.recipient}</strong> within a budget of <strong>P{giftParams.budget.toLocaleString()}</strong>. Higher scores mean the product aligns more closely with the current request.
            </div>
          </div>

          <div className="rounded-xl p-4 border border-gray-100" style={{ background: "#FAFAFA" }}>
            <div className="text-xs text-gray-900 mb-3" style={{ fontWeight: 700 }}>TOP STORE</div>
            {topStore ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-sm shrink-0" style={{ color: BRAND, fontWeight: 800 }}>
                  {topStore.name.slice(0, 1)}
                </div>
                <div>
                  <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>{topStore.name}</div>
                  <div className="text-xs text-gray-500">{topStore.items} shortlisted gift{topStore.items === 1 ? "" : "s"}</div>
                  <div className="flex items-center gap-0.5 mt-0.5">{[1, 2, 3, 4, 5].map((value) => <Star key={value} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />)}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500">No live store data is available for this search yet.</div>
            )}
          </div>

          <div className="mt-auto text-[11px] text-gray-400 flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            Results update when the live buyer search produces a new recommendation set.
          </div>
        </div>
      </div>
      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onBuyNow={(product) => {
          setDetailProduct(null);
          handleSelect(product);
        }}
      />
    </div>
  );
}
