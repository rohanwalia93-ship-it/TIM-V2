"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { NumberField } from "@/components/steps/configure/number-field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useScenarioStore } from "@/lib/store/scenarioStore";
import { buildManMadeScalarDefaults, deriveCatchmentZones, deriveCompetitors, type ManMadeScalarKey } from "@/lib/model-defaults/manmade";
import type { ResolvedValue } from "@/lib/sources/types";

const PRIMARY_KEYS: ManMadeScalarKey[] = ["ticketPriceUsd", "perCapInParkSpendUsd", "capex", "designedDailyCapacity", "ownAttractivenessScore"];
const ADVANCED_KEYS: ManMadeScalarKey[] = [
  "residentPenetrationRatePercent",
  "betaDistanceDecay",
  "touristCaptureRatePercent",
  "huffLambda",
  "operatingDaysPerYear",
  "annualOpexBaseUsd",
  "variableOpexPercentOfRevenue",
  "horizonYears",
];

export function ManMadeForm() {
  const cityContext = useScenarioStore((s) => s.cityContext);
  const manmadeInputs = useScenarioStore((s) => s.manmadeInputs);
  const setManmadeInputs = useScenarioStore((s) => s.setManmadeInputs);
  const registerResolvedValue = useScenarioStore((s) => s.registerResolvedValue);
  const manmadeCityPopulationEstimate = useScenarioStore((s) => s.manmadeCityPopulationEstimate);
  const manmadeCatchmentZones = useScenarioStore((s) => s.manmadeCatchmentZones);
  const manmadeCompetitors = useScenarioStore((s) => s.manmadeCompetitors);
  const setManmadeCatchment = useScenarioStore((s) => s.setManmadeCatchment);

  const defaults = React.useMemo(() => buildManMadeScalarDefaults(), []);

  React.useEffect(() => {
    if (Object.keys(manmadeInputs).length === 0) {
      const initial: Partial<Record<ManMadeScalarKey, number>> = {};
      for (const [key, rv] of Object.entries(defaults) as [ManMadeScalarKey, ResolvedValue<number>][]) {
        initial[key] = rv.value;
        registerResolvedValue(rv);
      }
      setManmadeInputs(initial);
    }
    if (manmadeCatchmentZones.length === 0 && cityContext.worldBank) {
      const countryPop = cityContext.worldBank.population?.latest?.value ?? 5_000_000;
      const cityPopEstimate = Math.round(countryPop * 0.08);
      const zones = deriveCatchmentZones(cityContext, cityPopEstimate);
      const competitors = deriveCompetitors(cityContext);
      setManmadeCatchment(cityPopEstimate, zones, competitors);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityContext]);

  function handleChange(key: ManMadeScalarKey, newValue: number) {
    setManmadeInputs({ [key]: newValue });
    const base = defaults[key];
    registerResolvedValue(
      newValue === base.value
        ? base
        : { ...base, value: newValue, confidence: "low", note: "Edited by user — overrides the cited default.", source: { name: "User assumption", url: "", license: "N/A", retrievedAt: new Date().toISOString() } },
    );
  }

  function handlePopulationChange(newPop: number) {
    const zones = deriveCatchmentZones(cityContext, newPop);
    const competitors = deriveCompetitors(cityContext);
    setManmadeCatchment(newPop, zones, competitors);
  }

  function renderField(key: ManMadeScalarKey) {
    const rv = defaults[key];
    const value = manmadeInputs[key] ?? rv.value;
    return <NumberField key={key} resolvedValue={rv} value={value} onChange={(v) => handleChange(key, v)} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Catchment & competition</CardTitle>
          <CardDescription>Estimated from population and nearby attractions — check and adjust if it looks off.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="cityPop" className="text-xs">
              City / metro population estimate
            </Label>
            <Input
              id="cityPop"
              type="number"
              value={manmadeCityPopulationEstimate ?? ""}
              onChange={(e) => handlePopulationChange(Number(e.target.value))}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {manmadeCatchmentZones.map((z) => (
              <div key={z.label} className="rounded-md border border-border p-2 text-xs">
                <p className="font-medium">{z.label}</p>
                <p className="text-muted-foreground">{Math.round(z.population).toLocaleString()} people</p>
                <p className="text-muted-foreground">~{Math.round(z.distanceKm)} km</p>
              </div>
            ))}
          </div>
          {manmadeCompetitors.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Nearby competing attractions</p>
              <ul className="grid gap-1 text-xs sm:grid-cols-2">
                {manmadeCompetitors.map((c) => (
                  <li key={c.name} className="flex justify-between rounded border border-border px-2 py-1">
                    <span className="truncate">{c.name}</span>
                    <span className="text-muted-foreground">{c.distanceKm}km</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Key inputs</CardTitle>
          <CardDescription>Drives forecast attendance, revenue, and capacity checks.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{PRIMARY_KEYS.map(renderField)}</CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <Accordion type="single" collapsible>
            <AccordionItem value="advanced" className="border-none">
              <AccordionTrigger className="text-sm">Advanced settings (optional)</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">{ADVANCED_KEYS.map(renderField)}</div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
