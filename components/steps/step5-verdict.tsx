"use client";

import * as React from "react";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VerdictPill } from "@/components/verdict-pill";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { useScenarioStore } from "@/lib/store/scenarioStore";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { overallConfidence } from "@/lib/resolveInput";

export function Step5Verdict() {
  const results = useScenarioStore((s) => s.results);
  const resolvedValues = useScenarioStore((s) => s.resolvedValues);
  const setStep = useScenarioStore((s) => s.setStep);
  const archetype = useScenarioStore((s) => s.archetype);

  const confidence = React.useMemo(() => overallConfidence(Object.values(resolvedValues)), [resolvedValues]);

  if (!results.viability || !results.dcf || !results.archetypeResult) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Run the model in Step 4 first.</CardContent>
      </Card>
    );
  }

  const { viability, dcf, archetypeResult, discountRate } = results;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Verdict & financials</h1>
          <p className="mt-1 text-sm text-muted-foreground">{viability.verdictReason}</p>
        </div>
        <VerdictPill verdict={viability.verdict} size="lg" />
      </div>

      <Card className={confidence === "low" ? "border-conditional-border" : undefined}>
        <CardContent className="flex items-center gap-3 p-4">
          <ShieldAlert className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Confidence: <span className="capitalize">{confidence}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Derived from the share of live-API vs. benchmark vs. user-assumption inputs behind this verdict.
              {viability.downgradedForConfidence && " A GO score was downgraded to CONDITIONAL because of low overall confidence."}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">NPV</p>
            <p className="text-xl font-semibold tabular-nums">{formatCurrency(dcf.npv)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">IRR</p>
            <p className="text-xl font-semibold tabular-nums">{dcf.irr !== null ? formatPercent(dcf.irr * 100) : "N/A"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Payback</p>
            <p className="text-xl font-semibold tabular-nums">
              {dcf.paybackYears !== null ? `${dcf.paybackYears.toFixed(1)} yrs` : "Beyond horizon"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">BCR</p>
            <p className="text-xl font-semibold tabular-nums">{dcf.bcr.toFixed(2)}×</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Discounted cash flow</CardTitle>
          <CardDescription>
            Discount rate {discountRate !== null ? formatPercent(discountRate * 100) : "—"} (risk-free rate + cited country risk
            premium) over a {dcf.cashFlows.length}-year horizon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashflowChart cashFlows={dcf.cashFlows} />
        </CardContent>
      </Card>

      {archetype === "event" && (
        <Card>
          <CardHeader>
            <CardTitle>Economic impact (public lens)</CardTitle>
            <CardDescription>Shown separately from the private P&amp;L above, per UN Tourism TSA methodology.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Total economic impact</p>
              <p className="font-semibold tabular-nums">{formatCurrency(Number(archetypeResult.headline.totalEconomicImpact))}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Jobs supported</p>
              <p className="font-semibold tabular-nums">{Number(archetypeResult.headline.jobsSupported).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Public BCR</p>
              <p className="font-semibold tabular-nums">{Number(archetypeResult.headline.publicBcr).toFixed(2)}×</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net public benefit</p>
              <p className="font-semibold tabular-nums">{formatCurrency(Number(archetypeResult.headline.netPublicBenefit))}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Risk register</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {archetypeResult.riskFlags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No material risk flags triggered by current inputs.</p>
          ) : (
            archetypeResult.riskFlags.map((flag) => (
              <div key={flag.label} className="flex items-start gap-2 text-sm">
                <Badge variant={flag.severity === "high" ? "nogo" : flag.severity === "medium" ? "conditional" : "outline"}>
                  {flag.severity}
                </Badge>
                <div>
                  <p className="font-medium">{flag.label}</p>
                  <p className="text-xs text-muted-foreground">{flag.note}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={() => setStep(6)}>
          Sensitivity & scenarios
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
