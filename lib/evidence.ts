import type { EvidenceValue } from "@/lib/generated/prisma/client";
import { EVIDENCE_CATALOG, type CatalogMetric } from "@/lib/evidence-catalog";
import type { EvidenceCategory } from "@/lib/generated/prisma/client";

export interface MetricRow extends CatalogMetric {
  category: EvidenceCategory;
  current: EvidenceValue | null;
  history: EvidenceValue[];
  ageingDays: number | null;
  isStale: boolean;
}

const STALE_AFTER_DAYS = 365;

/**
 * Groups all EvidenceValue rows for a scenario against the evidence catalog: for each catalog
 * metric, the "current" value is the most recently created row with a matching metric key
 * (older rows are kept as history — a source conflict is shown, never silently averaged away).
 * A catalog metric with no matching row at all is surfaced as "missing", never filled with a
 * fabricated number (brief §2 item 4 / §6).
 */
export function buildEvidenceMatrix(values: EvidenceValue[]): Record<EvidenceCategory, MetricRow[]> {
  const byMetric = new Map<string, EvidenceValue[]>();
  for (const v of values) {
    const list = byMetric.get(v.metric) ?? [];
    list.push(v);
    byMetric.set(v.metric, list);
  }
  for (const list of byMetric.values()) list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const result = {} as Record<EvidenceCategory, MetricRow[]>;
  for (const [category, metrics] of Object.entries(EVIDENCE_CATALOG) as [EvidenceCategory, CatalogMetric[]][]) {
    result[category] = metrics.map((m) => {
      const history = byMetric.get(m.key) ?? [];
      const current = history[0] ?? null;
      const ageingDays = current ? Math.floor((Date.now() - current.retrievedAt.getTime()) / 86_400_000) : null;
      return {
        ...m,
        category,
        current,
        history: history.slice(1),
        ageingDays,
        isStale: ageingDays !== null && ageingDays > STALE_AFTER_DAYS,
      };
    });
  }
  return result;
}

export function findDataGaps(matrix: Record<EvidenceCategory, MetricRow[]>): MetricRow[] {
  return Object.values(matrix)
    .flat()
    .filter((row) => row.required && !row.current);
}
