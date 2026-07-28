import { NextRequest, NextResponse } from "next/server";
import { getCountryProfile } from "@/lib/sources/restCountries";
import { getWorldBankProfile } from "@/lib/sources/worldbank";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing required `code` param" }, { status: 400 });
  }
  const [profile, worldBank] = await Promise.all([
    getCountryProfile(code),
    getWorldBankProfile(code),
  ]);
  return NextResponse.json({ profile, worldBank });
}
