"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import type { EvidenceCategory, EvidenceStatus, Confidence } from "@/lib/generated/prisma/client";

export interface AddEvidenceInput {
  scenarioId: string;
  category: EvidenceCategory;
  metric: string;
  metricLabel: string;
  value: string;
  unit: string;
  geography: string;
  periodStart?: string;
  periodEnd?: string;
  status: EvidenceStatus;
  sourceName: string;
  sourceUrl?: string;
  confidence: Confidence;
  notes?: string;
}

export async function addEvidenceValue(input: AddEvidenceInput) {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");

  const ev = await db.evidenceValue.create({
    data: {
      scenarioId: input.scenarioId,
      category: input.category,
      metric: input.metric,
      value: input.value,
      unit: input.unit,
      geography: input.geography,
      periodStart: input.periodStart ? new Date(input.periodStart) : undefined,
      periodEnd: input.periodEnd ? new Date(input.periodEnd) : undefined,
      status: input.status,
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl || undefined,
      retrievedAt: new Date(),
      confidence: input.confidence,
      notes: input.notes || undefined,
      owner: session.user.email,
    },
  });

  const scenario = await db.scenario.findUnique({ where: { id: input.scenarioId }, select: { stage: true } });
  if (scenario?.stage === "BRIEF") {
    await db.scenario.update({ where: { id: input.scenarioId }, data: { stage: "EVIDENCE_PLAN" } });
  }

  await logAudit({
    scenarioId: input.scenarioId,
    userId: session.user.id,
    action: "evidence.added",
    details: { metric: input.metric, metricLabel: input.metricLabel, status: input.status, confidence: input.confidence },
  });

  revalidatePath(`/portfolio/${input.scenarioId}/evidence`);
  revalidatePath(`/portfolio/${input.scenarioId}`);
  return ev;
}
