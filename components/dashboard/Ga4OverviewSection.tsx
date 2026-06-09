import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Ga4SyncButton } from "@/components/dashboard/Ga4SyncButton";
import { Ga4SessionsChart } from "@/components/dashboard/Ga4SessionsChart";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import type { Ga4OverviewData } from "@/lib/integrations/ga4";

interface Ga4OverviewSectionProps {
  configured: boolean;
  propertyId?: string;
  periodLabel: string;
  days: number;
  data: Ga4OverviewData | null;
  error: string | null;
}

export function Ga4OverviewSection({
  configured,
  propertyId,
  periodLabel,
  days,
  data,
  error,
}: Ga4OverviewSectionProps) {
  return (
    <Card className="mt-8 border-[#e9ecef]">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base font-semibold text-[#272b30]">
            Google Analytics 4
          </CardTitle>
          <p className="mt-1 text-sm text-[#6a7178]">
            {configured
              ? `Property ${propertyId} · ${periodLabel}`
              : "Liga o GA4 para ver sessões e conversões no site"}
          </p>
        </div>
        {configured && <Ga4SyncButton days={days} />}
      </CardHeader>
      <CardContent className="space-y-6">
        {!configured && (
          <p className="text-sm text-[#6a7178]">
            Configura em{" "}
            <Link href="/dashboard/settings" className="font-medium text-[#5cb7f3] underline">
              Integrações
            </Link>
            : Property ID <code className="text-xs">447428655</code> + Service Account base64.
          </p>
        )}

        {configured && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <strong>GA4 indisponível:</strong> {error.slice(0, 200)}
          </div>
        )}

        {configured && !error && data && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-[#e9ecef] bg-[#f8fbff] px-4 py-3">
                <p className="text-xs font-medium text-[#6a7178]">Sessões</p>
                <p className="mt-1 text-2xl font-semibold text-[#272b30]">
                  {formatNumber(data.totals.sessions)}
                </p>
              </div>
              <div className="rounded-lg border border-[#e9ecef] bg-[#f8fbff] px-4 py-3">
                <p className="text-xs font-medium text-[#6a7178]">Conversões</p>
                <p className="mt-1 text-2xl font-semibold text-[#272b30]">
                  {formatNumber(data.totals.conversions)}
                </p>
              </div>
              <div className="rounded-lg border border-[#e9ecef] bg-[#f8fbff] px-4 py-3">
                <p className="text-xs font-medium text-[#6a7178]">Revenue (GA4)</p>
                <p className="mt-1 text-2xl font-semibold text-[#272b30]">
                  {formatCurrency(data.totals.revenue)}
                </p>
              </div>
            </div>

            {data.dailySessions.length > 0 && (
              <div>
                <p className="mb-3 text-sm font-medium text-[#272b30]">Sessões por dia</p>
                <Ga4SessionsChart data={data.dailySessions} />
              </div>
            )}

            {data.topChannels.length > 0 ? (
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[#272b30]">Top canais</p>
                  <Link
                    href="/dashboard/analytics/attribution"
                    className="text-xs text-[#5cb7f3] underline"
                  >
                    Ver atribuição completa
                  </Link>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fonte / meio</TableHead>
                      <TableHead className="text-right">Sessões</TableHead>
                      <TableHead className="text-right">Conv.</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topChannels.map((row) => (
                      <TableRow key={row.source}>
                        <TableCell className="font-medium">{row.source}</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(row.sessions)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(row.conversions)}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.conversion_rate.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-[#6a7178]">
                Ligação OK mas sem sessões no período. Clica <strong>Carregar GA4</strong> ou
                confirma tráfego na propriedade.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
