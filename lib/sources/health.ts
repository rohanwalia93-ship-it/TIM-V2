import { hasTicketmasterKey } from "@/lib/sources/ticketmaster";
import { getWorldBankIndicator } from "@/lib/sources/worldbank";
import { getFxRate } from "@/lib/sources/fx";

/**
 * Adapter status per brief §7 — every source client reports one of these, rather than the
 * app just silently seeing `null` and falling back. This module probes each adapter directly
 * (bypassing the app's cached fetchJson so a stale Next.js data-cache entry can't mask a
 * currently-broken upstream) so /data-health reflects live reality.
 */
export type AdapterStatus = "connected" | "stale" | "rate-limited" | "unavailable" | "authentication-required";

export interface AdapterHealth {
  key: string;
  name: string;
  status: AdapterStatus;
  detail: string;
  latencyMs: number | null;
  checkedAt: string;
}

interface ProbeResult {
  ok: boolean;
  httpStatus: number | null;
  error?: string;
  latencyMs: number;
}

async function probe(url: string, init?: RequestInit, timeoutMs = 8000): Promise<ProbeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    return { ok: res.ok, httpStatus: res.status, latencyMs: Date.now() - start };
  } catch (e) {
    return { ok: false, httpStatus: null, error: e instanceof Error ? e.message : "unknown error", latencyMs: Date.now() - start };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Only a bare 401 is treated as "authentication-required" — that's the standard "you must
 * authenticate" code. A 403 is deliberately NOT mapped there: for keyless public adapters
 * (Nominatim, Overpass, Open-Meteo, REST Countries, Wikipedia) a 403 far more often means a
 * network policy, WAF, or User-Agent block than "this API needs a credential" — conflating
 * the two would mislabel a blocked/unavailable adapter as one needing a key it was never
 * designed to take. Ticketmaster is the one adapter that genuinely needs a key, and that's
 * checked before any network call via hasTicketmasterKey(), not inferred from an HTTP status.
 */
function statusFromProbe(r: ProbeResult): { status: AdapterStatus; detail: string } {
  if (r.httpStatus === 401) return { status: "authentication-required", detail: "HTTP 401" };
  if (r.httpStatus === 429) return { status: "rate-limited", detail: "HTTP 429 — rate limit hit" };
  if (r.ok) return { status: "connected", detail: `HTTP ${r.httpStatus}, ${r.latencyMs}ms` };
  if (r.httpStatus) return { status: "unavailable", detail: `HTTP ${r.httpStatus}` };
  return { status: "unavailable", detail: r.error ?? "no response" };
}

async function checkNominatim(): Promise<AdapterHealth> {
  const r = await probe("https://nominatim.openstreetmap.org/search?q=Abu+Dhabi&format=json&limit=1", {
    headers: { "User-Agent": "TIM-tourism-investment-monitor/0.1 (health-check)" },
  });
  const { status, detail } = statusFromProbe(r);
  return { key: "nominatim", name: "Nominatim (city geocoding)", status, detail, latencyMs: r.latencyMs, checkedAt: new Date().toISOString() };
}

async function checkOpenMeteo(): Promise<AdapterHealth> {
  const r = await probe("https://archive-api.open-meteo.com/v1/archive?latitude=24.45&longitude=54.38&start_date=2024-01-01&end_date=2024-01-02&daily=temperature_2m_max");
  const { status, detail } = statusFromProbe(r);
  return { key: "open-meteo", name: "Open-Meteo (climate)", status, detail, latencyMs: r.latencyMs, checkedAt: new Date().toISOString() };
}

async function checkOurAirports(): Promise<AdapterHealth> {
  const r = await probe("https://davidmegginson.github.io/ourairports-data/airports.csv", { method: "HEAD" });
  const { status, detail } = statusFromProbe(r);
  return { key: "our-airports", name: "OurAirports (CSV bundle)", status, detail, latencyMs: r.latencyMs, checkedAt: new Date().toISOString() };
}

async function checkOverpass(): Promise<AdapterHealth> {
  const r = await probe("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "[out:json][timeout:5];node(24.45,54.38,24.46,54.39)[tourism=hotel];out count;",
  });
  const { status, detail } = statusFromProbe(r);
  return { key: "overpass", name: "OpenStreetMap Overpass (POIs, hotel/attraction points)", status, detail, latencyMs: r.latencyMs, checkedAt: new Date().toISOString() };
}

async function checkRestCountries(): Promise<AdapterHealth> {
  const r = await probe("https://restcountries.com/v3.1/alpha/AE");
  const { status, detail } = statusFromProbe(r);
  return { key: "rest-countries", name: "REST Countries", status, detail, latencyMs: r.latencyMs, checkedAt: new Date().toISOString() };
}

async function checkTicketmaster(): Promise<AdapterHealth> {
  if (!hasTicketmasterKey()) {
    return {
      key: "ticketmaster",
      name: "Ticketmaster Discovery (comparable listings)",
      status: "authentication-required",
      detail: "TICKETMASTER_API_KEY not configured — falls back to a cited benchmark default, not a live call.",
      latencyMs: null,
      checkedAt: new Date().toISOString(),
    };
  }
  const r = await probe(`https://app.ticketmaster.com/discovery/v2/events.json?apikey=${process.env.TICKETMASTER_API_KEY}&size=1`);
  const { status, detail } = statusFromProbe(r);
  return { key: "ticketmaster", name: "Ticketmaster Discovery (comparable listings)", status, detail, latencyMs: r.latencyMs, checkedAt: new Date().toISOString() };
}

async function checkWikipedia(): Promise<AdapterHealth> {
  const r = await probe("https://en.wikipedia.org/api/rest_v1/page/summary/Abu_Dhabi");
  const { status, detail } = statusFromProbe(r);
  return { key: "wikipedia", name: "Wikipedia (destination summary)", status, detail, latencyMs: r.latencyMs, checkedAt: new Date().toISOString() };
}

async function checkWorldBank(): Promise<AdapterHealth> {
  const start = Date.now();
  const result = await getWorldBankIndicator("AE", "touristArrivals");
  const latencyMs = Date.now() - start;
  if (!result) {
    return { key: "world-bank", name: "World Bank Open Data (national macro context)", status: "unavailable", detail: "No response / failed to parse", latencyMs, checkedAt: new Date().toISOString() };
  }
  if (!result.latest) {
    return { key: "world-bank", name: "World Bank Open Data (national macro context)", status: "unavailable", detail: "Connected but no data points returned for this indicator/country", latencyMs, checkedAt: new Date().toISOString() };
  }
  const yearsOld = new Date().getFullYear() - result.latest.year;
  if (yearsOld > 3) {
    return { key: "world-bank", name: "World Bank Open Data (national macro context)", status: "stale", detail: `Latest data point is from ${result.latest.year} (${yearsOld} years old) — typical Bank reporting lag`, latencyMs, checkedAt: new Date().toISOString() };
  }
  return { key: "world-bank", name: "World Bank Open Data (national macro context)", status: "connected", detail: `Latest data point: ${result.latest.year}`, latencyMs, checkedAt: new Date().toISOString() };
}

async function checkFx(): Promise<AdapterHealth> {
  const start = Date.now();
  const result = await getFxRate("USD", "AED");
  const latencyMs = Date.now() - start;
  if (!result) {
    return { key: "fx", name: "Frankfurter (exchange rates)", status: "unavailable", detail: "No response / failed to parse", latencyMs, checkedAt: new Date().toISOString() };
  }
  const daysOld = Math.floor((Date.now() - new Date(result.asOf).getTime()) / 86_400_000);
  if (daysOld > 7) {
    return { key: "fx", name: "Frankfurter (exchange rates)", status: "stale", detail: `Rate date ${result.asOf} is ${daysOld} days old`, latencyMs, checkedAt: new Date().toISOString() };
  }
  return { key: "fx", name: "Frankfurter (exchange rates)", status: "connected", detail: `Rate date: ${result.asOf}`, latencyMs, checkedAt: new Date().toISOString() };
}

export async function checkAllAdapters(): Promise<AdapterHealth[]> {
  const checks = [checkNominatim, checkOpenMeteo, checkOurAirports, checkOverpass, checkRestCountries, checkTicketmaster, checkWikipedia, checkWorldBank, checkFx];
  const settled = await Promise.allSettled(checks.map((c) => c()));
  return settled.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { key: checks[i].name, name: checks[i].name.replace(/^check/, ""), status: "unavailable" as const, detail: "Health check threw an unhandled error", latencyMs: null, checkedAt: new Date().toISOString() },
  );
}
