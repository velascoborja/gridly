import type { AdditionalEntry } from "@/lib/types";

export function sortAdditionalEntriesDesc(entries: AdditionalEntry[]) {
  return [...entries].sort((a, b) => b.id - a.id);
}
