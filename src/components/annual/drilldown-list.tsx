"use client";

import { useLocale } from "next-intl";
import { formatCurrency, formatMonthName } from "@/lib/utils";
import type { DrilldownEntry } from "@/lib/tag-stats";

interface Props {
  entries: DrilldownEntry[];
}

export function DrilldownList({ entries }: Props) {
  const locale = useLocale();

  return (
    <div className="border-t border-border/50 bg-muted/30">
      {entries.map((entry, i) => (
        <div
          key={i}
          className="flex items-start gap-3 border-b border-border/30 px-4 py-2.5 text-sm last:border-0"
        >
          <span className="w-8 shrink-0 pt-0.5 text-xs text-muted-foreground">
            {formatMonthName(entry.month, locale, "short")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-foreground">{entry.description}</div>
            {entry.groupName && (
              <div className="truncate text-xs text-muted-foreground">{entry.groupName}</div>
            )}
          </div>
          <span className="shrink-0 font-medium tabular-nums text-foreground">
            {formatCurrency(entry.amount, locale)}
          </span>
        </div>
      ))}
    </div>
  );
}
