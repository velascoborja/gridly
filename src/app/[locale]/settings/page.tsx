import { AppShell } from "@/components/layout/app-shell";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireSessionUser } from "@/lib/server/session";
import { getYearsForUser, pickDefaultYear } from "@/lib/server/year-data";

export default async function SettingsPage() {
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
      <div className="mx-auto max-w-4xl py-6">
        <SettingsForm />
      </div>
    </AppShell>
  );
}
