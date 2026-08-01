export interface CarryOverSnapshot {
  year: number;
  version: number;
  nextStartingBalance: number;
}

export interface CarryOverYearVersion {
  year: number;
  version: number;
}

export interface CarryOverStore {
  listYears(): Promise<CarryOverYearVersion[]>;
  compareAndIncrementVersion(input: CarryOverYearVersion): Promise<number | null>;
  getSnapshot(year: number): Promise<CarryOverSnapshot | null>;
  updateStartingBalance(input: {
    year: number;
    startingBalance: number;
    expectedVersion: number;
  }): Promise<number | null>;
}

export const DEFAULT_MAX_PROPAGATION_ATTEMPTS = 5;

export async function propagateVersionedCarryOver(
  store: CarryOverStore,
  startYear: number,
  maxAttempts = DEFAULT_MAX_PROPAGATION_ATTEMPTS,
) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const sortedYears = [...(await store.listYears())].sort(
      (a, b) => a.year - b.year,
    );
    const downstreamYears = sortedYears.filter(({ year }) => year > startYear);

    if (downstreamYears.length === 0) {
      return;
    }

    const startYearVersion = sortedYears.find(({ year }) => year === startYear);
    if (!startYearVersion) return;

    const incrementedStartVersion = await store.compareAndIncrementVersion(
      startYearVersion,
    );
    if (incrementedStartVersion === null) continue;

    let previousSnapshot = await store.getSnapshot(startYear);
    if (!previousSnapshot) {
      return;
    }
    if (previousSnapshot.version !== incrementedStartVersion) continue;

    let conflictDetected = false;

    for (const [index, target] of downstreamYears.entries()) {
      const updatedVersion = await store.updateStartingBalance({
        year: target.year,
        startingBalance: previousSnapshot.nextStartingBalance,
        expectedVersion: target.version,
      });

      if (updatedVersion === null) {
        conflictDetected = true;
        break;
      }

      if (index === downstreamYears.length - 1) return;

      previousSnapshot = await store.getSnapshot(target.year);
      if (!previousSnapshot) {
        return;
      }
      if (previousSnapshot.version !== updatedVersion) {
        conflictDetected = true;
        break;
      }
    }

    if (!conflictDetected) {
      return;
    }
  }

  throw new Error("Carry-over changed during propagation; retry the operation");
}
