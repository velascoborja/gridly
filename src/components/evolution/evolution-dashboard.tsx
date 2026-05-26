"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calcEstimatedPortfolioValues, summarizeEvolutionMetrics, type EvolutionYearMetric } from "@/lib/evolution";
import type { HistoricalYear } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { EvolutionCharts } from "./evolution-charts";
import { EvolutionDetailTable } from "./evolution-detail-table";
import { HistoricalYearDialog } from "./historical-year-dialog";
import { EvolutionKpiCards } from "./evolution-kpi-cards";

const STORAGE_KEY = "evolution_return_rate";

interface Props {
  metrics: EvolutionYearMetric[];
  historicalYears: HistoricalYear[];
  calendarYear: number;
}

export function EvolutionDashboard({ metrics, historicalYears, calendarYear }: Props) {
  const t = useTranslations("Evolution");
  const locale = useLocale();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHistoricalYear, setEditingHistoricalYear] = useState<HistoricalYear | null>(null);
  const [returnRate, setReturnRate] = useState<number | null>(null);
  const [includeFuture, setIncludeFuture] = useState(false);

  const hasFutureYears = metrics.some((m) => m.year > calendarYear);
  const visibleMetrics = includeFuture ? metrics : metrics.filter((m) => m.year <= calendarYear);
  const visibleHistoricalYears = includeFuture
    ? historicalYears
    : historicalYears.filter((h) => h.year <= calendarYear);

  const summary = summarizeEvolutionMetrics(visibleMetrics);
  const showEmptyState = visibleMetrics.length < 2;

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
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {hasFutureYears && (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={includeFuture}
                  onChange={(e) => setIncludeFuture(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary accent-primary"
                />
                {t("includeFutureYears")}
              </label>
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
        </div>
        <p className="mt-1.5 hidden max-w-2xl text-sm leading-6 text-muted-foreground sm:mt-2 sm:block">
          {t("description")}
        </p>
        <div className="mt-4 rounded-lg border border-primary/25 bg-primary/[0.06] px-4 py-3 sm:mt-5 sm:px-5 sm:py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
            {t("totalWealth")}
          </p>
          <p className="finance-number mt-1.5 text-3xl font-light tracking-[-0.04em] text-primary sm:mt-2 sm:text-4xl md:text-5xl">
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
        <EvolutionKpiCards
          summary={summary}
          estimatedPortfolioValue={latestEstimatedPortfolio}
          returnRate={returnRate}
        />
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
        <>
          <EvolutionCharts metrics={visibleMetrics} estimatedValues={estimatedValues} />
          <EvolutionDetailTable
            metrics={visibleMetrics}
            historicalYears={visibleHistoricalYears}
            onEditHistoricalYear={(row) => {
              setEditingHistoricalYear(row);
              setDialogOpen(true);
            }}
          />
        </>
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
