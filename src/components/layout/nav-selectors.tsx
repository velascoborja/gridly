"use client";

import { useRouter, Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { getNextCreatableYear } from "@/lib/server/year-planning";
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
  view: "overview" | "summary" | "settings";
  years: number[];
}

export function NavSelectors({ currentYear, currentMonth, view, years }: Props) {
  const router = useRouter();
  const t = useTranslations("Nav");
  const selectedMonth = currentMonth ?? new Date().getMonth() + 1;
  const nextCreatableYear = getNextCreatableYear(years, currentYear);
  const activeMainView = view === "summary" ? "summary" : view === "settings" ? null : "overview";

  const handleYearChange = (val: string | null) => {
    if (!val) return;
    const y = parseInt(val, 10);
    if (view === "summary") router.push(`/${y}/summary`);
    else router.push(`/${y}/${selectedMonth}`);
  };

  const mainTabs = [
    { label: t("months"), key: "overview" as const, href: `/${currentYear}/${selectedMonth}` },
    { label: t("annualSummary"), key: "summary" as const, href: `/${currentYear}/summary` as const },
  ];

  return (
    <div className="flex flex-col items-center gap-3 md:items-end">
      <div className="flex flex-col items-center gap-3 md:flex-row">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="sr-only md:not-sr-only">{t("yearLabel")}</span>
          <Select value={String(currentYear)} onValueChange={handleYearChange}>
            <SelectTrigger className="h-9 rounded-md border-border/70 bg-background/90 pl-4 pr-4 font-medium text-foreground shadow-sm focus:border-primary focus:ring-primary/20">
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
              "size-9 rounded-md border-border/70 bg-background/90 text-primary shadow-sm hover:border-primary/40 hover:bg-primary/[0.06]"
            )}
          >
            <Plus className="size-4" />
          </Link>
        </div>

        <div className="rounded-lg border border-border/70 bg-muted/40 p-1 shadow-sm">
          <div className="flex flex-wrap justify-center gap-1">
            {mainTabs.map((tab) => {
              const active = activeMainView === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-all ${
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
    </div>
  );
}
