"use client";

import * as React from "react";
import { Database } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfidenceDot } from "@/components/provenance/confidence-dot";
import { useScenarioStore } from "@/lib/store/scenarioStore";
import { formatDate } from "@/lib/utils";
import { overallConfidence } from "@/lib/resolveInput";

export function AssumptionsDrawer() {
  const resolvedValues = useScenarioStore((s) => s.resolvedValues);
  const values = React.useMemo(() => Object.values(resolvedValues), [resolvedValues]);
  const confidence = React.useMemo(() => overallConfidence(values), [values]);

  const counts = React.useMemo(
    () => ({
      high: values.filter((v) => v.confidence === "high").length,
      medium: values.filter((v) => v.confidence === "medium").length,
      low: values.filter((v) => v.confidence === "low").length,
    }),
    [values],
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start gap-2">
          <Database className="h-4 w-4" />
          Data & Assumptions
          <Badge variant="outline" className="ml-auto capitalize">
            {confidence}
          </Badge>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Data & Assumptions</SheetTitle>
          <SheetDescription>
            Every figure behind this scenario, with its origin, timestamp, and confidence. High = live API,
            Medium = cited benchmark, Low = your assumption.
          </SheetDescription>
        </SheetHeader>
        <div className="mb-3 flex gap-2 text-xs">
          <Badge variant="go">{counts.high} live</Badge>
          <Badge variant="conditional">{counts.medium} benchmark</Badge>
          <Badge variant="default">{counts.low} assumption</Badge>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {values.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No data resolved yet — values will appear here as you move through the value chain.
            </p>
          )}
          {values.map((rv) => (
            <div key={rv.key} className="rounded-md border border-border p-3 text-xs">
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="font-medium text-card-foreground">{rv.label}</span>
                <span className="flex items-center gap-1 whitespace-nowrap text-muted-foreground">
                  <ConfidenceDot confidence={rv.confidence} />
                  <span className="capitalize">{rv.confidence}</span>
                </span>
              </div>
              <p className="text-card-foreground">
                {typeof rv.value === "number" ? rv.value.toLocaleString() : String(rv.value)}
                {rv.unit ? ` ${rv.unit}` : ""}
              </p>
              <p className="mt-1 text-muted-foreground">{rv.source.name}</p>
              <p className="text-muted-foreground">Retrieved {formatDate(rv.source.retrievedAt)}</p>
              {rv.note && <p className="mt-1 italic text-muted-foreground">{rv.note}</p>}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
