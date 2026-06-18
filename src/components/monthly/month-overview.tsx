"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdditionalEntriesCard } from "./additional-entries-card";
import { FixedExpensesCard } from "./fixed-expenses-card";
import { IncomeCard } from "./income-card";
import { sortAdditionalEntriesDesc } from "@/lib/additional-entries";
import { sortRecurringExpensesAsc } from "@/lib/recurring-expenses";
import { cn, formatCurrency, formatMonthName } from "@/lib/utils";
import { computeMonthChain } from "@/lib/calculations";
import { getHorizontalSwipeDirection } from "@/lib/mobile-swipe";
import type { MonthData, YearData, AdditionalEntry, AdditionalEntryGroup, RecurringExpense } from "@/lib/types";

interface Props {
  yearData: YearData;
  monthNumber: number;
  readOnly?: boolean;
  monthPathPrefix?: string;
  currentMonthPathPrefix?: string;
  onMonthSelect?: (month: number) => void;
  onYearDataChange?: (yearData: YearData) => void;
  highlightId?: string | null;
  toggleFixedEditorsRef?: { current: (() => void) | null };
  openAddExpenseFormRef?: { current: (() => void) | null };
  openAddIncomeFormRef?: { current: (() => void) | null };
  openAddGroupFormRef?: { current: (() => void) | null };
  toggleAllGroupsRef?: { current: (() => void) | null };
}

type FixedUpdateOptions = Partial<Pick<
  MonthData,
  | "homeExpenseManualOverride"
  | "personalExpenseManualOverride"
  | "investmentManualOverride"
  | "payslipManualOverride"
  | "additionalPayslipManualOverride"
  | "interestsManualOverride"
>>;

const manualOverrideFields = {
  homeExpense: "homeExpenseManualOverride",
  personalExpense: "personalExpenseManualOverride",
  investment: "investmentManualOverride",
  payslip: "payslipManualOverride",
  additionalPayslip: "additionalPayslipManualOverride",
} as const;

type DraggedAdditionalEntry = {
  entry: AdditionalEntry;
  type: "income" | "expense";
  sourceMonthId: number;
  sourceMonthNumber: number;
};

type DraggedAdditionalGroup = {
  group: AdditionalEntryGroup;
  sourceMonthId: number;
  sourceMonthNumber: number;
};

type MovingAdditionalEntry = {
  entryId: number;
  sourceMonthId: number;
};

type MovingAdditionalGroup = {
  groupId: number;
  sourceMonthId: number;
};

type SwipeStart = {
  pointerId: number;
  x: number;
  y: number;
};

const interactiveSwipeIgnoreSelector = "a, button, input, textarea, select, [role='button'], [draggable='true']";

export function MonthOverview({
  yearData: initialYearData,
  monthNumber,
  readOnly = false,
  monthPathPrefix,
  currentMonthPathPrefix,
  onMonthSelect,
  onYearDataChange,
  highlightId = null,
  toggleFixedEditorsRef,
  openAddExpenseFormRef,
  openAddIncomeFormRef,
  openAddGroupFormRef,
  toggleAllGroupsRef,
}: Props) {
  const t = useTranslations("Monthly");
  const tOverview = useTranslations("Monthly.overview");
  const locale = useLocale();
  const [months, setMonths] = useState<MonthData[]>(initialYearData.months);
  const [showFixedEditors, setShowFixedEditors] = useState(readOnly);
  const [renderFixedEditors, setRenderFixedEditors] = useState(false);
  const [fixedEditorsVisible, setFixedEditorsVisible] = useState(false);
  const [fixedEditorsHeight, setFixedEditorsHeight] = useState<number | "auto">(0);
  const [draggedEntry, setDraggedEntry] = useState<DraggedAdditionalEntry | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<DraggedAdditionalGroup | null>(null);
  const [dragOverMonthId, setDragOverMonthId] = useState<number | null>(null);
  const [movingEntry, setMovingEntry] = useState<MovingAdditionalEntry | null>(null);
  const [movingGroup, setMovingGroup] = useState<MovingAdditionalGroup | null>(null);
  const monthsRef = useRef<MonthData[]>(initialYearData.months);
  const config = initialYearData.config;
  const yearRecurringExpenses = initialYearData.recurringExpenses;
  const today = new Date();
  const activeMonthTabRef = useRef<HTMLDivElement>(null);
  const fixedEditorsInnerRef = useRef<HTMLDivElement>(null);
  const fixedEditorsFrameRef = useRef<number | null>(null);
  const swipeStartRef = useRef<SwipeStart | null>(null);
  const sortedMonths = [...months].sort((a, b) => a.month - b.month);

  useEffect(() => {
    monthsRef.current = initialYearData.months;
    setMonths(initialYearData.months);
  }, [initialYearData]);

  useEffect(() => {
    setShowFixedEditors(readOnly);
  }, [readOnly]);

  useEffect(() => {
    if (showFixedEditors) {
      setRenderFixedEditors(true);
      return undefined;
    }

    setFixedEditorsVisible(false);
    return undefined;
  }, [showFixedEditors]);

  useEffect(() => {
    return () => {
      if (fixedEditorsFrameRef.current !== null) {
        window.cancelAnimationFrame(fixedEditorsFrameRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const panel = fixedEditorsInnerRef.current;
    if (!renderFixedEditors || !panel) return;

    if (fixedEditorsFrameRef.current !== null) {
      window.cancelAnimationFrame(fixedEditorsFrameRef.current);
      fixedEditorsFrameRef.current = null;
    }

    if (showFixedEditors) {
      setFixedEditorsHeight(0);
      setFixedEditorsVisible(false);
      fixedEditorsFrameRef.current = window.requestAnimationFrame(() => {
        setFixedEditorsVisible(true);
        setFixedEditorsHeight(panel.scrollHeight);
        fixedEditorsFrameRef.current = null;
      });
      return;
    }

    const currentHeight = panel.scrollHeight;
    setFixedEditorsHeight(currentHeight);
    fixedEditorsFrameRef.current = window.requestAnimationFrame(() => {
      setFixedEditorsHeight(0);
      fixedEditorsFrameRef.current = null;
    });
  }, [renderFixedEditors, showFixedEditors]);

  useEffect(() => {
    activeMonthTabRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [monthNumber]);

  useEffect(() => {
    if (!toggleFixedEditorsRef) return;
    toggleFixedEditorsRef.current = () => setShowFixedEditors((prev) => !prev);
    return () => { toggleFixedEditorsRef.current = null; };
  }, [toggleFixedEditorsRef]);

  useEffect(() => {
    if (highlightId?.startsWith("recurring-")) {
      setShowFixedEditors(true);
    }
  }, [highlightId]);

  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-highlight-id="${highlightId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    return () => clearTimeout(timer);
  }, [highlightId]);

  const month = sortedMonths.find((m) => m.month === monthNumber);
  const activeIndex = month ? sortedMonths.findIndex((item) => item.id === month.id) : -1;
  const previousMonth = activeIndex > 0 ? sortedMonths[activeIndex - 1] : null;
  const nextMonth = activeIndex >= 0 && activeIndex < sortedMonths.length - 1 ? sortedMonths[activeIndex + 1] : null;
  const monthBasePath = monthPathPrefix ?? `/${config.year}`;
  const currentMonthRoute = `${currentMonthPathPrefix ?? `/${today.getFullYear()}`}/${today.getMonth() + 1}`;
  const canHandleCurrentMonthLocally = Boolean(onMonthSelect) && config.year === today.getFullYear();

  const interceptMonthNavigation = useCallback(
    (targetMonth: number) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!onMonthSelect) return;
      event.preventDefault();
      onMonthSelect(targetMonth);
    },
    [onMonthSelect]
  );

  const handleSwipePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!onMonthSelect || event.pointerType === "mouse") return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    if (event.target instanceof Element && event.target.closest(interactiveSwipeIgnoreSelector)) return;

    swipeStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  }, [onMonthSelect]);

  const handleSwipePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const swipeStart = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!swipeStart || swipeStart.pointerId !== event.pointerId || !onMonthSelect) return;

    const direction = getHorizontalSwipeDirection({
      startX: swipeStart.x,
      startY: swipeStart.y,
      endX: event.clientX,
      endY: event.clientY,
    });

    if (direction === "next" && nextMonth) {
      onMonthSelect(nextMonth.month);
      return;
    }

    if (direction === "previous" && previousMonth) {
      onMonthSelect(previousMonth.month);
    }
  }, [nextMonth, onMonthSelect, previousMonth]);

  const recompute = useCallback((updated: MonthData[]) => {
    return computeMonthChain(updated, config.startingBalance, config.interestRate);
  }, [config.interestRate, config.startingBalance]);

  const commitMonthsChange = useCallback((update: (previousMonths: MonthData[]) => MonthData[]) => {
    const recomputedMonths = recompute(update(monthsRef.current));
    monthsRef.current = recomputedMonths;
    setMonths(recomputedMonths);
    if (onYearDataChange) {
      onYearDataChange({
        config,
        recurringExpenses: yearRecurringExpenses,
        months: recomputedMonths,
      });
    }
  }, [config, onYearDataChange, recompute, yearRecurringExpenses]);

  const handleFixedUpdate = useCallback(async (field: string, value: number, options?: FixedUpdateOptions) => {
    if (!month) return;
    const res = await fetch(`/api/months/${month.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value, ...options }),
    });
    if (!res.ok) throw new Error("Failed to update");

    commitMonthsChange((prev) =>
      prev.map((m) =>
        m.id === month.id
          ? {
              ...m,
              [field]: value,
              ...(field in manualOverrideFields
                ? { [manualOverrideFields[field as keyof typeof manualOverrideFields]]: true }
                : {}),
              ...options,
              ...(options?.interestsManualOverride !== undefined
                ? { interestsManualOverride: options.interestsManualOverride }
                : field === "interests"
                  ? { interestsManualOverride: true }
                  : {}),
            }
          : m
      )
    );
  }, [commitMonthsChange, month]);

  const handleEntriesChange = useCallback((type: "income" | "expense", entries: AdditionalEntry[]) => {
    commitMonthsChange((prev) =>
      prev.map((m) => {
        if (m.month !== monthNumber) return m;
        if (type === "expense") return { ...m, additionalExpenses: sortAdditionalEntriesDesc(entries) };
        return { ...m, additionalIncomes: sortAdditionalEntriesDesc(entries) };
      })
    );
  }, [commitMonthsChange, monthNumber]);

  const handleAdditionalEntryMove = useCallback(async (
    entry: AdditionalEntry,
    type: "income" | "expense",
    sourceMonthId: number,
    targetMonthId: number
  ) => {
    if (sourceMonthId === targetMonthId || movingEntry?.entryId === entry.id) return;

    const currentMonths = monthsRef.current;
    const sourceMonth = currentMonths.find((item) => item.id === sourceMonthId);
    const targetMonth = currentMonths.find((item) => item.id === targetMonthId);
    if (!sourceMonth || !targetMonth || sourceMonth.yearId !== targetMonth.yearId) return;

    const entryId = entry.id;
    setMovingEntry({ entryId: entry.id, sourceMonthId });
    try {
      const res = await fetch(`/api/months/${sourceMonthId}/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthId: targetMonthId }),
      });
      if (!res.ok) return;

      const updated = await res.json();
      const movedEntry: AdditionalEntry = {
        ...updated,
        amount: parseFloat(updated.amount),
        tag: updated.tagId === entry.tagId ? entry.tag : null,
      };

      commitMonthsChange((prev) =>
        prev.map((item) => {
          const collectionKey = type === "expense" ? "additionalExpenses" : "additionalIncomes";
          if (item.id === sourceMonthId) {
            return {
              ...item,
              [collectionKey]: sortAdditionalEntriesDesc(item[collectionKey].filter((candidate) => candidate.id !== entryId)),
            };
          }
          if (item.id === targetMonthId) {
            return {
              ...item,
              [collectionKey]: sortAdditionalEntriesDesc([
                ...item[collectionKey].filter((candidate) => candidate.id !== entryId),
                movedEntry,
              ]),
            };
          }
          return item;
        })
      );
    } finally {
      setMovingEntry(null);
      setDraggedEntry(null);
      setDraggedGroup(null);
      setDragOverMonthId(null);
    }
  }, [commitMonthsChange, movingEntry?.entryId]);

  const handleAdditionalGroupMove = useCallback(async (
    group: AdditionalEntryGroup,
    sourceMonthId: number,
    targetMonthId: number
  ) => {
    if (sourceMonthId === targetMonthId || movingGroup?.groupId === group.id) return;

    const currentMonths = monthsRef.current;
    const sourceMonth = currentMonths.find((item) => item.id === sourceMonthId);
    const targetMonth = currentMonths.find((item) => item.id === targetMonthId);
    if (!sourceMonth || !targetMonth || sourceMonth.yearId !== targetMonth.yearId) return;

    setMovingGroup({ groupId: group.id, sourceMonthId });
    try {
      const res = await fetch(`/api/months/${sourceMonthId}/entry-groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthId: targetMonthId }),
      });
      if (!res.ok) return;

      const updated = await res.json();
      const movedGroup: AdditionalEntryGroup = {
        ...group,
        ...updated,
        monthId: targetMonthId,
        tagId: updated.tagId ?? group.tagId ?? null,
        tag: group.tag,
        entries: group.entries.map((entry) => ({
          ...entry,
          monthId: targetMonthId,
        })),
      };

      commitMonthsChange((prev) =>
        prev.map((item) => {
          if (item.id === sourceMonthId) {
            return {
              ...item,
              additionalExpenseGroups: item.additionalExpenseGroups.filter((candidate) => candidate.id !== group.id),
            };
          }
          if (item.id === targetMonthId) {
            return {
              ...item,
              additionalExpenseGroups: [
                ...item.additionalExpenseGroups.filter((candidate) => candidate.id !== group.id),
                movedGroup,
              ],
            };
          }
          return item;
        })
      );
    } finally {
      setMovingGroup(null);
      setDraggedEntry(null);
      setDraggedGroup(null);
      setDragOverMonthId(null);
    }
  }, [commitMonthsChange, movingGroup?.groupId]);

  const handleMonthDragOver = useCallback((targetMonthId: number) => (event: React.DragEvent<HTMLAnchorElement>) => {
    const draggedItem = draggedEntry ?? draggedGroup;
    if (!draggedItem || draggedItem.sourceMonthId === targetMonthId || movingEntry || movingGroup) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverMonthId(targetMonthId);
  }, [draggedEntry, draggedGroup, movingEntry, movingGroup]);

  const handleMonthDragLeave = useCallback((targetMonthId: number) => (event: React.DragEvent<HTMLAnchorElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDragOverMonthId((current) => current === targetMonthId ? null : current);
  }, []);

  const handleMonthDrop = useCallback((targetMonthId: number) => (event: React.DragEvent<HTMLAnchorElement>) => {
    const draggedItem = draggedEntry ?? draggedGroup;
    if (!draggedItem || draggedItem.sourceMonthId === targetMonthId) return;
    event.preventDefault();
    if (draggedEntry) {
      void handleAdditionalEntryMove(draggedEntry.entry, draggedEntry.type, draggedEntry.sourceMonthId, targetMonthId);
      return;
    }
    if (draggedGroup) {
      void handleAdditionalGroupMove(draggedGroup.group, draggedGroup.sourceMonthId, targetMonthId);
    }
  }, [draggedEntry, draggedGroup, handleAdditionalEntryMove, handleAdditionalGroupMove]);

  const handleGroupsChange = useCallback((groups: AdditionalEntryGroup[]) => {
    commitMonthsChange((prev) =>
      prev.map((m) => {
        if (m.month !== monthNumber) return m;
        return { ...m, additionalExpenseGroups: groups };
      })
    );
  }, [commitMonthsChange, monthNumber]);

  const handleEntryGroupChanged = useCallback((entry: AdditionalEntry, toGroupId: number | null) => {
    commitMonthsChange((prev) =>
      prev.map((m) => {
        if (m.month !== monthNumber) return m;
        const newUngrouped = m.additionalExpenses.filter((e) => e.id !== entry.id);
        const newGroups = m.additionalExpenseGroups.map((g) => ({
          ...g,
          entries: g.entries.filter((e) => e.id !== entry.id),
        }));
        if (toGroupId === null) {
          return {
            ...m,
            additionalExpenses: sortAdditionalEntriesDesc([...newUngrouped, entry]),
            additionalExpenseGroups: newGroups,
          };
        }
        return {
          ...m,
          additionalExpenses: newUngrouped,
          additionalExpenseGroups: newGroups.map((g) =>
            g.id === toGroupId
              ? { ...g, entries: sortAdditionalEntriesDesc([...g.entries, entry]) }
              : g
          ),
        };
      })
    );
  }, [commitMonthsChange, monthNumber]);

  const handleRecurringExpensesChange = useCallback((entries: RecurringExpense[]) => {
    commitMonthsChange((prev) =>
      prev.map((m) =>
        m.month === monthNumber ? { ...m, recurringExpenses: sortRecurringExpensesAsc(entries) } : m
      )
    );
  }, [commitMonthsChange, monthNumber]);

  if (!month) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        {t("noData")}
      </div>
    );
  }

  const savingsPositive = month.savings >= 0;
  const isSelectedMonthCurrent =
    config.year === today.getFullYear() && month.month === today.getMonth() + 1;
  const isPastMonth =
    config.year < today.getFullYear() || (config.year === today.getFullYear() && month.month < today.getMonth() + 1);
  const isFutureMonth =
    config.year > today.getFullYear() || (config.year === today.getFullYear() && month.month > today.getMonth() + 1);
  return (
    <div
      className="md:touch-auto touch-pan-y"
      onPointerDown={handleSwipePointerDown}
      onPointerUp={handleSwipePointerUp}
      onPointerCancel={() => {
        swipeStartRef.current = null;
      }}
    >
      <div className="mb-6 overflow-hidden rounded-lg border border-border/70 bg-background/90 shadow-[0_30px_45px_-30px_rgba(50,50,93,0.25),0_18px_36px_-24px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2 border-b border-border/70 px-3 py-3 sm:px-4">
          {previousMonth ? (
            <Link
              href={`${monthBasePath}/${previousMonth.month}`}
              onClick={interceptMonthNavigation(previousMonth.month)}
              aria-label={tOverview("previousMonth", {
                month: formatMonthName(previousMonth.month, locale),
              })}
              className={cn(
                buttonVariants({ variant: "outline", size: "icon-sm" }),
                "shrink-0 rounded-md border-border/70 bg-background/90 text-foreground shadow-sm hover:border-primary/35 hover:bg-primary/[0.05] hover:text-primary"
              )}
            >
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-muted-foreground/60"
            >
              <ChevronLeft className="size-4" />
            </span>
          )}

          <div className="min-w-0 flex-1 overflow-x-auto scroll-px-3 snap-x snap-proximity scrollbar-hide [mask-image:linear-gradient(to_right,transparent,black_12px,black_calc(100%-12px),transparent)] sm:scroll-px-1 sm:[mask-image:none]">
            <div className="mx-auto flex w-max min-w-max gap-2 px-3 sm:px-1 py-1">
              {sortedMonths.map((item) => {
                const isActive = item.month === month.month;
                const isItemCurrentMonth =
                  config.year === today.getFullYear() && item.month === today.getMonth() + 1;
                const isItemPastMonth =
                  config.year < today.getFullYear() || (config.year === today.getFullYear() && item.month < today.getMonth() + 1);
                const monthLabel = formatMonthName(item.month, locale);
                const isAdditionalEntryDropTarget =
                  Boolean(draggedEntry ?? draggedGroup) && (draggedEntry ?? draggedGroup)?.sourceMonthId !== item.id && !movingEntry && !movingGroup;
                const isAdditionalEntryDropHovered = isAdditionalEntryDropTarget && dragOverMonthId === item.id;
                const monthAriaLabel = isItemCurrentMonth ? `${monthLabel}, ${tOverview("currentMonthLabel")}` : monthLabel;

                return (
                  <div
                    key={item.id}
                    ref={isActive ? activeMonthTabRef : null}
                    className="flex shrink-0 snap-center"
                  >
                    <Link
                      href={`${monthBasePath}/${item.month}`}
                      onClick={interceptMonthNavigation(item.month)}
                      onDragOver={handleMonthDragOver(item.id)}
                      onDragLeave={handleMonthDragLeave(item.id)}
                      onDrop={handleMonthDrop(item.id)}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={
                        isAdditionalEntryDropTarget
                          ? tOverview(draggedGroup ? "dropGroupOnMonth" : "dropEntryOnMonth", { month: monthLabel })
                          : monthAriaLabel
                      }
                      className={cn(
                        "inline-flex min-w-20 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium capitalize transition-all",
                        isActive
                          ? isItemPastMonth
                            ? "border-slate-700 bg-slate-800 text-slate-100 shadow-sm"
                            : isItemCurrentMonth
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-indigo-600 bg-indigo-700 text-indigo-50 shadow-sm"
                          : isItemCurrentMonth
                            ? "border-primary/25 bg-primary/[0.06] text-foreground hover:border-primary/40 hover:bg-primary/[0.1]"
                            : isItemPastMonth
                              ? "border-border/40 bg-muted/20 text-muted-foreground/60 hover:border-border/60 hover:bg-muted/40 hover:text-foreground/80"
                              : "border-indigo-100/50 bg-indigo-50/30 text-indigo-700/60 hover:border-indigo-200/70 hover:bg-indigo-50/50 hover:text-indigo-800",
                        isAdditionalEntryDropTarget &&
                          "border-dashed border-primary/45 bg-primary/[0.06] text-primary hover:border-primary/70 hover:bg-primary/[0.1]",
                        isAdditionalEntryDropHovered && "border-primary bg-primary/[0.12] shadow-sm"
                      )}
                    >
                      <span>{formatMonthName(item.month, locale, "short")}</span>
                      {isItemCurrentMonth && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-1.5 rounded-full",
                            isActive ? "bg-primary-foreground/90" : "bg-primary"
                          )}
                        />
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {nextMonth ? (
            <Link
              href={`${monthBasePath}/${nextMonth.month}`}
              onClick={interceptMonthNavigation(nextMonth.month)}
              aria-label={tOverview("nextMonth", {
                month: formatMonthName(nextMonth.month, locale),
              })}
              className={cn(
                buttonVariants({ variant: "outline", size: "icon-sm" }),
                "shrink-0 rounded-md border-border/70 bg-background/90 text-foreground shadow-sm hover:border-primary/35 hover:bg-primary/[0.05] hover:text-primary"
              )}
            >
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span
              aria-hidden="true"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-muted-foreground/60"
            >
              <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      </div>

      <Card
        className={cn(
          "relative mb-6 overflow-hidden border-white/10 text-white shadow-[0_30px_45px_-30px_rgba(50,50,93,0.45),0_18px_36px_-18px_rgba(0,0,0,0.22)] transition-colors duration-500",
          isPastMonth
            ? "bg-gradient-to-br from-slate-900 via-[#0d253d] to-slate-950"
            : isSelectedMonthCurrent
              ? "bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] shadow-[0_30px_60px_-15px_rgba(83,58,253,0.25)]"
              : "bg-gradient-to-br from-[#1c1e54] via-[#0d253d] to-slate-950"
        )}
      >
        <CardContent className="px-6 py-3">
          {!isSelectedMonthCurrent && (
            <Link
              href={currentMonthRoute}
              onClick={canHandleCurrentMonthLocally ? interceptMonthNavigation(today.getMonth() + 1) : undefined}
              aria-label={tOverview("backToCurrentMonth")}
              className="absolute top-3 right-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1.5 sm:py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300/80 transition-all hover:border-emerald-400/50 hover:bg-emerald-400/20 hover:text-emerald-200 hover:shadow-[0_0_14px_rgba(52,211,153,0.15)]"
            >
              <ArrowLeft className="size-3 shrink-0" />
              <span className="hidden sm:inline leading-none">{formatMonthName(today.getMonth() + 1, locale)}</span>
            </Link>
          )}
          <div className="flex flex-col items-center gap-8 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
            {/* Left: Identification */}
            <div className="flex flex-col items-center gap-4 sm:gap-8 lg:flex-row">
              <div>
                <h2 className="text-2xl font-bold tracking-tight capitalize">
                  {formatMonthName(month.month, locale)} {config.year}
                </h2>
                <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isSelectedMonthCurrent
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                        : isPastMonth
                          ? "bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]"
                          : "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                    )}
                  />
                  {tOverview(
                    isSelectedMonthCurrent ? "currentMonth" : isPastMonth ? "pastMonth" : isFutureMonth ? "futureMonth" : "activeMonth"
                  )}

                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    aria-expanded={showFixedEditors}
                    aria-controls="month-fixed-editors"
                    className="inline-flex items-center gap-1 rounded-md border border-white/18 bg-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:border-white/28 hover:bg-white/16"
                    aria-label={tOverview(readOnly ? "viewMonthAria" : "editMonthAria", {
                      month: formatMonthName(month.month, locale),
                    })}
                    onClick={() => setShowFixedEditors((prev) => !prev)}
                  >
                    {showFixedEditors ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    <span aria-hidden="true" className="grid">
                      <span className={cn("col-start-1 row-start-1", showFixedEditors ? "visible" : "invisible")}>
                        {tOverview("hideMonthEditor")}
                      </span>
                      <span className={cn("col-start-1 row-start-1", showFixedEditors ? "invisible" : "visible")}>
                        {tOverview("editMonth")}
                      </span>
                    </span>
                  </button>
                </div>
              </div>
              
              <div className="hidden h-12 w-px bg-white/10 lg:block" />

              {/* Center: Primary KPIs */}
              <div className="flex gap-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/50 font-medium">{tOverview("netSavings")}</p>
                  <p className={`text-3xl font-bold tracking-tight tabular-nums ${savingsPositive ? "text-emerald-300" : "text-rose-300"}`}>
                    {savingsPositive ? "+" : ""}{formatCurrency(month.savings, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/50 font-medium">{tOverview("endingBalance")}</p>
                  <p className="text-3xl font-bold tracking-tight tabular-nums text-white/90">
                    {formatCurrency(month.endingBalance, locale)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Secondary Stats */}
            <div className="flex w-full justify-center gap-6 border-t border-white/10 pt-4 lg:w-auto lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div className="space-y-1 lg:text-right">
                <p className="text-xs uppercase tracking-widest text-white/30 font-bold">{tOverview("startingBalance")}</p>
                <p className="text-base font-medium tabular-nums text-white/80">{formatCurrency(month.startingBalance, locale)}</p>
              </div>
              <div className="space-y-1 lg:text-right">
                <p className="text-xs uppercase tracking-widest text-white/30 font-bold">{tOverview("totalIncome")}</p>
                <p className="text-base font-medium tabular-nums text-emerald-400/80">{formatCurrency(month.totalIncome, locale)}</p>
              </div>
              <div className="space-y-1 lg:text-right">
                <p className="text-xs uppercase tracking-widest text-white/30 font-bold">{tOverview("totalExpenses")}</p>
                <p className="text-base font-medium tabular-nums text-rose-400/80">{formatCurrency(month.totalExpenses, locale)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {renderFixedEditors ? (
        <div
          id="month-fixed-editors"
          aria-hidden={!showFixedEditors}
          className={cn(
            "overflow-hidden transition-[height,opacity,transform] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[height,opacity,transform]",
            fixedEditorsVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-1.5 pointer-events-none"
          )}
          style={{ height: fixedEditorsHeight === "auto" ? "auto" : `${fixedEditorsHeight}px` }}
          onTransitionEnd={(event) => {
            if (event.target !== event.currentTarget || event.propertyName !== "height") return;
            if (showFixedEditors && fixedEditorsVisible) {
              setFixedEditorsHeight("auto");
              return;
            }
            setRenderFixedEditors(false);
          }}
        >
          <div ref={fixedEditorsInnerRef} className="overflow-hidden pb-6">
            <div
              className={cn(
                "grid gap-4 pt-1 pb-0.5 transition-[opacity,transform,filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:grid-cols-2",
                fixedEditorsVisible
                  ? "opacity-100 translate-y-0 blur-0"
                  : "opacity-0 translate-y-1.5 blur-[2px]"
              )}
            >
              <FixedExpensesCard
                month={month}
                onUpdate={handleFixedUpdate}
                onRecurringEntriesChange={handleRecurringExpensesChange}
                annualDefaults={config}
                readOnly={readOnly}
                highlightId={highlightId}
              />
              <IncomeCard
                month={month}
                onUpdate={handleFixedUpdate}
                showAdditionalPayslip={config.hasExtraPayments && (month.month === 6 || month.month === 12)}
                annualDefaults={config}
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <AdditionalEntriesCard
          monthId={month.id}
          type="expense"
          entries={month.additionalExpenses}
          onEntriesChange={(entries) => handleEntriesChange("expense", entries)}
          groups={month.additionalExpenseGroups}
          onGroupsChange={handleGroupsChange}
          onEntryGroupChanged={handleEntryGroupChanged}
          readOnly={readOnly}
          title={tOverview("additionalExpensesTitle")}
          movingEntryId={movingEntry?.entryId ?? null}
          movingGroupId={movingGroup?.groupId ?? null}
          moveTargets={sortedMonths
            .filter((item) => item.id !== month.id)
            .map((item) => ({ id: item.id, month: item.month }))}
          onEntryMoveToMonth={(entry, targetMonthId) => {
            void handleAdditionalEntryMove(entry, "expense", month.id, targetMonthId);
          }}
          onGroupMoveToMonth={(group, targetMonthId) => {
            void handleAdditionalGroupMove(group, month.id, targetMonthId);
          }}
          onEntryDragStart={(entry) => {
            setDraggedGroup(null);
            setDraggedEntry({
              entry,
              type: "expense",
              sourceMonthId: month.id,
              sourceMonthNumber: month.month,
            });
          }}
          onGroupDragStart={(group) => {
            setDraggedEntry(null);
            setDraggedGroup({
              group,
              sourceMonthId: month.id,
              sourceMonthNumber: month.month,
            });
          }}
          onEntryDragEnd={() => {
            setDraggedEntry(null);
            setDragOverMonthId(null);
          }}
          onGroupDragEnd={() => {
            setDraggedGroup(null);
            setDragOverMonthId(null);
          }}
          highlightId={highlightId}
          openAddFormRef={openAddExpenseFormRef}
          openAddGroupFormRef={openAddGroupFormRef}
          toggleAllGroupsRef={toggleAllGroupsRef}
        />

        <AdditionalEntriesCard
          monthId={month.id}
          type="income"
          entries={month.additionalIncomes}
          onEntriesChange={(entries) => handleEntriesChange("income", entries)}
          readOnly={readOnly}
          title={tOverview("additionalIncomeTitle")}
          movingEntryId={movingEntry?.entryId ?? null}
          moveTargets={sortedMonths
            .filter((item) => item.id !== month.id)
            .map((item) => ({ id: item.id, month: item.month }))}
          onEntryMoveToMonth={(entry, targetMonthId) => {
            void handleAdditionalEntryMove(entry, "income", month.id, targetMonthId);
          }}
          onEntryDragStart={(entry) => {
            setDraggedGroup(null);
            setDraggedEntry({
              entry,
              type: "income",
              sourceMonthId: month.id,
              sourceMonthNumber: month.month,
            });
          }}
          onEntryDragEnd={() => {
            setDraggedEntry(null);
            setDragOverMonthId(null);
          }}
          highlightId={highlightId}
          openAddFormRef={openAddIncomeFormRef}
        />
      </div>
    </div>
  );
}
