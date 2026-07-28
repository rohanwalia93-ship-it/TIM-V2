import type { Pillar, SubMetric } from "@/lib/scoring/viabilityIndex";

export interface FormulaStep {
  label: string;
  formula: string;
  inputs: Record<string, { value: number; unit?: string }>;
  result: number;
  unit?: string;
  explanation: string;
}

export interface RiskFlag {
  label: string;
  severity: "low" | "medium" | "high";
  note: string;
}

export interface FinanceSeedInputs {
  capex: number;
  annualRevenue: number[];
  annualOpex: number[];
}

export interface ArchetypeResult {
  moduleName: string;
  methodologyRefs: string[];
  formulaSteps: FormulaStep[];
  finance: FinanceSeedInputs;
  pillarSubMetrics: Partial<Record<Pillar, SubMetric[]>>;
  headline: Record<string, number | string>;
  riskFlags: RiskFlag[];
  hardGateBreached: boolean;
  hardGateReason?: string;
}
