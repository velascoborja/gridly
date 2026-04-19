import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MonthlyView } from "@/components/monthly/monthly-view";
import { getNextCreatableYear } from "@/lib/server/year-planning";
import { MONTH_NAMES } from "@/lib/utils";
import { getYearData, getYearsForUser } from "@/lib/server/year-data";
import { requireSessionUser } from "@/lib/server/session";

export default async function MonthPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) notFound();

  const user = await requireSessionUser();
  const [yearData, years] = await Promise.all([getYearData(user.id, year), getYearsForUser(user.id)]);

  if (!yearData) {
    if (years.length === 0) {
      notFound();
    }

    const nextCreatableYear = getNextCreatableYear(years, year);

    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(64,148,255,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))] px-4 py-8 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-background/90 p-6 shadow-[0_30px_80px_-44px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(64,148,255,0.08),transparent_40%,rgba(16,185,129,0.08))]" />
            <div className="pointer-events-none absolute -left-24 bottom-0 size-56 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(280px,0.82fr)] lg:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-background/75 px-4 py-2 text-sm text-muted-foreground shadow-sm">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    G
                  </span>
                  Año sin configurar
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Falta el arranque del ejercicio
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    Sin datos para {year}
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Solo puedes crear el siguiente ejercicio disponible para mantener la cadena de saldos conectada.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5 sm:p-6">
                <p className="text-sm font-semibold text-foreground">Siguiente paso</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Inicializa {nextCreatableYear} para abrir el detalle mensual y completar la planificación.
                </p>
                <div className="mt-6">
                  <CreateYearForm nextCreatableYear={nextCreatableYear} month={month} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppShell currentYear={year} currentMonth={month} view="detail" years={years.length > 0 ? years : [year]} user={user}>
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

function CreateYearForm({ nextCreatableYear, month }: { nextCreatableYear: number; month: number }) {
  return (
    <div className="flex">
      <Link
        href={`/setup/${nextCreatableYear}?redirect=/${nextCreatableYear}/${month}`}
        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        Crear {nextCreatableYear}
      </Link>
    </div>
  );
}
