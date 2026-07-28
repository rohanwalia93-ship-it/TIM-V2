"use client";

import * as React from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import type { CitySearchResult } from "@/lib/sources/nominatim";
import { cn } from "@/lib/utils";

export function CitySearch({
  value,
  onSelect,
}: {
  value: CitySearchResult | null;
  onSelect: (city: CitySearchResult) => void;
}) {
  const [query, setQuery] = React.useState(value?.cityName ?? "");
  const [results, setResults] = React.useState<CitySearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const debouncedQuery = useDebouncedValue(query, 350);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const visibleResults = debouncedQuery.trim().length < 2 ? [] : results;

  React.useEffect(() => {
    if (!open || debouncedQuery.trim().length < 2) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicking off the fetch this effect exists for
    setLoading(true);
    fetch(`/api/geocode?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setResults(data.results ?? []);
      })
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search for a city, e.g. Abu Dhabi"
          className="pl-9"
          aria-label="City search"
          aria-expanded={open}
          role="combobox"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {open && visibleResults.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-card shadow-lg"
        >
          {visibleResults.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                role="option"
                aria-selected={value?.id === r.id}
                onClick={() => {
                  onSelect(r);
                  setQuery(r.cityName);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted",
                  value?.id === r.id && "bg-muted",
                )}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  <span className="block font-medium">{r.cityName}</span>
                  <span className="block text-xs text-muted-foreground">{r.displayName}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && debouncedQuery.trim().length >= 2 && visibleResults.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-card p-3 text-xs text-muted-foreground shadow-lg">
          No cities found for &quot;{debouncedQuery}&quot;.
        </div>
      )}
    </div>
  );
}
