import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from "react-leaflet";
import type { DeliveryRoutePoint, DeliveryRouteStop } from "@/lib/api";

interface DeliveryRouteMapProps {
  path: DeliveryRoutePoint[];
  stops: DeliveryRouteStop[];
  pickupLabel: string;
  destinationLabel: string;
}

function FitBounds({ points }: { points: DeliveryRoutePoint[] }) {
  const map = useMap();

  if (points.length > 0) {
    const bounds = points.map((point) => [point.lat, point.lng] as [number, number]);
    map.fitBounds(bounds, { padding: [24, 24] });
  }

  return null;
}

export function DeliveryRouteMap({
  path,
  stops,
  pickupLabel,
  destinationLabel,
}: DeliveryRouteMapProps) {
  const fallbackPath = path.length > 0 ? path : [
    { lat: 14.8386, lng: 120.2842 },
    { lat: 14.843, lng: 120.2898 },
  ];

  const pickup = stops.find((stop) => stop.type === "pickup") ?? fallbackPath[0];
  const dropoff = stops.find((stop) => stop.type === "dropoff") ?? fallbackPath[fallbackPath.length - 1];

  return (
    <MapContainer
      center={[dropoff.lat, dropoff.lng]}
      zoom={14}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={fallbackPath} />
      <Polyline
        positions={fallbackPath.map((point) => [point.lat, point.lng] as [number, number])}
        pathOptions={{ color: "#8B1520", weight: 5, opacity: 0.9 }}
      />

      <CircleMarker center={[pickup.lat, pickup.lng]} radius={10} pathOptions={{ color: "#059669", fillColor: "#10B981", fillOpacity: 1 }}>
        <Popup>{pickupLabel}</Popup>
      </CircleMarker>
      <CircleMarker center={[dropoff.lat, dropoff.lng]} radius={10} pathOptions={{ color: "#8B1520", fillColor: "#B91C1C", fillOpacity: 1 }}>
        <Popup>{destinationLabel}</Popup>
      </CircleMarker>
    </MapContainer>
  );
}
