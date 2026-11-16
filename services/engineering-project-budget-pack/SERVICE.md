# Engineering project budget pack — `engineering-project-budget-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Engineering budgets done right — estimate basis, contingency, change control, tracking actuals through closeout.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Electrical & energy who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **EE capital project estimates**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the budget-pack manifest

This atom does not prepare a project budget and exercises no
budgeting judgment. The caller submits one JSON manifest
declaring a budget pack artifact — its basis document, its
budget line items, its declared totals chain, its approval /
baseline record, its change log, its tracking record, and its
closeout record — and the atom validates that artifact
deterministically. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid
= the check fails (`BUDGET_PACK_NOT_READY`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `entity` (string; carried into the verdict output, not itself checked) | — |
| `basis.document_present` | basis_document |
| `basis.scope_of_estimate_stated` | basis_document |
| `basis.assumptions_stated` | basis_document |
| `basis.exclusions_stated` | basis_document |
| `basis.quote_validity_stated` | basis_document |
| `basis.fx_escalation_stated` | basis_document |
| `basis.estimator_named` | basis_document |
| `build.labor_costed_rate_times_hours` | budget_build_and_line_items |
| `build.indirects_included` | budget_build_and_line_items |
| `line_items` (list of line-item entries; absent / not a list / empty = all four computed line-item checks missing) | budget_build_and_line_items |
| `line_items[].label` (string; must be non-empty for the entry to be complete) | budget_build_and_line_items |
| `line_items[].category` (string; must be non-empty for the entry to be complete; validated as a string only, never enum-checked — the skill names the build components as guidance, and no category coverage is imposed) | budget_build_and_line_items |
| `line_items[].pricing_basis` (string; computed vocabulary check, see below) | budget_build_and_line_items |
| `line_items[].quantity` (number; computed, see below) | budget_build_and_line_items |
| `line_items[].unit_rate` (number; computed, see below) | budget_build_and_line_items |
| `line_items[].declared_amount` (number; declared, re-derived, see below) | budget_build_and_line_items |
| `contingency.risks_listed_for_contingency` | contingency_reserve_and_totals |
| `contingency.management_reserve_held_separately` | contingency_reserve_and_totals |
| `contingency.padding_buried_in_estimate` (must be `false` to pass — skill method step 3, "never bury padding") | contingency_reserve_and_totals |
| `totals.declared_subtotal` (number; computed, see below) | budget_build_and_line_items, contingency_reserve_and_totals |
| `totals.contingency_percent` (number; a declaration — never a pass mark, see below) | contingency_reserve_and_totals |
| `totals.declared_contingency_amount` (number; declared, re-derived, see below) | contingency_reserve_and_totals, closeout_and_contingency_disposition |
| `totals.declared_management_reserve_amount` (number; computed, see below) | contingency_reserve_and_totals |
| `totals.declared_total_budget` (number; declared, re-derived, see below) | contingency_reserve_and_totals, change_control_and_tracking |
| `totals.declared_total_change_impact` (number; declared, re-derived, see below) | change_control_and_tracking |
| `totals.declared_revised_budget` (number; declared, re-derived, see below) | change_control_and_tracking, closeout_and_contingency_disposition |
| `approval.approval_recorded` | approval_and_baseline |
| `approval.baseline_from_approved_amount` | approval_and_baseline |
| `approval.revisions_reapproved` | approval_and_baseline |
| `approval.work_without_approved_estimate_or_po` (must be `false` to pass — skill red line) | approval_and_baseline |
| `changes.log_maintained` | change_control_and_tracking |
| `changes.verbal_change_orders_used` (must be `false` to pass — skill red line) | change_control_and_tracking |
| `change_entries` (list of change-log entries; absent / not a list / empty = all four computed change checks missing) | change_control_and_tracking |
| `change_entries[].label` (string; must be non-empty for the entry to be complete) | change_control_and_tracking |
| `change_entries[].cost_impact` (number; computed, see below; may be negative — a descope reduces the budget) | change_control_and_tracking |
| `change_entries[].impact_statement_present` (boolean; must be present for the entry to be complete, and `true` on every entry for the impact-statement check to pass) | change_control_and_tracking |
| `change_entries[].approved_before_work` (boolean; must be present for the entry to be complete, and `true` on every entry for the approval-before-work check to pass) | change_control_and_tracking |
| `tracking.commitments_vs_actuals_tracked` | change_control_and_tracking |
| `tracking.invoice_reconciliation_against_delivery` | change_control_and_tracking |
| `tracking.monthly_report_issued` | change_control_and_tracking |
| `tracking.variance_reported_with_reasons` | change_control_and_tracking |
| `tracking.commitments_amount` (number; declared context for the tracking record — read by the core's type validation; no check re-derives it, because the skill states no arithmetic over commitments alone) | change_control_and_tracking |
| `tracking.actuals_amount` (number; computed, see below) | change_control_and_tracking |
| `tracking.forecast_to_complete_amount` (number; computed, see below) | change_control_and_tracking |
| `tracking.declared_total_forecast_amount` (number; declared, re-derived, see below) | change_control_and_tracking |
| `tracking.declared_forecast_variance_amount` (number; declared, re-derived, see below) | change_control_and_tracking |
| `closeout.final_cost_reconciled` | closeout_and_contingency_disposition |
| `closeout.variance_explained` | closeout_and_contingency_disposition |
| `closeout.lessons_captured` | closeout_and_contingency_disposition |
| `closeout.contingency_disposition_stated` | closeout_and_contingency_disposition |
| `closeout.unspent_contingency_released_explicitly` | closeout_and_contingency_disposition |
| `closeout.declared_final_cost` (number; computed, see below) | closeout_and_contingency_disposition |
| `closeout.declared_final_variance_amount` (number; declared, re-derived, see below) | closeout_and_contingency_disposition |
| `closeout.contingency_used_amount` (number; computed, see below) | closeout_and_contingency_disposition |
| `closeout.declared_unspent_contingency_amount` (number; declared, re-derived, see below) | closeout_and_contingency_disposition |

Eleven checks are computed from the declared values, using only
what the skill itself states plus the arithmetic of the declared
numbers — no outside threshold is imported:

- **Line-item pricing basis:** the skill's method step 2 says
  to mark quote-based vs allowance items. Each complete line
  item's declared `pricing_basis` therefore passes only when
  every item carries one of the stated tokens (`quote_based`,
  `allowance`); any other string is present and fails. The
  string is validated as a string only at the type layer —
  membership is a verdict check, not a type error.
- **Line-item amounts:** each declared line amount passes only
  when it equals its declared `quantity` × `unit_rate`, and the
  entries check only when every entry carries a non-empty
  `label` and `category`, a string `pricing_basis`, and numeric
  `quantity`, `unit_rate` and `declared_amount`. A missing or
  empty list is missing evidence; an incomplete entry makes
  the entries, pricing-basis, amounts and subtotal checks
  missing (the entry cannot be re-derived). The output reports
  `line_items_evaluated` (the count of complete entries).
- **Subtotal:** the declared `totals.declared_subtotal` passes
  only when it equals the sum of the declared line amounts.
  The output reports `computed_subtotal` and
  `subtotal_difference` (declared minus computed, null when
  either cannot be computed).
- **Contingency amount:** the declared
  `totals.declared_contingency_amount` passes only when it
  equals `totals.declared_subtotal` ×
  `totals.contingency_percent` / 100. The output reports
  `computed_contingency_amount` and `contingency_difference`
  (declared minus computed, null likewise).
- **Total budget:** the declared `totals.declared_total_budget`
  passes only when it equals `totals.declared_subtotal` +
  `totals.declared_contingency_amount` +
  `totals.declared_management_reserve_amount` — the reserve
  held separately (method step 3) enters the total as its own
  declared line, never buried in the others. The output
  reports `computed_total_budget` and `total_budget_difference`.
- **Change impact total:** the declared
  `totals.declared_total_change_impact` passes only when it
  equals the sum of the declared change entries' `cost_impact`
  values. The entries check passes only when every entry
  carries a non-empty `label`, a numeric `cost_impact`, and
  both boolean marks; the impact-statement check passes only
  when every complete entry's `impact_statement_present` is
  `true`, and the approval check only when every complete
  entry's `approved_before_work` is `true` (method step 5:
  impact statement and approval BEFORE work). The output
  reports `change_entries_evaluated`,
  `computed_change_impact_total` and `change_impact_difference`.
- **Revised budget:** the declared
  `totals.declared_revised_budget` passes only when it equals
  `totals.declared_total_budget` +
  `totals.declared_total_change_impact` (the declared amounts,
  so a wrong change total fails its own check without cascading
  into this one beyond the declared figure). The output reports
  `computed_revised_budget` and `revised_budget_difference`.
- **Total forecast:** the declared
  `tracking.declared_total_forecast_amount` passes only when
  it equals `tracking.actuals_amount` +
  `tracking.forecast_to_complete_amount` (method step 6:
  actuals vs forecast-to-complete). The output reports
  `computed_total_forecast` and `total_forecast_difference`.
- **Forecast variance:** the declared
  `tracking.declared_forecast_variance_amount` passes only
  when it equals `tracking.declared_total_forecast_amount` −
  `totals.declared_revised_budget`. Whether the variance is
  acceptable is not judged — only its arithmetic, and that its
  reasons are reported (`tracking.variance_reported_with_reasons`).
  The output reports `computed_forecast_variance` and
  `forecast_variance_difference`.
- **Final variance:** the declared
  `closeout.declared_final_variance_amount` passes only when
  it equals `closeout.declared_final_cost` −
  `totals.declared_revised_budget` (method step 7: final cost
  vs budget). The output reports `computed_final_variance` and
  `final_variance_difference`.
- **Unspent contingency:** the declared
  `closeout.declared_unspent_contingency_amount` passes only
  when it equals `totals.declared_contingency_amount` −
  `closeout.contingency_used_amount`. The output reports
  `computed_unspent_contingency` and
  `unspent_contingency_difference`.

**Fixed serialization rule:** computed amounts are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the eleven computed checks cannot be completed).

The verdict is one of `BUDGET_PACK_READY` (all 42 checks pass),
`BUDGET_PACK_NOT_READY` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: basis_document, budget_build_and_line_items,
contingency_reserve_and_totals, approval_and_baseline,
change_control_and_tracking, closeout_and_contingency_disposition.

## Thresholds declined

The following are deliberately **not** imposed, because the
skill does not fix them. Naming them here is the audit trail
for their absence:

- **Approval thresholds.** Method step 4 says "approval per
  thresholds" but the skill states no threshold amounts,
  tiers, or approver levels. Approval is carried as caller
  declarations (`approval.*`) only; no amount is checked
  against an approval limit.
- **Contingency percent.** Method step 3 requires the
  contingency to be "sized to uncertainty" with an explicit %,
  but fixes no percent and no sizing formula. The declared
  percent is a declaration whose amount arithmetic alone is
  re-derived — any percent passes if its amount holds.
  Whether the percent truly matches the listed risks'
  uncertainty is judgment the atom does not exercise.
- **Management reserve size.** The skill requires the reserve
  to be held separately; it states no reserve amount, percent,
  or sizing rule. Only its arithmetic place in the total
  budget is re-derived.
- **Acceptable variance (forecast or final).** Method steps 6
  and 7 require variance to be reported with reasons and
  explained at closeout; the skill states no variance percent
  or amount at which a budget is in trouble. Only the variance
  arithmetic is re-derived.
- **Change re-approval size threshold.** Method step 5 requires
  every scope change to be approved before work, with no
  de-minimis exception stated — so every declared entry is
  held to the same impact-statement and approval marks, and no
  size threshold is invented in either direction.
- **FX / escalation rate.** Method step 1 requires FX and
  escalation treatment to be stated in the basis document; the
  skill fixes no rate or index. It is a declaration only.
- **Schedule impact magnitude.** Method step 5 requires a cost
  + schedule impact statement per change. The statement's
  existence is declared per entry; the skill states no
  schedule unit or bound, so no schedule figure is re-derived.
- **Line-item category coverage.** Method step 2 names the
  build components (material, labor, subcontract, rentals,
  indirects); it does not state that every budget must carry
  every component (a labor-only job has no rentals). Categories
  are validated as non-empty strings for traceability; no
  coverage check is imposed.
- **Commitments arithmetic.** Method step 6 tracks commitments
  vs actuals vs forecast-to-complete, but states no identity
  over the commitments figure alone (commitments may exceed or
  trail actuals legitimately at any snapshot). The commitments
  amount is declared context; the forecast identity is over
  actuals + forecast-to-complete only.

## Honest scoping

This atom audits a **declared** budget pack artifact — it does
not build the budget, price the caller's actual work, verify
that a declared value is true, or give budgeting advice. A pack
is ready *on the caller's declared evidence* even if its
underlying numbers are optimistic. It is a completeness and
consistency audit, **not a budget review**: it never decides
whether the quantities or rates are realistic, whether the
contingency is adequate for the risks, whether the reserve is
the right size, whether a change should have been approved,
whether the variance reasons are good reasons, or whether the
lessons captured are the right lessons — those judgment-shaped
parts are carried as caller declarations only, never judged.

Named exclusions: no production of a budget from raw scope or
drawings; no verification of any declared quantity, rate,
amount, quote, commitment, actual, or final cost; no rate
benchmarking against market data; no contingency-adequacy,
reserve-adequacy, approval-threshold or variance-acceptability
judgment; no live verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.
