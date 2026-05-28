"use client";

import { useLocale } from "next-intl";
import { formatCurrency, formatMonthName } from "@/lib/utils";
import type { DrilldownEntry } from "@/lib/tag-stats";

interface Props {
  entries: DrilldownEntry[];
}

export function DrilldownList({ entries }: Props) {
  const locale = useLocale();

  const months = Array.from(new Set(entries.map((e) => e.month)));

  const grouped = months.map((month) => ({
    month,
    entries: entries.filter((e) => e.month === month),
  }));

  return (
    <div className="border-t border-border/50 bg-muted/30">
      {grouped.map(({ month, entries: monthEntries }) => (
        <div key={month}>
          <div className="border-b border-border/30 bg-muted/50 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {formatMonthName(month, locale, "long")}
          </div>
          {monthEntries.map((entry, i) => (
            <div
              key={i}
              className="flex items-start gap-3 border-b border-border/30 px-4 py-2.5 text-sm last:border-0"
            >
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
      ))}
    </div>
  );
}
