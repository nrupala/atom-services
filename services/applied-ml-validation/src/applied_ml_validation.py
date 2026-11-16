#!/usr/bin/env python3
"""Applied ML validation — deterministic core.

Built from the bound skill `applied-machine-learning` (v1):
"Apply machine learning with discipline - framing, baselines,
validation that holds, honest evaluation, monitoring."

The caller submits an applied-ML validation manifest (a dict, or
JSON on the CLI): a DECLARED evidence pack for one ML project —
the framing and baseline record, the data audit, the validation
split declaration, the model-ladder record, the evaluation and
robustness records, and the deployment / monitoring / model-card
record. Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Three checks are computed, not merely declared, using ONLY what
the skill itself states — no outside threshold is imported:

- the model strictly beats the declared baseline score, in the
  declared metric direction (quality gate: "Baseline defined and
  meaningfully beaten (or the project rightly stopped)"). The
  skill states no margin above the baseline, so any strictly
  positive improvement passes and equality fails; when the caller
  declares the project was rightly stopped because the baseline
  was not beaten, that gate passes as the skill's stated
  alternative outcome and the scores are not required. The signed
  improvement (in the declared direction) is reported as
  `baseline_improvement`.
- the declared split matches the declared data (method 2:
  "Splits by time and group — not just random rows"; quality
  gate: "splits by time/group where applicable"). The manifest
  vocabulary for `validation.split_type` is "random", "time",
  "group", "time_and_group": temporal data requires a time or
  time_and_group split, grouped data requires a group or
  time_and_group split, and data that is neither passes with any
  declared vocabulary value.
- the model ladder is climbed in the skill's stated order
  (method 3: "majority/heuristic -> linear -> boosted trees ->
  deep — climb only when evaluation justifies it, holding data
  and splits fixed"). The manifest vocabulary for a rung is
  "majority_heuristic", "linear", "boosted_trees", "deep": the
  declared `ladder.rungs_evaluated` must be exactly the ladder
  prefix from the first rung up to and including the declared
  `ladder.selected_model_rung`, in order, with no rung skipped,
  repeated, or evaluated out of order. The selected rung's
  zero-based ladder index is reported as `selected_rung_index`.

Two further checks are conditional, following the skill's own
qualifiers:

- accuracy-only reporting fails only when the problem is declared
  imbalanced or high-stakes (red line: "No accuracy-only reporting
  on imbalanced or high-stakes problems"); otherwise it passes as
  not applicable.
- the baseline gate above, whose "rightly stopped" alternative is
  the skill's own parenthetical.

`baseline_improvement` is reported as a string with exactly four
decimal places, produced in both implementations by the same
fixed rule: round half up to 4dp — floor(v * 10000 + 0.5) / 10000
— then format with exactly four decimals. Comparisons use the
unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical.

Verdict:
- any fail             -> NOT_VALIDATED
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> VALIDATED

This atom validates DECLARED evidence about an ML project — it
does not train, run, or inspect a model or its data, and it does
not verify that a declared value is true.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "framing_and_baseline",
    "data_audit_and_leakage",
    "model_ladder",
    "evaluation_and_honesty",
    "robustness_and_limits",
    "deployment_monitoring_and_card",
)

DIRECTIONS = ("lower_is_better", "higher_is_better")
SPLIT_TYPES = ("random", "time", "group", "time_and_group")
LADDER_RUNGS = ("majority_heuristic", "linear", "boosted_trees", "deep")

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "model": "string",
    "framing": {
        "decision_named": "boolean",
        "error_costs_stated": "boolean",
        "alternatives_considered": "boolean",
    },
    "baseline": {
        "defined": "boolean",
        "baseline_score": "number",
        "model_score": "number",
        "metric_direction": "string",
        "project_stopped_because_baseline_not_beaten": "boolean",
    },
    "data": {
        "provenance_documented": "boolean",
        "licensing_and_consent_confirmed": "boolean",
        "label_quality_checked": "boolean",
        "edge_cases_covered": "boolean",
        "leakage_audited": "boolean",
        "training_without_rights_or_consent": "boolean",
    },
    "validation": {
        "temporal_data": "boolean",
        "grouped_data": "boolean",
        "split_type": "string",
    },
    "ladder": {
        "baseline_rung_evaluated": "boolean",
        "data_and_splits_held_fixed": "boolean",
        "complexity_justified_by_evaluation": "boolean",
        "selected_model_rung": "string",
        "rungs_evaluated": ["string"],
    },
    "evaluation": {
        "decision_aligned_metrics_used": "boolean",
        "slice_performance_reported": "boolean",
        "calibration_reported": "boolean",
        "uncertainty_via_resampling_reported": "boolean",
        "conclusion_change_condition_stated": "boolean",
        "imbalanced_or_high_stakes": "boolean",
        "accuracy_only_reporting": "boolean",
    },
    "robustness": {
        "distribution_shift_evaluated": "boolean",
        "adversarial_inputs_evaluated": "boolean",
        "known_failure_modes_documented": "boolean",
        "data_limitations_documented": "boolean",
        "cherry_picked_examples_presented": "boolean",
        "claims_exceed_measured_capability": "boolean",
    },
    "deployment": {
        "data_code_model_versioned_together": "boolean",
        "drift_monitoring_planned": "boolean",
        "live_performance_monitoring_planned": "boolean",
        "feedback_loops_monitored": "boolean",
        "rollback_path_defined": "boolean",
        "regular_revalidation_planned": "boolean",
    },
    "documentation": {"model_card_written_and_versioned": "boolean"},
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


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def _baseline_check(results, manifest):
    """Computed quality gate: baseline beaten, or rightly stopped.

    Returns (baseline_improvement as a fixed 4dp string or None,
    baseline_status or None).
    """
    stopped, has_stopped = _get(
        manifest, "baseline", "project_stopped_because_baseline_not_beaten")
    model, has_model = _get(manifest, "baseline", "model_score")
    base, has_base = _get(manifest, "baseline", "baseline_score")
    direction, has_dir = _get(manifest, "baseline", "metric_direction")
    complete = (has_model and has_base and has_dir
                and _is_number(model) and _is_number(base))
    improvement = None
    if complete and direction in DIRECTIONS:
        if direction == "lower_is_better":
            improvement = base - model
        else:
            improvement = model - base
    if has_stopped and stopped is True:
        _check(results, "framing_and_baseline",
               "baseline_meaningfully_beaten_or_project_stopped",
               stopped, True, True,
               "quality gate: baseline defined and meaningfully "
               "beaten (or the project rightly stopped) — the "
               "project is declared stopped because the baseline "
               "was not beaten")
        return _fmt4(improvement), "project_rightly_stopped"
    if not complete:
        _check(results, "framing_and_baseline",
               "baseline_meaningfully_beaten_or_project_stopped",
               model, False, False,
               "baseline / model scores or metric direction not "
               "declared, and no rightly-stopped declaration")
        return _fmt4(improvement), None
    if direction not in DIRECTIONS:
        _check(results, "framing_and_baseline",
               "baseline_meaningfully_beaten_or_project_stopped",
               model, True, False,
               "metric_direction must be lower_is_better or "
               "higher_is_better")
        return None, "not_beaten_on_declared_evidence"
    ok = improvement > 0
    _check(results, "framing_and_baseline",
           "baseline_meaningfully_beaten_or_project_stopped",
           model, True, ok,
           "quality gate: baseline defined and meaningfully beaten "
           "(or the project rightly stopped) — the model strictly "
           "beats the declared baseline score in the declared "
           "metric direction; the skill states no margin above "
           "the baseline, so equality does not pass")
    return _fmt4(improvement), (
        "beaten_on_declared_evidence" if ok
        else "not_beaten_on_declared_evidence")


def _split_check(results, manifest):
    """Computed: the declared split matches the declared data."""
    temporal, has_temporal = _get(manifest, "validation", "temporal_data")
    grouped, has_grouped = _get(manifest, "validation", "grouped_data")
    split, has_split = _get(manifest, "validation", "split_type")
    if not (has_temporal and has_grouped and has_split):
        _check(results, "data_audit_and_leakage",
               "splits_by_time_and_group_where_applicable",
               split, False, False,
               "temporal_data / grouped_data flags or split_type "
               "not declared")
        return
    ok = (isinstance(temporal, bool) and isinstance(grouped, bool)
          and split in SPLIT_TYPES)
    if ok and temporal and split not in ("time", "time_and_group"):
        ok = False
    if ok and grouped and split not in ("group", "time_and_group"):
        ok = False
    _check(results, "data_audit_and_leakage",
           "splits_by_time_and_group_where_applicable",
           split, True, ok,
           "splits by time and group where applicable — not just "
           "random rows: temporal data requires a time split, "
           "grouped data requires a group split")


def _ladder_check(results, manifest):
    """Computed: the ladder is climbed in order, no rung skipped.

    Returns the selected rung's zero-based ladder index, or None
    when the selected rung is not a declared ladder vocabulary
    value.
    """
    selected, has_selected = _get(manifest, "ladder", "selected_model_rung")
    rungs, has_rungs = _get(manifest, "ladder", "rungs_evaluated")
    selected_index = (LADDER_RUNGS.index(selected)
                      if has_selected and selected in LADDER_RUNGS
                      else None)
    if not has_selected or not has_rungs \
            or not isinstance(rungs, list) or not rungs:
        _check(results, "model_ladder", "ladder_climbed_in_order",
               rungs, False, False,
               "selected_model_rung or rungs_evaluated not declared")
        return selected_index
    expected = (list(LADDER_RUNGS[:selected_index + 1])
                if selected_index is not None else None)
    ok = expected is not None and rungs == expected
    _check(results, "model_ladder", "ladder_climbed_in_order",
           rungs, True, ok,
           "model ladder: majority/heuristic -> linear -> boosted "
           "trees -> deep — the rungs evaluated are exactly the "
           "ladder prefix up to the selected rung, in order, with "
           "no rung skipped, repeated, or evaluated out of order")
    return selected_index


def _accuracy_only_check(results, manifest):
    """Red line, conditional on the problem being imbalanced /
    high-stakes."""
    stakes, has_stakes = _get(
        manifest, "evaluation", "imbalanced_or_high_stakes")
    acc_only, has_acc = _get(
        manifest, "evaluation", "accuracy_only_reporting")
    if has_stakes and stakes:
        _check(results, "evaluation_and_honesty",
               "no_accuracy_only_reporting_where_it_matters",
               acc_only, has_acc, acc_only is False,
               "red line: no accuracy-only reporting on imbalanced "
               "or high-stakes problems")
    else:
        _check(results, "evaluation_and_honesty",
               "no_accuracy_only_reporting_where_it_matters",
               stakes, has_stakes, True,
               "problem not declared imbalanced or high-stakes")


def evaluate(manifest):
    """Return the verdict dict for an applied-ML validation manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: framing_and_baseline (skill method 1 + the
    #      baseline quality gate) ----
    _bool_check(results, "framing_and_baseline", "decision_named",
                manifest, ("framing", "decision_named"),
                "frame: what decision does the model inform? The "
                "decision is named")
    _bool_check(results, "framing_and_baseline", "error_costs_stated",
                manifest, ("framing", "error_costs_stated"),
                "frame: what is the cost of each error type? The "
                "error costs are stated")
    _bool_check(results, "framing_and_baseline",
                "simpler_alternatives_considered", manifest,
                ("framing", "alternatives_considered"),
                "frame: would rules, a simple regression, or asking "
                "a human do better? The simpler alternatives are "
                "considered — baseline first, always")
    _bool_check(results, "framing_and_baseline", "baseline_defined",
                manifest, ("baseline", "defined"),
                "quality gate: baseline defined — baseline first, "
                "always")
    improvement, baseline_status = _baseline_check(results, manifest)

    # ---- Section 2: data_audit_and_leakage (method 2 + red line) -
    _bool_check(results, "data_audit_and_leakage",
                "data_provenance_documented", manifest,
                ("data", "provenance_documented"),
                "data audit: provenance is documented")
    _bool_check(results, "data_audit_and_leakage",
                "licensing_and_consent_confirmed", manifest,
                ("data", "licensing_and_consent_confirmed"),
                "data audit: licensing and consent are confirmed")
    _bool_check(results, "data_audit_and_leakage",
                "label_quality_checked", manifest,
                ("data", "label_quality_checked"),
                "data audit: label quality is checked")
    _bool_check(results, "data_audit_and_leakage",
                "edge_case_coverage_checked", manifest,
                ("data", "edge_cases_covered"),
                "data audit: coverage of edge cases is checked")
    _bool_check(results, "data_audit_and_leakage", "leakage_audited",
                manifest, ("data", "leakage_audited"),
                "data audit: leakage checked (temporal, group, "
                "target proxies)")
    _false_check(results, "data_audit_and_leakage",
                 "no_training_without_rights_or_consent", manifest,
                 ("data", "training_without_rights_or_consent"),
                 "red line: no training on data without "
                 "rights/consent; PII per the privacy rules")
    _split_check(results, manifest)

    # ---- Section 3: model_ladder (method 3) ----
    _bool_check(results, "model_ladder", "baseline_rung_evaluated",
                manifest, ("ladder", "baseline_rung_evaluated"),
                "model ladder: the majority/heuristic rung is "
                "evaluated first — earn complexity")
    _bool_check(results, "model_ladder",
                "data_and_splits_held_fixed_while_climbing", manifest,
                ("ladder", "data_and_splits_held_fixed"),
                "model ladder: climb holding data and splits fixed")
    _bool_check(results, "model_ladder",
                "complexity_justified_by_evaluation", manifest,
                ("ladder", "complexity_justified_by_evaluation"),
                "model ladder: climb only when evaluation justifies "
                "it")
    selected_rung_index = _ladder_check(results, manifest)

    # ---- Section 4: evaluation_and_honesty (method 4 + quality
    #      gate + red line) ----
    _bool_check(results, "evaluation_and_honesty",
                "decision_aligned_metrics_used", manifest,
                ("evaluation", "decision_aligned_metrics_used"),
                "evaluate on decision-aligned metrics: costs of FP "
                "/ FN, not a generic score")
    _bool_check(results, "evaluation_and_honesty",
                "slice_performance_reported", manifest,
                ("evaluation", "slice_performance_reported"),
                "quality gate: slice performance reported, not "
                "aggregate accuracy alone")
    _bool_check(results, "evaluation_and_honesty",
                "calibration_reported", manifest,
                ("evaluation", "calibration_reported"),
                "quality gate: calibration reported, not aggregate "
                "accuracy alone")
    _bool_check(results, "evaluation_and_honesty",
                "uncertainty_via_resampling_reported", manifest,
                ("evaluation", "uncertainty_via_resampling_reported"),
                "evaluate: uncertainty via resampling is reported")
    _bool_check(results, "evaluation_and_honesty",
                "conclusion_change_condition_stated", manifest,
                ("evaluation", "conclusion_change_condition_stated"),
                "evaluate: what would be needed to change the "
                "conclusion is reported")
    _accuracy_only_check(results, manifest)

    # ---- Section 5: robustness_and_limits (method 5 + red lines) -
    _bool_check(results, "robustness_and_limits",
                "distribution_shift_evaluated", manifest,
                ("robustness", "distribution_shift_evaluated"),
                "robustness & honesty: distribution shift is "
                "evaluated")
    _bool_check(results, "robustness_and_limits",
                "adversarial_inputs_evaluated", manifest,
                ("robustness", "adversarial_inputs_evaluated"),
                "robustness & honesty: adversarial inputs are "
                "evaluated")
    _bool_check(results, "robustness_and_limits",
                "known_failure_modes_documented", manifest,
                ("robustness", "known_failure_modes_documented"),
                "robustness & honesty: known failure modes are "
                "documented — no hiding failure modes")
    _bool_check(results, "robustness_and_limits",
                "data_limitations_documented", manifest,
                ("robustness", "data_limitations_documented"),
                "robustness & honesty: documented data limitations")
    _false_check(results, "robustness_and_limits",
                 "no_cherry_picked_examples", manifest,
                 ("robustness", "cherry_picked_examples_presented"),
                 "robustness & honesty: no cherry-picked examples")
    _false_check(results, "robustness_and_limits",
                 "no_claims_beyond_measured_capability", manifest,
                 ("robustness", "claims_exceed_measured_capability"),
                 "red line: no 'AI' claims beyond measured "
                 "capability")

    # ---- Section 6: deployment_monitoring_and_card (methods 6-7
    #      + quality gates) ----
    _bool_check(results, "deployment_monitoring_and_card",
                "data_code_model_versioned_together", manifest,
                ("deployment", "data_code_model_versioned_together"),
                "deploy & monitor: version data+code+model together")
    _bool_check(results, "deployment_monitoring_and_card",
                "drift_monitoring_planned", manifest,
                ("deployment", "drift_monitoring_planned"),
                "quality gate: monitoring planned before deployment "
                "— drift is monitored")
    _bool_check(results, "deployment_monitoring_and_card",
                "live_performance_monitoring_planned", manifest,
                ("deployment", "live_performance_monitoring_planned"),
                "deploy & monitor: live performance is monitored")
    _bool_check(results, "deployment_monitoring_and_card",
                "feedback_loops_monitored", manifest,
                ("deployment", "feedback_loops_monitored"),
                "deploy & monitor: feedback loops are monitored")
    _bool_check(results, "deployment_monitoring_and_card",
                "rollback_path_defined", manifest,
                ("deployment", "rollback_path_defined"),
                "quality gate: monitoring + rollback planned before "
                "deployment — a rollback path is defined")
    _bool_check(results, "deployment_monitoring_and_card",
                "regular_revalidation_planned", manifest,
                ("deployment", "regular_revalidation_planned"),
                "deploy & monitor: regular re-validation is planned")
    _bool_check(results, "deployment_monitoring_and_card",
                "model_card_written_and_versioned", manifest,
                ("documentation", "model_card_written_and_versioned"),
                "quality gate: model card written and versioned — "
                "intended use, limits, metrics per slice, training "
                "data summary; keep it current")

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
        verdict = "NOT_VALIDATED"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "VALIDATED"

    return {
        "service": "applied-ml-validation",
        "atom_version": "0.1.0",
        "model": manifest.get("model"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "baseline_improvement": improvement,
        "baseline_status": baseline_status,
        "selected_rung_index": selected_rung_index,
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
        "APPLIED ML VALIDATION",
        f"model: {verdict.get('model')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<32} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: applied_ml_validation.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "VALIDATED" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
