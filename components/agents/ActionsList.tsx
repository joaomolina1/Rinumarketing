"use client";

import { ActionCard, type ActionCardData } from "./ActionCard";
import { useRouter } from "next/navigation";

interface ActionsListProps {
  actions: ActionCardData[];
}

export function ActionsList({ actions }: ActionsListProps) {
  const router = useRouter();

  async function handleApprove(id: string) {
    const approveRes = await fetch("/api/actions/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_id: id }),
    });
    if (!approveRes.ok) return;

    await fetch("/api/actions/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_id: id }),
    });
    router.refresh();
  }

  async function handleReject(id: string) {
    await fetch("/api/actions/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_id: id }),
    });
    router.refresh();
  }

  if (actions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
        Sem acções pendentes de aprovação.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actions.map((action) => (
        <ActionCard
          key={action.id}
          action={action}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ))}
    </div>
  );
}
