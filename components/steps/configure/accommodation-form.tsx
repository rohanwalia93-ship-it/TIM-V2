"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { NumberField } from "@/components/steps/configure/number-field";
import { useScenarioStore } from "@/lib/store/scenarioStore";
import { buildAccommodationScalarDefaults, type AccommodationScalarKey } from "@/lib/model-defaults/accommodation";
import type { ResolvedValue } from "@/lib/sources/types";

const PRIMARY_KEYS: AccommodationScalarKey[] = [
  "numberOfRooms",
  "adrUsd",
  "stabilizedOccupancyPercent",
  "constructionCostPerKeyUsd",
  "competitorHotelRooms",
];
const ADVANCED_KEYS: AccommodationScalarKey[] = ["otherRevenuePercentOfRooms", "gopMarginPercent", "horizonYears"];

export function AccommodationForm() {
  const cityContext = useScenarioStore((s) => s.cityContext);
  const accommodationInputs = useScenarioStore((s) => s.accommodationInputs);
  const setAccommodationInputs = useScenarioStore((s) => s.setAccommodationInputs);
  const registerResolvedValue = useScenarioStore((s) => s.registerResolvedValue);

  const defaults = React.useMemo(() => buildAccommodationScalarDefaults(cityContext), [cityContext]);

  React.useEffect(() => {
    if (Object.keys(accommodationInputs).length > 0) return;
    const initial: Partial<Record<AccommodationScalarKey, number>> = {};
    for (const [key, rv] of Object.entries(defaults) as [AccommodationScalarKey, ResolvedValue<number>][]) {
      initial[key] = rv.value;
      registerResolvedValue(rv);
    }
    setAccommodationInputs(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(key: AccommodationScalarKey, newValue: number) {
    setAccommodationInputs({ [key]: newValue });
    const base = defaults[key];
    registerResolvedValue(
      newValue === base.value
        ? base
        : { ...base, value: newValue, confidence: "low", note: "Edited by user — overrides the cited default.", source: { name: "User assumption", url: "", license: "N/A", retrievedAt: new Date().toISOString() } },
    );
  }

  function renderField(key: AccommodationScalarKey) {
    const rv = defaults[key];
    const value = accommodationInputs[key] ?? rv.value;
    return <NumberField key={key} resolvedValue={rv} value={value} onChange={(v) => handleChange(key, v)} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Key inputs</CardTitle>
          <CardDescription>Drives RevPAR, total revenue, and construction cost.</CardDescription>
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
