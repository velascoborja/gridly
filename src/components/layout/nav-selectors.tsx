"use client";

import { useRouter, usePathname, Link } from "@/i18n/routing";
import { buttonVariants } from "@/components/ui/button";
import { getNextCreatableYear } from "@/lib/server/year-navigation";
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
import {
  buildYearMonthHref,
  buildYearSummaryHref,
  buildSetupHrefFromPathname,
} from "@/lib/year-routes";

interface Props {
  currentYear: number;
  currentMonth: number | null;
  view: "overview" | "summary" | "settings";
  years: number[];
  monthPathPrefix?: string;
  summaryPathPrefix?: string;
  hideCreateYear?: boolean;
  hideYearSelector?: boolean;
  onMonthViewSelect?: () => void;
  onSummaryViewSelect?: () => void;
}

export function NavSelectors({
  currentYear,
  currentMonth,
  view,
  years,
  monthPathPrefix,
  summaryPathPrefix,
  hideCreateYear = false,
  hideYearSelector = false,
  onMonthViewSelect,
  onSummaryViewSelect,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const selectedMonth = currentMonth ?? new Date().getMonth() + 1;
  const nextCreatableYear = getNextCreatableYear(years, currentYear);
  const activeMainView = view === "summary" ? "summary" : view === "settings" ? null : "overview";

  const handleYearChange = (val: string | null) => {
    if (!val) return;
    const y = parseInt(val, 10);
    if (view === "summary") router.push(buildYearSummaryHref(summaryPathPrefix, y));
    else router.push(buildYearMonthHref(monthPathPrefix, y, selectedMonth));
  };

  const monthHref = buildYearMonthHref(monthPathPrefix, currentYear, selectedMonth);
  const summaryHref = buildYearSummaryHref(summaryPathPrefix, currentYear);
  const createYearHref = buildSetupHrefFromPathname(nextCreatableYear, pathname, currentYear, selectedMonth, view);

  const mainTabs = [
    { label: t("months"), key: "overview" as const, href: monthHref },
    { label: t("annualSummary"), key: "summary" as const, href: summaryHref },
  ];

  return (
    <div className="flex w-full min-w-0 justify-center md:justify-end">
      <div className="flex max-w-full flex-wrap items-center justify-center gap-2 md:justify-end md:gap-3">
        {!hideYearSelector && (
          <div className="flex shrink-0 items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="sr-only md:not-sr-only">{t("yearLabel")}</span>
            <Select value={String(currentYear)} onValueChange={handleYearChange}>
              <SelectTrigger className="h-8 rounded-md border-border/70 bg-background/90 pl-3 pr-3 font-medium text-foreground shadow-sm focus:border-primary focus:ring-primary/20 sm:h-9 sm:pl-4 sm:pr-4">
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

            {!hideCreateYear && (
              <Link
                href={createYearHref}
                onNavigate={(event) => {
                  event.preventDefault();
                  router.push(
                    buildSetupHrefFromPathname(
                      nextCreatableYear,
                      window.location.pathname,
                      currentYear,
                      selectedMonth,
                      view
                    )
                  );
                }}
                aria-label={t("createYear", { year: nextCreatableYear })}
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                  "size-8 rounded-md border-border/70 bg-background/90 text-primary shadow-sm hover:border-primary/40 hover:bg-primary/[0.06] sm:size-9"
                )}
              >
                <Plus className="size-4" />
              </Link>
            )}
          </div>
        )}

        <div className="min-w-0 rounded-lg border border-border/70 bg-muted/40 p-1 shadow-sm">
          <div className="flex flex-wrap justify-center gap-1">
            {mainTabs.map((tab) => {
              const active = activeMainView === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  onNavigate={(event) => {
                    const handler = tab.key === "overview" ? onMonthViewSelect : onSummaryViewSelect;
                    if (!handler) return;

                    event.preventDefault();
                    handler();
                  }}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:px-4 sm:py-2 ${
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
