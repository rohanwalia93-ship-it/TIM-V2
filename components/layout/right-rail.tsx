"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerdictPill } from "@/components/verdict-pill";
import { AssumptionsDrawer } from "@/components/provenance/assumptions-drawer";
import { useScenarioStore, ARCHETYPE_LABELS } from "@/lib/store/scenarioStore";

export function RightRail() {
  const results = useScenarioStore((s) => s.results);
  const city = useScenarioStore((s) => s.city);
  const archetype = useScenarioStore((s) => s.archetype);
  const product = useScenarioStore((s) => s.product);

  const score = results.viability?.compositeScore;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Current scenario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div>
            <p className="text-sm font-semibold leading-tight">
              {product ?? "No product selected"}
            </p>
            <p className="text-xs text-muted-foreground">
              {city ? `${city.cityName}, ${city.countryName}` : "No city selected"}
              {archetype ? ` · ${ARCHETYPE_LABELS[archetype]}` : ""}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Viability Index</span>
            <span className="text-2xl font-bold tabular-nums">
              {score !== undefined ? score.toFixed(0) : "—"}
            </span>
          </div>
          <VerdictPill verdict={results.viability?.verdict ?? null} />
        </CardContent>
      </Card>
      <AssumptionsDrawer />
    </div>
  );
}
