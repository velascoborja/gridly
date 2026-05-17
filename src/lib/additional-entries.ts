import type { AdditionalEntry, MonthData } from "@/lib/types";

export function sortAdditionalEntriesDesc(entries: AdditionalEntry[]) {
  return [...entries].sort((a, b) => {
    const amountDiff = b.amount - a.amount;
    return amountDiff !== 0 ? amountDiff : b.id - a.id;
  });
}

export function sumAdditionalEntries(entries: AdditionalEntry[]) {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

export function avgAdditionalEntriesPerMonth(
  months: MonthData[],
  type: "expense" | "income"
): number {
  const total = months.reduce((sum, m) => {
    if (type === "income") {
      return sum + sumAdditionalEntries(m.additionalIncomes);
    }
    const ungrouped = sumAdditionalEntries(m.additionalExpenses);
    const grouped = m.additionalExpenseGroups.reduce(
      (s, g) => s + sumAdditionalEntries(g.entries),
      0
    );
    return sum + ungrouped + grouped;
  }, 0);
  return total / 12;
}
