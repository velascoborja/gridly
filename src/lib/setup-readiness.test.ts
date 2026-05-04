import test from "node:test";
import assert from "node:assert/strict";

import { hasSetupFieldValue } from "./setup-readiness.ts";

test("setup field readiness treats zero as an entered value", () => {
  assert.equal(hasSetupFieldValue("0"), true);
  assert.equal(hasSetupFieldValue("0 €"), true);
  assert.equal(hasSetupFieldValue(" 0 "), true);
});

test("setup field readiness treats empty or whitespace-only values as missing", () => {
  assert.equal(hasSetupFieldValue(""), false);
  assert.equal(hasSetupFieldValue("   "), false);
});
