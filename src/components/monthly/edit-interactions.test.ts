import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function assertInOrder(source: string, before: string, after: string) {
  const beforeIndex = source.indexOf(before);
  const afterIndex = source.indexOf(after);

  assert.notEqual(beforeIndex, -1, `Expected source to contain ${before}`);
  assert.notEqual(afterIndex, -1, `Expected source to contain ${after}`);
  assert.ok(beforeIndex < afterIndex, `Expected ${before} to appear before ${after}`);
}

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

  assert.match(source, /onClick=\{\(\) => openEditForm\(entry, "amount"\)\}/);
  assert.match(source, /aria-label=\{`\$\{t\("edit"\)\} \$\{entry\.label\}`\}/);
});

test("entry edit focus follows whether the user clicked label or amount", () => {
  const formRowSource = readFileSync(new URL("./entry-form-row.tsx", import.meta.url), "utf8");
  const additionalEntriesSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const groupRowSource = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");
  const recurringSource = readFileSync(new URL("./recurring-expenses-list.tsx", import.meta.url), "utf8");

  assert.match(formRowSource, /autoFocus\?: boolean \| "label" \| "amount"/);
  assert.match(formRowSource, /autoFocus=\{autoFocusTarget === "label"\}/);
  assert.match(formRowSource, /autoFocus=\{autoFocusTarget === "amount"\}/);

  for (const source of [additionalEntriesSource, groupRowSource, recurringSource]) {
    assert.match(source, /const \[editFocusTarget, setEditFocusTarget\] = useState<EntryEditFocusTarget>\("label"\)/);
    assert.match(source, /setEditFocusTarget\(focusTarget\)/);
    assert.match(source, /onClick=\{\(\) => openEditForm\(entry, "label"\)\}/);
    assert.match(source, /onClick=\{\(\) => openEditForm\(entry, "amount"\)\}/);
  }
  assert.match(additionalEntriesSource, /autoFocus=\{entry\.isCompleted \? false : editFocusTarget\}/);
  assert.match(groupRowSource, /autoFocus=\{entry\.isCompleted \? false : editFocusTarget\}/);
  assert.match(recurringSource, /autoFocus=\{editFocusTarget\}/);
});

test("additional expense group creation refreshes the app router cache after local state updates", () => {
  const source = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");

  assert.match(source, /import \{ useRouter \} from "@\/i18n\/routing"/);
  assert.match(source, /const router = useRouter\(\)/);
  assert.match(source, /onGroupsChange\?\.\(\[\.\.\.groups, newGroup\]\);\s*router\.refresh\(\);/);
});

test("grouped and ungrouped expenses render a subtle mixed divider between their lists", () => {
  const entriesSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const stylesSource = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

  assert.match(
    entriesSource,
    /type === "expense" && groups\.length > 0 && sortedEntries\.length > 0/
  );
  assert.match(entriesSource, /className="expense-group-divider mx-3 h-px shrink-0"/);
  assert.match(stylesSource, /\.expense-group-divider\s*\{[\s\S]*?linear-gradient/);
  assert.match(stylesSource, /color-mix\(in oklch, var\(--primary\) 18%, transparent\)/);
});

test("grouped additional expense amount inputs use expression parsing and preview props", () => {
  const groupRowSource = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");

  assert.match(groupRowSource, /parseMoneyExpression/);
  assert.doesNotMatch(groupRowSource, /const parseAmount = \(v: string\) => parseFloat\(v\.replace\(",", "\."\)\)/);
  assert.match(groupRowSource, /const newAmountPreview = getAmountPreview\(newAmount\)/);
  assert.match(groupRowSource, /const editAmountPreview = getAmountPreview\(editAmount\)/);
  assert.match(groupRowSource, /const amount = parseEntryAmount\(newAmount, \(\) => setNewAmountError\(true\)\)/);
  assert.match(groupRowSource, /const amount = parseEntryAmount\(editAmount, \(\) => setEditAmountError\(true\)\)/);
  assert.match(groupRowSource, /amountMode="expression"/);
  assert.match(groupRowSource, /amountPreview=\{newAmountPreview\}/);
  assert.match(groupRowSource, /amountPreview=\{editAmountPreview\}/);
  assert.match(groupRowSource, /amountError=\{newAmountError \? t\("amountExpressionInvalid"\) : null\}/);
  assert.match(groupRowSource, /amountError=\{editAmountError \? t\("amountExpressionInvalid"\) : null\}/);
});

test("grouped additional expense add and edit handlers block invalid expressions before fetch", () => {
  const groupRowSource = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");
  const parseEntryAmountStart = groupRowSource.indexOf(
    "const parseEntryAmount = (value: string, onInvalid: () => void): number | null =>"
  );
  const parseEntryAmountEnd = groupRowSource.indexOf("const handleAdd = async () => {");
  const addHandlerStart = parseEntryAmountEnd;
  const addHandlerEnd = groupRowSource.indexOf("const openEditForm =");
  const editHandlerStart = groupRowSource.indexOf("const handleEdit = async (entryId: number) => {");
  const editHandlerEnd = groupRowSource.indexOf("const handleMoveToGroup = async");
  const addHandlerSource = groupRowSource.slice(addHandlerStart, addHandlerEnd);
  const editHandlerSource = groupRowSource.slice(editHandlerStart, editHandlerEnd);
  const parseEntryAmountSource = groupRowSource.slice(parseEntryAmountStart, parseEntryAmountEnd);
  const parseInvalidBranchStart = parseEntryAmountSource.indexOf("if (!parsed.ok) {");
  const parseInvalidBranchEnd = parseEntryAmountSource.indexOf("}", parseInvalidBranchStart);
  const parseInvalidBranchSource = parseEntryAmountSource.slice(parseInvalidBranchStart, parseInvalidBranchEnd);
  const addInvalidGuard = "if (!newLabel.trim() || amount === null) return;";
  const addFetch = "fetch(`/api/months/${monthId}/entries`";
  const editInvalidGuard = "if (!editLabel.trim() || amount === null) return;";
  const editFetch = "fetch(`/api/months/${monthId}/entries/${entryId}`";

  assert.notEqual(parseEntryAmountStart, -1, "Expected group row source to contain parseEntryAmount");
  assert.notEqual(parseEntryAmountEnd, -1, "Expected group row source to contain handleAdd after parseEntryAmount");
  assert.ok(parseEntryAmountStart < parseEntryAmountEnd, "Expected parseEntryAmount to appear before handleAdd");
  assert.match(parseEntryAmountSource, /const parsed = parseMoneyExpression\(value\)/);
  assert.notEqual(parseInvalidBranchStart, -1, "Expected parseEntryAmount to contain parsed failure branch");
  assert.notEqual(parseInvalidBranchEnd, -1, "Expected parseEntryAmount parsed failure branch to close");
  assert.match(parseInvalidBranchSource, /onInvalid\(\)/);
  assert.match(parseInvalidBranchSource, /return null;/);

  assert.notEqual(addHandlerStart, -1, "Expected group row source to contain handleAdd");
  assert.notEqual(addHandlerEnd, -1, "Expected group row source to contain openEditForm after handleAdd");
  assert.ok(addHandlerStart < addHandlerEnd, "Expected handleAdd to appear before openEditForm");
  assert.match(addHandlerSource, /const amount = parseEntryAmount\(newAmount, \(\) => setNewAmountError\(true\)\);/);
  assert.ok(addHandlerSource.includes(addInvalidGuard), `Expected handleAdd to contain ${addInvalidGuard}`);
  assert.ok(addHandlerSource.includes(addFetch), `Expected handleAdd to contain ${addFetch}`);
  assertInOrder(addHandlerSource, "setNewAmountError(false);", "setIsAdding(true);");
  assertInOrder(addHandlerSource, addInvalidGuard, "setNewAmountError(false);");
  assertInOrder(addHandlerSource, addInvalidGuard, addFetch);

  assert.notEqual(editHandlerStart, -1, "Expected group row source to contain handleEdit");
  assert.notEqual(editHandlerEnd, -1, "Expected group row source to contain handleMoveToGroup after handleEdit");
  assert.ok(editHandlerStart < editHandlerEnd, "Expected handleEdit to appear before handleMoveToGroup");
  assert.match(editHandlerSource, /const amount = parseEntryAmount\(editAmount, \(\) => setEditAmountError\(true\)\);/);
  assert.ok(editHandlerSource.includes(editInvalidGuard), `Expected handleEdit to contain ${editInvalidGuard}`);
  assert.ok(editHandlerSource.includes(editFetch), `Expected handleEdit to contain ${editFetch}`);
  assertInOrder(editHandlerSource, "setEditAmountError(false);", "setSavingId(entryId);");
  assertInOrder(editHandlerSource, editInvalidGuard, "setEditAmountError(false);");
  assertInOrder(editHandlerSource, editInvalidGuard, editFetch);
});

test("additional entry amount inputs use expression parsing and preview props", () => {
  const cardSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const formRowSource = readFileSync(new URL("./entry-form-row.tsx", import.meta.url), "utf8");

  assert.match(formRowSource, />\s*€\s*<\/span>/);
  assert.match(cardSource, /parseMoneyExpression/);
  assert.doesNotMatch(cardSource, /const parseAmountInput = \(value: string\) => parseFloat\(value\.replace\(",", "\."\)\)/);
  assert.match(cardSource, /const newAmountPreview = getAmountPreview\(newAmount\)/);
  assert.match(cardSource, /const editAmountPreview = getAmountPreview\(editAmount\)/);
  assert.match(cardSource, /amountMode="expression"/);
  assert.match(cardSource, /amountPreview=\{newAmountPreview\}/);
  assert.match(cardSource, /amountPreview=\{editAmountPreview\}/);
  assert.match(cardSource, /amountError=\{newAmountError \? t\("amountExpressionInvalid"\) : null\}/);
  assert.match(cardSource, /amountError=\{editAmountError \? t\("amountExpressionInvalid"\) : null\}/);
});

test("additional entry expression invalid message is translated", () => {
  const esMessages = readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8");
  const enMessages = readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8");

  assert.match(esMessages, /"amountExpressionInvalid": "Introduce una cantidad o fórmula válida\."/);
  assert.match(enMessages, /"amountExpressionInvalid": "Enter a valid amount or formula\."/);
});

test("additional entry add and edit handlers block invalid expressions before fetch", () => {
  const cardSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const parseEntryAmountStart = cardSource.indexOf(
    "const parseEntryAmount = (value: string, onInvalid: () => void): number | null =>"
  );
  const parseEntryAmountEnd = cardSource.indexOf("const handleAdd = async () => {");
  const addHandlerStart = parseEntryAmountEnd;
  const addHandlerEnd = cardSource.indexOf("const handleDelete = async");
  const editHandlerStart = cardSource.indexOf("const handleEdit = async (id: number) => {");
  const editHandlerEnd = cardSource.indexOf("const handleMoveToGroup = async");
  const addHandlerSource = cardSource.slice(addHandlerStart, addHandlerEnd);
  const editHandlerSource = cardSource.slice(editHandlerStart, editHandlerEnd);
  const parseEntryAmountSource = cardSource.slice(parseEntryAmountStart, parseEntryAmountEnd);
  const parseInvalidBranchStart = parseEntryAmountSource.indexOf("if (!parsed.ok) {");
  const parseInvalidBranchEnd = parseEntryAmountSource.indexOf("}", parseInvalidBranchStart);
  const parseInvalidBranchSource = parseEntryAmountSource.slice(parseInvalidBranchStart, parseInvalidBranchEnd);
  const addInvalidGuard = "if (!newLabel.trim() || amount === null) return;";
  const addFetch = "fetch(`/api/months/${monthId}/entries`";
  const editInvalidGuard = "if (!editLabel.trim() || amount === null) return;";
  const editFetch = "fetch(`/api/months/${monthId}/entries/${id}`";

  assert.notEqual(parseEntryAmountStart, -1, "Expected source to contain parseEntryAmount");
  assert.notEqual(parseEntryAmountEnd, -1, "Expected source to contain handleAdd after parseEntryAmount");
  assert.ok(parseEntryAmountStart < parseEntryAmountEnd, "Expected parseEntryAmount to appear before handleAdd");
  assert.match(parseEntryAmountSource, /const parsed = parseMoneyExpression\(value\)/);
  assert.notEqual(parseInvalidBranchStart, -1, "Expected parseEntryAmount to contain parsed failure branch");
  assert.notEqual(parseInvalidBranchEnd, -1, "Expected parseEntryAmount parsed failure branch to close");
  assert.match(parseInvalidBranchSource, /onInvalid\(\)/);
  assert.match(parseInvalidBranchSource, /return null;/);

  assert.notEqual(addHandlerStart, -1, "Expected source to contain handleAdd");
  assert.notEqual(addHandlerEnd, -1, "Expected source to contain handleDelete after handleAdd");
  assert.ok(addHandlerStart < addHandlerEnd, "Expected handleAdd to appear before handleDelete");
  assert.match(addHandlerSource, /const amount = parseEntryAmount\(newAmount, \(\) => setNewAmountError\(true\)\);/);
  assert.ok(addHandlerSource.includes(addInvalidGuard), `Expected handleAdd to contain ${addInvalidGuard}`);
  assert.ok(addHandlerSource.includes(addFetch), `Expected handleAdd to contain ${addFetch}`);
  assertInOrder(addHandlerSource, "setNewAmountError(false);", "setIsAdding(true);");
  assertInOrder(addHandlerSource, addInvalidGuard, "setNewAmountError(false);");
  assertInOrder(addHandlerSource, addInvalidGuard, addFetch);

  assert.notEqual(editHandlerStart, -1, "Expected source to contain handleEdit");
  assert.notEqual(editHandlerEnd, -1, "Expected source to contain handleMoveToGroup after handleEdit");
  assert.ok(editHandlerStart < editHandlerEnd, "Expected handleEdit to appear before handleMoveToGroup");
  assert.match(editHandlerSource, /const amount = parseEntryAmount\(editAmount, \(\) => setEditAmountError\(true\)\);/);
  assert.ok(editHandlerSource.includes(editInvalidGuard), `Expected handleEdit to contain ${editInvalidGuard}`);
  assert.ok(editHandlerSource.includes(editFetch), `Expected handleEdit to contain ${editFetch}`);
  assertInOrder(editHandlerSource, "setEditAmountError(false);", "setSavingId(id);");
  assertInOrder(editHandlerSource, editInvalidGuard, "setEditAmountError(false);");
  assertInOrder(editHandlerSource, editInvalidGuard, editFetch);
});

test("EntryFormRow supports numeric and expression amount modes", () => {
  const source = readFileSync(new URL("./entry-form-row.tsx", import.meta.url), "utf8");

  assert.match(source, /amountMode\?: "numeric" \| "expression"/);
  assert.match(source, /amountPreview\?: string \| null/);
  assert.match(source, /amountError\?: string \| null/);
  assert.match(source, /sanitizeMoneyExpressionInput/);
  assert.match(source, /amountMode === "expression"[\s\S]*\? sanitizeMoneyExpressionInput\(e\.target\.value\)[\s\S]*: sanitizeNumericInput\(e\.target\.value\)/);
  assert.match(source, /inputMode=\{amountMode === "expression" \? "text" : "decimal"\}/);
});

test("EntryFormRow reveals expression feedback only while a calculation or message is present", () => {
  const source = readFileSync(new URL("./entry-form-row.tsx", import.meta.url), "utf8");

  assert.match(source, /aria-invalid=\{amountError \? true : undefined\}/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /amountError \? amountError : amountPreview/);
  assert.match(source, /const isAmountCalculationInProgress = amountMode === "expression"/);
  assert.match(source, /const shouldShowAmountFeedback = isAmountCalculationInProgress \|\| hasAmountFeedback;/);
  assert.match(source, /shouldShowAmountFeedback \? "mt-2 max-h-4 opacity-100" : "mt-0 max-h-0 opacity-0"/);
  assert.match(source, /transition-\[max-height,margin-top,opacity\] duration-200 ease-out motion-reduce:transition-none/);
  assert.match(source, /min-h-4 text-right text-\[11px\] leading-4 tabular-nums/);
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
  assert.doesNotMatch(listSource, /fetch\(`\/api\/months\/\$\{monthId\}\/recurring-expenses`[\s\S]*?method:\s*"POST"/);
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
  assert.match(entriesSource, /!entry\.isCompleted && !completionPending && onEntryMoveToMonth && moveTargets\.length > 0/);
  assert.match(entriesSource, /id: "month" as const,[\s\S]*?kind: "selector" as const/);
  assert.match(entriesSource, /onEntryMoveToMonth\?: \(entry: AdditionalEntry, targetMonthId: number\) => void/);
  assert.match(entriesSource, /t\("moveToMonth"\)/);
  assert.match(overviewSource, /moveTargets=\{sortedMonths/);
  assert.match(overviewSource, /handleAdditionalEntryMove\(entry, "expense", month\.id, targetMonthId\)/);
  assert.match(overviewSource, /handleAdditionalEntryMove\(entry, "income", month\.id, targetMonthId\)/);
  assert.match(esMessages, /"moveToMonth": "Mover a mes"/);
  assert.match(enMessages, /"moveToMonth": "Move to month"/);
});

test("additional expense groups can be moved between months with drag and the compact month menu", () => {
  const entriesSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const groupRowSource = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");
  const overviewSource = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");
  const esMessages = readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8");
  const enMessages = readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8");

  assert.match(entriesSource, /onGroupMoveToMonth\?: \(group: AdditionalEntryGroup, targetMonthId: number\) => void/);
  assert.match(entriesSource, /onGroupDragStart\?: \(group: AdditionalEntryGroup\) => void/);
  assert.match(groupRowSource, /draggable=\{canMoveGroup\}/);
  assert.match(groupRowSource, /onDragStart=\{handleDragStart\}/);
  assert.match(groupRowSource, /CalendarArrowUp/);
  assert.match(groupRowSource, /t\("moveGroupToMonth"\)/);
  assert.match(groupRowSource, /className="h-9 w-9 text-muted-foreground hover:text-primary"/);
  assert.ok(
    groupRowSource.indexOf("<TagPicker") < groupRowSource.indexOf('aria-label={`${t("moveGroupToMonth")} ${group.label}`}'),
    "group month move button should render after the tag picker"
  );
  assert.ok(
    groupRowSource.indexOf('aria-label={`${t("moveGroupToMonth")} ${group.label}`}') < groupRowSource.indexOf("{formatCurrency(groupTotal, locale)}"),
    "group month move button should render before the amount"
  );
  assert.match(overviewSource, /type DraggedAdditionalGroup = /);
  assert.match(overviewSource, /const \[draggedGroup, setDraggedGroup\] = useState<DraggedAdditionalGroup \| null>\(null\)/);
  assert.match(overviewSource, /handleAdditionalGroupMove/);
  assert.match(overviewSource, /fetch\(`\/api\/months\/\$\{sourceMonthId\}\/entry-groups\/\$\{group\.id\}`/);
  assert.match(overviewSource, /body: JSON\.stringify\(\{ monthId: targetMonthId \}\)/);
  assert.match(overviewSource, /dropGroupOnMonth/);
  assert.match(esMessages, /"moveGroupToMonth": "Mover grupo a mes"/);
  assert.match(enMessages, /"moveGroupToMonth": "Move group to month"/);
});

test("additional expense group moves use the shared edit-row selector instead of selects", () => {
  const entriesSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const groupRowSource = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");
  const esMessages = readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8");
  const enMessages = readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8");

  for (const source of [entriesSource, groupRowSource]) {
    assert.match(source, /EntryFormSelectorList/);
    assert.match(source, /EntryFormSelectorItem/);
    assert.match(source, /FolderInput/);
    assert.match(source, /handleMoveToGroup/);
    assert.match(source, /const \[movingToGroupId, setMovingToGroupId\] = useState<number \| null>\(null\)/);
    assert.match(source, /id: "group" as const/);
    assert.doesNotMatch(source, /<select/);
  }

  assert.match(esMessages, /"moveToGroup": "Mover a grupo"/);
  assert.match(enMessages, /"moveToGroup": "Move to group"/);
});

test("ungrouped expenses can be dropped onto eligible expense groups with pending and error feedback", () => {
  const entriesSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const groupRowSource = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");
  const esMessages = readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8");
  const enMessages = readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8");

  assert.match(entriesSource, /const \[draggedUngroupedExpense, setDraggedUngroupedExpense\] = useState<AdditionalEntry \| null>\(null\)/);
  assert.match(entriesSource, /handleMoveToGroup\(entry, group\.id, "drop"\)/);
  assert.match(entriesSource, /body: JSON\.stringify\(\{ groupId: toGroupId \}\)/);
  assert.match(entriesSource, /aria-busy=\{movingToGroupId === entry\.id\}/);
  assert.match(entriesSource, /setMoveToGroupError\(t\("moveToGroupError"\)\)/);

  assert.match(groupRowSource, /const canAcceptUngroupedExpense = draggedUngroupedExpense !== null/);
  assert.match(groupRowSource, /onDragOver=\{handleExpenseDragOver\}/);
  assert.match(groupRowSource, /onDragLeave=\{handleExpenseDragLeave\}/);
  assert.match(groupRowSource, /onDrop=\{handleExpenseDrop\}/);
  assert.match(groupRowSource, /aria-busy=\{dropPending\}/);
  assert.match(groupRowSource, /border-dashed border-\[#362baa\]/);
  assert.match(groupRowSource, /!groupMutationLocked[\s\S]*?!hasConflictingMutation[\s\S]*?completionSavingId === null/);

  assert.match(esMessages, /"moveToGroupError": "No se ha podido mover el gasto al grupo\. Inténtalo de nuevo\."/);
  assert.match(enMessages, /"moveToGroupError": "The expense could not be moved to the group\. Please try again\."/);
});

test("additional expense group keeps compact mobile actions above expenses without a duplicate add trigger", () => {
  const groupRowSource = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");
  const entriesStart = groupRowSource.indexOf("{group.entries.map((entry) =>");
  const mobileActionsStart = groupRowSource.indexOf("{/* Mobile group actions */}");
  const mobileLockStart = groupRowSource.indexOf("<CompletionLockButton", mobileActionsStart);

  assert.match(groupRowSource, /"flex min-h-12 cursor-pointer select-none items-center gap-1 px-2\.5 py-1\.5 sm:gap-2"/);
  assert.doesNotMatch(groupRowSource, /sm:min-h-12/);
  assert.match(groupRowSource, /className="shrink-0 rounded-full bg-muted\/40[^\n]+"/);
  assert.match(groupRowSource, /className="hidden h-9 shrink-0 items-center gap-1 sm:flex"/);
  assert.notEqual(entriesStart, -1);
  assert.notEqual(mobileActionsStart, -1);
  assert.ok(mobileActionsStart < entriesStart, "mobile actions should render before the grouped expenses");
  assert.ok(mobileActionsStart < mobileLockStart && mobileLockStart < entriesStart);
  assert.match(
    groupRowSource,
    /className="flex w-full flex-nowrap items-center justify-start gap-1[^\n]+px-2[^\n]+sm:hidden"/
  );
  assert.match(groupRowSource, /className="inline-flex h-7 max-w-32 shrink-0 items-center justify-start/);
  assert.doesNotMatch(groupRowSource, /groupExpenseCount/);
  assert.match(groupRowSource, /<TagIcon className="h-3 w-3 min-\[480px\]:hidden" \/>/);
  assert.match(groupRowSource, /<TagIcon className="h-3 w-3" \/>/);
  assert.match(groupRowSource, /<span className="truncate">\{displayGroupTag\.name\}<\/span>/);
  assert.match(groupRowSource, /<span className="truncate">\{t\("tagButton"\)\}<\/span>/);
  assert.match(groupRowSource, /<CalendarArrowUp className="h-3 w-3" \/>/);
  assert.match(groupRowSource, /<Plus className="h-3 w-3" \/>/);
  assert.match(groupRowSource, /aria-label=\{t\("addToGroup"\)\}/);
  assert.match(groupRowSource, /title=\{t\("addToGroup"\)\}/);
  assert.match(groupRowSource, /<span className="hidden min-\[480px\]:inline">\{t\("moveToMonth"\)\}<\/span>/);
  assert.match(groupRowSource, /<span className="hidden min-\[480px\]:inline">\{t\("addToGroup"\)\}<\/span>/);
  assert.match(groupRowSource, /onClick=\{\(\) => setAddingFormOpen\(true\)\}/);
  assert.match(groupRowSource, /disabled=\{addingFormOpen\}/);
  assert.match(
    groupRowSource,
    /className="hidden items-center justify-between gap-2 sm:flex"/
  );
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

test("EntryFormRow keeps fields wide and uses the typed responsive action collection", () => {
  const source = readFileSync(new URL("./entry-form-row.tsx", import.meta.url), "utf8");

  assert.match(source, /export interface EntryFormCommandAction/);
  assert.match(source, /export interface EntryFormSelectorAction/);
  assert.match(source, /export type EntryFormAction = EntryFormCommandAction \| EntryFormSelectorAction/);
  assert.match(source, /actions\?: EntryFormAction\[\]/);
  assert.match(source, /fieldsDisabled\?: boolean/);
  assert.match(source, /saveDisabled\?: boolean/);
  assert.match(source, /showSaveAction\?: boolean/);
  assert.match(source, /showCancelAction\?: boolean/);
  assert.match(source, /className="grid grid-cols-\[minmax\(0,1fr\)_auto\] gap-x-2"/);
  assert.match(source, /className="relative w-36"/);
  assert.match(source, /className="col-span-2 mt-2 flex min-w-0 items-center justify-end gap-0"/);
  assert.match(source, /sm:hidden/);
  assert.match(source, /className="hidden items-center sm:flex"/);
});

test("EntryFormRow keeps Save and Cancel visible beside the responsive action controls", () => {
  const source = readFileSync(new URL("./entry-form-row.tsx", import.meta.url), "utf8");

  assert.match(source, /t\("actions"\)/);
  assert.match(source, /actions\.length > 0/);
  assert.match(source, /<div className=\{cn\("flex shrink-0 items-center"/);
  assert.match(source, /\{showSaveAction \? \(/);
  assert.match(source, /\{showCancelAction \? \(/);
  assert.match(source, /aria-busy=\{hasPendingAction \|\| undefined\}/);
  assert.match(source, /setMobileSelectorId\(action\.id\)/);
  assert.match(source, /setMobileSelectorId\(null\)/);
  assert.match(source, /t\("back"\)/);
  assert.match(source, /finalFocus/);
  assert.match(source, /100dvh/);
  assert.match(source, /motion-reduce:transition-none/);
  assert.match(source, /moreOpen && "rotate-180"/);
  assert.doesNotMatch(source, /Ellipsis/);
  assert.doesNotMatch(source, /h-1\.5 w-1\.5 rounded-full/);
});

test("EntryFormRow mobile Actions trigger stays neutral across entry states", () => {
  const source = readFileSync(new URL("./entry-form-row.tsx", import.meta.url), "utf8");
  const triggerStart = source.indexOf('<Popover.Root open={moreOpen}');
  const triggerEnd = source.indexOf("<Popover.Portal>", triggerStart);
  const trigger = source.slice(triggerStart, triggerEnd);

  assert.match(trigger, /h-9 min-w-0/);
  assert.match(trigger, /sm:hidden/);
  assert.match(trigger, /text-muted-foreground hover:text-foreground/);
  assert.doesNotMatch(trigger, /bg-primary\/10 text-primary/);
  assert.doesNotMatch(trigger, /bg-emerald-500\/10 text-emerald-700/);
  assert.doesNotMatch(trigger, /shadow-\[inset/);
  assert.match(trigger, /<span>\{t\("actions"\)\}<\/span>/);
  assert.match(trigger, /hasPendingAction \? \([\s\S]*?<Loader2/);
  assert.match(trigger, /disabled=\{disabled \|\| hasPendingAction\}/);
  assert.match(trigger, /<ChevronDown/);
  assert.match(trigger, /moreOpen && "rotate-180"/);
  assert.match(trigger, /motion-reduce:transition-none/);
  assert.doesNotMatch(trigger, /rounded-full/);
});

test("responsive entry actions preserve order, conditional Actions, and localized selector feedback", () => {
  const rowSource = readFileSync(new URL("./entry-form-row.tsx", import.meta.url), "utf8");
  const entriesSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const tagSource = readFileSync(new URL("./tag-picker.tsx", import.meta.url), "utf8");
  const esMessages = readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8");
  const enMessages = readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8");
  const editActionsStart = entriesSource.indexOf("actions={[", entriesSource.indexOf("sortedEntries.map"));
  const editActionsEnd = entriesSource.indexOf("]}", editActionsStart);
  const editActions = entriesSource.slice(editActionsStart, editActionsEnd);
  const order = ["tag", "recurring", "completion", "month", "group"].map((id) =>
    editActions.indexOf(`id: "${id}"`)
  );

  assert.ok(order.every((position) => position >= 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.match(rowSource, /\{actions\.length > 0 \? \(/);
  assert.match(rowSource, /actions = \[\]/);
  assert.match(rowSource, /setInternalPendingId\(action\.id\)/);
  assert.match(rowSource, /disabled=\{action\.disabled \|\| pending \|\| internalPendingId !== null\}/);
  assert.match(tagSource, /export function TagPickerContent/);
  assert.match(tagSource, /onChange\(tag\.id, tag\);\s*onClose\(\);/);
  assert.match(tagSource, /const \[isCreating, setIsCreating\] = useState\(false\)/);
  assert.match(tagSource, /role="alert"/);
  assert.match(tagSource, /aria-busy=\{isCreating \|\| undefined\}/);
  assert.match(esMessages, /"actions": "Acciones"/);
  assert.match(enMessages, /"actions": "Actions"/);
  assert.match(esMessages, /"back": "Volver"/);
  assert.match(enMessages, /"back": "Back"/);
  assert.match(esMessages, /"tagCreateError"/);
  assert.match(enMessages, /"tagCreateError"/);
});

test("completion locks replace the icon with centered pending feedback and articulate confirmation", () => {
  const lockSource = readFileSync(new URL("./completion-lock-button.tsx", import.meta.url), "utf8");
  const entriesSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const groupSource = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");
  const globalStyles = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

  assert.doesNotMatch(lockSource, /LockKeyhole(?:Open)?/);
  assert.match(lockSource, /animateConfirmation\?: boolean/);
  assert.match(lockSource, /onConfirmationAnimationEnd\?: \(\) => void/);
  assert.match(lockSource, /pending \? \(\s*<LoaderCircle className="h-3\.5 w-3\.5 animate-spin text-primary motion-reduce:animate-none" \/>/);
  assert.doesNotMatch(lockSource, /absolute -right-1 -top-1/);
  assert.match(lockSource, /<path[\s\S]*data-slot="completion-lock-shackle"/);
  assert.match(lockSource, /animate-lock-open/);
  assert.match(lockSource, /animate-lock-close/);
  assert.match(lockSource, /motion-reduce:animate-none/);
  assert.match(lockSource, /aria-busy=\{pending\}/);
  assert.match(lockSource, /actionSize \? "icon-sm" : "icon-xs"/);
  assert.match(globalStyles, /@keyframes lock-close \{[\s\S]*translate\(4px, -2px\) rotate\(16deg\)[\s\S]*translate\(0, 0\) rotate\(0deg\)/);
  assert.match(globalStyles, /@keyframes lock-open \{[\s\S]*translate\(0, 0\) rotate\(0deg\)[\s\S]*translate\(4px, -2px\) rotate\(16deg\)/);
  for (const source of [entriesSource, groupSource]) {
    assert.match(source, /JSON\.stringify\(\{ isCompleted: nextCompleted \}\)/);
    assert.match(source, /setCompletionError\(t\("completionError"\)\)/);
    assert.match(source, /role="alert"/);
  }
});

test("successful completion mutations keep a confirmation phase until the lock animation ends", () => {
  const entriesSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const groupSource = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");

  assert.match(entriesSource, /const \[completionConfirmationId, setCompletionConfirmationId\] = useState<number \| null>\(null\);/);
  assert.match(entriesSource, /setCompletionConfirmationId\(entry\.id\);/);
  assert.match(entriesSource, /animateConfirmation=\{completionConfirming\}/);
  assert.match(entriesSource, /onConfirmationAnimationEnd=\{\(\) => setCompletionConfirmationId\(null\)\}/);
  assert.match(entriesSource, /entry\.isCompleted \|\| completionPending \|\| completionConfirming/);

  assert.match(groupSource, /const \[entryCompletionConfirmationId, setEntryCompletionConfirmationId\] = useState<number \| null>\(null\);/);
  assert.match(groupSource, /const \[isGroupCompletionConfirming, setIsGroupCompletionConfirming\] = useState\(false\);/);
  assert.match(groupSource, /setEntryCompletionConfirmationId\(entry\.id\);/);
  assert.match(groupSource, /setIsGroupCompletionConfirming\(true\);/);
  assert.match(groupSource, /onConfirmationAnimationEnd=\{\(\) => setEntryCompletionConfirmationId\(null\)\}/);
  assert.match(groupSource, /onConfirmationAnimationEnd=\{\(\) => setIsGroupCompletionConfirming\(false\)\}/);
});

test("group completion errors render after the collapsible body boundary", () => {
  const source = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");

  assert.match(
    source,
    /<\/div>\s*<\/div>\s*<\/div>\s*\{completionError \? \([\s\S]*?role="alert"/
  );
});

test("completion locks remain available in contextual editors before completion", () => {
  const entriesSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const groupSource = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");
  const esMessages = readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8");
  const enMessages = readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8");
  const entriesListStart = entriesSource.indexOf("{sortedEntries.map((entry) => {");
  const entryEditorStart = entriesSource.indexOf("const isEditing = !readOnly && editingId === entry.id", entriesListStart);
  const entryLockStart = entriesSource.indexOf('id: "completion"', entryEditorStart);
  const entryDisplayStart = entriesSource.indexOf("data-highlight-id={`entry-${entry.id}`}", entryEditorStart);
  const expandedGroupStart = groupSource.indexOf("{/* Expanded body */}");
  const groupLockStart = groupSource.indexOf("<CompletionLockButton", expandedGroupStart);
  const groupedEntriesStart = groupSource.indexOf("{group.entries.map((entry) =>", expandedGroupStart);
  const desktopGroupActionsStart = groupSource.indexOf("className=\"hidden items-center justify-between gap-2 sm:flex\"", groupedEntriesStart);
  const desktopAddStart = groupSource.indexOf("onClick={() => setAddingFormOpen(true)}", desktopGroupActionsStart);
  const desktopGroupLockStart = groupSource.indexOf("<CompletionLockButton", desktopAddStart);

  assert.notEqual(entryEditorStart, -1);
  assert.ok(entryEditorStart < entryLockStart && entryLockStart < entryDisplayStart);
  assert.match(entriesSource, /const isEditing = !readOnly && editingId === entry\.id/);
  assert.match(entriesSource, /!readOnly && !entry\.isCompleted/);
  assert.doesNotMatch(entriesSource, /LockKeyhole/);
  assert.match(groupSource, /const groupLocked = readOnly \|\| group\.isCompleted/);
  assert.ok(expandedGroupStart < groupLockStart && groupLockStart < groupedEntriesStart);
  assert.ok(desktopGroupActionsStart < desktopAddStart && desktopAddStart < desktopGroupLockStart);
  assert.match(entriesSource, /id: "completion",[\s\S]*?icon: <CompletionLockIcon/);
  assert.match(groupSource, /id: "completion",[\s\S]*?icon: <CompletionLockIcon/);
  assert.match(entriesSource, /showSaveAction=\{!entry\.isCompleted && !completionPending\}/);
  assert.match(groupSource, /showSaveAction=\{!entry\.isCompleted && completionSavingId !== entry\.id\}/);
  assert.match(entriesSource, /cancelLabel=\{entry\.isCompleted \? t\("exit"\) : t\("cancel"\)\}/);
  assert.match(groupSource, /cancelLabel=\{entry\.isCompleted \? t\("exit"\) : t\("cancel"\)\}/);
  assert.match(esMessages, /"exit": "Salir"/);
  assert.match(enMessages, /"exit": "Exit"/);
  assert.doesNotMatch(groupSource, /LockKeyhole/);
  assert.match(groupSource, /className="shrink-0 text-muted-foreground hover:text-destructive"/);
  assert.doesNotMatch(groupSource, /className="hidden shrink-0 text-muted-foreground hover:text-destructive sm:inline-flex"/);
});

test("entry editor swaps share a measured height transition with stable resting footprints", () => {
  const transitionSource = readFileSync(new URL("./entry-height-transition.tsx", import.meta.url), "utf8");
  const entriesSource = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const groupSource = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");

  assert.match(transitionSource, /export function EntryHeightTransition/);
  assert.match(transitionSource, /useLayoutEffect/);
  assert.match(transitionSource, /getBoundingClientRect\(\)\.height/);
  assert.match(transitionSource, /prefers-reduced-motion: reduce/);
  assert.match(transitionSource, /event\.propertyName !== "height"/);
  assert.match(transitionSource, /HEIGHT_TRANSITION_FALLBACK_MS/);
  assert.match(transitionSource, /transition-\[height\] duration-200/);
  assert.match(transitionSource, /container\.style\.height = "auto"/);

  for (const source of [entriesSource, groupSource]) {
    assert.match(source, /<EntryHeightTransition/);
    assert.match(source, /stateKey=\{[\s\S]*?\? "editing" : "resting"\}/);
    assert.match(source, /min-h-10 rounded-(?:xl|lg)/);
    assert.match(source, /inline-flex h-7 items-center whitespace-nowrap rounded-md px-2/);
    assert.match(source, /transition-\[border-color,background-color,box-shadow,opacity\]/);
  }
});

test("completed ungrouped entries replace Delete with a direct compact reopen action", () => {
  const source = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const restingRowStart = source.indexOf('data-highlight-id={`entry-${entry.id}`}');
  const trailingActionsStart = source.indexOf(
    'className="flex shrink-0 items-center gap-1.5"',
    restingRowStart
  );
  const cardEnd = source.indexOf("</CardContent>", trailingActionsStart);
  const deleteStart = source.indexOf("<AlertDialog>", trailingActionsStart);
  const reopenStart = source.indexOf("<CompletionLockButton", deleteStart);
  const trailingActionsSource = source.slice(trailingActionsStart, cardEnd);

  assert.notEqual(restingRowStart, -1, "expected the resting entry row");
  assert.notEqual(trailingActionsStart, -1, "expected the resting entry action area");
  assert.notEqual(deleteStart, -1, "expected Delete in the resting entry action area");
  assert.notEqual(reopenStart, -1, "expected a direct reopen lock after Delete");
  assert.ok(deleteStart < reopenStart && reopenStart < cardEnd);
  assert.match(trailingActionsSource, /entry\.isCompleted \|\| completionPending/);
  assert.match(trailingActionsSource, /completed=\{entry\.isCompleted \|\| completionPending\}/);
  assert.match(trailingActionsSource, /pending=\{completionPending\}/);
  assert.match(trailingActionsSource, /onToggle=\{\(\) => void handleCompletionToggle\(entry\)\}/);
  assert.match(trailingActionsSource, /className="h-6 w-6"/);
});

test("completed groups and grouped entries replace Delete without changing header height", () => {
  const source = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");
  const headerStart = source.indexOf("{/* Group header */}");
  const expandedStart = source.indexOf("{/* Expanded body */}", headerStart);
  const headerDeleteStart = source.indexOf("<AlertDialog>", headerStart);
  const headerReopenStart = source.indexOf("<CompletionLockButton", headerDeleteStart);
  const mobileActionsStart = source.indexOf("{/* Mobile group actions */}", expandedStart);
  const groupedEntriesStart = source.indexOf("{group.entries.map((entry) =>", mobileActionsStart);
  const groupedDeleteStart = source.indexOf("<AlertDialog>", groupedEntriesStart);
  const groupedReopenStart = source.indexOf("<CompletionLockButton", groupedDeleteStart);
  const addFormStart = source.indexOf("{/* Add entry to group form */}", groupedEntriesStart);
  const desktopFooterStart = source.indexOf("{!readOnly", addFormStart);
  const desktopActionsStart = source.indexOf(
    'className="hidden items-center justify-between gap-2 sm:flex"',
    desktopFooterStart
  );
  const completionErrorStart = source.indexOf("{completionError ? (", desktopActionsStart);
  const headerSource = source.slice(headerStart, expandedStart);
  const mobileActionsSource = source.slice(mobileActionsStart, groupedEntriesStart);
  const groupedRowsSource = source.slice(groupedEntriesStart, addFormStart);
  const desktopActionsSource = source.slice(desktopFooterStart, completionErrorStart);

  assert.notEqual(headerDeleteStart, -1, "expected group Delete in the header");
  assert.notEqual(headerReopenStart, -1, "expected direct group reopen in the header");
  assert.ok(headerDeleteStart < headerReopenStart && headerReopenStart < expandedStart);
  assert.match(headerSource, /min-h-12/);
  assert.doesNotMatch(headerSource, /sm:min-h-12/);
  assert.match(headerSource, /completed=\{group\.isCompleted \|\| isSavingCompletion\}/);
  assert.match(headerSource, /pending=\{isSavingCompletion\}/);
  assert.match(headerSource, /className="h-6 w-6"/);

  assert.notEqual(groupedDeleteStart, -1, "expected grouped-entry Delete");
  assert.notEqual(groupedReopenStart, -1, "expected direct grouped-entry reopen");
  assert.ok(groupedDeleteStart < groupedReopenStart && groupedReopenStart < addFormStart);
  assert.match(groupedRowsSource, /entry\.isCompleted \|\| completionSavingId === entry\.id/);
  assert.match(groupedRowsSource, /pending=\{completionSavingId === entry\.id\}/);
  assert.match(groupedRowsSource, /className="h-6 w-6"/);

  assert.match(
    mobileActionsSource,
    /!readOnly && !group\.isCompleted && !isSavingCompletion && !isGroupCompletionConfirming \? \(/
  );
  assert.match(
    desktopActionsSource,
    /!readOnly && !group\.isCompleted && !isSavingCompletion && !isGroupCompletionConfirming \? \(/
  );
});

test("group completion collapses visual state and restores it after a failed lock", () => {
  const source = readFileSync(new URL("./additional-entry-group-row.tsx", import.meta.url), "utf8");
  const entryHandlerStart = source.indexOf("const handleEntryCompletionToggle = async (entry: AdditionalEntry) => {");
  const groupHandlerStart = source.indexOf("const handleGroupCompletionToggle = async () => {");
  const handlerEnd = source.indexOf("const handleGroupTagChange = async", groupHandlerStart);
  const entryHandlerSource = source.slice(entryHandlerStart, groupHandlerStart);
  const groupHandlerSource = source.slice(groupHandlerStart, handlerEnd);
  const entryTryStart = entryHandlerSource.indexOf("try {");
  const entryCatchStart = entryHandlerSource.indexOf("} catch {");
  const entryFinallyStart = entryHandlerSource.indexOf("} finally {");
  const groupTryStart = groupHandlerSource.indexOf("try {");
  const groupCatchStart = groupHandlerSource.indexOf("} catch {");
  const groupFinallyStart = groupHandlerSource.indexOf("} finally {");

  assert.match(
    entryHandlerSource.slice(0, entryTryStart),
    /if \(nextCompleted\) setEditingId\(null\);/
  );
  assert.match(
    entryHandlerSource.slice(entryCatchStart, entryFinallyStart),
    /if \(nextCompleted\) setEditingId\(entry\.id\);/
  );
  assert.match(
    groupHandlerSource.slice(0, groupTryStart),
    /if \(nextCompleted\) onCollapsedChange\(true\);/
  );
  assert.match(
    groupHandlerSource.slice(groupCatchStart, groupFinallyStart),
    /if \(nextCompleted\) onCollapsedChange\(false\);/
  );
});

test("ungrouped completion collapses the editor and restores it after a failed lock", () => {
  const source = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");
  const handlerStart = source.indexOf("const handleCompletionToggle = async (entry: AdditionalEntry) => {");
  const handlerEnd = source.indexOf("const handleMoveToGroup = async", handlerStart);
  const handlerSource = source.slice(handlerStart, handlerEnd);
  const tryStart = handlerSource.indexOf("try {");
  const catchStart = handlerSource.indexOf("} catch {");
  const finallyStart = handlerSource.indexOf("} finally {");
  const optimisticSource = handlerSource.slice(0, tryStart);
  const failureSource = handlerSource.slice(catchStart, finallyStart);

  assert.notEqual(handlerStart, -1, "expected the ungrouped completion handler");
  assert.notEqual(handlerEnd, -1, "expected the handler boundary");
  assert.match(optimisticSource, /if \(nextCompleted\) setEditingId\(null\);/);
  assert.match(failureSource, /if \(nextCompleted\) setEditingId\(entry\.id\);/);
});
