import { describe, it, expect } from "vitest";
import { resolveInput, overallConfidence } from "@/lib/resolveInput";
import type { SourceMeta } from "@/lib/sources/types";

const meta: SourceMeta = { name: "Test source", url: "https://example.com", license: "CC BY 4.0", retrievedAt: "2026-01-01T00:00:00Z" };

describe("resolveInput", () => {
  it("prefers a live value and tags it High confidence", () => {
    const rv = resolveInput({
      key: "x",
      label: "X",
      live: { value: 42, source: meta },
      benchmark: { value: 10, source: meta },
    });
    expect(rv.value).toBe(42);
    expect(rv.confidence).toBe("high");
  });

  it("falls back to the cited benchmark when no live value exists", () => {
    const rv = resolveInput({
      key: "x",
      label: "X",
      benchmark: { value: 10, source: meta },
    });
    expect(rv.value).toBe(10);
    expect(rv.confidence).toBe("medium");
  });

  it("always tags a user override as Low confidence, even overriding a live value", () => {
    const rv = resolveInput({
      key: "x",
      label: "X",
      live: { value: 42, source: meta },
      benchmark: { value: 10, source: meta },
      userOverride: 99,
    });
    expect(rv.value).toBe(99);
    expect(rv.confidence).toBe("low");
  });

  it("never returns an untagged value — every branch sets a SourceMeta", () => {
    const rv = resolveInput({ key: "x", label: "X", benchmark: { value: 1, source: meta } });
    expect(rv.source).toBeDefined();
    expect(rv.source.name).toBeTruthy();
  });
});

describe("overallConfidence", () => {
  it("returns low for an empty set", () => {
    expect(overallConfidence([])).toBe("low");
  });

  it("returns high when all inputs are high confidence", () => {
    const values = Array.from({ length: 5 }, (_, i) => ({
      key: `k${i}`,
      label: "L",
      value: 1,
      confidence: "high" as const,
      source: meta,
    }));
    expect(overallConfidence(values)).toBe("high");
  });

  it("returns low when all inputs are user assumptions", () => {
    const values = Array.from({ length: 5 }, (_, i) => ({
      key: `k${i}`,
      label: "L",
      value: 1,
      confidence: "low" as const,
      source: meta,
    }));
    expect(overallConfidence(values)).toBe("low");
  });
});
