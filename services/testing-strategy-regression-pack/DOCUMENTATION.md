# Testing strategy regression pack — documentation
**Testing strategy regression pack** · slug `testing-strategy-regression-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment 22647267ae414ecbb3a5ee342afd73f8; RC soak to 2026-11-22).
Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).
This atom audits a caller-declared testing strategy + regression plan record for completeness and internal consistency only, and recomputes coverage over the declared rows. It surfaces two faces: REST `POST /v1/testing-strategy-regression-pack` and MCP `POST /mcp/testing-strategy-regression-pack`. It runs no tests, executes no suite, inspects no code and guarantees nothing about the software — see Explanation.
This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.
> **Status discrepancy named:** SERVICE.md still says Tier B · status: **AUTHORED + STAGED — not deployed** — “no endpoint is live”, and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/testing-strategy-regression-pack/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment 22647267ae414ecbb3a5ee342afd73f8). This document follows the evidenced live state above. See Discrepancies.
## Tutorial
A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the plan `Core Service Regression`); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.
**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "testing-strategy-regression-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.
**Step 2 — Assemble the testing strategy + regression plan manifest.** You declare a testing strategy and regression plan record for one system / change set, made from the plan as actually drawn up — the atom audits the declared record, it does not test anything for you (see Explanation). The recorded full-pass manifest declares the plan `Core Service Regression`: all five scoping flags `true`; one risk `r1` (description `Auth failure`, `is_p0` `true`); all five level-planning flags `true`; three test-level rows `l1`/`l2`/`l3` for `r1` at `unit`/`integration`/`e2e`; all three regression-planning flags `true`; one change `c1` (kind `defect_fix`, description `Fix login bug`); one regression row `reg1` for `c1` (`kept_permanently` `true`); all five fixture flags `true`; a flake policy with `known_flakes_present` `false` and the other three flags `true` (so `quarantine_ticket_recorded` is not required in this record and its check passes as not applicable); all five negative-testing flags `true`; all seven entry/exit/reporting flags `true`; and all three red-line flags `false` (no test depends on a production system, no test depends on live data, no assertion was weakened to fix a test).
**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/testing-strategy-regression-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.
**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `TESTING_STRATEGY_SOUND`: "58 pass, 0 fail, 0 missing of 58 checks across eight sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `risk_rows_count` is 1, `test_level_rows_count` is 3, `declared_changes_count` is 1, `regression_rows_count` is 1, the per-level counts are each 1, all sixteen duplicate / row-name lists are empty (`[]`), and all four ratios are `"1.000000"`.
**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `TESTING_STRATEGY_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.
## How-to guides
### Get a key and call via REST
1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "testing-strategy-regression-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/testing-strategy-regression-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.
### Call via MCP
1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/testing-strategy-regression-pack` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `testing_strategy_regression_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.
### Read a failing verdict and fix the manifest
A verdict of `TESTING_STRATEGY_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_testing_strategy_risk_description_declared`, `every_testing_strategy_test_level_row_risk_reference_resolves`, `every_regression_pack_regression_row_kept_permanently` and `testing_strategy_free_of_production_system_dependency`, and the summary reads "54 pass, 4 fail, 0 missing of 58 checks across eight sections."
1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `risk_rows[0].description` is `""`, failing `every_testing_strategy_risk_description_declared`, with `risks_without_description` naming `["r1"]`; `test_level_rows[0].risk_id` is `nonexistent`, failing `every_testing_strategy_test_level_row_risk_reference_resolves`, with `test_level_rows_with_unknown_risk_reference` naming `["l1"]`; `regression_rows[0].kept_permanently` is `false`, failing `every_regression_pack_regression_row_kept_permanently`, with `regression_rows_not_declared_permanent` naming `["reg1"]`; and `red_lines.tests_depend_on_production_systems_present` is `true`, failing `testing_strategy_free_of_production_system_dependency`; sections `scope_and_risk_declaration`, `test_levels_and_pyramid`, `regression_coverage` and `red_lines` report `fail`, the other four sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`, while all four ratios stay `"1.000000"`). Declare only what is true of the actual record. For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.
### Handle a 422 invalid_input
A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:
```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scoping",
  "detail": "scoping must be an object"
}
```
(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.
## Reference
### Endpoints
- **REST:** `POST https://atoms.pipavia.com/v1/testing-strategy-regression-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/testing-strategy-regression-pack` — tool name `testing_strategy_regression_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `testing_strategy_regression_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).
### Input reference
One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `plan_title`, `risk_rows[].risk_id`, `risk_rows[].description`, `test_level_rows[].level_row_id`, `test_level_rows[].risk_id`, `test_level_rows[].test_level`, `declared_changes[].change_id`, `declared_changes[].change_kind`, `declared_changes[].description`, `regression_rows[].regression_id` and `regression_rows[].change_id` are noted as strings (descriptions as non-empty strings), `risk_rows[].is_p0` and `regression_rows[].kept_permanently` as booleans, and `risk_rows`, `test_level_rows`, `declared_changes` and `regression_rows` as lists there. Where SERVICE.md states no type — the section container objects (`scoping`, `level_planning`, `regression_planning`, `fixtures`, `flake_policy`, `negative_testing`, `entry_exit_and_reporting`, `red_lines`) and the row objects (`risk_rows[]`, `test_level_rows[]`, `declared_changes[]`, `regression_rows[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers, in the MCP `inputSchema` recorded in evidence.json, which types the containers `object`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `TESTING_STRATEGY_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.
#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `plan_title` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: scope_and_risk_declaration

| Field | Type | Notes |
|---|---|---|
| `scoping` | object | The scoping section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `scoping.scope_declared` | boolean | — |
| `scoping.risks_identified_before_planning` | boolean | — |
| `scoping.p0_flows_identified` | boolean | — |
| `scoping.test_plan_document_present` | boolean | — |
| `scoping.test_plan_states_exclusions` | boolean | — |
| `risk_rows` | list | List of risk-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). Note: the recorded MCP `inputSchema` types this field `object`, not `array` — see Discrepancies |
| `risk_rows[]` | object | One declared risk row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `risk_rows[].risk_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |
| `risk_rows[].description` | non-empty string | Must be non-empty per row (type stated in SERVICE.md) |
| `risk_rows[].is_p0` | boolean | Must be present per row (type stated in SERVICE.md) |

#### Read by: test_levels_and_pyramid

| Field | Type | Notes |
|---|---|---|
| `level_planning` | object | The level-planning section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `level_planning.pyramid_applied` | boolean | — |
| `level_planning.logic_tested_at_unit_level` | boolean | — |
| `level_planning.boundaries_tested_at_integration_level` | boolean | — |
| `level_planning.critical_journeys_tested_at_e2e_level` | boolean | — |
| `level_planning.tricky_edge_cases_tested_at_unit_level` | boolean | — |
| `test_level_rows` | list | List of test-level-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). Note: the recorded MCP `inputSchema` types this field `object`, not `array` — see Discrepancies |
| `test_level_rows[]` | object | One declared test-level row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `test_level_rows[].level_row_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |
| `test_level_rows[].risk_id` | string | Computed — must name a declared risk (type stated in SERVICE.md) |
| `test_level_rows[].test_level` | string | Computed — one of `unit`, `integration`, `e2e` (type stated in SERVICE.md) |

#### Read by: regression_coverage

| Field | Type | Notes |
|---|---|---|
| `regression_planning` | object | The regression-planning section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `regression_planning.regression_test_written_before_defect_fix` | boolean | — |
| `regression_planning.regression_tests_kept_permanently` | boolean | — |
| `regression_planning.every_fixed_bug_has_regression_test` | boolean | — |
| `declared_changes` | list | List of change-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). Note: the recorded MCP `inputSchema` types this field `object`, not `array` — see Discrepancies |
| `declared_changes[]` | object | One declared change row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `declared_changes[].change_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |
| `declared_changes[].change_kind` | string | Computed — one of `feature`, `defect_fix`, `refactor` (type stated in SERVICE.md) |
| `declared_changes[].description` | non-empty string | Must be non-empty per row (type stated in SERVICE.md) |
| `regression_rows` | list | List of regression-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). Note: the recorded MCP `inputSchema` types this field `object`, not `array` — see Discrepancies |
| `regression_rows[]` | object | One declared regression row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `regression_rows[].regression_id` | string | Names the row in the computed outputs; must be unique per row (type stated in SERVICE.md) |
| `regression_rows[].change_id` | string | Computed — must name a declared change (type stated in SERVICE.md) |
| `regression_rows[].kept_permanently` | boolean | Must be `true` per row |

#### Read by: fixtures_and_determinism

| Field | Type | Notes |
|---|---|---|
| `fixtures` | object | The fixtures section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `fixtures.no_shared_mutable_state` | boolean | — |
| `fixtures.explicit_seed_data_used` | boolean | — |
| `fixtures.time_controlled` | boolean | — |
| `fixtures.randomness_controlled` | boolean | — |
| `fixtures.fixtures_declared_for_suites` | boolean | — |

#### Read by: flake_policy

| Field | Type | Notes |
|---|---|---|
| `flake_policy` | object | The flake-policy section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `flake_policy.known_flakes_present` | boolean | Gates the quarantine-ticket check below |
| `flake_policy.flakes_quarantined_immediately` | boolean | — |
| `flake_policy.flakes_fixed_within_a_week_or_deleted_consciously` | boolean | — |
| `flake_policy.no_quarantined_test_without_tracked_ticket` | boolean | — |
| `flake_policy.quarantine_ticket_recorded` | boolean | Required when known flakes are declared present; otherwise the check passes as not applicable. Absent from the recorded full-pass input, where `known_flakes_present` is `false` |

#### Read by: negative_testing

| Field | Type | Notes |
|---|---|---|
| `negative_testing` | object | The negative-testing section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `negative_testing.invalid_input_tested` | boolean | — |
| `negative_testing.timeouts_tested` | boolean | — |
| `negative_testing.partial_failures_tested` | boolean | — |
| `negative_testing.retries_tested` | boolean | — |
| `negative_testing.sane_failure_asserted` | boolean | — |

#### Read by: entry_exit_and_reporting

| Field | Type | Notes |
|---|---|---|
| `entry_exit_and_reporting` | object | The entry/exit and reporting section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `entry_exit_and_reporting.entry_criteria_declared` | boolean | — |
| `entry_exit_and_reporting.exit_criteria_declared` | boolean | — |
| `entry_exit_and_reporting.full_suite_green_before_handoff` | boolean | — |
| `entry_exit_and_reporting.report_states_what_ran` | boolean | — |
| `entry_exit_and_reporting.report_states_what_passed` | boolean | — |
| `entry_exit_and_reporting.report_states_what_not_covered` | boolean | — |
| `entry_exit_and_reporting.coverage_gaps_stated_explicitly` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.tests_depend_on_production_systems_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.tests_depend_on_live_data_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.assertion_weakened_to_fix_test_present` | boolean | must be `false` to pass — skill red line |

### Checks
All 58 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies). Note on the gated check: the evidence text of the gated quarantine-ticket check is case-dependent — the full-pass run's text is quoted here; when the gate state differs, the recorded response carries the corresponding not-applicable or required-form text instead.

#### Section: scope_and_risk_declaration

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `testing_strategy_scope_declared` | scope: the system / change scope the strategy covers is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_risks_identified_before_planning` | risk-first: the risks were identified before levels were planned — test what breaks expensively | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_p0_flows_identified` | risk-first: the P0 flows are identified in the declared record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_test_plan_document_present` | artifacts: a short test-plan document is present for the work | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_test_plan_states_exclusions` | artifacts: the test plan states what is excluded | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_risk_rows_list_declared` | risk rows: the declared record names its risks — the list is present and names at least one risk; an absent list is missing evidence and an empty list declares no risk-first strategy at all | Computed over the declared record. Pass: the `risk_rows` list is present and names at least one risk. Fail: the list is present but empty. Missing: the list is absent. |
| `every_testing_strategy_risk_id_unique` | risk rows: no declared risk_id is owned by more than one row | Computed over the declared record. Pass: no declared `risk_id` appears on more than one row. Fail: a `risk_id` is declared on more than one row (duplicates are named in `duplicate_risk_ids`). Missing: the list is absent, or a row has `risk_id` absent. |
| `every_testing_strategy_risk_description_declared` | risk rows: every declared risk declares a non-empty description | Computed over the declared record. Pass: every declared risk row declares a non-empty `description`. Fail: a row declares an empty `description` (offending rows are named in `risks_without_description`). Missing: the list is absent, or a row has `description` absent. |
| `every_testing_strategy_risk_p0_status_declared` | risk rows: every declared risk declares whether it is a P0 risk | Computed over the declared record. Pass: every declared risk row declares its `is_p0` status. Fail: — (a present status is not graded). Missing: the list is absent, or a row has `is_p0` absent (offending rows are named in `risks_without_p0_status`). |

#### Section: test_levels_and_pyramid

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `testing_strategy_pyramid_applied` | pyramid: the test pyramid is applied — many unit, fewer integration, few e2e | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_logic_tested_at_unit_level` | pyramid: logic is tested at the unit level | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_boundaries_tested_at_integration_level` | pyramid: boundaries, DB and API are tested at the integration level | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_critical_journeys_tested_at_e2e_level` | pyramid / quality gate: critical journeys are covered end-to-end | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_tricky_edge_cases_tested_at_unit_level` | risk-first: tricky edge cases get unit tests | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_test_level_rows_list_declared` | level rows: the declared record names its test-level rows — the list is present and names at least one row; an absent list is missing evidence and an empty list declares no level plan at all | Computed over the declared record. Pass: the `test_level_rows` list is present and names at least one row. Fail: the list is present but empty. Missing: the list is absent. |
| `every_testing_strategy_test_level_row_id_unique` | level rows: no declared level_row_id is owned by more than one row | Computed over the declared record. Pass: no declared `level_row_id` appears on more than one row. Fail: a `level_row_id` is declared on more than one row (duplicates are named in `duplicate_test_level_row_ids`). Missing: the list is absent, or a row has `level_row_id` absent. |
| `every_testing_strategy_test_level_row_level_recognised` | level rows: every declared row's level is one of unit, integration, e2e — the three levels the skill names | Computed over the declared record. Pass: every declared row's `test_level` is one of `unit`, `integration`, `e2e`. Fail: a row declares any other value (offending rows are named in `test_level_rows_with_invalid_level`). Missing: the list is absent, or a row has `test_level` absent. |
| `every_testing_strategy_test_level_row_risk_reference_resolves` | level rows: every declared row's risk_id names a risk in the declared risk list | Computed over the declared record. Pass: every declared row's `risk_id` names a declared risk. Fail: a row names an undeclared risk (offending rows are named in `test_level_rows_with_unknown_risk_reference`). Missing: the list is absent, a row has `risk_id` absent, or the risk list is absent. |
| `every_testing_strategy_declared_risk_covered_by_level_row` | level rows / risk-first: every declared risk is covered by at least one declared test-level row | Computed over the declared record. Pass: every declared risk is named by at least one level row. Fail: a declared risk is named by no level row (offending risks are named in `declared_risks_without_test_level_row`). Missing: either list is absent. |
| `every_testing_strategy_p0_risk_covered_by_e2e_row` | level rows / risk-first: every declared P0 risk is covered by at least one declared e2e row — P0 flows get e2e | Computed over the declared record. Pass: every risk declared `is_p0: true` is named by at least one e2e row; a record declaring no P0 risks passes vacuously. Fail: a P0 risk is named by no e2e row (offending risks are named in `p0_risks_without_e2e_row`). Missing: either list is absent, or a row's P0 status is absent. |
| `testing_strategy_pyramid_level_counts_in_declared_order` | pyramid: the declared level-row counts follow the skill's stated order — at least one row per level, unit rows >= integration rows >= e2e rows (many / fewer / few) | Computed over the declared record. Pass: at least one row per level, with unit rows >= integration rows >= e2e rows. Fail: the counts break that order or a level has no row. Missing: the list is absent. |

#### Section: regression_coverage

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `regression_pack_regression_test_written_before_defect_fix` | bug -> test: for bug fixes the regression test is written first, before the fix | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `regression_pack_regression_tests_kept_permanently_declared` | bug -> test: a regression test, once written for a confirmed defect, is kept forever | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `regression_pack_every_fixed_bug_has_regression_test_declared` | quality gate: every fixed bug has a regression test | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `regression_pack_declared_changes_list_declared` | declared changes: the declared record names its change rows — the list is present and names at least one change; an absent list is missing evidence and an empty list declares no regression scope at all | Computed over the declared record. Pass: the `declared_changes` list is present and names at least one change. Fail: the list is present but empty. Missing: the list is absent. |
| `every_regression_pack_change_id_unique` | declared changes: no declared change_id is owned by more than one row | Computed over the declared record. Pass: no declared `change_id` appears on more than one row. Fail: a `change_id` is declared on more than one row (duplicates are named in `duplicate_change_ids`). Missing: the list is absent, or a row has `change_id` absent. |
| `every_regression_pack_change_description_declared` | declared changes: every declared change declares a non-empty description | Computed over the declared record. Pass: every declared change row declares a non-empty `description`. Fail: a row declares an empty `description` (offending rows are named in `declared_changes_without_description`). Missing: the list is absent, or a row has `description` absent. |
| `every_regression_pack_change_kind_recognised` | declared changes: every declared change's kind is one of feature, defect_fix, refactor — the work kinds the skill names | Computed over the declared record. Pass: every declared change's `change_kind` is one of `feature`, `defect_fix`, `refactor`. Fail: a row declares any other value (offending rows are named in `declared_changes_with_invalid_kind`). Missing: the list is absent, or a row has `change_kind` absent. |
| `regression_pack_regression_rows_list_declared` | regression rows: the declared record names its regression-suite rows — the list is present and names at least one row; an absent list is missing evidence and an empty list declares no regression suite at all | Computed over the declared record. Pass: the `regression_rows` list is present and names at least one row. Fail: the list is present but empty. Missing: the list is absent. |
| `every_regression_pack_regression_row_id_unique` | regression rows: no declared regression_id is owned by more than one row | Computed over the declared record. Pass: no declared `regression_id` appears on more than one row. Fail: a `regression_id` is declared on more than one row (duplicates are named in `duplicate_regression_row_ids`). Missing: the list is absent, or a row has `regression_id` absent. |
| `every_regression_pack_regression_row_change_reference_resolves` | regression rows: every declared row's change_id names a change in the declared change list | Computed over the declared record. Pass: every declared row's `change_id` names a declared change. Fail: a row names an undeclared change (offending rows are named in `regression_rows_with_unknown_change_reference`). Missing: either list is absent, or a row has `change_id` absent. |
| `every_regression_pack_declared_change_covered_by_regression_row` | regression rows: every declared change is covered by at least one declared regression row | Computed over the declared record. Pass: every declared change is named by at least one regression row. Fail: a declared change is named by no regression row (offending changes are named in `declared_changes_without_regression_row`). Missing: either list is absent. |
| `every_regression_pack_defect_change_covered_by_regression_row` | regression rows / bug -> test: every declared defect_fix change is covered by at least one declared regression row | Computed over the declared record. Pass: every `defect_fix` change is named by at least one regression row; a record declaring no defect changes passes vacuously. Fail: a defect change is named by no regression row (offending changes are named in `defect_changes_without_regression_row`). Missing: either list is absent. |
| `every_regression_pack_regression_row_kept_permanently` | regression rows: every declared regression row is declared kept permanently — it is kept forever | Computed over the declared record. Pass: every declared regression row declares `kept_permanently: true`. Fail: a row declares it `false` (offending rows are named in `regression_rows_not_declared_permanent`). Missing: the list is absent, or a row has the field absent. |

#### Section: fixtures_and_determinism

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `testing_strategy_fixtures_have_no_shared_mutable_state` | fixtures: fixtures have no shared mutable state | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_fixtures_use_explicit_seed_data` | fixtures: fixtures use explicit seed data | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_time_controlled_in_fixtures` | fixtures: time is controlled in the fixtures | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_randomness_controlled_in_fixtures` | fixtures: randomness is controlled in the fixtures | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_fixtures_declared_for_suites` | artifacts / fixtures: fixtures are declared for the suites per level | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: flake_policy

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `testing_strategy_flakes_quarantined_immediately` | flake policy: a flaky test is quarantined immediately | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_flakes_fixed_within_a_week_or_deleted_consciously` | flake policy: a quarantined flake is fixed within a week, or deleted consciously | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_no_quarantined_test_without_tracked_ticket_declared` | quality gate: no skipped or quarantined test is left without a tracked ticket | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_quarantine_ticket_recorded_where_flakes_present` | no known flakes declared present | Computed-gated over the declared record. Pass: `flake_policy.known_flakes_present` is declared `false` (the check passes as not applicable), or it is declared `true` and `flake_policy.quarantine_ticket_recorded` is declared `true`. Fail: known flakes are declared present and the ticket field is declared `false`. Missing: the gate field is absent, or known flakes are declared present and the field is absent. |

#### Section: negative_testing

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `testing_strategy_negative_invalid_input_tested` | negative testing: invalid input is tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_negative_timeouts_tested` | negative testing: timeouts are tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_negative_partial_failures_tested` | negative testing: partial failures are tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_negative_retries_tested` | negative testing: retries are tested | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_negative_sane_failure_asserted` | negative testing: sane failure is asserted, not just "no crash" | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: entry_exit_and_reporting

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `testing_strategy_entry_criteria_declared` | entry / exit: the entry criteria for testing are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_exit_criteria_declared` | entry / exit: the exit criteria for testing are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_full_suite_green_before_handoff` | quality gate: the full suite is green before handoff | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_report_states_what_ran` | honest reporting: the report states what ran | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_report_states_what_passed` | honest reporting: the report states what passed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_report_states_what_not_covered` | honest reporting: the report states what is NOT covered | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `testing_strategy_coverage_gaps_stated_explicitly` | quality gate: coverage gaps are stated explicitly in the report | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `testing_strategy_free_of_production_system_dependency` | red line: no test depends on a production system | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `testing_strategy_free_of_live_data_dependency` | red line: no test depends on live data | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `testing_strategy_free_of_assertion_weakened_to_fix_test` | red line: no test was "fixed" by weakening its assertion — the code was fixed, or the test deleted deliberately | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format
HTTP 200 returns one JSON object, with these top-level fields in the recorded order:
- `service` (`"testing-strategy-regression-pack"`), `atom_version` (`"0.1.0"`), and `plan_title` (the manifest's declared plan title value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `risk_rows_count`, `test_level_rows_count`, `declared_changes_count` and `regression_rows_count` (the declared list lengths as integers, or null when a list is not declared); `unit_level_row_count`, `integration_level_row_count` and `e2e_level_row_count` (the per-level row counts; null when the test-level list is not declared, as recorded in the sparse case); `duplicate_risk_ids`, `duplicate_test_level_row_ids`, `duplicate_change_ids` and `duplicate_regression_row_ids` (ids declared on more than one row; each null when its list is not declared, as recorded in the sparse case); the row-name lists `risks_without_description`, `risks_without_p0_status`, `test_level_rows_with_invalid_level`, `test_level_rows_with_unknown_risk_reference`, `declared_risks_without_test_level_row`, `p0_risks_without_e2e_row`, `declared_changes_without_description`, `declared_changes_with_invalid_kind`, `regression_rows_with_unknown_change_reference`, `declared_changes_without_regression_row`, `defect_changes_without_regression_row` and `regression_rows_not_declared_permanent` (the offending rows for each computed rule; each null when its underlying list is not declared, as recorded in the sparse case); and the ratios `risk_level_coverage_ratio` (declared risks covered by at least one level row ÷ declared risks), `p0_e2e_coverage_ratio` (P0 risks covered by an e2e row ÷ declared P0 risks), `change_regression_coverage_ratio` (declared changes covered by a regression row ÷ declared changes) and `defect_regression_coverage_ratio` (defect changes covered by a regression row ÷ declared defect changes) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty (the P0 ratio is null when no P0 risk is declared; the defect ratio is null when no defect change is declared). Computed ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "58 pass, 0 fail, 0 missing of 58 checks across eight sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared plan title value, verdict and per-section statuses) for human-readable records.
### Verdict vocabulary
**Verdicts** (the top-level `verdict` field):

- `TESTING_STRATEGY_SOUND` — all 58 checks pass: the declared testing strategy + regression plan record is complete and consistent with the bound skill's method, quality gates and red lines.
- `TESTING_STRATEGY_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.
**`computed_status`** (computed checks only — the twenty-one primary computed checks named in SERVICE.md): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the twenty-one primary computed checks cannot be completed because the rows or fields it reads are absent.
**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.
**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for the gated check, including passes as not applicable when its gate is off); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.
**Secondary computed fields:** `risk_rows_count`, `test_level_rows_count`, `declared_changes_count`, `regression_rows_count`, `unit_level_row_count`, `integration_level_row_count`, `e2e_level_row_count`, `duplicate_risk_ids`, `duplicate_test_level_row_ids`, `duplicate_change_ids`, `duplicate_regression_row_ids`, `risks_without_description`, `risks_without_p0_status`, `test_level_rows_with_invalid_level`, `test_level_rows_with_unknown_risk_reference`, `declared_risks_without_test_level_row`, `p0_risks_without_e2e_row`, `declared_changes_without_description`, `declared_changes_with_invalid_kind`, `regression_rows_with_unknown_change_reference`, `declared_changes_without_regression_row`, `defect_changes_without_regression_row`, `regression_rows_not_declared_permanent`, `risk_level_coverage_ratio`, `p0_e2e_coverage_ratio`, `change_regression_coverage_ratio` and `defect_regression_coverage_ratio` — each defined in Output format above, with the values and null rules recorded there.
### Errors
A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.
| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"scoping","detail":"scoping must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |
### Rate limits and pricing
- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.
## Explanation
**What the atom does.** Test at the right level for each risk — unit, integration, end-to-end — plus regression per defect and flake control (the bound capability, from the skill). You submit one declared record — the testing strategy + regression plan manifest, made from the plan as actually drawn up — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 8 sections (`scope_and_risk_declaration`, `test_levels_and_pyramid`, `regression_coverage`, `fixtures_and_determinism`, `flake_policy`, `negative_testing`, `entry_exit_and_reporting`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. This atom shares zero checks with its nearest siblings `designed-test-case-pack`, `uat-scenario-sign-off-pack` and `correctness-verification-certificate` (SERVICE.md, Distinct ground): every check here is a testing-strategy question — individual designed test cases, business-user acceptance scenarios and their sign-off, and correctness proof claims are those atoms' ground, not this one's.
**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* (36) read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* (21 primary) are calculated from the declared rows themselves — the `risk_rows` list must be present and name at least one risk with unique ids, a non-empty description and a declared P0 status per row; the `test_level_rows` list must be present and name at least one row with unique ids, recognised levels, risk references that resolve, every declared risk covered, every P0 risk covered by an e2e row, and pyramid counts in the stated order; the `declared_changes` list must be present with unique ids, non-empty descriptions and recognised kinds; and the `regression_rows` list must be present with unique ids, change references that resolve, every declared change (and every defect change) covered, and every row kept permanently — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. *One gated check* follows the record's own declared gate field: the quarantine-ticket check is required only where `flake_policy.known_flakes_present` is declared `true`; with the gate off it passes as not applicable, and with the gate field absent it is `missing`. Aggregation is strict: any `fail` anywhere produces `TESTING_STRATEGY_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `TESTING_STRATEGY_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.
**Thresholds declined.** The skill states no numeric coverage threshold at all — its demands are the pyramid's stated order, risk-first level assignment, regression per defect, deterministic fixtures, flake control, negative testing and honest gap reporting, not bars the atom can set. Declined, named, exactly as SERVICE.md names them: a code-coverage percentage bar (coverage is a signal, not a goal — no percentage is imported); a minimum or maximum number of risks, level rows, changes or regression rows beyond at least one each and the pyramid's stated count order; a test-count-per-risk bar beyond one covering level row (and one e2e row for P0 risks, as the skill states); a suite runtime or speed bar; a flake-rate bar; a defect-escape or pass-rate bar; any judgment that a declared test is well designed, that a declared level is the *right* level for a risk beyond the skill's stated assignments, or that the strategy will in fact catch defects (only that its declared record contains what the skill requires). Quantities are computed and reported; the only bars on the computed rows are exact coverage and consistency over the caller's own declared rows.
**What it does NOT do.** The atom reviews a **declared** testing strategy + regression plan record: a verdict of `TESTING_STRATEGY_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its risks covered, its regression rows permanent and its suite green passes those checks even if the real plan did none of it. It is a completeness and consistency audit of the plan record the skill requires, **not a testing service, a test execution, or a guarantee that the software works**. Specifically: it runs no tests, executes no suite, inspects no code, opens no repository, measures no coverage and verifies no test result against the world. It never judges whether a declared test is well written, whether a declared risk is the real risk, whether the declared levels will catch the defects that matter, or whether the product should ship — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions: writing the tests themselves; running any suite; designing individual test cases (the `designed-test-case-pack` sibling's ground); business acceptance testing and its sign-off (the `uat-scenario-sign-off-pack` sibling's ground); fixing defects or flakes; and measuring actual coverage — each is EXCLUDED by name from this atom, which audits only the declared record of those steps. Boundary cases, named: a plan declaring no P0 risk passes the P0-e2e computed check vacuously and reports a null P0 ratio (the atom does not decide that a real P0 flow was misclassified); a plan declaring no defect change likewise passes the defect-regression check vacuously with a null defect ratio; the pyramid check requires at least one declared row per level, so a genuinely unit-only library plan cannot pass this record format's pyramid check — such a plan is outside this atom's computed reach, not failed on its merits.
**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: QA planning for product builds (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.
## Role views
### For regulators
*Regulators: N/A — this atom audits a declared testing strategy + regression plan record; SERVICE.md's U-13 screen is (a) No outright, stating that its output could not read as regulated professional advice — it audits a caller-declared record against its bound skill for completeness and internal consistency only (scope / risk, level, change and regression declarations, coverage recomputed over the declared rows, fixture, flake, negative-testing, entry / exit and reporting declarations, and the red lines refused), offering no engineering-practice, financial, securities or psychology-adjacent advice, producing no test, no code and no recommendation about any system, and setting no threshold on any subject matter. No regulator role view is provided for this atom.*
### For integrators (Users)
You need: a gateway key with the `testing_strategy_regression_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).
### For developers
Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/testing_strategy_regression_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_testing_strategy_regression_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.
### For ops
Endpoints: `POST /v1/testing-strategy-regression-pack` (REST) and `POST /mcp/testing-strategy-regression-pack` (MCP, tool `testing_strategy_regression_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment 22647267ae414ecbb3a5ee342afd73f8; RC soak to 2026-11-22). Key scope: `testing_strategy_regression_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).
## Discrepancies
Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.
1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **AUTHORED + STAGED — not deployed** — “no endpoint is live”, and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment 22647267ae414ecbb3a5ee342afd73f8) shows the atom live. This document follows the evidenced live state: live. The same staleness touches SERVICE.md's U-13 section, which records that “no deploy happens on this atom without the owner's explicit per-unit ruling in any case” — the recorded deployment exists; the screen classification itself is (a) No outright (see Role views, For regulators).
2. **Check names differ from input field names:** the recorded check names do not match the leaf names of the input fields they read. The attestation checks carry a `testing_strategy_` prefix (and, for the regression attestation checks, a `regression_pack_` prefix) and in places a rewording (for example `testing_strategy_fixtures_have_no_shared_mutable_state` reads `fixtures.no_shared_mutable_state`; `testing_strategy_time_controlled_in_fixtures` reads `fixtures.time_controlled`; `regression_pack_regression_tests_kept_permanently_declared` reads `regression_planning.regression_tests_kept_permanently`). The 21 computed checks read the declared rows rather than any single input field of the same name (for example `every_testing_strategy_risk_description_declared` reads rows' `description`, and `testing_strategy_pyramid_level_counts_in_declared_order` reads the `test_level_rows` counts per level). The gated check names its gate and target jointly (`testing_strategy_quarantine_ticket_recorded_where_flakes_present` reads gate `flake_policy.known_flakes_present` and target `flake_policy.quarantine_ticket_recorded`). In `red_lines` all three recorded check names are `testing_strategy_free_of_…` forms of their `…_present` fields. Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md, and list types misstated in the recorded MCP `inputSchema`:** SERVICE.md states no type for the section container objects (`scoping`, `level_planning`, `regression_planning`, `fixtures`, `flake_policy`, `negative_testing`, `entry_exit_and_reporting`, `red_lines`) or for a row object (`risk_rows[]`, `test_level_rows[]`, `declared_changes[]`, `regression_rows[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and, for the top-level containers, in the recorded MCP `inputSchema`, and are said so there. The recorded MCP `inputSchema` itself types the four list fields (`risk_rows`, `test_level_rows`, `declared_changes`, `regression_rows`) as `object`, not `array` — SERVICE.md's table and the recorded evidence inputs (which carry JSON arrays for all four) govern; the schema's typing is recorded here as a discrepancy, and the Input reference notes it on each list row.
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts, and its sparse-case row names the null computed fields only in summary form). The recorded REST response carries all 58 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md:** SERVICE.md's output paragraph states the null rules for `computed_status`, the four main counts (`risk_rows_count`, `test_level_rows_count`, `declared_changes_count`, `regression_rows_count`) and the four ratios, but does not state a null rule for the per-level counts (`unit_level_row_count`, `integration_level_row_count`, `e2e_level_row_count`), for the four duplicate-id lists, or for the twelve row-name lists. The recorded sparse response returns all of them as `null` when the list they are computed from is not declared (as the Output format section records); this document follows the recording.
6. **Section groupings merging input objects:** three recorded sections each merge more than one input object — `scoping` and `risk_rows` inputs are both read by the single recorded section `scope_and_risk_declaration`; `level_planning` and `test_level_rows` inputs by `test_levels_and_pyramid`; and `regression_planning`, `declared_changes` and `regression_rows` inputs by `regression_coverage`. The other five recorded sections map one-to-one onto their input objects (`fixtures` → `fixtures_and_determinism`, `flake_policy` → `flake_policy`, `negative_testing` → `negative_testing`, `entry_exit_and_reporting` → `entry_exit_and_reporting`, `red_lines` → `red_lines`). This document groups the Input reference and the Checks by the recorded section names, with those mergings named in place.
7. **Gated-check evidence text is case-dependent:** the evidence text quoted in the Checks section is the full-pass run's text. For the gated quarantine-ticket check the recorded text changes with the gate state — in the full-pass run it is “no known flakes declared present”, while a record with known flakes declared present carries the required-form text instead. No single evidence string per gated check exists in the recordings; the Checks section says so at its head.
8. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (7 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named a prose phrase `Description per risk`, a prose phrase "Every level row's risk reference resolves", and a section name `red_lines`, instead of exact check names (R1 ×3); the full-pass and violations `expect` blocks carried their computed quantities only in prose notes, with no structured `computed_spot_checks` (R2 ×2); the designed violations input was missing key paths present in the full-pass manifest (R3 ×1); and the designed malformed input carried 2 type violations (`plan_title` and `scoping`) instead of exactly one (R4 ×1) — the corrected malformed input carries exactly one (`scoping`), although the `notes` field of the recorded malformed case in cases.json still describes both fields. These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.
## Worked examples
Provenance: recorded 2026-11-16T14:11:10.261582+00:00 against gateway v1.1.0, external verification battery Wave 16, source `verification/work/testing-strategy-regression-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.
### Example 1 — Full-pass (case `full-pass`)
Provenance: recorded 2026-11-16T14:11:10.261582+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/testing-strategy-regression-pack/evidence.json`.
Input:

```json
{
  "plan_title": "Core Service Regression",
  "scoping": {
    "scope_declared": true,
    "risks_identified_before_planning": true,
    "p0_flows_identified": true,
    "test_plan_document_present": true,
    "test_plan_states_exclusions": true
  },
  "risk_rows": [
    {
      "risk_id": "r1",
      "description": "Auth failure",
      "is_p0": true
    }
  ],
  "level_planning": {
    "pyramid_applied": true,
    "logic_tested_at_unit_level": true,
    "boundaries_tested_at_integration_level": true,
    "critical_journeys_tested_at_e2e_level": true,
    "tricky_edge_cases_tested_at_unit_level": true
  },
  "test_level_rows": [
    {
      "level_row_id": "l1",
      "risk_id": "r1",
      "test_level": "unit"
    },
    {
      "level_row_id": "l2",
      "risk_id": "r1",
      "test_level": "integration"
    },
    {
      "level_row_id": "l3",
      "risk_id": "r1",
      "test_level": "e2e"
    }
  ],
  "regression_planning": {
    "regression_test_written_before_defect_fix": true,
    "regression_tests_kept_permanently": true,
    "every_fixed_bug_has_regression_test": true
  },
  "declared_changes": [
    {
      "change_id": "c1",
      "change_kind": "defect_fix",
      "description": "Fix login bug"
    }
  ],
  "regression_rows": [
    {
      "regression_id": "reg1",
      "change_id": "c1",
      "kept_permanently": true
    }
  ],
  "fixtures": {
    "no_shared_mutable_state": true,
    "explicit_seed_data_used": true,
    "time_controlled": true,
    "randomness_controlled": true,
    "fixtures_declared_for_suites": true
  },
  "flake_policy": {
    "known_flakes_present": false,
    "flakes_quarantined_immediately": true,
    "flakes_fixed_within_a_week_or_deleted_consciously": true,
    "no_quarantined_test_without_tracked_ticket": true
  },
  "negative_testing": {
    "invalid_input_tested": true,
    "timeouts_tested": true,
    "partial_failures_tested": true,
    "retries_tested": true,
    "sane_failure_asserted": true
  },
  "entry_exit_and_reporting": {
    "entry_criteria_declared": true,
    "exit_criteria_declared": true,
    "full_suite_green_before_handoff": true,
    "report_states_what_ran": true,
    "report_states_what_passed": true,
    "report_states_what_not_covered": true,
    "coverage_gaps_stated_explicitly": true
  },
  "red_lines": {
    "tests_depend_on_production_systems_present": false,
    "tests_depend_on_live_data_present": false,
    "assertion_weakened_to_fix_test_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "testing-strategy-regression-pack",
  "atom_version": "0.1.0",
  "plan_title": "Core Service Regression",
  "verdict": "TESTING_STRATEGY_SOUND",
  "sections": {
    "scope_and_risk_declaration": "pass",
    "test_levels_and_pyramid": "pass",
    "regression_coverage": "pass",
    "fixtures_and_determinism": "pass",
    "flake_policy": "pass",
    "negative_testing": "pass",
    "entry_exit_and_reporting": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "scope_and_risk_declaration",
      "check": "testing_strategy_scope_declared",
      "status": "pass",
      "evidence": "scope: the system / change scope the strategy covers is declared"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "testing_strategy_risks_identified_before_planning",
      "status": "pass",
      "evidence": "risk-first: the risks were identified before levels were planned \u2014 test what breaks expensively"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "testing_strategy_p0_flows_identified",
      "status": "pass",
      "evidence": "risk-first: the P0 flows are identified in the declared record"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "testing_strategy_test_plan_document_present",
      "status": "pass",
      "evidence": "artifacts: a short test-plan document is present for the work"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "testing_strategy_test_plan_states_exclusions",
      "status": "pass",
      "evidence": "artifacts: the test plan states what is excluded"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "testing_strategy_risk_rows_list_declared",
      "status": "pass",
      "evidence": "risk rows: the declared record names its risks \u2014 the list is present and names at least one risk; an absent list is missing evidence and an empty list declares no risk-first strategy at all"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "every_testing_strategy_risk_id_unique",
      "status": "pass",
      "evidence": "risk rows: no declared risk_id is owned by more than one row"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "every_testing_strategy_risk_description_declared",
      "status": "pass",
      "evidence": "risk rows: every declared risk declares a non-empty description"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "every_testing_strategy_risk_p0_status_declared",
      "status": "pass",
      "evidence": "risk rows: every declared risk declares whether it is a P0 risk"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "testing_strategy_pyramid_applied",
      "status": "pass",
      "evidence": "pyramid: the test pyramid is applied \u2014 many unit, fewer integration, few e2e"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "testing_strategy_logic_tested_at_unit_level",
      "status": "pass",
      "evidence": "pyramid: logic is tested at the unit level"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "testing_strategy_boundaries_tested_at_integration_level",
      "status": "pass",
      "evidence": "pyramid: boundaries, DB and API are tested at the integration level"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "testing_strategy_critical_journeys_tested_at_e2e_level",
      "status": "pass",
      "evidence": "pyramid / quality gate: critical journeys are covered end-to-end"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "testing_strategy_tricky_edge_cases_tested_at_unit_level",
      "status": "pass",
      "evidence": "risk-first: tricky edge cases get unit tests"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "testing_strategy_test_level_rows_list_declared",
      "status": "pass",
      "evidence": "level rows: the declared record names its test-level rows \u2014 the list is present and names at least one row; an absent list is missing evidence and an empty list declares no level plan at all"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "every_testing_strategy_test_level_row_id_unique",
      "status": "pass",
      "evidence": "level rows: no declared level_row_id is owned by more than one row"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "every_testing_strategy_test_level_row_level_recognised",
      "status": "pass",
      "evidence": "level rows: every declared row's level is one of unit, integration, e2e \u2014 the three levels the skill names"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "every_testing_strategy_test_level_row_risk_reference_resolves",
      "status": "pass",
      "evidence": "level rows: every declared row's risk_id names a risk in the declared risk list"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "every_testing_strategy_declared_risk_covered_by_level_row",
      "status": "pass",
      "evidence": "level rows / risk-first: every declared risk is covered by at least one declared test-level row"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "every_testing_strategy_p0_risk_covered_by_e2e_row",
      "status": "pass",
      "evidence": "level rows / risk-first: every declared P0 risk is covered by at least one declared e2e row \u2014 P0 flows get e2e"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "testing_strategy_pyramid_level_counts_in_declared_order",
      "status": "pass",
      "evidence": "pyramid: the declared level-row counts follow the skill's stated order \u2014 at least one row per level, unit rows >= integration rows >= e2e rows (many / fewer / few)"
    },
    {
      "section": "regression_coverage",
      "check": "regression_pack_regression_test_written_before_defect_fix",
      "status": "pass",
      "evidence": "bug -> test: for bug fixes the regression test is written first, before the fix"
    },
    {
      "section": "regression_coverage",
      "check": "regression_pack_regression_tests_kept_permanently_declared",
      "status": "pass",
      "evidence": "bug -> test: a regression test, once written for a confirmed defect, is kept forever"
    },
    {
      "section": "regression_coverage",
      "check": "regression_pack_every_fixed_bug_has_regression_test_declared",
      "status": "pass",
      "evidence": "quality gate: every fixed bug has a regression test"
    },
    {
      "section": "regression_coverage",
      "check": "regression_pack_declared_changes_list_declared",
      "status": "pass",
      "evidence": "declared changes: the declared record names its change rows \u2014 the list is present and names at least one change; an absent list is missing evidence and an empty list declares no regression scope at all"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_change_id_unique",
      "status": "pass",
      "evidence": "declared changes: no declared change_id is owned by more than one row"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_change_description_declared",
      "status": "pass",
      "evidence": "declared changes: every declared change declares a non-empty description"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_change_kind_recognised",
      "status": "pass",
      "evidence": "declared changes: every declared change's kind is one of feature, defect_fix, refactor \u2014 the work kinds the skill names"
    },
    {
      "section": "regression_coverage",
      "check": "regression_pack_regression_rows_list_declared",
      "status": "pass",
      "evidence": "regression rows: the declared record names its regression-suite rows \u2014 the list is present and names at least one row; an absent list is missing evidence and an empty list declares no regression suite at all"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_regression_row_id_unique",
      "status": "pass",
      "evidence": "regression rows: no declared regression_id is owned by more than one row"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_regression_row_change_reference_resolves",
      "status": "pass",
      "evidence": "regression rows: every declared row's change_id names a change in the declared change list"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_declared_change_covered_by_regression_row",
      "status": "pass",
      "evidence": "regression rows: every declared change is covered by at least one declared regression row"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_defect_change_covered_by_regression_row",
      "status": "pass",
      "evidence": "regression rows / bug -> test: every declared defect_fix change is covered by at least one declared regression row"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_regression_row_kept_permanently",
      "status": "pass",
      "evidence": "regression rows: every declared regression row is declared kept permanently \u2014 it is kept forever"
    },
    {
      "section": "fixtures_and_determinism",
      "check": "testing_strategy_fixtures_have_no_shared_mutable_state",
      "status": "pass",
      "evidence": "fixtures: fixtures have no shared mutable state"
    },
    {
      "section": "fixtures_and_determinism",
      "check": "testing_strategy_fixtures_use_explicit_seed_data",
      "status": "pass",
      "evidence": "fixtures: fixtures use explicit seed data"
    },
    {
      "section": "fixtures_and_determinism",
      "check": "testing_strategy_time_controlled_in_fixtures",
      "status": "pass",
      "evidence": "fixtures: time is controlled in the fixtures"
    },
    {
      "section": "fixtures_and_determinism",
      "check": "testing_strategy_randomness_controlled_in_fixtures",
      "status": "pass",
      "evidence": "fixtures: randomness is controlled in the fixtures"
    },
    {
      "section": "fixtures_and_determinism",
      "check": "testing_strategy_fixtures_declared_for_suites",
      "status": "pass",
      "evidence": "artifacts / fixtures: fixtures are declared for the suites per level"
    },
    {
      "section": "flake_policy",
      "check": "testing_strategy_flakes_quarantined_immediately",
      "status": "pass",
      "evidence": "flake policy: a flaky test is quarantined immediately"
    },
    {
      "section": "flake_policy",
      "check": "testing_strategy_flakes_fixed_within_a_week_or_deleted_consciously",
      "status": "pass",
      "evidence": "flake policy: a quarantined flake is fixed within a week, or deleted consciously"
    },
    {
      "section": "flake_policy",
      "check": "testing_strategy_no_quarantined_test_without_tracked_ticket_declared",
      "status": "pass",
      "evidence": "quality gate: no skipped or quarantined test is left without a tracked ticket"
    },
    {
      "section": "flake_policy",
      "check": "testing_strategy_quarantine_ticket_recorded_where_flakes_present",
      "status": "pass",
      "evidence": "no known flakes declared present"
    },
    {
      "section": "negative_testing",
      "check": "testing_strategy_negative_invalid_input_tested",
      "status": "pass",
      "evidence": "negative testing: invalid input is tested"
    },
    {
      "section": "negative_testing",
      "check": "testing_strategy_negative_timeouts_tested",
      "status": "pass",
      "evidence": "negative testing: timeouts are tested"
    },
    {
      "section": "negative_testing",
      "check": "testing_strategy_negative_partial_failures_tested",
      "status": "pass",
      "evidence": "negative testing: partial failures are tested"
    },
    {
      "section": "negative_testing",
      "check": "testing_strategy_negative_retries_tested",
      "status": "pass",
      "evidence": "negative testing: retries are tested"
    },
    {
      "section": "negative_testing",
      "check": "testing_strategy_negative_sane_failure_asserted",
      "status": "pass",
      "evidence": "negative testing: sane failure is asserted, not just \"no crash\""
    },
    {
      "section": "entry_exit_and_reporting",
      "check": "testing_strategy_entry_criteria_declared",
      "status": "pass",
      "evidence": "entry / exit: the entry criteria for testing are declared"
    },
    {
      "section": "entry_exit_and_reporting",
      "check": "testing_strategy_exit_criteria_declared",
      "status": "pass",
      "evidence": "entry / exit: the exit criteria for testing are declared"
    },
    {
      "section": "entry_exit_and_reporting",
      "check": "testing_strategy_full_suite_green_before_handoff",
      "status": "pass",
      "evidence": "quality gate: the full suite is green before handoff"
    },
    {
      "section": "entry_exit_and_reporting",
      "check": "testing_strategy_report_states_what_ran",
      "status": "pass",
      "evidence": "honest reporting: the report states what ran"
    },
    {
      "section": "entry_exit_and_reporting",
      "check": "testing_strategy_report_states_what_passed",
      "status": "pass",
      "evidence": "honest reporting: the report states what passed"
    },
    {
      "section": "entry_exit_and_reporting",
      "check": "testing_strategy_report_states_what_not_covered",
      "status": "pass",
      "evidence": "honest reporting: the report states what is NOT covered"
    },
    {
      "section": "entry_exit_and_reporting",
      "check": "testing_strategy_coverage_gaps_stated_explicitly",
      "status": "pass",
      "evidence": "quality gate: coverage gaps are stated explicitly in the report"
    },
    {
      "section": "red_lines",
      "check": "testing_strategy_free_of_production_system_dependency",
      "status": "pass",
      "evidence": "red line: no test depends on a production system"
    },
    {
      "section": "red_lines",
      "check": "testing_strategy_free_of_live_data_dependency",
      "status": "pass",
      "evidence": "red line: no test depends on live data"
    },
    {
      "section": "red_lines",
      "check": "testing_strategy_free_of_assertion_weakened_to_fix_test",
      "status": "pass",
      "evidence": "red line: no test was \"fixed\" by weakening its assertion \u2014 the code was fixed, or the test deleted deliberately"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "risk_rows_count": 1,
  "test_level_rows_count": 3,
  "declared_changes_count": 1,
  "regression_rows_count": 1,
  "unit_level_row_count": 1,
  "integration_level_row_count": 1,
  "e2e_level_row_count": 1,
  "duplicate_risk_ids": [],
  "duplicate_test_level_row_ids": [],
  "duplicate_change_ids": [],
  "duplicate_regression_row_ids": [],
  "risks_without_description": [],
  "risks_without_p0_status": [],
  "test_level_rows_with_invalid_level": [],
  "test_level_rows_with_unknown_risk_reference": [],
  "declared_risks_without_test_level_row": [],
  "p0_risks_without_e2e_row": [],
  "declared_changes_without_description": [],
  "declared_changes_with_invalid_kind": [],
  "regression_rows_with_unknown_change_reference": [],
  "declared_changes_without_regression_row": [],
  "defect_changes_without_regression_row": [],
  "regression_rows_not_declared_permanent": [],
  "risk_level_coverage_ratio": "1.000000",
  "p0_e2e_coverage_ratio": "1.000000",
  "change_regression_coverage_ratio": "1.000000",
  "defect_regression_coverage_ratio": "1.000000",
  "summary": "58 pass, 0 fail, 0 missing of 58 checks across eight sections.",
  "stamp": "TESTING STRATEGY REGRESSION PACK\nplan_title: Core Service Regression\nVERDICT: TESTING_STRATEGY_SOUND\n  scope_and_risk_declaration                   pass\n  test_levels_and_pyramid                      pass\n  regression_coverage                          pass\n  fixtures_and_determinism                     pass\n  flake_policy                                 pass\n  negative_testing                             pass\n  entry_exit_and_reporting                     pass\n  red_lines                                    pass\n58 pass, 0 fail, 0 missing of 58 checks across eight sections."
}
```
### Example 2 — Violations (case `violations`)
Provenance: recorded 2026-11-16T14:11:10.261582+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/testing-strategy-regression-pack/evidence.json`.
Input:

```json
{
  "plan_title": "Core Service Regression",
  "scoping": {
    "scope_declared": true,
    "risks_identified_before_planning": true,
    "p0_flows_identified": true,
    "test_plan_document_present": true,
    "test_plan_states_exclusions": true
  },
  "risk_rows": [
    {
      "risk_id": "r1",
      "description": "",
      "is_p0": true
    }
  ],
  "level_planning": {
    "pyramid_applied": true,
    "logic_tested_at_unit_level": true,
    "boundaries_tested_at_integration_level": true,
    "critical_journeys_tested_at_e2e_level": true,
    "tricky_edge_cases_tested_at_unit_level": true
  },
  "test_level_rows": [
    {
      "level_row_id": "l1",
      "risk_id": "nonexistent",
      "test_level": "unit"
    },
    {
      "level_row_id": "l2",
      "risk_id": "r1",
      "test_level": "integration"
    },
    {
      "level_row_id": "l3",
      "risk_id": "r1",
      "test_level": "e2e"
    }
  ],
  "regression_planning": {
    "regression_test_written_before_defect_fix": true,
    "regression_tests_kept_permanently": true,
    "every_fixed_bug_has_regression_test": true
  },
  "declared_changes": [
    {
      "change_id": "c1",
      "change_kind": "defect_fix",
      "description": "Fix login bug"
    }
  ],
  "regression_rows": [
    {
      "regression_id": "reg1",
      "change_id": "c1",
      "kept_permanently": false
    }
  ],
  "fixtures": {
    "no_shared_mutable_state": true,
    "explicit_seed_data_used": true,
    "time_controlled": true,
    "randomness_controlled": true,
    "fixtures_declared_for_suites": true
  },
  "flake_policy": {
    "known_flakes_present": false,
    "flakes_quarantined_immediately": true,
    "flakes_fixed_within_a_week_or_deleted_consciously": true,
    "no_quarantined_test_without_tracked_ticket": true
  },
  "negative_testing": {
    "invalid_input_tested": true,
    "timeouts_tested": true,
    "partial_failures_tested": true,
    "retries_tested": true,
    "sane_failure_asserted": true
  },
  "entry_exit_and_reporting": {
    "entry_criteria_declared": true,
    "exit_criteria_declared": true,
    "full_suite_green_before_handoff": true,
    "report_states_what_ran": true,
    "report_states_what_passed": true,
    "report_states_what_not_covered": true,
    "coverage_gaps_stated_explicitly": true
  },
  "red_lines": {
    "tests_depend_on_production_systems_present": true,
    "tests_depend_on_live_data_present": false,
    "assertion_weakened_to_fix_test_present": false
  }
}
```

Response (HTTP 200):

```json
{
  "service": "testing-strategy-regression-pack",
  "atom_version": "0.1.0",
  "plan_title": "Core Service Regression",
  "verdict": "TESTING_STRATEGY_NOT_SOUND",
  "sections": {
    "scope_and_risk_declaration": "fail",
    "test_levels_and_pyramid": "fail",
    "regression_coverage": "fail",
    "fixtures_and_determinism": "pass",
    "flake_policy": "pass",
    "negative_testing": "pass",
    "entry_exit_and_reporting": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "scope_and_risk_declaration",
      "check": "testing_strategy_scope_declared",
      "status": "pass",
      "evidence": "scope: the system / change scope the strategy covers is declared"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "testing_strategy_risks_identified_before_planning",
      "status": "pass",
      "evidence": "risk-first: the risks were identified before levels were planned \u2014 test what breaks expensively"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "testing_strategy_p0_flows_identified",
      "status": "pass",
      "evidence": "risk-first: the P0 flows are identified in the declared record"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "testing_strategy_test_plan_document_present",
      "status": "pass",
      "evidence": "artifacts: a short test-plan document is present for the work"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "testing_strategy_test_plan_states_exclusions",
      "status": "pass",
      "evidence": "artifacts: the test plan states what is excluded"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "testing_strategy_risk_rows_list_declared",
      "status": "pass",
      "evidence": "risk rows: the declared record names its risks \u2014 the list is present and names at least one risk; an absent list is missing evidence and an empty list declares no risk-first strategy at all"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "every_testing_strategy_risk_id_unique",
      "status": "pass",
      "evidence": "risk rows: no declared risk_id is owned by more than one row"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "every_testing_strategy_risk_description_declared",
      "status": "fail",
      "evidence": "risk rows: every declared risk declares a non-empty description"
    },
    {
      "section": "scope_and_risk_declaration",
      "check": "every_testing_strategy_risk_p0_status_declared",
      "status": "pass",
      "evidence": "risk rows: every declared risk declares whether it is a P0 risk"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "testing_strategy_pyramid_applied",
      "status": "pass",
      "evidence": "pyramid: the test pyramid is applied \u2014 many unit, fewer integration, few e2e"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "testing_strategy_logic_tested_at_unit_level",
      "status": "pass",
      "evidence": "pyramid: logic is tested at the unit level"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "testing_strategy_boundaries_tested_at_integration_level",
      "status": "pass",
      "evidence": "pyramid: boundaries, DB and API are tested at the integration level"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "testing_strategy_critical_journeys_tested_at_e2e_level",
      "status": "pass",
      "evidence": "pyramid / quality gate: critical journeys are covered end-to-end"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "testing_strategy_tricky_edge_cases_tested_at_unit_level",
      "status": "pass",
      "evidence": "risk-first: tricky edge cases get unit tests"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "testing_strategy_test_level_rows_list_declared",
      "status": "pass",
      "evidence": "level rows: the declared record names its test-level rows \u2014 the list is present and names at least one row; an absent list is missing evidence and an empty list declares no level plan at all"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "every_testing_strategy_test_level_row_id_unique",
      "status": "pass",
      "evidence": "level rows: no declared level_row_id is owned by more than one row"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "every_testing_strategy_test_level_row_level_recognised",
      "status": "pass",
      "evidence": "level rows: every declared row's level is one of unit, integration, e2e \u2014 the three levels the skill names"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "every_testing_strategy_test_level_row_risk_reference_resolves",
      "status": "fail",
      "evidence": "level rows: every declared row's risk_id names a risk in the declared risk list"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "every_testing_strategy_declared_risk_covered_by_level_row",
      "status": "pass",
      "evidence": "level rows / risk-first: every declared risk is covered by at least one declared test-level row"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "every_testing_strategy_p0_risk_covered_by_e2e_row",
      "status": "pass",
      "evidence": "level rows / risk-first: every declared P0 risk is covered by at least one declared e2e row \u2014 P0 flows get e2e"
    },
    {
      "section": "test_levels_and_pyramid",
      "check": "testing_strategy_pyramid_level_counts_in_declared_order",
      "status": "pass",
      "evidence": "pyramid: the declared level-row counts follow the skill's stated order \u2014 at least one row per level, unit rows >= integration rows >= e2e rows (many / fewer / few)"
    },
    {
      "section": "regression_coverage",
      "check": "regression_pack_regression_test_written_before_defect_fix",
      "status": "pass",
      "evidence": "bug -> test: for bug fixes the regression test is written first, before the fix"
    },
    {
      "section": "regression_coverage",
      "check": "regression_pack_regression_tests_kept_permanently_declared",
      "status": "pass",
      "evidence": "bug -> test: a regression test, once written for a confirmed defect, is kept forever"
    },
    {
      "section": "regression_coverage",
      "check": "regression_pack_every_fixed_bug_has_regression_test_declared",
      "status": "pass",
      "evidence": "quality gate: every fixed bug has a regression test"
    },
    {
      "section": "regression_coverage",
      "check": "regression_pack_declared_changes_list_declared",
      "status": "pass",
      "evidence": "declared changes: the declared record names its change rows \u2014 the list is present and names at least one change; an absent list is missing evidence and an empty list declares no regression scope at all"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_change_id_unique",
      "status": "pass",
      "evidence": "declared changes: no declared change_id is owned by more than one row"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_change_description_declared",
      "status": "pass",
      "evidence": "declared changes: every declared change declares a non-empty description"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_change_kind_recognised",
      "status": "pass",
      "evidence": "declared changes: every declared change's kind is one of feature, defect_fix, refactor \u2014 the work kinds the skill names"
    },
    {
      "section": "regression_coverage",
      "check": "regression_pack_regression_rows_list_declared",
      "status": "pass",
      "evidence": "regression rows: the declared record names its regression-suite rows \u2014 the list is present and names at least one row; an absent list is missing evidence and an empty list declares no regression suite at all"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_regression_row_id_unique",
      "status": "pass",
      "evidence": "regression rows: no declared regression_id is owned by more than one row"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_regression_row_change_reference_resolves",
      "status": "pass",
      "evidence": "regression rows: every declared row's change_id names a change in the declared change list"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_declared_change_covered_by_regression_row",
      "status": "pass",
      "evidence": "regression rows: every declared change is covered by at least one declared regression row"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_defect_change_covered_by_regression_row",
      "status": "pass",
      "evidence": "regression rows / bug -> test: every declared defect_fix change is covered by at least one declared regression row"
    },
    {
      "section": "regression_coverage",
      "check": "every_regression_pack_regression_row_kept_permanently",
      "status": "fail",
      "evidence": "regression rows: every declared regression row is declared kept permanently \u2014 it is kept forever"
    },
    {
      "section": "fixtures_and_determinism",
      "check": "testing_strategy_fixtures_have_no_shared_mutable_state",
      "status": "pass",
      "evidence": "fixtures: fixtures have no shared mutable state"
    },
    {
      "section": "fixtures_and_determinism",
      "check": "testing_strategy_fixtures_use_explicit_seed_data",
      "status": "pass",
      "evidence": "fixtures: fixtures use explicit seed data"
    },
    {
      "section": "fixtures_and_determinism",
      "check": "testing_strategy_time_controlled_in_fixtures",
      "status": "pass",
      "evidence": "fixtures: time is controlled in the fixtures"
    },
    {
      "section": "fixtures_and_determinism",
      "check": "testing_strategy_randomness_controlled_in_fixtures",
      "status": "pass",
      "evidence": "fixtures: randomness is controlled in the fixtures"
    },
    {
      "section": "fixtures_and_determinism",
      "check": "testing_strategy_fixtures_declared_for_suites",
      "status": "pass",
      "evidence": "artifacts / fixtures: fixtures are declared for the suites per level"
    },
    {
      "section": "flake_policy",
      "check": "testing_strategy_flakes_quarantined_immediately",
      "status": "pass",
      "evidence": "flake policy: a flaky test is quarantined immediately"
    },
    {
      "section": "flake_policy",
      "check": "testing_strategy_flakes_fixed_within_a_week_or_deleted_consciously",
      "status": "pass",
      "evidence": "flake policy: a quarantined flake is fixed within a week, or deleted consciously"
    },
    {
      "section": "flake_policy",
      "check": "testing_strategy_no_quarantined_test_without_tracked_ticket_declared",
      "status": "pass",
      "evidence": "quality gate: no skipped or quarantined test is left without a tracked ticket"
    },
    {
      "section": "flake_policy",
      "check": "testing_strategy_quarantine_ticket_recorded_where_flakes_present",
      "status": "pass",
      "evidence": "no known flakes declared present"
    },
    {
      "section": "negative_testing",
      "check": "testing_strategy_negative_invalid_input_tested",
      "status": "pass",
      "evidence": "negative testing: invalid input is tested"
    },
    {
      "section": "negative_testing",
      "check": "testing_strategy_negative_timeouts_tested",
      "status": "pass",
      "evidence": "negative testing: timeouts are tested"
    },
    {
      "section": "negative_testing",
      "check": "testing_strategy_negative_partial_failures_tested",
      "status": "pass",
      "evidence": "negative testing: partial failures are tested"
    },
    {
      "section": "negative_testing",
      "check": "testing_strategy_negative_retries_tested",
      "status": "pass",
      "evidence": "negative testing: retries are tested"
    },
    {
      "section": "negative_testing",
      "check": "testing_strategy_negative_sane_failure_asserted",
      "status": "pass",
      "evidence": "negative testing: sane failure is asserted, not just \"no crash\""
    },
    {
      "section": "entry_exit_and_reporting",
      "check": "testing_strategy_entry_criteria_declared",
      "status": "pass",
      "evidence": "entry / exit: the entry criteria for testing are declared"
    },
    {
      "section": "entry_exit_and_reporting",
      "check": "testing_strategy_exit_criteria_declared",
      "status": "pass",
      "evidence": "entry / exit: the exit criteria for testing are declared"
    },
    {
      "section": "entry_exit_and_reporting",
      "check": "testing_strategy_full_suite_green_before_handoff",
      "status": "pass",
      "evidence": "quality gate: the full suite is green before handoff"
    },
    {
      "section": "entry_exit_and_reporting",
      "check": "testing_strategy_report_states_what_ran",
      "status": "pass",
      "evidence": "honest reporting: the report states what ran"
    },
    {
      "section": "entry_exit_and_reporting",
      "check": "testing_strategy_report_states_what_passed",
      "status": "pass",
      "evidence": "honest reporting: the report states what passed"
    },
    {
      "section": "entry_exit_and_reporting",
      "check": "testing_strategy_report_states_what_not_covered",
      "status": "pass",
      "evidence": "honest reporting: the report states what is NOT covered"
    },
    {
      "section": "entry_exit_and_reporting",
      "check": "testing_strategy_coverage_gaps_stated_explicitly",
      "status": "pass",
      "evidence": "quality gate: coverage gaps are stated explicitly in the report"
    },
    {
      "section": "red_lines",
      "check": "testing_strategy_free_of_production_system_dependency",
      "status": "fail",
      "evidence": "red line: no test depends on a production system"
    },
    {
      "section": "red_lines",
      "check": "testing_strategy_free_of_live_data_dependency",
      "status": "pass",
      "evidence": "red line: no test depends on live data"
    },
    {
      "section": "red_lines",
      "check": "testing_strategy_free_of_assertion_weakened_to_fix_test",
      "status": "pass",
      "evidence": "red line: no test was \"fixed\" by weakening its assertion \u2014 the code was fixed, or the test deleted deliberately"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "risk_rows_count": 1,
  "test_level_rows_count": 3,
  "declared_changes_count": 1,
  "regression_rows_count": 1,
  "unit_level_row_count": 1,
  "integration_level_row_count": 1,
  "e2e_level_row_count": 1,
  "duplicate_risk_ids": [],
  "duplicate_test_level_row_ids": [],
  "duplicate_change_ids": [],
  "duplicate_regression_row_ids": [],
  "risks_without_description": [
    "r1"
  ],
  "risks_without_p0_status": [],
  "test_level_rows_with_invalid_level": [],
  "test_level_rows_with_unknown_risk_reference": [
    "l1"
  ],
  "declared_risks_without_test_level_row": [],
  "p0_risks_without_e2e_row": [],
  "declared_changes_without_description": [],
  "declared_changes_with_invalid_kind": [],
  "regression_rows_with_unknown_change_reference": [],
  "declared_changes_without_regression_row": [],
  "defect_changes_without_regression_row": [],
  "regression_rows_not_declared_permanent": [
    "reg1"
  ],
  "risk_level_coverage_ratio": "1.000000",
  "p0_e2e_coverage_ratio": "1.000000",
  "change_regression_coverage_ratio": "1.000000",
  "defect_regression_coverage_ratio": "1.000000",
  "summary": "54 pass, 4 fail, 0 missing of 58 checks across eight sections.",
  "stamp": "TESTING STRATEGY REGRESSION PACK\nplan_title: Core Service Regression\nVERDICT: TESTING_STRATEGY_NOT_SOUND\n  scope_and_risk_declaration                   fail\n  test_levels_and_pyramid                      fail\n  regression_coverage                          fail\n  fixtures_and_determinism                     pass\n  flake_policy                                 pass\n  negative_testing                             pass\n  entry_exit_and_reporting                     pass\n  red_lines                                    fail\n54 pass, 4 fail, 0 missing of 58 checks across eight sections."
}
```
### Example 3 — Malformed (case `malformed`)
Provenance: recorded 2026-11-16T14:11:10.261582+00:00 · gateway v1.1.0 · external verification battery Wave 16 · source `verification/work/testing-strategy-regression-pack/evidence.json`.
Input:

```json
{
  "plan_title": "Malformed Plan",
  "scoping": "not_an_object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scoping",
  "detail": "scoping must be an object"
}
```
## Documentation standard checklist
| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — a declared-record audit; SERVICE.md's U-13 screen is (a) No outright (declared-record audit; screen states No outright), so no regulator role view is provided for this atom (see Role views) |
| Checks named | 58 documented / 58 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (the four counts, the three per-level counts, the four duplicate-id lists, the twelve row-name lists and the four ratios) |
| Input reference typed | Yes — 67 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and the recorded MCP `inputSchema` and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/testing-strategy-regression-pack/evidence.json` |
