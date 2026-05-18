import Image from "next/image";

export default function LocaleLoading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(ellipse_at_30%_20%,rgba(83,58,253,0.07)_0%,transparent_55%),radial-gradient(ellipse_at_75%_15%,rgba(20,184,166,0.05)_0%,transparent_48%),#ffffff] text-foreground">
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
        <div className="relative h-0.5 w-56 overflow-hidden rounded-full bg-[rgba(83,58,253,0.12)]">
          <div className="animate-shimmer-slide absolute inset-y-0 w-[60%] rounded-full bg-[linear-gradient(90deg,transparent_0%,#533afd_40%,#665efd_70%,transparent_100%)]" />
        </div>
        <p
          role="status"
          className="animate-label-fade mt-4 text-[0.9375rem] text-muted-foreground/80"
        >
          Preparando Gridly...
        </p>
      </div>
    </main>
  );
}
