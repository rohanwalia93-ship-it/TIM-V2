/**
 * Shared fetch helper for all lib/sources clients.
 * Uses Next.js's fetch cache (`next.revalidate`) so repeated calls within
 * the revalidation window are served from Next's data cache instead of
 * hitting the upstream API again. Never throws: callers always get either
 * parsed JSON or null, so a dead upstream degrades to a benchmark/user
 * fallback instead of crashing a page.
 */
export interface FetchJsonOptions {
  revalidateSeconds?: number;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export async function fetchJson<T = unknown>(
  url: string,
  opts: FetchJsonOptions = {},
): Promise<T | null> {
  const { revalidateSeconds = 3600, headers, timeoutMs = 10_000 } = opts;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers,
      signal: controller.signal,
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchText(
  url: string,
  opts: FetchJsonOptions = {},
): Promise<string | null> {
  const { revalidateSeconds = 3600 * 24, timeoutMs = 15_000 } = opts;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
