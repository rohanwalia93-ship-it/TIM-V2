export interface DcfInputs {
  capex: number;
  /** Length must equal horizonYears; year 1 first. */
  annualRevenue: number[];
  annualOpex: number[];
  discountRate: number; // decimal, e.g. 0.09
  horizonYears: number;
}

export interface CashFlowYear {
  year: number;
  revenue: number;
  opex: number;
  netCashFlow: number;
  discountFactor: number;
  discountedNetCashFlow: number;
  cumulativeDiscounted: number;
}

export interface DcfResult {
  npv: number;
  irr: number | null;
  paybackYears: number | null;
  bcr: number;
  cashFlows: CashFlowYear[];
  totalRevenuePv: number;
  totalCostsPv: number;
}

function npvAtRate(inputs: DcfInputs, rate: number): number {
  let npv = -inputs.capex;
  for (let t = 1; t <= inputs.horizonYears; t++) {
    const net = (inputs.annualRevenue[t - 1] ?? 0) - (inputs.annualOpex[t - 1] ?? 0);
    npv += net / Math.pow(1 + rate, t);
  }
  return npv;
}

/** Bisection solve — robust for the non-monotonic edge cases a Newton solve can diverge on. */
export function solveIrr(inputs: DcfInputs): number | null {
  let lo = -0.99;
  let hi = 5; // 500%, generously wide bound
  let fLo = npvAtRate(inputs, lo);
  const fHi = npvAtRate(inputs, hi);
  if (Number.isNaN(fLo) || Number.isNaN(fHi)) return null;
  if (fLo * fHi > 0) return null; // no sign change in range => no real IRR found

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npvAtRate(inputs, mid);
    if (Math.abs(fMid) < 1e-6) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

export function runDcf(inputs: DcfInputs): DcfResult {
  const cashFlows: CashFlowYear[] = [];
  let cumulativeDiscounted = -inputs.capex;
  let totalRevenuePv = 0;
  let totalOpexPv = 0;

  for (let t = 1; t <= inputs.horizonYears; t++) {
    const revenue = inputs.annualRevenue[t - 1] ?? 0;
    const opex = inputs.annualOpex[t - 1] ?? 0;
    const netCashFlow = revenue - opex;
    const discountFactor = 1 / Math.pow(1 + inputs.discountRate, t);
    const discountedNetCashFlow = netCashFlow * discountFactor;
    cumulativeDiscounted += discountedNetCashFlow;
    totalRevenuePv += revenue * discountFactor;
    totalOpexPv += opex * discountFactor;
    cashFlows.push({ year: t, revenue, opex, netCashFlow, discountFactor, discountedNetCashFlow, cumulativeDiscounted });
  }

  const npv = cumulativeDiscounted;
  const irr = solveIrr(inputs);
  const totalCostsPv = inputs.capex + totalOpexPv;
  const bcr = totalCostsPv > 0 ? totalRevenuePv / totalCostsPv : 0;

  let paybackYears: number | null = null;
  for (let i = 0; i < cashFlows.length; i++) {
    if (cashFlows[i].cumulativeDiscounted >= 0) {
      const prevCumulative = i === 0 ? -inputs.capex : cashFlows[i - 1].cumulativeDiscounted;
      const delta = cashFlows[i].discountedNetCashFlow;
      const fraction = delta !== 0 ? -prevCumulative / delta : 0;
      paybackYears = i + Math.max(0, Math.min(1, fraction));
      break;
    }
  }

  return { npv, irr, paybackYears, bcr, cashFlows, totalRevenuePv, totalCostsPv };
}

export function buildRampedSeries(peakValue: number, ramp: number[], horizonYears: number): number[] {
  const series: number[] = [];
  for (let t = 0; t < horizonYears; t++) {
    const factor = ramp[t] ?? ramp[ramp.length - 1] ?? 1;
    series.push(peakValue * factor);
  }
  return series;
}

export function flatSeries(value: number, horizonYears: number): number[] {
  return Array.from({ length: horizonYears }, () => value);
}
