"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { NavSelectors } from "./nav-selectors";
import { UserMenu } from "@/components/auth/user-menu";

interface Props {
  currentYear: number;
  currentMonth: number | null;
  view: "overview" | "summary" | "settings";
  years: number[];
  user: {
    email?: string | null;
    name?: string | null;
  };
  children: React.ReactNode;
}

export function AppShell({ currentYear, currentMonth, view, years, user, children }: Props) {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(64,148,255,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))] text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(255,255,255,0.75),transparent)]" />
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <Link href="/" className="group inline-flex items-center gap-2 self-center">
            <Image
              src="/logo.svg"
              alt="Gridly"
              width={52}
              height={52}
              className="rounded-2xl shadow-[0_14px_30px_-18px_rgba(15,23,42,0.6)] transition-transform duration-200 group-hover:-translate-y-0.5"
            />
            <span className="text-xl font-semibold tracking-tight leading-none">Gridly</span>
          </Link>
          <div className="flex flex-col items-center gap-3 md:items-end">
            <div className="flex w-full items-center justify-center gap-3 md:justify-end">
              <UserMenu email={user.email} name={user.name} active={view === "settings"} />
            </div>
            <NavSelectors currentYear={currentYear} currentMonth={currentMonth} view={view} years={years} />
          </div>
        </div>
      </header>
      <main className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
