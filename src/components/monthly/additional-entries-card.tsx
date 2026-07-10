"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { CalendarArrowUp, FolderInput, FolderPlus, Loader2, Plus, Repeat, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { AdditionalEntryGroupRow } from "./additional-entry-group-row";
import { EntryFormRow } from "./entry-form-row";
import { TagPicker } from "./tag-picker";
import { sortAdditionalEntriesDesc, sumAdditionalEntries } from "@/lib/additional-entries";
import { parseMoneyExpression } from "@/lib/currency-input";
import { TAG_COLORS } from "@/lib/tags";
import { cn, formatCurrency, formatMonthName } from "@/lib/utils";
import type { AdditionalEntry, AdditionalEntryGroup, Tag } from "@/lib/types";

const NO_GROUPS: AdditionalEntryGroup[] = [];
type EntryEditFocusTarget = "label" | "amount";

type MonthMoveTarget = {
  id: number;
  month: number;
};

interface Props {
  monthId: number;
  type: "income" | "expense";
  entries: AdditionalEntry[];
  onEntriesChange: (entries: AdditionalEntry[]) => void;
  groups?: AdditionalEntryGroup[];
  onGroupsChange?: (groups: AdditionalEntryGroup[]) => void;
  onEntryGroupChanged?: (entry: AdditionalEntry, toGroupId: number | null) => void;
  readOnly?: boolean;
  title: string;
  movingEntryId?: number | null;
  movingGroupId?: number | null;
  moveTargets?: MonthMoveTarget[];
  onEntryMoveToMonth?: (entry: AdditionalEntry, targetMonthId: number) => void;
  onGroupMoveToMonth?: (group: AdditionalEntryGroup, targetMonthId: number) => void;
  onEntryDragStart?: (entry: AdditionalEntry) => void;
  onGroupDragStart?: (group: AdditionalEntryGroup) => void;
  onEntryDragEnd?: () => void;
  onGroupDragEnd?: () => void;
  highlightId?: string | null;
  openAddFormRef?: { current: (() => void) | null };
  openAddGroupFormRef?: { current: (() => void) | null };
  toggleAllGroupsRef?: { current: (() => void) | null };
}

export function AdditionalEntriesCard({
  monthId,
  type,
  entries,
  onEntriesChange,
  groups = NO_GROUPS,
  onGroupsChange,
  onEntryGroupChanged,
  readOnly = false,
  title,
  movingEntryId = null,
  movingGroupId = null,
  moveTargets = [],
  onEntryMoveToMonth,
  onGroupMoveToMonth,
  onEntryDragStart,
  onGroupDragStart,
  onEntryDragEnd,
  onGroupDragEnd,
  highlightId = null,
  openAddFormRef,
  openAddGroupFormRef,
  toggleAllGroupsRef,
}: Props) {
  const t = useTranslations("Monthly.additionalEntries");
  const common = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [addingFormOpen, setAddingFormOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newAmountError, setNewAmountError] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFocusTarget, setEditFocusTarget] = useState<EntryEditFocusTarget>("label");
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editAmountError, setEditAmountError] = useState(false);
  const [addingGroupOpen, setAddingGroupOpen] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [movingToGroupId, setMovingToGroupId] = useState<number | null>(null);
  const [newRecurring, setNewRecurring] = useState(false);
  const [editRecurring, setEditRecurring] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagId, setNewTagId] = useState<number | null>(null);
  const [editTagId, setEditTagId] = useState<number | null>(null);
  const [groupCollapsedState, setGroupCollapsedState] = useState<Record<number, boolean>>(
    () => Object.fromEntries(groups.map(g => [g.id, true]))
  );
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const groupCollapsedStateRef = useRef(groupCollapsedState);
  groupCollapsedStateRef.current = groupCollapsedState;

  useEffect(() => {
    setGroupCollapsedState(prev =>
      Object.fromEntries(groups.map(g => [g.id, g.id in prev ? prev[g.id] : true]))
    );
  }, [groups]);

  useEffect(() => {
    if (!toggleAllGroupsRef) return;
    toggleAllGroupsRef.current = () => {
      const currentGroups = groupsRef.current;
      if (currentGroups.length === 0) return;
      const currentState = groupCollapsedStateRef.current;
      const allExpanded = currentGroups.every(g => currentState[g.id] === false);
      setGroupCollapsedState(Object.fromEntries(currentGroups.map(g => [g.id, allExpanded])));
    };
    return () => { toggleAllGroupsRef.current = null; };
  }, [toggleAllGroupsRef]);

  useEffect(() => {
    if (!openAddFormRef) return;
    openAddFormRef.current = readOnly ? null : () => setAddingFormOpen(true);
    return () => { openAddFormRef.current = null; };
  }, [openAddFormRef, readOnly]);

  useEffect(() => {
    if (!openAddGroupFormRef) return;
    openAddGroupFormRef.current = readOnly ? null : () => setAddingGroupOpen(true);
    return () => { openAddGroupFormRef.current = null; };
  }, [openAddGroupFormRef, readOnly]);

  useEffect(() => {
    if (readOnly || type !== "expense") return;
    fetch("/api/tags")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Tag[]) => setTags(data))
      .catch(() => {});
  }, [readOnly, type]);

  const sortedEntries = [
    ...sortAdditionalEntriesDesc(entries.filter((e) => e.isRecurring)),
    ...sortAdditionalEntriesDesc(entries.filter((e) => !e.isRecurring)),
  ];
  const sortedGroups = [...groups].sort(
    (a, b) => sumAdditionalEntries(b.entries) - sumAdditionalEntries(a.entries)
  );
  const groupedTotal = groups.reduce((sum, g) => sum + sumAdditionalEntries(g.entries), 0);
  const entriesTotal = sumAdditionalEntries(entries) + groupedTotal;

  const closeAddForm = () => {
    setAddingFormOpen(false);
    setNewLabel("");
    setNewAmount("");
    setNewAmountError(false);
    setNewRecurring(false);
    setNewTagId(null);
  };

  const openEditForm = (entry: AdditionalEntry, focusTarget: EntryEditFocusTarget = "label") => {
    setEditingId(entry.id);
    setEditFocusTarget(focusTarget);
    setEditLabel(entry.label);
    setEditAmount(String(entry.amount));
    setEditAmountError(false);
    setEditRecurring(entry.isRecurring);
    setEditTagId(entry.tagId);
  };

  const canMoveEntry = (entry: AdditionalEntry) =>
    !readOnly && editingId !== entry.id && deletingId !== entry.id && savingId !== entry.id && movingEntryId !== entry.id;

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, entry: AdditionalEntry) => {
    if (!canMoveEntry(entry)) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(entry.id));
    onEntryDragStart?.(entry);
  };

  const handleDragEnd = () => {
    onEntryDragEnd?.();
  };

  const getAmountPreview = (value: string) => {
    const parsed = parseMoneyExpression(value);
    return parsed.ok && parsed.isExpression ? `= ${formatCurrency(parsed.value, locale)}` : null;
  };

  const parseEntryAmount = (value: string, onInvalid: () => void): number | null => {
    const parsed = parseMoneyExpression(value);
    if (!parsed.ok) {
      onInvalid();
      return null;
    }

    return parsed.value;
  };

  const newAmountPreview = getAmountPreview(newAmount);
  const editAmountPreview = getAmountPreview(editAmount);

  const handleAdd = async () => {
    if (isAdding) return;
    const amount = parseEntryAmount(newAmount, () => setNewAmountError(true));
    if (!newLabel.trim() || amount === null) return;

    setNewAmountError(false);
    setIsAdding(true);
    try {
      const res = await fetch(`/api/months/${monthId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, label: newLabel.trim(), amount, isRecurring: newRecurring, tagId: newTagId }),
      });
      if (!res.ok) return;
      const raw = await res.json();
      const entry: AdditionalEntry = {
        ...raw,
        amount: parseFloat(raw.amount),
        tagId: raw.tagId ?? null,
        tag: resolveTag(raw.tagId ?? null),
      };
      onEntriesChange(sortAdditionalEntriesDesc([...entries, entry]));
      closeAddForm();
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (deletingId === id) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/months/${monthId}/entries/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      onEntriesChange(sortAdditionalEntriesDesc(entries.filter((e) => e.id !== id)));
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = async (id: number) => {
    if (savingId === id) return;
    const amount = parseEntryAmount(editAmount, () => setEditAmountError(true));
    if (!editLabel.trim() || amount === null) return;

    setEditAmountError(false);
    setSavingId(id);
    try {
      const body: Record<string, unknown> = { label: editLabel.trim(), amount, isRecurring: editRecurring, tagId: editTagId };

      const res = await fetch(`/api/months/${monthId}/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      const updated = await res.json();
      const updatedEntry: AdditionalEntry = {
        ...updated,
        amount: parseFloat(updated.amount),
        tagId: updated.tagId ?? null,
        tag: resolveTag(updated.tagId ?? null),
      };

      onEntriesChange(
        sortAdditionalEntriesDesc(
          entries.map((e) => e.id === id ? updatedEntry : e)
        )
      );
      setEditingId(null);
    } finally {
      setSavingId(null);
    }
  };

  const handleMoveToGroup = async (entry: AdditionalEntry, toGroupId: number | null) => {
    if (movingToGroupId === entry.id) return;

    setMovingToGroupId(entry.id);
    try {
      const res = await fetch(`/api/months/${monthId}/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: toGroupId }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      const updatedEntry: AdditionalEntry = {
        ...updated,
        amount: parseFloat(updated.amount),
        tagId: updated.tagId ?? null,
        tag: resolveTag(updated.tagId ?? null),
      };

      onEntriesChange(sortAdditionalEntriesDesc(entries.filter((e) => e.id !== entry.id)));
      onEntryGroupChanged?.(updatedEntry, toGroupId);
    } finally {
      setMovingToGroupId(null);
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

  const resolveTag = (tagId: number | null): Tag | null =>
    tagId != null ? (tags.find((t) => t.id === tagId) ?? null) : null;

  const handleAddGroup = async () => {
    if (isAddingGroup) return;
    const label = newGroupLabel.trim();
    if (!label) return;
    setIsAddingGroup(true);
    try {
      const res = await fetch(`/api/months/${monthId}/entry-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) return;
      const group = await res.json();
      const newGroup: AdditionalEntryGroup = { id: group.id, monthId: group.monthId, label: group.label, tagId: group.tagId ?? null, tag: group.tag ?? null, entries: [] };
      onGroupsChange?.([...groups, newGroup]);
      router.refresh();
      setAddingGroupOpen(false);
      setNewGroupLabel("");
    } finally {
      setIsAddingGroup(false);
    }
  };

  return (
    <Card size="sm" className="border-border/70 bg-card/95 shadow-sm shadow-black/5">
      <CardHeader className="pb-3">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <CardDescription>
              {t(type === "income" ? "descriptionIncome" : "descriptionExpense")}
            </CardDescription>
          </div>
          <div className="grid shrink-0 justify-items-center rounded-md border border-border/70 bg-background/80 px-2.5 py-1 text-center shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("total")}
            </p>
            <p className={`text-sm font-semibold tabular-nums ${type === "income" ? "text-emerald-600 dark:text-emerald-300" : "text-rose-600 dark:text-rose-300"}`}>
              {formatCurrency(entriesTotal, locale)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        <div>
          {!readOnly && !addingFormOpen && !addingGroupOpen ? (
            <div className="flex items-center gap-3 pb-1">
              <button
                className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setAddingFormOpen(true)}
                type="button"
              >
                <Plus className="h-3.5 w-3.5" /> {t("addEntry")}
              </button>
              {type === "expense" && (
                <>
                  <div className="h-3.5 w-px bg-border" />
                  <button
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:text-muted-foreground"
                    onClick={() => setAddingGroupOpen(true)}
                    type="button"
                  >
                    <FolderPlus className="h-3 w-3" /> {t("addGroup")}
                  </button>
                </>
              )}
            </div>
          ) : null}

          {!readOnly && addingFormOpen ? (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-1.5" aria-busy={isAdding}>
              <EntryFormRow
                labelValue={newLabel}
                onLabelChange={setNewLabel}
                labelPlaceholder={t("descriptionPlaceholder")}
                amountValue={newAmount}
                onAmountChange={(value) => {
                  setNewAmount(value);
                  setNewAmountError(false);
                }}
                amountMode="expression"
                amountPreview={newAmountPreview}
                amountError={newAmountError ? t("amountExpressionInvalid") : null}
                amountPlaceholder="0.00"
                onSave={handleAdd}
                onCancel={closeAddForm}
                disabled={isAdding}
                isSaving={isAdding}
                saveLabel={t("add")}
                savingLabel={t("adding")}
                cancelLabel={t("cancel")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape" && !isAdding) closeAddForm();
                }}
                autoFocus
                tagAction={
                  type === "expense" ? (
                    <TagPicker
                      tags={tags}
                      value={newTagId}
                      onChange={setNewTagId}
                      onCreateTag={handleCreateTag}
                      disabled={isAdding}
                    />
                  ) : undefined
                }
                recurringAction={
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    type="button"
                    className={cn(
                      "h-9 w-9",
                      newRecurring
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "text-muted-foreground hover:text-primary"
                    )}
                    aria-label={t(newRecurring ? "recurringActive" : "recurringToggle")}
                    title={t(newRecurring ? "recurringActive" : "recurringToggle")}
                    onClick={() => setNewRecurring((v) => !v)}
                    disabled={isAdding}
                  >
                    <Repeat className="h-3.5 w-3.5" />
                  </Button>
                }
              />
            </div>
          ) : null}

          {!readOnly && type === "expense" && addingGroupOpen ? (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-1.5" aria-busy={isAddingGroup}>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                <Input
                  className="h-9 min-w-0 text-sm"
                  placeholder={t("groupNamePlaceholder")}
                  value={newGroupLabel}
                  onChange={(e) => setNewGroupLabel(e.target.value)}
                  disabled={isAddingGroup}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddGroup();
                    if (e.key === "Escape" && !isAddingGroup) { setAddingGroupOpen(false); setNewGroupLabel(""); }
                  }}
                  autoFocus
                />
                <Button size="sm" className="h-9 w-full px-3 sm:w-auto" onClick={handleAddGroup} disabled={isAddingGroup}>
                  {isAddingGroup ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {isAddingGroup ? t("addingGroup") : t("add")}
                </Button>
                <Button size="sm" variant="ghost" className="h-9 w-full px-3 sm:w-auto" onClick={() => { setAddingGroupOpen(false); setNewGroupLabel(""); }} disabled={isAddingGroup}>
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {type === "expense" && groups.length > 0 && (
          <div className="flex flex-col gap-2">
            {sortedGroups.map((group) => (
              <AdditionalEntryGroupRow
                key={group.id}
                monthId={monthId}
                group={group}
                allGroups={groups}
                moveTargets={moveTargets}
                movingGroupId={movingGroupId}
                onGroupUpdate={(updated) =>
                  onGroupsChange?.(groups.map((g) => (g.id === updated.id ? updated : g)))
                }
                onGroupDelete={(groupId) =>
                  onGroupsChange?.(groups.filter((g) => g.id !== groupId))
                }
                onGroupMoveToMonth={onGroupMoveToMonth}
                onGroupDragStart={onGroupDragStart}
                onGroupDragEnd={onGroupDragEnd}
                onEntryGroupChanged={onEntryGroupChanged ?? (() => {})}
                readOnly={readOnly}
                highlightId={highlightId}
                collapsed={groupCollapsedState[group.id] ?? true}
                onCollapsedChange={(v) => setGroupCollapsedState(prev => ({ ...prev, [group.id]: v }))}
                tags={tags}
                onCreateTag={handleCreateTag}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {sortedEntries.length === 0 && groups.length === 0 && (readOnly || !addingFormOpen) && (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
              {t("noEntries")}
            </div>
          )}
          {sortedEntries.map((entry) => {
            const displayTag = resolveTag(entry.tagId) ?? entry.tag;
            return !readOnly && editingId === entry.id ? (
              <div key={entry.id} className="rounded-xl border border-border/70 bg-muted/20 p-1.5">
                <EntryFormRow
                  labelValue={editLabel}
                  onLabelChange={setEditLabel}
                  amountValue={editAmount}
                  onAmountChange={(value) => {
                    setEditAmount(value);
                    setEditAmountError(false);
                  }}
                  amountMode="expression"
                  amountPreview={editAmountPreview}
                  amountError={editAmountError ? t("amountExpressionInvalid") : null}
                  onSave={() => handleEdit(entry.id)}
                  onCancel={() => {
                    setEditingId(null);
                    setEditAmountError(false);
                  }}
                  disabled={savingId === entry.id || movingToGroupId === entry.id || movingEntryId === entry.id}
                  isSaving={savingId === entry.id}
                  saveLabel={common("save")}
                  savingLabel={t("saving")}
                  cancelLabel={t("cancel")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEdit(entry.id);
                    if (e.key === "Escape" && savingId !== entry.id) {
                      setEditingId(null);
                      setEditAmountError(false);
                    }
                  }}
                  autoFocus={editFocusTarget}
                  tagAction={
                    type === "expense" ? (
                      <TagPicker
                        tags={tags}
                        value={editTagId}
                        onChange={setEditTagId}
                        onCreateTag={handleCreateTag}
                        disabled={savingId === entry.id || movingToGroupId === entry.id || movingEntryId === entry.id}
                      />
                    ) : undefined
                  }
                  recurringAction={
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      type="button"
                      className={cn(
                        "h-9 w-9",
                        editRecurring
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "text-muted-foreground hover:text-primary"
                      )}
                      aria-label={t(editRecurring ? "recurringActive" : "recurringToggle")}
                      title={t(editRecurring ? "recurringActive" : "recurringToggle")}
                      onClick={() => setEditRecurring((v) => !v)}
                      disabled={savingId === entry.id || movingToGroupId === entry.id || movingEntryId === entry.id}
                    >
                      <Repeat className="h-3.5 w-3.5" />
                    </Button>
                  }
                  monthAction={onEntryMoveToMonth && moveTargets.length > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="h-9 w-9 text-muted-foreground hover:text-primary"
                            aria-label={`${t("moveToMonth")} ${entry.label}`}
                            disabled={savingId === entry.id || movingToGroupId === entry.id || movingEntryId === entry.id}
                          >
                            {movingEntryId === entry.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CalendarArrowUp className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-52 max-w-[calc(100vw-2rem)]">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>{t("moveToMonth")}</DropdownMenuLabel>
                          <DropdownMenuRadioGroup
                            value={String(monthId)}
                            onValueChange={(value) => {
                              const targetMonthId = parseInt(value, 10);
                              if (targetMonthId === monthId || Number.isNaN(targetMonthId)) return;
                              onEntryMoveToMonth(entry, targetMonthId);
                            }}
                          >
                            {moveTargets.map((target) => (
                              <DropdownMenuRadioItem key={target.id} value={String(target.id)}>
                                <span className="truncate capitalize">{formatMonthName(target.month, locale)}</span>
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : undefined}
                  folderAction={type === "expense" && groups.length > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="h-9 w-9 text-muted-foreground hover:text-primary"
                            aria-label={`${t("moveToGroup")} ${entry.label}`}
                            disabled={savingId === entry.id || movingToGroupId === entry.id || movingEntryId === entry.id}
                          >
                            {movingToGroupId === entry.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <FolderInput className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-52 max-w-[calc(100vw-2rem)]">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>{t("moveToGroup")}</DropdownMenuLabel>
                          <DropdownMenuRadioGroup
                            value="none"
                            onValueChange={(value) => {
                              if (value === "none") return;
                              void handleMoveToGroup(entry, parseInt(value, 10));
                            }}
                          >
                            <DropdownMenuRadioItem value="none" disabled>
                              {t("noGroup")}
                            </DropdownMenuRadioItem>
                            {groups.map((g) => (
                              <DropdownMenuRadioItem key={g.id} value={String(g.id)}>
                                <span className="truncate">{g.label}</span>
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : undefined}
                />
              </div>
            ) : (
              <div
                key={entry.id}
                data-highlight-id={`entry-${entry.id}`}
                draggable={canMoveEntry(entry)}
                onDragStart={(event) => handleDragStart(event, entry)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "rounded-xl border border-transparent px-2 py-1.5 transition-all hover:border-border/70 hover:bg-muted/40",
                  canMoveEntry(entry) && "cursor-grab active:cursor-grabbing",
                  (deletingId === entry.id || movingEntryId === entry.id) && "pointer-events-none opacity-60",
                  highlightId === `entry-${entry.id}` && "animate-entry-highlight"
                )}
              >
                <div className="flex min-w-0 items-center justify-between gap-2">
                  {readOnly ? (
                    <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground" title={entry.label}>
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate">{entry.label}</span>
                        {displayTag && TAG_COLORS[displayTag.color] && (
                          <span
                            className="shrink-0 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none"
                            style={{
                              background: TAG_COLORS[displayTag.color].bg,
                              borderColor: TAG_COLORS[displayTag.color].border,
                              color: TAG_COLORS[displayTag.color].text,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: TAG_COLORS[displayTag.color].text }}
                            />
                            <span className="hidden sm:inline">{displayTag.name}</span>
                          </span>
                        )}
                        {entry.isRecurring && (
                          <>
                            {displayTag && (
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary sm:hidden"
                                title={t("recurringBadge")}
                              />
                            )}
                            <span className={cn(
                              "shrink-0 rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary",
                              displayTag && "hidden sm:inline-block"
                            )}>
                              {t("recurringBadge")}
                            </span>
                          </>
                        )}
                      </span>
                    </span>
                  ) : (
                    <button
                      className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:text-primary"
                      onClick={() => openEditForm(entry, "label")}
                      type="button"
                      aria-label={`${t("edit")} ${entry.label}`}
                      title={entry.label}
                      disabled={deletingId === entry.id}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate">{entry.label}</span>
                        {displayTag && TAG_COLORS[displayTag.color] && (
                          <span
                            className="shrink-0 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none"
                            style={{
                              background: TAG_COLORS[displayTag.color].bg,
                              borderColor: TAG_COLORS[displayTag.color].border,
                              color: TAG_COLORS[displayTag.color].text,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: TAG_COLORS[displayTag.color].text }}
                            />
                            <span className="hidden sm:inline">{displayTag.name}</span>
                          </span>
                        )}
                        {entry.isRecurring && (
                          <>
                            {displayTag && (
                              <span
                                className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary sm:hidden"
                                title={t("recurringBadge")}
                              />
                            )}
                            <span className={cn(
                              "shrink-0 rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary",
                              displayTag && "hidden sm:inline-block"
                            )}>
                              {t("recurringBadge")}
                            </span>
                          </>
                        )}
                      </span>
                    </button>
                  )}
                  <div className="flex shrink-0 items-center gap-1.5">
                    {readOnly ? (
                      <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
                        {formatCurrency(entry.amount, locale)}
                      </span>
                    ) : (
                      <button
                        className="whitespace-nowrap rounded-md px-2 py-1 text-sm font-semibold tabular-nums text-foreground transition-colors hover:bg-background hover:text-primary"
                        onClick={() => openEditForm(entry, "amount")}
                        type="button"
                        aria-label={`${t("edit")} ${entry.label}`}
                        disabled={deletingId === entry.id}
                      >
                        {formatCurrency(entry.amount, locale)}
                      </button>
                    )}
                    {!readOnly ? (
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive"
                              aria-label={`${t("delete")} ${entry.label}`}
                              disabled={deletingId === entry.id}
                            >
                              {deletingId === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
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
                            <AlertDialogCancel variant="ghost" disabled={deletingId === entry.id}>{t("cancel")}</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={() => handleDelete(entry.id)} disabled={deletingId === entry.id}>
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
