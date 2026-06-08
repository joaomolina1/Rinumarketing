import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/server";
import { authorizeApiRequest } from "@/lib/api/auth";

const schema = z.object({
  report_id: z.string().uuid(),
  recipients: z.array(z.string().email()).optional(),
});

export async function POST(req: NextRequest) {
  if (!(await authorizeApiRequest(req))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input inválido" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: report, error } = await admin
    .from("reports")
    .select("*")
    .eq("id", parsed.data.report_id)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
  }

  const recipients =
    parsed.data.recipients ??
    (process.env.REPORT_RECIPIENT_EMAIL ? [process.env.REPORT_RECIPIENT_EMAIL] : []);

  if (!process.env.RESEND_API_KEY || recipients.length === 0) {
    return NextResponse.json({ error: "Email não configurado" }, { status: 503 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "marketing-ai@rinu.fun",
    to: recipients,
    subject: report.title,
    html: report.html_content ?? `<p>${report.summary}</p>`,
  });

  await admin
    .from("reports")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_to: recipients,
    })
    .eq("id", report.id);

  return NextResponse.json({ sent: true, recipients });
}
