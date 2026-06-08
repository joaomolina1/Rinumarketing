import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface ReportCardProps {
  id: string;
  title: string;
  summary: string | null;
  status: string | null;
  weekStart: string;
  weekEnd: string;
}

export function ReportCard({ id, title, summary, status, weekStart, weekEnd }: ReportCardProps) {
  return (
    <Link href={`/dashboard/reports/${id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant={status === "sent" ? "default" : "secondary"}>
            {status ?? "draft"}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">
            {format(new Date(weekStart), "dd/MM", { locale: pt })} —{" "}
            {format(new Date(weekEnd), "dd/MM/yyyy", { locale: pt })}
          </p>
          {summary && (
            <p className="mt-2 line-clamp-2 text-sm text-gray-600">{summary}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
