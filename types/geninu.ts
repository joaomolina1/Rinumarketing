export type GeninuMode = "plan" | "execute" | "auto";

export interface GeninuSettings {
  user_id: string;
  mode: GeninuMode;
  model: string;
  updated_at: string;
}

export interface GeninuMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface GeninuModelOption {
  id: string;
  label: string;
  created_at?: string;
}

export const GENINU_MODE_OPTIONS: Array<{ key: GeninuMode; label: string; hint: string }> = [
  {
    key: "plan",
    label: "Planeamento",
    hint: "Só analisa e propõe — não altera plataformas.",
  },
  {
    key: "execute",
    label: "Execução",
    hint: "Alterações pedem confirmação explícita na conversa.",
  },
  {
    key: "auto",
    label: "Automático",
    hint: "Executa alterações permitidas sem pedir confirmação.",
  },
];

export const DEFAULT_GENINU_MODEL = "claude-sonnet-4-20250514";

export const DEFAULT_GENINU_SETTINGS: Omit<GeninuSettings, "user_id" | "updated_at"> = {
  mode: "plan",
  model: DEFAULT_GENINU_MODEL,
};
