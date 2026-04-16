"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-sm font-medium">Ahorro por mes</CardTitle>
        <p className="text-xs text-muted-foreground">Distribución mensual del ahorro, separando resultados positivos y negativos.</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" />
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
      </CardContent>
    </Card>
  );
}
