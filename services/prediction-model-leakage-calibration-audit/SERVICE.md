# Prediction model leakage calibration audit — `prediction-model-leakage-calibration-audit`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Predict with models honestly — baselines, leakage-free validation, calibration, drift awareness.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Thinking & decisions who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Validating RA and PdM models**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the prediction-model evidence manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`PREDICTION_AUDIT_UNSOUND`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `model` (string; carried into the verdict output, not itself checked) | — |
| `prediction_time` (number; every feature must be available at or before it) | leakage_and_validation |
| `target.defined` | target_and_decision |
| `target.horizon_declared` | target_and_decision |
| `target.decision_defined` | target_and_decision |
| `target.metric_chosen_from_decision_costs` | target_and_decision |
| `baseline.computed` | baseline_and_holdout |
| `baseline.evaluated_on_same_holdout` | baseline_and_holdout |
| `holdout.model_score` (number; compared against the baseline by the computed check) | baseline_and_holdout |
| `holdout.baseline_score` (number; see above) | baseline_and_holdout |
| `holdout.metric_direction` (string: `"lower_is_better"` or `"higher_is_better"`; the model must strictly beat the baseline in that direction) | baseline_and_holdout |
| `holdout.untouched` | baseline_and_holdout |
| `validation.split_strategy_documented` | leakage_and_validation |
| `validation.temporal_data` (with `validation.split_type`; a temporal dataset with a `"random"` split is the red-line fail) | leakage_and_validation |
| `validation.split_type` (string, e.g. `"time_based"`; see above) | leakage_and_validation |
| `validation.peeking_at_validation` (must be `false` to pass) | leakage_and_validation |
| `features[]` (list of feature records, see below) | leakage_and_validation |
| `features[].available_at` (number; must be ≤ `prediction_time`) | leakage_and_validation |
| `features[].derived_from_target` (must be `false` for every feature) | leakage_and_validation |
| `approach.simple_model_tried_first` | model_ladder_and_thresholds |
| `approach.complexity_justified` | model_ladder_and_thresholds |
| `approach.outputs_probabilities` | model_ladder_and_thresholds |
| `approach.action_thresholds_from_decision_costs` | model_ladder_and_thresholds |
| `calibration.reported` | calibration_and_evaluation |
| `calibration.max_tolerated_error` (number; the caller's declared tolerance for the computed calibration error) | calibration_and_evaluation |
| `calibration.observations[]` (list of `{predicted, outcome}` records, see below) | calibration_and_evaluation |
| `calibration.observations[].predicted` (number, 0–1: a predicted probability) | calibration_and_evaluation |
| `calibration.observations[].outcome` (number: `0` or `1`, the observed outcome) | calibration_and_evaluation |
| `evaluation.segment_errors_reported` | calibration_and_evaluation |
| `evaluation.max_segment_error` (number; the caller's declared maximum segment error) | calibration_and_evaluation |
| `evaluation.segments[]` (list of `{name, error}` records, see below) | calibration_and_evaluation |
| `evaluation.segments[].error` (number; must be ≤ `evaluation.max_segment_error`) | calibration_and_evaluation |
| `drift.monitoring_in_place` | drift_and_deployment |
| `drift.feedback_loops_identified` | drift_and_deployment |
| `drift.retraining_policy_defined` | drift_and_deployment |
| `deployment.versioned_model_and_card` | drift_and_deployment |
| `deployment.rollback_path_defined` | drift_and_deployment |
| `deployment.silent_updates_in_production` (must be `false` to pass) | drift_and_deployment |

Five checks are computed, not declared: the model must strictly beat
the baseline on the untouched holdout in the declared metric
direction; no feature may be available after `prediction_time` and
none may be derived from the target; a temporal dataset must not use
a random split; the calibration error — |mean predicted probability
− mean observed outcome| over `calibration.observations` — must be
within the caller's declared `max_tolerated_error`; and every segment
error must be within the caller's declared `max_segment_error`. No
threshold is invented by the atom — both tolerances are the caller's
declared values. The verdict dict also reports `holdout_improvement`,
`mean_predicted`, `mean_observed` and `calibration_error` as strings
with exactly four decimal places (round half up to 4dp, then format
with four decimals — the same fixed rule in both implementations),
and `worst_segment`, the name of the segment with the highest error
(first such segment on a tie).

The verdict is one of `PREDICTION_AUDIT_SOUND` (all 27 checks pass),
`PREDICTION_AUDIT_UNSOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across six sections: target_and_decision, baseline_and_holdout,
leakage_and_validation, model_ladder_and_thresholds,
calibration_and_evaluation, drift_and_deployment.

## Status

Tier A · status: **scaffolded** — service unit generated from the register; no endpoint is live. Release happens one by one, by the owner's GO, per the approved queue.
