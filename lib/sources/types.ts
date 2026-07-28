export type Confidence = "high" | "medium" | "low";

export interface SourceMeta {
  /** Human readable source name, e.g. "World Bank Open Data" */
  name: string;
  /** Canonical URL for the source / endpoint documentation */
  url: string;
  /** License string, e.g. "CC BY 4.0" */
  license: string;
  /** ISO timestamp of when this value was retrieved or computed */
  retrievedAt: string;
  /** Optional indicator/series code, e.g. "ST.INT.ARVL" */
  indicatorCode?: string;
}

export interface ResolvedValue<T = number> {
  /** Field key, unique within a scenario, e.g. "demand.inboundArrivals" */
  key: string;
  /** Human label shown in the UI, e.g. "Inbound tourist arrivals" */
  label: string;
  value: T;
  unit?: string;
  confidence: Confidence;
  source: SourceMeta;
  /** Optional plain-English note, e.g. why a fallback was used */
  note?: string;
}

export const USER_ASSUMPTION_SOURCE = (): SourceMeta => ({
  name: "User assumption",
  url: "",
  license: "N/A",
  retrievedAt: new Date().toISOString(),
});

export function nowIso() {
  return new Date().toISOString();
}
