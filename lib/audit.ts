import { db } from "@/lib/db";

export async function logAudit(params: { scenarioId?: string; userId?: string; action: string; details?: unknown }) {
  await db.auditLogEntry.create({
    data: {
      scenarioId: params.scenarioId,
      userId: params.userId,
      action: params.action,
      details: params.details !== undefined ? JSON.stringify(params.details) : undefined,
    },
  });
}
