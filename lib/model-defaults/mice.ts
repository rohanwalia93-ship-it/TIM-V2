import type { ResolvedValue } from "@/lib/sources/types";
import type { CityContextData } from "@/lib/store/scenarioStore";
import { BENCHMARKS } from "@/lib/benchmarks";
import { fieldFromBenchmark, fieldAsAssumption } from "@/lib/model-defaults/shared";
import { resolveInput } from "@/lib/resolveInput";

/** MICE reuses the Event engine (runEventModel) — same fields, delegate-travel defaults and labels. */
export type MiceScalarKey =
  | "venueCapacity"
  | "totalAttendance"
  | "eventDurationDays"
  | "incrementalityRatePercent"
  | "ticketPriceUsd"
  | "overnightSharePercent"
  | "avgOvernightNights"
  | "lodgingSpendPerNightUsd"
  | "fnbSpendPerDayUsd"
  | "transportSpendPerVisitUsd"
  | "retailSpendPerVisitUsd"
  | "regionalOutputMultiplier"
  | "outputPerJobUsd"
  | "hotelRoomsAvailable"
  | "hostingCostUsd"
  | "annualHostingOpexUsd"
  | "mediaValueUsd"
  | "uniquenessScore"
  | "horizonYears";

export function buildMiceScalarDefaults(ctx: CityContextData): Record<MiceScalarKey, ResolvedValue<number>> {
  return {
    venueCapacity: fieldAsAssumption("model.venueCapacity", "Convention center capacity", 6_000, "delegates", "Project-specific — enter the venue's delegate capacity."),
    totalAttendance: fieldAsAssumption("model.totalAttendance", "Total delegates expected", 4_000, "delegates", "Estimate based on comparable conferences/exhibitions in this destination."),
    eventDurationDays: fieldAsAssumption("model.eventDurationDays", "Event duration", 3, "days", "Number of consecutive days the conference/exhibition runs."),
    incrementalityRatePercent: fieldFromBenchmark("model.incrementalityRatePercent", "Incrementality rate", "ICCA/UFI meetings-industry benchmark", BENCHMARKS.miceIncrementalityRatePercentDefault, "%"),
    ticketPriceUsd: fieldFromBenchmark("model.ticketPriceUsd", "Registration fee", "ICCA/UFI benchmark", BENCHMARKS.miceRegistrationFeeUsdDefault, "USD"),
    overnightSharePercent: fieldFromBenchmark("model.overnightSharePercent", "Overnight delegate share", "ICCA benchmark", BENCHMARKS.miceOvernightSharePercentDefault, "%"),
    avgOvernightNights: fieldFromBenchmark("model.avgOvernightNights", "Avg. nights per delegate", "ICCA benchmark", BENCHMARKS.miceAvgNightsDefault, "nights"),
    lodgingSpendPerNightUsd: fieldFromBenchmark("model.lodgingSpendPerNightUsd", "Lodging spend/night", "UN Tourism TSA:RMF 2008", BENCHMARKS.lodgingSpendPerNightUsdDefault, "USD"),
    fnbSpendPerDayUsd: fieldFromBenchmark("model.fnbSpendPerDayUsd", "F&B spend/day", "UN Tourism TSA:RMF 2008", BENCHMARKS.fnbSpendPerDayUsdDefault, "USD"),
    transportSpendPerVisitUsd: fieldFromBenchmark("model.transportSpendPerVisitUsd", "Local transport spend", "UN Tourism TSA:RMF 2008", BENCHMARKS.transportSpendPerVisitUsdDefault, "USD"),
    retailSpendPerVisitUsd: fieldFromBenchmark("model.retailSpendPerVisitUsd", "Retail/shopping spend", "UN Tourism TSA:RMF 2008", BENCHMARKS.retailSpendPerVisitUsdDefault, "USD"),
    regionalOutputMultiplier: fieldFromBenchmark("model.regionalOutputMultiplier", "Regional output multiplier (Type II)", "Type II I-O multiplier literature", BENCHMARKS.regionalOutputMultiplierDefault),
    outputPerJobUsd: fieldFromBenchmark("model.outputPerJobUsd", "Output per FTE job", "WTTC Economic Impact Research", BENCHMARKS.outputPerJobUsdDefault, "USD"),
    hotelRoomsAvailable: ctx.hotels
      ? resolveInput({
          key: "model.hotelRoomsAvailable",
          label: "Hotel rooms available (15km)",
          unit: "rooms",
          live: { value: ctx.hotels.estimatedRooms, source: ctx.hotels.source },
          benchmark: { value: ctx.hotels.estimatedRooms, source: ctx.hotels.source },
        })
      : fieldAsAssumption("model.hotelRoomsAvailable", "Hotel rooms available (15km)", 5_000, "rooms", "No OSM hotel data returned — enter an estimate of nearby room supply."),
    hostingCostUsd: fieldAsAssumption("model.hostingCostUsd", "Venue rental & production cost", 2_000_000, "USD", "Project-specific — enter the venue/production cost or bid-hosting subsidy."),
    annualHostingOpexUsd: fieldAsAssumption("model.annualHostingOpexUsd", "Annual show-running cost (if recurring)", 400_000, "USD", "Only applies if this becomes a recurring annual conference/exhibition."),
    mediaValueUsd: fieldAsAssumption("model.mediaValueUsd", "Estimated brand/exposure value", 1_000_000, "USD", "Broad estimate of destination exposure value from hosting — clearly an estimate."),
    uniquenessScore: fieldAsAssumption("model.uniquenessScore", "Destination differentiation score", 65, "/100", "A judgment call on how differentiated this destination is for this conference/exhibition versus competing bid cities."),
    horizonYears: fieldFromBenchmark("model.horizonYears", "Appraisal horizon", "Standard appraisal horizon", BENCHMARKS.dcfHorizonYearsDefault, "yrs"),
  };
}
