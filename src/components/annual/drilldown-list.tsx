"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useLocale } from "next-intl";
import { formatCurrency, formatMonthName } from "@/lib/utils";
import type { DrilldownEntry } from "@/lib/tag-stats";

interface Props {
  entries: DrilldownEntry[];
  fallbackLabel?: string;
}

export function DrilldownList({ entries, fallbackLabel }: Props) {
  const locale = useLocale();
  const [expandedYears, setExpandedYears] = useState<Set<number>>(() => new Set());
  const isMultiYear = entries.length > 0 && entries[0].year !== undefined;

  if (isMultiYear) {
    const years = Array.from(new Set(entries.map((e) => e.year!))).sort((a, b) => a - b);
    const grouped = years.map((year) => {
      const yearEntries = entries.filter((e) => e.year === year);
      return {
        year,
        entries: yearEntries,
        totalAmount: yearEntries.reduce((sum, entry) => sum + entry.amount, 0),
      };
    });

    function toggleYear(year: number) {
      setExpandedYears((prev) => {
        const next = new Set(prev);
        if (next.has(year)) {
          next.delete(year);
        } else {
          next.add(year);
        }
        return next;
      });
    }

    return (
      <div className="border-t border-border/50 bg-muted/30">
        {grouped.map(({ year, entries: yearEntries, totalAmount }) => {
          const isExpanded = expandedYears.has(year);

          return (
            <div key={year}>
              <button
                type="button"
                className="flex w-full items-center gap-3 border-b border-border/30 bg-muted/50 px-4 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70"
                onClick={() => toggleYear(year)}
                aria-expanded={isExpanded}
              >
                <ChevronRight
                  className={`size-3.5 shrink-0 transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}
                />
                <span className="flex-1 uppercase tracking-wide">{year}</span>
                <span className="shrink-0 tabular-nums text-foreground">
                  {formatCurrency(totalAmount, locale)}
                </span>
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              >
                <div className="overflow-hidden">
                  {yearEntries.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 border-b border-border/30 px-4 py-2.5 text-sm last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-foreground">{entry.description || fallbackLabel}</div>
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
              </div>
            </div>
          );
        })}
      </div>
    );
  }

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
                <div className="truncate text-foreground">{entry.description || fallbackLabel}</div>
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
