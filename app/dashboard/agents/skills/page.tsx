import { PageHeader } from "@/components/layout/PageHeader";
import { SkillsManager } from "@/components/agents/SkillsManager";

export const dynamic = "force-dynamic";

export default function AgentSkillsPage() {
  return (
    <div>
      <PageHeader
        title="Skills & Conhecimento"
        description="Notas em Markdown que os agentes leem antes de analisar (tom da marca, regras, limites)"
      />
      <SkillsManager />
    </div>
  );
}
