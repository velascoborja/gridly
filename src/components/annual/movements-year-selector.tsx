"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
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
    return <span role="status" className="flex min-h-9 items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />{t("loadingYears")}</span>;
  }
  if (state.status === "error") {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span role="alert" className="text-muted-foreground">{t("yearsError")}</span>
        <Button variant="outline" onClick={() => { setState({ status: "loading" }); setAttempt((value) => value + 1); }}>{t("retryYears")}</Button>
      </div>
    );
  }
  if (state.years.length < 2) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={pending}>
      <span id={labelId} className="text-sm text-muted-foreground">{t("yearLabel")}</span>
      <Select value={String(year)} disabled={pending} onValueChange={(value) => {
        if (!value || Number(value) === year || !state.years.includes(Number(value))) return;
        startTransition(() => router.push(buildYearMovementsHref(pathPrefix, Number(value))));
      }}>
        <SelectTrigger aria-labelledby={labelId} className="min-h-9 rounded-md bg-card"><SelectValue>{state.years.includes(year) ? year : t("yearWithoutMovements", { year })}</SelectValue></SelectTrigger>
        <SelectContent>
          {!state.years.includes(year) && <SelectItem value={String(year)} disabled>{t("yearWithoutMovements", { year })}</SelectItem>}
          {state.years.map((option) => <SelectItem key={option} value={String(option)}>{option}</SelectItem>)}
        </SelectContent>
      </Select>
      {pending && <span role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />{t("loadingYear")}</span>}
    </div>
  );
}
