"use client";

import * as React from "react";
import { ArrowRight, Users, TrendingUp, Landmark, Hotel, Plane, Sun, MapPinned } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CityMap } from "@/components/dashboard/city-map";
import { SeasonalityChart } from "@/components/dashboard/seasonality-chart";
import { liveResolvedValue } from "@/components/dashboard/city-context-helpers";
import { useApiResource } from "@/lib/hooks/useApiResource";
import { useScenarioStore } from "@/lib/store/scenarioStore";
import type { CountryProfile } from "@/lib/sources/restCountries";
import type { WorldBankIndicatorKey, WorldBankResult } from "@/lib/sources/worldbank";
import type { ClimateResult } from "@/lib/sources/openMeteo";
import type { HotelSupplyResult, ComparableAttraction } from "@/lib/sources/overpass";
import type { SiteAreaResult } from "@/lib/sources/overpass";
import type { AirConnectivityResult } from "@/lib/sources/ourAirports";
import type { TicketmasterResult } from "@/lib/sources/ticketmaster";
import type { WikiSummary } from "@/lib/sources/wikipedia";

export function Step2CityContext() {
  const city = useScenarioStore((s) => s.city);
  const archetype = useScenarioStore((s) => s.archetype);
  const setStep = useScenarioStore((s) => s.setStep);
  const setCityContext = useScenarioStore((s) => s.setCityContext);
  const registerResolvedValue = useScenarioStore((s) => s.registerResolvedValue);

  const lat = city?.lat;
  const lon = city?.lon;
  const countryCode = city?.countryCode;

  const country = useApiResource<{ profile: CountryProfile | null; worldBank: Record<WorldBankIndicatorKey, WorldBankResult | null> }>(
    countryCode ? `/api/country?code=${countryCode}` : null,
  );
  const climate = useApiResource<{ climate: ClimateResult | null }>(
    lat !== undefined && lon !== undefined ? `/api/climate?lat=${lat}&lon=${lon}` : null,
  );
  const hotels = useApiResource<{ hotels: HotelSupplyResult | null }>(
    lat !== undefined && lon !== undefined ? `/api/hotels?lat=${lat}&lon=${lon}` : null,
  );
  const attractions = useApiResource<{ result: { attractions: ComparableAttraction[] } | null }>(
    lat !== undefined && lon !== undefined ? `/api/attractions?lat=${lat}&lon=${lon}` : null,
  );
  const siteArea = useApiResource<{ site: SiteAreaResult | null }>(
    archetype === "natural" && lat !== undefined && lon !== undefined ? `/api/site-area?lat=${lat}&lon=${lon}` : null,
  );
  const airports = useApiResource<{ airConnectivity: AirConnectivityResult | null }>(
    lat !== undefined && lon !== undefined ? `/api/airports?lat=${lat}&lon=${lon}` : null,
  );
  const events = useApiResource<{ result: TicketmasterResult | null; keyConfigured: boolean }>(
    archetype === "event" && city ? `/api/events?city=${encodeURIComponent(city.cityName)}&countryCode=${city.countryCode}` : null,
  );
  const wiki = useApiResource<{ summary: WikiSummary | null }>(city ? `/api/wiki?title=${encodeURIComponent(city.cityName)}` : null);

  const populationRv = liveResolvedValue(
    "context.population",
    "Population",
    country.data?.worldBank.population?.latest
      ? { value: country.data.worldBank.population.latest.value, source: country.data.worldBank.population.source }
      : null,
  );
  const gdpRv = liveResolvedValue(
    "context.gdp",
    "GDP",
    country.data?.worldBank.gdp?.latest
      ? { value: country.data.worldBank.gdp.latest.value, source: country.data.worldBank.gdp.source }
      : null,
    "USD",
  );
  const gdpPerCapitaRv = liveResolvedValue(
    "context.gdpPerCapita",
    "GDP per capita",
    country.data?.worldBank.gdpPerCapita?.latest
      ? { value: country.data.worldBank.gdpPerCapita.latest.value, source: country.data.worldBank.gdpPerCapita.source }
      : null,
    "USD",
  );
  const arrivalsRv = liveResolvedValue(
    "context.touristArrivals",
    "Inbound tourist arrivals",
    country.data?.worldBank.touristArrivals?.latest
      ? { value: country.data.worldBank.touristArrivals.latest.value, source: country.data.worldBank.touristArrivals.source }
      : null,
  );
  const receiptsRv = liveResolvedValue(
    "context.touristReceipts",
    "Tourism receipts",
    country.data?.worldBank.touristReceipts?.latest
      ? { value: country.data.worldBank.touristReceipts.latest.value, source: country.data.worldBank.touristReceipts.source }
      : null,
    "USD",
  );
  const hotelRoomsRv = liveResolvedValue(
    "context.hotelRooms",
    "Hotel room supply (15km)",
    hotels.data?.hotels ? { value: hotels.data.hotels.estimatedRooms, source: hotels.data.hotels.source } : null,
    "rooms",
  );
  const airRv = liveResolvedValue(
    "context.airSeatCapacityProxy",
    "Air connectivity proxy",
    airports.data?.airConnectivity
      ? { value: airports.data.airConnectivity.seatCapacityProxyScore, source: airports.data.airConnectivity.source }
      : null,
    "/100",
  );
  const climateRv = liveResolvedValue(
    "context.climateSuitabilityIndex",
    "Climate Suitability Index",
    climate.data?.climate
      ? { value: climate.data.climate.climateSuitabilityIndex, source: climate.data.climate.source }
      : null,
    "/100",
  );
  const attractionsCountRv = liveResolvedValue(
    "context.comparableAttractions",
    "Comparable attractions nearby",
    attractions.data?.result ? { value: attractions.data.result.attractions.length, source: { name: "OpenStreetMap Overpass API", url: "https://overpass-api.de/", license: "ODbL", retrievedAt: new Date().toISOString() } } : null,
  );

  const registered = React.useRef(new Set<string>());
  React.useEffect(() => {
    for (const rv of [populationRv, gdpRv, gdpPerCapitaRv, arrivalsRv, receiptsRv, hotelRoomsRv, airRv, climateRv, attractionsCountRv]) {
      if (rv && !registered.current.has(rv.key)) {
        registered.current.add(rv.key);
        registerResolvedValue(rv);
      }
    }
  }, [populationRv, gdpRv, gdpPerCapitaRv, arrivalsRv, receiptsRv, hotelRoomsRv, airRv, climateRv, attractionsCountRv, registerResolvedValue]);

  const coreLoading = country.loading || climate.loading;
  const allSettled = !country.loading && !climate.loading && !hotels.loading && !airports.loading && !attractions.loading;

  React.useEffect(() => {
    if (allSettled) {
      setCityContext({
        countryProfile: country.data?.profile,
        worldBank: country.data?.worldBank,
        climate: climate.data?.climate,
        hotels: hotels.data?.hotels,
        attractions: attractions.data?.result,
        siteArea: siteArea.data?.site,
        airConnectivity: airports.data?.airConnectivity,
        events: events.data?.result,
        wiki: wiki.data?.summary,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSettled]);

  if (!city || !archetype) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Go back to Step 1 and pick a city and product archetype first.
        </CardContent>
      </Card>
    );
  }

  const pois = [
    ...(attractions.data?.result?.attractions.slice(0, 15).map((a) => ({ id: a.id, name: a.name, lat: a.lat, lon: a.lon, kind: "attraction" as const })) ?? []),
    ...(airports.data?.airConnectivity?.airports.map((a) => ({ id: a.ident, name: a.name, lat: lat!, lon: lon!, kind: "airport" as const })) ?? []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">City Context Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Auto-built evidence base for {city.cityName}, {city.countryName}. Every card is source-tagged — hover the{" "}
          <Badge variant="outline" className="mx-0.5">i</Badge> icon for provenance.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard rv={populationRv} icon={Users} loading={coreLoading} />
        <KpiCard rv={gdpPerCapitaRv} icon={Landmark} loading={coreLoading} />
        <KpiCard
          rv={arrivalsRv}
          icon={TrendingUp}
          loading={coreLoading}
          trend={
            country.data?.worldBank.touristArrivals?.growthPercent != null
              ? `${country.data.worldBank.touristArrivals.growthPercent >= 0 ? "+" : ""}${country.data.worldBank.touristArrivals.growthPercent.toFixed(0)}% over tracked period`
              : undefined
          }
        />
        <KpiCard rv={receiptsRv} icon={Landmark} loading={coreLoading} />
        <KpiCard rv={hotelRoomsRv} icon={Hotel} loading={hotels.loading} />
        <KpiCard rv={airRv} icon={Plane} loading={airports.loading} />
        <KpiCard rv={climateRv} icon={Sun} loading={climate.loading} />
        <KpiCard rv={attractionsCountRv} icon={MapPinned} loading={attractions.loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Location & catchment</CardTitle>
            <CardDescription>City center with 50km / 100km catchment rings, competitors, and airports.</CardDescription>
          </CardHeader>
          <CardContent>
            <CityMap lat={city.lat} lon={city.lon} pois={pois} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Seasonality</CardTitle>
            <CardDescription>
              Share of days per month suitable for outdoor tourism ({climate.data?.climate?.yearAnalyzed ?? "—"} historical data).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {climate.loading ? (
              <Skeleton className="h-56 w-full" />
            ) : climate.data?.climate ? (
              <SeasonalityChart monthly={climate.data.climate.monthly} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Open-Meteo had no historical data for this location — set a seasonality assumption manually in Step 3.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparable attractions & events nearby</CardTitle>
          <CardDescription>Feeds the competitive-differentiation pillar and archetype-specific models.</CardDescription>
        </CardHeader>
        <CardContent>
          {attractions.loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : attractions.data?.result?.attractions.length ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {attractions.data.result.attractions.slice(0, 10).map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span className="truncate">{a.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{a.distanceKm} km · {a.category}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No comparable OSM-tagged attractions found within 25km.</p>
          )}

          {archetype === "event" && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Comparable ticketed events (Ticketmaster)
              </p>
              {!events.data?.keyConfigured ? (
                <p className="text-sm text-muted-foreground">
                  No <code>TICKETMASTER_API_KEY</code> configured — comparable-event pricing will use a cited benchmark default
                  in Step 3 instead of live data. Add the free key anytime to switch this to live data.
                </p>
              ) : events.loading ? (
                <Skeleton className="h-16 w-full" />
              ) : events.data?.result?.events.length ? (
                <ul className="space-y-1.5 text-sm">
                  {events.data.result.events.slice(0, 5).map((e) => (
                    <li key={e.id} className="flex justify-between gap-2">
                      <span className="truncate">{e.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {e.priceMin ? `$${e.priceMin}–$${e.priceMax}` : "price n/a"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No comparable events returned for this city right now.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {wiki.data?.summary && (
        <Card>
          <CardHeader>
            <CardTitle>About {city.cityName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{wiki.data.summary.extract}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button size="lg" disabled={coreLoading} onClick={() => setStep(3)}>
          Configure the model
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
