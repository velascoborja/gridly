import test from "node:test";
import assert from "node:assert/strict";
import {
  MCP_TOKEN_NAME_MAX_LENGTH,
  MCP_TOKEN_PREFIX,
  isWellFormedMcpToken,
  mcpTokenDisplayPrefix,
  normalizeMcpTokenName,
  parseBearerToken,
} from "./mcp-tokens.ts";
import { generateMcpToken, hashMcpToken } from "./server/mcp-token-crypto.ts";

test("generated MCP tokens are prefixed, well formed and unique", () => {
  const a = generateMcpToken();
  const b = generateMcpToken();
  assert.ok(a.startsWith(MCP_TOKEN_PREFIX));
  assert.ok(isWellFormedMcpToken(a));
  assert.notEqual(a, b);
});

test("token hashes are deterministic SHA-256 hex digests that differ from the token", () => {
  const token = generateMcpToken();
  const hash = hashMcpToken(token);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(hash, hashMcpToken(token));
  assert.notEqual(hash, hashMcpToken(generateMcpToken()));
  assert.ok(!hash.includes(token.slice(MCP_TOKEN_PREFIX.length)));
});

test("display prefix exposes only the fixed prefix and four characters", () => {
  const token = generateMcpToken();
  assert.equal(mcpTokenDisplayPrefix(token), token.slice(0, MCP_TOKEN_PREFIX.length + 4));
});

test("parseBearerToken accepts only well-formed Gridly bearer tokens", () => {
  const token = generateMcpToken();
  assert.equal(parseBearerToken(`Bearer ${token}`), token);
  assert.equal(parseBearerToken(`bearer ${token}`), token);
  assert.equal(parseBearerToken(null), null);
  assert.equal(parseBearerToken(""), null);
  assert.equal(parseBearerToken(token), null);
  assert.equal(parseBearerToken(`Basic ${token}`), null);
  assert.equal(parseBearerToken("Bearer not-a-gridly-token"), null);
  assert.equal(parseBearerToken(`Bearer ${token}x`), null);
  assert.equal(parseBearerToken(`Bearer ${token} extra`), null);
});

test("normalizeMcpTokenName trims and enforces length", () => {
  assert.equal(normalizeMcpTokenName("  Claude  "), "Claude");
  assert.equal(normalizeMcpTokenName("   "), null);
  assert.equal(normalizeMcpTokenName(42), null);
  assert.equal(normalizeMcpTokenName("x".repeat(MCP_TOKEN_NAME_MAX_LENGTH)), "x".repeat(MCP_TOKEN_NAME_MAX_LENGTH));
  assert.equal(normalizeMcpTokenName("x".repeat(MCP_TOKEN_NAME_MAX_LENGTH + 1)), null);
});
