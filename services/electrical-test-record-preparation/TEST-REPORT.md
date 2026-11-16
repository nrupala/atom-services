# Test report — electrical-test-record-preparation

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw.
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/electrical-test-record-preparation/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete test-record manifest, one reading 10.5 V inside criteria [10.0, 11.0] | HTTP 200, verdict `RECORD_READY`, 41/41 checks pass, readings_out_of_criteria=0 | HTTP 200, `RECORD_READY`, "41 pass, 0 fail, 0 missing of 41 checks across six sections", readings_evaluated=1, readings_out_of_criteria=0, stamp present and well-formed | PASS |
| 2 | violations — `hygiene.raw_data_overwritten=true`, reading 50.0 V outside [10.0, 11.0] while declared verdict is `pass`, `plotting.dual_axis_used=true` | HTTP 200, verdict `RECORD_NOT_READY`, the hygiene, verdict-consistency and dual-axis checks fail | HTTP 200, `RECORD_NOT_READY`, exactly those 3 checks fail (38 pass, 3 fail, 0 missing), readings_out_of_criteria=1 | PASS |
| 3 | sparse — only `asset` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 41 missing | PASS |
| 4 | malformed — `asset: 12345`, `record: "not-an-object"` | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 41 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `electrical_test_record_preparation`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"electrical-test-record-preparation","atom_version":"0.1.0","asset":"TRANSFORMER-001","verdict":"RECORD_READY","sections":{"template_completeness":"pass","data_hygiene":"pass","machine_readable_format":"pass","trending":"pass","plotting_discipline":"pass","retention_and_audit":"pass"},"checks":[{"section":"template_completeness","check":"asset_id_recorded","status":"pass","evidence":"test sheet field: asset ID"},{"section":"template_completeness","check":"datetime_recorded","status":"pass","evidence":"test sheet field: date/time"},{"section":"template_completeness","check":"ambient_recorded","status":"pass","evidence":"test sheet field: ambient"},{"section":"template_completeness","check":"load_condition_recorded","status":"pass","evidence":"test sheet field: load/condition"},{"section":"template_completeness","check":"instrument_and_calibration_recorded","status":"pass","evidence":"test sheet field: instrument + calibration status"},{"section":"template_completeness","check":"test_method_reference_recorded","status":"pass","evidence":"test sheet field: test method reference"},{"section":"template_completeness","check":"acceptance_criteria_recorded","status":"pass","evidence":"test sheet field: acceptance criteria"},{"section":"template_completeness","check":"verdict_recorded","status":"pass","evidence":"test sheet field: verdict (pass/fail) against the acceptance criteria"},{"section":"template_completeness","check":"tester_named","status":"pass","evidence":"test sheet field: tester"},{"section":"template_completeness","check":"reviewer_named","status":"pass","evidence":"test sheet field: reviewer"},{"section":"template_completeness","check":"na_fields_have_reasons","status":"pass","evidence":"no 'N/A' fields declared"},{"section":"template_completeness","check":"reviewer_signoff_on_critical_tests","status":"pass","evidence":"not a critical test \u2014 reviewer sign-off not required"},{"section":"data_hygiene","check":"asset_ids_consistent","status":"pass","evidence":"consistent asset IDs"},{"section":"data_hygiene","check":"si_units_used","status":"pass","evidence":"SI units \u2014 no unit soup"},{"section":"data_hygiene","check":"conversions_noted","status":"pass","evidence":"SI units with conversions noted"},{"section":"data_hygiene","check":"iso_timestamps_used","status":"pass","evidence":"ISO timestamps"},{"section":"data_hygiene","check":"single_source_of_truth","status":"pass","evidence":"one source of truth (file/DB)"},{"section":"data_hygiene","check":"raw_data_never_overwritten","status":"pass","evidence":"raw data stays RAW (never overwrite \u2014 add derived columns)"},{"section":"data_hygiene","check":"photos_attached_and_named","status":"pass","evidence":"photos attached and named"},{"section":"machine_readable_format","check":"single_header_row","status":"pass","evidence":"machine-readable first: one header row"},{"section":"machine_readable_format","check":"tidy_long_format","status":"pass","evidence":"tidy/long format (asset, date, point, value, unit, load)"},{"section":"machine_readable_format","check":"required_columns_present","status":"pass","evidence":"tidy columns present: asset, date, point, value, unit, load"},{"section":"machine_readable_format","check":"readings_complete_against_criteria","status":"pass","evidence":"every reading carries a point, a value with units, and its acceptance criteria"},{"section":"machine_readable_format","check":"declared_verdict_matches_readings","status":"pass","evidence":"the declared verdict matches the readings against their acceptance criteria (any reading outside its limits means the test verdict is fail)"},{"section":"trending","check":"same_point_method_and_instrument_class","status":"pass","evidence":"trending: same point + method + instrument class across time"},{"section":"trending","check":"plotted_vs_time","status":"pass","evidence":"plot vs time"},{"section":"trending","check":"plotted_vs_load_when_load_varies","status":"pass","evidence":"load does not vary \u2014 a vs-load plot is not required"},{"section":"trending","check":"repair_events_annotated","status":"pass","evidence":"annotate repairs/changes on charts"},{"section":"trending","check":"control_bands_from_limits_or_baseline","status":"pass","evidence":"control bands from limits or baseline"},{"section":"trending","check":"trends_updated_on_cadence","status":"pass","evidence":"quality gate: trends updated on cadence"},{"section":"trending","check":"anomalies_flagged_with_action","status":"pass","evidence":"no anomalies declared"},{"section":"plotting_discipline","check":"axes_labeled_with_units","status":"pass","evidence":"labeled axes with units"},{"section":"plotting_discipline","check":"version_and_date_on_every_chart","status":"pass","evidence":"version + date on every chart"},{"section":"plotting_discipline","check":"no_dual_axis_tricks","status":"pass","evidence":"no dual-axis tricks to tell a story"},{"section":"plotting_discipline","check":"out_of_band_points_highlighted","status":"pass","evidence":"no out-of-band points declared"},{"section":"plotting_discipline","check":"summary_sheet_per_asset","status":"pass","evidence":"summary sheet per asset (latest values + verdict)"},{"section":"retention_and_audit","check":"archived_and_findable","status":"pass","evidence":"archived, findable in 60 seconds"},{"section":"retention_and_audit","check":"retention_per_policy","status":"pass","evidence":"retention per policy"},{"section":"retention_and_audit","check":"superseded_revisions_retained_marked","status":"pass","evidence":"no superseded revisions declared"},{"section":"retention_and_audit","check":"corrections_have_dated_revision_notes","status":"pass","evidence":"no corrections declared"},{"section":"retention_and_audit","check":"raw_data_never_destroyed","status":"pass","evidence":"red line: never destroy raw data"}],"readings_evaluated":1,"readings_out_of_criteria":0,"summary":"41 pass, 0 fail, 0 missing of 41 checks across six sections.","stamp":"ELECTRICAL TEST RECORD PREPARATION\nasset: TRANSFORMER-001\nVERDICT: RECORD_READY\n  template_completeness    pass\n  data_hygiene             pass\n  machine_readable_format  pass\n  trending                 pass\n  plotting_discipline      pass\n  retention_and_audit      pass\n41 pass, 0 fail, 0 missing of 41 checks across six sections."}
```

Malformed response (REST, HTTP 200 — the finding; `checks` array trimmed):

```json
{"service":"electrical-test-record-preparation","atom_version":"0.1.0","asset":12345,"verdict":"INSUFFICIENT_EVIDENCE","sections":{"template_completeness":"insufficient_evidence","data_hygiene":"insufficient_evidence","machine_readable_format":"insufficient_evidence","trending":"insufficient_evidence","plotting_discipline":"insufficient_evidence","retention_and_audit":"insufficient_evidence"},"readings_evaluated":0,"readings_out_of_criteria":0,"summary":"0 pass, 0 fail, 41 missing of 41 checks across six sections.","stamp":"ELECTRICAL TEST RECORD PREPARATION\nasset: 12345\nVERDICT: INSUFFICIENT_EVIDENCE\n  template_completeness    insufficient_evidence\n  data_hygiene             insufficient_evidence\n  machine_readable_format  insufficient_evidence\n  trending                 insufficient_evidence\n  plotting_discipline      insufficient_evidence\n  retention_and_audit      insufficient_evidence\n0 pass, 0 fail, 41 missing of 41 checks across six sections."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `asset` as a number, `record` as a string. Expected (test doctrine for this program +
the gateway's `invalid_input` mechanism in `callpath.ts`): HTTP 422
`{ok:false, error:"invalid_input", field:...}`. Actual: HTTP 200 with a
`INSUFFICIENT_EVIDENCE` verdict computed over the garbage values (`asset` echoed back as `12345`).
The atom's handler does not validate manifest field
types before evaluation. Disposition: **fix spec filed** —
`verification/fix-specs/electrical-test-record-preparation.md`. Retest on redeploy.

## Final verdict

**FAIL** — core verdict logic and the computed reading/verdict-consistency checks are exact on all three verdict cases, determinism and MCP/REST parity hold, the stamp is well-formed; the single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

**Gateway/deployment:** atoms-gateway v1.1.0 at https://atoms.pipavia.com (health HTTP 200), deployment `7f9cae9fdd60417eb72062905a066554`, retested 2026-11-15. Evidence: `verification/work/electrical-test-record-preparation/evidence.json` (Wave 1 preserved as `evidence-wave1.json` / `judgment-wave1.json`); judgment: `verification/work/electrical-test-record-preparation/judgment.json` (Gemini verdict: PASS, 0 findings, 0 tester errors).

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict `RECORD_READY` | HTTP 200, verdict `RECORD_READY`, "41 pass, 0 fail, 0 missing of 41 checks across six sections." | PASS |
| 2 | violations | HTTP 200, verdict `RECORD_NOT_READY` | HTTP 200, verdict `RECORD_NOT_READY`, "38 pass, 3 fail, 0 missing of 41 checks across six sections." | PASS |
| 3 | sparse | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE`, "0 pass, 0 fail, 41 missing of 41 checks across six sections." | PASS |
| 4 | malformed | HTTP 422, `{ok:false, error:"invalid_input"}`, no verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"asset","detail":"asset must be a string"}` | PASS |
| 5 | determinism | byte-identical responses on repeat REST submission of full-pass | byte-identical: **true** | PASS |
| 6 | parity | MCP `tools/call` structuredContent deep-equal to REST artifact for full-pass | structuredContent deep-equal: **true** (tool name `electrical_test_record_preparation`) | PASS |

F1 closed — malformed now returns 422 invalid_input (field: asset). Raw malformed response: `{"ok":false,"error":"invalid_input","field":"asset","detail":"asset must be a string"}`. This replaces the Wave 1 behaviour, in which the same type-violating manifest returned HTTP 200 with a verdict computed over the garbage values. Mechanical verification confirms the malformed first execution is HTTP 422 with a JSON body whose `error` is `"invalid_input"`, and that the full-pass, violations and sparse first executions match the HTTP status and verdict recorded in `cases.json` expect, with `determinism_byte_identical == true` and `parity_structured_equal == true` on the full-pass case.

Tester errors this wave: none. Gemini returned PASS with no findings and no tester errors, and no Gemini finding contradicted the atom's contract.yaml / SERVICE.md; mechanical evidence and Gemini's judgment agree on every case.

**Retest verdict: PASS**
