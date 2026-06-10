import type Anthropic from "@anthropic-ai/sdk";
import { createAnthropicClient } from "@/lib/anthropic/client";
import {
  GENINU_SYSTEM_PROMPT,
  GENINU_TOOLS,
  executeGeninuTool,
} from "@/lib/geninu/tools";
import type { GeninuMode } from "@/types/geninu";

const MAX_TOOL_ROUNDS = 8;

export async function runGeninuChat({
  messages,
  mode,
  model,
  userId,
  baseUrl,
}: {
  messages: Anthropic.MessageParam[];
  mode: GeninuMode;
  model: string;
  userId: string;
  baseUrl?: string;
}): Promise<string> {
  const client = await createAnthropicClient();
  const system = `${GENINU_SYSTEM_PROMPT}\n\nModo actual: ${mode}.`;

  let currentMessages = [...messages];
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds += 1;

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system,
      tools: GENINU_TOOLS,
      messages: currentMessages,
    });

    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    if (toolUses.length === 0 || response.stop_reason === "end_turn") {
      return response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
    }

    currentMessages = [
      ...currentMessages,
      { role: "assistant", content: response.content },
    ];

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUses) {
      const input = (toolUse.input as Record<string, unknown>) ?? {};
      const result = await executeGeninuTool(toolUse.name, input, {
        userId,
        mode,
      });
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result,
      });
    }

    currentMessages.push({ role: "user", content: toolResults });
  }

  return "Limite de passos atingido. Tenta reformular o pedido.";
}
