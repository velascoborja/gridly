import assert from "node:assert/strict";
import test from "node:test";
import {
  clearExpectedEntriesStorage,
  getExpectedEntriesStorageKey,
  getUserExpectedEntriesNamespace,
} from "./expected-entries-storage.ts";

function createStorage(initial: Record<string, string>): Storage {
  const values = new Map(Object.entries(initial));

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

test("expected entries keys are isolated by account and demo namespace", () => {
  const firstUser = getUserExpectedEntriesNamespace("user-1");
  const secondUser = getUserExpectedEntriesNamespace("user-2");

  assert.equal(getExpectedEntriesStorageKey(firstUser, 2026), "expected_entries_11:user:user-1_2026");
  assert.notEqual(
    getExpectedEntriesStorageKey(firstUser, 2026),
    getExpectedEntriesStorageKey(secondUser, 2026)
  );
  assert.notEqual(
    getExpectedEntriesStorageKey(firstUser, 2026),
    getExpectedEntriesStorageKey("demo", 2026)
  );
});

test("cleanup removes one account's entries and unsafe legacy keys only", () => {
  const firstUserKey2025 = getExpectedEntriesStorageKey(
    getUserExpectedEntriesNamespace("user-1"),
    2025
  );
  const firstUserKey2026 = getExpectedEntriesStorageKey(
    getUserExpectedEntriesNamespace("user-1"),
    2026
  );
  const secondUserKey = getExpectedEntriesStorageKey(
    getUserExpectedEntriesNamespace("user-2"),
    2026
  );
  const prefixCollisionKey = getExpectedEntriesStorageKey(
    getUserExpectedEntriesNamespace("user-1_archive"),
    2026
  );
  const demoKey = getExpectedEntriesStorageKey("demo", 2026);
  const storage = createStorage({
    [firstUserKey2025]: "first",
    [firstUserKey2026]: "first",
    [secondUserKey]: "second",
    [prefixCollisionKey]: "prefix-collision",
    [demoKey]: "demo",
    "expected_entries_2026": "legacy",
    "unrelated_key": "keep",
  });

  clearExpectedEntriesStorage(storage, getUserExpectedEntriesNamespace("user-1"));

  assert.equal(storage.getItem(firstUserKey2025), null);
  assert.equal(storage.getItem(firstUserKey2026), null);
  assert.equal(storage.getItem("expected_entries_2026"), null);
  assert.equal(storage.getItem(secondUserKey), "second");
  assert.equal(storage.getItem(prefixCollisionKey), "prefix-collision");
  assert.equal(storage.getItem(demoKey), "demo");
  assert.equal(storage.getItem("unrelated_key"), "keep");
});
