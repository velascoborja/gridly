"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MONTH_NAMES, formatCurrency } from "@/lib/utils";
import type { MonthData } from "@/lib/types";

interface Props {
  months: MonthData[];
}

export function BalanceChart({ months }: Props) {
  const data = months.map((m) => ({
    name: MONTH_NAMES[m.month - 1].slice(0, 3),
    saldo: m.endingBalance,
  }));

  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-muted-foreground">Evolución del saldo</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
            width={40}
          />
          <Tooltip formatter={(v) => formatCurrency(Number(v))} labelClassName="font-medium" />
          <Line
            type="monotone"
            dataKey="saldo"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            className="stroke-primary"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
