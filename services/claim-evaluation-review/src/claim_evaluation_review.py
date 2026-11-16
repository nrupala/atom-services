#!/usr/bin/env python3
"""Claim evaluation review — deterministic core.

Built from the bound skill `critical-thinking` (v1): "Think
clearly under pressure — evidence hierarchy, base rates,
steelmanning, fallacy checks, calibration."

This atom does NOT evaluate a claim and exercises no judgment
of its own. The caller submits a claim-evaluation-review
manifest: one DECLARED claim-evaluation artifact — a declared
claim set (each claim restated, with supporting and refuting
evidence sought and evidence presence assessed), its evidence-
hierarchy and conflict record, its base-rate / reference-class
record, its steelman and fallacy spot-check record, its
calibration record, and its second-order and written-judgment
record. The atom validates that artifact deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- claim-set checks (method step 1, quality gate 1): over the
  declared claim entries, every claim must be restated
  precisely, have supporting AND refuting evidence sought, and
  have evidence presence assessed ("Is any actually present?");
- base-rate percent (method step 3): the declared base rate is
  a percent, so it passes only inside 0-100 — the definition of
  a percent, not a judged level; no base-rate value is imposed;
- fallacy coverage (method step 5): the declared fallacy
  spot-check list must cover every fallacy the skill names —
  ad hominem, straw man, false dilemma, appeal to authority,
  appeal to antiquity, survivorship stories, motivated
  reasoning, cherry-picked windows;
- confidence percent (method step 6): the stated confidence is
  a percent, so it passes only inside 0-100 — again the
  definition of a percent; the skill's "80% sure" is an example
  of stating confidence, not a required level, so none is
  imposed;
- calibration hit rate (method step 6: "track hit rate"): the
  declared hit-rate percent must equal the declared outcomes
  correct divided by the declared outcomes total, times 100.

Computed amounts and ratios are serialized as strings with
exactly six decimal places, produced in both implementations by
the same fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals; computed comparisons compare the fixed-6dp difference
to zero. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. The fallacies the skill names
but the artifact does not declare checked are reported as
`fallacies_not_checked` (null when no list is declared). The
computed outcome over the seven computed checks is reported as
`computed_status`.

Verdict:
- any fail             -> CLAIM_EVALUATION_NOT_COMPLETE
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CLAIM_EVALUATION_COMPLETE

This is a completeness and consistency audit over declared
evidence, not a judgment that any claim is true: an artifact
that declares every step passes even if the underlying claims
are false, and nothing here verifies that a declared value is
true, that the evidence actually supports a claim, or that the
steelman was well built.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "claim_set_and_evidence",
    "evidence_hierarchy_and_conflicts",
    "base_rates_and_reference_class",
    "steelman_and_fallacy_screen",
    "calibration",
    "second_order_and_judgment",
)

STATED_FALLACIES = [
    "ad_hominem",
    "straw_man",
    "false_dilemma",
    "appeal_to_authority",
    "appeal_to_antiquity",
    "survivorship_stories",
    "motivated_reasoning",
    "cherry_picked_windows",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the fallacy list entries) are validated
# as strings only, never enum-checked: coverage is a verdict
# check, not a type error.
MANIFEST_SPEC = {
    "entity": "string",
    "claims": [{
        "label": "string",
        "restated_precisely": "boolean",
        "supporting_evidence_sought": "boolean",
        "refuting_evidence_sought": "boolean",
        "evidence_presence_assessed": "boolean",
    }],
    "hierarchy": {
        "evidence_ranked_by_hierarchy": "boolean",
        "conflicts_noted": "boolean",
        "conflict_reasons_and_incentives_examined": "boolean",
        "conclusions_from_vibes_or_authority_alone": "boolean",
    },
    "base_rates": {
        "considered_first": "boolean",
        "reference_class_identified": "boolean",
        "used_where_applicable": "boolean",
        "base_rate_percent": "number",
    },
    "steelman": {
        "strongest_counterargument_constructed": "boolean",
        "strongest_counterargument_engaged": "boolean",
        "straw_manning_in_own_favor": "boolean",
    },
    "fallacy_screen": {
        "fallacies_checked": ["string"],
    },
    "calibration": {
        "confidence_stated": "boolean",
        "confidence_percent": "number",
        "outcomes_reviewed": "boolean",
        "hit_rate_tracked_by_confidence_band": "boolean",
        "outcomes_correct": "number",
        "outcomes_total": "number",
        "declared_hit_rate_percent": "number",
        "certainty_outruns_evidence": "boolean",
    },
    "second_order": {
        "second_order_thinking_applied": "boolean",
    },
    "judgment": {
        "judgment_written": "boolean",
        "judgment_includes_key_uncertainties": "boolean",
        "judgment_checkable_later": "boolean",
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


def _is_nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _claim_checks(results, manifest):
    """Computed claim-set checks. Returns claims_evaluated."""
    claims, has_claims = _get(manifest, "claims")
    if not has_claims or not isinstance(claims, list) or not claims:
        for name in (
            "claim_entries_complete",
            "all_claims_restated_precisely",
            "all_claims_supporting_and_refuting_evidence_sought",
            "all_claims_evidence_presence_assessed",
        ):
            _check(results, "claim_set_and_evidence", name,
                   claims, False, False,
                   "no claim entries declared")
        return 0
    incomplete = False
    evaluated = 0
    restated_ok = True
    sought_ok = True
    presence_ok = True
    for entry in claims:
        if not isinstance(entry, dict):
            incomplete = True
            continue
        label, has_label = _get(entry, "label")
        restated, has_restated = _get(entry, "restated_precisely")
        supporting, has_supporting = _get(
            entry, "supporting_evidence_sought")
        refuting, has_refuting = _get(entry, "refuting_evidence_sought")
        presence, has_presence = _get(
            entry, "evidence_presence_assessed")
        if not (has_label and has_restated and has_supporting
                and has_refuting and has_presence
                and _is_nonempty_str(label)
                and isinstance(restated, bool)
                and isinstance(supporting, bool)
                and isinstance(refuting, bool)
                and isinstance(presence, bool)):
            incomplete = True
            continue
        evaluated += 1
        if restated is not True:
            restated_ok = False
        if not (supporting is True and refuting is True):
            sought_ok = False
        if presence is not True:
            presence_ok = False
    if incomplete:
        _check(results, "claim_set_and_evidence",
               "claim_entries_complete",
               claims, False, False,
               "a claim entry is missing its label, restated, "
               "supporting-sought, refuting-sought, or "
               "presence-assessed field")
        for name, evidence in (
            ("all_claims_restated_precisely",
             "a claim entry is incomplete, so restatement cannot "
             "be evaluated over the whole claim set"),
            ("all_claims_supporting_and_refuting_evidence_sought",
             "a claim entry is incomplete, so evidence seeking "
             "cannot be evaluated over the whole claim set"),
            ("all_claims_evidence_presence_assessed",
             "a claim entry is incomplete, so evidence presence "
             "cannot be evaluated over the whole claim set"),
        ):
            _check(results, "claim_set_and_evidence", name,
                   claims, False, False, evidence)
    else:
        _check(results, "claim_set_and_evidence",
               "claim_entries_complete",
               claims, True, True,
               "every claim entry carries a label, a restatement "
               "flag, supporting- and refuting-evidence-sought "
               "flags, and an evidence-presence-assessed flag")
        _check(results, "claim_set_and_evidence",
               "all_claims_restated_precisely",
               claims, True, restated_ok,
               "quality gate: every claim in the set is restated "
               "precisely")
        _check(results, "claim_set_and_evidence",
               "all_claims_supporting_and_refuting_evidence_sought",
               claims, True, sought_ok,
               "quality gate: supporting AND refuting evidence is "
               "sought for every claim in the set")
        _check(results, "claim_set_and_evidence",
               "all_claims_evidence_presence_assessed",
               claims, True, presence_ok,
               "method step 1: for every claim, whether evidence "
               "is actually present is assessed")
    return evaluated


def evaluate(manifest):
    """Return the verdict dict for a claim-evaluation manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: claim_set_and_evidence (skill method step 1:
    #      "Claim -> evidence: restate the claim precisely; what
    #      evidence would support it, what would refute it? Is
    #      any actually present?"; quality gate: "Claims restated
    #      precisely; supporting AND refuting evidence sought") ----
    claims_evaluated = _claim_checks(results, manifest)

    # ---- Section 2: evidence_hierarchy_and_conflicts (skill
    #      method step 2: "Evidence hierarchy: measurements/data
    #      > documents/logs > expert synthesis > hearsay; note
    #      conflicts and why they exist (incentives!)"; red line:
    #      "No conclusions from vibes or authority alone") ----
    _bool_check(results, "evidence_hierarchy_and_conflicts",
                "evidence_ranked_by_hierarchy",
                manifest, ("hierarchy", "evidence_ranked_by_hierarchy"),
                "method step 2: evidence is ranked by the stated "
                "hierarchy — measurements/data over documents/logs "
                "over expert synthesis over hearsay")
    _bool_check(results, "evidence_hierarchy_and_conflicts",
                "conflicts_noted",
                manifest, ("hierarchy", "conflicts_noted"),
                "method step 2: conflicts between evidence are noted")
    _bool_check(results, "evidence_hierarchy_and_conflicts",
                "conflict_reasons_and_incentives_examined",
                manifest,
                ("hierarchy",
                 "conflict_reasons_and_incentives_examined"),
                "method step 2: why conflicts exist is examined — "
                "incentives included")
    _false_check(results, "evidence_hierarchy_and_conflicts",
                 "no_conclusions_from_vibes_or_authority_alone",
                 manifest,
                 ("hierarchy",
                  "conclusions_from_vibes_or_authority_alone"),
                 "red line: no conclusions from vibes or authority "
                 "alone")

    # ---- Section 3: base_rates_and_reference_class (skill method
    #      step 3: "Base rates first: what usually happens in
    #      cases like this? Reference-class thinking beats
    #      compelling stories"; quality gate: "Base rates /
    #      reference class used where applicable") ----
    _bool_check(results, "base_rates_and_reference_class",
                "base_rates_considered_first",
                manifest, ("base_rates", "considered_first"),
                "method step 3: base rates are considered first, "
                "before compelling stories")
    _bool_check(results, "base_rates_and_reference_class",
                "reference_class_identified",
                manifest, ("base_rates", "reference_class_identified"),
                "method step 3: a reference class is identified — "
                "what usually happens in cases like this")
    _bool_check(results, "base_rates_and_reference_class",
                "base_rates_used_where_applicable",
                manifest, ("base_rates", "used_where_applicable"),
                "quality gate: base rates / reference class are "
                "used where applicable")
    base_rate, has_base_rate = _get(
        manifest, "base_rates", "base_rate_percent")
    base_rate_is_number = has_base_rate and _is_number(base_rate)
    _check(results, "base_rates_and_reference_class",
           "base_rate_percent_within_percent_range",
           base_rate, base_rate_is_number,
           base_rate_is_number and 0 <= base_rate <= 100,
           "method step 3: the declared base rate is a percent — "
           "it lies between 0 and 100 inclusive; no base-rate "
           "level itself is judged here")

    # ---- Section 4: steelman_and_fallacy_screen (skill method
    #      step 4: "Steelman the other side: strongest version of
    #      the opposing view; if you can't build it, you don't
    #      understand it yet"; quality gate: "Strongest
    #      counterargument engaged (steelman, not strawman)";
    #      red line: "no straw-manning in your own favor"; method
    #      step 5: "Fallacy spot-check: ad hominem, straw man,
    #      false dilemma, appeal to authority/antiquity,
    #      survivorship stories, motivated reasoning,
    #      cherry-picked windows") ----
    _bool_check(results, "steelman_and_fallacy_screen",
                "strongest_counterargument_constructed",
                manifest,
                ("steelman", "strongest_counterargument_constructed"),
                "method step 4: the strongest version of the "
                "opposing view is constructed — a steelman")
    _bool_check(results, "steelman_and_fallacy_screen",
                "strongest_counterargument_engaged",
                manifest,
                ("steelman", "strongest_counterargument_engaged"),
                "quality gate: the strongest counterargument is "
                "engaged, not a strawman")
    _false_check(results, "steelman_and_fallacy_screen",
                 "no_straw_manning_in_own_favor",
                 manifest, ("steelman", "straw_manning_in_own_favor"),
                 "red line: no straw-manning in your own favor")
    checked, has_checked = _get(
        manifest, "fallacy_screen", "fallacies_checked")
    checked_is_list = has_checked and isinstance(checked, list)
    not_checked = (
        [f for f in STATED_FALLACIES if f not in checked]
        if checked_is_list else None
    )
    _check(results, "steelman_and_fallacy_screen",
           "fallacy_screen_covers_stated_fallacies",
           checked, checked_is_list,
           checked_is_list and len(not_checked) == 0,
           "method step 5: the fallacy spot-check covers every "
           "fallacy the skill names — ad hominem, straw man, "
           "false dilemma, appeal to authority, appeal to "
           "antiquity, survivorship stories, motivated reasoning, "
           "cherry-picked windows")

    # ---- Section 5: calibration (skill method step 6:
    #      "Calibration habit: state confidence ("80% sure");
    #      review outcomes; track hit rate by confidence band";
    #      quality gate: "Confidence stated; outcomes reviewed
    #      for calibration"; red line: "don't let certainty
    #      outrun evidence") ----
    _bool_check(results, "calibration", "confidence_stated",
                manifest, ("calibration", "confidence_stated"),
                "quality gate: confidence is stated")
    confidence, has_confidence = _get(
        manifest, "calibration", "confidence_percent")
    confidence_is_number = has_confidence and _is_number(confidence)
    _check(results, "calibration",
           "confidence_percent_within_percent_range",
           confidence, confidence_is_number,
           confidence_is_number and 0 <= confidence <= 100,
           "method step 6: the stated confidence is a percent — "
           "it lies between 0 and 100 inclusive; the skill's "
           "80% example is an illustration of stating confidence, "
           "not a required level, and no level is judged here")
    _bool_check(results, "calibration", "outcomes_reviewed",
                manifest, ("calibration", "outcomes_reviewed"),
                "quality gate: outcomes are reviewed for calibration")
    _bool_check(results, "calibration",
                "hit_rate_tracked_by_confidence_band",
                manifest,
                ("calibration", "hit_rate_tracked_by_confidence_band"),
                "method step 6: hit rate is tracked by confidence "
                "band")
    correct, has_correct = _get(
        manifest, "calibration", "outcomes_correct")
    total, has_total = _get(manifest, "calibration", "outcomes_total")
    declared_hit, has_hit = _get(
        manifest, "calibration", "declared_hit_rate_percent")
    hit_all_numbers = (
        has_correct and has_total and has_hit
        and _is_number(correct) and _is_number(total)
        and _is_number(declared_hit)
    )
    computed_hit = (
        correct / total * 100
        if has_correct and has_total and _is_number(correct)
        and _is_number(total) and total > 0
        else None
    )
    hit_difference = (
        declared_hit - computed_hit
        if computed_hit is not None and has_hit
        and _is_number(declared_hit)
        else None
    )
    hit_consistent = (
        hit_all_numbers and total > 0
        and _fmt6(declared_hit - correct / total * 100) == "0.000000"
    )
    _check(results, "calibration",
           "declared_hit_rate_matches_correct_divided_by_total",
           declared_hit, hit_all_numbers, hit_consistent,
           "method step 6: the declared hit-rate percent equals "
           "the declared outcomes correct divided by the declared "
           "outcomes total, times 100 (track hit rate)")
    _false_check(results, "calibration",
                 "certainty_does_not_outrun_evidence",
                 manifest, ("calibration", "certainty_outruns_evidence"),
                 "red line: certainty does not outrun evidence")

    # ---- Section 6: second_order_and_judgment (skill method
    #      step 7: "Second-order thinking: and then what? Effects
    #      on incentives, timing, competition, future options";
    #      method step 8: "Write the judgment: conclusion +
    #      confidence + key uncertainties — short, checkable
    #      later") ----
    _bool_check(results, "second_order_and_judgment",
                "second_order_thinking_applied",
                manifest, ("second_order", "second_order_thinking_applied"),
                "method step 7: second-order thinking is applied — "
                "and then what? Effects on incentives, timing, "
                "competition, future options")
    _bool_check(results, "second_order_and_judgment",
                "judgment_written",
                manifest, ("judgment", "judgment_written"),
                "method step 8: the judgment is written — "
                "conclusion plus confidence plus key uncertainties")
    _bool_check(results, "second_order_and_judgment",
                "judgment_includes_key_uncertainties",
                manifest, ("judgment", "judgment_includes_key_uncertainties"),
                "method step 8: the written judgment includes the "
                "key uncertainties")
    _bool_check(results, "second_order_and_judgment",
                "judgment_checkable_later",
                manifest, ("judgment", "judgment_checkable_later"),
                "method step 8: the written judgment is short and "
                "checkable later")

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
        verdict = "CLAIM_EVALUATION_NOT_COMPLETE"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "CLAIM_EVALUATION_COMPLETE"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in (
            "all_claims_restated_precisely",
            "all_claims_supporting_and_refuting_evidence_sought",
            "all_claims_evidence_presence_assessed",
            "base_rate_percent_within_percent_range",
            "fallacy_screen_covers_stated_fallacies",
            "confidence_percent_within_percent_range",
            "declared_hit_rate_matches_correct_divided_by_total")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "claim-evaluation-review",
        "atom_version": "0.1.0",
        "entity": manifest.get("entity"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "claims_evaluated": claims_evaluated,
        "base_rate_percent": _fmt6(base_rate if base_rate_is_number else None),
        "confidence_percent": _fmt6(
            confidence if confidence_is_number else None),
        "computed_hit_rate_percent": _fmt6(computed_hit),
        "hit_rate_difference": _fmt6(hit_difference),
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
        "CLAIM EVALUATION REVIEW",
        f"entity: {verdict.get('entity')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: claim_evaluation_review.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "CLAIM_EVALUATION_COMPLETE" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
