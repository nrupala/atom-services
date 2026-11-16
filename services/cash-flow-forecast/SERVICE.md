# Cash flow forecast — `cash-flow-forecast`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Manage cash deliberately — 13-week forecasts, inflow/outflow timing, reserves, runway, working capital.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Business cash runway planning**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the cash-flow-forecast manifest

This atom does not produce a cash-flow forecast and exercises no
business judgment. The caller submits one JSON manifest declaring
a cash-flow forecast artifact — its flow map and lag assumptions,
its 13-week buckets, its reserve target, its working-capital and
lever record, its runway declaration, its stress record, and its
reporting record — and the atom validates that artifact
deterministically. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`CASH_FLOW_FORECAST_NOT_READY`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `entity` (string; carried into the verdict output, not itself checked) | — |
| `flows.recurring_inflows_mapped` | flows_and_lags |
| `flows.recurring_outflows_mapped` | flows_and_lags |
| `flows.seasonal_patterns_mapped` | flows_and_lags |
| `flows.one_offs_mapped` | flows_and_lags |
| `flows.lag_assumptions_documented` | flows_and_lags |
| `forecast.opening_balance` (number; computed, see below) | thirteen_week_forecast |
| `forecast.weeks` (list of weekly buckets; absent / not a list / empty = all three computed forecast checks missing) | thirteen_week_forecast |
| `forecast.weeks[].label` (string; must be non-empty for the entry to be complete) | thirteen_week_forecast |
| `forecast.weeks[].inflows` (number) | thirteen_week_forecast |
| `forecast.weeks[].outflows` (number) | thirteen_week_forecast |
| `forecast.weeks[].closing_balance` (number; declared, re-derived, see below) | thirteen_week_forecast |
| `forecast.rolling_maintained_weekly` | thirteen_week_forecast |
| `forecast.monthly_annual_planning_present` | thirteen_week_forecast |
| `reserves.target_set` | reserves_and_runway |
| `reserves.monthly_fixed_costs` (number; computed, see below) | reserves_and_runway |
| `reserves.target_months` (number; computed, see below) | reserves_and_runway |
| `reserves.declared_target_amount` (number; computed, see below) | reserves_and_runway |
| `reserves.held_separately` | reserves_and_runway |
| `reserves.breach_requires_explicit_decision` | reserves_and_runway |
| `reserves.put_at_risk` (must be `false` to pass — skill red line) | reserves_and_runway |
| `working_capital.ar_aging_reviewed_on_cadence` | working_capital_and_levers |
| `working_capital.chase_ladder_applied` | working_capital_and_levers |
| `working_capital.ap_calendar_maintained` | working_capital_and_levers |
| `working_capital.inventory_only_where_it_pays` | working_capital_and_levers |
| `levers.inflow_acceleration_applied` | working_capital_and_levers |
| `levers.outflows_phased` | working_capital_and_levers |
| `levers.vendors_used_as_silent_financing` (must be `false` to pass — skill red line) | working_capital_and_levers |
| `runway.cash_on_hand` (number; computed, see below) | reserves_and_runway |
| `runway.burn` (number; net monthly outflow, computed, see below) | reserves_and_runway |
| `runway.declared_runway_months` (number; computed, see below) | reserves_and_runway |
| `runway.alert_thresholds_at_6_and_3_months_set` | reserves_and_runway |
| `stress.cases_run` (list of strings; computed, see below) | stress_tests |
| `stress.answers_recorded` | stress_tests |
| `stress.responses_predecided` | stress_tests |
| `reporting.weekly_position_and_forecast_reported` | reporting_and_commitments |
| `reporting.monthly_summary_drivers_annotated` | reporting_and_commitments |
| `commitments.committed_against_unlanded_receivables` (must be `false` to pass — skill red line) | reporting_and_commitments |

Five checks are computed from the declared values, using only
what the skill itself states plus the arithmetic of the declared
numbers — no outside threshold is imported:

- **Weekly entries and 13-week coverage:** the skill's method
  step 2 is a "13-week rolling forecast" with weekly buckets.
  The declared `forecast.weeks` list therefore passes the
  coverage check only when it declares exactly 13 buckets, and
  the entries check only when every bucket carries a non-empty
  `label` string and numeric `inflows`, `outflows` and
  `closing_balance`. A missing or empty list is missing
  evidence; an incomplete entry makes the entries and balance
  checks missing (the entry cannot be re-derived).
- **Weekly closing balances:** each declared weekly closing
  balance must equal the declared `forecast.opening_balance`
  plus the cumulative declared inflows minus outflows up to
  that week. The output reports `computed_final_balance` (the
  re-derived closing balance of the final week, null when it
  cannot be computed) and `final_balance_difference` (the final
  week's declared closing minus the re-derived final balance,
  null likewise), and `weeks_evaluated` (the count of complete
  weekly entries).
- **Reserve target:** the skill's method step 4 states the
  target as "minimum cash = X months of fixed costs". The
  declared `reserves.declared_target_amount` therefore passes
  only when it equals `reserves.target_months` ×
  `reserves.monthly_fixed_costs`. The skill sizes X "to
  volatility" and states no number, so **no minimum months is
  imposed** — only the arithmetic is re-derived. The output
  reports `computed_reserve_target` and
  `reserve_target_difference` (declared minus computed, null
  when either cannot be computed).
- **Runway:** the skill's method step 6 states "burn = net
  monthly outflow; runway = cash ÷ burn". The declared
  `runway.declared_runway_months` therefore passes only when it
  equals `runway.cash_on_hand` / `runway.burn`, with a positive
  burn (a zero burn fails — no finite runway exists). The
  skill's 6/3-month figures are **alert thresholds**, checked
  only as a declaration that they are set — never as a pass
  mark on the runway itself; no minimum runway is imposed. The
  output reports `computed_runway_months` and
  `runway_difference` (declared minus computed, null when
  either cannot be computed).
- **Stress coverage:** the skill's method step 7 names the
  stress cases — revenue −20%, collections +30 days late,
  surprise capex. The declared `stress.cases_run` list
  therefore passes only when it contains all three stated
  entries (`revenue_minus_20_percent`,
  `collections_plus_30_days_late`, `surprise_capex`); unknown
  entries do not count toward coverage. A missing list is
  missing evidence; an empty list is present and fails. The
  output reports the omitted stated entries as
  `stress_cases_not_run` (null when no list is declared).
  Entries are validated as strings only, never enum-checked —
  coverage is a verdict check, not a type error. Whether the
  plan actually holds under stress is the caller's recorded
  answer (`stress.answers_recorded`), not this atom's judgment.

**Fixed serialization rule:** computed amounts and ratios are
reported as strings with exactly six decimal places, produced in
both implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the five computed checks cannot be completed).

The verdict is one of `CASH_FLOW_FORECAST_READY` (all 30 checks
pass), `CASH_FLOW_FORECAST_NOT_READY` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: flows_and_lags, thirteen_week_forecast,
reserves_and_runway, working_capital_and_levers, stress_tests,
reporting_and_commitments.

## Honest scoping

This atom audits a **declared** cash-flow forecast artifact — it
does not build the forecast, map the caller's actual flows,
verify that a declared value is true, or give financial advice.
The register's named doubt for this atom — finance advice
adjacency — is answered by this framing: the artifact declares
its own flows, buckets, reserve, burn and runway, and this core
checks only their internal consistency and the completeness of
the skill's method on the declared evidence. An artifact is
ready *on the caller's declared evidence* even if its underlying
cash position is weak. It is a completeness and consistency
audit, **not a forecast review**: it never decides whether the
forecast is realistic, whether the reserve is adequate (the
skill states no size beyond "size to volatility", so none is
imposed), whether the runway is long enough (no minimum is
imposed — the 6/3-month figures are the skill's alert
thresholds, not verdict thresholds), or whether the plan will
hold under stress (only that the skill's three named cases were
run and their answers and responses recorded).

Named exclusions: no production of a forecast from raw business
data; no verification of any declared inflow, outflow, balance
or receivable; no reserve-adequacy, runway-adequacy or
stress-survival judgment; no AR/AP amounts or aging buckets
(the skill names the review cadence and the chase ladder but
states no aging thresholds, so none are imposed); no live
verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.

## Named doubt (from the register)

Finance advice adjacency
