#!/usr/bin/env python3
"""Delivery plan preparation — deterministic core.

Built from the bound skill `delivery-planning`: "Plan and run
delivery in phases — plan gates, milestones, a risk register and
honest status." Charter: chat -> plan -> build -> deploy -> test
-> recommend; no building before an approved plan; never a
direct-to-production change.

This atom is an AUDIT of a declared delivery plan record: it
validates the record a caller declares against the skill's
method — framing, phased work with exit criteria, honest
estimates, a risk register, an append-only decision log, WIP
discipline and one-screen status. It does not write the plan,
sequence the work for the caller, estimate anything itself, or
verify that a declared control actually happens — it checks
that the record the skill requires is present and internally
complete and consistent on the declared evidence.

The caller submits a delivery-plan manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- phases: the declared `phases` list must be non-empty, every
  declared phase row must name an owner, declare exit criteria,
  declare a size from the skill's own S/M/L vocabulary and
  declare its assumptions, and carry start/end dates (ISO
  YYYY-MM-DD) that are valid and in order (end not before
  start);
- dependencies: every name in a phase's declared `depends_on`
  list must name a declared phase, and a dependency's declared
  end date must not fall after the dependent phase's declared
  start date (schedule arithmetic over the declared dates);
- milestones: the declared `milestones` list must be non-empty,
  every declared milestone must name a declared phase and an
  owner, and its declared due date must fall within the named
  phase's declared start/end dates;
- risks and decisions: the declared `risks` and `decisions`
  lists must be non-empty, every declared risk must declare a
  mitigation and a trigger, and every declared decision-log
  entry must be complete — a date, the decision, a declared
  rationale and declared alternatives (the skill's append-only
  log shape: date, decision, rationale, alternatives).

Computed ratios are serialized as strings with exactly four
decimal places, produced in both implementations by the same
fixed rule — round half up to 4dp, floor(v * 10000 + 0.5) /
10000, then format with exactly four decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact) and the total plan duration as an
exact integer day count over the declared dates. The declared
rows that fail the computed checks are reported by name.

The skill states no numeric threshold — no WIP number, no
phase or milestone count, no risk count, no confidence scale,
no duration limit — so no numeric threshold check is invented;
quantities are computed and reported, and completeness (every
declared phase / milestone / risk / decision) is the only bar,
exactly as the task's declared-row consistency requires.

Verdict:
- any fail             -> DELIVERY_PLAN_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> DELIVERY_PLAN_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import datetime
import json
import math
import re
import sys

SECTIONS = (
    "framing_and_approval",
    "phases_milestones_and_dependencies",
    "risks_estimates_and_decisions",
    "execution_discipline_and_status",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "plan": "string",
    "framing": {
        "goal_declared": "boolean",
        "deliverable_declared": "boolean",
        "constraints_declared": "boolean",
        "definition_of_done_declared": "boolean",
        "plan_approved_before_build": "boolean",
        "build_started_before_approval": "boolean",
    },
    "phases": [{
        "name": "string",
        "owner": "string",
        "exit_criteria_declared": "boolean",
        "start_date": "string",
        "end_date": "string",
        "depends_on": ["string"],
        "size": "string",
        "assumptions_declared": "boolean",
    }],
    "milestones": [{
        "name": "string",
        "phase": "string",
        "owner": "string",
        "due_date": "string",
    }],
    "estimation": {
        "least_known_item_flagged_as_top_risk": "boolean",
    },
    "risks": [{
        "name": "string",
        "mitigation_declared": "boolean",
        "trigger_declared": "boolean",
    }],
    "risk_management": {
        "register_reviewed_each_phase": "boolean",
    },
    "decisions": [{
        "date": "string",
        "decision": "string",
        "rationale_declared": "boolean",
        "alternatives_declared": "boolean",
    }],
    "decision_log": {
        "append_only": "boolean",
        "logged_at_decision_time": "boolean",
    },
    "execution": {
        "wip_limit_declared": "boolean",
        "one_worked_item_per_lane": "boolean",
        "plan_updates_through_approval": "boolean",
        "silent_rescoping_present": "boolean",
        "deploys_hitl_approved": "boolean",
        "direct_to_production_change_present": "boolean",
    },
    "status": {
        "phase_declared": "boolean",
        "done_declared": "boolean",
        "next_declared": "boolean",
        "blockers_declared": "boolean",
        "confidence_declared": "boolean",
    },
}

_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_SIZES = ("S", "M", "L")


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
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


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def _decision_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("decision"), str) \
            and len(entry["decision"]) > 0:
        return entry["decision"]
    return "unnamed"


def _parse_date(value):
    """Strict ISO YYYY-MM-DD -> datetime.date, or None."""
    if not isinstance(value, str) or not _DATE_RE.match(value):
        return None
    try:
        return datetime.date(
            int(value[0:4]), int(value[5:7]), int(value[8:10]))
    except ValueError:
        return None


def _has_nonempty_str(entry, field):
    return (
        isinstance(entry, dict)
        and isinstance(entry.get(field), str)
        and len(entry[field]) > 0
    )


def evaluate(manifest):
    """Return the verdict dict for a delivery-plan manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    phases, has_phases = _get(manifest, "phases")
    phases_is_list = has_phases and isinstance(phases, list)
    milestones, has_milestones = _get(manifest, "milestones")
    milestones_is_list = has_milestones and isinstance(milestones, list)
    risks, has_risks = _get(manifest, "risks")
    risks_is_list = has_risks and isinstance(risks, list)
    decisions, has_decisions = _get(manifest, "decisions")
    decisions_is_list = has_decisions and isinstance(decisions, list)

    phases_count = len(phases) if phases_is_list else None
    milestones_count = len(milestones) if milestones_is_list else None
    risks_count = len(risks) if risks_is_list else None
    decisions_count = len(decisions) if decisions_is_list else None

    phase_names = (
        [p["name"] for p in phases
         if isinstance(p, dict) and isinstance(p.get("name"), str)]
        if phases_is_list else []
    )
    phase_by_name = (
        {p["name"]: p for p in phases
         if isinstance(p, dict) and isinstance(p.get("name"), str)}
        if phases_is_list else {}
    )

    phases_without_owner = (
        [_row_name(p) for p in phases
         if not _has_nonempty_str(p, "owner")]
        if phases_is_list else None
    )
    phases_without_exit = (
        [_row_name(p) for p in phases
         if not (isinstance(p, dict)
                 and p.get("exit_criteria_declared") is True)]
        if phases_is_list else None
    )
    phases_without_assumptions = (
        [_row_name(p) for p in phases
         if not (isinstance(p, dict)
                 and p.get("assumptions_declared") is True)]
        if phases_is_list else None
    )
    phases_with_invalid_size = (
        [_row_name(p) for p in phases
         if not (isinstance(p, dict) and p.get("size") in _SIZES)]
        if phases_is_list else None
    )

    def _phase_dates(p):
        if not isinstance(p, dict):
            return None, None
        return _parse_date(p.get("start_date")), _parse_date(p.get("end_date"))

    phases_with_date_problems = (
        [_row_name(p) for p in phases
         if _phase_dates(p)[0] is None or _phase_dates(p)[1] is None
         or _phase_dates(p)[1] < _phase_dates(p)[0]]
        if phases_is_list else None
    )

    unknown_dependencies = None
    dependency_refs_total = None
    dependency_order_violations = None
    if phases_is_list:
        unknown_dependencies = []
        dependency_order_violations = []
        dependency_refs_total = 0
        for p in phases:
            if not isinstance(p, dict) \
                    or not isinstance(p.get("depends_on"), list):
                continue
            for dep in p["depends_on"]:
                if not isinstance(dep, str):
                    continue
                dependency_refs_total += 1
                if dep not in phase_by_name:
                    unknown_dependencies.append(f"{_row_name(p)}->{dep}")
                    continue
                dep_end = _parse_date(phase_by_name[dep].get("end_date"))
                own_start = _parse_date(p.get("start_date"))
                if dep_end is not None and own_start is not None \
                        and dep_end > own_start:
                    dependency_order_violations.append(
                        f"{_row_name(p)}->{dep}")
    dependency_coverage = (
        (dependency_refs_total - len(unknown_dependencies))
        / dependency_refs_total
        if dependency_refs_total else None
    )
    owner_coverage = (
        (phases_count - len(phases_without_owner)) / phases_count
        if phases_is_list and phases_count > 0 else None
    )

    total_duration_days = None
    if phases_is_list and phases_count > 0 and all(
            _phase_dates(p)[0] is not None and _phase_dates(p)[1] is not None
            for p in phases):
        starts = [_phase_dates(p)[0] for p in phases]
        ends = [_phase_dates(p)[1] for p in phases]
        total_duration_days = (max(ends) - min(starts)).days

    milestones_without_owner = (
        [_row_name(m) for m in milestones
         if not _has_nonempty_str(m, "owner")]
        if milestones_is_list else None
    )
    milestones_with_unknown_phase = (
        [_row_name(m) for m in milestones
         if not (isinstance(m, dict)
                 and isinstance(m.get("phase"), str)
                 and m["phase"] in phase_by_name)]
        if milestones_is_list and phases_is_list else None
    )
    milestones_outside_phase = None
    if milestones_is_list and phases_is_list:
        milestones_outside_phase = []
        for m in milestones:
            if not isinstance(m, dict) \
                    or not isinstance(m.get("phase"), str) \
                    or m["phase"] not in phase_by_name:
                continue
            due = _parse_date(m.get("due_date"))
            p_start, p_end = _phase_dates(phase_by_name[m["phase"]])
            if due is None or p_start is None or p_end is None \
                    or due < p_start or due > p_end:
                milestones_outside_phase.append(_row_name(m))
    milestone_phase_coverage = (
        (milestones_count - len(milestones_with_unknown_phase))
        / milestones_count
        if milestones_with_unknown_phase is not None and milestones_count
        else None
    )

    risks_without_mitigation = (
        [_row_name(r) for r in risks
         if not (isinstance(r, dict)
                 and r.get("mitigation_declared") is True)]
        if risks_is_list else None
    )
    risks_without_trigger = (
        [_row_name(r) for r in risks
         if not (isinstance(r, dict)
                 and r.get("trigger_declared") is True)]
        if risks_is_list else None
    )

    def _decision_complete(d):
        return (
            isinstance(d, dict)
            and _parse_date(d.get("date")) is not None
            and _has_nonempty_str(d, "decision")
            and d.get("rationale_declared") is True
            and d.get("alternatives_declared") is True
        )

    decisions_incomplete = (
        [_decision_name(d) for d in decisions if not _decision_complete(d)]
        if decisions_is_list else None
    )

    # ---- Section 1: framing_and_approval (skill: method step 1
    #      frame — goal, deliverable, constraints, definition of
    #      done; quality gate — plan approved before build starts;
    #      charter — no building before an approved plan) ----
    _bool_check(results, "framing_and_approval",
                "goal_declared", manifest,
                ("framing", "goal_declared"),
                "frame: the goal is declared")
    _bool_check(results, "framing_and_approval",
                "deliverable_declared", manifest,
                ("framing", "deliverable_declared"),
                "frame: the deliverable is declared")
    _bool_check(results, "framing_and_approval",
                "constraints_declared", manifest,
                ("framing", "constraints_declared"),
                "frame: the constraints — time, cost, licenses, "
                "environment — are declared")
    _bool_check(results, "framing_and_approval",
                "definition_of_done_declared", manifest,
                ("framing", "definition_of_done_declared"),
                "frame: the definition of done is declared")
    _bool_check(results, "framing_and_approval",
                "plan_approved_before_build", manifest,
                ("framing", "plan_approved_before_build"),
                "quality gate: the plan is approved before build "
                "starts")
    _false_check(results, "framing_and_approval",
                 "no_build_started_before_approval", manifest,
                 ("framing", "build_started_before_approval"),
                 "charter: no building before an approved plan — "
                 "build has not started before approval")

    # ---- Section 2: phases_milestones_and_dependencies (skill:
    #      method step 2 — phase the work, phases with exit
    #      criteria; quality gate — every phase has exit criteria
    #      and an owner; when to use — milestones, dependencies,
    #      sequencing) ----
    _check(results, "phases_milestones_and_dependencies",
           "phases_declared", phases, phases_is_list,
           phases_is_list and phases_count > 0,
           "phase the work: the declared plan record names its "
           "phases — the phases list is present and non-empty")
    owner_present = (
        phases_is_list
        and all(isinstance(p, dict) and "owner" in p for p in phases)
    )
    _check(results, "phases_milestones_and_dependencies",
           "every_phase_has_owner_named", phases, owner_present,
           phases_is_list and phases_count > 0
           and len(phases_without_owner) == 0,
           "quality gate: every phase has an owner — every "
           "declared phase row names a non-empty owner")
    exit_present = (
        phases_is_list
        and all(isinstance(p, dict) and "exit_criteria_declared" in p
                for p in phases)
    )
    _check(results, "phases_milestones_and_dependencies",
           "every_phase_has_exit_criteria", phases, exit_present,
           phases_is_list and phases_count > 0
           and len(phases_without_exit) == 0,
           "quality gate: every phase has exit criteria — what "
           "must be true to move on — declared on every phase row")
    size_present = (
        phases_is_list
        and all(isinstance(p, dict) and "size" in p for p in phases)
    )
    _check(results, "phases_milestones_and_dependencies",
           "every_phase_has_skill_size", phases, size_present,
           phases_is_list and phases_count > 0
           and len(phases_with_invalid_size) == 0,
           "estimate honestly: every declared phase row carries "
           "a size from the skill's own vocabulary — S, M or L")
    dates_present = (
        phases_is_list
        and all(isinstance(p, dict) and "start_date" in p
                and "end_date" in p for p in phases)
    )
    _check(results, "phases_milestones_and_dependencies",
           "every_phase_dates_valid_and_in_order", phases,
           dates_present,
           phases_is_list and phases_count > 0
           and len(phases_with_date_problems) == 0,
           "phase the work: every declared phase row carries a "
           "valid ISO start and end date, and the end does not "
           "fall before the start")
    deps_present = (
        phases_is_list
        and all(isinstance(p, dict) and "depends_on" in p
                for p in phases)
    )
    _check(results, "phases_milestones_and_dependencies",
           "every_dependency_names_declared_phase", phases,
           deps_present,
           phases_is_list and phases_count > 0
           and unknown_dependencies is not None
           and len(unknown_dependencies) == 0,
           "dependencies: every name in a phase's declared "
           "depends_on list names a phase the plan declares")
    order_present = (
        phases_is_list
        and all(isinstance(p, dict) and "depends_on" in p
                and "start_date" in p and "end_date" in p
                for p in phases)
        and all(isinstance(phase_by_name[n], dict)
                and "end_date" in phase_by_name[n]
                for n in phase_names)
    )
    _check(results, "phases_milestones_and_dependencies",
           "every_dependency_precedes_dependent", phases,
           order_present,
           phases_is_list and phases_count > 0
           and unknown_dependencies is not None
           and len(unknown_dependencies) == 0
           and len(phases_with_date_problems) == 0
           and dependency_order_violations is not None
           and len(dependency_order_violations) == 0,
           "sequencing: schedule arithmetic over the declared "
           "dates — a dependency's declared end date does not "
           "fall after the dependent phase's declared start date")
    _check(results, "phases_milestones_and_dependencies",
           "milestones_declared", milestones, milestones_is_list,
           milestones_is_list and milestones_count > 0,
           "milestones: the declared plan record names its "
           "milestones — the milestones list is present and "
           "non-empty")
    ms_phase_present = (
        milestones_is_list and phases_is_list
        and all(isinstance(m, dict) and "phase" in m
                for m in milestones)
    )
    _check(results, "phases_milestones_and_dependencies",
           "every_milestone_names_declared_phase", milestones,
           ms_phase_present,
           milestones_is_list and phases_is_list
           and milestones_count > 0
           and milestones_with_unknown_phase is not None
           and len(milestones_with_unknown_phase) == 0,
           "milestones: every declared milestone names a phase "
           "the plan declares")
    ms_owner_present = (
        milestones_is_list
        and all(isinstance(m, dict) and "owner" in m
                for m in milestones)
    )
    _check(results, "phases_milestones_and_dependencies",
           "every_milestone_has_owner_named", milestones,
           ms_owner_present,
           milestones_is_list and milestones_count > 0
           and len(milestones_without_owner) == 0,
           "milestones: every declared milestone row names a "
           "non-empty owner")
    ms_dates_present = (
        milestones_is_list and phases_is_list
        and all(isinstance(m, dict) and "phase" in m
                and "due_date" in m for m in milestones)
        and all(isinstance(p, dict) and "start_date" in p
                and "end_date" in p for p in phases)
    )
    _check(results, "phases_milestones_and_dependencies",
           "every_milestone_due_within_phase_dates", milestones,
           ms_dates_present,
           milestones_is_list and phases_is_list
           and milestones_count > 0
           and milestones_with_unknown_phase is not None
           and len(milestones_with_unknown_phase) == 0
           and milestones_outside_phase is not None
           and len(milestones_outside_phase) == 0,
           "milestones: schedule arithmetic over the declared "
           "dates — every milestone's declared due date falls "
           "within its named phase's declared start and end dates")

    # ---- Section 3: risks_estimates_and_decisions (skill:
    #      method step 3 — estimate honestly, sizes with
    #      assumptions listed, flag the least-known item as the
    #      top risk; step 4 — risk register, top risks with
    #      mitigation and trigger, reviewed each phase; step 5 —
    #      decision log append-only, date/decision/rationale/
    #      alternatives, logged when made; quality gates — risks
    #      have triggers and mitigations, decisions logged when
    #      made) ----
    _check(results, "risks_estimates_and_decisions",
           "risks_declared", risks, risks_is_list,
           risks_is_list and risks_count > 0,
           "risk register: the declared plan record names its "
           "risks — the risks list is present and non-empty")
    mitigation_present = (
        risks_is_list
        and all(isinstance(r, dict) and "mitigation_declared" in r
                for r in risks)
    )
    _check(results, "risks_estimates_and_decisions",
           "every_risk_has_mitigation", risks, mitigation_present,
           risks_is_list and risks_count > 0
           and len(risks_without_mitigation) == 0,
           "quality gate: risks have mitigations — every "
           "declared risk row declares a mitigation")
    trigger_present = (
        risks_is_list
        and all(isinstance(r, dict) and "trigger_declared" in r
                for r in risks)
    )
    _check(results, "risks_estimates_and_decisions",
           "every_risk_has_trigger", risks, trigger_present,
           risks_is_list and risks_count > 0
           and len(risks_without_trigger) == 0,
           "quality gate: risks have triggers — every declared "
           "risk row declares a trigger")
    _bool_check(results, "risks_estimates_and_decisions",
                "risk_register_reviewed_each_phase", manifest,
                ("risk_management", "register_reviewed_each_phase"),
                "risk register: the register is reviewed each phase")
    assumptions_present = (
        phases_is_list
        and all(isinstance(p, dict) and "assumptions_declared" in p
                for p in phases)
    )
    _check(results, "risks_estimates_and_decisions",
           "every_phase_declares_assumptions", phases,
           assumptions_present,
           phases_is_list and phases_count > 0
           and len(phases_without_assumptions) == 0,
           "estimate honestly: sizes come with assumptions "
           "listed — every declared phase row declares its "
           "assumptions")
    _bool_check(results, "risks_estimates_and_decisions",
                "least_known_item_flagged_as_top_risk", manifest,
                ("estimation", "least_known_item_flagged_as_top_risk"),
                "estimate honestly: the least-known item is "
                "flagged as the top risk")
    _check(results, "risks_estimates_and_decisions",
           "decisions_declared", decisions, decisions_is_list,
           decisions_is_list and decisions_count > 0,
           "decision log: the declared plan record names its "
           "decision-log entries — the decisions list is present "
           "and non-empty")
    decision_fields_present = (
        decisions_is_list
        and all(isinstance(d, dict) and "date" in d
                and "decision" in d and "rationale_declared" in d
                and "alternatives_declared" in d for d in decisions)
    )
    _check(results, "risks_estimates_and_decisions",
           "every_decision_entry_complete", decisions,
           decision_fields_present,
           decisions_is_list and decisions_count > 0
           and len(decisions_incomplete) == 0,
           "decision log: every entry carries the skill's log "
           "shape — a valid date, the decision, a declared "
           "rationale and declared alternatives considered")
    _bool_check(results, "risks_estimates_and_decisions",
                "decision_log_append_only", manifest,
                ("decision_log", "append_only"),
                "decision log: the log is append-only")
    _bool_check(results, "risks_estimates_and_decisions",
                "decisions_logged_at_decision_time", manifest,
                ("decision_log", "logged_at_decision_time"),
                "quality gate: decisions are logged when made, "
                "not reconstructed later")

    # ---- Section 4: execution_discipline_and_status (skill:
    #      method step 6 — WIP limit, one worked item per lane;
    #      step 7 — status: phase, done, next, blockers,
    #      confidence, one screen; red lines — no silent
    #      re-scoping, plan updates go through approval, deploys
    #      are HITL; charter — never a direct-to-production
    #      change) ----
    _bool_check(results, "execution_discipline_and_status",
                "wip_limit_declared", manifest,
                ("execution", "wip_limit_declared"),
                "WIP limit: a work-in-progress limit is declared "
                "— finish phases, don't parallelize beyond capacity")
    _bool_check(results, "execution_discipline_and_status",
                "one_worked_item_per_lane", manifest,
                ("execution", "one_worked_item_per_lane"),
                "WIP limit: one worked item per lane")
    _bool_check(results, "execution_discipline_and_status",
                "plan_updates_through_approval", manifest,
                ("execution", "plan_updates_through_approval"),
                "red line: plan updates go through approval")
    _false_check(results, "execution_discipline_and_status",
                 "no_silent_rescoping", manifest,
                 ("execution", "silent_rescoping_present"),
                 "red line: no silent re-scoping")
    _bool_check(results, "execution_discipline_and_status",
                "deploys_hitl_approved", manifest,
                ("execution", "deploys_hitl_approved"),
                "red line: deploys are HITL — human approves; "
                "automation prepares, humans decide")
    _false_check(results, "execution_discipline_and_status",
                 "no_direct_to_production_change", manifest,
                 ("execution", "direct_to_production_change_present"),
                 "charter: never a direct-to-production change")
    _bool_check(results, "execution_discipline_and_status",
                "status_phase_declared", manifest,
                ("status", "phase_declared"),
                "status: the current phase is reported")
    _bool_check(results, "execution_discipline_and_status",
                "status_done_declared", manifest,
                ("status", "done_declared"),
                "status: what is done is reported")
    _bool_check(results, "execution_discipline_and_status",
                "status_next_declared", manifest,
                ("status", "next_declared"),
                "status: what is next is reported")
    _bool_check(results, "execution_discipline_and_status",
                "status_blockers_declared", manifest,
                ("status", "blockers_declared"),
                "status: blockers are reported")
    _bool_check(results, "execution_discipline_and_status",
                "status_confidence_declared", manifest,
                ("status", "confidence_declared"),
                "status: confidence is reported")

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
        verdict = "DELIVERY_PLAN_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "DELIVERY_PLAN_READY"

    computed_names = (
        "phases_declared",
        "every_phase_has_owner_named",
        "every_phase_has_exit_criteria",
        "every_dependency_names_declared_phase",
        "every_phase_dates_valid_and_in_order",
        "every_dependency_precedes_dependent",
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
        "service": "delivery-plan-preparation",
        "atom_version": "0.1.0",
        "plan": manifest.get("plan"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "phases_count": phases_count,
        "phases_without_owner": phases_without_owner,
        "phases_without_exit_criteria": phases_without_exit,
        "phases_with_date_problems": phases_with_date_problems,
        "owner_coverage": _fmt4(owner_coverage),
        "unknown_dependencies": unknown_dependencies,
        "dependency_order_violations": dependency_order_violations,
        "dependency_coverage": _fmt4(dependency_coverage),
        "total_duration_days": total_duration_days,
        "milestones_count": milestones_count,
        "milestones_without_owner": milestones_without_owner,
        "milestones_with_unknown_phase": milestones_with_unknown_phase,
        "milestones_due_outside_phase_dates": milestones_outside_phase,
        "milestone_phase_coverage": _fmt4(milestone_phase_coverage),
        "risks_count": risks_count,
        "risks_without_mitigation": risks_without_mitigation,
        "risks_without_trigger": risks_without_trigger,
        "decisions_count": decisions_count,
        "decisions_incomplete": decisions_incomplete,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across four sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "DELIVERY PLAN PREPARATION",
        f"plan: {verdict.get('plan')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: delivery_plan_preparation.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "DELIVERY_PLAN_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
