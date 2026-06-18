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

test("inline fixed field edit inputs show a Euro suffix while preserving numeric payloads", () => {
  const source = readFileSync(new URL("./inline-edit-field.tsx", import.meta.url), "utf8");

  assert.match(source, />\s*€\s*<\/span>/);
  assert.match(source, /inputVal\.trim\(\)/);
  assert.match(source, /defaultParseInputValue = \(input: string\) => parseFloat\(input\.replace\(",", "\."\)\)/);
  assert.match(source, /pr-8/);
});

test("inline fixed amount inputs reject non numeric characters while editing", () => {
  const source = readFileSync(new URL("./inline-edit-field.tsx", import.meta.url), "utf8");

  assert.match(source, /sanitizeNumericInput/);
  assert.match(source, /setInputVal\(sanitizeNumericInput\(e\.target\.value\)\)/);
});

test("additional entry amounts remain direct edit triggers", () => {
  const source = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");

  assert.match(source, /onClick=\{\(\) => openEditForm\(entry\)\}/);
  assert.match(source, /aria-label=\{`\$\{t\("edit"\)\} \$\{entry\.label\}`\}/);
});

test("additional expense group creation refreshes the app router cache after local state updates", () => {
  const source = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");

  assert.match(source, /import \{ useRouter \} from "@\/i18n\/routing"/);
  assert.match(source, /const router = useRouter\(\)/);
  assert.match(source, /onGroupsChange\?\.\(\[\.\.\.groups, newGroup\]\);\s*router\.refresh\(\);/);
});

test("additional entry amount inputs show a Euro suffix as soon as they are editable", () => {
  const cardSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const formRowSource = readFileSync(new URL("./entry-form-row.tsx", import.meta.url), "utf8");

  assert.match(formRowSource, />\s*€\s*<\/span>/);
  assert.match(cardSource, /const parseAmountInput = \(value: string\) => parseFloat\(value\.replace\(",", "\."\)\)/);
  assert.match(cardSource, /const amount = parseAmountInput\(newAmount\)/);
  assert.match(cardSource, /const amount = parseAmountInput\(editAmount\)/);
  assert.match(cardSource, /amountValue=\{newAmount\}/);
  assert.match(cardSource, /amountValue=\{editAmount\}/);
});

test("additional entry amount inputs reject non numeric characters while editing", () => {
  const source = readFileSync(new URL("./entry-form-row.tsx", import.meta.url), "utf8");

  assert.match(source, /sanitizeNumericInput/);
  assert.match(source, /onAmountChange\(sanitizeNumericInput\(e\.target\.value\)\)/);
});

test("fixed editor reveal animates without an extra parent stack gap", () => {
  const source = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /<div className="space-y-6">/);
  assert.match(source, /<div className="mb-6 /);
  assert.match(source, /ref=\{fixedEditorsInnerRef\} className="overflow-hidden pb-6"/);
});

test("fixed editor toggle keeps a stable width across show and hide labels", () => {
  const source = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");

  assert.match(source, /<span aria-hidden="true" className="grid">/);
  assert.match(source, /showFixedEditors \? "visible" : "invisible"/);
  assert.match(source, /showFixedEditors \? "invisible" : "visible"/);
  assert.match(source, /tOverview\("hideMonthEditor"\)/);
  assert.match(source, /tOverview\("editMonth"\)/);
});

test("extra payslip fixed row follows the year extra payments setting", () => {
  const incomeSource = readFileSync(new URL("./income-card.tsx", import.meta.url), "utf8");
  const overviewSource = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");

  assert.match(incomeSource, /showAdditionalPayslip: boolean/);
  assert.match(incomeSource, /\{showAdditionalPayslip && \(/);
  assert.match(overviewSource, /showAdditionalPayslip=\{config\.hasExtraPayments && \(month\.month === 6 \|\| month\.month === 12\)\}/);
});

test("bonus is not exposed as a monthly fixed income field", () => {
  const incomeSource = readFileSync(new URL("./income-card.tsx", import.meta.url), "utf8");
  const routeSource = readFileSync(new URL("../../app/api/months/[monthId]/route.ts", import.meta.url), "utf8");

  assert.doesNotMatch(incomeSource, /month\.month === 7/);
  assert.doesNotMatch(incomeSource, /t\("bonus"\)/);
  assert.doesNotMatch(incomeSource, /onUpdate\("bonus"/);
  assert.doesNotMatch(routeSource, /"bonus"/);
});

test("inline fixed fields can expose annual reset action from explicit manual state", () => {
  const source = readFileSync(new URL("./inline-edit-field.tsx", import.meta.url), "utf8");

  assert.match(source, /resetValue\?: number/);
  assert.match(source, /showReset\?: boolean/);
  assert.match(source, /BrushCleaning/);
  assert.match(source, /const resetVisible = showReset \?\? \(resetValue !== undefined && Math\.abs\(value - resetValue\) > 0\.005\)/);
  assert.match(source, /<BrushCleaning[\s\S]*<button/);
  assert.match(source, /onClick=\{\(event\) => void handleReset\(event\)\}/);
});

test("annual-backed monthly reset buttons depend on manual override flags", () => {
  const incomeSource = readFileSync(new URL("./income-card.tsx", import.meta.url), "utf8");
  const expensesSource = readFileSync(new URL("./fixed-expenses-card.tsx", import.meta.url), "utf8");
  const overviewSource = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");
  const routeSource = readFileSync(new URL("../../app/api/months/[monthId]/route.ts", import.meta.url), "utf8");
  const schemaSource = readFileSync(new URL("../../db/schema.ts", import.meta.url), "utf8");

  assert.match(incomeSource, /showReset=\{month\.payslipManualOverride\}/);
  assert.match(incomeSource, /onReset=\{\(v\) => onUpdate\("payslip", v, \{ payslipManualOverride: false \}\)\}/);
  assert.match(incomeSource, /showReset=\{month\.additionalPayslipManualOverride\}/);
  assert.match(
    incomeSource,
    /onReset=\{\(v\) => onUpdate\("additionalPayslip", v, \{ additionalPayslipManualOverride: false \}\)\}/
  );
  assert.match(expensesSource, /showReset=\{month\.homeExpenseManualOverride\}/);
  assert.match(expensesSource, /showReset=\{month\.personalExpenseManualOverride\}/);
  assert.match(expensesSource, /showReset=\{month\.investmentManualOverride\}/);
  assert.match(overviewSource, /type FixedUpdateOptions = Partial<Pick<[\s\S]*MonthData,[\s\S]*"payslipManualOverride"/);
  assert.match(routeSource, /const manualOverrideFields = \{/);
  assert.match(routeSource, /updates\[manualOverrideField\] = true/);
  assert.match(schemaSource, /payslipManualOverride: boolean\("payslip_manual_override"\)/);
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

test("personal surplus can be reset to zero from the fixed income row", () => {
  const incomeSource = readFileSync(new URL("./income-card.tsx", import.meta.url), "utf8");
  const inlineSource = readFileSync(new URL("./inline-edit-field.tsx", import.meta.url), "utf8");
  const esMessages = readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8");
  const enMessages = readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8");

  assert.match(incomeSource, /label=\{t\("personalRemaining"\)\}/);
  assert.match(incomeSource, /resetValue=\{0\}/);
  assert.match(incomeSource, /showReset=\{Math\.abs\(month\.personalRemaining\) > 0\.005\}/);
  assert.match(incomeSource, /resetLabel=\{tCommon\("resetToZero"\)\}/);
  assert.match(inlineSource, /resetLabel\?: string/);
  assert.match(inlineSource, /const resetActionLabel = resetLabel \?\? tCommon\("resetToAnnualValue"\)/);
  assert.match(esMessages, /"resetToZero": "Restablecer a cero"/);
  assert.match(enMessages, /"resetToZero": "Reset to zero"/);
});

test("interest reset clears the manual override instead of saving another manual value", () => {
  const overviewSource = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");
  const routeSource = readFileSync(new URL("../../app/api/months/[monthId]/route.ts", import.meta.url), "utf8");

  assert.match(overviewSource, /type FixedUpdateOptions = Partial<Pick<[\s\S]*"interestsManualOverride"/);
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
  assert.doesNotMatch(listSource, /fetch\(`\/api\/months\/\$\{monthId\}\/recurring-expenses`[^)]*method:\s*"POST"/s);
  assert.doesNotMatch(listSource, /addEntry/);
  assert.match(listSource, /deletingId === entry\.id/);
});

test("recurring expenses edit form uses EntryFormRow for unified layout", () => {
  const source = readFileSync(new URL("./recurring-expenses-list.tsx", import.meta.url), "utf8");

  assert.match(source, /from ".\/entry-form-row"/);
  assert.match(source, /<EntryFormRow/);
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

test("additional entry rows keep drag and drop and expose month moves only inside edit mode", () => {
  const entriesSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const overviewSource = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");
  const esMessages = readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8");
  const enMessages = readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8");

  assert.match(entriesSource, /onEntryDragStart\?: \(entry: AdditionalEntry\) => void/);
  assert.match(entriesSource, /draggable=\{canMoveEntry\(entry\)\}/);
  assert.match(entriesSource, /onDragStart=\{\(event\) => handleDragStart\(event, entry\)\}/);
  assert.match(entriesSource, /CalendarArrowUp/);
  assert.match(entriesSource, /monthAction=\{onEntryMoveToMonth && moveTargets\.length > 0/);
  assert.match(entriesSource, /onEntryMoveToMonth\?: \(entry: AdditionalEntry, targetMonthId: number\) => void/);
  assert.match(entriesSource, /t\("moveToMonth"\)/);
  assert.match(overviewSource, /moveTargets=\{sortedMonths/);
  assert.match(overviewSource, /handleAdditionalEntryMove\(entry, "expense", month\.id, targetMonthId\)/);
  assert.match(overviewSource, /handleAdditionalEntryMove\(entry, "income", month\.id, targetMonthId\)/);
  assert.match(esMessages, /"moveToMonth": "Mover a mes"/);
  assert.match(enMessages, /"moveToMonth": "Move to month"/);
});

test("additional expense group moves use a compact edit-row menu instead of selects", () => {
  const entriesSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const groupRowSource = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");
  const esMessages = readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8");
  const enMessages = readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8");

  for (const source of [entriesSource, groupRowSource]) {
    assert.match(source, /DropdownMenu/);
    assert.match(source, /DropdownMenuRadioGroup/);
    assert.match(source, /FolderInput/);
    assert.match(source, /handleMoveToGroup/);
    assert.match(source, /const \[movingToGroupId, setMovingToGroupId\] = useState<number \| null>\(null\)/);
    assert.match(source, /size="icon-sm"/);
    assert.doesNotMatch(source, /<select/);
  }

  assert.match(esMessages, /"moveToGroup": "Mover a grupo"/);
  assert.match(enMessages, /"moveToGroup": "Move to group"/);
});

test("additional expense group header keeps trailing controls tighter on mobile", () => {
  const groupRowSource = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");

  assert.match(groupRowSource, /"flex cursor-pointer select-none items-center gap-1 px-2\.5 py-1\.5 sm:gap-2"/);
  assert.match(groupRowSource, /className="flex shrink-0 items-center gap-1 h-9"/);
});

test("additional expense group delete loading action fits the compact dialog footer", () => {
  const groupRowSource = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");

  assert.match(
    groupRowSource,
    /group-data-\[size=sm\]\/alert-dialog-content:grid-cols-\[minmax\(0,0\.8fr\)_minmax\(0,1\.2fr\)\]/
  );
  assert.match(groupRowSource, /className="min-w-0 px-2 text-xs sm:text-sm"/);
  assert.match(groupRowSource, /isDeletingGroup \? t\("deletingGroup"\) : t\("confirmDeleteGroupAction"\)/);
});

test("EntryFormRow exposes a tagAction slot and accounts for it in the grid column formula", () => {
  const source = readFileSync(new URL("./entry-form-row.tsx", import.meta.url), "utf8");

  assert.match(source, /tagAction\?: React\.ReactNode/);
  assert.match(source, /monthAction\?: React\.ReactNode/);
  assert.match(source, /\[folderAction, monthAction, recurringAction, tagAction\]\.filter\(Boolean\)\.length/);
  assert.match(source, /extraCount === 4/);
});
