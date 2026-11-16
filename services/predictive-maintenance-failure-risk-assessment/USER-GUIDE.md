# Predictive maintenance failure risk assessment — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You run (or plan) a predictive-maintenance programme for an asset.
This atom reads a short evidence manifest describing that programme —
strategy fit, the P–F detection window, condition monitoring,
prediction practice, the reliability frame (FMEA/RCM), and data &
integration — and returns one deterministic verdict across 24 checks
in six sections: **ASSESSMENT_SOUND**, **ASSESSMENT_UNSOUND**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). It checks the evidence you declare
about the programme; it does not measure the asset itself, ingest
sensor data, or run any ML inference. Same manifest in → same verdict
out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "predictive-maintenance-failure-risk-assessment"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/predictive-maintenance-failure-risk-assessment`
  — tool name `predictive_maintenance_failure_risk_assessment`;
  `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/predictive-maintenance-failure-risk-assessment`
  — body = the manifest object; same `Authorization` header.

## Input — the failure-risk evidence manifest

All fields are booleans unless noted.

| Field | Meaning |
|---|---|
| `asset` | asset name (string; carried into the output, not itself checked) |
| `strategy.asset_criticality_assessed`, `strategy.failure_cost_assessed`, `strategy.matched_to_criticality_and_failure_cost`, `strategy.pdm_justified_for_asset` | strategy fit: PdM matched to criticality and failure cost, and justified for this asset |
| `pf_curve.detectable_point_identified`, `pf_curve.detection_early_in_window`, `pf_curve.planning_runway_sufficient` | the P–F window: failure detectable early enough to plan |
| `monitoring.techniques_matched_to_failure_modes`, `monitoring.sensor_coverage_covers_failure_modes`, `monitoring.operating_parameters_monitored` | condition monitoring matched to the failure modes |
| `prediction.healthy_baseline_established`, `prediction.anomaly_detection_or_rul_in_place`, `prediction.fault_labels_available_or_imbalance_handled`, `prediction.uncertainty_reported`, `prediction.thresholds_tuned_to_missed_failure_vs_false_alarm_cost` | prediction practice |
| `reliability.fmea_completed`, `reliability.prioritised_by_severity_occurrence_detectability`, `reliability.rcm_strategy_per_failure_mode`, `reliability.mtbf_mttr_tracked`, `reliability.fmea_and_engineering_judgement_not_replaced` | reliability frame |
| `integration.sensor_quality_and_calibration_verified`, `integration.leakage_label_scarcity_and_drift_watched`, `integration.edge_vs_cloud_inference_decided`, `integration.work_orders_closed_into_cmms` | data & integration |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false = the check fails
(counts toward ASSESSMENT_UNSOUND).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/predictive-maintenance-failure-risk-assessment`:

```json
{
  "asset": "Turbine-01",
  "strategy": {"asset_criticality_assessed": true, "failure_cost_assessed": true, "matched_to_criticality_and_failure_cost": true, "pdm_justified_for_asset": true},
  "pf_curve": {"detectable_point_identified": true, "detection_early_in_window": true, "planning_runway_sufficient": true},
  "monitoring": {"techniques_matched_to_failure_modes": true, "sensor_coverage_covers_failure_modes": true, "operating_parameters_monitored": true},
  "prediction": {"healthy_baseline_established": true, "anomaly_detection_or_rul_in_place": true, "fault_labels_available_or_imbalance_handled": true, "uncertainty_reported": true, "thresholds_tuned_to_missed_failure_vs_false_alarm_cost": true},
  "reliability": {"fmea_completed": true, "prioritised_by_severity_occurrence_detectability": true, "rcm_strategy_per_failure_mode": true, "mtbf_mttr_tracked": true, "fmea_and_engineering_judgement_not_replaced": true},
  "integration": {"sensor_quality_and_calibration_verified": true, "leakage_label_scarcity_and_drift_watched": true, "edge_vs_cloud_inference_decided": true, "work_orders_closed_into_cmms": true}
}
```

Response — HTTP 200 (trimmed; the full response carries all 24 checks
and a text stamp of the verdict):

```json
{
  "service": "predictive-maintenance-failure-risk-assessment",
  "atom_version": "0.1.0",
  "asset": "Turbine-01",
  "verdict": "ASSESSMENT_SOUND",
  "sections": {"strategy_fit": "pass", "pf_window": "pass", "condition_monitoring": "pass", "prediction": "pass", "reliability_frame": "pass", "data_and_integration": "pass"},
  "summary": "24 pass, 0 fail, 0 missing of 24 checks across six sections."
}
```

## Verdicts

- **ASSESSMENT_SOUND** — every check passes; the programme's declared
  evidence is complete and consistent across all six sections.
- **ASSESSMENT_UNSOUND** — at least one check fails; the failing checks
  name the section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing;
  the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
