import { z } from "zod";
import { fetchJson } from "@/lib/sources/cache";
import type { SourceMeta } from "@/lib/sources/types";

const NominatimResultSchema = z.object({
  place_id: z.number(),
  display_name: z.string(),
  lat: z.string(),
  lon: z.string(),
  type: z.string().optional(),
  class: z.string().optional(),
  importance: z.number().optional(),
  address: z
    .object({
      city: z.string().optional(),
      town: z.string().optional(),
      village: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      country_code: z.string().optional(),
    })
    .optional(),
});

export type NominatimResult = z.infer<typeof NominatimResultSchema>;

export interface CitySearchResult {
  id: number;
  displayName: string;
  cityName: string;
  countryName: string;
  countryCode: string; // ISO 3166-1 alpha-2, lowercase
  lat: number;
  lon: number;
}

const USER_AGENT = "TourViable/1.0 (tourism-viability-tool)";

export function nominatimSourceMeta(): SourceMeta {
  return {
    name: "OpenStreetMap Nominatim",
    url: "https://nominatim.org/release-docs/latest/api/Search/",
    license: "ODbL",
    retrievedAt: new Date().toISOString(),
  };
}

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  if (!query || query.trim().length < 2) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query,
  )}&format=jsonv2&addressdetails=1&featuretype=city&limit=8`;

  const raw = await fetchJson<unknown[]>(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
    revalidateSeconds: 3600 * 24,
  });
  if (!raw) return [];

  const results: CitySearchResult[] = [];
  for (const item of raw) {
    const parsed = NominatimResultSchema.safeParse(item);
    if (!parsed.success) continue;
    const d = parsed.data;
    const cityName = d.address?.city ?? d.address?.town ?? d.address?.village ?? d.display_name.split(",")[0];
    results.push({
      id: d.place_id,
      displayName: d.display_name,
      cityName,
      countryName: d.address?.country ?? "",
      countryCode: (d.address?.country_code ?? "").toUpperCase(),
      lat: Number(d.lat),
      lon: Number(d.lon),
    });
  }
  return results;
}
