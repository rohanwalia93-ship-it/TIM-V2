import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const SECTIONS = [
  {
    title: "Universal Viability Index",
    body:
      "A composite 0–100 score, weighted mean of five pillars (Demand & Market 25%, Access & Readiness 20%, Economics & Return 25%, Competition & Differentiation 15%, Risk & Sustainability 15%). Every sub-metric is min-max normalized against comparable-city or comparable-product benchmarks — never against an arbitrary scale. Verdict bands: GO ≥ 70, CONDITIONAL 50–69, NO-GO < 50. A GO is downgraded to CONDITIONAL whenever the overall data confidence behind the scenario is Low.",
  },
  {
    title: "Financial engine — discounted cash flow",
    body:
      "Standard DCF over a configurable horizon (default 10 years): NPV = Σ[(Revenue_t − OPEX_t)/(1+r)^t] − CAPEX. IRR is solved numerically via bisection. Payback is the discounted cumulative break-even year. BCR = PV(benefits)/PV(costs). The discount rate defaults to a risk-free proxy plus a cited country risk premium (Damodaran Online).",
  },
  {
    title: "Natural — Carrying-Capacity & Sustainability Model",
    body:
      "Implements the Cifuentes (1992) carrying-capacity cascade: Physical Carrying Capacity (PCC = usable area × visitor density × daily rotation factor) → Real Carrying Capacity (RCC, corrected for climate, fragility, rainfall, accessibility, and biodiversity sensitivity) → Effective Carrying Capacity (ECC, further limited by management capacity). A sustainable revenue ceiling is derived from ECC, and Butler's (1980) Tourism Area Life Cycle positions the site from Exploration through Decline to flag overtourism risk. Environmental carrying-capacity breach is a hard gate on the verdict.",
    refs: ["Cifuentes, M. (1992). Determinación de Capacidad de Carga Turística en Áreas Protegidas.", "Butler, R.W. (1980). The Concept of a Tourist Area Cycle of Evolution. Canadian Geographer."],
  },
  {
    title: "Man-made — Attendance-Forecast & Investment Model",
    body:
      "A gravity/Huff market-penetration model. Resident attendance decays with distance (Attendance_z = Pop_z × PenetrationRate × e^(−β·d_z)); tourist attendance applies a capture rate to inbound arrivals. A Huff (1964) competitive-share calculation — Share_i = (Aᵢ/dᵢ^λ) / Σⱼ(Aⱼ/dⱼ^λ) — discounts raw demand for named competing attractions from OpenStreetMap. Forecast attendance is ramped over the opening years and checked against designed daily capacity before feeding the shared DCF engine.",
    refs: ["Huff, D. (1964). Defining and Estimating a Trading Area. Journal of Marketing, 28(3)."],
  },
  {
    title: "Event — Economic-Impact (Input-Output Multiplier) Model",
    body:
      "Follows UN Tourism's Tourism Satellite Account Recommended Methodological Framework (TSA:RMF 2008) and the input-output multiplier method (direct/indirect/induced), applying the incrementality principle: locals, casual time-switchers, and displacement/substitution effects are excluded so only genuinely new visitor spend counts. Direct spend across TSA categories (ticket, lodging, F&B, transport, retail) is multiplied by a cited Type II regional output multiplier to produce total economic impact, decomposed into direct/indirect/induced effects and jobs supported. This public economic-impact lens is always reported separately from the private P&L (ticket revenue vs. hosting cost).",
    refs: [
      "UN Tourism (UNWTO). Tourism Satellite Account: Recommended Methodological Framework (TSA:RMF 2008).",
      "Crompton, J. (2006). Economic Impact Studies: Instruments for Political Shenanigans?",
    ],
  },
  {
    title: "Guardrails against fabrication",
    body:
      "Every number shown in the tool follows the same priority order: try live, current data first; if that isn't available, fall back to a cited industry benchmark; and if neither exists, ask you to enter an assumption — clearly labeled as such. Nothing is ever silently invented. The verdict's overall Confidence rating (High/Medium/Low) reflects the mix of live, benchmark, and assumption inputs behind it, and every exported report appends a full data-provenance appendix listing where each figure came from.",
  },
];

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Compass className="h-5 w-5 text-accent" />
            TourViable
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/scenario">
                <ArrowLeft className="h-4 w-4" />
                Back to scenario
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Methodology</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every score and formula TourViable computes, with its academic or institutional basis. Nothing here is a
            black box.
          </p>
        </div>
        {SECTIONS.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <CardTitle>{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <CardDescription className="text-sm leading-relaxed text-foreground/80">{s.body}</CardDescription>
              {s.refs && (
                <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
                  {s.refs.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
}
