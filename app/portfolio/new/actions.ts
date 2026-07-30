"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import type { InterventionType, ProductClass } from "@/lib/generated/prisma/client";

export interface CreateScenarioInput {
  name: string;
  description?: string;
  destinationName: string;
  siteName?: string;
  lat?: number;
  lon?: number;
  countryCode?: string;
  interventionType: InterventionType;
  productClass: ProductClass;
  productSubtype?: string;
  proponent?: string;
  deliveryModel?: string;
  strategicObjective?: string;
  targetDate?: string;
  targetSegments?: string;
  preliminaryNotes?: string;
  decisionRequired?: string;
  decisionDate?: string;
  sponsor?: string;
}

export async function createScenario(input: CreateScenarioInput) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const scenario = await db.scenario.create({
    data: {
      name: input.name,
      description: input.description || undefined,
      destinationName: input.destinationName,
      siteName: input.siteName || undefined,
      lat: input.lat,
      lon: input.lon,
      countryCode: input.countryCode || undefined,
      interventionType: input.interventionType,
      productClass: input.productClass,
      productSubtype: input.productSubtype || undefined,
      proponent: input.proponent || undefined,
      deliveryModel: input.deliveryModel || undefined,
      strategicObjective: input.strategicObjective || undefined,
      targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
      targetSegments: input.targetSegments || undefined,
      preliminaryNotes: input.preliminaryNotes || undefined,
      decisionRequired: input.decisionRequired || undefined,
      decisionDate: input.decisionDate ? new Date(input.decisionDate) : undefined,
      sponsor: input.sponsor || undefined,
      ownerId: session.user.id,
    },
  });

  await logAudit({
    scenarioId: scenario.id,
    userId: session.user.id,
    action: "scenario.created",
    details: { name: scenario.name, productClass: scenario.productClass },
  });

  redirect(`/portfolio/${scenario.id}`);
}
