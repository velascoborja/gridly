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
  Icon: typeof ArrowUpRight;
}

function getMetricTone(value: number): MetricTone {
  if (value > 0) {
    return {
      valueClassName: "text-emerald-600 dark:text-emerald-400",
      badgeClassName: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      Icon: ArrowUpRight,
    };
  }

  if (value < 0) {
    return {
      valueClassName: "text-rose-600 dark:text-rose-400",
      badgeClassName: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      Icon: ArrowDownRight,
    };
  }

  return {
    valueClassName: "text-foreground",
    badgeClassName: "border-border/70 bg-muted/60 text-muted-foreground",
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

  const featured = [
    {
      label: t("estimatedBalance"),
      value: endingBalance,
      note: t("estimatedBalanceNote"),
      tone: getMetricTone(balanceDelta),
    },
    {
      label: t("totalSavings"),
      value: totalSavings,
      note: t("totalSavingsNote"),
      tone: getMetricTone(totalSavings),
    },
  ];

  const secondary = [
    {
      label: t("avgSavings"),
      value: avgSavings,
      note: t("avgSavingsNote"),
      tone: getMetricTone(avgSavings),
    },
    {
      label: t("bestMonth"),
      value: maxSavings,
      note: t("bestMonthNote"),
      tone: getMetricTone(maxSavings),
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.9fr)]">
      <Card className="overflow-hidden border-primary/15 bg-[linear-gradient(135deg,rgba(83,58,253,0.12),rgba(255,255,255,0.96)_32%,rgba(255,255,255,0.98)_100%)] shadow-[0_24px_50px_-30px_rgba(50,50,93,0.35),0_18px_36px_-24px_rgba(0,0,0,0.12)] dark:bg-[linear-gradient(135deg,rgba(83,58,253,0.22),rgba(24,28,47,0.94)_36%,rgba(24,28,47,0.98)_100%)]">
        <CardContent className="px-5 py-5 md:px-6 md:py-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-primary/75">
                  {t("heroEyebrow")}
                </p>
                <h2 className="mt-2 text-[1.75rem] font-light tracking-[-0.04em] text-foreground md:text-[2rem]">
                  {t("heroTitle")}
                </h2>
              </div>
              <div className="rounded-md border border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
                {populated.length > 0
                  ? t("activityCount", { count: populated.length })
                  : t("noActivity")}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featured.map((metric) => {
                const { Icon } = metric.tone;

                return (
                  <div
                    key={metric.label}
                    className="rounded-xl border border-border/70 bg-background/80 p-5 shadow-[0_18px_35px_-28px_rgba(50,50,93,0.35),0_10px_18px_-14px_rgba(0,0,0,0.1)] backdrop-blur"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          {metric.label}
                        </p>
                        <p className={`mt-3 text-3xl font-semibold tracking-[-0.04em] finance-number ${metric.tone.valueClassName}`}>
                          {formatCurrency(metric.value, locale)}
                        </p>
                      </div>
                      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${metric.tone.badgeClassName}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
                      {metric.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        {secondary.map((metric) => {
          const { Icon } = metric.tone;

          return (
            <Card key={metric.label} className="border-border/70 bg-card/92 shadow-sm">
              <CardContent className="px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className={`mt-3 text-2xl font-semibold tracking-[-0.03em] finance-number ${metric.tone.valueClassName}`}>
                      {formatCurrency(metric.value, locale)}
                    </p>
                  </div>
                  <div className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${metric.tone.badgeClassName}`}>
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
