"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { buildSearchIndex, filterSearchIndex } from "@/lib/search-index";
import { cn, formatCurrency, formatMonthName } from "@/lib/utils";
import type { YearData } from "@/lib/types";
import type { SearchEntry } from "@/lib/search-index";

interface Props {
  yearData: YearData;
  open: boolean;
  onClose: () => void;
  onSelect: (entry: SearchEntry) => void;
}

export function SearchPalette({ yearData, open, onClose, onSelect }: Props) {
  const t = useTranslations("Search");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const allEntries = buildSearchIndex(yearData);
  const results = filterSearchIndex(allEntries, query);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const selected = results[activeIndex];
        if (selected) {
          onSelect(selected);
          onClose();
        }
      }
    },
    [results, activeIndex, onSelect, onClose]
  );

  // Group results by month for display
  const months: number[] = [];
  const grouped: Record<number, SearchEntry[]> = {};
  for (const entry of results) {
    if (!grouped[entry.month]) {
      grouped[entry.month] = [];
      months.push(entry.month);
    }
    grouped[entry.month].push(entry);
  }

  const kindClass = (kind: SearchEntry["kind"]) =>
    cn(
      "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
      kind === "income" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      kind === "expense" && "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
      kind === "recurring" && "bg-muted text-muted-foreground"
    );

  const kindLabel = (kind: SearchEntry["kind"]) => {
    if (kind === "income") return t("kindIncome");
    if (kind === "expense") return t("kindExpense");
    return t("kindRecurring");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          className="fixed left-1/2 top-[15vh] z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-border/70 bg-popover shadow-2xl ring-1 ring-foreground/10 outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
              placeholder={t("placeholder")}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {query.length > 0 && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("noResults")}
              </div>
            )}
            {query.length > 0 && months.map((month) => (
              <div key={month}>
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 capitalize">
                  {formatMonthName(month, locale)}
                </div>
                {grouped[month].map((entry) => {
                  const flatIndex = results.indexOf(entry);
                  const isActive = flatIndex === activeIndex;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition-colors",
                        isActive ? "bg-muted" : "hover:bg-muted/60"
                      )}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      onClick={() => { onSelect(entry); onClose(); }}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">{entry.label}</span>
                        {entry.groupLabel && (
                          <span className="block truncate text-xs text-muted-foreground">{entry.groupLabel}</span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={kindClass(entry.kind)}>{kindLabel(entry.kind)}</span>
                        <span className="tabular-nums text-sm font-semibold text-foreground">
                          {formatCurrency(entry.amount, locale)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
