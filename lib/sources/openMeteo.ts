import { z } from "zod";
import { fetchJson } from "@/lib/sources/cache";
import type { SourceMeta } from "@/lib/sources/types";

const ArchiveResponseSchema = z.object({
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: z.array(z.number().nullable()),
    temperature_2m_min: z.array(z.number().nullable()),
    precipitation_sum: z.array(z.number().nullable()),
  }),
});

export interface MonthlyClimate {
  month: number; // 1-12
  avgHighC: number;
  avgLowC: number;
  totalPrecipMm: number;
  comfortableDayShare: number; // 0-1
}

export interface ClimateResult {
  monthly: MonthlyClimate[];
  climateSuitabilityIndex: number; // 0-100, share of comfortable days across the year
  comfortableDaysPerYear: number;
  source: SourceMeta;
  yearAnalyzed: number;
}

/** A day counts as "comfortable" for outdoor tourism when it's neither extreme heat nor heavy-rain. */
function isComfortableDay(tMax: number | null, precip: number | null): boolean {
  if (tMax === null) return false;
  const dryEnough = precip === null || precip < 5;
  return tMax >= 15 && tMax <= 34 && dryEnough;
}

export function openMeteoSourceMeta(): SourceMeta {
  return {
    name: "Open-Meteo Historical Weather Archive",
    url: "https://open-meteo.com/en/docs/historical-weather-api",
    license: "CC BY 4.0",
    retrievedAt: new Date().toISOString(),
  };
}

export async function getClimateSuitability(
  lat: number,
  lon: number,
): Promise<ClimateResult | null> {
  const now = new Date();
  const year = now.getUTCFullYear() - 1; // most recent fully-completed year
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const url =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
    `&start_date=${start}&end_date=${end}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

  const raw = await fetchJson<unknown>(url, { revalidateSeconds: 3600 * 24 * 14 });
  if (!raw) return null;
  const parsed = ArchiveResponseSchema.safeParse(raw);
  if (!parsed.success) return null;

  const { time, temperature_2m_max, temperature_2m_min, precipitation_sum } = parsed.data.daily;
  const byMonth: Record<number, { highs: number[]; lows: number[]; precip: number[]; comfortable: number; total: number }> = {};

  time.forEach((dateStr, i) => {
    const month = Number(dateStr.slice(5, 7));
    byMonth[month] ??= { highs: [], lows: [], precip: [], comfortable: 0, total: 0 };
    const tMax = temperature_2m_max[i];
    const tMin = temperature_2m_min[i];
    const precip = precipitation_sum[i];
    if (tMax !== null) byMonth[month].highs.push(tMax);
    if (tMin !== null) byMonth[month].lows.push(tMin);
    if (precip !== null) byMonth[month].precip.push(precip);
    byMonth[month].total += 1;
    if (isComfortableDay(tMax, precip)) byMonth[month].comfortable += 1;
  });

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const monthly: MonthlyClimate[] = Array.from({ length: 12 }, (_, idx) => {
    const m = idx + 1;
    const d = byMonth[m] ?? { highs: [], lows: [], precip: [], comfortable: 0, total: 1 };
    return {
      month: m,
      avgHighC: Math.round(avg(d.highs) * 10) / 10,
      avgLowC: Math.round(avg(d.lows) * 10) / 10,
      totalPrecipMm: Math.round(d.precip.reduce((a, b) => a + b, 0)),
      comfortableDayShare: d.total ? d.comfortable / d.total : 0,
    };
  });

  const comfortableDaysPerYear = Math.round(
    monthly.reduce((sum, m) => sum + m.comfortableDayShare * (byMonth[m.month]?.total ?? 0), 0),
  );
  const totalDays = time.length || 365;
  const climateSuitabilityIndex = Math.round((comfortableDaysPerYear / totalDays) * 1000) / 10;

  return {
    monthly,
    climateSuitabilityIndex,
    comfortableDaysPerYear,
    yearAnalyzed: year,
    source: openMeteoSourceMeta(),
  };
}
