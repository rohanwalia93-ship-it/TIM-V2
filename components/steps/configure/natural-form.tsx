"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NumberField } from "@/components/steps/configure/number-field";
import { useScenarioStore } from "@/lib/store/scenarioStore";
import { buildNaturalDefaults } from "@/lib/model-defaults/natural";
import type { NaturalModelInputs } from "@/lib/scoring/natural";
import type { ResolvedValue } from "@/lib/sources/types";

const FIELD_GROUPS: { title: string; description: string; keys: (keyof NaturalModelInputs)[] }[] = [
  { title: "Site & carrying capacity", description: "Feeds the Cifuentes PCC → RCC → ECC cascade.", keys: ["siteAreaSqm", "visitorAreaSqm", "dailyOperatingHours", "avgVisitDurationHours"] },
  { title: "Environmental correction factors", description: "Each reduces the theoretical capacity toward a realistic one.", keys: ["climateSuitabilityIndex", "fragilityCf", "rainfallCf", "accessibilityCf", "biodiversityCf", "managementCapacityPercent"] },
  { title: "Demand & yield", description: "Drives the sustainable revenue ceiling and TALC positioning.", keys: ["captureRatePercent", "perVisitorYieldUsd", "projectedAnnualVisitors"] },
  { title: "Investment", description: "Feeds the shared DCF engine.", keys: ["capex", "annualOpex", "horizonYears"] },
];

export function NaturalForm() {
  const cityContext = useScenarioStore((s) => s.cityContext);
  const naturalInputs = useScenarioStore((s) => s.naturalInputs);
  const setNaturalInputs = useScenarioStore((s) => s.setNaturalInputs);
  const registerResolvedValue = useScenarioStore((s) => s.registerResolvedValue);

  const defaults = React.useMemo(() => buildNaturalDefaults(cityContext), [cityContext]);

  React.useEffect(() => {
    if (Object.keys(naturalInputs).length > 0) return;
    const initial: Partial<NaturalModelInputs> = {};
    for (const [key, rv] of Object.entries(defaults) as [keyof NaturalModelInputs, ResolvedValue<number>][]) {
      initial[key] = rv.value;
      registerResolvedValue(rv);
    }
    setNaturalInputs(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(key: keyof NaturalModelInputs, newValue: number) {
    setNaturalInputs({ [key]: newValue } as Partial<NaturalModelInputs>);
    const base = defaults[key];
    registerResolvedValue(
      newValue === base.value
        ? base
        : { ...base, value: newValue, confidence: "low", note: "Edited by user — overrides the cited default.", source: { name: "User assumption", url: "", license: "N/A", retrievedAt: new Date().toISOString() } },
    );
  }

  return (
    <div className="space-y-4">
      {FIELD_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.keys.map((key) => {
              const rv = defaults[key];
              const value = naturalInputs[key] ?? rv.value;
              return <NumberField key={key} resolvedValue={rv} value={value} onChange={(v) => handleChange(key, v)} />;
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
