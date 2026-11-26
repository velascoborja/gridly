// Client-safe helpers. Token generation and hashing live in src/lib/server/mcp-token-crypto.ts.

export const MCP_TOKEN_PREFIX = "gridly_mcp_";
export const MCP_TOKEN_NAME_MAX_LENGTH = 60;
export const MCP_TOKENS_PER_USER_LIMIT = 10;

const TOKEN_BODY_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const DISPLAY_PREFIX_LENGTH = MCP_TOKEN_PREFIX.length + 4;

export function isWellFormedMcpToken(token: string): boolean {
  return token.startsWith(MCP_TOKEN_PREFIX) && TOKEN_BODY_PATTERN.test(token.slice(MCP_TOKEN_PREFIX.length));
}

export function mcpTokenDisplayPrefix(token: string): string {
  return token.slice(0, DISPLAY_PREFIX_LENGTH);
}

export function parseBearerToken(authorization: string | null | undefined): string | null {
  if (!authorization) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(authorization);
  if (!match) return null;
  return isWellFormedMcpToken(match[1]) ? match[1] : null;
}

export function normalizeMcpTokenName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (name.length === 0 || name.length > MCP_TOKEN_NAME_MAX_LENGTH) return null;
  return name;
}
