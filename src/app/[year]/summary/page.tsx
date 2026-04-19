import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AnnualView } from "@/components/annual/annual-view";
import { getYearData, getYears } from "@/lib/server/year-data";

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
      <AnnualView yearData={yearData} />
    </AppShell>
  );
}
