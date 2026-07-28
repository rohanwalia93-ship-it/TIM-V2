"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { Stepper } from "@/components/layout/stepper";
import { RightRail } from "@/components/layout/right-rail";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useScenarioStore } from "@/lib/store/scenarioStore";

function computeMaxUnlockedStep(s: ReturnType<typeof useScenarioStore.getState>): number {
  if (!s.city || !s.archetype || !s.product) return 1;
  if (!s.cityContext.fetchedAt) return 2;
  if (!s.results.viability) return 4;
  return 7;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const maxUnlockedStep = useScenarioStore(computeMaxUnlockedStep);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Compass className="h-5 w-5 text-accent" />
            TourViable
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/methodology">Methodology</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr_280px]">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <Stepper maxUnlockedStep={maxUnlockedStep} />
        </aside>
        <main className="min-w-0">{children}</main>
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <RightRail />
        </aside>
      </div>
    </div>
  );
}
