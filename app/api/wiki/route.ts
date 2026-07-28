import { NextRequest, NextResponse } from "next/server";
import { getWikiSummary } from "@/lib/sources/wikipedia";

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title");
  if (!title) {
    return NextResponse.json({ error: "Missing required `title` param" }, { status: 400 });
  }
  const summary = await getWikiSummary(title);
  return NextResponse.json({ summary });
}
