import type { ResolvedValue } from "@/lib/sources/types";
import { resolveInput } from "@/lib/resolveInput";
import { toSourceMeta, type Benchmark } from "@/lib/benchmarks";

/** Wraps resolveInput for the common "live value may exist, else fall back to a cited benchmark" case used across all Step 3 config forms. */
export function fieldFromBenchmark<T>(
  key: string,
  label: string,
  benchmarkName: string,
  benchmark: Benchmark<T>,
  unit?: string,
  live?: { value: T; source: ResolvedValue["source"] } | null,
): ResolvedValue<T> {
  return resolveInput({
    key,
    label,
    unit,
    live,
    benchmark: { value: benchmark.value, source: toSourceMeta(benchmarkName, benchmark) },
  });
}

/** For fields with no institutional benchmark (CAPEX, OPEX, site area, ...) — always a stated user assumption until the user sets it. */
export function fieldAsAssumption<T>(key: string, label: string, placeholder: T, unit: string | undefined, note: string): ResolvedValue<T> {
  return {
    key,
    label,
    unit,
    value: placeholder,
    confidence: "low",
    note,
    source: { name: "User assumption", url: "", license: "N/A", retrievedAt: new Date().toISOString() },
  };
}
