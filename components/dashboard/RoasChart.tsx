"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RoasDataPoint {
  channel: string;
  roas: number;
}

interface RoasChartProps {
  data: RoasDataPoint[];
  target?: number;
  periodLabel?: string;
}

export function RoasChart({ data, target = 4, periodLabel }: RoasChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          ROAS por Canal
          {periodLabel && (
            <span className="ml-2 text-sm font-normal text-[#6a7178]">
              · {periodLabel}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `${Number(value ?? 0).toFixed(2)}x`} />
            <ReferenceLine y={target} stroke="#E91E8C" strokeDasharray="3 3" label="Alvo" />
            <Bar dataKey="roas" fill="#0070B0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
