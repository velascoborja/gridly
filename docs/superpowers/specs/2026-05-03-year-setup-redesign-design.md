# Year Setup Redesign

## Goal

Redesign the year creation screen at `/setup/[year]` so it behaves like a guided financial setup workspace instead of a marketing-style onboarding card plus a long form. The behavior must remain unchanged: creating a year still sends the same configuration payload to `createAndPrefillYear`, creates all 12 months, stores recurring expense templates, applies extra pays when enabled, and hard-navigates to the redirect target.

## Problems To Solve

- The current large blue card contains generic copy that does not map clearly to Gridly's actual setup behavior.
- Field order is not intuitive enough for a finance setup flow.
- The screen does not show the practical effect of entered values before creation.
- The current layout is visually heavy on desktop and does not provide a strong guided structure on mobile.

## Chosen Direction

Use a single-page guided setup with a responsive stepper and a live summary panel.

On desktop, the page has three zones:

1. A left stepper for orientation and section navigation.
2. A central grouped form for the actual setup fields.
3. A right sticky summary panel showing the effect of the current inputs.

On mobile, the left stepper becomes a compact horizontal progress/navigation row above the form, the form is single-column, and the summary becomes a normal review block near the submit action.

This is not a true multi-step wizard. All fields remain present on one page, and the stepper only helps the user understand and navigate the setup.

## Layout

### Header

Replace the current blue promotional panel with a compact, app-like header.

The header includes:

- Gridly wordmark and development badge when applicable.
- Main title: configure the target year.
- Short behavior-focused description explaining that these values create the 12 months and can be adjusted later.

The header must not include decorative status cards such as redirection or generic guided setup text.

### Stepper

The stepper sections are:

1. Starting point.
2. Income.
3. Monthly plan.
4. Recurring expenses.
5. Review and create.

Desktop behavior:

- Render as a left rail.
- Keep labels concise.
- Use static section links that jump to the related form group. Active scroll tracking is out of scope for this redesign.
- Use conservative surfaces, borders, and hover states aligned with `DESIGN.md`.

Mobile behavior:

- Render as a horizontal scrollable row near the top.
- Use compact labels or step numbers plus labels.
- Avoid sticky side navigation on narrow screens.

### Main Form

Group fields by financial purpose:

- Starting point: `startingBalance`, with clear locked/derived messaging when the value comes from the previous year.
- Income: `estimatedSalary`, `hasExtraPayments`, and `estimatedExtraPayment`.
- Monthly plan: `monthlyHomeExpense`, `monthlyPersonalBudget`, and `monthlyInvestment`.
- Growth: `interestRate`.
- Recurring expenses: existing `RecurringExpenseTemplateEditor`.

The form should keep the current parsing rules: comma and dot decimal input both work, empty numeric fields resolve to `0`, and `interestRate` is submitted as a decimal by dividing the visible percentage by `100`.

### Summary Panel

Add a live preview derived from current local form state. It should explain setup consequences with numbers instead of generic copy.

The summary should include:

- Starting balance source or amount.
- Monthly income.
- Monthly planned expenses.
- Monthly investment.
- Estimated monthly savings before interest.
- Extra pays status, including the configured amount when enabled.
- A concise note that recurring templates will be copied into every month.

The summary is informational only. It must not change submit behavior or persist any additional data.

## Visual Direction

Follow `DESIGN.md` and existing app tokens:

- Stripe-inspired white and navy surfaces with restrained purple accents.
- Conservative radii between 4px and 8px for cards, buttons, and inputs.
- Blue-tinted depth for elevated panels.
- Financial numbers use tabular styling where available.
- Avoid large decorative gradient cards, random color blobs, and marketing copy.

The result should feel like a premium fintech configuration workspace: dense enough for real data entry, but clearer and calmer than the current screen.

## Data Flow

Keep `SetupPageClient` as the owner of setup state and submission.

The existing payload shape remains:

- `year`
- `startingBalance`
- `estimatedSalary`
- `hasExtraPayments`
- `estimatedExtraPayment`
- `monthlyInvestment`
- `monthlyHomeExpense`
- `monthlyPersonalBudget`
- `interestRate`
- `recurringExpenses`

Submission still calls `createAndPrefillYear(payload)` and then performs a hard navigation to `/${locale}${redirectTo}`.

No API, database schema, or calculation behavior changes are part of this redesign.

## Internationalization

All visible strings must live in `messages/es.json` and `messages/en.json`. Spanish copy should be written first. Existing setup keys may be reused where the wording still matches the redesigned behavior. Keys that only supported the removed blue card should be replaced by the new section and summary keys during implementation.

## Accessibility

- Stepper entries should be real links or buttons that can be used from keyboard.
- The submit button remains a native form submit.
- Error text remains an alert.
- The extra-pay toggle must keep an accessible control role.
- Locked starting balance fields must clearly expose disabled state and explanatory copy.

## Testing

Add focused source or component tests matching the existing project style. Tests should verify:

- Setup still submits the same payload fields, including recurring expenses.
- Numeric fields still start empty and use translated placeholders.
- The redesigned setup screen uses section translation keys for the guided groups.
- The old decorative status-card copy is no longer rendered by `SetupPageClient`.
- The summary panel is derived from local state and does not introduce new payload fields.

Run the existing relevant tests and `npm run lint` after implementation.

## Documentation

Update `docs/features/year-settings.md` after implementation to describe the redesigned setup layout and summary preview. No domain-rule documentation changes are expected because behavior stays unchanged.
