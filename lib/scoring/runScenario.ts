import { computeViabilityIndex, type Pillar, type PillarInput } from "@/lib/scoring/viabilityIndex";
import { runDcf, type DcfResult } from "@/lib/finance/dcf";
import { runNaturalModel, type NaturalModelInputs } from "@/lib/scoring/natural";
import { runManMadeModel, type ManMadeModelInputs } from "@/lib/scoring/manmade";
import { runEventModel, type EventModelInputs } from "@/lib/scoring/event";
import { BENCHMARKS } from "@/lib/benchmarks";
import type { ArchetypeResult } from "@/lib/scoring/types";
import type { Archetype, CityContextData } from "@/lib/store/scenarioStore";
import type { Confidence } from "@/lib/sources/types";
import type { CatchmentZone, Competitor } from "@/lib/scoring/manmade";

export interface RunScenarioResult {
  archetypeResult: ArchetypeResult;
  viability: ReturnType<typeof computeViabilityIndex>;
  dcf: DcfResult;
  discountRate: number;
}

function buildAccessPillar(hotelRooms: number | undefined, airScore: number | undefined): PillarInput {
  const hotelScore = Math.min(100, ((hotelRooms ?? 0) / 5000) * 100);
  return {
    subMetrics: [
      { label: "Air connectivity / seat-capacity proxy", score: airScore ?? 50 },
      { label: "Hotel supply coverage", score: hotelScore },
      { label: "Venue / site readiness", score: 70 },
    ],
  };
}

export function runScenario(
  archetype: Archetype,
  cityContext: CityContextData,
  dataConfidence: Confidence,
  inputs:
    | { kind: "natural"; natural: NaturalModelInputs }
    | { kind: "manmade"; manmade: ManMadeModelInputs; catchmentZones: CatchmentZone[]; competitors: Competitor[] }
    | { kind: "event"; event: EventModelInputs },
): RunScenarioResult {
  let archetypeResult: ArchetypeResult;

  if (archetype === "natural" && inputs.kind === "natural") {
    archetypeResult = runNaturalModel(inputs.natural);
  } else if (archetype === "manmade" && inputs.kind === "manmade") {
    const touristArrivals = cityContext.worldBank?.touristArrivals?.latest?.value ?? 0;
    archetypeResult = runManMadeModel({
      ...inputs.manmade,
      catchmentZones: inputs.catchmentZones,
      competitors: inputs.competitors,
      touristArrivals,
      rampCurve: [...BENCHMARKS.rampCurveDefault.value],
    });
  } else if (archetype === "event" && inputs.kind === "event") {
    archetypeResult = runEventModel({
      ...inputs.event,
      directIndirectInducedSplit: { ...BENCHMARKS.directIndirectInducedSplitDefault.value },
    });
  } else {
    throw new Error("Mismatched archetype/inputs kind");
  }

  const pillarInputs: Record<Pillar, PillarInput> = {
    demand: { subMetrics: archetypeResult.pillarSubMetrics.demand ?? [{ label: "Demand", score: 50 }] },
    access: buildAccessPillar(cityContext.hotels?.estimatedRooms, cityContext.airConnectivity?.seatCapacityProxyScore),
    economics: { subMetrics: archetypeResult.pillarSubMetrics.economics ?? [{ label: "Economics", score: 50 }] },
    competition: { subMetrics: archetypeResult.pillarSubMetrics.competition ?? [{ label: "Competition", score: 50 }] },
    risk: { subMetrics: archetypeResult.pillarSubMetrics.risk ?? [{ label: "Risk", score: 50 }] },
  };

  const viability = computeViabilityIndex(pillarInputs, dataConfidence);
  const discountRate = (BENCHMARKS.riskFreeRateDefault.value + BENCHMARKS.countryRiskPremiumDefault.value) / 100;
  const dcf = runDcf({
    capex: archetypeResult.finance.capex,
    annualRevenue: archetypeResult.finance.annualRevenue,
    annualOpex: archetypeResult.finance.annualOpex,
    discountRate,
    horizonYears: archetypeResult.finance.annualRevenue.length,
  });

  return { archetypeResult, viability, dcf, discountRate };
}
