import type { ResolvedValue } from "@/lib/sources/types";
import type { ArchetypeResult } from "@/lib/scoring/types";
import type { ViabilityResult } from "@/lib/scoring/viabilityIndex";
import type { DcfResult } from "@/lib/finance/dcf";

export interface ReportPayload {
  cityName: string;
  countryName: string;
  archetype: string;
  product: string;
  objective: string;
  generatedAt: string;
  viability: ViabilityResult;
  dcf: DcfResult;
  discountRate: number;
  archetypeResult: ArchetypeResult;
  resolvedValues: ResolvedValue[];
}
