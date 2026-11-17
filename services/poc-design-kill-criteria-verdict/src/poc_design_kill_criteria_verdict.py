#!/usr/bin/env python3
"""POC design kill-criteria verdict — deterministic core.

Built from the bound skill `poc-validation`: "A POC exists to
reduce uncertainty, not to ship. Define the question, the kill
criteria, and the timebox — before writing code."

This atom is a VERDICT on a declared proof-of-concept DESIGN
record: the record made before the run, stating the uncertainty
to be reduced, the success and kill criteria as individual
declared rows, the timebox as a declared window, and the scope
as individual declared items. It audits whether those design
elements were declared before the run and are internally
consistent as rows — it does not audit a completed POC, run a
POC, collect evidence, or judge whether the idea is worth
pursuing.

Distinct ground: the nearest deployed sibling is
`buyer-test-card`, built from the same bound skill. That atom
audits a COMPLETED POC record at whole-record level: global
attestations that a hypothesis was written and single, that
success/kill criteria were written before the start and agreed
by the decision owner, a timebox limit in days compared against
elapsed days, global evidence and findings-memo attestations,
and the decision / disposition vocabulary of the finished
record. This atom sits one stage earlier and shares ZERO
checks with it: no field, check, or computed value is shared.
Every check here is a design-stage question over declared
rows and a declared window — the uncertainty the design
exists to reduce is named, the answer would change the plan,
each criterion row carries a stated kind (success or kill), a
stated condition and a before-run declaration, both kinds are
present among the rows, no criterion name is owned by two
rows, a vendor/tool evaluation (when declared) carries a
house-stack-fit criterion row, the timebox is a declared
start/end window whose dates are real and ordered, each scope
item is declared on the critical path with no duplicated
scope name, and the design itself plans no direct-to-
production use, no open-ended run, and no POC-success-as-
production-readiness claim. The boundary is: design intent
and row consistency declared before the run here; the
completed record's attestations and arithmetic there.

The caller submits a POC design manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows and window themselves —
no outside threshold is imported:

- criteria rows: the declared `criteria` list must be
  non-empty, every row's kind must be one of the two kinds
  the skill names (success AND kill criteria), at least one
  row of each kind must be present, every row must state its
  condition and declare itself declared before the run, and
  no criterion name may be owned by more than one row;
- vendor gate: when the design declares it evaluates a
  vendor/tool (the skill's "Evaluating vendors/tools against
  the house stack"), at least one criterion row must declare
  that it assesses house-stack fit;
- timebox window: the declared start and end dates must both
  be real calendar dates in strict ISO form and the end must
  fall after the start — the declared duration is reported,
  never judged against any bar;
- scope rows: the declared `scope_items` list must be
  non-empty, every item must be declared on the critical
  path, and no scope name may be owned by more than one item.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons
use the unrounded values. That fixed serialization is what
makes the Python and TypeScript outputs byte-identical.
Counts and the window duration are reported as integers
(exact).

The skill states no numeric threshold — no maximum timebox
length in days, no budget bar, no number of criteria or scope
items beyond the declared lists being non-empty, no coverage
percentage below completeness — so no numeric threshold check
is invented; those quantities are computed and reported, with
completeness (every declared row) and the window's internal
ordering as the only bars, exactly as stated above.

Verdict:
- any fail             -> POC_DESIGN_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> POC_DESIGN_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism
is the product.
"""
import json
import math
import re
import sys
from datetime import date

SECTIONS = (
    "design_premise",
    "criteria_row_consistency",
    "timebox_window",
    "scope_row_consistency",
    "production_boundary_by_design",
)

STATED_KINDS = ("success", "kill")

MANIFEST_SPEC = {
    "poc": "string",
    "design": {
        "uncertainty_to_reduce_named": "boolean",
        "answer_changes_plan_declared": "boolean",
        "uncertainty_reduction_purpose_declared": "boolean",
        "design_record_completed_before_run": "boolean",
        "evaluates_vendor_or_tool": "boolean",
    },
    "criteria": [{
        "name": "string",
        "kind": "string",
        "condition_stated": "boolean",
        "declared_before_run": "boolean",
        "assesses_house_stack_fit": "boolean",
    }],
    "timebox": {
        "window_set_before_run": "boolean",
        "start_date": "string",
        "end_date": "string",
    },
    "scope_items": [{
        "name": "string",
        "on_critical_path": "boolean",
    }],
    "red_lines": {
        "poc_code_planned_for_direct_production_use_present": "boolean",
        "open_ended_design_present": "boolean",
        "poc_success_planned_as_production_readiness_present": "boolean",
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


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _parse_date(value):
    """Strict ISO YYYY-MM-DD -> date, or None if not a real date."""
    if not isinstance(value, str) or not _DATE_RE.match(value):
        return None
    try:
        return date(int(value[0:4]), int(value[5:7]), int(value[8:10]))
    except ValueError:
        return None


def _duplicates(rows):
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get("name"), str):
            nm = c["name"]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def evaluate(manifest):
    """Return the verdict dict for a POC design manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows and window, read once ----
    criteria, has_criteria = _get(manifest, "criteria")
    criteria_is_list = has_criteria and isinstance(criteria, list)
    criteria_count = len(criteria) if criteria_is_list else None
    crows = criteria if criteria_is_list else []

    scope_items, has_scope = _get(manifest, "scope_items")
    scope_is_list = has_scope and isinstance(scope_items, list)
    scope_count = len(scope_items) if scope_is_list else None
    srows = scope_items if scope_is_list else []

    success_criteria_count = (
        sum(1 for c in crows
            if isinstance(c, dict) and c.get("kind") == "success")
        if criteria_is_list else None
    )
    kill_criteria_count = (
        sum(1 for c in crows
            if isinstance(c, dict) and c.get("kind") == "kill")
        if criteria_is_list else None
    )
    criteria_without_condition = (
        [_row_name(c) for c in crows
         if isinstance(c, dict)
         and "condition_stated" in c
         and c.get("condition_stated") is not True]
        if criteria_is_list else None
    )
    criteria_not_declared_before_run = (
        [_row_name(c) for c in crows
         if isinstance(c, dict)
         and "declared_before_run" in c
         and c.get("declared_before_run") is not True]
        if criteria_is_list else None
    )
    criteria_with_invalid_kind = (
        [_row_name(c) for c in crows
         if isinstance(c, dict)
         and "kind" in c
         and c.get("kind") not in STATED_KINDS]
        if criteria_is_list else None
    )
    duplicate_criterion_names = (
        _duplicates(crows) if criteria_is_list else None
    )
    condition_stated_coverage = (
        sum(1 for c in crows
            if isinstance(c, dict)
            and c.get("condition_stated") is True)
        / criteria_count
        if criteria_is_list and criteria_count > 0 else None
    )
    declared_before_run_coverage = (
        sum(1 for c in crows
            if isinstance(c, dict)
            and c.get("declared_before_run") is True)
        / criteria_count
        if criteria_is_list and criteria_count > 0 else None
    )

    scope_items_off_critical_path = (
        [_row_name(c) for c in srows
         if isinstance(c, dict)
         and "on_critical_path" in c
         and c.get("on_critical_path") is not True]
        if scope_is_list else None
    )
    duplicate_scope_item_names = (
        _duplicates(srows) if scope_is_list else None
    )
    critical_path_coverage = (
        sum(1 for c in srows
            if isinstance(c, dict)
            and c.get("on_critical_path") is True)
        / scope_count
        if scope_is_list and scope_count > 0 else None
    )

    start_raw, has_start = _get(manifest, "timebox", "start_date")
    end_raw, has_end = _get(manifest, "timebox", "end_date")
    start_date = _parse_date(start_raw) if has_start else None
    end_date = _parse_date(end_raw) if has_end else None
    both_dates_valid = start_date is not None and end_date is not None
    timebox_duration_days = (
        (end_date - start_date).days if both_dates_valid else None
    )

    # ---- Section 1: design_premise (skill opening and "When
    #      to use": "A POC exists to reduce uncertainty, not to
    #      ship"; "'Can this even work?' questions whose answer
    #      changes the plan"; the design record itself is made
    #      before the run) ----
    _bool_check(results, "design_premise",
                "uncertainty_to_reduce_named", manifest,
                ("design", "uncertainty_to_reduce_named"),
                "design premise: the uncertainty the POC exists "
                "to reduce is named in the design")
    _bool_check(results, "design_premise",
                "answer_changes_plan_declared", manifest,
                ("design", "answer_changes_plan_declared"),
                "design premise: the design declares that the "
                "answer changes the plan — the question is worth "
                "asking before building")
    _bool_check(results, "design_premise",
                "uncertainty_reduction_purpose_declared", manifest,
                ("design", "uncertainty_reduction_purpose_declared"),
                "design premise: the stated purpose is reducing "
                "uncertainty, not shipping")
    _bool_check(results, "design_premise",
                "design_record_completed_before_run", manifest,
                ("design", "design_record_completed_before_run"),
                "design premise: this design record is completed "
                "before the run — the question, criteria and "
                "timebox are defined before writing code")

    # ---- Section 2: criteria_row_consistency (skill method
    #      step 2 as declared ROWS: "success AND kill criteria";
    #      "Evaluating vendors/tools against the house stack";
    #      plus the internal consistency of the declared rows
    #      themselves) ----
    gate_value, gate_present = _get(
        manifest, "design", "evaluates_vendor_or_tool")
    _check(results, "criteria_row_consistency",
           "vendor_evaluation_applicability_declared", gate_value,
           gate_present, True,
           "criteria rows: whether the POC evaluates a vendor "
           "or tool is declared — the house-stack-fit check "
           "applies only when it does")
    _check(results, "criteria_row_consistency",
           "criteria_declared", criteria, criteria_is_list,
           criteria_is_list and criteria_count > 0,
           "the declared design names its criteria — the "
           "criteria list is present and non-empty")
    kind_present = (
        criteria_is_list
        and all(isinstance(c, dict) and "kind" in c for c in crows)
    )
    _check(results, "criteria_row_consistency",
           "every_criterion_kind_is_success_or_kill", criteria,
           kind_present,
           criteria_is_list and criteria_count > 0
           and all(isinstance(c, dict)
                   and c.get("kind") in STATED_KINDS
                   for c in crows),
           "criteria rows: every declared criterion row is one "
           "of the two kinds the skill names — success or kill")
    _check(results, "criteria_row_consistency",
           "at_least_one_success_criterion_declared", criteria,
           kind_present,
           criteria_is_list and success_criteria_count is not None
           and success_criteria_count > 0,
           "criteria rows: at least one declared row is a "
           "success criterion — success AND kill criteria")
    _check(results, "criteria_row_consistency",
           "at_least_one_kill_criterion_declared", criteria,
           kind_present,
           criteria_is_list and kill_criteria_count is not None
           and kill_criteria_count > 0,
           "criteria rows: at least one declared row is a kill "
           "criterion — success AND kill criteria")
    cond_present = (
        criteria_is_list
        and all(isinstance(c, dict) and "condition_stated" in c
                for c in crows)
    )
    _check(results, "criteria_row_consistency",
           "every_criterion_condition_stated", criteria,
           cond_present,
           criteria_is_list and criteria_count > 0
           and all(isinstance(c, dict)
                   and c.get("condition_stated") is True
                   for c in crows),
           "criteria rows: every declared criterion row states "
           "the condition that satisfies it — the success bar "
           "or kill trigger is written, not implied")
    before_present = (
        criteria_is_list
        and all(isinstance(c, dict) and "declared_before_run" in c
                for c in crows)
    )
    _check(results, "criteria_row_consistency",
           "every_criterion_declared_before_run", criteria,
           before_present,
           criteria_is_list and criteria_count > 0
           and all(isinstance(c, dict)
                   and c.get("declared_before_run") is True
                   for c in crows),
           "criteria rows: every declared criterion row is "
           "itself declared before the run — no criterion is "
           "added after the fact")
    name_present = (
        criteria_is_list
        and all(isinstance(c, dict) and "name" in c for c in crows)
    )
    _check(results, "criteria_row_consistency",
           "no_criterion_name_duplicated", criteria, name_present,
           criteria_is_list and duplicate_criterion_names is not None
           and len(duplicate_criterion_names) == 0,
           "criteria rows: no declared criterion name is owned "
           "by more than one criterion row")
    house_fit_present = gate_present and criteria_is_list
    if gate_present and gate_value is False:
        house_fit_ok = True
    else:
        house_fit_ok = criteria_is_list and any(
            isinstance(c, dict)
            and c.get("assesses_house_stack_fit") is True
            for c in crows)
    _check(results, "criteria_row_consistency",
           "house_stack_fit_criterion_when_evaluating_vendor",
           criteria, house_fit_present, house_fit_ok,
           "criteria rows: when the POC evaluates a vendor or "
           "tool, at least one criterion row assesses fit "
           "against the house stack")

    # ---- Section 3: timebox_window (skill method step 3 as a
    #      declared WINDOW: a hard limit declared before the
    #      run, as start and end dates that are real and
    #      ordered — no duration bar is imposed) ----
    _bool_check(results, "timebox_window",
                "timebox_window_set_before_run", manifest,
                ("timebox", "window_set_before_run"),
                "timebox window: the window is set before the "
                "run — the timebox is defined upfront, not "
                "discovered during the run")
    both_present = has_start and has_end
    _check(results, "timebox_window",
           "timebox_window_dates_valid", start_raw, both_present,
           both_dates_valid,
           "timebox window: the declared start and end dates "
           "are real calendar dates in strict ISO form")
    _check(results, "timebox_window",
           "timebox_end_after_start", end_raw, both_present,
           both_dates_valid and end_date > start_date,
           "timebox window: the declared end date falls after "
           "the declared start date — the window has a "
           "positive length; its length itself is not judged")

    # ---- Section 4: scope_row_consistency (skill method step
    #      3 as declared ROWS: "scope is the critical path,
    #      nothing more" — applied to each declared scope item,
    #      plus the internal consistency of the declared rows)
    #      ----
    _check(results, "scope_row_consistency",
           "scope_items_declared", scope_items, scope_is_list,
           scope_is_list and scope_count > 0,
           "the declared design names its scope — the scope "
           "items list is present and non-empty")
    path_present = (
        scope_is_list
        and all(isinstance(c, dict) and "on_critical_path" in c
                for c in srows)
    )
    _check(results, "scope_row_consistency",
           "every_scope_item_on_critical_path", scope_items,
           path_present,
           scope_is_list and scope_count > 0
           and all(isinstance(c, dict)
                   and c.get("on_critical_path") is True
                   for c in srows),
           "scope rows: every declared scope item is on the "
           "critical path — scope is the critical path, "
           "nothing more")
    sname_present = (
        scope_is_list
        and all(isinstance(c, dict) and "name" in c for c in srows)
    )
    _check(results, "scope_row_consistency",
           "no_scope_item_name_duplicated", scope_items,
           sname_present,
           scope_is_list and duplicate_scope_item_names is not None
           and len(duplicate_scope_item_names) == 0,
           "scope rows: no declared scope name is owned by "
           "more than one scope item")

    # ---- Section 5: production_boundary_by_design (skill red
    #      lines as DESIGN intentions: "No silent
    #      POC-to-production gradient; no unbounded POCs";
    #      "'It worked in the POC' is never production
    #      evidence" — what the design itself plans, declared
    #      before the run) ----
    _false_check(results, "production_boundary_by_design",
                 "no_poc_code_planned_for_direct_production_use",
                 manifest,
                 ("red_lines",
                  "poc_code_planned_for_direct_production_use_present"),
                 "red line by design: the design does not plan "
                 "for POC code to be used directly in "
                 "production — no POC-to-production gradient "
                 "is designed in")
    _false_check(results, "production_boundary_by_design",
                 "no_open_ended_design", manifest,
                 ("red_lines", "open_ended_design_present"),
                 "red line by design: the design is not "
                 "open-ended — no unbounded POC is designed in")
    _false_check(results, "production_boundary_by_design",
                 "no_poc_success_planned_as_production_readiness",
                 manifest,
                 ("red_lines",
                  "poc_success_planned_as_production_readiness_present"),
                 "red line by design: the design does not plan "
                 "to treat POC success as production readiness "
                 "— 'it worked in the POC' is never production "
                 "evidence")

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
        verdict = "POC_DESIGN_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "POC_DESIGN_SOUND"

    computed_names = (
        "criteria_declared",
        "every_criterion_kind_is_success_or_kill",
        "at_least_one_success_criterion_declared",
        "at_least_one_kill_criterion_declared",
        "every_criterion_condition_stated",
        "every_criterion_declared_before_run",
        "no_criterion_name_duplicated",
        "house_stack_fit_criterion_when_evaluating_vendor",
        "timebox_window_dates_valid",
        "timebox_end_after_start",
        "scope_items_declared",
        "every_scope_item_on_critical_path",
        "no_scope_item_name_duplicated",
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
        "service": "poc-design-kill-criteria-verdict",
        "atom_version": "0.1.0",
        "poc": manifest.get("poc"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "criteria_count": criteria_count,
        "success_criteria_count": success_criteria_count,
        "kill_criteria_count": kill_criteria_count,
        "criteria_without_condition": criteria_without_condition,
        "condition_stated_coverage": _fmt6(condition_stated_coverage),
        "criteria_not_declared_before_run":
            criteria_not_declared_before_run,
        "declared_before_run_coverage":
            _fmt6(declared_before_run_coverage),
        "criteria_with_invalid_kind": criteria_with_invalid_kind,
        "duplicate_criterion_names": duplicate_criterion_names,
        "timebox_start_date": start_raw if has_start else None,
        "timebox_end_date": end_raw if has_end else None,
        "timebox_duration_days": timebox_duration_days,
        "scope_items_count": scope_count,
        "scope_items_off_critical_path": scope_items_off_critical_path,
        "critical_path_coverage": _fmt6(critical_path_coverage),
        "duplicate_scope_item_names": duplicate_scope_item_names,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "POC DESIGN KILL CRITERIA VERDICT",
        f"poc: {verdict.get('poc')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: poc_design_kill_criteria_verdict.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "POC_DESIGN_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
