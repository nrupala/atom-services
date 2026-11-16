#!/usr/bin/env python3
"""Prediction model leakage & calibration audit — deterministic core.

Built from the bound skill `prediction` (v1): "Predict with models
honestly — baselines, leakage-free validation, calibration, drift
awareness"; "A prediction is a claim with an error bar. Beat the
baseline, validate without leakage, report calibration — or don't
deploy it."

The caller submits a prediction-model evidence manifest (a dict, or
JSON on the CLI): the target/decision record, the baseline and
untouched-holdout scores, the split declaration, the feature list
with the time each feature becomes available against the declared
prediction time, the model-ladder / threshold record, a
predicted-vs-actual calibration series against the caller's declared
tolerance, segment errors against the caller's declared maximum, and
the drift / deployment record.

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Five checks are computed, not declared, using ONLY comparisons the
skill itself states, over values the caller declares — no outside
threshold is imported (both tolerances are caller-declared):

- the model strictly beats the baseline on the untouched holdout, in
  the declared metric direction (method 2 + quality gate: "a model
  that doesn't beat the baseline doesn't ship")
- no feature is available after the declared prediction time, and no
  feature is derived from the target (method 3: leakage)
- a temporal dataset is not validated with a random split (red line:
  "No random splits for time-series reality")
- calibration error — |mean predicted probability − mean observed
  outcome| over calibration.observations — is within the caller's
  declared max_tolerated_error (method 5: "when it says 70%, it
  should be right ~70%")
- every segment error is within the caller's declared
  max_segment_error, and the worst segment is reported (method 6:
  "segment errors — the worst cohort is the story")

Computed quantities (holdout_improvement, mean_predicted,
mean_observed, calibration_error) are reported as strings with
exactly four decimal places, produced in both implementations by the
same fixed rule: round half up to 4dp — floor(v * 10000 + 0.5) /
10000 — then format with exactly four decimals. Comparisons use the
unrounded values. That fixed serialization is what makes the Python
and TypeScript outputs byte-identical.

Verdict:
- any fail             -> PREDICTION_AUDIT_UNSOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> PREDICTION_AUDIT_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "target_and_decision",
    "baseline_and_holdout",
    "leakage_and_validation",
    "model_ladder_and_thresholds",
    "calibration_and_evaluation",
    "drift_and_deployment",
)

DIRECTIONS = ("lower_is_better", "higher_is_better")

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "model": "string",
    "prediction_time": "number",
    "target": {
        "defined": "boolean",
        "horizon_declared": "boolean",
        "decision_defined": "boolean",
        "metric_chosen_from_decision_costs": "boolean",
    },
    "baseline": {
        "computed": "boolean",
        "evaluated_on_same_holdout": "boolean",
    },
    "holdout": {
        "model_score": "number",
        "baseline_score": "number",
        "metric_direction": "string",
        "untouched": "boolean",
    },
    "validation": {
        "split_strategy_documented": "boolean",
        "temporal_data": "boolean",
        "split_type": "string",
        "peeking_at_validation": "boolean",
    },
    "features": [{
        "available_at": "number",
        "derived_from_target": "boolean",
    }],
    "approach": {
        "simple_model_tried_first": "boolean",
        "complexity_justified": "boolean",
        "outputs_probabilities": "boolean",
        "action_thresholds_from_decision_costs": "boolean",
    },
    "calibration": {
        "reported": "boolean",
        "max_tolerated_error": "number",
        "observations": [{
            "predicted": "number",
            "outcome": "number",
        }],
    },
    "evaluation": {
        "segment_errors_reported": "boolean",
        "max_segment_error": "number",
        "segments": [{
            "name": "string",
            "error": "number",
        }],
    },
    "drift": {
        "monitoring_in_place": "boolean",
        "feedback_loops_identified": "boolean",
        "retraining_policy_defined": "boolean",
    },
    "deployment": {
        "versioned_model_and_card": "boolean",
        "rollback_path_defined": "boolean",
        "silent_updates_in_production": "boolean",
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


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False, evidence)


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def _holdout_check(results, manifest):
    """Computed: model strictly beats baseline on the holdout."""
    model, has_model = _get(manifest, "holdout", "model_score")
    baseline, has_base = _get(manifest, "holdout", "baseline_score")
    direction, has_dir = _get(manifest, "holdout", "metric_direction")
    complete = (has_model and has_base and has_dir
                and _is_number(model) and _is_number(baseline))
    improvement = None
    if complete and direction in DIRECTIONS:
        if direction == "lower_is_better":
            improvement = baseline - model
        else:
            improvement = model - baseline
    if not complete:
        _check(results, "baseline_and_holdout",
               "model_beats_baseline_on_holdout",
               model, False, False,
               "holdout model / baseline scores or metric direction "
               "not declared")
    elif direction not in DIRECTIONS:
        _check(results, "baseline_and_holdout",
               "model_beats_baseline_on_holdout",
               model, True, False,
               "metric_direction must be lower_is_better or "
               "higher_is_better")
    else:
        _check(results, "baseline_and_holdout",
               "model_beats_baseline_on_holdout",
               model, True, improvement > 0,
               "quality gate: baseline computed; improvement "
               "demonstrated on untouched holdout — a model that "
               "doesn't beat the baseline doesn't ship")
    return _fmt4(improvement)


def _split_check(results, manifest):
    """Red line: no random split for temporal data."""
    temporal, has_temporal = _get(manifest, "validation", "temporal_data")
    split, has_split = _get(manifest, "validation", "split_type")
    if not (has_temporal and has_split):
        _check(results, "leakage_and_validation",
               "no_random_split_for_temporal_data",
               split, False, False,
               "temporal_data flag or split_type not declared")
    else:
        ok = (isinstance(temporal, bool) and isinstance(split, str)
              and not (temporal is True and split == "random"))
        _check(results, "leakage_and_validation",
               "no_random_split_for_temporal_data",
               split, True, ok,
               "skill red line: no random splits for time-series "
               "reality — time-based splits for temporal data")


def _features_checks(results, manifest):
    """Computed leakage checks over features[]."""
    features, has_features = _get(manifest, "features")
    pred_time, has_time = _get(manifest, "prediction_time")
    if not has_features or not isinstance(features, list) \
            or not features:
        _check(results, "leakage_and_validation",
               "features_available_at_prediction_time",
               features, False, False, "no features declared")
        _check(results, "leakage_and_validation",
               "no_target_derived_features",
               features, False, False, "no features declared")
        return
    time_incomplete = not (has_time and _is_number(pred_time))
    time_violating = False
    target_incomplete = False
    target_violating = False
    for feature in features:
        if not isinstance(feature, dict):
            time_incomplete = True
            target_incomplete = True
            continue
        available, has_avail = _get(feature, "available_at")
        if not (has_avail and _is_number(available)):
            time_incomplete = True
        elif has_time and _is_number(pred_time) \
                and available > pred_time:
            time_violating = True
        derived, has_derived = _get(feature, "derived_from_target")
        if not has_derived:
            target_incomplete = True
        elif derived is not False:
            target_violating = True
    if time_incomplete:
        _check(results, "leakage_and_validation",
               "features_available_at_prediction_time",
               features, False, False,
               "a feature is missing its available_at time, or "
               "prediction_time is not declared as a number")
    else:
        _check(results, "leakage_and_validation",
               "features_available_at_prediction_time",
               features, True, not time_violating,
               "every feature is available at or before the declared "
               "prediction time — no future information leaks in")
    if target_incomplete:
        _check(results, "leakage_and_validation",
               "no_target_derived_features",
               features, False, False,
               "a feature is missing its derived_from_target flag")
    else:
        _check(results, "leakage_and_validation",
               "no_target_derived_features",
               features, True, not target_violating,
               "no feature is derived from the target itself")


def _calibration_check(results, manifest):
    """Computed calibration error over calibration.observations.

    Returns (mean_predicted, mean_observed, calibration_error) as
    fixed 4dp strings, or (None, None, None) when the series is not
    complete numeric evidence.
    """
    observations, has_obs = _get(manifest, "calibration", "observations")
    tolerance, has_tol = _get(manifest, "calibration",
                              "max_tolerated_error")
    if not has_obs or not isinstance(observations, list) \
            or not observations:
        _check(results, "calibration_and_evaluation",
               "calibration_within_declared_tolerance",
               observations, False, False,
               "no calibration observations declared")
        return None, None, None
    incomplete = not (has_tol and _is_number(tolerance))
    violating = has_tol and _is_number(tolerance) and tolerance < 0
    total_pred = 0.0
    total_outcome = 0.0
    for entry in observations:
        if not isinstance(entry, dict):
            incomplete = True
            continue
        predicted, has_pred = _get(entry, "predicted")
        outcome, has_outcome = _get(entry, "outcome")
        if not (has_pred and has_outcome and _is_number(predicted)
                and _is_number(outcome)):
            incomplete = True
            continue
        total_pred += predicted
        total_outcome += outcome
        if predicted < 0 or predicted > 1 \
                or outcome not in (0, 1):
            violating = True
    if incomplete:
        _check(results, "calibration_and_evaluation",
               "calibration_within_declared_tolerance",
               observations, False, False,
               "a calibration observation is missing its predicted "
               "probability or outcome, or max_tolerated_error is not "
               "declared as a number")
        return None, None, None
    mean_pred = total_pred / len(observations)
    mean_outcome = total_outcome / len(observations)
    error = abs(mean_pred - mean_outcome)
    if not violating:
        violating = error > tolerance
    _check(results, "calibration_and_evaluation",
           "calibration_within_declared_tolerance",
           observations, True, not violating,
           "check calibration: |mean predicted − mean observed| "
           "over the declared series, within the caller's declared "
           "max_tolerated_error — when it says 70%, it should be "
           "right ~70%")
    return _fmt4(mean_pred), _fmt4(mean_outcome), _fmt4(error)


def _segments_check(results, manifest):
    """Computed segment-error check; returns the worst segment name."""
    segments, has_segments = _get(manifest, "evaluation", "segments")
    max_error, has_max = _get(manifest, "evaluation", "max_segment_error")
    if not has_segments or not isinstance(segments, list) \
            or not segments:
        _check(results, "calibration_and_evaluation",
               "segment_errors_within_declared_max",
               segments, False, False, "no segments declared")
        return None
    incomplete = not (has_max and _is_number(max_error))
    violating = has_max and _is_number(max_error) and max_error < 0
    worst = None
    worst_error = None
    for entry in segments:
        if not isinstance(entry, dict):
            incomplete = True
            continue
        name, has_name = _get(entry, "name")
        error, has_error = _get(entry, "error")
        if not (has_name and isinstance(name, str)
                and has_error and _is_number(error)):
            incomplete = True
            continue
        if worst_error is None or error > worst_error:
            worst = name
            worst_error = error
        if error < 0:
            violating = True
        elif has_max and _is_number(max_error) and error > max_error:
            violating = True
    if incomplete:
        _check(results, "calibration_and_evaluation",
               "segment_errors_within_declared_max",
               segments, False, False,
               "a segment is missing its name or numeric error, or "
               "max_segment_error is not declared as a number")
        return None
    _check(results, "calibration_and_evaluation",
           "segment_errors_within_declared_max",
           segments, True, not violating,
           "segment errors reported, not just aggregate — every "
           "segment within the caller's declared max_segment_error; "
           "the worst cohort is the story")
    return worst


def evaluate(manifest):
    """Return the verdict dict for a prediction-model manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: target_and_decision (skill method 1) ----
    _bool_check(results, "target_and_decision", "target_defined",
                manifest, ("target", "defined"),
                "what is predicted — the target is defined")
    _bool_check(results, "target_and_decision",
                "prediction_horizon_declared", manifest,
                ("target", "horizon_declared"),
                "the prediction horizon is declared")
    _bool_check(results, "target_and_decision", "decision_defined",
                manifest, ("target", "decision_defined"),
                "the decision the prediction drives is defined")
    _bool_check(results, "target_and_decision",
                "metric_chosen_from_decision_costs", manifest,
                ("target", "metric_chosen_from_decision_costs"),
                "metric chosen from the decision's costs — false "
                "positives vs false negatives rarely cost the same")

    # ---- Section 2: baseline_and_holdout (method 2 + quality gate)
    _bool_check(results, "baseline_and_holdout", "baseline_computed",
                manifest, ("baseline", "computed"),
                "baseline first: naive rule / historical mean / "
                "current heuristic — computed and reported")
    _bool_check(results, "baseline_and_holdout",
                "baseline_evaluated_on_same_holdout", manifest,
                ("baseline", "evaluated_on_same_holdout"),
                "baseline and model are scored on the same holdout")
    holdout_improvement = _holdout_check(results, manifest)
    _bool_check(results, "baseline_and_holdout", "holdout_untouched",
                manifest, ("holdout", "untouched"),
                "holdout kept untouched for the final read — no "
                "peeking at validation")

    # ---- Section 3: leakage_and_validation (method 3 + red line) --
    _bool_check(results, "leakage_and_validation",
                "split_strategy_documented", manifest,
                ("validation", "split_strategy_documented"),
                "quality gate: split strategy documented; temporal "
                "leakage explicitly checked")
    _split_check(results, manifest)
    _features_checks(results, manifest)
    _false_check(results, "leakage_and_validation",
                 "no_validation_peeking", manifest,
                 ("validation", "peeking_at_validation"),
                 "no peeking at validation during model selection")

    # ---- Section 4: model_ladder_and_thresholds (methods 4-5) ----
    _bool_check(results, "model_ladder_and_thresholds",
                "simple_model_tried_first", manifest,
                ("approach", "simple_model_tried_first"),
                "model ladder: simple first (regression, rules, "
                "seasonal means)")
    _bool_check(results, "model_ladder_and_thresholds",
                "complexity_justified", manifest,
                ("approach", "complexity_justified"),
                "complexity earns its keep in accuracy, "
                "explainability, and maintenance cost")
    _bool_check(results, "model_ladder_and_thresholds",
                "outputs_probabilities", manifest,
                ("approach", "outputs_probabilities"),
                "probabilities, not fortune-telling: the model "
                "outputs probabilities")
    _bool_check(results, "model_ladder_and_thresholds",
                "thresholds_from_decision_costs", manifest,
                ("approach", "action_thresholds_from_decision_costs"),
                "action thresholds set from decision costs")

    # ---- Section 5: calibration_and_evaluation (methods 5-6 +
    #      quality gate) ----
    _bool_check(results, "calibration_and_evaluation",
                "calibration_reported", manifest,
                ("calibration", "reported"),
                "quality gate: calibration reported, not just "
                "ranking ability")
    mean_pred, mean_outcome, cal_error = _calibration_check(
        results, manifest)
    _bool_check(results, "calibration_and_evaluation",
                "segment_errors_reported", manifest,
                ("evaluation", "segment_errors_reported"),
                "quality gate: segment errors reported, not just "
                "aggregate")
    worst_segment = _segments_check(results, manifest)

    # ---- Section 6: drift_and_deployment (methods 7-8 + red line)
    _bool_check(results, "drift_and_deployment",
                "drift_monitoring_in_place", manifest,
                ("drift", "monitoring_in_place"),
                "quality gate: monitor input drift and live "
                "performance")
    _bool_check(results, "drift_and_deployment",
                "feedback_loops_identified", manifest,
                ("drift", "feedback_loops_identified"),
                "feedback loops identified — predictions change "
                "behavior change data")
    _bool_check(results, "drift_and_deployment",
                "retraining_policy_defined", manifest,
                ("drift", "retraining_policy_defined"),
                "quality gate: retrain policy in place before "
                "relying on the model")
    _bool_check(results, "drift_and_deployment",
                "versioned_model_and_card", manifest,
                ("deployment", "versioned_model_and_card"),
                "deploy carefully: versioned model + card")
    _bool_check(results, "drift_and_deployment",
                "rollback_path_defined", manifest,
                ("deployment", "rollback_path_defined"),
                "rollout with monitoring and a rollback path")
    _false_check(results, "drift_and_deployment",
                 "no_silent_model_updates", manifest,
                 ("deployment", "silent_updates_in_production"),
                 "skill red line: no silent model updates in "
                 "production")

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
        verdict = "PREDICTION_AUDIT_UNSOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "PREDICTION_AUDIT_SOUND"

    return {
        "service": "prediction-model-leakage-calibration-audit",
        "atom_version": "0.1.0",
        "model": manifest.get("model"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "holdout_improvement": holdout_improvement,
        "mean_predicted": mean_pred,
        "mean_observed": mean_outcome,
        "calibration_error": cal_error,
        "worst_segment": worst_segment,
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
        "PREDICTION-MODEL LEAKAGE CALIBRATION AUDIT",
        f"model: {verdict.get('model')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: prediction_model_leakage_calibration_audit.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "PREDICTION_AUDIT_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
