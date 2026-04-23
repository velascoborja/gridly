import { useLocale, useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, Download, Minus, PiggyBank, Settings, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { YearConfigForm } from "./year-config-form";
import type { MonthData, YearConfig } from "@/lib/types";

interface Props {
  months: MonthData[];
  startingBalance: number;
  config: YearConfig;
  description: string;
  savingConfig: boolean;
  startingBalanceEditable: boolean;
  onConfigChange: (config: YearConfig) => void;
  onExport: () => void;
  onPendingSave: (savePromise: Promise<void>) => void;
}

interface MetricTone {
  valueClassName: string;
  badgeClassName: string;
  label: string;
  Icon: LucideIcon;
}

interface ToneLabels {
  positive: string;
  negative: string;
  neutral: string;
}

interface KpiMetric {
  label: string;
  value: number;
  note: string;
  comparison?: string;
  tone: MetricTone;
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

export function KpiCards({
  months,
  startingBalance,
  config,
  description,
  savingConfig,
  startingBalanceEditable,
  onConfigChange,
  onExport,
  onPendingSave,
}: Props) {
  const tAnnual = useTranslations("Annual");
  const t = useTranslations("Annual.kpis");
  const locale = useLocale();
  const populated = months.filter((m) => m.totalIncome > 0 || m.totalExpenses > 0);
  const totalSavings = populated.reduce((s, m) => s + m.savings, 0);
  const totalInvestment = months.reduce((sum, month) => sum + month.investment, 0);
  const investmentMonths = months.filter((month) => month.investment > 0).length;
  const avgSavings = populated.length > 0 ? totalSavings / populated.length : 0;
  const maxSavings = populated.length > 0 ? Math.max(...populated.map((m) => m.savings)) : 0;
  const endingBalance = months.length > 0 ? months[months.length - 1].endingBalance : startingBalance;
  const balanceDelta = endingBalance - startingBalance;
  const toneLabels = {
    positive: t("positiveTrend"),
    negative: t("negativeTrend"),
    neutral: t("neutralTrend"),
  };
  const investmentTone = {
    valueClassName: "text-primary",
    badgeClassName: "border-primary/20 bg-primary/10 text-primary",
    label: t("neutralTrend"),
    Icon: PiggyBank,
  };

  const primaryMetrics: KpiMetric[] = [
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

  const supportingMetrics: KpiMetric[] = [
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
    {
      label: t("totalInvestment"),
      value: totalInvestment,
      note: t("totalInvestmentNote"),
      comparison: t("investmentMonths", { count: investmentMonths }),
      tone: investmentTone,
    },
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.85fr)]">
      <Card className="surface-depth-floating border-primary/20 bg-card/95">
        <CardContent className="px-5 py-5 md:px-6">
          <div className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                {t("heroEyebrow")}
              </p>
              <h1 className="mt-2 text-3xl font-light tracking-[-0.04em] text-foreground md:text-4xl">
                {tAnnual("yearLabel", { year: config.year })}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-end">
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 border-border/70 bg-background/80 text-muted-foreground shadow-sm hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">{tAnnual("configButton")}</span>
                      </Button>
                    }
                  />
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{tAnnual("configTitle")}</DialogTitle>
                      <DialogDescription>
                        {tAnnual("configDescription")}
                      </DialogDescription>
                    </DialogHeader>
                    <YearConfigForm
                      config={config}
                      startingBalanceEditable={startingBalanceEditable}
                      onConfigChange={onConfigChange}
                      onPendingSave={onPendingSave}
                    />
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  disabled={savingConfig}
                  className="border-primary/20 bg-primary/[0.06] text-primary shadow-sm hover:border-primary/35 hover:bg-primary/[0.1] hover:text-primary"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {savingConfig ? tAnnual("saving") : tAnnual("exportExcel")}
                </Button>
              </div>

              {savingConfig ? (
                <p className="max-w-sm text-xs leading-5 text-muted-foreground sm:max-w-md lg:text-right">
                  {tAnnual("savingDescription")}
                </p>
              ) : null}
            </div>
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
                  <p className={`mt-3 text-[2.1rem] font-light leading-none tracking-[-0.05em] finance-number md:text-5xl ${metric.tone.valueClassName}`}>
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

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardContent className="flex flex-col justify-center px-5 py-6 h-full">
          <div className="space-y-6">
            {supportingMetrics.map((metric, index) => {
              const { Icon } = metric.tone;

              return (
                <div 
                  key={metric.label} 
                  className={`flex items-start justify-between gap-4 ${
                    index !== 0 ? "border-t border-border/40 pt-6" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${metric.tone.badgeClassName}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <p className="text-base font-medium text-muted-foreground">
                        {metric.label}
                      </p>
                    </div>
                    <p className="mt-2 text-[13px] leading-5 text-muted-foreground/70">
                      {metric.note}
                    </p>
                  </div>
                  
                  <div className="text-right pl-4">
                    <p className={`text-3xl font-light tracking-[-0.04em] finance-number md:text-4xl ${metric.tone.valueClassName}`}>
                      {formatCurrency(metric.value, locale)}
                    </p>
                    {metric.comparison ? (
                      <p className="finance-number mt-1.5 text-xs text-muted-foreground/60">
                        {metric.comparison}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
