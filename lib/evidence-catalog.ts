import type { EvidenceCategory } from "@/lib/generated/prisma/client";

export interface CatalogMetric {
  key: string;
  label: string;
  description: string;
  required: boolean;
}

export const EVIDENCE_CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  DEMAND: "Demand",
  SUPPLY_COMPETITION: "Supply & competition",
  ACCESSIBILITY: "Accessibility",
  ACCOMMODATION_CAPACITY: "Accommodation capacity",
  PRICING_WTP: "Pricing & willingness to pay",
  OPERATING_MODEL: "Operating model",
  CAPITAL_OPERATING_COSTS: "Capital & operating costs",
  MACROECONOMICS: "Macroeconomics",
  SUSTAINABILITY_CARRYING_CAPACITY: "Sustainability & carrying capacity",
  ECONOMIC_IMPACT: "Economic impact",
  REGULATORY_DELIVERY_READINESS: "Regulatory & delivery readiness",
};

export const EVIDENCE_CATEGORY_ORDER: EvidenceCategory[] = [
  "DEMAND",
  "SUPPLY_COMPETITION",
  "ACCESSIBILITY",
  "ACCOMMODATION_CAPACITY",
  "PRICING_WTP",
  "OPERATING_MODEL",
  "CAPITAL_OPERATING_COSTS",
  "MACROECONOMICS",
  "SUSTAINABILITY_CARRYING_CAPACITY",
  "ECONOMIC_IMPACT",
  "REGULATORY_DELIVERY_READINESS",
];

/**
 * Generic evidence catalog (brief §1 Stage 2) — the metrics required before a demand model
 * can run, independent of product class. Phase 6 (demand/finance engines) will extend this
 * per product class; until then this is deliberately a shared, broad-strokes catalog rather
 * than a false claim of per-archetype precision.
 */
export const EVIDENCE_CATALOG: Record<EvidenceCategory, CatalogMetric[]> = {
  DEMAND: [
    { key: "historical_visitor_arrivals", label: "Historical visitor arrivals (destination)", description: "Arrivals by source market and purpose, at the right geographic level (city, not country).", required: true },
    { key: "comparable_attendance", label: "Comparable product attendance / occupancy", description: "Evidenced comparable attendance, market size, price, and maturity — not an unadjusted score.", required: true },
  ],
  SUPPLY_COMPETITION: [
    { key: "competitor_supply", label: "Competitor supply count / capacity", description: "Named comparators with capacity, not just a point count.", required: true },
    { key: "comparable_pricing", label: "Comparable product pricing", description: "Ticket price / ADR / fee benchmarks from named comparators.", required: true },
  ],
  ACCESSIBILITY: [
    { key: "air_seat_capacity", label: "Air seat capacity to destination", description: "Scheduled seat capacity from an authorised source — not airport/runway count as a proxy.", required: true },
    { key: "catchment_population", label: "Drive-time / catchment population", description: "A real drive-time or transit isochron, not straight-line distance.", required: true },
  ],
  ACCOMMODATION_CAPACITY: [
    { key: "hotel_room_inventory", label: "Hotel room inventory (destination)", description: "Audited room inventory, not an OSM point-count proxy.", required: true },
    { key: "occupancy_adr_revpar", label: "Occupancy / ADR / RevPAR", description: "Destination or comparable-market hotel performance benchmarks.", required: true },
  ],
  PRICING_WTP: [
    { key: "wtp_benchmark", label: "Willingness-to-pay / price benchmark", description: "Evidence for the assumed price point, not just the assumption itself.", required: true },
    { key: "planned_price_point", label: "Planned price point", description: "The price/fee this product intends to charge.", required: true },
  ],
  OPERATING_MODEL: [
    { key: "delivery_operating_model", label: "Delivery / operating model definition", description: "Who operates it and under what contractual structure.", required: true },
    { key: "staffing_plan", label: "Staffing plan", description: "Headcount and operating-hours assumptions.", required: false },
  ],
  CAPITAL_OPERATING_COSTS: [
    { key: "capex_estimate", label: "CAPEX estimate", description: "Development CAPEX, lifecycle CAPEX, pre-opening costs, working capital, contingency.", required: true },
    { key: "opex_estimate", label: "Annual OPEX estimate", description: "Payroll and other operating costs.", required: true },
  ],
  MACROECONOMICS: [
    { key: "gdp_tourism_growth", label: "GDP / tourism-sector growth", description: "National or regional context — not a substitute for city-level demand.", required: true },
    { key: "fx_inflation_basis", label: "Exchange rate / inflation basis", description: "The price basis (nominal/real) and FX conversion path used throughout.", required: true },
  ],
  SUSTAINABILITY_CARRYING_CAPACITY: [
    { key: "carrying_capacity_threshold", label: "Carrying capacity / ecological threshold", description: "Physical, real, and effective carrying capacity for natural/heritage products.", required: false },
    { key: "climate_operating_window", label: "Climate / seasonality operating window", description: "Comfortable-day count or equivalent operating-window evidence.", required: true },
  ],
  ECONOMIC_IMPACT: [
    { key: "regional_output_multiplier", label: "Regional output multiplier (attributed)", description: "A multiplier with geography, industry, year, and price basis — not a bare number.", required: true },
    { key: "incrementality_assumption", label: "Incrementality / displacement assumption", description: "Locals/time-switchers/displacement excluded so only genuinely new spend counts.", required: true },
  ],
  REGULATORY_DELIVERY_READINESS: [
    { key: "permitting_status", label: "Permitting / regulatory pathway status", description: "Named barriers and their credible resolution path, if any.", required: true },
    { key: "site_readiness", label: "Site / land / utilities readiness", description: "Land, utilities, procurement, operator, and partner readiness.", required: true },
  ],
};

export function totalRequiredMetrics(): number {
  return Object.values(EVIDENCE_CATALOG).flat().filter((m) => m.required).length;
}
