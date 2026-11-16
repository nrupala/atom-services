# Electrical test record preparation — user guide

## What it does

You are preparing an electrical test record that has to survive an
audit. This atom reads a manifest describing the test sheet — template
completeness, data hygiene, machine-readable format, the readings
themselves (two checks are computed: every reading is checked against
its declared acceptance limits, and the sheet's declared verdict is
compared with the verdict the readings imply), trending, plotting
discipline, and retention and audit — across six sections
(template_completeness, data_hygiene, machine_readable_format,
trending, plotting_discipline, retention_and_audit). The verdict is
**RECORD_READY**, **RECORD_NOT_READY**, or **INSUFFICIENT_EVIDENCE**,
and the output reports `readings_evaluated` and
`readings_out_of_criteria`. No acceptance threshold is invented — the
limits are your declared criteria. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "electrical-test-record-preparation"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/electrical-test-record-preparation`
  — tool name `electrical_test_record_preparation`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/electrical-test-record-preparation`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `asset` (string) | the asset under test (carried into the output) |
| `record.asset_id_present`, `record.datetime_present`, `record.ambient_present`, `record.load_condition_present`, `record.instrument_named`, `record.calibration_status_recorded`, `record.test_method_reference_present`, `record.acceptance_criteria_present`, `record.verdict_value` (`"pass"`/`"fail"`), `record.tester_named`, `record.reviewer_named`, `record.has_na_fields`, `record.na_reasons_recorded`, `record.is_critical_test`, `record.reviewer_signoff_present` | the test-sheet template is complete; N/A reasons are required when N/A fields exist and reviewer sign-off when the test is critical (otherwise not applicable) |
| `hygiene.asset_ids_consistent`, `hygiene.si_units_used`, `hygiene.conversions_noted`, `hygiene.iso_timestamps`, `hygiene.single_source_of_truth`, `hygiene.raw_data_overwritten` (must be `false`), `hygiene.photos_attached_and_named` | data hygiene |
| `format.single_header_row`, `format.tidy_long_format`, `format.required_columns_present` | machine-readable format |
| `readings[]` | list of readings `{point, value, unit, acceptance_min, acceptance_max}` — checked for completeness against the declared limits |
| `trending.same_point_method_instrument_class`, `trending.plotted_vs_time`, `trending.load_varies`, `trending.plotted_vs_load`, `trending.repair_events_annotated`, `trending.control_bands_from_limits_or_baseline`, `trending.trends_updated_on_cadence`, `trending.anomalies_present`, `trending.anomalies_flagged_with_action` | trending; vs-load plotting required when load varies and anomaly flagging when anomalies are present (otherwise not applicable) |
| `plotting.axes_labeled_with_units`, `plotting.version_and_date_on_charts`, `plotting.dual_axis_used` (must be `false`), `plotting.out_of_band_points_present`, `plotting.out_of_band_highlighted`, `plotting.summary_sheet_per_asset` | plotting discipline; highlighting required when out-of-band points exist (otherwise not applicable) |
| `retention.archived_and_findable`, `retention.retention_per_policy`, `retention.superseded_revisions_exist`, `retention.superseded_retained_marked`, `retention.corrections_made`, `retention.correction_revision_notes_present`, `retention.raw_data_destroyed` (must be `false`) | retention and audit; retained-marking and revision notes are required when superseded revisions or corrections exist (otherwise not applicable) |

All fields are booleans unless noted. A field **absent** = evidence
missing (counts toward INSUFFICIENT_EVIDENCE). A field present but
false/invalid = the check fails (counts toward RECORD_NOT_READY).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/electrical-test-record-preparation`:

```json
{
  "asset": "TRANSFORMER-001",
  "record": {
    "asset_id_present": true,
    "datetime_present": true,
    "ambient_present": true,
    "load_condition_present": true,
    "instrument_named": true,
    "calibration_status_recorded": true,
    "test_method_reference_present": true,
    "acceptance_criteria_present": true,
    "verdict_value": "pass",
    "tester_named": true,
    "reviewer_named": true,
    "has_na_fields": false,
    "is_critical_test": false
  },
  "hygiene": {
    "asset_ids_consistent": true,
    "si_units_used": true,
    "conversions_noted": true,
    "iso_timestamps": true,
    "single_source_of_truth": true,
    "raw_data_overwritten": false,
    "photos_attached_and_named": true
  },
  "format": {
    "single_header_row": true,
    "tidy_long_format": true,
    "required_columns_present": true
  },
  "readings": [
    {
      "point": "A1",
      "value": 10.5,
      "unit": "V",
      "acceptance_min": 10.0,
      "acceptance_max": 11.0
    }
  ],
  "trending": {
    "same_point_method_instrument_class": true,
    "plotted_vs_time": true,
    "load_varies": false,
    "repair_events_annotated": true,
    "control_bands_from_limits_or_baseline": true,
    "trends_updated_on_cadence": true,
    "anomalies_present": false
  },
  "plotting": {
    "axes_labeled_with_units": true,
    "version_and_date_on_charts": true,
    "dual_axis_used": false,
    "out_of_band_points_present": false,
    "summary_sheet_per_asset": true
  },
  "retention": {
    "archived_and_findable": true,
    "retention_per_policy": true,
    "superseded_revisions_exist": false,
    "corrections_made": false,
    "raw_data_destroyed": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 41 checks and a text stamp of the verdict):

```json
{
  "service": "electrical-test-record-preparation",
  "atom_version": "0.1.0",
  "asset": "TRANSFORMER-001",
  "verdict": "RECORD_READY",
  "sections": {
    "template_completeness": "pass",
    "data_hygiene": "pass",
    "machine_readable_format": "pass",
    "trending": "pass",
    "plotting_discipline": "pass",
    "retention_and_audit": "pass"
  },
  "readings_evaluated": 1,
  "readings_out_of_criteria": 0,
  "summary": "41 pass, 0 fail, 0 missing of 41 checks across six sections."
}
```

## Verdicts

- **RECORD_READY** — every check passes; all 41 checks across the six sections.
- **RECORD_NOT_READY** — at least one check fails; the failing checks name the section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
