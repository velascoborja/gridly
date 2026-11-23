import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

export default function SetupLoading() {
  return (
    <div className="min-h-screen bg-muted/50 px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-lg border border-border bg-card px-4 py-4 shadow-sm sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/gridly-wordmark.svg"
                  alt="Gridly"
                  width={216}
                  height={64}
                  className="h-9 w-[122px]"
                  priority
                />
              </div>
              <div className="max-w-2xl space-y-2">
                <Skeleton className="h-3 w-32 rounded bg-primary/20" />
                <Skeleton className="h-9 w-64 max-w-full rounded bg-foreground/10 sm:h-10" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full max-w-2xl rounded bg-muted-foreground/20" />
                  <Skeleton className="h-4 w-3/4 max-w-xl rounded bg-muted-foreground/15" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div aria-busy="true" className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)_20rem] lg:items-start">
          <nav className="sticky top-0 z-10 -mx-4 overflow-hidden border-y border-border bg-muted/50 px-4 py-2 shadow-sm lg:top-3 lg:mx-0 lg:rounded-lg lg:border lg:bg-card lg:p-2 lg:shadow-sm">
            <ol className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col">
              {Array.from({ length: 4 }, (_, index) => (
                <StepSkeleton key={index} active={index === 0} />
              ))}
            </ol>
          </nav>

          <main className="space-y-4">
            <section className="rounded-lg border border-border bg-card shadow-sm">
              <CardHeaderSkeleton />
              <div className="space-y-2 px-6 pb-6">
                <FieldSkeleton />
                <Skeleton className="h-4 w-3/4 rounded bg-muted-foreground/15" />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card shadow-sm">
              <CardHeaderSkeleton />
              <div className="space-y-4 px-6 pb-6">
                <FieldSkeleton />
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40 rounded bg-foreground/15" />
                      <Skeleton className="h-4 w-full rounded bg-muted-foreground/15" />
                    </div>
                    <Skeleton className="h-6 w-11 rounded-full border border-border bg-card" />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card shadow-sm">
              <CardHeaderSkeleton />
              <div className="grid gap-4 md:grid-cols-3 px-6 pb-6">
                {Array.from({ length: 3 }, (_, index) => (
                  <FieldSkeleton key={index} />
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-primary/20 bg-card shadow-sm">
              <div className="flex items-center justify-between gap-4 px-6 py-6">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-7 w-44 rounded bg-foreground/10" />
                  <Skeleton className="h-4 w-full max-w-lg rounded bg-muted-foreground/15" />
                </div>
                <Skeleton className="size-5 rounded bg-primary/20" />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card shadow-sm">
              <CardHeaderSkeleton />
              <div className="space-y-3 px-6 pb-6">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_8rem_2rem]">
                    <Skeleton className="h-9 rounded-md bg-muted/50" />
                    <Skeleton className="h-9 rounded-md bg-muted/50" />
                    <Skeleton className="size-9 rounded-md bg-muted/50" />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card shadow-sm lg:hidden">
              <ReviewSkeleton />
            </section>
          </main>

          <aside className="hidden lg:sticky lg:top-3 lg:block">
            <section className="rounded-lg border border-border bg-card shadow-sm">
              <ReviewSkeleton />
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StepSkeleton({ active }: { active: boolean }) {
  return (
    <li>
      <div
        className={`flex h-10 items-center gap-2 rounded-md border px-3 ${
          active ? "border-primary bg-primary/[0.04]" : "border-transparent"
        }`}
      >
        <Skeleton
          className={`size-5 shrink-0 rounded border ${
            active ? "border-primary bg-primary" : "border-primary/20 bg-card"
          }`}
        />
        <Skeleton className="h-4 w-28 rounded bg-muted-foreground/20" />
      </div>
    </li>
  );
}

function CardHeaderSkeleton() {
  return (
    <div className="space-y-2 px-6 py-6 pb-4">
      <Skeleton className="h-7 w-52 rounded bg-foreground/10" />
      <Skeleton className="h-4 w-full max-w-xl rounded bg-muted-foreground/15" />
    </div>
  );
}

function FieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32 rounded bg-foreground/15" />
      <Skeleton className="h-11 rounded-md border border-border bg-card" />
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <>
      <div className="space-y-2 px-6 py-6 pb-4">
        <Skeleton className="h-6 w-36 rounded bg-foreground/10" />
        <Skeleton className="h-4 w-full rounded bg-muted-foreground/15" />
      </div>
      <div className="space-y-4 px-6 pb-6">
        <div className="divide-y divide-border rounded-md border border-border bg-card">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-start justify-between gap-4 px-3 py-3">
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-3 w-24 rounded bg-muted-foreground/20" />
                {index === 0 ? <Skeleton className="h-3 w-32 rounded bg-muted-foreground/15" /> : null}
              </div>
              <Skeleton className="h-4 w-20 shrink-0 rounded bg-foreground/10" />
            </div>
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded-md bg-primary/25" />
      </div>
    </>
  );
}
