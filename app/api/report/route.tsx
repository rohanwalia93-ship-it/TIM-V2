import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportDocument } from "@/lib/pdf/report-document";
import type { ReportPayload } from "@/lib/pdf/types";

export async function POST(req: NextRequest) {
  let payload: ReportPayload;
  try {
    payload = (await req.json()) as ReportPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload?.viability || !payload?.dcf || !payload?.archetypeResult) {
    return NextResponse.json({ error: "Missing required report fields" }, { status: 400 });
  }

  const buffer = await renderToBuffer(<ReportDocument data={payload} />);
  const filename = `TourViable-${(payload.cityName || "report").replace(/\s+/g, "-")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
