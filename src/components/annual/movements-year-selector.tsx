"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildYearMovementsHref } from "@/lib/year-routes";

type YearsState = { status: "loading" } | { status: "error" } | { status: "ready"; years: number[] };

export function MovementsYearSelector({ year, pathPrefix }: { year: number; pathPrefix?: string }) {
  const t = useTranslations("Annual.movements");
  const router = useRouter();
  const labelId = useId();
  const [state, setState] = useState<YearsState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();
    async function loadYears() {
      try {
        const response = await fetch("/api/years?withMovements=true", { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Unable to load movement years");
        const rows: { year: number; id: number }[] = await response.json();
        if (!controller.signal.aborted) setState({ status: "ready", years: rows.map((row) => row.year).sort((a, b) => b - a) });
      } catch {
        if (!controller.signal.aborted) setState({ status: "error" });
      }
    }
    void loadYears();
    return () => controller.abort();
  }, [attempt]);

  if (state.status === "loading") {
    return <span role="status" className="flex h-11 w-[4.25rem] shrink-0 items-center justify-center gap-2 text-sm text-muted-foreground sm:h-auto sm:min-h-9 sm:w-auto"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /><span className="sr-only sm:not-sr-only">{t("loadingYears")}</span></span>;
  }
  if (state.status === "error") {
    return (
      <div className="flex shrink-0 items-center gap-2 text-sm sm:flex-wrap">
        <span id={labelId} role="alert" className="sr-only text-muted-foreground sm:not-sr-only">{t("yearsError")}</span>
        <Button variant="outline" aria-label={t("retryYears")} aria-describedby={labelId} title={t("yearsError")} className="size-11 rounded-md px-0 text-destructive sm:h-8 sm:w-auto sm:px-2.5 sm:text-foreground" onClick={() => { setState({ status: "loading" }); setAttempt((value) => value + 1); }}>
          <RefreshCw className="size-4 sm:hidden" aria-hidden="true" /><span className="hidden sm:inline">{t("retryYears")}</span>
        </Button>
      </div>
    );
  }
  if (state.years.length < 2) return null;

  return (
    <div className="relative flex shrink-0 items-center gap-2 sm:flex-wrap" aria-busy={pending}>
      <span id={labelId} className="sr-only text-sm text-muted-foreground sm:not-sr-only">{t("yearLabel")}</span>
      <Select value={String(year)} disabled={pending} onValueChange={(value) => {
        if (!value || Number(value) === year || !state.years.includes(Number(value))) return;
        startTransition(() => router.push(buildYearMovementsHref(pathPrefix, Number(value))));
      }}>
        <SelectTrigger aria-labelledby={labelId} title={state.years.includes(year) ? String(year) : t("yearWithoutMovements", { year })} className="min-h-11 w-[4.25rem] rounded-md bg-card px-2 sm:min-h-9 sm:w-fit sm:px-2.5">
          <SelectValue><span className="sm:hidden">{year}</span><span className="hidden sm:inline">{state.years.includes(year) ? year : t("yearWithoutMovements", { year })}</span></SelectValue>
        </SelectTrigger>
        <SelectContent>
          {!state.years.includes(year) && <SelectItem value={String(year)} disabled>{t("yearWithoutMovements", { year })}</SelectItem>}
          {state.years.map((option) => <SelectItem key={option} value={String(option)}>{option}</SelectItem>)}
        </SelectContent>
      </Select>
      {pending && <span role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-md bg-card text-sm text-muted-foreground sm:static sm:bg-transparent"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /><span className="sr-only sm:not-sr-only">{t("loadingYear")}</span></span>}
    </div>
  );
}
