import { NextRequest, NextResponse } from "next/server";
import { getNaturalSiteArea } from "@/lib/sources/overpass";

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  const radius = Number(req.nextUrl.searchParams.get("radius") ?? "20");
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "Missing/invalid lat,lon" }, { status: 400 });
  }
  const site = await getNaturalSiteArea(lat, lon, radius);
  return NextResponse.json({ site });
}
