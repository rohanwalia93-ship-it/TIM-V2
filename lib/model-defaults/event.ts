import type { ResolvedValue } from "@/lib/sources/types";
import type { CityContextData } from "@/lib/store/scenarioStore";
import { BENCHMARKS } from "@/lib/benchmarks";
import { fieldFromBenchmark, fieldAsAssumption } from "@/lib/model-defaults/shared";
import { resolveInput } from "@/lib/resolveInput";

export type EventScalarKey =
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

export function buildEventScalarDefaults(ctx: CityContextData): Record<EventScalarKey, ResolvedValue<number>> {
  const comparableEvent = ctx.events?.events?.[0];
  const ticketLive = comparableEvent?.priceMin
    ? { value: (comparableEvent.priceMin + (comparableEvent.priceMax ?? comparableEvent.priceMin)) / 2, source: ctx.events!.source }
    : null;

  return {
    venueCapacity: fieldAsAssumption("model.venueCapacity", "Venue capacity", 18_000, "seats", "Project-specific — enter the host venue's capacity."),
    totalAttendance: fieldAsAssumption("model.totalAttendance", "Total attendance (all performances)", 16_000, "attendees", "Estimate based on venue capacity × expected sell-through — refine once ticketing data exists."),
    eventDurationDays: fieldAsAssumption("model.eventDurationDays", "Event duration", 1, "days", "Number of consecutive days the event runs."),
    incrementalityRatePercent: fieldFromBenchmark("model.incrementalityRatePercent", "Incrementality rate", "Event-economics guardrails", BENCHMARKS.incrementalityRatePercentDefault, "%"),
    ticketPriceUsd: ticketLive
      ? fieldFromBenchmark("model.ticketPriceUsd", "Ticket price", "Ticketmaster comparable events", BENCHMARKS.ticketPriceEventUsdDefault, "USD", ticketLive)
      : fieldFromBenchmark("model.ticketPriceUsd", "Ticket price", "Comparable-event benchmark", BENCHMARKS.ticketPriceEventUsdDefault, "USD"),
    overnightSharePercent: fieldFromBenchmark("model.overnightSharePercent", "Overnight visitor share", "UN Tourism TSA:RMF 2008", BENCHMARKS.overnightSharePercentDefault, "%"),
    avgOvernightNights: fieldFromBenchmark("model.avgOvernightNights", "Avg. nights (overnight visitors)", "UN Tourism TSA:RMF 2008", BENCHMARKS.avgOvernightNightsDefault, "nights"),
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
    hostingCostUsd: fieldAsAssumption("model.hostingCostUsd", "Hosting cost / fee / subsidy", 8_000_000, "USD", "Project-specific — enter the hosting fee, sanctioning cost, or public subsidy."),
    annualHostingOpexUsd: fieldAsAssumption("model.annualHostingOpexUsd", "Annual hosting OPEX (if recurring)", 1_500_000, "USD", "Only applies if this becomes a recurring annual event."),
    mediaValueUsd: fieldAsAssumption("model.mediaValueUsd", "Estimated media/brand value", 3_000_000, "USD", "Broad estimate of earned media exposure value — clearly an estimate, not a market-derived figure."),
    uniquenessScore: fieldAsAssumption("model.uniquenessScore", "Uniqueness / differentiation score", 70, "/100", "A judgment call on how differentiated this event is versus regional comparables."),
    horizonYears: fieldFromBenchmark("model.horizonYears", "Appraisal horizon", "Standard appraisal horizon", BENCHMARKS.dcfHorizonYearsDefault, "yrs"),
  };
}
