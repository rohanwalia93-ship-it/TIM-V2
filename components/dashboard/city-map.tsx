"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapPoi } from "@/components/dashboard/city-map-inner";

const CityMapInner = dynamic(() => import("@/components/dashboard/city-map-inner").then((m) => m.CityMapInner), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export function CityMap({ lat, lon, pois }: { lat: number; lon: number; pois: MapPoi[] }) {
  return (
    <div className="h-72 w-full overflow-hidden rounded-lg border border-border sm:h-80">
      <CityMapInner lat={lat} lon={lon} pois={pois} />
    </div>
  );
}
