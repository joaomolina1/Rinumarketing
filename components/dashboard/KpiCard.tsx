import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: string;
}

export function KpiCard({ title, value, change, changeType = "neutral", icon }: KpiCardProps) {
  const changeColors = {
    positive: "text-green-600",
    negative: "text-red-600",
    neutral: "text-gray-500",
  };

  return (
    <Card className="border-[#e9ecef] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-[#6a7178]">{title}</CardTitle>
        {icon && <span className="text-lg">{icon}</span>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums text-[#272b30]">{value}</div>
        {change && (
          <p className={`mt-1 text-xs ${changeColors[changeType]}`}>{change}</p>
        )}
      </CardContent>
    </Card>
  );
}
