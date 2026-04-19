import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MonthOverview } from "@/components/monthly/month-overview";
import { getYearData, getYears } from "@/lib/server/year-data";

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
    <AppShell currentYear={year} currentMonth={currentMonth} view="overview" years={years.length > 0 ? years : [year]}>
      <MonthOverview yearData={yearData} monthNumber={currentMonth} />
    </AppShell>
  );
}
