export interface CarryOverSnapshot {
  year: number;
  version: number;
  nextStartingBalance: number;
}

export interface CarryOverStore {
  listYears(): Promise<number[]>;
  bumpVersion(year: number): Promise<boolean>;
  getSnapshot(year: number): Promise<CarryOverSnapshot | null>;
  updateStartingBalance(input: {
    year: number;
    startingBalance: number;
    predecessorYear: number;
    predecessorVersion: number;
  }): Promise<boolean>;
}

export const DEFAULT_MAX_PROPAGATION_ATTEMPTS = 5;

export async function propagateVersionedCarryOver(
  store: CarryOverStore,
  startYear: number,
  maxAttempts = DEFAULT_MAX_PROPAGATION_ATTEMPTS,
) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const sortedYears = [...(await store.listYears())].sort((a, b) => a - b);
    const downstreamYears = sortedYears.filter((year) => year > startYear);

    if (!(await store.bumpVersion(startYear))) {
      return;
    }

    let previousSnapshot = await store.getSnapshot(startYear);
    if (!previousSnapshot) {
      return;
    }

    let conflictDetected = false;

    for (const year of downstreamYears) {
      const updated = await store.updateStartingBalance({
        year,
        startingBalance: previousSnapshot.nextStartingBalance,
        predecessorYear: previousSnapshot.year,
        predecessorVersion: previousSnapshot.version,
      });

      if (!updated) {
        conflictDetected = true;
        break;
      }

      previousSnapshot = await store.getSnapshot(year);
      if (!previousSnapshot) {
        return;
      }
    }

    if (!conflictDetected) {
      return;
    }
  }

  throw new Error("Carry-over changed during propagation; retry the operation");
}
