import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { deriveEvolutionMetrics, summarizeEvolutionMetrics } from "@/lib/evolution";
import {
  describeEvolutionMetric,
  describeMonth,
  filterYearEntries,
  sumEntries,
  summarizeYear,
} from "@/lib/mcp-tool-data";
import { round2 } from "@/lib/calculations";
import { getEvolutionSourcesForUser, getHistoricalYearsForUser } from "./historical-years";
import { getYearData, getYearsForUser } from "./year-data";

const SERVER_INSTRUCTIONS = [
  "Gridly is a personal finance tracker. Every tool is read-only and scoped to the account that owns the access token.",
  "Amounts are euros (EUR). Rates (savingsRate, annualInterestRate) are fractions: 0.25 means 25%.",
  "A Gridly year has 12 months. Each month's startingBalance is the previous month's endingBalance; savings = totalIncome - totalExpenses.",
  "June and December can include an additionalPayslip (Spanish extra pay). Historical years are summary-only imports without monthly detail.",
  "Call list_years first when you don't know which years exist.",
].join(" ");

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false } as const;

const yearSchema = z.number().int().min(1900).max(2200).describe("Calendar year, e.g. 2026");
const monthSchema = z.number().int().min(1).max(12).describe("Month number, 1 = January … 12 = December");

function json(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}

function notFound(message: string) {
  return { isError: true, content: [{ type: "text" as const, text: message }] };
}

export function createGridlyMcpServer(userId: string) {
  const server = new McpServer(
    { name: "gridly", version: "1.0.0" },
    { instructions: SERVER_INSTRUCTIONS }
  );

  server.registerTool(
    "list_years",
    {
      title: "List years",
      description: "List the years tracked month by month in Gridly and the summary-only historical years.",
      annotations: READ_ONLY,
    },
    async () => {
      const [gridlyYears, historical] = await Promise.all([
        getYearsForUser(userId),
        getHistoricalYearsForUser(userId),
      ]);
      return json({ gridlyYears, historicalYears: historical.map((row) => row.year) });
    }
  );

  server.registerTool(
    "get_year_summary",
    {
      title: "Get year summary",
      description:
        "Annual totals for a Gridly year (income, expenses, savings, savings rate, investment, interests, balances), its configuration, and a per-month overview.",
      inputSchema: { year: yearSchema },
      annotations: READ_ONLY,
    },
    async ({ year }) => {
      const yearData = await getYearData(userId, year);
      if (!yearData) return notFound(`No Gridly year ${year}. Use list_years to see the available years.`);
      return json(summarizeYear(yearData));
    }
  );

  server.registerTool(
    "get_month",
    {
      title: "Get month",
      description:
        "Full detail of one month: balances, payslips, interests, fixed expenses, recurring expenses, and every additional income and expense with its tag and group.",
      inputSchema: { year: yearSchema, month: monthSchema },
      annotations: READ_ONLY,
    },
    async ({ year, month }) => {
      const yearData = await getYearData(userId, year);
      const monthData = yearData?.months.find((m) => m.month === month);
      if (!yearData || !monthData) return notFound(`No data for ${year}-${String(month).padStart(2, "0")}.`);
      return json(describeMonth(year, monthData));
    }
  );

  server.registerTool(
    "list_entries",
    {
      title: "List entries",
      description:
        "List additional incomes, additional expenses and recurring expenses of a year, optionally filtered by month, type, tag name or text in the label or group. Returns the matching entries and their totals.",
      inputSchema: {
        year: yearSchema,
        month: monthSchema.optional(),
        type: z.enum(["income", "expense"]).optional(),
        tag: z.string().trim().min(1).max(100).optional().describe("Exact tag name, case and accent insensitive"),
        search: z.string().trim().min(1).max(100).optional().describe("Text contained in the entry label or group name"),
      },
      annotations: READ_ONLY,
    },
    async ({ year, ...filter }) => {
      const yearData = await getYearData(userId, year);
      if (!yearData) return notFound(`No Gridly year ${year}. Use list_years to see the available years.`);
      const entries = filterYearEntries(yearData, filter);
      return json({ year, filter, totals: sumEntries(entries), entries });
    }
  );

  server.registerTool(
    "list_tags",
    {
      title: "List tags",
      description: "List the tags the user can assign to expenses.",
      annotations: READ_ONLY,
    },
    async () => {
      const rows = await db
        .select({ id: tags.id, name: tags.name, color: tags.color })
        .from(tags)
        .where(eq(tags.userId, userId))
        .orderBy(asc(tags.name));
      return json(rows);
    }
  );

  server.registerTool(
    "get_evolution",
    {
      title: "Get evolution",
      description:
        "Multi-year evolution: per-year balances, savings, savings rate, investment and interests (Gridly and historical years), plus overall totals.",
      annotations: READ_ONLY,
    },
    async () => {
      const metrics = deriveEvolutionMetrics(await getEvolutionSourcesForUser(userId));
      if (metrics.length === 0) return json({ years: [], summary: null });
      const summary = summarizeEvolutionMetrics(metrics);
      return json({
        years: metrics.map(describeEvolutionMetric),
        summary: {
          latestFinalBalance: round2(summary.latestFinalBalance),
          totalSaved: round2(summary.totalSaved),
          averageSavingsPerYear: round2(summary.averageSavingsPerYear),
          averageSavingsRate:
            summary.averageSavingsRate === null ? null : Number(summary.averageSavingsRate.toFixed(4)),
          accumulatedInvested: round2(summary.accumulatedInvested),
          totalInterestsEarned: round2(summary.totalInterestsEarned),
        },
      });
    }
  );

  return server;
}
