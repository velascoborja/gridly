export type YearRouteView = "overview" | "summary" | "settings" | "evolution";

export function parseYearRoutePathname(pathname: string): { year: number | null; view: YearRouteView; month: number | null } | null {
  if (pathname.match(/\/settings$/)) {
    return { year: null, view: "settings", month: null };
  }

  if (pathname.match(/\/evolution$/)) {
    return { year: null, view: "evolution", month: null };
  }

  const summaryMatch = pathname.match(/\/(\d+)\/summary$/);
  if (summaryMatch) {
    return { year: Number.parseInt(summaryMatch[1], 10), view: "summary", month: null };
  }

  const monthMatch = pathname.match(/\/(\d+)\/(\d+)$/);
  if (monthMatch) {
    return { year: Number.parseInt(monthMatch[1], 10), view: "overview", month: Number.parseInt(monthMatch[2], 10) };
  }

  return null;
}

export function getYearRoutePrefix(pathname: string, year: number): string {
  const yearMatch = pathname.match(new RegExp(`^(.*)/${year}/(?:summary|\\d+)$`));
  if (yearMatch) return yearMatch[1];

  const settingsMatch = pathname.match(/^(.*)\/settings$/);
  if (settingsMatch) return settingsMatch[1];

  const evolutionMatch = pathname.match(/^(.*)\/evolution$/);
  if (evolutionMatch) return evolutionMatch[1];

  return "";
}

export function buildYearMonthHref(prefix: string | undefined, year: number, month: number): string {
  return `${prefix ?? ""}/${year}/${month}`;
}

export function buildYearSummaryHref(prefix: string | undefined, year: number): string {
  return `${prefix ?? ""}/${year}/summary`;
}

export function buildSettingsHref(prefix: string): string {
  return prefix ? `${prefix}/settings` : "/settings";
}

export function buildEvolutionHref(prefix: string | undefined): string {
  return `${prefix ?? ""}/evolution`;
}

export function buildSetupHref(nextYear: number, returnPath: string): string {
  return `/setup/${nextYear}?redirect=${encodeURIComponent(returnPath)}`;
}

export function buildReturnPathFromView(currentYear: number, currentMonth: number, view: YearRouteView): string {
  return view === "summary" ? `/${currentYear}/summary` : `/${currentYear}/${currentMonth}`;
}

export function buildSetupHrefFromPathname(
  nextYear: number,
  pathname: string,
  currentYear: number,
  currentMonth: number,
  view: YearRouteView
): string {
  const summaryMatch = pathname.match(new RegExp(`/(?:${currentYear})/summary$`));
  if (summaryMatch) return buildSetupHref(nextYear, `/${currentYear}/summary`);

  const monthMatch = pathname.match(new RegExp(`/(?:${currentYear})/(\\d+)$`));
  if (monthMatch) return buildSetupHref(nextYear, `/${currentYear}/${monthMatch[1]}`);

  return buildSetupHref(nextYear, buildReturnPathFromView(currentYear, currentMonth, view));
}
