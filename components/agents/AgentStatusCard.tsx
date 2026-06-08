import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface AgentStatusCardProps {
  agentName: string;
  status: string;
  lastRun?: string;
  actionsCount?: number;
}

const agentLabels: Record<string, string> = {
  orchestrator: "Orquestrador",
  google: "Google Ads",
  meta: "Meta Ads",
  analytics: "Analytics",
};

export function AgentStatusCard({
  agentName,
  status,
  lastRun,
  actionsCount,
}: AgentStatusCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          {agentLabels[agentName] ?? agentName}
        </CardTitle>
        <Badge
          variant={
            status === "completed" ? "default" : status === "running" ? "secondary" : "destructive"
          }
        >
          {status}
        </Badge>
      </CardHeader>
      <CardContent>
        {lastRun && (
          <p className="text-xs text-gray-500">
            Última execução:{" "}
            {format(new Date(lastRun), "dd/MM/yyyy HH:mm", { locale: pt })}
          </p>
        )}
        {actionsCount !== undefined && (
          <p className="mt-1 text-sm text-gray-700">{actionsCount} acções propostas</p>
        )}
      </CardContent>
    </Card>
  );
}
