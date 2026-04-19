import { buildWorkbook } from "@/lib/export";
import { getYearData } from "@/lib/server/year-data";
import { getSessionUser } from "@/lib/server/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { year } = await params;
  const yearNum = parseInt(year, 10);

  const yearData = await getYearData(user.id, yearNum);
  if (!yearData) return Response.json({ error: "Year not found" }, { status: 404 });

  const buffer = await buildWorkbook(yearData);

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.spreadsheetml",
      "Content-Disposition": `attachment; filename="gridly-${yearNum}.xlsx"`,
    },
  });
}
