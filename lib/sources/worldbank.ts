import { z } from "zod";
import { fetchJson } from "@/lib/sources/cache";
import type { SourceMeta } from "@/lib/sources/types";

const WorldBankPointSchema = z.object({
  indicator: z.object({ id: z.string(), value: z.string() }),
  country: z.object({ id: z.string(), value: z.string() }),
  countryiso3code: z.string().optional(),
  date: z.string(),
  value: z.number().nullable(),
  unit: z.string().optional(),
});

const WorldBankResponseSchema = z.tuple([
  z.object({
    page: z.number().optional(),
    pages: z.number().optional(),
    per_page: z.union([z.number(), z.string()]).optional(),
    total: z.number().optional(),
  }),
  z.array(WorldBankPointSchema).nullable(),
]);

export const WORLD_BANK_INDICATORS = {
  touristArrivals: "ST.INT.ARVL",
  touristReceipts: "ST.INT.RCPT.CD",
  gdp: "NY.GDP.MKTP.CD",
  gdpPerCapita: "NY.GDP.PCAP.CD",
  population: "SP.POP.TOTL",
} as const;

export type WorldBankIndicatorKey = keyof typeof WORLD_BANK_INDICATORS;

export interface WorldBankSeriesPoint {
  year: number;
  value: number;
}

export interface WorldBankResult {
  indicatorKey: WorldBankIndicatorKey;
  indicatorCode: string;
  countryCode: string;
  latest: WorldBankSeriesPoint | null;
  trend: WorldBankSeriesPoint[]; // ascending by year, up to 10 most recent points with data
  growthPercent: number | null; // latest vs earliest point in trend
  source: SourceMeta;
}

/**
 * Fetches a World Bank indicator series for a country (ISO 3166-1 alpha-2 or
 * alpha-3 both work against this endpoint) and reduces it to the latest
 * available value plus a short trend, since the Bank frequently lags 1-3
 * years on developing-market data.
 */
export async function getWorldBankIndicator(
  countryCode: string,
  indicatorKey: WorldBankIndicatorKey,
): Promise<WorldBankResult | null> {
  const indicatorCode = WORLD_BANK_INDICATORS[indicatorKey];
  const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(
    countryCode,
  )}/indicator/${indicatorCode}?format=json&per_page=30&date=2005:2024`;

  const raw = await fetchJson<unknown>(url, { revalidateSeconds: 3600 * 24 });
  if (!raw) return null;

  const parsed = WorldBankResponseSchema.safeParse(raw);
  if (!parsed.success || !parsed.data[1]) return null;

  const points = parsed.data[1]
    .filter((p): p is z.infer<typeof WorldBankPointSchema> & { value: number } => p.value !== null)
    .map((p) => ({ year: Number(p.date), value: p.value as number }))
    .sort((a, b) => a.year - b.year);

  if (points.length === 0) {
    return {
      indicatorKey,
      indicatorCode,
      countryCode,
      latest: null,
      trend: [],
      growthPercent: null,
      source: {
        name: "World Bank Open Data",
        url: `https://data.worldbank.org/indicator/${indicatorCode}`,
        license: "CC BY 4.0",
        retrievedAt: new Date().toISOString(),
        indicatorCode,
      },
    };
  }

  const trend = points.slice(-10);
  const latest = trend[trend.length - 1];
  const earliest = trend[0];
  const growthPercent =
    earliest.value !== 0 ? ((latest.value - earliest.value) / Math.abs(earliest.value)) * 100 : null;

  return {
    indicatorKey,
    indicatorCode,
    countryCode,
    latest,
    trend,
    growthPercent,
    source: {
      name: "World Bank Open Data",
      url: `https://data.worldbank.org/indicator/${indicatorCode}?locations=${countryCode}`,
      license: "CC BY 4.0",
      retrievedAt: new Date().toISOString(),
      indicatorCode,
    },
  };
}

export async function getWorldBankProfile(countryCode: string) {
  const keys = Object.keys(WORLD_BANK_INDICATORS) as WorldBankIndicatorKey[];
  const results = await Promise.all(
    keys.map((key) => getWorldBankIndicator(countryCode, key)),
  );
  return Object.fromEntries(keys.map((key, i) => [key, results[i]])) as Record<
    WorldBankIndicatorKey,
    WorldBankResult | null
  >;
}
