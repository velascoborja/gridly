"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { calcEstimatedPortfolioValues, summarizeEvolutionMetrics, type EvolutionYearMetric } from "@/lib/evolution";
import type { HistoricalYear } from "@/lib/types";
import { mergeTagStatsByYear, type TagStats } from "@/lib/tag-stats";
import { formatCurrency } from "@/lib/utils";
import { TagStatRow } from "@/components/annual/tag-stat-row";
import { EvolutionCharts } from "./evolution-charts";
import { EvolutionDetailTable } from "./evolution-detail-table";
import { HistoricalYearDialog } from "./historical-year-dialog";
import { EvolutionKpiCards } from "./evolution-kpi-cards";

const STORAGE_KEY = "evolution_return_rate";

interface Props {
  metrics: EvolutionYearMetric[];
  historicalYears: HistoricalYear[];
  calendarYear: number;
  tagStatsByYear: { year: number; stats: TagStats }[];
}

export function EvolutionDashboard({ metrics, historicalYears, calendarYear, tagStatsByYear }: Props) {
  const t = useTranslations("Evolution");
  const tCat = useTranslations("Annual.categories");
  const locale = useLocale();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHistoricalYear, setEditingHistoricalYear] = useState<HistoricalYear | null>(null);
  const [returnRate, setReturnRate] = useState<number | null>(null);
  const [includeFuture, setIncludeFuture] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [tagPageIndex, setTagPageIndex] = useState(0);

  const hasFutureYears = metrics.some((m) => m.year > calendarYear);
  const visibleMetrics = includeFuture ? metrics : metrics.filter((m) => m.year <= calendarYear);
  const visibleHistoricalYears = includeFuture
    ? historicalYears
    : historicalYears.filter((h) => h.year <= calendarYear);

  const summary = summarizeEvolutionMetrics(visibleMetrics);
  const showEmptyState = visibleMetrics.length < 2;

  const visibleTagYears = useMemo(
    () => (includeFuture ? tagStatsByYear : tagStatsByYear.filter((y) => y.year <= calendarYear)),
    [tagStatsByYear, includeFuture, calendarYear],
  );
  const hasTagData = visibleTagYears.length > 0;
  type TagPage = { year: number | null; stats: TagStats };
  const tagPages = useMemo<TagPage[]>(
    () => [
      { year: null, stats: mergeTagStatsByYear(visibleTagYears) },
      ...visibleTagYears.map((y) => ({ year: y.year, stats: y.stats })),
    ],
    [visibleTagYears],
  );
  const safeTagPageIndex = Math.min(tagPageIndex, tagPages.length - 1);
  const currentTagPage = tagPages[safeTagPageIndex];
  const currentTagStats = currentTagPage?.stats.stats ?? [];
  const currentMaxTagAmount = currentTagStats[0]?.totalAmount ?? 0;
  const currentTagTaggedCount = currentTagStats.filter((s) => s.tag !== null).length;
  const currentTagTotal = currentTagPage?.stats.totalAdditional ?? 0;

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) setReturnRate(parsed);
    }
  }, []);

  function handleRateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") {
      setReturnRate(null);
      localStorage.removeItem(STORAGE_KEY);
    } else {
      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        setReturnRate(parsed);
        localStorage.setItem(STORAGE_KEY, String(parsed));
      }
    }
  }

  const estimatedValues =
    returnRate !== null && visibleMetrics.length > 0
      ? calcEstimatedPortfolioValues(visibleMetrics, returnRate)
      : null;

  const latestEstimatedPortfolio = estimatedValues?.at(-1)?.estimatedPortfolioValue ?? null;
  const displayedWealth =
    latestEstimatedPortfolio !== null
      ? summary.latestFinalBalance + latestEstimatedPortfolio
      : summary.totalWealth;
  const wealthNote =
    returnRate !== null
      ? t("totalWealthNoteWithRate", { rate: returnRate })
      : t("totalWealthNote");

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="surface-depth-floating rounded-lg border border-primary/20 bg-linear-to-b from-primary/[0.08] via-card/98 to-card/95 px-4 py-4 sm:px-5 sm:py-5 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              {t("eyebrow")}
            </p>
            <h1 className="mt-1.5 text-2xl font-light tracking-[-0.04em] text-foreground sm:mt-2 sm:text-3xl md:text-4xl">
              {t("title")}
            </h1>
          </div>
          <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
            <div className="flex items-center gap-2">
              {hasTagData && (
                <Dialog
                  open={tagsDialogOpen}
                  onOpenChange={(open) => {
                    setTagsDialogOpen(open);
                    if (open) setTagPageIndex(0);
                  }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 border-border/70 bg-background/80 text-muted-foreground shadow-sm hover:border-primary/30 hover:bg-primary/[0.06] hover:text-primary"
                    onClick={() => setTagsDialogOpen(true)}
                  >
                    <Tags className="h-4 w-4" />
                    <span className="sr-only">{t("categoriesButton")}</span>
                  </Button>
                  <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
                    <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
                      <DialogHeader className="sticky top-0 z-10 border-b border-border/50 bg-card/70 px-5 pt-5 pr-14 pb-4 backdrop-blur-xl supports-[backdrop-filter]:bg-card/55 md:px-6 md:pt-6 md:pr-16 md:pb-5">
                        <DialogTitle>{t("categoriesTitle")}</DialogTitle>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            disabled={safeTagPageIndex === 0}
                            onClick={() => setTagPageIndex((i) => Math.max(0, Math.min(tagPages.length - 1, i) - 1))}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">{t("tagsPager.prevYear")}</span>
                          </Button>
                          <span
                            aria-live="polite"
                            className="finance-number text-sm font-semibold tabular-nums text-foreground"
                          >
                            {currentTagPage?.year === null ? t("tagsPager.allYears") : currentTagPage?.year}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            disabled={safeTagPageIndex >= tagPages.length - 1}
                            onClick={() => setTagPageIndex((i) => Math.max(0, Math.min(tagPages.length - 1, i) + 1))}
                          >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">{t("tagsPager.nextYear")}</span>
                          </Button>
                        </div>
                      </DialogHeader>
                      <div className="mx-auto max-w-2xl px-4 py-6">
                        <p className="mb-4 text-xs text-muted-foreground">
                          {tCat("totalLabel")}{" "}
                          <strong className="text-foreground">{formatCurrency(currentTagTotal, locale)}</strong>
                          {currentTagTaggedCount > 0 && <> · {tCat("tagCount", { count: currentTagTaggedCount })}</>}
                        </p>
                        <div className="flex flex-col gap-2">
                          {currentTagStats.map((stat) => (
                            <TagStatRow
                              key={`${currentTagPage?.year ?? "all"}-${stat.tag?.id ?? "untagged"}`}
                              stat={stat}
                              maxAmount={currentMaxTagAmount}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              <Button
                type="button"
                className="w-full gap-2 rounded-md sm:w-auto"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="size-4" />
                {t("addHistoricalYear")}
              </Button>
            </div>
            {hasFutureYears && (
              <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={includeFuture}
                  onChange={(e) => setIncludeFuture(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary accent-primary"
                />
                {t("includeFutureYears")}
              </label>
            )}
          </div>
        </div>
        <p className="mt-1.5 hidden max-w-2xl text-sm leading-6 text-muted-foreground sm:mt-2 sm:block">
          {t("description")}
        </p>
        <div className="mt-4 rounded-lg border border-primary/25 bg-primary/[0.06] px-4 py-3 sm:mt-5 sm:px-5 sm:py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
            {t("totalWealth")}
          </p>
          <p key={String(includeFuture)} className="finance-number mt-1.5 text-3xl font-light tracking-[-0.04em] text-primary animate-in fade-in slide-in-from-bottom-1 duration-300 sm:mt-2 sm:text-4xl md:text-5xl">
            {formatCurrency(displayedWealth, locale)}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground sm:mt-2">{wealthNote}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-t border-primary/15 pt-3">
            <label
              htmlFor="evolution-return-rate"
              className="text-xs font-medium text-muted-foreground"
            >
              {t("returnRateLabel")}
            </label>
            <div className="flex items-center gap-1.5">
              <Input
                id="evolution-return-rate"
                type="number"
                min="-100"
                max="1000"
                step="0.1"
                value={returnRate ?? ""}
                onChange={handleRateChange}
                placeholder={t("returnRatePlaceholder")}
                className="h-7 w-20 px-2 text-right text-xs"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <span className="text-xs text-muted-foreground">{t("returnRateNote")}</span>
          </div>
        </div>
        <div key={String(includeFuture)} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
          <EvolutionKpiCards
            summary={summary}
            estimatedPortfolioValue={latestEstimatedPortfolio}
            returnRate={returnRate}
          />
        </div>
      </section>

      {showEmptyState ? (
        <section className="rounded-lg border border-dashed border-primary/30 bg-card/85 px-5 py-6 shadow-sm md:px-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
              {t("emptyState.eyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-light tracking-[-0.03em] text-foreground">
              {t("emptyState.title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("emptyState.description")}
            </p>
            <Button
              type="button"
              className="mt-5 w-full gap-2 rounded-md sm:w-auto"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="size-4" />
              {t("addHistoricalYear")}
            </Button>
          </div>
        </section>
      ) : (
        <div key={String(includeFuture)} className="animate-in fade-in slide-in-from-bottom-1 duration-300 space-y-4 sm:space-y-5">
          <EvolutionCharts metrics={visibleMetrics} estimatedValues={estimatedValues} />
          <EvolutionDetailTable
            metrics={visibleMetrics}
            historicalYears={visibleHistoricalYears}
            onEditHistoricalYear={(row) => {
              setEditingHistoricalYear(row);
              setDialogOpen(true);
            }}
          />
        </div>
      )}
      <HistoricalYearDialog
        open={dialogOpen}
        mode={editingHistoricalYear ? "edit" : "create"}
        historicalYear={editingHistoricalYear}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingHistoricalYear(null);
        }}
      />
    </div>
  );
}
