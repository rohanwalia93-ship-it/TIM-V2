import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SourceBadge } from "@/components/provenance/source-badge";
import { cn } from "@/lib/utils";
import type { ResolvedValue } from "@/lib/sources/types";

export function KpiCard({
  rv,
  icon: Icon,
  loading,
  trend,
  className,
}: {
  rv: ResolvedValue<number> | null;
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="flex h-full flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {rv?.label ?? "—"}
          </span>
          {rv && <SourceBadge rv={rv} />}
        </div>
        {loading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <p className="text-2xl font-semibold tabular-nums leading-none">
            {rv ? `${rv.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}${rv.unit ? ` ${rv.unit}` : ""}` : "N/A"}
          </p>
        )}
        {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
      </CardContent>
    </Card>
  );
}
