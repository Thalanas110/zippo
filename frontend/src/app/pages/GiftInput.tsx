import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, Sparkles, Brain, Lightbulb, Gift, Star } from "lucide-react";
import { useGift } from "../context/GiftContext";
import { AIBadge } from "../components/AIBadge";
import { api } from "@/lib/api";
import { budgetToRange, rankedProductToUiProduct } from "@/lib/zippo-mappers";

const BRAND = "#8B1520";

const bibingkaImg = "https://images.unsplash.com/photo-1718934628487-f600d3861d0e?w=400&auto=format&fit=crop";
const hamperImg = "https://images.unsplash.com/photo-1773450970959-cef81e9b1053?w=400&auto=format&fit=crop";
const giftBoxImg = "https://images.unsplash.com/photo-1545844568-98bb15133ec0?w=400&auto=format&fit=crop";

const occasions = [
  { id: "Birthday", emoji: "🎂" }, { id: "Graduation", emoji: "🎓" },
  { id: "Anniversary", emoji: "💍" }, { id: "Christmas", emoji: "🎄" },
  { id: "Thank You", emoji: "🙏" }, { id: "New Baby", emoji: "👶" },
  { id: "Get Well", emoji: "💊" }, { id: "Promotion", emoji: "🏆" },
];

const recipients = [
  { id: "Parent", emoji: "👨‍👩‍👧" }, { id: "Friend", emoji: "🤝" },
  { id: "Partner", emoji: "❤️" }, { id: "Sibling", emoji: "👫" },
  { id: "Boss", emoji: "👔" }, { id: "Teacher", emoji: "📚" },
  { id: "Colleague", emoji: "💼" }, { id: "Client", emoji: "🤝" },
];

const timeSlots = [
  { id: "morning" as const, label: "Morning", sub: "8am–12pm", emoji: "🌅" },
  { id: "afternoon" as const, label: "Afternoon", sub: "12pm–5pm", emoji: "☀️" },
  { id: "evening" as const, label: "Evening", sub: "5pm–9pm", emoji: "🌙" },
];

const previewItems = [
  { img: bibingkaImg, name: "Gordon's Bibingka Box", match: 95, price: 250 },
  { img: hamperImg, name: "Barrio Fiesta Hamper", match: 81, price: 499 },
  { img: giftBoxImg, name: "Premium Gift Box", match: 78, price: 699 },
];

const tips = [
  "Budget ₱300–₱600 hits the sweet spot for most occasions.",
  "Food gifts have the highest acceptance rate in Olongapo.",
  "Morning slots have 3x faster delivery fulfillment.",
];

export default function GiftInput() {
  const navigate = useNavigate();
  const { giftParams, setGiftParams, setRecommendations, numericUserId } = useGift();

  const [occasion, setOccasion] = useState(giftParams.occasion);
  const [recipient, setRecipient] = useState(giftParams.recipient);
  const [budget, setBudget] = useState(giftParams.budget);
  const [timeSlot, setTimeSlot] = useState(giftParams.timeSlot);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const minBudget = 100;
  const maxBudget = 5000;

  const handleFindGifts = async () => {
    setGiftParams({ occasion, recipient, budget, timeSlot });
    setLoading(true);
    setError("");
    try {
      const budgetRange = budgetToRange(budget);
      const giftFilter = await api.giftFilter({
        occasion,
        recipient_type: recipient,
        budget_range: budgetRange,
        prefer_local: true,
        user_id: numericUserId || null,
      });

      let mergedResults = giftFilter.results;
      if (numericUserId > 0) {
        try {
          const cbf = await api.cbf({
            user_id: numericUserId,
            occasion,
            recipient_type: recipient,
            top_k: 10,
          });
          const seen = new Set<string>();
          mergedResults = [...cbf.results, ...giftFilter.results].filter((row) => {
            const key = String(row.id);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        } catch {
          // Keep Gift Intelligence results if CBF fails.
        }
      }

      const mapped = mergedResults.slice(0, 10).map((row, idx) => rankedProductToUiProduct(row, idx));
      setRecommendations(mapped);
      navigate("/app/recommendations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch gift recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const SelectGrid = ({
    items,
    value,
    onChange,
  }: {
    items: { id: string; emoji: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className="flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center"
          style={{
            borderColor: value === item.id ? BRAND : "#E5E7EB",
            background: value === item.id ? "#FFF1F2" : "white",
          }}
        >
          <span className="text-xl">{item.emoji}</span>
          <span className="text-[10px] leading-tight" style={{ color: value === item.id ? BRAND : "#6B7280", fontWeight: value === item.id ? 700 : 500 }}>
            {item.id}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-full" style={{ background: "#FAFAFA" }}>
      <div className="px-5 pt-4 pb-5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/app/home")} className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-200">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h2 className="text-gray-900" style={{ fontWeight: 800, fontSize: 17 }}>Find a Gift</h2>
            <p className="text-xs text-gray-400">Tell us about the occasion and we'll find the perfect gift.</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AIBadge module={1} variant="pill" label="Gift Intelligence" />
          <AIBadge module={2} variant="pill" label="Personalizer" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:gap-0">
        <div className="flex-1 px-5 py-5 space-y-6">
          <div>
            <label className="text-sm text-gray-700 mb-3 block" style={{ fontWeight: 700 }}>OCCASION</label>
            <SelectGrid items={occasions} value={occasion} onChange={setOccasion} />
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-3 block" style={{ fontWeight: 700 }}>RECIPIENT</label>
            <SelectGrid items={recipients} value={recipient} onChange={setRecipient} />
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-1.5 block" style={{ fontWeight: 700 }}>BUDGET RANGE</label>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">₱{minBudget.toLocaleString()}</span>
              <span className="text-lg px-3 py-1 rounded-xl" style={{ color: BRAND, fontWeight: 800, background: "#FFF1F2" }}>
                ₱{budget.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400">₱{maxBudget.toLocaleString()}</span>
            </div>
            <div className="relative h-6 flex items-center">
              <div className="absolute left-0 right-0 h-1.5 rounded-full" style={{ background: "#E5E7EB" }} />
              <div className="absolute left-0 h-1.5 rounded-full" style={{ background: BRAND, width: `${((budget - minBudget) / (maxBudget - minBudget)) * 100}%` }} />
              <input type="range" min={minBudget} max={maxBudget} step={50} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="absolute left-0 right-0 w-full opacity-0 cursor-pointer h-6" />
              <div className="absolute w-5 h-5 rounded-full bg-white border-2 shadow-md pointer-events-none" style={{ borderColor: BRAND, left: `calc(${((budget - minBudget) / (maxBudget - minBudget)) * 100}% - 10px)` }} />
            </div>
            <div className="flex gap-2 mt-3">
              {[200, 500, 1000, 2000].map((b) => (
                <button key={b} onClick={() => setBudget(b)} className="flex-1 py-1.5 rounded-lg text-xs border transition-all"
                  style={{ borderColor: budget === b ? BRAND : "#E5E7EB", background: budget === b ? "#FFF1F2" : "white", color: budget === b ? BRAND : "#6B7280", fontWeight: budget === b ? 700 : 500 }}>
                  ₱{b >= 1000 ? `${b / 1000}k` : b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-3 block" style={{ fontWeight: 700 }}>DELIVERY TIME SLOT</label>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => (
                <button key={slot.id} onClick={() => setTimeSlot(slot.id)} className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all"
                  style={{ borderColor: timeSlot === slot.id ? BRAND : "#E5E7EB", background: timeSlot === slot.id ? "#FFF1F2" : "white" }}>
                  <span className="text-xl">{slot.emoji}</span>
                  <span className="text-xs" style={{ color: timeSlot === slot.id ? BRAND : "#374151", fontWeight: 700 }}>{slot.label}</span>
                  <span className="text-[10px] text-gray-400">{slot.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: "#EFF6FF", border: "1px solid #DBEAFE" }}>
            <Brain className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              <span style={{ fontWeight: 700 }}>Module 1 + 2 will run on submit.</span> Gift Intelligence analyzes your inputs, then Personalizer ranks the top matches for {recipient}.
            </p>
          </div>

          <button
            onClick={handleFindGifts}
            disabled={loading}
            className="w-full py-4 rounded-2xl text-white flex items-center justify-center gap-2.5 transition-all hover:opacity-90"
            style={{ background: loading ? "#C0192A" : BRAND, fontWeight: 800, fontSize: 15 }}
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>AI Modules Running...</span></>
            ) : (
              <><Sparkles className="w-5 h-5" />Find Gifts ↗</>
            )}
          </button>

          {error && (
            <div className="rounded-xl p-3 text-sm text-red-700" style={{ background: "#FEF2F2", border: "1px solid #FECACA", fontWeight: 600 }}>
              {error}
            </div>
          )}

          {loading && (
            <div className="rounded-xl p-4" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
              {[
                { module: 1, label: "Gift Intelligence", desc: `Scanning for ${occasion} · ${recipient} · ₱${budget}`, color: "#2563EB" },
                { module: 2, label: "Personalizer", desc: "Ranking matches based on recipient profile...", color: "#7C3AED" },
              ].map((m) => (
                <div key={m.module} className="flex items-center gap-2.5 mb-2 last:mb-0">
                  <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px]" style={{ background: m.color, fontWeight: 800 }}>{m.module}</div>
                  <div className="flex-1">
                    <div className="text-xs" style={{ color: m.color, fontWeight: 700 }}>{m.label}</div>
                    <div className="text-[10px] text-gray-500">{m.desc}</div>
                  </div>
                  <div className="w-4 h-4 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: m.color }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:flex flex-col gap-5 w-72 lg:w-80 shrink-0 border-l border-gray-100 px-5 py-5 bg-white">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-4 h-4" style={{ color: BRAND }} />
              <span className="text-xs text-gray-900" style={{ fontWeight: 700 }}>GIFT PREVIEW</span>
              <AIBadge module={2} variant="mini" />
            </div>
            <p className="text-xs text-gray-500">Based on your selections, these might match:</p>
          </div>

          <div className="space-y-3">
            {previewItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 bg-gray-50">
                <img src={item.img} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-900 truncate" style={{ fontWeight: 700 }}>{item.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs" style={{ color: BRAND, fontWeight: 800 }}>₱{item.price}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600" style={{ fontWeight: 700 }}>{item.match}%</span>
                  </div>
                </div>
                {i === 0 && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />}
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4" style={{ background: "#F5F3FF", border: "1px solid #DDD6FE" }}>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-purple-700" style={{ fontWeight: 700 }}>AI TIPS</span>
            </div>
            <div className="space-y-2">
              {tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-white mt-0.5" style={{ background: "#7C3AED", fontSize: 9, fontWeight: 800 }}>{i + 1}</div>
                  <p className="text-[11px] text-purple-700 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4 border border-gray-100" style={{ background: "#FAFAFA" }}>
            <div className="text-xs text-gray-700 mb-2" style={{ fontWeight: 700 }}>YOUR SELECTIONS</div>
            {[
              { label: "Occasion", value: occasion || "—" },
              { label: "Recipient", value: recipient || "—" },
              { label: "Budget", value: `₱${budget.toLocaleString()}` },
              { label: "Time Slot", value: timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1) },
            ].map((row) => (
              <div key={row.label} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                <span className="text-[11px] text-gray-500">{row.label}</span>
                <span className="text-[11px] text-gray-900" style={{ fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
