"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Ga4SessionsChartProps {
  data: { date: string; sessions: number }[];
}

export function Ga4SessionsChart({ data }: Ga4SessionsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="sessions" fill="#5cb7f3" radius={[4, 4, 0, 0]} name="Sessões" />
      </BarChart>
    </ResponsiveContainer>
  );
}
