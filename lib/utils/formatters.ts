export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-PT").format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function microsToEur(micros: number): number {
  return micros / 1_000_000;
}
