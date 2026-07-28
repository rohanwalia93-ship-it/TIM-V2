"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SourceBadge } from "@/components/provenance/source-badge";
import type { ResolvedValue } from "@/lib/sources/types";

export function NumberField({
  resolvedValue,
  value,
  onChange,
  min,
  max,
  step,
}: {
  resolvedValue: ResolvedValue<number>;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={resolvedValue.key} className="text-xs">
          {resolvedValue.label}
          {resolvedValue.unit ? <span className="text-muted-foreground"> ({resolvedValue.unit})</span> : null}
        </Label>
        <SourceBadge rv={{ ...resolvedValue, value }} />
      </div>
      <Input
        id={resolvedValue.key}
        type="number"
        min={min}
        max={max}
        step={step ?? "any"}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      />
    </div>
  );
}
