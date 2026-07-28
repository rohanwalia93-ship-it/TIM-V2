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
import type { CountryProfile } from "@/lib/sources/restCountries";
import type { WorldBankIndicatorKey, WorldBankResult } from "@/lib/sources/worldbank";
import type { ClimateResult } from "@/lib/sources/openMeteo";
import type { HotelSupplyResult, ComparableAttraction, SiteAreaResult } from "@/lib/sources/overpass";
import type { AirConnectivityResult } from "@/lib/sources/ourAirports";
import type { TicketmasterResult } from "@/lib/sources/ticketmaster";
import type { WikiSummary } from "@/lib/sources/wikipedia";

export type Archetype = "natural" | "manmade" | "event";

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  natural: "Natural",
  manmade: "Man-made",
  event: "Event-based",
};

export const ARCHETYPE_PRODUCTS: Record<Archetype, string[]> = {
  natural: ["Desert eco-lodge & dune reserve", "Nature reserve / wildlife park", "Coastal/marine reserve", "Mountain / trekking reserve"],
  manmade: ["Waterfront theme park", "Indoor entertainment complex", "Aquarium / zoo", "Cultural district / museum quarter"],
  event: ["Concert / stadium show", "Sports fixture / exhibition game", "Festival", "Convention / trade show"],
};

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
      setResults: (results) => set({ results }),
      reset: () => set({ ...initialSlice() }),
    }),
    { name: "tourviable-scenario" },
  ),
);
