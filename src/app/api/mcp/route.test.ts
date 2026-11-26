import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
const server = readFileSync(new URL("../../../lib/server/mcp-server.ts", import.meta.url), "utf8");
const tokens = readFileSync(new URL("../../../lib/server/mcp-tokens.ts", import.meta.url), "utf8");

test("MCP route authenticates every request with a bearer token before building the server", () => {
  const authIndex = route.indexOf("authenticateMcpRequest(request.headers)");
  const serverIndex = route.indexOf("createGridlyMcpServer(userId)");
  assert.ok(authIndex >= 0);
  assert.ok(serverIndex > authIndex);
  assert.match(route, /401/);
  assert.match(route, /WWW-Authenticate/);
  assert.doesNotMatch(route, /getSessionUser/, "MCP clients authenticate with tokens, not cookies");
});

test("MCP route runs the Streamable HTTP transport statelessly and never caches responses", () => {
  assert.match(route, /WebStandardStreamableHTTPServerTransport/);
  assert.match(route, /sessionIdGenerator: undefined/);
  assert.match(route, /enableJsonResponse: true/);
  assert.match(route, /Cache-Control", "no-store"/);
  assert.match(route, /server\.close\(\)/);
  assert.match(route, /export const GET = methodNotAllowed/);
  assert.match(route, /export const DELETE = methodNotAllowed/);
});

test("MCP server registers only read-only tools", () => {
  const registrations = server.match(/server\.registerTool\(/g) ?? [];
  const readOnly = server.match(/annotations: READ_ONLY/g) ?? [];
  assert.ok(registrations.length >= 6);
  assert.equal(readOnly.length, registrations.length);
  assert.match(server, /readOnlyHint: true/);
  assert.doesNotMatch(server, /\.(insert|update|delete)\(/, "phase 1 tools must not write data");
  assert.doesNotMatch(server, /withFinancialTransaction/);
});

test("MCP server scopes every query to the token owner", () => {
  assert.match(server, /createGridlyMcpServer\(userId: string\)/);
  assert.match(server, /eq\(tags\.userId, userId\)/);
  assert.doesNotMatch(server, /getAllYearDataForUser\(\)/);
});

test("MCP tokens are stored only as hashes and resolved by hash", () => {
  assert.match(tokens, /tokenHash: hashMcpToken\(token\)/);
  assert.match(tokens, /eq\(mcpTokens\.tokenHash, hashMcpToken\(token\)\)/);
  assert.doesNotMatch(tokens, /token: token|\btoken,\s*\n\s*tokenHash/);
  assert.match(tokens, /MCP_TOKENS_PER_USER_LIMIT/);
  assert.match(tokens, /and\(eq\(mcpTokens\.id, tokenId\), eq\(mcpTokens\.userId, userId\)\)/);
});
