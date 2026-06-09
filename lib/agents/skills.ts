import { createAdminClient } from "@/lib/supabase/server";
import type { AgentSkill, SkillScope } from "@/types/agent-skills";

type AgentScope = "google" | "meta" | "analytics" | "orchestrator";

function appliesToAgent(skill: AgentSkill, agent: AgentScope): boolean {
  return skill.applies_to.includes("all") || skill.applies_to.includes(agent);
}

/**
 * Lê as skills ativas do owner e devolve um bloco de texto pronto para
 * acrescentar ao system prompt do agente indicado. Vazio se não houver skills.
 */
export async function getSkillsPromptBlock(agent: AgentScope): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("agent_skills")
    .select("*")
    .eq("enabled", true)
    .order("updated_at", { ascending: false });

  if (error || !data || data.length === 0) return "";

  const relevant = (data as AgentSkill[]).filter((s) => appliesToAgent(s, agent));
  if (relevant.length === 0) return "";

  const blocks = relevant.map((s) => {
    const heading = s.description ? `## ${s.name} — ${s.description}` : `## ${s.name}`;
    return `${heading}\n${s.content.trim()}`;
  });

  return `

# Conhecimento e regras definidas pelo utilizador
Aplica SEMPRE as instruções abaixo. Têm prioridade sobre regras genéricas.

${blocks.join("\n\n")}`.trim();
}

export function scopeLabels(scopes: SkillScope[]): string {
  return scopes.join(", ");
}
