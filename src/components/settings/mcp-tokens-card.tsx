"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { AlertCircle, Check, Copy, KeyRound, Loader2, Plug, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import { MCP_TOKEN_NAME_MAX_LENGTH } from "@/lib/mcp-tokens";

interface McpToken {
  id: number;
  name: string;
  tokenPrefix: string;
  createdAt: string | null;
  lastUsedAt: string | null;
}

const MCP_ENDPOINT_PATH = "/api/mcp";

function subscribeToOrigin() {
  return () => {};
}

function CopyButton({ value, label, copiedLabel, onError }: {
  value: string;
  label: string;
  copiedLabel: string;
  onError: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      onError();
    }
  }

  return (
    <Button type="button" variant="outline" onClick={() => void handleCopy()} className="shrink-0 gap-1.5">
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? copiedLabel : label}
    </Button>
  );
}

export function McpTokensCard() {
  const t = useTranslations("Settings.mcp");
  const locale = useLocale();
  const origin = useSyncExternalStore(subscribeToOrigin, () => window.location.origin, () => "");
  const endpoint = `${origin}${MCP_ENDPOINT_PATH}`;
  const [tokens, setTokens] = useState<McpToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [revokeCandidate, setRevokeCandidate] = useState<McpToken | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const formatDate = (value: string | null) => (value ? dateFormatter.format(new Date(value)) : "");

  useEffect(() => {
    let isMounted = true;

    async function loadTokens() {
      try {
        const response = await fetch("/api/user/mcp-tokens");
        if (!response.ok) throw new Error(`Failed to fetch MCP tokens: ${response.status}`);
        const payload = (await response.json()) as McpToken[];
        if (isMounted) setTokens(payload);
      } catch (loadError) {
        console.error("Failed to load MCP tokens:", loadError);
        if (isMounted) setError(t("loadError"));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadTokens();
    return () => {
      isMounted = false;
    };
  }, [t]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || isCreating) return;

    setError("");
    setIsCreating(true);
    try {
      const response = await fetch("/api/user/mcp-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (response.status === 409) {
        setError(t("limitError"));
        return;
      }
      if (!response.ok) throw new Error(`Failed to create MCP token: ${response.status}`);

      const { token, ...summary } = (await response.json()) as McpToken & { token: string };
      setTokens((current) => [summary, ...current]);
      setNewToken(token);
      setName("");
    } catch (createError) {
      console.error("Failed to create MCP token:", createError);
      setError(t("createError"));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevokeConfirmed() {
    if (!revokeCandidate) return;

    setError("");
    setRevokingId(revokeCandidate.id);
    try {
      const response = await fetch(`/api/user/mcp-tokens/${revokeCandidate.id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to revoke MCP token: ${response.status}`);
      }
      setTokens((current) => current.filter((token) => token.id !== revokeCandidate.id));
      setRevokeCandidate(null);
    } catch (revokeError) {
      console.error("Failed to revoke MCP token:", revokeError);
      setError(t("revokeError"));
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <Card className="border-border/70 bg-background/85 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Plug className="size-5 text-primary" />
          <CardTitle>{t("title")}</CardTitle>
        </div>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="mcp-endpoint" className="text-sm font-medium text-foreground">
            {t("endpointLabel")}
          </label>
          <div className="flex gap-2">
            <Input id="mcp-endpoint" value={endpoint} readOnly className="font-mono text-xs" />
            <CopyButton
              value={endpoint}
              label={t("copy")}
              copiedLabel={t("copied")}
              onError={() => setError(t("copyError"))}
            />
          </div>
        </div>

        {error ? (
          <div
            className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/[0.04] p-3 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {newToken ? (
          <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/[0.03] p-4" role="status">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">{t("newTokenTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("newTokenDescription")}</p>
            </div>
            <div className="flex gap-2">
              <Input value={newToken} readOnly aria-label={t("newTokenTitle")} className="font-mono text-xs" />
              <CopyButton
                value={newToken}
                label={t("copy")}
                copiedLabel={t("copied")}
                onError={() => setError(t("copyError"))}
              />
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setNewToken(null)}>
              {t("done")}
            </Button>
          </div>
        ) : null}

        <form onSubmit={(event) => void handleCreate(event)} className="space-y-2">
          <label htmlFor="mcp-token-name" className="text-sm font-medium text-foreground">
            {t("nameLabel")}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="mcp-token-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={MCP_TOKEN_NAME_MAX_LENGTH}
              disabled={isCreating}
              autoComplete="off"
              className="sm:max-w-xs"
            />
            <Button type="submit" disabled={isCreating || name.trim().length === 0} aria-busy={isCreating} className="gap-1.5">
              {isCreating ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              {isCreating ? t("creating") : t("create")}
            </Button>
          </div>
        </form>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>{t("loading")}</span>
          </div>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="divide-y divide-border/60 border-t border-border/60">
            {tokens.map((token) => (
              <li key={token.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate text-sm font-medium text-foreground">{token.name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{token.tokenPrefix}…</p>
                  <p className="text-xs text-muted-foreground">
                    {t("createdOn", { date: formatDate(token.createdAt) })}
                    {" · "}
                    {token.lastUsedAt ? t("lastUsed", { date: formatDate(token.lastUsedAt) }) : t("neverUsed")}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="destructive"
                  onClick={() => setRevokeCandidate(token)}
                  disabled={revokingId !== null}
                  aria-label={t("revokeToken", { name: token.name })}
                >
                  {revokingId === token.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <AlertDialog
        open={revokeCandidate !== null}
        onOpenChange={(open) => !open && revokingId === null && setRevokeCandidate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("revokeConfirmTitle", { name: revokeCandidate?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("revokeConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokingId !== null}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleRevokeConfirmed()}
              disabled={revokingId !== null}
              aria-busy={revokingId !== null}
              className="gap-2"
            >
              {revokingId !== null ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              {revokingId !== null ? t("revoking") : t("revoke")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
