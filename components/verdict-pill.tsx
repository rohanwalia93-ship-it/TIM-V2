import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Verdict } from "@/lib/scoring/viabilityIndex";

const CONFIG: Record<Verdict, { label: string; icon: typeof CheckCircle2; classes: string }> = {
  GO: { label: "GO", icon: CheckCircle2, classes: "bg-go-bg text-go border-go-border" },
  CONDITIONAL: {
    label: "CONDITIONAL",
    icon: AlertTriangle,
    classes: "bg-conditional-bg text-conditional border-conditional-border",
  },
  "NO-GO": { label: "NO-GO", icon: XCircle, classes: "bg-nogo-bg text-nogo border-nogo-border" },
};

export function VerdictPill({ verdict, size = "md" }: { verdict: Verdict | null; size?: "sm" | "md" | "lg" }) {
  if (!verdict) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
        Not yet run
      </span>
    );
  }
  const { label, icon: Icon, classes } = CONFIG[verdict];
  const sizeClasses = size === "lg" ? "px-4 py-2 text-base" : size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-sm";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border font-semibold", classes, sizeClasses)}>
      <Icon className={size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5"} />
      {label}
    </span>
  );
}
