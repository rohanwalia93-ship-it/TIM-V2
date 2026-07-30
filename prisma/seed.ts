import { Role, InterventionType, ProductClass, ScenarioStage } from "../lib/generated/prisma/client";
import { db } from "../lib/db";

async function main() {
  const owner = await db.user.upsert({
    where: { email: "demo.analyst@tim.local" },
    update: {},
    create: { email: "demo.analyst@tim.local", name: "Demo Analyst", role: Role.ANALYST },
  });
  await db.user.upsert({
    where: { email: "demo.admin@tim.local" },
    update: {},
    create: { email: "demo.admin@tim.local", name: "Demo Administrator", role: Role.ADMINISTRATOR },
  });

  // Brief §11 — the one mandated, fully-worked seeded demonstration.
  await db.scenario.upsert({
    where: { id: "seed-stadium-concert-auh" },
    update: {},
    create: {
      id: "seed-stadium-concert-auh",
      name: "International Stadium Concert — Abu Dhabi",
      description:
        "A single-night international stadium concert. Seeded demonstration per the rebuild brief — Stage 1 brief captured; later stages (evidence plan, demand model, appraisal, gates) are built out phase by phase, not pre-filled with invented numbers.",
      destinationName: "Abu Dhabi",
      siteName: "Zayed Sports City Stadium",
      lat: 24.4539,
      lon: 54.3773,
      countryCode: "AE",
      interventionType: InterventionType.HOST,
      productClass: ProductClass.EVENT,
      productSubtype: "Stadium concert",
      proponent: "Department of Culture and Tourism – Abu Dhabi",
      deliveryModel: "Government-hosted, promoter-operated",
      strategicObjective: "Test destination demand for a marquee single-night international act ahead of a multi-year hosting strategy.",
      targetSegments: "Local residents; domestic non-local (other Emirates); international fly-in (GCC, South Asia, Europe)",
      preliminaryNotes: "Illustrative only: ~40,000-capacity stadium bowl configuration; promoter hosting-fee ask not yet received.",
      decisionRequired: "Approve/decline promoter hosting-fee request",
      sponsor: "Department of Culture and Tourism",
      stage: ScenarioStage.BRIEF,
      ownerId: owner.id,
    },
  });

  // Brief §11 — empty templates for the other archetypes (brief text, no invented numbers).
  const templates: Array<{ id: string; name: string; productClass: ProductClass; subtype: string; destination: string }> = [
    { id: "seed-template-attraction", name: "[Template] Built attraction", productClass: ProductClass.ATTRACTION_BUILT, subtype: "Theme park / museum / aquarium", destination: "Jeddah" },
    { id: "seed-template-natural", name: "[Template] Natural / heritage product", productClass: ProductClass.ATTRACTION_NATURAL, subtype: "Nature reserve / heritage site", destination: "Al Ain" },
    { id: "seed-template-accommodation", name: "[Template] Accommodation product", productClass: ProductClass.ACCOMMODATION, subtype: "Resort / hotel", destination: "Jeddah" },
    { id: "seed-template-recurring-event", name: "[Template] Recurring event", productClass: ProductClass.EVENT, subtype: "Annual festival / recurring fixture", destination: "Abu Dhabi" },
  ];

  for (const t of templates) {
    await db.scenario.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        name: t.name,
        description: "Empty template — fill in the opportunity brief to start a real assessment of this type.",
        destinationName: t.destination,
        interventionType: InterventionType.DEVELOP,
        productClass: t.productClass,
        productSubtype: t.subtype,
        stage: ScenarioStage.BRIEF,
        ownerId: owner.id,
      },
    });
  }

  console.log("Seeded:", owner.email, "+ 1 worked demo + 4 empty templates");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
