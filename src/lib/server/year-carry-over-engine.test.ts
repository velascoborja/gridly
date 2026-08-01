import test from "node:test";
import assert from "node:assert/strict";
import {
  propagateVersionedCarryOver,
  type CarryOverSnapshot,
  type CarryOverStore,
  type CarryOverYearVersion,
} from "./year-carry-over-engine.ts";

type MaybeAsyncCallback<T> = (input: T) => void | Promise<void>;

class FakeCarryOverStore implements CarryOverStore {
  readonly years: number[];
  readonly versions = new Map<number, number>();
  readonly startingBalances = new Map<number, number>();
  readonly annualDeltas = new Map<number, number>();
  readonly snapshotRequests: number[] = [];
  readonly snapshotUnavailableYears = new Set<number>();
  readonly successfulUpdates: Array<{ year: number; startingBalance: number }> = [];
  listAttempts = 0;
  versionCasAttempts = 0;
  updateAttempts = 0;
  beforeVersionCas?: MaybeAsyncCallback<CarryOverYearVersion>;
  afterVersionCas?: MaybeAsyncCallback<CarryOverYearVersion>;
  beforeUpdate?: MaybeAsyncCallback<{
    year: number;
    startingBalance: number;
    expectedVersion: number;
  }>;
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
    this.listAttempts += 1;
    return this.years.flatMap((year) => {
      const version = this.versions.get(year);
      return version === undefined ? [] : [{ year, version }];
    });
  }

  async compareAndIncrementVersion(input: CarryOverYearVersion) {
    this.versionCasAttempts += 1;
    await this.beforeVersionCas?.(input);

    const currentVersion = this.versions.get(input.year);
    if (currentVersion === undefined || currentVersion !== input.version) {
      return null;
    }

    const incrementedVersion = currentVersion + 1;
    this.versions.set(input.year, incrementedVersion);
    await this.afterVersionCas?.({
      year: input.year,
      version: incrementedVersion,
    });
    return incrementedVersion;
  }

  async getSnapshot(year: number): Promise<CarryOverSnapshot | null> {
    this.snapshotRequests.push(year);
    if (this.snapshotUnavailableYears.has(year)) return null;

    const version = this.versions.get(year);
    const startingBalance = this.startingBalances.get(year);
    const annualDelta = this.annualDeltas.get(year);
    if (
      version === undefined ||
      startingBalance === undefined ||
      annualDelta === undefined
    ) {
      return null;
    }

    return {
      year,
      version,
      nextStartingBalance: startingBalance + annualDelta,
    };
  }

  async updateStartingBalance(input: {
    year: number;
    startingBalance: number;
    expectedVersion: number;
  }) {
    this.updateAttempts += 1;
    await this.beforeUpdate?.(input);

    const currentVersion = this.versions.get(input.year);
    if (
      this.alwaysConflict ||
      currentVersion === undefined ||
      currentVersion !== input.expectedVersion
    ) {
      return null;
    }

    this.startingBalances.set(input.year, input.startingBalance);
    const incrementedVersion = currentVersion + 1;
    this.versions.set(input.year, incrementedVersion);
    this.successfulUpdates.push({
      year: input.year,
      startingBalance: input.startingBalance,
    });
    return incrementedVersion;
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
  assert.deepEqual(store.snapshotRequests, [2024, 2025]);
});

test("a source CAS conflict reloads the whole chain before propagating", async () => {
  const store = new FakeCarryOverStore([2024, 2025]);
  store.annualDeltas.set(2024, 1200);
  let conflictInjected = false;
  store.beforeVersionCas = ({ year, version }) => {
    if (conflictInjected) return;
    conflictInjected = true;
    store.versions.set(year, version + 1);
  };

  await propagateVersionedCarryOver(store, 2024);

  assert.equal(store.listAttempts, 2);
  assert.equal(store.versionCasAttempts, 2);
  assert.equal(store.startingBalances.get(2025), 1200);
});

test("a source change after its CAS invalidates the stale snapshot", async () => {
  const store = new FakeCarryOverStore([2024, 2025]);
  store.annualDeltas.set(2024, 1400);
  let conflictInjected = false;
  store.afterVersionCas = ({ year, version }) => {
    if (conflictInjected) return;
    conflictInjected = true;
    store.versions.set(year, version + 1);
  };

  await propagateVersionedCarryOver(store, 2024);

  assert.equal(store.listAttempts, 2);
  assert.deepEqual(store.snapshotRequests, [2024, 2024]);
  assert.equal(store.startingBalances.get(2025), 1400);
});

test("a target CAS conflict reloads and recomputes the whole chain", async () => {
  const store = new FakeCarryOverStore([2024, 2025, 2026]);
  store.annualDeltas.set(2024, 1000);
  store.annualDeltas.set(2025, 200);
  let conflictInjected = false;
  store.beforeUpdate = ({ year, expectedVersion }) => {
    if (conflictInjected || year !== 2025) return;
    conflictInjected = true;
    store.versions.set(year, expectedVersion + 1);
  };

  await propagateVersionedCarryOver(store, 2024);

  assert.equal(store.listAttempts, 2);
  assert.equal(store.updateAttempts, 3);
  assert.equal(store.startingBalances.get(2025), 1000);
  assert.equal(store.startingBalances.get(2026), 1200);
});

test("a newer propagation that writes first cannot be overwritten by an older one", async () => {
  const store = new FakeCarryOverStore([2024, 2025]);
  store.annualDeltas.set(2024, 1000);
  store.beforeUpdate = async () => {
    store.beforeUpdate = undefined;
    store.annualDeltas.set(2024, 1500);
    await propagateVersionedCarryOver(store, 2024);
  };

  await propagateVersionedCarryOver(store, 2024);

  assert.equal(store.startingBalances.get(2025), 1500);
  assert.deepEqual(
    store.successfulUpdates.map(({ startingBalance }) => startingBalance),
    [1500, 1500],
  );
});

test("a chain without downstream years does not read snapshots or increment versions", async () => {
  const store = new FakeCarryOverStore([2024]);

  await propagateVersionedCarryOver(store, 2024);

  assert.equal(store.versions.get(2024), 0);
  assert.equal(store.versionCasAttempts, 0);
  assert.deepEqual(store.snapshotRequests, []);
});

test("the last target is updated without requesting its snapshot", async () => {
  const store = new FakeCarryOverStore([2024, 2025]);
  store.annualDeltas.set(2024, 900);
  store.snapshotUnavailableYears.add(2025);

  await propagateVersionedCarryOver(store, 2024);

  assert.equal(store.startingBalances.get(2025), 900);
  assert.deepEqual(store.snapshotRequests, [2024]);
});

test("persistent contention fails instead of reporting a stale propagation as successful", async () => {
  const store = new FakeCarryOverStore([2024, 2025]);
  store.alwaysConflict = true;

  await assert.rejects(
    propagateVersionedCarryOver(store, 2024, 3),
    /Carry-over changed during propagation/,
  );
  assert.equal(store.listAttempts, 3);
  assert.equal(store.updateAttempts, 3);
});
