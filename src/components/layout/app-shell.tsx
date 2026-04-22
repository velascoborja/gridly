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
      <header className="sticky top-0 z-40 app-header-surface">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-2 sm:px-6 md:flex md:items-center md:justify-between md:gap-4 md:py-4 lg:px-8">
          <Link href="/" className="group inline-flex items-center gap-2 justify-self-start">
            <Image
              src="/logo.svg"
              alt="Gridly"
              width={52}
              height={52}
              className="size-9 rounded-xl shadow-[0_14px_30px_-18px_rgba(15,23,42,0.6)] transition-transform duration-200 group-hover:-translate-y-0.5 md:size-[52px] md:rounded-2xl"
            />
            <span className="text-xl font-semibold tracking-tight leading-none">Gridly</span>
          </Link>
          <div className="contents md:flex md:flex-col md:items-end md:gap-3">
            <div className="flex items-center justify-end justify-self-end">
              <UserMenu email={user.email} name={user.name} active={view === "settings"} />
            </div>
            <div className="col-span-2 flex min-w-0 justify-center md:col-span-1 md:justify-end">
              <NavSelectors currentYear={currentYear} currentMonth={currentMonth} view={view} years={years} />
            </div>
          </div>
        </div>
      </header>
      <main className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
