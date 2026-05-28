"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { computeTagStats } from "@/lib/tag-stats";
import { formatCurrency } from "@/lib/utils";
import { TagStatRow } from "./tag-stat-row";
import type { YearData } from "@/lib/types";

interface Props {
  yearData: YearData;
}

export function CategoriesView({ yearData }: Props) {
  const t = useTranslations("Annual.categories");
  const locale = useLocale();
  const { stats, totalAdditional } = useMemo(() => computeTagStats(yearData), [yearData]);

  const taggedCount = stats.filter((s) => s.tag !== null).length;
  const hasEntries = stats.length > 0 && totalAdditional > 0;

  if (!hasEntries) {
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
        {t("totalLabel")}{" "}
        <strong className="text-foreground">{formatCurrency(totalAdditional, locale)}</strong>
        {taggedCount > 0 && <> · {t("tagCount", { count: taggedCount })}</>}
      </p>
      <div className="flex flex-col gap-2">
        {stats.map((stat) => (
          <TagStatRow key={stat.tag?.id ?? "untagged"} stat={stat} maxAmount={maxAmount} />
        ))}
      </div>
    </div>
  );
}
