# Applied ml validation — `applied-ml-validation`

**Deliverable type:** VALIDATION. This atom sells the validation it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Apply machine learning with discipline — framing, baselines, validation that holds, honest evaluation, monitoring.

A caller submits the inputs the bound skill works on and receives one validation back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this validation on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Model evaluation for products**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the applied-ML validation manifest

The caller submits one JSON manifest: a declared evidence pack for
one ML project. Every field below is read by the named section's
checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NOT_VALIDATED`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `model` (string; carried into the verdict output, not itself checked) | — |
| `framing.decision_named` | framing_and_baseline |
| `framing.error_costs_stated` | framing_and_baseline |
| `framing.alternatives_considered` | framing_and_baseline |
| `baseline.defined` | framing_and_baseline |
| `baseline.baseline_score` (number) + `baseline.model_score` (number) + `baseline.metric_direction` (`"lower_is_better"` / `"higher_is_better"`) | framing_and_baseline (computed, see below) |
| `baseline.project_stopped_because_baseline_not_beaten` (gates the computed baseline check — the skill's "or the project rightly stopped" alternative) | framing_and_baseline |
| `data.provenance_documented` | data_audit_and_leakage |
| `data.licensing_and_consent_confirmed` | data_audit_and_leakage |
| `data.label_quality_checked` | data_audit_and_leakage |
| `data.edge_cases_covered` | data_audit_and_leakage |
| `data.leakage_audited` | data_audit_and_leakage |
| `data.training_without_rights_or_consent` (must be `false` to pass — skill red line) | data_audit_and_leakage |
| `validation.temporal_data` + `validation.grouped_data` + `validation.split_type` (`"random"` / `"time"` / `"group"` / `"time_and_group"`) | data_audit_and_leakage (computed, see below) |
| `ladder.baseline_rung_evaluated` | model_ladder |
| `ladder.data_and_splits_held_fixed` | model_ladder |
| `ladder.complexity_justified_by_evaluation` | model_ladder |
| `ladder.selected_model_rung` (`"majority_heuristic"` / `"linear"` / `"boosted_trees"` / `"deep"`) + `ladder.rungs_evaluated` (list of rung names) | model_ladder (computed, see below) |
| `evaluation.decision_aligned_metrics_used` | evaluation_and_honesty |
| `evaluation.slice_performance_reported` | evaluation_and_honesty |
| `evaluation.calibration_reported` | evaluation_and_honesty |
| `evaluation.uncertainty_via_resampling_reported` | evaluation_and_honesty |
| `evaluation.conclusion_change_condition_stated` | evaluation_and_honesty |
| `evaluation.imbalanced_or_high_stakes` (gates the accuracy-only check below) | evaluation_and_honesty |
| `evaluation.accuracy_only_reporting` (must be `false` when the problem is imbalanced or high-stakes — skill red line; otherwise the check passes as not applicable) | evaluation_and_honesty |
| `robustness.distribution_shift_evaluated` | robustness_and_limits |
| `robustness.adversarial_inputs_evaluated` | robustness_and_limits |
| `robustness.known_failure_modes_documented` | robustness_and_limits |
| `robustness.data_limitations_documented` | robustness_and_limits |
| `robustness.cherry_picked_examples_presented` (must be `false` to pass) | robustness_and_limits |
| `robustness.claims_exceed_measured_capability` (must be `false` to pass — skill red line) | robustness_and_limits |
| `deployment.data_code_model_versioned_together` | deployment_monitoring_and_card |
| `deployment.drift_monitoring_planned` | deployment_monitoring_and_card |
| `deployment.live_performance_monitoring_planned` | deployment_monitoring_and_card |
| `deployment.feedback_loops_monitored` | deployment_monitoring_and_card |
| `deployment.rollback_path_defined` | deployment_monitoring_and_card |
| `deployment.regular_revalidation_planned` | deployment_monitoring_and_card |
| `documentation.model_card_written_and_versioned` | deployment_monitoring_and_card |

Three checks are computed from the declared values, using only what
the skill itself states — no outside threshold is imported:

- **Baseline beaten, or project rightly stopped:** the skill's
  quality gate is "Baseline defined and meaningfully beaten (or the
  project rightly stopped)". The declared `baseline.model_score`
  must strictly beat `baseline.baseline_score` in the declared
  `baseline.metric_direction`; the skill states no margin above the
  baseline, so any strictly positive improvement passes and equality
  fails. When `project_stopped_because_baseline_not_beaten` is
  declared `true`, the gate passes as the skill's stated alternative
  outcome and the scores are not required. The signed improvement in
  the declared direction is reported as `baseline_improvement`, and
  the outcome as `baseline_status`
  (`beaten_on_declared_evidence` / `not_beaten_on_declared_evidence`
  / `project_rightly_stopped` / null when the check cannot be
  completed).
- **Splits match the data:** the skill requires "splits by time and
  group where applicable" and "not just random rows". Temporal data
  therefore requires a `"time"` or `"time_and_group"` split, grouped
  data a `"group"` or `"time_and_group"` split; data that is neither
  passes with any declared split vocabulary value, and an unknown
  split type or a non-boolean data flag fails.
- **Ladder climbed in order:** the skill's model ladder is
  majority/heuristic → linear → boosted trees → deep, climbed only
  when evaluation justifies it. The declared `ladder.rungs_evaluated`
  must therefore be exactly the ladder prefix from the first rung up
  to and including `ladder.selected_model_rung`, in order — no rung
  skipped, repeated, or evaluated out of order. The selected rung's
  zero-based ladder index is reported as `selected_rung_index` (null
  when the selected rung is not a ladder vocabulary value).

**Fixed serialization rule:** `baseline_improvement` is reported as
a string with exactly four decimal places, produced in both
implementations by the same rule — round half up to 4dp,
`floor(v * 10000 + 0.5) / 10000`, then format with exactly four
decimals; comparisons use the unrounded values. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The verdict is one of `VALIDATED` (all 35 checks pass),
`NOT_VALIDATED` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across six sections:
framing_and_baseline, data_audit_and_leakage, model_ladder,
evaluation_and_honesty, robustness_and_limits,
deployment_monitoring_and_card.

## Honest scoping

This atom validates **declared** evidence about an ML project — it
does not train, run, inspect, or benchmark a model, does not read
the training data, recompute any metric, or verify that a declared
value is true. A project is validated *on the caller's declared
evidence*: a project that declares a beaten baseline, a time/group
split, and slice performance passes those checks even if the actual
work did something else.

Named exclusions: no check of *how much* the baseline was beaten by
(the skill says "meaningfully beaten" but states no margin, so none
is invented — strict improvement is the only stated test, and the
"rightly stopped" alternative is honored exactly as the skill words
it); no numeric calibration, slice, or drift thresholds (the skill
states none — calibration and slice performance are checked as
*reported*, not recomputed; callers who need the numbers themselves
audited against declared tolerances want
`prediction-model-leakage-calibration-audit`, the close cousin built
from the `prediction` skill, whose ground is leakage timing and
calibration arithmetic rather than this skill's framing, ladder,
and monitoring discipline); no judgment of whether the framing,
error costs, or model choice were *good* — only that they are
declared; no live verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python oracle
and TypeScript port built and parity-proven locally; no endpoint is
live. Release happens one by one, by the owner's GO, per the approved
queue.

## Named doubt (from the register)

Overlaps ai-ml-ds-engineer
