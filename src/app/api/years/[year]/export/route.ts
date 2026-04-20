import { buildWorkbook } from "@/lib/export";
import { getDatabase } from "@/db";
import { users } from "@/db/schema";
import { getYearData } from "@/lib/server/year-data";
import { getSessionUser } from "@/lib/server/session";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const db = getDatabase();
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year } = await params;
  const yearNum = parseInt(year, 10);

  const yearData = await getYearData(user.id, yearNum);
  if (!yearData) return Response.json({ error: "Year not found" }, { status: 404 });

  const userRow = await db.query.users.findFirst({
    columns: { language: true },
    where: eq(users.id, user.id),
  });
  const locale = userRow?.language === "en" ? "en" : "es";

  const buffer = await buildWorkbook(yearData, locale);

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.spreadsheetml",
      "Content-Disposition": `attachment; filename="gridly-${yearNum}.xlsx"`,
    },
  });
}
