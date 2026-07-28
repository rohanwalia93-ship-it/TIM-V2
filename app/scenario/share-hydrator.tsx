"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useScenarioStore } from "@/lib/store/scenarioStore";
import { decodeShareParam, SHARE_PARAM } from "@/lib/share";

export function ShareHydrator() {
  const searchParams = useSearchParams();
  const hydrated = React.useRef(false);

  React.useEffect(() => {
    if (hydrated.current) return;
    const encoded = searchParams.get(SHARE_PARAM);
    if (!encoded) return;
    const decoded = decodeShareParam(encoded);
    if (!decoded) return;
    hydrated.current = true;
    useScenarioStore.setState((prev) => ({ ...prev, ...decoded }));
    const step = Number(searchParams.get("step"));
    if (step) useScenarioStore.setState({ currentStep: step });
  }, [searchParams]);

  return null;
}
