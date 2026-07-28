import { NextRequest, NextResponse } from "next/server";
import { getFxRate } from "@/lib/sources/fx";

export async function GET(req: NextRequest) {
  const base = req.nextUrl.searchParams.get("base") ?? "USD";
  const target = req.nextUrl.searchParams.get("target") ?? "USD";
  const fx = await getFxRate(base, target);
  return NextResponse.json({ fx });
}
