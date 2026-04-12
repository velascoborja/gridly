import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MonthOverview } from "@/components/monthly/month-overview";
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

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr, 10);
  if (isNaN(year)) notFound();

  const [yearData, years] = await Promise.all([getYearData(year), getYears()]);

  if (!yearData) {
    redirect(`/setup/${year}?redirect=/${year}/overview`);
  }

  const now = new Date();
  const currentMonth = now.getFullYear() === year ? now.getMonth() + 1 : 1;

  return (
    <AppShell currentYear={year} currentMonth={null} view="overview" years={years.length > 0 ? years : [year]}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">
          {MONTH_NAMES[currentMonth - 1]} {year}
        </h1>
      </div>
      <MonthOverview yearData={yearData} monthNumber={currentMonth} />
    </AppShell>
  );
}
