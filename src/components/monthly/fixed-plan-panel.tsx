import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function FixedPlanPanel({ children }: Props) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#533afd]/15 bg-[#533afd]/[0.035] dark:border-[#8b7cff]/20 dark:bg-[#533afd]/[0.08] text-sm text-card-foreground">
      <div className="grid divide-y divide-[#533afd]/10 dark:divide-[#8b7cff]/15 md:grid-cols-2 md:divide-x md:divide-y-0">
        {children}
      </div>
    </section>
  );
}
