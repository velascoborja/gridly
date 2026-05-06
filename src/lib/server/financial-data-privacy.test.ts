import test from "node:test";
import assert from "node:assert/strict";
import {
  isProtectedFinancialValue,
  parseProtectedFinancialNumber,
  protectFinancialNumber,
  protectFinancialText,
  revealFinancialText,
} from "./financial-data-privacy.ts";

const keyName = "FINANCIAL_DATA_ENCRYPTION_KEY";

function withFinancialKey<T>(value: string | undefined, run: () => T): T {
  const previous = process.env[keyName];
  if (value === undefined) {
    delete process.env[keyName];
  } else {
    process.env[keyName] = value;
  }

  try {
    return run();
  } finally {
    if (previous === undefined) {
      delete process.env[keyName];
    } else {
      process.env[keyName] = previous;
    }
  }
}

test("financial values remain plaintext when no encryption key is configured", () => {
  withFinancialKey(undefined, () => {
    assert.equal(protectFinancialText("Rent"), "Rent");
    assert.equal(protectFinancialNumber(1234.56), "1234.56");
    assert.equal(parseProtectedFinancialNumber("1234.56"), 1234.56);
  });
});

test("financial text and numbers are encrypted and round-trip with a configured key", () => {
  withFinancialKey("test-key-that-is-long-enough-for-financial-data", () => {
    const label = protectFinancialText("Mortgage");
    const amount = protectFinancialNumber(987.65);

    assert.equal(isProtectedFinancialValue(label), true);
    assert.equal(isProtectedFinancialValue(amount), true);
    assert.notEqual(label, "Mortgage");
    assert.notEqual(amount, "987.65");
    assert.equal(revealFinancialText(label), "Mortgage");
    assert.equal(parseProtectedFinancialNumber(amount), 987.65);
  });
});

test("encrypted financial values require the key when they are read", () => {
  const encrypted = withFinancialKey("test-key-that-is-long-enough-for-financial-data", () =>
    protectFinancialNumber(42)
  );

  withFinancialKey(undefined, () => {
    assert.throws(
      () => parseProtectedFinancialNumber(encrypted),
      /FINANCIAL_DATA_ENCRYPTION_KEY is required/
    );
  });
});
