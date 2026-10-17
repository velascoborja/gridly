"use client";

import { useId, useState } from "react";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, ChevronDown, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MovementsYearSelector } from "@/components/annual/movements-year-selector";
import { formatCurrency, formatMonthName, cn } from "@/lib/utils";
import { getMovementColorIntensity, sortMovementMonths, summarizeYearMovements, type MovementSort, type MovementType } from "@/lib/year-movements";
import { buildYearSummaryHref } from "@/lib/year-routes";
import type { AdditionalEntry, YearData } from "@/lib/types";

interface Props {
  yearData: YearData;
  years?: number[];
  onSummarySelect?: () => void;
  pathPrefix?: string;
}

export function YearMovementsView({ yearData, years, onSummarySelect, pathPrefix }: Props) {
  const t = useTranslations("Annual.movements");
  const locale = useLocale();
  const regionId = useId();
  const sortLabelId = useId();
  const [type, setType] = useState<MovementType>("expense");
  const [order, setOrder] = useState<MovementSort>("chronological");
  const [collapsedMonths, setCollapsedMonths] = useState<Set<number>>(() => new Set());
  const summary = summarizeYearMovements(yearData.months, type);
  const rows = sortMovementMonths(summary.rows, order);
  const peakNames = summary.rows.filter((row) => row.isPeak)
    .map((row) => formatMonthName(row.month.month, locale));
  const now = new Date();
  const year = yearData.config.year;
  const isExpense = type === "expense";
  const tone = isExpense ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400";
  const Icon = isExpense ? ArrowDownRight : ArrowUpRight;

  function toggleMonth(month: number) {
    setCollapsedMonths((current) => {
      const next = new Set(current);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <Link
        href={buildYearSummaryHref(pathPrefix, year)}
        onNavigate={(event) => {
          if (!onSummarySelect) return;
          event.preventDefault();
          onSummarySelect();
          window.scrollTo({ top: 0, behavior: "instant" });
        }}
        className={buttonVariants({ variant: "ghost", className: "rounded-md text-muted-foreground" })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t("back")}
      </Link>

      <section className="surface-depth-floating rounded-lg border border-primary/15 bg-card px-5 py-6 sm:px-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="max-w-xl">
            <p className="text-xs text-primary">{t("eyebrow", { year })}</p>
            <h1 className="mt-2 text-3xl font-light tracking-[-0.04em] sm:text-4xl">{t("title")}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("description")}</p>
          </div>
          <div role="group" aria-label={t("typeLabel")} className="grid shrink-0 grid-cols-2 gap-1 rounded-md border border-border/70 bg-muted/40 p-1">
            {(["expense", "income"] as const).map((option) => (
              <Button
                key={option}
                variant="ghost"
                aria-pressed={type === option}
                onClick={() => setType(option)}
                className={cn("h-auto min-h-10 whitespace-normal rounded-md px-3 py-2 text-xs sm:text-sm", type === option && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
              >
                {t(option)}
              </Button>
            ))}
          </div>
        </div>

        <div aria-live="polite" aria-atomic="true" className="mt-6 grid gap-5 border-t border-border/70 pt-5 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className={cn("size-4", tone)} aria-hidden="true" />
              {t(isExpense ? "expenseTotal" : "incomeTotal")}
            </p>
            <p className="finance-number mt-2 text-4xl font-light tracking-[-0.04em]">{formatCurrency(summary.total, locale)}</p>
          </div>
          <div className="sm:border-l sm:border-border/70 sm:pl-6">
            <p className="text-sm text-muted-foreground">{t(isExpense ? "expensePeak" : "incomePeak")}</p>
            {summary.maximum === null ? (
              <p className="mt-2 text-sm text-muted-foreground">{t("emptyYear")}</p>
            ) : (
              <>
                <p className="mt-2 text-lg font-light capitalize">{new Intl.ListFormat(locale, { type: "conjunction" }).format(peakNames)}</p>
                <p className={cn("finance-number mt-1 text-xl font-light", tone)}>{formatCurrency(summary.maximum, locale)}</p>
              </>
            )}
          </div>
        </div>
      </section>

      <div role="group" aria-label={t("controlsLabel")} className="flex flex-nowrap items-center gap-1 sm:flex-wrap sm:justify-between sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:flex-none sm:flex-wrap sm:gap-x-5 sm:gap-y-3">
          {years && years.length > 1 && <MovementsYearSelector year={year} pathPrefix={pathPrefix} />}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none sm:flex-wrap">
            <span id={sortLabelId} className="sr-only text-sm text-muted-foreground sm:not-sr-only">{t("sortLabel")}</span>
            <Select value={order} onValueChange={(value) => {
              if (value === "chronological" || value === "descending" || value === "ascending") setOrder(value);
            }}>
              <SelectTrigger aria-labelledby={sortLabelId} title={t(order)} className="min-h-11 w-full min-w-0 rounded-md bg-card px-2 sm:min-h-9 sm:w-fit sm:px-2.5">
                <SelectValue>
                  <span className="min-[360px]:hidden">{t(`shortSort.${order}`)}</span>
                  <span className="hidden min-[360px]:inline sm:hidden">{t(`compactSort.${order}`)}</span>
                  <span className="hidden sm:inline">{t(order)}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} align="start" className="w-max min-w-(--anchor-width) max-w-(--available-width)">
                {(["chronological", "descending", "ascending"] as const).map((option) => <SelectItem key={option} value={option}>{t(option)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex shrink-0 gap-1 sm:gap-2">
          <Button variant="outline" aria-label={t("expandAll")} title={t("expandAll")} className="size-11 rounded-md px-0 sm:h-9 sm:w-auto sm:px-2.5" disabled={collapsedMonths.size === 0} onClick={() => setCollapsedMonths(new Set())}>
            <ChevronsUpDown className="size-4" aria-hidden="true" /><span className="hidden sm:inline">{t("expandAll")}</span>
          </Button>
          <Button variant="outline" aria-label={t("collapseAll")} title={t("collapseAll")} className="size-11 rounded-md px-0 sm:h-9 sm:w-auto sm:px-2.5" disabled={collapsedMonths.size === summary.rows.length} onClick={() => setCollapsedMonths(new Set(summary.rows.map((row) => row.month.month)))}>
            <ChevronsDownUp className="size-4" aria-hidden="true" /><span className="hidden sm:inline">{t("collapseAll")}</span>
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {rows.map((row) => {
          const { month, entries, groups, total, entryCount, isPeak, barPercent } = row;
          const intensity = getMovementColorIntensity(row, summary.rows);
          const name = formatMonthName(month.month, locale);
          const expanded = !collapsedMonths.has(month.month);
          const monthId = `${regionId}-month-${month.month}`;
          const future = year > now.getFullYear() || (year === now.getFullYear() && month.month > now.getMonth() + 1);
          return (
            <section key={month.month} aria-labelledby={`${monthId}-heading`} className={cn("rounded-md border bg-card shadow-[0_3px_6px_rgba(50,50,93,0.06)]", isPeak ? "border-primary/30" : "border-border/80")}>
              <div className="sticky top-[var(--app-sticky-header-height,0px)] z-20 rounded-t-md border-b border-border/60 bg-card/95 backdrop-blur-xl">
                <h2 id={`${monthId}-heading`}>
                  <button
                    type="button"
                    onClick={() => toggleMonth(month.month)}
                    aria-label={t(expanded ? "collapseMonth" : "expandMonth", { month: name })}
                    aria-expanded={expanded}
                    aria-controls={monthId}
                    className="block w-full rounded-t-md px-4 py-4 text-left outline-none transition-colors hover:bg-primary/[0.03] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-6"
                  >
                    <span className="flex items-center justify-between gap-4">
                      <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-xl font-light capitalize tracking-[-0.02em]">{name}</span>
                        {future && <span className="rounded border border-primary/15 bg-primary/5 px-1.5 py-0.5 text-[11px] font-normal text-primary">{t("forecast")}</span>}
                        {isPeak && <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[11px] font-normal text-primary">{t("peakBadge")}</span>}
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span
                          className={cn(
                            "finance-number text-xl font-light tracking-[-0.03em] [--movement-neutral:#000] dark:[--movement-neutral:var(--foreground)] sm:text-2xl",
                            isExpense
                              ? "[--movement-accent:var(--color-rose-600)] dark:[--movement-accent:var(--color-rose-400)]"
                              : "[--movement-accent:var(--color-emerald-600)] dark:[--movement-accent:var(--color-emerald-400)]"
                          )}
                          style={{ color: `color-mix(in srgb, var(--movement-neutral) ${100 - intensity * 100}%, var(--movement-accent))` }}
                        >{formatCurrency(total, locale)}</span>
                        <ChevronDown aria-hidden="true" className={cn("size-4 text-muted-foreground transition-transform motion-reduce:transition-none", !expanded && "-rotate-90")} />
                      </span>
                    </span>
                    <span className="mt-3 block h-1 overflow-hidden rounded-sm bg-muted" aria-hidden="true">
                      <span className={cn("block h-full rounded-sm", isExpense ? "bg-rose-500/60" : "bg-emerald-500/60")} style={{ width: `${barPercent}%` }} />
                    </span>
                    <span className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-normal text-muted-foreground">
                      <span>{t(month.savings < 0 ? "loss" : "savings")} <span className={cn("finance-number ml-1", month.savings < 0 ? "text-rose-600 dark:text-rose-400" : month.savings > 0 ? "text-emerald-600 dark:text-emerald-400" : "")}>{month.savings > 0 ? "+" : ""}{formatCurrency(month.savings, locale)}</span></span>
                      <span>{t("endingBalance")} <span className="finance-number ml-1 text-foreground/80">{formatCurrency(month.endingBalance, locale)}</span></span>
                    </span>
                  </button>
                </h2>
              </div>
              <div id={monthId} hidden={!expanded}>
                {entryCount === 0 ? (
                  <p className="px-4 py-5 text-sm text-muted-foreground sm:px-6">{t(isExpense ? "emptyExpenseMonth" : "emptyIncomeMonth")}</p>
                ) : (
                  <div className="px-4 py-2 sm:px-6">
                    {groups.map((group) => (
                      <div key={group.id} className="border-b border-border/50 py-3 last:border-b-0">
                        <div className="flex items-start justify-between gap-4 border-l-2 border-primary/30 pl-3 text-sm">
                          <span className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="min-w-0 max-w-full break-words font-medium">{group.label}</span>
                            <span className="rounded border border-primary/15 bg-primary/5 px-1.5 py-0.5 text-[11px] text-primary">{t("group")}</span>
                          </span>
                          <span className="finance-number shrink-0 text-muted-foreground">{formatCurrency(group.total, locale)}</span>
                        </div>
                      </div>
                    ))}
                    <EntryList entries={entries} locale={locale} />
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function EntryList({ entries, locale, className }: { entries: AdditionalEntry[]; locale: string; className?: string }) {
  if (entries.length === 0) return null;
  return (
    <ul className={cn("divide-y divide-border/40", className)}>
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-start justify-between gap-4 py-3 text-sm">
          <span className="min-w-0 break-words leading-5 text-foreground/85">{entry.label}</span>
          <span className="finance-number shrink-0 leading-5">{formatCurrency(entry.amount, locale)}</span>
        </li>
      ))}
    </ul>
  );
}
