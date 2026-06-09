export type SkillScope = "all" | "google" | "meta" | "analytics" | "orchestrator";

export interface AgentSkill {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  content: string;
  applies_to: SkillScope[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentSkillInput {
  name: string;
  description?: string | null;
  content: string;
  applies_to: SkillScope[];
  enabled: boolean;
}

export const SKILL_SCOPE_OPTIONS: Array<{ key: SkillScope; label: string }> = [
  { key: "all", label: "Todos os agentes" },
  { key: "orchestrator", label: "Orquestrador" },
  { key: "google", label: "Google Ads" },
  { key: "meta", label: "Meta Ads" },
  { key: "analytics", label: "Analytics" },
];

export const MAX_SKILL_CONTENT_LENGTH = 12000;

export const SKILL_TEMPLATE = `# Contexto da marca

Descreve aqui o que os agentes devem saber sempre. Exemplos:

## Tom e objetivos
- ROAS alvo: 4x
- Evita pausar campanhas de marca

## Regras específicas
- Nunca aumentar budget da campanha "X" acima de 50€/dia
- Dar prioridade a Lisboa e Porto

## Notas
- Época alta: maio a setembro (casamentos)
`;
