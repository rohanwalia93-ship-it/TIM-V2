import type { Confidence } from "@/lib/sources/types";

export type Pillar = "demand" | "access" | "economics" | "competition" | "risk";

export const PILLAR_LABELS: Record<Pillar, string> = {
  demand: "Demand & Market",
  access: "Access & Readiness",
  economics: "Economics & Return",
  competition: "Competition & Differentiation",
  risk: "Risk & Sustainability",
};

export const PILLAR_DEFAULT_WEIGHTS: Record<Pillar, number> = {
  demand: 0.25,
  access: 0.2,
  economics: 0.25,
  competition: 0.15,
  risk: 0.15,
};

export interface SubMetric {
  label: string;
  score: number; // 0-100, already normalized
  note?: string;
}

export interface PillarInput {
  subMetrics: SubMetric[];
}

export interface PillarScore {
  pillar: Pillar;
  label: string;
  score: number;
  weight: number;
  subMetrics: SubMetric[];
}

export type Verdict = "GO" | "CONDITIONAL" | "NO-GO";

export interface ViabilityResult {
  compositeScore: number;
  pillars: PillarScore[];
  verdict: Verdict;
  verdictReason: string;
  downgradedForConfidence: boolean;
}

/** Clamps a raw value into 0-100 against a comparable-benchmark [min, max] range — the "min-max normalized against cited benchmarks" rule in Section 4.1. */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  const pct = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, pct));
}

/** Same as normalize() but for metrics where lower raw values are better (e.g. market saturation, volatility). */
export function normalizeInverse(value: number, min: number, max: number): number {
  return 100 - normalize(value, min, max);
}

function averageSubMetrics(subMetrics: SubMetric[]): number {
  if (subMetrics.length === 0) return 0;
  return subMetrics.reduce((sum, m) => sum + m.score, 0) / subMetrics.length;
}

export function computeViabilityIndex(
  pillarInputs: Record<Pillar, PillarInput>,
  dataConfidence: Confidence,
  weights: Record<Pillar, number> = PILLAR_DEFAULT_WEIGHTS,
): ViabilityResult {
  const pillars: PillarScore[] = (Object.keys(pillarInputs) as Pillar[]).map((pillar) => ({
    pillar,
    label: PILLAR_LABELS[pillar],
    score: averageSubMetrics(pillarInputs[pillar].subMetrics),
    weight: weights[pillar],
    subMetrics: pillarInputs[pillar].subMetrics,
  }));

  const totalWeight = pillars.reduce((s, p) => s + p.weight, 0) || 1;
  const compositeScore =
    pillars.reduce((sum, p) => sum + p.score * p.weight, 0) / totalWeight;

  let verdict: Verdict = compositeScore >= 70 ? "GO" : compositeScore >= 50 ? "CONDITIONAL" : "NO-GO";
  let downgradedForConfidence = false;
  let verdictReason = `Composite score ${compositeScore.toFixed(1)}/100.`;

  if (verdict === "GO" && dataConfidence === "low") {
    verdict = "CONDITIONAL";
    downgradedForConfidence = true;
    verdictReason += " Downgraded from GO because overall data confidence is Low — validate key assumptions before committing capital.";
  } else if (verdict === "GO") {
    verdictReason += " Meets the GO threshold (≥70) with adequate data confidence.";
  } else if (verdict === "CONDITIONAL") {
    verdictReason += " Falls in the conditional band (50–69) — proceed only if the weakest pillars are mitigated.";
  } else {
    verdictReason += " Falls below the viability threshold (<50).";
  }

  return { compositeScore, pillars, verdict, verdictReason, downgradedForConfidence };
}
