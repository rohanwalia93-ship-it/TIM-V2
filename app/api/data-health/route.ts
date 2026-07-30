import { NextResponse } from "next/server";
import { checkAllAdapters } from "@/lib/sources/health";

export async function GET() {
  const adapters = await checkAllAdapters();
  return NextResponse.json({ adapters, checkedAt: new Date().toISOString() });
}
