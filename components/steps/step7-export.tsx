"use client";

import * as React from "react";
import { Download, Link2, Check, BookOpen } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScenarioStore } from "@/lib/store/scenarioStore";
import { buildShareUrl } from "@/lib/share";
import type { ReportPayload } from "@/lib/pdf/types";

export function Step7Export() {
  const state = useScenarioStore();
  const [downloading, setDownloading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canExport = Boolean(state.results.viability && state.results.dcf && state.results.archetypeResult);

  async function handleDownload() {
    if (!canExport) return;
    setDownloading(true);
    setError(null);
    try {
      const payload: ReportPayload = {
        cityName: state.city?.cityName ?? "",
        countryName: state.city?.countryName ?? "",
        archetype: state.archetype ?? "",
        product: state.product ?? "",
        objective: state.objective,
        generatedAt: new Date().toISOString(),
        viability: state.results.viability!,
        dcf: state.results.dcf!,
        discountRate: state.results.discountRate ?? 0,
        archetypeResult: state.results.archetypeResult!,
        resolvedValues: Object.values(state.resolvedValues),
      };
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Report generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TourViable-${(state.city?.cityName ?? "report").replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't generate the PDF — please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopyLink() {
    const url = buildShareUrl(state);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy the link — your browser may be blocking clipboard access.");
    }
  }

  if (!canExport) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Run the model and reach a verdict before exporting.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Export</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A branded, board-ready PDF and a shareable link — everything a stakeholder needs without touching the tool.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              PDF report
            </CardTitle>
            <CardDescription>Executive summary, methodology appendix, and full data-provenance table.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDownload} disabled={downloading} className="w-full">
              {downloading ? "Generating…" : "Download PDF"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Shareable link
            </CardTitle>
            <CardDescription>Encodes this full scenario — opening it reproduces the same verdict.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCopyLink} variant="outline" className="w-full">
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copied!
                </>
              ) : (
                "Copy link"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            Want the full academic basis for every formula?
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/methodology">Read the methodology</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
