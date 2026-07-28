"use client";

import { Bar, ComposedChart, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { formatCompact } from "@/lib/utils";
import type { CashFlowYear } from "@/lib/finance/dcf";

export function CashflowChart({ cashFlows }: { cashFlows: CashFlowYear[] }) {
  const data = cashFlows.map((cf) => ({
    year: `Y${cf.year}`,
    net: Math.round(cf.discountedNetCashFlow),
    cumulative: Math.round(cf.cumulativeDiscounted),
  }));

  const finalCumulative = data[data.length - 1]?.cumulative ?? 0;
  return (
    <div
      role="img"
      aria-label={`Discounted cash flow chart across ${data.length} years, ending at a cumulative discounted value of ${formatCompact(finalCumulative)}`}
    >
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
          <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" width={48} />
          <ReferenceLine y={0} stroke="var(--color-border)" />
          <Tooltip
            contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
            formatter={(value, name) => [formatCompact(Number(value)), name === "net" ? "Discounted net cash flow" : "Cumulative (payback)"]}
          />
          <Bar dataKey="net" fill="var(--color-accent)" radius={[3, 3, 0, 0]} opacity={0.5} />
          <Line type="monotone" dataKey="cumulative" stroke="var(--color-go)" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
