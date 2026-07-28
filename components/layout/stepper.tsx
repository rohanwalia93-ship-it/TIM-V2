"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScenarioStore } from "@/lib/store/scenarioStore";

export const STEPS = [
  { id: 1, label: "Frame the problem", description: "City, archetype, product" },
  { id: 2, label: "City context", description: "Auto-built evidence base" },
  { id: 3, label: "Configure model", description: "Archetype-specific inputs" },
  { id: 4, label: "Run model", description: "Pillar scores & formulas" },
  { id: 5, label: "Verdict & financials", description: "GO / CONDITIONAL / NO-GO" },
  { id: 6, label: "Scenario & sensitivity", description: "Drivers, tornado, break-even" },
  { id: 7, label: "Export", description: "PDF & shareable link" },
] as const;

export function Stepper({ maxUnlockedStep }: { maxUnlockedStep: number }) {
  const currentStep = useScenarioStore((s) => s.currentStep);
  const setStep = useScenarioStore((s) => s.setStep);

  return (
    <nav aria-label="Value chain steps" className="space-y-0.5">
      {STEPS.map((step) => {
        const isActive = currentStep === step.id;
        const isComplete = step.id < currentStep;
        const isLocked = step.id > maxUnlockedStep;
        return (
          <button
            key={step.id}
            type="button"
            disabled={isLocked}
            onClick={() => !isLocked && setStep(step.id)}
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
              isActive && "bg-accent text-accent-foreground",
              !isActive && !isLocked && "hover:bg-muted text-foreground",
              isLocked && "cursor-not-allowed opacity-40",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                isActive && "border-accent-foreground/40",
                !isActive && isComplete && "border-go bg-go-bg text-go",
                !isActive && !isComplete && "border-border text-muted-foreground",
              )}
            >
              {isComplete && !isActive ? <Check className="h-3 w-3" /> : step.id}
            </span>
            <span>
              <span className="block font-medium leading-tight">{step.label}</span>
              <span className={cn("block text-xs leading-tight", isActive ? "text-accent-foreground/80" : "text-muted-foreground")}>
                {step.description}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
