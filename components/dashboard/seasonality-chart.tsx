"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthlyClimate } from "@/lib/sources/openMeteo";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function SeasonalityChart({ monthly }: { monthly: MonthlyClimate[] }) {
  const data = monthly.map((m) => ({
    month: MONTH_LABELS[m.month - 1],
    comfortable: Math.round(m.comfortableDayShare * 100),
    avgHighC: m.avgHighC,
  }));

  return (
    <div role="img" aria-label="Seasonality chart: share of comfortable outdoor-tourism days per month">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="comfortGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
          <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" unit="%" width={36} />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, name) =>
              name === "comfortable" ? [`${value}%`, "Comfortable days"] : [`${value}°C`, "Avg high"]
            }
          />
          <Area type="monotone" dataKey="comfortable" stroke="var(--color-accent)" fill="url(#comfortGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
      <table className="sr-only">
        <caption>Comfortable days per month</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <th scope="row">{d.month}</th>
              <td>{d.comfortable}% comfortable, avg high {d.avgHighC}°C</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
