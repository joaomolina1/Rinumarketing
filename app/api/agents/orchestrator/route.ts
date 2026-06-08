import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runOrchestrator } from "@/lib/agents/orchestrator";
import { authorizeApiRequest } from "@/lib/api/auth";
import { isRateLimited } from "@/lib/api/rate-limit";

const OrchestratorInputSchema = z.object({
  trigger: z.enum(["scheduled_daily", "scheduled_weekly", "manual", "alert"]),
  date_range_days: z.number().int().min(1).max(90).optional().default(7),
  focus_platform: z.enum(["google", "meta"]).optional(),
  manual_instruction: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  if (!(await authorizeApiRequest(req))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Rate limit excedido" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = OrchestratorInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Input inválido", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    const result = await runOrchestrator(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", agent: "orchestrator" });
}
