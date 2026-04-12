import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MonthlyView } from "@/components/monthly/monthly-view";
import { MONTH_NAMES } from "@/lib/utils";
import type { YearData } from "@/lib/types";

async function getYearData(year: number): Promise<YearData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/years/${year}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function getYears(): Promise<number[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/years`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((y: { year: number }) => y.year);
}

export default async function MonthPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) notFound();

  const [yearData, years] = await Promise.all([getYearData(year), getYears()]);

  if (!yearData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Sin datos para {year}</h1>
          <p className="text-muted-foreground">Crea el año y configura las estimaciones para empezar.</p>
          <CreateYearForm year={year} month={month} />
        </div>
      </div>
    );
  }

  return (
    <AppShell currentYear={year} currentMonth={month} view="detail" years={years.length > 0 ? years : [year]}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">
          {MONTH_NAMES[month - 1]} {year}
        </h1>
      </div>
      <MonthlyView yearData={yearData} monthNumber={month} />
    </AppShell>
  );
}

function CreateYearForm({ year, month }: { year: number; month: number }) {
  return (
    <form action={`/api/years`} method="POST">
      <input type="hidden" name="year" value={year} />
      <a
        href={`/setup/${year}?redirect=/${year}/${month}`}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Crear {year}
      </a>
    </form>
  );
}
