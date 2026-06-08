import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAnalyticsAgent } from "@/lib/agents/analytics-agent";
import { authorizeApiRequest } from "@/lib/api/auth";
import { isRateLimited } from "@/lib/api/rate-limit";

const schema = z.object({
  days: z.number().int().min(1).max(90).default(7),
  mode: z.enum(["full", "anomaly_check"]).optional().default("full"),
});

export async function POST(req: NextRequest) {
  if (!(await authorizeApiRequest(req))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Rate limit excedido" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input inválido" }, { status: 422 });
  }

  try {
    const result = await runAnalyticsAgent({
      days: parsed.data.days,
      recent_decisions: [],
      mode: parsed.data.mode,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
