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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Gridly
          </Link>
          <NavSelectors currentYear={currentYear} currentMonth={currentMonth} view={view} years={years} />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
