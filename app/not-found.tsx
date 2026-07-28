import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <Compass className="h-10 w-10 text-accent" />
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        That page doesn&apos;t exist. Start a new viability scenario from the homepage instead.
      </p>
      <Button asChild>
        <Link href="/">Back to TourViable</Link>
      </Button>
    </div>
  );
}
