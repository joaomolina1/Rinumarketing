import { NextRequest, NextResponse } from "next/server";
import { runOrchestrator } from "@/lib/agents/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Cron diário (Vercel): sync + análise dos agentes.
 * Agenda: vercel.json — 07:00 UTC (~08:00 Lisboa).
 * Requer CRON_SECRET na Vercel (header Authorization: Bearer …).
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const serviceHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.N8N_API_KEY) {
    serviceHeaders.Authorization = `Bearer ${process.env.N8N_API_KEY}`;
  }

  try {
    await Promise.all([
      fetch(`${baseUrl}/api/data/google/sync`, {
        method: "POST",
        headers: serviceHeaders,
        body: JSON.stringify({ days: 30 }),
      }),
      fetch(`${baseUrl}/api/data/meta/sync`, {
        method: "POST",
        headers: serviceHeaders,
        body: JSON.stringify({ days: 30 }),
      }),
      fetch(`${baseUrl}/api/data/ga4/sync`, {
        method: "POST",
        headers: serviceHeaders,
        body: JSON.stringify({ days: 7 }),
      }),
    ]);
  } catch {
    // sync parcial — continua com a análise
  }

  try {
    const result = await runOrchestrator({
      trigger: "scheduled_daily",
      date_range_days: 7,
    });
    return NextResponse.json({
      ok: true,
      run_id: result.run_id,
      actions_proposed: result.actions_proposed.length,
      pending_approval: result.actions_requiring_approval.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
