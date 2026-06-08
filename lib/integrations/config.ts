import type { ResolvedIntegrationConfig } from "@/types/integrations";
import { getActiveIntegrationConfig } from "@/lib/settings/integrations";

let cachedConfig: ResolvedIntegrationConfig | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

export async function resolveIntegrationConfig(
  userId?: string
): Promise<ResolvedIntegrationConfig> {
  if (!userId && cachedConfig && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedConfig;
  }

  const config = await getActiveIntegrationConfig(userId);
  if (!userId) {
    cachedConfig = config;
    cachedAt = Date.now();
  }
  return config;
}

export function clearIntegrationConfigCache() {
  cachedConfig = null;
  cachedAt = 0;
}
