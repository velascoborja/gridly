import type { AdditionalEntry } from "@/lib/types";

export function sortAdditionalEntriesDesc(entries: AdditionalEntry[]) {
  return [...entries].sort((a, b) => {
    const amountDiff = b.amount - a.amount;
    return amountDiff !== 0 ? amountDiff : b.id - a.id;
  });
}
