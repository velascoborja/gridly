import type { YearData } from "@/lib/types";
import type { DrilldownEntry } from "@/lib/tag-stats";

export interface FixedExpenseStat {
  key: "home" | "personal" | "recurring";
  totalAmount: number;
  shareOfTotal: number;
  entries: DrilldownEntry[];
}

export interface FixedExpenseStats {
  stats: FixedExpenseStat[];
  grandTotal: number;
}

function buildStats(
  homeTotal: number,
  homeEntries: DrilldownEntry[],
  personalTotal: number,
  personalEntries: DrilldownEntry[],
  recurringTotal: number,
  recurringEntries: DrilldownEntry[],
): FixedExpenseStats {
  const grandTotal = homeTotal + personalTotal + recurringTotal;
  const raw: FixedExpenseStat[] = [];

  if (homeTotal > 0) {
    raw.push({
      key: "home",
      totalAmount: homeTotal,
      shareOfTotal: grandTotal > 0 ? homeTotal / grandTotal : 0,
      entries: homeEntries,
    });
  }
  if (personalTotal > 0) {
    raw.push({
      key: "personal",
      totalAmount: personalTotal,
      shareOfTotal: grandTotal > 0 ? personalTotal / grandTotal : 0,
      entries: personalEntries,
    });
  }
  if (recurringTotal > 0) {
    raw.push({
      key: "recurring",
      totalAmount: recurringTotal,
      shareOfTotal: grandTotal > 0 ? recurringTotal / grandTotal : 0,
      entries: recurringEntries,
    });
  }

  raw.sort((a, b) => b.totalAmount - a.totalAmount);
  return { stats: raw, grandTotal };
}

export function computeFixedStats(yearData: YearData): FixedExpenseStats {
  let homeTotal = 0;
  let personalTotal = 0;
  let recurringTotal = 0;
  const homeEntries: DrilldownEntry[] = [];
  const personalEntries: DrilldownEntry[] = [];
  const recurringEntries: DrilldownEntry[] = [];

  for (const m of yearData.months) {
    if (m.homeExpense > 0) {
      homeTotal += m.homeExpense;
      homeEntries.push({ month: m.month, description: "", amount: m.homeExpense });
    }
    if (m.personalExpense > 0) {
      personalTotal += m.personalExpense;
      personalEntries.push({ month: m.month, description: "", amount: m.personalExpense });
    }
    for (const e of m.recurringExpenses) {
      if (e.amount > 0) {
        recurringTotal += e.amount;
        recurringEntries.push({ month: m.month, description: e.label, amount: e.amount });
      }
    }
  }

  return buildStats(homeTotal, homeEntries, personalTotal, personalEntries, recurringTotal, recurringEntries);
}

export function mergeFixedStatsByYear(perYear: { year: number; stats: FixedExpenseStats }[]): FixedExpenseStats {
  let homeTotal = 0;
  let personalTotal = 0;
  let recurringTotal = 0;
  const homeEntries: DrilldownEntry[] = [];
  const personalEntries: DrilldownEntry[] = [];
  const recurringEntries: DrilldownEntry[] = [];

  for (const { year, stats } of perYear) {
    for (const stat of stats.stats) {
      if (stat.key === "home") {
        homeTotal += stat.totalAmount;
        for (const e of stat.entries) homeEntries.push({ ...e, year });
      } else if (stat.key === "personal") {
        personalTotal += stat.totalAmount;
        for (const e of stat.entries) personalEntries.push({ ...e, year });
      } else if (stat.key === "recurring") {
        recurringTotal += stat.totalAmount;
        for (const e of stat.entries) recurringEntries.push({ ...e, year });
      }
    }
  }

  return buildStats(homeTotal, homeEntries, personalTotal, personalEntries, recurringTotal, recurringEntries);
}
