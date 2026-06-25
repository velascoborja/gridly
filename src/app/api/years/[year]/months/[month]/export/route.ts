import { getDatabase } from "@/db";
import { users } from "@/db/schema";
import { buildMonthlyMarkdown } from "@/lib/monthly-markdown-export";
import { getYearData } from "@/lib/server/year-data";
import { getSessionUser } from "@/lib/server/session";
import { formatMonthName } from "@/lib/utils";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ year: string; month: string }> }
) {
  const db = getDatabase();
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year, month } = await params;
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  if (!Number.isInteger(yearNum) || !Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
    return Response.json({ error: "Month not found" }, { status: 404 });
  }

  const yearData = await getYearData(user.id, yearNum);
  const monthData = yearData?.months.find((item) => item.month === monthNum);
  if (!yearData || !monthData) {
    return Response.json({ error: "Month not found" }, { status: 404 });
  }

  const userRow = await db.query.users.findFirst({
    columns: { language: true },
    where: eq(users.id, user.id),
  });
  const locale = userRow?.language === "en" ? "en" : "es";

  const markdown = buildMonthlyMarkdown(yearData, monthNum, locale);
  const monthName = formatMonthName(monthNum, locale).toLowerCase();

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="gridly-${yearNum}-${monthName}.md"`,
    },
  });
}
