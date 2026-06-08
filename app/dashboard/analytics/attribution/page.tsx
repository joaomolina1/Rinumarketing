import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function AttributionPage() {
  return (
    <div>
      <PageHeader title="Atribuição" description="Multi-touch attribution" />
      <Card>
        <CardContent className="p-6 text-sm text-gray-600">
          Configure GA4 e execute sync para ver dados de atribuição multi-canal.
        </CardContent>
      </Card>
    </div>
  );
}
