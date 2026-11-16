#!/usr/bin/env python3
"""Electrical test record preparation — deterministic core.

Built from the bound skill `electrical-test-records` (v1): "If the
record is messy, the test didn't happen. Standard sheets, clean data,
honest charts — built so the next engineer (or auditor) trusts them."

The caller submits a test-record evidence manifest (a dict, or JSON
on the CLI): the test sheet's declared fields, the data-hygiene
record, the readings taken (each with its declared acceptance
limits), the machine-readable format, the trending and plotting
discipline, and the retention/audit record.

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Two checks are computed, not declared: every reading is checked for
completeness against its declared acceptance limits, and the sheet's
declared verdict is compared with the verdict the readings imply
against those limits. No threshold is invented here — the limits are
the caller's declared acceptance criteria, exactly as the skill's
template requires them on the sheet.

Verdict:
- any fail             -> RECORD_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> RECORD_READY

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "template_completeness",
    "data_hygiene",
    "machine_readable_format",
    "trending",
    "plotting_discipline",
    "retention_and_audit",
)


# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "asset": "string",
    "record": {
        "asset_id_present": "boolean",
        "datetime_present": "boolean",
        "ambient_present": "boolean",
        "load_condition_present": "boolean",
        "instrument_named": "boolean",
        "calibration_status_recorded": "boolean",
        "test_method_reference_present": "boolean",
        "acceptance_criteria_present": "boolean",
        "verdict_value": "string",
        "tester_named": "boolean",
        "reviewer_named": "boolean",
        "has_na_fields": "boolean",
        "na_reasons_recorded": "boolean",
        "is_critical_test": "boolean",
        "reviewer_signoff_present": "boolean",
    },
    "hygiene": {
        "asset_ids_consistent": "boolean",
        "si_units_used": "boolean",
        "conversions_noted": "boolean",
        "iso_timestamps": "boolean",
        "single_source_of_truth": "boolean",
        "raw_data_overwritten": "boolean",
        "photos_attached_and_named": "boolean",
    },
    "format": {
        "single_header_row": "boolean",
        "tidy_long_format": "boolean",
        "required_columns_present": "boolean",
    },
    "readings": [{
        "point": "string",
        "value": "number",
        "unit": "string",
        "acceptance_min": "number",
        "acceptance_max": "number",
    }],
    "trending": {
        "same_point_method_instrument_class": "boolean",
        "plotted_vs_time": "boolean",
        "load_varies": "boolean",
        "plotted_vs_load": "boolean",
        "repair_events_annotated": "boolean",
        "control_bands_from_limits_or_baseline": "boolean",
        "trends_updated_on_cadence": "boolean",
        "anomalies_present": "boolean",
        "anomalies_flagged_with_action": "boolean",
    },
    "plotting": {
        "axes_labeled_with_units": "boolean",
        "version_and_date_on_charts": "boolean",
        "dual_axis_used": "boolean",
        "out_of_band_points_present": "boolean",
        "out_of_band_highlighted": "boolean",
        "summary_sheet_per_asset": "boolean",
    },
    "retention": {
        "archived_and_findable": "boolean",
        "retention_per_policy": "boolean",
        "superseded_revisions_exist": "boolean",
        "superseded_retained_marked": "boolean",
        "corrections_made": "boolean",
        "correction_revision_notes_present": "boolean",
        "raw_data_destroyed": "boolean",
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


def _readings_checks(results, manifest):
    """Computed checks over the declared readings.

    Returns (readings_evaluated, readings_out_of_criteria): counts of
    readings complete enough to classify, and of those outside their
    declared acceptance limits.
    """
    readings, has_readings = _get(manifest, "readings")
    verdict_value, has_verdict = _get(manifest, "record", "verdict_value")
    if not has_readings or not isinstance(readings, list) \
            or not readings:
        _check(results, "machine_readable_format",
               "readings_complete_against_criteria",
               readings, False, False, "no readings declared")
        _check(results, "machine_readable_format",
               "declared_verdict_matches_readings",
               readings, False, False, "no readings declared")
        return 0, 0
    incomplete = False
    disordered = False
    evaluated = 0
    out_of_criteria = 0
    for reading in readings:
        if not isinstance(reading, dict):
            incomplete = True
            continue
        point, has_point = _get(reading, "point")
        value, has_value = _get(reading, "value")
        unit, has_unit = _get(reading, "unit")
        low, has_low = _get(reading, "acceptance_min")
        high, has_high = _get(reading, "acceptance_max")
        if not (has_point and has_value and has_unit and has_low
                and has_high and _is_nonempty_str(point)
                and _is_number(value) and _is_nonempty_str(unit)
                and _is_number(low) and _is_number(high)):
            incomplete = True
            continue
        evaluated += 1
        if not (low <= high):
            disordered = True
            continue
        if value < low or value > high:
            out_of_criteria += 1
    if incomplete:
        _check(results, "machine_readable_format",
               "readings_complete_against_criteria",
               readings, False, False,
               "a reading is missing its point, value, unit, or "
               "acceptance limits")
    elif disordered:
        _check(results, "machine_readable_format",
               "readings_complete_against_criteria",
               readings, True, False,
               "acceptance limits out of order (acceptance_min <= "
               "acceptance_max required)")
    else:
        _check(results, "machine_readable_format",
               "readings_complete_against_criteria",
               readings, True, True,
               "every reading carries a point, a value with units, "
               "and its acceptance criteria")
    if incomplete:
        _check(results, "machine_readable_format",
               "declared_verdict_matches_readings",
               verdict_value, False, False,
               "a reading is incomplete, so the declared verdict "
               "cannot be verified against the readings")
    elif disordered:
        _check(results, "machine_readable_format",
               "declared_verdict_matches_readings",
               verdict_value, has_verdict, False,
               "acceptance limits out of order, so the declared "
               "verdict cannot be verified against the readings")
    elif not has_verdict:
        _check(results, "machine_readable_format",
               "declared_verdict_matches_readings",
               verdict_value, False, False,
               "no verdict value declared on the sheet")
    else:
        expected = "fail" if out_of_criteria > 0 else "pass"
        _check(results, "machine_readable_format",
               "declared_verdict_matches_readings",
               verdict_value, True, verdict_value == expected,
               "the declared verdict matches the readings against "
               "their acceptance criteria (any reading outside its "
               "limits means the test verdict is fail)")
    return evaluated, out_of_criteria


def evaluate(manifest):
    """Return the verdict dict for a test-record evidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: template_completeness (skill method 1 +
    #      quality gate: template fields complete) ----
    _bool_check(results, "template_completeness", "asset_id_recorded",
                manifest, ("record", "asset_id_present"),
                "test sheet field: asset ID")
    _bool_check(results, "template_completeness", "datetime_recorded",
                manifest, ("record", "datetime_present"),
                "test sheet field: date/time")
    _bool_check(results, "template_completeness", "ambient_recorded",
                manifest, ("record", "ambient_present"),
                "test sheet field: ambient")
    _bool_check(results, "template_completeness",
                "load_condition_recorded", manifest,
                ("record", "load_condition_present"),
                "test sheet field: load/condition")
    instrument, has_instrument = _get(manifest, "record",
                                      "instrument_named")
    calibration, has_calibration = _get(
        manifest, "record", "calibration_status_recorded")
    _check(results, "template_completeness",
           "instrument_and_calibration_recorded",
           instrument,
           has_instrument and has_calibration,
           instrument is True and calibration is True,
           "test sheet field: instrument + calibration status")
    _bool_check(results, "template_completeness",
                "test_method_reference_recorded", manifest,
                ("record", "test_method_reference_present"),
                "test sheet field: test method reference")
    _bool_check(results, "template_completeness",
                "acceptance_criteria_recorded", manifest,
                ("record", "acceptance_criteria_present"),
                "test sheet field: acceptance criteria")
    verdict_value, has_verdict_value = _get(manifest, "record",
                                            "verdict_value")
    _check(results, "template_completeness", "verdict_recorded",
           verdict_value, has_verdict_value,
           verdict_value in ("pass", "fail"),
           "test sheet field: verdict (pass/fail) against the "
           "acceptance criteria")
    _bool_check(results, "template_completeness", "tester_named",
                manifest, ("record", "tester_named"),
                "test sheet field: tester")
    _bool_check(results, "template_completeness", "reviewer_named",
                manifest, ("record", "reviewer_named"),
                "test sheet field: reviewer")
    has_na, has_has_na = _get(manifest, "record", "has_na_fields")
    na_reasons, has_na_reasons = _get(manifest, "record",
                                      "na_reasons_recorded")
    if has_has_na and has_na:
        _check(results, "template_completeness",
               "na_fields_have_reasons",
               na_reasons, has_na_reasons, na_reasons is True,
               "'N/A' needs a reason; blank fields are defects")
    else:
        _check(results, "template_completeness",
               "na_fields_have_reasons",
               has_na, has_has_na, True,
               "no 'N/A' fields declared")
    critical, has_critical = _get(manifest, "record", "is_critical_test")
    signoff, has_signoff = _get(manifest, "record",
                                "reviewer_signoff_present")
    if has_critical and critical:
        _check(results, "template_completeness",
               "reviewer_signoff_on_critical_tests",
               signoff, has_signoff, signoff is True,
               "quality gate: reviewer sign-off on critical tests")
    else:
        _check(results, "template_completeness",
               "reviewer_signoff_on_critical_tests",
               critical, has_critical, True,
               "not a critical test — reviewer sign-off not required")

    # ---- Section 2: data_hygiene (skill method 2) ----
    _bool_check(results, "data_hygiene", "asset_ids_consistent",
                manifest, ("hygiene", "asset_ids_consistent"),
                "consistent asset IDs")
    _bool_check(results, "data_hygiene", "si_units_used", manifest,
                ("hygiene", "si_units_used"),
                "SI units — no unit soup")
    _bool_check(results, "data_hygiene", "conversions_noted", manifest,
                ("hygiene", "conversions_noted"),
                "SI units with conversions noted")
    _bool_check(results, "data_hygiene", "iso_timestamps_used", manifest,
                ("hygiene", "iso_timestamps"),
                "ISO timestamps")
    _bool_check(results, "data_hygiene", "single_source_of_truth",
                manifest, ("hygiene", "single_source_of_truth"),
                "one source of truth (file/DB)")
    _false_check(results, "data_hygiene", "raw_data_never_overwritten",
                 manifest, ("hygiene", "raw_data_overwritten"),
                 "raw data stays RAW (never overwrite — add derived "
                 "columns)")
    _bool_check(results, "data_hygiene", "photos_attached_and_named",
                manifest, ("hygiene", "photos_attached_and_named"),
                "photos attached and named")

    # ---- Section 3: machine_readable_format (skill method 3 +
    #      computed readings checks) ----
    _bool_check(results, "machine_readable_format", "single_header_row",
                manifest, ("format", "single_header_row"),
                "machine-readable first: one header row")
    _bool_check(results, "machine_readable_format", "tidy_long_format",
                manifest, ("format", "tidy_long_format"),
                "tidy/long format (asset, date, point, value, unit, "
                "load)")
    _bool_check(results, "machine_readable_format",
                "required_columns_present", manifest,
                ("format", "required_columns_present"),
                "tidy columns present: asset, date, point, value, "
                "unit, load")
    readings_evaluated, readings_out = _readings_checks(results, manifest)

    # ---- Section 4: trending (skill method 4 + quality gate) ----
    _bool_check(results, "trending",
                "same_point_method_and_instrument_class", manifest,
                ("trending", "same_point_method_instrument_class"),
                "trending: same point + method + instrument class "
                "across time")
    _bool_check(results, "trending", "plotted_vs_time", manifest,
                ("trending", "plotted_vs_time"),
                "plot vs time")
    load_varies, has_load_varies = _get(manifest, "trending",
                                        "load_varies")
    vs_load, has_vs_load = _get(manifest, "trending", "plotted_vs_load")
    if has_load_varies and load_varies:
        _check(results, "trending", "plotted_vs_load_when_load_varies",
               vs_load, has_vs_load, vs_load is True,
               "plot vs time AND vs load where load varies")
    else:
        _check(results, "trending", "plotted_vs_load_when_load_varies",
               load_varies, has_load_varies, True,
               "load does not vary — a vs-load plot is not required")
    _bool_check(results, "trending", "repair_events_annotated", manifest,
                ("trending", "repair_events_annotated"),
                "annotate repairs/changes on charts")
    _bool_check(results, "trending",
                "control_bands_from_limits_or_baseline", manifest,
                ("trending", "control_bands_from_limits_or_baseline"),
                "control bands from limits or baseline")
    _bool_check(results, "trending", "trends_updated_on_cadence",
                manifest, ("trending", "trends_updated_on_cadence"),
                "quality gate: trends updated on cadence")
    anomalies, has_anomalies = _get(manifest, "trending",
                                    "anomalies_present")
    flagged, has_flagged = _get(manifest, "trending",
                                "anomalies_flagged_with_action")
    if has_anomalies and anomalies:
        _check(results, "trending", "anomalies_flagged_with_action",
               flagged, has_flagged, flagged is True,
               "quality gate: anomalies flagged with an action")
    else:
        _check(results, "trending", "anomalies_flagged_with_action",
               anomalies, has_anomalies, True,
               "no anomalies declared")

    # ---- Section 5: plotting_discipline (skill method 5 +
    #      quality gate: charts labeled, versioned, honest) ----
    _bool_check(results, "plotting_discipline",
                "axes_labeled_with_units", manifest,
                ("plotting", "axes_labeled_with_units"),
                "labeled axes with units")
    _bool_check(results, "plotting_discipline",
                "version_and_date_on_every_chart", manifest,
                ("plotting", "version_and_date_on_charts"),
                "version + date on every chart")
    _false_check(results, "plotting_discipline", "no_dual_axis_tricks",
                 manifest, ("plotting", "dual_axis_used"),
                 "no dual-axis tricks to tell a story")
    out_present, has_out_present = _get(manifest, "plotting",
                                        "out_of_band_points_present")
    highlighted, has_highlighted = _get(manifest, "plotting",
                                        "out_of_band_highlighted")
    if has_out_present and out_present:
        _check(results, "plotting_discipline",
               "out_of_band_points_highlighted",
               highlighted, has_highlighted, highlighted is True,
               "out-of-band points highlighted")
    else:
        _check(results, "plotting_discipline",
               "out_of_band_points_highlighted",
               out_present, has_out_present, True,
               "no out-of-band points declared")
    _bool_check(results, "plotting_discipline",
                "summary_sheet_per_asset", manifest,
                ("plotting", "summary_sheet_per_asset"),
                "summary sheet per asset (latest values + verdict)")

    # ---- Section 6: retention_and_audit (skill method 6 +
    #      red lines) ----
    _bool_check(results, "retention_and_audit",
                "archived_and_findable", manifest,
                ("retention", "archived_and_findable"),
                "archived, findable in 60 seconds")
    _bool_check(results, "retention_and_audit", "retention_per_policy",
                manifest, ("retention", "retention_per_policy"),
                "retention per policy")
    superseded, has_superseded = _get(manifest, "retention",
                                      "superseded_revisions_exist")
    retained, has_retained = _get(manifest, "retention",
                                  "superseded_retained_marked")
    if has_superseded and superseded:
        _check(results, "retention_and_audit",
               "superseded_revisions_retained_marked",
               retained, has_retained, retained is True,
               "quality gate: records intact after supersession — "
               "superseded revisions retained (marked)")
    else:
        _check(results, "retention_and_audit",
               "superseded_revisions_retained_marked",
               superseded, has_superseded, True,
               "no superseded revisions declared")
    corrections, has_corrections = _get(manifest, "retention",
                                        "corrections_made")
    notes, has_notes = _get(manifest, "retention",
                            "correction_revision_notes_present")
    if has_corrections and corrections:
        _check(results, "retention_and_audit",
               "corrections_have_dated_revision_notes",
               notes, has_notes, notes is True,
               "red line: no retrospective edits without a revision "
               "note — corrections via dated revision notes, never "
               "silent edits")
    else:
        _check(results, "retention_and_audit",
               "corrections_have_dated_revision_notes",
               corrections, has_corrections, True,
               "no corrections declared")
    _false_check(results, "retention_and_audit",
                 "raw_data_never_destroyed", manifest,
                 ("retention", "raw_data_destroyed"),
                 "red line: never destroy raw data")

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
        verdict = "RECORD_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "RECORD_READY"

    return {
        "service": "electrical-test-record-preparation",
        "atom_version": "0.1.0",
        "asset": manifest.get("asset"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "readings_evaluated": readings_evaluated,
        "readings_out_of_criteria": readings_out,
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
        "ELECTRICAL TEST RECORD PREPARATION",
        f"asset: {verdict.get('asset')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<24} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: electrical_test_record_preparation.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "RECORD_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
