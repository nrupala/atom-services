# Budget design review — `budget-design-review`

**Deliverable type:** REVIEW. This atom sells the review it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Run budgets that hold — cycles, owners, zero-based vs incremental, variance reviews, rolling forecasts.

A caller submits the inputs the bound skill works on and receives one review back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this review on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Business budget planning work**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the budget-design manifest

The caller submits one JSON manifest: one declared budget design —
its scope, lines, drivers, totals, revenue link, contingency,
approval baseline, monitoring and close. Every field below is read
by the named section's checks. A field **absent** = evidence
missing (`INSUFFICIENT_EVIDENCE`); a field present but false /
invalid = the check fails (`BUDGET_DESIGN_NOT_SOUND`). All fields
are booleans unless noted.

| Field | Read by |
|---|---|
| `budget` (string; carried into the verdict output, not itself checked) | — |
| `scope.budget_type` (string; computed, see below) | scope |
| `scope.entity_named` | scope |
| `scope.currency_stated` | scope |
| `scope.governs_stated` | scope |
| `scope.exclusions_stated` | scope |
| `lines` (list of line objects; absent = line-derived checks missing, empty list = `lines_present` fails) | structure_and_owners, drivers_and_totals |
| `lines[].name` (string; carried for readability, not itself checked) | — |
| `lines[].owner` (string; computed, see below) | structure_and_owners |
| `lines[].approach` (string; computed, see below) | structure_and_owners |
| `lines[].driver_documented` | drivers_and_totals |
| `lines[].driver_quantity` (number; computed, see below) | drivers_and_totals |
| `lines[].driver_unit_cost` (number; computed, see below) | drivers_and_totals |
| `lines[].amount` (number; computed, see below) | drivers_and_totals |
| `totals.declared_total` (number; computed, see below) | drivers_and_totals, revenue_and_contingency |
| `totals.expected_income` (number; computed, see below) | revenue_and_contingency |
| `revenue.linked_to_forecast` | revenue_and_contingency |
| `contingency.explicit_line_present` | revenue_and_contingency |
| `contingency.sized_to_identified_risks` | revenue_and_contingency |
| `contingency.hidden_padding_present` (must be `false` to pass — skill red line) | revenue_and_contingency |
| `approval.baseline_approved_and_locked` | approval_and_baseline |
| `approval.approval_thresholds_documented` | approval_and_baseline |
| `approval.revisions_reapproved` | approval_and_baseline |
| `monitoring.monthly_variance_process_running` | monitoring_and_close |
| `monitoring.variance_thresholds_trigger_explanations` | monitoring_and_close |
| `monitoring.variance_actions_tracked` | monitoring_and_close |
| `monitoring.rolling_forecast_cadence_set` | monitoring_and_close |
| `monitoring.rolling_horizon_months` (number; computed, see below) | monitoring_and_close |
| `close.annual_true_up_done` | monitoring_and_close |
| `close.carry_over_rules_decided` | monitoring_and_close |
| `close.lessons_carried_to_next_cycle` | monitoring_and_close |
| `close.silent_reallocations_made` (must be `false` to pass — skill red line) | monitoring_and_close |
| `close.actuals_edited_without_annotation` (must be `false` to pass — skill red line) | monitoring_and_close |

Seven checks are computed from the declared values, using only
what the skill itself states plus the arithmetic of the declared
numbers — no outside threshold is imported:

- **Budget kind:** the skill's method step 1 scopes a budget as
  "operating vs capital vs personal". A declared
  `scope.budget_type` therefore passes only when it is one of
  those three stated kinds (`operating`, `capital`, `personal`);
  any other string is present and fails, an absent type is
  missing evidence. The value is validated as a string only,
  never enum-checked at the type layer — membership is a verdict
  check, not a type error.
- **Line ownership:** the skill's method step 2 and quality gate
  demand that every line has a named owner ("lines without
  owners become orphaned spending"). The check passes only when
  every declared line carries a non-empty `owner` string; a line
  whose owner key is absent makes the check missing evidence, an
  empty owner string fails. The output reports the offending
  positions as `ownerless_line_indexes` (null when no lines list
  is declared) and the count as `lines_evaluated`.
- **Line approaches:** the skill's method step 3 names exactly
  two approaches — zero-based for new/volatile areas, incremental
  for stable ones — and requires stating which is used. Every
  line's declared `approach` therefore passes only as
  `zero_based` or `incremental`; an absent approach key is
  missing evidence, any other string fails.
- **Driver products:** the skill's method step 4 builds lines
  from drivers — "headcount × rate, units × cost, usage ×
  price". A line's declared `amount` therefore passes only when
  it equals its declared `driver_quantity` × `driver_unit_cost`;
  if any of the three numbers is absent on any line, the check
  is missing evidence.
- **Total re-derivation:** the declared `totals.declared_total`
  passes only when it equals the sum of the declared line
  amounts. The output reports `computed_total` (the re-derived
  sum, null when it cannot be computed) and `total_difference`
  (declared minus computed, null likewise).
- **Balance against income:** the skill's method step 5 states
  "budgets balance against expected income, not hope". The
  declared total therefore passes only when it does not exceed
  the declared `totals.expected_income`; an absent figure is
  missing evidence.
- **Rolling horizon:** the skill's method step 8 states a
  "rolling 12-month forecast". A declared
  `monitoring.rolling_horizon_months` therefore passes only at
  exactly 12; an absent horizon is missing evidence.

**Fixed serialization rule:** computed money totals are reported
as strings with exactly two decimal places, produced in both
implementations by the same rule — round half up to 2dp,
`floor(v * 100 + 0.5) / 100`, then format with exactly two
decimals. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The output also reports the computed `computed_status` over
the five scalar computed checks (budget kind, driver products,
total re-derivation, balance, rolling horizon), under the fleet
fail-precedence rule: if any of the five scalar checks fails,
the status is `outside_stated_limits_on_declared_evidence`; if
all five pass, it is `within_stated_limits_on_declared_evidence`;
it is null only when nothing fails and at least one scalar
check is incomplete (missing evidence).

The verdict is one of `BUDGET_DESIGN_SOUND` (all 29 checks pass),
`BUDGET_DESIGN_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: scope, structure_and_owners,
drivers_and_totals, revenue_and_contingency,
approval_and_baseline, monitoring_and_close.

## Honest scoping

This atom reviews a **declared** budget design — it does not
author a budget, choose amounts, source expected income, or
verify that a declared value is true. The register's named doubt
for this atom — finance advice adjacency — is answered by this
scoping: the review is a completeness and consistency audit of
the design's own declarations, **not financial advice and not a
judgment review**: it never decides whether the amounts are
wise, whether an owner actually agreed to own a line, whether a
driver is the right driver, or whether the expected income will
arrive — only that the design contains what the skill's method,
quality gates, and red lines demand, and that its declared
arithmetic agrees with itself.

Named exclusions, each because the skill states no number to
check against: no numeric variance threshold (the skill requires
variance thresholds to trigger written explanations + actions,
but states no threshold value, so only the trigger's existence
is checked — the values stay the caller's); no contingency size
or percentage (the skill requires contingency explicit and sized
to identified risks, but states no size, so only explicitness
and the risk-sizing declaration are checked); no approval
threshold amounts (documented existence only); no check that a
line picked the *right* approach for its volatility (the skill
assigns zero-based to new/volatile and incremental to stable
areas, but volatility is not declared in a form arithmetic can
test, so only that a stated, skill-named approach is present is
checked); no live verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.

## Named doubt (from the register)

Finance advice adjacency
