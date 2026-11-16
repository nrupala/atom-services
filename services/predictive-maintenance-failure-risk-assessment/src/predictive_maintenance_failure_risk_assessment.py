#!/usr/bin/env python3
"""Predictive maintenance failure risk assessment — deterministic core.

Built from the bound skill `predictive-maintenance` (v1): match the
maintenance strategy to asset criticality and failure cost, detect
early in the P-F window, monitor condition with techniques matched to
the failure modes, predict with honest ML discipline (baseline first,
labels checked, uncertainty reported, thresholds tuned to the cost of
a missed failure vs a false alarm), frame the risk with FMEA / RPN /
RCM and MTBF / MTTR, and close the loop from sensors through models
into the CMMS — with sensor quality and calibration foundational.

The skill states no numeric thresholds, so none are invented here:
the caller submits a failure-risk evidence manifest (a dict, or JSON
on the CLI) declaring the evidence, and every check reads declared
manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Verdict:
- any fail             -> ASSESSMENT_UNSOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> ASSESSMENT_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "strategy_fit",
    "pf_window",
    "condition_monitoring",
    "prediction",
    "reliability_frame",
    "data_and_integration",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "asset": "string",
    "strategy": {
        "asset_criticality_assessed": "boolean",
        "failure_cost_assessed": "boolean",
        "matched_to_criticality_and_failure_cost": "boolean",
        "pdm_justified_for_asset": "boolean",
    },
    "pf_curve": {
        "detectable_point_identified": "boolean",
        "detection_early_in_window": "boolean",
        "planning_runway_sufficient": "boolean",
    },
    "monitoring": {
        "techniques_matched_to_failure_modes": "boolean",
        "sensor_coverage_covers_failure_modes": "boolean",
        "operating_parameters_monitored": "boolean",
    },
    "prediction": {
        "healthy_baseline_established": "boolean",
        "anomaly_detection_or_rul_in_place": "boolean",
        "fault_labels_available_or_imbalance_handled": "boolean",
        "uncertainty_reported": "boolean",
        "thresholds_tuned_to_missed_failure_vs_false_alarm_cost":
        "boolean",
    },
    "reliability": {
        "fmea_completed": "boolean",
        "prioritised_by_severity_occurrence_detectability": "boolean",
        "rcm_strategy_per_failure_mode": "boolean",
        "mtbf_mttr_tracked": "boolean",
        "fmea_and_engineering_judgement_not_replaced": "boolean",
    },
    "integration": {
        "sensor_quality_and_calibration_verified": "boolean",
        "leakage_label_scarcity_and_drift_watched": "boolean",
        "edge_vs_cloud_inference_decided": "boolean",
        "work_orders_closed_into_cmms": "boolean",
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


def evaluate(manifest):
    """Return the verdict dict for a failure-risk evidence manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: strategy_fit (the maintenance-strategy ladder) ----
    _bool_check(results, "strategy_fit", "asset_criticality_assessed",
                manifest, ("strategy", "asset_criticality_assessed"),
                "match strategy to asset criticality and failure cost — "
                "not everything deserves PdM")
    _bool_check(results, "strategy_fit", "failure_cost_assessed",
                manifest, ("strategy", "failure_cost_assessed"),
                "the cost of failure is assessed before a strategy is "
                "chosen")
    _bool_check(results, "strategy_fit",
                "strategy_matched_to_criticality_and_failure_cost",
                manifest,
                ("strategy", "matched_to_criticality_and_failure_cost"),
                "reactive is fine only for non-critical, cheap-to-replace "
                "assets; predictive is the sweet spot for critical assets")
    _bool_check(results, "strategy_fit", "pdm_justified_for_this_asset",
                manifest, ("strategy", "pdm_justified_for_asset"),
                "PdM on assets that don't justify it is refused")

    # ---- Section 2: pf_window (the P-F curve) ----
    _bool_check(results, "pf_window", "detectable_point_identified",
                manifest, ("pf_curve", "detectable_point_identified"),
                "between the point a failure becomes detectable (P) and "
                "functional failure (F) lies a window — P is identified")
    _bool_check(results, "pf_window", "detection_early_in_window",
                manifest, ("pf_curve", "detection_early_in_window"),
                "PdM detects early in that window and acts before F")
    _bool_check(results, "pf_window", "planning_runway_sufficient",
                manifest, ("pf_curve", "planning_runway_sufficient"),
                "earlier, more reliable detection = longer planning runway")

    # ---- Section 3: condition_monitoring (what to sense) ----
    _bool_check(results, "condition_monitoring",
                "techniques_matched_to_failure_modes", manifest,
                ("monitoring", "techniques_matched_to_failure_modes"),
                "techniques are matched to the failure modes — vibration "
                "analysis, thermography, MCSA / electrical signature, oil "
                "analysis / DGA, acoustic / ultrasonic, operating "
                "parameters")
    _bool_check(results, "condition_monitoring",
                "sensor_coverage_covers_failure_modes", manifest,
                ("monitoring", "sensor_coverage_covers_failure_modes"),
                "the sensing in place covers the failure modes that "
                "matter for this asset")
    _bool_check(results, "condition_monitoring",
                "operating_parameters_monitored", manifest,
                ("monitoring", "operating_parameters_monitored"),
                "operating parameters — load, pressure, temperature, "
                "electrical params via SCADA/IoT — are monitored")

    # ---- Section 4: prediction (the AI layer) ----
    _bool_check(results, "prediction", "healthy_baseline_established",
                manifest, ("prediction", "healthy_baseline_established"),
                "anomaly detection on streaming data — baseline "
                "\"healthy\" first, then flag deviations")
    _bool_check(results, "prediction",
                "anomaly_detection_or_rul_in_place", manifest,
                ("prediction", "anomaly_detection_or_rul_in_place"),
                "anomaly detection and/or remaining useful life (RUL) "
                "estimation is in place on the degradation signals")
    _bool_check(results, "prediction",
                "fault_labels_available_or_imbalance_handled", manifest,
                ("prediction",
                 "fault_labels_available_or_imbalance_handled"),
                "\"classifying\" faults with no failure labels is "
                "refused — failure labels are usually scarce, so handle "
                "class imbalance honestly")
    _bool_check(results, "prediction", "uncertainty_reported", manifest,
                ("prediction", "uncertainty_reported"),
                "baseline first; report uncertainty")
    _bool_check(results, "prediction",
                "thresholds_tuned_to_missed_failure_vs_false_alarm_cost",
                manifest,
                ("prediction",
                 "thresholds_tuned_to_missed_failure_vs_false_alarm_cost"),
                "tune precision/recall against the cost of a missed "
                "failure vs a false alarm — an alert that cries wolf "
                "gets ignored; alert thresholds set without regard to "
                "false-alarm cost are refused")

    # ---- Section 5: reliability_frame (reliability engineering) ----
    _bool_check(results, "reliability_frame", "fmea_completed", manifest,
                ("reliability", "fmea_completed"),
                "FMEA — enumerate failure modes and effects")
    _bool_check(results, "reliability_frame",
                "prioritised_by_severity_occurrence_detectability",
                manifest,
                ("reliability",
                 "prioritised_by_severity_occurrence_detectability"),
                "prioritize by severity x occurrence x detectability "
                "(RPN)")
    _bool_check(results, "reliability_frame",
                "rcm_strategy_per_failure_mode", manifest,
                ("reliability", "rcm_strategy_per_failure_mode"),
                "RCM — choose the right strategy per failure mode, "
                "driven by consequence")
    _bool_check(results, "reliability_frame", "mtbf_mttr_tracked",
                manifest, ("reliability", "mtbf_mttr_tracked"),
                "track MTBF / MTTR, availability, and downtime cost to "
                "justify PdM investment")
    _bool_check(results, "reliability_frame",
                "engineering_judgement_not_replaced_by_black_box",
                manifest,
                ("reliability",
                 "fmea_and_engineering_judgement_not_replaced"),
                "replacing FMEA and engineering judgment with a black "
                "box is refused")

    # ---- Section 6: data_and_integration (industrial integration +
    #      data discipline) ----
    _bool_check(results, "data_and_integration",
                "sensor_quality_and_calibration_verified", manifest,
                ("integration", "sensor_quality_and_calibration_verified"),
                "sensor quality and calibration are foundational — "
                "garbage sensors, garbage predictions; ignoring sensor "
                "quality/calibration is refused")
    _bool_check(results, "data_and_integration",
                "leakage_label_scarcity_and_drift_watched", manifest,
                ("integration", "leakage_label_scarcity_and_drift_watched"),
                "data discipline: watch leakage, label scarcity, and "
                "drift")
    _bool_check(results, "data_and_integration",
                "edge_vs_cloud_inference_decided", manifest,
                ("integration", "edge_vs_cloud_inference_decided"),
                "decide edge vs cloud inference")
    _bool_check(results, "data_and_integration",
                "work_orders_closed_into_cmms", manifest,
                ("integration", "work_orders_closed_into_cmms"),
                "sensors/IoT -> data platform -> models -> work orders, "
                "closed back into the CMMS/EAM")

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
        verdict = "ASSESSMENT_UNSOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "ASSESSMENT_SOUND"

    return {
        "service": "predictive-maintenance-failure-risk-assessment",
        "atom_version": "0.1.0",
        "asset": manifest.get("asset"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
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
        "PREDICTIVE MAINTENANCE FAILURE RISK ASSESSMENT",
        f"asset: {verdict.get('asset')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<20} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: predictive_maintenance_failure_risk_assessment.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "ASSESSMENT_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
