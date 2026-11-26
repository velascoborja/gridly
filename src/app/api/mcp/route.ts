import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticateMcpRequest } from "@/lib/server/mcp-tokens";
import { createGridlyMcpServer } from "@/lib/server/mcp-server";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function jsonRpcError(status: number, message: string, headers: Record<string, string> = {}) {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32000, message }, id: null },
    { status, headers: { ...NO_STORE, ...headers } }
  );
}

export async function POST(request: Request) {
  const userId = await authenticateMcpRequest(request.headers);
  if (!userId) {
    return jsonRpcError(401, "Unauthorized", { "WWW-Authenticate": 'Bearer realm="gridly-mcp"' });
  }

  // Stateless mode: a fresh server and transport per request, so each serverless
  // invocation is independent and no session state is kept between calls.
  const server = createGridlyMcpServer(userId);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("MCP request failed:", error);
    return jsonRpcError(500, "Internal server error");
  } finally {
    await server.close();
  }
}

function methodNotAllowed() {
  return jsonRpcError(405, "Method not allowed", { Allow: "POST" });
}

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
