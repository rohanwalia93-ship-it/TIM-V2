import { z } from "zod";
import { fetchJson } from "@/lib/sources/cache";
import type { SourceMeta } from "@/lib/sources/types";

const SummarySchema = z.object({
  title: z.string(),
  extract: z.string(),
  content_urls: z
    .object({ desktop: z.object({ page: z.string() }).optional() })
    .optional(),
  thumbnail: z.object({ source: z.string() }).optional(),
});

export interface WikiSummary {
  title: string;
  extract: string;
  pageUrl: string | null;
  thumbnailUrl: string | null;
  source: SourceMeta;
}

export function wikipediaSourceMeta(pageUrl?: string): SourceMeta {
  return {
    name: "Wikipedia",
    url: pageUrl ?? "https://en.wikipedia.org/",
    license: "CC BY-SA 4.0",
    retrievedAt: new Date().toISOString(),
  };
}

/** Plain-English context blurb for a city or landmark, via Wikipedia's REST summary endpoint. */
export async function getWikiSummary(title: string): Promise<WikiSummary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const raw = await fetchJson<unknown>(url, { revalidateSeconds: 3600 * 24 * 7 });
  if (!raw) return null;
  const parsed = SummarySchema.safeParse(raw);
  if (!parsed.success) return null;
  const pageUrl = parsed.data.content_urls?.desktop?.page ?? null;
  return {
    title: parsed.data.title,
    extract: parsed.data.extract,
    pageUrl,
    thumbnailUrl: parsed.data.thumbnail?.source ?? null,
    source: wikipediaSourceMeta(pageUrl ?? undefined),
  };
}
