#!/usr/bin/env python3
"""Electrical machinery engineering check — deterministic core.

Built from the bound skill `electrical-machinery-engineering` (v1):
"size it right, specify it clearly, test it by the book, and read
its failures honestly. This structures the engineering; the SME
makes the calls."

The caller submits a machinery engineering manifest (a dict, or
JSON on the CLI). Every check reads declared manifest fields, using
only rules the skill itself states:

- duty first: load torque profile (constant / variable / impact),
  starts per hour, ambient, altitude — declared, not assumed;
- sizing: worst-case torque and power compared against the selected
  rating, starting current compared against supply capability
  (computed checks — the declared worst case / starting current
  must not exceed the declared rating / capability), service factor
  declared, efficiency recorded at actual load (not nameplate);
- spec discipline: machine type (induction / synchronous) and
  enclosure (TEFC / ODP / WPI) in the skill's own vocabularies,
  insulation class named, bearings / space heaters / RTDs /
  vibration limits specified, standards cited — vague specs fail;
- acceptance tests: criteria from standards and OEM, defined
  before the tests; insulation resistance with PI/DAR trends,
  winding resistance balance, surge comparison, no-load / load
  runs; results recorded with units and instruments + cal status;
- failure analysis (only when an investigation is open):
  evidence organized into a timeline, operating history included,
  the skill's typical failure modes considered;
- trending: per-asset baseline, like-for-like comparison (same
  test, same conditions), deltas over absolute values;
- records and red lines: nameplate / serial verified against
  documents, never re-energize after an insulation or winding
  anomaly without engineering review, anomalies flagged, asset
  records updated, deviations logged with actions.

The skill states no numeric acceptance thresholds (no winding-
balance tolerance, no insulation-resistance floor, no efficiency
floor), so none are invented here: those items are checked as
declared-and-recorded, never re-graded against outside standards.

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Verdict:
- any fail             -> NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "duty",
    "sizing",
    "specification",
    "acceptance_tests",
    "failure_analysis",
    "trending",
    "records_and_safety",
)

TORQUE_PROFILES = ("constant", "variable", "impact")
MACHINE_TYPES = ("induction", "synchronous")
ENCLOSURES = ("TEFC", "ODP", "WPI")

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (duty.load_torque_profile,
# specification.machine_type, specification.enclosure) are
# validated as "string" only, never enum-checked here.
MANIFEST_SPEC = {
    "machine": "string",
    "duty": {
        "load_torque_profile": "string",
        "starts_per_hour": "number",
        "ambient_c": "number",
        "altitude_m": "number",
        "worst_case_identified": "boolean",
    },
    "sizing": {
        "worst_case_torque_nm": "number",
        "rated_torque_nm": "number",
        "worst_case_power_kw": "number",
        "rated_power_kw": "number",
        "service_factor": "number",
        "starting_current_a": "number",
        "supply_capability_a": "number",
        "efficiency_at_actual_load_percent": "number",
    },
    "specification": {
        "machine_type": "string",
        "insulation_class": "string",
        "enclosure": "string",
        "bearings_specified": "boolean",
        "space_heaters_specified": "boolean",
        "rtds_specified": "boolean",
        "vibration_limits_specified": "boolean",
        "standards_cited": "boolean",
    },
    "tests": {
        "criteria_defined_before_tests": "boolean",
        "criteria_from_standards_and_oem": "boolean",
        "insulation_resistance_tested": "boolean",
        "pi_dar_trends_recorded": "boolean",
        "winding_resistance_balance_checked": "boolean",
        "surge_comparison_done": "boolean",
        "no_load_and_load_runs_done": "boolean",
        "results_recorded_with_units": "boolean",
        "instruments_and_calibration_recorded": "boolean",
    },
    "failure": {
        "investigation_open": "boolean",
        "evidence_organized_into_timeline": "boolean",
        "operating_history_included": "boolean",
        "typical_failure_modes_considered": "boolean",
    },
    "trending": {
        "per_asset_baseline_exists": "boolean",
        "like_for_like_comparison": "boolean",
        "deltas_compared": "boolean",
    },
    "records": {
        "nameplate_and_serial_verified": "boolean",
        "re_energized_after_insulation_or_winding_anomaly_without_review": "boolean",
        "anomalies_flagged": "boolean",
        "asset_records_updated": "boolean",
        "deviations_logged_with_actions": "boolean",
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


def _number_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, _is_number(value),
           evidence)


def _enum_check(results, section, name, manifest, path, allowed, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value in allowed,
           evidence)


def _string_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    ok = isinstance(value, str) and len(value) > 0
    _check(results, section, name, value, present, ok, evidence)


def _within_check(results, section, name, manifest, value_path,
                  limit_path, evidence):
    """Computed check: declared value must not exceed declared limit."""
    value, has_value = _get(manifest, *value_path)
    limit, has_limit = _get(manifest, *limit_path)
    present = has_value and has_limit
    ok = _is_number(value) and _is_number(limit) and value <= limit
    _check(results, section, name, value, present, ok, evidence)


def _failure_check(results, name, manifest, field, gate, has_gate,
                   evidence):
    """Failure-analysis check: binds only while an investigation is open."""
    if has_gate and gate:
        value, present = _get(manifest, "failure", field)
        _check(results, "failure_analysis", name, value, present,
               value is True, evidence)
    else:
        _check(results, "failure_analysis", name, gate, has_gate, True,
               "no failure investigation declared open")


def evaluate(manifest):
    """Return the verdict dict for a machinery engineering manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: duty (skill method 1 — duty drives selection) ----
    _enum_check(results, "duty", "load_torque_profile_named", manifest,
                ("duty", "load_torque_profile"), TORQUE_PROFILES,
                "duty first: the load torque profile is one of "
                "constant / variable / impact")
    _number_check(results, "duty", "starts_per_hour_declared", manifest,
                  ("duty", "starts_per_hour"),
                  "starts per hour declared — duty drives selection, "
                  "not habit")
    _number_check(results, "duty", "ambient_declared", manifest,
                  ("duty", "ambient_c"),
                  "ambient temperature declared as a duty input")
    _number_check(results, "duty", "altitude_declared", manifest,
                  ("duty", "altitude_m"),
                  "altitude declared as a duty input")
    _bool_check(results, "duty", "worst_case_identified", manifest,
                ("duty", "worst_case_identified"),
                "the worst case the sizing must survive is identified")

    # ---- Section 2: sizing (skill method 2 + quality gate) ----
    _within_check(results, "sizing", "worst_case_torque_within_rating",
                  manifest, ("sizing", "worst_case_torque_nm"),
                  ("sizing", "rated_torque_nm"),
                  "quality gate: worst-case torque documented against "
                  "the selected rating — the declared worst case must "
                  "not exceed the declared rating")
    _within_check(results, "sizing", "worst_case_power_within_rating",
                  manifest, ("sizing", "worst_case_power_kw"),
                  ("sizing", "rated_power_kw"),
                  "torque and power at worst case: the declared "
                  "worst-case power must not exceed the declared "
                  "rated power")
    _number_check(results, "sizing", "service_factor_declared", manifest,
                  ("sizing", "service_factor"),
                  "frame / service-factor margin: the service factor "
                  "is declared")
    _within_check(results, "sizing",
                  "starting_current_within_supply_capability", manifest,
                  ("sizing", "starting_current_a"),
                  ("sizing", "supply_capability_a"),
                  "starting current vs supply capability: the declared "
                  "starting current must not exceed the declared "
                  "supply capability")
    _number_check(results, "sizing",
                  "efficiency_at_actual_load_recorded", manifest,
                  ("sizing", "efficiency_at_actual_load_percent"),
                  "efficiency at actual load (not nameplate) is "
                  "recorded")

    # ---- Section 3: specification (skill method 3 — reject vague
    #      specs) ----
    _enum_check(results, "specification", "machine_type_named", manifest,
                ("specification", "machine_type"), MACHINE_TYPES,
                "machine type is one of induction / synchronous")
    _string_check(results, "specification", "insulation_class_named",
                  manifest, ("specification", "insulation_class"),
                  "insulation class is named — a vague spec is rejected")
    _enum_check(results, "specification", "enclosure_named", manifest,
                ("specification", "enclosure"), ENCLOSURES,
                "enclosure is one of TEFC / ODP / WPI")
    _bool_check(results, "specification", "bearings_specified", manifest,
                ("specification", "bearings_specified"),
                "bearings are specified")
    _bool_check(results, "specification", "space_heaters_specified",
                manifest, ("specification", "space_heaters_specified"),
                "space heaters are specified")
    _bool_check(results, "specification", "rtds_specified", manifest,
                ("specification", "rtds_specified"),
                "RTDs are specified")
    _bool_check(results, "specification", "vibration_limits_specified",
                manifest,
                ("specification", "vibration_limits_specified"),
                "vibration limits are specified")
    _bool_check(results, "specification", "standards_cited", manifest,
                ("specification", "standards_cited"),
                "quality gate: the spec cites standards")

    # ---- Section 4: acceptance_tests (skill method 4 + gates) ----
    _bool_check(results, "acceptance_tests",
                "criteria_defined_before_tests", manifest,
                ("tests", "criteria_defined_before_tests"),
                "quality gate: test acceptance criteria defined "
                "before tests")
    _bool_check(results, "acceptance_tests",
                "criteria_from_standards_and_oem", manifest,
                ("tests", "criteria_from_standards_and_oem"),
                "acceptance criteria come FROM standards and OEM — "
                "the atom applies no threshold of its own")
    _bool_check(results, "acceptance_tests",
                "insulation_resistance_tested", manifest,
                ("tests", "insulation_resistance_tested"),
                "insulation resistance tested")
    _bool_check(results, "acceptance_tests", "pi_dar_trends_recorded",
                manifest, ("tests", "pi_dar_trends_recorded"),
                "insulation resistance recorded with PI / DAR trends")
    _bool_check(results, "acceptance_tests",
                "winding_resistance_balance_checked", manifest,
                ("tests", "winding_resistance_balance_checked"),
                "winding resistance balance checked (the skill "
                "states no numeric balance tolerance, so the check "
                "is declared, not re-graded)")
    _bool_check(results, "acceptance_tests", "surge_comparison_done",
                manifest, ("tests", "surge_comparison_done"),
                "surge comparison done")
    _bool_check(results, "acceptance_tests",
                "no_load_and_load_runs_done", manifest,
                ("tests", "no_load_and_load_runs_done"),
                "no-load and load runs done")
    _bool_check(results, "acceptance_tests",
                "results_recorded_with_units", manifest,
                ("tests", "results_recorded_with_units"),
                "quality gate: results recorded with units")
    _bool_check(results, "acceptance_tests",
                "instruments_and_calibration_recorded", manifest,
                ("tests", "instruments_and_calibration_recorded"),
                "results recorded with instruments + calibration "
                "status")

    # ---- Section 5: failure_analysis (skill method 5 — binds only
    #      when an investigation is open) ----
    gate, has_gate = _get(manifest, "failure", "investigation_open")
    _failure_check(results, "evidence_organized_into_timeline", manifest,
                   "evidence_organized_into_timeline", gate, has_gate,
                   "failure evidence (photos, waveforms, teardown "
                   "notes, operating history) organized into a "
                   "timeline")
    _failure_check(results, "operating_history_included", manifest,
                   "operating_history_included", gate, has_gate,
                   "operating history is part of the failure evidence")
    _failure_check(results, "typical_failure_modes_considered", manifest,
                   "typical_failure_modes_considered", gate, has_gate,
                   "typical modes considered: bearings, insulation "
                   "aging / PD, rotor bars, supply / VFD interaction")

    # ---- Section 6: trending (skill method 6) ----
    _bool_check(results, "trending", "per_asset_baseline_exists", manifest,
                ("trending", "per_asset_baseline_exists"),
                "per-asset baselines kept")
    _bool_check(results, "trending", "like_for_like_comparison", manifest,
                ("trending", "like_for_like_comparison"),
                "compare like-for-like: same test, same conditions")
    _bool_check(results, "trending", "deltas_compared", manifest,
                ("trending", "deltas_compared"),
                "deltas mean more than absolute values — deltas are "
                "compared")

    # ---- Section 7: records_and_safety (quality gates + red lines) ----
    _bool_check(results, "records_and_safety",
                "nameplate_and_serial_verified", manifest,
                ("records", "nameplate_and_serial_verified"),
                "red line: nameplate / serial verified against "
                "documents — never assumed")
    _false_check(results, "records_and_safety",
                 "no_reenergize_after_anomaly_without_review", manifest,
                 ("records",
                  "re_energized_after_insulation_or_winding_anomaly_without_review"),
                 "red line: never re-energize after insulation or "
                 "winding anomalies without engineering review")
    _bool_check(results, "records_and_safety", "anomalies_flagged",
                manifest, ("records", "anomalies_flagged"),
                "quality gate: anomalies flagged")
    _bool_check(results, "records_and_safety", "asset_records_updated",
                manifest, ("records", "asset_records_updated"),
                "quality gate: asset records updated")
    _bool_check(results, "records_and_safety",
                "deviations_logged_with_actions", manifest,
                ("records", "deviations_logged_with_actions"),
                "quality gate: deviations logged with actions")

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
        verdict = "NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "SOUND"

    return {
        "service": "electrical-machinery-engineering-check",
        "atom_version": "0.1.0",
        "machine": manifest.get("machine"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "ELECTRICAL-MACHINERY ENGINEERING CHECK",
        f"machine: {verdict.get('machine')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<20} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: electrical_machinery_engineering_check.py "
              "<manifest.json>", file=sys.stderr)
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
