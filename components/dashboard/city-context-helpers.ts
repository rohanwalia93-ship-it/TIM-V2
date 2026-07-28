import type { ResolvedValue, SourceMeta } from "@/lib/sources/types";

/** Builds a "High confidence" ResolvedValue straight from a live API result. Returns null when the API had nothing — callers render an explicit empty state rather than fabricating a value. */
export function liveResolvedValue<T>(
  key: string,
  label: string,
  live: { value: T; source: SourceMeta } | null | undefined,
  unit?: string,
): ResolvedValue<T> | null {
  if (!live) return null;
  return { key, label, unit, value: live.value, confidence: "high", source: live.source };
}
