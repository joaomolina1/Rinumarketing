"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RinuLogo } from "@/components/brand/RinuLogo";
import { IntegrationField } from "@/components/onboarding/IntegrationField";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { IntegrationTestTarget } from "@/types/integrations";
import {
  Bot,
  CheckCircle2,
  Circle,
  Loader2,
  Megaphone,
  Search,
  Sparkles,
} from "lucide-react";

type FormState = Record<string, string>;

const STEPS = [
  {
    id: "welcome",
    title: "Bem-vindo",
    subtitle: "Configure a plataforma em poucos passos",
    icon: Sparkles,
  },
  {
    id: "google",
    title: "Google Ads",
    subtitle: "Ligue a conta de anúncios",
    icon: Search,
    testTarget: "google_ads" as IntegrationTestTarget,
  },
  {
    id: "meta",
    title: "Meta Ads",
    subtitle: "Facebook e Instagram",
    icon: Megaphone,
    testTarget: "meta" as IntegrationTestTarget,
  },
  {
    id: "ai",
    title: "Agentes IA",
    subtitle: "Claude para análise e acções",
    icon: Bot,
    testTarget: "anthropic" as IntegrationTestTarget,
  },
  {
    id: "finish",
    title: "Pronto",
    subtitle: "Sincronize e entre no dashboard",
    icon: CheckCircle2,
  },
];

const INITIAL_FORM: FormState = {
  google_ads_client_id: "",
  google_ads_client_secret: "",
  google_ads_refresh_token: "",
  google_ads_developer_token: "",
  google_ads_customer_id: "",
  meta_app_id: "",
  meta_app_secret: "",
  meta_access_token: "",
  meta_ad_account_id: "",
  ga4_property_id: "",
  google_application_credentials_json: "",
  anthropic_api_key: "",
  slack_bot_token: "",
  slack_channel_id: "",
  resend_api_key: "",
  report_recipient_email: "",
};

interface OnboardingWizardProps {
  mode?: "onboarding" | "settings";
}

export function OnboardingWizard({ mode = "onboarding" }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const currentStep = STEPS[step];
  const progressSteps = STEPS.filter((item) => item.id !== "welcome" && item.id !== "finish");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings/integrations");
        const data = await res.json();
        if (data.settings) {
          const loaded = Object.fromEntries(
            Object.entries(data.settings).filter(
              ([, value]) => typeof value === "string" && value
            )
          ) as Partial<FormState>;
          setForm((prev) => {
            const next = { ...prev };
            for (const [key, value] of Object.entries(loaded)) {
              if (typeof value === "string") next[key] = value;
            }
            return next;
          });
          if (mode === "onboarding" && data.settings.onboarding_step) {
            setStep(Math.min(data.settings.onboarding_step, STEPS.length - 1));
          }
        }
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [mode]);

  const stepFields = useMemo(() => {
    switch (currentStep.id) {
      case "google":
        return [
          "google_ads_client_id",
          "google_ads_client_secret",
          "google_ads_refresh_token",
          "google_ads_developer_token",
          "google_ads_customer_id",
        ];
      case "meta":
        return [
          "meta_app_id",
          "meta_app_secret",
          "meta_access_token",
          "meta_ad_account_id",
        ];
      case "ai":
        return ["anthropic_api_key", "ga4_property_id", "google_application_credentials_json"];
      default:
        return [];
    }
  }, [currentStep.id]);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setMessage(null);
  }

  async function saveProgress(
    nextStep = step,
    complete = false,
    fieldsToSave?: string[]
  ) {
    setSaving(true);
    setError(null);

    const keys =
      fieldsToSave ??
      (mode === "settings"
        ? Object.keys(form)
        : stepFields);

    const stepOnly = Object.fromEntries(
      keys.map((field) => [field, form[field] ?? ""]).filter(([, v]) => {
        const s = String(v);
        return s.trim() && !s.includes("••••");
      })
    );

    const payload: Record<string, string | number | null> = {
      ...stepOnly,
      onboarding_step: nextStep,
    };

    if (complete) {
      payload.onboarding_completed_at = new Date().toISOString();
    }

    const res = await fetch("/api/settings/integrations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      const detail =
        typeof data.error === "string"
          ? data.error
          : data.error?.fieldErrors
            ? JSON.stringify(data.error.fieldErrors)
            : "Não foi possível guardar";
      setError(detail);
      return false;
    }

    return true;
  }

  async function runTest(target: IntegrationTestTarget) {
    setTesting(true);
    setError(null);
    setMessage(null);

    const values = Object.fromEntries(
      stepFields
        .map((field) => [field, form[field] ?? ""])
        .filter(([, v]) => {
          const s = String(v);
          return s.trim() && !s.includes("••••");
        })
    );

    const res = await fetch("/api/settings/integrations/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, values }),
    });

    const data = await res.json();
    setTesting(false);

    if (!res.ok || !data.ok) {
      setError(data.message ?? "Teste falhou");
      setTestResults((prev) => ({ ...prev, [target]: false }));
      return false;
    }

    setMessage(data.message);
    setTestResults((prev) => ({ ...prev, [target]: true }));
    return true;
  }

  async function handleNext(skipTest = false) {
    if (currentStep.testTarget && !skipTest) {
      const ok = await runTest(currentStep.testTarget);
      if (!ok) return;
    }

    const nextStep = Math.min(step + 1, STEPS.length - 1);
    const saved = await saveProgress(nextStep);
    if (saved) setStep(nextStep);
  }

  async function handleFinish() {
    setSyncing(true);
    setError(null);

    const saved = await saveProgress(STEPS.length - 1, true);
    if (!saved) {
      setSyncing(false);
      return;
    }

    try {
      await Promise.allSettled([
        fetch("/api/data/google/sync", {
          method: "POST",
          body: JSON.stringify({ days: 30 }),
        }),
        fetch("/api/data/meta/sync", {
          method: "POST",
          body: JSON.stringify({ days: 30 }),
        }),
      ]);
      setMessage("Integrações guardadas e primeira sincronização iniciada.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Integrações guardadas, mas a sincronização falhou. Tente novamente no dashboard.");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#5cb7f3]" />
      </div>
    );
  }

  if (mode === "settings") {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {[
          {
            title: "Google Ads",
            description: "OAuth, developer token e customer ID",
            fields: [
              ["google_ads_client_id", "Client ID", false],
              ["google_ads_client_secret", "Client Secret", true],
              ["google_ads_refresh_token", "Refresh Token", true],
              ["google_ads_developer_token", "Developer Token", true],
              ["google_ads_customer_id", "Customer ID", false],
            ] as const,
            test: "google_ads" as IntegrationTestTarget,
          },
          {
            title: "Meta Ads",
            description: "Marketing API e ad account",
            fields: [
              ["meta_app_id", "App ID", false],
              ["meta_app_secret", "App Secret", true],
              ["meta_access_token", "Access Token", true],
              ["meta_ad_account_id", "Ad Account ID", false],
            ] as const,
            test: "meta" as IntegrationTestTarget,
          },
          {
            title: "Claude & GA4",
            description: "Agentes IA e analytics opcional",
            fields: [
              ["anthropic_api_key", "Anthropic API Key", true],
              ["ga4_property_id", "GA4 Property ID", false],
              ["google_application_credentials_json", "Service Account (base64)", true],
            ] as const,
            test: "anthropic" as IntegrationTestTarget,
          },
        ].map((section) => (
          <Card key={section.title} className="border-[#e9ecef] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#272b30]">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {section.fields.map(([key, label, secret]) => (
                  <IntegrationField
                    key={key}
                    id={key}
                    label={label}
                    type={secret ? "password" : "text"}
                    value={form[key]}
                    onChange={(v) => updateField(key, v)}
                  />
                ))}
              </div>
              <Button
                variant="secondary"
                disabled={testing}
                onClick={() => runTest(section.test)}
              >
                Testar {section.title}
              </Button>
            </CardContent>
          </Card>
        ))}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert className="border-[#e6f2ec] bg-[#f6fffa] text-[#007d3e]">
            <AlertTitle>Sucesso</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button disabled={saving} onClick={() => saveProgress(step)}>
            {saving ? "A guardar..." : "Guardar alterações"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto w-full", mode === "onboarding" ? "max-w-3xl" : "max-w-4xl")}>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <RinuLogo />
          <div>
            <p className="text-sm font-medium text-[#6a7178]">Marketing AI</p>
            <h1 className="text-xl font-semibold text-[#272b30]">Configuração inicial</h1>
          </div>
        </div>
      </div>

      {step > 0 && step < STEPS.length - 1 && (
        <div className="mb-8 flex gap-2">
          {progressSteps.map((item, index) => {
            const stepIndex = STEPS.findIndex((s) => s.id === item.id);
            const active = step === stepIndex;
            const done = step > stepIndex || testResults[item.testTarget ?? ""];

            return (
              <div
                key={item.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  done ? "bg-[#5cb7f3]" : active ? "bg-[#94cbec]" : "bg-[#e9ecef]"
                )}
              />
            );
          })}
        </div>
      )}

      <Card className="border-[#e9ecef] bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#e5eff9] text-[#5cb7f3]">
              <currentStep.icon className="size-5" />
            </div>
            <div>
              <CardTitle className="text-[#272b30]">{currentStep.title}</CardTitle>
              <CardDescription>{currentStep.subtitle}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep.id === "welcome" && (
            <div className="space-y-4 text-[#54606b]">
              <p>
                Vamos ligar as tuas contas de marketing e IA. Em cada passo podes
                colar as chaves, testar a ligação e avançar só quando estiver OK.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Circle className="size-3 fill-[#5cb7f3] text-[#5cb7f3]" />
                  Google Ads — campanhas e keywords
                </li>
                <li className="flex items-center gap-2">
                  <Circle className="size-3 fill-[#5475f9] text-[#5475f9]" />
                  Meta Ads — Facebook e Instagram
                </li>
                <li className="flex items-center gap-2">
                  <Circle className="size-3 fill-[#9a70ff] text-[#9a70ff]" />
                  Claude — agentes de optimização
                </li>
              </ul>
              <Alert className="border-[#e5eff9] bg-[#f8fbff]">
                <AlertTitle className="text-[#272b30]">Onde obter as chaves?</AlertTitle>
                <AlertDescription className="text-[#54606b]">
                  Google: Google Cloud Console + Google Ads API. Meta: Meta for Developers
                  → Marketing API. Anthropic: console.anthropic.com. Também podes
                  configurar via variáveis de ambiente no Vercel — a app usa DB ou env.
                </AlertDescription>
              </Alert>
              <Alert className="border-[#e6f2ec] bg-[#f6fffa]">
                <AlertTitle className="text-[#007d3e]">Nada executa sem o teu ok</AlertTitle>
                <AlertDescription className="text-[#54606b]">
                  Ligar as keys não inicia agentes nem altera campanhas. Por defeito estás
                  em modo Planeamento. Define limites em Controlo após o setup.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {currentStep.id === "google" && (
            <div className="grid gap-4 md:grid-cols-2">
              <IntegrationField
                id="google_ads_client_id"
                label="Client ID"
                value={form.google_ads_client_id}
                onChange={(v) => updateField("google_ads_client_id", v)}
                placeholder="xxxx.apps.googleusercontent.com"
              />
              <IntegrationField
                id="google_ads_client_secret"
                label="Client Secret"
                type="password"
                value={form.google_ads_client_secret}
                onChange={(v) => updateField("google_ads_client_secret", v)}
              />
              <IntegrationField
                id="google_ads_refresh_token"
                label="Refresh Token"
                type="password"
                value={form.google_ads_refresh_token}
                onChange={(v) => updateField("google_ads_refresh_token", v)}
              />
              <IntegrationField
                id="google_ads_developer_token"
                label="Developer Token"
                type="password"
                value={form.google_ads_developer_token}
                onChange={(v) => updateField("google_ads_developer_token", v)}
              />
              <IntegrationField
                id="google_ads_customer_id"
                label="Customer ID"
                value={form.google_ads_customer_id}
                onChange={(v) => updateField("google_ads_customer_id", v)}
                placeholder="1234567890"
              />
            </div>
          )}

          {currentStep.id === "meta" && (
            <div className="grid gap-4 md:grid-cols-2">
              <IntegrationField
                id="meta_app_id"
                label="App ID"
                value={form.meta_app_id}
                onChange={(v) => updateField("meta_app_id", v)}
              />
              <IntegrationField
                id="meta_app_secret"
                label="App Secret"
                type="password"
                value={form.meta_app_secret}
                onChange={(v) => updateField("meta_app_secret", v)}
              />
              <IntegrationField
                id="meta_access_token"
                label="Access Token"
                type="password"
                value={form.meta_access_token}
                onChange={(v) => updateField("meta_access_token", v)}
              />
              <IntegrationField
                id="meta_ad_account_id"
                label="Ad Account ID"
                value={form.meta_ad_account_id}
                onChange={(v) => updateField("meta_ad_account_id", v)}
                placeholder="act_123456789"
              />
            </div>
          )}

          {currentStep.id === "ai" && (
            <div className="space-y-4">
              <IntegrationField
                id="anthropic_api_key"
                label="Anthropic API Key"
                type="password"
                value={form.anthropic_api_key}
                onChange={(v) => updateField("anthropic_api_key", v)}
                description="Necessária para os agentes Google, Meta e Analytics."
              />
              <div className="rounded-xl border border-dashed border-[#dee2e6] p-4">
                <p className="mb-3 text-sm font-medium text-[#272b30]">GA4 (opcional)</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <IntegrationField
                    id="ga4_property_id"
                    label="Property ID"
                    value={form.ga4_property_id}
                    onChange={(v) => updateField("ga4_property_id", v)}
                  />
                  <IntegrationField
                    id="google_application_credentials_json"
                    label="Service Account JSON (base64)"
                    type="password"
                    value={form.google_application_credentials_json}
                    onChange={(v) => updateField("google_application_credentials_json", v)}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep.id === "finish" && (
            <div className="space-y-4 text-[#54606b]">
              <p>Tudo pronto. Vamos guardar as integrações e fazer a primeira sincronização.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Google Ads", ok: testResults.google_ads },
                  { label: "Meta Ads", ok: testResults.meta },
                  { label: "Claude AI", ok: testResults.anthropic },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 rounded-lg border border-[#e9ecef] px-3 py-2 text-sm"
                  >
                    {item.ok ? (
                      <CheckCircle2 className="size-4 text-[#007d3e]" />
                    ) : (
                      <Circle className="size-4 text-[#ced4da]" />
                    )}
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="border-[#e6f2ec] bg-[#f6fffa] text-[#007d3e]">
              <AlertTitle>Sucesso</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-[#e9ecef] pt-6">
            <Button
              variant="outline"
              disabled={step === 0 || saving || testing}
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
            >
              Anterior
            </Button>
            <div className="flex gap-2">
              {currentStep.testTarget && (
                <>
                  <Button
                    variant="secondary"
                    disabled={testing || saving}
                    onClick={() => runTest(currentStep.testTarget!)}
                  >
                    {testing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        A testar...
                      </>
                    ) : (
                      "Testar ligação"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={saving || testing}
                    onClick={() => handleNext(true)}
                  >
                    Guardar e continuar
                  </Button>
                </>
              )}
              {currentStep.id === "finish" ? (
                <Button disabled={syncing || saving} onClick={handleFinish}>
                  {syncing ? "A sincronizar..." : "Concluir setup"}
                </Button>
              ) : (
                !currentStep.testTarget && (
                  <Button disabled={saving || testing} onClick={() => handleNext()}>
                    {saving ? "A guardar..." : "Continuar"}
                  </Button>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
