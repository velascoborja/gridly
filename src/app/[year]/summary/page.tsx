import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AnnualView } from "@/components/annual/annual-view";
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

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr, 10);
  if (isNaN(year)) notFound();

  const [yearData, years] = await Promise.all([getYearData(year), getYears()]);
  if (!yearData) notFound();

  return (
    <AppShell currentYear={year} currentMonth={null} view="summary" years={years.length > 0 ? years : [year]}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Resumen {year}</h1>
      </div>
      <AnnualView yearData={yearData} />
    </AppShell>
  );
}
