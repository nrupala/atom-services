#!/usr/bin/env python3
"""Argument analysis review — deterministic core.

Built from the bound skill `critical-reasoning`: "Takes arguments
apart fairly — premises, conclusions, hidden assumptions — and
holds every belief at the confidence the evidence actually
supports."

This atom is an AUDIT of a declared argument-analysis record: it
validates the record a caller declares against the skill's
anatomy, evidence-weighing, base-rate/calibration, stress-test,
fallacy/bias-screening and razor steps. It does not read the
underlying argument, judge whether the conclusion is true, or
verify that a declared step was actually performed well — it
checks that the record the skill requires is present and
internally complete on the declared evidence.

The caller submits an argument-analysis manifest (a dict, or JSON
on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Three checks are computed, not merely declared, and use ONLY what
the skill itself states — no outside threshold is imported:

- the fallacy screen must cover every fallacy the skill names
  (ad hominem, straw man, false dichotomy, appeal to authority,
  slippery slope, correlation!=causation, survivorship bias,
  base-rate neglect, sunk cost) — computed as set inclusion over
  the declared `screening.fallacies_screened` list;
- the bias screen must cover every bias the skill names
  (confirmation, anchoring, availability, motivated reasoning,
  recency, overconfidence) — computed as set inclusion over the
  declared `screening.biases_screened` list;
- the stated confidence must be probabilistic, "explicit
  confidence, not binary certainty" — a declared
  `calibration.confidence_percent` passes only strictly between
  0 and 100; 0 and 100 are binary certainty and fail.

The computed outcome is also reported as `computed_status`:
"outside_stated_limits_on_declared_evidence" when any computed
check fails, "within_stated_limits_on_declared_evidence" when all
three pass, otherwise null. The fallacies and biases the screens
miss are reported as `missing_fallacies` / `missing_biases`
(null when the corresponding list is not declared), and the
declared confidence as `confidence_percent` (null when no numeric
confidence is declared).

Verdict:
- any fail             -> ARGUMENT_ANALYSIS_DEFICIENT
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> ARGUMENT_ANALYSIS_COMPLETE

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "anatomy_and_steelman",
    "evidence_weighing",
    "base_rates_and_calibration",
    "stress_testing",
    "fallacy_and_bias_screening",
    "razors_and_countercase",
)

REQUIRED_FALLACIES = [
    "ad_hominem",
    "straw_man",
    "false_dichotomy",
    "appeal_to_authority",
    "slippery_slope",
    "correlation_as_causation",
    "survivorship_bias",
    "base_rate_neglect",
    "sunk_cost",
]

REQUIRED_BIASES = [
    "confirmation",
    "anchoring",
    "availability",
    "motivated_reasoning",
    "recency",
    "overconfidence",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the screened fallacy/bias tokens) are
# validated as "string" only, never enum-checked: extra tokens are
# ignored by the computed set-inclusion checks.
MANIFEST_SPEC = {
    "argument": "string",
    "anatomy": {
        "premises_identified": "boolean",
        "conclusion_identified": "boolean",
        "validity_distinguished_from_soundness": "boolean",
        "steelman_stated": "boolean",
    },
    "evidence": {
        "source_quality_assessed": "boolean",
        "sample_size_considered": "boolean",
        "confounders_considered": "boolean",
        "replication_considered": "boolean",
        "anecdote_treated_as_data": "boolean",
    },
    "calibration": {
        "base_rate_stated": "boolean",
        "diagnosticity_assessed": "boolean",
        "confidence_percent": "number",
        "known_vs_believed_separated": "boolean",
    },
    "stress_test": {
        "inversion_or_premortem_done": "boolean",
        "second_order_consequences_traced": "boolean",
        "change_mind_evidence_prestated": "boolean",
    },
    "screening": {
        "fallacies_screened": ["string"],
        "biases_screened": ["string"],
    },
    "razors": {
        "simplest_explanation_preferred": "boolean",
        "malice_not_assumed_without_evidence": "boolean",
        "chestertons_fence_respected": "boolean",
        "map_territory_distinguished": "boolean",
    },
    "countercase": {
        "key_assumption_named": "boolean",
        "strongest_countercase_offered": "boolean",
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


def evaluate(manifest):
    """Return the verdict dict for an argument-analysis manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: anatomy_and_steelman (skill "Analyze the
    #      argument": premises -> conclusion; validity vs
    #      soundness; steelman first) ----
    _bool_check(results, "anatomy_and_steelman", "premises_identified",
                manifest, ("anatomy", "premises_identified"),
                "anatomy: the argument's premises are identified")
    _bool_check(results, "anatomy_and_steelman", "conclusion_identified",
                manifest, ("anatomy", "conclusion_identified"),
                "anatomy: the argument's conclusion is identified")
    _bool_check(results, "anatomy_and_steelman",
                "validity_distinguished_from_soundness", manifest,
                ("anatomy", "validity_distinguished_from_soundness"),
                "anatomy: validity (does the conclusion follow from "
                "the form?) is distinguished from soundness (valid "
                "and true premises)")
    _bool_check(results, "anatomy_and_steelman",
                "steelman_stated_before_critique", manifest,
                ("anatomy", "steelman_stated"),
                "steelman first: the strongest version of the view "
                "under critique is stated before the critique")

    # ---- Section 2: evidence_weighing (skill "Weigh the
    #      evidence": source quality, sample size, confounders,
    #      replication; anecdote is not data) ----
    _bool_check(results, "evidence_weighing", "source_quality_assessed",
                manifest, ("evidence", "source_quality_assessed"),
                "evidence: source quality is assessed")
    _bool_check(results, "evidence_weighing", "sample_size_considered",
                manifest, ("evidence", "sample_size_considered"),
                "evidence: sample size is considered")
    _bool_check(results, "evidence_weighing", "confounders_considered",
                manifest, ("evidence", "confounders_considered"),
                "evidence: confounders are considered")
    _bool_check(results, "evidence_weighing", "replication_considered",
                manifest, ("evidence", "replication_considered"),
                "evidence: replication is considered")
    _false_check(results, "evidence_weighing",
                 "anecdote_not_treated_as_data", manifest,
                 ("evidence", "anecdote_treated_as_data"),
                 "evidence: anecdote is not data — no anecdote is "
                 "treated as data")

    # ---- Section 3: base_rates_and_calibration (skill "Weigh the
    #      evidence": base rates first; diagnosticity; beliefs held
    #      probabilistically and calibrated — explicit confidence,
    #      not binary certainty; know vs believe separated) ----
    _bool_check(results, "base_rates_and_calibration",
                "base_rate_stated_first", manifest,
                ("calibration", "base_rate_stated"),
                "base rates first: the prior / base rate is stated "
                "before the new evidence is weighed")
    _bool_check(results, "base_rates_and_calibration",
                "diagnosticity_assessed", manifest,
                ("calibration", "diagnosticity_assessed"),
                "base rates first: how diagnostic the new evidence "
                "is — how much it should move the belief — is "
                "assessed")
    confidence, has_confidence = _get(
        manifest, "calibration", "confidence_percent")
    confidence_is_number = has_confidence and _is_number(confidence)
    confidence_ok = (confidence_is_number
                     and 0 < confidence < 100)
    _check(results, "base_rates_and_calibration",
           "confidence_probabilistic_and_explicit", confidence,
           confidence_is_number, confidence_ok,
           "calibration: an explicit confidence is held "
           "probabilistically — strictly between 0 and 100 "
           "percent, not binary certainty")
    _bool_check(results, "base_rates_and_calibration",
                "known_separated_from_believed", manifest,
                ("calibration", "known_vs_believed_separated"),
                "calibration: what is known is separated from what "
                "is believed")

    # ---- Section 4: stress_testing (skill "Stress-test":
    #      inversion / premortem; second-order thinking;
    #      falsifiability) ----
    _bool_check(results, "stress_testing", "inversion_or_premortem_run",
                manifest, ("stress_test", "inversion_or_premortem_done"),
                "stress-test: inversion is run — how would this "
                "fail? — as a premortem")
    _bool_check(results, "stress_testing",
                "second_order_consequences_traced", manifest,
                ("stress_test", "second_order_consequences_traced"),
                "stress-test: second-order thinking — consequences "
                "of consequences are traced")
    _bool_check(results, "stress_testing",
                "falsifiability_change_mind_prestated", manifest,
                ("stress_test", "change_mind_evidence_prestated"),
                "falsifiability: what evidence would change the "
                "conclusion is pre-stated")

    # ---- Section 5: fallacy_and_bias_screening (skill "Catch the
    #      errors": the named fallacies and biases) ----
    fallacies, has_fallacies = _get(
        manifest, "screening", "fallacies_screened")
    fallacies_is_list = has_fallacies and isinstance(fallacies, list)
    missing_fallacies = (
        [f for f in REQUIRED_FALLACIES if f not in fallacies]
        if fallacies_is_list else None)
    _check(results, "fallacy_and_bias_screening",
           "all_listed_fallacies_screened", fallacies,
           fallacies_is_list,
           fallacies_is_list and missing_fallacies == [],
           "fallacies: the screen covers every fallacy the skill "
           "names — ad hominem, straw man, false dichotomy, appeal "
           "to authority, slippery slope, correlation as causation, "
           "survivorship bias, base-rate neglect, sunk cost")
    biases, has_biases = _get(manifest, "screening", "biases_screened")
    biases_is_list = has_biases and isinstance(biases, list)
    missing_biases = (
        [b for b in REQUIRED_BIASES if b not in biases]
        if biases_is_list else None)
    _check(results, "fallacy_and_bias_screening",
           "all_listed_biases_screened", biases, biases_is_list,
           biases_is_list and missing_biases == [],
           "biases: the screen covers every bias the skill names "
           "— confirmation, anchoring, availability, motivated "
           "reasoning, recency, overconfidence")

    # ---- Section 6: razors_and_countercase (skill "Useful razors"
    #      + "How to show up": name the key assumption, offer the
    #      strongest honest counter-case) ----
    _bool_check(results, "razors_and_countercase",
                "simplest_explanation_preferred", manifest,
                ("razors", "simplest_explanation_preferred"),
                "Occam: the simplest explanation that fits the "
                "facts is preferred")
    _bool_check(results, "razors_and_countercase",
                "malice_not_assumed_without_evidence", manifest,
                ("razors", "malice_not_assumed_without_evidence"),
                "Hanlon: malice is not attributed to what "
                "incompetence explains, absent evidence")
    _bool_check(results, "razors_and_countercase",
                "chestertons_fence_respected", manifest,
                ("razors", "chestertons_fence_respected"),
                "Chesterton's fence: why something exists is "
                "understood before it is removed")
    _bool_check(results, "razors_and_countercase",
                "map_territory_distinguished", manifest,
                ("razors", "map_territory_distinguished"),
                "map is not territory: the model is distinguished "
                "from the reality")
    _bool_check(results, "razors_and_countercase",
                "key_assumption_named", manifest,
                ("countercase", "key_assumption_named"),
                "how to show up: the key assumption is named")
    _bool_check(results, "razors_and_countercase",
                "strongest_countercase_offered", manifest,
                ("countercase", "strongest_countercase_offered"),
                "how to show up: the strongest honest counter-case "
                "is offered")

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
        verdict = "ARGUMENT_ANALYSIS_DEFICIENT"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "ARGUMENT_ANALYSIS_COMPLETE"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in ("all_listed_fallacies_screened",
                          "all_listed_biases_screened",
                          "confidence_probabilistic_and_explicit")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "argument-analysis-review",
        "atom_version": "0.1.0",
        "argument": manifest.get("argument"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "missing_fallacies": missing_fallacies,
        "missing_biases": missing_biases,
        "confidence_percent": (
            confidence if confidence_is_number else None),
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
        "ARGUMENT ANALYSIS REVIEW",
        f"argument: {verdict.get('argument')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: argument_analysis_review.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "ARGUMENT_ANALYSIS_COMPLETE" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
