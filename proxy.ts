import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Deliberately built from the Edge-safe authConfig (no Prisma) rather than importing
// lib/auth.ts's full config — see the comment at the top of lib/auth.config.ts.
const { auth } = NextAuth(authConfig);

const PROTECTED_PREFIXES = ["/portfolio", "/admin", "/data-health"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/portfolio/:path*", "/admin/:path*", "/data-health/:path*"],
};
