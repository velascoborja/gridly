import { createHistoricalYearForUser, getHistoricalYearsForUser } from "@/lib/server/historical-years";
import { getSessionUser } from "@/lib/server/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getHistoricalYearsForUser(user.id);
  return Response.json(rows);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await createHistoricalYearForUser(user.id, await request.json());
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result.historicalYear, { status: 201 });
}
