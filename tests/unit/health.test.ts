import { describe, it, expect, vi, afterEach } from "vitest";

describe("adapter health status classification", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("reports authentication-required for Ticketmaster when no key is configured, without a network call", async () => {
    vi.stubEnv("TICKETMASTER_API_KEY", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { checkAllAdapters } = await import("@/lib/sources/health");
    const results = await checkAllAdapters();
    const ticketmaster = results.find((r) => r.key === "ticketmaster")!;
    expect(ticketmaster.status).toBe("authentication-required");
  });

  it("maps a bare HTTP 403 to unavailable, not authentication-required (proxy/WAF blocks aren't a missing-key signal)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("blocked", { status: 403 })),
    );
    const { checkAllAdapters } = await import("@/lib/sources/health");
    const results = await checkAllAdapters();
    const nominatim = results.find((r) => r.key === "nominatim")!;
    expect(nominatim.status).toBe("unavailable");
  });

  it("maps HTTP 429 to rate-limited", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("too many", { status: 429 })),
    );
    const { checkAllAdapters } = await import("@/lib/sources/health");
    const results = await checkAllAdapters();
    const nominatim = results.find((r) => r.key === "nominatim")!;
    expect(nominatim.status).toBe("rate-limited");
  });

  it("maps a successful response to connected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("[]", { status: 200 })),
    );
    const { checkAllAdapters } = await import("@/lib/sources/health");
    const results = await checkAllAdapters();
    const nominatim = results.find((r) => r.key === "nominatim")!;
    expect(nominatim.status).toBe("connected");
  });
});
