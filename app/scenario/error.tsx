"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ScenarioErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-nogo" />
          <p className="font-medium">This step hit an error</p>
          <p className="text-sm text-muted-foreground">
            Your scenario data is untouched — try again, or go back a step and re-enter any unusual values.
          </p>
          <Button onClick={reset}>Retry this step</Button>
        </CardContent>
      </Card>
    </div>
  );
}
