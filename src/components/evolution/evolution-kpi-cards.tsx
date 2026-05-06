"use client";

import { Award, Landmark, PiggyBank, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import type { EvolutionSummary } from "@/lib/evolution";
import { formatCurrency } from "@/lib/utils";

interface Props {
  summary: EvolutionSummary;
}

export function EvolutionKpiCards({ summary }: Props) {
  const t = useTranslations("Evolution.kpis");
  const locale = useLocale();
  const cards = [
    {
      label: t("latestFinalBalance"),
      value: formatCurrency(summary.latestFinalBalance, locale),
      note: t("latestFinalBalanceNote"),
      Icon: Landmark,
      className: "text-primary",
    },
    {
      label: t("totalSaved"),
      value: formatCurrency(summary.totalSaved, locale),
      note: t("totalSavedNote"),
      Icon: TrendingUp,
      className: summary.totalSaved >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
    },
    {
      label: t("accumulatedInvested"),
      value: formatCurrency(summary.accumulatedInvested, locale),
      note: t("accumulatedInvestedNote"),
      Icon: PiggyBank,
      className: "text-primary",
    },
    {
      label: t("bestYear"),
      value: summary.bestYear ? String(summary.bestYear.year) : t("notAvailable"),
      note: summary.bestYear ? t("bestYearNote", { amount: formatCurrency(summary.bestYear.savedAmount, locale) }) : t("bestYearEmpty"),
      Icon: Award,
      className: "text-foreground",
    },
  ];

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, note, Icon, className }) => (
        <Card key={label} className="border-border/70 bg-card/90 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className={`mt-3 finance-number text-2xl font-light tracking-[-0.04em] md:text-3xl ${className}`}>
              {value}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
