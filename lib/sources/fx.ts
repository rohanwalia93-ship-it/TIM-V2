import { z } from "zod";
import { fetchJson } from "@/lib/sources/cache";
import type { SourceMeta } from "@/lib/sources/types";

const FrankfurterSchema = z.object({
  amount: z.number(),
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
});

export function fxSourceMeta(): SourceMeta {
  return {
    name: "Frankfurter FX rates",
    url: "https://www.frankfurter.app/",
    license: "Open (ECB reference rates)",
    retrievedAt: new Date().toISOString(),
  };
}

export interface FxResult {
  base: string;
  target: string;
  rate: number;
  asOf: string;
  source: SourceMeta;
}

export async function getFxRate(base: string, target: string): Promise<FxResult | null> {
  if (base === target) {
    return { base, target, rate: 1, asOf: new Date().toISOString().slice(0, 10), source: fxSourceMeta() };
  }
  const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`;
  const raw = await fetchJson<unknown>(url, { revalidateSeconds: 3600 * 12 });
  if (!raw) return null;
  const parsed = FrankfurterSchema.safeParse(raw);
  if (!parsed.success) return null;
  const rate = parsed.data.rates[target];
  if (rate === undefined) return null;
  return { base, target, rate, asOf: parsed.data.date, source: fxSourceMeta() };
}
