"use client";

import * as React from "react";
import { ArrowRight, AlertTriangle, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { PillarRadar } from "@/components/dashboard/pillar-radar";
import { useScenarioStore, getEngine, ARCHETYPE_LABELS } from "@/lib/store/scenarioStore";
import { overallConfidence } from "@/lib/resolveInput";
import { runScenario, type RunScenarioResult } from "@/lib/scoring/runScenario";
import type { NaturalModelInputs } from "@/lib/scoring/natural";
import type { ManMadeModelInputs } from "@/lib/scoring/manmade";
import type { EventModelInputs } from "@/lib/scoring/event";
import type { AccommodationModelInputs } from "@/lib/scoring/accommodation";
import { formatCurrency } from "@/lib/utils";
import { headlineLabel } from "@/lib/headline-labels";

export function Step4RunModel() {
  const archetype = useScenarioStore((s) => s.archetype);
  const product = useScenarioStore((s) => s.product);
  const naturalInputs = useScenarioStore((s) => s.naturalInputs);
  const manmadeInputs = useScenarioStore((s) => s.manmadeInputs);
  const eventInputs = useScenarioStore((s) => s.eventInputs);
  const miceInputs = useScenarioStore((s) => s.miceInputs);
  const accommodationInputs = useScenarioStore((s) => s.accommodationInputs);
  const manmadeCatchmentZones = useScenarioStore((s) => s.manmadeCatchmentZones);
  const manmadeCompetitors = useScenarioStore((s) => s.manmadeCompetitors);
  const cityContext = useScenarioStore((s) => s.cityContext);
  const resolvedValues = useScenarioStore((s) => s.resolvedValues);
  const results = useScenarioStore((s) => s.results);
  const setResults = useScenarioStore((s) => s.setResults);
  const setStep = useScenarioStore((s) => s.setStep);

  const dataConfidence = React.useMemo(() => overallConfidence(Object.values(resolvedValues)), [resolvedValues]);
  const engine = getEngine(archetype, product);

  const scenarioResult: RunScenarioResult | null = React.useMemo(() => {
    if (!engine) return null;
    try {
      if (engine === "natural") {
        return runScenario("natural", cityContext, dataConfidence, { kind: "natural", natural: naturalInputs as NaturalModelInputs });
      }
      if (engine === "manmade") {
        return runScenario("manmade", cityContext, dataConfidence, {
          kind: "manmade",
          manmade: manmadeInputs as ManMadeModelInputs,
          catchmentZones: manmadeCatchmentZones,
          competitors: manmadeCompetitors,
        });
      }
      if (engine === "accommodation") {
        return runScenario("accommodation", cityContext, dataConfidence, {
          kind: "accommodation",
          accommodation: accommodationInputs as Omit<AccommodationModelInputs, "occupancyRamp">,
        });
      }
      const eventSourceInputs = archetype === "mice" ? miceInputs : eventInputs;
      return runScenario("event", cityContext, dataConfidence, { kind: "event", event: eventSourceInputs as EventModelInputs });
    } catch {
      return null;
    }
  }, [engine, archetype, naturalInputs, manmadeInputs, eventInputs, miceInputs, accommodationInputs, manmadeCatchmentZones, manmadeCompetitors, cityContext, dataConfidence]);

  React.useEffect(() => {
    if (!scenarioResult) return;
    setResults(scenarioResult);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioResult]);

  const archetypeResult = scenarioResult?.archetypeResult ?? null;

  if (!archetypeResult || !results.viability) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Complete Step 3 to run the model — go back if some inputs look incomplete.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Run the model</h1>
        <p className="mt-1 text-sm text-muted-foreground">{archetypeResult.moduleName}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Universal Viability Index</CardTitle>
            <CardDescription>Composite 0–100, weighted mean of 5 pillars.</CardDescription>
          </CardHeader>
          <CardContent>
            <PillarRadar pillars={results.viability.pillars} />
            <div className="mt-2 grid grid-cols-5 gap-2 text-center text-xs">
              {results.viability.pillars.map((p) => (
                <div key={p.pillar}>
                  <p className="font-semibold tabular-nums">{p.score.toFixed(0)}</p>
                  <p className="text-muted-foreground">{p.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Headline metrics</CardTitle>
            <CardDescription>Key outputs from the {archetype ? ARCHETYPE_LABELS[archetype] : ""} model.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(archetypeResult.headline).map(([key, val]) => (
                <div key={key} className="rounded-md border border-border p-2">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {headlineLabel(key)}
                  </dt>
                  <dd className="font-semibold tabular-nums">
                    {typeof val === "number"
                      ? val > 1000
                        ? val.toLocaleString()
                        : val
                      : val}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      {archetypeResult.riskFlags.length > 0 && (
        <Card className={archetypeResult.hardGateBreached ? "border-nogo-border" : undefined}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risk flags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {archetypeResult.riskFlags.map((flag) => (
              <div key={flag.label} className="flex items-start gap-2 text-sm">
                <Badge variant={flag.severity === "high" ? "nogo" : flag.severity === "medium" ? "conditional" : "outline"}>
                  {flag.severity}
                </Badge>
                <div>
                  <p className="font-medium">{flag.label}</p>
                  <p className="text-xs text-muted-foreground">{flag.note}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Formula transparency
          </CardTitle>
          <CardDescription>Every step, its inputs, and why it matters. {archetypeResult.methodologyRefs.join(" · ")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {archetypeResult.formulaSteps.map((step, i) => (
              <AccordionItem key={step.label} value={`step-${i}`}>
                <AccordionTrigger>{step.label}</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2 rounded bg-muted px-2 py-1 font-mono text-xs">{step.formula}</p>
                  <div className="mb-2 grid gap-1 sm:grid-cols-2">
                    {Object.entries(step.inputs).map(([label, v]) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium tabular-nums">
                          {v.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          {v.unit ? ` ${v.unit}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm">
                    Result:{" "}
                    <span className="font-semibold tabular-nums">
                      {step.unit?.includes("USD")
                        ? formatCurrency(step.result)
                        : step.result.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      {step.unit && !step.unit.includes("USD") ? ` ${step.unit}` : ""}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{step.explanation}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={() => setStep(5)}>
          See verdict & financials
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
