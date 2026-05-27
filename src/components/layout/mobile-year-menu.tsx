"use client";

import { useRouter, usePathname } from "@/i18n/routing";
import { MoreVertical, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getGridlyYears, getNextCreatableYearFromOptions } from "@/lib/server/year-navigation";
import {
  buildYearMonthHref,
  buildYearSummaryHref,
  buildYearCategoriesHref,
  buildSetupHrefFromPathname,
  buildEvolutionHref,
} from "@/lib/year-routes";
import type { YearOption } from "@/lib/types";

interface Props {
  currentYear: number;
  currentMonth: number | null;
  view: "overview" | "summary" | "settings" | "evolution" | "categories";
  years: number[] | YearOption[];
}

export function MobileYearMenu({ currentYear, currentMonth, view, years }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const locale = useLocale();

  if (view === "evolution") return null;

  const selectedMonth = currentMonth ?? new Date().getMonth() + 1;
  const calendarYear = new Date().getFullYear();
  const yearOptions: YearOption[] = years.map((entry) =>
    typeof entry === "number" ? { year: entry, source: "gridly" } : entry
  );
  const gridlyYears = getGridlyYears(yearOptions);
  const showCurrentYearMarker = yearOptions.length > 1 && gridlyYears.length > 0;
  const nextCreatableYear = getNextCreatableYearFromOptions(yearOptions, currentYear);
  const createYearHref = buildSetupHrefFromPathname(nextCreatableYear, pathname, currentYear, selectedMonth, view);
  const evolutionHref = buildEvolutionHref(undefined);

  const handleYearChange = (year: number) => {
    const option = yearOptions.find((o) => o.year === year);
    if (option?.source === "historical") {
      router.push(evolutionHref);
      return;
    }
    if (view === "summary") router.push(buildYearSummaryHref(undefined, year));
    else if (view === "categories") router.push(buildYearCategoriesHref(undefined, year));
    else router.push(buildYearMonthHref(undefined, year, selectedMonth));
  };

  return (
    <div className="md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none">
          <MoreVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" sideOffset={6}>
          {yearOptions.map((option) => (
            <DropdownMenuItem
              key={`${option.source}-${option.year}`}
              onClick={() => handleYearChange(option.year)}
              className={option.year === currentYear ? "text-primary" : ""}
            >
              <span className="font-medium">{option.year}</span>
              {option.source === "historical" && (
                <span className="ml-1.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {t("historicalYear")}
                </span>
              )}
              {showCurrentYearMarker && option.year === calendarYear && (
                <span className="ml-1.5 rounded border border-primary/20 bg-primary/[0.08] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-primary">
                  {t("currentYear")}
                </span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.location.href = `/${locale}${createYearHref}`} className="rounded border border-primary/20 bg-primary/[0.06] font-medium focus:bg-primary/10">
            <Plus className="size-3.5 text-primary" />
            <span className="text-foreground">{nextCreatableYear}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
