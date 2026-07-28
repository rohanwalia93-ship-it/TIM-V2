"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import type { PillarScore } from "@/lib/scoring/viabilityIndex";

export function PillarRadar({ pillars }: { pillars: PillarScore[] }) {
  const data = pillars.map((p) => ({ pillar: p.label, score: Math.round(p.score) }));
  const summary = data.map((d) => `${d.pillar} ${d.score}`).join(", ");
  return (
    <div role="img" aria-label={`Pillar radar chart: ${summary}`}>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid className="stroke-border" />
          <PolarAngleAxis dataKey="pillar" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
          <Radar dataKey="score" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.3} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
      <table className="sr-only">
        <caption>Pillar scores</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.pillar}>
              <th scope="row">{d.pillar}</th>
              <td>{d.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
