import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const collection = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
const item = readFileSync(new URL("./[tokenId]/route.ts", import.meta.url), "utf8");

test("MCP token management requires a signed-in session", () => {
  for (const source of [collection, item]) {
    assert.match(source, /getSessionUser/);
    assert.match(source, /status: 401/);
  }
  assert.match(collection, /export async function GET/);
  assert.match(collection, /export async function POST/);
  assert.match(item, /export async function DELETE/);
});

test("MCP token creation validates the name, enforces the limit and is never cached", () => {
  assert.match(collection, /normalizeMcpTokenName/);
  assert.match(collection, /status: 400/);
  assert.match(collection, /status: 409/);
  assert.match(collection, /status: 201/);
  assert.match(collection, /"Cache-Control": "no-store"/);
});

test("MCP token revocation validates the id and scopes to the user", () => {
  assert.match(item, /Number\.isInteger\(id\) && id > 0|!Number\.isInteger\(id\) \|\| id <= 0/);
  assert.match(item, /revokeMcpTokenForUser\(user\.id, id\)/);
  assert.match(item, /status: 404/);
  assert.match(item, /status: 204/);
});
