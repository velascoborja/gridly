import { computeFixedStats, mergeFixedStatsByYear } from "@/lib/fixed-stats";
import { getAllYearDataForUser, getYearData } from "@/lib/server/year-data";
import { getSessionUser } from "@/lib/server/session";
import { computeTagStats, mergeTagStatsByYear } from "@/lib/tag-stats";
import type { YearData } from "@/lib/types";

const responseInit = {
  headers: { "Cache-Control": "private, no-store" },
};

function buildDrilldown(kind: "tags" | "fixed", years: YearData[]) {
  if (kind === "tags") {
    return mergeTagStatsByYear(
      years
        .map((yearData) => ({ year: yearData.config.year, stats: computeTagStats(yearData) }))
        .filter(({ stats }) => stats.totalAdditional > 0),
    );
  }

  return mergeFixedStatsByYear(
    years
      .map((yearData) => ({ year: yearData.config.year, stats: computeFixedStats(yearData) }))
      .filter(({ stats }) => stats.grandTotal > 0),
  );
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401, ...responseInit });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const yearParam = searchParams.get("year");
  const includeFuture = searchParams.get("includeFuture") === "true";

  if ((kind !== "tags" && kind !== "fixed") || yearParam === null) {
    return Response.json({ error: "Invalid drilldown parameters" }, { status: 400, ...responseInit });
  }

  if (yearParam === "all") {
    const yearData = await getAllYearDataForUser(
      user.id,
      includeFuture ? {} : { maxYear: new Date().getFullYear() },
    );
    return Response.json(
      { kind, year: null, stats: buildDrilldown(kind, yearData) },
      responseInit,
    );
  }

  const year = Number(yearParam);
  if (!Number.isInteger(year) || (!includeFuture && year > new Date().getFullYear())) {
    return Response.json({ error: "Year not found" }, { status: 404, ...responseInit });
  }

  const yearData = await getYearData(user.id, year);
  if (!yearData) {
    return Response.json({ error: "Year not found" }, { status: 404, ...responseInit });
  }

  const stats = kind === "tags" ? computeTagStats(yearData) : computeFixedStats(yearData);
  return Response.json({ kind, year, stats }, responseInit);
}
