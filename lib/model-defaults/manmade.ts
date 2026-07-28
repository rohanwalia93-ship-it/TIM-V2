import type { ResolvedValue } from "@/lib/sources/types";
import type { CityContextData } from "@/lib/store/scenarioStore";
import { BENCHMARKS } from "@/lib/benchmarks";
import { fieldFromBenchmark, fieldAsAssumption } from "@/lib/model-defaults/shared";
import { buildDistanceBandsFromDensity, type CatchmentZone, type Competitor } from "@/lib/scoring/manmade";

export type ManMadeScalarKey =
  | "residentPenetrationRatePercent"
  | "betaDistanceDecay"
  | "touristCaptureRatePercent"
  | "ownAttractivenessScore"
  | "huffLambda"
  | "ticketPriceUsd"
  | "perCapInParkSpendUsd"
  | "designedDailyCapacity"
  | "operatingDaysPerYear"
  | "capex"
  | "annualOpexBaseUsd"
  | "variableOpexPercentOfRevenue"
  | "horizonYears";

export function buildManMadeScalarDefaults(): Record<ManMadeScalarKey, ResolvedValue<number>> {
  return {
    residentPenetrationRatePercent: fieldFromBenchmark("model.residentPenetrationRatePercent", "Resident penetration rate", "AECOM/TEA Theme Index", BENCHMARKS.residentPenetrationRatePercentDefault, "%"),
    betaDistanceDecay: fieldFromBenchmark("model.betaDistanceDecay", "Distance decay (β)", "Huff (1964)", BENCHMARKS.huffDistanceDecayBeta),
    touristCaptureRatePercent: fieldFromBenchmark("model.touristCaptureRatePercent", "Tourist capture rate", "AECOM/TEA Theme Index", BENCHMARKS.touristCaptureRatePercentDefault, "%"),
    ownAttractivenessScore: fieldAsAssumption("model.ownAttractivenessScore", "Own attractiveness score", 65, "/100", "A judgment call on your concept's differentiation/pull — default reflects a solidly executed mid-market concept."),
    huffLambda: fieldFromBenchmark("model.huffLambda", "Huff distance exponent (λ)", "Huff (1964)", BENCHMARKS.huffDistanceExponentLambda),
    ticketPriceUsd: fieldFromBenchmark("model.ticketPriceUsd", "Ticket price", "AECOM/TEA Theme Index", BENCHMARKS.ticketPriceUsdDefault, "USD"),
    perCapInParkSpendUsd: fieldFromBenchmark("model.perCapInParkSpendUsd", "Per-cap in-venue spend", "AECOM/TEA Theme Index", BENCHMARKS.perCapInParkSpendUsdDefault, "USD"),
    designedDailyCapacity: fieldAsAssumption("model.designedDailyCapacity", "Designed daily capacity", 8_000, "visitors/day", "Project-specific — enter the venue's designed daily capacity."),
    operatingDaysPerYear: fieldAsAssumption("model.operatingDaysPerYear", "Operating days per year", 350, "days", "Typical year-round attraction operating calendar — adjust for planned closures."),
    capex: fieldAsAssumption("model.capex", "CAPEX", 120_000_000, "USD", "Project-specific — enter your capital expenditure estimate."),
    annualOpexBaseUsd: fieldAsAssumption("model.annualOpexBaseUsd", "Fixed annual OPEX", 8_000_000, "USD", "Project-specific — enter your fixed annual operating cost."),
    variableOpexPercentOfRevenue: fieldAsAssumption("model.variableOpexPercentOfRevenue", "Variable OPEX (% of revenue)", 25, "%", "Typical variable cost ratio for staffing/consumables/maintenance that scale with attendance."),
    horizonYears: fieldFromBenchmark("model.horizonYears", "Appraisal horizon", "Standard appraisal horizon", BENCHMARKS.dcfHorizonYearsDefault, "yrs"),
  };
}

export function deriveCatchmentZones(ctx: CityContextData, cityPopulationEstimate: number): CatchmentZone[] {
  const countryPop = ctx.worldBank?.population?.latest?.value ?? cityPopulationEstimate * 20;
  const countryArea = ctx.countryProfile?.areaSqKm ?? 500_000;
  const avgSpeed = BENCHMARKS.driveTimeAvgSpeedKmh.value;
  return buildDistanceBandsFromDensity(cityPopulationEstimate, countryPop, countryArea, [
    { label: "City core", innerKm: 0, outerKm: 0 },
    { label: "0–2h drive", innerKm: 5, outerKm: avgSpeed * 2 },
    { label: "2–4h drive", innerKm: avgSpeed * 2, outerKm: avgSpeed * 4 },
  ]);
}

export function deriveCompetitors(ctx: CityContextData): Competitor[] {
  return (ctx.attractions?.attractions ?? []).slice(0, 8).map((a) => ({
    name: a.name,
    attractivenessScore: a.category === "theme_park" ? 70 : a.category === "zoo" || a.category === "aquarium" ? 60 : 45,
    distanceKm: a.distanceKm,
  }));
}
