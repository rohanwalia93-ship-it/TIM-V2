import type { ArchetypeResult, FormulaStep } from "@/lib/scoring/types";
import { normalize, normalizeInverse } from "@/lib/scoring/viabilityIndex";

export interface NaturalModelInputs {
  siteAreaSqm: number;
  visitorAreaSqm: number; // Cifuentes "V/a" — sqm required per visitor
  dailyOperatingHours: number;
  avgVisitDurationHours: number;
  climateSuitabilityIndex: number; // 0-100, share of comfortable days/year
  fragilityCf: number; // 0-1
  rainfallCf: number; // 0-1
  accessibilityCf: number; // 0-1
  biodiversityCf: number; // 0-1
  managementCapacityPercent: number; // 0-100
  captureRatePercent: number; // 0-100, share of ECC that becomes paying visitors
  perVisitorYieldUsd: number;
  capex: number;
  annualOpex: number;
  horizonYears: number;
  projectedAnnualVisitors: number; // user/market estimate, checked against ECC
}

export type TalcStage =
  | "Exploration"
  | "Involvement"
  | "Development"
  | "Consolidation"
  | "Stagnation"
  | "Decline / overtourism risk";

function talcStage(utilizationRatio: number): TalcStage {
  if (utilizationRatio < 0.2) return "Exploration";
  if (utilizationRatio < 0.5) return "Involvement";
  if (utilizationRatio < 0.8) return "Development";
  if (utilizationRatio <= 1.0) return "Consolidation";
  if (utilizationRatio <= 1.2) return "Stagnation";
  return "Decline / overtourism risk";
}

export function runNaturalModel(inputs: NaturalModelInputs): ArchetypeResult {
  const visitorDensityPerSqm = 1 / inputs.visitorAreaSqm;
  const rotationFactor = inputs.dailyOperatingHours / inputs.avgVisitDurationHours;

  const pcc = inputs.siteAreaSqm * visitorDensityPerSqm * rotationFactor;

  const climateCf = 1 - inputs.climateSuitabilityIndex / 100;
  const correctionFactors = {
    climate: climateCf,
    fragility: inputs.fragilityCf,
    rainfall: inputs.rainfallCf,
    accessibility: inputs.accessibilityCf,
    biodiversity: inputs.biodiversityCf,
  };
  const retentionProduct = Object.values(correctionFactors).reduce((acc, cf) => acc * (1 - cf), 1);
  const rcc = pcc * retentionProduct;

  const ecc = rcc * (inputs.managementCapacityPercent / 100);

  const operatingDaysPerYear = Math.round((inputs.climateSuitabilityIndex / 100) * 365);
  const sustainableAnnualVisitorCeiling = ecc * operatingDaysPerYear;
  const sustainableRevenueCeiling =
    sustainableAnnualVisitorCeiling * (inputs.captureRatePercent / 100) * inputs.perVisitorYieldUsd;

  const utilizationRatio = inputs.projectedAnnualVisitors / Math.max(1, sustainableAnnualVisitorCeiling);
  const stage = talcStage(utilizationRatio);

  const annualVisitorsCapped = Math.min(inputs.projectedAnnualVisitors, sustainableAnnualVisitorCeiling);
  const annualRevenue = annualVisitorsCapped * (inputs.captureRatePercent / 100) * inputs.perVisitorYieldUsd;

  const formulaSteps: FormulaStep[] = [
    {
      label: "Physical Carrying Capacity (PCC)",
      formula: "PCC = A × (V/a) × Rf",
      inputs: {
        "A (usable site area)": { value: inputs.siteAreaSqm, unit: "m²" },
        "V/a (visitor density)": { value: visitorDensityPerSqm, unit: "visitors/m²" },
        "Rf (daily rotation factor)": { value: rotationFactor, unit: "rotations/day" },
      },
      result: pcc,
      unit: "visitors/day",
      explanation: "Maximum visitors the site's physical area could theoretically hold per day, before any environmental limits.",
    },
    {
      label: "Real Carrying Capacity (RCC)",
      formula: "RCC = PCC × Π(1 − Cf_i)",
      inputs: {
        "Climate Cf": { value: climateCf },
        "Fragility Cf": { value: inputs.fragilityCf },
        "Rainfall Cf": { value: inputs.rainfallCf },
        "Accessibility Cf": { value: inputs.accessibilityCf },
        "Biodiversity Cf": { value: inputs.biodiversityCf },
      },
      result: rcc,
      unit: "visitors/day",
      explanation: "PCC corrected for real environmental limiting factors (climate-suitable days, terrain fragility, rainfall, access, ecological sensitivity).",
    },
    {
      label: "Effective Carrying Capacity (ECC)",
      formula: "ECC = RCC × Management Capacity %",
      inputs: { "Management capacity": { value: inputs.managementCapacityPercent, unit: "%" } },
      result: ecc,
      unit: "visitors/day",
      explanation: "RCC further limited by the operator's actual management capacity (staffing, infrastructure, monitoring).",
    },
    {
      label: "Sustainable revenue ceiling",
      formula: "Ceiling = ECC × Operating days/yr × Capture rate % × Per-visitor yield",
      inputs: {
        "ECC": { value: ecc, unit: "visitors/day" },
        "Operating days/yr": { value: operatingDaysPerYear, unit: "days" },
        "Capture rate": { value: inputs.captureRatePercent, unit: "%" },
        "Per-visitor yield": { value: inputs.perVisitorYieldUsd, unit: "USD" },
      },
      result: sustainableRevenueCeiling,
      unit: "USD/yr",
      explanation: "The maximum revenue the site can sustainably generate without exceeding its effective carrying capacity.",
    },
  ];

  const demandScore = normalize(inputs.projectedAnnualVisitors, 0, sustainableAnnualVisitorCeiling * 1.2);
  const economicsScoreProxy = normalize(annualRevenue, 0, inputs.capex * 0.5 || 1);
  const competitionScore = normalize(inputs.climateSuitabilityIndex, 20, 90);
  const riskScore = normalizeInverse(utilizationRatio * 100, 0, 150);

  const riskFlags = [];
  if (utilizationRatio > 1.0) {
    riskFlags.push({
      label: "Overtourism / carrying-capacity breach",
      severity: "high" as const,
      note: `Projected annual visitors (${Math.round(inputs.projectedAnnualVisitors).toLocaleString()}) exceed the sustainable ceiling (${Math.round(sustainableAnnualVisitorCeiling).toLocaleString()}). Demand must be phased, capacity expanded, or yield-managed.`,
    });
  }
  if (inputs.climateSuitabilityIndex < 40) {
    riskFlags.push({
      label: "Narrow operating season",
      severity: "medium" as const,
      note: "Fewer than ~146 comfortable days/year materially compresses the revenue window — model seasonality carefully into pricing.",
    });
  }
  if (inputs.fragilityCf + inputs.biodiversityCf > 0.5) {
    riskFlags.push({
      label: "High ecological fragility",
      severity: "medium" as const,
      note: "Combined fragility and biodiversity-sensitivity factors are high — this site has limited room to absorb future demand growth without environmental degradation.",
    });
  }
  if (inputs.managementCapacityPercent < 40) {
    riskFlags.push({
      label: "Weak management capacity",
      severity: (utilizationRatio > 0.8 ? "high" : "medium") as "high" | "medium",
      note: "Management capacity below ~40% means the site is not yet equipped (staffing, monitoring, infrastructure) to safely operate near its real carrying capacity — invest here before scaling visitor numbers.",
    });
  }

  return {
    moduleName: "Natural — Carrying-Capacity & Sustainability Model",
    methodologyRefs: [
      "Cifuentes, M. (1992). Determinación de Capacidad de Carga Turística en Áreas Protegidas.",
      "Butler, R.W. (1980). The Concept of a Tourist Area Cycle of Evolution.",
    ],
    formulaSteps,
    finance: {
      capex: inputs.capex,
      annualRevenue: Array.from({ length: inputs.horizonYears }, () => annualRevenue),
      annualOpex: Array.from({ length: inputs.horizonYears }, () => inputs.annualOpex),
    },
    pillarSubMetrics: {
      demand: [{ label: "Visitor demand vs. sustainable ceiling", score: demandScore }],
      economics: [{ label: "Revenue potential vs. CAPEX", score: economicsScoreProxy }],
      competition: [{ label: "Climate/seasonality differentiation", score: competitionScore }],
      risk: [
        { label: "Carrying-capacity headroom", score: riskScore },
        { label: "TALC stage", score: normalizeInverse(["Exploration","Involvement","Development","Consolidation","Stagnation","Decline / overtourism risk"].indexOf(stage), 0, 5) },
      ],
    },
    headline: {
      pcc: Math.round(pcc),
      rcc: Math.round(rcc),
      ecc: Math.round(ecc),
      operatingDaysPerYear,
      sustainableAnnualVisitorCeiling: Math.round(sustainableAnnualVisitorCeiling),
      sustainableRevenueCeiling: Math.round(sustainableRevenueCeiling),
      talcStage: stage,
      utilizationRatioPercent: Math.round(utilizationRatio * 1000) / 10,
    },
    riskFlags,
    hardGateBreached: utilizationRatio > 1.2,
    hardGateReason:
      utilizationRatio > 1.2
        ? "Projected demand exceeds sustainable carrying capacity by more than 20% — environmental risk gate triggered."
        : undefined,
  };
}
