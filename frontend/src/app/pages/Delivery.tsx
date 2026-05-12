import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, MapPin, Clock, CheckCircle2, Navigation, Route, Zap, Shield } from "lucide-react";
import { useGift } from "../context/GiftContext";
import { AIBadge } from "../components/AIBadge";
import { api } from "@/lib/api";
import { appSlotToApiSlot } from "@/lib/zippo-mappers";

const BRAND = "#8B1520";

const timeSlots = [
  { id: "morning"   as const, label: "Morning",   sub: "8am–12pm",  emoji: "🌅", available: true },
  { id: "afternoon" as const, label: "Afternoon",  sub: "12pm–5pm",  emoji: "☀️", available: false, note: "Full" },
  { id: "evening"   as const, label: "Evening",    sub: "5pm–9pm",   emoji: "🌙", available: true },
];

const etaSteps = [
  { label: "Order Placed",    done: true  },
  { label: "Rider Assigned",  done: true  },
  { label: "Picked Up",       done: false },
  { label: "En Route",        done: false },
  { label: "Delivered",       done: false },
];

export default function Delivery() {
  const navigate = useNavigate();
  const { giftParams, selectedProduct, orderDetails, setOrderDetails } = useGift();
  const [selectedSlot, setSelectedSlot] = useState(giftParams.timeSlot);
  const [address, setAddress] = useState(orderDetails.address);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const product = selectedProduct ?? { name: "Gordon's Bibingka Box", price: 250, store: "Gordon's Market" };

  const handleConfirm = async () => {
    setError("");
    setConfirming(true);
    try {
      const now = new Date();
      const orderSeed = Number(String(now.getTime()).slice(-6));
      const barangay = address.split(",")[0]?.trim() || "Barangay 5";
      const optimized = await api.optimizeDelivery({
        order_id: orderSeed,
        time_slot: appSlotToApiSlot(selectedSlot),
        barangay,
        lat: 14.8386,
        lng: 120.2842,
      });

      const riderName = optimized.rider_name || orderDetails.riderName;
      const riderId = String(optimized.rider_id ?? orderDetails.riderId).replace(/^#?/, "#");
      const distanceKm = typeof optimized.distance_km === "number" ? `${optimized.distance_km.toFixed(1)} km away` : orderDetails.riderDistance;
      const etaWindow = selectedSlot === "morning" ? "8:00 AM - 12:00 PM" : selectedSlot === "afternoon" ? "12:00 PM - 5:00 PM" : "5:00 PM - 9:00 PM";

      setOrderDetails({
        riderName,
        riderId,
        riderArea: barangay,
        riderDistance: distanceKm,
        address,
        orderId: `ZIP-${now.getFullYear()}-${String(orderSeed).slice(-4)}`,
        orderDate: now.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
        estimatedTime: etaWindow,
      });

      navigate("/app/confirmed");
    } catch {
      setError("Unable to optimize delivery right now. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="overflow-x-hidden" style={{ background: "#FAFAFA" }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate("/app/recommendations")} className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-200">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h2 className="text-gray-900" style={{ fontWeight: 800, fontSize: 17 }}>Delivery Details</h2>
            <p className="text-xs text-gray-400">Module 3 — Rider Assignment</p>
          </div>
        </div>
        <AIBadge module={3} label="Delivery Optimizer Active" />
      </div>

      {/* Desktop 2-col */}
      <div className="flex flex-col md:flex-row md:items-start">

        {/* ── Left form column ── */}
        <div className="flex-1 px-5 py-5 space-y-4">

          {/* Rider assigned */}
          <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#ECFDF5", borderBottom: "1px solid #D1FAE5" }}>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-700" style={{ fontWeight: 700 }}>MODULE 3 — RIDER ASSIGNED</span>
            </div>
            <div className="p-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: BRAND, fontSize: 18, fontWeight: 800 }}>
                CR
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-900" style={{ fontWeight: 800 }}>
                  Rider {orderDetails.riderName.split(" ")[0]} {orderDetails.riderName.split(" ")[1]}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-gray-500">ID {orderDetails.riderId}</span>
                  <span className="text-gray-300 mx-1">·</span>
                  <MapPin className="w-2.5 h-2.5 text-gray-400" />
                  <span className="text-xs text-gray-500">{orderDetails.riderArea}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Navigation className="w-2.5 h-2.5 text-emerald-500" />
                  <span className="text-xs text-emerald-600" style={{ fontWeight: 600 }}>{orderDetails.riderDistance}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="px-2.5 py-1 rounded-full text-xs text-emerald-700 bg-emerald-50" style={{ fontWeight: 700 }}>ETA 25 min</div>
                <div className="text-[10px] text-gray-400 mt-1">Closest rider</div>
                <div className="text-[10px] text-gray-400">2/5 slots used</div>
              </div>
            </div>
            <div className="px-4 pb-3">
              <div className="text-[11px] text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <span style={{ fontWeight: 600 }}>Why Carlos was assigned:</span> Closest available rider · Morning slot open
              </div>
            </div>
          </div>

          {/* Time slot */}
          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <label className="text-sm text-gray-700 mb-3 block" style={{ fontWeight: 700 }}>TIME SLOT</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => slot.available && setSelectedSlot(slot.id)}
                  disabled={!slot.available}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all relative"
                  style={{
                    borderColor: selectedSlot === slot.id ? BRAND : "#E5E7EB",
                    background:  !slot.available ? "#F9FAFB" : selectedSlot === slot.id ? "#FFF1F2" : "white",
                    opacity:     !slot.available ? 0.6 : 1,
                  }}
                >
                  <span className="text-lg">{slot.emoji}</span>
                  <span className="text-xs" style={{ color: selectedSlot === slot.id ? BRAND : "#374151", fontWeight: 700 }}>{slot.label}</span>
                  <span className="text-[10px] text-gray-400">{slot.sub}</span>
                  {slot.note && <span className="absolute top-1.5 right-1.5 text-[9px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded">{slot.note}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <label className="text-sm text-gray-700 mb-2 block" style={{ fontWeight: 700 }}>DELIVERY ADDRESS</label>
            <div className="flex items-start gap-2 mb-3">
              <MapPin className="w-4 h-4 shrink-0 mt-2" style={{ color: BRAND }} />
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="flex-1 text-sm text-gray-700 outline-none resize-none border rounded-lg p-2"
                style={{ borderColor: "#E5E7EB" }}
              />
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
              <span className="text-[11px] text-green-700">
                <strong>Time slot guaranteed</strong> — your gift arrives before 12pm.
              </span>
            </div>
          </div>

          {/* Order summary */}
          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <label className="text-sm text-gray-700 mb-3 block" style={{ fontWeight: 700 }}>ORDER SUMMARY</label>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Gift</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Store</span>
                <span className="text-gray-700" style={{ fontWeight: 600 }}>{product.store}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Price</span>
                <span style={{ color: BRAND, fontWeight: 700 }}>₱{product.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery</span>
                <span className="text-gray-700" style={{ fontWeight: 600 }}>₱50</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="text-gray-900" style={{ fontWeight: 700 }}>Total</span>
                <span style={{ color: BRAND, fontWeight: 800 }}>₱{product.price + 50}</span>
              </div>
            </div>
          </div>

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full py-4 rounded-2xl text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: BRAND, fontWeight: 800, fontSize: 15 }}
          >
            {confirming ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Confirming Order…</>
            ) : (
              <><CheckCircle2 className="w-5 h-5" />Confirm Order ↗</>
            )}
          </button>
          {error && (
            <div className="rounded-xl p-3 text-sm text-red-700" style={{ background: "#FEF2F2", border: "1px solid #FECACA", fontWeight: 600 }}>
              {error}
            </div>
          )}
        </div>

        {/* ── Desktop right panel: map + ETA ── */}
        <div className="hidden md:flex flex-col gap-4 w-80 lg:w-96 shrink-0 border-l border-gray-100 px-5 py-5 bg-white">

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-gray-100" style={{ height: 280, background: "#E8F4F8", position: "relative" }}>
            {/* Stylised map placeholder */}
            <div className="absolute inset-0 flex flex-col" style={{ background: "linear-gradient(180deg, #dce8f0 0%, #c8dde8 100%)" }}>
              {/* Road grid */}
              {[20, 40, 60, 80].map(pct => (
                <div key={pct} className="absolute left-0 right-0" style={{ top: `${pct}%`, height: 2, background: "white", opacity: 0.5 }} />
              ))}
              {[20, 40, 60, 80].map(pct => (
                <div key={pct} className="absolute top-0 bottom-0" style={{ left: `${pct}%`, width: 2, background: "white", opacity: 0.5 }} />
              ))}
              {/* Rider pin */}
              <div className="absolute" style={{ top: "35%", left: "30%" }}>
                <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center">
                  <span className="text-white text-sm">🛵</span>
                </div>
                <div className="mt-1 bg-white rounded-lg px-2 py-1 shadow text-[10px]" style={{ fontWeight: 700 }}>Carlos</div>
              </div>
              {/* Destination pin */}
              <div className="absolute" style={{ top: "65%", left: "60%" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg" style={{ background: BRAND }}>
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="mt-1 bg-white rounded-lg px-2 py-1 shadow text-[10px]" style={{ fontWeight: 700 }}>You</div>
              </div>
              {/* Route line */}
              <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
                <polyline
                  points="34%,39% 45%,45% 55%,55% 64%,69%"
                  style={{ stroke: BRAND, strokeWidth: 3, strokeDasharray: "6 4", fill: "none", opacity: 0.7 }}
                />
              </svg>
            </div>
            {/* ETA overlay */}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-700" style={{ fontWeight: 700 }}>LIVE TRACKING</span>
            </div>
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow">
              <div className="text-xs text-gray-500">ETA</div>
              <div className="text-sm text-gray-900" style={{ fontWeight: 800 }}>25 min</div>
            </div>
          </div>

          {/* Delivery timeline */}
          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Route className="w-4 h-4" style={{ color: BRAND }} />
              <span className="text-xs text-gray-900" style={{ fontWeight: 700 }}>DELIVERY TIMELINE</span>
            </div>
            <div className="space-y-3">
              {etaSteps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: step.done ? "#059669" : i === etaSteps.findIndex(s => !s.done) ? BRAND : "#E5E7EB" }}
                    >
                      {step.done ? <CheckCircle2 className="w-3 h-3 text-white" /> : <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    {i < etaSteps.length - 1 && <div className="w-0.5 h-4 mt-1" style={{ background: step.done ? "#059669" : "#E5E7EB" }} />}
                  </div>
                  <span className="text-xs" style={{ color: step.done ? "#059669" : i === etaSteps.findIndex(s => !s.done) ? BRAND : "#9CA3AF", fontWeight: step.done || i === etaSteps.findIndex(s => !s.done) ? 700 : 400 }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI guarantees */}
          <div className="rounded-2xl p-4" style={{ background: "#ECFDF5", border: "1px solid #D1FAE5" }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-700" style={{ fontWeight: 700 }}>AI DELIVERY GUARANTEE</span>
            </div>
            {[
              "Time slot locked — cannot be reassigned",
              "GPS tracking active throughout delivery",
              "Auto-reassign if rider is unreachable",
            ].map((g) => (
              <div key={g} className="flex items-center gap-2 mb-1.5 last:mb-0">
                <Zap className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="text-[11px] text-emerald-700">{g}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
