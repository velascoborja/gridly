import { Skeleton } from "@/components/ui/skeleton";

type View = "overview" | "summary" | "settings";

interface Props {
  view: View;
}

export function YearViewLoading({ view }: Props) {
  if (view === "settings") {
    return <SettingsViewSkeleton />;
  }

  if (view === "summary") {
    return <SummaryViewSkeleton />;
  }

  return <MonthlyViewSkeleton />;
}

function LoadingRegion({ children, className }: React.PropsWithChildren<{ className: string }>) {
  return (
    <div aria-busy="true" aria-live="polite" className={className}>
      {children}
    </div>
  );
}

function MonthlyViewSkeleton() {
  return (
    <LoadingRegion className="motion-reduce:[&_[data-slot=skeleton]]:animate-none">
      <div className="mb-6 overflow-hidden rounded-lg border border-border/70 bg-background/90 shadow-[0_30px_45px_-30px_rgba(50,50,93,0.25),0_18px_36px_-24px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-2 border-b border-border/70 px-3 py-3 sm:px-4">
          <Skeleton className="size-7 shrink-0 border border-border/60 bg-muted/40" />
          <div className="min-w-0 flex-1 overflow-hidden px-3 py-1 sm:px-1">
            <div className="flex w-max min-w-max gap-2">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton
                  key={index}
                  className={index === 2 ? "h-9 w-24 shrink-0 bg-primary/15" : "h-9 w-20 shrink-0 bg-muted/55"}
                />
              ))}
            </div>
          </div>
          <Skeleton className="size-7 shrink-0 border border-border/60 bg-muted/40" />
        </div>
      </div>

      <section className="relative mb-6 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] text-white shadow-[0_30px_60px_-15px_rgba(83,58,253,0.25)]">
        <div className="px-6 py-3">
          <div className="flex flex-col items-center gap-8 text-center lg:flex-row lg:justify-between lg:text-left">
            <div className="flex flex-col items-center gap-4 sm:gap-8 lg:flex-row">
              <div className="flex flex-col items-center lg:items-start">
                <Skeleton className="h-7 w-44 bg-white/15" />
                <div className="mt-2 flex items-center gap-2">
                  <Skeleton className="size-1.5 rounded-full bg-emerald-300/35" />
                  <Skeleton className="h-2.5 w-24 bg-white/10" />
                  <Skeleton className="hidden h-2.5 w-36 bg-white/10 sm:block" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Skeleton className="h-7 w-32 border border-white/15 bg-white/10" />
                  <Skeleton className="size-7 border border-white/15 bg-white/10" />
                </div>
              </div>

              <div className="hidden h-12 w-px bg-white/10 lg:block" />

              <div className="flex gap-8">
                <HeroMetricSkeleton accent="bg-emerald-300/20" />
                <HeroMetricSkeleton accent="bg-white/15" />
              </div>
            </div>

            <div className="flex w-full justify-center gap-6 border-t border-white/10 pt-4 lg:w-auto lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="space-y-2 lg:text-right">
                  <Skeleton className="h-2.5 w-20 bg-white/10" />
                  <Skeleton
                    className={index === 1 ? "h-4 w-20 bg-emerald-300/15" : index === 2 ? "h-4 w-20 bg-rose-300/15" : "h-4 w-20 bg-white/15"}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyEntriesCardSkeleton accent="bg-rose-500/20" />
        <MonthlyEntriesCardSkeleton accent="bg-emerald-500/20" />
      </div>
    </LoadingRegion>
  );
}

function HeroMetricSkeleton({ accent }: { accent: string }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-2.5 w-20 bg-white/10" />
      <Skeleton className={`h-9 w-28 ${accent}`} />
    </div>
  );
}

function MonthlyEntriesCardSkeleton({ accent }: { accent: string }) {
  return (
    <section className="flex flex-col gap-4 overflow-hidden rounded-lg border border-border/70 bg-card/95 py-4 shadow-sm shadow-black/5">
      <div className="flex min-w-0 items-start justify-between gap-3 px-4 pb-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36 bg-muted/65" />
          <Skeleton className="h-3 w-full max-w-72 bg-muted/45" />
        </div>
        <div className="grid shrink-0 justify-items-center gap-1 rounded-md border border-border/70 bg-background/80 px-2.5 py-1 shadow-sm">
          <Skeleton className="h-2.5 w-10 bg-muted/45" />
          <Skeleton className={`h-4 w-16 ${accent}`} />
        </div>
      </div>
      <div className="flex flex-col gap-2.5 px-4">
        <div className="flex items-center gap-3 pb-1">
          <Skeleton className="h-4 w-28 bg-muted/50" />
          <Skeleton className="h-3 w-20 bg-muted/40" />
        </div>
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex min-h-10 items-center justify-between gap-3 rounded-lg px-2 py-1.5">
            <Skeleton className="h-4 w-32 bg-muted/50" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16 bg-muted/55" />
              <Skeleton className="size-6 bg-muted/45" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SummaryViewSkeleton() {
  return (
    <LoadingRegion className="space-y-5 motion-reduce:[&_[data-slot=skeleton]]:animate-none">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.85fr)]">
        <div className="surface-depth-floating rounded-lg border border-primary/20 bg-linear-to-b from-primary/[0.08] via-card/98 to-card/95 p-6">
          <Skeleton className="h-4 w-32 bg-primary/20" />
          <Skeleton className="mt-4 h-11 w-48 bg-muted/60" />
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <MetricSkeleton />
            <MetricSkeleton />
          </div>
        </div>
        <ContentCard rows={3} />
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </LoadingRegion>
  );
}

function SettingsViewSkeleton() {
  return (
    <LoadingRegion className="mx-auto max-w-4xl space-y-6 py-6 motion-reduce:[&_[data-slot=skeleton]]:animate-none">
      <ContentCard rows={2} />
      <div className="rounded-md border border-destructive/15 bg-destructive/[0.02] p-6 shadow-sm">
        <Skeleton className="h-6 w-40 bg-destructive/10" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full bg-muted/55" />
        <Skeleton className="mt-6 h-10 w-40 bg-destructive/10" />
      </div>
    </LoadingRegion>
  );
}

function ContentCard({ rows }: { rows: number }) {
  return (
    <section className="rounded-md border border-border/70 bg-background/85 p-6 shadow-sm">
      <Skeleton className="h-6 w-40 bg-muted/65" />
      <div className="mt-5 space-y-4">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-32 bg-muted/50" />
            <Skeleton className="h-8 w-24 bg-muted/55" />
          </div>
        ))}
      </div>
    </section>
  );
}

function MetricSkeleton() {
  return (
    <div className="border-t border-border/70 pt-4">
      <Skeleton className="h-4 w-28 bg-muted/55" />
      <Skeleton className="mt-3 h-10 w-40 bg-muted/60" />
      <Skeleton className="mt-3 h-3 w-full bg-muted/40" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <section className="rounded-lg border border-border/70 bg-card/90 p-6 shadow-sm">
      <Skeleton className="h-5 w-40 bg-muted/60" />
      <Skeleton className="mt-2 h-4 w-64 max-w-full bg-muted/45" />
      <div className="mt-6 flex h-[260px] items-end gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
        {Array.from({ length: 12 }, (_, index) => (
          <Skeleton
            key={index}
            className="w-full rounded-b-none bg-primary/20"
            style={{ height: `${24 + ((index * 13) % 58)}%` }}
          />
        ))}
      </div>
    </section>
  );
}
