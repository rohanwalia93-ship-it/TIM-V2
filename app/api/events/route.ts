import { NextRequest, NextResponse } from "next/server";
import { getComparableEvents, hasTicketmasterKey } from "@/lib/sources/ticketmaster";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  const countryCode = req.nextUrl.searchParams.get("countryCode");
  const keyword = req.nextUrl.searchParams.get("keyword") ?? undefined;
  if (!city || !countryCode) {
    return NextResponse.json({ error: "Missing required city, countryCode params" }, { status: 400 });
  }
  if (!hasTicketmasterKey()) {
    return NextResponse.json({ result: null, keyConfigured: false });
  }
  const result = await getComparableEvents(city, countryCode, keyword);
  return NextResponse.json({ result, keyConfigured: true });
}
