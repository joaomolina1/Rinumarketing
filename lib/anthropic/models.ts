import { resolveIntegrationConfig } from "@/lib/integrations/config";

export interface AnthropicModelOption {
  id: string;
  label: string;
  created_at?: string;
}

/** Fallback se a API de listagem falhar */
export const FALLBACK_ANTHROPIC_MODELS: AnthropicModelOption[] = [
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
  { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 (alias)" },
  { id: "claude-opus-4-20250514", label: "Claude Opus 4" },
  { id: "claude-opus-4-1-20250805", label: "Claude Opus 4.1" },
  { id: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku (legacy)" },
  { id: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet (legacy)" },
];

let cachedModels: AnthropicModelOption[] | null = null;
let cachedAt = 0;
const CACHE_MS = 5 * 60 * 1000;

interface ModelsApiResponse {
  data: Array<{
    id: string;
    display_name?: string;
    created_at?: string;
  }>;
  has_more?: boolean;
  last_id?: string;
}

async function fetchModelsPage(
  apiKey: string,
  afterId?: string
): Promise<ModelsApiResponse> {
  const url = new URL("https://api.anthropic.com/v1/models");
  url.searchParams.set("limit", "1000");
  if (afterId) url.searchParams.set("after_id", afterId);

  const res = await fetch(url.toString(), {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic models API: ${res.status} ${text.slice(0, 120)}`);
  }

  return res.json() as Promise<ModelsApiResponse>;
}

/**
 * Lista todos os modelos Claude disponíveis para a chave Anthropic configurada.
 * Usa GET /v1/models (paginado). Resultado em cache 5 min.
 */
export async function listAnthropicModels(options?: {
  forceRefresh?: boolean;
}): Promise<AnthropicModelOption[]> {
  if (!options?.forceRefresh && cachedModels && Date.now() - cachedAt < CACHE_MS) {
    return cachedModels;
  }

  const config = await resolveIntegrationConfig();
  const apiKey = config.anthropic?.apiKey ?? process.env.ANTHROPIC_API_KEY;

  if (!apiKey?.trim()) {
    return FALLBACK_ANTHROPIC_MODELS;
  }

  try {
    const all: AnthropicModelOption[] = [];
    let afterId: string | undefined;
    let pages = 0;

    do {
      const page = await fetchModelsPage(apiKey, afterId);
      for (const model of page.data ?? []) {
        all.push({
          id: model.id,
          label: model.display_name?.trim() || model.id,
          created_at: model.created_at,
        });
      }
      afterId = page.has_more ? page.last_id : undefined;
      pages += 1;
    } while (afterId && pages < 10);

    if (all.length === 0) return FALLBACK_ANTHROPIC_MODELS;

    cachedModels = all;
    cachedAt = Date.now();
    return all;
  } catch {
    return FALLBACK_ANTHROPIC_MODELS;
  }
}

export async function isAllowedAnthropicModel(modelId: string): Promise<boolean> {
  const models = await listAnthropicModels();
  return models.some((m) => m.id === modelId);
}
