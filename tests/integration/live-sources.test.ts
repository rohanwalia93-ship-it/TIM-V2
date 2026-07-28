/**
 * Data-integrity suite: hits every free live API in lib/sources/* for real.
 * Requires outbound internet access — run with `npm run test:integration`.
 * Not part of the default `npm test` run, since CI/sandboxed environments
 * often restrict outbound network access.
 */
import { describe, it, expect } from "vitest";
import { getWorldBankIndicator } from "@/lib/sources/worldbank";
import { searchCities } from "@/lib/sources/nominatim";
import { getHotelSupply, getComparableAttractions } from "@/lib/sources/overpass";
import { getClimateSuitability } from "@/lib/sources/openMeteo";
import { getCountryProfile } from "@/lib/sources/restCountries";
import { getAirConnectivity } from "@/lib/sources/ourAirports";
import { getFxRate } from "@/lib/sources/fx";
import { getWikiSummary } from "@/lib/sources/wikipedia";

const ABU_DHABI = { lat: 24.4539, lon: 54.3773 };

describe("live data sources", () => {
  it("World Bank returns a real inbound-arrivals series for a known country", async () => {
    const result = await getWorldBankIndicator("AE", "touristArrivals");
    expect(result).not.toBeNull();
    expect(result!.source.license).toBe("CC BY 4.0");
  });

  it("Nominatim resolves a well-known city", async () => {
    const results = await searchCities("Abu Dhabi");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].countryCode.toLowerCase()).toBe("ae");
  });

  it("Overpass returns hotel supply near a major city", async () => {
    const result = await getHotelSupply(ABU_DHABI.lat, ABU_DHABI.lon, 20);
    expect(result).not.toBeNull();
  });

  it("Overpass returns comparable attractions near a major city", async () => {
    const result = await getComparableAttractions(ABU_DHABI.lat, ABU_DHABI.lon, 30);
    expect(result).not.toBeNull();
  });

  it("Open-Meteo returns a historical climate series", async () => {
    const result = await getClimateSuitability(ABU_DHABI.lat, ABU_DHABI.lon);
    expect(result).not.toBeNull();
    expect(result!.monthly.length).toBe(12);
  });

  it("REST Countries returns a country profile", async () => {
    const result = await getCountryProfile("AE");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("United Arab Emirates");
  });

  it("OurAirports returns nearby airports", async () => {
    const result = await getAirConnectivity(ABU_DHABI.lat, ABU_DHABI.lon, 100);
    expect(result).not.toBeNull();
    expect(result!.airports.length).toBeGreaterThan(0);
  });

  it("Frankfurter returns an FX rate", async () => {
    const result = await getFxRate("USD", "AED");
    expect(result).not.toBeNull();
    expect(result!.rate).toBeGreaterThan(0);
  });

  it("Wikipedia returns a summary for a well-known place", async () => {
    const result = await getWikiSummary("Abu Dhabi");
    expect(result).not.toBeNull();
    expect(result!.extract.length).toBeGreaterThan(0);
  });
});
