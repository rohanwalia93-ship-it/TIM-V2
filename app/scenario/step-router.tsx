"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useScenarioStore } from "@/lib/store/scenarioStore";
import { Step1Frame } from "@/components/steps/step1-frame";
import { Step2CityContext } from "@/components/steps/step2-city-context";
import { Step3Configure } from "@/components/steps/step3-configure";
import { Step4RunModel } from "@/components/steps/step4-run-model";
import { Step5Verdict } from "@/components/steps/step5-verdict";
import { Step6Sensitivity } from "@/components/steps/step6-sensitivity";
import { Step7Export } from "@/components/steps/step7-export";

const STEP_COMPONENTS: Record<number, React.ComponentType> = {
  1: Step1Frame,
  2: Step2CityContext,
  3: Step3Configure,
  4: Step4RunModel,
  5: Step5Verdict,
  6: Step6Sensitivity,
  7: Step7Export,
};

export function StepRouter() {
  const currentStep = useScenarioStore((s) => s.currentStep);
  const StepComponent = STEP_COMPONENTS[currentStep] ?? Step1Frame;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <StepComponent />
      </motion.div>
    </AnimatePresence>
  );
}
