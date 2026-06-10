"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GENINU_MODE_OPTIONS,
  type GeninuMessage,
  type GeninuMode,
  type GeninuModelOption,
  type GeninuSettings,
} from "@/types/geninu";
import { Loader2, Send, Trash2, Sparkles } from "lucide-react";

export function GeninuChat() {
  const [settings, setSettings] = useState<GeninuSettings | null>(null);
  const [models, setModels] = useState<GeninuModelOption[]>([]);
  const [messages, setMessages] = useState<GeninuMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/geninu/chat");
      const data = await res.json();
      if (res.ok) {
        setSettings(data.settings);
        setModels(data.models ?? []);
        setMessages(data.messages ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function updateSettings(patch: Partial<Pick<GeninuSettings, "mode" | "model">>) {
    const res = await fetch("/api/geninu/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (res.ok) {
      setSettings(data.settings);
      if (data.models?.length) setModels(data.models);
    }
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    setSending(true);
    setError(null);
    const userText = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        user_id: settings?.user_id ?? "",
        role: "user",
        content: userText,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch("/api/geninu/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar");
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          user_id: settings?.user_id ?? "",
          role: "assistant",
          content: data.reply,
          created_at: new Date().toISOString(),
        },
      ]);
      if (data.settings) setSettings(data.settings);
    } catch {
      setError("Erro de rede");
    } finally {
      setSending(false);
    }
  }

  async function clearChat() {
    if (!confirm("Apagar histórico da conversa?")) return;
    await fetch("/api/geninu/chat", { method: "DELETE" });
    setMessages([]);
  }

  if (loading || !settings) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-[#5cb7f3]" />
      </div>
    );
  }

  const modeMeta = GENINU_MODE_OPTIONS.find((m) => m.key === settings.mode);
  const modelOptions =
    models.length > 0
      ? models.some((m) => m.id === settings.model)
        ? models
        : [{ id: settings.model, label: settings.model }, ...models]
      : settings.model
        ? [{ id: settings.model, label: settings.model }]
        : [];

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-[#E91E8C]" />
          <span className="text-sm font-medium text-[#272b30]">Geninu</span>
          <Badge variant="outline">{modeMeta?.label}</Badge>
        </div>

        <select
          className="h-9 max-w-[min(100%,320px)] rounded-lg border border-[#dee2e6] bg-white px-3 text-sm"
          value={settings.model}
          onChange={(e) => updateSettings({ model: e.target.value })}
          title={`${modelOptions.length} modelos disponíveis`}
        >
          {modelOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-1">
          {GENINU_MODE_OPTIONS.map((opt) => (
            <Button
              key={opt.key}
              size="sm"
              variant={settings.mode === opt.key ? "default" : "outline"}
              onClick={() => updateSettings({ mode: opt.key as GeninuMode })}
              title={opt.hint}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={clearChat} className="ml-auto text-[#6a7178]">
          <Trash2 className="size-4" />
          Limpar
        </Button>
      </div>

      {modeMeta && (
        <p className="text-xs text-[#6a7178]">{modeMeta.hint}</p>
      )}

      <Card className="flex min-h-0 flex-1 flex-col border-[#e9ecef] shadow-sm">
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="py-12 text-center text-sm text-[#6a7178]">
                Pergunta o que quiseres sobre campanhas, KPIs, GA4 ou pede para pausar/ajustar
                budgets no Meta ou Google.
                <br />
                <span className="mt-2 block text-xs">
                  Ex.: &quot;Como está o ROAS Meta nos últimos 7 dias?&quot; · &quot;Pausa a campanha
                  CP12&quot;
                </span>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-lg bg-[#e5eff9] px-4 py-2.5 text-sm text-[#272b30]"
                    : "mr-auto max-w-[90%] rounded-lg border border-[#e9ecef] bg-white px-4 py-2.5 text-sm text-[#54606b]"
                }
              >
                <p className="mb-1 text-xs font-medium text-[#9aa3ab]">
                  {m.role === "user" ? "Tu" : "Geninu"}
                </p>
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-sm text-[#6a7178]">
                <Loader2 className="size-4 animate-spin" />
                A pensar…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-[#e9ecef] p-3">
            {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escreve a tua mensagem…"
                className="min-h-[52px] resize-none"
                disabled={sending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="shrink-0 bg-[#E91E8C] hover:bg-[#E91E8C]/90"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
