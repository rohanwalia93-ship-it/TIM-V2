import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, Construction } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TimTopBar } from "@/components/layout/tim-top-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STAGE_META, STAGE_ORDER, stageIndex } from "@/lib/stages";

export const dynamic = "force-dynamic";

export default async function ScenarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const scenario = await db.scenario.findUnique({
    where: { id },
    include: { owner: true, auditLogEntries: { orderBy: { createdAt: "desc" }, take: 20, include: { user: true } } },
  });
  if (!scenario) notFound();

  const currentIndex = stageIndex(scenario.stage);

  return (
    <div className="min-h-screen bg-background">
      <TimTopBar user={session.user} />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <Link href="/portfolio" className="text-sm text-muted-foreground hover:text-accent hover:underline">
            ← Portfolio
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{scenario.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {scenario.destinationName} · {scenario.productClass.replaceAll("_", " ")} · {scenario.interventionType.toLowerCase()}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>8-stage journey</CardTitle>
            <CardDescription>
              Stages 1–2 are real. Stages 3–8 are being built out phase by phase per AUDIT.md — this page will not
              claim a stage is done until its gates and calculations are real, not placeholders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {STAGE_ORDER.map((stage, i) => {
                const meta = STAGE_META[stage];
                const isDone = i < currentIndex;
                const isBuilt = stage === "BRIEF" || stage === "EVIDENCE_PLAN";
                const href = stage === "EVIDENCE_PLAN" ? `/portfolio/${scenario.id}/evidence` : undefined;
                const content = (
                  <>
                    {isDone ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-go" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {meta.number}. {meta.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{meta.description}</p>
                    </div>
                    {!isBuilt && (
                      <Badge variant="outline" className="shrink-0 gap-1">
                        <Construction className="h-3 w-3" />
                        Not yet built
                      </Badge>
                    )}
                  </>
                );
                return (
                  <li key={stage}>
                    {href ? (
                      <Link href={href} className="flex items-start gap-3 rounded-md border border-border p-3 hover:border-accent hover:bg-accent/5">
                        {content}
                      </Link>
                    ) : (
                      <div className="flex items-start gap-3 rounded-md border border-border p-3">{content}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Opportunity brief</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Destination" value={scenario.destinationName} />
            <Field label="Site" value={scenario.siteName} />
            <Field label="Sponsor" value={scenario.sponsor} />
            <Field label="Proponent" value={scenario.proponent} />
            <Field label="Delivery model" value={scenario.deliveryModel} />
            <Field label="Product subtype" value={scenario.productSubtype} />
            <Field label="Target date" value={scenario.targetDate?.toLocaleDateString()} />
            <Field label="Decision required" value={scenario.decisionRequired} />
            <Field label="Decision date" value={scenario.decisionDate?.toLocaleDateString()} />
            <Field label="Target segments / origin markets" value={scenario.targetSegments} />
            <div className="sm:col-span-2">
              <Field label="Strategic objective" value={scenario.strategicObjective} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Preliminary notes" value={scenario.preliminaryNotes} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Description" value={scenario.description} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change log</CardTitle>
            <CardDescription>Audit trail for this assessment.</CardDescription>
          </CardHeader>
          <CardContent>
            {scenario.auditLogEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No entries yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {scenario.auditLogEntries.map((e) => (
                  <li key={e.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <span>
                      <span className="font-medium">{e.action}</span>
                      {e.user ? <span className="text-muted-foreground"> — {e.user.name || e.user.email}</span> : null}
                    </span>
                    <span className="text-xs text-muted-foreground">{e.createdAt.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value || "—"}</p>
    </div>
  );
}
