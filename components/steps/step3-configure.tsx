"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NaturalForm } from "@/components/steps/configure/natural-form";
import { ManMadeForm } from "@/components/steps/configure/manmade-form";
import { EventForm } from "@/components/steps/configure/event-form";
import { MiceForm } from "@/components/steps/configure/mice-form";
import { AccommodationForm } from "@/components/steps/configure/accommodation-form";
import { useScenarioStore, getEngine } from "@/lib/store/scenarioStore";

export function Step3Configure() {
  const archetype = useScenarioStore((s) => s.archetype);
  const product = useScenarioStore((s) => s.product);
  const setStep = useScenarioStore((s) => s.setStep);
  const engine = getEngine(archetype, product);

  if (!archetype || !engine) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Pick a category in Step 1 first.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configure the model</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The key inputs below are pre-filled with sensible defaults — edit anything and it becomes a tracked
          assumption. More detail is available under &quot;Advanced settings.&quot;
        </p>
      </div>

      {engine === "natural" && <NaturalForm />}
      {engine === "manmade" && <ManMadeForm />}
      {engine === "event" && archetype === "events" && <EventForm />}
      {engine === "event" && archetype === "mice" && <MiceForm />}
      {engine === "accommodation" && <AccommodationForm />}

      <div className="flex justify-end">
        <Button size="lg" onClick={() => setStep(4)}>
          Run the model
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
