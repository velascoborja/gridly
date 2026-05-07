import { BaseAppShell } from "@/components/layout/base-app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function YearLoading() {
  return (
    <BaseAppShell
      headerRightContent={
        <>
          <div className="flex items-center justify-end justify-self-end">
            <Skeleton className="size-9 rounded-md border border-border/60 bg-background/80" />
          </div>
          <div className="col-span-2 flex min-w-0 justify-center md:col-span-1 md:justify-end">
            <div className="flex max-w-full flex-wrap items-center justify-center gap-2 md:justify-end md:gap-3">
              <div className="flex shrink-0 items-center justify-center gap-2">
                <Skeleton className="h-8 w-20 rounded-md border border-border/60 bg-background/80 sm:h-9" />
                <Skeleton className="size-8 rounded-md border border-border/60 bg-background/80 sm:size-9" />
              </div>
              <div className="min-w-0 rounded-lg border border-border/70 bg-muted/40 p-1 shadow-sm">
                <div className="flex flex-wrap justify-center gap-1">
                  <Skeleton className="h-8 w-20 rounded-md bg-primary/20 sm:w-24" />
                  <Skeleton className="h-8 w-24 rounded-md bg-muted/50 sm:w-32" />
                  <Skeleton className="h-8 w-20 rounded-md bg-muted/50 sm:w-24" />
                </div>
              </div>
            </div>
          </div>
        </>
      }
    >
      <div aria-busy="true" className="space-y-5">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.85fr)]">
          <div className="surface-depth-floating rounded-lg border border-primary/20 bg-linear-to-b from-primary/[0.08] via-card/98 to-card/95 px-5 py-5 md:px-6">
            <div className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <Skeleton className="h-3 w-28 rounded bg-primary/20" />
                <Skeleton className="mt-3 h-9 w-44 rounded bg-muted/60 md:h-11" />
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-full max-w-2xl rounded bg-muted/45" />
                  <Skeleton className="h-4 w-3/4 max-w-xl rounded bg-muted/40" />
                </div>
              </div>
              <div className="flex items-center gap-2 lg:justify-end">
                <Skeleton className="size-9 rounded-md border border-border/60 bg-background/80" />
                <Skeleton className="h-9 w-28 rounded-md border border-primary/20 bg-primary/[0.08]" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }, (_, index) => (
                <section key={index} className="border-t border-border/70 pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <Skeleton className="h-4 w-28 rounded bg-muted/55" />
                    <Skeleton className="h-7 w-24 rounded-md border border-primary/15 bg-primary/10" />
                  </div>
                  <Skeleton className="mt-3 h-10 w-40 rounded bg-muted/60 md:h-12" />
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-full rounded bg-muted/45" />
                    <Skeleton className="h-3 w-2/3 rounded bg-muted/40" />
                  </div>
                </section>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-card/92 p-5 shadow-sm">
            <div className="space-y-6">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className={`flex items-start justify-between gap-4 ${
                    index !== 0 ? "border-t border-border/40 pt-6" : ""
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Skeleton className="size-8 shrink-0 rounded-md border border-primary/15 bg-primary/10" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-28 rounded bg-muted/55" />
                      <Skeleton className="h-3 w-full rounded bg-muted/40" />
                    </div>
                  </div>
                  <Skeleton className="h-7 w-24 rounded bg-muted/60" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    </BaseAppShell>
  );
}

function ChartSkeleton() {
  return (
    <section className="rounded-lg border border-border/70 bg-card/90 shadow-sm">
      <div className="space-y-2 p-6 pb-2">
        <Skeleton className="h-5 w-40 rounded bg-muted/60" />
        <Skeleton className="h-4 w-72 max-w-full rounded bg-muted/45" />
      </div>
      <div className="px-6 pb-6 pt-0">
        <div className="h-[260px] rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex h-full items-end gap-3">
            {Array.from({ length: 12 }, (_, index) => (
              <Skeleton
                key={index}
                className="w-full rounded-t bg-primary/20"
                style={{ height: `${24 + ((index * 13) % 58)}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
