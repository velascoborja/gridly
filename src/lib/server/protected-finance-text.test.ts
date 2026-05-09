import test from "node:test";
import assert from "node:assert/strict";
import {
  parseProtectedAdditionalEntry,
  parseProtectedMonthlyRecurringExpense,
  parseProtectedYearRecurringExpense,
  protectFreeTextLabel,
  revealFreeTextLabel,
} from "./protected-finance-text.ts";
import { isProtectedFieldCiphertext } from "./protected-fields.ts";

const fieldKey = Buffer.alloc(32, 7).toString("base64");
const hashKey = Buffer.alloc(32, 13).toString("base64");

test.beforeEach(() => {
  process.env.GRIDLY_FIELD_ENCRYPTION_KEY = fieldKey;
  process.env.GRIDLY_EMAIL_HASH_KEY = hashKey;
  process.env.GRIDLY_ALLOW_PLAINTEXT_PROTECTED_FIELDS = "0";
});

test("protectFreeTextLabel trims and encrypts labels", () => {
  const protectedLabel = protectFreeTextLabel("  Gym  ");

  assert.equal(isProtectedFieldCiphertext(protectedLabel), true);
  assert.equal(revealFreeTextLabel(protectedLabel), "Gym");
});

test("protected parsers decrypt labels and preserve numeric conversion", () => {
  const label = protectFreeTextLabel("Rent");

  assert.deepEqual(
    parseProtectedAdditionalEntry({
      id: 1,
      monthId: 2,
      type: "expense",
      label,
      amount: "1200.50",
    }),
    {
      id: 1,
      monthId: 2,
      type: "expense",
      label: "Rent",
      amount: 1200.5,
    }
  );

  assert.equal(
    parseProtectedYearRecurringExpense({
      id: 3,
      yearId: 4,
      label,
      amount: "40",
      sortOrder: 1,
    }).label,
    "Rent"
  );

  assert.equal(
    parseProtectedMonthlyRecurringExpense({
      id: 5,
      monthId: 6,
      yearRecurringExpenseId: 3,
      label,
      amount: "40",
      sortOrder: 1,
    }).label,
    "Rent"
  );
});
