# Designed test case pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a feature or system and a record of the test cases designed for it — declared requirements and cases, technique application, negative and error guessing, risk selection and coverage. This atom reads one declared manifest and returns one deterministic verdict across four sections: **TEST_CASE_PACK_SOUND**, **TEST_CASE_PACK_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared evidence's completeness and consistency only — it writes no test cases, executes no case, reads no requirements document or test suite, and does not verify that a declared case actually exists as written or would catch any bug. It never judges whether the equivalence classes are the right classes, whether a declared expected result is the correct oracle, whether the decision-table rules chosen are truly the interesting or awkward ones, whether the state model is complete, or whether the risk ranking is wise. Computed checks: every declared requirement must be traced to at least one case, every declared case must trace to a declared requirement and name a non-empty expected result, case ids must be unique, and at least one boundary case and one negative case must be declared; the output also reports the declared counts, the traced/untraced and without-expected-result/without-traceability row lists, duplicate case ids, and two coverage ratios (`requirement_trace_coverage` and `expected_result_coverage`, reported as strings with exactly four decimal places, or null when the underlying list is absent or empty). Three checks are conditional: decision-table rules are required only when decision tables are declared applicable, state transitions only when stateful behaviour is declared present, and pairwise coverage only when many configuration axes are declared present — otherwise they pass as not applicable. No numeric threshold is imposed beyond completeness over your own declared rows. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "designed-test-case-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/designed-test-case-pack` — tool name `designed_test_case_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/designed-test-case-pack` — body = the manifest object; same `Authorization` header.

## Input — the designed-test-case-pack manifest

| Field | Meaning |
|---|---|
| `pack` | pack name (string; carried into the output, not checked) |
| `requirements` (list of `{id}` objects) | declared requirements; passes only when present and non-empty |
| `requirements[].id` (string) | requirement identifier a case's `requirement_ids` must name; must be a non-empty string |
| `cases` (list of case-row objects) | declared test cases; passes only when present and non-empty |
| `cases[].id` (string) | case identifier; must be a non-empty string and unique across the pack (duplicates are reported in `duplicate_case_ids`) |
| `cases[].requirement_ids` (list of strings) | declared requirements this case traces to; at least one entry must name a declared requirement `id` (absent = missing evidence, empty list fails) |
| `cases[].level` (string) | test level; must be a non-empty string (absent = missing evidence, empty string fails; no level vocabulary is imposed) |
| `cases[].preconditions_declared` / `steps_declared` | per-case format evidence: preconditions declared; steps declared |
| `cases[].expected_result` (string) | expected result; must be a non-empty string (absent = missing evidence, empty string fails) |
| `cases[].expected_result_written_before_execution` | expected result was written before execution |
| `cases[].covers_boundary` | this case covers a boundary (at least one case in the pack must declare it) |
| `cases[].covers_negative` | this case is a negative case (at least one case in the pack must declare it) |
| `technique_application.equivalence_partitioning_applied` / `equivalence_representative_and_edges_per_class` | equivalence partitioning applied; one representative plus the edges per class |
| `technique_application.boundary_value_analysis_applied` / `boundary_just_below_at_and_above_covered` | boundary value analysis applied; just-below / at / just-above each boundary covered |
| `technique_application.decision_tables_applicable` | gates the decision-table check below |
| `technique_application.decision_table_rules_covered_including_awkward` | required when decision tables are declared applicable; otherwise the check passes as not applicable |
| `technique_application.stateful_behaviour_present` | gates the state-transition check below |
| `technique_application.state_transitions_allowed_forbidden_and_interrupts_tested` | required when stateful behaviour is declared present; otherwise the check passes as not applicable |
| `technique_application.many_config_axes_present` | gates the pairwise check below |
| `technique_application.pairwise_pair_coverage_used` | required when many configuration axes are declared present; otherwise the check passes as not applicable |
| `negative_and_error_guessing.negative_cases_designed` / `invalid_inputs_covered` / `wrong_order_retries_and_partial_failure_covered` | negative and error-guessing evidence |
| `risk_selection.risk_based_selection_applied` / `cases_ranked_by_damage_and_likelihood` / `highest_risk_cases_selected_first` / `not_tested_stated_explicitly` | risk-based selection evidence |
| `coverage.coverage_gaps_stated_explicitly` | coverage gaps are stated explicitly |
| `coverage.duplicate_path_suites_present` | must be `false` to pass (red line: no duplicate-path suites) |
| `coverage.happy_path_only_suite_present` | must be `false` to pass (quality gate: not a happy-path-only suite) |
| `coverage.cases_written_before_execution` | cases were written before execution |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward TEST_CASE_PACK_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/designed-test-case-pack`:

```json
{
  "pack": "Login Feature Suite",
  "requirements": [
    {
      "id": "REQ-01"
    }
  ],
  "cases": [
    {
      "id": "TC-01",
      "requirement_ids": [
        "REQ-01"
      ],
      "level": "L1",
      "preconditions_declared": true,
      "steps_declared": true,
      "expected_result": "User logged in",
      "expected_result_written_before_execution": true,
      "covers_boundary": true,
      "covers_negative": true
    }
  ],
  "technique_application": {
    "equivalence_partitioning_applied": true,
    "equivalence_representative_and_edges_per_class": true,
    "boundary_value_analysis_applied": true,
    "boundary_just_below_at_and_above_covered": true,
    "decision_tables_applicable": false,
    "stateful_behaviour_present": false,
    "many_config_axes_present": false
  },
  "negative_and_error_guessing": {
    "negative_cases_designed": true,
    "invalid_inputs_covered": true,
    "wrong_order_retries_and_partial_failure_covered": true
  },
  "risk_selection": {
    "risk_based_selection_applied": true,
    "cases_ranked_by_damage_and_likelihood": true,
    "highest_risk_cases_selected_first": true,
    "not_tested_stated_explicitly": true
  },
  "coverage": {
    "coverage_gaps_stated_explicitly": true,
    "duplicate_path_suites_present": false,
    "happy_path_only_suite_present": false,
    "cases_written_before_execution": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 30 checks and a text stamp of the verdict):

```json
{
  "service": "designed-test-case-pack",
  "atom_version": "0.1.0",
  "pack": "Login Feature Suite",
  "verdict": "TEST_CASE_PACK_SOUND",
  "sections": {
    "traceability_and_case_format": "pass",
    "technique_coverage": "pass",
    "negative_and_risk_selection": "pass",
    "coverage_gaps_and_suite_hygiene": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "requirements_count": 1,
  "cases_count": 1,
  "untraced_requirements": [],
  "requirement_trace_coverage": "1.0000",
  "cases_without_expected_result": [],
  "expected_result_coverage": "1.0000",
  "cases_without_traceability": [],
  "duplicate_case_ids": [],
  "summary": "30 pass, 0 fail, 0 missing of 30 checks across four sections."
}
```

## Verdicts

- **TEST_CASE_PACK_SOUND** — every check passes; the declared test-case-pack evidence is complete and consistent with the skill's method, quality gates and red lines.
- **TEST_CASE_PACK_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `requirements_count` and `cases_count` (the declared list lengths as integers, or null when the list is not declared), `untraced_requirements`, `cases_without_expected_result` and `cases_without_traceability` (row-name lists, or null when an underlying list is not declared), `duplicate_case_ids` (or null when the cases list is not declared), `requirement_trace_coverage` and `expected_result_coverage` (strings with exactly four decimal places, or null when the denominator list is absent or empty) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
