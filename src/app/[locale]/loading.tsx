import Image from "next/image";

export default function LocaleLoading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_top_left,rgba(83,58,253,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.12),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,1))] px-6 text-foreground">
      <section
        aria-busy="true"
        aria-live="polite"
        className="w-full max-w-sm rounded-[6px] border border-border/70 bg-background/90 px-6 py-7 text-center shadow-[0_30px_45px_-30px_rgba(50,50,93,0.25),0_18px_36px_-18px_rgba(0,0,0,0.1)] backdrop-blur"
      >
        <Image
          src="/gridly-wordmark.svg"
          alt="Gridly"
          width={216}
          height={64}
          priority
          className="mx-auto mb-6 h-12 w-auto"
        />
        <p className="text-[0.8125rem] font-normal text-muted-foreground">
          Preparando Gridly...
        </p>
        <div className="mt-5 h-1 overflow-hidden rounded-[4px] bg-muted">
          <div className="h-full w-1/2 animate-pulse rounded-[4px] bg-primary" />
        </div>
      </section>
    </main>
  );
}
