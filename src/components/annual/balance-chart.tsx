"use client";

import { useTranslations, useLocale } from "next-intl";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { MonthData } from "@/lib/types";

interface Props {
  months: MonthData[];
}

export function BalanceChart({ months }: Props) {
  const t = useTranslations("Annual.charts");
  const locale = useLocale();

  const data = months.map((m) => {
    const date = new Date(2000, m.month - 1, 1);
    const monthName = new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
    return {
      name: monthName,
      saldo: m.endingBalance,
    };
  });

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-sm font-medium">{t("balanceTitle")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("balanceDescription")}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" />
              <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
                width={40}
              />
              <Tooltip formatter={(v) => formatCurrency(Number(v), locale)} labelClassName="font-medium" />
              <Line
                name={t("balanceLabel")}
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
      </CardContent>
    </Card>
  );
}
