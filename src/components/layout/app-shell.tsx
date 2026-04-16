import Link from "next/link";
import { NavSelectors } from "./nav-selectors";

interface Props {
  currentYear: number;
  currentMonth: number | null;
  view: "overview" | "summary" | "detail";
  years: number[];
  children: React.ReactNode;
}

export function AppShell({ currentYear, currentMonth, view, years, children }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(64,148,255,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))] text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(255,255,255,0.75),transparent)]" />
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
          <Link href="/" className="group inline-flex items-center gap-3 self-start">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-[0_14px_30px_-18px_rgba(15,23,42,0.6)] transition-transform duration-200 group-hover:-translate-y-0.5">
              G
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-lg font-semibold tracking-tight">Gridly</span>
              <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Panorama financiero</span>
            </span>
          </Link>
          <NavSelectors currentYear={currentYear} currentMonth={currentMonth} view={view} years={years} />
        </div>
      </header>
      <main className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
