import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function GoogleKeywordsPage() {
  return (
    <div>
      <PageHeader title="Keywords" description="Análise de keywords Google Ads" />
      <Card>
        <CardContent className="p-6 text-sm text-gray-600">
          Execute o agente Google ou sincronize dados para ver análise de keywords.
        </CardContent>
      </Card>
    </div>
  );
}
