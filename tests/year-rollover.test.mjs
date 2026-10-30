import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dataSource = readFileSync(new URL('../src/lib/server/year-data.ts', import.meta.url), 'utf8');
const body = dataSource.slice(dataSource.indexOf('export async function getAppRedirectPath'))
  .replace('export async function getAppRedirectPath(userId: string, currentYear: number)', 'async function getAppRedirectPath(userId, currentYear)');
async function landing(years, currentYear = 2028) {
  const fakeDate = class extends Date { getMonth() { return 3; } };
  const redirect = new Function('getYearsForUser', 'pickDefaultYear', 'Date', `${body}; return getAppRedirectPath;`)(
    async () => years,
    (available, current) => available.includes(current) ? current : Math.max(...available),
    fakeDate,
  );
  return redirect('user', currentYear);
}

test('landing keeps first-year setup and current-year current month', async () => {
  assert.equal(await landing([]), '/setup/2028');
  assert.equal(await landing([2025, 2028, 2029]), '/2028/4');
});
test('missing current year opens latest summary, marking only a past fallback', async () => {
  assert.equal(await landing([2024, 2025]), '/2025/summary?yearEnded=1');
  assert.equal(await landing([2025, 2029]), '/2029/summary');
});

test('summary gates the notice on server data and the entry marker', () => {
  const source = readFileSync(new URL('../src/app/[locale]/[year]/summary/page.tsx', import.meta.url), 'utf8');
  assert.match(source, /yearEnded === "1" && year < calendarYear/);
  assert.match(source, /year === Math.max\(\.\.\.years\) && !years.includes\(calendarYear\)/);
});

test('dialog consumes only its marker, preserves history and keeps open state independent of URL', () => {
  const source = readFileSync(new URL('../src/components/year/year-rollover-dialog.tsx', import.meta.url), 'utf8');
  assert.match(source, /const \[open, setOpen\] = useState\(Boolean\(context\) && marker === "1"\)/);
  assert.match(source, /url.searchParams.delete\("yearEnded"\)/);
  assert.match(source, /replaceState\(window.history.state/);
  assert.match(source, /\$\{url.pathname\}\$\{url.search\}\$\{url.hash\}/);
  assert.match(source, /if \(marker === "1" && context\) setOpen\(true\)/);
  assert.match(source, /\[marker\]/);
  assert.match(source, /onOpenChange=\{setOpen\}/);
  assert.match(source, /useLinkStatus/);
  assert.match(source, /buildSetupHref\(currentYear, buildYearMonthHref\(undefined, currentYear, currentMonth\)\)/);
});

test('marker cleanup preserves query/hash and render transitions reopen only on a fresh marker', () => {
  const source = readFileSync(new URL('../src/components/year/year-rollover-dialog.tsx', import.meta.url), 'utf8');
  const effect = source.match(/useEffect\(\(\) => \{([\s\S]*?)\n  \}, \[marker\]\);/)[1];
  const runEffect = new Function('marker', 'window', effect);
  let location = new URL('https://gridly.test/es/2025/summary?yearEnded=1&keep=yes#chart');
  const state = { framework: 'retained' };
  const browser = {
    location: { get href() { return location.href; } },
    history: { state, replaceState(nextState, _title, path) {
      assert.equal(nextState, state);
      location = new URL(path, location);
    } },
  };
  runEffect('1', browser);
  assert.equal(location.pathname + location.search + location.hash, '/es/2025/summary?keep=yes#chart');
  const adjustment = source.match(/  if \(marker !== entryMarker\) \{([\s\S]*?)\n  \}/)[0];
  const adjust = new Function('marker', 'entryMarker', 'context', 'setEntryMarker', 'setOpen', adjustment);
  let open = true;
  let previous = '1';
  const context = { previousYear: 2025, currentYear: 2028, currentMonth: 4 };
  const render = (marker) => adjust(marker, previous, context, value => { previous = value; }, value => { open = value; });
  render(null);
  assert.equal(open, true, 'URL cleanup must not close the dialog');
  open = false;
  render(null);
  assert.equal(open, false, 'normal navigation does not reopen');
  render('1');
  assert.equal(open, true, 'new home entry opens again with same context');
});
