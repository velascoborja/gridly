"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { MONTH_NAMES, formatCurrency } from "@/lib/utils";
import type { MonthData } from "@/lib/types";

interface Props {
  months: MonthData[];
}

export function SavingsChart({ months }: Props) {
  const data = months.map((m) => ({
    name: MONTH_NAMES[m.month - 1].slice(0, 3),
    ahorro: m.savings,
  }));

  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-muted-foreground">Ahorro por mes</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={40} />
          <Tooltip formatter={(v) => formatCurrency(Number(v))} />
          <Bar dataKey="ahorro" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.ahorro >= 0 ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
