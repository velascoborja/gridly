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
    <LoadingRegion className="space-y-6 motion-reduce:[&_[data-slot=skeleton]]:animate-none">
      <div className="rounded-md border border-border/70 bg-background/90 p-3 shadow-sm">
        <div className="flex items-center gap-2 overflow-hidden">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton
              key={index}
              className={index === 2 ? "h-9 w-24 shrink-0 bg-primary/15" : "h-9 w-20 shrink-0 bg-muted/55"}
            />
          ))}
        </div>
      </div>

      <section className="rounded-md border border-white/10 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b] p-6 shadow-[0_30px_60px_-15px_rgba(83,58,253,0.25)]">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-8 w-44 bg-white/15" />
            <Skeleton className="h-4 w-52 bg-white/10" />
          </div>
          <div className="flex gap-8">
            <Skeleton className="h-12 w-28 bg-white/10" />
            <Skeleton className="h-12 w-28 bg-white/15" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <div className="space-y-6">
          <ContentCard rows={4} />
          <ContentCard rows={3} />
        </div>
        <ContentCard rows={5} />
      </div>
    </LoadingRegion>
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
