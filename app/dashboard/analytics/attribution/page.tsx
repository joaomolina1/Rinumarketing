import { PageHeader } from "@/components/layout/PageHeader";
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
import { getAttributionData } from "@/lib/integrations/ga4";
import { resolveIntegrationConfig } from "@/lib/integrations/config";
import { formatNumber } from "@/lib/utils/formatters";

export const dynamic = "force-dynamic";

export default async function AttributionPage() {
  const config = await resolveIntegrationConfig();
  const ga4Configured = Boolean(config.ga4);

  let attribution: Awaited<ReturnType<typeof getAttributionData>> = [];
  let ga4Error: string | null = null;

  if (ga4Configured) {
    try {
      attribution = await getAttributionData(7);
    } catch (err) {
      ga4Error = err instanceof Error ? err.message : "Erro ao ler GA4";
    }
  }

  const totals = attribution.reduce(
    (acc, row) => ({
      sessions: acc.sessions + row.sessions,
      conversions: acc.conversions + row.conversions,
      revenue: acc.revenue + row.revenue,
    }),
    { sessions: 0, conversions: 0, revenue: 0 }
  );

  return (
    <div>
      <PageHeader
        title="Atribuição GA4"
        description="Sessões e conversões por canal (últimos 7 dias)"
        actions={ga4Configured ? <Ga4SyncButton /> : undefined}
      />

      {!ga4Configured && (
        <Card className="mb-6">
          <CardContent className="p-6 text-sm text-[#6a7178]">
            GA4 não configurado. Vai a{" "}
            <a href="/dashboard/settings" className="text-[#5cb7f3] underline">
              Integrações
            </a>{" "}
            e preenche Property ID + Service Account (base64).
          </CardContent>
        </Card>
      )}

      {ga4Configured && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#6a7178]">
                Sessões (7d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-[#272b30]">
                {ga4Error ? "—" : formatNumber(totals.sessions)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#6a7178]">
                Conversões (7d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-[#272b30]">
                {ga4Error ? "—" : formatNumber(totals.conversions)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#6a7178]">
                Property ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-[#272b30]">
                {config.ga4?.propertyId}
              </p>
              <p className="mt-1 text-xs text-[#6a7178]">
                {ga4Error ? `Erro: ${ga4Error.slice(0, 120)}` : "Ligação OK"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {ga4Configured && !ga4Error && attribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por fonte / meio</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Sessões</TableHead>
                  <TableHead className="text-right">Conversões</TableHead>
                  <TableHead className="text-right">Taxa conv.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attribution
                  .sort((a, b) => b.sessions - a.sessions)
                  .slice(0, 15)
                  .map((row) => (
                    <TableRow key={row.source}>
                      <TableCell className="font-medium">{row.source}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(row.sessions)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(row.conversions)}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.conversion_rate.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {ga4Configured && !ga4Error && attribution.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-[#6a7178]">
            Ligação GA4 OK mas sem linhas nos últimos 7 dias. Confirma que a
            propriedade tem tráfego e que a service account tem acesso Viewer.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
