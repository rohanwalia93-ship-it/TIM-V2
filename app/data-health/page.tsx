import { auth } from "@/lib/auth";
import { TimTopBar } from "@/components/layout/tim-top-bar";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function DataHealthPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-background">
      <TimTopBar user={session.user} />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Data health</h1>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Not yet built</CardTitle>
            <CardDescription>
              This will report each source adapter&apos;s status (connected / stale / rate-limited / unavailable /
              authentication-required) per the rebuild brief §7, plus the per-scenario &quot;data gaps blocking
              decision&quot; panel from Stage 2. Scheduled as Phase 4 of the rebuild (see AUDIT.md and the task
              list) — the existing <code>lib/sources/*</code>{" "}
              adapters return data or <code>null</code>{" "}
              today, not a first-class status, so this page is deliberately not shown as complete yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    </div>
  );
}
