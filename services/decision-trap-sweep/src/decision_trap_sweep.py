#!/usr/bin/env python3
"""Decision-trap sweep — deterministic core.

Built from the bound skill `decision-making` (v1): decide deliberately
— frame and classify the decision, generate at least three options,
set criteria and weights before scoring, evaluate with a fitting tool
and flag the uncertainty, pre-mortem material decisions, never rush an
irreversible decision, and log the choice with its assumptions and a
review date.

The caller submits a declared decision record (a dict, or JSON on the
CLI). The sweep checks that record for the traps the skill names:

- field present and true/valid   -> pass
- field present and false/invalid -> fail (the trap is present)
- field absent                    -> missing (evidence not provided)

Verdict:
- any fail             -> TRAPS_PRESENT
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> TRAP_CLEAR

No model call, no network, no clock dependence: the same record
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "framing_and_classification",
    "options",
    "criteria_before_evaluation",
    "evaluation_and_uncertainty",
    "pre_mortem",
    "rush_and_mood_trap",
    "decision_log_and_review",
)

CLASSIFICATIONS = ("reversible", "irreversible")

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (framing.classification) are validated as
# "string" only, never enum-checked here.
MANIFEST_SPEC = {
    "decision": "string",
    "framing": {
        "decision_stated": "boolean",
        "decide_by_named": "boolean",
        "constraints_named": "boolean",
        "out_of_scope_named": "boolean",
        "classification": "string",
        "stakes_assessed": "boolean",
    },
    "options": {
        "list": ["string"],
        "includes_status_quo": "boolean",
        "includes_smaller_reversible_step": "boolean",
    },
    "criteria": {
        "criteria_listed": "boolean",
        "defined_before_scoring": "boolean",
        "weights_assigned_before_scoring": "boolean",
    },
    "evaluation": {
        "method_named": "boolean",
        "uncertainty_flagged": "boolean",
        "probabilities_estimable": "boolean",
        "expected_value_used": "boolean",
    },
    "premortem": {
        "decision_is_material": "boolean",
        "conducted": "boolean",
        "top_risks_hedged": "boolean",
    },
    "rush": {
        "made_in_rush": "boolean",
        "made_in_a_mood": "boolean",
    },
    "log": {
        "choice_recorded": "boolean",
        "rationale_recorded": "boolean",
        "assumptions_recorded": "boolean",
        "review_date_set": "boolean",
        "communicated_with_why": "boolean",
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


def evaluate(manifest):
    """Return the verdict dict for a declared decision record."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: framing_and_classification (method 1-2,
    #      quality gate 1) ----
    _bool_check(results, "framing_and_classification",
                "decision_stated", manifest,
                ("framing", "decision_stated"),
                "what needs deciding is stated — frame the actual "
                "decision until it is crisp")
    _bool_check(results, "framing_and_classification",
                "decide_by_named", manifest,
                ("framing", "decide_by_named"),
                "by when the decision must be made is named")
    _bool_check(results, "framing_and_classification",
                "constraints_named", manifest,
                ("framing", "constraints_named"),
                "the constraints on the decision are named")
    _bool_check(results, "framing_and_classification",
                "out_of_scope_named", manifest,
                ("framing", "out_of_scope_named"),
                "what is out of scope is named")
    classification, has_classification = _get(manifest, "framing",
                                              "classification")
    _check(results, "framing_and_classification",
           "decision_classified_reversible_or_irreversible",
           classification, has_classification,
           classification in CLASSIFICATIONS,
           "classify the decision: reversible (decide fast, adjust) "
           "vs irreversible (slow down, deliberate)")
    _bool_check(results, "framing_and_classification",
                "stakes_assessed", manifest,
                ("framing", "stakes_assessed"),
                "stakes assessed — stakes x reversibility sets the "
                "effort budget")

    # ---- Section 2: options (method 3, quality gate 2, red line:
    #      no decisions without options) ----
    options_list, has_options_list = _get(manifest, "options", "list")
    _check(results, "options", "at_least_three_options",
           options_list, has_options_list,
           isinstance(options_list, list) and len(options_list) >= 3,
           "generate at least three options — binary choices are "
           "usually false binaries")
    _bool_check(results, "options", "status_quo_option_included",
                manifest, ("options", "includes_status_quo"),
                "the options include 'do nothing / wait'")
    _bool_check(results, "options",
                "smaller_reversible_step_included", manifest,
                ("options", "includes_smaller_reversible_step"),
                "the options include a smaller reversible step")

    # ---- Section 3: criteria_before_evaluation (method 4, quality
    #      gate 2, red line: no criteria invented after scores) ----
    _bool_check(results, "criteria_before_evaluation",
                "criteria_listed", manifest,
                ("criteria", "criteria_listed"),
                "what matters is defined (cost, risk, time-to-value, "
                "optionality)")
    _bool_check(results, "criteria_before_evaluation",
                "criteria_defined_before_scoring", manifest,
                ("criteria", "defined_before_scoring"),
                "criteria are defined BEFORE scoring options — "
                "criteria after scores is rationalization")
    _bool_check(results, "criteria_before_evaluation",
                "weights_assigned_before_scoring", manifest,
                ("criteria", "weights_assigned_before_scoring"),
                "weights are assigned before evaluation, not fitted "
                "to the scores afterwards")

    # ---- Section 4: evaluation_and_uncertainty (method 5) ----
    _bool_check(results, "evaluation_and_uncertainty",
                "fitting_evaluation_method_named", manifest,
                ("evaluation", "method_named"),
                "evaluate with a fitting tool — decision matrix for "
                "multi-criteria, expected value / decision trees when "
                "probabilities are estimable, scenario thinking when "
                "they are not; the method used is named")
    _bool_check(results, "evaluation_and_uncertainty",
                "uncertainty_flagged", manifest,
                ("evaluation", "uncertainty_flagged"),
                "flag the uncertainty in the evaluation")
    estimable, has_estimable = _get(manifest, "evaluation",
                                    "probabilities_estimable")
    ev_used, has_ev_used = _get(manifest, "evaluation",
                                "expected_value_used")
    if has_estimable and estimable:
        _check(results, "evaluation_and_uncertainty",
               "expected_value_used_when_probabilities_estimable",
               ev_used, has_ev_used, ev_used is True,
               "when probabilities are estimable, evaluate with "
               "expected value / decision trees")
    else:
        _check(results, "evaluation_and_uncertainty",
               "expected_value_used_when_probabilities_estimable",
               estimable, has_estimable, True,
               "probabilities are not declared estimable — expected "
               "value is not required; scenario thinking is the "
               "fitting tool")

    # ---- Section 5: pre_mortem (method 6, quality gate 3) ----
    material, has_material = _get(manifest, "premortem",
                                  "decision_is_material")
    conducted, has_conducted = _get(manifest, "premortem", "conducted")
    if has_material and material:
        _check(results, "pre_mortem",
               "premortem_conducted_for_material_decision",
               conducted, has_conducted, conducted is True,
               "pre-mortem for material decisions: assume it failed "
               "— why?")
    else:
        _check(results, "pre_mortem",
               "premortem_conducted_for_material_decision",
               material, has_material, True,
               "decision is not declared material — a pre-mortem is "
               "not required by the quality gate")
    hedged, has_hedged = _get(manifest, "premortem", "top_risks_hedged")
    if has_material and material:
        _check(results, "pre_mortem",
               "premortem_top_risks_hedged_for_material_decision",
               hedged, has_hedged, hedged is True,
               "fix or hedge the pre-mortem's top failure reasons now")
    else:
        _check(results, "pre_mortem",
               "premortem_top_risks_hedged_for_material_decision",
               material, has_material, True,
               "decision is not declared material — pre-mortem risk "
               "hedging is not required")

    # ---- Section 6: rush_and_mood_trap (red line: no irreversible
    #      decision made in a rush or a mood) ----
    irreversible = has_classification and classification == "irreversible"
    made_in_rush, has_rush = _get(manifest, "rush", "made_in_rush")
    if irreversible:
        _check(results, "rush_and_mood_trap",
               "irreversible_decision_not_made_in_rush",
               made_in_rush, has_rush, made_in_rush is False,
               "no irreversible decision made in a rush")
    else:
        _check(results, "rush_and_mood_trap",
               "irreversible_decision_not_made_in_rush",
               classification, has_classification, True,
               "decision is not classified irreversible — the rush "
               "red line does not bind it")
    made_in_mood, has_mood = _get(manifest, "rush", "made_in_a_mood")
    if irreversible:
        _check(results, "rush_and_mood_trap",
               "irreversible_decision_not_made_in_a_mood",
               made_in_mood, has_mood, made_in_mood is False,
               "no irreversible decision made in a mood")
    else:
        _check(results, "rush_and_mood_trap",
               "irreversible_decision_not_made_in_a_mood",
               classification, has_classification, True,
               "decision is not classified irreversible — the mood "
               "red line does not bind it")

    # ---- Section 7: decision_log_and_review (method 7-8, quality
    #      gate 4) ----
    _bool_check(results, "decision_log_and_review", "choice_logged",
                manifest, ("log", "choice_recorded"),
                "the choice is logged")
    _bool_check(results, "decision_log_and_review", "rationale_logged",
                manifest, ("log", "rationale_recorded"),
                "the rationale is logged")
    _bool_check(results, "decision_log_and_review",
                "assumptions_logged", manifest,
                ("log", "assumptions_recorded"),
                "the assumptions behind the choice are logged")
    _bool_check(results, "decision_log_and_review", "review_date_set",
                manifest, ("log", "review_date_set"),
                "a review date is set — review on schedule: outcomes "
                "vs expectations; separate luck from process; update")
    _bool_check(results, "decision_log_and_review",
                "decision_communicated_with_why", manifest,
                ("log", "communicated_with_why"),
                "the decision is communicated with the 'why'")

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
        verdict = "TRAPS_PRESENT"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "TRAP_CLEAR"

    return {
        "service": "decision-trap-sweep",
        "atom_version": "0.1.0",
        "decision": manifest.get("decision"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
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
        "DECISION-TRAP SWEEP",
        f"decision: {verdict.get('decision')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: decision_trap_sweep.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "TRAP_CLEAR" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
