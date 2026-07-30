"use client";

import * as React from "react";
import { RotateCcw, CheckCircle2, AlertTriangle, XCircle, ShieldAlert, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApiResource } from "@/lib/hooks/useApiResource";
import type { AdapterHealth, AdapterStatus } from "@/lib/sources/health";

const STATUS_META: Record<AdapterStatus, { label: string; icon: typeof CheckCircle2; badge: "go" | "conditional" | "nogo" | "outline" }> = {
  connected: { label: "Connected", icon: CheckCircle2, badge: "go" },
  stale: { label: "Stale", icon: Clock, badge: "conditional" },
  "rate-limited": { label: "Rate-limited", icon: AlertTriangle, badge: "conditional" },
  unavailable: { label: "Unavailable", icon: XCircle, badge: "nogo" },
  "authentication-required": { label: "Authentication required", icon: ShieldAlert, badge: "outline" },
};

export function DataHealthPanel() {
  const [nonce, setNonce] = React.useState(0);
  const { data, loading } = useApiResource<{ adapters: AdapterHealth[]; checkedAt: string }>(`/api/data-health?t=${nonce}`);

  const counts = React.useMemo(() => {
    const c: Record<AdapterStatus, number> = { connected: 0, stale: 0, "rate-limited": 0, unavailable: 0, "authentication-required": 0 };
    for (const a of data?.adapters ?? []) c[a.status]++;
    return c;
  }, [data]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Live adapter status</CardTitle>
            <CardDescription>
              Each source is probed directly (bypassing the app&apos;s own cache) so this reflects the upstream&apos;s
              real state right now, not a cached success from earlier.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setNonce((n) => n + 1)} disabled={loading}>
            <RotateCcw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            Recheck
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(Object.keys(STATUS_META) as AdapterStatus[]).map((s) => (
              <div key={s} className="rounded-md border border-border p-2 text-center">
                <p className="text-lg font-semibold tabular-nums">{counts[s]}</p>
                <p className="text-[11px] text-muted-foreground">{STATUS_META[s].label}</p>
              </div>
            ))}
          </div>

          {loading && !data ? (
            <p className="text-sm text-muted-foreground">Checking adapters…</p>
          ) : (
            <div className="space-y-2">
              {(data?.adapters ?? []).map((a) => {
                const meta = STATUS_META[a.status];
                const Icon = meta.icon;
                return (
                  <div key={a.key} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
                    <div className="min-w-[200px] flex-1">
                      <p className="font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.detail}</p>
                    </div>
                    {a.latencyMs !== null && <span className="text-xs text-muted-foreground">{a.latencyMs}ms</span>}
                    <Badge variant={meta.badge} className="gap-1">
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
