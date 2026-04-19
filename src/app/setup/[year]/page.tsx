import { notFound, redirect } from "next/navigation";
import { deriveStartingBalance, getNextCreatableYear } from "@/lib/server/year-planning";
import { getYearData, getYearsForUser } from "@/lib/server/year-data";
import { requireSessionUser } from "@/lib/server/session";
import { SetupPageClient } from "@/components/setup/setup-page-client";

export default async function SetupPage({ params }: { params: Promise<{ year: string }> }) {
  const user = await requireSessionUser();

  const { year } = await params;
  const yearNum = parseInt(year, 10);

  if (Number.isNaN(yearNum)) {
    notFound();
  }

  const years = await getYearsForUser(user.id);
  const nextCreatableYear = getNextCreatableYear(years, yearNum);

  if (yearNum !== nextCreatableYear) {
    redirect(`/setup/${nextCreatableYear}`);
  }

  const latestYear = years.at(-1);
  const previousYearData = latestYear !== undefined ? await getYearData(user.id, latestYear) : null;
  const derivedStartingBalance = previousYearData ? deriveStartingBalance(previousYearData) : 0;

  return (
    <SetupPageClient
      year={yearNum}
      derivedStartingBalance={derivedStartingBalance}
      previousYear={latestYear ?? null}
      startingBalanceEditable={latestYear === undefined}
    />
  );
}
