import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TimTopBar } from "@/components/layout/tim-top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RecommendationPill } from "@/components/portfolio/recommendation-pill";
import { PortfolioMap } from "@/components/portfolio/portfolio-map";
import { STAGE_META, STAGE_ORDER } from "@/lib/stages";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const session = await auth();
  if (!session?.user) return null; // middleware redirects; this satisfies the type

  const scenarios = await db.scenario.findMany({
    include: {
      owner: true,
      versions: { where: { scenarioCase: "BASE" }, orderBy: { versionNumber: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const pipelineCounts = STAGE_ORDER.map((stage) => ({
    stage,
    count: scenarios.filter((s) => s.stage === stage).length,
  }));

  const pins = scenarios
    .filter((s) => s.lat != null && s.lon != null)
    .map((s) => ({
      id: s.id,
      name: s.name,
      lat: s.lat as number,
      lon: s.lon as number,
      stageLabel: STAGE_META[s.stage].label,
      recommendation: s.versions[0]?.recommendation ?? null,
    }));

  return (
    <div className="min-h-screen bg-background">
      <TimTopBar user={session.user} />
      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Active and completed tourism investment assessments across the destination.
            </p>
          </div>
          <Button size="lg" asChild>
            <Link href="/portfolio/new">
              <Plus className="h-4 w-4" />
              New assessment
            </Link>
          </Button>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline by stage</CardTitle>
              <CardDescription>How many active assessments sit at each of the 8 stages.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                {pipelineCounts.map(({ stage, count }) => (
                  <div key={stage} className="rounded-md border border-border p-2 text-center">
                    <p className="text-lg font-semibold tabular-nums">{count}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {STAGE_META[stage].number}. {STAGE_META[stage].label}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Portfolio map</CardTitle>
            </CardHeader>
            <CardContent>
              <PortfolioMap pins={pins} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assessments</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {scenarios.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No assessments yet. Start one with &quot;New assessment&quot; above.
              </p>
            ) : (
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Product</th>
                    <th className="px-2 py-2">Location</th>
                    <th className="px-2 py-2">Sponsor</th>
                    <th className="px-2 py-2">Stage</th>
                    <th className="px-2 py-2">Recommendation</th>
                    <th className="px-2 py-2">Confidence</th>
                    <th className="px-2 py-2">NPV / BCR</th>
                    <th className="px-2 py-2">Last update</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((s) => {
                    const v = s.versions[0];
                    const results = v?.resultsSnapshot ? (JSON.parse(v.resultsSnapshot) as { npv?: number; bcr?: number; confidence?: string }) : null;
                    return (
                      <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="px-2 py-2">
                          <Link href={`/portfolio/${s.id}`} className="font-medium hover:text-accent hover:underline">
                            {s.name}
                          </Link>
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{s.productClass.replaceAll("_", " ")}</td>
                        <td className="px-2 py-2 text-muted-foreground">{s.destinationName}</td>
                        <td className="px-2 py-2 text-muted-foreground">{s.sponsor ?? "—"}</td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {STAGE_META[s.stage].number}. {STAGE_META[s.stage].label}
                        </td>
                        <td className="px-2 py-2">
                          <RecommendationPill recommendation={v?.recommendation} size="sm" />
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{results?.confidence ?? "—"}</td>
                        <td className="px-2 py-2 tabular-nums text-muted-foreground">
                          {results?.npv !== undefined ? formatCurrency(results.npv) : "—"}
                          {results?.bcr !== undefined ? ` / ${results.bcr.toFixed(2)}x` : ""}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-muted-foreground">
                          {s.updatedAt.toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
