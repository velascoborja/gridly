"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { TAG_COLORS } from "@/lib/tags";
import { formatCurrency } from "@/lib/utils";
import { DrilldownList } from "./drilldown-list";
import type { TagStat } from "@/lib/tag-stats";

interface Props {
  stat: TagStat;
  maxAmount: number;
}

export function TagStatRow({ stat, maxAmount }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("Annual.categories");
  const locale = useLocale();

  const barWidth = maxAmount > 0 ? (stat.totalAmount / maxAmount) * 100 : 0;
  const colorKey = stat.tag?.color ?? null;
  const tagColor = colorKey && colorKey in TAG_COLORS ? TAG_COLORS[colorKey as keyof typeof TAG_COLORS] : null;

  const dotStyle = tagColor
    ? { backgroundColor: tagColor.bg, borderColor: tagColor.border }
    : { backgroundColor: "#d1d5db", borderColor: "#9ca3af" };

  const barFillStyle = tagColor
    ? { backgroundColor: tagColor.bg, borderColor: tagColor.border, width: `${barWidth}%` }
    : { backgroundColor: "#e5e7eb", borderColor: "#d1d5db", width: `${barWidth}%` };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        className="w-full px-4 py-3 text-left"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="mb-2.5 flex items-center gap-3">
          <span className="size-2.5 shrink-0 rounded-full border" style={dotStyle} />
          <span className="flex-1 truncate text-sm font-semibold text-foreground">
            {stat.tag?.name ?? t("untagged")}
          </span>
          <span className="tabular-nums text-sm font-bold text-foreground">
            {formatCurrency(stat.totalAmount, locale)}
          </span>
          <ChevronRight
            className={`size-4 shrink-0 text-muted-foreground transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
          />
        </div>
        <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full border" style={barFillStyle} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {stat.tag
              ? t("shareLabel", { pct: Math.round(stat.shareOfTotal * 100) })
              : t("untaggedShare", { pct: Math.round(stat.shareOfTotal * 100) })}
          </span>
          <span>{t("entryCount", { count: stat.entryCount })}</span>
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
