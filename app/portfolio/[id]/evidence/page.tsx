import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TimTopBar } from "@/components/layout/tim-top-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddEvidenceDialog } from "@/components/evidence/add-evidence-dialog";
import { EvidenceDrawer } from "@/components/evidence/evidence-drawer";
import { buildEvidenceMatrix, findDataGaps } from "@/lib/evidence";
import { EVIDENCE_CATEGORY_LABELS, EVIDENCE_CATEGORY_ORDER, totalRequiredMetrics } from "@/lib/evidence-catalog";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, "go" | "conditional" | "outline"> = {
  LIVE: "go",
  PUBLISHED: "go",
  BENCHMARK: "conditional",
  ASSUMPTION: "outline",
  CLIENT_UPLOAD: "conditional",
};

export default async function EvidencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const scenario = await db.scenario.findUnique({ where: { id }, include: { evidenceValues: true } });
  if (!scenario) notFound();

  const matrix = buildEvidenceMatrix(scenario.evidenceValues);
  const gaps = findDataGaps(matrix);
  const totalRequired = totalRequiredMetrics();
  const resolvedRequired = totalRequired - gaps.length;

  return (
    <div className="min-h-screen bg-background">
      <TimTopBar user={session.user} />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <Link href={`/portfolio/${scenario.id}`} className="text-sm text-muted-foreground hover:text-accent hover:underline">
            ← {scenario.name}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Stage 2: Evidence plan & data health</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nothing here is a naked number — every cell either has a full source record or is honestly marked
            missing. {resolvedRequired}/{totalRequired} required metrics resolved.
          </p>
        </div>

        {gaps.length > 0 && (
          <Card className="mb-6 border-nogo-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-nogo">
                <AlertTriangle className="h-4 w-4" />
                Data gaps blocking decision ({gaps.length})
              </CardTitle>
              <CardDescription>
                These required inputs have no evidence on file. Later stages that depend on them will not fabricate a
                number in their place — resolve these first, or accept a DEFER PENDING EVIDENCE outcome.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {gaps.map((g) => (
                <div key={g.key} className="flex items-center justify-between rounded-md border border-nogo-border bg-nogo-bg/40 p-2 text-sm">
                  <span>{g.label}</span>
                  <AddEvidenceDialog scenarioId={scenario.id} category={g.category} metricKey={g.key} metricLabel={g.label} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {EVIDENCE_CATEGORY_ORDER.map((category) => (
          <Card key={category} className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{EVIDENCE_CATEGORY_LABELS[category]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {matrix[category].map((row) => (
                <div key={row.key} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
                  <div className="min-w-[220px] flex-1">
                    <p className="font-medium">
                      {row.label} {!row.required && <span className="text-muted-foreground">(optional)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{row.description}</p>
                  </div>
                  {row.current ? (
                    <>
                      <Badge variant={STATUS_BADGE[row.current.status]}>{row.current.status.replace("_", " ")}</Badge>
                      <span className="text-xs text-muted-foreground">{row.current.geography}</span>
                      <span className="text-xs text-muted-foreground">{row.current.confidence} confidence</span>
                      {row.isStale && (
                        <Badge variant="conditional" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {row.ageingDays}d old
                        </Badge>
                      )}
                      <EvidenceDrawer metricLabel={row.label} current={row.current} history={row.history} />
                    </>
                  ) : (
                    <>
                      <Badge variant={row.required ? "nogo" : "outline"}>Missing</Badge>
                      <AddEvidenceDialog scenarioId={scenario.id} category={category} metricKey={row.key} metricLabel={row.label} />
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {gaps.length === 0 && (
          <Card className="border-go-border">
            <CardContent className="flex items-center gap-2 p-4 text-sm text-go">
              <CheckCircle2 className="h-4 w-4" />
              All required evidence is on file. Stage 3 (market & destination diagnostic) can proceed.
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
