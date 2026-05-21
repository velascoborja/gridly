import type { YearData } from "./types";

export interface SearchEntry {
  id: string;
  label: string;
  amount: number;
  month: number;
  kind: "income" | "expense" | "recurring";
  groupLabel?: string;
}

export function buildSearchIndex(yearData: YearData): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const month of yearData.months) {
    for (const e of month.additionalIncomes) {
      entries.push({ id: `entry-${e.id}`, label: e.label, amount: e.amount, month: month.month, kind: "income" });
    }
    for (const e of month.additionalExpenses) {
      entries.push({ id: `entry-${e.id}`, label: e.label, amount: e.amount, month: month.month, kind: "expense" });
    }
    for (const g of month.additionalExpenseGroups) {
      for (const e of g.entries) {
        entries.push({ id: `entry-${e.id}`, label: e.label, amount: e.amount, month: month.month, kind: "expense", groupLabel: g.label });
      }
    }
    for (const e of month.recurringExpenses) {
      entries.push({ id: `recurring-${e.id}`, label: e.label, amount: e.amount, month: month.month, kind: "recurring" });
    }
  }
  return entries;
}

export function filterSearchIndex(entries: SearchEntry[], query: string): SearchEntry[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return entries
    .filter((e) => e.label.toLowerCase().includes(q) || String(e.amount).includes(q))
    .sort((a, b) => a.month - b.month);
}
