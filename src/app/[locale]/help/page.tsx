import { AppShell } from "@/components/layout/app-shell";
import { HelpPageClient } from "@/components/help/help-page-client";
import { requireSessionUser } from "@/lib/server/session";
import { getYearsForUser } from "@/lib/server/year-data";
import { pickDefaultYear } from "@/lib/server/year-navigation";

export default async function HelpPage() {
  const user = await requireSessionUser();
  const years = await getYearsForUser(user.id);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const defaultYear = pickDefaultYear(years, currentYear);

  return (
    <AppShell
      currentYear={defaultYear}
      currentMonth={currentMonth}
      view="settings"
      years={years.length > 0 ? years : [defaultYear]}
      user={user}
    >
      <HelpPageClient />
    </AppShell>
  );
}
