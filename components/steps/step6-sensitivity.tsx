"use client";

import * as React from "react";
import { ArrowRight, Copy, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { VerdictPill } from "@/components/verdict-pill";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { TornadoChart, type TornadoDatum } from "@/components/dashboard/tornado-chart";
import { useScenarioStore, type Archetype } from "@/lib/store/scenarioStore";
import { runScenario, type RunScenarioResult } from "@/lib/scoring/runScenario";
import type { NaturalModelInputs } from "@/lib/scoring/natural";
import type { ManMadeModelInputs } from "@/lib/scoring/manmade";
import type { EventModelInputs } from "@/lib/scoring/event";
import { overallConfidence } from "@/lib/resolveInput";
import { formatCurrency } from "@/lib/utils";

const DRIVERS: Record<Archetype, { key: string; label: string }[]> = {
  natural: [
    { key: "perVisitorYieldUsd", label: "Per-visitor yield" },
    { key: "captureRatePercent", label: "Capture rate (% of ECC)" },
    { key: "capex", label: "CAPEX" },
    { key: "annualOpex", label: "Annual OPEX" },
    { key: "projectedAnnualVisitors", label: "Projected annual visitors" },
  ],
  manmade: [
    { key: "ticketPriceUsd", label: "Ticket price" },
    { key: "perCapInParkSpendUsd", label: "Per-cap in-venue spend" },
    { key: "capex", label: "CAPEX" },
    { key: "ownAttractivenessScore", label: "Own attractiveness score" },
    { key: "residentPenetrationRatePercent", label: "Resident penetration rate" },
  ],
  event: [
    { key: "ticketPriceUsd", label: "Ticket price" },
    { key: "totalAttendance", label: "Total attendance" },
    { key: "incrementalityRatePercent", label: "Incrementality rate" },
    { key: "hostingCostUsd", label: "Hosting cost" },
    { key: "regionalOutputMultiplier", label: "Regional output multiplier" },
  ],
};

export function Step6Sensitivity() {
  const archetype = useScenarioStore((s) => s.archetype);
  const naturalInputs = useScenarioStore((s) => s.naturalInputs);
  const manmadeInputs = useScenarioStore((s) => s.manmadeInputs);
  const eventInputs = useScenarioStore((s) => s.eventInputs);
  const manmadeCatchmentZones = useScenarioStore((s) => s.manmadeCatchmentZones);
  const manmadeCompetitors = useScenarioStore((s) => s.manmadeCompetitors);
  const cityContext = useScenarioStore((s) => s.cityContext);
  const resolvedValues = useScenarioStore((s) => s.resolvedValues);
  const results = useScenarioStore((s) => s.results);
  const setStep = useScenarioStore((s) => s.setStep);
  const comparisonScenario = useScenarioStore((s) => s.comparisonScenario);

  const dataConfidence = React.useMemo(() => overallConfidence(Object.values(resolvedValues)), [resolvedValues]);
  const drivers = React.useMemo(() => (archetype ? DRIVERS[archetype] : []), [archetype]);
  const [deltas, setDeltas] = React.useState<Record<string, number>>({});

  const computeForDeltas = React.useCallback(
    (d: Record<string, number>): RunScenarioResult | null => {
      if (!archetype) return null;
      try {
        if (archetype === "natural") {
          const base = naturalInputs as unknown as Record<string, number>;
          const adjusted = { ...base };
          for (const [k, pct] of Object.entries(d)) adjusted[k] = base[k] * (1 + pct / 100);
          return runScenario("natural", cityContext, dataConfidence, {
            kind: "natural",
            natural: adjusted as unknown as NaturalModelInputs,
          });
        }
        if (archetype === "manmade") {
          const base = manmadeInputs as unknown as Record<string, number>;
          const adjusted = { ...base };
          for (const [k, pct] of Object.entries(d)) adjusted[k] = base[k] * (1 + pct / 100);
          return runScenario("manmade", cityContext, dataConfidence, {
            kind: "manmade",
            manmade: adjusted as unknown as ManMadeModelInputs,
            catchmentZones: manmadeCatchmentZones,
            competitors: manmadeCompetitors,
          });
        }
        const base = eventInputs as unknown as Record<string, number>;
        const adjusted = { ...base };
        for (const [k, pct] of Object.entries(d)) adjusted[k] = base[k] * (1 + pct / 100);
        return runScenario("event", cityContext, dataConfidence, {
          kind: "event",
          event: adjusted as unknown as EventModelInputs,
        });
      } catch {
        return null;
      }
    },
    [archetype, naturalInputs, manmadeInputs, eventInputs, manmadeCatchmentZones, manmadeCompetitors, cityContext, dataConfidence],
  );

  const whatIf = React.useMemo(() => computeForDeltas(deltas), [computeForDeltas, deltas]);

  const tornadoData: TornadoDatum[] = React.useMemo(() => {
    return drivers.map((driver) => {
      const low = computeForDeltas({ [driver.key]: -20 })?.dcf.npv ?? 0;
      const high = computeForDeltas({ [driver.key]: 20 })?.dcf.npv ?? 0;
      return { label: driver.label, low, high };
    });
  }, [drivers, computeForDeltas]);

  function saveComparison() {
    useScenarioStore.setState({ comparisonScenario: JSON.parse(JSON.stringify(useScenarioStore.getState())) });
  }

  if (!results.viability || !results.dcf || !archetype) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Run the model first (Step 4).</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Scenario & sensitivity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stress-test the top 5 driver assumptions. The tornado chart holds one driver at a time; the sliders below
          combine all five into a live &quot;what-if&quot; probe.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tornado — NPV sensitivity (±20% per driver)</CardTitle>
          <CardDescription>Ranked by impact magnitude on NPV. Dashed line = base-case NPV.</CardDescription>
        </CardHeader>
        <CardContent>
          <TornadoChart data={tornadoData} baseline={results.dcf.npv} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Live driver sliders</CardTitle>
            <CardDescription>Adjust each driver ±30% and see the composite score & NPV update instantly.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDeltas({})}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {drivers.map((driver) => (
            <div key={driver.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <Label>{driver.label}</Label>
                <span className="tabular-nums text-muted-foreground">
                  {(deltas[driver.key] ?? 0) > 0 ? "+" : ""}
                  {deltas[driver.key] ?? 0}%
                </span>
              </div>
              <Slider
                min={-30}
                max={30}
                step={5}
                value={[deltas[driver.key] ?? 0]}
                onValueChange={([v]) => setDeltas((prev) => ({ ...prev, [driver.key]: v }))}
              />
            </div>
          ))}

          {whatIf && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Adjusted Viability Index</p>
                <p className="text-lg font-semibold tabular-nums">{whatIf.viability.compositeScore.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Adjusted verdict</p>
                <VerdictPill verdict={whatIf.viability.verdict} size="sm" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Adjusted NPV</p>
                <p className="text-lg font-semibold tabular-nums">{formatCurrency(whatIf.dcf.npv)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Adjusted payback</p>
                <p className="text-lg font-semibold tabular-nums">
                  {whatIf.dcf.paybackYears !== null ? `${whatIf.dcf.paybackYears.toFixed(1)} yrs` : "Beyond horizon"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Break-even (adjusted scenario)</CardTitle>
          <CardDescription>Cumulative discounted cash flow crosses zero at the payback point.</CardDescription>
        </CardHeader>
        <CardContent>
          <CashflowChart cashFlows={(whatIf ?? results).dcf!.cashFlows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Scenario comparison</CardTitle>
            <CardDescription>Save a snapshot of your current scenario, then keep adjusting to compare A vs. B.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={saveComparison}>
            <Copy className="h-3.5 w-3.5" />
            Save as Scenario B
          </Button>
        </CardHeader>
        {comparisonScenario?.results.viability && (
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div />
              <div className="text-center font-medium">Scenario A (current)</div>
              <div className="text-center font-medium">Scenario B (saved)</div>

              <div className="text-muted-foreground">Viability Index</div>
              <div className="text-center tabular-nums">{results.viability.compositeScore.toFixed(0)}</div>
              <div className="text-center tabular-nums">{comparisonScenario.results.viability.compositeScore.toFixed(0)}</div>

              <div className="text-muted-foreground">Verdict</div>
              <div className="flex justify-center">
                <VerdictPill verdict={results.viability.verdict} size="sm" />
              </div>
              <div className="flex justify-center">
                <VerdictPill verdict={comparisonScenario.results.viability.verdict} size="sm" />
              </div>

              <div className="text-muted-foreground">NPV</div>
              <div className="text-center tabular-nums">{formatCurrency(results.dcf?.npv ?? 0)}</div>
              <div className="text-center tabular-nums">{formatCurrency(comparisonScenario.results.dcf?.npv ?? 0)}</div>

              <div className="text-muted-foreground">IRR</div>
              <div className="text-center tabular-nums">
                {results.dcf?.irr !== null && results.dcf?.irr !== undefined ? `${(results.dcf.irr * 100).toFixed(1)}%` : "N/A"}
              </div>
              <div className="text-center tabular-nums">
                {comparisonScenario.results.dcf?.irr !== null && comparisonScenario.results.dcf?.irr !== undefined
                  ? `${(comparisonScenario.results.dcf.irr * 100).toFixed(1)}%`
                  : "N/A"}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={() => setStep(7)}>
          Export report
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
