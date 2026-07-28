import { describe, it, expect } from "vitest";
import { runDcf, buildRampedSeries, flatSeries, type DcfInputs } from "@/lib/finance/dcf";

describe("runDcf", () => {
  const inputs: DcfInputs = {
    capex: 1000,
    annualRevenue: flatSeries(500, 4),
    annualOpex: flatSeries(100, 4),
    discountRate: 0.1,
    horizonYears: 4,
  };

  it("computes NPV matching a hand-derived sum of discounted net cash flows", () => {
    const expectedNpv =
      -1000 +
      400 / 1.1 ** 1 +
      400 / 1.1 ** 2 +
      400 / 1.1 ** 3 +
      400 / 1.1 ** 4;
    const result = runDcf(inputs);
    expect(result.npv).toBeCloseTo(expectedNpv, 6);
  });

  it("finds an IRR that zeroes out NPV when re-discounted at that rate", () => {
    const result = runDcf(inputs);
    expect(result.irr).not.toBeNull();
    const rediscounted =
      -inputs.capex +
      [1, 2, 3, 4].reduce((sum, t) => sum + 400 / (1 + result.irr!) ** t, 0);
    expect(rediscounted).toBeCloseTo(0, 3);
  });

  it("computes a payback year consistent with the cumulative cash flow crossing zero", () => {
    const result = runDcf(inputs);
    expect(result.paybackYears).not.toBeNull();
    const paybackYear = Math.floor(result.paybackYears!);
    const cfAtFloor = result.cashFlows[paybackYear - 1]?.cumulativeDiscounted ?? -inputs.capex;
    const cfAtCeil = result.cashFlows[paybackYear]?.cumulativeDiscounted ?? cfAtFloor;
    expect(cfAtFloor).toBeLessThanOrEqual(0.01);
    expect(cfAtCeil).toBeGreaterThanOrEqual(-0.01);
  });

  it("computes BCR as PV(revenue) / (capex + PV(opex))", () => {
    const result = runDcf(inputs);
    expect(result.bcr).toBeCloseTo(result.totalRevenuePv / result.totalCostsPv, 6);
    expect(result.bcr).toBeGreaterThan(1); // this scenario is a clear GO
  });

  it("never finds an economically meaningful (non-negative) IRR for a hopeless investment", () => {
    const hopeless: DcfInputs = { capex: 10_000, annualRevenue: flatSeries(10, 3), annualOpex: flatSeries(5, 3), discountRate: 0.1, horizonYears: 3 };
    const result = runDcf(hopeless);
    expect(result.npv).toBeLessThan(0);
    // Any root the bisection finds in this range is a deeply negative, non-meaningful rate — never a real positive-return IRR.
    if (result.irr !== null) expect(result.irr).toBeLessThan(0);
    expect(result.paybackYears).toBeNull();
  });
});

describe("buildRampedSeries", () => {
  it("applies the ramp curve then holds the final ramp value for remaining years", () => {
    const series = buildRampedSeries(100, [0.5, 0.8, 1], 5);
    expect(series).toEqual([50, 80, 100, 100, 100]);
  });
});

describe("flatSeries", () => {
  it("repeats a flat value across the horizon", () => {
    expect(flatSeries(42, 3)).toEqual([42, 42, 42]);
  });
});
