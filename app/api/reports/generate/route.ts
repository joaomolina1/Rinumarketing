import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateWeeklyReport } from "@/lib/reports/generator";
import { authorizeApiRequest } from "@/lib/api/auth";

const schema = z.object({
  period: z.enum(["last_week", "custom"]).default("last_week"),
});

export async function POST(req: NextRequest) {
  if (!(await authorizeApiRequest(req))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  try {
    const report = await generateWeeklyReport(
      parsed.success ? parsed.data.period : "last_week"
    );
    return NextResponse.json({ report });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}
