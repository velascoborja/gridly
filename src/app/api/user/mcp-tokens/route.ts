import { getSessionUser } from "@/lib/server/session";
import { createMcpTokenForUser, listMcpTokensForUser } from "@/lib/server/mcp-tokens";
import { normalizeMcpTokenName } from "@/lib/mcp-tokens";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  return Response.json(await listMcpTokensForUser(user.id), { headers: NO_STORE });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }

  const body = await request.json().catch(() => null);
  const name = normalizeMcpTokenName(body?.name);
  if (!name) {
    return Response.json({ error: "invalidName" }, { status: 400, headers: NO_STORE });
  }

  const result = await createMcpTokenForUser(user.id, name);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 409, headers: NO_STORE });
  }

  return Response.json({ token: result.token, ...result.summary }, { status: 201, headers: NO_STORE });
}
