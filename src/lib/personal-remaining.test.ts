import test from "node:test";
import assert from "node:assert/strict";
import { isPersonalRemainingValid, personalRemainingConflicts } from "./personal-remaining.ts";

for (const [budget, remaining, valid] of [
  [0, 0, true], [100, 0, true], [100, 50, true], [100, 100, true],
  [0, 1, false], [100, 101, false], [100, -1, false], [-1, 0, false],
  [Infinity, 0, false], [100, Infinity, false], [NaN, 0, false], [100, NaN, false],
  [null, 0, false], [100, null, false], ["100", 10, false], [100, "10", false],
] as const) {
  test(`budget ${budget}, remaining ${remaining}: ${valid}`, () => {
    assert.equal(isPersonalRemainingValid(budget, remaining), valid);
  });
}

test("annual conflicts include every invalid affected month and exclude earlier months", () => {
  const months = [{ month: 1, personalRemaining: 900 }, { month: 6, personalRemaining: 100 },
    { month: 12, personalRemaining: 101 }, { month: 8, personalRemaining: -10 }];
  assert.deepEqual(personalRemainingConflicts(months, 100, 6), [8, 12]);
  assert.deepEqual(personalRemainingConflicts(months, 0, 12), [12]);
  assert.deepEqual(personalRemainingConflicts(months, 1000, 9), []);
});
