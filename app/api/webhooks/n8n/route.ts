import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  event: z.enum([
    "daily_sync",
    "run_orchestrator",
    "weekly_report",
    "anomaly_check",
  ]),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.N8N_API_KEY}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Evento inválido" }, { status: 422 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const headers = {
    Authorization: `Bearer ${process.env.N8N_API_KEY}`,
    "Content-Type": "application/json",
  };

  switch (parsed.data.event) {
    case "daily_sync": {
      await Promise.all([
        fetch(`${baseUrl}/api/data/google/sync`, { method: "POST", headers, body: "{}" }),
        fetch(`${baseUrl}/api/data/meta/sync`, { method: "POST", headers, body: "{}" }),
        fetch(`${baseUrl}/api/data/ga4/sync`, { method: "POST", headers, body: "{}" }),
      ]);
      return NextResponse.json({ status: "sync_started" });
    }
    case "run_orchestrator": {
      const res = await fetch(`${baseUrl}/api/agents/orchestrator`, {
        method: "POST",
        headers,
        body: JSON.stringify({ trigger: "scheduled_daily" }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }
    case "weekly_report": {
      const genRes = await fetch(`${baseUrl}/api/reports/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ period: "last_week" }),
      });
      const { report } = await genRes.json();
      if (report?.id) {
        await fetch(`${baseUrl}/api/reports/send`, {
          method: "POST",
          headers,
          body: JSON.stringify({ report_id: report.id }),
        });
      }
      return NextResponse.json({ status: "report_sent" });
    }
    case "anomaly_check": {
      const res = await fetch(`${baseUrl}/api/agents/analytics`, {
        method: "POST",
        headers,
        body: JSON.stringify({ mode: "anomaly_check" }),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }
    default:
      return NextResponse.json({ error: "Evento desconhecido" }, { status: 400 });
  }
}
