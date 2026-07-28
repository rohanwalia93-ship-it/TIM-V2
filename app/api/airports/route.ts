import { NextRequest, NextResponse } from "next/server";
import { getAirConnectivity } from "@/lib/sources/ourAirports";

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  const radius = Number(req.nextUrl.searchParams.get("radius") ?? "100");
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "Missing/invalid lat,lon" }, { status: 400 });
  }
  const airConnectivity = await getAirConnectivity(lat, lon, radius);
  return NextResponse.json({ airConnectivity });
}
