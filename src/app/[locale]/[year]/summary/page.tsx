import { notFound } from "next/navigation";
import { YearPageClient } from "@/components/year/year-page-client";
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
  const startingBalanceEditable = years[0] === year;

  return (
    <YearPageClient
      yearData={yearData}
      initialMonth={new Date().getMonth() + 1}
      initialView="summary"
      years={years.length > 0 ? years : [year]}
      startingBalanceEditable={startingBalanceEditable}
      user={user}
    />
  );
}
