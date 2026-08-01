import test from "node:test";
import assert from "node:assert/strict";
import {
  propagateVersionedCarryOver,
  type CarryOverStore,
  type CarryOverSnapshot,
} from "./year-carry-over-engine.ts";

class FakeCarryOverStore implements CarryOverStore {
  readonly years: number[];
  readonly versions = new Map<number, number>();
  readonly startingBalances = new Map<number, number>();
  readonly annualDeltas = new Map<number, number>();
  updateAttempts = 0;
  beforeFirstUpdate?: () => void;
  alwaysConflict = false;

  constructor(years: number[]) {
    this.years = years;
    for (const year of years) {
      this.versions.set(year, 0);
      this.startingBalances.set(year, 0);
      this.annualDeltas.set(year, 0);
    }
  }

  async listYears() {
    return [...this.years];
  }

  async bumpVersion(year: number) {
    const version = this.versions.get(year);
    if (version === undefined) return false;
    this.versions.set(year, version + 1);
    return true;
  }

  async getSnapshot(year: number): Promise<CarryOverSnapshot | null> {
    const version = this.versions.get(year);
    const startingBalance = this.startingBalances.get(year);
    const annualDelta = this.annualDeltas.get(year);
    if (version === undefined || startingBalance === undefined || annualDelta === undefined) return null;

    return {
      year,
      version,
      nextStartingBalance: startingBalance + annualDelta,
    };
  }

  async updateStartingBalance(input: {
    year: number;
    startingBalance: number;
    predecessorYear: number;
    predecessorVersion: number;
  }) {
    this.updateAttempts += 1;
    if (this.updateAttempts === 1) this.beforeFirstUpdate?.();

    if (
      this.alwaysConflict ||
      this.versions.get(input.predecessorYear) !== input.predecessorVersion
    ) {
      return false;
    }

    const targetVersion = this.versions.get(input.year);
    if (targetVersion === undefined) return false;
    this.startingBalances.set(input.year, input.startingBalance);
    this.versions.set(input.year, targetVersion + 1);
    return true;
  }
}

test("versioned propagation carries the recalculated balance through every downstream year", async () => {
  const store = new FakeCarryOverStore([2024, 2025, 2026]);
  store.startingBalances.set(2024, 100);
  store.annualDeltas.set(2024, 900);
  store.annualDeltas.set(2025, 200);

  await propagateVersionedCarryOver(store, 2024);

  assert.equal(store.startingBalances.get(2025), 1000);
  assert.equal(store.startingBalances.get(2026), 1200);
});

test("a stale propagation is rejected and retries from the newest predecessor snapshot", async () => {
  const store = new FakeCarryOverStore([2024, 2025]);
  store.annualDeltas.set(2024, 1000);
  store.beforeFirstUpdate = () => {
    store.annualDeltas.set(2024, 1500);
    store.versions.set(2024, (store.versions.get(2024) ?? 0) + 1);
  };

  await propagateVersionedCarryOver(store, 2024);

  assert.equal(store.updateAttempts, 2);
  assert.equal(store.startingBalances.get(2025), 1500);
});

test("persistent contention fails instead of reporting a stale propagation as successful", async () => {
  const store = new FakeCarryOverStore([2024, 2025]);
  store.alwaysConflict = true;

  await assert.rejects(
    propagateVersionedCarryOver(store, 2024, 3),
    /Carry-over changed during propagation/,
  );
  assert.equal(store.updateAttempts, 3);
});
