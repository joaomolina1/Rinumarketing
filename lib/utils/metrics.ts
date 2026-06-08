export function calculateRoas(revenue: number, spend: number): number {
  if (spend <= 0) return 0;
  return revenue / spend;
}

export function calculateCpa(spend: number, conversions: number): number {
  if (conversions <= 0) return 0;
  return spend / conversions;
}

export function calculateCtr(clicks: number, impressions: number): number {
  if (impressions <= 0) return 0;
  return (clicks / impressions) * 100;
}

export function calculateCpc(spend: number, clicks: number): number {
  if (clicks <= 0) return 0;
  return spend / clicks;
}
