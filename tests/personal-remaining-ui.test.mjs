import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path) => readFileSync(new URL(`../src/components/${path}`, import.meta.url), 'utf8');

test('monthly surplus stays editable in place with a note and net spending beside the budget', () => {
  const income = source('monthly/income-card.tsx');
  const fixed = source('monthly/fixed-expenses-card.tsx');
  assert.match(income, /onUpdate\("personalRemaining", v\)/);
  assert.match(income, /t\("personalRemainingHint"\)/);
  assert.match(fixed, /t\("personalNet", \{ amount: formatCurrency\(month.personalExpense - month.personalRemaining, locale\)/);
  assert.match(fixed, /onUpdate\("personalExpense", v, \{ personalExpenseManualOverride: false \}\)/);
});

test('monthly errors are localized, scoped to the originating month and prevent local commits', () => {
  const monthly = source('monthly/month-overview.tsx');
  const save = monthly.slice(monthly.indexOf('const handleFixedUpdate'), monthly.indexOf('const handleEntriesChange'));
  assert.match(save, /error.code === PERSONAL_REMAINING_OUT_OF_RANGE/);
  assert.match(save, /tCommon\("personalRemainingOutOfRange"/);
  assert.ok(save.indexOf('throw new Error') < save.indexOf('commitMonthsChange'));
  assert.match(monthly, /fixedError\?\.monthId === month.id/);
  assert.ok(monthly.indexOf('tCommon("personalRemainingWarning"') < monthly.indexOf('{renderFixedEditors ? ('));
});

test('annual errors preserve pending cleanup and warn with all affected month names', () => {
  const annual = source('annual/annual-view.tsx');
  const form = source('annual/year-config-form.tsx');
  assert.match(annual, /filter\(\(month\) => !isPersonalRemainingValid/);
  assert.match(annual, /map\(\(month\) => formatMonthName\(month.month, locale\)\)/);
  assert.match(annual, /savePromise.then\(finishSave, finishSave\)/);
  assert.match(form, /error.months.map\(\(number: number\) => formatMonthName\(number, locale\)\)/);
  assert.match(form, /role="alert"[^>]*>\{configError\}/);
  assert.ok(form.indexOf('throw new Error("Failed to update")') < form.indexOf('onConfigChange((current)'));
  assert.match(form, /finally \{\s*setSavingFields/);
});

test('annual savings includes negative-only months and fixed rows remain visible at zero grand total', () => {
  assert.match(source('annual/kpi-cards.tsx'), /m.totalIncome !== 0 \|\| m.totalExpenses !== 0 \|\| m.savings !== 0/);
  assert.match(source('annual/fixed-expenses-view.tsx'), /if \(stats.length === 0\)/);
  assert.match(source('annual/fixed-stat-row.tsx'), /Math.min\(100, Math.max\(0,/);
});

for (const locale of ['es', 'en']) {
  test(`${locale} provides explanatory text and translated range errors and legacy warnings`, () => {
    const messages = JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url)));
    assert.match(messages.Common.personalRemainingOutOfRange, /\{months\}/);
    assert.match(messages.Common.personalRemainingWarning, /\{months\}/);
    assert.ok(messages.Monthly.income.personalRemainingHint);
    assert.match(messages.Monthly.fixedExpenses.personalNet, /\{amount\}/);
  });
}
