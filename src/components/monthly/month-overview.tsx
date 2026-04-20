"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, SquarePen } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdditionalEntriesCard } from "./additional-entries-card";
import { sortAdditionalEntriesDesc } from "@/lib/additional-entries";
import { cn, formatCurrency, formatMonthName } from "@/lib/utils";
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
  const today = new Date();
  const sortedMonths = [...months].sort((a, b) => a.month - b.month);

  const month = sortedMonths.find((m) => m.month === monthNumber);
  const activeIndex = month ? sortedMonths.findIndex((item) => item.id === month.id) : -1;
  const previousMonth = activeIndex > 0 ? sortedMonths[activeIndex - 1] : null;
  const nextMonth = activeIndex >= 0 && activeIndex < sortedMonths.length - 1 ? sortedMonths[activeIndex + 1] : null;

  const recompute = useCallback((updated: MonthData[]) => {
    return computeMonthChain(updated, config.startingBalance, config.interestRate);
  }, [config.interestRate, config.startingBalance]);

  const handleEntriesChange = useCallback((type: "income" | "expense", entries: AdditionalEntry[]) => {
    setMonths((prev) => {
      const updated = prev.map((m) => {
        if (m.month !== monthNumber) return m;
        if (type === "expense") return { ...m, additionalExpenses: sortAdditionalEntriesDesc(entries) };
        return { ...m, additionalIncomes: sortAdditionalEntriesDesc(entries) };
      });
      return recompute(updated);
    });
  }, [monthNumber, recompute]);

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
      <div className="overflow-hidden rounded-lg border border-border/70 bg-background/90 shadow-[0_30px_45px_-30px_rgba(50,50,93,0.25),0_18px_36px_-24px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2 border-b border-border/70 px-3 py-3 sm:px-4">
          {previousMonth ? (
            <Link
              href={`/${config.year}/overview?month=${previousMonth.month}`}
              aria-label={tOverview("previousMonth", {
                month: formatMonthName(previousMonth.month, locale),
              })}
              className={cn(
                buttonVariants({ variant: "outline", size: "icon-sm" }),
                "shrink-0 rounded-md border-border/70 bg-background/90 text-foreground shadow-sm hover:border-primary/35 hover:bg-primary/[0.05] hover:text-primary"
              )}
            >
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-muted-foreground/60"
            >
              <ChevronLeft className="size-4" />
            </span>
          )}

          <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex min-w-full justify-center gap-2 px-1 py-1">
              {sortedMonths.map((item) => {
                const isActive = item.month === month.month;
                const isCurrentMonth =
                  config.year === today.getFullYear() && item.month === today.getMonth() + 1;
                const monthLabel = formatMonthName(item.month, locale);

                return (
                  <div key={item.id} className="flex shrink-0 snap-center">
                    <Link
                      href={`/${config.year}/overview?month=${item.month}`}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={isCurrentMonth ? `${monthLabel}, ${tOverview("currentMonthLabel")}` : monthLabel}
                      className={cn(
                        "inline-flex min-w-20 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium capitalize transition-all",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : isCurrentMonth
                            ? "border-primary/25 bg-primary/[0.06] text-foreground hover:border-primary/40 hover:bg-primary/[0.1]"
                            : "border-border/70 bg-background text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <span>{formatMonthName(item.month, locale, "short")}</span>
                      {isCurrentMonth && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-1.5 rounded-full",
                            isActive ? "bg-primary-foreground/90" : "bg-primary"
                          )}
                        />
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {nextMonth ? (
            <Link
              href={`/${config.year}/overview?month=${nextMonth.month}`}
              aria-label={tOverview("nextMonth", {
                month: formatMonthName(nextMonth.month, locale),
              })}
              className={cn(
                buttonVariants({ variant: "outline", size: "icon-sm" }),
                "shrink-0 rounded-md border-border/70 bg-background/90 text-foreground shadow-sm hover:border-primary/35 hover:bg-primary/[0.05] hover:text-primary"
              )}
            >
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-muted-foreground/60"
            >
              <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      </div>

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
                <div className="mt-2">
                  <Link
                    href={`/${config.year}/${month.month}`}
                    className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/[0.08] px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/[0.14]"
                    aria-label={tOverview("editMonthAria", {
                      month: formatMonthName(month.month, locale),
                    })}
                  >
                    <SquarePen className="size-3.5" />
                    {tOverview("editMonth")}
                  </Link>
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
