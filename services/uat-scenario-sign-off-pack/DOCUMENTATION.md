# Uat scenario sign off pack — documentation

**Uat scenario sign off pack** · slug `uat-scenario-sign-off-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment 22647267ae414ecbb3a5ee342afd73f8; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared UAT scenario and sign-off record for completeness and internal consistency only. It surfaces two faces: REST `POST /v1/uat-scenario-sign-off-pack` and MCP `POST /mcp/uat-scenario-sign-off-pack`. It runs no UAT, executes no scenario and accepts nothing on anyone's behalf — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **AUTHORED + STAGED — not deployed** — "no endpoint is live", and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/uat-scenario-sign-off-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment 22647267ae414ecbb3a5ee342afd73f8). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the round "Release 1.0 UAT"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "uat-scenario-sign-off-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the UAT sign-off manifest.** You declare a UAT scenario and sign-off record for one acceptance round, made from the round as actually carried out — the atom audits the declared record, it does not run the round for you (see Explanation). The recorded full-pass manifest declares the round `Release 1.0 UAT`: all three scope flags `true` (criteria source recorded, scope defined before execution, no silent scope edits); one criterion `C1` (description `User can login`); one scenario `S1` covering `C1`, with steps recorded, expected outcome `Dashboard visible`, timeboxed, result `passed`; all four environment flags with `production_data_used` `false`; all four people flags `true`; both execution flags `true`; an empty `defects` list (a round may genuinely find no defects); daily triage declared; required sign-off roles `["ProductOwner"]` with one sign-off (`ProductOwner`, signer `Alice`, `signed` `true`); `sign_off.outcome` `pass`; `retest.uat_fixes_made` `false` (so the three re-test checks pass as not applicable); declared totals 1 / 1 / 1 / 0 / 1; and both red-line flags `false` (no UAT on production data without anonymization present, no passed outcome while blockers are open present).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/uat-scenario-sign-off-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `UAT_SIGN_OFF_SOUND`: "56 pass, 0 fail, 0 missing of 56 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, the six counts are 1 / 1 / 1 / 0 / 1 / 1, all five duplicate lists and all twenty-one row-name lists are empty (`[]`), `uat_criterion_coverage_ratio`, `uat_scenario_execution_ratio`, `uat_scenario_pass_ratio` and `uat_sign_off_completion_ratio` are each `"1.000000"`, and `uat_defect_disposition_ratio` is null (its denominator — the declared defects — is empty).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `UAT_SIGN_OFF_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "uat-scenario-sign-off-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/uat-scenario-sign-off-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/uat-scenario-sign-off-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `uat_scenario_sign_off_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `UAT_SIGN_OFF_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 5 checks fail: `uat_scope_criteria_source_recorded`, `every_uat_scenario_criterion_reference_declared_criterion`, `every_uat_acceptance_criterion_covered_by_scenario`, `every_uat_scenario_steps_recorded`, and `uat_free_of_production_data_without_anonymization`, and the summary reads "51 pass, 5 fail, 0 missing of 56 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, the manifest is the full-pass manifest with four planted mutations: `scope.criteria_source_recorded` is declared `false`, failing `uat_scope_criteria_source_recorded`; `scenarios[0].criterion_ids` is declared `["C99"]`, naming no declared criterion, failing `every_uat_scenario_criterion_reference_declared_criterion` with `uat_scenarios_with_unknown_criterion_reference` naming `["S1"]`, and leaving criterion `C1` covered by no scenario, failing `every_uat_acceptance_criterion_covered_by_scenario` with `uat_criteria_not_covered_by_any_scenario` naming `["C1"]` and `uat_criterion_coverage_ratio` `"0.000000"`; `scenarios[0].steps_recorded` is declared `false`, failing `every_uat_scenario_steps_recorded` with `uat_scenarios_without_steps_recorded` naming `["S1"]`; and `red_lines.production_data_used_without_anonymization_present` is declared `true`, failing `uat_free_of_production_data_without_anonymization`; sections `scope_and_criteria_mapping`, `environment_people_and_scripts` and `red_lines` report `fail`, the other four sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). Declare only what is true of the actual round: restore the true scope declaration, name the declared criterion the scenario actually covers, declare the steps as actually recorded, and declare the red-line flag as it actually stands. For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scope",
  "detail": "scope must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/uat-scenario-sign-off-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/uat-scenario-sign-off-pack` — tool name `uat_scenario_sign_off_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `uat_scenario_sign_off_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `uat_round_title`, `acceptance_criteria[].criterion_id`, `scenarios[].scenario_id`, `scenarios[].result`, `defects[].defect_id`, `defects[].scenario_id`, `defects[].disposition`, `defects[].disposition_note`, `defects[].defer_until`, `sign_offs[].role` and `sign_off.outcome` are noted as strings, `acceptance_criteria[].description`, `scenarios[].expected_outcome`, `defects[].severity` and `sign_offs[].signer_name` as non-empty strings, the five `declared_totals` counts as numbers, and `acceptance_criteria`, `scenarios`, `defects` and `sign_offs` as lists, `scenarios[].criterion_ids` as a list of strings and `required_sign_off_roles` as a list of strings there. Where SERVICE.md states no type — the section container objects (`scope`, `environment`, `people`, `execution`, `triage`, `sign_off`, `retest`, `declared_totals`, `red_lines`) and the row objects (`acceptance_criteria[]`, `scenarios[]`, `defects[]`, `sign_offs[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `UAT_SIGN_OFF_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, as SERVICE.md groups them — with the multi-section rows named where they occur: the `scenarios` rows are also read by `environment_people_and_scripts` and `execution_and_results`, the `defects` rows by `execution_and_results`, `sign_off_record` and `retest_and_regression_after_fixes`, and the `declared_totals` counts sit in one `declared_totals` object but are grouped under the five sections that read them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `uat_round_title` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: scope_and_criteria_mapping

| Field | Type | Notes |
|---|---|---|
| `scope` | object | The scope section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `scope.criteria_source_recorded` | boolean | — |
| `scope.scope_defined_before_execution` | boolean | — |
| `scope.no_silent_scope_edits_during_uat` | boolean | — |
| `acceptance_criteria` | list | List of criterion-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). The recorded MCP `inputSchema` types this property `object` — see Discrepancies |
| `acceptance_criteria[]` | object | One declared criterion row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `acceptance_criteria[].criterion_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |
| `acceptance_criteria[].description` | non-empty string | Must be non-empty per row (type stated in SERVICE.md) |
| `scenarios` | list | List of scenario-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). Also read by `environment_people_and_scripts` and `execution_and_results`. The recorded MCP `inputSchema` types this property `object` — see Discrepancies |
| `scenarios[]` | object | One declared scenario row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `scenarios[].scenario_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |
| `scenarios[].criterion_ids` | list of strings | Computed — must be a non-empty list per row, must name declared criteria, and together the scenarios must cover every declared criterion (type stated in SERVICE.md) |
| `declared_totals` | object | The declared-totals object — its five count fields are grouped under the sections that read them, as SERVICE.md groups them. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `declared_totals.acceptance_criteria_count` | number | Computed — must recompute against the declared criterion rows (type stated in SERVICE.md) |
| `declared_totals.scenarios_count` | number | Computed — must recompute against the declared scenario rows (type stated in SERVICE.md) |

#### Read by: environment_people_and_scripts

| Field | Type | Notes |
|---|---|---|
| `scenarios[].steps_recorded` | boolean | Computed — must be `true` on every scenario row |
| `scenarios[].expected_outcome` | non-empty string | Must be non-empty per row (type stated in SERVICE.md) |
| `scenarios[].timeboxed` | boolean | Computed — must be `true` on every scenario row |
| `environment` | object | The environment section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `environment.staging_mirrors_production` | boolean | — |
| `environment.test_data_realistic` | boolean | — |
| `environment.production_data_used` | boolean | Gates the anonymization check below |
| `environment.test_data_anonymized` | boolean | Required when production data use is declared; otherwise the check passes as not applicable |
| `people` | object | The people section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `people.business_owner_owns_uat` | boolean | — |
| `people.business_owner_executes_uat` | boolean | — |
| `people.supporting_team_assigned` | boolean | — |
| `people.scribe_assigned` | boolean | — |

#### Read by: execution_and_results

| Field | Type | Notes |
|---|---|---|
| `scenarios[].result` | string | Computed — one of `passed`, `failed`, `blocked`, `not_run`, and must not be `not_run` (every scenario declared executed) (type stated in SERVICE.md) |
| `execution` | object | The execution section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `execution.execution_window_completed` | boolean | — |
| `execution.deviations_logged_as_defects` | boolean | — |
| `declared_totals.executed_scenarios_count` | number | Computed — must equal the number of scenarios whose result is not `not_run` (type stated in SERVICE.md) |

#### Read by: defects_and_triage

| Field | Type | Notes |
|---|---|---|
| `defects` | list | List of defect-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). May be declared empty — a round may find no defects. Also read by `execution_and_results`, `sign_off_record` and `retest_and_regression_after_fixes`. The recorded MCP `inputSchema` types this property `object` — see Discrepancies |
| `defects[]` | object | One declared defect row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `defects[].defect_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |
| `defects[].scenario_id` | string | Computed — must name a declared scenario (type stated in SERVICE.md) |
| `defects[].severity` | non-empty string | Must be non-empty per row; the exact value `blocker` drives the blocker checks (type stated in SERVICE.md) |
| `defects[].disposition` | string | Computed — one of `fix_now`, `accept_with_note`, `defer_with_date` (type stated in SERVICE.md) |
| `defects[].disposition_note` | string | Must be non-empty on `accept_with_note` rows (type stated in SERVICE.md) |
| `defects[].defer_until` | string | Must be non-empty on `defer_with_date` rows; checked as a non-empty declared date string only — the atom reads no clock (type stated in SERVICE.md) |
| `defects[].resolved` | boolean | Also read by `sign_off_record` (the blocker check) and `retest_and_regression_after_fixes` (the `fix_now` check) |
| `triage` | object | The triage section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `triage.triage_held_daily` | boolean | — |
| `declared_totals.defects_count` | number | Computed — must recompute against the declared defect rows (type stated in SERVICE.md) |

#### Read by: sign_off_record

| Field | Type | Notes |
|---|---|---|
| `required_sign_off_roles` | list of strings | Computed — must name at least one role, no duplicates (type stated in SERVICE.md). The recorded MCP `inputSchema` types this property `object` — see Discrepancies |
| `sign_offs` | list | List of sign-off-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). The recorded MCP `inputSchema` types this property `object` — see Discrepancies |
| `sign_offs[]` | object | One declared sign-off row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `sign_offs[].role` | string | Computed — must name a declared required role (type stated in SERVICE.md) |
| `sign_offs[].signer_name` | non-empty string | Must be non-empty per row (type stated in SERVICE.md) |
| `sign_offs[].signed` | boolean | Computed — must be `true` on every row, and every required role must hold a signed row |
| `sign_off` | object | The sign-off section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `sign_off.outcome` | string | Computed — one of `pass`, `conditional_pass` (type stated in SERVICE.md) |
| `sign_off.conditional_open_items_listed` | boolean | Required when a conditional pass is declared; otherwise the check passes as not applicable |
| `sign_off.conditional_owner_named` | boolean | Gated as above |
| `declared_totals.sign_off_roles_count` | number | Computed — must equal the length of `required_sign_off_roles` (type stated in SERVICE.md) |

#### Read by: retest_and_regression_after_fixes

| Field | Type | Notes |
|---|---|---|
| `retest` | object | The retest section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `retest.uat_fixes_made` | boolean | Gates the three re-test checks below |
| `retest.changed_scenarios_retested` | boolean | Required when UAT fixes are declared made; otherwise the check passes as not applicable |
| `retest.touched_flows_regression_completed` | boolean | Gated as above |
| `retest.retest_results_recorded` | boolean | Gated as above |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.production_data_used_without_anonymization_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.passed_while_blocker_defects_open_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 56 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies). Note on gated checks: the evidence text of a gated check is case-dependent — the full-pass run's text is quoted here; when the gate state differs (production data declared used, a conditional pass declared, UAT fixes declared made, or an absent gate), the recorded response carries the corresponding not-applicable or required-form text instead (the sparse run records those variants).

#### Section: scope_and_criteria_mapping

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `uat_scope_criteria_source_recorded` | scope: the source of the acceptance criteria for this UAT round was recorded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uat_scope_defined_before_execution` | scope: the UAT scope was defined before execution began | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uat_no_silent_scope_edits_during_round` | scope / method: no silent scope edits were made mid-UAT | Pass: `scope.no_silent_scope_edits_during_uat` is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uat_acceptance_criteria_list_declared` | criteria: the declared record names its acceptance-criterion rows — the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no criteria at all | Computed over the declared record. Pass: the `acceptance_criteria` list is present and names at least one criterion. Fail: the list is present but empty. Missing: the list is absent. |
| `every_uat_acceptance_criterion_id_unique` | criteria: no declared criterion_id is owned by more than one row | Computed over the declared record. Pass: no declared `criterion_id` appears on more than one row. Fail: an id is declared on more than one row (duplicates are named in `duplicate_uat_criterion_ids`). Missing: the list is absent, or a row has `criterion_id` absent. |
| `every_uat_acceptance_criterion_description_declared` | criteria: every declared criterion declares a non-empty description | Computed over the declared record. Pass: every declared criterion row declares a non-empty `description`. Fail: a row declares an empty `description` (offending rows are named in `uat_criteria_without_description`). Missing: the list is absent, or a row has `description` absent. |
| `uat_scenarios_list_declared` | scenarios: the declared record names its UAT scenario rows — the list is present and names at least one scenario; an absent list is missing evidence and an empty list declares no scenarios at all | Computed over the declared record. Pass: the `scenarios` list is present and names at least one scenario. Fail: the list is present but empty. Missing: the list is absent. |
| `every_uat_scenario_id_unique` | scenarios: no declared scenario_id is owned by more than one row | Computed over the declared record. Pass: no declared `scenario_id` appears on more than one row. Fail: an id is declared on more than one row (duplicates are named in `duplicate_uat_scenario_ids`). Missing: the list is absent, or a row has `scenario_id` absent. |
| `every_uat_scenario_covers_at_least_one_criterion` | scenarios: every declared scenario names at least one acceptance criterion it covers | Computed over the declared record. Pass: every declared scenario's `criterion_ids` is a non-empty list. Fail: a scenario declares an empty `criterion_ids` list (offenders are named in `uat_scenarios_without_criterion_reference`). Missing: the list is absent, or a row has `criterion_ids` absent. |
| `every_uat_scenario_criterion_reference_declared_criterion` | scenarios: every criterion_id a declared scenario names is one of the declared acceptance criteria | Computed over the declared record. Pass: every id named in a scenario's `criterion_ids` is one of the declared criteria. Fail: a scenario names an undeclared criterion (offenders are named in `uat_scenarios_with_unknown_criterion_reference`). Missing: either list is absent, or a row has `criterion_ids` absent. |
| `every_uat_acceptance_criterion_covered_by_scenario` | scope / quality gate: every acceptance criterion is mapped to at least one UAT scenario | Computed over the declared record. Pass: every declared criterion id appears in at least one scenario's `criterion_ids`. Fail: a criterion is covered by no scenario (uncovered criteria are named in `uat_criteria_not_covered_by_any_scenario`). Missing: either list is absent, or a row has `criterion_ids` absent. |
| `uat_declared_criteria_count_matches_rows` | declared totals: the declared acceptance-criteria count recomputes exactly against the declared criterion rows | Computed over the declared record. Pass: `declared_totals.acceptance_criteria_count` equals the number of declared criterion rows. Fail: the declared count differs. Missing: the totals field is absent, or the criterion list is absent. |
| `uat_declared_scenarios_count_matches_rows` | declared totals: the declared scenarios count recomputes exactly against the declared scenario rows | Computed over the declared record. Pass: `declared_totals.scenarios_count` equals the number of declared scenario rows. Fail: the declared count differs. Missing: the totals field is absent, or the scenario list is absent. |

#### Section: environment_people_and_scripts

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `uat_environment_staging_mirrors_production` | environment: staging mirrors production for this UAT round | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uat_environment_test_data_realistic` | environment: the UAT data used was realistic | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uat_production_data_anonymized_where_production_data_used` | no production data use declared | Computed-gated over the declared record. Pass: `environment.production_data_used` is declared `false` (the check passes as not applicable), or it is declared `true` and `environment.test_data_anonymized` is declared `true`. Fail: production data use is declared and anonymization is declared `false`. Missing: the gate field is absent, or production data use is declared and the anonymization field is absent. |
| `uat_business_owner_owns_round` | people: the business owner owns this UAT round | Pass: `people.business_owner_owns_uat` is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uat_business_owner_executes_round` | people: the business owner executes this UAT round | Pass: `people.business_owner_executes_uat` is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uat_supporting_team_assigned` | people: the supporting team was assigned to this UAT round | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uat_scribe_assigned` | people: one scribe was assigned to this UAT round | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_uat_scenario_steps_recorded` | scripts: every declared scenario declares its steps recorded | Computed over the declared record. Pass: every declared scenario row declares `steps_recorded` `true`. Fail: a row declares it `false` (offenders are named in `uat_scenarios_without_steps_recorded`). Missing: the list is absent, or a row has the field absent. |
| `every_uat_scenario_expected_outcome_declared` | scripts: every declared scenario declares a non-empty expected outcome | Computed over the declared record. Pass: every declared scenario row declares a non-empty `expected_outcome`. Fail: a row declares an empty `expected_outcome` (offenders are named in `uat_scenarios_without_expected_outcome`). Missing: the list is absent, or a row has the field absent. |
| `every_uat_scenario_timeboxed` | scripts: every declared scenario is declared timeboxed | Computed over the declared record. Pass: every declared scenario row declares `timeboxed` `true`. Fail: a row declares it `false` (offenders are named in `uat_scenarios_not_timeboxed`). Missing: the list is absent, or a row has the field absent. |

#### Section: execution_and_results

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `uat_round_execution_window_completed` | execution: the UAT execution window for this round was completed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uat_deviations_logged_as_defects` | execution / method: deviations found in UAT were logged as defects | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_uat_scenario_result_recognised` | execution: every declared scenario's result is one of passed, failed, blocked, not_run | Computed over the declared record. Pass: every declared scenario's `result` is one of `passed`, `failed`, `blocked`, `not_run`. Fail: a row declares any other value (offenders are named in `uat_scenarios_with_invalid_result`). Missing: the list is absent, or a row has `result` absent. |
| `every_uat_scenario_result_recorded_as_executed` | execution: every declared scenario is declared executed — its result is not not_run | Computed over the declared record. Pass: every declared scenario's `result` is not `not_run`. Fail: a scenario is declared `not_run` (offenders are named in `uat_scenarios_not_executed`). Missing: the list is absent, or a row has `result` absent. |
| `uat_declared_executed_scenarios_count_matches_rows` | declared totals: the declared executed-scenarios count recomputes exactly against the declared scenario results | Computed over the declared record. Pass: `declared_totals.executed_scenarios_count` equals the number of declared scenarios whose `result` is not `not_run`. Fail: the declared count differs. Missing: the totals field is absent, or the scenario list or a row's `result` is absent. |
| `every_uat_failed_or_blocked_scenario_has_defect_record` | execution: every failed or blocked declared scenario names at least one declared defect row | Computed over the declared record. Pass: every scenario declared `failed` or `blocked` is named by at least one declared defect row's `scenario_id`. Fail: a failed or blocked scenario has no defect row (offenders are named in `uat_failed_or_blocked_scenarios_without_defect`). Missing: the scenario list or the defect list is absent, or a row field the check reads is absent. |

#### Section: defects_and_triage

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `uat_defects_list_declared` | defects: the declared record names its defect rows — the list is present; an empty list declares that the round found no defects, and an absent list is missing evidence | Computed over the declared record. Pass: the `defects` list is present — an empty list passes, because a round may genuinely find no defects. Missing: the list is absent. (SERVICE.md states no fail state for this check: a present list passes.) |
| `every_uat_defect_id_unique` | defects: no declared defect_id is owned by more than one row | Computed over the declared record. Pass: no declared `defect_id` appears on more than one row (vacuously over an empty list). Fail: an id is declared on more than one row (duplicates are named in `duplicate_uat_defect_ids`). Missing: the list is absent, or a row has `defect_id` absent. |
| `every_uat_defect_scenario_reference_declared_scenario` | defects: every declared defect names a scenario_id among the declared scenarios | Computed over the declared record. Pass: every declared defect's `scenario_id` names a declared scenario. Fail: a defect names an undeclared scenario (offenders are named in `uat_defects_with_unknown_scenario_reference`). Missing: either list is absent, or a row has `scenario_id` absent. |
| `every_uat_defect_severity_declared` | defects / quality gate: every declared defect declares a non-empty severity — defects are classified | Computed over the declared record. Pass: every declared defect row declares a non-empty `severity`. Fail: a row declares an empty `severity` (offenders are named in `uat_defects_without_severity`). Missing: the list is absent, or a row has `severity` absent. |
| `every_uat_defect_disposition_recognised` | defects / quality gate: every declared defect's disposition is one of fix_now, accept_with_note, defer_with_date — the triage dispositions the skill names | Computed over the declared record. Pass: every declared defect's `disposition` is one of `fix_now`, `accept_with_note`, `defer_with_date`. Fail: a row declares any other value (offenders are named in `uat_defects_with_invalid_disposition`). Missing: the list is absent, or a row has `disposition` absent. |
| `every_uat_accepted_defect_disposition_note_declared` | defects: every defect dispositioned accept_with_note declares a non-empty disposition note | Computed over the declared record. Pass: every defect dispositioned `accept_with_note` declares a non-empty `disposition_note`. Fail: an `accept_with_note` row declares an empty note (offenders are named in `uat_accepted_defects_without_note`). Missing: the list is absent, or a row field the check reads is absent. |
| `every_uat_deferred_defect_disposition_date_declared` | defects: every defect dispositioned defer_with_date declares a non-empty defer date | Computed over the declared record. Pass: every defect dispositioned `defer_with_date` declares a non-empty `defer_until`. Fail: a `defer_with_date` row declares an empty `defer_until` (offenders are named in `uat_deferred_defects_without_date`). Missing: the list is absent, or a row field the check reads is absent. |
| `uat_triage_held_daily_during_round` | triage / method: defects were triaged daily during this UAT round | Pass: `triage.triage_held_daily` is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `uat_declared_defects_count_matches_rows` | declared totals: the declared defects count recomputes exactly against the declared defect rows | Computed over the declared record. Pass: `declared_totals.defects_count` equals the number of declared defect rows. Fail: the declared count differs. Missing: the totals field is absent, or the defect list is absent. |

#### Section: sign_off_record

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `uat_sign_off_outcome_recognised` | sign-off / quality gate: the declared sign-off outcome is one of pass, conditional_pass — the explicit outcomes the skill names; sign-off is an artifact, not a vibe | Computed over the declared record. Pass: `sign_off.outcome` is one of `pass`, `conditional_pass`. Fail: it is any other value. Missing: the field is absent. |
| `uat_sign_off_required_roles_list_declared` | sign-off: the declared record names its required sign-off roles — the list is present and names at least one role; an absent list is missing evidence and an empty list declares no required sign-off at all | Computed over the declared record. Pass: the `required_sign_off_roles` list is present and names at least one role. Fail: the list is present but empty. Missing: the list is absent. |
| `every_uat_required_sign_off_role_unique` | sign-off: no declared required role is named more than once | Computed over the declared record. Pass: no declared required role is named more than once. Fail: a role is named more than once (duplicates are named in `duplicate_uat_required_sign_off_roles`). Missing: the list is absent. |
| `uat_sign_offs_list_declared` | sign-off: the declared record names its sign-off rows — the list is present and names at least one sign-off; an absent list is missing evidence and an empty list declares no sign-off recorded at all | Computed over the declared record. Pass: the `sign_offs` list is present and names at least one row. Fail: the list is present but empty. Missing: the list is absent. |
| `every_uat_sign_off_role_declared_required` | sign-off: every declared sign-off row names a role among the declared required sign-off roles | Computed over the declared record. Pass: every declared sign-off row's `role` names one of the declared required roles. Fail: a row names a role that is not required (offenders are named in `uat_sign_offs_with_unknown_role`). Missing: either list is absent, or a row has `role` absent. |
| `every_uat_required_role_signed_off` | sign-off / quality gate: every declared required role has a sign-off row declared signed | Computed over the declared record. Pass: every declared required role has a sign-off row declared `signed` `true`. Fail: a required role has no signed sign-off row (gaps are named in `uat_required_roles_without_signed_sign_off`). Missing: either list is absent, or a row field the check reads is absent. |
| `every_uat_sign_off_signer_named` | sign-off: every declared sign-off row names its signer — a sign-off is by a named role-holder, never granted by this atom | Computed over the declared record. Pass: every declared sign-off row declares a non-empty `signer_name`. Fail: a row declares an empty `signer_name` (offenders are named in `uat_sign_offs_without_signer_name`). Missing: the list is absent, or a row has `signer_name` absent. |
| `every_uat_sign_off_marked_signed` | sign-off: every declared sign-off row is declared signed | Computed over the declared record. Pass: every declared sign-off row declares `signed` `true`. Fail: a row declares it `false` (offenders are named in `uat_sign_offs_not_signed`). Missing: the list is absent, or a row has `signed` absent. |
| `uat_conditional_sign_off_open_items_listed_where_conditional` | no conditional pass declared | Computed-gated over the declared record. Pass: `sign_off.outcome` is not `conditional_pass` (the check passes as not applicable), or it is `conditional_pass` and `sign_off.conditional_open_items_listed` is declared `true`. Fail: a conditional pass is declared and the field is declared `false`. Missing: the outcome is absent, or a conditional pass is declared and the field is absent. |
| `uat_conditional_sign_off_owner_named_where_conditional` | no conditional pass declared | Computed-gated over the declared record. Pass: `sign_off.outcome` is not `conditional_pass` (the check passes as not applicable), or it is `conditional_pass` and `sign_off.conditional_owner_named` is declared `true`. Fail: a conditional pass is declared and the field is declared `false`. Missing: the outcome is absent, or a conditional pass is declared and the field is absent. |
| `uat_sign_off_not_pass_while_blocker_defect_open` | sign-off / red line: a declared pass outcome does not stand while a defect declaring severity blocker is not declared resolved | Computed over the declared record. Pass: the declared outcome is not `pass`, or it is `pass` and every defect declaring severity exactly `blocker` is declared `resolved` `true` (a `conditional_pass` does not fail this check). Fail: a `pass` is declared while a `blocker` defect is not declared resolved (open blockers are named in `uat_open_blocker_defect_ids`). Missing: the outcome, the defect list, or a row field the check reads is absent. |
| `uat_declared_sign_off_roles_count_matches_required_roles` | declared totals: the declared sign-off roles count recomputes exactly against the declared required sign-off roles | Computed over the declared record. Pass: `declared_totals.sign_off_roles_count` equals the length of `required_sign_off_roles`. Fail: the declared count differs. Missing: the totals field is absent, or the required-roles list is absent. |

#### Section: retest_and_regression_after_fixes

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `uat_changed_scenarios_retested_where_fixes_made` | no UAT fixes declared made | Computed-gated over the declared record. Pass: `retest.uat_fixes_made` is declared `false` (the check passes as not applicable), or it is declared `true` and `retest.changed_scenarios_retested` is declared `true`. Fail: fixes are declared made and the field is declared `false`. Missing: the gate field is absent, or fixes are declared made and the field is absent. |
| `uat_touched_flows_regression_completed_where_fixes_made` | no UAT fixes declared made | Computed-gated over the declared record. Pass: `retest.uat_fixes_made` is declared `false` (the check passes as not applicable), or it is declared `true` and `retest.touched_flows_regression_completed` is declared `true`. Fail: fixes are declared made and the field is declared `false`. Missing: the gate field is absent, or fixes are declared made and the field is absent. |
| `uat_retest_results_recorded_where_fixes_made` | no UAT fixes declared made | Computed-gated over the declared record. Pass: `retest.uat_fixes_made` is declared `false` (the check passes as not applicable), or it is declared `true` and `retest.retest_results_recorded` is declared `true`. Fail: fixes are declared made and the field is declared `false`. Missing: the gate field is absent, or fixes are declared made and the field is absent. |
| `every_uat_fix_now_defect_marked_resolved` | re-test: every defect dispositioned fix_now is declared resolved | Computed over the declared record. Pass: every defect dispositioned `fix_now` is declared `resolved` `true`. Fail: a `fix_now` defect is declared not resolved (offenders are named in `uat_fix_now_defects_unresolved`). Missing: the defect list is absent, or a row field the check reads is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `uat_free_of_production_data_without_anonymization` | red line: no UAT on production data without anonymization is present in the record | Pass: `red_lines.production_data_used_without_anonymization_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `uat_free_of_passed_while_blockers_open` | red line: no passed outcome while blockers are open is present in the record | Pass: `red_lines.passed_while_blocker_defects_open_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object, with these top-level fields in the recorded order:

- `service` (`"uat-scenario-sign-off-pack"`), `atom_version` (`"0.1.0"`), and `uat_round_title` (the manifest's declared round title value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `uat_acceptance_criteria_count`, `uat_scenarios_count`, `uat_executed_scenarios_count`, `uat_defects_count`, `uat_sign_offs_count` and `uat_required_sign_off_roles_count` (the declared list lengths as integers, exactly, or null when the corresponding list is not declared — the executed count counts scenarios whose result is not `not_run`); the duplicate lists `duplicate_uat_criterion_ids`, `duplicate_uat_scenario_ids`, `duplicate_uat_defect_ids`, `duplicate_uat_required_sign_off_roles` and `duplicate_uat_sign_off_roles` (ids / roles declared on more than one row; each null when its list is not declared, as recorded in the sparse case); the twenty-one row-name lists `uat_criteria_without_description`, `uat_criteria_not_covered_by_any_scenario`, `uat_scenarios_without_criterion_reference`, `uat_scenarios_with_unknown_criterion_reference`, `uat_scenarios_without_steps_recorded`, `uat_scenarios_without_expected_outcome`, `uat_scenarios_not_timeboxed`, `uat_scenarios_with_invalid_result`, `uat_scenarios_not_executed`, `uat_failed_or_blocked_scenarios_without_defect`, `uat_defects_with_unknown_scenario_reference`, `uat_defects_without_severity`, `uat_defects_with_invalid_disposition`, `uat_accepted_defects_without_note`, `uat_deferred_defects_without_date`, `uat_fix_now_defects_unresolved`, `uat_open_blocker_defect_ids`, `uat_sign_offs_with_unknown_role`, `uat_sign_offs_without_signer_name`, `uat_sign_offs_not_signed` and `uat_required_roles_without_signed_sign_off` (the offending rows for each computed rule; each null when its underlying list is not declared, as recorded in the sparse case); and the ratios `uat_criterion_coverage_ratio` (declared criteria covered by at least one scenario ÷ declared criteria), `uat_scenario_execution_ratio` (executed scenarios ÷ declared scenarios), `uat_scenario_pass_ratio` (scenarios declared `passed` ÷ declared scenarios), `uat_defect_disposition_ratio` (defects with a recognised disposition ÷ declared defects) and `uat_sign_off_completion_ratio` (required roles with a signed sign-off ÷ declared required roles) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty, and the coverage and sign-off ratios are also null when the covering / sign-off list is not declared. Computed ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "56 pass, 0 fail, 0 missing of 56 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared round title value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `UAT_SIGN_OFF_SOUND` — all 56 checks pass: the declared UAT scenario and sign-off record is complete and internally consistent with the bound skill's method, quality gates and red lines.
- `UAT_SIGN_OFF_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only — the thirty-six computed checks named in SERVICE.md): `within_stated_limits_on_declared_evidence` — every computed check passes; `outside_stated_limits_on_declared_evidence` — at least one computed check fails; `null` — at least one of the thirty-six computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for a gated check, including passes as not applicable when its gate is off); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `uat_acceptance_criteria_count`, `uat_scenarios_count`, `uat_executed_scenarios_count`, `uat_defects_count`, `uat_sign_offs_count`, `uat_required_sign_off_roles_count`, the five duplicate lists, the twenty-one row-name lists, the five ratios (`uat_criterion_coverage_ratio`, `uat_scenario_execution_ratio`, `uat_scenario_pass_ratio`, `uat_defect_disposition_ratio`, `uat_sign_off_completion_ratio`) and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"scope","detail":"scope must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Run UAT that means something — business scenarios, realistic data, sign-off criteria, clean feedback loops (the bound capability, from the skill `user-acceptance-testing`). You submit one declared record — the UAT scenario and sign-off manifest, made from the round as actually carried out — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 7 sections (`scope_and_criteria_mapping`, `environment_people_and_scripts`, `execution_and_results`, `defects_and_triage`, `sign_off_record`, `retest_and_regression_after_fixes`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. This atom shares zero checks with its nearest siblings `designed-test-case-pack` (designed engineering test cases), `testing-strategy-regression-pack` (engineering testing strategy and regression scope) and `buyer-test-card` (a buyer's own bounded test of a product they are considering buying) (SERVICE.md, Distinct ground): every check here is a business-acceptance question — business-user scenarios mapped from acceptance criteria, a business owner owning and executing the round, staging mirroring production, classified and dispositioned defects, an explicit sign-off record, and re-test plus regression after UAT fixes.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* (fourteen) read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* (thirty-six, per SERVICE.md) are calculated from the declared rows and values themselves — the criteria and scenario lists must be present and name at least one row each with unique ids, every criterion must declare a description and be covered by at least one scenario, every scenario must cover at least one declared criterion and declare its steps recorded, a non-empty expected outcome, timeboxing, a recognised result and an executed result, every failed or blocked scenario must have a defect record, the defects list must be present (an empty list passes) with unique ids, declared scenario references, severities and recognised dispositions with notes on accepted rows and dates on deferred rows, the sign-off outcome must be recognised, the required roles and sign-offs must be complete over the declared roles with named signers, a declared `pass` must not stand while a `blocker` defect is unresolved, every `fix_now` defect must be resolved, and each of the five declared totals must recompute exactly — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. *Gated checks* (six, per SERVICE.md) follow the record's own declared gate fields: anonymization is gated on `environment.production_data_used`, the two conditional-pass checks on `sign_off.outcome` being `conditional_pass`, and the three re-test / regression checks on `retest.uat_fixes_made`; with the gate off, a gated check passes as not applicable; with the gate field absent, it is `missing`. Aggregation is strict: any `fail` anywhere produces `UAT_SIGN_OFF_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `UAT_SIGN_OFF_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are criteria mapping, a production-mirroring environment with anonymized realistic data, business ownership, scripted scenarios, classified and dispositioned defects, explicit sign-off, and re-test after fixes, not bars the atom can set. Declined, named, exactly as SERVICE.md names them: a minimum or maximum number of criteria, scenarios, defects or sign-off roles beyond at least one each where stated (and none at all for defects — zero is a legitimate declared outcome); a scenario pass-rate bar (the ratio is reported, never judged — a round with failed scenarios and a sound record is a sound record of a failed round); a defect-count, severity-mix or blocker-count bar beyond the skill's own recomputed no-pass-with-open-blocker rule; a severity scale beyond the caller's own declared severity strings (only the exact declared value `blocker` carries the skill's red-line meaning); a timebox length in minutes; a triage cadence bar beyond the declared daily triage; a re-test or regression duration or coverage bar beyond completion as declared; a date-format or futurity bar on `defer_until` (checked as a non-empty declared date string only — the atom reads no clock); any judgment that the product under UAT is good, acceptable or ready to ship (only that its declared UAT record contains what the skill requires — acceptance itself is the business's, never this atom's). Quantities are computed and reported; the only bars on the computed rows are exact coverage and completeness over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** UAT scenario and sign-off record: a verdict of `UAT_SIGN_OFF_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its criteria covered, its blockers resolved and its roles signed passes those checks even if the real round did none of it. It is a completeness and consistency audit of the UAT record the skill requires, **not a testing service, an acceptance decision, or a guarantee that the product works or was actually accepted**. Specifically: it runs no UAT, executes no scenario, operates no staging environment, inspects no data, interviews no business user, and **accepts nothing on anyone's behalf** — a sign-off is checked as a declared record (a named role, a signer name, a signed flag, an outcome), never granted, witnessed or validated by the atom. It never judges whether a declared scenario is a good end-to-end business flow, whether the declared data really was anonymized, whether a declared signer actually signed, or whether the business should have accepted — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions and non-reducible parts (carried as caller declarations only, never performed or judged): running the UAT round itself; executing any scenario or product flow; preparing, anonymizing or inspecting test data; the business judgment behind any sign-off, acceptance, severity classification or disposition; verifying any signature or identity behind a declared sign-off row; and any release decision that follows from a sign-off. Boundary cases, named: a round that genuinely found no defects passes with an empty declared `defects` list; a business refusal to sign off cannot pass this record format's outcome check (the format recognises only the skill's two sign-off outcomes — such a round is recorded as not sound *as a sign-off record*, which is the gate working, not a judgment on the refusal's merits); a conditional pass with open blockers is not failed by the recomputed blocker check — it stands or falls on its listed open items and named owner, exactly as the skill allows.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Acceptance rounds before product releases (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

*Regulators: N/A — this atom audits a declared UAT scenario and sign-off record; SERVICE.md's U-13 screen is (a) No outright, stating that its output could not read as regulated professional advice (a declared-record audit against its bound skill, offering no engineering-practice, financial, securities or psychology-adjacent advice) — it audits a caller-declared record for completeness and internal consistency only (criteria-to-scenario coverage, environment / people / script declarations, execution results, defect classification and disposition, sign-off completeness over the declared required roles, re-test declarations, declared totals recomputed, and the red lines refused), produces no test execution, no acceptance and no advice of any kind, sets no threshold on any subject matter, and its sign-off checks judge declared presence and completeness only, never the legal or organisational sufficiency of a sign-off. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `uat_scenario_sign_off_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/uat_scenario_sign_off_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_uat_scenario_sign_off_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/uat-scenario-sign-off-pack` (REST) and `POST /mcp/uat-scenario-sign-off-pack` (MCP, tool `uat_scenario_sign_off_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment 22647267ae414ecbb3a5ee342afd73f8; RC soak to 2026-11-22). Key scope: `uat_scenario_sign_off_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **AUTHORED + STAGED — not deployed** — "no endpoint is live", and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment 22647267ae414ecbb3a5ee342afd73f8) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are descriptive forms, not the leaf names of the fields they read. The plain attestation checks are the closest, but still reworded (for example `uat_no_silent_scope_edits_during_round` reads `scope.no_silent_scope_edits_during_uat` — `during_round` in the check name, `during_uat` in the field; `uat_business_owner_owns_round` reads `people.business_owner_owns_uat`; `uat_business_owner_executes_round` reads `people.business_owner_executes_uat`; `uat_triage_held_daily_during_round` reads `triage.triage_held_daily`; `uat_round_execution_window_completed` reads `execution.execution_window_completed`). The thirty-six computed checks and the six gated checks have no single same-named field at all: for example `every_uat_acceptance_criterion_covered_by_scenario` (the criteria rows against every scenario's `criterion_ids`), `uat_sign_off_not_pass_while_blocker_defect_open` (the `sign_off.outcome` against the defect rows' `severity` / `resolved`), `every_uat_fix_now_defect_marked_resolved` (the defect rows' `disposition` / `resolved`), and the two red-line checks (`uat_free_of_production_data_without_anonymization` and its sibling read the `red_lines.*_present` fields). Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md, and the recorded MCP `inputSchema` mistypes the list properties:** SERVICE.md states no type for the section container objects (`scope`, `environment`, `people`, `execution`, `triage`, `sign_off`, `retest`, `declared_totals`, `red_lines`) or for a row object (`acceptance_criteria[]`, `scenarios[]`, `defects[]`, `sign_offs[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers, in the recorded MCP `inputSchema`, and are said so there. The recorded MCP `inputSchema` itself lists only the fifteen top-level properties and types the five list properties — `acceptance_criteria`, `scenarios`, `defects`, `required_sign_off_roles`, `sign_offs` — as `object`, although every recorded input carries them as JSON arrays; the nested row and leaf types rest on the recorded evidence inputs and SERVICE.md's table, not on the schema. This document follows SERVICE.md's table and the recorded inputs (lists), and names the schema's `object` typing here.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 56 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, the six counts and the five ratios, but it does not state a null rule for the five duplicate lists or the twenty-one row-name lists. The recorded sparse response returns all of them as `null` when the list they are computed from is not declared (as the Output format section records); this document follows the recording.
6. **Section groupings merging and splitting input objects:** the recorded sections do not map one-to-one onto input objects. `scope_and_criteria_mapping` merges the `scope` object, the `acceptance_criteria` rows, part of the `scenarios` rows (ids and criterion references) and two `declared_totals` counts; `environment_people_and_scripts` merges the `environment` and `people` objects with the scenarios' script fields (`steps_recorded`, `expected_outcome`, `timeboxed`); `execution_and_results` merges the `execution` object, the scenarios' `result` fields, the defect-linkage rule and one totals count; `sign_off_record` merges `required_sign_off_roles`, the `sign_offs` rows, the `sign_off` object, one totals count and the defect rows' `severity` / `resolved` fields; and the single `scenarios` list is read by three recorded sections while the single `defects` list is read by four (`execution_and_results`, `defects_and_triage`, `sign_off_record`, `retest_and_regression_after_fixes`). This document groups the Input reference and the Checks by the recorded section names, with those mergings and splittings named in place.
7. **Gated-check evidence text is case-dependent:** the evidence text quoted in the Checks section is the full-pass run's text. For gated checks the recorded text changes with the gate state — in the full-pass run, for example, `uat_production_data_anonymized_where_production_data_used` carries the text "no production data use declared", the two conditional-pass checks carry "no conditional pass declared", and the three re-test checks carry "no UAT fixes declared made", instead of their required-form texts. No single evidence string per check exists in the recordings; the Checks section says so at its head.
8. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (7 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named three computed row-name lists — `uat_scenarios_with_unknown_criterion_reference`, `uat_criteria_not_covered_by_any_scenario` and `uat_required_roles_without_signed_sign_off` — instead of exact check names (R1 ×3); the full-pass and violations `expect` blocks carried no structured `computed_spot_checks` (R2 ×2); the designed violations input was missing key paths present in the full-pass manifest (R3 ×1); and the designed malformed input carried 2 type violations (`uat_round_title` and `scope`) instead of exactly one (R4 ×1). These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.

## Worked examples

Provenance: recorded 2026-11-16T14:11:59.125272+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/uat-scenario-sign-off-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T14:11:59.125272+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/uat-scenario-sign-off-pack/evidence.json`.

Input:

```json
{
  "uat_round_title": "Release 1.0 UAT",
  "scope": {
    "criteria_source_recorded": true,
    "scope_defined_before_execution": true,
    "no_silent_scope_edits_during_uat": true
  },
  "acceptance_criteria": [
    {
      "criterion_id": "C1",
      "description": "User can login"
    }
  ],
  "scenarios": [
    {
      "scenario_id": "S1",
      "criterion_ids": [
        "C1"
      ],
      "steps_recorded": true,
      "expected_outcome": "Dashboard visible",
      "timeboxed": true,
      "result": "passed"
    }
  ],
  "environment": {
    "staging_mirrors_production": true,
    "test_data_realistic": true,
    "production_data_used": false,
    "test_data_anonymized": true
  },
  "people": {
    "business_owner_owns_uat": true,
    "business_owner_executes_uat": true,
    "supporting_team_assigned": true,
    "scribe_assigned": true
  },
  "execution": {
    "execution_window_completed": true,
    "deviations_logged_as_defects": true
  },
  "defects": [],
  "triage": {
    "triage_held_daily": true
  },
  "required_sign_off_roles": [
    "ProductOwner"
  ],
  "sign_offs": [
    {
      "role": "ProductOwner",
      "signer_name": "Alice",
      "signed": true
    }
  ],
  "sign_off": {
    "outcome": "pass"
  },
  "retest": {
    "uat_fixes_made": false
  },
  "declared_totals": {
    "acceptance_criteria_count": 1,
    "scenarios_count": 1,
    "executed_scenarios_count": 1,
    "defects_count": 0,
    "sign_off_roles_count": 1
  },
  "red_lines": {
    "production_data_used_without_anonymization_present": false,
    "passed_while_blocker_defects_open_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "uat-scenario-sign-off-pack",
  "atom_version": "0.1.0",
  "uat_round_title": "Release 1.0 UAT",
  "verdict": "UAT_SIGN_OFF_SOUND",
  "sections": {
    "scope_and_criteria_mapping": "pass",
    "environment_people_and_scripts": "pass",
    "execution_and_results": "pass",
    "defects_and_triage": "pass",
    "sign_off_record": "pass",
    "retest_and_regression_after_fixes": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "scope_and_criteria_mapping",
      "check": "uat_scope_criteria_source_recorded",
      "status": "pass",
      "evidence": "scope: the source of the acceptance criteria for this UAT round was recorded"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "uat_scope_defined_before_execution",
      "status": "pass",
      "evidence": "scope: the UAT scope was defined before execution began"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "uat_no_silent_scope_edits_during_round",
      "status": "pass",
      "evidence": "scope / method: no silent scope edits were made mid-UAT"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "uat_acceptance_criteria_list_declared",
      "status": "pass",
      "evidence": "criteria: the declared record names its acceptance-criterion rows \u2014 the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no criteria at all"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "every_uat_acceptance_criterion_id_unique",
      "status": "pass",
      "evidence": "criteria: no declared criterion_id is owned by more than one row"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "every_uat_acceptance_criterion_description_declared",
      "status": "pass",
      "evidence": "criteria: every declared criterion declares a non-empty description"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "uat_scenarios_list_declared",
      "status": "pass",
      "evidence": "scenarios: the declared record names its UAT scenario rows \u2014 the list is present and names at least one scenario; an absent list is missing evidence and an empty list declares no scenarios at all"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "every_uat_scenario_id_unique",
      "status": "pass",
      "evidence": "scenarios: no declared scenario_id is owned by more than one row"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "every_uat_scenario_covers_at_least_one_criterion",
      "status": "pass",
      "evidence": "scenarios: every declared scenario names at least one acceptance criterion it covers"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "every_uat_scenario_criterion_reference_declared_criterion",
      "status": "pass",
      "evidence": "scenarios: every criterion_id a declared scenario names is one of the declared acceptance criteria"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "every_uat_acceptance_criterion_covered_by_scenario",
      "status": "pass",
      "evidence": "scope / quality gate: every acceptance criterion is mapped to at least one UAT scenario"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "uat_declared_criteria_count_matches_rows",
      "status": "pass",
      "evidence": "declared totals: the declared acceptance-criteria count recomputes exactly against the declared criterion rows"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "uat_declared_scenarios_count_matches_rows",
      "status": "pass",
      "evidence": "declared totals: the declared scenarios count recomputes exactly against the declared scenario rows"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "uat_environment_staging_mirrors_production",
      "status": "pass",
      "evidence": "environment: staging mirrors production for this UAT round"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "uat_environment_test_data_realistic",
      "status": "pass",
      "evidence": "environment: the UAT data used was realistic"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "uat_production_data_anonymized_where_production_data_used",
      "status": "pass",
      "evidence": "no production data use declared"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "uat_business_owner_owns_round",
      "status": "pass",
      "evidence": "people: the business owner owns this UAT round"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "uat_business_owner_executes_round",
      "status": "pass",
      "evidence": "people: the business owner executes this UAT round"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "uat_supporting_team_assigned",
      "status": "pass",
      "evidence": "people: the supporting team was assigned to this UAT round"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "uat_scribe_assigned",
      "status": "pass",
      "evidence": "people: one scribe was assigned to this UAT round"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "every_uat_scenario_steps_recorded",
      "status": "pass",
      "evidence": "scripts: every declared scenario declares its steps recorded"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "every_uat_scenario_expected_outcome_declared",
      "status": "pass",
      "evidence": "scripts: every declared scenario declares a non-empty expected outcome"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "every_uat_scenario_timeboxed",
      "status": "pass",
      "evidence": "scripts: every declared scenario is declared timeboxed"
    },
    {
      "section": "execution_and_results",
      "check": "uat_round_execution_window_completed",
      "status": "pass",
      "evidence": "execution: the UAT execution window for this round was completed"
    },
    {
      "section": "execution_and_results",
      "check": "uat_deviations_logged_as_defects",
      "status": "pass",
      "evidence": "execution / method: deviations found in UAT were logged as defects"
    },
    {
      "section": "execution_and_results",
      "check": "every_uat_scenario_result_recognised",
      "status": "pass",
      "evidence": "execution: every declared scenario's result is one of passed, failed, blocked, not_run"
    },
    {
      "section": "execution_and_results",
      "check": "every_uat_scenario_result_recorded_as_executed",
      "status": "pass",
      "evidence": "execution: every declared scenario is declared executed \u2014 its result is not not_run"
    },
    {
      "section": "execution_and_results",
      "check": "uat_declared_executed_scenarios_count_matches_rows",
      "status": "pass",
      "evidence": "declared totals: the declared executed-scenarios count recomputes exactly against the declared scenario results"
    },
    {
      "section": "execution_and_results",
      "check": "every_uat_failed_or_blocked_scenario_has_defect_record",
      "status": "pass",
      "evidence": "execution: every failed or blocked declared scenario names at least one declared defect row"
    },
    {
      "section": "defects_and_triage",
      "check": "uat_defects_list_declared",
      "status": "pass",
      "evidence": "defects: the declared record names its defect rows \u2014 the list is present; an empty list declares that the round found no defects, and an absent list is missing evidence"
    },
    {
      "section": "defects_and_triage",
      "check": "every_uat_defect_id_unique",
      "status": "pass",
      "evidence": "defects: no declared defect_id is owned by more than one row"
    },
    {
      "section": "defects_and_triage",
      "check": "every_uat_defect_scenario_reference_declared_scenario",
      "status": "pass",
      "evidence": "defects: every declared defect names a scenario_id among the declared scenarios"
    },
    {
      "section": "defects_and_triage",
      "check": "every_uat_defect_severity_declared",
      "status": "pass",
      "evidence": "defects / quality gate: every declared defect declares a non-empty severity \u2014 defects are classified"
    },
    {
      "section": "defects_and_triage",
      "check": "every_uat_defect_disposition_recognised",
      "status": "pass",
      "evidence": "defects / quality gate: every declared defect's disposition is one of fix_now, accept_with_note, defer_with_date \u2014 the triage dispositions the skill names"
    },
    {
      "section": "defects_and_triage",
      "check": "every_uat_accepted_defect_disposition_note_declared",
      "status": "pass",
      "evidence": "defects: every defect dispositioned accept_with_note declares a non-empty disposition note"
    },
    {
      "section": "defects_and_triage",
      "check": "every_uat_deferred_defect_disposition_date_declared",
      "status": "pass",
      "evidence": "defects: every defect dispositioned defer_with_date declares a non-empty defer date"
    },
    {
      "section": "defects_and_triage",
      "check": "uat_triage_held_daily_during_round",
      "status": "pass",
      "evidence": "triage / method: defects were triaged daily during this UAT round"
    },
    {
      "section": "defects_and_triage",
      "check": "uat_declared_defects_count_matches_rows",
      "status": "pass",
      "evidence": "declared totals: the declared defects count recomputes exactly against the declared defect rows"
    },
    {
      "section": "sign_off_record",
      "check": "uat_sign_off_outcome_recognised",
      "status": "pass",
      "evidence": "sign-off / quality gate: the declared sign-off outcome is one of pass, conditional_pass \u2014 the explicit outcomes the skill names; sign-off is an artifact, not a vibe"
    },
    {
      "section": "sign_off_record",
      "check": "uat_sign_off_required_roles_list_declared",
      "status": "pass",
      "evidence": "sign-off: the declared record names its required sign-off roles \u2014 the list is present and names at least one role; an absent list is missing evidence and an empty list declares no required sign-off at all"
    },
    {
      "section": "sign_off_record",
      "check": "every_uat_required_sign_off_role_unique",
      "status": "pass",
      "evidence": "sign-off: no declared required role is named more than once"
    },
    {
      "section": "sign_off_record",
      "check": "uat_sign_offs_list_declared",
      "status": "pass",
      "evidence": "sign-off: the declared record names its sign-off rows \u2014 the list is present and names at least one sign-off; an absent list is missing evidence and an empty list declares no sign-off recorded at all"
    },
    {
      "section": "sign_off_record",
      "check": "every_uat_sign_off_role_declared_required",
      "status": "pass",
      "evidence": "sign-off: every declared sign-off row names a role among the declared required sign-off roles"
    },
    {
      "section": "sign_off_record",
      "check": "every_uat_required_role_signed_off",
      "status": "pass",
      "evidence": "sign-off / quality gate: every declared required role has a sign-off row declared signed"
    },
    {
      "section": "sign_off_record",
      "check": "every_uat_sign_off_signer_named",
      "status": "pass",
      "evidence": "sign-off: every declared sign-off row names its signer \u2014 a sign-off is by a named role-holder, never granted by this atom"
    },
    {
      "section": "sign_off_record",
      "check": "every_uat_sign_off_marked_signed",
      "status": "pass",
      "evidence": "sign-off: every declared sign-off row is declared signed"
    },
    {
      "section": "sign_off_record",
      "check": "uat_conditional_sign_off_open_items_listed_where_conditional",
      "status": "pass",
      "evidence": "no conditional pass declared"
    },
    {
      "section": "sign_off_record",
      "check": "uat_conditional_sign_off_owner_named_where_conditional",
      "status": "pass",
      "evidence": "no conditional pass declared"
    },
    {
      "section": "sign_off_record",
      "check": "uat_sign_off_not_pass_while_blocker_defect_open",
      "status": "pass",
      "evidence": "sign-off / red line: a declared pass outcome does not stand while a defect declaring severity blocker is not declared resolved"
    },
    {
      "section": "sign_off_record",
      "check": "uat_declared_sign_off_roles_count_matches_required_roles",
      "status": "pass",
      "evidence": "declared totals: the declared sign-off roles count recomputes exactly against the declared required sign-off roles"
    },
    {
      "section": "retest_and_regression_after_fixes",
      "check": "uat_changed_scenarios_retested_where_fixes_made",
      "status": "pass",
      "evidence": "no UAT fixes declared made"
    },
    {
      "section": "retest_and_regression_after_fixes",
      "check": "uat_touched_flows_regression_completed_where_fixes_made",
      "status": "pass",
      "evidence": "no UAT fixes declared made"
    },
    {
      "section": "retest_and_regression_after_fixes",
      "check": "uat_retest_results_recorded_where_fixes_made",
      "status": "pass",
      "evidence": "no UAT fixes declared made"
    },
    {
      "section": "retest_and_regression_after_fixes",
      "check": "every_uat_fix_now_defect_marked_resolved",
      "status": "pass",
      "evidence": "re-test: every defect dispositioned fix_now is declared resolved"
    },
    {
      "section": "red_lines",
      "check": "uat_free_of_production_data_without_anonymization",
      "status": "pass",
      "evidence": "red line: no UAT on production data without anonymization is present in the record"
    },
    {
      "section": "red_lines",
      "check": "uat_free_of_passed_while_blockers_open",
      "status": "pass",
      "evidence": "red line: no passed outcome while blockers are open is present in the record"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "uat_acceptance_criteria_count": 1,
  "uat_scenarios_count": 1,
  "uat_executed_scenarios_count": 1,
  "uat_defects_count": 0,
  "uat_sign_offs_count": 1,
  "uat_required_sign_off_roles_count": 1,
  "duplicate_uat_criterion_ids": [],
  "duplicate_uat_scenario_ids": [],
  "duplicate_uat_defect_ids": [],
  "duplicate_uat_required_sign_off_roles": [],
  "duplicate_uat_sign_off_roles": [],
  "uat_criteria_without_description": [],
  "uat_criteria_not_covered_by_any_scenario": [],
  "uat_scenarios_without_criterion_reference": [],
  "uat_scenarios_with_unknown_criterion_reference": [],
  "uat_scenarios_without_steps_recorded": [],
  "uat_scenarios_without_expected_outcome": [],
  "uat_scenarios_not_timeboxed": [],
  "uat_scenarios_with_invalid_result": [],
  "uat_scenarios_not_executed": [],
  "uat_failed_or_blocked_scenarios_without_defect": [],
  "uat_defects_with_unknown_scenario_reference": [],
  "uat_defects_without_severity": [],
  "uat_defects_with_invalid_disposition": [],
  "uat_accepted_defects_without_note": [],
  "uat_deferred_defects_without_date": [],
  "uat_fix_now_defects_unresolved": [],
  "uat_open_blocker_defect_ids": [],
  "uat_sign_offs_with_unknown_role": [],
  "uat_sign_offs_without_signer_name": [],
  "uat_sign_offs_not_signed": [],
  "uat_required_roles_without_signed_sign_off": [],
  "uat_criterion_coverage_ratio": "1.000000",
  "uat_scenario_execution_ratio": "1.000000",
  "uat_scenario_pass_ratio": "1.000000",
  "uat_defect_disposition_ratio": null,
  "uat_sign_off_completion_ratio": "1.000000",
  "summary": "56 pass, 0 fail, 0 missing of 56 checks across seven sections.",
  "stamp": "UAT SCENARIO SIGN-OFF PACK\nuat_round_title: Release 1.0 UAT\nVERDICT: UAT_SIGN_OFF_SOUND\n  scope_and_criteria_mapping                   pass\n  environment_people_and_scripts               pass\n  execution_and_results                        pass\n  defects_and_triage                           pass\n  sign_off_record                              pass\n  retest_and_regression_after_fixes            pass\n  red_lines                                    pass\n56 pass, 0 fail, 0 missing of 56 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T14:11:59.125272+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/uat-scenario-sign-off-pack/evidence.json`.

Input:

```json
{
  "uat_round_title": "Release 1.0 UAT",
  "scope": {
    "criteria_source_recorded": false,
    "scope_defined_before_execution": true,
    "no_silent_scope_edits_during_uat": true
  },
  "acceptance_criteria": [
    {
      "criterion_id": "C1",
      "description": "User can login"
    }
  ],
  "scenarios": [
    {
      "scenario_id": "S1",
      "criterion_ids": [
        "C99"
      ],
      "steps_recorded": false,
      "expected_outcome": "Dashboard visible",
      "timeboxed": true,
      "result": "passed"
    }
  ],
  "environment": {
    "staging_mirrors_production": true,
    "test_data_realistic": true,
    "production_data_used": false,
    "test_data_anonymized": true
  },
  "people": {
    "business_owner_owns_uat": true,
    "business_owner_executes_uat": true,
    "supporting_team_assigned": true,
    "scribe_assigned": true
  },
  "execution": {
    "execution_window_completed": true,
    "deviations_logged_as_defects": true
  },
  "defects": [],
  "triage": {
    "triage_held_daily": true
  },
  "required_sign_off_roles": [
    "ProductOwner"
  ],
  "sign_offs": [
    {
      "role": "ProductOwner",
      "signer_name": "Alice",
      "signed": true
    }
  ],
  "sign_off": {
    "outcome": "pass"
  },
  "retest": {
    "uat_fixes_made": false
  },
  "declared_totals": {
    "acceptance_criteria_count": 1,
    "scenarios_count": 1,
    "executed_scenarios_count": 1,
    "defects_count": 0,
    "sign_off_roles_count": 1
  },
  "red_lines": {
    "production_data_used_without_anonymization_present": true,
    "passed_while_blocker_defects_open_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "uat-scenario-sign-off-pack",
  "atom_version": "0.1.0",
  "uat_round_title": "Release 1.0 UAT",
  "verdict": "UAT_SIGN_OFF_NOT_SOUND",
  "sections": {
    "scope_and_criteria_mapping": "fail",
    "environment_people_and_scripts": "fail",
    "execution_and_results": "pass",
    "defects_and_triage": "pass",
    "sign_off_record": "pass",
    "retest_and_regression_after_fixes": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "scope_and_criteria_mapping",
      "check": "uat_scope_criteria_source_recorded",
      "status": "fail",
      "evidence": "scope: the source of the acceptance criteria for this UAT round was recorded"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "uat_scope_defined_before_execution",
      "status": "pass",
      "evidence": "scope: the UAT scope was defined before execution began"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "uat_no_silent_scope_edits_during_round",
      "status": "pass",
      "evidence": "scope / method: no silent scope edits were made mid-UAT"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "uat_acceptance_criteria_list_declared",
      "status": "pass",
      "evidence": "criteria: the declared record names its acceptance-criterion rows \u2014 the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no criteria at all"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "every_uat_acceptance_criterion_id_unique",
      "status": "pass",
      "evidence": "criteria: no declared criterion_id is owned by more than one row"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "every_uat_acceptance_criterion_description_declared",
      "status": "pass",
      "evidence": "criteria: every declared criterion declares a non-empty description"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "uat_scenarios_list_declared",
      "status": "pass",
      "evidence": "scenarios: the declared record names its UAT scenario rows \u2014 the list is present and names at least one scenario; an absent list is missing evidence and an empty list declares no scenarios at all"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "every_uat_scenario_id_unique",
      "status": "pass",
      "evidence": "scenarios: no declared scenario_id is owned by more than one row"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "every_uat_scenario_covers_at_least_one_criterion",
      "status": "pass",
      "evidence": "scenarios: every declared scenario names at least one acceptance criterion it covers"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "every_uat_scenario_criterion_reference_declared_criterion",
      "status": "fail",
      "evidence": "scenarios: every criterion_id a declared scenario names is one of the declared acceptance criteria"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "every_uat_acceptance_criterion_covered_by_scenario",
      "status": "fail",
      "evidence": "scope / quality gate: every acceptance criterion is mapped to at least one UAT scenario"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "uat_declared_criteria_count_matches_rows",
      "status": "pass",
      "evidence": "declared totals: the declared acceptance-criteria count recomputes exactly against the declared criterion rows"
    },
    {
      "section": "scope_and_criteria_mapping",
      "check": "uat_declared_scenarios_count_matches_rows",
      "status": "pass",
      "evidence": "declared totals: the declared scenarios count recomputes exactly against the declared scenario rows"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "uat_environment_staging_mirrors_production",
      "status": "pass",
      "evidence": "environment: staging mirrors production for this UAT round"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "uat_environment_test_data_realistic",
      "status": "pass",
      "evidence": "environment: the UAT data used was realistic"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "uat_production_data_anonymized_where_production_data_used",
      "status": "pass",
      "evidence": "no production data use declared"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "uat_business_owner_owns_round",
      "status": "pass",
      "evidence": "people: the business owner owns this UAT round"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "uat_business_owner_executes_round",
      "status": "pass",
      "evidence": "people: the business owner executes this UAT round"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "uat_supporting_team_assigned",
      "status": "pass",
      "evidence": "people: the supporting team was assigned to this UAT round"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "uat_scribe_assigned",
      "status": "pass",
      "evidence": "people: one scribe was assigned to this UAT round"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "every_uat_scenario_steps_recorded",
      "status": "fail",
      "evidence": "scripts: every declared scenario declares its steps recorded"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "every_uat_scenario_expected_outcome_declared",
      "status": "pass",
      "evidence": "scripts: every declared scenario declares a non-empty expected outcome"
    },
    {
      "section": "environment_people_and_scripts",
      "check": "every_uat_scenario_timeboxed",
      "status": "pass",
      "evidence": "scripts: every declared scenario is declared timeboxed"
    },
    {
      "section": "execution_and_results",
      "check": "uat_round_execution_window_completed",
      "status": "pass",
      "evidence": "execution: the UAT execution window for this round was completed"
    },
    {
      "section": "execution_and_results",
      "check": "uat_deviations_logged_as_defects",
      "status": "pass",
      "evidence": "execution / method: deviations found in UAT were logged as defects"
    },
    {
      "section": "execution_and_results",
      "check": "every_uat_scenario_result_recognised",
      "status": "pass",
      "evidence": "execution: every declared scenario's result is one of passed, failed, blocked, not_run"
    },
    {
      "section": "execution_and_results",
      "check": "every_uat_scenario_result_recorded_as_executed",
      "status": "pass",
      "evidence": "execution: every declared scenario is declared executed \u2014 its result is not not_run"
    },
    {
      "section": "execution_and_results",
      "check": "uat_declared_executed_scenarios_count_matches_rows",
      "status": "pass",
      "evidence": "declared totals: the declared executed-scenarios count recomputes exactly against the declared scenario results"
    },
    {
      "section": "execution_and_results",
      "check": "every_uat_failed_or_blocked_scenario_has_defect_record",
      "status": "pass",
      "evidence": "execution: every failed or blocked declared scenario names at least one declared defect row"
    },
    {
      "section": "defects_and_triage",
      "check": "uat_defects_list_declared",
      "status": "pass",
      "evidence": "defects: the declared record names its defect rows \u2014 the list is present; an empty list declares that the round found no defects, and an absent list is missing evidence"
    },
    {
      "section": "defects_and_triage",
      "check": "every_uat_defect_id_unique",
      "status": "pass",
      "evidence": "defects: no declared defect_id is owned by more than one row"
    },
    {
      "section": "defects_and_triage",
      "check": "every_uat_defect_scenario_reference_declared_scenario",
      "status": "pass",
      "evidence": "defects: every declared defect names a scenario_id among the declared scenarios"
    },
    {
      "section": "defects_and_triage",
      "check": "every_uat_defect_severity_declared",
      "status": "pass",
      "evidence": "defects / quality gate: every declared defect declares a non-empty severity \u2014 defects are classified"
    },
    {
      "section": "defects_and_triage",
      "check": "every_uat_defect_disposition_recognised",
      "status": "pass",
      "evidence": "defects / quality gate: every declared defect's disposition is one of fix_now, accept_with_note, defer_with_date \u2014 the triage dispositions the skill names"
    },
    {
      "section": "defects_and_triage",
      "check": "every_uat_accepted_defect_disposition_note_declared",
      "status": "pass",
      "evidence": "defects: every defect dispositioned accept_with_note declares a non-empty disposition note"
    },
    {
      "section": "defects_and_triage",
      "check": "every_uat_deferred_defect_disposition_date_declared",
      "status": "pass",
      "evidence": "defects: every defect dispositioned defer_with_date declares a non-empty defer date"
    },
    {
      "section": "defects_and_triage",
      "check": "uat_triage_held_daily_during_round",
      "status": "pass",
      "evidence": "triage / method: defects were triaged daily during this UAT round"
    },
    {
      "section": "defects_and_triage",
      "check": "uat_declared_defects_count_matches_rows",
      "status": "pass",
      "evidence": "declared totals: the declared defects count recomputes exactly against the declared defect rows"
    },
    {
      "section": "sign_off_record",
      "check": "uat_sign_off_outcome_recognised",
      "status": "pass",
      "evidence": "sign-off / quality gate: the declared sign-off outcome is one of pass, conditional_pass \u2014 the explicit outcomes the skill names; sign-off is an artifact, not a vibe"
    },
    {
      "section": "sign_off_record",
      "check": "uat_sign_off_required_roles_list_declared",
      "status": "pass",
      "evidence": "sign-off: the declared record names its required sign-off roles \u2014 the list is present and names at least one role; an absent list is missing evidence and an empty list declares no required sign-off at all"
    },
    {
      "section": "sign_off_record",
      "check": "every_uat_required_sign_off_role_unique",
      "status": "pass",
      "evidence": "sign-off: no declared required role is named more than once"
    },
    {
      "section": "sign_off_record",
      "check": "uat_sign_offs_list_declared",
      "status": "pass",
      "evidence": "sign-off: the declared record names its sign-off rows \u2014 the list is present and names at least one sign-off; an absent list is missing evidence and an empty list declares no sign-off recorded at all"
    },
    {
      "section": "sign_off_record",
      "check": "every_uat_sign_off_role_declared_required",
      "status": "pass",
      "evidence": "sign-off: every declared sign-off row names a role among the declared required sign-off roles"
    },
    {
      "section": "sign_off_record",
      "check": "every_uat_required_role_signed_off",
      "status": "pass",
      "evidence": "sign-off / quality gate: every declared required role has a sign-off row declared signed"
    },
    {
      "section": "sign_off_record",
      "check": "every_uat_sign_off_signer_named",
      "status": "pass",
      "evidence": "sign-off: every declared sign-off row names its signer \u2014 a sign-off is by a named role-holder, never granted by this atom"
    },
    {
      "section": "sign_off_record",
      "check": "every_uat_sign_off_marked_signed",
      "status": "pass",
      "evidence": "sign-off: every declared sign-off row is declared signed"
    },
    {
      "section": "sign_off_record",
      "check": "uat_conditional_sign_off_open_items_listed_where_conditional",
      "status": "pass",
      "evidence": "no conditional pass declared"
    },
    {
      "section": "sign_off_record",
      "check": "uat_conditional_sign_off_owner_named_where_conditional",
      "status": "pass",
      "evidence": "no conditional pass declared"
    },
    {
      "section": "sign_off_record",
      "check": "uat_sign_off_not_pass_while_blocker_defect_open",
      "status": "pass",
      "evidence": "sign-off / red line: a declared pass outcome does not stand while a defect declaring severity blocker is not declared resolved"
    },
    {
      "section": "sign_off_record",
      "check": "uat_declared_sign_off_roles_count_matches_required_roles",
      "status": "pass",
      "evidence": "declared totals: the declared sign-off roles count recomputes exactly against the declared required sign-off roles"
    },
    {
      "section": "retest_and_regression_after_fixes",
      "check": "uat_changed_scenarios_retested_where_fixes_made",
      "status": "pass",
      "evidence": "no UAT fixes declared made"
    },
    {
      "section": "retest_and_regression_after_fixes",
      "check": "uat_touched_flows_regression_completed_where_fixes_made",
      "status": "pass",
      "evidence": "no UAT fixes declared made"
    },
    {
      "section": "retest_and_regression_after_fixes",
      "check": "uat_retest_results_recorded_where_fixes_made",
      "status": "pass",
      "evidence": "no UAT fixes declared made"
    },
    {
      "section": "retest_and_regression_after_fixes",
      "check": "every_uat_fix_now_defect_marked_resolved",
      "status": "pass",
      "evidence": "re-test: every defect dispositioned fix_now is declared resolved"
    },
    {
      "section": "red_lines",
      "check": "uat_free_of_production_data_without_anonymization",
      "status": "fail",
      "evidence": "red line: no UAT on production data without anonymization is present in the record"
    },
    {
      "section": "red_lines",
      "check": "uat_free_of_passed_while_blockers_open",
      "status": "pass",
      "evidence": "red line: no passed outcome while blockers are open is present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "uat_acceptance_criteria_count": 1,
  "uat_scenarios_count": 1,
  "uat_executed_scenarios_count": 1,
  "uat_defects_count": 0,
  "uat_sign_offs_count": 1,
  "uat_required_sign_off_roles_count": 1,
  "duplicate_uat_criterion_ids": [],
  "duplicate_uat_scenario_ids": [],
  "duplicate_uat_defect_ids": [],
  "duplicate_uat_required_sign_off_roles": [],
  "duplicate_uat_sign_off_roles": [],
  "uat_criteria_without_description": [],
  "uat_criteria_not_covered_by_any_scenario": [
    "C1"
  ],
  "uat_scenarios_without_criterion_reference": [],
  "uat_scenarios_with_unknown_criterion_reference": [
    "S1"
  ],
  "uat_scenarios_without_steps_recorded": [
    "S1"
  ],
  "uat_scenarios_without_expected_outcome": [],
  "uat_scenarios_not_timeboxed": [],
  "uat_scenarios_with_invalid_result": [],
  "uat_scenarios_not_executed": [],
  "uat_failed_or_blocked_scenarios_without_defect": [],
  "uat_defects_with_unknown_scenario_reference": [],
  "uat_defects_without_severity": [],
  "uat_defects_with_invalid_disposition": [],
  "uat_accepted_defects_without_note": [],
  "uat_deferred_defects_without_date": [],
  "uat_fix_now_defects_unresolved": [],
  "uat_open_blocker_defect_ids": [],
  "uat_sign_offs_with_unknown_role": [],
  "uat_sign_offs_without_signer_name": [],
  "uat_sign_offs_not_signed": [],
  "uat_required_roles_without_signed_sign_off": [],
  "uat_criterion_coverage_ratio": "0.000000",
  "uat_scenario_execution_ratio": "1.000000",
  "uat_scenario_pass_ratio": "1.000000",
  "uat_defect_disposition_ratio": null,
  "uat_sign_off_completion_ratio": "1.000000",
  "summary": "51 pass, 5 fail, 0 missing of 56 checks across seven sections.",
  "stamp": "UAT SCENARIO SIGN-OFF PACK\nuat_round_title: Release 1.0 UAT\nVERDICT: UAT_SIGN_OFF_NOT_SOUND\n  scope_and_criteria_mapping                   fail\n  environment_people_and_scripts               fail\n  execution_and_results                        pass\n  defects_and_triage                           pass\n  sign_off_record                              pass\n  retest_and_regression_after_fixes            pass\n  red_lines                                    fail\n51 pass, 5 fail, 0 missing of 56 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T14:11:59.125272+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/uat-scenario-sign-off-pack/evidence.json`.

Input:

```json
{
  "uat_round_title": "Malformed Round",
  "scope": "not-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scope",
  "detail": "scope must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — a declared-record audit; SERVICE.md's U-13 screen is (a) No outright (declared-record audit; screen states No outright), so no regulator role view is provided for this atom (see Role views) |
| Checks named | 56 documented / 56 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (the six counts, the five duplicate lists, the twenty-one row-name lists and the five ratios) |
| Input reference typed | Yes — 65 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/uat-scenario-sign-off-pack/evidence.json` |
