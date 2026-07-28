import { z } from "zod";
import { fetchJson } from "@/lib/sources/cache";
import type { SourceMeta } from "@/lib/sources/types";

const CountrySchema = z.object({
  name: z.object({ common: z.string(), official: z.string() }),
  cca2: z.string(),
  cca3: z.string(),
  region: z.string().optional(),
  subregion: z.string().optional(),
  population: z.number().optional(),
  area: z.number().optional(),
  latlng: z.array(z.number()).optional(),
  currencies: z.record(z.string(), z.object({ name: z.string(), symbol: z.string().optional() })).optional(),
  flag: z.string().optional(),
});

export interface CountryProfile {
  name: string;
  cca2: string;
  cca3: string;
  region: string;
  subregion: string;
  population: number | null;
  areaSqKm: number | null;
  currencyCode: string | null;
  currencyName: string | null;
  source: SourceMeta;
}

export function restCountriesSourceMeta(): SourceMeta {
  return {
    name: "REST Countries",
    url: "https://restcountries.com/",
    license: "GeoNames CC BY 4.0",
    retrievedAt: new Date().toISOString(),
  };
}

export async function getCountryProfile(countryCode: string): Promise<CountryProfile | null> {
  const url = `https://restcountries.com/v3.1/alpha/${encodeURIComponent(countryCode)}`;
  const raw = await fetchJson<unknown>(url, { revalidateSeconds: 3600 * 24 * 7 });
  if (!raw) return null;
  const arr = Array.isArray(raw) ? raw : [raw];
  const parsed = CountrySchema.safeParse(arr[0]);
  if (!parsed.success) return null;
  const d = parsed.data;
  const currencyEntry = d.currencies ? Object.entries(d.currencies)[0] : undefined;

  return {
    name: d.name.common,
    cca2: d.cca2,
    cca3: d.cca3,
    region: d.region ?? "",
    subregion: d.subregion ?? "",
    population: d.population ?? null,
    areaSqKm: d.area ?? null,
    currencyCode: currencyEntry?.[0] ?? null,
    currencyName: currencyEntry?.[1]?.name ?? null,
    source: restCountriesSourceMeta(),
  };
}
