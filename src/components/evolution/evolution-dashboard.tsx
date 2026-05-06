"use client";

import { useTranslations } from "next-intl";
import { summarizeEvolutionMetrics, type EvolutionYearMetric } from "@/lib/evolution";
import { EvolutionCharts } from "./evolution-charts";
import { EvolutionDetailTable } from "./evolution-detail-table";
import { EvolutionKpiCards } from "./evolution-kpi-cards";

interface Props {
  metrics: EvolutionYearMetric[];
}

export function EvolutionDashboard({ metrics }: Props) {
  const t = useTranslations("EvolutionDashboard");
  const summary = summarizeEvolutionMetrics(metrics);

  return (
    <div className="space-y-5">
      <section className="surface-depth-floating rounded-lg border border-primary/20 bg-linear-to-b from-primary/[0.08] via-card/98 to-card/95 px-5 py-5 md:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-light tracking-[-0.04em] text-foreground md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
        <EvolutionKpiCards summary={summary} />
      </section>

      <EvolutionCharts metrics={metrics} />
      <EvolutionDetailTable metrics={metrics} />
    </div>
  );
}
