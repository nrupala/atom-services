#!/usr/bin/env python3
"""Decision process design — deterministic core.

Built from the bound skill `decision-intelligence` (Cassie
Kozyrkov's discipline): "make decisions reliably under
uncertainty by engineering the decision process, not by
worshipping data" — decide how to decide before you see the
data, pre-commit a default action and a change-my-mind
threshold, frame the loss function in each direction,
right-size the rigor to stakes and reversibility, keep
exploratory and confirmatory analysis apart, demand evidence
that could change the action, keep the decision-maker's and
the analyst's roles clear, and review decision quality
separately from the outcome.

This atom is an AUDIT of a declared decision-process record: it
validates the record a caller declares against the skill's
process checklist and core tenets. It does not make the
decision, frame it for the caller, gather or analyse data, or
verify that a declared pre-commitment was actually made when
declared — it checks that the record the skill requires is
present and internally complete and consistent on the declared
evidence.

The caller submits a decision-process manifest (a dict, or
JSON on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- options: the declared `options` list must be non-empty,
  every declared option row must name the option, and every
  row must declare the option viable;
- criteria: the declared `criteria` list must be non-empty,
  every declared criterion row must name the criterion, declare
  it set before the data was seen, and declare its threshold;
- default action: the declared `precommitment.default_action`
  must name one of the declared options — the default is one
  of the real options the record itself lists;
- loss costs: the declared `loss.cost_of_false_action` and
  `loss.cost_of_false_inaction` numbers must both be declared
  and non-negative; their ratio (false action ÷ false
  inaction) is computed and reported;
- four check groups are conditional, following the skill's own
  scoping: the threshold-adjustment check binds only when
  asymmetric costs are declared, the slowed-down check only
  when an irreversible decision is declared, the
  default-to-action check only when a reversible decision is
  declared, and the pre-registration check only when
  confirmatory analysis is declared in use.

Computed ratios are serialized as strings with exactly four
decimal places, produced in both implementations by the same
fixed rule — round half up to 4dp, floor(v * 10000 + 0.5) /
10000, then format with exactly four decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact). The declared rows that fail the
option and criterion computations are reported by name as
`options_without_name`, `options_not_declared_viable`,
`criteria_without_name`, `criteria_not_set_before_data` and
`criteria_without_threshold`. The computed outcome over the
nine primary computed checks is reported as `computed_status`.

The skill states no numeric threshold — no minimum option or
criterion count beyond completeness over the declared rows, no
loss-cost amount or ratio, no stakes level, and no amount of
data or analysis worth gathering in numbers — so no numeric
threshold check is invented; quantities are computed and
reported, and completeness (every declared option / every
declared criterion) is the only bar, exactly as the task's
declared-row consistency requires.

Verdict:
- any fail             -> DECISION_PROCESS_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> DECISION_PROCESS_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism
is the product.
"""
import json
import math
import sys

SECTIONS = (
    "framing_and_roles",
    "precommitment_before_data",
    "loss_stakes_and_rigor",
    "evidence_discipline_and_review",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "decision": "string",
    "framing": {
        "decision_named": "boolean",
        "decision_maker_identified": "boolean",
        "objective_stated": "boolean",
        "decision_maker_defines_what_matters": "boolean",
        "analyst_informs_not_decides": "boolean",
        "analysis_makes_the_call_present": "boolean",
    },
    "options": [{
        "name": "string",
        "viable": "boolean",
    }],
    "criteria": [{
        "name": "string",
        "set_before_data": "boolean",
        "threshold_declared": "boolean",
    }],
    "precommitment": {
        "default_action": "string",
        "change_my_mind_threshold_stated": "boolean",
        "criteria_and_thresholds_set_before_data_seen": "boolean",
        "data_seen_before_criteria_set_present": "boolean",
    },
    "loss": {
        "loss_function_framed": "boolean",
        "cost_of_being_wrong_in_each_direction_stated": "boolean",
        "cost_of_false_action": "number",
        "cost_of_false_inaction": "number",
        "asymmetric_costs_declared": "boolean",
        "threshold_adjusted_for_asymmetric_costs": "boolean",
    },
    "rigor": {
        "stakes_assessed": "boolean",
        "reversibility_assessed": "boolean",
        "effort_matched_to_stakes_and_reversibility": "boolean",
        "data_gathering_worth_assessed": "boolean",
        "irreversible_declared": "boolean",
        "slowed_down_and_more_evidence_for_irreversible": "boolean",
        "reversible_declared": "boolean",
        "default_to_action_for_reversible": "boolean",
    },
    "evidence": {
        "exploratory_and_confirmatory_distinguished": "boolean",
        "confirmatory_analysis_used": "boolean",
        "hypothesis_preregistered": "boolean",
        "conclusion_drawn_from_inspiring_data_present": "boolean",
        "evidence_has_power_to_change_decision": "boolean",
        "data_is_decoration_present": "boolean",
        "acted_per_preset_criteria_after_gathering": "boolean",
    },
    "review": {
        "decision_quality_reviewed_separately_from_outcome": "boolean",
        "decision_judged_by_process_and_information_at_time": "boolean",
        "outcome_used_alone_to_judge_present": "boolean",
    },
}


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


def _has_name(entry):
    return (
        isinstance(entry, dict)
        and isinstance(entry.get("name"), str)
        and len(entry["name"]) > 0
    )


def evaluate(manifest):
    """Return the verdict dict for a decision-process manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    options, has_options = _get(manifest, "options")
    options_is_list = has_options and isinstance(options, list)
    criteria, has_criteria = _get(manifest, "criteria")
    criteria_is_list = has_criteria and isinstance(criteria, list)

    options_count = len(options) if options_is_list else None
    criteria_count = len(criteria) if criteria_is_list else None

    options_without_name = (
        [_row_name(o) for o in options if not _has_name(o)]
        if options_is_list else None
    )
    options_not_viable = (
        [_row_name(o) for o in options
         if not (isinstance(o, dict) and o.get("viable") is True)]
        if options_is_list else None
    )
    option_name_coverage = (
        (options_count - len(options_without_name)) / options_count
        if options_is_list and options_count > 0 else None
    )

    criteria_without_name = (
        [_row_name(c) for c in criteria if not _has_name(c)]
        if criteria_is_list else None
    )
    criteria_not_before = (
        [_row_name(c) for c in criteria
         if not (isinstance(c, dict)
                 and c.get("set_before_data") is True)]
        if criteria_is_list else None
    )
    criteria_without_threshold = (
        [_row_name(c) for c in criteria
         if not (isinstance(c, dict)
                 and c.get("threshold_declared") is True)]
        if criteria_is_list else None
    )
    criterion_before_coverage = (
        (criteria_count - len(criteria_not_before)) / criteria_count
        if criteria_is_list and criteria_count > 0 else None
    )
    criterion_threshold_coverage = (
        (criteria_count - len(criteria_without_threshold))
        / criteria_count
        if criteria_is_list and criteria_count > 0 else None
    )

    default_action, has_default = _get(
        manifest, "precommitment", "default_action")
    default_matches = (
        options_is_list
        and isinstance(default_action, str)
        and any(isinstance(o, dict)
                and o.get("name") == default_action
                for o in options)
    )

    cost_action, has_cost_action = _get(
        manifest, "loss", "cost_of_false_action")
    cost_inaction, has_cost_inaction = _get(
        manifest, "loss", "cost_of_false_inaction")
    has_both_costs = has_cost_action and has_cost_inaction
    loss_cost_ratio = (
        cost_action / cost_inaction
        if has_both_costs
        and isinstance(cost_action, (int, float))
        and not isinstance(cost_action, bool)
        and isinstance(cost_inaction, (int, float))
        and not isinstance(cost_inaction, bool)
        and cost_inaction != 0
        else None
    )

    # ---- Section 1: framing_and_roles (skill: process checklist
    #      steps 1-2 — name the decision and the real options,
    #      identify the decision-maker and what they actually
    #      care about; core tenet — keep roles clear: the
    #      decision-maker frames the decision and defines what
    #      matters and the thresholds, the analyst informs it,
    #      analysis does not quietly make the call) ----
    _bool_check(results, "framing_and_roles",
                "decision_named", manifest,
                ("framing", "decision_named"),
                "process checklist step 1: the decision itself is "
                "named — what is actually being decided")
    _check(results, "framing_and_roles", "options_declared",
           options, options_is_list,
           options_is_list and options_count > 0,
           "process checklist step 1: the declared record names "
           "the real options — the options list is present and "
           "non-empty")
    name_present = (
        options_is_list
        and all(isinstance(o, dict) and "name" in o for o in options)
    )
    _check(results, "framing_and_roles", "every_option_named",
           options, name_present,
           options_is_list and options_count > 0
           and len(options_without_name) == 0,
           "process checklist step 1: every declared option row "
           "names the option")
    viable_present = (
        options_is_list
        and all(isinstance(o, dict) and "viable" in o
                for o in options)
    )
    _check(results, "framing_and_roles",
           "every_option_declared_viable", options, viable_present,
           options_is_list and options_count > 0
           and len(options_not_viable) == 0,
           "process checklist step 1: every declared option row "
           "declares the option viable — a real option, not a "
           "straw option")
    _bool_check(results, "framing_and_roles",
                "decision_maker_identified", manifest,
                ("framing", "decision_maker_identified"),
                "process checklist step 2: the decision-maker is "
                "identified")
    _bool_check(results, "framing_and_roles",
                "objective_stated", manifest,
                ("framing", "objective_stated"),
                "process checklist step 2: what the decision-maker "
                "actually cares about — the objective — is stated")
    _bool_check(results, "framing_and_roles",
                "decision_maker_defines_what_matters", manifest,
                ("framing", "decision_maker_defines_what_matters"),
                "roles clear: the decision-maker frames the "
                "decision and defines what matters and the "
                "thresholds")
    _bool_check(results, "framing_and_roles",
                "analyst_informs_not_decides", manifest,
                ("framing", "analyst_informs_not_decides"),
                "roles clear: the analyst informs the decision — "
                "the analyst does not make it")
    _false_check(results, "framing_and_roles",
                 "no_analysis_makes_the_call", manifest,
                 ("framing", "analysis_makes_the_call_present"),
                 "roles clear: analysis does not quietly make "
                 "the call")

    # ---- Section 2: precommitment_before_data (skill: core
    #      tenets — decide how to decide before you see the data:
    #      set decision criteria, default action and thresholds
    #      in advance, the moment that stops post-hoc
    #      rationalization; default action + change-my-mind
    #      threshold pre-committed; process checklist step 3) ----
    _check(results, "precommitment_before_data", "criteria_declared",
           criteria, criteria_is_list,
           criteria_is_list and criteria_count > 0,
           "decide how to decide before the data: the declared "
           "record names its decision criteria — the criteria "
           "list is present and non-empty")
    crit_name_present = (
        criteria_is_list
        and all(isinstance(c, dict) and "name" in c
                for c in criteria)
    )
    _check(results, "precommitment_before_data",
           "every_criterion_named", criteria, crit_name_present,
           criteria_is_list and criteria_count > 0
           and len(criteria_without_name) == 0,
           "decide how to decide before the data: every declared "
           "criterion row names the criterion")
    before_present = (
        criteria_is_list
        and all(isinstance(c, dict) and "set_before_data" in c
                for c in criteria)
    )
    _check(results, "precommitment_before_data",
           "every_criterion_set_before_data", criteria,
           before_present,
           criteria_is_list and criteria_count > 0
           and len(criteria_not_before) == 0,
           "decide how to decide before the data: every declared "
           "criterion row declares it was set before the data "
           "was seen")
    threshold_present = (
        criteria_is_list
        and all(isinstance(c, dict) and "threshold_declared" in c
                for c in criteria)
    )
    _check(results, "precommitment_before_data",
           "every_criterion_threshold_declared", criteria,
           threshold_present,
           criteria_is_list and criteria_count > 0
           and len(criteria_without_threshold) == 0,
           "decide how to decide before the data: every declared "
           "criterion row declares its threshold")
    _check(results, "precommitment_before_data",
           "default_action_matches_declared_option",
           default_action, has_default and options_is_list,
           default_matches,
           "default action: the declared default action names "
           "one of the declared real options")
    _bool_check(results, "precommitment_before_data",
                "change_my_mind_threshold_stated", manifest,
                ("precommitment", "change_my_mind_threshold_stated"),
                "default action + change-my-mind threshold: "
                "exactly what evidence would flip the default is "
                "pre-committed, answered before looking")
    _bool_check(results, "precommitment_before_data",
                "criteria_and_thresholds_set_before_data_seen",
                manifest,
                ("precommitment",
                 "criteria_and_thresholds_set_before_data_seen"),
                "decide how to decide before you see the data: "
                "the decision criteria, default action and "
                "thresholds are set in advance, before the data")
    _false_check(results, "precommitment_before_data",
                 "no_data_seen_before_precommitment", manifest,
                 ("precommitment",
                  "data_seen_before_criteria_set_present"),
                 "decide how to decide before you see the data: "
                 "the data was not seen before the criteria were "
                 "set — no post-hoc rationalization")

    # ---- Section 3: loss_stakes_and_rigor (skill: core tenets —
    #      frame the loss function, what being wrong costs in
    #      each direction, asymmetric costs move the threshold;
    #      right-size the rigor, match effort to stakes and
    #      reversibility, reversible decisions fast and
    #      irreversible ones slow; process checklist step 4) ----
    _bool_check(results, "loss_stakes_and_rigor",
                "loss_function_framed", manifest,
                ("loss", "loss_function_framed"),
                "frame the loss function: what being wrong costs "
                "is framed — what actually matters, not a tidy "
                "metric")
    _bool_check(results, "loss_stakes_and_rigor",
                "cost_of_being_wrong_in_each_direction_stated",
                manifest,
                ("loss",
                 "cost_of_being_wrong_in_each_direction_stated"),
                "frame the loss function: the cost of being wrong "
                "is stated in each direction")
    _check(results, "loss_stakes_and_rigor",
           "loss_costs_both_directions_declared",
           cost_action, has_both_costs,
           has_both_costs
           and isinstance(cost_action, (int, float))
           and not isinstance(cost_action, bool)
           and isinstance(cost_inaction, (int, float))
           and not isinstance(cost_inaction, bool)
           and cost_action >= 0 and cost_inaction >= 0,
           "frame the loss function: a numeric cost is declared "
           "for being wrong in each direction — acting wrongly "
           "and not acting wrongly")
    _gated_bool_check(
        results, "loss_stakes_and_rigor",
        "threshold_adjusted_when_costs_asymmetric",
        manifest, ("loss", "asymmetric_costs_declared"),
        ("loss", "threshold_adjusted_for_asymmetric_costs"),
        "frame the loss function: asymmetric costs move the "
        "threshold — the threshold is adjusted for the declared "
        "asymmetry",
        "no asymmetric costs declared")
    _bool_check(results, "loss_stakes_and_rigor",
                "stakes_assessed", manifest,
                ("rigor", "stakes_assessed"),
                "right-size the rigor: the stakes are assessed")
    _bool_check(results, "loss_stakes_and_rigor",
                "reversibility_assessed", manifest,
                ("rigor", "reversibility_assessed"),
                "right-size the rigor: reversibility is assessed "
                "— two-way-door or one-way-door")
    _bool_check(results, "loss_stakes_and_rigor",
                "effort_matched_to_stakes_and_reversibility",
                manifest,
                ("rigor",
                 "effort_matched_to_stakes_and_reversibility"),
                "right-size the rigor: effort is matched to "
                "stakes and reversibility")
    _bool_check(results, "loss_stakes_and_rigor",
                "data_gathering_worth_assessed", manifest,
                ("rigor", "data_gathering_worth_assessed"),
                "process checklist step 4: how much data and "
                "analysis is worth gathering is decided, given "
                "stakes and reversibility")
    _gated_bool_check(
        results, "loss_stakes_and_rigor",
        "slowed_down_when_irreversible",
        manifest, ("rigor", "irreversible_declared"),
        ("rigor",
         "slowed_down_and_more_evidence_for_irreversible"),
        "right-size the rigor: an irreversible or expensive "
        "one-way-door decision is slowed down and more evidence "
        "is gathered",
        "no irreversible decision declared")
    _gated_bool_check(
        results, "loss_stakes_and_rigor",
        "default_to_action_when_reversible",
        manifest, ("rigor", "reversible_declared"),
        ("rigor", "default_to_action_for_reversible"),
        "right-size the rigor: a reversible two-way-door "
        "decision defaults to action and is decided fast",
        "no reversible decision declared")

    # ---- Section 4: evidence_discipline_and_review (skill:
    #      core tenets — exploratory analysis generates
    #      hypotheses and confirmatory analysis tests a
    #      pre-registered one, never a conclusion from the data
    #      that inspired it; if no possible data could change
    #      the action the data is decoration; decisions are not
    #      outcomes, judge by process and information at the
    #      time; process checklist steps 5-6) ----
    _bool_check(results, "evidence_discipline_and_review",
                "exploratory_and_confirmatory_distinguished",
                manifest,
                ("evidence",
                 "exploratory_and_confirmatory_distinguished"),
                "data-driven vs data-inspired: exploratory "
                "analysis, which generates hypotheses, is "
                "distinguished from confirmatory analysis, which "
                "tests a pre-registered hypothesis")
    _gated_bool_check(
        results, "evidence_discipline_and_review",
        "hypothesis_preregistered_when_confirmatory",
        manifest, ("evidence", "confirmatory_analysis_used"),
        ("evidence", "hypothesis_preregistered"),
        "data-driven vs data-inspired: the confirmatory "
        "analysis tests a pre-registered hypothesis",
        "no confirmatory analysis declared in use")
    _false_check(results, "evidence_discipline_and_review",
                 "no_conclusion_from_inspiring_data", manifest,
                 ("evidence",
                  "conclusion_drawn_from_inspiring_data_present"),
                 "data-driven vs data-inspired: no conclusion is "
                 "drawn from the same data that inspired it")
    _bool_check(results, "evidence_discipline_and_review",
                "evidence_has_power_to_change_decision", manifest,
                ("evidence", "evidence_has_power_to_change_decision"),
                "do not be a data-driven fool: the evidence has "
                "the power to change the decision — some possible "
                "data could change the action")
    _false_check(results, "evidence_discipline_and_review",
                 "no_data_decoration", manifest,
                 ("evidence", "data_is_decoration_present"),
                 "do not be a data-driven fool: the data is not "
                 "decoration — it is not gathered when no possible "
                 "data could change the action")
    _bool_check(results, "evidence_discipline_and_review",
                "acted_per_preset_criteria_after_gathering",
                manifest,
                ("evidence",
                 "acted_per_preset_criteria_after_gathering"),
                "process checklist step 5: after gathering, the "
                "action is taken per the pre-set criteria")
    _bool_check(results, "evidence_discipline_and_review",
                "decision_quality_reviewed_separately_from_outcome",
                manifest,
                ("review",
                 "decision_quality_reviewed_separately_from_outcome"),
                "process checklist step 6: decision quality is "
                "reviewed separately from the outcome")
    _bool_check(results, "evidence_discipline_and_review",
                "decision_judged_by_process_and_information_at_time",
                manifest,
                ("review",
                 "decision_judged_by_process_and_information_at_time"),
                "decisions are not outcomes: the decision is "
                "judged by the process and the information "
                "available at the time")
    _false_check(results, "evidence_discipline_and_review",
                 "no_outcome_alone_judgment", manifest,
                 ("review", "outcome_used_alone_to_judge_present"),
                 "decisions are not outcomes: the outcome alone "
                 "is not used to judge the decision — no resulting "
                 "or outcome bias")

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
        verdict = "DECISION_PROCESS_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "DECISION_PROCESS_SOUND"

    computed_names = (
        "options_declared",
        "every_option_named",
        "every_option_declared_viable",
        "criteria_declared",
        "every_criterion_named",
        "every_criterion_set_before_data",
        "every_criterion_threshold_declared",
        "default_action_matches_declared_option",
        "loss_costs_both_directions_declared",
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
        "service": "decision-process-design",
        "atom_version": "0.1.0",
        "decision": manifest.get("decision"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "options_count": options_count,
        "options_without_name": options_without_name,
        "options_not_declared_viable": options_not_viable,
        "option_name_coverage": _fmt4(option_name_coverage),
        "criteria_count": criteria_count,
        "criteria_without_name": criteria_without_name,
        "criteria_not_set_before_data": criteria_not_before,
        "criteria_without_threshold": criteria_without_threshold,
        "criterion_set_before_data_coverage": _fmt4(
            criterion_before_coverage),
        "criterion_threshold_coverage": _fmt4(
            criterion_threshold_coverage),
        "default_action": (
            default_action if has_default else None),
        "loss_cost_ratio": _fmt4(loss_cost_ratio),
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
        "DECISION PROCESS DESIGN",
        f"decision: {verdict.get('decision')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: decision_process_design.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "DECISION_PROCESS_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
