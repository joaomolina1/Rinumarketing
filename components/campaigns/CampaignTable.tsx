import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/formatters";

export interface CampaignRow {
  id: string;
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
}

interface CampaignTableProps {
  campaigns: CampaignRow[];
  platform: "google" | "meta";
}

export function CampaignTable({ campaigns }: CampaignTableProps) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
        Sem campanhas sincronizadas. Execute o sync de dados para ver resultados.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campanha</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Spend</TableHead>
            <TableHead className="text-right">Impressões</TableHead>
            <TableHead className="text-right">Cliques</TableHead>
            <TableHead className="text-right">Conversões</TableHead>
            <TableHead className="text-right">ROAS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">{campaign.name}</TableCell>
              <TableCell>
                <Badge variant={campaign.status === "ACTIVE" || campaign.status === "ENABLED" ? "default" : "secondary"}>
                  {campaign.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{formatCurrency(campaign.spend)}</TableCell>
              <TableCell className="text-right">{campaign.impressions.toLocaleString("pt-PT")}</TableCell>
              <TableCell className="text-right">{campaign.clicks.toLocaleString("pt-PT")}</TableCell>
              <TableCell className="text-right">{campaign.conversions}</TableCell>
              <TableCell className="text-right">{campaign.roas.toFixed(2)}x</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
