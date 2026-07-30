# AUDIT.md — TourViable POC vs. TIM Rebuild Brief

Audit date: 2026-07-30. Scope: assess the existing repository (`tourviable` / "TIM-V2",
commits `8a10ad8` and `8e4261f`) against `Tourism Investment & Product Viability Command
Centre` rebuild brief ("TIM"). Classifies every major component as **Reuse**, **Replace**,
or **Remove**, and sizes the gap to the brief's non-negotiable acceptance criteria.

## 0. Headline finding

The existing app is a well-built **single-user, client-only, single-scenario calculator**:
Next.js App Router + Zustand (persisted to `localStorage`) + four scoring engines + a DCF
engine + a 7-step wizard + PDF export. There is **no database, no authentication, no RBAC,
no portfolio/multi-scenario persistence, no versioning/approval workflow, no gates
architecture, and no Excel export.** It is a strong foundation for the brief's *demand model
engine* and *evidence/provenance concept*, but it does not meet most of the brief's
non-negotiable acceptance criteria as-is. This is a **rebuild with substantial reuse of the
calculation core**, not a rebuild from zero — see §4 for what survives.

Gap against §2 (non-negotiable acceptance criteria), item by item:

| # | Criterion | Status |
|---|---|---|
| 1 | Traceable scenario for event/attraction/cultural/nature/accommodation/enabling-asset | Partial — 4 categories exist (Events, Attractions [built+natural], Accommodation, MICE); no "destination-enabling asset" or "cultural product" as distinct classes; no persistence beyond one scenario in browser storage |
| 2 | Every input has value/unit/geography/period/source/retrieval date/transformation/confidence/**status** | Partial — `ResolvedValue`/`SourceMeta` cover value/unit/source/confidence/retrievedAt; **no geography, period, transformation, or input-status fields** |
| 3 | Four input statuses (live/published/benchmark/assumption) | Gap — current `Confidence` is `high/medium/low`, conflating status and confidence into one enum. No `published` vs `live` distinction, no `client-upload` status |
| 4 | No silent fallback; missing input blocks calculation | **Violation** — `resolveInput()` explicitly falls back live → benchmark → assumption *silently* (by design, previously "guardrail against fabrication"). The brief requires the opposite: missing input **stops the calculation** and raises a data request |
| 5 | Recommendation from explicit gates, not LLM | Reuse — verdict is already deterministic (`viabilityIndex.ts` thresholds). But it's a **single weighted composite score**, not sequential gates (Evidence → Fatal-flaw → Market → Financial → Strategic) |
| 6 | Source→calculation→recommendation bridge visible | Partial — `formulaSteps` + `SourceBadge` popovers exist; no explicit lineage graph from evidence ID to derived-value ID to gate |
| 7 | Base/downside/upside before recommendation | Gap — only a live "what-if" slider (Step 6) exists; no named 3-case scenario set gating the recommendation |
| 8 | Private return / public impact / strategic / sustainability / deliverability / risk shown separately | Partial — DCF (private) and event public-impact bridge exist; no separate government/funder case, no strategic/deliverability MCDA |
| 9 | "Insufficient evidence" as a valid outcome | Gap — verdict is always GO/CONDITIONAL/NO-GO; no DEFER state |
| 10 | Deterministic recommendation language, LLM explains only | Reuse — no LLM in the loop today at all; safe starting point |
| 11 | PDF + Excel export reproduce screen calculations exactly | Partial — PDF export exists (`@react-pdf/renderer`) and is screen-accurate; **no Excel export** |

## 1. Correctness issues already present (brief §3) — confirmed in code

| Brief warning | Where it appears today | Verdict |
|---|---|---|
| World Bank country arrivals ≠ city arrivals | `lib/sources/worldbank.ts`, used directly as `touristArrivals` in `runScenario.ts` for the man-made model | **Confirmed gap.** No city-scaling factor, no caveat surfaced in the UI beyond a generic confidence dot |
| OSM hotel points ≠ room inventory | `lib/sources/overpass.ts` (`HotelSupplyResult.estimatedRooms`) — estimates rooms via a fixed multiplier per OSM hotel node | **Confirmed gap.** Used as "hotel supply" in accommodation/event risk checks without a room-inventory caveat |
| Airport/runway count ≠ seat capacity | `lib/sources/ourAirports.ts` (`AirConnectivityResult.seatCapacityProxyScore`) — explicitly named "proxy" in code, but rendered in the UI as an Access pillar sub-metric without a strong caveat | **Confirmed gap**, partially self-aware (proxy naming) but not surfaced to the user as a limitation |
| Ticketmaster listings ≠ historical attendance/sales | `lib/sources/ticketmaster.ts`, shown as "comparable ticketed events" — used for descriptive context only, not fed into the event demand model | **Low risk** — already descriptive-only, not a calculation input. Keep the caveat, tighten wording |
| Nominatim ≠ drive-time catchments | `lib/model-defaults/manmade.ts` `deriveCatchmentZones()` — builds catchment rings from straight-line distance × an assumed average speed | **Confirmed gap.** No actual routing/isochrone service; must be relabeled as a distance-based proxy and gated as such |
| Arbitrary 0–100 score ≠ investment case | `lib/scoring/viabilityIndex.ts` — single composite score with fixed pillar weights | **Confirmed gap** — must become gate-based per brief §5, with the composite retained only as one sub-signal |
| Type II multiplier without geography/industry/year/price basis | `lib/benchmarks.ts` `regionalOutputMultiplierDefault` — single hardcoded 1.8, no geography/year/price-basis metadata | **Confirmed gap** |
| Media value monetisation | `lib/scoring/event.ts` `mediaValueUsd` — a free-text USD assumption fed straight into headline metrics, no methodology | **Confirmed gap** — brief requires this be excluded unless an approved methodology is attached |
| Product categories sharing one model with different labels | Not the case post-restructure — Natural/Man-made/Event/Accommodation are four distinct calculation engines | **No gap** — this is the one area already aligned with the brief's intent |

## 2. Component-by-component classification

### Reuse largely as-is (calculation core is sound and testable)
- `lib/finance/dcf.ts` — NPV/IRR/payback/BCR. **Replace** IRR's ad-hoc bisection and plain-number cash flows with dated `xirr`/`xnpv` over `decimal.js`, per brief §9/§10, but the algorithmic shape is reusable.
- `lib/scoring/natural.ts` (Cifuentes PCC→RCC→ECC + Butler TALC) — matches brief §4 "Natural or heritage product" almost exactly. Reuse the formula chain; extend with sustainable-utilisation/conservation-threshold framing.
- `lib/scoring/manmade.ts` (Huff gravity model) — matches brief §4 "Recurring attraction" *shape* but not its required build-up (resident visits = population × participation × frequency × share; tourist visits = addressable nights × awareness × consideration × conversion). Current model conflates these into a single Huff share. **Replace** the demand build-up; reuse the competitive-share concept.
- `lib/scoring/event.ts` (TSA:RMF + incrementality) — closest existing match to brief §4 "Event" and §5C "Economic impact". Reuse the incrementality/leakage principle; **extend** to add ticket-category breakdown, sell-through, and explicit displacement/substitution/time-switching/deadweight line items (brief asks for each named separately, current model has one combined incrementality rate).
- `lib/scoring/accommodation.ts` (RevPAR/GOP pro-forma, built this session) — matches brief §4 "Accommodation product" well (room supply, demand nights via occupancy, ADR, stabilisation ramp, GOP). Reuse directly; add fair-share occupancy calculation explicitly.
- `lib/scoring/types.ts` (`ArchetypeResult`, `FormulaStep`, `RiskFlag`) shape — good pattern for "formula lineage," reusable as the seed of the brief's calculation-sheet requirement.
- Design tokens / shadcn-style primitives (`components/ui/*`) — reusable; palette needs to shift to the brief's DCT-inspired coral/charcoal/stone system (§8), and Arabic RTL + Noto Sans Arabic needs to be added.
- Chart components (`tornado-chart.tsx`, `cashflow-chart.tsx`, `pillar-radar.tsx`, `seasonality-chart.tsx`) — reusable, already accessible-ish via Recharts; brief allows Recharts or ECharts, no forced migration needed.
- Test setup (Vitest + Playwright configs, `tests/unit/*` formula tests) — reusable pattern; needs many more cases per brief §10 (zero demand, negative cash flow, no sign change for IRR, delayed opening, capacity binding, missing data, extreme inflation, source outage).

### Replace (concept is right, implementation doesn't meet the bar)
- `lib/store/scenarioStore.ts` — client-only Zustand + localStorage. **Replace** with PostgreSQL + Prisma-backed scenarios, versions, and audit history; the store's *shape* (city/product/objective/inputs/results) is a reasonable starting schema for the Prisma models.
- `lib/resolveInput.ts` / `ResolvedValue` — the live→benchmark→assumption **silent fallback** is the single biggest philosophical conflict with the brief (§2 item 4, §6 `EvidenceValue`). Replace with the brief's explicit `EvidenceValue` object and "stop and request" behavior; the four-tier source-priority *logic* survives, just not the auto-fallback.
- The 7-step linear wizard (`components/steps/step1..7-*.tsx`, `app/scenario/step-router.tsx`) — reusable as the *shape* of the 8-stage journey (frame → evidence → diagnostic → model → appraisal → risk/strategy → options/recommendation → export maps closely to Steps 1–7 today), but needs a Stage 0 portfolio landing page prepended, gate checks between stages, and stage-level "can't proceed" blocking that doesn't exist today (today `setStep` is unconditional).
- `components/verdict-pill.tsx` + `lib/scoring/viabilityIndex.ts` verdict logic — replace the single-threshold GO/CONDITIONAL/NO-GO with the brief's five-state (PROCEED / PROCEED SUBJECT TO CONDITIONS / PILOT-PHASE / DEFER PENDING EVIDENCE / DO NOT PROCEED) sequential-gate output; keep the pillar sub-metric scoring as an input to Gate 3/5, not the final say.
- `lib/pdf/report-document.tsx` — reusable rendering approach (`@react-pdf/renderer`); replace its content model to match the brief's two-page executive paper + full investment case + provenance/assumptions/risk registers, and add the Excel (`ExcelJS`) counterpart that must reconcile line-for-line.
- `lib/demo-scenarios.ts` — reusable mechanism; replace the seeded content with the brief's mandated single seeded demo (International Stadium Concert, Abu Dhabi) built out to full depth, plus empty templates for the other four archetypes (brief §11), rather than 6 fully-populated demos.

### Remove / do not carry forward
- The "silent benchmark fallback = guardrail against fabrication" framing in `lib/resolveInput.ts` docstrings and any UI copy describing it as a virtue — this is the opposite of brief §2 item 4 and needs to be removed, not adapted.
- `mediaValueUsd` as a free-input USD assumption flowing straight into headline economic-impact numbers (`lib/scoring/event.ts`) — remove until an approved media-value methodology is supplied (brief §3 explicit ban).
- Single hardcoded `regionalOutputMultiplierDefault = 1.8` with no geography/industry/year/price-basis — remove as a bare number; either require an uploaded input-output/SAM model or a fully-attributed multiplier record.
- Any place `touristArrivals` (national World Bank figure) is used as a stand-in for city-level demand without an explicit, visible caveat (`lib/scoring/runScenario.ts`) — remove the direct pass-through; require either a city-level source or a labeled, confidence-downgraded proxy.

## 3. Infrastructure gap (brief §9)

None of the following exist in the current repo and all are required:

- **Database**: no PostgreSQL, no Prisma schema/migrations. `package.json` has zero DB dependencies.
- **Auth/RBAC**: no NextAuth, no Entra ID integration, no user/session concept at all — the app is anonymous and single-scenario.
- **Financial precision**: calculations use plain JS `number`, not `decimal.js`; DCF uses a hand-rolled bisection IRR over undated annual arrays, not `xirr`/`xnpv` over dated cash flows.
- **Excel export**: no `exceljs` dependency, no workbook generation at all.
- **Maps**: uses Leaflet/`react-leaflet`, not MapLibre; brief names MapLibre specifically (Leaflet is a reasonable substitute but is a deviation from the brief to flag).
- **i18n/RTL**: no Arabic locale, no RTL layout, no Noto Sans Arabic — English-only today.
- **Versioning/effective-dating**: no concept of model version, threshold version, or weight version; `BENCHMARKS` constants are unversioned and unattributed to an approval.
- **Adapter status reporting**: source clients (`lib/sources/*`) return data or `null` — none report `connected/stale/rate-limited/unavailable/authentication-required` as a first-class status brief §7 requires.

## 4. What this means for the build sequence (brief §12)

Given the above, Step 1 (this document) is done. Steps 2–11 represent a genuinely large,
multi-phase engineering effort — new persistence layer, new auth/RBAC layer, a rewritten
evidence model with non-silent-fallback semantics, a five-gate recommendation engine
replacing today's single composite score, three separated financial ledgers, Excel export,
and bilingual RTL support — on top of a calculation core that is roughly 60% reusable.
This is not a same-day rebuild; it should proceed phase by phase per §12, with each phase
independently tested and demoed before the next begins, starting with the seeded event
scenario end-to-end (§12 step 5) before other archetypes are extended to the new evidence
model.

Two decisions before implementation can start on the infrastructure layer (§9) are the
user's to make, not mine to assume: which hosted Postgres instance to provision (and its
connection string), and which auth provider/credentials to wire for RBAC (a real Entra ID
app registration, or a dev-mode credentials provider as a placeholder until one exists).
