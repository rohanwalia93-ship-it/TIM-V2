import { describe, it, expect } from "vitest";
import { runManMadeModel, type ManMadeModelInputs } from "@/lib/scoring/manmade";

const baseInputs: ManMadeModelInputs = {
  catchmentZones: [{ label: "core", population: 100_000, distanceKm: 0 }],
  residentPenetrationRatePercent: 10,
  betaDistanceDecay: 0.1,
  touristArrivals: 50_000,
  touristCaptureRatePercent: 10,
  competitors: [],
  ownAttractivenessScore: 50,
  huffLambda: 2,
  rampCurve: [1, 1],
  ticketPriceUsd: 20,
  perCapInParkSpendUsd: 10,
  designedDailyCapacity: 10_000,
  operatingDaysPerYear: 350,
  capex: 10_000_000,
  annualOpexBaseUsd: 1_000_000,
  variableOpexPercentOfRevenue: 20,
  horizonYears: 2,
};

describe("runManMadeModel — gravity / Huff model", () => {
  it("computes zone attendance with zero distance decay at the core (e^0 = 1)", () => {
    const result = runManMadeModel(baseInputs);
    expect(result.headline.residentAttendance).toBe(100_000 * 0.1);
  });

  it("computes tourist attendance as arrivals × capture rate", () => {
    const result = runManMadeModel(baseInputs);
    expect(result.headline.touristAttendance).toBe(50_000 * 0.1);
  });

  it("gives 100% Huff share when there are no competitors", () => {
    const result = runManMadeModel(baseInputs);
    expect(result.headline.huffSharePercent).toBe(100);
    expect(result.headline.peakAnnualAttendance).toBe(10_000 + 5_000);
  });

  it("reduces Huff share (and attendance) as competitor attractiveness grows", () => {
    const withCompetitor = runManMadeModel({
      ...baseInputs,
      competitors: [{ name: "Rival Park", attractivenessScore: 100, distanceKm: 1 }],
    });
    // ownWeight = 50/1^2 = 50, competitorWeight = 100/1^2 = 100 -> share = 50/150 = 1/3
    expect(withCompetitor.headline.huffSharePercent as number).toBeCloseTo(33.3, 1);
    expect(withCompetitor.headline.peakAnnualAttendance as number).toBeLessThan(
      runManMadeModel(baseInputs).headline.peakAnnualAttendance as number,
    );
  });

  it("flags the designed-capacity hard gate when attendance overwhelms it", () => {
    const overloaded = runManMadeModel({ ...baseInputs, designedDailyCapacity: 1, operatingDaysPerYear: 365 });
    expect(overloaded.hardGateBreached).toBe(true);
    expect(overloaded.riskFlags.some((f) => f.label.includes("capacity"))).toBe(true);
  });

  it("ramps attendance across the horizon per the ramp curve", () => {
    const ramped = runManMadeModel({ ...baseInputs, rampCurve: [0.5, 1] });
    expect(ramped.finance.annualRevenue[0]).toBeCloseTo(ramped.finance.annualRevenue[1] * 0.5, 6);
  });
});
