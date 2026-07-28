# TourViable — Tourism Product Viability Engine

Answers exactly one question, completely: **"Should we launch [a tourism product] in [a city], and is it financially and strategically viable?"**

A CEO, strategy lead, or destination-authority admin walks a single guided path — Frame the problem → City Context → Configure the model → Run the model → Verdict & financials → Sensitivity → Export — and gets a defensible, board-ready GO / CONDITIONAL / NO-GO verdict, with every number traced back to a live API, a cited benchmark, or an explicit user assumption.

## Architecture

- **Framework**: Next.js 16 (App Router) + TypeScript strict + Tailwind CSS v4 + shadcn/ui-style Radix primitives.
- **State**: Zustand (`lib/store/scenarioStore.ts`) holds the whole scenario — city, archetype, product, model inputs, and a `resolvedValues` provenance registry that every input/output registers into.
- **Data layer** (`lib/sources/*`): one typed client per free API — fetch fn, Zod schema, `SourceMeta` (name/url/license/retrievedAt), and Next.js fetch-cache (`next.revalidate`). Never throws; a dead upstream returns `null` so callers fall back gracefully.
- **API routes** (`app/api/*`): thin server-side proxies over the source clients, so API keys (Ticketmaster) never reach the client.
- **Guardrail against fabrication** (`lib/resolveInput.ts`): the single choke point every number passes through — live API → cited benchmark (`lib/benchmarks.ts`) → user assumption, always tagged with a `confidence` (`high` / `medium` / `low`) and a `SourceMeta`. No code path returns an untagged number.
- **Scoring** (`lib/scoring/*`): three archetype-specific models (Natural / Man-made / Event) each producing a common `ArchetypeResult` (formula steps, pillar sub-metrics, finance seed, risk flags), fed into a shared Universal Viability Index (`viabilityIndex.ts`) and DCF engine (`lib/finance/dcf.ts`).
- **PDF export** (`lib/pdf/report-document.tsx`): `@react-pdf/renderer`, rendered server-side in `app/api/report/route.tsx`.

## Data sources

| Domain | Source | Key? | License |
|---|---|---|---|
| Tourist arrivals, receipts, GDP, GDP/capita, population | [World Bank Open Data API](https://data.worldbank.org/) | No | CC BY 4.0 |
| Events, venues, comparable-event pricing | [Ticketmaster Discovery API v2](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) | **Yes** (free, 5,000/day) | Free dev tier |
| Hotels, attractions, POIs, protected-area geometry | [OpenStreetMap Overpass API](https://overpass-api.de/) + [Nominatim](https://nominatim.org/) | No | ODbL |
| Climate, seasonality, historical weather | [Open-Meteo](https://open-meteo.com/) | No | CC BY 4.0 |
| Country profile (population, area, currency) | [REST Countries](https://restcountries.com/) | No | GeoNames CC BY 4.0 |
| Air connectivity (airports, runway count as capacity proxy) | [OurAirports](https://ourairports.com/data/) open data | No | Public domain |
| FX rates | [Frankfurter](https://www.frankfurter.app/) | No | Open (ECB) |
| City/landmark context | [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) | No | CC BY-SA 4.0 |

Every KPI card in the app shows a source badge (hover for name, URL, license, retrieval timestamp, and confidence). The **Data & Assumptions** drawer (right rail, every step) lists the full registry for the current scenario.

### Getting the one free key

1. Create a free account at [developer.ticketmaster.com](https://developer.ticketmaster.com/).
2. Generate a Consumer Key under "My Apps."
3. Set `TICKETMASTER_API_KEY` locally (`.env.local`) or as a Vercel project env var.

Without the key, the app still works end-to-end — comparable event/venue pricing falls back to a cited benchmark, clearly flagged as Medium confidence.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No env vars are required to run the full flow.

## Testing

```bash
npm run test          # Vitest unit tests — finance/scoring/resolveInput/benchmarks (no network required)
npm run test:e2e       # Playwright E2E — full value chain for all 3 archetypes, methodology, dark mode
npm run test:integration  # Data-integrity suite — hits every live API for real (requires outbound internet)
```

`npm run test:integration` is intentionally excluded from the default `npm test` path: many CI/sandboxed environments block outbound network access, and this suite exists specifically to catch upstream schema drift, not to gate every commit.

## Deploying to Vercel

```bash
npm i -g vercel
vercel
```

Or connect the repo in the Vercel dashboard — `vercel.json` sets the framework and bumps `maxDuration` on the two longer-running routes (`/api/airports`, which parses the OurAirports CSV bundle, and `/api/report`, which renders the PDF). Add `TICKETMASTER_API_KEY` under Project Settings → Environment Variables if you have one.

## Methodology

Full in-app writeup at `/methodology`. Summary:

- **Universal Viability Index** — composite 0–100, weighted mean of 5 pillars (Demand & Market 25%, Access & Readiness 20%, Economics & Return 25%, Competition & Differentiation 15%, Risk & Sustainability 15%). GO ≥ 70, CONDITIONAL 50–69, NO-GO < 50; a GO is downgraded to CONDITIONAL when overall data confidence is Low.
- **Financial engine** — standard DCF (NPV, IRR via bisection, discounted payback, BCR) shared by all three archetypes.
- **Natural** — Cifuentes (1992) carrying-capacity cascade (PCC → RCC → ECC) + Butler's (1980) Tourism Area Life Cycle for overtourism/saturation risk.
- **Man-made** — Huff (1964) gravity/market-penetration model: distance-decay attendance + competitive-share calculation against named OSM competitors.
- **Event** — UN Tourism TSA:RMF (2008) + input-output multiplier method, with an incrementality principle (Crompton, 2006) excluding locals/time-switchers/displacement so only genuinely new visitor spend counts.

Citations:
- Cifuentes, M. (1992). *Determinación de Capacidad de Carga Turística en Áreas Protegidas.*
- Butler, R.W. (1980). *The Concept of a Tourist Area Cycle of Evolution.* Canadian Geographer.
- Huff, D. (1964). *Defining and Estimating a Trading Area.* Journal of Marketing, 28(3).
- UN Tourism (UNWTO). *Tourism Satellite Account: Recommended Methodological Framework (TSA:RMF 2008).*
- Crompton, J. (2006). *Economic Impact Studies: Instruments for Political Shenanigans?*

## Seeded demo scenarios

Four one-click demos on the homepage cover all three archetypes: **Coldplay in Abu Dhabi** and an **NBA exhibition game in Abu Dhabi** (Event), a **waterfront theme park in Jeddah** (Man-made), and a **desert eco-lodge & dune reserve near Al Ain** (Natural). Each prefills Step 1 and jumps straight to the live City Context fetch — a first-time user reaches a verdict in under 60 seconds.
