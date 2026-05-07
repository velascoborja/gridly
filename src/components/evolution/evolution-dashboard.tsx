"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { summarizeEvolutionMetrics, type EvolutionYearMetric } from "@/lib/evolution";
import type { HistoricalYear } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { EvolutionCharts } from "./evolution-charts";
import { EvolutionDetailTable } from "./evolution-detail-table";
import { HistoricalYearDialog } from "./historical-year-dialog";
import { EvolutionKpiCards } from "./evolution-kpi-cards";

interface Props {
  metrics: EvolutionYearMetric[];
  historicalYears: HistoricalYear[];
}

export function EvolutionDashboard({ metrics, historicalYears }: Props) {
  const t = useTranslations("Evolution");
  const locale = useLocale();
  const summary = summarizeEvolutionMetrics(metrics);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHistoricalYear, setEditingHistoricalYear] = useState<HistoricalYear | null>(null);
  const showEmptyState = metrics.length < 2;

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
          <Button
            type="button"
            className="w-full gap-2 rounded-md sm:w-auto"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-4" />
            {t("addHistoricalYear")}
          </Button>
        </div>
        <p className="mt-1.5 hidden max-w-2xl text-sm leading-6 text-muted-foreground sm:mt-2 sm:block">
          {t("description")}
        </p>
        <div className="mt-4 rounded-lg border border-primary/25 bg-primary/[0.06] px-4 py-3 sm:mt-5 sm:px-5 sm:py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
            {t("totalWealth")}
          </p>
          <p className="finance-number mt-1.5 text-3xl font-light tracking-[-0.04em] text-primary sm:mt-2 sm:text-4xl md:text-5xl">
            {formatCurrency(summary.totalWealth, locale)}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground sm:mt-2">{t("totalWealthNote")}</p>
        </div>
        <EvolutionKpiCards summary={summary} />
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
          <EvolutionCharts metrics={metrics} />
          <EvolutionDetailTable
            metrics={metrics}
            historicalYears={historicalYears}
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
