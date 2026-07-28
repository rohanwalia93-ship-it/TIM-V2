import { fetchText } from "@/lib/sources/cache";
import type { SourceMeta } from "@/lib/sources/types";

const AIRPORTS_CSV_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv";
const RUNWAYS_CSV_URL = "https://davidmegginson.github.io/ourairports-data/runways.csv";

export function ourAirportsSourceMeta(): SourceMeta {
  return {
    name: "OurAirports open data",
    url: "https://ourairports.com/data/",
    license: "Public domain",
    retrievedAt: new Date().toISOString(),
  };
}

/** Minimal RFC4180-ish CSV line parser: handles quoted fields containing commas. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  fields.push(cur);
  return fields;
}

interface AirportRow {
  ident: string;
  type: string;
  name: string;
  lat: number;
  lon: number;
  isoCountry: string;
  scheduledService: boolean;
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

let airportsCache: AirportRow[] | null = null;
let runwayCountCache: Map<string, number> | null = null;

async function loadAirports(): Promise<AirportRow[]> {
  if (airportsCache) return airportsCache;
  const text = await fetchText(AIRPORTS_CSV_URL, { revalidateSeconds: 3600 * 24 * 30 });
  if (!text) return [];
  const lines = text.split("\n");
  const header = parseCsvLine(lines[0]);
  const idx = (name: string) => header.indexOf(name);
  const iIdent = idx("ident");
  const iType = idx("type");
  const iName = idx("name");
  const iLat = idx("latitude_deg");
  const iLon = idx("longitude_deg");
  const iCountry = idx("iso_country");
  const iSched = idx("scheduled_service");

  const rows: AirportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const f = parseCsvLine(lines[i]);
    const type = f[iType];
    if (type !== "large_airport" && type !== "medium_airport") continue;
    const lat = Number(f[iLat]);
    const lon = Number(f[iLon]);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    rows.push({
      ident: f[iIdent],
      type,
      name: f[iName],
      lat,
      lon,
      isoCountry: f[iCountry],
      scheduledService: f[iSched] === "yes",
    });
  }
  airportsCache = rows;
  return rows;
}

async function loadRunwayCounts(): Promise<Map<string, number>> {
  if (runwayCountCache) return runwayCountCache;
  const text = await fetchText(RUNWAYS_CSV_URL, { revalidateSeconds: 3600 * 24 * 30 });
  const counts = new Map<string, number>();
  if (text) {
    const lines = text.split("\n");
    const header = parseCsvLine(lines[0]);
    const iAirportIdent = header.indexOf("airport_ident");
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;
      const f = parseCsvLine(lines[i]);
      const ident = f[iAirportIdent];
      if (!ident) continue;
      counts.set(ident, (counts.get(ident) ?? 0) + 1);
    }
  }
  runwayCountCache = counts;
  return counts;
}

export interface NearbyAirport {
  ident: string;
  name: string;
  type: "large_airport" | "medium_airport";
  distanceKm: number;
  runwayCount: number;
  scheduledService: boolean;
}

export interface AirConnectivityResult {
  airports: NearbyAirport[];
  seatCapacityProxyScore: number; // 0-100, derived from airport class + runway counts within range
  source: SourceMeta;
}

/**
 * Finds large/medium airports within radiusKm of a city and uses runway
 * count + airport class as a capacity proxy (no free seat-capacity dataset
 * exists, so this stands in per the spec's "runways = capacity proxy" note).
 */
export async function getAirConnectivity(
  lat: number,
  lon: number,
  radiusKm = 100,
): Promise<AirConnectivityResult | null> {
  const [airports, runwayCounts] = await Promise.all([loadAirports(), loadRunwayCounts()]);
  if (airports.length === 0) return null;

  const nearby: NearbyAirport[] = airports
    .map((a) => ({ a, d: haversineKm(lat, lon, a.lat, a.lon) }))
    .filter(({ d }) => d <= radiusKm)
    .sort((x, y) => x.d - y.d)
    .slice(0, 10)
    .map(({ a, d }) => ({
      ident: a.ident,
      name: a.name,
      type: a.type as "large_airport" | "medium_airport",
      distanceKm: Math.round(d * 10) / 10,
      runwayCount: runwayCounts.get(a.ident) ?? 0,
      scheduledService: a.scheduledService,
    }));

  const seatCapacityProxyScore = Math.min(
    100,
    nearby.reduce((sum, a) => {
      const classWeight = a.type === "large_airport" ? 25 : 10;
      const runwayWeight = Math.min(a.runwayCount, 4) * 6;
      const scheduledBonus = a.scheduledService ? 10 : 0;
      return sum + classWeight + runwayWeight + scheduledBonus;
    }, 0),
  );

  return { airports: nearby, seatCapacityProxyScore, source: ourAirportsSourceMeta() };
}
