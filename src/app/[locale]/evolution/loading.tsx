import { BaseAppShell } from "@/components/layout/base-app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function EvolutionLoading() {
  return (
    <BaseAppShell
      headerRightContent={
        <>
          <div className="flex items-center justify-end justify-self-end">
            <Skeleton className="size-9 rounded-md border border-border/60 bg-background/80" />
          </div>
          <div className="col-span-2 flex min-w-0 justify-center md:col-span-1 md:justify-end">
            <div className="rounded-lg border border-border/70 bg-muted/40 p-1 shadow-sm">
              <div className="flex gap-1">
                <Skeleton className="h-8 w-16 rounded-md bg-muted/50 sm:w-20" />
                <Skeleton className="h-8 w-16 rounded-md bg-muted/50 sm:w-20" />
                <Skeleton className="h-8 w-20 rounded-md bg-primary/20 sm:w-24" />
              </div>
            </div>
          </div>
        </>
      }
    >
      <div aria-busy="true" aria-live="polite" className="space-y-5">
        <section className="surface-depth-floating rounded-lg border border-primary/20 bg-linear-to-b from-primary/[0.08] via-card/98 to-card/95 px-5 py-5 md:px-6">
          <Skeleton className="h-3 w-32 rounded bg-primary/20" />
          <Skeleton className="mt-3 h-9 w-64 max-w-full rounded bg-muted/55 md:h-11" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-full max-w-2xl rounded bg-muted/45" />
            <Skeleton className="h-4 w-3/4 max-w-xl rounded bg-muted/40" />
          </div>

          <div className="mt-5 rounded-lg border border-primary/25 bg-primary/[0.06] px-5 py-4">
            <Skeleton className="h-3 w-28 rounded bg-primary/20" />
            <Skeleton className="mt-3 h-11 w-72 max-w-full rounded bg-primary/20 md:h-14" />
            <Skeleton className="mt-3 h-3 w-80 max-w-full rounded bg-muted/45" />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="rounded-lg border border-border/70 bg-card/90 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-4 w-24 rounded bg-muted/55" />
                  <Skeleton className="size-4 rounded bg-primary/20" />
                </div>
                <Skeleton className="mt-4 h-8 w-28 rounded bg-muted/60" />
                <Skeleton className="mt-3 h-3 w-full rounded bg-muted/45" />
                <Skeleton className="mt-2 h-3 w-3/4 rounded bg-muted/40" />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <ChartSkeleton heightClassName="h-[280px]" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ChartSkeleton heightClassName="h-[240px]" />
            <ChartSkeleton heightClassName="h-[240px]" />
            <ChartSkeleton heightClassName="h-[240px]" />
          </div>
        </section>

        <section className="rounded-lg border border-border/70 bg-card/90 shadow-sm">
          <div className="space-y-2 p-6 pb-2">
            <Skeleton className="h-5 w-40 rounded bg-muted/60" />
            <Skeleton className="h-4 w-72 max-w-full rounded bg-muted/45" />
          </div>
          <div className="px-6 pb-6 pt-0">
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <div className="min-w-[1040px]">
                <div className="grid grid-cols-10 gap-3 bg-muted/40 px-3 py-3">
                  {Array.from({ length: 10 }, (_, index) => (
                    <Skeleton key={index} className="h-3 rounded bg-muted/70" />
                  ))}
                </div>
                <div className="divide-y divide-border/60">
                  {Array.from({ length: 5 }, (_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-10 gap-3 bg-card/70 px-3 py-3">
                      {Array.from({ length: 10 }, (_, cellIndex) => (
                        <Skeleton
                          key={cellIndex}
                          className={`h-4 rounded bg-muted/45 ${cellIndex === 0 ? "w-12" : "w-full"}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <span className="sr-only">Loading evolution dashboard...</span>
        </section>
      </div>
    </BaseAppShell>
  );
}

function ChartSkeleton({ heightClassName }: { heightClassName: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/90 shadow-sm">
      <div className="space-y-2 p-6 pb-2">
        <Skeleton className="h-5 w-44 rounded bg-muted/60" />
        <Skeleton className="h-4 w-80 max-w-full rounded bg-muted/45" />
      </div>
      <div className="px-6 pb-6 pt-0">
        <div className={`rounded-lg border border-border/60 bg-muted/20 p-3 ${heightClassName}`}>
          <div className="flex h-full items-end gap-3">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton
                key={index}
                className="w-full rounded-t bg-primary/20"
                style={{ height: `${32 + ((index * 17) % 52)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
