import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export default function MetaCreativesPage() {
  return (
    <div>
      <PageHeader title="Criativos" description="Análise de creative fatigue" />
      <Card>
        <CardContent className="p-6 text-sm text-gray-600">
          Sincronize dados Meta para analisar frequência e fadiga de criativos.
        </CardContent>
      </Card>
    </div>
  );
}
