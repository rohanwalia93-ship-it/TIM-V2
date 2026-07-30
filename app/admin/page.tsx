import { ShieldAlert } from "lucide-react";
import { auth } from "@/lib/auth";
import { TimTopBar } from "@/components/layout/tim-top-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) return null;

  const isAdmin = session.user.role === "ADMINISTRATOR";

  return (
    <div className="min-h-screen bg-background">
      <TimTopBar user={session.user} />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        {!isAdmin ? (
          <Card className="mt-6 border-nogo-border">
            <CardContent className="flex items-center gap-3 p-6 text-sm">
              <ShieldAlert className="h-5 w-5 shrink-0 text-nogo" />
              <p>
                Your role is <strong>{session.user.role}</strong>. Admin settings (thresholds, weights, sources, model
                versions) are restricted to the Administrator role. Sign in with an Administrator account to view this
                page.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Not yet built</CardTitle>
              <CardDescription>
                This is where an Administrator will manage versioned, effective-dated Gate 3/5 thresholds and MCDA
                weights (the <code>ConfigVersion</code>{" "}
                model in the schema), source adapters, and calculation-engine versions. Scheduled as part of Phase 7
                (gates/MCDA) — access control is already enforced (you&apos;re seeing this because your role is
                Administrator), but the configuration UI itself doesn&apos;t exist yet.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>
    </div>
  );
}
