"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addEvidenceValue } from "@/app/portfolio/[id]/evidence/actions";
import type { EvidenceCategory, EvidenceStatus, Confidence } from "@/lib/generated/prisma/client";
import { EVIDENCE_CATEGORY_LABELS } from "@/lib/evidence-catalog";

const STATUSES = [
  { value: "LIVE", label: "Live observed data" },
  { value: "PUBLISHED", label: "Published historical data" },
  { value: "BENCHMARK", label: "Cited industry benchmark" },
  { value: "ASSUMPTION", label: "User assumption" },
  { value: "CLIENT_UPLOAD", label: "Client-provided data" },
];
const CONFIDENCES = ["HIGH", "MEDIUM", "LOW"];

export function AddEvidenceDialog({
  scenarioId,
  category,
  metricKey,
  metricLabel,
  trigger,
}: {
  scenarioId: string;
  category: EvidenceCategory;
  metricKey: string;
  metricLabel: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    value: "",
    unit: "",
    geography: "",
    periodStart: "",
    periodEnd: "",
    status: "ASSUMPTION" as EvidenceStatus,
    sourceName: "",
    sourceUrl: "",
    confidence: "LOW" as Confidence,
    notes: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addEvidenceValue({
        scenarioId,
        category,
        metric: metricKey,
        metricLabel,
        ...form,
      });
      setOpen(false);
      setForm({ value: "", unit: "", geography: "", periodStart: "", periodEnd: "", status: "ASSUMPTION", sourceName: "", sourceUrl: "", confidence: "LOW", notes: "" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Plus className="h-3.5 w-3.5" />
            Add evidence
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{metricLabel}</DialogTitle>
          <DialogDescription>
            {EVIDENCE_CATEGORY_LABELS[category]} — every field below becomes part of the permanent provenance
            record for this scenario.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="value">Value</Label>
              <Input id="value" required value={form.value} onChange={(e) => set("value", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" required value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="e.g. visitors/yr, USD, %" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="geography">Geography</Label>
            <Input id="geography" required value={form.geography} onChange={(e) => set("geography", e.target.value)} placeholder="e.g. Abu Dhabi city, UAE national" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="periodStart">Period start</Label>
              <Input id="periodStart" type="date" value={form.periodStart} onChange={(e) => set("periodStart", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="periodEnd">Period end</Label>
              <Input id="periodEnd" type="date" value={form.periodEnd} onChange={(e) => set("periodEnd", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Input status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as EvidenceStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Confidence</Label>
              <Select value={form.confidence} onValueChange={(v) => set("confidence", v as Confidence)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONFIDENCES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0) + c.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sourceName">Source name</Label>
            <Input id="sourceName" required value={form.sourceName} onChange={(e) => set("sourceName", e.target.value)} placeholder="e.g. DCT Abu Dhabi visitor statistics 2025" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sourceUrl">Source URL (optional)</Label>
            <Input id="sourceUrl" value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Transformation applied, caveats, why this confidence level." />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving…" : "Save evidence"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
