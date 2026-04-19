"use client";

import { useRouter, Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { getNextCreatableYear } from "@/lib/server/year-planning";
import { MONTH_NAMES } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  currentYear: number;
  currentMonth: number | null;
  view: "overview" | "summary" | "detail";
  years: number[];
}

export function NavSelectors({ currentYear, currentMonth, view, years }: Props) {
  const router = useRouter();
  const t = useTranslations("Nav");
  const detailMonth = currentMonth ?? new Date().getMonth() + 1;
  const nextCreatableYear = getNextCreatableYear(years, currentYear);
  const today = new Date();
  const calendarYear = today.getFullYear();
  const calendarMonth = today.getMonth() + 1;

  const handleYearChange = (val: string | null) => {
    if (!val) return;
    const y = parseInt(val, 10);
    if (view === "overview") router.push(`/${y}/overview`);
    else if (view === "summary") router.push(`/${y}/summary`);
    else router.push(`/${y}/${detailMonth}`);
  };

  const mainTabs = [
    { label: t("currentMonth"), key: "overview" as const, href: `/${currentYear}/overview` as const },
    { label: t("annualSummary"), key: "summary" as const, href: `/${currentYear}/summary` as const },
    { label: t("monthlyDetail"), key: "detail" as const, href: `/${currentYear}/${detailMonth}` as const },
  ];

  return (
    <div className="flex flex-col gap-3 xl:items-end">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="sr-only sm:not-sr-only">Año</span>
          <Select value={String(currentYear)} onValueChange={handleYearChange}>
            <SelectTrigger className="h-9 rounded-full border-border/70 bg-background/90 pl-4 pr-4 font-medium text-foreground shadow-sm focus:border-primary focus:ring-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Link
            href={`/setup/${nextCreatableYear}`}
            aria-label={t("createYear", { year: nextCreatableYear })}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon-sm" }),
              "size-9 rounded-full border-border/70 bg-background/90 text-primary shadow-sm hover:border-primary/40 hover:bg-primary/[0.06]"
            )}
          >
            <Plus className="size-4" />
          </Link>
        </div>

        <div className="rounded-[1.25rem] border border-border/70 bg-muted/40 p-1 shadow-sm">
          <div className="flex flex-wrap gap-1">
            {mainTabs.map((tab) => {
              const active = view === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {view === "detail" && (
        <div className="rounded-[1.15rem] border border-border/60 bg-background/80 p-1 shadow-sm">
          <div className="flex gap-1 overflow-x-auto">
            {MONTH_NAMES.map((name, i) => {
              const m = i + 1;
              const active = currentMonth === m;
              const isCurrentMonth = currentYear === calendarYear && m === calendarMonth;
              return (
                <Link
                  key={m}
                  href={`/${currentYear}/${m}`}
                  aria-current={active ? "page" : undefined}
                  aria-label={isCurrentMonth ? `${name}, mes actual` : name}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : isCurrentMonth
                        ? "border-primary/30 bg-primary/[0.08] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] hover:border-primary/45 hover:bg-primary/[0.12]"
                        : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {name.slice(0, 3)}
                  {isCurrentMonth && (
                    <span
                      aria-hidden="true"
                      className={`size-1.5 rounded-full ${
                        active ? "bg-primary-foreground/90" : "bg-primary"
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
