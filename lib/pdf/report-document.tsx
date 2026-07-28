import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ReportPayload } from "@/lib/pdf/types";
import { headlineLabel } from "@/lib/headline-labels";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  h1: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  h2: { fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 6, borderBottom: "1px solid #e2e8f0", paddingBottom: 4 },
  subtitle: { fontSize: 10, color: "#64748b", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#64748b" },
  value: { fontWeight: 700 },
  verdictBox: { padding: 10, borderRadius: 6, marginVertical: 10 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  kpiCard: { width: "23%", border: "1px solid #e2e8f0", borderRadius: 6, padding: 8, marginRight: 6, marginBottom: 6 },
  kpiLabel: { fontSize: 8, color: "#64748b" },
  kpiValue: { fontSize: 13, fontWeight: 700, marginTop: 2 },
  tableRow: { flexDirection: "row", borderBottom: "1px solid #f1f5f9", paddingVertical: 4 },
  tableCellSmall: { width: "12%", fontSize: 8 },
  tableCellMed: { width: "28%", fontSize: 8 },
  tableCellLarge: { width: "40%", fontSize: 8 },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, fontSize: 8, color: "#94a3b8", textAlign: "center" },
  pageNumber: { position: "absolute", bottom: 20, right: 36, fontSize: 8, color: "#94a3b8" },
});

const VERDICT_COLORS: Record<string, string> = { GO: "#059669", CONDITIONAL: "#b45309", "NO-GO": "#dc2626" };
const VERDICT_BG: Record<string, string> = { GO: "#ecfdf5", CONDITIONAL: "#fffbeb", "NO-GO": "#fef2f2" };

function formatUsd(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function ReportDocument({ data }: { data: ReportPayload }) {
  const { viability, dcf, archetypeResult } = data;

  return (
    <Document title={`TourViable Report — ${data.product} in ${data.cityName}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>TourViable — Viability Report</Text>
        <Text style={styles.subtitle}>
          {data.product} · {data.cityName}, {data.countryName} · Generated {new Date(data.generatedAt).toLocaleString()}
        </Text>
        <Text style={{ marginBottom: 8 }}>{data.objective}</Text>

        <View style={[styles.verdictBox, { backgroundColor: VERDICT_BG[viability.verdict] }]}>
          <Text style={{ fontSize: 16, fontWeight: 700, color: VERDICT_COLORS[viability.verdict] }}>
            {viability.verdict} — Viability Index {viability.compositeScore.toFixed(0)}/100
          </Text>
          <Text style={{ marginTop: 4 }}>{viability.verdictReason}</Text>
        </View>

        <Text style={styles.h2}>Pillar scores</Text>
        <View style={styles.kpiGrid}>
          {viability.pillars.map((p) => (
            <View key={p.pillar} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{p.label}</Text>
              <Text style={styles.kpiValue}>{p.score.toFixed(0)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.h2}>Financials (private DCF)</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>NPV</Text>
            <Text style={styles.kpiValue}>{formatUsd(dcf.npv)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>IRR</Text>
            <Text style={styles.kpiValue}>{dcf.irr !== null ? `${(dcf.irr * 100).toFixed(1)}%` : "N/A"}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Payback</Text>
            <Text style={styles.kpiValue}>{dcf.paybackYears !== null ? `${dcf.paybackYears.toFixed(1)} yrs` : "Beyond horizon"}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>BCR</Text>
            <Text style={styles.kpiValue}>{dcf.bcr.toFixed(2)}×</Text>
          </View>
        </View>
        <Text style={{ fontSize: 8, color: "#64748b" }}>
          Discount rate: {(data.discountRate * 100).toFixed(1)}% · Horizon: {dcf.cashFlows.length} years
        </Text>

        <Text style={styles.h2}>Headline model outputs — {archetypeResult.moduleName}</Text>
        <View style={styles.kpiGrid}>
          {Object.entries(archetypeResult.headline).map(([k, v]) => (
            <View key={k} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{headlineLabel(k)}</Text>
              <Text style={styles.kpiValue}>{typeof v === "number" ? v.toLocaleString() : String(v)}</Text>
            </View>
          ))}
        </View>

        {archetypeResult.riskFlags.length > 0 && (
          <>
            <Text style={styles.h2}>Risk register</Text>
            {archetypeResult.riskFlags.map((f) => (
              <View key={f.label} style={{ marginBottom: 4 }}>
                <Text style={{ fontWeight: 700 }}>
                  [{f.severity.toUpperCase()}] {f.label}
                </Text>
                <Text style={{ color: "#64748b" }}>{f.note}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.footer}>TourViable — Tourism Product Viability Engine. Board-ready, source-cited analysis.</Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Methodology appendix</Text>
        <Text style={styles.subtitle}>{archetypeResult.methodologyRefs.join(" · ")}</Text>

        {archetypeResult.formulaSteps.map((step) => (
          <View key={step.label} style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: 700 }}>{step.label}</Text>
            <Text style={{ fontFamily: "Courier", fontSize: 9, marginVertical: 2 }}>{step.formula}</Text>
            {Object.entries(step.inputs).map(([label, v]) => (
              <View key={label} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>
                  {v.value.toLocaleString()} {v.unit ?? ""}
                </Text>
              </View>
            ))}
            <View style={styles.row}>
              <Text style={styles.label}>Result</Text>
              <Text style={styles.value}>
                {step.result.toLocaleString()} {step.unit ?? ""}
              </Text>
            </View>
            <Text style={{ color: "#64748b", marginTop: 2 }}>{step.explanation}</Text>
          </View>
        ))}

        <Text style={styles.h2}>Universal Viability Index — formula</Text>
        <Text>ViabilityIndex = Σ(pillarScore_i × weight_i). GO ≥ 70, CONDITIONAL 50–69, NO-GO &lt; 50.</Text>
        <Text style={{ color: "#64748b", marginTop: 2 }}>
          A GO is downgraded to CONDITIONAL when overall data confidence is Low.
        </Text>

        <Text style={styles.footer}>TourViable — Tourism Product Viability Engine.</Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Data & assumptions provenance</Text>
        <Text style={styles.subtitle}>
          Every figure behind this scenario — origin, timestamp, license, and confidence. High = live data, Medium =
          cited benchmark, Low = user assumption.
        </Text>

        <View style={[styles.tableRow, { borderBottom: "1px solid #0f172a" }]}>
          <Text style={[styles.tableCellLarge, { fontWeight: 700 }]}>Field</Text>
          <Text style={[styles.tableCellSmall, { fontWeight: 700 }]}>Value</Text>
          <Text style={[styles.tableCellMed, { fontWeight: 700 }]}>Source</Text>
          <Text style={[styles.tableCellSmall, { fontWeight: 700 }]}>Confidence</Text>
        </View>
        {data.resolvedValues.map((rv) => (
          <View key={rv.key} style={styles.tableRow}>
            <Text style={styles.tableCellLarge}>{rv.label}</Text>
            <Text style={styles.tableCellSmall}>
              {typeof rv.value === "number" ? rv.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : String(rv.value)}
            </Text>
            <Text style={styles.tableCellMed}>{rv.source.name}</Text>
            <Text style={styles.tableCellSmall}>{rv.confidence}</Text>
          </View>
        ))}

        <Text style={styles.footer}>TourViable — Tourism Product Viability Engine.</Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
