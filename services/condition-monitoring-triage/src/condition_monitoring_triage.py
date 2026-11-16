#!/usr/bin/env python3
"""Condition monitoring triage — deterministic core.

Built from the bound skill `condition-monitoring` (v1): "Baseline,
trend, and triage — with context — so maintenance is planned, not
emergency."

The caller submits a condition-monitoring evidence manifest (a dict,
or JSON on the CLI): the baseline record, the monitoring discipline,
the context discipline, the trending discipline, the declared alert
bands with the readings taken against them, and the alarm triage
record.

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Two checks are computed, not declared: every reading is classified
against its declared bands (watch / warning / action limits, in that
order), and a reading at or beyond its action limit requires an
`act` triage on record. The highest band reached is reported as
`highest_band`.

Verdict:
- any fail             -> TRIAGE_UNSOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> TRIAGE_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "baseline",
    "technique_coverage",
    "context",
    "trending",
    "alert_bands_and_triage",
    "escalation",
)

DISPOSITIONS = ("noise", "watch", "act")
BAND_ORDER = {"normal": 0, "watch": 1, "warning": 2, "action": 3}


# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "asset": "string",
    "baseline": {
        "exists": "boolean",
        "captured_under_known_load": "boolean",
        "repair_since_baseline": "boolean",
        "post_repair_baseline_captured": "boolean",
    },
    "monitoring": {
        "techniques_match_asset": "boolean",
        "fixed_route_points": "boolean",
        "same_instrument_class": "boolean",
    },
    "context": {
        "load_recorded": "boolean",
        "ambient_recorded": "boolean",
        "speed_recorded": "boolean",
    },
    "trending": {
        "deltas_vs_baseline_computed": "boolean",
        "rate_of_change_considered": "boolean",
        "repair_events_annotated": "boolean",
    },
    "bands": {"defined_per_standard_or_oem": "boolean"},
    "readings": [{
        "parameter": "string",
        "value": "number",
        "watch_limit": "number",
        "warning_limit": "number",
        "action_limit": "number",
    }],
    "alarms": [{
        "id": "string",
        "disposition": "string",
        "reasoning_recorded": "boolean",
        "recheck_interval_set": "boolean",
        "work_request_raised": "boolean",
    }],
    "escalation": {
        "findings_sent_with_trend_pack": "boolean",
        "alarm_closed_without_triage_note": "boolean",
        "condemned_or_cleared_on_single_reading": "boolean",
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


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _reading_band(reading):
    """Classify one reading; None when its fields are incomplete."""
    value, has_value = _get(reading, "value")
    watch, has_watch = _get(reading, "watch_limit")
    warning, has_warning = _get(reading, "warning_limit")
    action, has_action = _get(reading, "action_limit")
    if not (has_value and has_watch and has_warning and has_action
            and _is_number(value) and _is_number(watch)
            and _is_number(warning) and _is_number(action)):
        return None
    if value >= action:
        return "action"
    if value >= warning:
        return "warning"
    if value >= watch:
        return "watch"
    return "normal"


def _readings_checks(results, manifest):
    readings, has_readings = _get(manifest, "readings")
    alarms, has_alarms = _get(manifest, "alarms")
    highest = None
    if not has_readings or not isinstance(readings, list) \
            or not readings:
        _check(results, "alert_bands_and_triage",
               "readings_classified_against_bands",
               readings, False, False, "no readings declared")
        _check(results, "alert_bands_and_triage",
               "action_band_readings_have_act_triage",
               readings, False, False, "no readings declared")
        return None
    incomplete = False
    disordered = False
    any_action = False
    for reading in readings:
        if not isinstance(reading, dict):
            incomplete = True
            continue
        band = _reading_band(reading)
        if band is None:
            incomplete = True
            continue
        watch, _ = _get(reading, "watch_limit")
        warning, _ = _get(reading, "warning_limit")
        action, _ = _get(reading, "action_limit")
        if not (watch <= warning <= action):
            disordered = True
        if band == "action":
            any_action = True
        if highest is None or BAND_ORDER[band] > BAND_ORDER[highest]:
            highest = band
    if incomplete:
        _check(results, "alert_bands_and_triage",
               "readings_classified_against_bands",
               readings, False, False,
               "a reading is missing its value or band limits")
    elif disordered:
        _check(results, "alert_bands_and_triage",
               "readings_classified_against_bands",
               readings, True, False,
               "band limits out of order (watch <= warning <= action "
               "required)")
    else:
        _check(results, "alert_bands_and_triage",
               "readings_classified_against_bands",
               readings, True, True,
               "every reading classified against its declared bands")
    if not has_alarms or not isinstance(alarms, list):
        _check(results, "alert_bands_and_triage",
               "action_band_readings_have_act_triage",
               alarms, False, False, "no alarm triage record declared")
    else:
        has_act = any(isinstance(a, dict)
                      and _get(a, "disposition")[0] == "act"
                      for a in alarms)
        _check(results, "alert_bands_and_triage",
               "action_band_readings_have_act_triage",
               alarms, True, has_act or not any_action,
               "a reading at or beyond its action limit requires an "
               "act triage (work request)")
    return highest


def _alarms_check(results, manifest):
    alarms, has_alarms = _get(manifest, "alarms")
    if not has_alarms or not isinstance(alarms, list):
        _check(results, "alert_bands_and_triage", "alarms_fully_triaged",
               alarms, False, False, "no alarm triage record declared")
        return
    incomplete = False
    violating = False
    for alarm in alarms:
        if not isinstance(alarm, dict):
            incomplete = True
            continue
        disposition, has_disp = _get(alarm, "disposition")
        reasoning, has_reasoning = _get(alarm, "reasoning_recorded")
        if not (has_disp and has_reasoning):
            incomplete = True
            continue
        if disposition not in DISPOSITIONS or reasoning is not True:
            violating = True
            continue
        if disposition == "watch":
            recheck, has_recheck = _get(alarm, "recheck_interval_set")
            if not has_recheck:
                incomplete = True
            elif recheck is not True:
                violating = True
        if disposition == "act":
            request, has_request = _get(alarm, "work_request_raised")
            if not has_request:
                incomplete = True
            elif request is not True:
                violating = True
    if incomplete:
        _check(results, "alert_bands_and_triage", "alarms_fully_triaged",
               alarms, False, False,
               "an alarm is missing its disposition, reasoning, or "
               "follow-through fields")
    else:
        _check(results, "alert_bands_and_triage", "alarms_fully_triaged",
               alarms, True, not violating,
               "every alarm triaged — noise / watch (recheck interval) "
               "/ act (work request) — with reasoning recorded")


def evaluate(manifest):
    """Return the verdict dict for a condition-monitoring manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: baseline (skill method 1 + quality gate) ----
    _bool_check(results, "baseline", "baseline_exists", manifest,
                ("baseline", "exists"),
                "quality gate: baselines exist for critical assets")
    _bool_check(results, "baseline", "baseline_captured_under_known_load",
                manifest, ("baseline", "captured_under_known_load"),
                "baseline as-installed, under known load")
    repair, has_repair = _get(manifest, "baseline", "repair_since_baseline")
    post, has_post = _get(manifest, "baseline",
                          "post_repair_baseline_captured")
    if has_repair and repair:
        _check(results, "baseline", "post_repair_baseline_captured",
               post, has_post, post is True,
               "quality gate: post-repair baselines captured (verify "
               "the fix actually fixed it)")
    else:
        _check(results, "baseline", "post_repair_baseline_captured",
               repair, has_repair, True,
               "no repair since baseline declared")

    # ---- Section 2: technique_coverage (skill methods 2-3) ----
    _bool_check(results, "technique_coverage", "techniques_match_asset",
                manifest, ("monitoring", "techniques_match_asset"),
                "techniques by asset: vibration / thermography / ESA / "
                "DGA as the asset class requires")
    _bool_check(results, "technique_coverage", "fixed_routes_and_points",
                manifest, ("monitoring", "fixed_route_points"),
                "fixed routes; same points, same method")
    _bool_check(results, "technique_coverage",
                "same_instrument_class", manifest,
                ("monitoring", "same_instrument_class"),
                "same instrument class — comparability is the whole game")

    # ---- Section 3: context (skill method 4 + quality gate) ----
    _bool_check(results, "context", "load_recorded_with_readings",
                manifest, ("context", "load_recorded"),
                "quality gate: readings carry load context")
    _bool_check(results, "context", "ambient_recorded", manifest,
                ("context", "ambient_recorded"),
                "quality gate: readings carry ambient context")
    _bool_check(results, "context", "speed_recorded", manifest,
                ("context", "speed_recorded"),
                "log speed with every reading")

    # ---- Section 4: trending (skill method 4) ----
    _bool_check(results, "trending", "deltas_vs_baseline_computed",
                manifest, ("trending", "deltas_vs_baseline_computed"),
                "deltas and rates-of-change beat absolute numbers")
    _bool_check(results, "trending", "rate_of_change_considered",
                manifest, ("trending", "rate_of_change_considered"),
                "trend + context: rates-of-change considered")
    _bool_check(results, "trending", "repair_events_annotated",
                manifest, ("trending", "repair_events_annotated"),
                "annotate charts with repair events")

    # ---- Section 5: alert_bands_and_triage (skill method 5 +
    #      quality gate) ----
    _bool_check(results, "alert_bands_and_triage",
                "bands_defined_per_standard_or_oem", manifest,
                ("bands", "defined_per_standard_or_oem"),
                "define watch/warning/action bands per site standard/OEM")
    highest_band = _readings_checks(results, manifest)
    _alarms_check(results, manifest)

    # ---- Section 6: escalation (skill method 6 + red line) ----
    _bool_check(results, "escalation",
                "suspicious_findings_escalated_with_trend_pack", manifest,
                ("escalation", "findings_sent_with_trend_pack"),
                "suspicious findings go to the responsible engineer "
                "with the full trend pack, not a single number")
    closed, has_closed = _get(manifest, "escalation",
                              "alarm_closed_without_triage_note")
    _check(results, "escalation", "no_alarm_closed_without_triage_note",
           closed, has_closed, closed is False,
           "skill red line: no alarm closes without a triage note")
    single, has_single = _get(manifest, "escalation",
                              "condemned_or_cleared_on_single_reading")
    _check(results, "escalation",
           "no_condemn_or_clear_on_single_reading",
           single, has_single, single is False,
           "skill red line: never condemn or clear equipment on one "
           "reading without context")

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
        verdict = "TRIAGE_UNSOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "TRIAGE_SOUND"

    return {
        "service": "condition-monitoring-triage",
        "atom_version": "0.1.0",
        "asset": manifest.get("asset"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "highest_band": highest_band,
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
        "CONDITION-MONITORING TRIAGE",
        f"asset: {verdict.get('asset')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<22} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: condition_monitoring_triage.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "TRIAGE_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
