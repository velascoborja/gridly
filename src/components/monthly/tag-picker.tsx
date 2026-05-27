"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Tag as TagIcon, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TAG_COLORS, TAG_COLOR_KEYS } from "@/lib/tags";
import type { Tag } from "@/lib/types";

interface TagPickerProps {
  tags: Tag[];
  value: number | null;
  onChange: (tagId: number | null) => void;
  onCreateTag: (name: string, color: string) => Promise<Tag>;
  disabled?: boolean;
}

export function TagPicker({ tags, value, onChange, onCreateTag, disabled }: TagPickerProps) {
  const t = useTranslations("Monthly.additionalEntries");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "create">("list");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLOR_KEYS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const selectedTag = tags.find((tag) => tag.id === value) ?? null;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setView("list");
      setNewName("");
      setNewColor(TAG_COLOR_KEYS[0]);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const created = await onCreateTag(newName.trim(), newColor);
      onChange(created.id);
      setOpen(false);
      setView("list");
      setNewName("");
      setNewColor(TAG_COLOR_KEYS[0]);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        render={
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
            disabled={disabled}
          >
            <TagIcon className="h-3.5 w-3.5" />
          </Button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={4} className="isolate z-50">
          <Popover.Popup className="w-52 rounded-xl border border-border bg-popover shadow-md outline-none">
            {view === "list" ? (
              <div className="p-1.5">
                {tags.length > 0 && (
                  <>
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("yourTags")}
                    </p>
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                          value === tag.id ? "text-primary" : "text-foreground"
                        )}
                        onClick={() => { onChange(tag.id); setOpen(false); }}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: TAG_COLORS[tag.color]?.text }}
                        />
                        <span className="flex-1 truncate text-left">{tag.name}</span>
                        {value === tag.id && <span className="text-xs leading-none">✓</span>}
                      </button>
                    ))}
                    <div className="my-1 h-px bg-border" />
                  </>
                )}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
                  onClick={() => { onChange(null); setOpen(false); }}
                >
                  {t("noTag")}
                </button>
                <div className="my-1 h-px bg-border" />
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-muted"
                  onClick={() => setView("create")}
                >
                  {t("newTag")}
                </button>
              </div>
            ) : (
              <div className="p-1.5">
                <div className="flex items-center gap-1 px-1 pb-2">
                  <button
                    type="button"
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                    onClick={() => { setView("list"); setNewName(""); setNewColor(TAG_COLOR_KEYS[0]); }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("newTag")}
                  </p>
                </div>
                <Input
                  className="mb-2 h-8 text-sm"
                  placeholder={t("tagName")}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
                  autoFocus
                  disabled={isCreating}
                />
                <div className="mb-2 grid grid-cols-9 gap-2 px-0.5">
                  {TAG_COLOR_KEYS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={cn(
                        "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                        newColor === key ? "border-foreground" : "border-transparent"
                      )}
                      style={{ background: TAG_COLORS[key].text }}
                      title={key}
                      onClick={() => setNewColor(key)}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  className="h-8 w-full text-xs"
                  onClick={() => void handleCreate()}
                  disabled={!newName.trim() || isCreating}
                >
                  {t("createAndAssign")}
                </Button>
              </div>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
