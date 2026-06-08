export interface Anomaly {
  metric: string;
  platform: "google" | "meta" | "blended";
  current_value: number;
  expected_value: number;
  deviation_percent: number;
  severity: "warning" | "critical";
  message: string;
}

export function detectSpendAnomaly(
  currentSpend: number,
  averageSpend: number,
  platform: "google" | "meta"
): Anomaly | null {
  if (averageSpend <= 0) return null;

  const deviation = ((currentSpend - averageSpend) / averageSpend) * 100;

  if (Math.abs(deviation) < 30) return null;

  const severity = Math.abs(deviation) >= 50 ? "critical" : "warning";

  return {
    metric: "spend",
    platform,
    current_value: currentSpend,
    expected_value: averageSpend,
    deviation_percent: deviation,
    severity,
    message:
      deviation > 0
        ? `Spend ${platform} ${deviation.toFixed(0)}% acima do esperado`
        : `Spend ${platform} ${Math.abs(deviation).toFixed(0)}% abaixo do esperado`,
  };
}

export function detectRoasAnomaly(
  currentRoas: number,
  targetRoas: number,
  platform: "google" | "meta" | "blended"
): Anomaly | null {
  if (currentRoas >= targetRoas) return null;

  const deviation = ((targetRoas - currentRoas) / targetRoas) * 100;
  const severity = currentRoas < targetRoas * 0.5 ? "critical" : "warning";

  return {
    metric: "roas",
    platform,
    current_value: currentRoas,
    expected_value: targetRoas,
    deviation_percent: -deviation,
    severity,
    message: `ROAS ${platform} em ${currentRoas.toFixed(1)}x (alvo: ${targetRoas}x)`,
  };
}
