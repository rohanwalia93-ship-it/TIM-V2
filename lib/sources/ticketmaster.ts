import { z } from "zod";
import { fetchJson } from "@/lib/sources/cache";
import type { SourceMeta } from "@/lib/sources/types";

const PriceRangeSchema = z.object({
  type: z.string().optional(),
  currency: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});

const EventSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().optional(),
  dates: z.object({ start: z.object({ localDate: z.string().optional() }).optional() }).optional(),
  priceRanges: z.array(PriceRangeSchema).optional(),
  classifications: z
    .array(
      z.object({
        segment: z.object({ name: z.string() }).optional(),
        genre: z.object({ name: z.string() }).optional(),
      }),
    )
    .optional(),
  _embedded: z
    .object({
      venues: z
        .array(
          z.object({
            name: z.string(),
            city: z.object({ name: z.string() }).optional(),
            location: z.object({ latitude: z.string().optional(), longitude: z.string().optional() }).optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

const EventsResponseSchema = z.object({
  _embedded: z.object({ events: z.array(EventSchema) }).optional(),
  page: z.object({ totalElements: z.number() }).optional(),
});

export interface ComparableEvent {
  id: string;
  name: string;
  date: string | null;
  venueName: string | null;
  segment: string | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string | null;
  url: string | null;
}

export interface TicketmasterResult {
  events: ComparableEvent[];
  totalElements: number;
  source: SourceMeta;
}

export function ticketmasterSourceMeta(): SourceMeta {
  return {
    name: "Ticketmaster Discovery API",
    url: "https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/",
    license: "Free developer tier",
    retrievedAt: new Date().toISOString(),
  };
}

export function hasTicketmasterKey(): boolean {
  return Boolean(process.env.TICKETMASTER_API_KEY);
}

/**
 * Comparable events/venues near a city, used both for the City Context
 * Dashboard and as the draw/pricing benchmark for the Event archetype model.
 * Returns null (never throws) when the key is missing or the API is
 * unreachable — callers fall back to a cited benchmark, per spec Section 6.
 */
export async function getComparableEvents(
  city: string,
  countryCode: string,
  keyword?: string,
): Promise<TicketmasterResult | null> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    apikey: apiKey,
    city,
    countryCode,
    size: "20",
    sort: "relevance,desc",
  });
  if (keyword) params.set("keyword", keyword);

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
  const raw = await fetchJson<unknown>(url, { revalidateSeconds: 3600 * 6 });
  if (!raw) return null;
  const parsed = EventsResponseSchema.safeParse(raw);
  if (!parsed.success) return null;

  const events: ComparableEvent[] = (parsed.data._embedded?.events ?? []).map((e) => {
    const priceRange = e.priceRanges?.[0];
    const venue = e._embedded?.venues?.[0];
    return {
      id: e.id,
      name: e.name,
      date: e.dates?.start?.localDate ?? null,
      venueName: venue?.name ?? null,
      segment: e.classifications?.[0]?.segment?.name ?? null,
      priceMin: priceRange?.min ?? null,
      priceMax: priceRange?.max ?? null,
      currency: priceRange?.currency ?? null,
      url: e.url ?? null,
    };
  });

  return {
    events,
    totalElements: parsed.data.page?.totalElements ?? events.length,
    source: ticketmasterSourceMeta(),
  };
}
