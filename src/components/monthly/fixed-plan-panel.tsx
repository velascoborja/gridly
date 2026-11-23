import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function FixedPlanPanel({ children }: Props) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#533afd]/20 bg-[#533afd]/[0.07] dark:border-[#8b7cff]/25 dark:bg-[#533afd]/[0.12] text-sm text-card-foreground">
      <div className="grid divide-y divide-[#533afd]/15 dark:divide-[#8b7cff]/20 md:grid-cols-2 md:divide-x md:divide-y-0">
        {children}
      </div>
    </section>
  );
}
