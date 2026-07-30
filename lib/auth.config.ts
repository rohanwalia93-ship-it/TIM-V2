import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/generated/prisma/client";

/**
 * Edge-safe subset of the auth config — no Prisma import here (or anything else that
 * touches Node-only APIs), because Next.js middleware runs on the Edge runtime. The
 * Credentials provider (which does hit the database, in lib/auth.ts) is deliberately
 * left out of this file; middleware only needs to read the already-issued JWT.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.id = (user as { id: string }).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as Role;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
