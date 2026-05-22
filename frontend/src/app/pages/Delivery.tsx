import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, MapPin, CheckCircle2, Navigation, Route } from "lucide-react";
import { useGift } from "../context/GiftContext";
import { DeliveryRouteMap } from "../components/DeliveryRouteMap";
import { api, type DeliveryOptimizeResponse, type DeliveryRoutePoint, type DeliveryRouteStop } from "@/lib/api";
import { appSlotToApiSlot } from "@/lib/zippo-mappers";
import { buildRouteWaypointSequence, fetchRoadRoute, geocodeAddress } from "@/lib/geo-routing";

const BRAND = "#8B1520";
const DEFAULT_LAT = 14.8386;
const DEFAULT_LNG = 120.2842;

const timeSlots = [
  { id: "morning" as const, label: "Morning", sub: "8am-12pm", available: true },
  { id: "afternoon" as const, label: "Afternoon", sub: "12pm-5pm", available: false, note: "Full" },
  { id: "evening" as const, label: "Evening", sub: "5pm-9pm", available: true },
];

const etaSteps = [
  { label: "Order Placed", done: true },
  { label: "Rider Assigned", done: true },
  { label: "Picked Up", done: false },
  { label: "En Route", done: false },
  { label: "Delivered", done: false },
];

type ResolvedDestination = {
  lat: number;
  lng: number;
  label: string;
};

function stopsMatchRouteEndpoints(
  stops: DeliveryRouteStop[],
  pickup: DeliveryRoutePoint,
  dropoff: DeliveryRoutePoint,
): boolean {
  if (stops.length < 2) return false;
  const first = stops[0];
  const last = stops[stops.length - 1];
  const closeToPickup = Math.abs(first.lat - pickup.lat) < 0.0008 && Math.abs(first.lng - pickup.lng) < 0.0008;
  const closeToDropoff = Math.abs(last.lat - dropoff.lat) < 0.0008 && Math.abs(last.lng - dropoff.lng) < 0.0008;
  const distinctEndpoints =
    Math.abs(first.lat - last.lat) > 0.0001 || Math.abs(first.lng - last.lng) > 0.0001;
  return closeToPickup && closeToDropoff && distinctEndpoints;
}

function buildFallbackStops(
  pickup: DeliveryRoutePoint,
  dropoff: DeliveryRoutePoint,
): DeliveryRouteStop[] {
  return [
    { sequence: 1, type: "pickup", lat: pickup.lat, lng: pickup.lng },
    { sequence: 2, type: "dropoff", lat: dropoff.lat, lng: dropoff.lng },
  ];
}

export default function Delivery() {
  const navigate = useNavigate();
  const { giftParams, selectedProduct, orderDetails, setOrderDetails } = useGift();
  const [selectedSlot, setSelectedSlot] = useState(giftParams.timeSlot);
  const [address, setAddress] = useState(orderDetails.address);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<DeliveryOptimizeResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState("");
  const [previewPath, setPreviewPath] = useState<DeliveryRoutePoint[]>([]);
  const [previewStops, setPreviewStops] = useState<DeliveryRouteStop[]>([]);
  const [destination, setDestination] = useState<ResolvedDestination>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    label: orderDetails.address,
  });
  const [previewOrderSeed] = useState(() => Number(String(Date.now()).slice(-6)));

  const product = selectedProduct ?? { name: "Gift order", price: 0, store: "ZIPPO Marketplace" };
  const pickupPoint = useMemo<DeliveryRoutePoint>(
    () => ({
      lat: selectedProduct?.storeLat ?? DEFAULT_LAT,
      lng: selectedProduct?.storeLng ?? DEFAULT_LNG,
    }),
    [selectedProduct?.storeLat, selectedProduct?.storeLng],
  );

  useEffect(() => {
    let active = true;

    async function loadPreview() {
      setPreviewLoading(true);
      setPreviewError("");

      const resolvedDestination =
        (await geocodeAddress(address).catch(() => null)) ?? {
          lat: DEFAULT_LAT,
          lng: DEFAULT_LNG,
          label: address || "Delivery destination",
        };

      if (!active) return;
      setDestination(resolvedDestination);

      try {
        const response = await api.optimizeDelivery({
          order_id: previewOrderSeed,
          time_slot: appSlotToApiSlot(selectedSlot),
          barangay: address.split(",")[0]?.trim() || "Barangay 5",
          lat: resolvedDestination.lat,
          lng: resolvedDestination.lng,
          pickup_lat: pickupPoint.lat,
          pickup_lng: pickupPoint.lng,
        });

        if (!active) return;

        const fallbackStops = buildFallbackStops(pickupPoint, resolvedDestination);
        const stops =
          response.stops && stopsMatchRouteEndpoints(response.stops, pickupPoint, resolvedDestination)
            ? response.stops
            : fallbackStops;
        const snappedPath =
          (await fetchRoadRoute(
            buildRouteWaypointSequence(pickupPoint, resolvedDestination, stops),
          ).catch(() => null)) ??
          response.path ??
          buildRouteWaypointSequence(pickupPoint, resolvedDestination, stops);

        if (!active) return;

        setPreview(response);
        setPreviewStops(stops);
        setPreviewPath(snappedPath);
      } catch {
        if (!active) return;

        const fallbackStops = buildFallbackStops(pickupPoint, resolvedDestination);
        const snappedPath =
          (await fetchRoadRoute([pickupPoint, resolvedDestination]).catch(() => null)) ?? [
            pickupPoint,
            resolvedDestination,
          ];

        setPreview(null);
        setPreviewStops(fallbackStops);
        setPreviewPath(snappedPath);
        setPreviewError("Rider assignment preview is unavailable right now, but the route preview still reflects the mapped road network.");
      } finally {
        if (active) {
          setPreviewLoading(false);
        }
      }
    }

    void loadPreview();

    return () => {
      active = false;
    };
  }, [address, pickupPoint, previewOrderSeed, selectedSlot]);

  const riderName = preview?.rider_name || orderDetails.riderName;
  const riderId = preview?.rider_id ? `#${String(preview.rider_id).replace(/^#?/, "")}` : orderDetails.riderId;
  const riderArea = address.split(",")[0]?.trim() || orderDetails.riderArea;
  const riderDistance =
    typeof preview?.distance_km === "number"
      ? `${preview.distance_km.toFixed(1)} km away`
      : orderDetails.riderDistance;
  const etaMinutes =
    typeof preview?.estimated_minutes === "number"
      ? `${Math.round(preview.estimated_minutes)} min`
      : orderDetails.etaMinutes;
  const assignmentReason =
    preview?.reason ||
    orderDetails.assignmentReason ||
    "Closest available rider for your selected time slot.";

  const handleConfirm = async () => {
    setError("");
    setConfirming(true);
    try {
      const now = new Date();
      const orderSeed = Number(String(now.getTime()).slice(-6));
      const barangay = address.split(",")[0]?.trim() || "Barangay 5";
      const resolvedDestination =
        destination.lat && destination.lng
          ? destination
          : ((await geocodeAddress(address).catch(() => null)) ?? {
              lat: DEFAULT_LAT,
              lng: DEFAULT_LNG,
              label: address || "Delivery destination",
            });

      const optimized = await api.optimizeDelivery({
        order_id: orderSeed,
        time_slot: appSlotToApiSlot(selectedSlot),
        barangay,
        lat: resolvedDestination.lat,
        lng: resolvedDestination.lng,
        pickup_lat: pickupPoint.lat,
        pickup_lng: pickupPoint.lng,
      });

      const fallbackStops = buildFallbackStops(pickupPoint, resolvedDestination);
      const finalStops =
        optimized.stops && stopsMatchRouteEndpoints(optimized.stops, pickupPoint, resolvedDestination)
          ? optimized.stops
          : previewStops.length > 0
            ? previewStops
            : fallbackStops;
      const finalPath =
        (await fetchRoadRoute(
          buildRouteWaypointSequence(pickupPoint, resolvedDestination, finalStops),
        ).catch(() => null)) ??
        previewPath ??
        optimized.path ??
        buildRouteWaypointSequence(pickupPoint, resolvedDestination, finalStops);

      const etaWindow =
        selectedSlot === "morning"
          ? "8:00 AM - 12:00 PM"
          : selectedSlot === "afternoon"
            ? "12:00 PM - 5:00 PM"
            : "5:00 PM - 9:00 PM";

      setOrderDetails({
        riderName: optimized.rider_name || orderDetails.riderName,
        riderId: String(optimized.rider_id ?? orderDetails.riderId).replace(/^#?/, "#"),
        riderArea: barangay,
        riderDistance:
          typeof optimized.distance_km === "number"
            ? `${optimized.distance_km.toFixed(1)} km away`
            : orderDetails.riderDistance,
        address,
        orderId: `ZIP-${now.getFullYear()}-${String(orderSeed).slice(-4)}`,
        orderDate: now.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
        estimatedTime: etaWindow,
        etaMinutes:
          typeof optimized.estimated_minutes === "number"
            ? `${Math.round(optimized.estimated_minutes)} min`
            : etaMinutes,
        assignmentReason: optimized.reason || assignmentReason,
        routePath: finalPath,
        routeStops: finalStops,
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
      <div className="px-5 pt-4 pb-5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate("/app/recommendations")} className="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-200">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h2 className="text-gray-900" style={{ fontWeight: 800, fontSize: 17 }}>
              Delivery Details
            </h2>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-start">
        <div className="flex-1 px-5 py-5 space-y-4">
          <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
            <div className="p-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: BRAND, fontSize: 18, fontWeight: 800 }}>
                {riderName
                  .split(" ")
                  .filter(Boolean)
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-900" style={{ fontWeight: 800 }}>
                  Rider {riderName}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-gray-500">ID {riderId}</span>
                  <span className="text-gray-300 mx-1">|</span>
                  <MapPin className="w-2.5 h-2.5 text-gray-400" />
                  <span className="text-xs text-gray-500">{riderArea}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Navigation className="w-2.5 h-2.5 text-emerald-500" />
                  <span className="text-xs text-emerald-600" style={{ fontWeight: 600 }}>
                    {riderDistance}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="px-2.5 py-1 rounded-full text-xs text-emerald-700 bg-emerald-50" style={{ fontWeight: 700 }}>
                  ETA {etaMinutes}
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  {previewLoading ? "Refreshing preview" : "Mapped route preview"}
                </div>
              </div>
            </div>
            <div className="px-4 pb-3">
              <div className="text-[11px] text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                <span style={{ fontWeight: 600 }}>Why this rider was assigned:</span> {assignmentReason}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <label className="text-sm text-gray-700 mb-3 block" style={{ fontWeight: 700 }}>
              TIME SLOT
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => slot.available && setSelectedSlot(slot.id)}
                  disabled={!slot.available}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all relative"
                  style={{
                    borderColor: selectedSlot === slot.id ? BRAND : "#E5E7EB",
                    background: !slot.available ? "#F9FAFB" : selectedSlot === slot.id ? "#FFF1F2" : "white",
                    opacity: !slot.available ? 0.6 : 1,
                  }}
                >
                  <span className="text-xs" style={{ color: selectedSlot === slot.id ? BRAND : "#374151", fontWeight: 700 }}>
                    {slot.label}
                  </span>
                  <span className="text-[10px] text-gray-400">{slot.sub}</span>
                  {slot.note && <span className="absolute top-1.5 right-1.5 text-[9px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded">{slot.note}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <label className="text-sm text-gray-700 mb-2 block" style={{ fontWeight: 700 }}>
              DELIVERY ADDRESS
            </label>
            <div className="flex items-start gap-2 mb-3">
              <MapPin className="w-4 h-4 shrink-0 mt-2" style={{ color: BRAND }} />
              <textarea
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                rows={2}
                className="flex-1 text-sm text-gray-700 outline-none resize-none border rounded-lg p-2"
                style={{ borderColor: "#E5E7EB" }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <label className="text-sm text-gray-700 mb-3 block" style={{ fontWeight: 700 }}>
              ORDER SUMMARY
            </label>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Gift</span>
                <span className="text-gray-900" style={{ fontWeight: 600 }}>
                  {product.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Store</span>
                <span className="text-gray-700" style={{ fontWeight: 600 }}>
                  {product.store}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Price</span>
                <span style={{ color: BRAND, fontWeight: 700 }}>P{product.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery</span>
                <span className="text-gray-700" style={{ fontWeight: 600 }}>P50</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="text-gray-900" style={{ fontWeight: 700 }}>
                  Total
                </span>
                <span style={{ color: BRAND, fontWeight: 800 }}>P{product.price + 50}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full py-4 rounded-2xl text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: BRAND, fontWeight: 800, fontSize: 15 }}
          >
            {confirming ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Confirming Order...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Confirm Order
              </>
            )}
          </button>
          {error && (
            <div className="rounded-xl p-3 text-sm text-red-700" style={{ background: "#FEF2F2", border: "1px solid #FECACA", fontWeight: 600 }}>
              {error}
            </div>
          )}
        </div>

        <div className="hidden md:flex flex-col gap-4 w-80 lg:w-96 shrink-0 border-l border-gray-100 px-5 py-5 bg-white">
          <div className="rounded-2xl overflow-hidden border border-gray-100" style={{ height: 280, position: "relative" }}>
            {previewPath.length > 0 ? (
              <DeliveryRouteMap
                path={previewPath}
                stops={previewStops}
                pickupLabel={`${product.store} pickup`}
                destinationLabel={destination.label || address || "Delivery destination"}
              />
            ) : (
              <div className="h-full flex items-center justify-center px-6 text-center text-sm text-gray-500 bg-slate-50">
                {previewLoading ? "Loading mapped route preview..." : previewError || "No route preview available yet."}
              </div>
            )}
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow flex items-center gap-2 z-[500]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-700" style={{ fontWeight: 700 }}>
                ROUTE PREVIEW
              </span>
            </div>
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow z-[500]">
              <div className="text-xs text-gray-500">ETA</div>
              <div className="text-sm text-gray-900" style={{ fontWeight: 800 }}>
                {etaMinutes}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Route className="w-4 h-4" style={{ color: BRAND }} />
              <span className="text-xs text-gray-900" style={{ fontWeight: 700 }}>
                DELIVERY TIMELINE
              </span>
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
                  <span
                    className="text-xs"
                    style={{
                      color: step.done ? "#059669" : index === etaSteps.findIndex((entry) => !entry.done) ? BRAND : "#9CA3AF",
                      fontWeight: step.done || index === etaSteps.findIndex((entry) => !entry.done) ? 700 : 400,
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
