import { notFound, redirect } from "next/navigation";
import { YearPageClient } from "@/components/year/year-page-client";
import { getAnnualKpiComparisonContextForUser } from "@/lib/server/annual-comparisons";
import { getYearData } from "@/lib/server/year-data";
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
  const [yearData, comparisonContext] = await Promise.all([
    getYearData(user.id, year),
    getAnnualKpiComparisonContextForUser(user.id, year),
  ]);
  const { years, comparison: annualComparison } = comparisonContext;

  if (!yearData) {
    if (years.length === 0) {
      redirect(`/setup/${year}?redirect=/${year}/${month}`);
    }

    notFound();
  }

  const startingBalanceEditable = years[0] === year;
  return (
    <YearPageClient
      yearData={yearData}
      annualComparison={annualComparison}
      initialMonth={month}
      initialView="overview"
      years={years.length > 0 ? years : [year]}
      startingBalanceEditable={startingBalanceEditable}
      user={user}
    />
  );
}
