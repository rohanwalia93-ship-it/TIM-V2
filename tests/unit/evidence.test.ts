import { describe, it, expect } from "vitest";
import { buildEvidenceMatrix, findDataGaps } from "@/lib/evidence";
import { totalRequiredMetrics } from "@/lib/evidence-catalog";
import type { EvidenceValue } from "@/lib/generated/prisma/client";

function makeValue(overrides: Partial<EvidenceValue>): EvidenceValue {
  return {
    id: "ev1",
    scenarioId: "s1",
    category: "DEMAND",
    metric: "historical_visitor_arrivals",
    value: "1000000",
    unit: "visitors/yr",
    geography: "Abu Dhabi city",
    periodStart: null,
    periodEnd: null,
    priceBasis: null,
    status: "LIVE",
    sourceName: "DCT",
    sourceUrl: null,
    datasetId: null,
    retrievedAt: new Date(),
    publicationDate: null,
    license: null,
    transformation: null,
    confidence: "HIGH",
    owner: null,
    approvedBy: null,
    notes: null,
    overrideReason: null,
    overriddenById: null,
    overriddenAt: null,
    createdAt: new Date(),
    ...overrides,
  } as EvidenceValue;
}

describe("buildEvidenceMatrix / findDataGaps", () => {
  it("with no evidence, every required catalog metric is a gap", () => {
    const matrix = buildEvidenceMatrix([]);
    const gaps = findDataGaps(matrix);
    expect(gaps.length).toBe(totalRequiredMetrics());
  });

  it("a matching metric key resolves that row and shrinks the gap count by one", () => {
    const matrix = buildEvidenceMatrix([makeValue({})]);
    const gaps = findDataGaps(matrix);
    expect(gaps.length).toBe(totalRequiredMetrics() - 1);
    const demandRow = matrix.DEMAND.find((r) => r.key === "historical_visitor_arrivals");
    expect(demandRow?.current).not.toBeNull();
    expect(demandRow?.current?.value).toBe("1000000");
  });

  it("keeps older values as history instead of overwriting them, newest first", () => {
    const older = makeValue({ id: "old", value: "900000", createdAt: new Date("2024-01-01") });
    const newer = makeValue({ id: "new", value: "1100000", createdAt: new Date("2025-01-01") });
    const matrix = buildEvidenceMatrix([older, newer]);
    const row = matrix.DEMAND.find((r) => r.key === "historical_visitor_arrivals")!;
    expect(row.current?.id).toBe("new");
    expect(row.history.map((h) => h.id)).toEqual(["old"]);
  });

  it("flags a value older than 365 days as stale", () => {
    const stale = makeValue({ retrievedAt: new Date(Date.now() - 400 * 86_400_000) });
    const matrix = buildEvidenceMatrix([stale]);
    const row = matrix.DEMAND.find((r) => r.key === "historical_visitor_arrivals")!;
    expect(row.isStale).toBe(true);
  });

  it("does not flag a fresh value as stale", () => {
    const fresh = makeValue({ retrievedAt: new Date() });
    const matrix = buildEvidenceMatrix([fresh]);
    const row = matrix.DEMAND.find((r) => r.key === "historical_visitor_arrivals")!;
    expect(row.isStale).toBe(false);
  });

  it("optional metrics never appear as data gaps", () => {
    const matrix = buildEvidenceMatrix([]);
    const gaps = findDataGaps(matrix);
    expect(gaps.every((g) => g.required)).toBe(true);
  });
});
