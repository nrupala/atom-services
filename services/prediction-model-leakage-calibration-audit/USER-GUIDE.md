# Prediction-model leakage & calibration audit — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a prediction model and need to know whether its numbers can be believed. This atom reads a short evidence manifest describing the model — target and decision, baseline and untouched holdout, leakage-free validation, the model ladder and thresholds, calibration observations and segment errors (five checks are computed from your data, not declared: holdout improvement over baseline, feature availability at prediction time, no target-derived features, no random split for temporal data, calibration error and segment errors against *your* declared tolerances) — plus drift and deployment practice, and returns one deterministic verdict across six sections with per-check evidence: **PREDICTION_AUDIT_SOUND**, **PREDICTION_AUDIT_UNSOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "prediction-model-leakage-calibration-audit"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/prediction-model-leakage-calibration-audit`
  — tool name `prediction_model_leakage_calibration_audit`; `tools/call` arguments = the input object below.
- **REST:** `POST https://atoms.pipavia.com/v1/prediction-model-leakage-calibration-audit`
  — body = the input object; same `Authorization` header.

## Input

The full field table lives in the atom's `SERVICE.md`; the fields are:

| Field |
|---|
| `target.defined` |
| `target.horizon_declared` |
| `target.decision_defined` |
| `target.metric_chosen_from_decision_costs` |
| `baseline.computed` |
| `baseline.evaluated_on_same_holdout` |
| `holdout.untouched` |
| `validation.split_strategy_documented` |
| `approach.simple_model_tried_first` |
| `approach.complexity_justified` |
| `approach.outputs_probabilities` |
| `approach.action_thresholds_from_decision_costs` |
| `calibration.reported` |
| `evaluation.segment_errors_reported` |
| `drift.monitoring_in_place` |
| `drift.feedback_loops_identified` |
| `drift.retraining_policy_defined` |
| `deployment.versioned_model_and_card` |
| `deployment.rollback_path_defined` |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE / gaps). A field present but false/invalid = the
check fails (counts toward the FAIL verdict).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/prediction-model-leakage-calibration-audit`:

```json
{
  "model": "test-model-v1",
  "prediction_time": 100,
  "target": {
    "defined": true,
    "horizon_declared": true,
    "decision_defined": true,
    "metric_chosen_from_decision_costs": true
  },
  "baseline": {
    "computed": true,
    "evaluated_on_same_holdout": true
  },
  "holdout": {
    "model_score": 0.8,
    "baseline_score": 0.5,
    "metric_direction": "higher_is_better",
    "untouched": true
  },
  "validation": {
    "split_strategy_documented": true,
    "temporal_data": true,
    "split_type": "time_based",
    "peeking_at_validation": false
  },
  "features": [
    {
      "available_at": 50,
      "derived_from_target": false
    }
  ],
  "approach": {
    "simple_model_tried_first": true,
    "complexity_justified": true,
    "outputs_probabilities": true,
    "action_thresholds_from_decision_costs": true
  },
  "calibration": {
    "reported": true,
    "max_tolerated_error": 0.05,
    "observations": [
      {
        "predicted": 0.6,
        "outcome": 1
      },
      {
        "predicted": 0.4,
        "outcome": 0
      }
    ]
  },
  "evaluation": {
    "segment_errors_reported": true,
    "max_segment_error": 0.1,
    "segments": [
      {
        "name": "A",
        "error": 0.02
      }
    ]
  },
  "drift": {
    "monitoring_in_place": true,
    "feedback_loops_identified": true,
    "retraining_policy_defined": true
  },
  "deployment": {
    "versioned_model_and_card": true,
    "rollback_path_defined": true,
    "silent_updates_in_production": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries every check
and a text stamp of the verdict):

```json
{
  "service": "prediction-model-leakage-calibration-audit",
  "atom_version": "0.1.0",
  "model": "test-model-v1",
  "verdict": "PREDICTION_AUDIT_SOUND",
  "sections": {
    "target_and_decision": "pass",
    "baseline_and_holdout": "pass",
    "leakage_and_validation": "pass",
    "model_ladder_and_thresholds": "pass",
    "calibration_and_evaluation": "pass",
    "drift_and_deployment": "pass"
  },
  "summary": "27 pass, 0 fail, 0 missing of 27 checks across six sections.",
  "checks": [
    {
      "section": "target_and_decision",
      "check": "target_defined",
      "status": "pass",
      "evidence": "what is predicted \u2014 the target is defined"
    },
    {
      "section": "target_and_decision",
      "check": "prediction_horizon_declared",
      "status": "pass",
      "evidence": "the prediction horizon is declared"
    }
  ]
}
```

## Verdicts

- **PREDICTION_AUDIT_SOUND** — every check passes (27/27); the model's evidence clears all six sections.
- **PREDICTION_AUDIT_UNSOUND** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
