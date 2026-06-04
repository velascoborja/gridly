"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EvolutionYearMetric } from "@/lib/evolution";
import { formatCurrency } from "@/lib/utils";

interface Props {
  metrics: EvolutionYearMetric[];
  estimatedValues?: { year: number; estimatedPortfolioValue: number }[] | null;
}

function axisCurrency(value: number) {
  return `${(value / 1000).toFixed(0)}k`;
}

export function EvolutionCharts({ metrics, estimatedValues }: Props) {
  const t = useTranslations("Evolution.charts");
  const locale = useLocale();

  const balanceData = metrics.map((m, idx) => {
    const ep = estimatedValues?.[idx]?.estimatedPortfolioValue;
    return {
      ...m,
      totalWealth: m.finalBalance + m.accumulatedInvested,
      estimatedPortfolioValue: ep,
      estimatedTotalWealth: ep !== undefined ? m.finalBalance + ep : undefined,
    };
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-base font-light tracking-[-0.02em]">{t("balanceTitle")}</CardTitle>
          <p className="text-sm leading-5 text-muted-foreground">{t("balanceDescription")}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-2 sm:p-3">
            <div className="h-[200px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceData} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={axisCurrency} tick={{ fontSize: 11 }} width={44} />
                <Tooltip formatter={(value) => formatCurrency(Number(value), locale)} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line name={t("balanceLabel")} type="monotone" dataKey="finalBalance" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} stroke="var(--color-primary)" />
                {estimatedValues ? (
                  <>
                    <Line name={t("estimatedPortfolioLabel")} type="monotone" dataKey="estimatedPortfolioValue" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} stroke="var(--color-chart-2)" strokeDasharray="5 3" />
                    <Line name={t("estimatedTotalWealthLabel")} type="monotone" dataKey="estimatedTotalWealth" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} stroke="var(--color-chart-4)" strokeDasharray="2 2" />
                  </>
                ) : (
                  <>
                    <Line name={t("accumulatedInvestedLabel")} type="monotone" dataKey="accumulatedInvested" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} stroke="var(--color-chart-2)" strokeDasharray="5 3" />
                    <Line name={t("totalWealthLabel")} type="monotone" dataKey="totalWealth" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} stroke="var(--color-chart-4)" strokeDasharray="2 2" />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-base font-light tracking-[-0.02em]">{t("savedTitle")}</CardTitle>
            <p className="text-sm leading-5 text-muted-foreground">{t("savedDescription")}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-2 sm:p-3">
              <div className="h-[180px] sm:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={metrics} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tickFormatter={axisCurrency} tick={{ fontSize: 11 }} width={44} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                    tick={{ fontSize: 11 }}
                    width={36}
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === t("savingsRateLabel")
                        ? `${(Number(value) * 100).toFixed(1)}%`
                        : formatCurrency(Number(value), locale)
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Bar yAxisId="left" name={t("savedLabel")} dataKey="savedAmount" radius={[3, 3, 0, 0]}>
                    {metrics.map((metric) => (
                      <Cell key={metric.year} fill={metric.savedAmount >= 0 ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)"} />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="right"
                    name={t("savingsRateLabel")}
                    type="monotone"
                    dataKey="savingsRate"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    stroke="var(--color-chart-3)"
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-base font-light tracking-[-0.02em]">{t("investedTitle")}</CardTitle>
            <p className="text-sm leading-5 text-muted-foreground">{t("investedDescription")}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-2 sm:p-3">
              <div className="h-[180px] sm:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={axisCurrency} tick={{ fontSize: 11 }} width={44} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), locale)} />
                  <Bar name={t("investedLabel")} dataKey="investedAmount" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-base font-light tracking-[-0.02em]">{t("interestTitle")}</CardTitle>
            <p className="text-sm leading-5 text-muted-foreground">{t("interestDescription")}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-2 sm:p-3">
              <div className="h-[180px] sm:h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={axisCurrency} tick={{ fontSize: 11 }} width={44} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value), locale)} />
                  <Bar name={t("interestLabel")} dataKey="interestsEarned" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
