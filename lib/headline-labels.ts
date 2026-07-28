/** Human-readable labels for the ArchetypeResult.headline keys — avoids dumping raw camelCase/acronym keys in the UI. */
export const HEADLINE_LABELS: Record<string, string> = {
  // Natural (Cifuentes)
  pcc: "Physical capacity (visitors/day)",
  rcc: "Real capacity (visitors/day)",
  ecc: "Effective capacity (visitors/day)",
  operatingDaysPerYear: "Operating days per year",
  sustainableAnnualVisitorCeiling: "Sustainable visitor ceiling (per year)",
  sustainableRevenueCeiling: "Sustainable revenue ceiling",
  talcStage: "Growth stage",
  utilizationRatioPercent: "Demand vs. sustainable capacity",

  // Man-made (Huff)
  residentAttendance: "Local attendance (per year)",
  touristAttendance: "Tourist attendance (per year)",
  huffSharePercent: "Competitive market share",
  peakAnnualAttendance: "Peak annual attendance",
  peakDailyAttendance: "Peak daily attendance",
  capacityUtilizationPercent: "Capacity utilization",

  // Event / MICE
  incrementalAttendees: "Net-new attendees",
  directSpend: "Direct visitor spend",
  totalEconomicImpact: "Total economic impact",
  directImpact: "Direct impact",
  indirectImpact: "Indirect impact",
  inducedImpact: "Induced impact",
  jobsSupported: "Jobs supported",
  roomNights: "Hotel room-nights",
  roomSupplyPressurePercent: "Hotel demand vs. supply",
  publicBcr: "Public benefit-cost ratio",
  netPublicBenefit: "Net public benefit",
  mediaValueUsd: "Estimated media value",

  // Accommodation
  stabilizedRevpar: "Revenue per available room",
  stabilizedRoomRevenue: "Room revenue (per year)",
  stabilizedTotalRevenue: "Total revenue (per year)",
  stabilizedGop: "Operating profit (per year)",
  capex: "Construction cost",
  marketRoomSharePercent: "Room market share",
};

export function headlineLabel(key: string): string {
  return HEADLINE_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}
