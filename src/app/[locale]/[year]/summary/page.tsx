import { notFound } from "next/navigation";
import { YearPageClient } from "@/components/year/year-page-client";
import { deriveAnnualKpiComparison } from "@/lib/annual-comparisons";
import { deriveEvolutionMetrics } from "@/lib/evolution";
import { getEvolutionSourcesForUser } from "@/lib/server/historical-years";
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
  const [yearData, years, evolutionSources] = await Promise.all([
    getYearData(user.id, year),
    getYearsForUser(user.id),
    getEvolutionSourcesForUser(user.id),
  ]);
  if (!yearData) notFound();
  const annualComparison = deriveAnnualKpiComparison(deriveEvolutionMetrics(evolutionSources), year);
  const startingBalanceEditable = years[0] === year;
  const now = new Date();
  const defaultMonth = now.getFullYear() === year ? now.getMonth() + 1 : 1;

  return (
    <YearPageClient
      yearData={yearData}
      annualComparison={annualComparison}
      initialMonth={defaultMonth}
      initialView="summary"
      years={years.length > 0 ? years : [year]}
      startingBalanceEditable={startingBalanceEditable}
      user={user}
    />
  );
}
