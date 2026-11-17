# Personal financial snapshot — `personal-financial-snapshot`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Institutional-grade personal financial analytics (PAE).

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **PAE personal portfolio snapshot analysis**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the personal financial snapshot manifest

The caller submits one JSON manifest: a declared personal
financial snapshot record — net worth, allocation and cash
flow as they are at a stated point in time. Every field below
is read by the named section's checks. A field **absent** =
evidence missing (`INSUFFICIENT_EVIDENCE`); a field present
but false / invalid = the check fails (`SNAPSHOT_NOT_SOUND`).
All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `subject` (string; carried into the verdict output, not itself checked) | — |
| `snapshot.as_of_date_stated` (boolean) | snapshot_completeness |
| `snapshot.currency_stated` (boolean) | snapshot_completeness |
| `snapshot.net_worth_stated` (boolean) | snapshot_completeness |
| `snapshot.allocation_stated` (boolean) | snapshot_completeness |
| `snapshot.cash_flow_stated` (boolean) | snapshot_completeness |
| `snapshot.cash_flow_period_stated` (boolean) | snapshot_completeness |
| `figures.total_assets` (number) | balance_sheet_arithmetic |
| `figures.total_liabilities` (number) | balance_sheet_arithmetic |
| `figures.net_worth` (number) | balance_sheet_arithmetic |
| `figures.period_income` (number) | cash_flow_and_fees_arithmetic |
| `figures.period_expenses` (number) | cash_flow_and_fees_arithmetic |
| `figures.net_cash_flow` (number) | cash_flow_and_fees_arithmetic |
| `figures.annual_fees_and_drag_total` (number) | cash_flow_and_fees_arithmetic |
| `assets` (list of asset-row objects, each with the entry fields below; computed, see below) | balance_sheet_arithmetic |
| `assets[].name` (string; names the row in the computed outputs) | balance_sheet_arithmetic |
| `assets[].category` (string; the allocation category; must be present and non-empty per row) | balance_sheet_arithmetic |
| `assets[].amount` (number) | balance_sheet_arithmetic |
| `liabilities` (list of liability-row objects; an empty list is a declared zero, not missing evidence) | balance_sheet_arithmetic |
| `liabilities[].name` (string) | balance_sheet_arithmetic |
| `liabilities[].amount` (number) | balance_sheet_arithmetic |
| `fees` (list of fee-row objects; an empty list is a declared none, not missing evidence) | cash_flow_and_fees_arithmetic |
| `fees[].name` (string) | cash_flow_and_fees_arithmetic |
| `fees[].amount` (number) | cash_flow_and_fees_arithmetic |
| `lenses.risk_lens_stated` (boolean) | lenses_and_costs |
| `lenses.liquidity_lens_stated` (boolean) | lenses_and_costs |
| `lenses.tax_efficiency_lens_stated` (boolean) | lenses_and_costs |
| `lenses.time_horizon_lens_stated` (boolean) | lenses_and_costs |
| `costs.fees_and_drag_surfaced` (boolean) | lenses_and_costs |
| `costs.fees_and_drag_total_stated` (boolean) | lenses_and_costs |
| `traceability.math_shown` (boolean) | traceability_and_advice_boundary |
| `traceability.every_claim_traces_to_a_number` (boolean) | traceability_and_advice_boundary |
| `traceability.educational_only_boundary_stated` (boolean) | traceability_and_advice_boundary |
| `red_lines.buy_or_sell_recommendation_present` (boolean; must be `false` to pass) | traceability_and_advice_boundary |
| `red_lines.personalised_financial_advice_present` (boolean; must be `false` to pass) | traceability_and_advice_boundary |
| `red_lines.projection_or_scenario_present` (boolean; must be `false` to pass) | traceability_and_advice_boundary |
| `red_lines.ranked_action_recommendations_present` (boolean; must be `false` to pass) | traceability_and_advice_boundary |
| `red_lines.claim_without_traced_number_present` (boolean; must be `false` to pass) | traceability_and_advice_boundary |

Several checks are computed from the declared rows and
figures, using only the skill's own stated rules plus the
arithmetic / internal consistency of the declared figures
themselves — no outside threshold is imported:

- **Assets declared:** the declared `assets` list passes
  only when it is present and non-empty; an absent list is
  missing evidence, an empty list fails.
- **Every asset row complete:** every declared asset row
  must carry a non-empty `name`, a non-empty allocation
  `category` and an `amount`. A row with a field absent is
  missing evidence; a row naming an empty name or category
  fails.
- **No asset name duplicated:** no declared asset `name` may
  appear on more than one asset row. A row with `name`
  absent is missing evidence for this check.
- **Asset rows sum to the declared total:** the declared
  asset row amounts must sum to `figures.total_assets`.
- **Liabilities declared:** the declared `liabilities` list
  passes when it is present; an empty list is a declared
  zero — a snapshot with no liabilities — not missing
  evidence. Every liability row must carry a non-empty
  `name` and an `amount`, no liability name may be
  duplicated, and the row amounts must sum to
  `figures.total_liabilities`.
- **Net worth re-derived:** the declared `figures.net_worth`
  must equal `figures.total_assets` minus
  `figures.total_liabilities`.
- **Net cash flow re-derived:** the declared
  `figures.net_cash_flow` must equal `figures.period_income`
  minus `figures.period_expenses` for the stated period.
- **Fees declared:** the declared `fees` list passes when
  it is present; an empty list is a declared none. Every
  fee row must carry a non-empty `name` and an `amount`, no
  fee name may be duplicated, and the row amounts must sum
  to `figures.annual_fees_and_drag_total` (the skill:
  "always surface fees and drag").

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the six primary computed checks above cannot be
completed), the counts `assets_count`, `liabilities_count`
and `fees_count` (the declared list lengths, or null when a
list is not declared — counts are reported as integers,
exactly), the computed totals and differences
`computed_asset_total`, `asset_total_difference`,
`computed_liability_total`, `liability_total_difference`,
`net_worth_difference`, `computed_net_cash_flow`,
`net_cash_flow_difference`, `computed_fees_total` and
`fees_total_difference`, and the duplicate-name lists
`duplicate_asset_names`, `duplicate_liability_names` and
`duplicate_fee_names` (names declared on more than one row,
in the order their second occurrence appears).
**Fixed serialization rule:** computed amounts are reported
as strings with exactly six decimal places, produced in
both implementations by the same rule — round half up to
6dp, `floor(v * 1000000 + 0.5) / 1000000`, then format with
exactly six decimals; comparisons compare the fixed-6dp
difference to zero. A computed amount is null when the
figures or rows it needs are absent or incomplete. That
fixed serialization is what makes the Python and TypeScript
outputs byte-identical.

The skill states no numeric pass/fail threshold — its
snapshot demands are the record's own declared figures and
their consistency, not bars the atom can set. Quantities
are computed and reported; the only bars on the computed
rows are completeness and arithmetic consistency over the
caller's own declared figures, exactly as stated above.
Declined thresholds, named: a savings-rate bar; a net-worth
target or adequacy level; a liquidity bar in months of
expenses (the skill names liquidity as a lens and states no
number of months); a debt-to-income or debt-to-assets ratio
cutoff; an allocation percentage target, diversification
rule or single-holding concentration cap; a risk-tolerance
score or risk level a snapshot must sit at; a tax-efficiency
rate, bracket or saving figure; a fee percentage, drag cap
or cost ratio a snapshot must stay under; a minimum
cash-flow surplus or a sign the net cash flow must carry; a
time-horizon length in years a snapshot must declare.

The verdict is one of `SNAPSHOT_SOUND` (all 34 checks
pass), `SNAPSHOT_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is
missing), across five sections: snapshot_completeness,
balance_sheet_arithmetic, cash_flow_and_fees_arithmetic,
lenses_and_costs, traceability_and_advice_boundary.

## Distinct ground

The nearest deployed siblings are `cash-flow-forecast`
(bound skill `cash-flow-management`), which validates a
declared **business** cash-flow forecast artifact — 13-week
weekly buckets and closing balances, a reserve target sized
in months of fixed costs, runway as cash ÷ burn, working
capital and levers, stress cases and reporting — and
`budget-design-review` (bound skill `budgeting`), which
reviews a declared budget **design**: its lines and owners,
driver products (quantity × unit cost), its balance against
expected income, contingency, approval baseline and
monitoring. This atom shares **zero checks** with either:
every check here is a personal snapshot question — an as-of
snapshot stating net worth, allocation and cash flow, asset
rows summing to the declared asset total, liability rows
summing to the declared liability total, net worth
re-derived as assets minus liabilities, net cash flow
re-derived as period income minus period expenses, the four
personal lenses the bound skill names (risk, liquidity,
tax-efficiency, time horizon) stated, fee rows summing to
the declared fees-and-drag total, every claim tracing to a
number, and no advice, recommendation, projection or ranked
action in the record. The boundary is: a personal snapshot
as it is, here; a business forecast of future weeks there;
a budget design for future spending there. The portfolio
atoms (`portfolio-risk-analytics-report`,
`reconciled-portfolio-performance-report`) compute risk and
performance analytics over a portfolio's returns and
holdings — this atom computes no return, risk metric or
performance figure at all, and no other live or staged
sibling audits a personal financial snapshot record.

## Honest scoping

This atom audits a **declared** personal financial
snapshot record — it produces no snapshot itself, reads no
account, statement or holding, verifies no declared figure
against any outside source, and does not verify that a
declared lens was ever actually applied. A snapshot is
sound *on the caller's declared evidence*: a record that
declares consistent figures, all four lenses stated and no
advice present passes those checks even if the real
finances differ. It is a completeness and consistency audit
of the snapshot record the skill requires, **not financial
advice, a recommendation service, or a projection**: it
never says what the caller should buy, sell, hold, save or
change, never ranks actions, and never projects a figure
forward.

The bound skill contains advice-shaped material — its
"Scenarios" step (what moves the needle most: contributions
vs returns vs costs) and its "Actions — ranked by impact,
with the math shown" step. This atom's check set covers
only the record-completeness / consistency ground (snapshot,
lenses as stated, costs surfaced, traceability); scenarios
and ranked actions are **not** produced, computed or
endorsed here, and their declared presence in a snapshot
record is a red-line failure, exactly because a snapshot is
a record of what is, not a plan for what to do.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds
beyond the skill's own stated rules (see the declined list
above); no live verification of any declared figure; no
judgment of snapshot *quality* — whether the allocation is
wise, the liquidity adequate, the risk appropriate or the
tax position efficient is never judged, only that each lens
is declared stated; no return, performance, risk-metric or
benchmark computation of any kind.

## U-13 adjacency note

**U-13 flag — finance-adjacent (recorded, not softened):**
this atom sits in regulated-finance territory by subject
matter — personal net worth, cash flow, fees and lenses over
a person's finances — and it is therefore flagged for the
owner's per-unit ruling queue under U-13. The mitigating
fact, stated plainly and not as a waiver: the atom audits a
declared snapshot record for completeness and arithmetic
consistency and gives no advice, no recommendation and no
projection; the skill's own rule is "Educational only — not
financial advice, no buy/sell recommendations," and that
rule is enforced here as red lines. The flag goes to the
owner's ruling queue; blanket approval does not waive it,
and no deploy happens on this atom without the owner's
explicit per-unit ruling after the screen.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally — NOT deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved
queue.

## Named doubt (from the register)

Borderline regulated; education only
