"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NumberField } from "@/components/steps/configure/number-field";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useScenarioStore } from "@/lib/store/scenarioStore";
import { buildEventScalarDefaults, type EventScalarKey } from "@/lib/model-defaults/event";
import type { ResolvedValue } from "@/lib/sources/types";

const FIELD_GROUPS: { title: string; description: string; keys: EventScalarKey[] }[] = [
  { title: "Attendance & incrementality", description: "Excludes locals, casuals, and displacement per event-economics guardrails.", keys: ["venueCapacity", "totalAttendance", "eventDurationDays", "incrementalityRatePercent"] },
  { title: "Per-attendee spend (TSA categories)", description: "UN Tourism TSA:RMF 2008 spend categories.", keys: ["ticketPriceUsd", "overnightSharePercent", "avgOvernightNights", "lodgingSpendPerNightUsd", "fnbSpendPerDayUsd", "transportSpendPerVisitUsd", "retailSpendPerVisitUsd"] },
  { title: "Multiplier & jobs", description: "Type II input-output multiplier decomposition.", keys: ["regionalOutputMultiplier", "outputPerJobUsd", "hotelRoomsAvailable"] },
  { title: "Cost & differentiation", description: "Feeds public BCR, private DCF, and the competition pillar.", keys: ["hostingCostUsd", "annualHostingOpexUsd", "mediaValueUsd", "uniquenessScore", "horizonYears"] },
];

export function EventForm() {
  const cityContext = useScenarioStore((s) => s.cityContext);
  const eventInputs = useScenarioStore((s) => s.eventInputs);
  const setEventInputs = useScenarioStore((s) => s.setEventInputs);
  const registerResolvedValue = useScenarioStore((s) => s.registerResolvedValue);

  const defaults = React.useMemo(() => buildEventScalarDefaults(cityContext), [cityContext]);

  React.useEffect(() => {
    if (Object.keys(eventInputs).length > 0) return;
    const initial: Partial<Record<EventScalarKey, number>> = {};
    for (const [key, rv] of Object.entries(defaults) as [EventScalarKey, ResolvedValue<number>][]) {
      initial[key] = rv.value;
      registerResolvedValue(rv);
    }
    setEventInputs({ ...initial, isRecurringAnnually: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(key: EventScalarKey, newValue: number) {
    setEventInputs({ [key]: newValue });
    const base = defaults[key];
    registerResolvedValue(
      newValue === base.value
        ? base
        : { ...base, value: newValue, confidence: "low", note: "Edited by user — overrides the cited default.", source: { name: "User assumption", url: "", license: "N/A", retrievedAt: new Date().toISOString() } },
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <Label htmlFor="recurring" className="text-sm">
              Recurring annual event?
            </Label>
            <p className="text-xs text-muted-foreground">
              One-off events show a single-year impact; recurring events compound across the appraisal horizon.
            </p>
          </div>
          <Switch
            id="recurring"
            checked={Boolean(eventInputs.isRecurringAnnually)}
            onCheckedChange={(checked) => setEventInputs({ isRecurringAnnually: checked })}
          />
        </CardContent>
      </Card>

      {FIELD_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{group.title}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.keys.map((key) => {
              const rv = defaults[key];
              const value = eventInputs[key] ?? rv.value;
              return <NumberField key={key} resolvedValue={rv} value={value} onChange={(v) => handleChange(key, v)} />;
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
