import { NextRequest, NextResponse } from "next/server";
import { getConversions } from "@/lib/integrations/ga4";
import { authorizeApiRequest } from "@/lib/api/auth";

export async function POST(req: NextRequest) {
  if (!(await authorizeApiRequest(req))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({ days: 7 }));
  const days = typeof body.days === "number" ? body.days : 7;

  try {
    const conversions = await getConversions(days);
    return NextResponse.json({ synced: conversions.length, data: conversions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro no sync GA4" },
      { status: 500 }
    );
  }
}
