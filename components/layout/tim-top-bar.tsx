"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Compass, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/generated/prisma/client";

const NAV = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/methodology", label: "Methodology" },
  { href: "/data-health", label: "Data Health" },
  { href: "/admin", label: "Admin" },
];

export function TimTopBar({ user }: { user: { email?: string | null; name?: string | null; role: Role } }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/portfolio" className="flex items-center gap-2 font-semibold">
            <Compass className="h-5 w-5 text-accent" />
            TIM
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                asChild
                className={cn(pathname === item.href && "bg-muted")}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right text-xs leading-tight sm:block">
            <p className="font-medium">{user.name || user.email}</p>
            <p className="text-muted-foreground">{user.role}</p>
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="icon" title="Sign out" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
