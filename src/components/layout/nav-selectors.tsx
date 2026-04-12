"use client";

import { useRouter } from "next/navigation";
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
    { label: "Informe completo", key: "detail" as const, href: `/${currentYear}/${detailMonth}` },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Year selector */}
        <select
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          value={currentYear}
          onChange={handleYearChange}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Main tabs */}
        <div className="flex gap-1">
          {mainTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => router.push(tab.href)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                view === tab.key
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Month sub-tabs (only on detail view) */}
      {view === "detail" && (
        <div className="flex flex-wrap gap-1">
          {MONTH_NAMES.map((name, i) => {
            const m = i + 1;
            const active = currentMonth === m;
            return (
              <button
                key={m}
                onClick={() => router.push(`/${currentYear}/${m}`)}
                className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
