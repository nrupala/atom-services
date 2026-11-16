# Electrical-machinery engineering check — user guide
Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are engineering-checking an electrical machine — a motor or
generator. This atom reads a manifest covering duty, sizing (with three
computed comparisons: worst-case torque vs rated torque, worst-case
power vs rated power, starting current vs supply capability),
specification, acceptance tests, failure analysis, trending, and
records and safety — across seven sections (duty, sizing,
specification, acceptance_tests, failure_analysis, trending,
records_and_safety). The verdict is **SOUND**, **NOT_SOUND**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). No outside acceptance thresholds are
applied: test items are checked as declared-and-recorded against
criteria from standards and OEM. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "electrical-machinery-engineering-check"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/electrical-machinery-engineering-check`
  — tool name `electrical_machinery_engineering_check`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/electrical-machinery-engineering-check`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `machine` (string) | the machine (carried into the output) |
| `duty.load_torque_profile` (`constant`/`variable`/`impact`), `duty.starts_per_hour`, `duty.ambient_c`, `duty.altitude_m`, `duty.worst_case_identified` | the duty is declared, worst case identified |
| `sizing.worst_case_torque_nm` / `sizing.rated_torque_nm`, `sizing.worst_case_power_kw` / `sizing.rated_power_kw`, `sizing.starting_current_a` / `sizing.supply_capability_a` (numbers; each worst-case value must not exceed its rating), `sizing.service_factor`, `sizing.efficiency_at_actual_load_percent` | sizing, computed |
| `specification.machine_type` (`induction`/`synchronous`), `specification.insulation_class`, `specification.enclosure` (`TEFC`/`ODP`/`WPI`), `specification.bearings_specified`, `specification.space_heaters_specified`, `specification.rtds_specified`, `specification.vibration_limits_specified`, `specification.standards_cited` | specification |
| `tests.criteria_defined_before_tests`, `tests.criteria_from_standards_and_oem`, `tests.insulation_resistance_tested`, `tests.pi_dar_trends_recorded`, `tests.winding_resistance_balance_checked`, `tests.surge_comparison_done`, `tests.no_load_and_load_runs_done`, `tests.results_recorded_with_units`, `tests.instruments_and_calibration_recorded` | acceptance tests |
| `failure.investigation_open`, `failure.evidence_organized_into_timeline`, `failure.operating_history_included`, `failure.typical_failure_modes_considered` | failure analysis; the last three are required when an investigation is open, otherwise not applicable |
| `trending.per_asset_baseline_exists`, `trending.like_for_like_comparison`, `trending.deltas_compared` | trending |
| `records.nameplate_and_serial_verified`, `records.re_energized_after_insulation_or_winding_anomaly_without_review` (must be `false`), `records.anomalies_flagged`, `records.asset_records_updated`, `records.deviations_logged_with_actions` | records and safety |

All fields are booleans unless noted. A field **absent** = evidence
missing (counts toward INSUFFICIENT_EVIDENCE). A field present but
false/invalid = the check fails (counts toward NOT_SOUND).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/electrical-machinery-engineering-check`:

```json
{
  "machine": "Motor-001",
  "duty": {
    "load_torque_profile": "constant",
    "starts_per_hour": 2,
    "ambient_c": 40,
    "altitude_m": 1000,
    "worst_case_identified": true
  },
  "sizing": {
    "worst_case_torque_nm": 50,
    "rated_torque_nm": 100,
    "worst_case_power_kw": 10,
    "rated_power_kw": 20,
    "service_factor": 1.15,
    "starting_current_a": 50,
    "supply_capability_a": 100,
    "efficiency_at_actual_load_percent": 95
  },
  "specification": {
    "machine_type": "induction",
    "insulation_class": "F",
    "enclosure": "TEFC",
    "bearings_specified": true,
    "space_heaters_specified": true,
    "rtds_specified": true,
    "vibration_limits_specified": true,
    "standards_cited": true
  },
  "tests": {
    "criteria_defined_before_tests": true,
    "criteria_from_standards_and_oem": true,
    "insulation_resistance_tested": true,
    "pi_dar_trends_recorded": true,
    "winding_resistance_balance_checked": true,
    "surge_comparison_done": true,
    "no_load_and_load_runs_done": true,
    "results_recorded_with_units": true,
    "instruments_and_calibration_recorded": true
  },
  "failure": {
    "investigation_open": false,
    "evidence_organized_into_timeline": true,
    "operating_history_included": true,
    "typical_failure_modes_considered": true
  },
  "trending": {
    "per_asset_baseline_exists": true,
    "like_for_like_comparison": true,
    "deltas_compared": true
  },
  "records": {
    "nameplate_and_serial_verified": true,
    "re_energized_after_insulation_or_winding_anomaly_without_review": false,
    "anomalies_flagged": true,
    "asset_records_updated": true,
    "deviations_logged_with_actions": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 38 checks and a text stamp of the verdict):

```json
{
  "service": "electrical-machinery-engineering-check",
  "atom_version": "0.1.0",
  "machine": "Motor-001",
  "verdict": "SOUND",
  "sections": {
    "duty": "pass",
    "sizing": "pass",
    "specification": "pass",
    "acceptance_tests": "pass",
    "failure_analysis": "pass",
    "trending": "pass",
    "records_and_safety": "pass"
  },
  "summary": "38 pass, 0 fail, 0 missing of 38 checks across seven sections."
}
```

## Verdicts

- **SOUND** — every check passes; all 38 checks across the seven sections.
- **NOT_SOUND** — at least one check fails; the failing checks name the section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
