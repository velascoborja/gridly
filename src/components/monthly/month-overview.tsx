"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdditionalEntriesCard } from "./additional-entries-card";
import { FixedExpensesCard } from "./fixed-expenses-card";
import { IncomeCard } from "./income-card";
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
  const [showFixedEditors, setShowFixedEditors] = useState(false);
  const [renderFixedEditors, setRenderFixedEditors] = useState(false);
  const [fixedEditorsVisible, setFixedEditorsVisible] = useState(false);
  const [fixedEditorsHeight, setFixedEditorsHeight] = useState<number | "auto">(0);
  const config = initialYearData.config;
  const today = new Date();
  const activeMonthTabRef = useRef<HTMLDivElement>(null);
  const fixedEditorsInnerRef = useRef<HTMLDivElement>(null);
  const fixedEditorsFrameRef = useRef<number | null>(null);
  const sortedMonths = [...months].sort((a, b) => a.month - b.month);

  useEffect(() => {
    setMonths(initialYearData.months);
  }, [initialYearData]);

  useEffect(() => {
    setShowFixedEditors(false);
  }, [monthNumber]);

  useEffect(() => {
    if (showFixedEditors) {
      setRenderFixedEditors(true);
      return undefined;
    }

    setFixedEditorsVisible(false);
    return undefined;
  }, [showFixedEditors]);

  useEffect(() => {
    return () => {
      if (fixedEditorsFrameRef.current !== null) {
        window.cancelAnimationFrame(fixedEditorsFrameRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const panel = fixedEditorsInnerRef.current;
    if (!renderFixedEditors || !panel) return;

    if (fixedEditorsFrameRef.current !== null) {
      window.cancelAnimationFrame(fixedEditorsFrameRef.current);
      fixedEditorsFrameRef.current = null;
    }

    if (showFixedEditors) {
      setFixedEditorsHeight(0);
      setFixedEditorsVisible(false);
      fixedEditorsFrameRef.current = window.requestAnimationFrame(() => {
        setFixedEditorsVisible(true);
        setFixedEditorsHeight(panel.scrollHeight);
        fixedEditorsFrameRef.current = null;
      });
      return;
    }

    const currentHeight = panel.scrollHeight;
    setFixedEditorsHeight(currentHeight);
    fixedEditorsFrameRef.current = window.requestAnimationFrame(() => {
      setFixedEditorsHeight(0);
      fixedEditorsFrameRef.current = null;
    });
  }, [renderFixedEditors, showFixedEditors]);

  useLayoutEffect(() => {
    activeMonthTabRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "instant",
    });
  }, [monthNumber]);

  const month = sortedMonths.find((m) => m.month === monthNumber);
  const activeIndex = month ? sortedMonths.findIndex((item) => item.id === month.id) : -1;
  const previousMonth = activeIndex > 0 ? sortedMonths[activeIndex - 1] : null;
  const nextMonth = activeIndex >= 0 && activeIndex < sortedMonths.length - 1 ? sortedMonths[activeIndex + 1] : null;

  const recompute = useCallback((updated: MonthData[]) => {
    return computeMonthChain(updated, config.startingBalance, config.interestRate);
  }, [config.interestRate, config.startingBalance]);

  const handleFixedUpdate = useCallback(async (field: string, value: number) => {
    if (!month) return;
    const res = await fetch(`/api/months/${month.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) throw new Error("Failed to update");

    setMonths((prev) => {
      const updated = prev.map((m) =>
        m.id === month.id
          ? {
              ...m,
              [field]: value,
              ...(field === "interests" ? { interestsManualOverride: true } : {}),
            }
          : m
      );
      return recompute(updated);
    });
  }, [month, recompute]);

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
  const isSelectedMonthCurrent =
    config.year === today.getFullYear() && month.month === today.getMonth() + 1;
  const isPastMonth =
    config.year < today.getFullYear() || (config.year === today.getFullYear() && month.month < today.getMonth() + 1);
  const isFutureMonth =
    config.year > today.getFullYear() || (config.year === today.getFullYear() && month.month > today.getMonth() + 1);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-border/70 bg-background/90 shadow-[0_30px_45px_-30px_rgba(50,50,93,0.25),0_18px_36px_-24px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2 border-b border-border/70 px-3 py-3 sm:px-4">
          {previousMonth ? (
            <Link
              href={`/${config.year}/${previousMonth.month}`}
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

          <div className="min-w-0 flex-1 overflow-x-auto scroll-px-3 snap-x snap-mandatory scrollbar-hide [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] sm:scroll-px-1 sm:[mask-image:none]">
            <div className="mx-auto flex w-max min-w-max gap-2 px-3 sm:px-1 py-1">
              {sortedMonths.map((item) => {
                const isActive = item.month === month.month;
                const isItemCurrentMonth =
                  config.year === today.getFullYear() && item.month === today.getMonth() + 1;
                const isItemPastMonth =
                  config.year < today.getFullYear() || (config.year === today.getFullYear() && item.month < today.getMonth() + 1);
                const monthLabel = formatMonthName(item.month, locale);

                return (
                  <div
                    key={item.id}
                    ref={isActive ? activeMonthTabRef : null}
                    className="flex shrink-0 snap-center"
                  >
                    <Link
                      href={`/${config.year}/${item.month}`}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={isItemCurrentMonth ? `${monthLabel}, ${tOverview("currentMonthLabel")}` : monthLabel}
                      className={cn(
                        "inline-flex min-w-20 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium capitalize transition-all",
                        isActive
                          ? isItemPastMonth
                            ? "border-slate-700 bg-slate-800 text-slate-100 shadow-sm"
                            : isItemCurrentMonth
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-indigo-600 bg-indigo-700 text-indigo-50 shadow-sm"
                          : isItemCurrentMonth
                            ? "border-primary/25 bg-primary/[0.06] text-foreground hover:border-primary/40 hover:bg-primary/[0.1]"
                            : isItemPastMonth
                              ? "border-border/40 bg-muted/20 text-muted-foreground/60 hover:border-border/60 hover:bg-muted/40 hover:text-foreground/80"
                              : "border-indigo-100/50 bg-indigo-50/30 text-indigo-700/60 hover:border-indigo-200/70 hover:bg-indigo-50/50 hover:text-indigo-800"
                      )}
                    >
                      <span>{formatMonthName(item.month, locale, "short")}</span>
                      {isItemCurrentMonth && (
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
              href={`/${config.year}/${nextMonth.month}`}
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

      <Card
        className={cn(
          "overflow-hidden border-white/10 text-white shadow-[0_30px_45px_-30px_rgba(50,50,93,0.45),0_18px_36px_-18px_rgba(0,0,0,0.22)] transition-colors duration-500",
          isPastMonth
            ? "bg-gradient-to-br from-slate-900 via-[#0d253d] to-slate-950"
            : isSelectedMonthCurrent
              ? "bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] shadow-[0_30px_60px_-15px_rgba(83,58,253,0.25)]"
              : "bg-gradient-to-br from-[#1c1e54] via-[#0d253d] to-slate-950"
        )}
      >
        <CardContent className="px-6 py-3">
          <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-center md:justify-between md:text-left">
            {/* Left: Identification */}
            <div className="flex flex-col items-center gap-4 sm:gap-8 md:flex-row">
              <div>
                <h2 className="text-2xl font-bold tracking-tight capitalize">
                  {formatMonthName(month.month, locale)} {config.year}
                </h2>
                <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isSelectedMonthCurrent
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                        : isPastMonth
                          ? "bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]"
                          : "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                    )}
                  />
                  {tOverview(
                    isSelectedMonthCurrent ? "currentMonth" : isPastMonth ? "pastMonth" : isFutureMonth ? "futureMonth" : "activeMonth"
                  )}
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    aria-expanded={showFixedEditors}
                    aria-controls="month-fixed-editors"
                    className="inline-flex items-center gap-1 rounded-md border border-white/18 bg-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:border-white/28 hover:bg-white/16"
                    aria-label={tOverview("editMonthAria", {
                      month: formatMonthName(month.month, locale),
                    })}
                    onClick={() => setShowFixedEditors((prev) => !prev)}
                  >
                    {showFixedEditors ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    {showFixedEditors ? tOverview("hideMonthEditor") : tOverview("editMonth")}
                  </button>
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

      {renderFixedEditors ? (
        <div
          id="month-fixed-editors"
          aria-hidden={!showFixedEditors}
          className={cn(
            "overflow-hidden transition-[height,opacity,transform,margin] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[height,opacity,transform]",
            fixedEditorsVisible
              ? "mt-0 opacity-100 translate-y-0"
              : "-mt-2 opacity-0 -translate-y-1.5 pointer-events-none"
          )}
          style={{ height: fixedEditorsHeight === "auto" ? "auto" : `${fixedEditorsHeight}px` }}
          onTransitionEnd={(event) => {
            if (event.target !== event.currentTarget || event.propertyName !== "height") return;
            if (showFixedEditors && fixedEditorsVisible) {
              setFixedEditorsHeight("auto");
              return;
            }
            setRenderFixedEditors(false);
          }}
        >
          <div ref={fixedEditorsInnerRef} className="overflow-hidden">
            <div
              className={cn(
                "grid gap-4 pt-1 pb-0.5 transition-[opacity,transform,filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:grid-cols-2",
                fixedEditorsVisible
                  ? "opacity-100 translate-y-0 blur-0"
                  : "opacity-0 translate-y-1.5 blur-[2px]"
              )}
            >
              <FixedExpensesCard month={month} onUpdate={handleFixedUpdate} />
              <IncomeCard month={month} onUpdate={handleFixedUpdate} />
            </div>
          </div>
        </div>
      ) : null}

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
