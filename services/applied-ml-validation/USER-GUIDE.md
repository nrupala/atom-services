# Applied ml validation — user guide

## What it does

You are validating an ML project. This atom reads a declared evidence
pack for one ML project — framing and baseline, data audit and
leakage, model ladder, evaluation honesty, robustness, deployment
monitoring and model card — and returns one deterministic verdict
across six sections: **VALIDATED**, **NOT_VALIDATED**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Three checks are computed: the
baseline must be strictly beaten (or the project rightly stopped),
the split must match the data (time/group), and the model ladder must
be climbed in order with no rung skipped. Same manifest in → same
verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "applied-ml-validation"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/applied-ml-validation`
  — tool name `applied_ml_validation`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/applied-ml-validation`
  — body = the manifest object; same `Authorization` header.

## Input — the applied-ML validation manifest

| Field | Meaning |
|---|---|
| `model` | model name (string; carried into the output, not checked) |
| `framing.decision_named` / `error_costs_stated` / `alternatives_considered` | framing evidence |
| `baseline.defined`, `baseline.baseline_score`, `baseline.model_score`, `baseline.metric_direction` (`lower_is_better` / `higher_is_better`) | computed baseline gate: model score must strictly beat baseline in the declared direction |
| `baseline.project_stopped_because_baseline_not_beaten` | if `true`, the baseline gate passes as the rightly-stopped alternative |
| `data.provenance_documented` / `licensing_and_consent_confirmed` / `label_quality_checked` / `edge_cases_covered` / `leakage_audited` | data audit evidence |
| `data.training_without_rights_or_consent` | must be `false` to pass (red line) |
| `validation.temporal_data`, `validation.grouped_data`, `validation.split_type` (`random` / `time` / `group` / `time_and_group`) | computed split check: temporal data needs a time split, grouped data a group split |
| `ladder.baseline_rung_evaluated` / `data_and_splits_held_fixed` / `complexity_justified_by_evaluation` | ladder discipline |
| `ladder.selected_model_rung`, `ladder.rungs_evaluated` | computed ladder check: rungs must be exactly the prefix `majority_heuristic` → `linear` → `boosted_trees` → `deep` up to the selected rung |
| `evaluation.decision_aligned_metrics_used` / `slice_performance_reported` / `calibration_reported` / `uncertainty_via_resampling_reported` / `conclusion_change_condition_stated` | evaluation honesty evidence |
| `evaluation.imbalanced_or_high_stakes`, `evaluation.accuracy_only_reporting` | accuracy-only must be `false` when imbalanced/high-stakes |
| `robustness.distribution_shift_evaluated` / `adversarial_inputs_evaluated` / `known_failure_modes_documented` / `data_limitations_documented` | robustness evidence |
| `robustness.cherry_picked_examples_presented`, `robustness.claims_exceed_measured_capability` | both must be `false` to pass |
| `deployment.data_code_model_versioned_together` / `drift_monitoring_planned` / `live_performance_monitoring_planned` / `feedback_loops_monitored` / `rollback_path_defined` / `regular_revalidation_planned` | deployment and monitoring evidence |
| `documentation.model_card_written_and_versioned` | model card evidence |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check
fails (counts toward NOT_VALIDATED).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/applied-ml-validation`:

```json
{
  "model": "test-model-v1",
  "framing": {
    "decision_named": true,
    "error_costs_stated": true,
    "alternatives_considered": true
  },
  "baseline": {
    "defined": true,
    "baseline_score": 0.5,
    "model_score": 0.6,
    "metric_direction": "higher_is_better",
    "project_stopped_because_baseline_not_beaten": false
  },
  "data": {
    "provenance_documented": true,
    "licensing_and_consent_confirmed": true,
    "label_quality_checked": true,
    "edge_cases_covered": true,
    "leakage_audited": true,
    "training_without_rights_or_consent": false
  },
  "validation": {
    "temporal_data": true,
    "grouped_data": true,
    "split_type": "time_and_group"
  },
  "ladder": {
    "baseline_rung_evaluated": true,
    "data_and_splits_held_fixed": true,
    "complexity_justified_by_evaluation": true,
    "selected_model_rung": "linear",
    "rungs_evaluated": [
      "majority_heuristic",
      "linear"
    ]
  },
  "evaluation": {
    "decision_aligned_metrics_used": true,
    "slice_performance_reported": true,
    "calibration_reported": true,
    "uncertainty_via_resampling_reported": true,
    "conclusion_change_condition_stated": true,
    "imbalanced_or_high_stakes": false,
    "accuracy_only_reporting": false
  },
  "robustness": {
    "distribution_shift_evaluated": true,
    "adversarial_inputs_evaluated": true,
    "known_failure_modes_documented": true,
    "data_limitations_documented": true,
    "cherry_picked_examples_presented": false,
    "claims_exceed_measured_capability": false
  },
  "deployment": {
    "data_code_model_versioned_together": true,
    "drift_monitoring_planned": true,
    "live_performance_monitoring_planned": true,
    "feedback_loops_monitored": true,
    "rollback_path_defined": true,
    "regular_revalidation_planned": true
  },
  "documentation": {
    "model_card_written_and_versioned": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 35 checks
and a text stamp of the verdict):

```json
{
  "service": "applied-ml-validation",
  "atom_version": "0.1.0",
  "model": "test-model-v1",
  "verdict": "VALIDATED",
  "sections": {
    "framing_and_baseline": "pass",
    "data_audit_and_leakage": "pass",
    "model_ladder": "pass",
    "evaluation_and_honesty": "pass",
    "robustness_and_limits": "pass",
    "deployment_monitoring_and_card": "pass"
  },
  "baseline_improvement": "0.1000",
  "baseline_status": "beaten_on_declared_evidence",
  "selected_rung_index": 1,
  "summary": "35 pass, 0 fail, 0 missing of 35 checks across six sections."
}
```

## Verdicts

- **VALIDATED** — every check passes; the project is validated on the declared evidence.
- **NOT_VALIDATED** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `baseline_improvement` (signed improvement in the declared direction, string with exactly four decimals), `baseline_status` (`beaten_on_declared_evidence` / `not_beaten_on_declared_evidence` / `project_rightly_stopped` / null) and `selected_rung_index` (zero-based ladder index, or null).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
