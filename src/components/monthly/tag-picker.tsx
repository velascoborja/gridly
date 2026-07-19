"use client";

import { useId, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Tag as TagIcon, ArrowLeft, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TAG_COLORS, TAG_COLOR_KEYS } from "@/lib/tags";
import type { Tag } from "@/lib/types";

interface TagPickerProps {
  tags: Tag[];
  value: number | null;
  onChange: (tagId: number | null, tag?: Tag | null) => void;
  onCreateTag: (name: string, color: string) => Promise<Tag>;
  disabled?: boolean;
  isLoading?: boolean;
  customTrigger?: React.ReactElement;
}

interface TagPickerContentProps extends Omit<TagPickerProps, "customTrigger" | "isLoading"> {
  onClose: () => void;
}

export function TagPickerContent({ tags, value, onChange, onCreateTag, disabled, onClose }: TagPickerContentProps) {
  const t = useTranslations("Monthly.additionalEntries");
  const [view, setView] = useState<"list" | "create">("list");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLOR_KEYS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(false);
  const createErrorId = useId();

  const resetCreate = () => {
    setView("list");
    setNewName("");
    setNewColor(TAG_COLOR_KEYS[0]);
    setCreateError(false);
  };

  const handleCreate = async () => {
    if (!newName.trim() || isCreating || disabled) return;
    setCreateError(false);
    setIsCreating(true);
    try {
      const created = await onCreateTag(newName.trim(), newColor);
      onChange(created.id, created);
      onClose();
      resetCreate();
    } catch {
      setCreateError(true);
    } finally {
      setIsCreating(false);
    }
  };

  if (view === "list") {
    return (
      <div className="p-0.5">
        {tags.length > 0 ? (
          <>
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("yourTags")}
            </p>
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={cn(
                  "flex min-h-9 w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50",
                  value === tag.id ? "text-primary" : "text-foreground"
                )}
                onClick={() => {
                  onChange(tag.id, tag);
                  onClose();
                }}
                disabled={disabled}
                aria-pressed={value === tag.id}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TAG_COLORS[tag.color]?.text }} />
                <span className="flex-1 truncate text-left">{tag.name}</span>
                {value === tag.id ? <span className="text-xs leading-none" aria-hidden="true">✓</span> : null}
              </button>
            ))}
            <div className="my-1 h-px bg-border" />
          </>
        ) : null}
        <button
          type="button"
          className="flex min-h-9 w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50"
          onClick={() => {
            onChange(null, null);
            onClose();
          }}
          disabled={disabled}
          aria-pressed={value === null}
        >
          <span className="flex-1 text-left">{t("noTag")}</span>
          {value === null ? <span className="text-xs leading-none" aria-hidden="true">✓</span> : null}
        </button>
        <div className="my-1 h-px bg-border" />
        <button
          type="button"
          className="flex min-h-9 w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50"
          onClick={() => setView("create")}
          disabled={disabled}
        >
          {t("newTag")}
        </button>
      </div>
    );
  }

  return (
    <div className="p-0.5" aria-busy={isCreating || undefined}>
      <div className="flex items-center gap-1 pb-2">
        <button
          type="button"
          className="flex min-h-8 items-center gap-1.5 rounded-md px-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          onClick={resetCreate}
          disabled={isCreating}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("back")}
        </button>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t("newTag")}</p>
      </div>
      <Input
        className="mb-2 h-8 text-sm"
        placeholder={t("tagName")}
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void handleCreate();
        }}
        autoFocus
        disabled={isCreating}
        aria-invalid={createError || undefined}
        aria-describedby={createError ? createErrorId : undefined}
      />
      <div className="mb-2 grid grid-cols-9 gap-2 px-0.5" aria-label={t("tagColor")} role="group">
        {TAG_COLOR_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={cn(
              "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none motion-reduce:hover:scale-100",
              newColor === key ? "border-foreground" : "border-transparent"
            )}
            style={{ background: TAG_COLORS[key].text }}
            title={key}
            aria-label={key}
            aria-pressed={newColor === key}
            onClick={() => setNewColor(key)}
            disabled={isCreating}
          />
        ))}
      </div>
      {createError ? (
        <p id={createErrorId} role="alert" className="mb-2 text-xs text-destructive">
          {t("tagCreateError")}
        </p>
      ) : null}
      <Button
        size="sm"
        className="h-8 w-full text-xs"
        onClick={() => void handleCreate()}
        disabled={!newName.trim() || isCreating}
        aria-busy={isCreating || undefined}
      >
        {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : null}
        {t(isCreating ? "creatingTag" : "createAndAssign")}
      </Button>
    </div>
  );
}

export function TagPicker({ tags, value, onChange, onCreateTag, disabled, isLoading, customTrigger }: TagPickerProps) {
  const t = useTranslations("Monthly.additionalEntries");
  const [open, setOpen] = useState(false);

  const selectedTag = tags.find((tag) => tag.id === value) ?? null;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        render={
          customTrigger || (
            <Button
              size="icon-sm"
              variant="ghost"
              type="button"
              className={cn(
                "h-9 w-9",
                value !== null
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "text-muted-foreground hover:text-primary"
              )}
              aria-label={selectedTag ? `${t("tagButton")}: ${selectedTag.name}` : t("tagButton")}
              title={selectedTag ? selectedTag.name : t("tagButton")}
              disabled={disabled || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <TagIcon className="h-3.5 w-3.5" />
              )}
            </Button>
          )
        }
      />
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={4} className="isolate z-50">
          <Popover.Popup className="w-56 max-w-[calc(100vw-1rem)] max-h-[min(var(--available-height),calc(100dvh-1rem))] overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover p-1.5 shadow-md outline-none motion-reduce:transition-none" finalFocus>
            <TagPickerContent
              key={open ? "open" : "closed"}
              tags={tags}
              value={value}
              onChange={onChange}
              onCreateTag={onCreateTag}
              disabled={disabled || isLoading}
              onClose={() => setOpen(false)}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
