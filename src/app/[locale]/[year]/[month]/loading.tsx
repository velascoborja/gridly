import { AppShell } from "@/components/layout/app-shell";

export default function MonthlyLoading() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  return (
    <AppShell
      currentYear={currentYear}
      currentMonth={currentMonth}
      view="overview"
      years={[currentYear]}
      user={{}}
    >
      <div className="space-y-6 animate-pulse">
        <div className="overflow-hidden rounded-lg border border-border/70 bg-background/90 shadow-[0_30px_45px_-30px_rgba(50,50,93,0.25),0_18px_36px_-24px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-2 border-b border-border/70 px-3 py-3 sm:px-4">
            <div className="size-7 rounded-md border border-border/60 bg-muted/40" />
            <div className="flex min-w-0 flex-1 gap-2 overflow-hidden px-3 py-1 sm:px-1">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className={`h-9 rounded-md border ${
                    index === 2
                      ? "w-24 border-primary/30 bg-primary/[0.08]"
                      : "w-20 border-border/50 bg-muted/30"
                  }`}
                />
              ))}
            </div>
            <div className="size-7 rounded-md border border-border/60 bg-muted/40" />
          </div>
        </div>

        <div className="overflow-hidden rounded-[6px] border border-white/10 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] text-white shadow-[0_30px_60px_-15px_rgba(83,58,253,0.25)]">
          <div className="px-6 py-5">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <div className="h-8 w-44 rounded bg-white/16" />
                <div className="h-4 w-52 rounded bg-white/10" />
                <div className="h-8 w-32 rounded-md border border-white/15 bg-white/10" />
              </div>
              <div className="flex gap-8">
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-white/10" />
                  <div className="h-9 w-28 rounded bg-emerald-300/20" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-24 rounded bg-white/10" />
                  <div className="h-9 w-28 rounded bg-white/16" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            {Array.from({ length: 2 }, (_, index) => (
              <div
                key={index}
                className="rounded-[6px] border border-border/70 bg-background/85 p-6 shadow-sm"
              >
                <div className="mb-5 h-6 w-40 rounded bg-muted/70" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }, (_, rowIndex) => (
                    <div key={rowIndex} className="flex items-center justify-between gap-4">
                      <div className="h-4 w-32 rounded bg-muted/55" />
                      <div className="h-9 w-28 rounded-[6px] border border-border/60 bg-background/90" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[6px] border border-border/70 bg-background/85 p-6 shadow-sm">
            <div className="mb-5 h-6 w-36 rounded bg-muted/70" />
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex items-center justify-between gap-4">
                  <div className="h-4 w-28 rounded bg-muted/55" />
                  <div className="h-4 w-24 rounded bg-muted/55" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
