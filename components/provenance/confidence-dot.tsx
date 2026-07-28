import { cn } from "@/lib/utils";
import type { Confidence } from "@/lib/sources/types";

const COLOR: Record<Confidence, string> = {
  high: "bg-confidence-high",
  medium: "bg-confidence-medium",
  low: "bg-confidence-low",
};

const LABEL: Record<Confidence, string> = {
  high: "High confidence — live API data",
  medium: "Medium confidence — cited benchmark default",
  low: "Low confidence — user assumption",
};

export function ConfidenceDot({ confidence, className }: { confidence: Confidence; className?: string }) {
  return (
    <span
      role="img"
      aria-label={LABEL[confidence]}
      title={LABEL[confidence]}
      className={cn("inline-block h-2 w-2 shrink-0 rounded-full", COLOR[confidence], className)}
    />
  );
}
