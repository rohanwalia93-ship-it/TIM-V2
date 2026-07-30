import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { Role } from "@/lib/generated/prisma/client";
import { authConfig } from "@/lib/auth.config";

/**
 * DEV-MODE AUTH — not for production.
 *
 * The rebuild brief calls for NextAuth/Entra-ID-ready auth with 5 roles (Analyst, Reviewer,
 * Approver, Administrator, Viewer). Wiring a real Entra ID app registration needs a tenant ID,
 * client ID, and client secret that only the destination authority can provide. Until those
 * exist, this Credentials provider is a placeholder: it takes an email + a self-selected role
 * (no password), upserts a User row, and issues a normal JWT session — so every RBAC check
 * downstream (session.user.role) is already wired against the real shape. Swapping in
 * `AzureADProvider({ clientId, clientSecret, tenantId })` later is additive: it doesn't touch
 * the Prisma schema, the session shape, or any role-gated route/component.
 *
 * This file (unlike auth.config.ts) touches Prisma, so it must never be imported from
 * middleware.ts — middleware runs on the Edge runtime, which can't load the Prisma client.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "dev-login",
      name: "Dev login (no password — replace with Entra ID before production)",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        if (!email || !email.includes("@")) return null;
        const requestedRole = String(credentials?.role ?? "ANALYST").toUpperCase();
        const role = (Object.values(Role) as string[]).includes(requestedRole)
          ? (requestedRole as Role)
          : Role.ANALYST;
        const name = String(credentials?.name ?? "").trim() || email.split("@")[0];

        const user = await db.user.upsert({
          where: { email },
          update: { name, role },
          create: { email, name, role },
        });

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
