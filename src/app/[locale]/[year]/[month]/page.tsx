import { notFound, redirect } from "next/navigation";
import { YearPageClient } from "@/components/year/year-page-client";
import { getYearData, getYearsForUser } from "@/lib/server/year-data";
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
  const [yearData, years] = await Promise.all([getYearData(user.id, year), getYearsForUser(user.id)]);

  if (!yearData) {
    if (years.length === 0) {
      redirect(`/setup/${year}?redirect=/${year}/${month}`);
    }

    notFound();
  }

  return (
    <YearPageClient
      yearData={yearData}
      initialMonth={month}
      initialView="overview"
      years={years.length > 0 ? years : [year]}
      user={user}
    />
  );
}
