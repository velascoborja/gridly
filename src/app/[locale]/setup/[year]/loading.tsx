import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

export default function SetupLoading() {
  return (
    <div className="min-h-screen bg-[#f6f9fc] px-4 py-6 text-[#061b31] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="rounded-lg border border-[#e5edf5] bg-white px-4 py-4 shadow-[0_15px_35px_0_rgba(23,23,23,0.08)] sm:px-5">
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
                <Skeleton className="h-3 w-32 rounded bg-[#533afd]/20" />
                <Skeleton className="h-9 w-64 max-w-full rounded bg-[#061b31]/10 sm:h-10" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full max-w-2xl rounded bg-[#64748d]/20" />
                  <Skeleton className="h-4 w-3/4 max-w-xl rounded bg-[#64748d]/15" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div aria-busy="true" className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)_20rem] lg:items-start">
          <nav className="sticky top-0 z-10 -mx-4 overflow-hidden border-y border-[#e5edf5] bg-[#f6f9fc] px-4 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.05)] lg:top-3 lg:mx-0 lg:rounded-lg lg:border lg:bg-white lg:p-2 lg:shadow-[0_15px_35px_0_rgba(23,23,23,0.06)]">
            <ol className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col">
              {Array.from({ length: 4 }, (_, index) => (
                <StepSkeleton key={index} active={index === 0} />
              ))}
            </ol>
          </nav>

          <main className="space-y-4">
            <section className="rounded-lg border border-[#e5edf5] bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]">
              <CardHeaderSkeleton />
              <div className="space-y-2 px-6 pb-6">
                <FieldSkeleton />
                <Skeleton className="h-4 w-3/4 rounded bg-[#64748d]/15" />
              </div>
            </section>

            <section className="rounded-lg border border-[#e5edf5] bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]">
              <CardHeaderSkeleton />
              <div className="space-y-4 px-6 pb-6">
                <FieldSkeleton />
                <div className="rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40 rounded bg-[#273951]/15" />
                      <Skeleton className="h-4 w-full rounded bg-[#64748d]/15" />
                    </div>
                    <Skeleton className="h-6 w-11 rounded-full border border-[#d4dee9] bg-white" />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#e5edf5] bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]">
              <CardHeaderSkeleton />
              <div className="grid gap-4 md:grid-cols-3 px-6 pb-6">
                {Array.from({ length: 3 }, (_, index) => (
                  <FieldSkeleton key={index} />
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#d6d9fc] bg-white shadow-[rgba(50,50,93,0.18)_0px_24px_40px_-30px,rgba(0,0,0,0.08)_0px_14px_28px_-18px]">
              <div className="flex items-center justify-between gap-4 px-6 py-6">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-7 w-44 rounded bg-[#061b31]/10" />
                  <Skeleton className="h-4 w-full max-w-lg rounded bg-[#64748d]/15" />
                </div>
                <Skeleton className="size-5 rounded bg-[#533afd]/20" />
              </div>
            </section>

            <section className="rounded-lg border border-[#e5edf5] bg-white shadow-[rgba(50,50,93,0.18)_0px_24px_40px_-30px,rgba(0,0,0,0.08)_0px_14px_28px_-18px]">
              <CardHeaderSkeleton />
              <div className="space-y-3 px-6 pb-6">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="grid gap-3 rounded-md border border-[#e5edf5] p-3 sm:grid-cols-[1fr_8rem_2rem]">
                    <Skeleton className="h-9 rounded-md bg-[#f6f9fc]" />
                    <Skeleton className="h-9 rounded-md bg-[#f6f9fc]" />
                    <Skeleton className="size-9 rounded-md bg-[#f6f9fc]" />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#e5edf5] bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px] lg:hidden">
              <ReviewSkeleton />
            </section>
          </main>

          <aside className="hidden lg:sticky lg:top-3 lg:block">
            <section className="rounded-lg border border-[#e5edf5] bg-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]">
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
          active ? "border-[#533afd] bg-[#533afd]/[0.04]" : "border-transparent"
        }`}
      >
        <Skeleton
          className={`size-5 shrink-0 rounded border ${
            active ? "border-[#533afd] bg-[#533afd]" : "border-[#d6d9fc] bg-white"
          }`}
        />
        <Skeleton className="h-4 w-28 rounded bg-[#64748d]/20" />
      </div>
    </li>
  );
}

function CardHeaderSkeleton() {
  return (
    <div className="space-y-2 px-6 py-6 pb-4">
      <Skeleton className="h-7 w-52 rounded bg-[#061b31]/10" />
      <Skeleton className="h-4 w-full max-w-xl rounded bg-[#64748d]/15" />
    </div>
  );
}

function FieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32 rounded bg-[#273951]/15" />
      <Skeleton className="h-11 rounded-md border border-[#e5edf5] bg-white" />
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <>
      <div className="space-y-2 px-6 py-6 pb-4">
        <Skeleton className="h-6 w-36 rounded bg-[#061b31]/10" />
        <Skeleton className="h-4 w-full rounded bg-[#64748d]/15" />
      </div>
      <div className="space-y-4 px-6 pb-6">
        <div className="divide-y divide-[#e5edf5] rounded-md border border-[#e5edf5] bg-white">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-start justify-between gap-4 px-3 py-3">
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-3 w-24 rounded bg-[#64748d]/20" />
                {index === 0 ? <Skeleton className="h-3 w-32 rounded bg-[#64748d]/15" /> : null}
              </div>
              <Skeleton className="h-4 w-20 shrink-0 rounded bg-[#061b31]/10" />
            </div>
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded-md bg-[#533afd]/25" />
      </div>
    </>
  );
}
