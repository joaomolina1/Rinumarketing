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
}

export function RoasChart({ data, target = 4 }: RoasChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">ROAS por Canal</CardTitle>
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
