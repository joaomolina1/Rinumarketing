import Anthropic from "@anthropic-ai/sdk";
import { resolveIntegrationConfig } from "@/lib/integrations/config";

export async function createAnthropicClient() {
  const config = await resolveIntegrationConfig();
  const apiKey = config.anthropic?.apiKey ?? process.env.ANTHROPIC_API_KEY;

  if (!apiKey?.trim()) {
    throw new Error(
      "Anthropic API Key não configurada. Guarda a chave em Integrações ou define ANTHROPIC_API_KEY na Vercel."
    );
  }

  return new Anthropic({ apiKey });
}
