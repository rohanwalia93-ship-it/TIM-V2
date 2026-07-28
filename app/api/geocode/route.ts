import { NextRequest, NextResponse } from "next/server";
import { searchCities } from "@/lib/sources/nominatim";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = await searchCities(q);
  return NextResponse.json({ results });
}
