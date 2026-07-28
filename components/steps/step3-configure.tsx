"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NaturalForm } from "@/components/steps/configure/natural-form";
import { ManMadeForm } from "@/components/steps/configure/manmade-form";
import { EventForm } from "@/components/steps/configure/event-form";
import { useScenarioStore } from "@/lib/store/scenarioStore";

export function Step3Configure() {
  const archetype = useScenarioStore((s) => s.archetype);
  const setStep = useScenarioStore((s) => s.setStep);

  if (!archetype) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Pick a product archetype in Step 1 first.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configure the model</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every field is pre-filled from live data or a cited benchmark — edit anything and it becomes a tracked
          assumption.
        </p>
      </div>

      {archetype === "natural" && <NaturalForm />}
      {archetype === "manmade" && <ManMadeForm />}
      {archetype === "event" && <EventForm />}

      <div className="flex justify-end">
        <Button size="lg" onClick={() => setStep(4)}>
          Run the model
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
