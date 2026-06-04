import { BaseAppShell } from "@/components/layout/base-app-shell";

export default function HelpLoading() {
  return (
    <BaseAppShell>
      <div className="mx-auto max-w-2xl space-y-6 py-6 animate-pulse">
        <div>
          <div className="h-7 w-48 rounded bg-muted/70" />
          <div className="mt-2 h-4 w-64 rounded bg-muted/55" />
        </div>

        <div className="flex gap-1 rounded-xl border border-border/50 bg-muted/40 p-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 h-8 rounded-lg bg-muted/60" />
          ))}
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-background/60 px-4 py-3"
            >
              <div className="h-4 w-40 rounded bg-muted/70" />
              <div className="mt-1.5 h-3 w-72 max-w-full rounded bg-muted/55" />
            </div>
          ))}
        </div>
      </div>
    </BaseAppShell>
  );
}
