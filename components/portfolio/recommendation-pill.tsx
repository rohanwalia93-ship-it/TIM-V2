import { CheckCircle2, AlertTriangle, PlayCircle, HelpCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/lib/generated/prisma/client";

const CONFIG: Record<Recommendation, { label: string; icon: typeof CheckCircle2; classes: string }> = {
  PROCEED: { label: "PROCEED", icon: CheckCircle2, classes: "bg-go-bg text-go border-go-border" },
  PROCEED_SUBJECT_TO_CONDITIONS: {
    label: "PROCEED SUBJECT TO CONDITIONS",
    icon: AlertTriangle,
    classes: "bg-conditional-bg text-conditional border-conditional-border",
  },
  PILOT_PHASE: { label: "PILOT / PHASE", icon: PlayCircle, classes: "bg-conditional-bg text-conditional border-conditional-border" },
  DEFER_PENDING_EVIDENCE: {
    label: "DEFER PENDING EVIDENCE",
    icon: HelpCircle,
    classes: "border-border bg-muted text-muted-foreground",
  },
  DO_NOT_PROCEED: { label: "DO NOT PROCEED", icon: XCircle, classes: "bg-nogo-bg text-nogo border-nogo-border" },
};

export function RecommendationPill({ recommendation, size = "md" }: { recommendation: Recommendation | null | undefined; size?: "sm" | "md" | "lg" }) {
  if (!recommendation) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
        Not yet assessed
      </span>
    );
  }
  const { label, icon: Icon, classes } = CONFIG[recommendation];
  const sizeClasses = size === "lg" ? "px-4 py-2 text-base" : size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-sm";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border font-semibold", classes, sizeClasses)}>
      <Icon className={size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5"} />
      {label}
    </span>
  );
}
