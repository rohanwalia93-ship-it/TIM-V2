"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { PortfolioMapPin } from "@/components/portfolio/portfolio-map-inner";

const PortfolioMapInner = dynamic(() => import("@/components/portfolio/portfolio-map-inner").then((m) => m.PortfolioMapInner), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

export function PortfolioMap({ pins }: { pins: PortfolioMapPin[] }) {
  return (
    <div className="h-72 w-full overflow-hidden rounded-lg border border-border sm:h-80">
      <PortfolioMapInner pins={pins} />
    </div>
  );
}
