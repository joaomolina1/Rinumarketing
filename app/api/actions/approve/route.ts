import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  action_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input inválido" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("agent_actions")
    .update({
      status: "approved",
      approved_by: user.email,
      approved_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.action_id)
    .eq("status", "pending")
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ action: data });
}
