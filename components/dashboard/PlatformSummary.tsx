import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatters";

interface PlatformSummaryProps {
  google: { spend: number; revenue: number; roas: number };
  meta: { spend: number; revenue: number; roas: number };
}

export function PlatformSummary({ google, meta }: PlatformSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="border-[#e9ecef] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#0070B0]">Google Ads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#6a7178]">Spend</span>
            <span className="font-medium text-[#272b30]">{formatCurrency(google.spend)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6a7178]">Revenue</span>
            <span className="font-medium text-[#272b30]">{formatCurrency(google.revenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6a7178]">ROAS</span>
            <span className="font-medium text-[#272b30]">{google.roas.toFixed(2)}x</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e9ecef] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-[#E91E8C]">Meta Ads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#6a7178]">Spend</span>
            <span className="font-medium text-[#272b30]">{formatCurrency(meta.spend)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6a7178]">Revenue</span>
            <span className="font-medium text-[#272b30]">{formatCurrency(meta.revenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6a7178]">ROAS</span>
            <span className="font-medium text-[#272b30]">{meta.roas.toFixed(2)}x</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
