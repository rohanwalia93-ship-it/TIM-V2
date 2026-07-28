"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NumberField } from "@/components/steps/configure/number-field";
import { useScenarioStore } from "@/lib/store/scenarioStore";
import { buildMiceScalarDefaults, type MiceScalarKey } from "@/lib/model-defaults/mice";
import type { ResolvedValue } from "@/lib/sources/types";

const PRIMARY_KEYS: MiceScalarKey[] = ["totalAttendance", "ticketPriceUsd", "incrementalityRatePercent", "hostingCostUsd", "regionalOutputMultiplier"];
const ADVANCED_KEYS: MiceScalarKey[] = [
  "venueCapacity",
  "eventDurationDays",
  "overnightSharePercent",
  "avgOvernightNights",
  "lodgingSpendPerNightUsd",
  "fnbSpendPerDayUsd",
  "transportSpendPerVisitUsd",
  "retailSpendPerVisitUsd",
  "outputPerJobUsd",
  "hotelRoomsAvailable",
  "annualHostingOpexUsd",
  "mediaValueUsd",
  "uniquenessScore",
  "horizonYears",
];

export function MiceForm() {
  const cityContext = useScenarioStore((s) => s.cityContext);
  const miceInputs = useScenarioStore((s) => s.miceInputs);
  const setMiceInputs = useScenarioStore((s) => s.setMiceInputs);
  const registerResolvedValue = useScenarioStore((s) => s.registerResolvedValue);

  const defaults = React.useMemo(() => buildMiceScalarDefaults(cityContext), [cityContext]);

  React.useEffect(() => {
    if (Object.keys(miceInputs).length > 0) return;
    const initial: Partial<Record<MiceScalarKey, number>> = {};
    for (const [key, rv] of Object.entries(defaults) as [MiceScalarKey, ResolvedValue<number>][]) {
      initial[key] = rv.value;
      registerResolvedValue(rv);
    }
    setMiceInputs({ ...initial, isRecurringAnnually: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(key: MiceScalarKey, newValue: number) {
    setMiceInputs({ [key]: newValue });
    const base = defaults[key];
    registerResolvedValue(
      newValue === base.value
        ? base
        : { ...base, value: newValue, confidence: "low", note: "Edited by user — overrides the cited default.", source: { name: "User assumption", url: "", license: "N/A", retrievedAt: new Date().toISOString() } },
    );
  }

  function renderField(key: MiceScalarKey) {
    const rv = defaults[key];
    const value = miceInputs[key] ?? rv.value;
    return <NumberField key={key} resolvedValue={rv} value={value} onChange={(v) => handleChange(key, v)} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <Label htmlFor="mice-recurring" className="text-sm">
              Recurring annual event?
            </Label>
            <p className="text-xs text-muted-foreground">
              One-off conferences/exhibitions show a single-year impact; recurring ones compound across the horizon.
            </p>
          </div>
          <Switch
            id="mice-recurring"
            checked={Boolean(miceInputs.isRecurringAnnually)}
            onCheckedChange={(checked) => setMiceInputs({ isRecurringAnnually: checked })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Key inputs</CardTitle>
          <CardDescription>Drives delegate spend, economic impact, and hosting return.</CardDescription>
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
