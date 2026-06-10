/**
 * Claude frequentemente envolve JSON em ```json ... ``` — isto extrai e faz parse.
 */
export function parseAgentJson<T>(rawText: string): T | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i);
  const candidates = fenceMatch ? [fenceMatch[1].trim(), trimmed] : [trimmed];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      const start = candidate.indexOf("{");
      const end = candidate.lastIndexOf("}");
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(candidate.slice(start, end + 1)) as T;
        } catch {
          // try next candidate
        }
      }
    }
  }

  return null;
}

/** Texto legível quando o JSON veio mal formatado ou só temos analysis em markdown. */
export function extractAnalysisText(rawText: string): string {
  const parsed = parseAgentJson<{ analysis?: string; analysis_summary?: string }>(rawText);
  if (parsed?.analysis?.trim()) return parsed.analysis.trim();
  if (parsed?.analysis_summary?.trim()) return parsed.analysis_summary.trim();

  return rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export function formatAgentError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const record = err as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (Array.isArray(record.errors) && record.errors[0]) {
      return formatAgentError(record.errors[0]);
    }
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return String(err);
}
