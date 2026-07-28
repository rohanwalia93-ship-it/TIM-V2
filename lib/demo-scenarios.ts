import type { Archetype } from "@/lib/store/scenarioStore";
import type { CitySearchResult } from "@/lib/sources/nominatim";

export interface DemoScenario {
  id: string;
  label: string;
  city: CitySearchResult;
  archetype: Archetype;
  product: string;
  objective: string;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "coldplay-abu-dhabi",
    label: "Coldplay in Abu Dhabi",
    city: { id: 1, displayName: "Abu Dhabi, United Arab Emirates", cityName: "Abu Dhabi", countryName: "United Arab Emirates", countryCode: "AE", lat: 24.4539, lon: 54.3773 },
    archetype: "event",
    product: "Coldplay — Concert / stadium show",
    objective: "Is it feasible and beneficial to bring a Coldplay stadium show to Abu Dhabi?",
  },
  {
    id: "nba-abu-dhabi",
    label: "NBA exhibition game in Abu Dhabi",
    city: { id: 1, displayName: "Abu Dhabi, United Arab Emirates", cityName: "Abu Dhabi", countryName: "United Arab Emirates", countryCode: "AE", lat: 24.4539, lon: 54.3773 },
    archetype: "event",
    product: "NBA exhibition game — Sports fixture / exhibition game",
    objective: "Should we host an NBA exhibition game in Abu Dhabi?",
  },
  {
    id: "theme-park-jeddah",
    label: "Waterfront theme park in Jeddah",
    city: { id: 2, displayName: "Jeddah, Saudi Arabia", cityName: "Jeddah", countryName: "Saudi Arabia", countryCode: "SA", lat: 21.4858, lon: 39.1925 },
    archetype: "manmade",
    product: "Waterfront theme park",
    objective: "Should we develop a new waterfront theme park in Jeddah?",
  },
  {
    id: "eco-lodge-al-ain",
    label: "Desert eco-lodge & dune reserve near Al Ain",
    city: { id: 3, displayName: "Al Ain, United Arab Emirates", cityName: "Al Ain", countryName: "United Arab Emirates", countryCode: "AE", lat: 24.2075, lon: 55.7447 },
    archetype: "natural",
    product: "Desert eco-lodge & dune reserve",
    objective: "Should we build a desert eco-lodge & dune reserve near Al Ain?",
  },
];
