"use client";

import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConfidenceDot } from "@/components/provenance/confidence-dot";
import { formatDate } from "@/lib/utils";
import type { ResolvedValue } from "@/lib/sources/types";

export function SourceBadge({ rv }: { rv: ResolvedValue }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-border"
          aria-label={`Data source for ${rv.label}`}
        >
          <ConfidenceDot confidence={rv.confidence} />
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="text-xs">
        <div className="space-y-1.5">
          <p className="font-semibold text-card-foreground">{rv.label}</p>
          <p className="text-muted-foreground">
            <span className="font-medium text-card-foreground">Source: </span>
            {rv.source.name}
          </p>
          {rv.source.url && (
            <a
              href={rv.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-accent underline-offset-2 hover:underline"
            >
              {rv.source.url}
            </a>
          )}
          <p className="text-muted-foreground">
            <span className="font-medium text-card-foreground">License: </span>
            {rv.source.license}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-card-foreground">Retrieved: </span>
            {formatDate(rv.source.retrievedAt)}
          </p>
          <p className="flex items-center gap-1.5">
            <ConfidenceDot confidence={rv.confidence} />
            <span className="capitalize text-card-foreground">{rv.confidence} confidence</span>
          </p>
          {rv.note && <p className="italic text-muted-foreground">{rv.note}</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
