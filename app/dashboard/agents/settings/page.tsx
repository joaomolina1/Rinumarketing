import { AgentControlPanel } from "@/components/agents/AgentControlPanel";
import { PageHeader } from "@/components/layout/PageHeader";

export default function AgentSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Controlo dos agentes"
        description="Modo de operação, limites de budget e políticas de ação"
      />
      <AgentControlPanel />
    </div>
  );
}
