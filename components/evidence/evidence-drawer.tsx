"use client";

import { Info } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { EvidenceValue } from "@/lib/generated/prisma/client";

const STATUS_LABEL: Record<string, string> = {
  LIVE: "Live observed data",
  PUBLISHED: "Published historical data",
  BENCHMARK: "Cited industry benchmark",
  ASSUMPTION: "User assumption",
  CLIENT_UPLOAD: "Client-provided data",
};

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function EvidenceDrawer({ metricLabel, current, history }: { metricLabel: string; current: EvidenceValue; history: EvidenceValue[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="inline-flex items-center gap-1 text-xs text-accent hover:underline" aria-label={`View provenance for ${metricLabel}`}>
          <Info className="h-3.5 w-3.5" />
          Provenance
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{metricLabel}</SheetTitle>
          <SheetDescription>Full traceability for the current value, plus any superseded values.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="mb-4 flex items-center gap-2">
            <Badge variant={current.status === "LIVE" || current.status === "PUBLISHED" ? "go" : current.status === "BENCHMARK" ? "conditional" : "outline"}>
              {STATUS_LABEL[current.status]}
            </Badge>
            <Badge variant="outline">{current.confidence} confidence</Badge>
          </div>
          <Row label="Value" value={`${current.value ?? "—"} ${current.unit}`} />
          <Row label="Geography" value={current.geography} />
          <Row label="Period" value={current.periodStart ? `${current.periodStart.toLocaleDateString()} – ${current.periodEnd?.toLocaleDateString() ?? "—"}` : undefined} />
          <Row label="Price basis" value={current.priceBasis} />
          <Row label="Source" value={current.sourceName} />
          {current.sourceUrl && (
            <div className="flex justify-between gap-4 border-b border-border py-2 text-sm">
              <span className="text-muted-foreground">Source URL</span>
              <a href={current.sourceUrl} target="_blank" rel="noreferrer" className="truncate text-accent hover:underline">
                {current.sourceUrl}
              </a>
            </div>
          )}
          <Row label="Dataset ID" value={current.datasetId} />
          <Row label="Retrieved" value={current.retrievedAt.toLocaleString()} />
          <Row label="Published" value={current.publicationDate?.toLocaleDateString()} />
          <Row label="License" value={current.license} />
          <Row label="Transformation" value={current.transformation} />
          <Row label="Owner" value={current.owner} />
          <Row label="Approved by" value={current.approvedBy} />
          {current.overrideReason && (
            <>
              <Row label="Override reason" value={current.overrideReason} />
              <Row label="Overridden at" value={current.overriddenAt?.toLocaleString()} />
            </>
          )}
          {current.notes && (
            <div className="mt-3 rounded-md bg-muted p-3 text-xs">
              <p className="mb-1 font-medium text-muted-foreground">Notes</p>
              <p>{current.notes}</p>
            </div>
          )}

          {history.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Superseded values ({history.length}) — kept for audit, never silently averaged
              </p>
              <ul className="space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="rounded-md border border-border p-2 text-xs">
                    <p className="font-medium">
                      {h.value} {h.unit} · {STATUS_LABEL[h.status]}
                    </p>
                    <p className="text-muted-foreground">
                      {h.sourceName} · recorded {h.createdAt.toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
