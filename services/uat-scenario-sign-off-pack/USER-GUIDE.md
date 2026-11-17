# Uat scenario sign off pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have carried out one user acceptance testing (UAT) round and you keep a scenario and sign-off record for it. This atom reads one declared UAT scenario and sign-off record for one acceptance round and returns one deterministic verdict across seven sections (scope_and_criteria_mapping, environment_people_and_scripts, execution_and_results, defects_and_triage, sign_off_record, retest_and_regression_after_fixes, red_lines): **UAT_SIGN_OFF_SOUND**, **UAT_SIGN_OFF_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 56 checks. It audits the declared UAT record's completeness and internal consistency only — it runs no UAT, executes no scenario, operates no staging environment, inspects no data, interviews no business user, and accepts nothing on anyone's behalf: a sign-off is checked as a declared record (a named role, a signer name, a signed flag, an outcome), never granted, witnessed or validated by the atom. A round is sound *on your declared evidence*: a record that declares its criteria covered, its blockers resolved and its roles signed passes those checks even if the real round did none of it. It is not a testing service, an acceptance decision, or a guarantee that the product works or was actually accepted: it never judges whether a declared scenario is a good end-to-end business flow, whether the declared data really was anonymized, whether a declared signer actually signed, or whether the business should have accepted — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. The computed checks: the declared `acceptance_criteria` list must be present and name at least one criterion, with unique `criterion_id` values and a non-empty `description` on every row; the declared `scenarios` list must be present and name at least one scenario, with unique `scenario_id` values, every scenario's `criterion_ids` a non-empty list naming only declared criteria, and every declared criterion covered by at least one scenario; every scenario must declare `steps_recorded: true`, a non-empty `expected_outcome` and `timeboxed: true`; every scenario's `result` must be one of `passed`, `failed`, `blocked`, `not_run` and every scenario must be declared executed (its result is not `not_run`), with every failed or blocked scenario named by at least one declared defect row; the declared `defects` list must be present (an empty list passes — a round may genuinely find no defects), with unique `defect_id` values, every defect's `scenario_id` naming a declared scenario, a non-empty `severity` on every row, every `disposition` one of `fix_now`, `accept_with_note`, `defer_with_date`, a non-empty `disposition_note` on every `accept_with_note` row and a non-empty `defer_until` on every `defer_with_date` row; the declared `sign_off.outcome` must be one of `pass`, `conditional_pass`; `required_sign_off_roles` must name at least one role with no duplicates and `sign_offs` must name at least one row, with every sign-off row naming a required role, a non-empty `signer_name` and `signed: true`, and every required role holding a signed sign-off row; a declared `pass` outcome fails while any defect declaring severity exactly `blocker` is not declared `resolved: true` (a `conditional_pass` does not fail this check); every `fix_now` defect must be declared `resolved: true`; and each of the five `declared_totals` counts must recompute exactly against the declared rows (criteria, scenarios, executed scenarios — results other than `not_run` — defects, and required sign-off roles). Six further checks are gated on the record's own declared gate fields — when the gate is declared `false` (or, for the conditional checks, the outcome is not a conditional pass) the check passes as not applicable, when the gate field / outcome is absent the check is missing evidence, and when the gate applies the target declaration is required: anonymization is required only where `environment.production_data_used` is declared `true`, conditional-pass open items and a conditional owner are each required only where `sign_off.outcome` is declared `conditional_pass`, and re-test, regression and re-test-result recording are each required only where `retest.uat_fixes_made` is declared `true`. No numeric threshold is imposed — no minimum or maximum number of criteria, scenarios, defects or sign-off roles beyond at least one each where stated (and none at all for defects — zero is a legitimate declared outcome); no scenario pass-rate bar (the ratio is reported, never judged — a round with failed scenarios and a sound record is a sound record of a failed round); no defect-count, severity-mix or blocker-count bar beyond the skill's own recomputed no-pass-with-open-blocker rule; no severity scale beyond your own declared severity strings (only the exact declared value `blocker` carries the skill's red-line meaning); no timebox length in minutes; no triage cadence bar beyond the declared daily triage; no re-test or regression duration or coverage bar beyond completion as declared; no date-format or futurity bar on `defer_until` (checked as a non-empty declared date string only — the atom reads no clock); and no judgment that the product under UAT is good, acceptable or ready to ship (only that its declared UAT record contains what the skill requires — acceptance itself is the business's, never this atom's). Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "uat-scenario-sign-off-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/uat-scenario-sign-off-pack` — tool name `uat_scenario_sign_off_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/uat-scenario-sign-off-pack` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `uat_round_title` | UAT round title (string; carried into the output, not checked) |
| `scope.criteria_source_recorded` | scope evidence: the source of the acceptance criteria for this round was recorded |
| `scope.scope_defined_before_execution` | scope evidence: the UAT scope was defined before execution began |
| `scope.no_silent_scope_edits_during_uat` | scope evidence: no silent scope edits were made during the round |
| `acceptance_criteria` (list of criterion objects) | computed: must be present and name at least one criterion; reported as `uat_acceptance_criteria_count` |
| `acceptance_criteria[].criterion_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `acceptance_criteria[].description` (string) | computed: must be present and non-empty on every row |
| `scenarios` (list of scenario objects) | computed: must be present and name at least one scenario; reported as `uat_scenarios_count` |
| `scenarios[].scenario_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `scenarios[].criterion_ids` (list of strings) | computed: must be a non-empty list on every row, every id must name a declared criterion, and together the scenarios must cover every declared criterion |
| `scenarios[].steps_recorded` | computed: must be `true` on every row |
| `scenarios[].expected_outcome` (string) | computed: must be present and non-empty on every row |
| `scenarios[].timeboxed` | computed: must be `true` on every row |
| `scenarios[].result` (string) | computed: must be one of `passed`, `failed`, `blocked`, `not_run`, and must not be `not_run` (every scenario declared executed) |
| `environment.staging_mirrors_production` | environment evidence: staging mirrors production for this round |
| `environment.test_data_realistic` | environment evidence: the UAT test data was realistic |
| `environment.production_data_used` | gates the anonymization check: anonymization is required only where production data use is declared |
| `environment.test_data_anonymized` | required when `environment.production_data_used` is `true`; otherwise the check passes as not applicable |
| `people.business_owner_owns_uat` | people evidence: the business owner owns this UAT round |
| `people.business_owner_executes_uat` | people evidence: the business owner executes this UAT round |
| `people.supporting_team_assigned` | people evidence: the supporting team was assigned to this round |
| `people.scribe_assigned` | people evidence: one scribe was assigned to this round |
| `execution.execution_window_completed` | execution evidence: the UAT execution window for this round was completed |
| `execution.deviations_logged_as_defects` | execution evidence: deviations found in UAT were logged as defects |
| `defects` (list of defect objects) | computed: must be present; an empty list passes (a round may find no defects); reported as `uat_defects_count` |
| `defects[].defect_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `defects[].scenario_id` (string) | computed: must name one of the declared scenarios; every failed or blocked scenario must be named by at least one defect row |
| `defects[].severity` (string) | computed: must be present and non-empty on every row; the exact value `blocker` drives the blocker checks |
| `defects[].disposition` (string) | computed: must be one of `fix_now`, `accept_with_note`, `defer_with_date` |
| `defects[].disposition_note` (string) | computed: must be present and non-empty on `accept_with_note` rows |
| `defects[].defer_until` (string) | computed: must be present and non-empty on `defer_with_date` rows |
| `defects[].resolved` | computed: every `fix_now` defect must be `true`; a declared `pass` outcome fails while any `blocker` defect is not `true` |
| `triage.triage_held_daily` | triage evidence: defects were triaged daily during this round |
| `required_sign_off_roles` (list of strings) | computed: must name at least one role, with no duplicates; reported as `uat_required_sign_off_roles_count` |
| `sign_offs` (list of sign-off objects) | computed: must be present and name at least one row; reported as `uat_sign_offs_count` |
| `sign_offs[].role` (string) | computed: must name one of the declared required roles; every required role must hold a signed sign-off row |
| `sign_offs[].signer_name` (string) | computed: must be present and non-empty on every row |
| `sign_offs[].signed` | computed: must be `true` on every row |
| `sign_off.outcome` (string) | computed: must be one of `pass`, `conditional_pass` |
| `sign_off.conditional_open_items_listed` | required when `sign_off.outcome` is `conditional_pass`; otherwise the check passes as not applicable |
| `sign_off.conditional_owner_named` | gated as above: a conditional pass names an owner for its open items |
| `retest.uat_fixes_made` | gates the three re-test checks: each is required only where UAT fixes are declared made |
| `retest.changed_scenarios_retested` | required when `retest.uat_fixes_made` is `true`; otherwise the check passes as not applicable |
| `retest.touched_flows_regression_completed` | gated as above: regression on touched flows was completed after UAT fixes |
| `retest.retest_results_recorded` | gated as above: the re-test results after UAT fixes were recorded |
| `declared_totals.acceptance_criteria_count` (number) | computed: must equal the number of declared criterion rows |
| `declared_totals.scenarios_count` (number) | computed: must equal the number of declared scenario rows |
| `declared_totals.executed_scenarios_count` (number) | computed: must equal the number of scenarios whose result is not `not_run` |
| `declared_totals.defects_count` (number) | computed: must equal the number of declared defect rows |
| `declared_totals.sign_off_roles_count` (number) | computed: must equal the length of `required_sign_off_roles` |
| `red_lines.production_data_used_without_anonymization_present` | must be `false` to pass (red line: no UAT on production data without anonymization) |
| `red_lines.passed_while_blocker_defects_open_present` | must be `false` to pass (red line: no passed outcome while blockers are open) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward UAT_SIGN_OFF_NOT_SOUND). All fields are booleans or strings unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/uat-scenario-sign-off-pack`:

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

Response — HTTP 200 (trimmed; the full response carries all 56 checks and a text stamp of the verdict):

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
  "summary": "56 pass, 0 fail, 0 missing of 56 checks across seven sections."
}
```

## Verdicts

- **UAT_SIGN_OFF_SOUND** — every check passes; the declared UAT scenario and sign-off record is complete and internally consistent with the skill's method, quality gates and red lines.
- **UAT_SIGN_OFF_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `uat_acceptance_criteria_count`, `uat_scenarios_count`, `uat_executed_scenarios_count`, `uat_defects_count`, `uat_sign_offs_count` and `uat_required_sign_off_roles_count` (integers, exactly; null when the corresponding list is not declared), `duplicate_uat_criterion_ids`, `duplicate_uat_scenario_ids`, `duplicate_uat_defect_ids`, `duplicate_uat_required_sign_off_roles` and `duplicate_uat_sign_off_roles` (ids / roles carried by more than one row; each null when its list is not declared), `uat_criteria_without_description`, `uat_criteria_not_covered_by_any_scenario`, `uat_scenarios_without_criterion_reference`, `uat_scenarios_with_unknown_criterion_reference`, `uat_scenarios_without_steps_recorded`, `uat_scenarios_without_expected_outcome`, `uat_scenarios_not_timeboxed`, `uat_scenarios_with_invalid_result`, `uat_scenarios_not_executed`, `uat_failed_or_blocked_scenarios_without_defect`, `uat_defects_with_unknown_scenario_reference`, `uat_defects_without_severity`, `uat_defects_with_invalid_disposition`, `uat_accepted_defects_without_note`, `uat_deferred_defects_without_date`, `uat_fix_now_defects_unresolved`, `uat_open_blocker_defect_ids`, `uat_sign_offs_with_unknown_role`, `uat_sign_offs_without_signer_name`, `uat_sign_offs_not_signed` and `uat_required_roles_without_signed_sign_off` (the offending rows for each computed rule; each null when its underlying list is not declared), `uat_criterion_coverage_ratio` (declared criteria covered by at least one scenario ÷ declared criteria), `uat_scenario_execution_ratio` (executed scenarios ÷ declared scenarios), `uat_scenario_pass_ratio` (scenarios declared `passed` ÷ declared scenarios), `uat_defect_disposition_ratio` (defects with a recognised disposition ÷ declared defects) and `uat_sign_off_completion_ratio` (required roles with a signed sign-off ÷ declared required roles; each ratio a string with exactly six decimal places, and null when its denominator list is absent or empty — the coverage and sign-off ratios are also null when the covering / sign-off list is not declared), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the thirty-six primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
