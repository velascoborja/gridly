import Image from "next/image";

export default function LocaleLoading() {
  return (
    <main className="app-atmosphere grid min-h-dvh place-items-center text-foreground">
      <div
        aria-busy="true"
        aria-live="polite"
        className="flex flex-col items-center"
      >
        <div className="mb-9 w-[9.75rem] overflow-hidden">
          <Image
            src="/gridly-wordmark.svg"
            alt="Gridly"
            width={216}
            height={64}
            priority
            className="h-14 w-[11.8125rem] max-w-none"
          />
        </div>
        <div className="relative h-0.5 w-56 overflow-hidden rounded-full bg-primary/10">
          <div className="animate-shimmer-slide absolute inset-y-0 w-[60%] rounded-full bg-linear-to-r from-transparent via-primary to-transparent motion-reduce:hidden" />
        </div>
        <p
          role="status"
          className="animate-label-fade mt-4 text-base text-muted-foreground/80"
        >
          Preparando Gridly...
        </p>
      </div>
    </main>
  );
}
