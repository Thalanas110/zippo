import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  Star,
  Share2,
  Gift,
  Route,
  Zap,
  Sparkles,
} from "lucide-react";
import { useGift } from "../context/GiftContext";
import { DeliveryRouteMap } from "../components/DeliveryRouteMap";
import { api } from "@/lib/api";
import { appSlotToApiSlot, rankedProductToUiProduct } from "@/lib/zippo-mappers";

const BRAND = "#8B1520";

const etaSteps = [
  { label: "Order Placed", done: true },
  { label: "Rider Assigned", done: true },
  { label: "Picked Up", done: false },
  { label: "En Route", done: false },
  { label: "Delivered", done: false },
];

const feedbackOptions = ["Needs Work", "Okay", "Good", "Great", "Excellent"];

export default function Confirmed() {
  const navigate = useNavigate();
  const {
    selectedProduct,
    orderDetails,
    setOrderDetails,
    giftParams,
    numericUserId,
    addOrderHistoryItem,
    setRecommendations,
  } = useGift();
  const product = selectedProduct ?? { id: 1, name: "Gift order", price: 0, store: "ZIPPO Marketplace" };

  const [totals, setTotals] = useState({
    subtotal: product.price,
    deliveryFee: 50,
    totalPrice: product.price + 50,
  });
  const [orderError, setOrderError] = useState("");
  const placedRef = useRef(false);

  useEffect(() => {
    if (placedRef.current) return;
    placedRef.current = true;

    const placeOrder = async () => {
      try {
        const response = await api.createBuyerOrder({
          buyer_user_id: numericUserId || 1,
          occasion: giftParams.occasion,
          recipient_type: giftParams.recipient,
          notes: `Order via ZIPPO frontend for ${giftParams.occasion}`,
          items: [{ product_id: product.id || 1, quantity: 1 }],
          gift_pack: {
            enabled: false,
            style: "standard",
            add_ons: [],
          },
          delivery: {
            address: orderDetails.address,
            fee: 50,
            timeslot: appSlotToApiSlot(giftParams.timeSlot),
          },
        });

        const now = new Date();
        const normalizedOrderId =
          typeof response.order_id === "string"
            ? response.order_id
            : `ZIP-${now.getFullYear()}-${String(response.order_id).padStart(4, "0")}`;
        const orderDate = now.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        setOrderDetails({
          ...orderDetails,
          orderId: normalizedOrderId,
          orderDate,
        });

        setTotals({
          subtotal: response.subtotal,
          deliveryFee: response.delivery_fee,
          totalPrice: response.total_price,
        });

        addOrderHistoryItem({
          id: normalizedOrderId,
          gift: product.name,
          store: product.store,
          date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          total: response.total_price,
          status: "active",
          rider: orderDetails.riderName,
          occasion: giftParams.occasion,
          rating: null,
        });

        if (response.recommendations?.length) {
          setRecommendations(response.recommendations.map((row, idx) => rankedProductToUiProduct(row, idx)));
        }
      } catch {
        setOrderError("Order placement failed. Please try again.");
      }
    };

    void placeOrder();
  }, [
    addOrderHistoryItem,
    giftParams.occasion,
    giftParams.recipient,
    giftParams.timeSlot,
    numericUserId,
    orderDetails,
    product.id,
    product.name,
    product.price,
    product.store,
    setOrderDetails,
    setRecommendations,
  ]);

  return (
    <div className="overflow-x-hidden" style={{ background: "#FAFAFA" }}>
      <div className="px-5 pt-8 pb-6 text-center bg-white border-b border-gray-100">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#ECFDF5", border: "3px solid #D1FAE5" }}>
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: BRAND }}>
            <Package className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <h2 className="text-gray-900 mb-1" style={{ fontWeight: 900, fontSize: 20 }}>Order Confirmed!</h2>
        <div className="text-sm text-gray-500 mb-1">{orderDetails.orderId}</div>
        <div className="text-xs text-gray-400">{orderDetails.orderDate}</div>
        <div className="flex justify-center gap-2 mt-3">
          {[Gift, Sparkles, Route, Package, Star].map((Icon, index) => (
            <span key={index} className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-50 border border-rose-100">
              <Icon className="w-4 h-4" style={{ color: BRAND }} />
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-start">
        <div className="flex-1 px-5 py-5 space-y-4">
          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <div className="text-sm text-gray-700 mb-3" style={{ fontWeight: 700 }}>Order Summary</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Gift</span><span className="text-gray-900 text-right max-w-[180px]" style={{ fontWeight: 600 }}>{product.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Store</span><span className="text-gray-700" style={{ fontWeight: 500 }}>{product.store}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Price</span><span style={{ color: BRAND, fontWeight: 700 }}>P{totals.subtotal}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="text-gray-700" style={{ fontWeight: 600 }}>P{totals.deliveryFee}</span></div>
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="text-gray-900" style={{ fontWeight: 700 }}>Total</span>
                <span style={{ color: BRAND, fontWeight: 800 }}>P{totals.totalPrice}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: BRAND, fontWeight: 800, fontSize: 14 }}>CR</div>
              <div className="flex-1">
                <div className="text-sm text-gray-900" style={{ fontWeight: 700 }}>Rider {orderDetails.riderName}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600" style={{ fontWeight: 600 }}>ETA {orderDetails.etaMinutes}</span>
                </div>
              </div>
              <div className="flex">{[1, 2, 3, 4, 5].map((value) => <Star key={value} className="w-3 h-3 text-yellow-400 fill-yellow-400" />)}</div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-gray-100">
              <div className="h-full w-1/4 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">Order placed</span>
              <span className="text-[10px] text-emerald-600" style={{ fontWeight: 600 }}>En route</span>
              <span className="text-[10px] text-gray-400">Delivered</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: BRAND }} />
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Delivery Address</div>
                <div className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{orderDetails.address}</div>
              </div>
            </div>
            <div className="border-t border-gray-50" />
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Guaranteed Time Slot</div>
                <div className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{orderDetails.estimatedTime}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button className="py-3.5 rounded-2xl border-2 text-sm flex items-center justify-center gap-1.5 transition-all hover:bg-gray-50" style={{ borderColor: BRAND, color: BRAND, fontWeight: 700 }}>
              <Package className="w-4 h-4" />Track Order
            </button>
            <button onClick={() => navigate("/app/gift")} className="py-3.5 rounded-2xl text-white text-sm flex items-center justify-center gap-1.5 transition-all hover:opacity-90" style={{ background: BRAND, fontWeight: 700 }}>
              <Gift className="w-4 h-4" />New Gift -&gt;
            </button>
          </div>

          <button className="w-full py-3 rounded-2xl border border-gray-200 text-sm flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 transition-colors">
            <Share2 className="w-4 h-4" />Share Order Status
          </button>

          {orderError && (
            <div className="rounded-xl p-3 text-sm text-red-700" style={{ background: "#FEF2F2", border: "1px solid #FECACA", fontWeight: 600 }}>
              {orderError}
            </div>
          )}

          <div className="rounded-2xl p-4 text-center" style={{ background: "#FFF1F2" }}>
            <div className="text-sm text-gray-700 mb-2" style={{ fontWeight: 700 }}>How was our AI recommendation?</div>
            <div className="flex justify-center gap-2 flex-wrap">
              {feedbackOptions.map((label) => (
                <button key={label} className="px-3 py-2 rounded-full text-xs hover:scale-105 transition-transform border border-gray-100 bg-white" style={{ fontWeight: 600 }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-4 w-80 lg:w-96 shrink-0 border-l border-gray-100 px-5 py-5 bg-white">
          <div className="rounded-2xl overflow-hidden border border-gray-100" style={{ height: 280, position: "relative" }}>
            <DeliveryRouteMap
              path={orderDetails.routePath}
              stops={orderDetails.routeStops}
              riderLabel={`Rider ${orderDetails.riderName}`}
              destinationLabel="Delivery destination"
            />
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow flex items-center gap-2 z-[500]">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-emerald-700" style={{ fontWeight: 700 }}>LIVE TRACKING</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Route className="w-4 h-4" style={{ color: BRAND }} />
              <span className="text-xs text-gray-900" style={{ fontWeight: 700 }}>DELIVERY TIMELINE</span>
            </div>
            <div className="space-y-3">
              {etaSteps.map((step, index) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: step.done ? "#059669" : index === etaSteps.findIndex((entry) => !entry.done) ? BRAND : "#E5E7EB" }}
                    >
                      {step.done ? <CheckCircle2 className="w-3 h-3 text-white" /> : <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    {index < etaSteps.length - 1 && <div className="w-0.5 h-4 mt-1" style={{ background: step.done ? "#059669" : "#E5E7EB" }} />}
                  </div>
                  <span className="text-xs" style={{ color: step.done ? "#059669" : index === etaSteps.findIndex((entry) => !entry.done) ? BRAND : "#9CA3AF", fontWeight: step.done || index === etaSteps.findIndex((entry) => !entry.done) ? 700 : 400 }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: "#ECFDF5", border: "1px solid #D1FAE5" }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-700" style={{ fontWeight: 700 }}>DELIVERY GUARANTEE</span>
            </div>
            {[
              "Time slot is locked after confirmation",
              "Leaflet route preview stays synced with the optimizer output",
              "Rider assignment reason is preserved through checkout",
            ].map((guarantee) => (
              <div key={guarantee} className="flex items-center gap-2 mb-1.5 last:mb-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="text-[11px] text-emerald-700">{guarantee}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
