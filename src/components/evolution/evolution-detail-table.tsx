"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EvolutionYearMetric } from "@/lib/evolution";
import { formatCurrency } from "@/lib/utils";

interface Props {
  metrics: EvolutionYearMetric[];
}

function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function EvolutionDetailTable({ metrics }: Props) {
  const t = useTranslations("EvolutionDashboard.table");
  const locale = useLocale();

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base font-light tracking-[-0.02em]">{t("title")}</CardTitle>
        <p className="text-sm leading-5 text-muted-foreground">{t("description")}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="min-w-[860px] w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium">{t("year")}</th>
                <th className="px-3 py-3 font-medium">{t("startingBalance")}</th>
                <th className="px-3 py-3 font-medium">{t("finalBalance")}</th>
                <th className="px-3 py-3 font-medium">{t("savedAmount")}</th>
                <th className="px-3 py-3 font-medium">{t("investedAmount")}</th>
                <th className="px-3 py-3 font-medium">{t("accumulatedInvested")}</th>
                <th className="px-3 py-3 font-medium">{t("totalIncome")}</th>
                <th className="px-3 py-3 font-medium">{t("totalExpenses")}</th>
                <th className="px-3 py-3 font-medium">{t("savingsRate")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {metrics.map((metric) => (
                <tr key={metric.year} className="bg-card/70">
                  <td className="px-3 py-3 font-medium text-foreground">{metric.year}</td>
                  <td className="px-3 py-3 finance-number">{formatCurrency(metric.startingBalance, locale)}</td>
                  <td className="px-3 py-3 finance-number">{formatCurrency(metric.finalBalance, locale)}</td>
                  <td className="px-3 py-3 finance-number">{formatCurrency(metric.savedAmount, locale)}</td>
                  <td className="px-3 py-3 finance-number">{formatCurrency(metric.investedAmount, locale)}</td>
                  <td className="px-3 py-3 finance-number">{formatCurrency(metric.accumulatedInvested, locale)}</td>
                  <td className="px-3 py-3 finance-number">{formatCurrency(metric.totalIncome, locale)}</td>
                  <td className="px-3 py-3 finance-number">{formatCurrency(metric.totalExpenses, locale)}</td>
                  <td className="px-3 py-3 finance-number">
                    {metric.savingsRate === null ? t("notAvailable") : formatPercent(metric.savingsRate, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
