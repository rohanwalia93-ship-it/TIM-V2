import type { ArchetypeResult, FormulaStep } from "@/lib/scoring/types";
import { normalize, normalizeInverse } from "@/lib/scoring/viabilityIndex";

export interface AccommodationModelInputs {
  numberOfRooms: number;
  adrUsd: number; // average daily rate
  stabilizedOccupancyPercent: number; // 0-100
  occupancyRamp: number[]; // fraction of stabilized occupancy reached each year, e.g. [0.45, 0.6, 0.68, 0.68, 0.68]
  otherRevenuePercentOfRooms: number; // F&B/spa/other revenue as % of room revenue
  gopMarginPercent: number; // Gross Operating Profit margin, 0-100
  constructionCostPerKeyUsd: number;
  competitorHotelRooms: number; // nearby existing supply, for oversupply risk
  horizonYears: number;
}

export function runAccommodationModel(inputs: AccommodationModelInputs): ArchetypeResult {
  const stabilizedOccupancy = inputs.stabilizedOccupancyPercent / 100;
  const horizon = inputs.horizonYears;

  const occupancyByYear = Array.from({ length: horizon }, (_, i) => {
    const rampFactor = inputs.occupancyRamp[i] ?? inputs.occupancyRamp[inputs.occupancyRamp.length - 1] ?? 1;
    return stabilizedOccupancy * rampFactor;
  });

  const revparByYear = occupancyByYear.map((occ) => inputs.adrUsd * occ);
  const roomRevenueByYear = revparByYear.map((revpar) => revpar * 365 * inputs.numberOfRooms);
  const totalRevenueByYear = roomRevenueByYear.map((r) => r * (1 + inputs.otherRevenuePercentOfRooms / 100));
  const gopByYear = totalRevenueByYear.map((r) => r * (inputs.gopMarginPercent / 100));
  const opexByYear = totalRevenueByYear.map((r, i) => r - gopByYear[i]);

  const capex = inputs.constructionCostPerKeyUsd * inputs.numberOfRooms;
  const stabilizedIndex = horizon - 1;
  const stabilizedRevpar = revparByYear[stabilizedIndex];
  const stabilizedTotalRevenue = totalRevenueByYear[stabilizedIndex];
  const stabilizedGop = gopByYear[stabilizedIndex];

  const marketRoomSharePercent =
    (inputs.numberOfRooms / Math.max(1, inputs.numberOfRooms + inputs.competitorHotelRooms)) * 100;

  const formulaSteps: FormulaStep[] = [
    {
      label: "Revenue per available room (RevPAR)",
      formula: "RevPAR = ADR × Occupancy %",
      inputs: {
        "ADR": { value: inputs.adrUsd, unit: "USD" },
        "Stabilized occupancy": { value: inputs.stabilizedOccupancyPercent, unit: "%" },
      },
      result: stabilizedRevpar,
      unit: "USD",
      explanation: "The standard hotel-industry yield metric — revenue generated per available room per night, at stabilized occupancy.",
    },
    {
      label: "Room revenue",
      formula: "Room revenue = RevPAR × 365 × Rooms",
      inputs: {
        "RevPAR": { value: stabilizedRevpar, unit: "USD" },
        "Rooms": { value: inputs.numberOfRooms },
      },
      result: roomRevenueByYear[stabilizedIndex],
      unit: "USD/yr",
      explanation: "Annual room revenue at stabilized occupancy.",
    },
    {
      label: "Total revenue",
      formula: "Total revenue = Room revenue × (1 + Other-revenue %)",
      inputs: {
        "Other revenue (F&B/spa/etc.)": { value: inputs.otherRevenuePercentOfRooms, unit: "% of rooms" },
      },
      result: stabilizedTotalRevenue,
      unit: "USD/yr",
      explanation: "Full-service hotels earn meaningfully beyond room revenue — F&B, spa, and event space add materially to the top line.",
    },
    {
      label: "Gross Operating Profit (GOP)",
      formula: "GOP = Total revenue × GOP margin %",
      inputs: { "GOP margin": { value: inputs.gopMarginPercent, unit: "%" } },
      result: stabilizedGop,
      unit: "USD/yr",
      explanation: "The hotel-industry standard profitability measure, after departmental and undistributed operating expenses.",
    },
    {
      label: "Construction cost (CAPEX)",
      formula: "CAPEX = Cost per key × Rooms",
      inputs: {
        "Cost per key": { value: inputs.constructionCostPerKeyUsd, unit: "USD" },
        "Rooms": { value: inputs.numberOfRooms },
      },
      result: capex,
      unit: "USD",
      explanation: "Total development cost feeding the DCF as the upfront investment.",
    },
  ];

  const demandScore = normalize(inputs.stabilizedOccupancyPercent, 40, 85);
  const economicsScore = normalize(inputs.gopMarginPercent, 15, 45);
  const competitionScore = normalize(marketRoomSharePercent, 0, 30);
  const oversupplyRatio = inputs.competitorHotelRooms / Math.max(1, inputs.numberOfRooms);
  const riskScore = normalizeInverse(oversupplyRatio, 0, 25);

  const riskFlags: ArchetypeResult["riskFlags"] = [];
  if (oversupplyRatio > 15) {
    riskFlags.push({
      label: "Crowded lodging market",
      severity: oversupplyRatio > 25 ? "high" : "medium",
      note: `Existing tracked hotel supply (${Math.round(inputs.competitorHotelRooms).toLocaleString()} rooms) dwarfs this project (${inputs.numberOfRooms.toLocaleString()} rooms) — verify demand can support the assumed occupancy against that much standing competition.`,
    });
  }
  if (inputs.gopMarginPercent < 25) {
    riskFlags.push({
      label: "Thin operating margin",
      severity: "medium",
      note: "A GOP margin below ~25% leaves little cushion for rate softness or cost inflation — stress-test the DCF against a lower margin.",
    });
  }
  if (inputs.stabilizedOccupancyPercent < 55) {
    riskFlags.push({
      label: "Weak demand base",
      severity: "medium",
      note: "Stabilized occupancy below ~55% is below most lenders' comfort threshold for hotel debt financing.",
    });
  }

  return {
    moduleName: "Accommodation — Hotel/Resort Pro-Forma Model",
    methodologyRefs: [
      "STR Global — hotel performance benchmarking (ADR, occupancy, RevPAR).",
      "CBRE Hotel Horizons — GOP margin and other-revenue benchmarks.",
    ],
    formulaSteps,
    finance: { capex, annualRevenue: totalRevenueByYear, annualOpex: opexByYear },
    pillarSubMetrics: {
      demand: [{ label: "Stabilized occupancy vs. market benchmark", score: demandScore }],
      economics: [{ label: "GOP margin vs. benchmark", score: economicsScore }],
      competition: [{ label: "Room-supply market share", score: competitionScore }],
      risk: [{ label: "Oversupply headroom", score: riskScore }],
    },
    headline: {
      stabilizedRevpar: Math.round(stabilizedRevpar),
      stabilizedRoomRevenue: Math.round(roomRevenueByYear[stabilizedIndex]),
      stabilizedTotalRevenue: Math.round(stabilizedTotalRevenue),
      stabilizedGop: Math.round(stabilizedGop),
      capex: Math.round(capex),
      marketRoomSharePercent: Math.round(marketRoomSharePercent * 10) / 10,
    },
    riskFlags,
    hardGateBreached: oversupplyRatio > 40,
    hardGateReason:
      oversupplyRatio > 40
        ? "Existing hotel supply exceeds this project by more than 40x — the local market is almost certainly saturated at the assumed rate/occupancy."
        : undefined,
  };
}
