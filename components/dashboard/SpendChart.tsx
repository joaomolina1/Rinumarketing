"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SpendDataPoint {
  date: string;
  google: number;
  meta: number;
}

interface SpendChartProps {
  data: SpendDataPoint[];
}

export function SpendChart({ data }: SpendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Spend por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) =>
                new Intl.NumberFormat("pt-PT", {
                  style: "currency",
                  currency: "EUR",
                }).format(Number(value ?? 0))
              }
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="google"
              stackId="1"
              stroke="#0070B0"
              fill="#0070B0"
              fillOpacity={0.6}
              name="Google"
            />
            <Area
              type="monotone"
              dataKey="meta"
              stackId="1"
              stroke="#E91E8C"
              fill="#E91E8C"
              fillOpacity={0.6}
              name="Meta"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
