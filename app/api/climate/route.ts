import { NextRequest, NextResponse } from "next/server";
import { getClimateSuitability } from "@/lib/sources/openMeteo";

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lon = Number(req.nextUrl.searchParams.get("lon"));
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "Missing/invalid lat,lon" }, { status: 400 });
  }
  const climate = await getClimateSuitability(lat, lon);
  return NextResponse.json({ climate });
}
