import { z } from "zod";
import type { SourceMeta } from "@/lib/sources/types";

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

const OverpassElementSchema = z.object({
  type: z.enum(["node", "way", "relation"]),
  id: z.number(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: z.object({ lat: z.number(), lon: z.number() }).optional(),
  geometry: z.array(z.object({ lat: z.number(), lon: z.number() })).optional(),
  tags: z.record(z.string(), z.string()).optional(),
});

const OverpassResponseSchema = z.object({
  elements: z.array(OverpassElementSchema),
});

export type OverpassElement = z.infer<typeof OverpassElementSchema>;

export function overpassSourceMeta(): SourceMeta {
  return {
    name: "OpenStreetMap Overpass API",
    url: "https://overpass-api.de/",
    license: "ODbL",
    retrievedAt: new Date().toISOString(),
  };
}

async function queryOverpass(ql: string): Promise<OverpassElement[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch(OVERPASS_ENDPOINT, {
      method: "POST",
      body: `data=${encodeURIComponent(ql)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: controller.signal,
      next: { revalidate: 3600 * 24 },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    const parsed = OverpassResponseSchema.safeParse(json);
    if (!parsed.success) return null;
    return parsed.data.elements;
  } catch {
    return null;
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Shoelace formula on an equirectangular projection around a reference latitude — good enough for site-scale (<50km) polygons. */
function polygonAreaSqm(points: { lat: number; lon: number }[], refLat: number): number {
  if (points.length < 3) return 0;
  const R = 6371000;
  const cosRef = Math.cos((refLat * Math.PI) / 180);
  const xy = points.map((p) => ({
    x: ((p.lon * Math.PI) / 180) * R * cosRef,
    y: ((p.lat * Math.PI) / 180) * R,
  }));
  let area = 0;
  for (let i = 0; i < xy.length; i++) {
    const j = (i + 1) % xy.length;
    area += xy[i].x * xy[j].y - xy[j].x * xy[i].y;
  }
  return Math.abs(area / 2);
}

export interface HotelSupplyResult {
  hotelCount: number;
  estimatedRooms: number;
  source: SourceMeta;
}

/** Sums OSM-tagged hotel/guest-house/hostel supply within radiusKm; estimates rooms from the `rooms` tag where present, else a per-property average. */
export async function getHotelSupply(
  lat: number,
  lon: number,
  radiusKm = 15,
): Promise<HotelSupplyResult | null> {
  const radiusM = radiusKm * 1000;
  const ql = `[out:json][timeout:20];
(
  node["tourism"~"hotel|guest_house|hostel|motel"](around:${radiusM},${lat},${lon});
  way["tourism"~"hotel|guest_house|hostel|motel"](around:${radiusM},${lat},${lon});
);
out center tags;`;
  const elements = await queryOverpass(ql);
  if (elements === null) return null;

  const AVG_ROOMS_PER_PROPERTY = 90;
  let taggedRooms = 0;
  let taggedCount = 0;
  for (const el of elements) {
    const rooms = el.tags?.rooms ? Number(el.tags.rooms) : undefined;
    if (rooms && !Number.isNaN(rooms)) {
      taggedRooms += rooms;
      taggedCount += 1;
    }
  }
  const untaggedCount = elements.length - taggedCount;
  const estimatedRooms = taggedRooms + untaggedCount * AVG_ROOMS_PER_PROPERTY;

  return {
    hotelCount: elements.length,
    estimatedRooms: Math.round(estimatedRooms),
    source: overpassSourceMeta(),
  };
}

export interface ComparableAttraction {
  id: number;
  name: string;
  category: string;
  lat: number;
  lon: number;
  distanceKm: number;
}

/** Comparable tourism attractions / venues nearby, used for the dashboard list, Huff competitive share, and TALC density signal. */
export async function getComparableAttractions(
  lat: number,
  lon: number,
  radiusKm = 25,
): Promise<{ attractions: ComparableAttraction[]; source: SourceMeta } | null> {
  const radiusM = radiusKm * 1000;
  const ql = `[out:json][timeout:20];
(
  node["tourism"~"attraction|theme_park|zoo|museum|aquarium"](around:${radiusM},${lat},${lon});
  way["tourism"~"attraction|theme_park|zoo|museum|aquarium"](around:${radiusM},${lat},${lon});
  node["leisure"~"water_park|park"](around:${radiusM},${lat},${lon});
);
out center tags;`;
  const elements = await queryOverpass(ql);
  if (elements === null) return null;

  const attractions: ComparableAttraction[] = elements
    .map((el) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLon = el.lon ?? el.center?.lon;
      if (elLat === undefined || elLon === undefined) return null;
      const name = el.tags?.name ?? "Unnamed attraction";
      const category = el.tags?.tourism ?? el.tags?.leisure ?? "attraction";
      return {
        id: el.id,
        name,
        category,
        lat: elLat,
        lon: elLon,
        distanceKm: Math.round(haversineKm(lat, lon, elLat, elLon) * 10) / 10,
      };
    })
    .filter((a): a is ComparableAttraction => a !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 30);

  return { attractions, source: overpassSourceMeta() };
}

export interface SiteAreaResult {
  areaSqm: number;
  name: string;
  source: SourceMeta;
}

/** Finds the nearest tagged natural/protected area polygon and computes its area — feeds the Cifuentes Physical Carrying Capacity calc. */
export async function getNaturalSiteArea(
  lat: number,
  lon: number,
  radiusKm = 20,
): Promise<SiteAreaResult | null> {
  const radiusM = radiusKm * 1000;
  const ql = `[out:json][timeout:25];
(
  way["boundary"="protected_area"](around:${radiusM},${lat},${lon});
  way["leisure"="nature_reserve"](around:${radiusM},${lat},${lon});
  relation["boundary"="protected_area"](around:${radiusM},${lat},${lon});
);
out geom tags;`;
  const elements = await queryOverpass(ql);
  if (elements === null || elements.length === 0) return null;

  let best: { areaSqm: number; name: string; distance: number } | null = null;
  for (const el of elements) {
    if (!el.geometry || el.geometry.length < 3) continue;
    const area = polygonAreaSqm(el.geometry, lat);
    const centerLat = el.geometry.reduce((s, p) => s + p.lat, 0) / el.geometry.length;
    const centerLon = el.geometry.reduce((s, p) => s + p.lon, 0) / el.geometry.length;
    const distance = haversineKm(lat, lon, centerLat, centerLon);
    if (!best || distance < best.distance) {
      best = { areaSqm: area, name: el.tags?.name ?? "Nearby protected/natural area", distance };
    }
  }
  if (!best || best.areaSqm === 0) return null;

  return { areaSqm: best.areaSqm, name: best.name, source: overpassSourceMeta() };
}
