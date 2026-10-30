"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLinkStatus } from "next/link";
import { useTranslations } from "next-intl";
import { CalendarDays, LoaderCircle } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildSetupHref, buildYearMonthHref } from "@/lib/year-routes";

export interface YearRolloverContext {
  previousYear: number;
  currentYear: number;
  currentMonth: number;
}

function CreateLabel({ year }: { year: number }) {
  const { pending } = useLinkStatus();
  const t = useTranslations("YearRollover");
  return <span aria-live="polite" aria-busy={pending} className="inline-flex items-center gap-2">
    {pending && <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />}
    {pending ? t("opening") : t("create", { year })}
  </span>;
}

export function YearRolloverDialog({ context }: { context?: YearRolloverContext }) {
  const searchParams = useSearchParams();
  const marker = searchParams.get("yearEnded");
  const [entryMarker, setEntryMarker] = useState(marker);
  const [open, setOpen] = useState(Boolean(context) && marker === "1");
  if (marker !== entryMarker) {
    setEntryMarker(marker);
    if (marker === "1" && context) setOpen(true);
  }
  const t = useTranslations("YearRollover");

  useEffect(() => {
    if (marker !== "1") return;
    // Consume the entry marker without a navigation or data reload. Local state
    // keeps the dialog open; a fresh home entry can supply the marker again.
    const url = new URL(window.location.href);
    url.searchParams.delete("yearEnded");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [marker]);

  if (!context) return null;
  const { previousYear, currentYear, currentMonth } = context;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="rounded-lg border border-primary/20 p-6 shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px] sm:max-w-lg">
        <span className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary"><CalendarDays aria-hidden className="size-6" /></span>
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-tight">{t("title", { year: previousYear })}</DialogTitle>
          <DialogDescription className="leading-relaxed">{t("description", { previousYear, currentYear })}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="h-10 rounded-md" onClick={() => setOpen(false)}>{t("continue", { year: previousYear })}</Button>
          <Link className={buttonVariants({ className: "h-10 rounded-md" })} href={buildSetupHref(currentYear, buildYearMonthHref(undefined, currentYear, currentMonth))}>
            <CreateLabel year={currentYear} />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
