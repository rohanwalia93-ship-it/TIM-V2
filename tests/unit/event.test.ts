import { describe, it, expect } from "vitest";
import { runEventModel, type EventModelInputs } from "@/lib/scoring/event";

const baseInputs: EventModelInputs = {
  venueCapacity: 12_000,
  totalAttendance: 10_000,
  eventDurationDays: 2,
  incrementalityRatePercent: 50,
  ticketPriceUsd: 100,
  overnightSharePercent: 50,
  avgOvernightNights: 2,
  lodgingSpendPerNightUsd: 100,
  fnbSpendPerDayUsd: 50,
  transportSpendPerVisitUsd: 20,
  retailSpendPerVisitUsd: 30,
  regionalOutputMultiplier: 2,
  outputPerJobUsd: 100_000,
  directIndirectInducedSplit: { direct: 0.5, indirect: 0.3, induced: 0.2 },
  hotelRoomsAvailable: 2_000,
  hostingCostUsd: 1_000_000,
  annualHostingOpexUsd: 100_000,
  mediaValueUsd: 500_000,
  uniquenessScore: 65,
  isRecurringAnnually: false,
  horizonYears: 3,
};

describe("runEventModel — incrementality + I-O multiplier", () => {
  it("excludes non-incremental attendees per the incrementality rate", () => {
    const result = runEventModel(baseInputs);
    expect(result.headline.incrementalAttendees).toBe(5_000);
  });

  it("sums direct spend across all TSA categories", () => {
    const result = runEventModel(baseInputs);
    // per-attendee: ticket 100 + lodging(0.5*2*100=100) + fnb(50*2=100) + transport 20 + retail 30 = 350
    expect(result.headline.directSpend).toBe(5_000 * 350);
  });

  it("applies the regional output multiplier to get total economic impact", () => {
    const result = runEventModel(baseInputs);
    expect(result.headline.totalEconomicImpact).toBe((result.headline.directSpend as number) * 2);
  });

  it("decomposes total impact into direct/indirect/induced using the split ratios", () => {
    const result = runEventModel(baseInputs);
    const total = result.headline.totalEconomicImpact as number;
    expect(result.headline.directImpact).toBeCloseTo(total * 0.5, 6);
    expect(result.headline.indirectImpact).toBeCloseTo(total * 0.3, 6);
    expect(result.headline.inducedImpact).toBeCloseTo(total * 0.2, 6);
  });

  it("computes jobs supported as total impact / output-per-job", () => {
    const result = runEventModel(baseInputs);
    expect(result.headline.jobsSupported).toBe(Math.round((result.headline.totalEconomicImpact as number) / 100_000));
  });

  it("flags accommodation strain and hard-gates when room demand exceeds supply", () => {
    const result = runEventModel(baseInputs);
    // room nights = 5000 * 0.5 * 2 = 5000, peak/day = 2500, vs 2000 rooms -> pressure 1.25
    expect(result.headline.roomSupplyPressurePercent as number).toBeGreaterThan(100);
    expect(result.riskFlags.some((f) => f.label.includes("Accommodation"))).toBe(true);
  });

  it("keeps the public economic-impact lens separate from the private BCR/net-benefit", () => {
    const result = runEventModel(baseInputs);
    const total = result.headline.totalEconomicImpact as number;
    expect(result.headline.publicBcr).toBeCloseTo(total / baseInputs.hostingCostUsd, 6);
    expect(result.headline.netPublicBenefit).toBe(total - baseInputs.hostingCostUsd);
  });

  it("only books revenue/opex in year one for a one-off event", () => {
    const result = runEventModel(baseInputs);
    expect(result.finance.annualRevenue[0]).toBeGreaterThan(0);
    expect(result.finance.annualRevenue[1]).toBe(0);
    expect(result.finance.annualRevenue[2]).toBe(0);
  });

  it("books revenue/opex every year when the event is recurring", () => {
    const result = runEventModel({ ...baseInputs, isRecurringAnnually: true });
    expect(result.finance.annualRevenue.every((r) => r > 0)).toBe(true);
  });
});
