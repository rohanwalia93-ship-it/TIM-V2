import { auth } from "@/lib/auth";
import { TimTopBar } from "@/components/layout/tim-top-bar";
import { DataHealthPanel } from "@/components/data-health/data-health-panel";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function DataHealthPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-background">
      <TimTopBar user={session.user} />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Data health</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Per brief §7: every source adapter reports connected / stale / rate-limited / unavailable /
          authentication-required — never a silent success.
        </p>

        <div className="mt-6">
          <DataHealthPanel />
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Still to come</CardTitle>
            <CardDescription>
              The per-scenario &quot;data gaps blocking decision&quot; panel already lives on each scenario&apos;s
              Evidence plan page (Stage 2). What&apos;s not built yet: wiring these adapter statuses into that page
              so a scenario&apos;s evidence rows show &quot;sourced from a currently-unavailable adapter&quot; inline,
              and scheduled background re-checks instead of on-demand only.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    </div>
  );
}
