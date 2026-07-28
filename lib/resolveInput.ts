import type { Confidence, ResolvedValue, SourceMeta } from "@/lib/sources/types";

interface ResolveInputArgs<T> {
  key: string;
  label: string;
  unit?: string;
  /** A live value fetched from a free API this session, if available */
  live?: { value: T; source: SourceMeta } | null;
  /** A cited industry-benchmark default, always required as the last resort */
  benchmark: { value: T; source: SourceMeta };
  /** A value the user has explicitly typed/edited in the UI */
  userOverride?: T;
  note?: string;
}

/**
 * Single choke point for every number that reaches the UI.
 * Priority: user override > live API > cited benchmark.
 * A user override always drops confidence to "low" (a stated assumption),
 * even when it overwrites an otherwise live-sourced value, per spec:
 * "no code path may return an untagged number."
 */
export function resolveInput<T>(args: ResolveInputArgs<T>): ResolvedValue<T> {
  const { key, label, unit, live, benchmark, userOverride, note } = args;

  if (userOverride !== undefined) {
    const confidence: Confidence = "low";
    return {
      key,
      label,
      unit,
      value: userOverride,
      confidence,
      note: note ?? "User-entered assumption (overrides fetched/benchmark value).",
      source: {
        name: "User assumption",
        url: "",
        license: "N/A",
        retrievedAt: new Date().toISOString(),
      },
    };
  }

  if (live) {
    return {
      key,
      label,
      unit,
      value: live.value,
      confidence: "high",
      note,
      source: live.source,
    };
  }

  return {
    key,
    label,
    unit,
    value: benchmark.value,
    confidence: "medium",
    note: note ?? "Live data unavailable — using a cited industry benchmark.",
    source: benchmark.source,
  };
}

/** Derives an overall confidence rating from the mix of resolved inputs behind a verdict. */
export function overallConfidence(values: ResolvedValue[]): Confidence {
  if (values.length === 0) return "low";
  const score = values.reduce((sum, v) => {
    if (v.confidence === "high") return sum + 1;
    if (v.confidence === "medium") return sum + 0.6;
    return sum + 0.2;
  }, 0);
  const ratio = score / values.length;
  if (ratio >= 0.8) return "high";
  if (ratio >= 0.5) return "medium";
  return "low";
}
