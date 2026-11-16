#!/usr/bin/env python3
"""Assumption audit — deterministic core.

Built from the bound skill `decision-intelligence` (v1): engineer the
decision itself — decide how to decide before you see the data, set a
default action and a change-my-mind threshold in advance, frame the
loss function, right-size the rigor, and review decision quality
separately from the outcome.

The caller submits a decision-process evidence manifest (a dict, or
JSON on the CLI). Every check in every section reads declared manifest
fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Verdict:
- any fail             -> UNSOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "framing",
    "preset_criteria",
    "loss_function",
    "rigor_sizing",
    "data_discipline",
    "review",
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
        "options_listed": "boolean",
        "decision_maker_identified": "boolean",
        "objective_defined": "boolean",
    },
    "preset": {
        "criteria_set_before_data": "boolean",
        "default_action_set": "boolean",
        "change_threshold_set_before_data": "boolean",
    },
    "loss": {
        "framed_each_direction": "boolean",
        "threshold_reflects_asymmetry": "boolean",
    },
    "rigor": {
        "stakes_assessed": "boolean",
        "reversibility_assessed": "boolean",
        "effort_matched": "boolean",
    },
    "data": {
        "exploratory_confirmatory_separated": "boolean",
        "conclusion_not_from_inspiring_data": "boolean",
        "evidence_could_change_decision": "boolean",
        "roles_clear": "boolean",
    },
    "review": {
        "conducted": "boolean",
        "separates_decision_from_outcome": "boolean",
    },
}

def _validate_value(value, spec, path):
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
    elif spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
    elif spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
    elif isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for i, item in enumerate(value):
            _validate_value(item, spec[0], f"{path}[{i}]")
    elif isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)


def _validate_fields(obj, spec, prefix):
    for field, fspec in spec.items():
        if field not in obj:
            continue
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(obj[field], fspec, path)


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
    """Return the verdict dict for a decision-process manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: framing (skill process checklist 1-2) ----
    _bool_check(results, "framing", "decision_named", manifest,
                ("framing", "decision_named"),
                "name the decision and the real options")
    _bool_check(results, "framing", "real_options_listed", manifest,
                ("framing", "options_listed"),
                "the real options are listed, not a single foregone option")
    _bool_check(results, "framing", "decision_maker_identified", manifest,
                ("framing", "decision_maker_identified"),
                "identify the decision-maker")
    _bool_check(results, "framing", "objective_defined", manifest,
                ("framing", "objective_defined"),
                "what the decision-maker actually cares about "
                "(the objective / loss function) is defined")

    # ---- Section 2: preset_criteria (core tenets 1-2) ----
    _bool_check(results, "preset_criteria", "criteria_set_before_data",
                manifest, ("preset", "criteria_set_before_data"),
                "decide how to decide before you see the data — decision "
                "criteria set in advance")
    _bool_check(results, "preset_criteria", "default_action_set", manifest,
                ("preset", "default_action_set"),
                "default action known in advance")
    _bool_check(results, "preset_criteria",
                "change_my_mind_threshold_set_before_data", manifest,
                ("preset", "change_threshold_set_before_data"),
                "pre-commit to exactly what evidence would flip the "
                "default — answered before looking")

    # ---- Section 3: loss_function (core tenet: frame the loss) ----
    _bool_check(results, "loss_function", "loss_framed_in_each_direction",
                manifest, ("loss", "framed_each_direction"),
                "what being wrong costs — in each direction")
    _bool_check(results, "loss_function",
                "threshold_reflects_asymmetric_costs", manifest,
                ("loss", "threshold_reflects_asymmetry"),
                "asymmetric costs move the threshold")

    # ---- Section 4: rigor_sizing (core tenet: right-size the rigor) ----
    _bool_check(results, "rigor_sizing", "stakes_assessed", manifest,
                ("rigor", "stakes_assessed"),
                "match effort to stakes")
    _bool_check(results, "rigor_sizing", "reversibility_assessed", manifest,
                ("rigor", "reversibility_assessed"),
                "one-way-door vs two-way-door assessed")
    _bool_check(results, "rigor_sizing",
                "effort_matched_to_stakes_and_reversibility", manifest,
                ("rigor", "effort_matched"),
                "reversible decisions decide fast; irreversible ones "
                "slow down and gather more")

    # ---- Section 5: data_discipline (core tenets: data-inspired vs
    #      data-driven, evidence must be able to change the decision,
    #      roles clear) ----
    _bool_check(results, "data_discipline",
                "exploratory_and_confirmatory_separated", manifest,
                ("data", "exploratory_confirmatory_separated"),
                "exploratory analysis generates hypotheses; confirmatory "
                "analysis tests a pre-registered hypothesis")
    _bool_check(results, "data_discipline",
                "no_conclusion_from_inspiring_data", manifest,
                ("data", "conclusion_not_from_inspiring_data"),
                "never draw a conclusion from the same data that "
                "inspired it")
    _bool_check(results, "data_discipline",
                "evidence_could_change_the_decision", manifest,
                ("data", "evidence_could_change_decision"),
                "if no possible data could change the action, the data "
                "is decoration")
    _bool_check(results, "data_discipline", "roles_clear", manifest,
                ("data", "roles_clear"),
                "the decision-maker frames and defines thresholds; the "
                "analyst informs — analysis does not quietly make the call")

    # ---- Section 6: review (process checklist 6; decisions != outcomes) ----
    _bool_check(results, "review", "decision_quality_reviewed", manifest,
                ("review", "conducted"),
                "review the decision after acting per the pre-set criteria")
    _bool_check(results, "review",
                "decision_reviewed_separately_from_outcome", manifest,
                ("review", "separates_decision_from_outcome"),
                "judge a decision by the process and information at the "
                "time, not by how it turned out (no resulting)")

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
        verdict = "UNSOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "SOUND"

    return {
        "service": "assumption-audit",
        "atom_version": "0.1.0",
        "decision": manifest.get("decision"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "ASSUMPTION AUDIT",
        f"decision: {verdict.get('decision')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<18} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: assumption_audit.py <manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
