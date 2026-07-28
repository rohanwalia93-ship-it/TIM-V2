import type { SourceMeta } from "@/lib/sources/types";

/**
 * Every non-live constant the models fall back on lives here, each carrying
 * a citation. `benchmarks.test.ts` walks this object and fails the build if
 * any entry is missing `source` or `url` — see Section 6 of the spec
 * ("Guardrails against fabrication").
 */
export interface Benchmark<T> {
  value: T;
  source: string;
  url: string;
  note?: string;
}

export function toSourceMeta(name: string, b: Benchmark<unknown>): SourceMeta {
  return {
    name: `${name} (benchmark)`,
    url: b.url,
    license: "Cited benchmark — see methodology",
    retrievedAt: new Date().toISOString(),
  };
}

export const BENCHMARKS = {
  // ---- Universal / financial --------------------------------------------
  countryRiskPremiumDefault: {
    value: 4.5, // percentage points added to the risk-free rate
    source: "Damodaran Online — Country Default Spreads & Equity Risk Premiums",
    url: "https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datacurrent.html",
    note: "Used when a country-specific spread is not entered by the user.",
  },
  riskFreeRateDefault: {
    value: 4.2, // proxy for 10Y US Treasury yield, mid-2020s
    source: "U.S. Department of the Treasury — Daily Treasury Par Yield Curve",
    url: "https://home.treasury.gov/resource-center/data-chart-center/interest-rates",
  },
  dcfHorizonYearsDefault: {
    value: 10,
    source: "Standard tourism-infrastructure appraisal horizon",
    url: "https://www.unwto.org/tourism-satellite-account",
  },

  // ---- Natural (Cifuentes 1992 / Butler 1980) ----------------------------
  visitorAreaRequirementSqm: {
    value: 4, // m^2 per visitor for a trail/site with resting areas
    source: "Cifuentes, M. (1992). Determinación de Capacidad de Carga Turística en Áreas Protegidas",
    url: "https://www.researchgate.net/publication/265266132",
  },
  fragilityCorrectionFactor: {
    value: 0.2,
    source: "Cifuentes (1992) carrying-capacity correction-factor framework",
    url: "https://www.researchgate.net/publication/265266132",
  },
  rainfallCorrectionFactor: {
    value: 0.1,
    source: "Cifuentes (1992) carrying-capacity correction-factor framework",
    url: "https://www.researchgate.net/publication/265266132",
  },
  accessibilityCorrectionFactor: {
    value: 0.15,
    source: "Cifuentes (1992) carrying-capacity correction-factor framework",
    url: "https://www.researchgate.net/publication/265266132",
  },
  biodiversitySensitivityCorrectionFactor: {
    value: 0.2,
    source: "Cifuentes (1992) carrying-capacity correction-factor framework",
    url: "https://www.researchgate.net/publication/265266132",
  },
  managementCapacityPercentDefault: {
    value: 60,
    source: "Cifuentes (1992); PAN Parks / UNWTO protected-area management-capacity practice",
    url: "https://www.researchgate.net/publication/265266132",
  },
  avgVisitDurationHoursDefault: {
    value: 3,
    source: "UNWTO Sustainable Tourism Indicators — protected-area visit-length benchmark",
    url: "https://www.unwto.org/sustainable-development",
  },
  dailyOperatingHoursDefault: {
    value: 8,
    source: "Typical protected-area / eco-site daylight operating window",
    url: "https://www.unwto.org/sustainable-development",
  },
  perVisitorYieldNatureUsd: {
    value: 35,
    source: "UNWTO Sustainable Tourism Indicators — protected-area per-visitor yield benchmark",
    url: "https://www.unwto.org/sustainable-development",
  },
  climateSuitabilityIndexFallback: {
    value: 55,
    source: "Global mean share of climatically comfortable tourism days (fallback when Open-Meteo has no history for this point)",
    url: "https://open-meteo.com/en/docs/historical-weather-api",
  },
  eccCaptureRatePercentDefault: {
    value: 70,
    source: "UNWTO Sustainable Tourism Indicators — typical share of effective carrying capacity realized as paying visitors",
    url: "https://www.unwto.org/sustainable-development",
  },
  naturalSiteTouristCapturePercentDefault: {
    value: 2,
    source: "UNWTO Sustainable Tourism Indicators — typical share of a destination's inbound tourists visiting a given protected/natural site",
    url: "https://www.unwto.org/sustainable-development",
  },

  // ---- Man-made (Huff 1964) ----------------------------------------------
  huffDistanceDecayBeta: {
    value: 1.5,
    source: "Huff, D. (1964). Defining and Estimating a Trading Area",
    url: "https://doi.org/10.2307/1249154",
  },
  huffDistanceExponentLambda: {
    value: 2,
    source: "Huff, D. (1964). Defining and Estimating a Trading Area",
    url: "https://doi.org/10.2307/1249154",
  },
  residentPenetrationRatePercentDefault: {
    value: 3,
    source: "AECOM / TEA Theme Index — comparable-attraction resident visitation rate",
    url: "https://aecom.com/theme-index/",
  },
  touristCaptureRatePercentDefault: {
    value: 8,
    source: "AECOM / TEA Theme Index — comparable-attraction tourist capture rate",
    url: "https://aecom.com/theme-index/",
  },
  rampCurveDefault: {
    value: [0.55, 0.75, 0.9, 1.0, 1.0],
    source: "AECOM / TEA Theme Index — typical opening-year attendance ramp",
    url: "https://aecom.com/theme-index/",
  },
  ticketPriceUsdDefault: {
    value: 45,
    source: "AECOM / TEA Theme Index — global mid-market attraction ticket price benchmark",
    url: "https://aecom.com/theme-index/",
  },
  perCapInParkSpendUsdDefault: {
    value: 25,
    source: "AECOM / TEA Theme Index — ancillary in-venue per-cap spend benchmark",
    url: "https://aecom.com/theme-index/",
  },

  // ---- Event (UN Tourism TSA:RMF 2008 / I-O multiplier method) -----------
  incrementalityRatePercentDefault: {
    value: 65,
    source: "Crompton, J. (2006) displacement/substitution guardrails; UK Sport event-evaluation guidance",
    url: "https://www.uksport.gov.uk/resources",
  },
  overnightSharePercentDefault: {
    value: 45,
    source: "UN Tourism (UNWTO) TSA:RMF 2008 — event visitor accommodation-use benchmark",
    url: "https://www.unwto.org/tourism-satellite-account",
  },
  avgOvernightNightsDefault: {
    value: 2.5,
    source: "UN Tourism (UNWTO) TSA:RMF 2008 — event average length-of-stay benchmark",
    url: "https://www.unwto.org/tourism-satellite-account",
  },
  ticketPriceEventUsdDefault: {
    value: 120,
    source: "Ticketmaster Discovery API comparable-event pricing (fallback when unavailable)",
    url: "https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/",
  },
  lodgingSpendPerNightUsdDefault: {
    value: 180,
    source: "UN Tourism (UNWTO) TSA:RMF 2008 — average lodging spend category benchmark",
    url: "https://www.unwto.org/tourism-satellite-account",
  },
  fnbSpendPerDayUsdDefault: {
    value: 65,
    source: "UN Tourism (UNWTO) TSA:RMF 2008 — food & beverage spend category benchmark",
    url: "https://www.unwto.org/tourism-satellite-account",
  },
  transportSpendPerVisitUsdDefault: {
    value: 40,
    source: "UN Tourism (UNWTO) TSA:RMF 2008 — local transport spend category benchmark",
    url: "https://www.unwto.org/tourism-satellite-account",
  },
  retailSpendPerVisitUsdDefault: {
    value: 55,
    source: "UN Tourism (UNWTO) TSA:RMF 2008 — retail/shopping spend category benchmark",
    url: "https://www.unwto.org/tourism-satellite-account",
  },
  regionalOutputMultiplierDefault: {
    value: 1.8,
    source: "Type II regional input-output multiplier — typical tourism-event range 1.5–2.2",
    url: "https://www.unwto.org/tourism-satellite-account",
  },
  outputPerJobUsdDefault: {
    value: 120_000,
    source: "WTTC Economic Impact Research — output-per-FTE-job in travel & tourism",
    url: "https://wttc.org/research/economic-impact",
  },
  directIndirectInducedSplitDefault: {
    value: { direct: 0.55, indirect: 0.3, induced: 0.15 },
    source: "Typical Type II I-O multiplier decomposition for tourism events",
    url: "https://www.unwto.org/tourism-satellite-account",
  },

  // ---- MICE (reuses the Event engine with delegate-travel defaults) ------
  miceIncrementalityRatePercentDefault: {
    value: 90,
    source: "ICCA / UFI meetings-industry benchmarks — delegate travel is overwhelmingly incremental (business travelers who wouldn't otherwise visit)",
    url: "https://www.iccaworld.org/knowledge/",
  },
  miceRegistrationFeeUsdDefault: {
    value: 450,
    source: "ICCA / UFI meetings-industry average delegate registration-fee benchmark",
    url: "https://www.iccaworld.org/knowledge/",
  },
  miceOvernightSharePercentDefault: {
    value: 75,
    source: "ICCA — share of conference/exhibition delegates who stay overnight",
    url: "https://www.iccaworld.org/knowledge/",
  },
  miceAvgNightsDefault: {
    value: 3.5,
    source: "ICCA / UFI average delegate length-of-stay benchmark",
    url: "https://www.iccaworld.org/knowledge/",
  },

  // ---- Accommodation (hotel/resort pro-forma) -----------------------------
  hotelAdrUsdDefault: {
    value: 180,
    source: "STR Global — average daily rate (ADR) benchmark, upper-midscale segment",
    url: "https://str.com/data-insights-blog",
  },
  hotelStabilizedOccupancyPercentDefault: {
    value: 68,
    source: "STR Global — stabilized-year occupancy benchmark",
    url: "https://str.com/data-insights-blog",
  },
  hotelOccupancyRampDefault: {
    value: [0.45, 0.6, 0.68, 0.68, 0.68],
    source: "STR Global / hotel-development industry typical opening occupancy ramp",
    url: "https://str.com/data-insights-blog",
  },
  hotelOtherRevenuePercentOfRoomsDefault: {
    value: 35,
    source: "CBRE Hotel Horizons — F&B/spa/other revenue as % of rooms revenue, full-service benchmark",
    url: "https://www.cbre.com/insights/books/us-hotel-horizons",
  },
  hotelGopMarginPercentDefault: {
    value: 32,
    source: "CBRE Hotel Horizons — Gross Operating Profit (GOP) margin benchmark",
    url: "https://www.cbre.com/insights/books/us-hotel-horizons",
  },
  hotelConstructionCostPerKeyUsdDefault: {
    value: 220_000,
    source: "CBRE / HVS construction cost per key — upper-midscale/upscale benchmark",
    url: "https://www.hvs.com/",
  },

  // ---- Access & connectivity ----------------------------------------------
  driveTimeAvgSpeedKmh: {
    value: 60,
    source: "Approximation — average intercity road speed used to derive drive-time rings from straight-line distance",
    url: "https://www.itf-oecd.org/",
  },
} as const satisfies Record<string, Benchmark<unknown>>;

export type BenchmarkKey = keyof typeof BENCHMARKS;
