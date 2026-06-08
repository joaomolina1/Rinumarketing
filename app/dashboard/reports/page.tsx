import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportCard } from "@/components/reports/ReportCard";

export default async function ReportsPage() {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Relatórios semanais gerados automaticamente"
      />
      {reports && reports.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              id={report.id}
              title={report.title}
              summary={report.summary}
              status={report.status}
              weekStart={report.week_start}
              weekEnd={report.week_end}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
          Sem relatórios gerados. Configure o workflow n8n para relatórios semanais automáticos.
        </div>
      )}
    </div>
  );
}
