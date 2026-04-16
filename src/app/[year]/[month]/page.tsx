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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_34%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,1))] px-4 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl items-center">
          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-background/85 p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.08),transparent_40%,rgba(16,185,129,0.08))]" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-center">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Año sin configuración
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Sin datos para {year}
                </h1>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Crea el año y configura las estimaciones para empezar a revisar ingresos, gastos y ahorro de este mes.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/60 bg-muted/30 p-6">
                <p className="text-sm font-medium text-foreground">Siguiente paso</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Inicializa {year} para abrir el detalle mensual y completar la planificación.
                </p>
                <div className="mt-6">
                  <CreateYearForm year={year} month={month} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell currentYear={year} currentMonth={month} view="detail" years={years.length > 0 ? years : [year]}>
      <div className="mb-8 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Detalle mensual
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
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
