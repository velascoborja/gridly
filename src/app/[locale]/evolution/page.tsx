import { AppShell } from "@/components/layout/app-shell";
import { EvolutionDashboard } from "@/components/evolution/evolution-dashboard";
import { deriveEvolutionMetrics } from "@/lib/evolution";
import { requireSessionUser } from "@/lib/server/session";
import { getAllYearDataForUser, getAppRedirectPath, getYearsForUser } from "@/lib/server/year-data";
import { pickDefaultYear } from "@/lib/server/year-navigation";
import { redirect } from "@/i18n/routing";

export default async function EvolutionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireSessionUser();
  const now = new Date();
  const calendarYear = now.getFullYear();
  const [years, allYearData] = await Promise.all([
    getYearsForUser(user.id),
    getAllYearDataForUser(user.id, { maxYear: calendarYear }),
  ]);
  const metrics = deriveEvolutionMetrics(allYearData);

  if (metrics.length < 2) {
    redirect({ href: await getAppRedirectPath(user.id, calendarYear), locale });
  }

  const currentYear = pickDefaultYear(years, calendarYear);

  return (
    <AppShell
      currentYear={currentYear}
      currentMonth={now.getMonth() + 1}
      view="evolution"
      years={years}
      user={user}
    >
      <EvolutionDashboard metrics={metrics} />
    </AppShell>
  );
}
