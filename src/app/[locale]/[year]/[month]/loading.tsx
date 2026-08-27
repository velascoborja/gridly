import { BaseAppShell } from "@/components/layout/base-app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { YearViewLoading } from "@/components/year/year-view-loading";

export default function MonthlyLoading() {
  return (
    <BaseAppShell
      headerRightContent={
        <>
          <div className="flex items-center justify-end justify-self-end gap-2 motion-reduce:[&_[data-slot=skeleton]]:animate-none">
            <Skeleton className="size-7 bg-muted/45" />
            <Skeleton className="size-8 bg-muted/45 md:hidden" />
            <Skeleton className="size-9 rounded-full border border-border/60 bg-background/80" />
            <Skeleton className="size-9 rounded-full border border-border/60 bg-background/80 sm:h-7 sm:w-16" />
          </div>
          <div className="col-span-2 flex min-w-0 justify-center md:col-span-1 md:justify-end motion-reduce:[&_[data-slot=skeleton]]:animate-none">
            <div className="flex max-w-full flex-wrap items-center justify-center gap-2 md:justify-end md:gap-3">
              <div className="hidden shrink-0 items-center justify-center gap-2 md:flex">
                <Skeleton className="h-3 w-10 bg-muted/45" />
                <Skeleton className="h-9 w-20 border border-border/60 bg-background/80" />
                <Skeleton className="size-9 border border-border/60 bg-background/80" />
              </div>
              <div className="min-w-0 rounded-lg border border-border/70 bg-muted/40 p-1 shadow-sm">
                <div className="flex flex-wrap justify-center gap-1">
                  <Skeleton className="h-8 w-20 bg-primary/20 sm:w-24" />
                  <Skeleton className="h-8 w-24 bg-muted/50 sm:w-32" />
                  <Skeleton className="h-8 w-20 bg-muted/50 sm:w-24" />
                </div>
              </div>
            </div>
          </div>
        </>
      }
    >
      <YearViewLoading view="overview" />
    </BaseAppShell>
  );
}
