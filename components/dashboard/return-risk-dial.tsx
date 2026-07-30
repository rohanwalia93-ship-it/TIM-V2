/**
 * A two-axis Return/Risk instrument: plots a single blip at (return, risk) inside a
 * concentric, ticked dial face, deliberately not collapsed into one blended number.
 * Both axes are derived from the same 5 pillars behind the Universal Viability Index —
 * this is a different view of that one real computed result, not a second independent score.
 */
const VIEWBOX = 220;
const CENTER = VIEWBOX / 2;
const PLOT_HALF_WIDTH = 78;
const RING_COUNT = 4;

function toPlotCoords(returnScore: number, riskScore: number) {
  const r = Math.max(0, Math.min(100, returnScore));
  const k = Math.max(0, Math.min(100, riskScore));
  const x = CENTER - PLOT_HALF_WIDTH + (r / 100) * (2 * PLOT_HALF_WIDTH);
  const y = CENTER + PLOT_HALF_WIDTH - (k / 100) * (2 * PLOT_HALF_WIDTH);
  return { x, y };
}

function blipColor(returnScore: number, riskScore: number): string {
  const net = returnScore - riskScore; // -100..100
  const t = Math.round(Math.max(0, Math.min(1, (net + 100) / 200)) * 100);
  return `color-mix(in srgb, var(--go) ${t}%, var(--nogo))`;
}

export function ReturnRiskDial({
  returnScore,
  riskScore,
  size = 160,
  showAxisLabels = false,
}: {
  returnScore: number;
  riskScore: number;
  size?: number;
  showAxisLabels?: boolean;
}) {
  const { x, y } = toPlotCoords(returnScore, riskScore);
  const color = blipColor(returnScore, riskScore);

  return (
    <div className="inline-flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          className="h-full w-full"
          role="img"
          aria-label={`Return ${Math.round(returnScore)}, Risk ${Math.round(riskScore)}`}
        >
          {Array.from({ length: RING_COUNT }).map((_, i) => {
            const r = ((i + 1) / RING_COUNT) * PLOT_HALF_WIDTH;
            return <circle key={i} cx={CENTER} cy={CENTER} r={r} fill="none" stroke="var(--accent)" strokeOpacity={0.18} strokeWidth={1} />;
          })}

          <line x1={CENTER - PLOT_HALF_WIDTH} y1={CENTER} x2={CENTER + PLOT_HALF_WIDTH} y2={CENTER} stroke="var(--border)" strokeWidth={1} />
          <line x1={CENTER} y1={CENTER - PLOT_HALF_WIDTH} x2={CENTER} y2={CENTER + PLOT_HALF_WIDTH} stroke="var(--border)" strokeWidth={1} />

          {[0, 90, 180, 270].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const outer = PLOT_HALF_WIDTH + 6;
            const inner = PLOT_HALF_WIDTH - 2;
            return (
              <line
                key={deg}
                x1={CENTER + Math.sin(rad) * inner}
                y1={CENTER - Math.cos(rad) * inner}
                x2={CENTER + Math.sin(rad) * outer}
                y2={CENTER - Math.cos(rad) * outer}
                stroke="var(--accent)"
                strokeWidth={1.5}
              />
            );
          })}

          {showAxisLabels && (
            <>
              <text x={CENTER + PLOT_HALF_WIDTH + 10} y={CENTER + 4} fill="var(--muted-foreground)" fontSize={9} fontFamily="var(--font-mono)">
                RET
              </text>
              <text x={CENTER - 14} y={CENTER - PLOT_HALF_WIDTH - 10} fill="var(--muted-foreground)" fontSize={9} fontFamily="var(--font-mono)">
                RISK
              </text>
            </>
          )}

          <line x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="var(--accent)" strokeWidth={1.5} strokeOpacity={0.7} />
          <circle cx={x} cy={y} r={7} fill={color} stroke="var(--card)" strokeWidth={2} />
        </svg>
      </div>

      <div className="flex items-center gap-4 font-mono text-sm">
        <span style={{ color: "var(--go)" }}>RETURN {Math.round(returnScore)}</span>
        <span style={{ color: "var(--nogo)" }}>RISK {Math.round(riskScore)}</span>
      </div>
    </div>
  );
}
