"use client";

import { Award, CalendarDays, Landmark, PiggyBank, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import type { EvolutionSummary } from "@/lib/evolution";
import { formatCurrency } from "@/lib/utils";

interface Props {
  summary: EvolutionSummary;
  estimatedPortfolioValue?: number | null;
  returnRate?: number | null;
}

function formatPercent(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function EvolutionKpiCards({ summary, estimatedPortfolioValue, returnRate }: Props) {
  const t = useTranslations("Evolution.kpis");
  const locale = useLocale();
  const savingsRateTag =
    summary.averageSavingsRate !== null
      ? t("totalSavedSavingsRate", { rate: formatPercent(summary.averageSavingsRate, locale) })
      : t("totalSavedSavingsRateEmpty");

  const hasEstimate = estimatedPortfolioValue != null && returnRate != null;

  const investedCard = hasEstimate
    ? {
        label: t("estimatedPortfolioValue"),
        value: formatCurrency(estimatedPortfolioValue, locale),
        note: t("estimatedPortfolioValueNote", { rate: returnRate }),
        tag: t("estimatedPortfolioInvestedTag", { amount: formatCurrency(summary.accumulatedInvested, locale) }),
        Icon: PiggyBank,
        className: "text-primary",
      }
    : {
        label: t("accumulatedInvested"),
        value: formatCurrency(summary.accumulatedInvested, locale),
        note: t("accumulatedInvestedNote"),
        tag: undefined as string | undefined,
        Icon: PiggyBank,
        className: "text-primary",
      };

  const bestYearRunnerUps = summary.topYears.slice(1).map((y) =>
    t("bestYearRunnerUp", { year: String(y.year), amount: formatCurrency(y.savedAmount, locale) })
  );

  const cards = [
    {
      label: t("latestFinalBalance"),
      value: formatCurrency(summary.latestFinalBalance, locale),
      note: t("latestFinalBalanceNote"),
      tag: undefined as string | undefined,
      subItems: undefined as string[] | undefined,
      Icon: Landmark,
      className: "text-primary",
    },
    {
      label: t("totalSaved"),
      value: formatCurrency(summary.totalSaved, locale),
      note: t("totalSavedNote"),
      tag: undefined as string | undefined,
      subItems: undefined as string[] | undefined,
      Icon: TrendingUp,
      className: summary.totalSaved >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
    },
    { ...investedCard, subItems: undefined as string[] | undefined },
    {
      label: t("averageSavingsPerYear"),
      value: formatCurrency(summary.averageSavingsPerYear, locale),
      note: t("averageSavingsPerYearNote"),
      tag: savingsRateTag,
      subItems: undefined as string[] | undefined,
      Icon: CalendarDays,
      className: summary.averageSavingsPerYear >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
    },
    {
      label: t("bestYear"),
      value: summary.topYears[0] ? String(summary.topYears[0].year) : t("notAvailable"),
      note: summary.topYears[0] ? t("bestYearNote", { amount: formatCurrency(summary.topYears[0].savedAmount, locale) }) : t("bestYearEmpty"),
      tag: undefined as string | undefined,
      subItems: bestYearRunnerUps.length > 0 ? bestYearRunnerUps : undefined,
      Icon: Award,
      className: "text-foreground",
    },
  ];

  return (
    <div className="mt-5 flex flex-wrap justify-center gap-3">
      {cards.map(({ label, value, note, tag, subItems, Icon, className }) => (
        <Card key={label} className="w-[calc(50%-6px)] border-border/70 bg-card/90 shadow-sm md:w-[calc(33.333%-8px)] xl:w-[calc(20%-9.6px)]">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium leading-4 text-muted-foreground sm:text-sm">{label}</p>
              <Icon className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
            </div>
            <p className={`mt-2 finance-number text-xl font-light tracking-[-0.04em] sm:text-2xl lg:text-3xl ${className}`}>
              {value}
            </p>
            <p className="mt-1.5 text-xs leading-4 text-muted-foreground sm:mt-2 sm:leading-5">{note}</p>
            {tag && (
              <p className="mt-1.5 text-xs font-medium text-primary/80">{tag}</p>
            )}
            {subItems && subItems.length > 0 && (
              <div className="mt-2 space-y-0.5 border-t border-border/50 pt-2">
                {subItems.map((item) => (
                  <p key={item} className="text-xs text-muted-foreground/70">{item}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
