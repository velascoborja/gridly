"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, FolderInput, Loader2, Plus, Trash2 } from "lucide-react";
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
import { cn, formatCurrency } from "@/lib/utils";
import type { AdditionalEntry, AdditionalEntryGroup, Tag } from "@/lib/types";
import { TagPicker } from "./tag-picker";
import { TAG_COLORS } from "@/lib/tags";

interface Props {
  monthId: number;
  group: AdditionalEntryGroup;
  allGroups: AdditionalEntryGroup[];
  onGroupUpdate: (group: AdditionalEntryGroup) => void;
  onGroupDelete: (groupId: number) => void;
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
  onGroupUpdate,
  onGroupDelete,
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

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [movingToGroupId, setMovingToGroupId] = useState<number | null>(null);
  const [isSavingTag, setIsSavingTag] = useState(false);

  const parseAmount = (v: string) => parseFloat(v.replace(",", "."));
  const groupTotal = group.entries.reduce((sum, e) => sum + e.amount, 0);

  useEffect(() => {
    if (highlightId && group.entries.some((e) => `entry-${e.id}` === highlightId)) {
      onCollapsedChange(false);
    }
  }, [highlightId, group.entries, onCollapsedChange]);

  const handleToggle = () => {
    if (!isEditingName) onCollapsedChange(!collapsed);
  };

  const handleRenameStart = (e: React.MouseEvent) => {
    e.stopPropagation();
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
  };

  const handleAdd = async () => {
    if (isAdding) return;
    const amount = parseAmount(newAmount);
    if (!newLabel.trim() || isNaN(amount)) return;
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

  const openEditForm = (entry: AdditionalEntry) => {
    setEditingId(entry.id);
    setEditLabel(entry.label);
    setEditAmount(String(entry.amount));
  };

  const handleEdit = async (entryId: number) => {
    if (savingId === entryId) return;
    const amount = parseAmount(editAmount);
    if (!editLabel.trim() || isNaN(amount)) return;

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
    <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.03]">
      {/* Group header */}
      <div
        className={cn(
          "flex cursor-pointer select-none items-center gap-1 px-2.5 py-1.5 sm:gap-2",
          !readOnly && "hover:bg-primary/[0.05]"
        )}
        onClick={handleToggle}
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-150",
            !collapsed && "rotate-90"
          )}
        />

        {!readOnly && isEditingName ? (
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
            className={cn(
              "flex-1 truncate text-left text-sm font-semibold text-foreground",
              !readOnly && "transition-colors hover:text-primary"
            )}
            onClick={!readOnly ? handleRenameStart : undefined}
            type="button"
            disabled={readOnly}
          >
            {group.label}
          </button>
        )}

        <span className="shrink-0 rounded-full bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {group.entries.length}
        </span>

        {!readOnly && (
          <div
            className="flex shrink-0 items-center gap-1 h-9"
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
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1 ml-1.5 sm:ml-0">
          <span className="text-sm font-semibold tabular-nums text-violet-600 dark:text-violet-400">
            {formatCurrency(groupTotal, locale)}
          </span>

          {!readOnly && (
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
          {group.entries.map((entry) =>
            !readOnly && editingId === entry.id ? (
              <div key={entry.id} className="rounded-xl border border-border/70 bg-muted/20 p-1.5">
                <EntryFormRow
                  labelValue={editLabel}
                  onLabelChange={setEditLabel}
                  amountValue={editAmount}
                  onAmountChange={setEditAmount}
                  onSave={() => handleEdit(entry.id)}
                  onCancel={() => setEditingId(null)}
                  disabled={savingId === entry.id || movingToGroupId === entry.id}
                  isSaving={savingId === entry.id}
                  saveLabel={common("save")}
                  savingLabel={t("saving")}
                  cancelLabel={t("cancel")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEdit(entry.id);
                    if (e.key === "Escape" && savingId !== entry.id) setEditingId(null);
                  }}
                  autoFocus
                  folderAction={
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
                      <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
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
                  }
                />
              </div>
            ) : (
              <div
                key={entry.id}
                data-highlight-id={`entry-${entry.id}`}
                className={cn(
                  "rounded-lg border border-transparent px-2 py-1.5 transition-all hover:border-border/70 hover:bg-muted/40",
                  deletingId === entry.id && "pointer-events-none opacity-60",
                  highlightId === `entry-${entry.id}` && "animate-entry-highlight"
                )}
              >
                <div className="flex min-w-0 items-center justify-between gap-2">
                  {readOnly ? (
                    <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground">
                      {entry.label}
                    </span>
                  ) : (
                    <button
                      className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:text-primary"
                      onClick={() => openEditForm(entry)}
                      type="button"
                      aria-label={`${t("edit")} ${entry.label}`}
                      disabled={deletingId === entry.id}
                    >
                      {entry.label}
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
                        onClick={() => openEditForm(entry)}
                        type="button"
                        aria-label={`${t("edit")} ${entry.label}`}
                        disabled={deletingId === entry.id}
                      >
                        {formatCurrency(entry.amount, locale)}
                      </button>
                    )}
                    {!readOnly && (
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
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {/* Add entry to group form */}
          {!readOnly && addingFormOpen ? (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-1.5" aria-busy={isAdding}>
              <EntryFormRow
                labelValue={newLabel}
                onLabelChange={setNewLabel}
                labelPlaceholder={t("descriptionPlaceholder")}
                amountValue={newAmount}
                onAmountChange={setNewAmount}
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
          ) : !readOnly ? (
            <button
              className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              onClick={() => setAddingFormOpen(true)}
              type="button"
            >
              <Plus className="h-3 w-3" /> {t("addToGroup")}
            </button>
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );
}
