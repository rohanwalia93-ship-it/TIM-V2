import type { ResolvedValue } from "@/lib/sources/types";
import type { CityContextData } from "@/lib/store/scenarioStore";
import { BENCHMARKS } from "@/lib/benchmarks";
import { fieldFromBenchmark, fieldAsAssumption } from "@/lib/model-defaults/shared";
import { resolveInput } from "@/lib/resolveInput";

export type AccommodationScalarKey =
  | "numberOfRooms"
  | "adrUsd"
  | "stabilizedOccupancyPercent"
  | "otherRevenuePercentOfRooms"
  | "gopMarginPercent"
  | "constructionCostPerKeyUsd"
  | "competitorHotelRooms"
  | "horizonYears";

export function buildAccommodationScalarDefaults(ctx: CityContextData): Record<AccommodationScalarKey, ResolvedValue<number>> {
  return {
    numberOfRooms: fieldAsAssumption("model.numberOfRooms", "Number of rooms", 200, "rooms", "Project-specific — enter the planned room count."),
    adrUsd: fieldFromBenchmark("model.adrUsd", "Average daily rate (ADR)", "STR Global", BENCHMARKS.hotelAdrUsdDefault, "USD"),
    stabilizedOccupancyPercent: fieldFromBenchmark("model.stabilizedOccupancyPercent", "Stabilized occupancy", "STR Global", BENCHMARKS.hotelStabilizedOccupancyPercentDefault, "%"),
    otherRevenuePercentOfRooms: fieldFromBenchmark("model.otherRevenuePercentOfRooms", "Other revenue (% of rooms)", "CBRE Hotel Horizons", BENCHMARKS.hotelOtherRevenuePercentOfRoomsDefault, "%"),
    gopMarginPercent: fieldFromBenchmark("model.gopMarginPercent", "GOP margin", "CBRE Hotel Horizons", BENCHMARKS.hotelGopMarginPercentDefault, "%"),
    constructionCostPerKeyUsd: fieldFromBenchmark("model.constructionCostPerKeyUsd", "Construction cost per key", "CBRE / HVS", BENCHMARKS.hotelConstructionCostPerKeyUsdDefault, "USD"),
    competitorHotelRooms: ctx.hotels
      ? resolveInput({
          key: "model.competitorHotelRooms",
          label: "Nearby competitor rooms (15km)",
          unit: "rooms",
          live: { value: ctx.hotels.estimatedRooms, source: ctx.hotels.source },
          benchmark: { value: ctx.hotels.estimatedRooms, source: ctx.hotels.source },
        })
      : fieldAsAssumption("model.competitorHotelRooms", "Nearby competitor rooms (15km)", 3_000, "rooms", "No OSM hotel data returned — enter an estimate of nearby room supply."),
    horizonYears: fieldFromBenchmark("model.horizonYears", "Appraisal horizon", "Standard appraisal horizon", BENCHMARKS.dcfHorizonYearsDefault, "yrs"),
  };
}

export function getAccommodationOccupancyRamp(): number[] {
  return [...BENCHMARKS.hotelOccupancyRampDefault.value];
}
