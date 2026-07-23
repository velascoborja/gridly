"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { CalendarDays } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  buildMonthNavigationOptions,
  filterMonthNavigationOptions,
} from "@/lib/month-navigation";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  currentMonth: number;
  onClose: () => void;
  onSelect: (month: number) => void;
}

export function MonthNavigationPalette({
  open,
  currentMonth,
  onClose,
  onSelect,
}: Props) {
  if (!open) return null;

  return (
    <OpenMonthNavigationPalette
      currentMonth={currentMonth}
      onClose={onClose}
      onSelect={onSelect}
    />
  );
}

function OpenMonthNavigationPalette({
  currentMonth,
  onClose,
  onSelect,
}: Omit<Props, "open">) {
  const t = useTranslations("MonthNavigation");
  const locale = useLocale();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const options = useMemo(() => buildMonthNavigationOptions(locale), [locale]);
  const currentMonthIndex = Math.max(
    0,
    options.findIndex((option) => option.month === currentMonth),
  );
  const [activeIndex, setActiveIndex] = useState(currentMonthIndex);
  const results = useMemo(
    () => filterMonthNavigationOptions(options, query, locale),
    [locale, options, query],
  );
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const activeOption = results[activeIndex];

  const selectMonth = useCallback(
    (month: number) => {
      onSelect(month);
      onClose();
    },
    [onClose, onSelect],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (results.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, results.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const selected = results[activeIndex];
        if (selected) selectMonth(selected.month);
      }
    },
    [activeIndex, results, selectMonth],
  );

  useEffect(() => {
    const container = resultsContainerRef.current;
    if (!container) return;

    const activeElement = container.querySelector<HTMLElement>("[data-active='true']");
    activeElement?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <Dialog open onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup className="fixed left-1/2 top-[15vh] z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 overflow-hidden rounded-xl border border-border/70 bg-popover shadow-2xl ring-1 ring-foreground/10 outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <DialogPrimitive.Title className="sr-only">
            {t("title")}
          </DialogPrimitive.Title>

          <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
            <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <Input
              role="combobox"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-expanded="true"
              aria-activedescendant={activeOption ? `${listboxId}-${activeOption.month}` : undefined}
              className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
              placeholder={t("placeholder")}
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                setActiveIndex(nextQuery.trim() ? 0 : currentMonthIndex);
              }}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div
            id={listboxId}
            role="listbox"
            aria-label={t("resultsLabel")}
            className="max-h-80 overflow-y-auto py-1.5"
            ref={resultsContainerRef}
          >
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {t("noResults")}
              </div>
            ) : (
              results.map((option, index) => {
                const isActive = index === activeIndex;
                const isCurrent = option.month === currentMonth;

                return (
                  <button
                    key={option.month}
                    id={`${listboxId}-${option.month}`}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    data-active={isActive}
                    className={cn(
                      "flex w-full items-center gap-3 border-l-2 px-4 py-2.5 text-left transition-colors",
                      isActive
                        ? "border-primary bg-primary/8 text-foreground"
                        : "border-transparent text-foreground hover:bg-muted/60",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectMonth(option.month)}
                  >
                    <span className="w-6 font-mono text-[11px] font-medium tabular-nums text-muted-foreground">
                      {String(option.month).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-sm font-medium capitalize">
                      {option.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                        {t("selected")}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-4 border-t border-border/70 bg-muted/25 px-4 py-2 text-[10px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <kbd className="font-mono text-foreground/70">↑↓</kbd>
              {t("navigateHint")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <kbd className="font-mono text-foreground/70">↵</kbd>
              {t("selectHint")}
            </span>
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
