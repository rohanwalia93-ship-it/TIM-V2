"use client";

import { useRouter } from "next/navigation";
import { Compass, ArrowRight, Mountain, Building2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { useScenarioStore } from "@/lib/store/scenarioStore";
import { DEMO_SCENARIOS } from "@/lib/demo-scenarios";

export default function Home() {
  const router = useRouter();
  const reset = useScenarioStore((s) => s.reset);
  const setCity = useScenarioStore((s) => s.setCity);
  const setArchetype = useScenarioStore((s) => s.setArchetype);
  const setProduct = useScenarioStore((s) => s.setProduct);
  const setObjective = useScenarioStore((s) => s.setObjective);
  const setStep = useScenarioStore((s) => s.setStep);

  function startNew() {
    reset();
    router.push("/scenario");
  }

  function startDemo(demoId: string) {
    const demo = DEMO_SCENARIOS.find((d) => d.id === demoId);
    if (!demo) return;
    reset();
    setCity(demo.city);
    setArchetype(demo.archetype);
    setProduct(demo.product);
    setObjective(demo.objective);
    setStep(2);
    router.push("/scenario");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <Compass className="h-5 w-5 text-accent" />
            TourViable
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/methodology")}>
              Methodology
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Should you launch it? <span className="text-accent">Know in minutes, not months.</span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">
            TourViable turns &quot;should we bring this tourism product to this city?&quot; into a board-ready verdict. Every
            figure is sourced from a free public API or a cited benchmark — never fabricated. Pick a city and a
            product, and walk one guided path from evidence to GO / CONDITIONAL / NO-GO, with full financials and
            formula transparency along the way.
          </p>
          <Button size="lg" className="mt-6" onClick={startNew}>
            Start a new scenario
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <Mountain className="h-5 w-5 text-accent" />
              <CardTitle className="text-base">Natural</CardTitle>
              <CardDescription>Cifuentes carrying-capacity cascade + Butler&apos;s TALC.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Building2 className="h-5 w-5 text-accent" />
              <CardTitle className="text-base">Man-made</CardTitle>
              <CardDescription>Huff gravity / distance-decay attendance forecasting.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Ticket className="h-5 w-5 text-accent" />
              <CardTitle className="text-base">Event</CardTitle>
              <CardDescription>UN Tourism TSA input-output multiplier method.</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-14">
          <h2 className="mb-4 text-center text-lg font-semibold">Or reach a verdict in under 60 seconds</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {DEMO_SCENARIOS.map((demo) => (
              <button
                key={demo.id}
                onClick={() => startDemo(demo.id)}
                className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-accent hover:bg-accent/5"
              >
                <p className="font-medium">{demo.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{demo.objective}</p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
