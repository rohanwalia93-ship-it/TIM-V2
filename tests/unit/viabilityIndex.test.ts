import { describe, it, expect } from "vitest";
import { computeViabilityIndex, normalize, normalizeInverse, PILLAR_DEFAULT_WEIGHTS, type Pillar, type PillarInput } from "@/lib/scoring/viabilityIndex";

function makeInputs(scores: Record<Pillar, number>): Record<Pillar, PillarInput> {
  return {
    demand: { subMetrics: [{ label: "s", score: scores.demand }] },
    access: { subMetrics: [{ label: "s", score: scores.access }] },
    economics: { subMetrics: [{ label: "s", score: scores.economics }] },
    competition: { subMetrics: [{ label: "s", score: scores.competition }] },
    risk: { subMetrics: [{ label: "s", score: scores.risk }] },
  };
}

describe("normalize / normalizeInverse", () => {
  it("clamps to 0-100 and maps linearly", () => {
    expect(normalize(50, 0, 100)).toBe(50);
    expect(normalize(-10, 0, 100)).toBe(0);
    expect(normalize(150, 0, 100)).toBe(100);
  });

  it("normalizeInverse flips the mapping", () => {
    expect(normalizeInverse(0, 0, 100)).toBe(100);
    expect(normalizeInverse(100, 0, 100)).toBe(0);
  });
});

describe("computeViabilityIndex", () => {
  it("weights pillars per the default 25/20/25/15/15 split", () => {
    const inputs = makeInputs({ demand: 100, access: 100, economics: 100, competition: 100, risk: 100 });
    const result = computeViabilityIndex(inputs, "high");
    expect(result.compositeScore).toBeCloseTo(100, 6);
    const totalWeight = Object.values(PILLAR_DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(totalWeight).toBeCloseTo(1, 6);
  });

  it("returns GO at or above 70 with high confidence", () => {
    const inputs = makeInputs({ demand: 80, access: 80, economics: 80, competition: 80, risk: 80 });
    const result = computeViabilityIndex(inputs, "high");
    expect(result.verdict).toBe("GO");
    expect(result.downgradedForConfidence).toBe(false);
  });

  it("downgrades a GO to CONDITIONAL when confidence is low", () => {
    const inputs = makeInputs({ demand: 80, access: 80, economics: 80, competition: 80, risk: 80 });
    const result = computeViabilityIndex(inputs, "low");
    expect(result.verdict).toBe("CONDITIONAL");
    expect(result.downgradedForConfidence).toBe(true);
  });

  it("returns CONDITIONAL for scores in the 50-69 band", () => {
    const inputs = makeInputs({ demand: 60, access: 60, economics: 60, competition: 60, risk: 60 });
    const result = computeViabilityIndex(inputs, "high");
    expect(result.verdict).toBe("CONDITIONAL");
  });

  it("returns NO-GO below 50", () => {
    const inputs = makeInputs({ demand: 20, access: 20, economics: 20, competition: 20, risk: 20 });
    const result = computeViabilityIndex(inputs, "high");
    expect(result.verdict).toBe("NO-GO");
  });
});
