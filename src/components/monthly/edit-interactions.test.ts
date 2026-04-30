import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("inline fixed fields support row press activation", () => {
  const source = readFileSync(new URL("./inline-edit-field.tsx", import.meta.url), "utf8");

  assert.match(source, /activateOnRowPress\?: boolean/);
  assert.match(source, /role=\{isRowInteractive \? "button" : undefined\}/);
});

test("inline fixed fields expose an explicit save button while editing", () => {
  const source = readFileSync(new URL("./inline-edit-field.tsx", import.meta.url), "utf8");

  assert.match(source, /Loader2/);
  assert.match(source, /aria-busy=\{saving\}/);
  assert.match(source, /onClick=\{\(\) => void handleSave\(\)\}/);
  assert.match(source, /saving \? tCommon\("saving"\) : tCommon\("save"\)/);
});

test("additional entry amounts remain direct edit triggers", () => {
  const source = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");

  assert.match(source, /onClick=\{\(\) => openEditForm\(entry\)\}/);
  assert.match(source, /aria-label=\{`\$\{t\("edit"\)\} \$\{entry\.label\}`\}/);
});

test("fixed editor reveal animates without an extra parent stack gap", () => {
  const source = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /<div className="space-y-6">/);
  assert.match(source, /<div className="mb-6 /);
  assert.match(source, /ref=\{fixedEditorsInnerRef\} className="overflow-hidden pb-6"/);
});

test("extra payslip fixed row follows the year extra payments setting", () => {
  const incomeSource = readFileSync(new URL("./income-card.tsx", import.meta.url), "utf8");
  const overviewSource = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");

  assert.match(incomeSource, /showAdditionalPayslip: boolean/);
  assert.match(incomeSource, /\{showAdditionalPayslip && \(/);
  assert.match(overviewSource, /showAdditionalPayslip=\{config\.hasExtraPayments && \(month\.month === 6 \|\| month\.month === 12\)\}/);
});

test("inline fixed fields expose annual reset action only when values diverge", () => {
  const source = readFileSync(new URL("./inline-edit-field.tsx", import.meta.url), "utf8");

  assert.match(source, /resetValue\?: number/);
  assert.match(source, /showReset\?: boolean/);
  assert.match(source, /BrushCleaning/);
  assert.match(source, /const resetVisible = showReset \?\? \(resetValue !== undefined && Math\.abs\(value - resetValue\) > 0\.005\)/);
  assert.match(source, /<BrushCleaning[\s\S]*<button/);
  assert.match(source, /onClick=\{\(event\) => void handleReset\(event\)\}/);
});

test("monthly fixed fields map annual setup values to reset targets", () => {
  const incomeSource = readFileSync(new URL("./income-card.tsx", import.meta.url), "utf8");
  const expensesSource = readFileSync(new URL("./fixed-expenses-card.tsx", import.meta.url), "utf8");
  const overviewSource = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");

  assert.match(incomeSource, /annualDefaults: Pick<YearConfig, "estimatedSalary" \| "estimatedExtraPayment" \| "interestRate">/);
  assert.match(incomeSource, /resetValue=\{annualDefaults\.estimatedSalary\}/);
  assert.match(incomeSource, /resetValue=\{annualDefaults\.estimatedExtraPayment\}/);
  assert.match(incomeSource, /resetValue=\{calculateMonthlyInterest\(month\.startingBalance, annualDefaults\.interestRate\)\}/);
  assert.match(incomeSource, /showReset=\{month\.interestsManualOverride\}/);
  assert.match(expensesSource, /annualDefaults: Pick<YearConfig, "monthlyHomeExpense" \| "monthlyPersonalBudget" \| "monthlyInvestment">/);
  assert.match(expensesSource, /resetValue=\{annualDefaults\.monthlyHomeExpense\}/);
  assert.match(expensesSource, /resetValue=\{annualDefaults\.monthlyPersonalBudget\}/);
  assert.match(expensesSource, /resetValue=\{annualDefaults\.monthlyInvestment\}/);
  assert.match(overviewSource, /annualDefaults=\{config\}/);
});

test("interest reset clears the manual override instead of saving another manual value", () => {
  const overviewSource = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");
  const routeSource = readFileSync(new URL("../../app/api/months/[monthId]/route.ts", import.meta.url), "utf8");

  assert.match(overviewSource, /type FixedUpdateOptions = \{ interestsManualOverride\?: boolean \}/);
  assert.match(overviewSource, /\.\.\.\(options\?\.interestsManualOverride !== undefined[\s\S]*interestsManualOverride: options\.interestsManualOverride/);
  assert.match(routeSource, /body\.interestsManualOverride !== undefined/);
  assert.match(routeSource, /updates\.interestsManualOverride = Boolean\(body\.interestsManualOverride\)/);
});

test("fixed expenses card embeds recurring expenses without month-level add", () => {
  const overviewSource = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");
  const expensesSource = readFileSync(new URL("./fixed-expenses-card.tsx", import.meta.url), "utf8");
  const listSource = readFileSync(new URL("./recurring-expenses-list.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(overviewSource, /<RecurringExpensesCard/);
  assert.match(overviewSource, /handleRecurringExpensesChange/);
  assert.match(overviewSource, /recurringExpenses: sortRecurringExpensesAsc\(entries\)/);
  assert.match(expensesSource, /RecurringExpensesList/);
  assert.match(expensesSource, /{t\("recurringExpensesTitle"\)}/);
  assert.match(listSource, /\/api\/months\/\$\{monthId\}\/recurring-expenses\/\$\{id\}/);
  assert.doesNotMatch(listSource, /method: "POST"/);
  assert.doesNotMatch(listSource, /addEntry/);
  assert.match(listSource, /deletingId === entry\.id/);
});

test("monthly edits update client state without clearing the route cache", () => {
  const overviewSource = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");
  const entriesSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");

  assert.match(overviewSource, /import \{ Link \} from "@\/i18n\/routing"/);
  assert.doesNotMatch(overviewSource, /useRouter/);
  assert.doesNotMatch(overviewSource, /router\.refresh\(\)/);
  assert.doesNotMatch(entriesSource, /onPersistedChange/);
});

test("monthly additional entries can be moved between months without refreshing the route cache", () => {
  const overviewSource = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");

  assert.match(overviewSource, /type DraggedAdditionalEntry = /);
  assert.match(overviewSource, /const \[draggedEntry, setDraggedEntry\] = useState<DraggedAdditionalEntry \| null>\(null\)/);
  assert.match(overviewSource, /handleAdditionalEntryMove/);
  assert.match(overviewSource, /fetch\(`\/api\/months\/\$\{sourceMonthId\}\/entries\/\$\{entryId\}`/);
  assert.match(overviewSource, /body: JSON\.stringify\(\{ monthId: targetMonthId \}\)/);
  assert.match(overviewSource, /computeMonthChain/);
  assert.doesNotMatch(overviewSource, /router\.refresh\(\)/);
});

test("month tabs expose drop targets while an additional entry is being dragged", () => {
  const overviewSource = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");

  assert.match(overviewSource, /onDragOver=\{handleMonthDragOver\(item\.id\)\}/);
  assert.match(overviewSource, /onDrop=\{handleMonthDrop\(item\.id\)\}/);
  assert.match(overviewSource, /isAdditionalEntryDropTarget/);
  assert.match(overviewSource, /border-dashed/);
});

test("mobile month view supports horizontal swipe navigation through the local month selector", () => {
  const overviewSource = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");

  assert.match(overviewSource, /getHorizontalSwipeDirection/);
  assert.match(overviewSource, /window\.matchMedia\("\(max-width: 767px\)"\)\.matches/);
  assert.match(overviewSource, /onPointerDown=\{handleSwipePointerDown\}/);
  assert.match(overviewSource, /onPointerUp=\{handleSwipePointerUp\}/);
  assert.match(overviewSource, /direction === "next" && nextMonth/);
  assert.match(overviewSource, /direction === "previous" && previousMonth/);
});

test("additional entry rows move by drag and drop without a separate move button", () => {
  const entriesSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const overviewSource = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");

  assert.match(entriesSource, /onEntryDragStart\?: \(entry: AdditionalEntry\) => void/);
  assert.match(entriesSource, /draggable=\{canMoveEntry\(entry\)\}/);
  assert.match(entriesSource, /onDragStart=\{\(event\) => handleDragStart\(event, entry\)\}/);
  assert.doesNotMatch(entriesSource, /ArrowRightLeft/);
  assert.doesNotMatch(entriesSource, /movePickerOpenId/);
  assert.doesNotMatch(entriesSource, /moveTargets\?: AdditionalEntryMoveTarget\[\]/);
  assert.doesNotMatch(entriesSource, /onEntryMove\?: \(entry: AdditionalEntry, targetMonthId: number\) => void/);
  assert.doesNotMatch(entriesSource, /t\("moveEntry"\)/);
  assert.doesNotMatch(overviewSource, /moveTargets=\{additionalEntryMoveTargets\}/);
});
