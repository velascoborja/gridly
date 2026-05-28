import type { YearData, Tag } from "@/lib/types";

export interface DrilldownEntry {
  month: number;
  description: string;
  amount: number;
  groupName?: string;
  year?: number;
}

export interface TagStat {
  tag: Tag | null;
  totalAmount: number;
  entryCount: number;
  shareOfTotal: number;
  entries: DrilldownEntry[];
}

export interface TagStats {
  stats: TagStat[];
  totalAdditional: number;
}

export function computeTagStats(yearData: YearData): TagStats {
  const buckets = new Map<number | null, { tag: Tag | null; totalAmount: number; entries: DrilldownEntry[] }>();

  const ensureBucket = (tagId: number | null, tag: Tag | null) => {
    if (!buckets.has(tagId)) {
      buckets.set(tagId, { tag, totalAmount: 0, entries: [] });
    }
    return buckets.get(tagId)!;
  };

  for (const monthData of yearData.months) {
    for (const entry of monthData.additionalExpenses) {
      const bucket = ensureBucket(entry.tagId, entry.tag);
      bucket.totalAmount += entry.amount;
      bucket.entries.push({ month: monthData.month, description: entry.label, amount: entry.amount });
    }

    for (const group of monthData.additionalExpenseGroups) {
      const bucket = ensureBucket(group.tagId, group.tag);
      for (const entry of group.entries) {
        bucket.totalAmount += entry.amount;
        bucket.entries.push({ month: monthData.month, description: entry.label, amount: entry.amount, groupName: group.label });
      }
    }

    for (const expense of monthData.recurringExpenses) {
      const bucket = ensureBucket(expense.tagId, expense.tag);
      bucket.totalAmount += expense.amount;
      bucket.entries.push({ month: monthData.month, description: expense.label, amount: expense.amount });
    }
  }

  const totalAdditional = [...buckets.values()].reduce((sum, b) => sum + b.totalAmount, 0);

  const tagStats: TagStat[] = [];
  let untaggedStat: TagStat | null = null;

  for (const [tagId, bucket] of buckets) {
    const sortedEntries = [...bucket.entries].sort((a, b) => a.month - b.month);
    const stat: TagStat = {
      tag: bucket.tag,
      totalAmount: bucket.totalAmount,
      entryCount: sortedEntries.length,
      shareOfTotal: totalAdditional > 0 ? bucket.totalAmount / totalAdditional : 0,
      entries: sortedEntries,
    };
    if (tagId === null) {
      untaggedStat = stat;
    } else {
      tagStats.push(stat);
    }
  }

  tagStats.sort((a, b) => b.totalAmount - a.totalAmount);
  if (untaggedStat) tagStats.push(untaggedStat);

  return { stats: tagStats, totalAdditional };
}

export function computeMultiYearTagStats(yearDataList: YearData[]): TagStats {
  const buckets = new Map<number | null, { tag: Tag | null; totalAmount: number; entries: DrilldownEntry[] }>();

  const ensureBucket = (tagId: number | null, tag: Tag | null) => {
    if (!buckets.has(tagId)) {
      buckets.set(tagId, { tag, totalAmount: 0, entries: [] });
    }
    return buckets.get(tagId)!;
  };

  for (const yearData of yearDataList) {
    const year = yearData.config.year;

    for (const monthData of yearData.months) {
      for (const entry of monthData.additionalExpenses) {
        const bucket = ensureBucket(entry.tagId, entry.tag);
        bucket.totalAmount += entry.amount;
        bucket.entries.push({ month: monthData.month, year, description: entry.label, amount: entry.amount });
      }

      for (const group of monthData.additionalExpenseGroups) {
        const bucket = ensureBucket(group.tagId, group.tag);
        for (const entry of group.entries) {
          bucket.totalAmount += entry.amount;
          bucket.entries.push({ month: monthData.month, year, description: entry.label, amount: entry.amount, groupName: group.label });
        }
      }

      for (const expense of monthData.recurringExpenses) {
        const bucket = ensureBucket(expense.tagId, expense.tag);
        bucket.totalAmount += expense.amount;
        bucket.entries.push({ month: monthData.month, year, description: expense.label, amount: expense.amount });
      }
    }
  }

  const totalAdditional = [...buckets.values()].reduce((sum, b) => sum + b.totalAmount, 0);

  const tagStats: TagStat[] = [];
  let untaggedStat: TagStat | null = null;

  for (const [tagId, bucket] of buckets) {
    const sortedEntries = [...bucket.entries].sort(
      (a, b) => (a.year ?? 0) - (b.year ?? 0) || a.month - b.month
    );
    const stat: TagStat = {
      tag: bucket.tag,
      totalAmount: bucket.totalAmount,
      entryCount: sortedEntries.length,
      shareOfTotal: totalAdditional > 0 ? bucket.totalAmount / totalAdditional : 0,
      entries: sortedEntries,
    };
    if (tagId === null) {
      untaggedStat = stat;
    } else {
      tagStats.push(stat);
    }
  }

  tagStats.sort((a, b) => b.totalAmount - a.totalAmount);
  if (untaggedStat) tagStats.push(untaggedStat);

  return { stats: tagStats, totalAdditional };
}
