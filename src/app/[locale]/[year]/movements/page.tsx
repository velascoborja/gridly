import { notFound } from "next/navigation";
import { YearPageClient } from "@/components/year/year-page-client";
import { getAnnualKpiComparisonContextForUser } from "@/lib/server/annual-comparisons";
import { getYearData } from "@/lib/server/year-data";
import { requireSessionUser } from "@/lib/server/session";

export default async function MovementsPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearStr } = await params;
  if (!/^\d+$/.test(yearStr)) notFound();
  const year = parseInt(yearStr, 10);
  if (isNaN(year)) notFound();

  const user = await requireSessionUser();
  const [yearData, comparisonContext] = await Promise.all([
    getYearData(user.id, year),
    getAnnualKpiComparisonContextForUser(user.id, year),
  ]);
  if (!yearData) notFound();
  const { years, comparison: annualComparison } = comparisonContext;
  const startingBalanceEditable = years[0] === year;
  const now = new Date();
  const defaultMonth = now.getFullYear() === year ? now.getMonth() + 1 : 1;

  return (
    <YearPageClient
      yearData={yearData}
      annualComparison={annualComparison}
      initialMonth={defaultMonth}
      initialView="movements"
      years={years.length > 0 ? years : [year]}
      startingBalanceEditable={startingBalanceEditable}
      user={user}
    />
  );
}
