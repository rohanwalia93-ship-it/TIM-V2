import type { ArchetypeResult, FormulaStep } from "@/lib/scoring/types";
import { normalize, normalizeInverse } from "@/lib/scoring/viabilityIndex";

export interface CatchmentZone {
  label: string; // e.g. "0-2h drive"
  population: number;
  distanceKm: number; // representative distance for the band
}

export interface Competitor {
  name: string;
  attractivenessScore: number; // 0-100 proxy (category-weighted)
  distanceKm: number;
}

export interface ManMadeModelInputs {
  catchmentZones: CatchmentZone[];
  residentPenetrationRatePercent: number;
  betaDistanceDecay: number;
  touristArrivals: number;
  touristCaptureRatePercent: number;
  competitors: Competitor[];
  ownAttractivenessScore: number;
  huffLambda: number;
  rampCurve: number[]; // e.g. [0.55, 0.75, 0.9, 1, 1]
  ticketPriceUsd: number;
  perCapInParkSpendUsd: number;
  designedDailyCapacity: number;
  operatingDaysPerYear: number;
  capex: number;
  annualOpexBaseUsd: number;
  variableOpexPercentOfRevenue: number;
  horizonYears: number;
}

export function buildDistanceBandsFromDensity(
  cityPopulation: number,
  countryPopulation: number,
  countryAreaSqKm: number,
  bandsKm: { label: string; innerKm: number; outerKm: number }[],
): CatchmentZone[] {
  const density = countryAreaSqKm > 0 ? countryPopulation / countryAreaSqKm : 0;
  return bandsKm.map((band) => {
    const ringAreaSqKm = Math.PI * (band.outerKm ** 2 - band.innerKm ** 2);
    const ringPopulation = band.innerKm === 0 ? cityPopulation : Math.round(ringAreaSqKm * density);
    const representativeDistance = (band.innerKm + band.outerKm) / 2 || 1;
    return { label: band.label, population: ringPopulation, distanceKm: representativeDistance };
  });
}

export function runManMadeModel(inputs: ManMadeModelInputs): ArchetypeResult {
  const penetration = inputs.residentPenetrationRatePercent / 100;
  const zoneAttendances = inputs.catchmentZones.map((zone) => ({
    ...zone,
    attendance: zone.population * penetration * Math.exp(-inputs.betaDistanceDecay * zone.distanceKm),
  }));
  const residentAttendance = zoneAttendances.reduce((sum, z) => sum + z.attendance, 0);

  const touristAttendance = inputs.touristArrivals * (inputs.touristCaptureRatePercent / 100);

  const ownWeight = inputs.ownAttractivenessScore / Math.pow(1, inputs.huffLambda);
  const competitorWeights = inputs.competitors.map(
    (c) => c.attractivenessScore / Math.pow(Math.max(c.distanceKm, 0.1), inputs.huffLambda),
  );
  const totalWeight = ownWeight + competitorWeights.reduce((s, w) => s + w, 0);
  const huffShare = totalWeight > 0 ? ownWeight / totalWeight : 1;

  const rawDemand = residentAttendance + touristAttendance;
  const peakAnnualAttendance = rawDemand * huffShare;

  const horizon = inputs.horizonYears;
  const attendanceByYear = Array.from({ length: horizon }, (_, i) => {
    const rampFactor = inputs.rampCurve[i] ?? inputs.rampCurve[inputs.rampCurve.length - 1] ?? 1;
    return peakAnnualAttendance * rampFactor;
  });

  const perCapSpend = inputs.ticketPriceUsd + inputs.perCapInParkSpendUsd;
  const annualRevenue = attendanceByYear.map((a) => a * perCapSpend);
  const annualOpex = annualRevenue.map((r) => inputs.annualOpexBaseUsd + r * (inputs.variableOpexPercentOfRevenue / 100));

  const peakDailyAttendance = peakAnnualAttendance / inputs.operatingDaysPerYear;
  const capacityUtilization = peakDailyAttendance / inputs.designedDailyCapacity;

  const formulaSteps: FormulaStep[] = [
    {
      label: "Zone attendance (distance decay)",
      formula: "Attendance_z = Pop_z × PenetrationRate × e^(−β·d_z)",
      inputs: {
        "Σ Pop (all zones)": { value: inputs.catchmentZones.reduce((s, z) => s + z.population, 0) },
        "Penetration rate": { value: inputs.residentPenetrationRatePercent, unit: "%" },
        "β (distance decay)": { value: inputs.betaDistanceDecay },
      },
      result: residentAttendance,
      unit: "visitors/yr",
      explanation: "Resident catchment attendance, discounted the farther each population band sits from the venue.",
    },
    {
      label: "Tourist segment",
      formula: "Tourist attendance = Inbound arrivals × Capture rate",
      inputs: {
        "Inbound arrivals": { value: inputs.touristArrivals },
        "Capture rate": { value: inputs.touristCaptureRatePercent, unit: "%" },
      },
      result: touristAttendance,
      unit: "visitors/yr",
      explanation: "Share of the destination's existing inbound tourists expected to add this attraction to their trip.",
    },
    {
      label: "Huff competitive share",
      formula: "Share = (Aᵢ / dᵢ^λ) / Σⱼ (Aⱼ / dⱼ^λ)",
      inputs: {
        "Own attractiveness": { value: inputs.ownAttractivenessScore },
        "λ (distance exponent)": { value: inputs.huffLambda },
        "Competitors modeled": { value: inputs.competitors.length },
      },
      result: huffShare * 100,
      unit: "% share",
      explanation: "Estimated share of total addressable demand this venue captures versus named competing attractions.",
    },
    {
      label: "Peak annual attendance",
      formula: "Peak = (Resident + Tourist attendance) × Huff share",
      inputs: {
        "Resident + tourist raw demand": { value: rawDemand },
        "Huff share": { value: huffShare },
      },
      result: peakAnnualAttendance,
      unit: "visitors/yr",
      explanation: "Combines resident and tourist demand, then discounts for the share competing attractions are expected to absorb.",
    },
  ];

  const demandScore = normalize(peakAnnualAttendance, 0, inputs.designedDailyCapacity * inputs.operatingDaysPerYear * 1.1);
  const competitionScore = Math.min(100, huffShare * 100);
  const riskScore = normalizeInverse(capacityUtilization * 100, 0, 150);
  const economicsScoreProxy = normalize(annualRevenue[horizon - 1] ?? 0, 0, inputs.capex * 0.6 || 1);

  const riskFlags = [];
  if (capacityUtilization > 1) {
    riskFlags.push({
      label: "Designed capacity exceeded",
      severity: "high" as const,
      note: `Peak daily attendance (${Math.round(peakDailyAttendance).toLocaleString()}) exceeds designed daily capacity (${inputs.designedDailyCapacity.toLocaleString()}) — expand capacity or throttle demand via pricing/timed entry.`,
    });
  }
  if (huffShare < 0.15 && inputs.competitors.length > 0) {
    riskFlags.push({
      label: "Crowded competitive set",
      severity: "medium" as const,
      note: "Modeled Huff share is low — nearby comparable attractions are absorbing most addressable demand. A stronger USP or repositioning may be required.",
    });
  }
  if (inputs.ownAttractivenessScore < 50) {
    riskFlags.push({
      label: "Weak differentiation",
      severity: "medium" as const,
      note: "The concept's own attractiveness score is below a solidly-executed benchmark — even with light competition, a weak concept won't convert catchment population into visitors.",
    });
  }
  if (capacityUtilization < 0.3) {
    riskFlags.push({
      label: "Overbuilt for demand",
      severity: "low" as const,
      note: "Forecast attendance uses under a third of designed daily capacity — the venue may be sized (and capitalized) well beyond what demand supports.",
    });
  }

  return {
    moduleName: "Man-made — Attendance-Forecast & Investment Model",
    methodologyRefs: [
      "Huff, D. (1964). Defining and Estimating a Trading Area. Journal of Marketing.",
    ],
    formulaSteps,
    finance: { capex: inputs.capex, annualRevenue, annualOpex },
    pillarSubMetrics: {
      demand: [{ label: "Forecast attendance vs. designed capacity", score: demandScore }],
      economics: [{ label: "Revenue potential vs. CAPEX", score: economicsScoreProxy }],
      competition: [{ label: "Huff competitive market share", score: competitionScore }],
      risk: [{ label: "Capacity headroom", score: riskScore }],
    },
    headline: {
      residentAttendance: Math.round(residentAttendance),
      touristAttendance: Math.round(touristAttendance),
      huffSharePercent: Math.round(huffShare * 1000) / 10,
      peakAnnualAttendance: Math.round(peakAnnualAttendance),
      peakDailyAttendance: Math.round(peakDailyAttendance),
      capacityUtilizationPercent: Math.round(capacityUtilization * 1000) / 10,
    },
    riskFlags,
    hardGateBreached: capacityUtilization > 1.5,
    hardGateReason:
      capacityUtilization > 1.5
        ? "Forecast attendance exceeds designed capacity by more than 50% — the current site/venue design cannot safely absorb this demand."
        : undefined,
  };
}
