import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { notFound } from "next/navigation";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: ReportPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (!report) notFound();

  return (
    <div>
      <PageHeader title={report.title} description={report.summary ?? undefined} />
      <div
        className="prose max-w-none rounded-lg border border-gray-200 bg-white p-6"
        dangerouslySetInnerHTML={{ __html: report.html_content ?? `<p>${report.summary}</p>` }}
      />
    </div>
  );
}
