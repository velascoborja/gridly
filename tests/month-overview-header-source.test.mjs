import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("month overview header source exposes the revised summary labels", async () => {
  const source = await readSource("src/components/monthly/month-overview.tsx");
  const headerStart = source.indexOf('<Card className="overflow-hidden border-border/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-xl shadow-slate-950/20">');
  const headerEnd = source.indexOf('</Card>\n\n      <div className="grid gap-4 sm:grid-cols-2">', headerStart);

  assert.notEqual(headerStart, -1);
  assert.notEqual(headerEnd, -1);

  const headerRegion = source.slice(headerStart, headerEnd);

  for (const label of ["Ahorro del mes", "Saldo final", "Saldo inicial", "Ingresos", "Gastos"]) {
    assert.ok(headerRegion.includes(label), `expected header region to include ${label}`);
  }

  assert.ok(!headerRegion.includes("grid gap-3 sm:grid-cols-3"), "old equal-weight KPI layout should be removed from the header");

  const savingsPosition = headerRegion.indexOf("Ahorro del mes");
  const finalPosition = headerRegion.indexOf("Saldo final");
  const initialPosition = headerRegion.indexOf("Saldo inicial");

  assert.notEqual(savingsPosition, -1);
  assert.notEqual(finalPosition, -1);
  assert.notEqual(initialPosition, -1);
  assert.ok(savingsPosition < initialPosition, "Ahorro del mes should appear before Saldo inicial");
  assert.ok(finalPosition < initialPosition, "Saldo final should appear before Saldo inicial");
});
