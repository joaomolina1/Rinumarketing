/**
 * RINU Marketing AI — Notificações Slack
 */

export interface SlackNotificationInput {
  level: "critical" | "warning" | "info" | "success";
  title: string;
  summary: string;
  details?: string;
  run_id?: string;
  action_url?: string;
}

const LEVEL_EMOJI: Record<SlackNotificationInput["level"], string> = {
  critical: "🚨",
  warning: "⚠️",
  info: "📋",
  success: "✅",
};

const LEVEL_COLOR: Record<SlackNotificationInput["level"], string> = {
  critical: "#E53E3E",
  warning: "#DD6B20",
  info: "#3182CE",
  success: "#38A169",
};

export async function notifySlack(input: SlackNotificationInput): Promise<void> {
  const token = process.env.SLACK_BOT_TOKEN;
  const channelId = process.env.SLACK_CHANNEL_ID;

  if (!token || !channelId) {
    return;
  }

  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${LEVEL_EMOJI[input.level]} ${input.title}`,
        emoji: true,
      },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: input.summary },
    },
  ];

  if (input.details) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `_${input.details}_` },
    });
  }

  if (input.action_url) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `<${input.action_url}|👉 Ver e aprovar acções no dashboard>`,
      },
    });
  }

  if (input.run_id) {
    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Run ID: \`${input.run_id}\` · ${new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}`,
        },
      ],
    });
  }

  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        channel: channelId,
        attachments: [
          {
            color: LEVEL_COLOR[input.level],
            blocks,
          },
        ],
      }),
    });

    const data = (await res.json()) as { ok: boolean; error?: string };
    if (!data.ok) {
      // structured logging placeholder
    }
  } catch {
    // fail silently for notifications
  }
}
