import type { ScenarioStage } from "@/lib/generated/prisma/client";

export const STAGE_ORDER: ScenarioStage[] = [
  "BRIEF",
  "EVIDENCE_PLAN",
  "DIAGNOSTIC",
  "DEMAND_MODEL",
  "APPRAISAL",
  "STRATEGY_RISK",
  "OPTIONS_RECOMMENDATION",
  "DECISION_PACK",
];

export const STAGE_META: Record<ScenarioStage, { number: number; label: string; description: string }> = {
  BRIEF: { number: 1, label: "Opportunity brief", description: "Product, destination, intervention type, decision required." },
  EVIDENCE_PLAN: { number: 2, label: "Evidence plan & data health", description: "Evidence matrix — source status, ageing, confidence, gaps blocking decision." },
  DIAGNOSTIC: { number: 3, label: "Market & destination diagnostic", description: "Demand, supply, access, competitors, event calendar, product-market fit." },
  DEMAND_MODEL: { number: 4, label: "Demand model", description: "Archetype-specific demand build-up with base/downside/upside cases." },
  APPRAISAL: { number: 5, label: "Commercial, financial & public-value appraisal", description: "Project/operator, government/funder, and economic-impact ledgers, kept separate." },
  STRATEGY_RISK: { number: 6, label: "Strategic, sustainability, risk & delivery", description: "Evidence-based criteria, risk register with likelihood/impact/mitigation/owner." },
  OPTIONS_RECOMMENDATION: { number: 7, label: "Options, sensitivity & recommendation", description: "Scenario comparison, tornado/sensitivity, gate-based recommendation." },
  DECISION_PACK: { number: 8, label: "Decision pack & audit trail", description: "Executive paper, full PDF/Excel export, provenance/assumptions/risk registers." },
};

export function stageIndex(stage: ScenarioStage): number {
  return STAGE_ORDER.indexOf(stage);
}
