import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const routeSource = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
const groupRowSource = readFileSync(
  new URL("../../../../../components/monthly/additional-entry-group-row.tsx", import.meta.url),
  "utf8"
);

test("entries POST route reads groupId from the request body", () => {
  assert.match(routeSource, /const \{ type, label, amount, groupId/);
});

test("entries POST route persists groupId to the database insert", () => {
  assert.match(routeSource, /groupId: groupId \?\? null/);
});

test("group row add-entry handler sends groupId in the POST body", () => {
  assert.match(
    groupRowSource,
    /body: JSON\.stringify\(\{ type: "expense", label: newLabel\.trim\(\), amount, groupId: group\.id \}\)/
  );
});

test("entries POST route reads isRecurring from the request body", () => {
  assert.match(routeSource, /isRecurring/);
});

test("entries POST route persists isRecurring in the database insert", () => {
  assert.match(routeSource, /isRecurring: isRecurring/);
});

test("entries POST route uses group tagId when groupId is provided", () => {
  assert.match(routeSource, /group\.tagId/);
});
