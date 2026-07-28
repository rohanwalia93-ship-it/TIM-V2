import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { StepRouter } from "@/app/scenario/step-router";
import { ShareHydrator } from "@/app/scenario/share-hydrator";

export default function ScenarioPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <ShareHydrator />
      </Suspense>
      <StepRouter />
    </AppShell>
  );
}
