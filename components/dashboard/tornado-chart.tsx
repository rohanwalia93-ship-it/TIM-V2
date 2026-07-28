"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompact } from "@/lib/utils";

export interface TornadoDatum {
  label: string;
  low: number;
  high: number;
}

export function TornadoChart({ data, baseline }: { data: TornadoDatum[]; baseline: number }) {
  const sorted = [...data].sort((a, b) => Math.abs(b.high - b.low) - Math.abs(a.high - a.low));
  const chartData = sorted.map((d) => ({
    label: d.label,
    offset: Math.min(d.low, d.high),
    range: Math.abs(d.high - d.low),
    low: d.low,
    high: d.high,
  }));

  const summary = chartData.map((d) => `${d.label}: ${formatCompact(d.low)} to ${formatCompact(d.high)}`).join("; ");
  return (
    <div role="img" aria-label={`Tornado sensitivity chart, ranked by NPV impact. ${summary}`}>
      <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 48)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
          <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={160} stroke="var(--color-muted-foreground)" />
          <Tooltip
            contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
            formatter={(_value, _name, item) => {
              const p = item?.payload as { low: number; high: number } | undefined;
              return [p ? `${formatCompact(p.low)} → ${formatCompact(p.high)}` : "", "NPV range (±20% driver)"];
            }}
          />
          <Bar dataKey="offset" stackId="tornado" fill="transparent" />
          <Bar dataKey="range" stackId="tornado" fill="var(--color-accent)" radius={[3, 3, 3, 3]} />
          <ReferenceLine x={baseline} stroke="var(--color-muted-foreground)" strokeDasharray="4 4" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
