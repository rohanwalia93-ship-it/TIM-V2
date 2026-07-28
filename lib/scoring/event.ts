import type { ArchetypeResult, FormulaStep } from "@/lib/scoring/types";
import { normalize, normalizeInverse } from "@/lib/scoring/viabilityIndex";

export interface EventModelInputs {
  venueCapacity: number;
  totalAttendance: number; // aggregate across all performances/days of this event
  eventDurationDays: number;
  incrementalityRatePercent: number; // net "new money" share after excluding locals/time-switchers
  ticketPriceUsd: number;
  overnightSharePercent: number;
  avgOvernightNights: number;
  lodgingSpendPerNightUsd: number;
  fnbSpendPerDayUsd: number;
  transportSpendPerVisitUsd: number;
  retailSpendPerVisitUsd: number;
  regionalOutputMultiplier: number;
  outputPerJobUsd: number;
  directIndirectInducedSplit: { direct: number; indirect: number; induced: number };
  hotelRoomsAvailable: number;
  hostingCostUsd: number; // CAPEX / hosting fee / subsidy (one-off)
  annualHostingOpexUsd: number; // recurring operating cost if the event repeats
  mediaValueUsd: number;
  uniquenessScore: number; // 0-100 differentiation/brand proxy
  isRecurringAnnually: boolean;
  horizonYears: number;
}

export function runEventModel(inputs: EventModelInputs): ArchetypeResult {
  const incrementalAttendees = inputs.totalAttendance * (inputs.incrementalityRatePercent / 100);

  const perAttendeeSpend =
    inputs.ticketPriceUsd +
    (inputs.overnightSharePercent / 100) * inputs.avgOvernightNights * inputs.lodgingSpendPerNightUsd +
    inputs.fnbSpendPerDayUsd * Math.max(1, inputs.avgOvernightNights) +
    inputs.transportSpendPerVisitUsd +
    inputs.retailSpendPerVisitUsd;

  const directSpend = incrementalAttendees * perAttendeeSpend;

  const roomNights = incrementalAttendees * (inputs.overnightSharePercent / 100) * inputs.avgOvernightNights;
  const peakNightRoomsNeeded = roomNights / Math.max(1, inputs.eventDurationDays);
  const roomSupplyPressure = peakNightRoomsNeeded / Math.max(1, inputs.hotelRoomsAvailable);

  const totalEconomicImpact = directSpend * inputs.regionalOutputMultiplier;
  const splitSum =
    inputs.directIndirectInducedSplit.direct +
    inputs.directIndirectInducedSplit.indirect +
    inputs.directIndirectInducedSplit.induced || 1;
  const directImpact = totalEconomicImpact * (inputs.directIndirectInducedSplit.direct / splitSum);
  const indirectImpact = totalEconomicImpact * (inputs.directIndirectInducedSplit.indirect / splitSum);
  const inducedImpact = totalEconomicImpact * (inputs.directIndirectInducedSplit.induced / splitSum);

  const jobsSupported = totalEconomicImpact / inputs.outputPerJobUsd;

  const ticketRevenue = incrementalAttendees * inputs.ticketPriceUsd;
  const publicBcr = totalEconomicImpact / Math.max(1, inputs.hostingCostUsd);
  const netPublicBenefit = totalEconomicImpact - inputs.hostingCostUsd;

  const horizon = inputs.horizonYears;
  const annualRevenue = Array.from({ length: horizon }, (_, i) =>
    inputs.isRecurringAnnually || i === 0 ? ticketRevenue : 0,
  );
  const annualOpex = Array.from({ length: horizon }, (_, i) =>
    inputs.isRecurringAnnually || i === 0 ? inputs.annualHostingOpexUsd : 0,
  );
  const capex = inputs.isRecurringAnnually ? inputs.hostingCostUsd : inputs.hostingCostUsd;

  const formulaSteps: FormulaStep[] = [
    {
      label: "Incremental attendees",
      formula: "Incremental = Total attendance × Incrementality rate",
      inputs: {
        "Total attendance": { value: inputs.totalAttendance },
        "Incrementality rate": { value: inputs.incrementalityRatePercent, unit: "%" },
      },
      result: incrementalAttendees,
      unit: "attendees",
      explanation: "Excludes locals, casual time-switchers, and substitution/crowding-out effects — only genuinely new visitor spend counts.",
    },
    {
      label: "Direct spend",
      formula: "Direct = Incremental attendees × (ticket + lodging + F&B + transport + retail)",
      inputs: {
        "Per-attendee spend": { value: perAttendeeSpend, unit: "USD" },
        "Incremental attendees": { value: incrementalAttendees },
      },
      result: directSpend,
      unit: "USD",
      explanation: "Direct new visitor spend across all TSA categories.",
    },
    {
      label: "Room nights",
      formula: "Room nights = Incremental attendees × Overnight% × Avg nights",
      inputs: {
        "Overnight share": { value: inputs.overnightSharePercent, unit: "%" },
        "Avg nights": { value: inputs.avgOvernightNights },
      },
      result: roomNights,
      unit: "room-nights",
      explanation: "Checked against hotel supply to flag accommodation strain during the event window.",
    },
    {
      label: "Total economic impact",
      formula: "Total impact = Direct spend × Regional output multiplier",
      inputs: {
        "Direct spend": { value: directSpend, unit: "USD" },
        "Multiplier": { value: inputs.regionalOutputMultiplier },
      },
      result: totalEconomicImpact,
      unit: "USD",
      explanation: "Type II input-output multiplier — captures indirect (supply-chain) and induced (re-spent wages) effects beyond the direct spend.",
    },
    {
      label: "Jobs supported",
      formula: "Jobs = Total impact ÷ Output-per-job",
      inputs: {
        "Total impact": { value: totalEconomicImpact, unit: "USD" },
        "Output per job": { value: inputs.outputPerJobUsd, unit: "USD" },
      },
      result: jobsSupported,
      unit: "FTE jobs",
      explanation: "Approximates the number of full-time-equivalent jobs the total economic impact supports across the local economy.",
    },
  ];

  const demandScore = normalize(incrementalAttendees, 0, inputs.venueCapacity * 1.1);
  const economicsScore = normalize(publicBcr * 100, 0, 400);
  const competitionScore = inputs.uniquenessScore;
  const riskScore = normalizeInverse(roomSupplyPressure * 100, 0, 150);

  const riskFlags = [];
  if (roomSupplyPressure > 0.85) {
    riskFlags.push({
      label: "Accommodation strain",
      severity: (roomSupplyPressure > 1 ? "high" : "medium") as "high" | "medium",
      note: `Peak-night room demand (~${Math.round(peakNightRoomsNeeded).toLocaleString()}) approaches or exceeds tracked hotel supply (${inputs.hotelRoomsAvailable.toLocaleString()} rooms) — expect rate spikes or overflow to neighboring cities.`,
    });
  }
  if (!inputs.isRecurringAnnually) {
    riskFlags.push({
      label: "One-off event",
      severity: "low" as const,
      note: "This is a single-occurrence event — economic impact is a one-time uplift, not a recurring revenue base. Consider a recurring/annual format to compound the return.",
    });
  }
  if (inputs.incrementalityRatePercent > 85) {
    riskFlags.push({
      label: "Aggressive incrementality assumption",
      severity: "medium" as const,
      note: "An incrementality rate above ~85% assumes almost every attendee is a genuinely new visitor — stress-test this against a more conservative rate, since overstating it inflates every downstream economic-impact number.",
    });
  }
  if (inputs.uniquenessScore < 50) {
    riskFlags.push({
      label: "Low differentiation / substitution risk",
      severity: "medium" as const,
      note: "A low uniqueness score suggests attendees could substitute this for another local draw — which undercuts the incrementality assumption the whole economic-impact case rests on.",
    });
  }

  return {
    moduleName: "Event — Economic-Impact (I-O Multiplier) Model",
    methodologyRefs: [
      "UN Tourism (UNWTO). Tourism Satellite Account: Recommended Methodological Framework (TSA:RMF 2008).",
      "Crompton, J. (2006). Economic Impact Studies: Instruments for Political Shenanigans? (incrementality/displacement guardrails)",
    ],
    formulaSteps,
    finance: { capex, annualRevenue, annualOpex },
    pillarSubMetrics: {
      demand: [{ label: "Incremental attendee demand vs. venue capacity", score: demandScore }],
      economics: [{ label: "Public benefit-cost ratio", score: economicsScore }],
      competition: [{ label: "Uniqueness / brand differentiation", score: competitionScore }],
      risk: [{ label: "Accommodation-strain headroom", score: riskScore }],
    },
    headline: {
      incrementalAttendees: Math.round(incrementalAttendees),
      directSpend: Math.round(directSpend),
      totalEconomicImpact: Math.round(totalEconomicImpact),
      directImpact: Math.round(directImpact),
      indirectImpact: Math.round(indirectImpact),
      inducedImpact: Math.round(inducedImpact),
      jobsSupported: Math.round(jobsSupported),
      roomNights: Math.round(roomNights),
      roomSupplyPressurePercent: Math.round(roomSupplyPressure * 1000) / 10,
      publicBcr: Math.round(publicBcr * 100) / 100,
      netPublicBenefit: Math.round(netPublicBenefit),
      mediaValueUsd: Math.round(inputs.mediaValueUsd),
    },
    riskFlags,
    hardGateBreached: roomSupplyPressure > 1.5,
    hardGateReason:
      roomSupplyPressure > 1.5
        ? "Peak-night room demand exceeds tracked hotel supply by more than 50% — accommodation capacity is a hard constraint on this event as scoped."
        : undefined,
  };
}
