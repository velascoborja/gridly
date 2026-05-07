import { deleteHistoricalYearForUser, updateHistoricalYearForUser } from "@/lib/server/historical-years";
import { getSessionUser } from "@/lib/server/session";

function parseRouteId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsedId = parseRouteId(id);
  if (parsedId === null) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const result = await updateHistoricalYearForUser(user.id, parsedId, await request.json());
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(result.historicalYear);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsedId = parseRouteId(id);
  if (parsedId === null) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const result = await deleteHistoricalYearForUser(user.id, parsedId);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ ok: true });
}
