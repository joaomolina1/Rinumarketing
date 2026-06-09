import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAnalysisPeriodLabel } from "@/lib/utils/analysis-period";

interface DataCoverageAlertProps {
  selectedDays: number;
  availableDays: number;
}

export function DataCoverageAlert({
  selectedDays,
  availableDays,
}: DataCoverageAlertProps) {
  if (availableDays >= selectedDays) return null;

  return (
    <Alert className="mb-6 border-[#fff3cd] bg-[#fffbeb] text-[#856404]">
      <AlertTitle>Dados históricos limitados</AlertTitle>
      <AlertDescription>
        Pediste {getAnalysisPeriodLabel(selectedDays).toLowerCase()}, mas só existem{" "}
        <strong>{availableDays}</strong> dia{availableDays === 1 ? "" : "s"} sincronizados
        na base de dados. Usa <strong>Sincronizar 30 dias</strong> para importar o
        histórico do Google e Meta — depois o selector passa a mostrar diferenças reais
        entre períodos.
      </AlertDescription>
    </Alert>
  );
}
