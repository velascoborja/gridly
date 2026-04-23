import { AppShell } from "@/components/layout/app-shell";

export default function SettingsLoading() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return (
    <AppShell
      currentYear={currentYear}
      currentMonth={currentMonth}
      view="settings"
      years={[currentYear]}
      user={{}}
    >
      <div className="mx-auto max-w-4xl py-6">
        <div className="space-y-6 animate-pulse">
          <div className="rounded-[6px] border border-border/70 bg-background/85 p-6 shadow-sm">
            <div className="mb-3 h-6 w-48 rounded bg-muted/70" />
            <div className="mb-6 h-4 w-72 max-w-full rounded bg-muted/55" />
            <div className="h-10 w-56 max-w-full rounded-[6px] border border-border/60 bg-background/90" />
          </div>

          <div className="rounded-[6px] border border-destructive/15 bg-destructive/[0.02] p-6 shadow-sm">
            <div className="mb-3 h-6 w-40 rounded bg-destructive/10" />
            <div className="mb-6 h-4 w-80 max-w-full rounded bg-muted/55" />
            <div className="h-10 w-40 rounded-[6px] bg-destructive/10" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
