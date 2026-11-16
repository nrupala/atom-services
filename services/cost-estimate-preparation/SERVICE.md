# Cost estimate preparation — `cost-estimate-preparation`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Estimate costs honestly — classes, methods, ranges, escalation, and learning from estimate vs actual.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Money & markets who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **EE work package estimates**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the cost-estimate manifest

This atom does not produce a cost estimate and exercises no
estimating judgment. The caller submits one JSON manifest
declaring a cost estimate artifact — its basis document, its
element line items, its three-point uncertainty items, its
declared totals chain, its should-cost / vendor-quote record,
and its estimate-vs-actual feedback record — and the atom
validates that artifact deterministically. Every field below is
read by the named section's checks. A field **absent** =
evidence missing (`INSUFFICIENT_EVIDENCE`); a field present but
false / invalid = the check fails (`COST_ESTIMATE_NOT_READY`).
All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `entity` (string; carried into the verdict output, not itself checked) | — |
| `basis.document_present` | basis_and_class |
| `basis.estimate_class` (string; computed vocabulary check, see below) | basis_and_class |
| `basis.method` (string; computed vocabulary check, see below) | basis_and_class |
| `basis.assumptions_documented` | basis_and_class |
| `basis.exclusions_documented` | basis_and_class |
| `basis.estimator_identified` | basis_and_class |
| `elements.breakdown_not_lump_sum` | elements_and_line_items |
| `elements.labor_burden_included` | elements_and_line_items |
| `elements.hidden_padding_in_rates` (must be `false` to pass — skill red line) | elements_and_line_items |
| `line_items` (list of line-item entries; absent / not a list / empty = all three computed line-item checks missing) | elements_and_line_items |
| `line_items[].label` (string; must be non-empty for the entry to be complete) | elements_and_line_items |
| `line_items[].category` (string; must be non-empty for the entry to be complete; validated as a string only, never enum-checked — the skill names the element categories as guidance, and no category coverage is imposed) | elements_and_line_items |
| `line_items[].quantity` (number; computed, see below) | elements_and_line_items |
| `line_items[].unit_rate` (number; computed, see below) | elements_and_line_items |
| `line_items[].declared_amount` (number; declared, re-derived, see below) | elements_and_line_items |
| `uncertainty.ranges_stated_for_material_uncertainty` | uncertainty_and_ranges |
| `uncertainty.items` (list of three-point items; absent / not a list / empty = all three computed uncertainty checks missing) | uncertainty_and_ranges |
| `uncertainty.items[].label` (string; must be non-empty for the entry to be complete) | uncertainty_and_ranges |
| `uncertainty.items[].optimistic` (number; computed, see below) | uncertainty_and_ranges |
| `uncertainty.items[].likely` (number; computed, see below) | uncertainty_and_ranges |
| `uncertainty.items[].pessimistic` (number; computed, see below) | uncertainty_and_ranges |
| `uncertainty.items[].declared_expected_value` (number; presence only — the skill states no expected-value formula, see Thresholds declined) | uncertainty_and_ranges |
| `uncertainty.items[].declared_spread` (number; declared, re-derived, see below) | uncertainty_and_ranges |
| `uncertainty.expected_values_stated` | uncertainty_and_ranges |
| `uncertainty.single_number_precision_on_uncertain_scope` (must be `false` to pass — skill red line) | uncertainty_and_ranges |
| `totals.declared_subtotal` (number; computed, see below) | elements_and_line_items, totals_escalation_and_currency |
| `totals.contingency_percent` (number; a declaration — never a pass mark, see below) | totals_escalation_and_currency |
| `totals.declared_contingency_amount` (number; declared, re-derived, see below) | totals_escalation_and_currency |
| `totals.escalation_percent` (number; a declaration — never a pass mark, see below) | totals_escalation_and_currency |
| `totals.declared_escalation_amount` (number; declared, re-derived, see below) | totals_escalation_and_currency |
| `totals.declared_grand_total` (number; declared, re-derived, see below) | totals_escalation_and_currency |
| `totals.escalation_impacts_stated` | totals_escalation_and_currency |
| `totals.currency_impacts_stated` | totals_escalation_and_currency |
| `totals.quote_validity_dates_captured` | totals_escalation_and_currency |
| `should_cost.benchmark_built_for_big_items` | should_cost_and_quotes |
| `should_cost.vendor_quote_amount` (number; computed, see below) | should_cost_and_quotes |
| `should_cost.should_cost_amount` (number; computed, see below) | should_cost_and_quotes |
| `should_cost.declared_variance_percent` (number; declared, re-derived, see below) | should_cost_and_quotes |
| `should_cost.quote_compared_to_benchmark` | should_cost_and_quotes |
| `should_cost.divergences_explained` | should_cost_and_quotes |
| `should_cost.quote_exclusions_reviewed` | should_cost_and_quotes |
| `should_cost.quote_assumptions_reviewed` | should_cost_and_quotes |
| `should_cost.validity_period_respected` | should_cost_and_quotes |
| `should_cost.quote_accepted_without_scope_review` (must be `false` to pass — skill red line) | should_cost_and_quotes |
| `feedback.estimate_vs_actual_tracked_per_item` | feedback_loop |
| `feedback.rates_updated_from_actuals` | feedback_loop |
| `feedback.variance_lessons_published` | feedback_loop |

Nine checks are computed from the declared values, using only
what the skill itself states plus the arithmetic of the declared
numbers — no outside threshold is imported:

- **Estimate class:** the skill's method step 1 names the
  classes — concept/ROM, budget, definitive. The declared
  `basis.estimate_class` therefore passes only when it is one
  of the stated tokens (`concept_rom`, `budget`, `definitive`);
  any other string is present and fails, an absent field is
  missing. The string is validated as a string only at the type
  layer — membership is a verdict check, not a type error.
- **Method:** the skill's method step 2 names the methods —
  bottom-up (elements) when design exists, parametric (unit
  rates, cost curves) when history exists, analogous (adjust a
  comparable explicitly) for one-offs. The declared
  `basis.method` therefore passes only when it is one of the
  stated tokens (`bottom_up`, `parametric`, `analogous`). Which
  method fits the situation is the estimator's judgment and is
  not second-guessed here.
- **Line-item amounts:** the skill's method step 3 builds the
  estimate from elements — material, labor (hours × rates incl.
  burden), equipment, subcontract, freight, indirects. Each
  declared line amount therefore passes only when it equals
  its declared `quantity` × `unit_rate`, and the entries check
  only when every entry carries a non-empty `label` and
  `category` and numeric `quantity`, `unit_rate` and
  `declared_amount`. A missing or empty list is missing
  evidence; an incomplete entry makes the entries, amounts and
  subtotal checks missing (the entry cannot be re-derived).
  The output reports `line_items_evaluated` (the count of
  complete entries).
- **Subtotal:** the declared `totals.declared_subtotal` passes
  only when it equals the sum of the declared line amounts.
  The output reports `computed_subtotal` and
  `subtotal_difference` (declared minus computed, null when
  either cannot be computed).
- **Three-point spreads and ordering:** the skill's method
  step 4 states three points — optimistic / likely /
  pessimistic — yielding an expected value and a spread. Each
  declared `declared_spread` therefore passes only when it
  equals `pessimistic` − `optimistic`, and the ordering check
  only when every item is in optimistic ≤ likely ≤ pessimistic
  order. The output reports `uncertainty_items_evaluated`,
  `computed_total_spread` (the sum of the re-derived spreads)
  and `total_spread_difference` (the sum of declared spreads
  minus the computed total, null when an item is incomplete).
  The declared expected value is **not** re-derived: the skill
  states no formula for it (see Thresholds declined), so it is
  checked for presence as part of entry completeness only.
- **Contingency amount:** the declared
  `totals.declared_contingency_amount` passes only when it
  equals `totals.declared_subtotal` ×
  `totals.contingency_percent` / 100. The output reports
  `computed_contingency_amount` and `contingency_difference`
  (declared minus computed, null when either cannot be
  computed).
- **Escalation amount:** the declared
  `totals.declared_escalation_amount` passes only when it
  equals `totals.declared_subtotal` ×
  `totals.escalation_percent` / 100. The output reports
  `computed_escalation_amount` and `escalation_difference`
  (declared minus computed, null likewise).
- **Grand total:** the declared `totals.declared_grand_total`
  passes only when it equals `totals.declared_subtotal` +
  `totals.declared_contingency_amount` +
  `totals.declared_escalation_amount` (the declared amounts, so
  a wrong contingency amount fails its own check without
  cascading into this one). The output reports
  `computed_grand_total` and `grand_total_difference`
  (declared minus computed, null likewise).
- **Should-cost variance:** the skill's method step 6 builds an
  independent benchmark for big items and compares vendor
  quotes against it. The declared
  `should_cost.declared_variance_percent` therefore passes
  only when it equals (`should_cost.vendor_quote_amount` −
  `should_cost.should_cost_amount`) /
  `should_cost.should_cost_amount` × 100, with a non-zero
  benchmark (a zero benchmark fails — no finite variance
  exists). Whether the variance is acceptable, and how a gap
  reconciles (scope, rates, or margin), is the caller's
  recorded answer (`should_cost.divergences_explained`), not
  this atom's judgment. The output reports
  `computed_quote_variance_percent` and
  `quote_variance_difference` (declared minus computed, null
  when either cannot be computed).

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
the nine computed checks cannot be completed).

The verdict is one of `COST_ESTIMATE_READY` (all 35 checks
pass), `COST_ESTIMATE_NOT_READY` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: basis_and_class, elements_and_line_items,
uncertainty_and_ranges, totals_escalation_and_currency,
should_cost_and_quotes, feedback_loop.

## Thresholds declined

The following are deliberately **not** imposed, because the
skill does not fix them. Naming them here is the audit trail
for their absence:

- **Class percentage bands as pass marks.** The skill gives
  each class a reality band (concept/ROM ±30–50%, budget
  ±15–20%, definitive ±5–10%) as a description of what the
  class means, not a fixed value an artifact's declared range
  must hit. No declared range percent is checked against a
  band; the class token alone is checked.
- **Expected-value formula.** Method step 4 says three points
  yield an "expected value + spread" but states no formula —
  neither a PERT weighting ((optimistic + 4 × likely +
  pessimistic) / 6) nor a simple mean is written in the skill,
  so neither is imposed. The declared expected value is
  presence-checked only; the spread, whose arithmetic the
  points themselves define, is re-derived.
- **Contingency percent.** The skill never fixes a contingency
  percentage. The declared percent is a declaration whose
  amount arithmetic alone is re-derived — any percent passes
  if its amount holds.
- **Escalation percent / rate.** The skill requires escalation
  to be handled and its impacts stated, but fixes no inflation,
  fx, or lead-time rate. The declared percent is treated
  exactly like the contingency percent.
- **Acceptable quote variance.** The skill requires gaps
  between quotes and the should-cost benchmark to be
  reconciled and explained; it states no variance percentage
  at which a quote becomes unacceptable. Only the variance
  arithmetic is re-derived.
- **Line-item category coverage.** The skill names the element
  categories (material, labor, equipment, subcontract, freight,
  indirects) as the breakdown to build from; it does not state
  that every estimate must carry every category (a services
  estimate may have no freight). Categories are validated as
  non-empty strings for traceability; no coverage check is
  imposed.
- **Analogous-estimate adjustment size.** Method step 2 says an
  analogous estimate adjusts a comparable "explicitly"; it
  states no adjustment factor or bound, so none is checked —
  the method token and the basis document carry that evidence.

## Honest scoping

This atom audits a **declared** cost estimate artifact — it
does not build the estimate, price the caller's actual work,
verify that a declared value is true, or give estimating
advice. An artifact is ready *on the caller's declared
evidence* even if its underlying numbers are optimistic. It is
a completeness and consistency audit, **not an estimate
review**: it never decides whether the quantities or rates are
realistic, whether the class fits the scope's maturity, whether
the contingency or escalation percent is adequate (the skill
fixes neither, so none is imposed), whether the expected values
are well derived (no formula is stated, so none is imposed), or
whether a vendor quote should be accepted (only that its scope
was reviewed, its exclusions and assumptions read, its validity
respected, and its divergence from the benchmark explained and
arithmetically consistent).

Named exclusions: no production of an estimate from raw scope
or drawings; no verification of any declared quantity, rate,
amount, quote, or actual; no rate benchmarking against market
data; no class-band, contingency-adequacy, escalation-adequacy
or variance-acceptability judgment; no live verification of any
declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
