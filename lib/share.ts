import type { ScenarioState } from "@/lib/store/scenarioStore";

const SHARE_PARAM = "s";

/** Serializes the data (non-function) slice of scenario state into a URL-safe base64 blob for a shareable link. */
export function encodeScenarioToShareParam(state: ScenarioState): string {
  const { id, name, city, archetype, product, objective, cityContext, resolvedValues, naturalInputs, manmadeInputs, eventInputs, manmadeCityPopulationEstimate, manmadeCatchmentZones, manmadeCompetitors, results } =
    state;
  const snapshot = {
    id,
    name,
    city,
    archetype,
    product,
    objective,
    cityContext,
    resolvedValues,
    naturalInputs,
    manmadeInputs,
    eventInputs,
    manmadeCityPopulationEstimate,
    manmadeCatchmentZones,
    manmadeCompetitors,
    results,
  };
  const json = JSON.stringify(snapshot);
  return typeof window === "undefined" ? Buffer.from(json).toString("base64") : window.btoa(unescape(encodeURIComponent(json)));
}

export function buildShareUrl(state: ScenarioState): string {
  const encoded = encodeScenarioToShareParam(state);
  const url = new URL(window.location.origin + "/scenario");
  url.searchParams.set(SHARE_PARAM, encoded);
  url.searchParams.set("step", "5");
  return url.toString();
}

export function decodeShareParam(value: string): Partial<ScenarioState> | null {
  try {
    const json = decodeURIComponent(escape(window.atob(value)));
    return JSON.parse(json) as Partial<ScenarioState>;
  } catch {
    return null;
  }
}

export { SHARE_PARAM };
