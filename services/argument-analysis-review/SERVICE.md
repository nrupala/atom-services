# Argument analysis review — `argument-analysis-review`

**Deliverable type:** REVIEW. This atom sells the review it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

A caller submits the inputs the bound skill works on and receives one review back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this review on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Claim checking in research**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the argument-analysis manifest

The caller submits one JSON manifest: a declared argument-analysis
record for one argument. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid =
the check fails (`ARGUMENT_ANALYSIS_DEFICIENT`). All fields are
booleans unless noted.

| Field | Read by |
|---|---|
| `argument` (string; carried into the verdict output, not itself checked) | — |
| `anatomy.premises_identified` | anatomy_and_steelman |
| `anatomy.conclusion_identified` | anatomy_and_steelman |
| `anatomy.validity_distinguished_from_soundness` | anatomy_and_steelman |
| `anatomy.steelman_stated` | anatomy_and_steelman |
| `evidence.source_quality_assessed` | evidence_weighing |
| `evidence.sample_size_considered` | evidence_weighing |
| `evidence.confounders_considered` | evidence_weighing |
| `evidence.replication_considered` | evidence_weighing |
| `evidence.anecdote_treated_as_data` (must be `false` to pass) | evidence_weighing |
| `calibration.base_rate_stated` | base_rates_and_calibration |
| `calibration.diagnosticity_assessed` | base_rates_and_calibration |
| `calibration.confidence_percent` (number; computed, see below) | base_rates_and_calibration |
| `calibration.known_vs_believed_separated` | base_rates_and_calibration |
| `stress_test.inversion_or_premortem_done` | stress_testing |
| `stress_test.second_order_consequences_traced` | stress_testing |
| `stress_test.change_mind_evidence_prestated` | stress_testing |
| `screening.fallacies_screened` (list of string tokens; computed, see below) | fallacy_and_bias_screening |
| `screening.biases_screened` (list of string tokens; computed, see below) | fallacy_and_bias_screening |
| `razors.simplest_explanation_preferred` | razors_and_countercase |
| `razors.malice_not_assumed_without_evidence` | razors_and_countercase |
| `razors.chestertons_fence_respected` | razors_and_countercase |
| `razors.map_territory_distinguished` | razors_and_countercase |
| `countercase.key_assumption_named` | razors_and_countercase |
| `countercase.strongest_countercase_offered` | razors_and_countercase |

Three checks are computed from the declared values, using only
what the skill itself states — no outside threshold is imported:

- **Fallacy screen completeness:** the skill names nine fallacies
  (ad hominem, straw man, false dichotomy, appeal to authority,
  slippery slope, correlation≠causation, survivorship bias,
  base-rate neglect, sunk cost). The declared
  `screening.fallacies_screened` list passes only when it contains
  all nine tokens: `ad_hominem`, `straw_man`, `false_dichotomy`,
  `appeal_to_authority`, `slippery_slope`,
  `correlation_as_causation`, `survivorship_bias`,
  `base_rate_neglect`, `sunk_cost`. Extra tokens are ignored; the
  tokens are validated as strings only, never enum-checked.
- **Bias screen completeness:** the skill names six biases
  (confirmation, anchoring, availability, motivated reasoning,
  recency, overconfidence). The declared
  `screening.biases_screened` list passes only when it contains
  all six tokens: `confirmation`, `anchoring`, `availability`,
  `motivated_reasoning`, `recency`, `overconfidence`.
- **Probabilistic confidence:** the skill requires beliefs held
  "probabilistically and calibrated — explicit confidence, not
  binary certainty". The declared `calibration.confidence_percent`
  therefore passes only strictly between 0 and 100; 0 and 100 are
  binary certainty and fail. An absent value is missing evidence,
  not a failure.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the three computed checks cannot be completed), `missing_fallacies`
and `missing_biases` (the skill-named tokens absent from each
declared screen, in the skill's order; null when the screen list
is not declared), and `confidence_percent` (the declared numeric
confidence, or null).

The verdict is one of `ARGUMENT_ANALYSIS_COMPLETE` (all 24 checks
pass), `ARGUMENT_ANALYSIS_DEFICIENT` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: anatomy_and_steelman, evidence_weighing,
base_rates_and_calibration, stress_testing,
fallacy_and_bias_screening, razors_and_countercase.

## Honest scoping

This atom audits a **declared** argument-analysis record — it
does not read the underlying argument, restate it, or verify that
a declared step was performed well. An analysis is complete *on
the caller's declared evidence*: a manifest that declares a
steelman, a base rate, and complete fallacy/bias screens passes
those checks even if the underlying reasoning was never done. It
is a completeness audit of the record the skill requires, **not a
judgment of the argument itself**: it never decides whether the
conclusion is true, whether the premises are true (soundness of
the actual argument), or whether the stated confidence is well
calibrated against outcomes — only that the record contains what
the skill's anatomy, evidence, stress-test, screening and razor
steps demand.

Named exclusions: no grading of prose quality (steelman strength,
counter-case honesty, evidence appraisal are judgment, and the
skill states no scale for grading them, so none is invented); no
fallacy/bias vocabulary beyond the skill's own lists is required
(extra screened tokens are accepted and ignored); no verification
that any declared analysis step actually happened.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Overlaps critical-thinking
