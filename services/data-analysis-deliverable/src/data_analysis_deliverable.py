#!/usr/bin/env python3
"""Data analysis deliverable — deterministic core.

Built from the bound skill `data-analytics` (v1): "Turn data into
decisions — question framing, exploratory analysis, statistical
care, insights that change actions." This atom audits one declared
analysis-deliverable record — the question, the data sources and
their provenance, the method, the declared result figures with the
inputs needed to re-derive them, the caveats, and the
reproducibility / close-the-loop record — against the skill's
eight method steps, its four quality gates, and its three red
lines. It does NOT run the analysis, source the data, or certify
any conclusion — it checks that the deliverable record contains
what the skill's method requires, on the caller's declared
evidence, and that the figures the deliverable states re-derive
from the inputs it declares.

The caller submits a data-analysis-deliverable manifest (a dict,
or JSON on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic of the declared numbers — no outside threshold is
imported:

- stated total (method step 3, "segments before totals"): the
  stated total must equal the sum of the declared segment values;
- stated mean (method step 3, "distributions before averages"):
  the stated mean must equal the mean of the same declared values;
- stated percent change (method step 3, "trends on comparable
  windows"): the stated percent change must equal
  (current - prior) / prior * 100 over the declared comparable-
  window values, with a non-zero prior window.

Computed figures are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values except the re-derivation checks, which
compare the fixed-6dp difference to zero. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. The computed outcome over the three computed
checks is reported as `computed_status`.

No threshold the skill does not state is invented: no minimum
sample size or power, no significance level, no confidence
level, no effect-size pass mark, no minimum segment / cohort /
source count, and no predicted-vs-actual accuracy pass mark —
the skill requires those things be considered / stated /
checked, so only the consideration / statement / check is
audited.

Verdict:
- any fail             -> DELIVERABLE_NOT_COMPLETE
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> DELIVERABLE_COMPLETE

This is a completeness and consistency audit over a declared
deliverable record, not an analysis: a deliverable that declares
every step passes even if its conclusion is wrong, and nothing
here verifies that a declared value is true, that the data are
what the record claims, or that a recommendation is wise.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "question_framing",
    "data_provenance",
    "descriptive_and_diagnostic",
    "statistical_care",
    "insight_and_action",
    "reporting_and_reproducibility",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (the data-source list entries) are validated
# as strings only, never enum-checked: coverage is a verdict
# check, not a type error.
MANIFEST_SPEC = {
    "question": "string",
    "framing": {
        "question_stated": "boolean",
        "decision_named": "boolean",
        "decision_owner_named": "boolean",
        "decision_deadline_stated": "boolean",
        "data_that_would_change_decision_stated": "boolean",
    },
    "data": {
        "sources": ["string"],
        "provenance_documented": "boolean",
        "coverage_documented": "boolean",
        "definitions_documented": "boolean",
        "metrics_have_single_definition": "boolean",
        "gaps_documented": "boolean",
        "biases_documented": "boolean",
    },
    "analysis": {
        "distributions_shown": "boolean",
        "segments_shown": "boolean",
        "trends_on_comparable_windows": "boolean",
        "cherry_picked_baselines_used": "boolean",
        "decomposition_performed": "boolean",
        "cohort_views_shown": "boolean",
        "mechanisms_triangulated": "boolean",
    },
    "figures": {
        "values": ["number"],
        "stated_total": "number",
        "stated_mean": "number",
        "prior_window_value": "number",
        "current_window_value": "number",
        "stated_percent_change": "number",
    },
    "inference": {
        "sample_size_or_power_considered": "boolean",
        "uncertainty_stated": "boolean",
        "practical_vs_statistical_significance_distinguished": "boolean",
        "multiple_comparisons_checked": "boolean",
        "causal_claims_from_observational_data_alone": "boolean",
    },
    "recommendation": {
        "so_what_stated": "boolean",
        "recommendation_made": "boolean",
        "expected_effect_stated": "boolean",
        "recommendation_owner_named": "boolean",
        "measurement_plan_stated": "boolean",
        "uncertainty_stated_plainly": "boolean",
    },
    "report": {
        "covers_question_data_method_finding_recommendation_caveats": "boolean",
        "is_one_page": "boolean",
        "caveats_stated": "boolean",
        "charts_oversell_findings": "boolean",
        "numbers_reproducible": "boolean",
    },
    "closure": {
        "predicted_vs_actual_compared": "boolean",
        "model_of_world_updated": "boolean",
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
    """Return the verdict dict for a data-analysis-deliverable manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: question_framing (skill method step 1:
    #      "Frame the question: decision first — who decides what,
    #      by when, and what data would change it? No decision ->
    #      probably no analysis"; quality gate: "Decision + owner
    #      named before analysis"; red line: "No analysis without
    #      a question") ----
    _bool_check(results, "question_framing", "question_stated",
                manifest, ("framing", "question_stated"),
                "red line: no analysis without a question — the "
                "question is stated")
    _bool_check(results, "question_framing", "decision_named",
                manifest, ("framing", "decision_named"),
                "method step 1 / quality gate: the decision the "
                "analysis feeds is named before analysis")
    _bool_check(results, "question_framing", "decision_owner_named",
                manifest, ("framing", "decision_owner_named"),
                "method step 1 / quality gate: who decides is "
                "named — the decision owner")
    _bool_check(results, "question_framing", "decision_deadline_stated",
                manifest, ("framing", "decision_deadline_stated"),
                "method step 1: by when the decision is made is "
                "stated")
    _bool_check(results, "question_framing",
                "data_that_would_change_decision_stated",
                manifest,
                ("framing", "data_that_would_change_decision_stated"),
                "method step 1: what data would change the decision "
                "is stated")

    # ---- Section 2: data_provenance (skill method step 2: "Know
    #      the data: provenance, coverage, definitions (a metric
    #      with two definitions is a bug), gaps and biases — before
    #      computing anything"; quality gate: "Data
    #      provenance/definitions documented") ----
    sources, has_sources = _get(manifest, "data", "sources")
    sources_is_list = has_sources and isinstance(sources, list)
    _check(results, "data_provenance", "data_sources_declared",
           sources, sources_is_list,
           sources_is_list and len(sources) > 0,
           "method step 2: the data sources the analysis uses "
           "are declared — a present-but-empty list declares none")
    _bool_check(results, "data_provenance", "provenance_documented",
                manifest, ("data", "provenance_documented"),
                "method step 2 / quality gate: data provenance is "
                "documented")
    _bool_check(results, "data_provenance", "coverage_documented",
                manifest, ("data", "coverage_documented"),
                "method step 2: data coverage is documented")
    _bool_check(results, "data_provenance", "definitions_documented",
                manifest, ("data", "definitions_documented"),
                "method step 2 / quality gate: definitions are "
                "documented")
    _bool_check(results, "data_provenance",
                "metrics_have_single_definition",
                manifest, ("data", "metrics_have_single_definition"),
                "method step 2: every metric has a single "
                "definition — a metric with two definitions is a bug")
    _bool_check(results, "data_provenance", "gaps_documented",
                manifest, ("data", "gaps_documented"),
                "method step 2: gaps in the data are documented")
    _bool_check(results, "data_provenance", "biases_documented",
                manifest, ("data", "biases_documented"),
                "method step 2: biases in the data are documented")

    # ---- Section 3: descriptive_and_diagnostic (skill method
    #      steps 3-4: "Descriptive, honestly: distributions before
    #      averages; segments before totals; trends on comparable
    #      windows (no cherry-picked baselines)"; "Then diagnostic:
    #      what moved the metric — decomposition, cohort views;
    #      correlation != cause; triangulate mechanisms"; quality
    #      gate: "segments + distributions shown") ----
    _bool_check(results, "descriptive_and_diagnostic",
                "distributions_shown",
                manifest, ("analysis", "distributions_shown"),
                "method step 3 / quality gate: distributions are "
                "shown — distributions before averages")
    _bool_check(results, "descriptive_and_diagnostic", "segments_shown",
                manifest, ("analysis", "segments_shown"),
                "method step 3 / quality gate: segments are shown "
                "— segments before totals")
    _bool_check(results, "descriptive_and_diagnostic",
                "trends_on_comparable_windows",
                manifest, ("analysis", "trends_on_comparable_windows"),
                "method step 3: trends are shown on comparable "
                "windows")
    _false_check(results, "descriptive_and_diagnostic",
                 "no_cherry_picked_baselines",
                 manifest, ("analysis", "cherry_picked_baselines_used"),
                 "method step 3: no cherry-picked baselines")
    _bool_check(results, "descriptive_and_diagnostic",
                "decomposition_performed",
                manifest, ("analysis", "decomposition_performed"),
                "method step 4: what moved the metric is decomposed")
    _bool_check(results, "descriptive_and_diagnostic",
                "cohort_views_shown",
                manifest, ("analysis", "cohort_views_shown"),
                "method step 4: cohort views are shown")
    _bool_check(results, "descriptive_and_diagnostic",
                "mechanisms_triangulated",
                manifest, ("analysis", "mechanisms_triangulated"),
                "method step 4: mechanisms are triangulated")

    values, has_values = _get(manifest, "figures", "values")
    values_is_list = has_values and isinstance(values, list)
    values_usable = values_is_list and len(values) > 0
    total_value = sum(values) if values_usable else None
    mean_value = (
        sum(values) / len(values) if values_usable else None
    )
    stated_total, has_total = _get(manifest, "figures", "stated_total")
    total_present = values_is_list and has_total
    _check(results, "descriptive_and_diagnostic",
           "stated_total_matches_declared_values", stated_total,
           total_present,
           values_usable and _is_number(stated_total)
           and _fmt6(stated_total - total_value) == "0.000000",
           "method step 3: the stated total equals the sum of "
           "the declared segment values (segments before totals)")
    stated_mean, has_mean = _get(manifest, "figures", "stated_mean")
    mean_present = values_is_list and has_mean
    _check(results, "descriptive_and_diagnostic",
           "stated_mean_matches_declared_values", stated_mean,
           mean_present,
           values_usable and _is_number(stated_mean)
           and _fmt6(stated_mean - mean_value) == "0.000000",
           "method step 3: the stated mean equals the mean of "
           "the declared values (distributions before averages)")
    prior, has_prior = _get(manifest, "figures", "prior_window_value")
    current, has_current = _get(
        manifest, "figures", "current_window_value")
    stated_pct, has_pct = _get(
        manifest, "figures", "stated_percent_change")
    pct_value = (
        (current - prior) / prior * 100
        if has_prior and has_current and _is_number(prior)
        and _is_number(current) and prior != 0
        else None
    )
    pct_present = has_prior and has_current and has_pct
    _check(results, "descriptive_and_diagnostic",
           "stated_percent_change_matches_declared_windows",
           stated_pct, pct_present,
           pct_value is not None and _is_number(stated_pct)
           and _fmt6(stated_pct - pct_value) == "0.000000",
           "method step 3: the stated percent change equals "
           "(current - prior) / prior * 100 over the declared "
           "comparable-window values, with a non-zero prior window")

    # ---- Section 4: statistical_care (skill method step 5:
    #      "Statistical care when inferring: sample size/power,
    #      confidence, practical vs statistical significance,
    #      multiple-comparisons awareness"; quality gate:
    #      "Inference claims carry uncertainty; multiple-comparison
    #      risk checked"; red line: "no causal claims from
    #      observational data alone") ----
    _bool_check(results, "statistical_care",
                "sample_size_or_power_considered",
                manifest,
                ("inference", "sample_size_or_power_considered"),
                "method step 5: sample size / power is considered "
                "when inferring")
    _bool_check(results, "statistical_care", "uncertainty_stated",
                manifest, ("inference", "uncertainty_stated"),
                "method step 5 / quality gate: inference claims "
                "carry uncertainty — confidence is stated")
    _bool_check(results, "statistical_care",
                "practical_vs_statistical_significance_distinguished",
                manifest,
                ("inference",
                 "practical_vs_statistical_significance_distinguished"),
                "method step 5: practical vs statistical "
                "significance is distinguished")
    _bool_check(results, "statistical_care",
                "multiple_comparisons_checked",
                manifest, ("inference", "multiple_comparisons_checked"),
                "method step 5 / quality gate: multiple-comparison "
                "risk is checked")
    _false_check(results, "statistical_care",
                 "no_causal_claims_from_observational_data_alone",
                 manifest,
                 ("inference",
                  "causal_claims_from_observational_data_alone"),
                 "red line: no causal claims from observational "
                 "data alone")

    # ---- Section 5: insight_and_action (skill method step 6:
    #      "Insight -> action: so-what -> recommendation with
    #      expected effect, owner, and measurement plan; state
    #      uncertainty plainly"; quality gate: "Recommendation has
    #      owner + measurement plan") ----
    _bool_check(results, "insight_and_action", "so_what_stated",
                manifest, ("recommendation", "so_what_stated"),
                "method step 6: the so-what is stated — the insight "
                "that changes an action")
    _bool_check(results, "insight_and_action", "recommendation_made",
                manifest, ("recommendation", "recommendation_made"),
                "method step 6: a recommendation is made")
    _bool_check(results, "insight_and_action", "expected_effect_stated",
                manifest, ("recommendation", "expected_effect_stated"),
                "method step 6: the recommendation's expected "
                "effect is stated")
    _bool_check(results, "insight_and_action",
                "recommendation_owner_named",
                manifest,
                ("recommendation", "recommendation_owner_named"),
                "method step 6 / quality gate: the recommendation "
                "has an owner")
    _bool_check(results, "insight_and_action", "measurement_plan_stated",
                manifest, ("recommendation", "measurement_plan_stated"),
                "method step 6 / quality gate: a measurement plan "
                "is stated")
    _bool_check(results, "insight_and_action",
                "uncertainty_stated_plainly",
                manifest,
                ("recommendation", "uncertainty_stated_plainly"),
                "method step 6: uncertainty is stated plainly")

    # ---- Section 6: reporting_and_reproducibility (skill method
    #      steps 7-8: "Report like an engineer: one page —
    #      question, data, method, finding, recommendation,
    #      caveats; charts per data-visualization; numbers
    #      reproducible"; "Close the loop: after the action,
    #      predicted vs actual; update the model of the world";
    #      quality gate: "results reproducible"; red line: "no
    #      charts that oversell") ----
    _bool_check(results, "reporting_and_reproducibility",
                "report_covers_required_parts",
                manifest,
                ("report",
                 "covers_question_data_method_finding_recommendation_caveats"),
                "method step 7: the report covers question, data, "
                "method, finding, recommendation, and caveats")
    _bool_check(results, "reporting_and_reproducibility",
                "report_is_one_page",
                manifest, ("report", "is_one_page"),
                "method step 7: the report is one page")
    _bool_check(results, "reporting_and_reproducibility",
                "caveats_stated",
                manifest, ("report", "caveats_stated"),
                "method step 7: caveats are stated in the report")
    _false_check(results, "reporting_and_reproducibility",
                 "charts_do_not_oversell",
                 manifest, ("report", "charts_oversell_findings"),
                 "red line: no charts that oversell")
    _bool_check(results, "reporting_and_reproducibility",
                "numbers_reproducible",
                manifest, ("report", "numbers_reproducible"),
                "method step 7 / quality gate: numbers are "
                "reproducible — results reproducible")
    _bool_check(results, "reporting_and_reproducibility",
                "predicted_vs_actual_compared",
                manifest, ("closure", "predicted_vs_actual_compared"),
                "method step 8: after the action, predicted vs "
                "actual is compared — close the loop")
    _bool_check(results, "reporting_and_reproducibility",
                "model_of_world_updated",
                manifest, ("closure", "model_of_world_updated"),
                "method step 8: the model of the world is updated "
                "from the comparison")

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
        verdict = "DELIVERABLE_NOT_COMPLETE"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "DELIVERABLE_COMPLETE"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in (
            "stated_total_matches_declared_values",
            "stated_mean_matches_declared_values",
            "stated_percent_change_matches_declared_windows")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "data-analysis-deliverable",
        "atom_version": "0.1.0",
        "question": manifest.get("question"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "recomputed_total": _fmt6(total_value),
        "recomputed_mean": _fmt6(mean_value),
        "recomputed_percent_change": _fmt6(pct_value),
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
        "DATA ANALYSIS DELIVERABLE",
        f"question: {verdict.get('question')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: data_analysis_deliverable.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "DELIVERABLE_COMPLETE" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
