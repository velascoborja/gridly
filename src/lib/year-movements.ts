import type { AdditionalEntry, MonthData } from "./types.ts";
import { sortAdditionalEntriesDesc, sumAdditionalEntries } from "./additional-entries.ts";

export type MovementType = AdditionalEntry["type"];
export type MovementSort = "chronological" | "descending" | "ascending";

type MonthlyTotal = { month: { month: number }; total: number; entryCount: number };

export function sortMovementMonths<T extends MonthlyTotal>(rows: T[], order: MovementSort): T[] {
  return [...rows].sort((a, b) => {
    const difference = order === "chronological" ? 0 : order === "ascending" ? a.total - b.total : b.total - a.total;
    return difference || a.month.month - b.month.month;
  });
}

export function getMovementColorIntensity(row: MonthlyTotal, rows: MonthlyTotal[]): number {
  const totals = rows.filter((item) => item.entryCount > 0).map((item) => item.total);
  if (row.entryCount === 0 || totals.length === 0) return 0;
  const minimum = Math.min(...totals);
  const range = Math.max(...totals) - minimum;
  return range < 1e-8 ? 0 : Math.max(0, Math.min(1, (row.total - minimum) / range));
}

/** Additional entries only; savings and balances keep the financial engine's values. */
export function summarizeYearMovements(months: MonthData[], type: MovementType) {
  const rows = [...months].sort((a, b) => a.month - b.month).map((month) => {
    const entries = sortAdditionalEntriesDesc(type === "expense" ? month.additionalExpenses : month.additionalIncomes);
    const groups = type === "expense"
      ? month.additionalExpenseGroups.filter((group) => group.entries.length > 0).map((group) => ({
        ...group,
        entries: sortAdditionalEntriesDesc(group.entries),
        total: sumAdditionalEntries(group.entries),
      }))
      : [];
    const total = sumAdditionalEntries(entries) + groups.reduce((sum, group) => sum + group.total, 0);
    const entryCount = entries.length + groups.reduce((sum, group) => sum + group.entries.length, 0);
    return { month, entries, groups, total, entryCount };
  });
  const populated = rows.filter((row) => row.entryCount > 0);
  const maximum = populated.length > 0 ? Math.max(...populated.map((row) => row.total)) : null;
  const scale = Math.max(0, ...rows.map((row) => Math.abs(row.total)));
  return {
    total: rows.reduce((sum, row) => sum + row.total, 0),
    maximum,
    rows: rows.map((row) => ({
      ...row,
      isPeak: row.entryCount > 0 && maximum !== null && Math.abs(row.total - maximum) < 1e-8,
      barPercent: scale > 0 ? Math.min(100, Math.abs(row.total) / scale * 100) : 0,
    })),
  };
}
