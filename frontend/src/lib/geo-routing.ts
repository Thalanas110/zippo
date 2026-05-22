import type { DeliveryRoutePoint, DeliveryRouteStop } from "@/lib/api";

export interface GeocodedAddress {
  lat: number;
  lng: number;
  label: string;
}

function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
}

function normalizeAddress(address: string): string {
  const raw = address.trim();
  if (!raw) return "Olongapo City, Philippines";
  if (/philippines/i.test(raw)) return raw;
  return `${raw}, Olongapo City, Philippines`;
}

export async function geocodeAddress(address: string): Promise<GeocodedAddress | null> {
  if (!isLocalHost()) return null;

  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    countrycodes: "ph",
    q: normalizeAddress(address),
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { "Accept-Language": "en", "User-Agent": "zippo-local-demo" },
  });

  if (!response.ok) return null;

  const results = (await response.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
  }>;

  const first = results[0];
  if (!first?.lat || !first?.lon) return null;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    lat,
    lng,
    label: first.display_name || normalizeAddress(address),
  };
}

export async function fetchRoadRoute(
  points: DeliveryRoutePoint[],
): Promise<DeliveryRoutePoint[] | null> {
  const valid = points.filter(
    (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng),
  );
  if (valid.length < 2) return null;

  const coordinates = valid.map((point) => `${point.lng},${point.lat}`).join(";");
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "false",
  });

  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coordinates}?${params.toString()}`,
  );
  if (!response.ok) return null;

  const data = (await response.json()) as {
    routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
  };

  const routeCoords = data.routes?.[0]?.geometry?.coordinates;
  if (!routeCoords || routeCoords.length < 2) return null;

  return routeCoords.map(([lng, lat]) => ({ lat, lng }));
}

export function buildRouteWaypointSequence(
  pickup: DeliveryRoutePoint,
  dropoff: DeliveryRoutePoint,
  stops: DeliveryRouteStop[],
): DeliveryRoutePoint[] {
  const orderedStops = [...stops]
    .filter((stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng))
    .sort((left, right) => left.sequence - right.sequence)
    .map((stop) => ({ lat: stop.lat, lng: stop.lng }));

  if (orderedStops.length >= 2) return orderedStops;
  return [pickup, dropoff];
}
