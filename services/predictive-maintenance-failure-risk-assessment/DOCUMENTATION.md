# Predictive maintenance failure risk assessment — full documentation

**Predictive maintenance failure risk assessment** · slug `predictive-maintenance-failure-risk-assessment` · deliverable type: DELIVERABLE · atom version 0.1.0 · status: **live — release candidate (one-week RC soak to 2026-11-22)**

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (worked example 1 below reproduces its request and response verbatim).

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the full flow is in the how-to below). Every call sends the key as `Authorization: Bearer <key>`.

**Step 2 — build the manifest.** The caller assembles one JSON manifest naming the subject in `asset` (`"Turbine-01"`) and declaring the evidence the atom checks, group by group (the input reference below lists every field and its type). In the recorded run, every checked field is supplied.

**Step 3 — call the REST endpoint.** `POST https://atoms.pipavia.com/v1/predictive-maintenance-failure-risk-assessment` with the manifest as the body and the `Authorization` header set.

**Step 4 — read the verdict.** The recorded response came back HTTP 200 with verdict `ASSESSMENT_SOUND`. Its summary: "24 pass, 0 fail, 0 missing of 24 checks across six sections." Every section reports `pass` (strategy_fit, pf_window, condition_monitoring, prediction, reliability_frame, data_and_integration) and every check in the `checks` array reports `pass` — that array, with its per-check evidence strings, is the deliverable's reasoning, not decoration.

**Step 5 — trust but verify.** The same manifest submitted twice returned byte-identical REST responses, and the MCP face returned a structurally identical result — both properties are recorded in the evidence (`determinism_byte_identical`, `parity_structured_equal`). Same input in, same deliverable out.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "predictive-maintenance-failure-risk-assessment"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. `POST https://atoms.pipavia.com/v1/predictive-maintenance-failure-risk-assessment` — body = the manifest object; same `Authorization` header. HTTP 200 returns the deliverable as JSON.

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/predictive-maintenance-failure-risk-assessment`
- Tool name: `predictive_maintenance_failure_risk_assessment` — `tools/call` arguments = the manifest object (the same object you would POST to REST).
- Send the same `Authorization: Bearer <key>` header. The MCP result's structured content is the same deliverable the REST face returns (parity is recorded in the evidence).

### Read a failing verdict and fix the manifest

The recorded violations run (worked example 2) returned HTTP 200 with verdict `ASSESSMENT_UNSOUND`: "22 pass, 2 fail, 0 missing of 24 checks across six sections." Read a failing response in this order:

1. **`verdict` + `summary`** — the counts tell you how many checks fail vs are missing. Fail and missing are different problems: a fail means your manifest *declares evidence against you*; missing means you *did not declare the evidence at all*.
2. **`checks` with `status: "fail"`** — in the recorded run:
   - `strategy_matched_to_criticality_and_failure_cost` (section `strategy_fit`) — evidence: "reactive is fine only for non-critical, cheap-to-replace assets; predictive is the sweet spot for critical assets"
   - `detection_early_in_window` (section `pf_window`) — evidence: "PdM detects early in that window and acts before F"
   Fix = change the underlying practice or record so the declaration becomes true, then resubmit. Editing the manifest to claim what is not true defeats the deliverable — the atom checks declared evidence, and its value is that the declaration is yours.
3. **`sections`** — a section reports `fail` when any of its checks fails, `insufficient_evidence` when nothing fails but evidence is missing, `pass` only when all its checks pass.

### Handle a 422 invalid_input

A type-violating manifest is rejected before any verdict is computed. The recorded malformed run (worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "asset",
  "detail": "asset must be a string"
}
```

Read `field` for the offending field and `detail` for the expected shape — here, `asset`: "asset must be a string". Fix the type at that field (per the input reference below) and resubmit. A 422 is never a verdict and is not metered as a delivered result.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/predictive-maintenance-failure-risk-assessment` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/predictive-maintenance-failure-risk-assessment` — tool name `predictive_maintenance_failure_risk_assessment`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Support: info@pipavia.com

### Input reference

Every field, grouped as SERVICE.md groups them, with its type. All fields are booleans unless a type is noted.

**Group: —**

| Field | Type | Notes |
|---|---|---|
| `asset` | string | carried into the verdict output, not itself checked |

**Group: `strategy_fit`**

| Field | Type | Notes |
|---|---|---|
| `strategy.asset_criticality_assessed` | see SERVICE.md note |  |
| `strategy.failure_cost_assessed` | see SERVICE.md note |  |
| `strategy.matched_to_criticality_and_failure_cost` | see SERVICE.md note |  |
| `strategy.pdm_justified_for_asset` | see SERVICE.md note |  |

**Group: `pf_window`**

| Field | Type | Notes |
|---|---|---|
| `pf_curve.detectable_point_identified` | see SERVICE.md note |  |
| `pf_curve.detection_early_in_window` | see SERVICE.md note |  |
| `pf_curve.planning_runway_sufficient` | see SERVICE.md note |  |

**Group: `condition_monitoring`**

| Field | Type | Notes |
|---|---|---|
| `monitoring.techniques_matched_to_failure_modes` | see SERVICE.md note |  |
| `monitoring.sensor_coverage_covers_failure_modes` | see SERVICE.md note |  |
| `monitoring.operating_parameters_monitored` | see SERVICE.md note |  |

**Group: `prediction`**

| Field | Type | Notes |
|---|---|---|
| `prediction.healthy_baseline_established` | see SERVICE.md note |  |
| `prediction.anomaly_detection_or_rul_in_place` | see SERVICE.md note |  |
| `prediction.fault_labels_available_or_imbalance_handled` | see SERVICE.md note |  |
| `prediction.uncertainty_reported` | see SERVICE.md note |  |
| `prediction.thresholds_tuned_to_missed_failure_vs_false_alarm_cost` | see SERVICE.md note |  |

**Group: `reliability_frame`**

| Field | Type | Notes |
|---|---|---|
| `reliability.fmea_completed` | see SERVICE.md note |  |
| `reliability.prioritised_by_severity_occurrence_detectability` | see SERVICE.md note |  |
| `reliability.rcm_strategy_per_failure_mode` | see SERVICE.md note |  |
| `reliability.mtbf_mttr_tracked` | see SERVICE.md note |  |
| `reliability.fmea_and_engineering_judgement_not_replaced` | see SERVICE.md note |  |

**Group: `data_and_integration`**

| Field | Type | Notes |
|---|---|---|
| `integration.sensor_quality_and_calibration_verified` | see SERVICE.md note |  |
| `integration.leakage_label_scarcity_and_drift_watched` | see SERVICE.md note |  |
| `integration.edge_vs_cloud_inference_decided` | see SERVICE.md note |  |
| `integration.work_orders_closed_into_cmms` | see SERVICE.md note |  |

### Checks

Every check the atom runs — 24 in total, exactly as named in the recorded full-pass response, grouped by section. For each check: what it requires to pass (the recorded evidence text states the requirement), and the status semantics that follow the table.

**Section: `strategy_fit`**

| Check | Requires to pass | Notes |
|---|---|---|
| `asset_criticality_assessed` | match strategy to asset criticality and failure cost — not everything deserves PdM |  |
| `failure_cost_assessed` | the cost of failure is assessed before a strategy is chosen |  |
| `strategy_matched_to_criticality_and_failure_cost` | reactive is fine only for non-critical, cheap-to-replace assets; predictive is the sweet spot for critical assets |  |
| `pdm_justified_for_this_asset` | PdM on assets that don't justify it is refused |  |
**Section: `pf_window`**

| Check | Requires to pass | Notes |
|---|---|---|
| `detectable_point_identified` | between the point a failure becomes detectable (P) and functional failure (F) lies a window — P is identified |  |
| `detection_early_in_window` | PdM detects early in that window and acts before F |  |
| `planning_runway_sufficient` | earlier, more reliable detection = longer planning runway |  |
**Section: `condition_monitoring`**

| Check | Requires to pass | Notes |
|---|---|---|
| `techniques_matched_to_failure_modes` | techniques are matched to the failure modes — vibration analysis, thermography, MCSA / electrical signature, oil analysis / DGA, acoustic / ultrasonic, operating parameters |  |
| `sensor_coverage_covers_failure_modes` | the sensing in place covers the failure modes that matter for this asset |  |
| `operating_parameters_monitored` | operating parameters — load, pressure, temperature, electrical params via SCADA/IoT — are monitored |  |
**Section: `prediction`**

| Check | Requires to pass | Notes |
|---|---|---|
| `healthy_baseline_established` | anomaly detection on streaming data — baseline "healthy" first, then flag deviations |  |
| `anomaly_detection_or_rul_in_place` | anomaly detection and/or remaining useful life (RUL) estimation is in place on the degradation signals |  |
| `fault_labels_available_or_imbalance_handled` | "classifying" faults with no failure labels is refused — failure labels are usually scarce, so handle class imbalance honestly |  |
| `uncertainty_reported` | baseline first; report uncertainty |  |
| `thresholds_tuned_to_missed_failure_vs_false_alarm_cost` | tune precision/recall against the cost of a missed failure vs a false alarm — an alert that cries wolf gets ignored; alert thresholds set without regard to false-alarm cost are refused |  |
**Section: `reliability_frame`**

| Check | Requires to pass | Notes |
|---|---|---|
| `fmea_completed` | FMEA — enumerate failure modes and effects |  |
| `prioritised_by_severity_occurrence_detectability` | prioritize by severity x occurrence x detectability (RPN) |  |
| `rcm_strategy_per_failure_mode` | RCM — choose the right strategy per failure mode, driven by consequence |  |
| `mtbf_mttr_tracked` | track MTBF / MTTR, availability, and downtime cost to justify PdM investment |  |
| `engineering_judgement_not_replaced_by_black_box` | replacing FMEA and engineering judgment with a black box is refused |  |
**Section: `data_and_integration`**

| Check | Requires to pass | Notes |
|---|---|---|
| `sensor_quality_and_calibration_verified` | sensor quality and calibration are foundational — garbage sensors, garbage predictions; ignoring sensor quality/calibration is refused |  |
| `leakage_label_scarcity_and_drift_watched` | data discipline: watch leakage, label scarcity, and drift |  |
| `edge_vs_cloud_inference_decided` | decide edge vs cloud inference |  |
| `work_orders_closed_into_cmms` | sensors/IoT -> data platform -> models -> work orders, closed back into the CMMS/EAM |  |

**Per-check status semantics:** `pass` — the requirement is met on the declared evidence (a conditional check whose gate does not bind also reports `pass`, with its evidence text saying why it does not bind, e.g. "no conveyor drives declared"); `fail` — the field is present but false/invalid, a red line is crossed, or a computed comparison fails; `missing` — the field (or a value a computed check needs) is absent. There is no separate not-applicable status value in the recorded responses: not-applicable is expressed as `pass` with explanatory evidence.

### Output format

A successful call returns one JSON object. The recorded full-pass response carries these top-level keys, in order: `service`, `atom_version`, `asset`, `verdict`, `sections`, `checks`, `summary`, `stamp`. It always includes `service` and `atom_version`, the subject echo where the manifest names one, the verdict/status, a human-readable `summary`, and a text `stamp` restating the result.

The response also carries `asset` (echoed), a `summary` line ("N pass, N fail, N missing of 24 checks across six sections") and a text `stamp` of the verdict.

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `ASSESSMENT_SOUND` | All 24 checks pass — the declared programme evidence is complete and consistent across all six sections. |
| `ASSESSMENT_UNSOUND` | At least one check fails (a field present but false/invalid, i.e. declared evidence against the programme). The failing checks name the section and the evidence. |
| `INSUFFICIENT_EVIDENCE` | Nothing fails, but at least one field is absent — evidence is missing. The checks marked `missing` name exactly what to supply. |
| section status `pass` | Every check in the section passes (including not-applicable passes). |
| section status `fail` | At least one check in the section fails. |
| section status `insufficient_evidence` | No check in the section fails, but at least one is missing. |
| check status `pass` / `fail` / `missing` | See the status semantics under Checks. |

### Errors

Only the shapes evidenced in the gateway code and the recorded battery are documented here:

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | Missing, malformed, unknown or revoked key (REST face shape, from the gateway call path). |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the <namespace> scope; issue it for this atom first"}` | The key is valid but was never issued for this atom — issue it for `predictive-maintenance-failure-risk-assessment` and retry. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "asset", "detail": "asset must be a string"}` (recorded verbatim in worked example 3) | The manifest violates a field type; `field` and `detail` name the problem. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for predictive-maintenance-failure-risk-assessment exceeded"}` (a per-day variant names the 10000/day limit) | Rate limit exceeded; the call is not metered. |

### Rate limits and pricing status

- Rate limits (contract.yaml, SPEC default): **60 calls/minute and 10000 calls/day per key** for this atom.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is null and `rate_status` is pending — **Free during trial — rate pending.** Prices are set only from measured production cost per unit, per the billing protocol in the contract.

## Explanation

This atom sells its deliverable — a bounded deliverable artifact — never the underlying knowledge itself. teams and agents working in Electrical & energy who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves. House self-use: **Industrial motor and transformer clients**.

**How the verdict is decided.** The core is deterministic: the same manifest always returns the same verdict (the recorded battery proves byte-identical repeat REST responses and REST/MCP parity). Each boolean field feeds exactly one check in one section. A section is `pass` when all its checks pass, `fail` when any check fails, and `insufficient_evidence` when nothing in it fails but evidence is missing. The verdict follows the sections: any fail → `ASSESSMENT_UNSOUND`; otherwise any missing → `INSUFFICIENT_EVIDENCE`; otherwise `ASSESSMENT_SOUND`. Absent field = missing evidence; present-but-false = fail — the two are never conflated.

**What it does NOT do.**

- Declared, not measured: it checks caller-declared evidence about a predictive-maintenance programme; it does not measure the asset itself.
- No sensor or SCADA data ingestion.
- No ML inference — no anomaly detection, RUL estimation, or fault classification is run.
- No RPN arithmetic over raw severity / occurrence / detectability scores, and no remaining-life or failure-probability figure is computed.
- The bound skill states no numeric thresholds, so none are invented.

## Role views

### For integrators (Users)

One manifest in, one deliverable out, over REST or MCP with the same key. Start with the tutorial, keep the input reference beside your manifest builder, and treat the response's verdict/status, summary and per-item detail as the product. Rate: free during trial — rate pending; limits 60/min, 10000/day per key. Support: info@pipavia.com.

### For developers

Manifest authoring: field names, groupings and types are exactly as in the input reference — a type violation is a 422 before any computation, and an absent field is a deliberate signal (missing evidence), not a default. Determinism: the core is deterministic — the recorded battery proves byte-identical repeat REST responses and REST/MCP structured parity for this atom, so golden-file testing against the worked examples below is sound. Implementation: `services/predictive-maintenance-failure-risk-assessment/src/predictive_maintenance_failure_risk_assessment.py` (Python 3, stdlib only; `evaluate(manifest)`), tests: `services/predictive-maintenance-failure-risk-assessment/tests/test_predictive_maintenance_failure_risk_assessment.py` (21 tests, per contract.yaml). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract R1 rule).

### For ops

Endpoints: REST `POST /v1/predictive-maintenance-failure-risk-assessment` and MCP `POST /mcp/predictive-maintenance-failure-risk-assessment` (tool `predictive_maintenance_failure_risk_assessment`) on https://atoms.pipavia.com. Key scope: per user, per atom — a key never verifies for another atom; 403 means the scope was never issued. Rate limits: 60/min, 10000/day per key (429, not metered). Error monitoring: watch the 401 (unauthorized) / 403 (scope_required) / 422 (invalid_input, with field+detail) / 429 (rate_limit) shapes in the errors table. Status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:59:40.560259+00:00 against gateway v1.1.0, external verification lane, source `verification/work/predictive-maintenance-failure-risk-assessment/evidence.json`. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — verified mechanically against the evidence after writing).

### Example 1 — full-pass (recorded HTTP 200)

Recorded case note: All 24 boolean fields set to true; expects full pass.

Input:

```json
{
  "asset": "Turbine-01",
  "strategy": {
    "asset_criticality_assessed": true,
    "failure_cost_assessed": true,
    "matched_to_criticality_and_failure_cost": true,
    "pdm_justified_for_asset": true
  },
  "pf_curve": {
    "detectable_point_identified": true,
    "detection_early_in_window": true,
    "planning_runway_sufficient": true
  },
  "monitoring": {
    "techniques_matched_to_failure_modes": true,
    "sensor_coverage_covers_failure_modes": true,
    "operating_parameters_monitored": true
  },
  "prediction": {
    "healthy_baseline_established": true,
    "anomaly_detection_or_rul_in_place": true,
    "fault_labels_available_or_imbalance_handled": true,
    "uncertainty_reported": true,
    "thresholds_tuned_to_missed_failure_vs_false_alarm_cost": true
  },
  "reliability": {
    "fmea_completed": true,
    "prioritised_by_severity_occurrence_detectability": true,
    "rcm_strategy_per_failure_mode": true,
    "mtbf_mttr_tracked": true,
    "fmea_and_engineering_judgement_not_replaced": true
  },
  "integration": {
    "sensor_quality_and_calibration_verified": true,
    "leakage_label_scarcity_and_drift_watched": true,
    "edge_vs_cloud_inference_decided": true,
    "work_orders_closed_into_cmms": true
  }
}
```

Response (REST):

```json
{
  "service": "predictive-maintenance-failure-risk-assessment",
  "atom_version": "0.1.0",
  "asset": "Turbine-01",
  "verdict": "ASSESSMENT_SOUND",
  "sections": {
    "strategy_fit": "pass",
    "pf_window": "pass",
    "condition_monitoring": "pass",
    "prediction": "pass",
    "reliability_frame": "pass",
    "data_and_integration": "pass"
  },
  "checks": [
    {
      "section": "strategy_fit",
      "check": "asset_criticality_assessed",
      "status": "pass",
      "evidence": "match strategy to asset criticality and failure cost — not everything deserves PdM"
    },
    {
      "section": "strategy_fit",
      "check": "failure_cost_assessed",
      "status": "pass",
      "evidence": "the cost of failure is assessed before a strategy is chosen"
    },
    {
      "section": "strategy_fit",
      "check": "strategy_matched_to_criticality_and_failure_cost",
      "status": "pass",
      "evidence": "reactive is fine only for non-critical, cheap-to-replace assets; predictive is the sweet spot for critical assets"
    },
    {
      "section": "strategy_fit",
      "check": "pdm_justified_for_this_asset",
      "status": "pass",
      "evidence": "PdM on assets that don't justify it is refused"
    },
    {
      "section": "pf_window",
      "check": "detectable_point_identified",
      "status": "pass",
      "evidence": "between the point a failure becomes detectable (P) and functional failure (F) lies a window — P is identified"
    },
    {
      "section": "pf_window",
      "check": "detection_early_in_window",
      "status": "pass",
      "evidence": "PdM detects early in that window and acts before F"
    },
    {
      "section": "pf_window",
      "check": "planning_runway_sufficient",
      "status": "pass",
      "evidence": "earlier, more reliable detection = longer planning runway"
    },
    {
      "section": "condition_monitoring",
      "check": "techniques_matched_to_failure_modes",
      "status": "pass",
      "evidence": "techniques are matched to the failure modes — vibration analysis, thermography, MCSA / electrical signature, oil analysis / DGA, acoustic / ultrasonic, operating parameters"
    },
    {
      "section": "condition_monitoring",
      "check": "sensor_coverage_covers_failure_modes",
      "status": "pass",
      "evidence": "the sensing in place covers the failure modes that matter for this asset"
    },
    {
      "section": "condition_monitoring",
      "check": "operating_parameters_monitored",
      "status": "pass",
      "evidence": "operating parameters — load, pressure, temperature, electrical params via SCADA/IoT — are monitored"
    },
    {
      "section": "prediction",
      "check": "healthy_baseline_established",
      "status": "pass",
      "evidence": "anomaly detection on streaming data — baseline \"healthy\" first, then flag deviations"
    },
    {
      "section": "prediction",
      "check": "anomaly_detection_or_rul_in_place",
      "status": "pass",
      "evidence": "anomaly detection and/or remaining useful life (RUL) estimation is in place on the degradation signals"
    },
    {
      "section": "prediction",
      "check": "fault_labels_available_or_imbalance_handled",
      "status": "pass",
      "evidence": "\"classifying\" faults with no failure labels is refused — failure labels are usually scarce, so handle class imbalance honestly"
    },
    {
      "section": "prediction",
      "check": "uncertainty_reported",
      "status": "pass",
      "evidence": "baseline first; report uncertainty"
    },
    {
      "section": "prediction",
      "check": "thresholds_tuned_to_missed_failure_vs_false_alarm_cost",
      "status": "pass",
      "evidence": "tune precision/recall against the cost of a missed failure vs a false alarm — an alert that cries wolf gets ignored; alert thresholds set without regard to false-alarm cost are refused"
    },
    {
      "section": "reliability_frame",
      "check": "fmea_completed",
      "status": "pass",
      "evidence": "FMEA — enumerate failure modes and effects"
    },
    {
      "section": "reliability_frame",
      "check": "prioritised_by_severity_occurrence_detectability",
      "status": "pass",
      "evidence": "prioritize by severity x occurrence x detectability (RPN)"
    },
    {
      "section": "reliability_frame",
      "check": "rcm_strategy_per_failure_mode",
      "status": "pass",
      "evidence": "RCM — choose the right strategy per failure mode, driven by consequence"
    },
    {
      "section": "reliability_frame",
      "check": "mtbf_mttr_tracked",
      "status": "pass",
      "evidence": "track MTBF / MTTR, availability, and downtime cost to justify PdM investment"
    },
    {
      "section": "reliability_frame",
      "check": "engineering_judgement_not_replaced_by_black_box",
      "status": "pass",
      "evidence": "replacing FMEA and engineering judgment with a black box is refused"
    },
    {
      "section": "data_and_integration",
      "check": "sensor_quality_and_calibration_verified",
      "status": "pass",
      "evidence": "sensor quality and calibration are foundational — garbage sensors, garbage predictions; ignoring sensor quality/calibration is refused"
    },
    {
      "section": "data_and_integration",
      "check": "leakage_label_scarcity_and_drift_watched",
      "status": "pass",
      "evidence": "data discipline: watch leakage, label scarcity, and drift"
    },
    {
      "section": "data_and_integration",
      "check": "edge_vs_cloud_inference_decided",
      "status": "pass",
      "evidence": "decide edge vs cloud inference"
    },
    {
      "section": "data_and_integration",
      "check": "work_orders_closed_into_cmms",
      "status": "pass",
      "evidence": "sensors/IoT -> data platform -> models -> work orders, closed back into the CMMS/EAM"
    }
  ],
  "summary": "24 pass, 0 fail, 0 missing of 24 checks across six sections.",
  "stamp": "PREDICTIVE MAINTENANCE FAILURE RISK ASSESSMENT\nasset: Turbine-01\nVERDICT: ASSESSMENT_SOUND\n  strategy_fit         pass\n  pf_window            pass\n  condition_monitoring pass\n  prediction           pass\n  reliability_frame    pass\n  data_and_integration pass\n24 pass, 0 fail, 0 missing of 24 checks across six sections."
}
```

### Example 2 — violations (recorded HTTP 200)

Recorded case note: Two fields explicitly set to false, triggering assessment failure.

Input:

```json
{
  "asset": "Motor-02",
  "strategy": {
    "asset_criticality_assessed": true,
    "failure_cost_assessed": true,
    "matched_to_criticality_and_failure_cost": false,
    "pdm_justified_for_asset": true
  },
  "pf_curve": {
    "detectable_point_identified": true,
    "detection_early_in_window": false,
    "planning_runway_sufficient": true
  },
  "monitoring": {
    "techniques_matched_to_failure_modes": true,
    "sensor_coverage_covers_failure_modes": true,
    "operating_parameters_monitored": true
  },
  "prediction": {
    "healthy_baseline_established": true,
    "anomaly_detection_or_rul_in_place": true,
    "fault_labels_available_or_imbalance_handled": true,
    "uncertainty_reported": true,
    "thresholds_tuned_to_missed_failure_vs_false_alarm_cost": true
  },
  "reliability": {
    "fmea_completed": true,
    "prioritised_by_severity_occurrence_detectability": true,
    "rcm_strategy_per_failure_mode": true,
    "mtbf_mttr_tracked": true,
    "fmea_and_engineering_judgement_not_replaced": true
  },
  "integration": {
    "sensor_quality_and_calibration_verified": true,
    "leakage_label_scarcity_and_drift_watched": true,
    "edge_vs_cloud_inference_decided": true,
    "work_orders_closed_into_cmms": true
  }
}
```

Response (REST):

```json
{
  "service": "predictive-maintenance-failure-risk-assessment",
  "atom_version": "0.1.0",
  "asset": "Motor-02",
  "verdict": "ASSESSMENT_UNSOUND",
  "sections": {
    "strategy_fit": "fail",
    "pf_window": "fail",
    "condition_monitoring": "pass",
    "prediction": "pass",
    "reliability_frame": "pass",
    "data_and_integration": "pass"
  },
  "checks": [
    {
      "section": "strategy_fit",
      "check": "asset_criticality_assessed",
      "status": "pass",
      "evidence": "match strategy to asset criticality and failure cost — not everything deserves PdM"
    },
    {
      "section": "strategy_fit",
      "check": "failure_cost_assessed",
      "status": "pass",
      "evidence": "the cost of failure is assessed before a strategy is chosen"
    },
    {
      "section": "strategy_fit",
      "check": "strategy_matched_to_criticality_and_failure_cost",
      "status": "fail",
      "evidence": "reactive is fine only for non-critical, cheap-to-replace assets; predictive is the sweet spot for critical assets"
    },
    {
      "section": "strategy_fit",
      "check": "pdm_justified_for_this_asset",
      "status": "pass",
      "evidence": "PdM on assets that don't justify it is refused"
    },
    {
      "section": "pf_window",
      "check": "detectable_point_identified",
      "status": "pass",
      "evidence": "between the point a failure becomes detectable (P) and functional failure (F) lies a window — P is identified"
    },
    {
      "section": "pf_window",
      "check": "detection_early_in_window",
      "status": "fail",
      "evidence": "PdM detects early in that window and acts before F"
    },
    {
      "section": "pf_window",
      "check": "planning_runway_sufficient",
      "status": "pass",
      "evidence": "earlier, more reliable detection = longer planning runway"
    },
    {
      "section": "condition_monitoring",
      "check": "techniques_matched_to_failure_modes",
      "status": "pass",
      "evidence": "techniques are matched to the failure modes — vibration analysis, thermography, MCSA / electrical signature, oil analysis / DGA, acoustic / ultrasonic, operating parameters"
    },
    {
      "section": "condition_monitoring",
      "check": "sensor_coverage_covers_failure_modes",
      "status": "pass",
      "evidence": "the sensing in place covers the failure modes that matter for this asset"
    },
    {
      "section": "condition_monitoring",
      "check": "operating_parameters_monitored",
      "status": "pass",
      "evidence": "operating parameters — load, pressure, temperature, electrical params via SCADA/IoT — are monitored"
    },
    {
      "section": "prediction",
      "check": "healthy_baseline_established",
      "status": "pass",
      "evidence": "anomaly detection on streaming data — baseline \"healthy\" first, then flag deviations"
    },
    {
      "section": "prediction",
      "check": "anomaly_detection_or_rul_in_place",
      "status": "pass",
      "evidence": "anomaly detection and/or remaining useful life (RUL) estimation is in place on the degradation signals"
    },
    {
      "section": "prediction",
      "check": "fault_labels_available_or_imbalance_handled",
      "status": "pass",
      "evidence": "\"classifying\" faults with no failure labels is refused — failure labels are usually scarce, so handle class imbalance honestly"
    },
    {
      "section": "prediction",
      "check": "uncertainty_reported",
      "status": "pass",
      "evidence": "baseline first; report uncertainty"
    },
    {
      "section": "prediction",
      "check": "thresholds_tuned_to_missed_failure_vs_false_alarm_cost",
      "status": "pass",
      "evidence": "tune precision/recall against the cost of a missed failure vs a false alarm — an alert that cries wolf gets ignored; alert thresholds set without regard to false-alarm cost are refused"
    },
    {
      "section": "reliability_frame",
      "check": "fmea_completed",
      "status": "pass",
      "evidence": "FMEA — enumerate failure modes and effects"
    },
    {
      "section": "reliability_frame",
      "check": "prioritised_by_severity_occurrence_detectability",
      "status": "pass",
      "evidence": "prioritize by severity x occurrence x detectability (RPN)"
    },
    {
      "section": "reliability_frame",
      "check": "rcm_strategy_per_failure_mode",
      "status": "pass",
      "evidence": "RCM — choose the right strategy per failure mode, driven by consequence"
    },
    {
      "section": "reliability_frame",
      "check": "mtbf_mttr_tracked",
      "status": "pass",
      "evidence": "track MTBF / MTTR, availability, and downtime cost to justify PdM investment"
    },
    {
      "section": "reliability_frame",
      "check": "engineering_judgement_not_replaced_by_black_box",
      "status": "pass",
      "evidence": "replacing FMEA and engineering judgment with a black box is refused"
    },
    {
      "section": "data_and_integration",
      "check": "sensor_quality_and_calibration_verified",
      "status": "pass",
      "evidence": "sensor quality and calibration are foundational — garbage sensors, garbage predictions; ignoring sensor quality/calibration is refused"
    },
    {
      "section": "data_and_integration",
      "check": "leakage_label_scarcity_and_drift_watched",
      "status": "pass",
      "evidence": "data discipline: watch leakage, label scarcity, and drift"
    },
    {
      "section": "data_and_integration",
      "check": "edge_vs_cloud_inference_decided",
      "status": "pass",
      "evidence": "decide edge vs cloud inference"
    },
    {
      "section": "data_and_integration",
      "check": "work_orders_closed_into_cmms",
      "status": "pass",
      "evidence": "sensors/IoT -> data platform -> models -> work orders, closed back into the CMMS/EAM"
    }
  ],
  "summary": "22 pass, 2 fail, 0 missing of 24 checks across six sections.",
  "stamp": "PREDICTIVE MAINTENANCE FAILURE RISK ASSESSMENT\nasset: Motor-02\nVERDICT: ASSESSMENT_UNSOUND\n  strategy_fit         fail\n  pf_window            fail\n  condition_monitoring pass\n  prediction           pass\n  reliability_frame    pass\n  data_and_integration pass\n22 pass, 2 fail, 0 missing of 24 checks across six sections."
}
```

### Example 3 — malformed (recorded HTTP 422)

Recorded case note: Type mismatch on strategy object and asset string field.

Input:

```json
{
  "asset": 12345,
  "strategy": "invalid_string_instead_of_object"
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "asset",
  "detail": "asset must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Y — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Integrators Y · Developers Y · Ops Y · Regulators N/A (industrial predictive-maintenance programme assessment; the verdict is an engineering judgment artifact, not compliance or audit evidence for a regulated domain.) |
| Checks named count vs recorded count | 24 / 24 — every check in the recorded full-pass response is documented |
| Verdict vocabulary complete | Y — 3 verdict values plus section/per-item statuses documented |
| Input reference typed | Y — 25 field rows, each with a type (SERVICE.md field table + recorded input schema) |
| Worked examples verbatim-verified | Y — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/predictive-maintenance-failure-risk-assessment/evidence.json` |

