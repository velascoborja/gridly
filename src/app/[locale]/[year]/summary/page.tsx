import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AnnualView } from "@/components/annual/annual-view";
import { getYearData, getYearsForUser } from "@/lib/server/year-data";
import { requireSessionUser } from "@/lib/server/session";

export default async function SummaryPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearStr } = await params;
  const year = parseInt(yearStr, 10);
  if (isNaN(year)) notFound();

  const user = await requireSessionUser();
  const [yearData, years] = await Promise.all([getYearData(user.id, year), getYearsForUser(user.id)]);
  if (!yearData) notFound();

  return (
    <AppShell currentYear={year} currentMonth={null} view="summary" years={years.length > 0 ? years : [year]} user={user}>
      <AnnualView yearData={yearData} />
    </AppShell>
  );
}
