"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type {
  ActionPolicy,
  ActionType,
  AgentMode,
  AgentSettings,
} from "@/types/agent-settings";
import { ACTION_TYPE_CATALOG } from "@/types/agent-settings";
import { Loader2, OctagonPause, ShieldCheck } from "lucide-react";

export function AgentControlPanel() {
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/agent-controls");
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function save(patch: Partial<AgentSettings>) {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/settings/agent-controls", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao guardar");
      return;
    }

    setSettings(data.settings);
    setMessage("Definições guardadas.");
  }

  function updatePolicy(key: ActionType, policy: ActionPolicy) {
    if (!settings) return;
    setSettings({
      ...settings,
      action_policies: { ...settings.action_policies, [key]: policy },
    });
  }

  if (loading || !settings) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#5cb7f3]" />
      </div>
    );
  }

  const isPlanMode = settings.mode === "plan";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Alert className="border-[#e5eff9] bg-[#f8fbff]">
        <ShieldCheck className="size-4 text-[#5cb7f3]" />
        <AlertTitle className="text-[#272b30]">
          Ligar as tuas keys não executa nada automaticamente
        </AlertTitle>
        <AlertDescription className="text-[#54606b]">
          {isPlanMode
            ? "Estás em modo de Planeamento — cada ação dos agentes espera o teu ok em Aprovações antes de tocar nas plataformas."
            : "Estás em modo Automático — ações permitidas executam dentro dos limites abaixo. O resto vai para Aprovações."}
        </AlertDescription>
      </Alert>

      <Card className="border-[#e9ecef]">
        <CardHeader>
          <CardTitle>Modo de operação</CardTitle>
          <CardDescription>
            Planeamento = aprovas tudo. Automático = executa dentro dos limites definidos.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {(["plan", "auto"] as AgentMode[]).map((mode) => (
            <Button
              key={mode}
              variant={settings.mode === mode ? "default" : "outline"}
              disabled={saving}
              onClick={() => {
                setSettings({ ...settings, mode });
                save({ mode });
              }}
            >
              {mode === "plan" ? "Planeamento" : "Automático"}
            </Button>
          ))}
          <Badge variant="secondary" className="ml-auto self-center">
            {isPlanMode
              ? "Aprovações obrigatórias — nada executa sozinho"
              : "Execução automática dentro dos limites"}
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-[#cc071e]/30 bg-[#fffafa]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#cc071e]">
            <OctagonPause className="size-5" />
            Botão de emergência
          </CardTitle>
          <CardDescription>
            Pausa todos os agentes imediatamente. Nenhuma ação será proposta nem executada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant={settings.agents_master_enabled ? "destructive" : "default"}
            disabled={saving}
            onClick={() => {
              const agents_master_enabled = !settings.agents_master_enabled;
              setSettings({ ...settings, agents_master_enabled });
              save({ agents_master_enabled });
            }}
          >
            {settings.agents_master_enabled
              ? "Pausar todos os agentes"
              : "Reativar agentes"}
          </Button>
          {!settings.agents_master_enabled && (
            <p className="mt-3 text-sm font-medium text-[#cc071e]">
              Agentes pausados — kill switch activo.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#e9ecef]">
        <CardHeader>
          <CardTitle>Agentes por plataforma</CardTitle>
          <CardDescription>Liga ou desliga cada agente individualmente.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            { key: "google_agent_enabled" as const, label: "Google Ads" },
            { key: "meta_agent_enabled" as const, label: "Meta Ads" },
            { key: "analytics_agent_enabled" as const, label: "Analytics" },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={settings[key] ? "default" : "outline"}
              disabled={saving}
              onClick={() => {
                const value = !settings[key];
                setSettings({ ...settings, [key]: value });
                save({ [key]: value });
              }}
            >
              {label}: {settings[key] ? "Ligado" : "Desligado"}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="border-[#e9ecef]">
        <CardHeader>
          <CardTitle>Políticas de ação</CardTitle>
          <CardDescription>
            Define o que cada tipo de ação pode fazer em modo automático.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ACTION_TYPE_CATALOG.map((item) => {
            const policy =
              settings.action_policies[item.key] ??
              (item.key === "change_budget" || item.key === "refresh_creative"
                ? "ask"
                : "auto");

            return (
              <div
                key={item.key}
                className="flex flex-col gap-2 rounded-lg border border-[#e9ecef] p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-[#272b30]">{item.label_pt}</p>
                  <p className="text-xs text-[#6a7178]">{item.risk_hint}</p>
                </div>
                <select
                  className="h-9 rounded-lg border border-[#dee2e6] bg-white px-3 text-sm"
                  value={policy}
                  onChange={(e) => {
                    const value = e.target.value as ActionPolicy;
                    updatePolicy(item.key, value);
                  }}
                >
                  <option value="block">Bloquear</option>
                  <option value="ask">Pedir aprovação</option>
                  <option value="auto">Automático</option>
                </select>
              </div>
            );
          })}
          <Button
            disabled={saving}
            onClick={() => save({ action_policies: settings.action_policies })}
          >
            {saving ? "A guardar..." : "Guardar políticas"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-[#e9ecef]">
        <CardHeader>
          <CardTitle>Tetos de budget</CardTitle>
          <CardDescription>
            Protege contra gastos descontrolados no cartão. Valores acima do teto
            voltam a pedir aprovação.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="max_per_action">Máximo por ação (€)</Label>
            <Input
              id="max_per_action"
              type="number"
              min={0}
              value={settings.max_budget_increase_per_action_eur}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_budget_increase_per_action_eur: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_daily">Máximo agregado por corrida (€)</Label>
            <Input
              id="max_daily"
              type="number"
              min={0}
              value={settings.max_daily_budget_increase_eur}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_daily_budget_increase_eur: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              disabled={saving}
              onClick={() =>
                save({
                  max_budget_increase_per_action_eur:
                    settings.max_budget_increase_per_action_eur,
                  max_daily_budget_increase_eur:
                    settings.max_daily_budget_increase_eur,
                })
              }
            >
              Guardar tetos
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <p className="text-sm text-[#6a7178]">
        As chaves ficam em{" "}
        <Link href="/dashboard/settings" className="text-[#5cb7f3] hover:underline">
          Integrações
        </Link>
        . Revisa acções pendentes em{" "}
        <Link href="/dashboard/agents/actions" className="text-[#5cb7f3] hover:underline">
          Aprovações
        </Link>
        .
      </p>

      {message && (
        <Alert className="border-[#e6f2ec] bg-[#f6fffa] text-[#007d3e]">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
