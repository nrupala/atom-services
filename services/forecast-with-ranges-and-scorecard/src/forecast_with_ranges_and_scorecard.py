#!/usr/bin/env python3
"""Forecast with ranges and scorecard — deterministic core.

Built from the bound skill `forecasting` (v1): "Forecasts are planning
instruments, not prophecies: compute the baseline, decompose the
pattern, express ranges, and measure yourself honestly."

This atom does NOT produce a forecast and makes no forecast judgment.
The caller submits a forecast-artifact manifest: the declared purpose
and horizon, the computed baseline values, the decomposition/driver
evidence, the declared low/base/high range, the declared scenarios,
the past-forecast scorecard (forecast-vs-actual history plus the
declared MAE / MAPE / bias), the revision-hygiene record, and the
cadence record. The atom validates that artifact deterministically:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Four checks are computed, not declared:
- the three baseline values (naive, moving average, seasonal-naive)
  must all be present as numbers — the skill requires baselines
  "computed and shown";
- the declared range must satisfy low <= base <= high with
  low < high — a bare point (low == base == high) is the skill's
  red line, "no single numbers for uncertain futures without ranges";
- the declared scenarios must cover base / best / worst, each with a
  trigger condition ("what signal tells you you're in the worst
  case");
- the scorecard's declared MAE, MAPE (percent) and bias are
  recomputed from the declared forecast-vs-actual history and must
  agree within 0.01 (the declared values are understood to be rounded
  to two decimals). No accuracy threshold is invented here — the atom
  checks that the scorecard is honest about its own history, never
  that the forecast was good enough.

Verdict:
- any fail             -> FORECAST_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> FORECAST_READY

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "purpose_and_horizon",
    "baselines_and_decomposition",
    "ranges_and_scenarios",
    "scorecard_accuracy",
    "revision_hygiene",
    "cadence",
)

METRIC_TOLERANCE = 0.01

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "series": "string",
    "forecast": {
        "purpose_stated": "boolean",
        "horizon_stated": "boolean",
        "decision_cadence_matched": "boolean",
        "owner_named": "boolean",
    },
    "baselines": {
        "naive_value": "number",
        "moving_average_value": "number",
        "seasonal_naive_value": "number",
        "compared_to_forecast": "boolean",
        "complex_model_used": "boolean",
        "complex_model_beats_baselines": "boolean",
    },
    "decomposition": {
        "level_trend_seasonality_shown": "boolean",
        "drivers_known": "boolean",
        "driver_based_shown": "boolean",
    },
    "range": {
        "low": "number",
        "base": "number",
        "high": "number",
    },
    "scenarios": [{
        "name": "string",
        "trigger_condition": "string",
    }],
    "scenario_detail": {
        "sensitivity_shown": "boolean",
    },
    "scorecard": {
        "published": "boolean",
        "tracked_per_series": "boolean",
        "history": [{
            "period": "string",
            "forecast": "number",
            "actual": "number",
        }],
        "declared_mae": "number",
        "declared_mape_percent": "number",
        "declared_bias": "number",
    },
    "revision": {
        "forecast_actual_history_preserved": "boolean",
        "revisions_made": "boolean",
        "revision_reasons_documented": "boolean",
        "silently_restated": "boolean",
    },
    "cadence": {
        "rolling_forecast_maintained": "boolean",
        "cadence_matches_review_rhythm": "boolean",
        "forecast_updated_on_cadence": "boolean",
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
    _check(results, section, name, value, present, value is False,
           evidence)


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _is_nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _baselines_check(results, manifest):
    keys = ("naive_value", "moving_average_value", "seasonal_naive_value")
    values = []
    present_all = True
    for key in keys:
        value, present = _get(manifest, "baselines", key)
        values.append(value)
        present_all = present_all and present
    if not present_all:
        _check(results, "baselines_and_decomposition",
               "baselines_computed_and_shown",
               values, False, False,
               "baseline methods always: naive, moving average and "
               "seasonal-naive — computed and shown")
    else:
        _check(results, "baselines_and_decomposition",
               "baselines_computed_and_shown",
               values, True, all(_is_number(v) for v in values),
               "baseline methods always: naive, moving average and "
               "seasonal-naive — computed and shown")


def _range_check(results, manifest):
    low, has_low = _get(manifest, "range", "low")
    base, has_base = _get(manifest, "range", "base")
    high, has_high = _get(manifest, "range", "high")
    if not (has_low and has_base and has_high):
        _check(results, "ranges_and_scenarios",
               "range_ordered_and_nondegenerate",
               None, False, False,
               "ranges, not points: a low/base/high range is declared")
    elif not (_is_number(low) and _is_number(base) and _is_number(high)):
        _check(results, "ranges_and_scenarios",
               "range_ordered_and_nondegenerate",
               None, True, False,
               "range low, base and high must all be numbers")
    else:
        _check(results, "ranges_and_scenarios",
               "range_ordered_and_nondegenerate",
               None, True, low <= base <= high and low < high,
               "ranges, not points: low <= base <= high with "
               "low < high — a bare point is false precision")


def _scenario_checks(results, manifest):
    scenarios, has_scenarios = _get(manifest, "scenarios")
    if not has_scenarios or not isinstance(scenarios, list) \
            or not scenarios:
        _check(results, "ranges_and_scenarios",
               "scenarios_cover_base_best_worst",
               scenarios, False, False, "no scenarios declared")
        _check(results, "ranges_and_scenarios",
               "scenario_triggers_documented",
               scenarios, False, False, "no scenarios declared")
        return 0
    names = []
    triggers_ok = True
    for scenario in scenarios:
        if not isinstance(scenario, dict):
            triggers_ok = False
            continue
        name, has_name = _get(scenario, "name")
        trigger, has_trigger = _get(scenario, "trigger_condition")
        if has_name and _is_nonempty_str(name):
            names.append(name)
        if not (has_trigger and _is_nonempty_str(trigger)):
            triggers_ok = False
    _check(results, "ranges_and_scenarios",
           "scenarios_cover_base_best_worst",
           scenarios, True,
           all(n in names for n in ("base", "best", "worst")),
           "scenario & sensitivity: base/best/worst scenarios "
           "delivered")
    _check(results, "ranges_and_scenarios",
           "scenario_triggers_documented",
           scenarios, True, triggers_ok,
           "every scenario carries a trigger condition (what signal "
           "tells you you're in that case)")
    return len(scenarios)


def _scorecard_checks(results, manifest):
    """Computed scorecard checks over the forecast-vs-actual history.

    Returns the count of history entries complete enough to score.
    """
    history, has_history = _get(manifest, "scorecard", "history")
    if not has_history or not isinstance(history, list) or not history:
        for name, evidence in (
            ("history_entries_complete",
             "no forecast-vs-actual history declared"),
            ("declared_mae_matches_computed",
             "no forecast-vs-actual history declared"),
            ("declared_mape_matches_computed",
             "no forecast-vs-actual history declared"),
            ("declared_bias_matches_computed",
             "no forecast-vs-actual history declared"),
        ):
            _check(results, "scorecard_accuracy", name,
                   history, False, False, evidence)
        return 0
    incomplete = False
    evaluated = 0
    abs_errors = []
    signed_errors = []
    apes = []
    for entry in history:
        if not isinstance(entry, dict):
            incomplete = True
            continue
        period, has_period = _get(entry, "period")
        forecast, has_forecast = _get(entry, "forecast")
        actual, has_actual = _get(entry, "actual")
        if not (has_period and has_forecast and has_actual
                and _is_nonempty_str(period)
                and _is_number(forecast) and _is_number(actual)):
            incomplete = True
            continue
        evaluated += 1
        error = forecast - actual
        signed_errors.append(error)
        abs_errors.append(abs(error))
        if actual != 0:
            apes.append(abs(error) / abs(actual) * 100)
    if incomplete:
        _check(results, "scorecard_accuracy", "history_entries_complete",
               history, False, False,
               "a history entry is missing its period, forecast, or "
               "actual")
    else:
        _check(results, "scorecard_accuracy", "history_entries_complete",
               history, True, True,
               "every history entry carries a period, a forecast, "
               "and an actual")
    computed = {}
    if evaluated:
        computed["mae"] = sum(abs_errors) / len(abs_errors)
        computed["bias"] = sum(signed_errors) / len(signed_errors)
    if apes:
        computed["mape"] = sum(apes) / len(apes)
    for name, key, declared_key, label in (
        ("declared_mae_matches_computed", "mae", "declared_mae", "MAE"),
        ("declared_mape_matches_computed", "mape",
         "declared_mape_percent", "MAPE (percent)"),
        ("declared_bias_matches_computed", "bias", "declared_bias",
         "bias (mean signed error, forecast - actual)"),
    ):
        evidence = (
            f"accuracy tracking: the declared {label} agrees with "
            f"the {label} recomputed from the forecast-vs-actual "
            "history (within 0.01, the declared value rounded to "
            "two decimals)"
        )
        declared, has_declared = _get(manifest, "scorecard", declared_key)
        if incomplete:
            _check(results, "scorecard_accuracy", name,
                   declared, False, False,
                   "a history entry is incomplete, so the declared "
                   f"{label} cannot be verified against the history")
        elif key not in computed:
            _check(results, "scorecard_accuracy", name,
                   declared, False, False,
                   "no history entry with a non-zero actual, so "
                   f"the declared {label} cannot be verified")
        elif not has_declared:
            _check(results, "scorecard_accuracy", name,
                   declared, False, False,
                   f"no declared {label} on the scorecard")
        elif not _is_number(declared):
            _check(results, "scorecard_accuracy", name,
                   declared, True, False,
                   f"the declared {label} must be a number")
        else:
            _check(results, "scorecard_accuracy", name,
                   declared, True,
                   abs(declared - computed[key])
                   <= METRIC_TOLERANCE + 1e-9,
                   evidence)
    return evaluated


def evaluate(manifest):
    """Return the verdict dict for a forecast-artifact manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: purpose_and_horizon (skill method 1 + red
    #      line: no forecasts without owners) ----
    _bool_check(results, "purpose_and_horizon", "purpose_stated",
                manifest, ("forecast", "purpose_stated"),
                "purpose stated: what decision this forecast feeds")
    _bool_check(results, "purpose_and_horizon", "horizon_stated",
                manifest, ("forecast", "horizon_stated"),
                "horizon stated: operational (weeks) vs strategic "
                "(years)")
    _bool_check(results, "purpose_and_horizon",
                "forecast_matched_to_decision_cadence", manifest,
                ("forecast", "decision_cadence_matched"),
                "forecast to the decision cadence — daily forecasts "
                "for daily decisions")
    _bool_check(results, "purpose_and_horizon", "owner_named",
                manifest, ("forecast", "owner_named"),
                "red line: no forecasts without owners")

    # ---- Section 2: baselines_and_decomposition (skill methods
    #      2-3 + quality gate: baseline compared; decomposition /
    #      drivers shown) ----
    _baselines_check(results, manifest)
    _bool_check(results, "baselines_and_decomposition",
                "baseline_compared_to_forecast", manifest,
                ("baselines", "compared_to_forecast"),
                "quality gate: baseline computed and compared")
    complex_used, has_complex = _get(manifest, "baselines",
                                     "complex_model_used")
    beats, has_beats = _get(manifest, "baselines",
                            "complex_model_beats_baselines")
    if has_complex and complex_used:
        _check(results, "baselines_and_decomposition",
               "complex_model_beats_baselines",
               beats, has_beats, beats is True,
               "complexity must beat simplicity to earn its place")
    else:
        _check(results, "baselines_and_decomposition",
               "complex_model_beats_baselines",
               complex_used, has_complex, True,
               "no complex model declared — beating the baselines "
               "is not required")
    _bool_check(results, "baselines_and_decomposition",
                "decomposition_shown", manifest,
                ("decomposition", "level_trend_seasonality_shown"),
                "decompose: level / trend / seasonality shown")
    drivers_known, has_drivers_known = _get(
        manifest, "decomposition", "drivers_known")
    driver_based, has_driver_based = _get(
        manifest, "decomposition", "driver_based_shown")
    if has_drivers_known and drivers_known:
        _check(results, "baselines_and_decomposition",
               "driver_based_when_drivers_known",
               driver_based, has_driver_based, driver_based is True,
               "prefer driver-based forecasts where drivers are "
               "known (units x price, loads x rates, headcount x "
               "costs) over blind extrapolation")
    else:
        _check(results, "baselines_and_decomposition",
               "driver_based_when_drivers_known",
               drivers_known, has_drivers_known, True,
               "no known drivers declared — a driver-based "
               "forecast is not required")

    # ---- Section 3: ranges_and_scenarios (skill methods 4-5 +
    #      quality gate: ranges + scenarios delivered, not bare
    #      points; red line: no single numbers without ranges) ----
    _range_check(results, manifest)
    scenarios_evaluated = _scenario_checks(results, manifest)
    _bool_check(results, "ranges_and_scenarios", "sensitivity_shown",
                manifest, ("scenario_detail", "sensitivity_shown"),
                "scenario & sensitivity: sensitivity of the forecast "
                "to its drivers shown")

    # ---- Section 4: scorecard_accuracy (skill method 6 + quality
    #      gate: accuracy incl. bias tracked per series with a
    #      scorecard) ----
    _bool_check(results, "scorecard_accuracy", "scorecard_published",
                manifest, ("scorecard", "published"),
                "publish scorecards so trust is earned")
    _bool_check(results, "scorecard_accuracy",
                "accuracy_tracked_per_series", manifest,
                ("scorecard", "tracked_per_series"),
                "quality gate: accuracy tracked per series with a "
                "scorecard")
    history_evaluated = _scorecard_checks(results, manifest)

    # ---- Section 5: revision_hygiene (skill method 7 + red line:
    #      no hindsight edits) ----
    _bool_check(results, "revision_hygiene",
                "forecast_actual_history_preserved", manifest,
                ("revision", "forecast_actual_history_preserved"),
                "revision hygiene: keep forecast-vs-actual history")
    revisions_made, has_revisions = _get(manifest, "revision",
                                         "revisions_made")
    reasons, has_reasons = _get(manifest, "revision",
                                "revision_reasons_documented")
    if has_revisions and revisions_made:
        _check(results, "revision_hygiene",
               "revision_reasons_documented",
               reasons, has_reasons, reasons is True,
               "document why revisions happened")
    else:
        _check(results, "revision_hygiene",
               "revision_reasons_documented",
               revisions_made, has_revisions, True,
               "no revisions declared")
    _false_check(results, "revision_hygiene",
                 "no_silent_restatement", manifest,
                 ("revision", "silently_restated"),
                 "red line: no hindsight edits — never silently "
                 "restate old forecasts")

    # ---- Section 6: cadence (skill method 8) ----
    _bool_check(results, "cadence", "rolling_forecast_maintained",
                manifest, ("cadence", "rolling_forecast_maintained"),
                "monthly rolling forecasts (12-month) typical; "
                "weekly for operations; annual for strategy")
    _bool_check(results, "cadence", "cadence_matches_review_rhythm",
                manifest, ("cadence", "cadence_matches_review_rhythm"),
                "cadence matched to the review rhythm")
    _bool_check(results, "cadence", "forecast_updated_on_cadence",
                manifest, ("cadence", "forecast_updated_on_cadence"),
                "the forecast is actually updated on its declared "
                "cadence")

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
        verdict = "FORECAST_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "FORECAST_READY"

    return {
        "service": "forecast-with-ranges-and-scorecard",
        "atom_version": "0.1.0",
        "series": manifest.get("series"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "history_entries_evaluated": history_evaluated,
        "scenarios_evaluated": scenarios_evaluated,
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
        "FORECAST WITH RANGES AND SCORECARD",
        f"series: {verdict.get('series')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: forecast_with_ranges_and_scorecard.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "FORECAST_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
