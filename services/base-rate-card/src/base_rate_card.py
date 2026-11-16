#!/usr/bin/env python3
"""Base-rate card — deterministic core.

Built from the bound skill `critical-thinking` (v1): "Think
clearly under pressure — evidence hierarchy, base rates,
steelmanning, fallacy checks, calibration." This atom audits one
declared judgment card — a single claim worked through the skill's
method — against the skill's eight method steps, its four quality
gates, and its red lines, with the base-rate step (method step 3:
"Base rates first") at its centre. It does not source reference
data, restate the claim, or judge whether the conclusion itself is
right — it checks that the card contains what the skill's method
requires, on the caller's declared evidence. Reference-class
sourcing stays the caller's: the card declares its own reference
class, its counts, and its stated rate, and this core checks
their internal consistency.

The caller submits a base-rate-card manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- base-rate consistency (method step 3): when the card declares a
  reference-class size, a success count, and a stated base rate,
  the stated rate must equal the rate the counts imply
  (successes / size), the counts must be coherent (size positive,
  successes between zero and size), and the stated rate must be a
  probability (between zero and one). The implied rate and the
  stated-minus-implied difference are reported at a fixed six
  decimals (see below);
- fallacy coverage (method step 5): the declared spot-check list
  must cover every fallacy the skill names — ad hominem, straw
  man, false dilemma, appeal to authority/antiquity, survivorship
  stories, motivated reasoning, cherry-picked windows;
- confidence bounds (method step 6: state confidence, e.g. "80%
  sure"): a declared confidence passes only as a probability,
  between zero and one inclusive.

Computed rates are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values except the consistency check, which
compares the fixed-6dp difference to zero. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. The fallacies the skill names but the card does
not declare checked are reported as `fallacies_not_checked`
(null when no list is declared). The computed outcome over the
three computed checks is reported as `computed_status`.

Verdict:
- any fail             -> CARD_NOT_COMPLETE
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CARD_COMPLETE

This is a completeness and consistency audit over declared
evidence, not a judgment review: a card that declares every step
passes even if its conclusion is wrong, and nothing here verifies
that a declared value is true or that the reference class is the
right one.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "claim_and_evidence",
    "base_rates",
    "steelman",
    "fallacy_spot_check",
    "calibration",
    "second_order_and_judgment",
)

STATED_FALLACIES = [
    "ad_hominem",
    "straw_man",
    "false_dilemma",
    "appeal_to_authority_or_antiquity",
    "survivorship",
    "motivated_reasoning",
    "cherry_picked_windows",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the fallacy list entries) are validated as
# strings only, never enum-checked: coverage is a verdict check,
# not a type error.
MANIFEST_SPEC = {
    "claim": "string",
    "evidence": {
        "claim_restated_precisely": "boolean",
        "supporting_evidence_sought": "boolean",
        "refuting_evidence_sought": "boolean",
        "hierarchy_applied": "boolean",
        "conflicts_noted_with_reasons": "boolean",
    },
    "base_rate": {
        "reference_class_defined": "boolean",
        "considered_first": "boolean",
        "reference_class_size": "number",
        "reference_class_successes": "number",
        "stated": "number",
    },
    "steelman": {
        "strongest_counterargument_built": "boolean",
        "counterargument_engaged": "boolean",
        "opposing_view_strawmanned": "boolean",
    },
    "fallacies": {
        "spot_check_performed": "boolean",
        "checked": ["string"],
    },
    "calibration": {
        "confidence_stated": "boolean",
        "confidence_value": "number",
        "outcomes_reviewed": "boolean",
        "hit_rate_tracked_by_confidence_band": "boolean",
    },
    "judgment": {
        "second_order_effects_considered": "boolean",
        "written": "boolean",
        "includes_confidence": "boolean",
        "includes_key_uncertainties": "boolean",
        "conclusion_from_vibes_or_authority_alone": "boolean",
        "certainty_outruns_evidence": "boolean",
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


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def evaluate(manifest):
    """Return the verdict dict for a base-rate-card manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: claim_and_evidence (skill method steps 1-2:
    #      "Claim -> evidence: restate the claim precisely; what
    #      evidence would support it, what would refute it?";
    #      "Evidence hierarchy: measurements/data > documents/logs
    #      > expert synthesis > hearsay; note conflicts and why
    #      they exist (incentives!)"; quality gate: "Claims
    #      restated precisely; supporting AND refuting evidence
    #      sought") ----
    _bool_check(results, "claim_and_evidence", "claim_restated_precisely",
                manifest, ("evidence", "claim_restated_precisely"),
                "method step 1: the claim is restated precisely")
    _bool_check(results, "claim_and_evidence",
                "supporting_evidence_sought",
                manifest, ("evidence", "supporting_evidence_sought"),
                "quality gate: supporting evidence is sought — what "
                "evidence would support the claim, and is any "
                "actually present")
    _bool_check(results, "claim_and_evidence", "refuting_evidence_sought",
                manifest, ("evidence", "refuting_evidence_sought"),
                "quality gate: refuting evidence is sought — what "
                "evidence would refute the claim, and is any "
                "actually present")
    _bool_check(results, "claim_and_evidence", "evidence_hierarchy_applied",
                manifest, ("evidence", "hierarchy_applied"),
                "method step 2: the evidence hierarchy is applied — "
                "measurements/data over documents/logs over expert "
                "synthesis over hearsay")
    _bool_check(results, "claim_and_evidence",
                "evidence_conflicts_noted_with_reasons",
                manifest, ("evidence", "conflicts_noted_with_reasons"),
                "method step 2: conflicts between evidence are noted "
                "with why they exist (incentives)")

    # ---- Section 2: base_rates (skill method step 3: "Base rates
    #      first: what usually happens in cases like this?
    #      Reference-class thinking beats compelling stories";
    #      quality gate: "Base rates / reference class used where
    #      applicable") ----
    _bool_check(results, "base_rates", "reference_class_defined",
                manifest, ("base_rate", "reference_class_defined"),
                "method step 3: a reference class is defined — what "
                "usually happens in cases like this")
    _bool_check(results, "base_rates", "base_rate_considered_first",
                manifest, ("base_rate", "considered_first"),
                "method step 3: base rates come first — the "
                "reference class is consulted before the compelling "
                "story")
    size, has_size = _get(manifest, "base_rate", "reference_class_size")
    successes, has_successes = _get(
        manifest, "base_rate", "reference_class_successes")
    stated, has_stated = _get(manifest, "base_rate", "stated")
    all_numbers = (
        has_size and has_successes and has_stated
        and _is_number(size) and _is_number(successes)
        and _is_number(stated)
    )
    reference_rate = (
        successes / size
        if has_size and has_successes and _is_number(size)
        and _is_number(successes) and size > 0
        else None
    )
    difference = (
        stated - reference_rate
        if reference_rate is not None and has_stated
        and _is_number(stated)
        else None
    )
    consistent = (
        all_numbers
        and size > 0
        and 0 <= successes <= size
        and 0 <= stated <= 1
        and _fmt6(stated - successes / size) == "0.000000"
    )
    _check(results, "base_rates",
           "base_rate_consistent_with_reference_counts", stated,
           all_numbers, consistent,
           "method step 3: the stated base rate equals the rate "
           "the declared reference-class counts imply "
           "(successes / size), with coherent counts and a stated "
           "rate that is a probability")

    # ---- Section 3: steelman (skill method step 4: "Steelman the
    #      other side: strongest version of the opposing view; if
    #      you can't build it, you don't understand it yet";
    #      quality gate: "Strongest counterargument engaged
    #      (steelman, not strawman)"; red line: "no straw-manning
    #      in your own favor") ----
    _bool_check(results, "steelman", "strongest_counterargument_built",
                manifest, ("steelman", "strongest_counterargument_built"),
                "method step 4: the strongest version of the "
                "opposing view is built")
    _bool_check(results, "steelman", "steelman_engaged",
                manifest, ("steelman", "counterargument_engaged"),
                "quality gate: the strongest counterargument is "
                "engaged (steelman, not strawman)")
    _false_check(results, "steelman", "no_strawmanning",
                 manifest, ("steelman", "opposing_view_strawmanned"),
                 "red line: no straw-manning in your own favor")

    # ---- Section 4: fallacy_spot_check (skill method step 5:
    #      "Fallacy spot-check: ad hominem, straw man, false
    #      dilemma, appeal to authority/antiquity, survivorship
    #      stories, motivated reasoning, cherry-picked windows") ----
    _bool_check(results, "fallacy_spot_check", "fallacy_spot_check_performed",
                manifest, ("fallacies", "spot_check_performed"),
                "method step 5: a fallacy spot-check is performed")
    checked, has_checked = _get(manifest, "fallacies", "checked")
    checked_is_list = has_checked and isinstance(checked, list)
    not_checked = (
        [f for f in STATED_FALLACIES if f not in checked]
        if checked_is_list else None
    )
    _check(results, "fallacy_spot_check",
           "all_stated_fallacies_checked", checked, checked_is_list,
           checked_is_list and len(not_checked) == 0,
           "method step 5: the spot-check covers every fallacy "
           "the skill names — ad hominem, straw man, false dilemma, "
           "appeal to authority/antiquity, survivorship stories, "
           "motivated reasoning, cherry-picked windows")

    # ---- Section 5: calibration (skill method step 6:
    #      "Calibration habit: state confidence ('80% sure');
    #      review outcomes; track hit rate by confidence band";
    #      quality gate: "Confidence stated; outcomes reviewed for
    #      calibration") ----
    _bool_check(results, "calibration", "confidence_stated",
                manifest, ("calibration", "confidence_stated"),
                "method step 6: confidence is stated (e.g. '80% "
                "sure')")
    conf, has_conf = _get(manifest, "calibration", "confidence_value")
    conf_is_number = has_conf and _is_number(conf)
    _check(results, "calibration", "confidence_within_probability_bounds",
           conf, conf_is_number,
           conf_is_number and 0 <= conf <= 1,
           "method step 6: the stated confidence is a probability "
           "— between zero and one inclusive")
    _bool_check(results, "calibration", "outcomes_reviewed_for_calibration",
                manifest, ("calibration", "outcomes_reviewed"),
                "quality gate: outcomes are reviewed for calibration")
    _bool_check(results, "calibration", "hit_rate_tracked_by_confidence_band",
                manifest,
                ("calibration", "hit_rate_tracked_by_confidence_band"),
                "method step 6: hit rate is tracked by confidence "
                "band")

    # ---- Section 6: second_order_and_judgment (skill method
    #      steps 7-8: "Second-order thinking: and then what?
    #      Effects on incentives, timing, competition, future
    #      options"; "Write the judgment: conclusion + confidence
    #      + key uncertainties — short, checkable later"; red
    #      lines: "No conclusions from vibes or authority alone";
    #      "don't let certainty outrun evidence") ----
    _bool_check(results, "second_order_and_judgment",
                "second_order_effects_considered",
                manifest, ("judgment", "second_order_effects_considered"),
                "method step 7: second-order effects are considered "
                "— incentives, timing, competition, future options")
    _bool_check(results, "second_order_and_judgment", "judgment_written",
                manifest, ("judgment", "written"),
                "method step 8: the judgment is written — short and "
                "checkable later")
    _bool_check(results, "second_order_and_judgment",
                "judgment_includes_confidence",
                manifest, ("judgment", "includes_confidence"),
                "method step 8: the written judgment includes its "
                "confidence")
    _bool_check(results, "second_order_and_judgment",
                "judgment_includes_key_uncertainties",
                manifest, ("judgment", "includes_key_uncertainties"),
                "method step 8: the written judgment includes its "
                "key uncertainties")
    _false_check(results, "second_order_and_judgment",
                 "conclusion_not_from_vibes_or_authority_alone",
                 manifest,
                 ("judgment", "conclusion_from_vibes_or_authority_alone"),
                 "red line: no conclusions from vibes or authority "
                 "alone")
    _false_check(results, "second_order_and_judgment",
                 "certainty_does_not_outrun_evidence",
                 manifest, ("judgment", "certainty_outruns_evidence"),
                 "red line: certainty does not outrun evidence")

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
        verdict = "CARD_NOT_COMPLETE"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "CARD_COMPLETE"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in ("base_rate_consistent_with_reference_counts",
                          "all_stated_fallacies_checked",
                          "confidence_within_probability_bounds")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "base-rate-card",
        "atom_version": "0.1.0",
        "claim": manifest.get("claim"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "reference_rate": _fmt6(reference_rate),
        "base_rate_difference": _fmt6(difference),
        "fallacies_not_checked": not_checked,
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
        "BASE-RATE CARD",
        f"claim: {verdict.get('claim')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: base_rate_card.py <manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "CARD_COMPLETE" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
