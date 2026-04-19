import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MonthOverview } from "@/components/monthly/month-overview";
import { getYearData, getYearsForUser } from "@/lib/server/year-data";
import { requireSessionUser } from "@/lib/server/session";

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearStr } = await params;
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
  const currentMonth = now.getFullYear() === year ? now.getMonth() + 1 : 1;

  return (
    <AppShell currentYear={year} currentMonth={currentMonth} view="overview" years={years.length > 0 ? years : [year]} user={user}>
      <MonthOverview yearData={yearData} monthNumber={currentMonth} />
    </AppShell>
  );
}
