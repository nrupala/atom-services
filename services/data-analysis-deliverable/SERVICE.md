# Data analysis deliverable — `data-analysis-deliverable`

**Deliverable type:** REPORT. This atom sells the report it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Turn data into decisions — question framing, exploratory analysis, statistical care, insights that change actions.

A caller submits the inputs the bound skill works on and receives one report back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this report on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Product and operations analysis**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the data-analysis-deliverable manifest

The caller submits one JSON manifest: one analysis-deliverable
record — the question, the data sources and their provenance, the
method, the declared result figures with the inputs needed to
re-derive them, the caveats, and the reproducibility /
close-the-loop record — worked through the bound skill's method.
Every field below is read by the named section's checks. A field
**absent** = evidence missing (`INSUFFICIENT_EVIDENCE`); a field
present but false / invalid = the check fails
(`DELIVERABLE_NOT_COMPLETE`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `question` (string; carried into the verdict output, not itself checked) | — |
| `framing.question_stated` | question_framing |
| `framing.decision_named` | question_framing |
| `framing.decision_owner_named` | question_framing |
| `framing.decision_deadline_stated` | question_framing |
| `framing.data_that_would_change_decision_stated` | question_framing |
| `data.sources` (list of strings; computed, see below) | data_provenance |
| `data.provenance_documented` | data_provenance |
| `data.coverage_documented` | data_provenance |
| `data.definitions_documented` | data_provenance |
| `data.metrics_have_single_definition` | data_provenance |
| `data.gaps_documented` | data_provenance |
| `data.biases_documented` | data_provenance |
| `analysis.distributions_shown` | descriptive_and_diagnostic |
| `analysis.segments_shown` | descriptive_and_diagnostic |
| `analysis.trends_on_comparable_windows` | descriptive_and_diagnostic |
| `analysis.cherry_picked_baselines_used` (must be `false` to pass — skill method step 3) | descriptive_and_diagnostic |
| `analysis.decomposition_performed` | descriptive_and_diagnostic |
| `analysis.cohort_views_shown` | descriptive_and_diagnostic |
| `analysis.mechanisms_triangulated` | descriptive_and_diagnostic |
| `figures.values` (list of numbers; computed, see below) | descriptive_and_diagnostic |
| `figures.stated_total` (number; computed, see below) | descriptive_and_diagnostic |
| `figures.stated_mean` (number; computed, see below) | descriptive_and_diagnostic |
| `figures.prior_window_value` (number; computed, see below) | descriptive_and_diagnostic |
| `figures.current_window_value` (number; computed, see below) | descriptive_and_diagnostic |
| `figures.stated_percent_change` (number; computed, see below) | descriptive_and_diagnostic |
| `inference.sample_size_or_power_considered` | statistical_care |
| `inference.uncertainty_stated` | statistical_care |
| `inference.practical_vs_statistical_significance_distinguished` | statistical_care |
| `inference.multiple_comparisons_checked` | statistical_care |
| `inference.causal_claims_from_observational_data_alone` (must be `false` to pass — skill red line) | statistical_care |
| `recommendation.so_what_stated` | insight_and_action |
| `recommendation.recommendation_made` | insight_and_action |
| `recommendation.expected_effect_stated` | insight_and_action |
| `recommendation.recommendation_owner_named` | insight_and_action |
| `recommendation.measurement_plan_stated` | insight_and_action |
| `recommendation.uncertainty_stated_plainly` | insight_and_action |
| `report.covers_question_data_method_finding_recommendation_caveats` | reporting_and_reproducibility |
| `report.is_one_page` | reporting_and_reproducibility |
| `report.caveats_stated` | reporting_and_reproducibility |
| `report.charts_oversell_findings` (must be `false` to pass — skill red line) | reporting_and_reproducibility |
| `report.numbers_reproducible` | reporting_and_reproducibility |
| `closure.predicted_vs_actual_compared` | reporting_and_reproducibility |
| `closure.model_of_world_updated` | reporting_and_reproducibility |

Three checks are computed from the declared values, using only
what the skill itself states plus the arithmetic of the declared
numbers — no outside threshold is imported:

- **Stated total:** the skill's method step 3 is "segments before
  totals". When the record declares segment `figures.values` and
  a `figures.stated_total`, the stated total passes only when it
  equals the sum of the declared values, over a non-empty list.
  If the values list or the stated total is absent, the check is
  missing evidence; a present-but-empty values list fails. The
  output reports `recomputed_total` (null when it cannot be
  computed).
- **Stated mean:** the skill's method step 3 is "distributions
  before averages". The stated mean passes only when it equals
  the mean of the same declared values, over a non-empty list.
  Absence is missing evidence. The output reports
  `recomputed_mean` (null likewise).
- **Stated percent change:** the skill's method step 3 is
  "trends on comparable windows". The stated percent change
  passes only when it equals (current − prior) / prior × 100 over
  the declared `figures.prior_window_value` and
  `figures.current_window_value`, with a non-zero prior window.
  Absence of any of the three numbers is missing evidence. The
  output reports `recomputed_percent_change` (null likewise,
  including when the prior window is zero).

A fourth computed check is the declared data-source list: the
skill's method step 2 ("know the data") requires the sources be
known, so `data.sources` passes only as a present, non-empty list
of strings; an absent list is missing evidence and an empty list
is present and fails. Entries are validated as strings only,
never enum-checked — declaration is a verdict check, not a type
error.

**Fixed serialization rule:** computed figures are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values except the
re-derivation checks, which compare the fixed-6dp difference to
zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the three re-derivation checks cannot be completed).

The verdict is one of `DELIVERABLE_COMPLETE` (all 40 checks
pass), `DELIVERABLE_NOT_COMPLETE` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: question_framing, data_provenance,
descriptive_and_diagnostic, statistical_care, insight_and_action,
reporting_and_reproducibility.

## Honest scoping

This atom audits a **declared** analysis-deliverable record — it
does not run the analysis, source or inspect the data, re-derive
any figure beyond the three declared re-derivations above, or
verify that a declared value is true. A deliverable is complete
*on the caller's declared evidence* even if its conclusion is
wrong. It is a completeness and consistency audit, **not an
analysis and not a certification of conclusions**: it never
decides whether the question was the right one, whether the data
are what the record claims, whether a decomposition or cohort
view is actually informative, whether an inference is sound, or
whether the recommendation is wise — only that the record
contains what the skill's method, quality gates, and red lines
demand, and that its declared total, mean, and percent-change
arithmetic agrees with the inputs it declares.

Thresholds declined — none is invented, because the skill states
none: no minimum sample size or statistical power; no
significance level (the skill names no p-value or alpha); no
confidence level; no effect-size pass mark for practical
significance; no minimum number of data sources, segments, or
cohorts beyond a non-empty source list; no accuracy pass mark
for the predicted-vs-actual comparison in the close-the-loop
step; no grading of chart quality beyond the declared
no-oversell red line (chart rules live in the separate
`data-visualization` skill, which is not bound here); and no
quality grading of the insight, the triangulation, or the
recommendation beyond their declared presence. Parts of the
skill that cannot reduce to deterministic checks over a declared
record — whether distributions / segments / cohort views are
actually illuminating, whether mechanisms are genuinely
triangulated rather than merely declared, and whether an insight
would in fact change an action — are audited only as declared
presence, and are named here as not verified.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.
