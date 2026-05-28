"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EntryFormRow } from "./entry-form-row";
import { TagPicker } from "./tag-picker";
import { sortRecurringExpensesAsc } from "@/lib/recurring-expenses";
import { cn, formatCurrency } from "@/lib/utils";
import { TAG_COLORS } from "@/lib/tags";
import { useRouter } from "@/i18n/routing";
import type { RecurringExpense, Tag } from "@/lib/types";

interface Props {
  monthId: number;
  entries: RecurringExpense[];
  onEntriesChange: (entries: RecurringExpense[]) => void;
  readOnly?: boolean;
  highlightId?: string | null;
}

export function RecurringExpensesList({ monthId, entries, onEntriesChange, readOnly = false, highlightId = null }: Props) {
  const t = useTranslations("RecurringExpenses.monthly");
  const common = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [pendingTag, setPendingTag] = useState<{ entry: RecurringExpense; tagId: number | null; tag: Tag | null } | null>(null);
  const [savingTagId, setSavingTagId] = useState<number | null>(null);
  const sortedEntries = sortRecurringExpensesAsc(entries);

  useEffect(() => {
    if (readOnly) return;
    fetch("/api/tags")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Tag[]) => setTags(data))
      .catch(() => {});
  }, [readOnly]);

  const openEditForm = (entry: RecurringExpense) => {
    setEditingId(entry.id);
    setEditLabel(entry.label);
    setEditAmount(String(entry.amount));
  };

  const handleEdit = async (id: number) => {
    if (savingId === id) return;
    const amount = parseFloat(editAmount.replace(",", "."));
    if (!editLabel.trim() || Number.isNaN(amount)) return;

    setSavingId(id);
    try {
      const res = await fetch(`/api/months/${monthId}/recurring-expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel.trim(), amount }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      onEntriesChange(sortRecurringExpensesAsc(entries.map((entry) => entry.id === id ? updated : entry)));
      setEditingId(null);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (deletingId === id) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/months/${monthId}/recurring-expenses/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      onEntriesChange(sortRecurringExpensesAsc(entries.filter((entry) => entry.id !== id)));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateTag = async (name: string, color: string): Promise<Tag> => {
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) throw new Error("Failed to create tag");
    const tag: Tag = await res.json();
    setTags((prev) => [...prev, tag]);
    return tag;
  };

  const requestTagChange = (entry: RecurringExpense, tagId: number | null, tag: Tag | null) => {
    if (tagId === entry.tagId) return;
    setPendingTag({ entry, tagId, tag });
  };

  const confirmTagChange = async () => {
    if (!pendingTag) return;
    const { entry, tagId, tag } = pendingTag;
    setSavingTagId(entry.id);
    try {
      const res = await fetch(`/api/months/${monthId}/recurring-expenses/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      if (!res.ok) return;
      onEntriesChange(
        sortRecurringExpensesAsc(
          entries.map((e) => (e.id === entry.id ? { ...e, tagId, tag } : e))
        )
      );
      router.refresh();
    } finally {
      setSavingTagId(null);
      setPendingTag(null);
    }
  };

  if (sortedEntries.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/70 bg-background/50 px-3 py-2 text-xs text-muted-foreground">
        {t("empty")}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {sortedEntries.map((entry) =>
          !readOnly && editingId === entry.id ? (
            <div key={entry.id} className="rounded-md border border-border/70 bg-background/80 p-1.5" aria-busy={savingId === entry.id}>
              <EntryFormRow
                labelValue={editLabel}
                onLabelChange={setEditLabel}
                amountValue={editAmount}
                onAmountChange={setEditAmount}
                onSave={() => handleEdit(entry.id)}
                onCancel={() => setEditingId(null)}
                disabled={savingId === entry.id}
                isSaving={savingId === entry.id}
                saveLabel={common("save")}
                savingLabel={common("saving")}
                cancelLabel={common("cancel")}
                autoFocus
              />
            </div>
          ) : (
            <div
              key={entry.id}
              data-highlight-id={`recurring-${entry.id}`}
              className={cn(
                "rounded-md border border-transparent px-2 py-1.5 transition-all hover:border-border/70 hover:bg-background/60",
                deletingId === entry.id && "pointer-events-none opacity-60",
                highlightId === `recurring-${entry.id}` && "animate-entry-highlight"
              )}
            >
              <div className="flex min-w-0 items-center justify-between gap-2">
                <button
                  className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:text-primary disabled:pointer-events-none"
                  onClick={() => openEditForm(entry)}
                  type="button"
                  title={entry.label}
                  disabled={readOnly || deletingId === entry.id}
                >
                  {entry.label}
                </button>
                <div className="flex shrink-0 items-center gap-1.5">
                  {!readOnly ? (
                    <button
                      className="whitespace-nowrap text-sm font-semibold tabular-nums transition-colors hover:text-primary focus-visible:text-primary disabled:pointer-events-none"
                      onClick={() => openEditForm(entry)}
                      type="button"
                      disabled={deletingId === entry.id}
                    >
                      {formatCurrency(entry.amount, locale)}
                    </button>
                  ) : (
                    <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
                      {formatCurrency(entry.amount, locale)}
                    </span>
                  )}
                  {!readOnly ? (
                    <TagPicker
                      tags={tags}
                      value={entry.tagId}
                      onChange={(tagId, tag) => requestTagChange(entry, tagId, tag ?? null)}
                      onCreateTag={handleCreateTag}
                      disabled={savingTagId === entry.id}
                      isLoading={savingTagId === entry.id}
                      customTrigger={
                        entry.tag && TAG_COLORS[entry.tag.color] ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none transition-colors hover:opacity-80 disabled:opacity-50"
                            style={{
                              background: TAG_COLORS[entry.tag.color].bg,
                              borderColor: TAG_COLORS[entry.tag.color].border,
                              color: TAG_COLORS[entry.tag.color].text,
                            }}
                            disabled={savingTagId === entry.id}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: TAG_COLORS[entry.tag.color].text }}
                            />
                            <span className="hidden sm:inline">{entry.tag.name}</span>
                          </button>
                        ) : undefined
                      }
                    />
                  ) : null}
                  {!readOnly ? (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" disabled={deletingId === entry.id} aria-label={t("deleteEntry", { label: entry.label })}>
                            {deletingId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        }
                      />
                      <AlertDialogContent size="sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("confirmDeleteDescription", { label: entry.label })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel variant="ghost" disabled={deletingId === entry.id}>
                            {common("cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                          >
                            {deletingId === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            {deletingId === entry.id ? t("deleting") : t("confirmDeleteAction")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                </div>
              </div>
            </div>
          )
        )}
      </div>

      <AlertDialog open={pendingTag !== null} onOpenChange={(open) => { if (!open) setPendingTag(null); }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tagConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("tagConfirmDescription", { label: pendingTag?.entry.label ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="ghost" disabled={savingTagId !== null}>
              {common("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmTagChange} disabled={savingTagId !== null}>
              {savingTagId !== null ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {t("tagConfirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
