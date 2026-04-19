import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("month overview header source exposes the revised summary labels", async () => {
  const source = await readSource("src/components/monthly/month-overview.tsx");

  for (const label of ["Ahorro del mes", "Saldo final", "Saldo inicial", "Ingresos", "Gastos"]) {
    assert.match(source, new RegExp(label));
  }

  assert.ok(
    !source.includes("Panel de control del mes seleccionado con saldo, flujo y accesos rápidos"),
    "old descriptive copy should be removed",
  );

  const savingsPosition = source.indexOf("Ahorro del mes");
  const finalPosition = source.indexOf("Saldo final");
  const initialPosition = source.indexOf("Saldo inicial");

  assert.notEqual(savingsPosition, -1);
  assert.notEqual(finalPosition, -1);
  assert.notEqual(initialPosition, -1);
  assert.ok(savingsPosition < initialPosition, "Ahorro del mes should appear before Saldo inicial");
  assert.ok(finalPosition < initialPosition, "Saldo final should appear before Saldo inicial");
});
