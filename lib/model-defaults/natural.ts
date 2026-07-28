import type { ResolvedValue } from "@/lib/sources/types";
import type { CityContextData } from "@/lib/store/scenarioStore";
import { BENCHMARKS } from "@/lib/benchmarks";
import { fieldFromBenchmark, fieldAsAssumption } from "@/lib/model-defaults/shared";
import { resolveInput } from "@/lib/resolveInput";
import type { NaturalModelInputs } from "@/lib/scoring/natural";

export function buildNaturalDefaults(ctx: CityContextData): Record<keyof NaturalModelInputs, ResolvedValue<number>> {
  const climateIdx = ctx.climate?.climateSuitabilityIndex;
  const arrivals = ctx.worldBank?.touristArrivals?.latest?.value;

  return {
    siteAreaSqm: ctx.siteArea
      ? resolveInput({
          key: "model.siteAreaSqm",
          label: "Usable site area",
          unit: "m²",
          live: { value: ctx.siteArea.areaSqm, source: ctx.siteArea.source },
          benchmark: { value: ctx.siteArea.areaSqm, source: ctx.siteArea.source },
        })
      : fieldAsAssumption(
          "model.siteAreaSqm",
          "Usable site area",
          500_000,
          "m²",
          "No tagged protected/natural-area polygon found nearby on OpenStreetMap — enter your site's actual usable area.",
        ),
    visitorAreaSqm: fieldFromBenchmark("model.visitorAreaSqm", "Area required per visitor (Cifuentes V/a)", "Cifuentes (1992)", BENCHMARKS.visitorAreaRequirementSqm, "m²/visitor"),
    dailyOperatingHours: fieldFromBenchmark("model.dailyOperatingHours", "Daily operating hours", "Protected-area operating window", BENCHMARKS.dailyOperatingHoursDefault, "hrs"),
    avgVisitDurationHours: fieldFromBenchmark("model.avgVisitDurationHours", "Average visit duration", "UNWTO benchmark", BENCHMARKS.avgVisitDurationHoursDefault, "hrs"),
    climateSuitabilityIndex: climateIdx !== undefined
      ? fieldFromBenchmark("model.climateSuitabilityIndex", "Climate Suitability Index", "Open-Meteo", BENCHMARKS.climateSuitabilityIndexFallback, "/100", {
          value: climateIdx,
          source: ctx.climate!.source,
        })
      : fieldFromBenchmark("model.climateSuitabilityIndex", "Climate Suitability Index", "Global fallback", BENCHMARKS.climateSuitabilityIndexFallback, "/100"),
    fragilityCf: fieldFromBenchmark("model.fragilityCf", "Fragility correction factor", "Cifuentes (1992)", BENCHMARKS.fragilityCorrectionFactor),
    rainfallCf: fieldFromBenchmark("model.rainfallCf", "Rainfall correction factor", "Cifuentes (1992)", BENCHMARKS.rainfallCorrectionFactor),
    accessibilityCf: fieldFromBenchmark("model.accessibilityCf", "Accessibility correction factor", "Cifuentes (1992)", BENCHMARKS.accessibilityCorrectionFactor),
    biodiversityCf: fieldFromBenchmark("model.biodiversityCf", "Biodiversity sensitivity factor", "Cifuentes (1992)", BENCHMARKS.biodiversitySensitivityCorrectionFactor),
    managementCapacityPercent: fieldFromBenchmark("model.managementCapacityPercent", "Management capacity", "Cifuentes (1992) / PAN Parks", BENCHMARKS.managementCapacityPercentDefault, "%"),
    captureRatePercent: fieldFromBenchmark("model.captureRatePercent", "Visitor capture rate (of ECC)", "UNWTO benchmark", BENCHMARKS.eccCaptureRatePercentDefault, "%"),
    perVisitorYieldUsd: fieldFromBenchmark("model.perVisitorYieldUsd", "Per-visitor yield", "UNWTO benchmark", BENCHMARKS.perVisitorYieldNatureUsd, "USD"),
    capex: fieldAsAssumption("model.capex", "CAPEX", 15_000_000, "USD", "Project-specific — enter your capital expenditure estimate."),
    annualOpex: fieldAsAssumption("model.annualOpex", "Annual OPEX", 2_500_000, "USD", "Project-specific — enter your annual operating cost estimate."),
    horizonYears: fieldFromBenchmark("model.horizonYears", "Appraisal horizon", "Standard appraisal horizon", BENCHMARKS.dcfHorizonYearsDefault, "yrs"),
    projectedAnnualVisitors: arrivals
      ? fieldFromBenchmark(
          "model.projectedAnnualVisitors",
          "Projected annual visitors",
          "UNWTO benchmark applied to World Bank arrivals",
          BENCHMARKS.naturalSiteTouristCapturePercentDefault,
          "visitors/yr",
          { value: Math.round(arrivals * (BENCHMARKS.naturalSiteTouristCapturePercentDefault.value / 100)), source: ctx.worldBank!.touristArrivals!.source },
        )
      : fieldAsAssumption("model.projectedAnnualVisitors", "Projected annual visitors", 50_000, "visitors/yr", "No inbound-arrivals data available — enter a demand estimate manually."),
  };
}
