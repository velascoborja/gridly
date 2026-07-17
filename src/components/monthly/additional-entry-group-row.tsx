"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarArrowUp, ChevronRight, FolderInput, Loader2, Plus, Tag as TagIcon, Trash2 } from "lucide-react";
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
import { EntryFormRow } from "./entry-form-row";
import { sortAdditionalEntriesDesc } from "@/lib/additional-entries";
import { parseMoneyExpression } from "@/lib/currency-input";
import { cn, formatCurrency, formatMonthName } from "@/lib/utils";
import type { AdditionalEntry, AdditionalEntryGroup, Tag } from "@/lib/types";
import { TagPicker } from "./tag-picker";
import { TAG_COLORS } from "@/lib/tags";
import { CompletionLockButton } from "./completion-lock-button";

type EntryEditFocusTarget = "label" | "amount";

interface Props {
  monthId: number;
  group: AdditionalEntryGroup;
  allGroups: AdditionalEntryGroup[];
  moveTargets?: { id: number; month: number }[];
  movingGroupId?: number | null;
  onGroupUpdate: (group: AdditionalEntryGroup) => void;
  onGroupDelete: (groupId: number) => void;
  onGroupMoveToMonth?: (group: AdditionalEntryGroup, targetMonthId: number) => void;
  onGroupDragStart?: (group: AdditionalEntryGroup) => void;
  onGroupDragEnd?: () => void;
  onEntryGroupChanged: (entry: AdditionalEntry, toGroupId: number | null) => void;
  readOnly?: boolean;
  highlightId?: string | null;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  tags: Tag[];
  onCreateTag: (name: string, color: string) => Promise<Tag>;
}

export function AdditionalEntryGroupRow({
  monthId,
  group,
  allGroups,
  moveTargets = [],
  movingGroupId = null,
  onGroupUpdate,
  onGroupDelete,
  onGroupMoveToMonth,
  onGroupDragStart,
  onGroupDragEnd,
  onEntryGroupChanged,
  readOnly = false,
  highlightId = null,
  collapsed,
  onCollapsedChange,
  tags,
  onCreateTag,
}: Props) {
  const t = useTranslations("Monthly.additionalEntries");
  const common = useTranslations("Common");
  const locale = useLocale();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(group.label);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);

  const [addingFormOpen, setAddingFormOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newAmountError, setNewAmountError] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFocusTarget, setEditFocusTarget] = useState<EntryEditFocusTarget>("label");
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editAmountError, setEditAmountError] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [movingToGroupId, setMovingToGroupId] = useState<number | null>(null);
  const [isSavingTag, setIsSavingTag] = useState(false);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);
  const [completionSavingId, setCompletionSavingId] = useState<number | null>(null);
  const [entryCompletionConfirmationId, setEntryCompletionConfirmationId] = useState<number | null>(null);
  const [isGroupCompletionConfirming, setIsGroupCompletionConfirming] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

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
  const groupTotal = group.entries.reduce((sum, e) => sum + e.amount, 0);
  const isMovingGroup = movingGroupId === group.id;
  const groupRef = useRef(group);
  groupRef.current = group;
  const groupLocked = readOnly || group.isCompleted;
  const groupMutationLocked = groupLocked || isSavingCompletion || isGroupCompletionConfirming;
  const hasConflictingMutation = isEditingName || isSavingName || isDeletingGroup
    || addingFormOpen || isAdding || savingId !== null
    || deletingId !== null || movingToGroupId !== null || isSavingTag || isMovingGroup
    || entryCompletionConfirmationId !== null;
  const canMoveGroup = !groupMutationLocked && !isEditingName && !isDeletingGroup && !isSavingName && !isSavingTag && !isMovingGroup;

  useEffect(() => {
    if (highlightId && group.entries.some((e) => `entry-${e.id}` === highlightId)) {
      onCollapsedChange(false);
    }
  }, [highlightId, group.entries, onCollapsedChange]);

  const handleToggle = () => {
    if (!isEditingName) onCollapsedChange(!collapsed);
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    if (!canMoveGroup) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `group-${group.id}`);
    onGroupDragStart?.(group);
  };

  const handleDragEnd = () => {
    onGroupDragEnd?.();
  };

  const handleRenameStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (groupMutationLocked) return;
    setNameValue(group.label);
    setIsEditingName(true);
  };

  const handleRenameSave = async () => {
    if (isSavingName) return;
    const label = nameValue.trim();
    if (!label || label === group.label) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      const res = await fetch(`/api/months/${monthId}/entry-groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) return;
      onGroupUpdate({ ...group, label });
    } finally {
      setIsSavingName(false);
      setIsEditingName(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (isDeletingGroup) return;
    setIsDeletingGroup(true);
    try {
      const res = await fetch(`/api/months/${monthId}/entry-groups/${group.id}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      onGroupDelete(group.id);
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const closeAddForm = () => {
    setAddingFormOpen(false);
    setNewLabel("");
    setNewAmount("");
    setNewAmountError(false);
  };

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
        body: JSON.stringify({ type: "expense", label: newLabel.trim(), amount, groupId: group.id }),
      });
      if (!res.ok) return;
      const entry = await res.json();
      const newEntry: AdditionalEntry = {
        ...entry,
        amount: parseFloat(entry.amount),
        isCompleted: entry.isCompleted ?? false,
        tagId: entry.tagId ?? null,
        tag: entry.tagId != null ? (tags.find((t) => t.id === entry.tagId) ?? null) : null,
      };
      onGroupUpdate({
        ...group,
        entries: sortAdditionalEntriesDesc([...group.entries, newEntry]),
      });
      closeAddForm();
    } finally {
      setIsAdding(false);
    }
  };

  const openEditForm = (entry: AdditionalEntry, focusTarget: EntryEditFocusTarget = "label") => {
    if (groupMutationLocked || completionSavingId === entry.id || entryCompletionConfirmationId !== null) return;
    setEditingId(entry.id);
    setEditFocusTarget(focusTarget);
    setEditLabel(entry.label);
    setEditAmount(String(entry.amount));
    setEditAmountError(false);
  };

  const handleEdit = async (entryId: number) => {
    if (savingId === entryId) return;
    const amount = parseEntryAmount(editAmount, () => setEditAmountError(true));
    if (!editLabel.trim() || amount === null) return;

    setEditAmountError(false);
    setSavingId(entryId);
    try {
      const body: Record<string, unknown> = { label: editLabel.trim(), amount };

      const res = await fetch(`/api/months/${monthId}/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      const updated = await res.json();
      const updatedEntry: AdditionalEntry = { ...updated, amount: parseFloat(updated.amount) };

      onGroupUpdate({
        ...group,
        entries: sortAdditionalEntriesDesc(
          group.entries.map((e) => (e.id === entryId ? updatedEntry : e))
        ),
      });
      setEditingId(null);
    } finally {
      setSavingId(null);
    }
  };

  const handleMoveToGroup = async (entry: AdditionalEntry, toGroupId: number | null) => {
    if (movingToGroupId === entry.id || toGroupId === group.id) return;

    setMovingToGroupId(entry.id);
    try {
      const res = await fetch(`/api/months/${monthId}/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: toGroupId }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      const updatedEntry: AdditionalEntry = { ...updated, amount: parseFloat(updated.amount) };
      onEntryGroupChanged(updatedEntry, toGroupId);
    } finally {
      setMovingToGroupId(null);
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (deletingId === entryId) return;
    setDeletingId(entryId);
    try {
      const res = await fetch(`/api/months/${monthId}/entries/${entryId}`, { method: "DELETE" });
      if (!res.ok) return;
      onGroupUpdate({
        ...group,
        entries: sortAdditionalEntriesDesc(group.entries.filter((e) => e.id !== entryId)),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEntryCompletionToggle = async (entry: AdditionalEntry) => {
    if (groupMutationLocked || completionSavingId !== null || entryCompletionConfirmationId !== null || hasConflictingMutation) return;

    const nextCompleted = !entry.isCompleted;
    setCompletionError(null);
    setCompletionSavingId(entry.id);
    if (nextCompleted) setEditingId(null);
    onGroupUpdate({
      ...groupRef.current,
      entries: groupRef.current.entries.map((item) =>
        item.id === entry.id ? { ...item, isCompleted: nextCompleted } : item
      ),
    });

    try {
      const res = await fetch(`/api/months/${monthId}/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: nextCompleted }),
      });
      if (!res.ok) throw new Error("completion update failed");

      const raw = await res.json();
      onGroupUpdate({
        ...groupRef.current,
        entries: groupRef.current.entries.map((item) => item.id === entry.id ? {
          ...item,
          ...raw,
          amount: parseFloat(raw.amount),
          isCompleted: raw.isCompleted,
          tagId: raw.tagId ?? null,
          tag: item.tag,
        } : item),
      });
      setEntryCompletionConfirmationId(entry.id);
    } catch {
      onGroupUpdate({
        ...groupRef.current,
        entries: groupRef.current.entries.map((item) =>
          item.id === entry.id ? { ...item, isCompleted: entry.isCompleted } : item
        ),
      });
      if (nextCompleted) setEditingId(entry.id);
      setCompletionError(t("completionError"));
    } finally {
      setCompletionSavingId(null);
    }
  };

  const handleGroupCompletionToggle = async () => {
    if (readOnly || isSavingCompletion || isGroupCompletionConfirming || completionSavingId !== null || editingId !== null || hasConflictingMutation) return;

    const nextCompleted = !group.isCompleted;
    setCompletionError(null);
    setIsSavingCompletion(true);
    if (nextCompleted) onCollapsedChange(true);
    onGroupUpdate({ ...groupRef.current, isCompleted: nextCompleted });

    try {
      const res = await fetch(`/api/months/${monthId}/entry-groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: nextCompleted }),
      });
      if (!res.ok) throw new Error("completion update failed");

      const raw = await res.json();
      onGroupUpdate({ ...groupRef.current, ...raw, isCompleted: raw.isCompleted });
      setIsGroupCompletionConfirming(true);
    } catch {
      onGroupUpdate({ ...groupRef.current, isCompleted: group.isCompleted });
      if (nextCompleted) onCollapsedChange(false);
      setCompletionError(t("completionError"));
    } finally {
      setIsSavingCompletion(false);
    }
  };

  const handleGroupTagChange = async (tagId: number | null, selectedTag?: Tag | null) => {
    if (isSavingTag) return;
    setIsSavingTag(true);
    try {
      const res = await fetch(`/api/months/${monthId}/entry-groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: group.label, tagId }),
      });
      if (!res.ok) return;
      const newTag = selectedTag !== undefined ? selectedTag : (tagId !== null ? (tags.find((t) => t.id === tagId) ?? null) : null);
      onGroupUpdate({
        ...group,
        tagId,
        tag: newTag,
        entries: group.entries.map((e) => ({ ...e, tagId, tag: newTag })),
      });
    } finally {
      setIsSavingTag(false);
    }
  };

  const displayGroupTag = tags.find((t) => t.id === group.tagId) ?? group.tag;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.03]",
        group.isCompleted && "border-emerald-500/15 bg-muted/40",
        canMoveGroup && "cursor-grab active:cursor-grabbing",
        isMovingGroup && "pointer-events-none opacity-60"
      )}
      draggable={canMoveGroup}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Group header */}
      <div
        className={cn(
          "flex min-h-12 cursor-pointer select-none items-center gap-1 px-2.5 py-1.5 sm:gap-2",
          !group.isCompleted && !readOnly && "hover:bg-primary/[0.05]"
        )}
        onClick={handleToggle}
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-150",
            !collapsed && "rotate-90"
          )}
        />

        {groupMutationLocked ? (
          <span
            className={cn(
              "flex-1 truncate text-left text-sm font-semibold text-foreground",
              group.isCompleted && "text-muted-foreground/65"
            )}
          >
            {group.label}
          </span>
        ) : isEditingName ? (
          <Input
            className="h-7 flex-1 text-sm font-semibold"
            value={nameValue}
            autoFocus
            onChange={(e) => setNameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSave();
              if (e.key === "Escape") setIsEditingName(false);
            }}
            onBlur={handleRenameSave}
            onClick={(e) => e.stopPropagation()}
            disabled={isSavingName}
          />
        ) : (
          <button
            className="flex-1 truncate text-left text-sm font-semibold text-foreground transition-colors hover:text-primary"
            onClick={handleRenameStart}
            type="button"
          >
            {group.label}
          </button>
        )}

        <span className="shrink-0 rounded-full bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {group.entries.length}
        </span>

        {!groupMutationLocked && (
          <div
            className="hidden h-9 shrink-0 items-center gap-1 sm:flex"
            onClick={(e) => e.stopPropagation()}
          >
            <TagPicker
              tags={tags}
              value={group.tagId}
              onChange={handleGroupTagChange}
              onCreateTag={onCreateTag}
              disabled={isSavingTag}
              isLoading={isSavingTag}
              customTrigger={
                displayGroupTag && TAG_COLORS[displayGroupTag.color] ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none transition-colors hover:opacity-80 disabled:opacity-50"
                    style={{
                      background: TAG_COLORS[displayGroupTag.color].bg,
                      borderColor: TAG_COLORS[displayGroupTag.color].border,
                      color: TAG_COLORS[displayGroupTag.color].text,
                    }}
                    disabled={isSavingTag}
                  >
                    {isSavingTag ? (
                      <Loader2 className="h-1.5 w-1.5 animate-spin" />
                    ) : (
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: TAG_COLORS[displayGroupTag.color].text }}
                      />
                    )}
                    <span className="hidden sm:inline">{displayGroupTag.name}</span>
                  </button>
                ) : undefined
              }
            />
            {onGroupMoveToMonth && moveTargets.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      type="button"
                      className="h-9 w-9 text-muted-foreground hover:text-primary"
                      aria-label={`${t("moveGroupToMonth")} ${group.label}`}
                      title={t("moveGroupToMonth")}
                      disabled={!canMoveGroup}
                    >
                      {isMovingGroup ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CalendarArrowUp className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-52 max-w-[calc(100vw-2rem)]">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{t("moveGroupToMonth")}</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={String(monthId)}
                      onValueChange={(value) => {
                        const targetMonthId = parseInt(value, 10);
                        if (targetMonthId === monthId || Number.isNaN(targetMonthId)) return;
                        onGroupMoveToMonth(group, targetMonthId);
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
            ) : null}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1 ml-1.5 sm:ml-0">
          <span className={cn(
            "text-sm font-semibold tabular-nums text-violet-600 dark:text-violet-400",
            group.isCompleted && "text-muted-foreground/65 dark:text-muted-foreground/65"
          )}>
            {formatCurrency(groupTotal, locale)}
          </span>

          {!readOnly && (
            <>
            {!group.isCompleted && !isSavingCompletion && !isGroupCompletionConfirming ? (
            <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`${t("delete")} ${group.label}`}
                  disabled={isDeletingGroup}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isDeletingGroup ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </Button>
              }
            />
            <AlertDialogContent size="sm">
              <AlertDialogHeader>
                <AlertDialogTitle>{t("confirmDeleteGroupTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("confirmDeleteGroupDescription", {
                    label: group.label,
                    count: group.entries.length,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="group-data-[size=sm]/alert-dialog-content:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <AlertDialogCancel variant="ghost" disabled={isDeletingGroup}>
                  {t("cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  className="min-w-0 px-2 text-xs sm:text-sm"
                  onClick={handleDeleteGroup}
                  disabled={isDeletingGroup}
                >
                  {isDeletingGroup ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  {isDeletingGroup ? t("deletingGroup") : t("confirmDeleteGroupAction")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
            ) : (
              <CompletionLockButton
                completed={group.isCompleted || isSavingCompletion}
                pending={isSavingCompletion}
                animateConfirmation={isGroupCompletionConfirming}
                onConfirmationAnimationEnd={() => setIsGroupCompletionConfirming(false)}
                disabled={completionSavingId !== null || editingId !== null || hasConflictingMutation}
                onToggle={() => void handleGroupCompletionToggle()}
                completeLabel={t("markCompleted")}
                reopenLabel={t("reopen")}
                className="h-6 w-6"
              />
            )}
          </>
          )}
        </div>
      </div>

      {/* Expanded body */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-in-out",
          collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
        )}
      >
        <div className={cn("overflow-hidden transition-opacity duration-200", collapsed ? "opacity-0" : "opacity-100")}>
        <div className="border-t border-primary/10 bg-background/60 px-2 py-1.5 flex flex-col gap-1.5">
          {/* Mobile group actions */}
          {!readOnly && !group.isCompleted && !isSavingCompletion && !isGroupCompletionConfirming ? (
            <div
              className="flex w-full flex-nowrap items-center justify-start gap-1 rounded-lg border border-primary/10 bg-primary/[0.035] px-2 py-1.5 sm:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {!group.isCompleted && !isSavingCompletion && !isGroupCompletionConfirming ? (
                <>
              <TagPicker
                tags={tags}
                value={group.tagId}
                onChange={handleGroupTagChange}
                onCreateTag={onCreateTag}
                disabled={isSavingTag}
                isLoading={isSavingTag}
                customTrigger={
                  displayGroupTag && TAG_COLORS[displayGroupTag.color] ? (
                    <button
                      type="button"
                      className="inline-flex h-7 max-w-32 shrink-0 items-center justify-start gap-1.5 rounded border px-2 text-[11px] font-medium transition-colors hover:opacity-80 disabled:opacity-50"
                      style={{
                        background: TAG_COLORS[displayGroupTag.color].bg,
                        borderColor: TAG_COLORS[displayGroupTag.color].border,
                        color: TAG_COLORS[displayGroupTag.color].text,
                      }}
                      disabled={isSavingTag}
                      aria-label={`${t("tagButton")}: ${displayGroupTag.name}`}
                      title={displayGroupTag.name}
                    >
                      {isSavingTag ? (
                        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                      ) : (
                        <>
                          <TagIcon className="h-3 w-3 min-[480px]:hidden" />
                          <span
                            className="hidden h-2 w-2 shrink-0 rounded-full min-[480px]:inline-block"
                            style={{ background: TAG_COLORS[displayGroupTag.color].text }}
                          />
                        </>
                      )}
                      <span className="truncate">{displayGroupTag.name}</span>
                    </button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      className="h-7 max-w-32 shrink-0 gap-1.5 whitespace-nowrap px-2 text-[11px] text-muted-foreground hover:text-primary"
                      disabled={isSavingTag}
                      aria-label={t("tagButton")}
                      title={t("tagButton")}
                    >
                      {isSavingTag ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <TagIcon className="h-3 w-3" />
                      )}
                      <span className="truncate">{t("tagButton")}</span>
                    </Button>
                  )
                }
              />

              {onGroupMoveToMonth && moveTargets.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        className="h-7 w-7 shrink-0 gap-1.5 whitespace-nowrap px-0 text-[11px] text-muted-foreground hover:text-primary min-[480px]:w-auto min-[480px]:px-2"
                        aria-label={`${t("moveGroupToMonth")} ${group.label}`}
                        title={t("moveGroupToMonth")}
                        disabled={!canMoveGroup}
                      >
                        {isMovingGroup ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CalendarArrowUp className="h-3 w-3" />
                        )}
                        <span className="hidden min-[480px]:inline">{t("moveToMonth")}</span>
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-52 max-w-[calc(100vw-2rem)]">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>{t("moveGroupToMonth")}</DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={String(monthId)}
                        onValueChange={(value) => {
                          const targetMonthId = parseInt(value, 10);
                          if (targetMonthId === monthId || Number.isNaN(targetMonthId)) return;
                          onGroupMoveToMonth(group, targetMonthId);
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
              ) : null}

              <Button
                size="sm"
                variant="ghost"
                type="button"
                className="h-7 w-7 shrink-0 gap-1.5 whitespace-nowrap px-0 text-[11px] text-muted-foreground hover:text-primary min-[480px]:w-auto min-[480px]:px-2"
                onClick={() => setAddingFormOpen(true)}
                disabled={addingFormOpen}
                aria-label={t("addToGroup")}
                title={t("addToGroup")}
              >
                <Plus className="h-3 w-3" />
                <span className="hidden min-[480px]:inline">{t("addToGroup")}</span>
              </Button>
                </>
              ) : null}

              <CompletionLockButton
                completed={group.isCompleted}
                pending={isSavingCompletion}
                disabled={completionSavingId !== null || editingId !== null || hasConflictingMutation}
                onToggle={() => void handleGroupCompletionToggle()}
                completeLabel={t("markCompleted")}
                reopenLabel={t("reopen")}
              />

            </div>
          ) : null}

          {group.entries.map((entry) =>
            !groupMutationLocked && editingId === entry.id ? (
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
                  disabled={savingId === entry.id || movingToGroupId === entry.id || completionSavingId === entry.id}
                  fieldsDisabled={entry.isCompleted || completionSavingId === entry.id}
                  saveDisabled={entry.isCompleted || completionSavingId === entry.id || savingId === entry.id || movingToGroupId === entry.id}
                  showSaveAction={!entry.isCompleted && completionSavingId !== entry.id}
                  isSaving={savingId === entry.id}
                  saveLabel={common("save")}
                  savingLabel={t("saving")}
                  cancelLabel={entry.isCompleted ? t("exit") : t("cancel")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEdit(entry.id);
                    if (e.key === "Escape" && savingId !== entry.id) {
                      setEditingId(null);
                      setEditAmountError(false);
                    }
                  }}
                  autoFocus={entry.isCompleted ? false : editFocusTarget}
                  completionAction={
                    <CompletionLockButton
                      completed={entry.isCompleted}
                      pending={completionSavingId === entry.id}
                      disabled={
                        isSavingCompletion
                        || savingId === entry.id
                        || movingToGroupId === entry.id
                        || (completionSavingId !== null && completionSavingId !== entry.id)
                        || hasConflictingMutation
                      }
                      onToggle={() => void handleEntryCompletionToggle(entry)}
                      completeLabel={t("markCompleted")}
                      reopenLabel={t("reopen")}
                      actionSize
                    />
                  }
                  folderAction={!entry.isCompleted && completionSavingId !== entry.id ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="h-9 w-9 text-muted-foreground hover:text-primary"
                            aria-label={`${t("moveToGroup")} ${entry.label}`}
                            disabled={savingId === entry.id || movingToGroupId === entry.id}
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
                            value={String(group.id)}
                            onValueChange={(value) => {
                              void handleMoveToGroup(
                                entry,
                                value === "none" ? null : parseInt(value, 10)
                              );
                            }}
                          >
                            <DropdownMenuRadioItem value="none">
                              {t("noGroup")}
                            </DropdownMenuRadioItem>
                            {allGroups.map((g) => (
                              <DropdownMenuRadioItem
                                key={g.id}
                                value={String(g.id)}
                                disabled={g.id === group.id}
                              >
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
                className={cn(
                  "rounded-lg border border-transparent px-2 py-1.5 transition-all hover:border-border/70 hover:bg-muted/40",
                  (group.isCompleted || entry.isCompleted) && "border-emerald-500/10 bg-muted/45 hover:border-emerald-500/15 hover:bg-muted/55",
                  deletingId === entry.id && "pointer-events-none opacity-60",
                  highlightId === `entry-${entry.id}` && "animate-entry-highlight"
                )}
              >
                <div className="flex min-w-0 items-center justify-between gap-2">
                  {groupMutationLocked || completionSavingId === entry.id || entryCompletionConfirmationId === entry.id ? (
                    <span className={cn(
                      "min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground",
                      (group.isCompleted || entry.isCompleted) && "text-muted-foreground/65"
                    )}>
                      {entry.label}
                    </span>
                  ) : (
                    <button
                      className={cn(
                        "min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:text-primary",
                        entry.isCompleted && "text-muted-foreground/65"
                      )}
                      onClick={() => openEditForm(entry, "label")}
                      type="button"
                      aria-label={`${t("edit")} ${entry.label}`}
                      disabled={deletingId === entry.id}
                    >
                      {entry.label}
                    </button>
                  )}
                  <div className="flex shrink-0 items-center gap-1.5">
                    {groupMutationLocked || completionSavingId === entry.id || entryCompletionConfirmationId === entry.id ? (
                      <span className={cn(
                        "whitespace-nowrap text-sm font-semibold tabular-nums",
                        (group.isCompleted || entry.isCompleted) && "text-muted-foreground/65"
                      )}>
                        {formatCurrency(entry.amount, locale)}
                      </span>
                    ) : (
                      <button
                        className={cn(
                          "whitespace-nowrap rounded-md px-2 py-1 text-sm font-semibold tabular-nums text-foreground transition-colors hover:bg-background hover:text-primary",
                          entry.isCompleted && "text-muted-foreground/65"
                        )}
                        onClick={() => openEditForm(entry, "amount")}
                        type="button"
                        aria-label={`${t("edit")} ${entry.label}`}
                        disabled={deletingId === entry.id}
                      >
                        {formatCurrency(entry.amount, locale)}
                      </button>
                    )}
                    {!groupMutationLocked && !entry.isCompleted && completionSavingId !== entry.id && entryCompletionConfirmationId !== entry.id ? (
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
                              {deletingId === entry.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
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
                              {t("cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => handleDeleteEntry(entry.id)}
                              disabled={deletingId === entry.id}
                            >
                              {deletingId === entry.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : null}
                              {deletingId === entry.id ? t("deleting") : t("confirmDeleteAction")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : !groupMutationLocked && (entry.isCompleted || completionSavingId === entry.id || entryCompletionConfirmationId === entry.id) ? (
                      <CompletionLockButton
                        completed={entry.isCompleted || completionSavingId === entry.id}
                        pending={completionSavingId === entry.id}
                        animateConfirmation={entryCompletionConfirmationId === entry.id}
                        onConfirmationAnimationEnd={() => setEntryCompletionConfirmationId(null)}
                        disabled={
                          isSavingCompletion
                          || savingId === entry.id
                          || movingToGroupId === entry.id
                          || (completionSavingId !== null && completionSavingId !== entry.id)
                          || hasConflictingMutation
                        }
                        onToggle={() => void handleEntryCompletionToggle(entry)}
                        completeLabel={t("markCompleted")}
                        reopenLabel={t("reopen")}
                        className="h-6 w-6"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            )
          )}

          {/* Add entry to group form */}
          {!groupMutationLocked && addingFormOpen ? (
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
              />
            </div>
          ) : null}

          {!readOnly && !group.isCompleted && !isSavingCompletion && !isGroupCompletionConfirming ? (
            <div className="hidden items-center justify-between gap-2 sm:flex">
              {!groupMutationLocked && !addingFormOpen ? (
                <button
                  className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                  onClick={() => setAddingFormOpen(true)}
                  type="button"
                >
                  <Plus className="h-3 w-3" /> {t("addToGroup")}
                </button>
              ) : null}
              <CompletionLockButton
                completed={group.isCompleted}
                pending={isSavingCompletion}
                disabled={completionSavingId !== null || editingId !== null || hasConflictingMutation}
                onToggle={() => void handleGroupCompletionToggle()}
                completeLabel={t("markCompleted")}
                reopenLabel={t("reopen")}
                className="ml-auto"
              />
            </div>
          ) : null}

        </div>
        </div>
      </div>

      {completionError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/20 bg-destructive/[0.06] px-2.5 py-2 text-xs text-destructive"
        >
          {completionError}
        </p>
      ) : null}
    </div>
  );
}
