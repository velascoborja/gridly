import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MonthOverview } from "@/components/monthly/month-overview";
import { getYearData, getYearsForUser } from "@/lib/server/year-data";
import { requireSessionUser } from "@/lib/server/session";

export default async function OverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const { year: yearStr } = await params;
  const { month: monthParam } = await searchParams;
  const year = parseInt(yearStr, 10);
  if (isNaN(year)) notFound();

  const user = await requireSessionUser();
  const [yearData, years] = await Promise.all([getYearData(user.id, year), getYearsForUser(user.id)]);

  if (!yearData) {
    if (years.length === 0) {
      redirect(`/setup/${year}?redirect=/${year}/overview`);
    }

    notFound();
  }

  const now = new Date();
  const defaultMonth = now.getFullYear() === year ? now.getMonth() + 1 : 1;
  const selectedMonth = Array.isArray(monthParam) ? monthParam[0] : monthParam;
  const parsedMonth = selectedMonth ? parseInt(selectedMonth, 10) : defaultMonth;
  const currentMonth = parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : defaultMonth;

  return (
    <AppShell currentYear={year} currentMonth={currentMonth} view="overview" years={years.length > 0 ? years : [year]} user={user}>
      <MonthOverview yearData={yearData} monthNumber={currentMonth} />
    </AppShell>
  );
}
