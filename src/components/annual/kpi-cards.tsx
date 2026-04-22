import { useLocale, useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { MonthData } from "@/lib/types";

interface Props {
  months: MonthData[];
  startingBalance: number;
}

interface MetricTone {
  valueClassName: string;
  badgeClassName: string;
  label: string;
  Icon: typeof ArrowUpRight;
}

interface ToneLabels {
  positive: string;
  negative: string;
  neutral: string;
}

function getMetricTone(value: number, labels: ToneLabels): MetricTone {
  if (value > 0) {
    return {
      valueClassName: "text-emerald-600 dark:text-emerald-400",
      badgeClassName: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      label: labels.positive,
      Icon: ArrowUpRight,
    };
  }

  if (value < 0) {
    return {
      valueClassName: "text-rose-600 dark:text-rose-400",
      badgeClassName: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      label: labels.negative,
      Icon: ArrowDownRight,
    };
  }

  return {
    valueClassName: "text-foreground",
    badgeClassName: "border-border/70 bg-muted/60 text-muted-foreground",
    label: labels.neutral,
    Icon: Minus,
  };
}

export function KpiCards({ months, startingBalance }: Props) {
  const t = useTranslations("Annual.kpis");
  const locale = useLocale();
  const populated = months.filter((m) => m.totalIncome > 0 || m.totalExpenses > 0);
  const totalSavings = populated.reduce((s, m) => s + m.savings, 0);
  const avgSavings = populated.length > 0 ? totalSavings / populated.length : 0;
  const maxSavings = populated.length > 0 ? Math.max(...populated.map((m) => m.savings)) : 0;
  const endingBalance = months.length > 0 ? months[months.length - 1].endingBalance : startingBalance;
  const balanceDelta = endingBalance - startingBalance;
  const toneLabels = {
    positive: t("positiveTrend"),
    negative: t("negativeTrend"),
    neutral: t("neutralTrend"),
  };

  const primaryMetrics = [
    {
      label: t("estimatedBalance"),
      value: endingBalance,
      note: t("estimatedBalanceNote"),
      comparison: t("balanceDelta", { amount: formatCurrency(balanceDelta, locale) }),
      tone: getMetricTone(balanceDelta, toneLabels),
    },
    {
      label: t("totalSavings"),
      value: totalSavings,
      note: t("totalSavingsNote"),
      comparison: t("activeMonths", { count: populated.length }),
      tone: getMetricTone(totalSavings, toneLabels),
    },
  ];

  const supportingMetrics = [
    {
      label: t("avgSavings"),
      value: avgSavings,
      note: t("avgSavingsNote"),
      tone: getMetricTone(avgSavings, toneLabels),
    },
    {
      label: t("bestMonth"),
      value: maxSavings,
      note: t("bestMonthNote"),
      tone: getMetricTone(maxSavings, toneLabels),
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.85fr)]">
      <Card className="surface-depth-floating border-primary/20 bg-card/95">
        <CardContent className="px-5 py-5 md:px-6">
          <div className="mb-5 max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              {t("heroEyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-light tracking-[-0.04em] text-foreground md:text-3xl">
              {t("heroTitle")}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {primaryMetrics.map((metric) => {
              const { Icon } = metric.tone;

              return (
                <section key={metric.label} className="border-t border-border/70 pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${metric.tone.badgeClassName}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {metric.tone.label}
                    </span>
                  </div>
                  <p className={`mt-3 text-[2.35rem] font-light leading-none tracking-[-0.05em] finance-number md:text-5xl ${metric.tone.valueClassName}`}>
                    {formatCurrency(metric.value, locale)}
                  </p>
                  <div className="mt-4 space-y-1 text-sm leading-5 text-muted-foreground">
                    <p>{metric.note}</p>
                    <p className="finance-number text-xs text-muted-foreground/80">{metric.comparison}</p>
                  </div>
                </section>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        {supportingMetrics.map((metric) => {
          const { Icon } = metric.tone;

          return (
            <Card key={metric.label} className="border-border/70 bg-card/90 shadow-sm">
              <CardContent className="px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className={`mt-3 text-3xl font-light tracking-[-0.04em] finance-number ${metric.tone.valueClassName}`}>
                      {formatCurrency(metric.value, locale)}
                    </p>
                  </div>
                  <div className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${metric.tone.badgeClassName}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">{metric.note}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
