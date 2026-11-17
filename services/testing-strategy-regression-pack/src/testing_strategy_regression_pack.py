#!/usr/bin/env python3
"""Testing strategy regression pack — deterministic core.

Built from the bound skill `testing-strategy`: "Test at the
right level for each risk — unit, integration, end-to-end —
plus regression per defect and flake control." Its method is
this atom's method: a pyramid (many unit tests for logic,
fewer integration tests for boundaries / DB / API, few e2e
tests for critical journeys); risk-first (test what breaks
expensively; P0 flows get e2e; tricky edge cases get unit
tests); deterministic fixtures (no shared mutable state,
explicit seed data, time and randomness controlled); bug ->
test (every confirmed defect gets a failing test before the
fix, and keeps it forever); a flake policy (quarantine
immediately, fix within a week, or delete consciously; a
flaky test is worse than none); negative testing (invalid
input, timeouts, partial failures, retries — assert sane
failure, not just "no crash"); and honest reporting (what
ran, what passed, what is NOT covered). Its artifacts are
test suites per level, fixtures, and a short TEST-PLAN.md
for non-trivial work stating what is excluded. Its quality
gates are: full suite green before handoff (no skipped /
quarantined without a tracked ticket), critical journeys
covered end-to-end, every fixed bug has a regression test,
and coverage gaps stated explicitly in the report. Its red
lines are this atom's red lines: tests must not depend on
production systems or live data; and never "fix" a test by
weakening its assertion — fix the code or delete the test
deliberately.

This atom is a DELIVERABLE audit of a declared testing
strategy + regression plan record: it audits the record a
caller declares — the scope / risk declarations, the
declared risk rows, the declared test-level rows tied to
those risks, the declared change rows, the declared
regression-suite rows tied to those changes, the fixture,
flake, negative-testing, entry / exit and reporting
declarations, and the red lines refused. It runs no tests,
inspects no code, executes no suite and judges no test's
quality — it checks that the strategy / regression record
the skill requires is present and internally consistent on
the declared evidence, and it recomputes the coverage of
the declared risks and changes against the declared level
and regression rows exactly.

Distinct ground: the nearest siblings are
`designed-test-case-pack` (individual designed test cases —
equivalence classes, boundaries, decision tables for single
cases; this atom is the strategy + regression-scope level
above individual cases), `uat-scenario-sign-off-pack`
(authored in this same batch — business-user acceptance
scenarios and their sign-off by business users; this atom
is the engineering testing strategy and regression plan,
not business acceptance or its sign-off — the boundary is
unmistakable: engineering levels, regression scope and
flake control here; business scenarios and acceptance
sign-off there), and `correctness-verification-certificate`
(claims proved / verified at an evidence level, with proof
artifacts; this atom audits a testing plan, proves nothing).
This atom shares zero checks with any of them: every check
here is a testing-strategy question — risks declared and
covered at a declared level, P0 risks covered end-to-end,
declared changes covered by declared regression rows,
defect changes covered, fixtures deterministic, flakes
quarantined under a ticket, negative paths tested, entry /
exit declared, gaps reported, and no production / live-data
dependency or weakened assertion.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- risk rows: at least one declared row, unique risk ids, a
  non-empty description on every row, and a declared P0
  status on every row;
- test-level rows: at least one declared row, unique row
  ids, every level one of `unit` / `integration` / `e2e`
  (the three levels the skill names), every row's risk
  reference naming a declared risk, every declared risk
  covered by at least one level row, every P0 risk covered
  by at least one e2e row (the skill: P0 flows get e2e), and
  the pyramid counts in the skill's stated order — at least
  one row per level, with unit rows >= integration rows >=
  e2e rows (many / fewer / few);
- declared changes: at least one declared row, unique change
  ids, a non-empty description on every row, and every kind
  one of `feature` / `defect_fix` / `refactor` (the work
  kinds the skill names: feature build, bug fix, refactor);
- regression rows: at least one declared row, unique row
  ids, every row's change reference naming a declared
  change, every declared change covered by at least one
  regression row, every defect_fix change covered by at
  least one regression row, and every regression row
  declared kept permanently (the skill: a regression test
  is kept forever);
- gated declaration: a quarantine ticket is required only
  where known flakes are declared present.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no numeric coverage threshold at all — no
coverage-percentage bar, no test count beyond the pyramid's
stated order, no suite runtime bar — so no such check is
invented; quantities are computed and reported, with exact
coverage and consistency over the caller's own declared rows
as the only bars.

Verdict:
- any fail             -> TESTING_STRATEGY_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> TESTING_STRATEGY_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "scope_and_risk_declaration",
    "test_levels_and_pyramid",
    "regression_coverage",
    "fixtures_and_determinism",
    "flake_policy",
    "negative_testing",
    "entry_exit_and_reporting",
    "red_lines",
)

TEST_LEVELS = ("unit", "integration", "e2e")
CHANGE_KINDS = ("feature", "defect_fix", "refactor")

MANIFEST_SPEC = {
    "plan_title": "string",
    "scoping": {
        "scope_declared": "boolean",
        "risks_identified_before_planning": "boolean",
        "p0_flows_identified": "boolean",
        "test_plan_document_present": "boolean",
        "test_plan_states_exclusions": "boolean",
    },
    "risk_rows": [{
        "risk_id": "string",
        "description": "string",
        "is_p0": "boolean",
    }],
    "level_planning": {
        "pyramid_applied": "boolean",
        "logic_tested_at_unit_level": "boolean",
        "boundaries_tested_at_integration_level": "boolean",
        "critical_journeys_tested_at_e2e_level": "boolean",
        "tricky_edge_cases_tested_at_unit_level": "boolean",
    },
    "test_level_rows": [{
        "level_row_id": "string",
        "risk_id": "string",
        "test_level": "string",
    }],
    "regression_planning": {
        "regression_test_written_before_defect_fix": "boolean",
        "regression_tests_kept_permanently": "boolean",
        "every_fixed_bug_has_regression_test": "boolean",
    },
    "declared_changes": [{
        "change_id": "string",
        "change_kind": "string",
        "description": "string",
    }],
    "regression_rows": [{
        "regression_id": "string",
        "change_id": "string",
        "kept_permanently": "boolean",
    }],
    "fixtures": {
        "no_shared_mutable_state": "boolean",
        "explicit_seed_data_used": "boolean",
        "time_controlled": "boolean",
        "randomness_controlled": "boolean",
        "fixtures_declared_for_suites": "boolean",
    },
    "flake_policy": {
        "known_flakes_present": "boolean",
        "flakes_quarantined_immediately": "boolean",
        "flakes_fixed_within_a_week_or_deleted_consciously": "boolean",
        "no_quarantined_test_without_tracked_ticket": "boolean",
        "quarantine_ticket_recorded": "boolean",
    },
    "negative_testing": {
        "invalid_input_tested": "boolean",
        "timeouts_tested": "boolean",
        "partial_failures_tested": "boolean",
        "retries_tested": "boolean",
        "sane_failure_asserted": "boolean",
    },
    "entry_exit_and_reporting": {
        "entry_criteria_declared": "boolean",
        "exit_criteria_declared": "boolean",
        "full_suite_green_before_handoff": "boolean",
        "report_states_what_ran": "boolean",
        "report_states_what_passed": "boolean",
        "report_states_what_not_covered": "boolean",
        "coverage_gaps_stated_explicitly": "boolean",
    },
    "red_lines": {
        "tests_depend_on_production_systems_present": "boolean",
        "tests_depend_on_live_data_present": "boolean",
        "assertion_weakened_to_fix_test_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _row_name(entry, field):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


def _duplicates(rows, field):
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get(field), str):
            nm = c[field]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def _ids(rows, field):
    return [c[field] for c in rows
            if isinstance(c, dict) and isinstance(c.get(field), str)]


def evaluate(manifest):
    """Return the verdict dict for a testing strategy manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    risks, has_risks = _get(manifest, "risk_rows")
    risks_is_list = has_risks and isinstance(risks, list)
    risks_count = len(risks) if risks_is_list else None
    risk_rows = risks if risks_is_list else []
    risk_ids = _ids(risk_rows, "risk_id")
    p0_risk_ids = [c["risk_id"] for c in risk_rows
                   if isinstance(c, dict)
                   and isinstance(c.get("risk_id"), str)
                   and c.get("is_p0") is True]

    levels, has_levels = _get(manifest, "test_level_rows")
    levels_is_list = has_levels and isinstance(levels, list)
    levels_count = len(levels) if levels_is_list else None
    level_rows = levels if levels_is_list else []
    unit_count = (sum(1 for c in level_rows
                      if isinstance(c, dict)
                      and c.get("test_level") == "unit")
                  if levels_is_list else None)
    integration_count = (sum(1 for c in level_rows
                             if isinstance(c, dict)
                             and c.get("test_level") == "integration")
                         if levels_is_list else None)
    e2e_count = (sum(1 for c in level_rows
                     if isinstance(c, dict)
                     and c.get("test_level") == "e2e")
                 if levels_is_list else None)
    covered_risk_ids = _ids(level_rows, "risk_id")
    e2e_risk_ids = [c["risk_id"] for c in level_rows
                    if isinstance(c, dict)
                    and isinstance(c.get("risk_id"), str)
                    and c.get("test_level") == "e2e"]

    changes, has_changes = _get(manifest, "declared_changes")
    changes_is_list = has_changes and isinstance(changes, list)
    changes_count = len(changes) if changes_is_list else None
    change_rows = changes if changes_is_list else []
    change_ids = _ids(change_rows, "change_id")
    defect_change_ids = [c["change_id"] for c in change_rows
                         if isinstance(c, dict)
                         and isinstance(c.get("change_id"), str)
                         and c.get("change_kind") == "defect_fix"]

    regs, has_regs = _get(manifest, "regression_rows")
    regs_is_list = has_regs and isinstance(regs, list)
    regs_count = len(regs) if regs_is_list else None
    reg_rows = regs if regs_is_list else []
    reg_covered_change_ids = _ids(reg_rows, "change_id")

    duplicate_risk_ids = (
        _duplicates(risk_rows, "risk_id") if risks_is_list else None)
    duplicate_level_row_ids = (
        _duplicates(level_rows, "level_row_id")
        if levels_is_list else None)
    duplicate_change_ids = (
        _duplicates(change_rows, "change_id")
        if changes_is_list else None)
    duplicate_regression_ids = (
        _duplicates(reg_rows, "regression_id") if regs_is_list else None)

    risks_without_description = (
        [_row_name(c, "risk_id") for c in risk_rows
         if _has(c, "description")
         and not _nonempty_str(c.get("description"))]
        if risks_is_list else None)
    risks_without_p0_status = (
        [_row_name(c, "risk_id") for c in risk_rows
         if not _has(c, "is_p0")]
        if risks_is_list else None)
    level_rows_with_invalid_level = (
        [_row_name(c, "level_row_id") for c in level_rows
         if _has(c, "test_level")
         and c.get("test_level") not in TEST_LEVELS]
        if levels_is_list else None)
    level_rows_with_unknown_risk = (
        [_row_name(c, "level_row_id") for c in level_rows
         if _has(c, "risk_id") and c.get("risk_id") not in risk_ids]
        if levels_is_list and risks_is_list else None)
    risks_without_level_row = (
        [rid for rid in risk_ids if rid not in covered_risk_ids]
        if risks_is_list and levels_is_list else None)
    p0_risks_without_e2e = (
        [rid for rid in p0_risk_ids if rid not in e2e_risk_ids]
        if risks_is_list and levels_is_list else None)
    changes_without_description = (
        [_row_name(c, "change_id") for c in change_rows
         if _has(c, "description")
         and not _nonempty_str(c.get("description"))]
        if changes_is_list else None)
    changes_with_invalid_kind = (
        [_row_name(c, "change_id") for c in change_rows
         if _has(c, "change_kind")
         and c.get("change_kind") not in CHANGE_KINDS]
        if changes_is_list else None)
    reg_rows_with_unknown_change = (
        [_row_name(c, "regression_id") for c in reg_rows
         if _has(c, "change_id")
         and c.get("change_id") not in change_ids]
        if regs_is_list and changes_is_list else None)
    changes_without_regression = (
        [cid for cid in change_ids
         if cid not in reg_covered_change_ids]
        if changes_is_list and regs_is_list else None)
    defect_changes_without_regression = (
        [cid for cid in defect_change_ids
         if cid not in reg_covered_change_ids]
        if changes_is_list and regs_is_list else None)
    reg_rows_not_permanent = (
        [_row_name(c, "regression_id") for c in reg_rows
         if _has(c, "kept_permanently")
         and c.get("kept_permanently") is not True]
        if regs_is_list else None)

    risk_level_coverage_ratio = (
        len([r for r in risk_ids if r in covered_risk_ids]) / risks_count
        if risks_is_list and levels_is_list and risks_count > 0 else None)
    p0_e2e_coverage_ratio = (
        len([r for r in p0_risk_ids if r in e2e_risk_ids])
        / len(p0_risk_ids)
        if risks_is_list and levels_is_list and len(p0_risk_ids) > 0
        else None)
    change_regression_coverage_ratio = (
        len([c for c in change_ids if c in reg_covered_change_ids])
        / changes_count
        if changes_is_list and regs_is_list and changes_count > 0
        else None)
    defect_regression_coverage_ratio = (
        len([c for c in defect_change_ids
             if c in reg_covered_change_ids]) / len(defect_change_ids)
        if changes_is_list and regs_is_list
        and len(defect_change_ids) > 0 else None)

    # ---- Section 1: scope_and_risk_declaration ----
    _bool_check(results, "scope_and_risk_declaration",
                "testing_strategy_scope_declared", manifest,
                ("scoping", "scope_declared"),
                "scope: the system / change scope the strategy covers is declared")
    _bool_check(results, "scope_and_risk_declaration",
                "testing_strategy_risks_identified_before_planning", manifest,
                ("scoping", "risks_identified_before_planning"),
                "risk-first: the risks were identified before levels were planned — test what breaks expensively")
    _bool_check(results, "scope_and_risk_declaration",
                "testing_strategy_p0_flows_identified", manifest,
                ("scoping", "p0_flows_identified"),
                "risk-first: the P0 flows are identified in the declared record")
    _bool_check(results, "scope_and_risk_declaration",
                "testing_strategy_test_plan_document_present", manifest,
                ("scoping", "test_plan_document_present"),
                "artifacts: a short test-plan document is present for the work")
    _bool_check(results, "scope_and_risk_declaration",
                "testing_strategy_test_plan_states_exclusions", manifest,
                ("scoping", "test_plan_states_exclusions"),
                "artifacts: the test plan states what is excluded")
    _check(results, "scope_and_risk_declaration",
           "testing_strategy_risk_rows_list_declared", risks,
           risks_is_list, risks_is_list and risks_count > 0,
           "risk rows: the declared record names its risks — the list is present and names at least one risk; an absent list is missing evidence and an empty list declares no risk-first strategy at all")
    risk_id_present = risks_is_list and all(
        _has(c, "risk_id") for c in risk_rows)
    _check(results, "scope_and_risk_declaration",
           "every_testing_strategy_risk_id_unique", risks,
           risk_id_present,
           risks_is_list and duplicate_risk_ids is not None
           and len(duplicate_risk_ids) == 0,
           "risk rows: no declared risk_id is owned by more than one row")
    desc_present = risks_is_list and all(
        _has(c, "description") for c in risk_rows)
    _check(results, "scope_and_risk_declaration",
           "every_testing_strategy_risk_description_declared", risks,
           desc_present,
           risks_is_list
           and all(_nonempty_str(c.get("description")) for c in risk_rows),
           "risk rows: every declared risk declares a non-empty description")
    p0_present = risks_is_list and all(
        _has(c, "is_p0") for c in risk_rows)
    _check(results, "scope_and_risk_declaration",
           "every_testing_strategy_risk_p0_status_declared", risks,
           p0_present,
           risks_is_list
           and all(_has(c, "is_p0") for c in risk_rows),
           "risk rows: every declared risk declares whether it is a P0 risk")

    # ---- Section 2: test_levels_and_pyramid ----
    _bool_check(results, "test_levels_and_pyramid",
                "testing_strategy_pyramid_applied", manifest,
                ("level_planning", "pyramid_applied"),
                "pyramid: the test pyramid is applied — many unit, fewer integration, few e2e")
    _bool_check(results, "test_levels_and_pyramid",
                "testing_strategy_logic_tested_at_unit_level", manifest,
                ("level_planning", "logic_tested_at_unit_level"),
                "pyramid: logic is tested at the unit level")
    _bool_check(results, "test_levels_and_pyramid",
                "testing_strategy_boundaries_tested_at_integration_level",
                manifest,
                ("level_planning", "boundaries_tested_at_integration_level"),
                "pyramid: boundaries, DB and API are tested at the integration level")
    _bool_check(results, "test_levels_and_pyramid",
                "testing_strategy_critical_journeys_tested_at_e2e_level",
                manifest,
                ("level_planning", "critical_journeys_tested_at_e2e_level"),
                "pyramid / quality gate: critical journeys are covered end-to-end")
    _bool_check(results, "test_levels_and_pyramid",
                "testing_strategy_tricky_edge_cases_tested_at_unit_level",
                manifest,
                ("level_planning", "tricky_edge_cases_tested_at_unit_level"),
                "risk-first: tricky edge cases get unit tests")
    _check(results, "test_levels_and_pyramid",
           "testing_strategy_test_level_rows_list_declared", levels,
           levels_is_list, levels_is_list and levels_count > 0,
           "level rows: the declared record names its test-level rows — the list is present and names at least one row; an absent list is missing evidence and an empty list declares no level plan at all")
    level_id_present = levels_is_list and all(
        _has(c, "level_row_id") for c in level_rows)
    _check(results, "test_levels_and_pyramid",
           "every_testing_strategy_test_level_row_id_unique", levels,
           level_id_present,
           levels_is_list and duplicate_level_row_ids is not None
           and len(duplicate_level_row_ids) == 0,
           "level rows: no declared level_row_id is owned by more than one row")
    lvl_present = levels_is_list and all(
        _has(c, "test_level") for c in level_rows)
    _check(results, "test_levels_and_pyramid",
           "every_testing_strategy_test_level_row_level_recognised",
           levels, lvl_present,
           levels_is_list
           and all(c.get("test_level") in TEST_LEVELS for c in level_rows),
           "level rows: every declared row's level is one of unit, integration, e2e — the three levels the skill names")
    ref_present = (levels_is_list and risks_is_list and all(
        _has(c, "risk_id") for c in level_rows))
    _check(results, "test_levels_and_pyramid",
           "every_testing_strategy_test_level_row_risk_reference_resolves",
           levels, ref_present,
           levels_is_list and risks_is_list
           and all(_has(c, "risk_id")
                   and c.get("risk_id") in risk_ids for c in level_rows),
           "level rows: every declared row's risk_id names a risk in the declared risk list")
    cover_present = (risks_is_list and levels_is_list and all(
        _has(c, "risk_id") for c in level_rows))
    _check(results, "test_levels_and_pyramid",
           "every_testing_strategy_declared_risk_covered_by_level_row",
           levels, cover_present,
           risks_is_list and levels_is_list
           and all(rid in covered_risk_ids for rid in risk_ids),
           "level rows / risk-first: every declared risk is covered by at least one declared test-level row")
    p0_cover_present = (risks_is_list and levels_is_list
                        and all(_has(c, "is_p0") for c in risk_rows)
                        and all(_has(c, "risk_id") and _has(c, "test_level")
                                for c in level_rows))
    _check(results, "test_levels_and_pyramid",
           "every_testing_strategy_p0_risk_covered_by_e2e_row",
           levels, p0_cover_present,
           risks_is_list and levels_is_list
           and all(rid in e2e_risk_ids for rid in p0_risk_ids),
           "level rows / risk-first: every declared P0 risk is covered by at least one declared e2e row — P0 flows get e2e")
    pyramid_present = levels_is_list and all(
        _has(c, "test_level") for c in level_rows)
    _check(results, "test_levels_and_pyramid",
           "testing_strategy_pyramid_level_counts_in_declared_order",
           levels, pyramid_present,
           levels_is_list and unit_count is not None
           and e2e_count is not None and e2e_count >= 1
           and unit_count >= integration_count >= e2e_count,
           "pyramid: the declared level-row counts follow the skill's stated order — at least one row per level, unit rows >= integration rows >= e2e rows (many / fewer / few)")

    # ---- Section 3: regression_coverage ----
    _bool_check(results, "regression_coverage",
                "regression_pack_regression_test_written_before_defect_fix",
                manifest,
                ("regression_planning",
                 "regression_test_written_before_defect_fix"),
                "bug -> test: for bug fixes the regression test is written first, before the fix")
    _bool_check(results, "regression_coverage",
                "regression_pack_regression_tests_kept_permanently_declared",
                manifest,
                ("regression_planning", "regression_tests_kept_permanently"),
                "bug -> test: a regression test, once written for a confirmed defect, is kept forever")
    _bool_check(results, "regression_coverage",
                "regression_pack_every_fixed_bug_has_regression_test_declared",
                manifest,
                ("regression_planning",
                 "every_fixed_bug_has_regression_test"),
                "quality gate: every fixed bug has a regression test")
    _check(results, "regression_coverage",
           "regression_pack_declared_changes_list_declared", changes,
           changes_is_list, changes_is_list and changes_count > 0,
           "declared changes: the declared record names its change rows — the list is present and names at least one change; an absent list is missing evidence and an empty list declares no regression scope at all")
    change_id_present = changes_is_list and all(
        _has(c, "change_id") for c in change_rows)
    _check(results, "regression_coverage",
           "every_regression_pack_change_id_unique", changes,
           change_id_present,
           changes_is_list and duplicate_change_ids is not None
           and len(duplicate_change_ids) == 0,
           "declared changes: no declared change_id is owned by more than one row")
    cdesc_present = changes_is_list and all(
        _has(c, "description") for c in change_rows)
    _check(results, "regression_coverage",
           "every_regression_pack_change_description_declared", changes,
           cdesc_present,
           changes_is_list
           and all(_nonempty_str(c.get("description"))
                   for c in change_rows),
           "declared changes: every declared change declares a non-empty description")
    kind_present = changes_is_list and all(
        _has(c, "change_kind") for c in change_rows)
    _check(results, "regression_coverage",
           "every_regression_pack_change_kind_recognised", changes,
           kind_present,
           changes_is_list
           and all(c.get("change_kind") in CHANGE_KINDS
                   for c in change_rows),
           "declared changes: every declared change's kind is one of feature, defect_fix, refactor — the work kinds the skill names")
    _check(results, "regression_coverage",
           "regression_pack_regression_rows_list_declared", regs,
           regs_is_list, regs_is_list and regs_count > 0,
           "regression rows: the declared record names its regression-suite rows — the list is present and names at least one row; an absent list is missing evidence and an empty list declares no regression suite at all")
    reg_id_present = regs_is_list and all(
        _has(c, "regression_id") for c in reg_rows)
    _check(results, "regression_coverage",
           "every_regression_pack_regression_row_id_unique", regs,
           reg_id_present,
           regs_is_list and duplicate_regression_ids is not None
           and len(duplicate_regression_ids) == 0,
           "regression rows: no declared regression_id is owned by more than one row")
    rref_present = (regs_is_list and changes_is_list and all(
        _has(c, "change_id") for c in reg_rows))
    _check(results, "regression_coverage",
           "every_regression_pack_regression_row_change_reference_resolves",
           regs, rref_present,
           regs_is_list and changes_is_list
           and all(_has(c, "change_id")
                   and c.get("change_id") in change_ids for c in reg_rows),
           "regression rows: every declared row's change_id names a change in the declared change list")
    rcover_present = (changes_is_list and regs_is_list and all(
        _has(c, "change_id") for c in reg_rows))
    _check(results, "regression_coverage",
           "every_regression_pack_declared_change_covered_by_regression_row",
           regs, rcover_present,
           changes_is_list and regs_is_list
           and all(cid in reg_covered_change_ids for cid in change_ids),
           "regression rows: every declared change is covered by at least one declared regression row")
    dcover_present = (changes_is_list and regs_is_list
                      and all(_has(c, "change_kind") for c in change_rows)
                      and all(_has(c, "change_id") for c in reg_rows))
    _check(results, "regression_coverage",
           "every_regression_pack_defect_change_covered_by_regression_row",
           regs, dcover_present,
           changes_is_list and regs_is_list
           and all(cid in reg_covered_change_ids
                   for cid in defect_change_ids),
           "regression rows / bug -> test: every declared defect_fix change is covered by at least one declared regression row")
    perm_present = regs_is_list and all(
        _has(c, "kept_permanently") for c in reg_rows)
    _check(results, "regression_coverage",
           "every_regression_pack_regression_row_kept_permanently", regs,
           perm_present,
           regs_is_list
           and all(c.get("kept_permanently") is True for c in reg_rows),
           "regression rows: every declared regression row is declared kept permanently — it is kept forever")

    # ---- Section 4: fixtures_and_determinism ----
    _bool_check(results, "fixtures_and_determinism",
                "testing_strategy_fixtures_have_no_shared_mutable_state",
                manifest, ("fixtures", "no_shared_mutable_state"),
                "fixtures: fixtures have no shared mutable state")
    _bool_check(results, "fixtures_and_determinism",
                "testing_strategy_fixtures_use_explicit_seed_data",
                manifest, ("fixtures", "explicit_seed_data_used"),
                "fixtures: fixtures use explicit seed data")
    _bool_check(results, "fixtures_and_determinism",
                "testing_strategy_time_controlled_in_fixtures",
                manifest, ("fixtures", "time_controlled"),
                "fixtures: time is controlled in the fixtures")
    _bool_check(results, "fixtures_and_determinism",
                "testing_strategy_randomness_controlled_in_fixtures",
                manifest, ("fixtures", "randomness_controlled"),
                "fixtures: randomness is controlled in the fixtures")
    _bool_check(results, "fixtures_and_determinism",
                "testing_strategy_fixtures_declared_for_suites",
                manifest, ("fixtures", "fixtures_declared_for_suites"),
                "artifacts / fixtures: fixtures are declared for the suites per level")

    # ---- Section 5: flake_policy ----
    _bool_check(results, "flake_policy",
                "testing_strategy_flakes_quarantined_immediately",
                manifest,
                ("flake_policy", "flakes_quarantined_immediately"),
                "flake policy: a flaky test is quarantined immediately")
    _bool_check(results, "flake_policy",
                "testing_strategy_flakes_fixed_within_a_week_or_deleted_consciously",
                manifest,
                ("flake_policy",
                 "flakes_fixed_within_a_week_or_deleted_consciously"),
                "flake policy: a quarantined flake is fixed within a week, or deleted consciously")
    _bool_check(results, "flake_policy",
                "testing_strategy_no_quarantined_test_without_tracked_ticket_declared",
                manifest,
                ("flake_policy",
                 "no_quarantined_test_without_tracked_ticket"),
                "quality gate: no skipped or quarantined test is left without a tracked ticket")
    _gated_bool_check(
        results, "flake_policy",
        "testing_strategy_quarantine_ticket_recorded_where_flakes_present",
        manifest,
        ("flake_policy", "known_flakes_present"),
        ("flake_policy", "quarantine_ticket_recorded"),
        "flake policy / quality gate: a tracked ticket is recorded for the quarantined flakes declared present",
        "no known flakes declared present")

    # ---- Section 6: negative_testing ----
    _bool_check(results, "negative_testing",
                "testing_strategy_negative_invalid_input_tested",
                manifest, ("negative_testing", "invalid_input_tested"),
                "negative testing: invalid input is tested")
    _bool_check(results, "negative_testing",
                "testing_strategy_negative_timeouts_tested",
                manifest, ("negative_testing", "timeouts_tested"),
                "negative testing: timeouts are tested")
    _bool_check(results, "negative_testing",
                "testing_strategy_negative_partial_failures_tested",
                manifest, ("negative_testing", "partial_failures_tested"),
                "negative testing: partial failures are tested")
    _bool_check(results, "negative_testing",
                "testing_strategy_negative_retries_tested",
                manifest, ("negative_testing", "retries_tested"),
                "negative testing: retries are tested")
    _bool_check(results, "negative_testing",
                "testing_strategy_negative_sane_failure_asserted",
                manifest, ("negative_testing", "sane_failure_asserted"),
                "negative testing: sane failure is asserted, not just \"no crash\"")

    # ---- Section 7: entry_exit_and_reporting ----
    _bool_check(results, "entry_exit_and_reporting",
                "testing_strategy_entry_criteria_declared", manifest,
                ("entry_exit_and_reporting", "entry_criteria_declared"),
                "entry / exit: the entry criteria for testing are declared")
    _bool_check(results, "entry_exit_and_reporting",
                "testing_strategy_exit_criteria_declared", manifest,
                ("entry_exit_and_reporting", "exit_criteria_declared"),
                "entry / exit: the exit criteria for testing are declared")
    _bool_check(results, "entry_exit_and_reporting",
                "testing_strategy_full_suite_green_before_handoff", manifest,
                ("entry_exit_and_reporting",
                 "full_suite_green_before_handoff"),
                "quality gate: the full suite is green before handoff")
    _bool_check(results, "entry_exit_and_reporting",
                "testing_strategy_report_states_what_ran", manifest,
                ("entry_exit_and_reporting", "report_states_what_ran"),
                "honest reporting: the report states what ran")
    _bool_check(results, "entry_exit_and_reporting",
                "testing_strategy_report_states_what_passed", manifest,
                ("entry_exit_and_reporting", "report_states_what_passed"),
                "honest reporting: the report states what passed")
    _bool_check(results, "entry_exit_and_reporting",
                "testing_strategy_report_states_what_not_covered", manifest,
                ("entry_exit_and_reporting",
                 "report_states_what_not_covered"),
                "honest reporting: the report states what is NOT covered")
    _bool_check(results, "entry_exit_and_reporting",
                "testing_strategy_coverage_gaps_stated_explicitly", manifest,
                ("entry_exit_and_reporting",
                 "coverage_gaps_stated_explicitly"),
                "quality gate: coverage gaps are stated explicitly in the report")

    # ---- Section 8: red_lines ----
    _false_check(results, "red_lines",
                 "testing_strategy_free_of_production_system_dependency",
                 manifest,
                 ("red_lines", "tests_depend_on_production_systems_present"),
                 "red line: no test depends on a production system")
    _false_check(results, "red_lines",
                 "testing_strategy_free_of_live_data_dependency",
                 manifest,
                 ("red_lines", "tests_depend_on_live_data_present"),
                 "red line: no test depends on live data")
    _false_check(results, "red_lines",
                 "testing_strategy_free_of_assertion_weakened_to_fix_test",
                 manifest,
                 ("red_lines", "assertion_weakened_to_fix_test_present"),
                 "red line: no test was \"fixed\" by weakening its assertion — the code was fixed, or the test deleted deliberately")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "TESTING_STRATEGY_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "TESTING_STRATEGY_SOUND"

    computed_names = (
        "testing_strategy_risk_rows_list_declared",
        "every_testing_strategy_risk_id_unique",
        "every_testing_strategy_risk_description_declared",
        "every_testing_strategy_risk_p0_status_declared",
        "testing_strategy_test_level_rows_list_declared",
        "every_testing_strategy_test_level_row_id_unique",
        "every_testing_strategy_test_level_row_level_recognised",
        "every_testing_strategy_test_level_row_risk_reference_resolves",
        "every_testing_strategy_declared_risk_covered_by_level_row",
        "every_testing_strategy_p0_risk_covered_by_e2e_row",
        "testing_strategy_pyramid_level_counts_in_declared_order",
        "regression_pack_declared_changes_list_declared",
        "every_regression_pack_change_id_unique",
        "every_regression_pack_change_description_declared",
        "every_regression_pack_change_kind_recognised",
        "regression_pack_regression_rows_list_declared",
        "every_regression_pack_regression_row_id_unique",
        "every_regression_pack_regression_row_change_reference_resolves",
        "every_regression_pack_declared_change_covered_by_regression_row",
        "every_regression_pack_defect_change_covered_by_regression_row",
        "every_regression_pack_regression_row_kept_permanently",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "testing-strategy-regression-pack",
        "atom_version": "0.1.0",
        "plan_title": manifest.get("plan_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "risk_rows_count": risks_count,
        "test_level_rows_count": levels_count,
        "declared_changes_count": changes_count,
        "regression_rows_count": regs_count,
        "unit_level_row_count": unit_count,
        "integration_level_row_count": integration_count,
        "e2e_level_row_count": e2e_count,
        "duplicate_risk_ids": duplicate_risk_ids,
        "duplicate_test_level_row_ids": duplicate_level_row_ids,
        "duplicate_change_ids": duplicate_change_ids,
        "duplicate_regression_row_ids": duplicate_regression_ids,
        "risks_without_description": risks_without_description,
        "risks_without_p0_status": risks_without_p0_status,
        "test_level_rows_with_invalid_level": level_rows_with_invalid_level,
        "test_level_rows_with_unknown_risk_reference": level_rows_with_unknown_risk,
        "declared_risks_without_test_level_row": risks_without_level_row,
        "p0_risks_without_e2e_row": p0_risks_without_e2e,
        "declared_changes_without_description": changes_without_description,
        "declared_changes_with_invalid_kind": changes_with_invalid_kind,
        "regression_rows_with_unknown_change_reference": reg_rows_with_unknown_change,
        "declared_changes_without_regression_row": changes_without_regression,
        "defect_changes_without_regression_row": defect_changes_without_regression,
        "regression_rows_not_declared_permanent": reg_rows_not_permanent,
        "risk_level_coverage_ratio": _fmt6(risk_level_coverage_ratio),
        "p0_e2e_coverage_ratio": _fmt6(p0_e2e_coverage_ratio),
        "change_regression_coverage_ratio": _fmt6(change_regression_coverage_ratio),
        "defect_regression_coverage_ratio": _fmt6(defect_regression_coverage_ratio),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across eight sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "TESTING STRATEGY REGRESSION PACK",
        f"plan_title: {verdict.get('plan_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: testing_strategy_regression_pack.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "TESTING_STRATEGY_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
