"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface ActionCardData {
  id: string;
  action_type: string;
  platform: string;
  entity_name: string | null;
  entity_id: string;
  reasoning: string;
  expected_impact: string | null;
  risk_level: string | null;
  status: string | null;
}

interface ActionCardProps {
  action: ActionCardData;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
}

const riskColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

export function ActionCard({ action, onApprove, onReject }: ActionCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    if (!onApprove) return;
    setLoading(true);
    await onApprove(action.id);
    setLoading(false);
  }

  async function handleReject() {
    if (!onReject) return;
    setLoading(true);
    await onReject(action.id);
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">
            {action.action_type} — {action.entity_name ?? action.entity_id}
          </CardTitle>
          <div className="mt-2 flex gap-2">
            <Badge variant="outline">{action.platform}</Badge>
            {action.risk_level && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${riskColors[action.risk_level] ?? ""}`}>
                {action.risk_level}
              </span>
            )}
          </div>
        </div>
        <Badge>{action.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{action.reasoning}</p>
        {action.expected_impact && (
          <p className="text-sm text-gray-500">
            <strong>Impacto esperado:</strong> {action.expected_impact}
          </p>
        )}
        {action.status === "pending" && onApprove && onReject && (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleApprove} disabled={loading}>
              Aprovar
            </Button>
            <Button size="sm" variant="outline" onClick={handleReject} disabled={loading}>
              Rejeitar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
