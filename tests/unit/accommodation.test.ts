import { describe, it, expect } from "vitest";
import { runAccommodationModel, type AccommodationModelInputs } from "@/lib/scoring/accommodation";

const baseInputs: AccommodationModelInputs = {
  numberOfRooms: 200,
  adrUsd: 200,
  stabilizedOccupancyPercent: 70,
  occupancyRamp: [1, 1],
  otherRevenuePercentOfRooms: 30,
  gopMarginPercent: 30,
  constructionCostPerKeyUsd: 200_000,
  competitorHotelRooms: 1_000,
  horizonYears: 2,
};

describe("runAccommodationModel — hotel/resort pro-forma", () => {
  it("computes RevPAR = ADR × occupancy", () => {
    const result = runAccommodationModel(baseInputs);
    expect(result.headline.stabilizedRevpar).toBe(Math.round(200 * 0.7));
  });

  it("computes room revenue = RevPAR × 365 × rooms", () => {
    const result = runAccommodationModel(baseInputs);
    const revpar = 200 * 0.7;
    expect(result.headline.stabilizedRoomRevenue).toBe(Math.round(revpar * 365 * 200));
  });

  it("adds other revenue on top of room revenue", () => {
    const result = runAccommodationModel(baseInputs);
    const roomRevenue = result.headline.stabilizedRoomRevenue as number;
    expect(result.headline.stabilizedTotalRevenue).toBe(Math.round(roomRevenue * 1.3));
  });

  it("computes GOP as total revenue × GOP margin", () => {
    const result = runAccommodationModel(baseInputs);
    const totalRevenue = result.headline.stabilizedTotalRevenue as number;
    expect(result.headline.stabilizedGop).toBe(Math.round(totalRevenue * 0.3));
  });

  it("computes CAPEX as cost-per-key × rooms", () => {
    const result = runAccommodationModel(baseInputs);
    expect(result.headline.capex).toBe(200_000 * 200);
    expect(result.finance.capex).toBe(200_000 * 200);
  });

  it("flags a crowded lodging market when competitor supply dwarfs the project", () => {
    const result = runAccommodationModel({ ...baseInputs, competitorHotelRooms: 200 * 20 });
    expect(result.riskFlags.some((f) => f.label === "Crowded lodging market")).toBe(true);
  });

  it("does not flag oversupply when competitor supply is modest", () => {
    const result = runAccommodationModel({ ...baseInputs, competitorHotelRooms: 500 });
    expect(result.riskFlags.some((f) => f.label === "Crowded lodging market")).toBe(false);
  });

  it("flags a thin operating margin below ~25%", () => {
    const result = runAccommodationModel({ ...baseInputs, gopMarginPercent: 20 });
    expect(result.riskFlags.some((f) => f.label === "Thin operating margin")).toBe(true);
  });

  it("hard-gates when the market is wildly oversupplied", () => {
    const result = runAccommodationModel({ ...baseInputs, competitorHotelRooms: 200 * 50 });
    expect(result.hardGateBreached).toBe(true);
  });
});
