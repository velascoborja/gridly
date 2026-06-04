"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils";
import { DrilldownList } from "./drilldown-list";
import type { FixedExpenseStat } from "@/lib/fixed-stats";

interface Props {
  stat: FixedExpenseStat;
  maxAmount: number;
}

const KEY_STYLES = {
  home: {
    dot: { backgroundColor: "rgb(59 130 246 / 0.3)", borderColor: "rgb(59 130 246 / 0.5)" },
    bar: { backgroundColor: "rgb(59 130 246 / 0.2)", borderColor: "rgb(59 130 246 / 0.4)" },
  },
  personal: {
    dot: { backgroundColor: "rgb(245 158 11 / 0.3)", borderColor: "rgb(245 158 11 / 0.5)" },
    bar: { backgroundColor: "rgb(245 158 11 / 0.2)", borderColor: "rgb(245 158 11 / 0.4)" },
  },
  recurring: {
    dot: { backgroundColor: "rgb(100 116 139 / 0.3)", borderColor: "rgb(100 116 139 / 0.5)" },
    bar: { backgroundColor: "rgb(100 116 139 / 0.2)", borderColor: "rgb(100 116 139 / 0.4)" },
  },
} as const;

export function FixedStatRow({ stat, maxAmount }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("Annual.fixedExpenses");
  const locale = useLocale();

  const barWidth = maxAmount > 0 ? (stat.totalAmount / maxAmount) * 100 : 0;
  const styles = KEY_STYLES[stat.key];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        className="w-full px-4 py-3 text-left"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="mb-2.5 flex items-center gap-3">
          <span className="size-2.5 shrink-0 rounded-full border" style={styles.dot} />
          <span className="flex-1 truncate text-sm font-semibold text-foreground">
            {t(stat.key)}
          </span>
          <span className="tabular-nums text-sm font-bold text-foreground">
            {formatCurrency(stat.totalAmount, locale)}
          </span>
          <ChevronRight
            className={`size-4 shrink-0 text-muted-foreground transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
          />
        </div>
        <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full border"
            style={{ ...styles.bar, width: `${barWidth}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t("shareLabel", { pct: Math.round(stat.shareOfTotal * 100) })}</span>
          <span>{t("entryCount", { count: stat.entries.length })}</span>
        </div>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <DrilldownList entries={stat.entries} />
        </div>
      </div>
    </div>
  );
}
