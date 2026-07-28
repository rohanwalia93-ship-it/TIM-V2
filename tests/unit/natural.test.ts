import { describe, it, expect } from "vitest";
import { runNaturalModel, type NaturalModelInputs } from "@/lib/scoring/natural";

const baseInputs: NaturalModelInputs = {
  siteAreaSqm: 1000,
  visitorAreaSqm: 1, // density = 1 visitor/m^2
  dailyOperatingHours: 10,
  avgVisitDurationHours: 2, // rotation factor = 5
  climateSuitabilityIndex: 100, // climate Cf = 0
  fragilityCf: 0,
  rainfallCf: 0,
  accessibilityCf: 0,
  biodiversityCf: 0,
  managementCapacityPercent: 50,
  captureRatePercent: 100,
  perVisitorYieldUsd: 10,
  capex: 1_000_000,
  annualOpex: 100_000,
  horizonYears: 2,
  projectedAnnualVisitors: 912_500, // == the sustainable ceiling at these inputs
};

describe("runNaturalModel — Cifuentes cascade", () => {
  it("computes PCC = area * density * rotation factor", () => {
    const result = runNaturalModel(baseInputs);
    expect(result.headline.pcc).toBe(1000 * 1 * 5);
  });

  it("computes RCC = PCC when every correction factor is zero", () => {
    const result = runNaturalModel(baseInputs);
    expect(result.headline.rcc).toBe(result.headline.pcc);
  });

  it("computes ECC = RCC * management capacity %", () => {
    const result = runNaturalModel(baseInputs);
    expect(result.headline.ecc).toBe((result.headline.rcc as number) * 0.5);
  });

  it("derives the sustainable revenue ceiling from ECC × operating days × capture × yield", () => {
    const result = runNaturalModel(baseInputs);
    const ecc = result.headline.ecc as number;
    const operatingDays = result.headline.operatingDaysPerYear as number;
    expect(operatingDays).toBe(365);
    expect(result.headline.sustainableRevenueCeiling).toBe(Math.round(ecc * operatingDays * 1 * 10));
  });

  it("does not breach the hard gate when demand sits at the sustainable ceiling", () => {
    const result = runNaturalModel(baseInputs);
    expect(result.hardGateBreached).toBe(false);
  });

  it("breaches the hard gate and flags overtourism risk when demand exceeds capacity by >20%", () => {
    const result = runNaturalModel({ ...baseInputs, projectedAnnualVisitors: baseInputs.projectedAnnualVisitors * 1.5 });
    expect(result.hardGateBreached).toBe(true);
    expect(result.riskFlags.some((f) => f.severity === "high")).toBe(true);
    expect(result.headline.talcStage).toBe("Decline / overtourism risk");
  });

  it("reduces RCC when correction factors are non-zero", () => {
    const withCorrections = runNaturalModel({ ...baseInputs, fragilityCf: 0.2, rainfallCf: 0.1 });
    const base = runNaturalModel(baseInputs);
    expect(withCorrections.headline.rcc as number).toBeLessThan(base.headline.rcc as number);
  });
});
