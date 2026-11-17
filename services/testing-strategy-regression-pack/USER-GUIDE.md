# Testing strategy regression pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have a testing strategy and regression plan for one system or change set and you keep a plan record for it as actually drawn up. This atom reads one declared testing strategy + regression plan record and returns one deterministic verdict across eight sections (scope_and_risk_declaration, test_levels_and_pyramid, regression_coverage, fixtures_and_determinism, flake_policy, negative_testing, entry_exit_and_reporting, red_lines): **TESTING_STRATEGY_SOUND**, **TESTING_STRATEGY_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 58 checks. It audits the declared plan record's completeness and internal consistency only — it runs no tests, executes no suite, inspects no code, opens no repository, measures no coverage and verifies no test result against the world. A strategy is sound *on your declared evidence*: a record that declares its risks covered, its regression rows permanent and its suite green passes those checks even if the real plan did none of it. It is not a testing service, a test execution, or a guarantee that the software works: it never judges whether a declared test is well written, whether a declared risk is the real risk, whether the declared levels will catch the defects that matter, or whether the product should ship — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. The computed checks: the declared `risk_rows` list must be present and name at least one risk, with unique `risk_id` values, a non-empty `description` on every row, and a declared `is_p0` status on every row; the declared `test_level_rows` list must be present and name at least one row, with unique `level_row_id` values, every `test_level` one of `unit`, `integration` or `e2e`, every row's `risk_id` naming a declared risk, every declared risk covered by at least one level row, every P0 risk covered by at least one e2e row, and the pyramid level counts in the skill's stated order — at least one row per level, with unit rows >= integration rows >= e2e rows; the declared `declared_changes` list must be present and name at least one change, with unique `change_id` values, a non-empty `description` on every row, and every `change_kind` one of `feature`, `defect_fix` or `refactor`; and the declared `regression_rows` list must be present and name at least one row, with unique `regression_id` values, every row's `change_id` naming a declared change, every declared change covered by at least one regression row, every `defect_fix` change covered by at least one regression row, and every regression row declared `kept_permanently: true`. One further check is gated on the record's own declared gate field — when the gate is declared `false` the check passes as not applicable, when the gate field is absent the check is missing evidence, and when the gate is `true` the target declaration is required: a quarantine ticket is required only where `flake_policy.known_flakes_present` is declared `true`. No numeric threshold is imposed — no code-coverage percentage bar (coverage is a signal, not a goal — no percentage is imported); no minimum or maximum number of risks, level rows, changes or regression rows beyond at least one each and the pyramid's stated count order; no test-count-per-risk bar beyond one covering level row (and one e2e row for P0 risks, as the skill states); no suite runtime or speed bar; no flake-rate bar; no defect-escape or pass-rate bar; and no judgment that a declared test is well designed, that a declared level is the right level for a risk beyond the skill's stated assignments, or that the strategy will in fact catch defects (only that its declared record contains what the skill requires). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "testing-strategy-regression-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/testing-strategy-regression-pack` — tool name `testing_strategy_regression_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/testing-strategy-regression-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `plan_title` | Plan title (string; carried into the output, not checked) |
| `scoping.scope_declared` | scope evidence: the system / change scope the strategy covers is declared |
| `scoping.risks_identified_before_planning` | scope evidence: the risks were identified before levels were planned |
| `scoping.p0_flows_identified` | scope evidence: the P0 flows are identified |
| `scoping.test_plan_document_present` | scope evidence: a short test-plan document is present |
| `scoping.test_plan_states_exclusions` | scope evidence: the test plan states what is excluded |
| `risk_rows` (list of risk-row objects) | computed: must be present and name at least one risk; reported as `risk_rows_count` |
| `risk_rows[].risk_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `risk_rows[].description` (string) | computed: must be present and non-empty on every row |
| `risk_rows[].is_p0` | computed: must be present on every row — the row's P0 status |
| `level_planning.pyramid_applied` | level evidence: the test pyramid is applied — many unit, fewer integration, few e2e |
| `level_planning.logic_tested_at_unit_level` | level evidence: logic is tested at the unit level |
| `level_planning.boundaries_tested_at_integration_level` | level evidence: boundaries, DB and API are tested at the integration level |
| `level_planning.critical_journeys_tested_at_e2e_level` | level evidence: critical journeys are covered end-to-end |
| `level_planning.tricky_edge_cases_tested_at_unit_level` | level evidence: tricky edge cases get unit tests |
| `test_level_rows` (list of test-level-row objects) | computed: must be present and name at least one row; reported as `test_level_rows_count` |
| `test_level_rows[].level_row_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `test_level_rows[].risk_id` (string) | computed: must name one of the declared risks |
| `test_level_rows[].test_level` (string) | computed: must be one of `unit`, `integration`, `e2e` |
| `regression_planning.regression_test_written_before_defect_fix` | regression evidence: for bug fixes the regression test is written first, before the fix |
| `regression_planning.regression_tests_kept_permanently` | regression evidence: a regression test, once written, is kept forever |
| `regression_planning.every_fixed_bug_has_regression_test` | regression evidence: every fixed bug has a regression test |
| `declared_changes` (list of change-row objects) | computed: must be present and name at least one change; reported as `declared_changes_count` |
| `declared_changes[].change_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `declared_changes[].change_kind` (string) | computed: must be one of `feature`, `defect_fix`, `refactor` |
| `declared_changes[].description` (string) | computed: must be present and non-empty on every row |
| `regression_rows` (list of regression-row objects) | computed: must be present and name at least one row; reported as `regression_rows_count` |
| `regression_rows[].regression_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `regression_rows[].change_id` (string) | computed: must name one of the declared changes |
| `regression_rows[].kept_permanently` | computed: must be `true` on every row |
| `fixtures.no_shared_mutable_state` | fixture evidence: fixtures have no shared mutable state |
| `fixtures.explicit_seed_data_used` | fixture evidence: fixtures use explicit seed data |
| `fixtures.time_controlled` | fixture evidence: time is controlled in the fixtures |
| `fixtures.randomness_controlled` | fixture evidence: randomness is controlled in the fixtures |
| `fixtures.fixtures_declared_for_suites` | fixture evidence: fixtures are declared for the suites per level |
| `flake_policy.known_flakes_present` | gates the quarantine-ticket check: a ticket is required only where known flakes are declared present |
| `flake_policy.flakes_quarantined_immediately` | flake evidence: a flaky test is quarantined immediately |
| `flake_policy.flakes_fixed_within_a_week_or_deleted_consciously` | flake evidence: a quarantined flake is fixed within a week, or deleted consciously |
| `flake_policy.no_quarantined_test_without_tracked_ticket` | flake evidence: no skipped or quarantined test is left without a tracked ticket |
| `flake_policy.quarantine_ticket_recorded` | required when `flake_policy.known_flakes_present` is `true`; otherwise the check passes as not applicable |
| `negative_testing.invalid_input_tested` | negative-testing evidence: invalid input is tested |
| `negative_testing.timeouts_tested` | negative-testing evidence: timeouts are tested |
| `negative_testing.partial_failures_tested` | negative-testing evidence: partial failures are tested |
| `negative_testing.retries_tested` | negative-testing evidence: retries are tested |
| `negative_testing.sane_failure_asserted` | negative-testing evidence: sane failure is asserted, not just "no crash" |
| `entry_exit_and_reporting.entry_criteria_declared` | entry/exit evidence: the entry criteria for testing are declared |
| `entry_exit_and_reporting.exit_criteria_declared` | entry/exit evidence: the exit criteria for testing are declared |
| `entry_exit_and_reporting.full_suite_green_before_handoff` | entry/exit evidence: the full suite is green before handoff |
| `entry_exit_and_reporting.report_states_what_ran` | reporting evidence: the report states what ran |
| `entry_exit_and_reporting.report_states_what_passed` | reporting evidence: the report states what passed |
| `entry_exit_and_reporting.report_states_what_not_covered` | reporting evidence: the report states what is NOT covered |
| `entry_exit_and_reporting.coverage_gaps_stated_explicitly` | reporting evidence: coverage gaps are stated explicitly in the report |
| `red_lines.tests_depend_on_production_systems_present` | must be `false` to pass (red line: no test depends on a production system) |
| `red_lines.tests_depend_on_live_data_present` | must be `false` to pass (red line: no test depends on live data) |
| `red_lines.assertion_weakened_to_fix_test_present` | must be `false` to pass (red line: no test was "fixed" by weakening its assertion) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward TESTING_STRATEGY_NOT_SOUND). All fields are booleans or strings unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/testing-strategy-regression-pack`:

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

Response — HTTP 200 (trimmed; the full response carries all 58 checks and a text stamp of the verdict):

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
  "summary": "58 pass, 0 fail, 0 missing of 58 checks across eight sections."
}
```

## Verdicts

- **TESTING_STRATEGY_SOUND** — every check passes; the declared testing strategy + regression plan record is complete and internally consistent with the skill's method, quality gates and red lines.
- **TESTING_STRATEGY_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `risk_rows_count`, `test_level_rows_count`, `declared_changes_count` and `regression_rows_count` (integers, exactly; null when the corresponding list is not declared), the per-level counts `unit_level_row_count`, `integration_level_row_count` and `e2e_level_row_count` (null when the test-level list is not declared), `duplicate_risk_ids`, `duplicate_test_level_row_ids`, `duplicate_change_ids` and `duplicate_regression_row_ids` (ids carried by more than one row; each null when its list is not declared), `risks_without_description`, `risks_without_p0_status`, `test_level_rows_with_invalid_level`, `test_level_rows_with_unknown_risk_reference`, `declared_risks_without_test_level_row`, `p0_risks_without_e2e_row`, `declared_changes_without_description`, `declared_changes_with_invalid_kind`, `regression_rows_with_unknown_change_reference`, `declared_changes_without_regression_row`, `defect_changes_without_regression_row` and `regression_rows_not_declared_permanent` (the offending rows for each computed rule; each null when its underlying list is not declared), `risk_level_coverage_ratio` (declared risks covered by at least one level row ÷ declared risks), `p0_e2e_coverage_ratio` (P0 risks covered by an e2e row ÷ declared P0 risks), `change_regression_coverage_ratio` (declared changes covered by a regression row ÷ declared changes) and `defect_regression_coverage_ratio` (defect changes covered by a regression row ÷ declared defect changes; each ratio a string with exactly six decimal places, and null when its denominator list is absent or empty — the P0 ratio is null when no P0 risk is declared and the defect ratio is null when no defect change is declared), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the twenty-one primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
