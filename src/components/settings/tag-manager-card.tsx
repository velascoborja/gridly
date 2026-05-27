"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Save, Tag as TagIcon, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TAG_COLORS, TAG_COLOR_KEYS } from "@/lib/tags";
import type { Tag } from "@/lib/types";

interface TagDraft {
  name: string;
  color: string;
}

function createDrafts(tags: Tag[]): Record<number, TagDraft> {
  return tags.reduce<Record<number, TagDraft>>((drafts, tag) => {
    drafts[tag.id] = { name: tag.name, color: tag.color };
    return drafts;
  }, {});
}

function hasTagChanged(tag: Tag, draft: TagDraft | undefined) {
  if (!draft) return false;
  return tag.name !== draft.name.trim() || tag.color !== draft.color;
}

export function TagManagerCard() {
  const t = useTranslations("Settings.tags");
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [drafts, setDrafts] = useState<Record<number, TagDraft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [savingTagId, setSavingTagId] = useState<number | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Tag | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTags() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/tags");
        if (!response.ok) {
          throw new Error(`Failed to fetch tags: ${response.status}`);
        }
        const payload = (await response.json()) as Tag[];
        if (!isMounted) return;
        setTags(payload);
        setDrafts(createDrafts(payload));
      } catch (error) {
        console.error("Failed to load tags:", error);
        if (isMounted) {
          setLoadError(t("loadError"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadTags();

    return () => {
      isMounted = false;
    };
  }, [t]);

  function updateDraft(tagId: number, patch: Partial<TagDraft>) {
    setDrafts((current) => ({
      ...current,
      [tagId]: {
        ...current[tagId],
        ...patch,
      },
    }));
  }

  async function handleSave(tag: Tag) {
    const draft = drafts[tag.id];
    if (!draft || !hasTagChanged(tag, draft) || !(draft.name.trim().length > 0)) {
      return;
    }

    setActionError("");
    setSavingTagId(tag.id);
    try {
      const response = await fetch(`/api/tags/${tag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name.trim(), color: draft.color }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update tag: ${response.status}`);
      }

      const updated = (await response.json()) as Tag;
      setTags((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setDrafts((current) => ({
        ...current,
        [updated.id]: { name: updated.name, color: updated.color },
      }));
      router.refresh();
    } catch (error) {
      console.error("Failed to save tag:", error);
      setActionError(t("saveError"));
    } finally {
      setSavingTagId(null);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteCandidate) return;

    setActionError("");
    setDeletingTagId(deleteCandidate.id);
    try {
      const response = await fetch(`/api/tags/${deleteCandidate.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete tag: ${response.status}`);
      }

      setTags((current) => current.filter((tag) => tag.id !== deleteCandidate.id));
      setDrafts((current) => {
        const next = { ...current };
        delete next[deleteCandidate.id];
        return next;
      });
      setDeleteCandidate(null);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete tag:", error);
      setActionError(t("deleteError"));
    } finally {
      setDeletingTagId(null);
    }
  }

  return (
    <Card className="border-primary/20 bg-background/95 shadow-sm shadow-primary/5">
      <CardHeader className="gap-3 border-b border-border/60 bg-primary/[0.03]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
                <TagIcon className="size-4" />
              </span>
              <CardTitle>{t("title")}</CardTitle>
            </div>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <div className="inline-flex w-fit items-center gap-1.5 rounded-md border border-primary/15 bg-background px-2 py-1 text-xs font-medium text-primary shadow-sm">
            <TagIcon className="size-3" />
            <span>{t("count", { count: tags.length })}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        {loadError ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/[0.04] p-3 text-sm text-destructive" role="alert">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{loadError}</span>
          </div>
        ) : null}

        {actionError ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/[0.04] p-3 text-sm text-destructive" role="alert">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>{t("loading")}</span>
          </div>
        ) : tags.length === 0 && !loadError ? (
          <div className="rounded-lg border border-dashed border-primary/20 bg-primary/[0.03] p-5 text-sm text-muted-foreground">
            <p>{t("empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tags.map((tag) => {
              const draft = drafts[tag.id];
              const isSaving = savingTagId === tag.id;
              const isDeleting = deletingTagId === tag.id;
              const isRowPending = isSaving || isDeleting;
              const canSave = Boolean(
                draft && hasTagChanged(tag, draft) && draft.name.trim().length > 0 && !isRowPending
              );

              return (
                <div
                  key={tag.id}
                  className="grid gap-3 rounded-xl border border-border/70 bg-background p-3 shadow-sm transition-shadow hover:shadow-md sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0 space-y-3">
                    <label className="sr-only" htmlFor={`tag-name-${tag.id}`}>
                      {t("nameLabel")}
                    </label>
                    <Input
                      id={`tag-name-${tag.id}`}
                      value={draft?.name ?? tag.name}
                      onChange={(event) => updateDraft(tag.id, { name: event.target.value })}
                      disabled={isRowPending}
                      aria-invalid={draft ? draft.name.trim().length === 0 : false}
                      className="h-10 rounded-lg bg-background text-sm font-medium"
                    />
                    <div className="flex flex-wrap gap-2" aria-label={t("colorLabel")}>
                      {TAG_COLOR_KEYS.map((colorKey) => (
                        <button
                          key={colorKey}
                          type="button"
                          className={cn(
                            "size-6 rounded-full border-2 shadow-sm transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            draft?.color === colorKey ? "border-foreground" : "border-transparent"
                          )}
                          style={{ background: TAG_COLORS[colorKey].text }}
                          onClick={() => updateDraft(tag.id, { color: colorKey })}
                          disabled={isRowPending}
                          aria-label={t("selectColor", { color: colorKey })}
                          aria-pressed={draft?.color === colorKey}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void handleSave(tag)}
                      disabled={!canSave}
                      aria-busy={isSaving}
                      className="min-w-24 gap-2"
                    >
                      {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                      {isSaving ? t("saving") : t("save")}
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="destructive"
                      onClick={() => setDeleteCandidate(tag)}
                      disabled={isRowPending}
                      aria-label={t("deleteTag", { name: tag.name })}
                    >
                      {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteCandidate !== null} onOpenChange={(open) => !open && !deletingTagId && setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription", { name: deleteCandidate?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingTagId !== null}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleDeleteConfirmed()}
              disabled={deletingTagId !== null}
              aria-busy={deletingTagId !== null}
              className="gap-2"
            >
              {deletingTagId !== null ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              {deletingTagId !== null ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
