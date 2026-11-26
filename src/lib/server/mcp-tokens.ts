import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { mcpTokens } from "@/db/schema";
import { MCP_TOKENS_PER_USER_LIMIT, mcpTokenDisplayPrefix, parseBearerToken } from "@/lib/mcp-tokens";
import { generateMcpToken, hashMcpToken } from "./mcp-token-crypto";

export interface McpTokenSummary {
  id: number;
  name: string;
  tokenPrefix: string;
  createdAt: string | null;
  lastUsedAt: string | null;
}

function toSummary(row: typeof mcpTokens.$inferSelect): McpTokenSummary {
  return {
    id: row.id,
    name: row.name,
    tokenPrefix: row.tokenPrefix,
    createdAt: row.createdAt?.toISOString() ?? null,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
  };
}

export async function listMcpTokensForUser(userId: string): Promise<McpTokenSummary[]> {
  const rows = await db
    .select()
    .from(mcpTokens)
    .where(eq(mcpTokens.userId, userId))
    .orderBy(desc(mcpTokens.createdAt), desc(mcpTokens.id));
  return rows.map(toSummary);
}

export async function createMcpTokenForUser(userId: string, name: string) {
  const [{ value: existing }] = await db
    .select({ value: count() })
    .from(mcpTokens)
    .where(eq(mcpTokens.userId, userId));
  if (existing >= MCP_TOKENS_PER_USER_LIMIT) {
    return { ok: false as const, error: "tokenLimitReached" };
  }

  const token = generateMcpToken();
  const [row] = await db
    .insert(mcpTokens)
    .values({
      userId,
      name,
      tokenHash: hashMcpToken(token),
      tokenPrefix: mcpTokenDisplayPrefix(token),
    })
    .returning();

  // The plaintext token is returned once and never stored.
  return { ok: true as const, token, summary: toSummary(row) };
}

export async function revokeMcpTokenForUser(userId: string, tokenId: number) {
  const [row] = await db
    .delete(mcpTokens)
    .where(and(eq(mcpTokens.id, tokenId), eq(mcpTokens.userId, userId)))
    .returning({ id: mcpTokens.id });
  return row !== undefined;
}

export async function authenticateMcpRequest(authorization: string | null): Promise<string | null> {
  const token = parseBearerToken(authorization);
  if (!token) return null;

  const [row] = await db
    .update(mcpTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(mcpTokens.tokenHash, hashMcpToken(token)))
    .returning({ userId: mcpTokens.userId });

  return row?.userId ?? null;
}
