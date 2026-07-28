import { describe, it, expect } from "vitest";
import { BENCHMARKS } from "@/lib/benchmarks";

describe("BENCHMARKS", () => {
  it("has a non-empty source and url on every entry", () => {
    for (const [key, benchmark] of Object.entries(BENCHMARKS)) {
      expect(benchmark.source, `${key} is missing a source`).toBeTruthy();
      expect(benchmark.source.length, `${key} source must not be empty`).toBeGreaterThan(0);
      expect(benchmark.url, `${key} is missing a url`).toBeTruthy();
      expect(benchmark.url.startsWith("http"), `${key} url must be a real link`).toBe(true);
      expect(benchmark.value, `${key} is missing a value`).toBeDefined();
    }
  });

  it("exposes at least one benchmark per archetype domain", () => {
    const entries = Object.entries(BENCHMARKS);
    expect(entries.some(([, b]) => b.source.includes("Cifuentes"))).toBe(true);
    expect(entries.some(([k]) => k.toLowerCase().includes("huff"))).toBe(true);
    expect(entries.some(([k]) => k.toLowerCase().includes("multiplier") || k.includes("incrementality"))).toBe(true);
  });
});
