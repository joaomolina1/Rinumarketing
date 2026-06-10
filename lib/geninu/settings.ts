import type { GeninuSettings } from "@/types/geninu";
import { DEFAULT_GENINU_SETTINGS } from "@/types/geninu";
import { createClient } from "@/lib/supabase/server";

export async function getGeninuSettingsForUser(userId: string): Promise<GeninuSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("geninu_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const now = new Date().toISOString();
  return {
    user_id: userId,
    mode: (data?.mode as GeninuSettings["mode"]) ?? DEFAULT_GENINU_SETTINGS.mode,
    model: data?.model ?? DEFAULT_GENINU_SETTINGS.model,
    updated_at: data?.updated_at ?? now,
  };
}

export async function upsertGeninuSettingsForUser(
  userId: string,
  patch: Partial<Pick<GeninuSettings, "mode" | "model">>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("geninu_settings")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as GeninuSettings;
}

export async function getRecentGeninuMessages(userId: string, limit = 40) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("geninu_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(limit);

  return data ?? [];
}

export async function appendGeninuMessage(
  userId: string,
  role: "user" | "assistant",
  content: string
) {
  const supabase = await createClient();
  await supabase.from("geninu_messages").insert({ user_id: userId, role, content });
}
