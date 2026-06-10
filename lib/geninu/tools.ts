import type Anthropic from "@anthropic-ai/sdk";
import { getCampaignsInsights, pauseAd, updateCampaignBudget } from "@/lib/integrations/meta-ads";
import { getCampaignsPerformance, adjustBid, pauseEntity } from "@/lib/integrations/google-ads";
import { getGa4Overview } from "@/lib/integrations/ga4";
import { getAttributionData } from "@/lib/integrations/ga4";
import { runOrchestrator } from "@/lib/agents/orchestrator";
import {
  getAgentSettingsForUser,
  upsertAgentSettingsForUser,
} from "@/lib/settings/agent-settings";
import { getSettingsForUser, getIntegrationStatus, settingsToResolvedConfig } from "@/lib/settings/integrations";
import { createAdminClient } from "@/lib/supabase/server";
import { aggregateDailyKpis } from "@/lib/utils/kpi-aggregation";
import { syncGoogleCampaigns, syncMetaCampaigns } from "@/lib/data/sync-platform";
import type { GeninuMode } from "@/types/geninu";

const WRITE_TOOLS = new Set([
  "pause_meta_ad",
  "update_meta_campaign_budget",
  "pause_google_entity",
  "adjust_google_bid",
  "sync_ad_platform_data",
  "run_marketing_agents",
  "update_agent_controls",
]);

export const GENINU_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_dashboard_kpis",
    description: "KPIs agregados (spend, revenue, ROAS) dos últimos N dias.",
    input_schema: {
      type: "object",
      properties: { days: { type: "number", description: "1-90 dias" } },
      required: ["days"],
    },
  },
  {
    name: "get_meta_campaigns",
    description: "Performance das campanhas Meta Ads.",
    input_schema: {
      type: "object",
      properties: { days: { type: "number" } },
      required: ["days"],
    },
  },
  {
    name: "get_google_campaigns",
    description: "Performance das campanhas Google Ads.",
    input_schema: {
      type: "object",
      properties: { days: { type: "number" } },
      required: ["days"],
    },
  },
  {
    name: "get_ga4_traffic",
    description: "Sessões, conversões e top canais GA4.",
    input_schema: {
      type: "object",
      properties: { days: { type: "number" } },
      required: ["days"],
    },
  },
  {
    name: "get_integration_status",
    description: "Estado das integrações (Google, Meta, GA4, Anthropic) — sem secrets.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_agent_controls",
    description: "Modo dos agentes automáticos, kill switch e políticas.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "update_agent_controls",
    description: "Alterar modo dos agentes (plan/auto) ou ligar/desligar agentes.",
    input_schema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["plan", "auto"] },
        agents_master_enabled: { type: "boolean" },
        google_agent_enabled: { type: "boolean" },
        meta_agent_enabled: { type: "boolean" },
        confirmed: {
          type: "boolean",
          description: "Obrigatório true em modo execução para aplicar alterações.",
        },
      },
    },
  },
  {
    name: "sync_ad_platform_data",
    description: "Sincronizar dados Google/Meta/GA4 para a base de dados.",
    input_schema: {
      type: "object",
      properties: {
        platform: { type: "string", enum: ["google", "meta", "ga4", "all"] },
        days: { type: "number" },
        confirmed: { type: "boolean" },
      },
      required: ["platform"],
    },
  },
  {
    name: "run_marketing_agents",
    description: "Correr o orquestrador de agentes (análise + propostas de ação).",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "number" },
        confirmed: { type: "boolean" },
      },
    },
  },
  {
    name: "pause_meta_ad",
    description: "Pausar um anúncio Meta pelo ad_id.",
    input_schema: {
      type: "object",
      properties: {
        ad_id: { type: "string" },
        confirmed: { type: "boolean" },
      },
      required: ["ad_id"],
    },
  },
  {
    name: "update_meta_campaign_budget",
    description: "Alterar budget diário de campanha Meta (EUR).",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: { type: "string" },
        daily_budget_eur: { type: "number" },
        confirmed: { type: "boolean" },
      },
      required: ["campaign_id", "daily_budget_eur"],
    },
  },
  {
    name: "pause_google_entity",
    description: "Pausar campanha/ad group/keyword Google (simulado se token teste).",
    input_schema: {
      type: "object",
      properties: {
        entity_type: { type: "string", enum: ["campaign", "ad_group", "keyword"] },
        entity_id: { type: "string" },
        confirmed: { type: "boolean" },
      },
      required: ["entity_type", "entity_id"],
    },
  },
  {
    name: "adjust_google_bid",
    description: "Ajustar licitação Google em % (simulado se token teste).",
    input_schema: {
      type: "object",
      properties: {
        entity_type: { type: "string", enum: ["keyword", "ad_group"] },
        entity_id: { type: "string" },
        adjustment_percent: { type: "number" },
        confirmed: { type: "boolean" },
      },
      required: ["entity_type", "entity_id", "adjustment_percent"],
    },
  },
];

interface ToolContext {
  userId: string;
  mode: GeninuMode;
}

function guardWrite(
  toolName: string,
  input: Record<string, unknown>,
  mode: GeninuMode
): { blocked: boolean; message?: string } {
  if (!WRITE_TOOLS.has(toolName)) return { blocked: false };

  if (mode === "plan") {
    return {
      blocked: true,
      message: `[Modo Planeamento] Simulação: ${toolName}(${JSON.stringify(input)}) — confirma modo Execução ou Automático para aplicar.`,
    };
  }

  if (mode === "execute" && input.confirmed !== true) {
    return {
      blocked: true,
      message: `[Modo Execução] Pedido ao utilizador para confirmar antes de executar ${toolName}. Pergunta explicitamente e volta a chamar a tool com confirmed: true.`,
    };
  }

  return { blocked: false };
}

export async function executeGeninuTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext
): Promise<string> {
  const guard = guardWrite(name, input, ctx.mode);
  if (guard.blocked) return guard.message ?? "Bloqueado pelo modo.";

  switch (name) {
    case "get_dashboard_kpis": {
      const days = Math.min(90, Math.max(1, Number(input.days ?? 7)));
      const admin = createAdminClient();
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      const { data } = await admin
        .from("daily_kpis")
        .select("*")
        .gte("date", start.toISOString().split("T")[0])
        .lte("date", end.toISOString().split("T")[0]);
      const agg = aggregateDailyKpis(data ?? []);
      return JSON.stringify({ days, ...agg, rows: data?.length ?? 0 });
    }
    case "get_meta_campaigns": {
      const days = Number(input.days ?? 7);
      const rows = await getCampaignsInsights(days);
      return JSON.stringify(rows.slice(0, 30));
    }
    case "get_google_campaigns": {
      const days = Number(input.days ?? 7);
      const rows = await getCampaignsPerformance(days);
      return JSON.stringify(rows.slice(0, 30));
    }
    case "get_ga4_traffic": {
      const days = Number(input.days ?? 7);
      const [overview, attribution] = await Promise.all([
        getGa4Overview(days).catch(() => null),
        getAttributionData(days).catch(() => []),
      ]);
      return JSON.stringify({ overview, attribution: attribution.slice(0, 15) });
    }
    case "get_integration_status": {
      const settings = await getSettingsForUser(ctx.userId);
      const config = settingsToResolvedConfig(settings);
      const status = getIntegrationStatus(config);
      return JSON.stringify({
        status,
        google_customer_id: settings?.google_ads_customer_id ?? null,
        meta_ad_account_id: settings?.meta_ad_account_id ?? null,
        ga4_property_id: settings?.ga4_property_id ?? null,
      });
    }
    case "get_agent_controls": {
      const settings = await getAgentSettingsForUser(ctx.userId);
      return JSON.stringify(settings);
    }
    case "update_agent_controls": {
      const patch: Record<string, unknown> = {};
      if (input.mode) patch.mode = input.mode;
      if (typeof input.agents_master_enabled === "boolean") {
        patch.agents_master_enabled = input.agents_master_enabled;
      }
      if (typeof input.google_agent_enabled === "boolean") {
        patch.google_agent_enabled = input.google_agent_enabled;
      }
      if (typeof input.meta_agent_enabled === "boolean") {
        patch.meta_agent_enabled = input.meta_agent_enabled;
      }
      const saved = await upsertAgentSettingsForUser(ctx.userId, patch);
      return JSON.stringify({ ok: true, settings: saved });
    }
    case "sync_ad_platform_data": {
      const platform = String(input.platform ?? "all");
      const days = Number(input.days ?? 30);
      const results: Record<string, number | string> = {};
      try {
        if (platform === "google" || platform === "all") {
          results.google = await syncGoogleCampaigns(days);
        }
        if (platform === "meta" || platform === "all") {
          results.meta = await syncMetaCampaigns(days);
        }
        if (platform === "ga4" || platform === "all") {
          results.ga4 = "use get_ga4_traffic — sync GA4 via dashboard se necessário";
        }
        return JSON.stringify({ ok: true, results });
      } catch (err) {
        return JSON.stringify({
          ok: false,
          error: err instanceof Error ? err.message : "Erro no sync",
        });
      }
    }
    case "run_marketing_agents": {
      const result = await runOrchestrator({
        trigger: "manual",
        date_range_days: Number(input.days ?? 7),
      });
      return JSON.stringify({
        run_id: result.run_id,
        actions_proposed: result.actions_proposed.length,
        pending_approval: result.actions_requiring_approval.length,
        auto_executed: result.auto_approved_actions.length,
        summary: result.analysis_summary,
      });
    }
    case "pause_meta_ad": {
      const result = await pauseAd(String(input.ad_id));
      return JSON.stringify(result);
    }
    case "update_meta_campaign_budget": {
      const result = await updateCampaignBudget(
        String(input.campaign_id),
        Number(input.daily_budget_eur)
      );
      return JSON.stringify(result);
    }
    case "pause_google_entity": {
      const result = await pauseEntity(
        input.entity_type as "campaign" | "ad_group" | "keyword",
        String(input.entity_id)
      );
      return JSON.stringify(result);
    }
    case "adjust_google_bid": {
      const result = await adjustBid(
        input.entity_type as "keyword" | "ad_group",
        String(input.entity_id),
        Number(input.adjustment_percent)
      );
      return JSON.stringify(result);
    }
    default:
      return JSON.stringify({ error: `Tool desconhecida: ${name}` });
  }
}

export const GENINU_SYSTEM_PROMPT = `
És o Geninu, assistente conversacional de marketing da RINU (aluguer de espaços para eventos, Portugal).

Tens acesso a tools para ler e alterar Google Ads, Meta Ads, GA4, agentes automáticos e sync de dados.

REGRAS:
- Responde em português de Portugal, claro e directo.
- Usa tools para dados reais — não inventes métricas.
- Em modo Planeamento: descreve o que farias; writes são simulados.
- Em modo Execução: pede confirmação explícita antes de writes; usa confirmed: true só após o utilizador dizer sim.
- Em modo Automático: podes executar writes permitidos quando fizer sentido.
- Google Ads pode estar simulado (developer token teste) — avisa sempre.
- ROAS alvo ~4x, CPA alvo <€80.

Quando o utilizador pedir para alterar campanhas, budgets ou pausar anúncios, usa a tool correcta com IDs reais das campanhas.
`.trim();
