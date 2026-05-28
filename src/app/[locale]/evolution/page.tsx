import { AppShell } from "@/components/layout/app-shell";
import { EvolutionDashboard } from "@/components/evolution/evolution-dashboard";
import { deriveEvolutionMetrics } from "@/lib/evolution";
import { getEvolutionSourcesForUser, getHistoricalYearsForUser } from "@/lib/server/historical-years";
import { requireSessionUser } from "@/lib/server/session";
import { getYearsForUser } from "@/lib/server/year-data";
import { pickDefaultYear } from "@/lib/server/year-navigation";
import { computeMultiYearTagStats } from "@/lib/tag-stats";

export default async function EvolutionPage() {
  const user = await requireSessionUser();
  const now = new Date();
  const calendarYear = now.getFullYear();
  const [years, historicalRows, evolutionSources] = await Promise.all([
    getYearsForUser(user.id),
    getHistoricalYearsForUser(user.id),
    getEvolutionSourcesForUser(user.id),
  ]);
  const metrics = deriveEvolutionMetrics(evolutionSources);

  const gridlyYearDataList = evolutionSources
    .filter((s): s is Extract<typeof s, { source: "gridly" }> => s.source === "gridly")
    .map((s) => s.yearData);
  const multiYearTagStats = gridlyYearDataList.length > 0 ? computeMultiYearTagStats(gridlyYearDataList) : null;

  const currentYear = pickDefaultYear(years, calendarYear);
  const yearOptions = [
    ...historicalRows.map((row) => ({ year: row.year, source: "historical" as const })),
    ...years.map((year) => ({ year, source: "gridly" as const })),
  ].sort((a, b) => a.year - b.year);

  return (
    <AppShell
      currentYear={currentYear}
      currentMonth={now.getMonth() + 1}
      view="evolution"
      years={yearOptions}
      user={user}
    >
      <EvolutionDashboard
        metrics={metrics}
        historicalYears={historicalRows}
        calendarYear={calendarYear}
        multiYearTagStats={multiYearTagStats}
      />
    </AppShell>
  );
}
