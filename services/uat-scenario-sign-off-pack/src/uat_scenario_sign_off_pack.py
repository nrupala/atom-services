#!/usr/bin/env python3
"""UAT scenario sign-off pack — deterministic core.

Built from the bound skill `user-acceptance-testing`: "UAT is
the business saying 'this is what we asked for'. Run it as a
real gate: scenarios from acceptance criteria, realistic data,
explicit sign-off." Its method is this atom's method: map every
acceptance criterion to a UAT scenario — an end-to-end business
flow, not clicks; run in staging that mirrors production with
realistic but anonymized data, never live personal data; the
business owner owns and executes, the team supports, one
scribe; scripts carry scenario, steps, expected outcome and
pass/fail, are timeboxed, and deviations are logged as defects
with severity; triage daily — fix now / accept with note /
defer with a date, with no silent scope edits mid-UAT; sign-off
is explicit — pass, or conditional pass listing open items —
and sign-off is an artifact, not a vibe; after fixes, re-test
changed scenarios and run regression on touched flows. Its
quality gates are: all acceptance criteria mapped to
scenarios; sign-off recorded (or conditional with a named
owner); defects classified and dispositioned; re-test plus
regression completed after any UAT fix. Its red lines are this
atom's red lines: no UAT on production data without
anonymization; no "passed" while blockers are open.

This atom is a DELIVERABLE audit of a DECLARED UAT record: it
audits the record a caller declares — the declared acceptance-
criterion rows, the declared UAT scenario rows tied to those
criteria, the environment / people / script declarations, the
declared execution-result rows, the declared defect rows with
their severity and disposition declarations, the declared
sign-off rows by named role, the re-test / regression
declarations, the declared totals, and the red lines refused.
It runs no UAT, executes no scenario, tests no product, and
accepts nothing on anyone's behalf: a sign-off is checked as a
DECLARED record, never granted by the atom. It checks that the
UAT record the skill requires is present and internally
consistent on the declared evidence, and it recomputes
coverage, execution, disposition and sign-off completeness
over the declared rows exactly.

Distinct ground: the nearest siblings are
`designed-test-case-pack` (designed ENGINEERING test cases —
equivalence classes, boundaries, decision tables and state
transitions for a test suite), `testing-strategy-regression-pack`
(authored in the same batch — an ENGINEERING testing strategy
and its regression scope: what the builders test and re-test),
and `buyer-test-card` (a buyer's own bounded test of a product
they are considering buying). This atom shares zero checks
with any of them: every check here is a business-acceptance
question — business-user scenarios mapped from acceptance
criteria, a business owner owning the round, realistic
anonymized data, defects triaged in business dispositions, an
explicit business sign-off record by required role, and
re-test after UAT fixes. The boundary is unmistakable: the
acceptance layer and its sign-off record here; engineering
test-case design, engineering testing strategy and regression
scope, and a buyer's own product test there.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- criteria: at least one declared row, unique criterion ids,
  and a non-empty description on every row;
- scenarios: at least one declared row, unique scenario ids,
  every scenario naming at least one declared criterion, and
  every declared criterion covered by at least one scenario
  (the skill's first quality gate, stated exactly);
- scenario scripts: steps recorded, a non-empty expected
  outcome, and timeboxed declared on every row;
- execution: every scenario's result one of `passed` /
  `failed` / `blocked` / `not_run` (the record's result
  vocabulary for the skill's pass/fail scripts), every
  scenario declared executed (a result other than `not_run`),
  and every failed or blocked scenario naming at least one
  declared defect row (deviations logged as defects);
- defects: the list may be empty (a round may find none) but
  must be declared; unique defect ids; every defect naming a
  declared scenario; a non-empty severity on every row; every
  disposition one of `fix_now` / `accept_with_note` /
  `defer_with_date` (the three dispositions the skill names);
  a note on every accepted defect and a date on every deferred
  defect; every `fix_now` defect declared resolved;
- sign-off: the outcome one of `pass` / `conditional_pass`
  (the two outcomes the skill names); at least one required
  role; unique required roles; every sign-off row naming a
  required role, a non-empty signer name and `signed: true`;
  every required role signed off; a declared `pass` outcome
  fails while any defect declaring severity `blocker` is not
  declared resolved (the skill's second red line, recomputed);
- declared totals: the caller's declared counts for criteria,
  scenarios, executed scenarios, defects and required sign-off
  roles each recompute exactly against the declared rows;
- gated declarations: anonymization is required only where
  production data use is declared, conditional-pass open items
  and a conditional owner are required only where a conditional
  pass is declared, and re-test / regression / re-test-result
  recording are required only where UAT fixes are declared made.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no numeric threshold at all — no scenario
count, no pass-rate bar, no defect-count or severity-mix bar,
no timebox length, no triage or re-test duration — so no such
check is invented; those quantities are caller declarations at
most, and quantities here are computed and reported, with
exact coverage and completeness over the caller's own declared
rows as the only bars.

Verdict:
- any fail             -> UAT_SIGN_OFF_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> UAT_SIGN_OFF_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "scope_and_criteria_mapping",
    "environment_people_and_scripts",
    "execution_and_results",
    "defects_and_triage",
    "sign_off_record",
    "retest_and_regression_after_fixes",
    "red_lines",
)

RESULT_KINDS = ("passed", "failed", "blocked", "not_run")
DISPOSITIONS = ("fix_now", "accept_with_note", "defer_with_date")
SIGN_OFF_OUTCOMES = ("pass", "conditional_pass")

MANIFEST_SPEC = {
    "uat_round_title": "string",
    "scope": {
        "criteria_source_recorded": "boolean",
        "scope_defined_before_execution": "boolean",
        "no_silent_scope_edits_during_uat": "boolean",
    },
    "acceptance_criteria": [{
        "criterion_id": "string",
        "description": "string",
    }],
    "scenarios": [{
        "scenario_id": "string",
        "criterion_ids": ["string"],
        "steps_recorded": "boolean",
        "expected_outcome": "string",
        "timeboxed": "boolean",
        "result": "string",
    }],
    "environment": {
        "staging_mirrors_production": "boolean",
        "test_data_realistic": "boolean",
        "production_data_used": "boolean",
        "test_data_anonymized": "boolean",
    },
    "people": {
        "business_owner_owns_uat": "boolean",
        "business_owner_executes_uat": "boolean",
        "supporting_team_assigned": "boolean",
        "scribe_assigned": "boolean",
    },
    "execution": {
        "execution_window_completed": "boolean",
        "deviations_logged_as_defects": "boolean",
    },
    "defects": [{
        "defect_id": "string",
        "scenario_id": "string",
        "severity": "string",
        "disposition": "string",
        "disposition_note": "string",
        "defer_until": "string",
        "resolved": "boolean",
    }],
    "triage": {
        "triage_held_daily": "boolean",
    },
    "required_sign_off_roles": ["string"],
    "sign_offs": [{
        "role": "string",
        "signer_name": "string",
        "signed": "boolean",
    }],
    "sign_off": {
        "outcome": "string",
        "conditional_open_items_listed": "boolean",
        "conditional_owner_named": "boolean",
    },
    "retest": {
        "uat_fixes_made": "boolean",
        "changed_scenarios_retested": "boolean",
        "touched_flows_regression_completed": "boolean",
        "retest_results_recorded": "boolean",
    },
    "declared_totals": {
        "acceptance_criteria_count": "number",
        "scenarios_count": "number",
        "executed_scenarios_count": "number",
        "defects_count": "number",
        "sign_off_roles_count": "number",
    },
    "red_lines": {
        "production_data_used_without_anonymization_present": "boolean",
        "passed_while_blocker_defects_open_present": "boolean",
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


def _conditional_check(results, section, name, manifest, target_path,
                       evidence, na_evidence):
    outcome, has_outcome = _get(manifest, "sign_off", "outcome")
    target, has_target = _get(manifest, *target_path)
    if has_outcome and outcome == "conditional_pass":
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, outcome, has_outcome, True,
               na_evidence)


def _fmt6(value):
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


def _dup_strings(values):
    seen = []
    dups = []
    for nm in values:
        if isinstance(nm, str):
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def _ids(rows, field):
    return [c[field] for c in rows
            if isinstance(c, dict) and isinstance(c.get(field), str)]


def evaluate(manifest):
    """Return the verdict dict for a UAT sign-off manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    criteria, has_criteria = _get(manifest, "acceptance_criteria")
    crit_is_list = has_criteria and isinstance(criteria, list)
    crit_count = len(criteria) if crit_is_list else None
    crit_rows = criteria if crit_is_list else []
    criterion_ids = _ids(crit_rows, "criterion_id")

    scenarios, has_scenarios = _get(manifest, "scenarios")
    scen_is_list = has_scenarios and isinstance(scenarios, list)
    scen_count = len(scenarios) if scen_is_list else None
    scen_rows = scenarios if scen_is_list else []
    scenario_ids = _ids(scen_rows, "scenario_id")

    defects, has_defects = _get(manifest, "defects")
    defects_is_list = has_defects and isinstance(defects, list)
    defects_count = len(defects) if defects_is_list else None
    defect_rows = defects if defects_is_list else []

    roles, has_roles = _get(manifest, "required_sign_off_roles")
    roles_is_list = has_roles and isinstance(roles, list)
    roles_count = len(roles) if roles_is_list else None
    role_rows = roles if roles_is_list else []

    sign_offs, has_sign_offs = _get(manifest, "sign_offs")
    so_is_list = has_sign_offs and isinstance(sign_offs, list)
    so_count = len(sign_offs) if so_is_list else None
    so_rows = sign_offs if so_is_list else []
    so_roles = _ids(so_rows, "role")

    outcome, has_outcome = _get(manifest, "sign_off", "outcome")

    duplicate_criterion_ids = (
        _duplicates(crit_rows, "criterion_id") if crit_is_list else None)
    duplicate_scenario_ids = (
        _duplicates(scen_rows, "scenario_id") if scen_is_list else None)
    duplicate_defect_ids = (
        _duplicates(defect_rows, "defect_id") if defects_is_list else None)
    duplicate_required_roles = (
        _dup_strings(role_rows) if roles_is_list else None)
    duplicate_sign_off_roles = (
        _duplicates(so_rows, "role") if so_is_list else None)

    criteria_without_description = (
        [_row_name(c, "criterion_id") for c in crit_rows
         if _has(c, "description") and not _nonempty_str(c.get("description"))]
        if crit_is_list else None)

    covered_criterion_ids = []
    for c in scen_rows:
        if isinstance(c, dict) and isinstance(c.get("criterion_ids"), list):
            for cid in c["criterion_ids"]:
                if isinstance(cid, str) and cid not in covered_criterion_ids:
                    covered_criterion_ids.append(cid)
    uncovered_criteria = (
        [cid for cid in criterion_ids if cid not in covered_criterion_ids]
        if crit_is_list and scen_is_list else None)
    scenarios_without_criterion = (
        [_row_name(c, "scenario_id") for c in scen_rows
         if _has(c, "criterion_ids")
         and not (isinstance(c.get("criterion_ids"), list)
                  and len(c.get("criterion_ids")) > 0)]
        if scen_is_list else None)
    scenarios_with_unknown_criterion = (
        [_row_name(c, "scenario_id") for c in scen_rows
         if _has(c, "criterion_ids")
         and isinstance(c.get("criterion_ids"), list)
         and any(cid not in criterion_ids for cid in c["criterion_ids"])]
        if scen_is_list and crit_is_list else None)
    scenarios_without_steps = (
        [_row_name(c, "scenario_id") for c in scen_rows
         if _has(c, "steps_recorded")
         and c.get("steps_recorded") is not True]
        if scen_is_list else None)
    scenarios_without_expected = (
        [_row_name(c, "scenario_id") for c in scen_rows
         if _has(c, "expected_outcome")
         and not _nonempty_str(c.get("expected_outcome"))]
        if scen_is_list else None)
    scenarios_not_timeboxed = (
        [_row_name(c, "scenario_id") for c in scen_rows
         if _has(c, "timeboxed") and c.get("timeboxed") is not True]
        if scen_is_list else None)
    scenarios_with_invalid_result = (
        [_row_name(c, "scenario_id") for c in scen_rows
         if _has(c, "result") and c.get("result") not in RESULT_KINDS]
        if scen_is_list else None)
    scenarios_not_executed = (
        [_row_name(c, "scenario_id") for c in scen_rows
         if _has(c, "result") and c.get("result") == "not_run"]
        if scen_is_list else None)
    executed_count = (
        sum(1 for c in scen_rows
            if c.get("result") in ("passed", "failed", "blocked"))
        if scen_is_list else None)
    defect_scenario_ids = _ids(defect_rows, "scenario_id")
    failed_or_blocked_without_defect = (
        [_row_name(c, "scenario_id") for c in scen_rows
         if _has(c, "result") and c.get("result") in ("failed", "blocked")
         and _has(c, "scenario_id")
         and c.get("scenario_id") not in defect_scenario_ids]
        if scen_is_list and defects_is_list else None)

    defects_with_unknown_scenario = (
        [_row_name(c, "defect_id") for c in defect_rows
         if _has(c, "scenario_id")
         and c.get("scenario_id") not in scenario_ids]
        if defects_is_list and scen_is_list else None)
    defects_without_severity = (
        [_row_name(c, "defect_id") for c in defect_rows
         if _has(c, "severity") and not _nonempty_str(c.get("severity"))]
        if defects_is_list else None)
    defects_with_invalid_disposition = (
        [_row_name(c, "defect_id") for c in defect_rows
         if _has(c, "disposition")
         and c.get("disposition") not in DISPOSITIONS]
        if defects_is_list else None)
    accepted_defects_without_note = (
        [_row_name(c, "defect_id") for c in defect_rows
         if _has(c, "disposition") and c.get("disposition") == "accept_with_note"
         and _has(c, "disposition_note")
         and not _nonempty_str(c.get("disposition_note"))]
        if defects_is_list else None)
    deferred_defects_without_date = (
        [_row_name(c, "defect_id") for c in defect_rows
         if _has(c, "disposition") and c.get("disposition") == "defer_with_date"
         and _has(c, "defer_until")
         and not _nonempty_str(c.get("defer_until"))]
        if defects_is_list else None)
    fix_now_defects_unresolved = (
        [_row_name(c, "defect_id") for c in defect_rows
         if _has(c, "disposition") and c.get("disposition") == "fix_now"
         and _has(c, "resolved") and c.get("resolved") is not True]
        if defects_is_list else None)
    open_blocker_defect_ids = (
        [_row_name(c, "defect_id") for c in defect_rows
         if _has(c, "severity") and c.get("severity") == "blocker"
         and _has(c, "resolved") and c.get("resolved") is not True]
        if defects_is_list else None)

    sign_offs_with_unknown_role = (
        [_row_name(c, "role") for c in so_rows
         if _has(c, "role") and c.get("role") not in role_rows]
        if so_is_list and roles_is_list else None)
    sign_offs_without_signer = (
        [_row_name(c, "role") for c in so_rows
         if _has(c, "signer_name")
         and not _nonempty_str(c.get("signer_name"))]
        if so_is_list else None)
    sign_offs_not_signed = (
        [_row_name(c, "role") for c in so_rows
         if _has(c, "signed") and c.get("signed") is not True]
        if so_is_list else None)
    signed_roles = [c["role"] for c in so_rows
                    if isinstance(c, dict)
                    and isinstance(c.get("role"), str)
                    and c.get("signed") is True]
    required_roles_unsigned = (
        [r for r in role_rows if isinstance(r, str) and r not in signed_roles]
        if roles_is_list and so_is_list else None)

    def _total(field):
        return _get(manifest, "declared_totals", field)

    crit_total, has_crit_total = _total("acceptance_criteria_count")
    scen_total, has_scen_total = _total("scenarios_count")
    exec_total, has_exec_total = _total("executed_scenarios_count")
    defects_total, has_defects_total = _total("defects_count")
    roles_total, has_roles_total = _total("sign_off_roles_count")

    criterion_coverage_ratio = (
        len([cid for cid in criterion_ids if cid in covered_criterion_ids])
        / crit_count
        if crit_is_list and scen_is_list and crit_count > 0 else None)
    scenario_execution_ratio = (
        executed_count / scen_count
        if scen_is_list and scen_count > 0 else None)
    scenario_pass_ratio = (
        sum(1 for c in scen_rows if c.get("result") == "passed") / scen_count
        if scen_is_list and scen_count > 0 else None)
    defect_disposition_ratio = (
        sum(1 for c in defect_rows
            if c.get("disposition") in DISPOSITIONS) / defects_count
        if defects_is_list and defects_count > 0 else None)
    sign_off_completion_ratio = (
        len([r for r in role_rows
             if isinstance(r, str) and r in signed_roles]) / roles_count
        if roles_is_list and so_is_list and roles_count > 0 else None)

    # ---- Section 1: scope_and_criteria_mapping ----
    S = "scope_and_criteria_mapping"
    _bool_check(results, S, "uat_scope_criteria_source_recorded", manifest,
                ("scope", "criteria_source_recorded"),
                "scope: the source of the acceptance criteria for this UAT round was recorded")
    _bool_check(results, S, "uat_scope_defined_before_execution", manifest,
                ("scope", "scope_defined_before_execution"),
                "scope: the UAT scope was defined before execution began")
    _bool_check(results, S, "uat_no_silent_scope_edits_during_round", manifest,
                ("scope", "no_silent_scope_edits_during_uat"),
                "scope / method: no silent scope edits were made mid-UAT")
    _check(results, S, "uat_acceptance_criteria_list_declared", criteria,
           crit_is_list, crit_is_list and crit_count > 0,
           "criteria: the declared record names its acceptance-criterion rows — the list is present and names at least one criterion; an absent list is missing evidence and an empty list declares no criteria at all")
    crit_id_present = crit_is_list and all(
        _has(c, "criterion_id") for c in crit_rows)
    _check(results, S, "every_uat_acceptance_criterion_id_unique", criteria,
           crit_id_present,
           crit_is_list and duplicate_criterion_ids is not None
           and len(duplicate_criterion_ids) == 0,
           "criteria: no declared criterion_id is owned by more than one row")
    desc_present = crit_is_list and all(
        _has(c, "description") for c in crit_rows)
    _check(results, S, "every_uat_acceptance_criterion_description_declared",
           criteria, desc_present,
           crit_is_list
           and all(_nonempty_str(c.get("description")) for c in crit_rows),
           "criteria: every declared criterion declares a non-empty description")
    _check(results, S, "uat_scenarios_list_declared", scenarios,
           scen_is_list, scen_is_list and scen_count > 0,
           "scenarios: the declared record names its UAT scenario rows — the list is present and names at least one scenario; an absent list is missing evidence and an empty list declares no scenarios at all")
    scen_id_present = scen_is_list and all(
        _has(c, "scenario_id") for c in scen_rows)
    _check(results, S, "every_uat_scenario_id_unique", scenarios,
           scen_id_present,
           scen_is_list and duplicate_scenario_ids is not None
           and len(duplicate_scenario_ids) == 0,
           "scenarios: no declared scenario_id is owned by more than one row")
    crit_ids_present = scen_is_list and all(
        _has(c, "criterion_ids") for c in scen_rows)
    _check(results, S, "every_uat_scenario_covers_at_least_one_criterion",
           scenarios, crit_ids_present,
           scen_is_list and all(
               isinstance(c.get("criterion_ids"), list)
               and len(c.get("criterion_ids")) > 0 for c in scen_rows),
           "scenarios: every declared scenario names at least one acceptance criterion it covers")
    ref_present = scen_is_list and crit_is_list and all(
        _has(c, "criterion_ids") for c in scen_rows)
    _check(results, S,
           "every_uat_scenario_criterion_reference_declared_criterion",
           scenarios, ref_present,
           scen_is_list and crit_is_list and all(
               isinstance(c.get("criterion_ids"), list)
               and all(cid in criterion_ids for cid in c["criterion_ids"])
               for c in scen_rows),
           "scenarios: every criterion_id a declared scenario names is one of the declared acceptance criteria")
    cover_present = crit_is_list and scen_is_list and all(
        _has(c, "criterion_id") for c in crit_rows)
    _check(results, S, "every_uat_acceptance_criterion_covered_by_scenario",
           criteria, cover_present,
           cover_present and uncovered_criteria == [],
           "scope / quality gate: every acceptance criterion is mapped to at least one UAT scenario")
    _check(results, S, "uat_declared_criteria_count_matches_rows",
           crit_total, has_crit_total and crit_is_list,
           crit_is_list and crit_total == crit_count,
           "declared totals: the declared acceptance-criteria count recomputes exactly against the declared criterion rows")
    _check(results, S, "uat_declared_scenarios_count_matches_rows",
           scen_total, has_scen_total and scen_is_list,
           scen_is_list and scen_total == scen_count,
           "declared totals: the declared scenarios count recomputes exactly against the declared scenario rows")

    # ---- Section 2: environment_people_and_scripts ----
    S = "environment_people_and_scripts"
    _bool_check(results, S, "uat_environment_staging_mirrors_production",
                manifest, ("environment", "staging_mirrors_production"),
                "environment: staging mirrors production for this UAT round")
    _bool_check(results, S, "uat_environment_test_data_realistic", manifest,
                ("environment", "test_data_realistic"),
                "environment: the UAT data used was realistic")
    _gated_bool_check(
        results, S, "uat_production_data_anonymized_where_production_data_used",
        manifest, ("environment", "production_data_used"),
        ("environment", "test_data_anonymized"),
        "environment / red line: production data used in UAT was anonymized",
        "no production data use declared")
    _bool_check(results, S, "uat_business_owner_owns_round", manifest,
                ("people", "business_owner_owns_uat"),
                "people: the business owner owns this UAT round")
    _bool_check(results, S, "uat_business_owner_executes_round", manifest,
                ("people", "business_owner_executes_uat"),
                "people: the business owner executes this UAT round")
    _bool_check(results, S, "uat_supporting_team_assigned", manifest,
                ("people", "supporting_team_assigned"),
                "people: the supporting team was assigned to this UAT round")
    _bool_check(results, S, "uat_scribe_assigned", manifest,
                ("people", "scribe_assigned"),
                "people: one scribe was assigned to this UAT round")
    steps_present = scen_is_list and all(
        _has(c, "steps_recorded") for c in scen_rows)
    _check(results, S, "every_uat_scenario_steps_recorded", scenarios,
           steps_present,
           scen_is_list
           and all(c.get("steps_recorded") is True for c in scen_rows),
           "scripts: every declared scenario declares its steps recorded")
    expected_present = scen_is_list and all(
        _has(c, "expected_outcome") for c in scen_rows)
    _check(results, S, "every_uat_scenario_expected_outcome_declared",
           scenarios, expected_present,
           scen_is_list and all(
               _nonempty_str(c.get("expected_outcome")) for c in scen_rows),
           "scripts: every declared scenario declares a non-empty expected outcome")
    timeboxed_present = scen_is_list and all(
        _has(c, "timeboxed") for c in scen_rows)
    _check(results, S, "every_uat_scenario_timeboxed", scenarios,
           timeboxed_present,
           scen_is_list
           and all(c.get("timeboxed") is True for c in scen_rows),
           "scripts: every declared scenario is declared timeboxed")

    # ---- Section 3: execution_and_results ----
    S = "execution_and_results"
    _bool_check(results, S, "uat_round_execution_window_completed", manifest,
                ("execution", "execution_window_completed"),
                "execution: the UAT execution window for this round was completed")
    _bool_check(results, S, "uat_deviations_logged_as_defects", manifest,
                ("execution", "deviations_logged_as_defects"),
                "execution / method: deviations found in UAT were logged as defects")
    result_present = scen_is_list and all(
        _has(c, "result") for c in scen_rows)
    _check(results, S, "every_uat_scenario_result_recognised", scenarios,
           result_present,
           scen_is_list
           and all(c.get("result") in RESULT_KINDS for c in scen_rows),
           "execution: every declared scenario's result is one of passed, failed, blocked, not_run")
    _check(results, S, "every_uat_scenario_result_recorded_as_executed",
           scenarios, result_present,
           scen_is_list
           and all(c.get("result") in ("passed", "failed", "blocked")
                   for c in scen_rows),
           "execution: every declared scenario is declared executed — its result is not not_run")
    _check(results, S, "uat_declared_executed_scenarios_count_matches_rows",
           exec_total, has_exec_total and scen_is_list,
           scen_is_list and exec_total == executed_count,
           "declared totals: the declared executed-scenarios count recomputes exactly against the declared scenario results")
    fb_present = (scen_is_list and defects_is_list and all(
        _has(c, "result") and _has(c, "scenario_id") for c in scen_rows))
    _check(results, S,
           "every_uat_failed_or_blocked_scenario_has_defect_record",
           scenarios, fb_present,
           fb_present and failed_or_blocked_without_defect == [],
           "execution: every failed or blocked declared scenario names at least one declared defect row")

    # ---- Section 4: defects_and_triage ----
    S = "defects_and_triage"
    _check(results, S, "uat_defects_list_declared", defects,
           defects_is_list, defects_is_list,
           "defects: the declared record names its defect rows — the list is present; an empty list declares that the round found no defects, and an absent list is missing evidence")
    defect_id_present = defects_is_list and all(
        _has(c, "defect_id") for c in defect_rows)
    _check(results, S, "every_uat_defect_id_unique", defects,
           defect_id_present if defects_is_list else False,
           defects_is_list and duplicate_defect_ids is not None
           and len(duplicate_defect_ids) == 0,
           "defects: no declared defect_id is owned by more than one row")
    # present semantics for empty-list per-row checks: list present counts
    def _per_row_present(is_list, rows, fields):
        if not is_list:
            return False
        return all(all(_has(c, f) for f in fields) for c in rows)
    _check(results, S, "every_uat_defect_scenario_reference_declared_scenario",
           defects,
           _per_row_present(defects_is_list and scen_is_list,
                            defect_rows, ("scenario_id",)),
           defects_is_list and scen_is_list and all(
               c.get("scenario_id") in scenario_ids for c in defect_rows),
           "defects: every declared defect names a scenario_id among the declared scenarios")
    _check(results, S, "every_uat_defect_severity_declared", defects,
           _per_row_present(defects_is_list, defect_rows, ("severity",)),
           defects_is_list and all(
               _nonempty_str(c.get("severity")) for c in defect_rows),
           "defects / quality gate: every declared defect declares a non-empty severity — defects are classified")
    _check(results, S, "every_uat_defect_disposition_recognised", defects,
           _per_row_present(defects_is_list, defect_rows, ("disposition",)),
           defects_is_list and all(
               c.get("disposition") in DISPOSITIONS for c in defect_rows),
           "defects / quality gate: every declared defect's disposition is one of fix_now, accept_with_note, defer_with_date — the triage dispositions the skill names")
    _check(results, S, "every_uat_accepted_defect_disposition_note_declared",
           defects,
           _per_row_present(defects_is_list, defect_rows,
                            ("disposition", "disposition_note"))
           if any(c.get("disposition") == "accept_with_note"
                  for c in defect_rows) else defects_is_list,
           defects_is_list and all(
               _nonempty_str(c.get("disposition_note"))
               for c in defect_rows
               if c.get("disposition") == "accept_with_note"),
           "defects: every defect dispositioned accept_with_note declares a non-empty disposition note")
    _check(results, S, "every_uat_deferred_defect_disposition_date_declared",
           defects,
           _per_row_present(defects_is_list, defect_rows,
                            ("disposition", "defer_until"))
           if any(c.get("disposition") == "defer_with_date"
                  for c in defect_rows) else defects_is_list,
           defects_is_list and all(
               _nonempty_str(c.get("defer_until"))
               for c in defect_rows
               if c.get("disposition") == "defer_with_date"),
           "defects: every defect dispositioned defer_with_date declares a non-empty defer date")
    _bool_check(results, S, "uat_triage_held_daily_during_round", manifest,
                ("triage", "triage_held_daily"),
                "triage / method: defects were triaged daily during this UAT round")
    _check(results, S, "uat_declared_defects_count_matches_rows",
           defects_total, has_defects_total and defects_is_list,
           defects_is_list and defects_total == defects_count,
           "declared totals: the declared defects count recomputes exactly against the declared defect rows")

    # ---- Section 5: sign_off_record ----
    S = "sign_off_record"
    _check(results, S, "uat_sign_off_outcome_recognised", outcome,
           has_outcome, has_outcome and outcome in SIGN_OFF_OUTCOMES,
           "sign-off / quality gate: the declared sign-off outcome is one of pass, conditional_pass — the explicit outcomes the skill names; sign-off is an artifact, not a vibe")
    _check(results, S, "uat_sign_off_required_roles_list_declared", roles,
           roles_is_list, roles_is_list and roles_count > 0,
           "sign-off: the declared record names its required sign-off roles — the list is present and names at least one role; an absent list is missing evidence and an empty list declares no required sign-off at all")
    _check(results, S, "every_uat_required_sign_off_role_unique", roles,
           roles_is_list,
           roles_is_list and duplicate_required_roles is not None
           and len(duplicate_required_roles) == 0,
           "sign-off: no declared required role is named more than once")
    _check(results, S, "uat_sign_offs_list_declared", sign_offs,
           so_is_list, so_is_list and so_count > 0,
           "sign-off: the declared record names its sign-off rows — the list is present and names at least one sign-off; an absent list is missing evidence and an empty list declares no sign-off recorded at all")
    so_role_present = so_is_list and all(
        _has(c, "role") for c in so_rows)
    _check(results, S, "every_uat_sign_off_role_declared_required", sign_offs,
           so_role_present and roles_is_list,
           so_is_list and roles_is_list and all(
               c.get("role") in role_rows for c in so_rows),
           "sign-off: every declared sign-off row names a role among the declared required sign-off roles")
    _check(results, S, "every_uat_required_role_signed_off", roles,
           roles_is_list and so_is_list,
           roles_is_list and so_is_list
           and required_roles_unsigned == [],
           "sign-off / quality gate: every declared required role has a sign-off row declared signed")
    signer_present = so_is_list and all(
        _has(c, "signer_name") for c in so_rows)
    _check(results, S, "every_uat_sign_off_signer_named", sign_offs,
           signer_present,
           so_is_list and all(
               _nonempty_str(c.get("signer_name")) for c in so_rows),
           "sign-off: every declared sign-off row names its signer — a sign-off is by a named role-holder, never granted by this atom")
    signed_present = so_is_list and all(
        _has(c, "signed") for c in so_rows)
    _check(results, S, "every_uat_sign_off_marked_signed", sign_offs,
           signed_present,
           so_is_list
           and all(c.get("signed") is True for c in so_rows),
           "sign-off: every declared sign-off row is declared signed")
    _conditional_check(
        results, S, "uat_conditional_sign_off_open_items_listed_where_conditional",
        manifest, ("sign_off", "conditional_open_items_listed"),
        "sign-off: a conditional pass lists its open items",
        "no conditional pass declared")
    _conditional_check(
        results, S, "uat_conditional_sign_off_owner_named_where_conditional",
        manifest, ("sign_off", "conditional_owner_named"),
        "sign-off / quality gate: a conditional pass names an owner for its open items",
        "no conditional pass declared")
    blocker_present = (has_outcome and defects_is_list and all(
        _has(c, "severity") and _has(c, "resolved") for c in defect_rows))
    _check(results, S, "uat_sign_off_not_pass_while_blocker_defect_open",
           outcome, blocker_present,
           blocker_present
           and not (outcome == "pass" and open_blocker_defect_ids),
           "sign-off / red line: a declared pass outcome does not stand while a defect declaring severity blocker is not declared resolved")
    _check(results, S, "uat_declared_sign_off_roles_count_matches_required_roles",
           roles_total, has_roles_total and roles_is_list,
           roles_is_list and roles_total == roles_count,
           "declared totals: the declared sign-off roles count recomputes exactly against the declared required sign-off roles")

    # ---- Section 6: retest_and_regression_after_fixes ----
    S = "retest_and_regression_after_fixes"
    _gated_bool_check(
        results, S, "uat_changed_scenarios_retested_where_fixes_made",
        manifest, ("retest", "uat_fixes_made"),
        ("retest", "changed_scenarios_retested"),
        "re-test / quality gate: changed scenarios were re-tested after UAT fixes",
        "no UAT fixes declared made")
    _gated_bool_check(
        results, S, "uat_touched_flows_regression_completed_where_fixes_made",
        manifest, ("retest", "uat_fixes_made"),
        ("retest", "touched_flows_regression_completed"),
        "regression / quality gate: regression on touched flows was completed after UAT fixes",
        "no UAT fixes declared made")
    _gated_bool_check(
        results, S, "uat_retest_results_recorded_where_fixes_made",
        manifest, ("retest", "uat_fixes_made"),
        ("retest", "retest_results_recorded"),
        "re-test: the re-test results after UAT fixes were recorded",
        "no UAT fixes declared made")
    _check(results, S, "every_uat_fix_now_defect_marked_resolved", defects,
           _per_row_present(defects_is_list, defect_rows,
                            ("disposition", "resolved"))
           if any(c.get("disposition") == "fix_now" for c in defect_rows)
           else defects_is_list,
           defects_is_list and all(
               c.get("resolved") is True
               for c in defect_rows if c.get("disposition") == "fix_now"),
           "re-test: every defect dispositioned fix_now is declared resolved")

    # ---- Section 7: red_lines ----
    S = "red_lines"
    _false_check(results, S,
                 "uat_free_of_production_data_without_anonymization",
                 manifest,
                 ("red_lines",
                  "production_data_used_without_anonymization_present"),
                 "red line: no UAT on production data without anonymization is present in the record")
    _false_check(results, S,
                 "uat_free_of_passed_while_blockers_open",
                 manifest,
                 ("red_lines", "passed_while_blocker_defects_open_present"),
                 "red line: no passed outcome while blockers are open is present in the record")

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
        verdict = "UAT_SIGN_OFF_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "UAT_SIGN_OFF_SOUND"

    computed_names = (
        "uat_acceptance_criteria_list_declared",
        "every_uat_acceptance_criterion_id_unique",
        "every_uat_acceptance_criterion_description_declared",
        "uat_scenarios_list_declared",
        "every_uat_scenario_id_unique",
        "every_uat_scenario_covers_at_least_one_criterion",
        "every_uat_scenario_criterion_reference_declared_criterion",
        "every_uat_acceptance_criterion_covered_by_scenario",
        "uat_declared_criteria_count_matches_rows",
        "uat_declared_scenarios_count_matches_rows",
        "every_uat_scenario_steps_recorded",
        "every_uat_scenario_expected_outcome_declared",
        "every_uat_scenario_timeboxed",
        "every_uat_scenario_result_recognised",
        "every_uat_scenario_result_recorded_as_executed",
        "uat_declared_executed_scenarios_count_matches_rows",
        "every_uat_failed_or_blocked_scenario_has_defect_record",
        "uat_defects_list_declared",
        "every_uat_defect_id_unique",
        "every_uat_defect_scenario_reference_declared_scenario",
        "every_uat_defect_severity_declared",
        "every_uat_defect_disposition_recognised",
        "every_uat_accepted_defect_disposition_note_declared",
        "every_uat_deferred_defect_disposition_date_declared",
        "uat_declared_defects_count_matches_rows",
        "uat_sign_off_outcome_recognised",
        "uat_sign_off_required_roles_list_declared",
        "every_uat_required_sign_off_role_unique",
        "uat_sign_offs_list_declared",
        "every_uat_sign_off_role_declared_required",
        "every_uat_required_role_signed_off",
        "every_uat_sign_off_signer_named",
        "every_uat_sign_off_marked_signed",
        "uat_sign_off_not_pass_while_blocker_defect_open",
        "uat_declared_sign_off_roles_count_matches_required_roles",
        "every_uat_fix_now_defect_marked_resolved",
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
        "service": "uat-scenario-sign-off-pack",
        "atom_version": "0.1.0",
        "uat_round_title": manifest.get("uat_round_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "uat_acceptance_criteria_count": crit_count,
        "uat_scenarios_count": scen_count,
        "uat_executed_scenarios_count": executed_count,
        "uat_defects_count": defects_count,
        "uat_sign_offs_count": so_count,
        "uat_required_sign_off_roles_count": roles_count,
        "duplicate_uat_criterion_ids": duplicate_criterion_ids,
        "duplicate_uat_scenario_ids": duplicate_scenario_ids,
        "duplicate_uat_defect_ids": duplicate_defect_ids,
        "duplicate_uat_required_sign_off_roles": duplicate_required_roles,
        "duplicate_uat_sign_off_roles": duplicate_sign_off_roles,
        "uat_criteria_without_description": criteria_without_description,
        "uat_criteria_not_covered_by_any_scenario": uncovered_criteria,
        "uat_scenarios_without_criterion_reference": scenarios_without_criterion,
        "uat_scenarios_with_unknown_criterion_reference": scenarios_with_unknown_criterion,
        "uat_scenarios_without_steps_recorded": scenarios_without_steps,
        "uat_scenarios_without_expected_outcome": scenarios_without_expected,
        "uat_scenarios_not_timeboxed": scenarios_not_timeboxed,
        "uat_scenarios_with_invalid_result": scenarios_with_invalid_result,
        "uat_scenarios_not_executed": scenarios_not_executed,
        "uat_failed_or_blocked_scenarios_without_defect": failed_or_blocked_without_defect,
        "uat_defects_with_unknown_scenario_reference": defects_with_unknown_scenario,
        "uat_defects_without_severity": defects_without_severity,
        "uat_defects_with_invalid_disposition": defects_with_invalid_disposition,
        "uat_accepted_defects_without_note": accepted_defects_without_note,
        "uat_deferred_defects_without_date": deferred_defects_without_date,
        "uat_fix_now_defects_unresolved": fix_now_defects_unresolved,
        "uat_open_blocker_defect_ids": open_blocker_defect_ids,
        "uat_sign_offs_with_unknown_role": sign_offs_with_unknown_role,
        "uat_sign_offs_without_signer_name": sign_offs_without_signer,
        "uat_sign_offs_not_signed": sign_offs_not_signed,
        "uat_required_roles_without_signed_sign_off": required_roles_unsigned,
        "uat_criterion_coverage_ratio": _fmt6(criterion_coverage_ratio),
        "uat_scenario_execution_ratio": _fmt6(scenario_execution_ratio),
        "uat_scenario_pass_ratio": _fmt6(scenario_pass_ratio),
        "uat_defect_disposition_ratio": _fmt6(defect_disposition_ratio),
        "uat_sign_off_completion_ratio": _fmt6(sign_off_completion_ratio),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "UAT SCENARIO SIGN-OFF PACK",
        f"uat_round_title: {verdict.get('uat_round_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: uat_scenario_sign_off_pack.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "UAT_SIGN_OFF_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
