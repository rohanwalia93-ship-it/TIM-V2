"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ResolvedValue } from "@/lib/sources/types";
import type { CitySearchResult } from "@/lib/sources/nominatim";
import type { ArchetypeResult } from "@/lib/scoring/types";
import type { ViabilityResult, Pillar } from "@/lib/scoring/viabilityIndex";
import type { DcfResult } from "@/lib/finance/dcf";
import type { NaturalModelInputs } from "@/lib/scoring/natural";
import type { ManMadeModelInputs, CatchmentZone, Competitor } from "@/lib/scoring/manmade";
import type { EventModelInputs } from "@/lib/scoring/event";
import type { AccommodationModelInputs } from "@/lib/scoring/accommodation";
import type { CountryProfile } from "@/lib/sources/restCountries";
import type { WorldBankIndicatorKey, WorldBankResult } from "@/lib/sources/worldbank";
import type { ClimateResult } from "@/lib/sources/openMeteo";
import type { HotelSupplyResult, ComparableAttraction, SiteAreaResult } from "@/lib/sources/overpass";
import type { AirConnectivityResult } from "@/lib/sources/ourAirports";
import type { TicketmasterResult } from "@/lib/sources/ticketmaster";
import type { WikiSummary } from "@/lib/sources/wikipedia";

/** The 4 product categories a user picks from in Step 1. */
export type Archetype = "events" | "attractions" | "accommodation" | "mice";

/** Which calculation engine actually runs — Attractions splits into two depending on the chosen product. */
export type Engine = "event" | "manmade" | "natural" | "accommodation";

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  events: "Events",
  attractions: "Attractions",
  accommodation: "Accommodation",
  mice: "MICE",
};

export const ARCHETYPE_PRODUCTS: Record<Archetype, string[]> = {
  events: ["Concert / stadium show", "Sports fixture / exhibition game", "Festival"],
  attractions: [
    "Waterfront theme park",
    "Indoor entertainment complex",
    "Aquarium / zoo",
    "Cultural district / museum quarter",
    "Desert eco-lodge & dune reserve",
    "Nature reserve / wildlife park",
    "Coastal / marine reserve",
    "Mountain / trekking reserve",
  ],
  accommodation: ["Resort / beach hotel", "City business hotel", "Boutique / heritage hotel", "Serviced apartments"],
  mice: ["Convention / trade show", "Corporate conference", "Incentive travel program", "Exhibition / trade fair"],
};

/** Attractions products that run the carrying-capacity engine instead of the attendance-forecast engine. */
const NATURAL_ATTRACTION_PRODUCTS = new Set([
  "Desert eco-lodge & dune reserve",
  "Nature reserve / wildlife park",
  "Coastal / marine reserve",
  "Mountain / trekking reserve",
]);

/** Product is stored as "Concept name — Category" or just "Category" — this strips the concept-name prefix. */
export function extractProductCategory(product: string): string {
  const idx = product.lastIndexOf(" — ");
  return idx === -1 ? product : product.slice(idx + 3);
}

export function getEngine(archetype: Archetype | null, product: string | null): Engine | null {
  if (!archetype) return null;
  if (archetype === "events" || archetype === "mice") return "event";
  if (archetype === "accommodation") return "accommodation";
  if (archetype === "attractions") {
    if (product && NATURAL_ATTRACTION_PRODUCTS.has(extractProductCategory(product))) return "natural";
    return "manmade";
  }
  return null;
}

export interface CityContextData {
  countryProfile?: CountryProfile | null;
  worldBank?: Record<WorldBankIndicatorKey, WorldBankResult | null>;
  climate?: ClimateResult | null;
  hotels?: HotelSupplyResult | null;
  attractions?: { attractions: ComparableAttraction[] } | null;
  siteArea?: SiteAreaResult | null;
  airConnectivity?: AirConnectivityResult | null;
  events?: TicketmasterResult | null;
  wiki?: WikiSummary | null;
  fetchedAt?: string;
}

export interface ScenarioResults {
  archetypeResult: ArchetypeResult | null;
  viability: ViabilityResult | null;
  dcf: DcfResult | null;
  discountRate: number | null;
}

export interface ScenarioState {
  id: string;
  name: string;
  currentStep: number;

  city: CitySearchResult | null;
  archetype: Archetype | null;
  product: string | null;
  objective: string;

  cityContext: CityContextData;
  resolvedValues: Record<string, ResolvedValue>;

  naturalInputs: Partial<NaturalModelInputs>;
  manmadeInputs: Partial<ManMadeModelInputs>;
  eventInputs: Partial<EventModelInputs>;
  miceInputs: Partial<EventModelInputs>;
  accommodationInputs: Partial<AccommodationModelInputs>;
  manmadeCityPopulationEstimate: number | null;
  manmadeCatchmentZones: CatchmentZone[];
  manmadeCompetitors: Competitor[];

  pillarWeights: Record<Pillar, number> | null;
  results: ScenarioResults;

  comparisonScenario: ScenarioState | null;

  // actions
  setCity: (city: CitySearchResult | null) => void;
  setArchetype: (a: Archetype | null) => void;
  setProduct: (p: string | null) => void;
  setObjective: (o: string) => void;
  setStep: (step: number) => void;
  setCityContext: (patch: Partial<CityContextData>) => void;
  registerResolvedValue: (rv: ResolvedValue) => void;
  setNaturalInputs: (patch: Partial<NaturalModelInputs>) => void;
  setManmadeInputs: (patch: Partial<ManMadeModelInputs>) => void;
  setEventInputs: (patch: Partial<EventModelInputs>) => void;
  setMiceInputs: (patch: Partial<EventModelInputs>) => void;
  setAccommodationInputs: (patch: Partial<AccommodationModelInputs>) => void;
  setManmadeCatchment: (population: number, zones: CatchmentZone[], competitors: Competitor[]) => void;
  setResults: (results: ScenarioResults) => void;
  reset: () => void;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

const initialSlice = () => ({
  id: makeId(),
  name: "Untitled scenario",
  currentStep: 1,
  city: null,
  archetype: null,
  product: null,
  objective: "",
  cityContext: {},
  resolvedValues: {},
  naturalInputs: {},
  manmadeInputs: {},
  eventInputs: {},
  miceInputs: {},
  accommodationInputs: {},
  manmadeCityPopulationEstimate: null,
  manmadeCatchmentZones: [],
  manmadeCompetitors: [],
  pillarWeights: null,
  results: { archetypeResult: null, viability: null, dcf: null, discountRate: null },
  comparisonScenario: null,
});

export const useScenarioStore = create<ScenarioState>()(
  persist(
    (set) => ({
      ...initialSlice(),

      setCity: (city) => set({ city }),
      setArchetype: (archetype) => set({ archetype, product: null }),
      setProduct: (product) => set({ product }),
      setObjective: (objective) => set({ objective }),
      setStep: (currentStep) => set({ currentStep }),
      setCityContext: (patch) =>
        set((s) => ({ cityContext: { ...s.cityContext, ...patch, fetchedAt: new Date().toISOString() } })),
      registerResolvedValue: (rv) =>
        set((s) => ({ resolvedValues: { ...s.resolvedValues, [rv.key]: rv } })),
      setNaturalInputs: (patch) => set((s) => ({ naturalInputs: { ...s.naturalInputs, ...patch } })),
      setManmadeInputs: (patch) => set((s) => ({ manmadeInputs: { ...s.manmadeInputs, ...patch } })),
      setManmadeCatchment: (manmadeCityPopulationEstimate, manmadeCatchmentZones, manmadeCompetitors) =>
        set({ manmadeCityPopulationEstimate, manmadeCatchmentZones, manmadeCompetitors }),
      setEventInputs: (patch) => set((s) => ({ eventInputs: { ...s.eventInputs, ...patch } })),
      setMiceInputs: (patch) => set((s) => ({ miceInputs: { ...s.miceInputs, ...patch } })),
      setAccommodationInputs: (patch) => set((s) => ({ accommodationInputs: { ...s.accommodationInputs, ...patch } })),
      setResults: (results) => set({ results }),
      reset: () => set({ ...initialSlice() }),
    }),
    { name: "tourviable-scenario" },
  ),
);
