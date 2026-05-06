"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EvolutionYearMetric } from "@/lib/evolution";
import { formatCurrency } from "@/lib/utils";

interface Props {
  metrics: EvolutionYearMetric[];
}

function axisCurrency(value: number) {
  return `${(value / 1000).toFixed(0)}k`;
}

export function EvolutionCharts({ metrics }: Props) {
  const t = useTranslations("Evolution.charts");
  const locale = useLocale();

  return (
    <div className="space-y-6">
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-base font-light tracking-[-0.02em]">{t("balanceTitle")}</CardTitle>
          <p className="text-sm leading-5 text-muted-foreground">{t("balanceDescription")}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={metrics} margin={{ top: 6, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={axisCurrency} tick={{ fontSize: 11 }} width={44} />
                <Tooltip formatter={(value) => formatCurrency(Number(value), locale)} />
                <Line name={t("balanceLabel")} type="monotone" dataKey="finalBalance" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} className="stroke-primary" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-base font-light tracking-[-0.02em]">{t("savedTitle")}</CardTitle>
            <p className="text-sm leading-5 text-muted-foreground">{t("savedDescription")}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={metrics} margin={{ top: 6, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={axisCurrency} tick={{ fontSize: 11 }} width={44} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), locale)} />
                  <Bar name={t("savedLabel")} dataKey="savedAmount" radius={[3, 3, 0, 0]}>
                    {metrics.map((metric) => (
                      <Cell key={metric.year} fill={metric.savedAmount >= 0 ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-base font-light tracking-[-0.02em]">{t("investedTitle")}</CardTitle>
            <p className="text-sm leading-5 text-muted-foreground">{t("investedDescription")}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={metrics} margin={{ top: 6, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={axisCurrency} tick={{ fontSize: 11 }} width={44} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), locale)} />
                  <Bar name={t("investedLabel")} dataKey="investedAmount" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
