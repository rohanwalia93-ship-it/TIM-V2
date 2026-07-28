"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Mountain, Building2, Ticket, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CitySearch } from "@/components/steps/city-search";
import { cn } from "@/lib/utils";
import {
  useScenarioStore,
  ARCHETYPE_LABELS,
  ARCHETYPE_PRODUCTS,
  type Archetype,
} from "@/lib/store/scenarioStore";

const ARCHETYPE_META: Record<Archetype, { icon: typeof Mountain; description: string; examples: string }> = {
  natural: {
    icon: Mountain,
    description: "Sites bounded by ecosystem, land, and climate — carrying capacity is the central question.",
    examples: "Eco-lodges, nature reserves, coastal/marine parks, dune reserves",
  },
  manmade: {
    icon: Building2,
    description: "Built attractions competing for catchment demand — attendance forecasting drives the case.",
    examples: "Theme parks, museums, aquariums, entertainment districts",
  },
  event: {
    icon: Ticket,
    description: "Time-boxed draws where incremental visitor spend is the whole story.",
    examples: "Concerts, sports fixtures, festivals, conventions",
  },
};

export function Step1Frame() {
  const city = useScenarioStore((s) => s.city);
  const archetype = useScenarioStore((s) => s.archetype);
  const product = useScenarioStore((s) => s.product);
  const objective = useScenarioStore((s) => s.objective);
  const setCity = useScenarioStore((s) => s.setCity);
  const setArchetype = useScenarioStore((s) => s.setArchetype);
  const setProduct = useScenarioStore((s) => s.setProduct);
  const setObjective = useScenarioStore((s) => s.setObjective);
  const setStep = useScenarioStore((s) => s.setStep);

  const [category, setCategory] = React.useState("");
  const [conceptName, setConceptName] = React.useState("");

  React.useEffect(() => {
    if (!category && !conceptName) return;
    const combined = conceptName ? `${conceptName} — ${category}` : category;
    setProduct(combined || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, conceptName]);

  const canContinue = Boolean(city && archetype && product && objective.trim().length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Frame the problem</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us the city and the product you&apos;re testing. Everything downstream — data, model, verdict — reads
          from this frame.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. City</CardTitle>
          <CardDescription>Search any city worldwide — we resolve coordinates, country, and region.</CardDescription>
        </CardHeader>
        <CardContent>
          <CitySearch value={city} onSelect={setCity} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Product archetype</CardTitle>
          <CardDescription>Each archetype runs a distinct calculation methodology.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(Object.keys(ARCHETYPE_META) as Archetype[]).map((a) => {
              const meta = ARCHETYPE_META[a];
              const Icon = meta.icon;
              const isSelected = archetype === a;
              return (
                <motion.button
                  key={a}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setArchetype(a);
                    setCategory("");
                    setConceptName("");
                  }}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
                    isSelected ? "border-accent bg-accent/10" : "border-border hover:bg-muted",
                  )}
                >
                  <Icon className={cn("h-5 w-5", isSelected ? "text-accent" : "text-muted-foreground")} />
                  <span className="font-medium">{ARCHETYPE_LABELS[a]}</span>
                  <span className="text-xs text-muted-foreground">{meta.description}</span>
                  <span className="text-[11px] text-muted-foreground/80">{meta.examples}</span>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {archetype && (
        <Card>
          <CardHeader>
            <CardTitle>3. Specific product</CardTitle>
            <CardDescription>Pick a category and, optionally, name your concept.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {ARCHETYPE_PRODUCTS[archetype].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conceptName">Name it (optional)</Label>
              <Input
                id="conceptName"
                placeholder='e.g. "Coldplay"'
                value={conceptName}
                onChange={(e) => setConceptName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>4. Objective</CardTitle>
          <CardDescription>One line on what you&apos;re testing — this appears on the board report.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder='e.g. "Should we host an NBA exhibition game in Abu Dhabi in the next 18 months?"'
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" disabled={!canContinue} onClick={() => setStep(2)}>
          Build city context
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
