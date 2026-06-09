export const ANALYSIS_PERIOD_OPTIONS = [
  { days: 3, label: "3 dias" },
  { days: 7, label: "7 dias" },
  { days: 14, label: "14 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
] as const;

export type AnalysisPeriodDays = (typeof ANALYSIS_PERIOD_OPTIONS)[number]["days"];

export const DEFAULT_ANALYSIS_DAYS: AnalysisPeriodDays = 7;
export const DEFAULT_SYNC_DAYS = 30;
export const MAX_ANALYSIS_DAYS = 90;

const ALLOWED_DAYS = new Set<number>(
  ANALYSIS_PERIOD_OPTIONS.map((option) => option.days)
);

export function parseAnalysisDays(value?: string | null): AnalysisPeriodDays {
  const parsed = Number(value);
  if (ALLOWED_DAYS.has(parsed)) {
    return parsed as AnalysisPeriodDays;
  }
  return DEFAULT_ANALYSIS_DAYS;
}

export function getAnalysisPeriodLabel(days: number): string {
  const match = ANALYSIS_PERIOD_OPTIONS.find((option) => option.days === days);
  return match ? `Últimos ${match.label}` : `Últimos ${days} dias`;
}

/** Intervalo [start, end] em YYYY-MM-DD para os últimos N dias (inclui hoje). */
export function getAnalysisDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));

  const format = (d: Date) => d.toISOString().split("T")[0];

  return {
    startDate: format(start),
    endDate: format(end),
  };
}
