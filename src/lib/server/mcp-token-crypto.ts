import { createHash, randomBytes } from "node:crypto";
import { MCP_TOKEN_PREFIX } from "../mcp-tokens.ts";

export function generateMcpToken(): string {
  return MCP_TOKEN_PREFIX + randomBytes(32).toString("base64url");
}

// Tokens are 256-bit random values, so a plain SHA-256 digest is enough to store
// them safely and look them up by hash without keeping the plaintext.
export function hashMcpToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
