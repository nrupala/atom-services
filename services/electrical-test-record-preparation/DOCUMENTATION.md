# Electrical test record preparation — full documentation

**Electrical test record preparation** · slug `electrical-test-record-preparation` · deliverable type: DELIVERABLE · atom version 0.1.0 · status: live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (Diátaxis architecture — tutorial / how-to / reference / explanation — in CommonMark, with role views per audience). All worked examples are real recorded trial runs, reproduced verbatim (see the provenance line under Worked examples).

## Tutorial — your first call, step by step

This tutorial walks through the recorded full-pass trial run for this atom — the same run reproduced verbatim under Worked examples. You submit one JSON manifest and receive one deliverable back.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "electrical-test-record-preparation"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the manifest.** The manifest names the asset under review (`asset: "TRANSFORMER-001"`) and declares the evidence the atom checks, field by field (the full typed field list is under Reference — Input reference). The manifest describes a complete test sheet for the asset (`record.*`: asset ID, date/time, ambient, load condition, instrument and calibration status, method reference, acceptance criteria, declared verdict, tester and reviewer — with no N/A fields and a non-critical test, so the N/A-reasons and reviewer-sign-off checks pass as not applicable), clean data hygiene (`hygiene.*`, raw data never overwritten), machine-readable format (`format.*`), one reading (`A1`, 10.5 V, inside its declared acceptance band [10.0, 11.0]), disciplined trending and plotting (`trending.*`, `plotting.*` — no dual axis, no out-of-band points), and retention (`retention.*` — archived, per policy, raw data never destroyed). The two computed checks confirm the reading is complete against its criteria and that the declared verdict `pass` matches what the readings imply, so the response reports `readings_evaluated: 1` and `readings_out_of_criteria: 0`.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/electrical-test-record-preparation` with the manifest as the JSON body and your `Authorization` header. The recorded call returned HTTP 200.

**Step 4 — Read the verdict.** The response `verdict` is `RECORD_READY` and every section — `template_completeness`, `data_hygiene`, `machine_readable_format`, `trending`, `plotting_discipline`, `retention_and_audit` — reports `pass`. The `summary` line reconciles the run: "41 pass, 0 fail, 0 missing of 41 checks across six sections." Each entry in `checks` names its section, the check, its status and the evidence standard it was judged against, and the response closes with a text `stamp` of the verdict you can file as-is.

**Step 5 — File or act on the result.** Keep the full JSON response (and its `stamp`) with the work it judges: it is the deliverable — one unit of sale = one delivered result. To see how the same atom responds when the evidence is not in order, compare the violations and malformed worked examples below before your first production call.

## How-to guides

### How to get a key and call via REST

1. `POST https://atoms.pipavia.com/v1/signup` with your email — a sign-in link is emailed to you.
2. Open the link (it mints your session), then `POST /v1/keys` with `{"atom": "electrical-test-record-preparation"}` to grant this atom's scope on your gateway key.
3. Call `POST https://atoms.pipavia.com/v1/electrical-test-record-preparation` with the manifest as the JSON body and header `Authorization: Bearer <key>`.
4. HTTP 200 returns the deliverable JSON (see Reference — Output format). Errors are HTTP 401 / 403 / 422 / 429 (see Reference — Errors). Rate limit: 60 requests/minute and 10,000 requests/day per key.

### How to call via MCP

Call `POST https://atoms.pipavia.com/mcp/electrical-test-record-preparation` and invoke the tool `electrical_test_record_preparation` (`tools/call`), passing the manifest object as the tool arguments, with the same `Authorization: Bearer <key>` header. The MCP face returns the same deliverable core as REST — the recorded verification battery confirmed face parity: the MCP `structuredContent` is deep-equal to the REST artifact for the full-pass case (see TEST-REPORT.md).

### How to read a failing verdict and fix the manifest

A failing verdict is `RECORD_NOT_READY`. Do not read the verdict alone — read the `checks` array:

1. Find every check with status `fail`. Its `section` tells you which part of the manifest to fix and its `evidence` states the standard it failed.
2. In the recorded violations run (Worked examples, example 2) the verdict was `RECORD_NOT_READY` and the failing checks were: `raw_data_never_overwritten` (section `data_hygiene`); `declared_verdict_matches_readings` (section `machine_readable_format`); `no_dual_axis_tricks` (section `plotting_discipline`).
3. Distinguish `fail` from `missing`: `fail` means you declared evidence and it does not satisfy the check — change the underlying facts or correct the declaration. `missing` means the field is absent — supply it. A response with only `missing` checks and no `fail` returns `INSUFFICIENT_EVIDENCE`, not the failing verdict.

Fix each failure at its source: stop overwriting raw data (`hygiene.raw_data_overwritten` must be `false` — keep raw data raw and add derived columns instead); correct the record so the declared verdict matches the readings — a reading of 50.0 V against criteria [10.0, 11.0] implies `fail`, so either the reading/criteria are corrected or `record.verdict_value` is declared `fail`; and remove the dual-axis chart (`plotting.dual_axis_used` must be `false`). Then resubmit — all 41 checks, including both computed checks, re-run deterministically.

### How to handle a 422 `invalid_input`

A type-violating manifest is rejected before any evaluation — HTTP 422, never a verdict. The recorded malformed run for this atom returned:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "asset",
  "detail": "asset must be a string"
}
```

Read `field` first: it names the first offending field (`asset`), and `detail` states the expected type ("asset must be a string"). Fix that field's type in your manifest and resubmit; if the manifest has more than one type violation, the gateway reports them one at a time, so repeat until the call returns HTTP 200. The full recorded malformed request and response are Worked examples, example 3.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/electrical-test-record-preparation` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/electrical-test-record-preparation` — tool name `electrical_test_record_preparation`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Gateway:** https://atoms.pipavia.com, gateway version 1.1.0 at the recorded verification run.

### Input reference

The caller submits one JSON manifest. Every field below is read by the named section's checks. All fields are booleans unless a type is noted. A field **absent** = evidence missing; a field present but false / invalid = the check fails. Types are from SERVICE.md's field table; the contract and the evidence `inputSchema` corroborate them.

| Field | Type | Read by | Notes |
|---|---|---|---|
| `asset` | string | — | string; carried into the verdict output, not itself checked |
| `record.asset_id_present` | boolean | template_completeness |  |
| `record.datetime_present` | boolean | template_completeness |  |
| `record.ambient_present` | boolean | template_completeness |  |
| `record.load_condition_present` | boolean | template_completeness |  |
| `record.instrument_named` | boolean | template_completeness | with `record.calibration_status_recorded`; both must be present and true |
| `record.calibration_status_recorded` | boolean | template_completeness | see above |
| `record.test_method_reference_present` | boolean | template_completeness |  |
| `record.acceptance_criteria_present` | boolean | template_completeness |  |
| `record.verdict_value` | string | template_completeness, machine_readable_format | string: `"pass"` or `"fail"`; also compared against the readings by the computed consistency check |
| `record.tester_named` | boolean | template_completeness |  |
| `record.reviewer_named` | boolean | template_completeness |  |
| `record.has_na_fields` | boolean | template_completeness | gates the reasons check below |
| `record.na_reasons_recorded` | boolean | template_completeness | required when an `N/A` field exists; otherwise the check passes as not applicable |
| `record.is_critical_test` | boolean | template_completeness | gates the sign-off check below |
| `record.reviewer_signoff_present` | boolean | template_completeness | required when the test is critical; otherwise the check passes as not applicable |
| `hygiene.asset_ids_consistent` | boolean | data_hygiene |  |
| `hygiene.si_units_used` | boolean | data_hygiene |  |
| `hygiene.conversions_noted` | boolean | data_hygiene |  |
| `hygiene.iso_timestamps` | boolean | data_hygiene |  |
| `hygiene.single_source_of_truth` | boolean | data_hygiene |  |
| `hygiene.raw_data_overwritten` | boolean | data_hygiene | must be `false` to pass |
| `hygiene.photos_attached_and_named` | boolean | data_hygiene |  |
| `format.single_header_row` | boolean | machine_readable_format |  |
| `format.tidy_long_format` | boolean | machine_readable_format |  |
| `format.required_columns_present` | boolean | machine_readable_format |  |
| `readings` | array | machine_readable_format | list of readings; absent / not a list / empty = both computed checks missing |
| `readings[].point` | string | machine_readable_format | non-empty string |
| `readings[].value` | number | machine_readable_format | number |
| `readings[].unit` | string | machine_readable_format | non-empty string |
| `readings[].acceptance_min` | number | machine_readable_format | number; must be ≤ `acceptance_max` |
| `readings[].acceptance_max` | number | machine_readable_format | number |
| `trending.same_point_method_instrument_class` | boolean | trending |  |
| `trending.plotted_vs_time` | boolean | trending |  |
| `trending.load_varies` | boolean | trending | gates the vs-load check below |
| `trending.plotted_vs_load` | boolean | trending | required when load varies; otherwise the check passes as not applicable |
| `trending.repair_events_annotated` | boolean | trending |  |
| `trending.control_bands_from_limits_or_baseline` | boolean | trending |  |
| `trending.trends_updated_on_cadence` | boolean | trending |  |
| `trending.anomalies_present` | boolean | trending | gates the flagged check below |
| `trending.anomalies_flagged_with_action` | boolean | trending | required when anomalies are present; otherwise the check passes as not applicable |
| `plotting.axes_labeled_with_units` | boolean | plotting_discipline |  |
| `plotting.version_and_date_on_charts` | boolean | plotting_discipline |  |
| `plotting.dual_axis_used` | boolean | plotting_discipline | must be `false` to pass |
| `plotting.out_of_band_points_present` | boolean | plotting_discipline | gates the highlighted check below |
| `plotting.out_of_band_highlighted` | boolean | plotting_discipline | required when out-of-band points exist; otherwise the check passes as not applicable |
| `plotting.summary_sheet_per_asset` | boolean | plotting_discipline |  |
| `retention.archived_and_findable` | boolean | retention_and_audit |  |
| `retention.retention_per_policy` | boolean | retention_and_audit |  |
| `retention.superseded_revisions_exist` | boolean | retention_and_audit | gates the retained check below |
| `retention.superseded_retained_marked` | boolean | retention_and_audit | required when superseded revisions exist; otherwise the check passes as not applicable |
| `retention.corrections_made` | boolean | retention_and_audit | gates the revision-notes check below |
| `retention.correction_revision_notes_present` | boolean | retention_and_audit | required when corrections were made; otherwise the check passes as not applicable |
| `retention.raw_data_destroyed` | boolean | retention_and_audit | must be `false` to pass |

### Checks

The recorded full-pass REST response carries 41 checks. Every check is named below with its section and what it requires to pass (the `evidence` standard recorded in the response). Cross-checked against SERVICE.md: every recorded check corresponds to a SERVICE.md field or a computed comparison named there; gated fields in SERVICE.md fold into a single conditional check (see the semantics note).

#### Section `template_completeness`

| Check | Requires to pass |
|---|---|
| `asset_id_recorded` | test sheet field: asset ID |
| `datetime_recorded` | test sheet field: date/time |
| `ambient_recorded` | test sheet field: ambient |
| `load_condition_recorded` | test sheet field: load/condition |
| `instrument_and_calibration_recorded` | test sheet field: instrument + calibration status |
| `test_method_reference_recorded` | test sheet field: test method reference |
| `acceptance_criteria_recorded` | test sheet field: acceptance criteria |
| `verdict_recorded` | test sheet field: verdict (pass/fail) against the acceptance criteria |
| `tester_named` | test sheet field: tester |
| `reviewer_named` | test sheet field: reviewer |
| `na_fields_have_reasons` | no 'N/A' fields declared |
| `reviewer_signoff_on_critical_tests` | not a critical test — reviewer sign-off not required |
#### Section `data_hygiene`

| Check | Requires to pass |
|---|---|
| `asset_ids_consistent` | consistent asset IDs |
| `si_units_used` | SI units — no unit soup |
| `conversions_noted` | SI units with conversions noted |
| `iso_timestamps_used` | ISO timestamps |
| `single_source_of_truth` | one source of truth (file/DB) |
| `raw_data_never_overwritten` | raw data stays RAW (never overwrite — add derived columns) |
| `photos_attached_and_named` | photos attached and named |
#### Section `machine_readable_format`

| Check | Requires to pass |
|---|---|
| `single_header_row` | machine-readable first: one header row |
| `tidy_long_format` | tidy/long format (asset, date, point, value, unit, load) |
| `required_columns_present` | tidy columns present: asset, date, point, value, unit, load |
| `readings_complete_against_criteria` | every reading carries a point, a value with units, and its acceptance criteria |
| `declared_verdict_matches_readings` | the declared verdict matches the readings against their acceptance criteria (any reading outside its limits means the test verdict is fail) |
#### Section `trending`

| Check | Requires to pass |
|---|---|
| `same_point_method_and_instrument_class` | trending: same point + method + instrument class across time |
| `plotted_vs_time` | plot vs time |
| `plotted_vs_load_when_load_varies` | load does not vary — a vs-load plot is not required |
| `repair_events_annotated` | annotate repairs/changes on charts |
| `control_bands_from_limits_or_baseline` | control bands from limits or baseline |
| `trends_updated_on_cadence` | quality gate: trends updated on cadence |
| `anomalies_flagged_with_action` | no anomalies declared |
#### Section `plotting_discipline`

| Check | Requires to pass |
|---|---|
| `axes_labeled_with_units` | labeled axes with units |
| `version_and_date_on_every_chart` | version + date on every chart |
| `no_dual_axis_tricks` | no dual-axis tricks to tell a story |
| `out_of_band_points_highlighted` | no out-of-band points declared |
| `summary_sheet_per_asset` | summary sheet per asset (latest values + verdict) |
#### Section `retention_and_audit`

| Check | Requires to pass |
|---|---|
| `archived_and_findable` | archived, findable in 60 seconds |
| `retention_per_policy` | retention per policy |
| `superseded_revisions_retained_marked` | no superseded revisions declared |
| `corrections_have_dated_revision_notes` | no corrections declared |
| `raw_data_never_destroyed` | red line: never destroy raw data |

**Per-check status semantics** (recorded across the battery): `pass` — the declared evidence satisfies the check; `fail` — evidence was declared and does not satisfy the check (present-but-false, a violated must-be-`false` constraint, an out-of-enum value, or a failed computed comparison); `missing` — the field is absent, so there is no evidence to judge. There is **no separate not-applicable status in the recorded responses**: a gated (conditional) check whose gate does not apply is recorded as `pass`, with its `evidence` text stating why it does not apply (the exact wording is in each response's checks). Section statuses aggregate the same way: `pass`, `fail`, or `insufficient_evidence`.

### Output format

HTTP 200 JSON with keys: `service`, `atom_version`, `asset`, `verdict`, `sections`, `checks`, `readings_evaluated`, `readings_out_of_criteria`, `summary`, `stamp`. `service` and `atom_version` identify the atom; the manifest's subject is carried through; `sections` maps each section to its status; `checks` is the per-check array (`section`, `check`, `status`, `evidence`); `summary` reconciles the counts in one line; `stamp` is a text rendering of the verdict. The recorded full-pass response is reproduced in full under Worked examples.

The response additionally carries `readings_evaluated` and `readings_out_of_criteria` — the counts behind the two computed readings checks.

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `RECORD_READY` (verdict) | all 41 checks pass |
| `RECORD_NOT_READY` (verdict) | any check fails |
| `INSUFFICIENT_EVIDENCE` (verdict) | nothing fails but evidence is missing |
| `pass` / `fail` / `insufficient_evidence` (section status) | the section's checks all pass / at least one fails / none fail but at least one is missing |
| `pass` / `fail` / `missing` (per-check status) | evidence satisfies the check / declared evidence does not satisfy it / field absent — no evidence to judge (gated checks that do not apply record as `pass`) |
| `"pass"` / `"fail"` (`record.verdict_value`) | the sheet's declared verdict, compared by the computed consistency check against the verdict the readings imply |

### Errors

Only the shapes evidenced in the repo / gateway docs are documented here — no payload is invented. The 422 shape is recorded verbatim in the verification battery; the 401 / 403 / 429 codes and meanings are from USER-GUIDE.md (no response payload for them is recorded in the evidence battery).

| HTTP | Error | Shape / meaning |
|---|---|---|
| 401 | unauthenticated | missing or invalid key — send `Authorization: Bearer <key>` with a valid gateway key |
| 403 | scope | the key lacks this atom's scope — issue the key for this atom (`POST /v1/keys` with this atom's slug) |
| 422 | `invalid_input` | recorded shape: `{"ok": false, "error": "invalid_input", "field": "asset", "detail": "asset must be a string"}` — `field` names the first offending field, `detail` states the expected type; returned before any evaluation, never as a verdict |
| 429 | rate limit | per-key rate limit exceeded (60/minute, 10,000/day) — back off and retry within the limit |

### Rate limits + pricing status

- **Rate limits (contract.yaml):** 60 requests/minute per key; 10,000 requests/day per key.
- **Pricing:** pricing unit is the deliverable; `pricing.rate` is `null` (rate status: pending — prices are set only from measured production cost per unit). **Free during trial — rate pending.**
- **Support:** info@pipavia.com

## Explanation — what this atom does, and how the verdict is decided

Two of the 41 checks are computed, not declared: every reading is checked for completeness against its declared acceptance limits (point, value, unit, `acceptance_min` ≤ `acceptance_max`), and the sheet's declared verdict (`record.verdict_value`) is compared with the verdict the readings imply — any reading outside its limits means the test verdict is `fail`, whatever the sheet declares. The response counts `readings_evaluated` and `readings_out_of_criteria` so the computation is auditable. The gated checks (N/A reasons, critical-test sign-off, vs-load plotting, anomaly flagging, out-of-band highlighting, superseded-revision retention, correction notes) are required only when their gate declares the situation exists, otherwise passing as not applicable (recorded as `pass`). No acceptance threshold is invented by the atom — the limits are the caller's declared criteria, exactly as the template requires them on the sheet.

**How the verdict is decided (deterministic core).** The atom is a deterministic evaluator over the manifest: same manifest in → same verdict out (the recorded battery confirmed byte-identical repeat responses and REST/MCP parity). Each field feeds its section's checks. The semantics are three-valued and the distinction matters: a field **absent** marks its check `missing` — missing evidence; a field **present but false / invalid** marks its check `fail` — the evidence was offered and does not satisfy the check. The verdict aggregates strictly: any `fail` → `RECORD_NOT_READY`; otherwise any `missing` → `INSUFFICIENT_EVIDENCE`; otherwise (every check `pass`) → `RECORD_READY`. Must-be-`false` fields invert the boolean reading: declaring them `true` is a `fail`. Conditional (gated) checks are required only when their gate field declares the situation exists; otherwise they record as `pass` (there is no separate not-applicable status in the recorded responses).

**What it does NOT do.**

- It does not perform the electrical test, read the instrument, or verify that the underlying raw data is authentic — it prepares and judges the record you declare, plus the two computed consistency checks over the declared readings.
- It invents no acceptance criteria: a record whose declared limits are wrong can still be `RECORD_READY` if it is complete and internally consistent against those limits.
- It sells the prepared, judged record — the bounded judgment artifact — never the underlying test-records knowledge itself.

**Buyer / use context.** First buyer hypothesis: teams and agents working in Electrical & energy who need an audit-surviving test record prepared on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). House self-use (internal caller, zero price, metered to the internal cost ledger): **EE test record preparation**. One unit of sale = one delivered result.

## Role views

### For integrators (Users)

Integrate with two calls: `POST https://atoms.pipavia.com/v1/electrical-test-record-preparation` (REST) or the MCP tool `electrical_test_record_preparation` at `POST https://atoms.pipavia.com/mcp/electrical-test-record-preparation`. Authenticate with `Authorization: Bearer <key>` (key flow: How-to guides). Treat HTTP 200 as the deliverable, HTTP 422 as a client bug to fix by field name, HTTP 401/403 as key/scope problems, and HTTP 429 as back-off. Persist the full response — including `summary` and `stamp` — as the record of the judgment; re-calling with the same manifest returns the identical result, so retries are safe. Stay within 60 requests/minute and 10,000/day per key.

### For developers

Manifest authoring: build the manifest field-by-field from Reference — Input reference; respect the must-be-`false` constraints and the gated conditionals, because both invert naive boolean intuition. Determinism: the evaluator is a pure function of the manifest — no clocks, no randomness, no external lookups — so golden-file testing against the worked examples below is exact. Implementation pointers (contract.yaml): src/electrical_test_record_preparation.py — `evaluate(manifest)` -> verdict dict; CLI prints JSON + stamp; tests: tests/test_electrical_test_record_preparation.py — 19 tests, all passing 2026-11-15. The atom is bound to the `electrical-test-records` skill (R1: fixes land in the skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps).

### For ops

Endpoints: REST `POST /v1/electrical-test-record-preparation` and MCP `POST /mcp/electrical-test-record-preparation` on https://atoms.pipavia.com (gateway v1.1.0 at last verification). Key scope: per user, per atom — a key for one atom never verifies for another; scope failures surface as HTTP 403, missing/invalid keys as 401. Rate limits: 60/min and 10,000/day per key (HTTP 429 on breach). Error monitoring: alert on 422 spikes (client manifest drift), 403 (scope mis-issuance) and any 5xx (no 5xx shape is documented — none is evidenced). Status: live — release candidate, one-week RC soak to 2026-11-22; pricing rate pending, free during trial, so metering is cost-ledger only.

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:56:30.661945+00:00 against gateway v1.1.0, external verification lane, source `verification/work/electrical-test-record-preparation/evidence.json`. Inputs are the recorded case inputs; responses are the recorded REST executions' responses, reproduced verbatim (pretty-printed, indent 2). The sparse case from the same battery (result `INSUFFICIENT_EVIDENCE` on minimal input) is recorded in TEST-REPORT.md and the same evidence file.

### Example 1 — full-pass (HTTP 200)

Input:

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

Response:

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
  "checks": [
    {
      "section": "template_completeness",
      "check": "asset_id_recorded",
      "status": "pass",
      "evidence": "test sheet field: asset ID"
    },
    {
      "section": "template_completeness",
      "check": "datetime_recorded",
      "status": "pass",
      "evidence": "test sheet field: date/time"
    },
    {
      "section": "template_completeness",
      "check": "ambient_recorded",
      "status": "pass",
      "evidence": "test sheet field: ambient"
    },
    {
      "section": "template_completeness",
      "check": "load_condition_recorded",
      "status": "pass",
      "evidence": "test sheet field: load/condition"
    },
    {
      "section": "template_completeness",
      "check": "instrument_and_calibration_recorded",
      "status": "pass",
      "evidence": "test sheet field: instrument + calibration status"
    },
    {
      "section": "template_completeness",
      "check": "test_method_reference_recorded",
      "status": "pass",
      "evidence": "test sheet field: test method reference"
    },
    {
      "section": "template_completeness",
      "check": "acceptance_criteria_recorded",
      "status": "pass",
      "evidence": "test sheet field: acceptance criteria"
    },
    {
      "section": "template_completeness",
      "check": "verdict_recorded",
      "status": "pass",
      "evidence": "test sheet field: verdict (pass/fail) against the acceptance criteria"
    },
    {
      "section": "template_completeness",
      "check": "tester_named",
      "status": "pass",
      "evidence": "test sheet field: tester"
    },
    {
      "section": "template_completeness",
      "check": "reviewer_named",
      "status": "pass",
      "evidence": "test sheet field: reviewer"
    },
    {
      "section": "template_completeness",
      "check": "na_fields_have_reasons",
      "status": "pass",
      "evidence": "no 'N/A' fields declared"
    },
    {
      "section": "template_completeness",
      "check": "reviewer_signoff_on_critical_tests",
      "status": "pass",
      "evidence": "not a critical test — reviewer sign-off not required"
    },
    {
      "section": "data_hygiene",
      "check": "asset_ids_consistent",
      "status": "pass",
      "evidence": "consistent asset IDs"
    },
    {
      "section": "data_hygiene",
      "check": "si_units_used",
      "status": "pass",
      "evidence": "SI units — no unit soup"
    },
    {
      "section": "data_hygiene",
      "check": "conversions_noted",
      "status": "pass",
      "evidence": "SI units with conversions noted"
    },
    {
      "section": "data_hygiene",
      "check": "iso_timestamps_used",
      "status": "pass",
      "evidence": "ISO timestamps"
    },
    {
      "section": "data_hygiene",
      "check": "single_source_of_truth",
      "status": "pass",
      "evidence": "one source of truth (file/DB)"
    },
    {
      "section": "data_hygiene",
      "check": "raw_data_never_overwritten",
      "status": "pass",
      "evidence": "raw data stays RAW (never overwrite — add derived columns)"
    },
    {
      "section": "data_hygiene",
      "check": "photos_attached_and_named",
      "status": "pass",
      "evidence": "photos attached and named"
    },
    {
      "section": "machine_readable_format",
      "check": "single_header_row",
      "status": "pass",
      "evidence": "machine-readable first: one header row"
    },
    {
      "section": "machine_readable_format",
      "check": "tidy_long_format",
      "status": "pass",
      "evidence": "tidy/long format (asset, date, point, value, unit, load)"
    },
    {
      "section": "machine_readable_format",
      "check": "required_columns_present",
      "status": "pass",
      "evidence": "tidy columns present: asset, date, point, value, unit, load"
    },
    {
      "section": "machine_readable_format",
      "check": "readings_complete_against_criteria",
      "status": "pass",
      "evidence": "every reading carries a point, a value with units, and its acceptance criteria"
    },
    {
      "section": "machine_readable_format",
      "check": "declared_verdict_matches_readings",
      "status": "pass",
      "evidence": "the declared verdict matches the readings against their acceptance criteria (any reading outside its limits means the test verdict is fail)"
    },
    {
      "section": "trending",
      "check": "same_point_method_and_instrument_class",
      "status": "pass",
      "evidence": "trending: same point + method + instrument class across time"
    },
    {
      "section": "trending",
      "check": "plotted_vs_time",
      "status": "pass",
      "evidence": "plot vs time"
    },
    {
      "section": "trending",
      "check": "plotted_vs_load_when_load_varies",
      "status": "pass",
      "evidence": "load does not vary — a vs-load plot is not required"
    },
    {
      "section": "trending",
      "check": "repair_events_annotated",
      "status": "pass",
      "evidence": "annotate repairs/changes on charts"
    },
    {
      "section": "trending",
      "check": "control_bands_from_limits_or_baseline",
      "status": "pass",
      "evidence": "control bands from limits or baseline"
    },
    {
      "section": "trending",
      "check": "trends_updated_on_cadence",
      "status": "pass",
      "evidence": "quality gate: trends updated on cadence"
    },
    {
      "section": "trending",
      "check": "anomalies_flagged_with_action",
      "status": "pass",
      "evidence": "no anomalies declared"
    },
    {
      "section": "plotting_discipline",
      "check": "axes_labeled_with_units",
      "status": "pass",
      "evidence": "labeled axes with units"
    },
    {
      "section": "plotting_discipline",
      "check": "version_and_date_on_every_chart",
      "status": "pass",
      "evidence": "version + date on every chart"
    },
    {
      "section": "plotting_discipline",
      "check": "no_dual_axis_tricks",
      "status": "pass",
      "evidence": "no dual-axis tricks to tell a story"
    },
    {
      "section": "plotting_discipline",
      "check": "out_of_band_points_highlighted",
      "status": "pass",
      "evidence": "no out-of-band points declared"
    },
    {
      "section": "plotting_discipline",
      "check": "summary_sheet_per_asset",
      "status": "pass",
      "evidence": "summary sheet per asset (latest values + verdict)"
    },
    {
      "section": "retention_and_audit",
      "check": "archived_and_findable",
      "status": "pass",
      "evidence": "archived, findable in 60 seconds"
    },
    {
      "section": "retention_and_audit",
      "check": "retention_per_policy",
      "status": "pass",
      "evidence": "retention per policy"
    },
    {
      "section": "retention_and_audit",
      "check": "superseded_revisions_retained_marked",
      "status": "pass",
      "evidence": "no superseded revisions declared"
    },
    {
      "section": "retention_and_audit",
      "check": "corrections_have_dated_revision_notes",
      "status": "pass",
      "evidence": "no corrections declared"
    },
    {
      "section": "retention_and_audit",
      "check": "raw_data_never_destroyed",
      "status": "pass",
      "evidence": "red line: never destroy raw data"
    }
  ],
  "readings_evaluated": 1,
  "readings_out_of_criteria": 0,
  "summary": "41 pass, 0 fail, 0 missing of 41 checks across six sections.",
  "stamp": "ELECTRICAL TEST RECORD PREPARATION\nasset: TRANSFORMER-001\nVERDICT: RECORD_READY\n  template_completeness    pass\n  data_hygiene             pass\n  machine_readable_format  pass\n  trending                 pass\n  plotting_discipline      pass\n  retention_and_audit      pass\n41 pass, 0 fail, 0 missing of 41 checks across six sections."
}
```

### Example 2 — violations (HTTP 200)

Input:

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
    "raw_data_overwritten": true,
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
      "value": 50.0,
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
    "dual_axis_used": true,
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

Response:

```json
{
  "service": "electrical-test-record-preparation",
  "atom_version": "0.1.0",
  "asset": "TRANSFORMER-001",
  "verdict": "RECORD_NOT_READY",
  "sections": {
    "template_completeness": "pass",
    "data_hygiene": "fail",
    "machine_readable_format": "fail",
    "trending": "pass",
    "plotting_discipline": "fail",
    "retention_and_audit": "pass"
  },
  "checks": [
    {
      "section": "template_completeness",
      "check": "asset_id_recorded",
      "status": "pass",
      "evidence": "test sheet field: asset ID"
    },
    {
      "section": "template_completeness",
      "check": "datetime_recorded",
      "status": "pass",
      "evidence": "test sheet field: date/time"
    },
    {
      "section": "template_completeness",
      "check": "ambient_recorded",
      "status": "pass",
      "evidence": "test sheet field: ambient"
    },
    {
      "section": "template_completeness",
      "check": "load_condition_recorded",
      "status": "pass",
      "evidence": "test sheet field: load/condition"
    },
    {
      "section": "template_completeness",
      "check": "instrument_and_calibration_recorded",
      "status": "pass",
      "evidence": "test sheet field: instrument + calibration status"
    },
    {
      "section": "template_completeness",
      "check": "test_method_reference_recorded",
      "status": "pass",
      "evidence": "test sheet field: test method reference"
    },
    {
      "section": "template_completeness",
      "check": "acceptance_criteria_recorded",
      "status": "pass",
      "evidence": "test sheet field: acceptance criteria"
    },
    {
      "section": "template_completeness",
      "check": "verdict_recorded",
      "status": "pass",
      "evidence": "test sheet field: verdict (pass/fail) against the acceptance criteria"
    },
    {
      "section": "template_completeness",
      "check": "tester_named",
      "status": "pass",
      "evidence": "test sheet field: tester"
    },
    {
      "section": "template_completeness",
      "check": "reviewer_named",
      "status": "pass",
      "evidence": "test sheet field: reviewer"
    },
    {
      "section": "template_completeness",
      "check": "na_fields_have_reasons",
      "status": "pass",
      "evidence": "no 'N/A' fields declared"
    },
    {
      "section": "template_completeness",
      "check": "reviewer_signoff_on_critical_tests",
      "status": "pass",
      "evidence": "not a critical test — reviewer sign-off not required"
    },
    {
      "section": "data_hygiene",
      "check": "asset_ids_consistent",
      "status": "pass",
      "evidence": "consistent asset IDs"
    },
    {
      "section": "data_hygiene",
      "check": "si_units_used",
      "status": "pass",
      "evidence": "SI units — no unit soup"
    },
    {
      "section": "data_hygiene",
      "check": "conversions_noted",
      "status": "pass",
      "evidence": "SI units with conversions noted"
    },
    {
      "section": "data_hygiene",
      "check": "iso_timestamps_used",
      "status": "pass",
      "evidence": "ISO timestamps"
    },
    {
      "section": "data_hygiene",
      "check": "single_source_of_truth",
      "status": "pass",
      "evidence": "one source of truth (file/DB)"
    },
    {
      "section": "data_hygiene",
      "check": "raw_data_never_overwritten",
      "status": "fail",
      "evidence": "raw data stays RAW (never overwrite — add derived columns)"
    },
    {
      "section": "data_hygiene",
      "check": "photos_attached_and_named",
      "status": "pass",
      "evidence": "photos attached and named"
    },
    {
      "section": "machine_readable_format",
      "check": "single_header_row",
      "status": "pass",
      "evidence": "machine-readable first: one header row"
    },
    {
      "section": "machine_readable_format",
      "check": "tidy_long_format",
      "status": "pass",
      "evidence": "tidy/long format (asset, date, point, value, unit, load)"
    },
    {
      "section": "machine_readable_format",
      "check": "required_columns_present",
      "status": "pass",
      "evidence": "tidy columns present: asset, date, point, value, unit, load"
    },
    {
      "section": "machine_readable_format",
      "check": "readings_complete_against_criteria",
      "status": "pass",
      "evidence": "every reading carries a point, a value with units, and its acceptance criteria"
    },
    {
      "section": "machine_readable_format",
      "check": "declared_verdict_matches_readings",
      "status": "fail",
      "evidence": "the declared verdict matches the readings against their acceptance criteria (any reading outside its limits means the test verdict is fail)"
    },
    {
      "section": "trending",
      "check": "same_point_method_and_instrument_class",
      "status": "pass",
      "evidence": "trending: same point + method + instrument class across time"
    },
    {
      "section": "trending",
      "check": "plotted_vs_time",
      "status": "pass",
      "evidence": "plot vs time"
    },
    {
      "section": "trending",
      "check": "plotted_vs_load_when_load_varies",
      "status": "pass",
      "evidence": "load does not vary — a vs-load plot is not required"
    },
    {
      "section": "trending",
      "check": "repair_events_annotated",
      "status": "pass",
      "evidence": "annotate repairs/changes on charts"
    },
    {
      "section": "trending",
      "check": "control_bands_from_limits_or_baseline",
      "status": "pass",
      "evidence": "control bands from limits or baseline"
    },
    {
      "section": "trending",
      "check": "trends_updated_on_cadence",
      "status": "pass",
      "evidence": "quality gate: trends updated on cadence"
    },
    {
      "section": "trending",
      "check": "anomalies_flagged_with_action",
      "status": "pass",
      "evidence": "no anomalies declared"
    },
    {
      "section": "plotting_discipline",
      "check": "axes_labeled_with_units",
      "status": "pass",
      "evidence": "labeled axes with units"
    },
    {
      "section": "plotting_discipline",
      "check": "version_and_date_on_every_chart",
      "status": "pass",
      "evidence": "version + date on every chart"
    },
    {
      "section": "plotting_discipline",
      "check": "no_dual_axis_tricks",
      "status": "fail",
      "evidence": "no dual-axis tricks to tell a story"
    },
    {
      "section": "plotting_discipline",
      "check": "out_of_band_points_highlighted",
      "status": "pass",
      "evidence": "no out-of-band points declared"
    },
    {
      "section": "plotting_discipline",
      "check": "summary_sheet_per_asset",
      "status": "pass",
      "evidence": "summary sheet per asset (latest values + verdict)"
    },
    {
      "section": "retention_and_audit",
      "check": "archived_and_findable",
      "status": "pass",
      "evidence": "archived, findable in 60 seconds"
    },
    {
      "section": "retention_and_audit",
      "check": "retention_per_policy",
      "status": "pass",
      "evidence": "retention per policy"
    },
    {
      "section": "retention_and_audit",
      "check": "superseded_revisions_retained_marked",
      "status": "pass",
      "evidence": "no superseded revisions declared"
    },
    {
      "section": "retention_and_audit",
      "check": "corrections_have_dated_revision_notes",
      "status": "pass",
      "evidence": "no corrections declared"
    },
    {
      "section": "retention_and_audit",
      "check": "raw_data_never_destroyed",
      "status": "pass",
      "evidence": "red line: never destroy raw data"
    }
  ],
  "readings_evaluated": 1,
  "readings_out_of_criteria": 1,
  "summary": "38 pass, 3 fail, 0 missing of 41 checks across six sections.",
  "stamp": "ELECTRICAL TEST RECORD PREPARATION\nasset: TRANSFORMER-001\nVERDICT: RECORD_NOT_READY\n  template_completeness    pass\n  data_hygiene             fail\n  machine_readable_format  fail\n  trending                 pass\n  plotting_discipline      fail\n  retention_and_audit      pass\n38 pass, 3 fail, 0 missing of 41 checks across six sections."
}
```

### Example 3 — malformed (HTTP 422)

Input:

```json
{
  "asset": 12345,
  "record": "not-an-object"
}
```

Response:

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
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — all four sections above |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes · Developers Yes · Ops Yes · Regulators N/A — record-readiness preparation that supports audits, but the verdict itself is not regulatory compliance evidence and no regulated-domain (finance, security, licensing, privacy) determination is made |
| Checks named vs recorded | 41 / 41 (recorded full-pass REST response) |
| Verdict vocabulary complete | Yes — `RECORD_READY`, `RECORD_NOT_READY`, `INSUFFICIENT_EVIDENCE`; section + per-check statuses; declared-verdict values `"pass"` / `"fail"` — complete |
| Input reference typed | Yes — 54 fields with types (SERVICE.md field table) |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses parsed and compared as JSON values against `verification/work/electrical-test-record-preparation/evidence.json` |

