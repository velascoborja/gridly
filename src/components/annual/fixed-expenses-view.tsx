"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { computeFixedStats } from "@/lib/fixed-stats";
import { formatCurrency } from "@/lib/utils";
import { FixedStatRow } from "./fixed-stat-row";
import type { YearData } from "@/lib/types";

interface Props {
  yearData: YearData;
}

export function FixedExpensesView({ yearData }: Props) {
  const t = useTranslations("Annual.fixedExpenses");
  const locale = useLocale();
  const { stats, grandTotal } = useMemo(() => computeFixedStats(yearData), [yearData]);

  if (grandTotal === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-sm text-muted-foreground">
        {t("emptyState")}
      </div>
    );
  }

  const maxAmount = stats[0]?.totalAmount ?? 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <p className="mb-4 text-xs text-muted-foreground">
        {t("grandTotalLabel")}{" "}
        <strong className="text-foreground">{formatCurrency(grandTotal, locale)}</strong>
      </p>
      <div className="flex flex-col gap-2">
        {stats.map((stat) => (
          <FixedStatRow key={stat.key} stat={stat} maxAmount={maxAmount} />
        ))}
      </div>
    </div>
  );
}
