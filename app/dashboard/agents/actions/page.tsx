import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActionsList } from "@/components/agents/ActionsList";

export default async function ActionsPage() {
  const supabase = await createClient();

  const { data: actions } = await supabase
    .from("agent_actions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Acções Pendentes"
        description="Aprove ou rejeite acções propostas pelos agentes"
      />
      <ActionsList actions={actions ?? []} />
    </div>
  );
}
