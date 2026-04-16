"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { MONTH_NAMES } from "@/lib/utils";

interface Props {
  currentYear: number;
  currentMonth: number | null;
  view: "overview" | "summary" | "detail";
  years: number[];
}

export function NavSelectors({ currentYear, currentMonth, view, years }: Props) {
  const router = useRouter();
  const detailMonth = currentMonth ?? new Date().getMonth() + 1;

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = parseInt(e.target.value, 10);
    if (view === "overview") router.push(`/${y}/overview`);
    else if (view === "summary") router.push(`/${y}/summary`);
    else router.push(`/${y}/${detailMonth}`);
  };

  const mainTabs = [
    { label: "Mes actual", key: "overview" as const, href: `/${currentYear}/overview` },
    { label: "Resumen anual", key: "summary" as const, href: `/${currentYear}/summary` },
    { label: "Detalle mensual", key: "detail" as const, href: `/${currentYear}/${detailMonth}` },
  ];

  return (
    <div className="flex flex-col gap-3 xl:items-end">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="sr-only sm:not-sr-only">Año</span>
          <select
            className="rounded-full border border-border/70 bg-background/90 px-4 py-2 text-sm font-medium text-foreground shadow-sm outline-none ring-0 transition focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
            value={currentYear}
            onChange={handleYearChange}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

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
              return (
                <Link
                  key={m}
                  href={`/${currentYear}/${m}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {name.slice(0, 3)}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
