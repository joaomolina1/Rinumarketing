"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ga4SyncButton } from "@/components/dashboard/Ga4SyncButton";
import { formatNumber } from "@/lib/utils/formatters";

interface ChannelRow {
  source: string;
  sessions: number;
}

interface Ga4TrafficCardProps {
  dailySessions: { date: string; sessions: number }[];
  topChannels: ChannelRow[];
  periodLabel: string;
  days: number;
  configured: boolean;
  error?: string | null;
}

export function Ga4TrafficCard({
  dailySessions,
  topChannels,
  periodLabel,
  days,
  configured,
  error,
}: Ga4TrafficCardProps) {
  const maxSessions = topChannels[0]?.sessions ?? 1;
  const hasData = dailySessions.length > 0;

  return (
    <Card className="border-[#e9ecef] shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base font-semibold text-[#272b30]">
            Tráfego do site
          </CardTitle>
          <p className="mt-0.5 text-sm text-[#6a7178]">
            {configured ? `Google Analytics · ${periodLabel}` : "Liga o GA4 para ver sessões"}
          </p>
        </div>
        {configured && (
          <div className="flex shrink-0 items-center gap-2">
            <Ga4SyncButton days={days} compact />
            <Link
              href="/dashboard/analytics/attribution"
              className="text-xs font-medium text-[#5cb7f3] hover:underline"
            >
              Atribuição
            </Link>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!configured && (
          <p className="py-8 text-center text-sm text-[#6a7178]">
            Configura em{" "}
            <Link href="/dashboard/settings" className="font-medium text-[#5cb7f3] hover:underline">
              Integrações
            </Link>
          </p>
        )}

        {configured && error && (
          <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.slice(0, 180)}
          </p>
        )}

        {configured && !error && !hasData && (
          <p className="py-8 text-center text-sm text-[#6a7178]">
            Sem dados no período. Clica em atualizar para carregar do GA4.
          </p>
        )}

        {configured && !error && hasData && (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailySessions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={40} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="#5cb7f3"
                    fill="#5cb7f3"
                    fillOpacity={0.15}
                    strokeWidth={2}
                    name="Sessões"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 lg:border-l lg:border-[#f0f0f0] lg:pl-6">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#6a7178]">
                Top canais
              </p>
              {topChannels.length === 0 ? (
                <p className="text-sm text-[#6a7178]">Sem dados de canal</p>
              ) : (
                <ul className="space-y-3">
                  {topChannels.slice(0, 4).map((row) => (
                    <li key={row.source}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-[#272b30]">{row.source}</span>
                        <span className="shrink-0 tabular-nums text-[#6a7178]">
                          {formatNumber(row.sessions)}
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-[#f0f0f0]">
                        <div
                          className="h-full rounded-full bg-[#5cb7f3]"
                          style={{
                            width: `${Math.max(6, (row.sessions / maxSessions) * 100)}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
