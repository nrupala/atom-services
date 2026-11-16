# Predictive maintenance failure risk assessment — `predictive-maintenance-failure-risk-assessment`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Electrical & energy who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Industrial motor and transformer clients**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the failure-risk evidence manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`ASSESSMENT_UNSOUND`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `asset` (string; carried into the verdict output, not itself checked) | — |
| `strategy.asset_criticality_assessed` | strategy_fit |
| `strategy.failure_cost_assessed` | strategy_fit |
| `strategy.matched_to_criticality_and_failure_cost` | strategy_fit |
| `strategy.pdm_justified_for_asset` | strategy_fit |
| `pf_curve.detectable_point_identified` | pf_window |
| `pf_curve.detection_early_in_window` | pf_window |
| `pf_curve.planning_runway_sufficient` | pf_window |
| `monitoring.techniques_matched_to_failure_modes` | condition_monitoring |
| `monitoring.sensor_coverage_covers_failure_modes` | condition_monitoring |
| `monitoring.operating_parameters_monitored` | condition_monitoring |
| `prediction.healthy_baseline_established` | prediction |
| `prediction.anomaly_detection_or_rul_in_place` | prediction |
| `prediction.fault_labels_available_or_imbalance_handled` | prediction |
| `prediction.uncertainty_reported` | prediction |
| `prediction.thresholds_tuned_to_missed_failure_vs_false_alarm_cost` | prediction |
| `reliability.fmea_completed` | reliability_frame |
| `reliability.prioritised_by_severity_occurrence_detectability` | reliability_frame |
| `reliability.rcm_strategy_per_failure_mode` | reliability_frame |
| `reliability.mtbf_mttr_tracked` | reliability_frame |
| `reliability.fmea_and_engineering_judgement_not_replaced` | reliability_frame |
| `integration.sensor_quality_and_calibration_verified` | data_and_integration |
| `integration.leakage_label_scarcity_and_drift_watched` | data_and_integration |
| `integration.edge_vs_cloud_inference_decided` | data_and_integration |
| `integration.work_orders_closed_into_cmms` | data_and_integration |

The verdict is one of `ASSESSMENT_SOUND` (all 24 checks pass),
`ASSESSMENT_UNSOUND` (any check fails), or `INSUFFICIENT_EVIDENCE`
(nothing fails but evidence is missing), across six sections:
strategy_fit, pf_window, condition_monitoring, prediction,
reliability_frame, data_and_integration.

## Scoping — declared, not measured

This atom checks **caller-declared evidence** about a predictive
maintenance programme; it does not measure the asset itself. The bound
skill states no numeric thresholds, so none are invented here: the
manifest declares the evidence and the core checks the declared
fields. Named exclusions: no sensor or SCADA data ingestion, no ML
inference (no anomaly detection, RUL estimation, or fault
classification is run), no RPN arithmetic over raw severity /
occurrence / detectability scores, and no remaining-life or
failure-probability figure is computed. Those belong to the caller's
own monitoring and models; this atom verifies that the programme
around them follows the skill — strategy matched to criticality and
failure cost, detection early in the P-F window, honest label and
threshold discipline, FMEA/RCM framing, calibrated sensors, and the
loop closed into the CMMS.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.
