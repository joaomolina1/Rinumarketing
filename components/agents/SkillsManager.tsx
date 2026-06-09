"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Pencil, Plus, Trash2, BookOpen } from "lucide-react";
import {
  SKILL_SCOPE_OPTIONS,
  SKILL_TEMPLATE,
  type AgentSkill,
  type SkillScope,
} from "@/types/agent-skills";

const scopeLabel: Record<SkillScope, string> = {
  all: "Todos",
  orchestrator: "Orquestrador",
  google: "Google",
  meta: "Meta",
  analytics: "Analytics",
};

interface Draft {
  id?: string;
  name: string;
  description: string;
  content: string;
  applies_to: SkillScope[];
  enabled: boolean;
}

const emptyDraft: Draft = {
  name: "",
  description: "",
  content: SKILL_TEMPLATE,
  applies_to: ["all"],
  enabled: true,
};

export function SkillsManager() {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/skills");
      const data = await res.json();
      if (res.ok) setSkills(data.skills ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setDraft(emptyDraft);
    setError(null);
    setOpen(true);
  }

  function openEdit(skill: AgentSkill) {
    setDraft({
      id: skill.id,
      name: skill.name,
      description: skill.description ?? "",
      content: skill.content,
      applies_to: skill.applies_to,
      enabled: skill.enabled,
    });
    setError(null);
    setOpen(true);
  }

  function toggleScope(scope: SkillScope) {
    setDraft((d) => {
      if (scope === "all") return { ...d, applies_to: ["all"] };
      const without = d.applies_to.filter((s) => s !== "all");
      const next = without.includes(scope)
        ? without.filter((s) => s !== scope)
        : [...without, scope];
      return { ...d, applies_to: next.length ? next : ["all"] };
    });
  }

  async function save() {
    if (!draft.name.trim()) {
      setError("Dá um nome à skill.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      content: draft.content,
      applies_to: draft.applies_to,
      enabled: draft.enabled,
    };
    const res = await fetch(
      draft.id ? `/api/agents/skills/${draft.id}` : "/api/agents/skills",
      {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Erro ao guardar.");
      return;
    }
    setOpen(false);
    load();
  }

  async function toggleEnabled(skill: AgentSkill) {
    await fetch(`/api/agents/skills/${skill.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !skill.enabled }),
    });
    load();
  }

  async function remove(skill: AgentSkill) {
    if (!confirm(`Apagar a skill "${skill.name}"?`)) return;
    await fetch(`/api/agents/skills/${skill.id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6a7178]">
          As skills ativas são injetadas no prompt dos agentes a que se aplicam.
        </p>
        <Button onClick={openNew} className="bg-[#5cb7f3] hover:bg-[#4e9ccf]">
          <Plus className="size-4" />
          Nova skill
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[#5cb7f3]" />
        </div>
      ) : skills.length === 0 ? (
        <Card className="border-dashed border-[#dee2e6]">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <BookOpen className="size-8 text-[#9aa3ab]" />
            <p className="text-sm text-[#6a7178]">
              Ainda não tens skills. Cria a primeira para dar contexto e regras aos agentes
              (ex.: tom da marca, limites de budget, campanhas a proteger).
            </p>
            <Button onClick={openNew} variant="outline">
              <Plus className="size-4" />
              Criar skill
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {skills.map((skill) => (
            <Card key={skill.id} className="border-[#e9ecef] shadow-sm">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[#272b30]">{skill.name}</span>
                    {!skill.enabled && (
                      <Badge variant="secondary" className="text-[#6a7178]">
                        Inativa
                      </Badge>
                    )}
                    {skill.applies_to.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">
                        {scopeLabel[s as SkillScope] ?? s}
                      </Badge>
                    ))}
                  </div>
                  {skill.description && (
                    <p className="mt-1 text-sm text-[#6a7178]">{skill.description}</p>
                  )}
                  <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs text-[#9aa3ab]">
                    {skill.content.slice(0, 220)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleEnabled(skill)}
                    className="text-[#54606b]"
                  >
                    {skill.enabled ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(skill)}
                    title="Editar"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(skill)}
                    title="Apagar"
                    className="text-[#cc071e] hover:text-[#cc071e]"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar skill" : "Nova skill"}</DialogTitle>
            <DialogDescription>
              Escreve em Markdown. Este texto entra no prompt dos agentes selecionados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skill-name">Nome</Label>
              <Input
                id="skill-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Ex.: Tom da marca RINU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-desc">Descrição (opcional)</Label>
              <Input
                id="skill-desc"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Resumo curto"
              />
            </div>
            <div className="space-y-2">
              <Label>Aplica-se a</Label>
              <div className="flex flex-wrap gap-2">
                {SKILL_SCOPE_OPTIONS.map((opt) => {
                  const active = draft.applies_to.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => toggleScope(opt.key)}
                      className={
                        active
                          ? "rounded-full border border-[#5cb7f3] bg-[#e5eff9] px-3 py-1 text-sm font-medium text-[#4080aa]"
                          : "rounded-full border border-[#dee2e6] px-3 py-1 text-sm text-[#54606b] hover:bg-[#f8f9fa]"
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-content">Conteúdo (Markdown)</Label>
              <Textarea
                id="skill-content"
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                className="min-h-[260px] font-mono text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#54606b]">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                className="size-4 rounded border-[#dee2e6]"
              />
              Ativa (usada pelos agentes)
            </label>
            {error && <p className="text-sm text-[#cc071e]">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving} className="bg-[#5cb7f3] hover:bg-[#4e9ccf]">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
