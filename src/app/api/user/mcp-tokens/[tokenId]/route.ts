import { getSessionUser } from "@/lib/server/session";
import { revokeMcpTokenForUser } from "@/lib/server/mcp-tokens";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const user = await getSessionUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tokenId } = await params;
  const id = Number(tokenId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid token id" }, { status: 400 });
  }

  const revoked = await revokeMcpTokenForUser(user.id, id);
  if (!revoked) {
    return Response.json({ error: "Token not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
