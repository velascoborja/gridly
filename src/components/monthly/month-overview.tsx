"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { AdditionalEntriesCard } from "./additional-entries-card";
import { sortAdditionalEntriesDesc } from "@/lib/additional-entries";
import { formatCurrency, formatMonthName } from "@/lib/utils";
import { computeMonthChain } from "@/lib/calculations";
import type { MonthData, YearData, AdditionalEntry } from "@/lib/types";

interface Props {
  yearData: YearData;
  monthNumber: number;
}

export function MonthOverview({ yearData: initialYearData, monthNumber }: Props) {
  const t = useTranslations("Monthly");
  const tOverview = useTranslations("Monthly.overview");
  const locale = useLocale();
  const [months, setMonths] = useState<MonthData[]>(initialYearData.months);
  const config = initialYearData.config;

  const month = months.find((m) => m.month === monthNumber);

  const recompute = useCallback((updated: MonthData[]) => {
    return computeMonthChain(updated, config.startingBalance, config.interestRate);
  }, [config.interestRate, config.startingBalance]);

  const handleEntriesChange = useCallback((type: "income" | "expense", entries: AdditionalEntry[]) => {
    if (!month) return;
    setMonths((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== month.id) return m;
        if (type === "expense") return { ...m, additionalExpenses: sortAdditionalEntriesDesc(entries) };
        return { ...m, additionalIncomes: sortAdditionalEntriesDesc(entries) };
      });
      return recompute(updated);
    });
  }, [month, recompute]);

  if (!month) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        {t("noData")}
      </div>
    );
  }

  const savingsPositive = month.savings >= 0;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
            {/* Left: Identification */}
            <div className="flex flex-col items-center gap-4 sm:gap-8 md:flex-row">
              <div>
                <h2 className="text-2xl font-bold tracking-tight capitalize">
                  {formatMonthName(month.month, locale)} {config.year}
                </h2>
                <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                  <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                  {tOverview("activeMonth")}
                </div>
              </div>
              
              <div className="hidden h-12 w-px bg-white/10 md:block" />

              {/* Center: Primary KPIs */}
              <div className="flex gap-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/50 font-medium">{tOverview("netSavings")}</p>
                  <p className={`text-3xl font-bold tracking-tight tabular-nums ${savingsPositive ? "text-emerald-300" : "text-rose-300"}`}>
                    {savingsPositive ? "+" : ""}{formatCurrency(month.savings, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/50 font-medium">{tOverview("endingBalance")}</p>
                  <p className="text-3xl font-bold tracking-tight tabular-nums text-white/90">
                    {formatCurrency(month.endingBalance, locale)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Secondary Stats */}
            <div className="flex w-full justify-center gap-6 border-t border-white/10 pt-4 md:w-auto md:border-l md:border-t-0 md:pl-8 md:pt-0">
              <div className="space-y-1 md:text-right">
                <p className="text-xs uppercase tracking-widest text-white/30 font-bold">{tOverview("startingBalance")}</p>
                <p className="text-base font-medium tabular-nums text-white/80">{formatCurrency(month.startingBalance, locale)}</p>
              </div>
              <div className="space-y-1 md:text-right">
                <p className="text-xs uppercase tracking-widest text-white/30 font-bold">{tOverview("totalIncome")}</p>
                <p className="text-base font-medium tabular-nums text-emerald-400/80">{formatCurrency(month.totalIncome, locale)}</p>
              </div>
              <div className="space-y-1 md:text-right">
                <p className="text-xs uppercase tracking-widest text-white/30 font-bold">{tOverview("totalExpenses")}</p>
                <p className="text-base font-medium tabular-nums text-rose-400/80">{formatCurrency(month.totalExpenses, locale)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <AdditionalEntriesCard
          monthId={month.id}
          type="expense"
          entries={month.additionalExpenses}
          onEntriesChange={(entries) => handleEntriesChange("expense", entries)}
          title={tOverview("additionalExpensesTitle")}
        />

        <AdditionalEntriesCard
          monthId={month.id}
          type="income"
          entries={month.additionalIncomes}
          onEntriesChange={(entries) => handleEntriesChange("income", entries)}
          title={tOverview("additionalIncomeTitle")}
        />
      </div>
    </div>
  );
}
