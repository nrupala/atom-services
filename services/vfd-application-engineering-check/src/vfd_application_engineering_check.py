#!/usr/bin/env python3
"""VFD application engineering check — deterministic core.

Built from the bound skill `drives-and-vfd-engineering` (v1):
"Variable frequency drives are power electronics with opinions:
they reshape the supply, stress the motor, and fail in ways that
look like something else. Engineer the whole system: supply ->
drive -> cable -> motor -> load."

The caller submits a VFD application manifest (a dict, or JSON on
the CLI): the application profile, the power-quality record, the
motor-cable-drive record, the protection & control record, the
commissioning record, the troubleshooting record (binds only while
troubleshooting is declared open) and the records / red-line record.

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Three checks are computed, not declared, and use ONLY comparisons
between values the caller declares — no outside standard or
threshold is imported:

- declared harmonic distortion must not exceed the declared site
  limit (method 2: "apply IEEE 519-style limits per site standard"
  — the limit is the caller's declared site standard, never a
  number this atom supplies)
- declared cable length must not exceed the declared OEM maximum
  lead length (method 3: "reflected wave/dv-dt vs lead length
  (respect OEM limits)"; quality gate: "Lead length & motor
  insulation system within drive limits (documented)")
- declared derated drive current must cover the declared required
  load current (method 1: "select to duty, not to marketing
  tables" — derating for the declared environment is part of
  selecting to duty; both currents are caller-declared)

The skill states no other numbers: no dv/dt limit, no harmonic
limit value, no derating factor, no switching-frequency or torque
threshold. Where the skill is qualitative, the check is the
presence/consistency of the declared evidence, never an invented
threshold. Equality passes on every computed comparison.

Computed quantities (the three margins) are reported as strings
with exactly four decimal places, produced in both implementations
by the same fixed rule: round half up to 4dp — floor(v * 10000 +
0.5) / 10000 — then format with exactly four decimals. Comparisons
use the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical.

The computed outcome is also reported as `engineering_status`:
"not_sound_on_declared_values" when any computed comparison fails,
"sound_on_declared_values" when every computed comparison is
complete and passes, otherwise null.

Verdict:
- any fail             -> NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "application_profile",
    "power_quality",
    "motor_cable_drive",
    "protection_and_control",
    "commissioning",
    "troubleshooting",
    "records_and_red_lines",
)

TORQUE_TYPES = ("variable", "constant")

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "asset": "string",
    "application": {
        "load_torque_type": "string",
        "overload_duty_declared": "boolean",
        "speed_range_declared": "boolean",
        "starts_per_hour": "number",
        "environment_declared": "boolean",
        "selected_to_duty": "boolean",
    },
    "power_quality": {
        "harmonic_impact_estimated": "boolean",
        "harmonic_distortion_percent": "number",
        "site_limit_percent": "number",
        "mitigation_declared": "boolean",
        "capacitor_bank_interaction_reviewed": "boolean",
        "harmonics_per_site_standard": "boolean",
    },
    "cable": {
        "cable_length_m": "number",
        "oem_max_lead_length_m": "number",
        "motor_insulation_within_drive_limits": "boolean",
        "dvdt_reflected_wave_reviewed": "boolean",
        "inverter_duty_motor_assessed": "boolean",
        "shaft_bearing_protection_reviewed": "boolean",
    },
    "drive": {
        "derated_current_a": "number",
        "required_load_current_a": "number",
    },
    "protection": {
        "overload_model_configured": "boolean",
        "ground_fault_configured": "boolean",
        "over_under_voltage_configured": "boolean",
        "stall_configured": "boolean",
        "bypass_philosophy_documented": "boolean",
        "estop_interlocks_verified": "boolean",
    },
    "commissioning": {
        "parameter_sheet_completed_archived": "boolean",
        "motor_id_run_done": "boolean",
        "protections_tested_logically": "boolean",
        "ramps_limits_setpoints_documented": "boolean",
        "baseline_trends_recorded": "boolean",
    },
    "troubleshooting": {
        "open": "boolean",
        "fault_log_reviewed_first": "boolean",
        "typical_fault_causes_cross_checked": "boolean",
        "mechanical_causes_cross_checked": "boolean",
        "findings_documented": "boolean",
    },
    "records": {
        "parameter_backup_archived": "boolean",
        "commissioning_sheet_archived": "boolean",
        "firmware_version": "string",
        "hipot_performed_on_drive_output": "boolean",
        "protections_bypassed_without_documented_approval": "boolean",
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


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def _le_check(results, section, name, manifest, value_path, limit_path,
              evidence):
    """Computed check: declared value must not exceed declared limit.

    Returns (exceeded, margin) — exceeded True/False/None, margin the
    raw limit-minus-value float or None when not completable.
    """
    value, has_value = _get(manifest, *value_path)
    limit, has_limit = _get(manifest, *limit_path)
    present = has_value and has_limit
    if not (present and _is_number(value) and _is_number(limit)):
        _check(results, section, name, value, present, False, evidence)
        return None, None
    margin = limit - value
    _check(results, section, name, value, True, value <= limit, evidence)
    return value > limit, margin


def _ge_check(results, section, name, manifest, value_path, req_path,
              evidence):
    """Computed check: declared value must cover declared requirement."""
    value, has_value = _get(manifest, *value_path)
    required, has_req = _get(manifest, *req_path)
    present = has_value and has_req
    if not (present and _is_number(value) and _is_number(required)):
        _check(results, section, name, value, present, False, evidence)
        return None, None
    margin = value - required
    _check(results, section, name, value, True, value >= required,
           evidence)
    return value < required, margin


def _trouble_check(results, name, manifest, field, gate, has_gate,
                   evidence):
    """Troubleshooting check: binds only while troubleshooting is open."""
    if has_gate and gate:
        value, present = _get(manifest, "troubleshooting", field)
        _check(results, "troubleshooting", name, value, present,
               value is True, evidence)
    else:
        _check(results, "troubleshooting", name, gate, has_gate, True,
               "no troubleshooting declared open")


def evaluate(manifest):
    """Return the verdict dict for a VFD application manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: application_profile (skill method 1) ----
    _enum_check(results, "application_profile", "load_torque_type_named",
                manifest, ("application", "load_torque_type"),
                TORQUE_TYPES,
                "application profile: load torque type is one of "
                "variable / constant torque")
    _bool_check(results, "application_profile", "overload_duty_declared",
                manifest, ("application", "overload_duty_declared"),
                "overload duty declared — select to duty, not to "
                "marketing tables")
    _bool_check(results, "application_profile", "speed_range_declared",
                manifest, ("application", "speed_range_declared"),
                "speed range declared as an application-profile input")
    _number_check(results, "application_profile",
                  "starts_per_hour_declared", manifest,
                  ("application", "starts_per_hour"),
                  "starts/hour declared as an application-profile input")
    _bool_check(results, "application_profile", "environment_declared",
                manifest, ("application", "environment_declared"),
                "environment declared as an application-profile input")
    _bool_check(results, "application_profile",
                "selected_to_duty_not_marketing", manifest,
                ("application", "selected_to_duty"),
                "drive selected to duty, not to marketing tables")

    # ---- Section 2: power_quality (skill method 2 + quality gate) ----
    _bool_check(results, "power_quality", "harmonic_impact_estimated",
                manifest, ("power_quality", "harmonic_impact_estimated"),
                "harmonic impact estimated")
    thd_exceeded, thd_margin = _le_check(
        results, "power_quality", "harmonics_within_declared_site_limit",
        manifest, ("power_quality", "harmonic_distortion_percent"),
        ("power_quality", "site_limit_percent"),
        "IEEE 519-style limits per site standard: the declared "
        "harmonic distortion must not exceed the declared site "
        "limit (the limit is the caller's site standard — this "
        "atom supplies no number)")
    _bool_check(results, "power_quality", "mitigation_declared",
                manifest, ("power_quality", "mitigation_declared"),
                "mitigation declared — line reactors / DC chokes / "
                "filters; multi-pulse or active front end where "
                "justified")
    _bool_check(results, "power_quality",
                "capacitor_bank_interaction_reviewed", manifest,
                ("power_quality", "capacitor_bank_interaction_reviewed"),
                "capacitor-bank interactions / detuning checked")
    _bool_check(results, "power_quality",
                "harmonics_addressed_per_site_standard", manifest,
                ("power_quality", "harmonics_per_site_standard"),
                "quality gate: harmonics addressed per site standard")

    # ---- Section 3: motor_cable_drive (skill method 3 + gate) ----
    cable_exceeded, cable_margin = _le_check(
        results, "motor_cable_drive", "cable_length_within_oem_limit",
        manifest, ("cable", "cable_length_m"),
        ("cable", "oem_max_lead_length_m"),
        "quality gate: lead length within drive limits "
        "(documented) — the declared cable length must not exceed "
        "the declared OEM maximum lead length (respect OEM limits)")
    _bool_check(results, "motor_cable_drive",
                "motor_insulation_within_drive_limits", manifest,
                ("cable", "motor_insulation_within_drive_limits"),
                "quality gate: motor insulation system within drive "
                "limits (documented)")
    _bool_check(results, "motor_cable_drive",
                "dvdt_reflected_wave_reviewed", manifest,
                ("cable", "dvdt_reflected_wave_reviewed"),
                "reflected wave / dv-dt vs lead length reviewed "
                "(the skill states no dv/dt number, so the review "
                "is declared, not re-graded)")
    _bool_check(results, "motor_cable_drive",
                "inverter_duty_motor_assessed", manifest,
                ("cable", "inverter_duty_motor_assessed"),
                "inverter-duty motors for long leads / high "
                "switching assessed")
    _bool_check(results, "motor_cable_drive",
                "shaft_voltage_bearing_protection_reviewed", manifest,
                ("cable", "shaft_bearing_protection_reviewed"),
                "shaft voltage & bearing currents reviewed — shaft "
                "grounding / bearing protection on larger frames")
    current_exceeded, current_margin = _ge_check(
        results, "motor_cable_drive",
        "derated_current_covers_required_load_current",
        manifest, ("drive", "derated_current_a"),
        ("drive", "required_load_current_a"),
        "select to duty: the declared derated drive current must "
        "cover the declared required load current (both currents "
        "are caller-declared — this atom supplies no derating "
        "factor)")

    # ---- Section 4: protection_and_control (skill method 4) ----
    _bool_check(results, "protection_and_control",
                "overload_model_configured", manifest,
                ("protection", "overload_model_configured"),
                "internal protection configured: overload model")
    _bool_check(results, "protection_and_control",
                "ground_fault_protection_configured", manifest,
                ("protection", "ground_fault_configured"),
                "internal protection configured: ground fault")
    _bool_check(results, "protection_and_control",
                "over_under_voltage_protection_configured", manifest,
                ("protection", "over_under_voltage_configured"),
                "internal protection configured: over/under voltage")
    _bool_check(results, "protection_and_control",
                "stall_protection_configured", manifest,
                ("protection", "stall_configured"),
                "internal protection configured: stall")
    _bool_check(results, "protection_and_control",
                "bypass_philosophy_documented", manifest,
                ("protection", "bypass_philosophy_documented"),
                "bypass philosophy documented")
    _bool_check(results, "protection_and_control",
                "estop_and_interlocks_verified", manifest,
                ("protection", "estop_interlocks_verified"),
                "quality gate: e-stop & interlock design per site "
                "standards — never softened for convenience; "
                "e-stops verified")

    # ---- Section 5: commissioning (skill method 5 + quality gate) ----
    _bool_check(results, "commissioning",
                "parameter_sheet_completed_and_archived", manifest,
                ("commissioning", "parameter_sheet_completed_archived"),
                "parameter sheet completed and archived (motor data, "
                "limits, ramps, setpoints)")
    _bool_check(results, "commissioning", "motor_id_run_done", manifest,
                ("commissioning", "motor_id_run_done"),
                "motor ID run done")
    _bool_check(results, "commissioning",
                "protections_tested_not_just_set", manifest,
                ("commissioning", "protections_tested_logically"),
                "quality gate: protection settings tested, not just "
                "set — each protection tested logically")
    _bool_check(results, "commissioning",
                "ramps_limits_setpoints_documented", manifest,
                ("commissioning", "ramps_limits_setpoints_documented"),
                "limits, ramps and setpoints documented on the "
                "parameter sheet")
    _bool_check(results, "commissioning", "baseline_trends_recorded",
                manifest, ("commissioning", "baseline_trends_recorded"),
                "baseline current / DC-bus / temperature trends "
                "recorded")

    # ---- Section 6: troubleshooting (skill method 6 — binds only
    #      while troubleshooting is declared open) ----
    gate, has_gate = _get(manifest, "troubleshooting", "open")
    _trouble_check(results, "fault_log_reviewed_first", manifest,
                   "fault_log_reviewed_first", gate, has_gate,
                   "troubleshooting: fault log first")
    _trouble_check(results, "typical_fault_causes_cross_checked", manifest,
                   "typical_fault_causes_cross_checked", gate, has_gate,
                   "typical faults cross-checked — OC (jam/accel), "
                   "OV (decel/regeneration), UV (supply), ground "
                   "fault (cable vs motor), overtemp")
    _trouble_check(results, "mechanical_load_causes_cross_checked",
                   manifest, "mechanical_causes_cross_checked", gate,
                   has_gate,
                   "mechanical / load causes cross-checked")
    _trouble_check(results, "findings_documented", manifest,
                   "findings_documented", gate, has_gate,
                   "troubleshooting findings documented")

    # ---- Section 7: records_and_red_lines (skill method 7 +
    #      quality gate + red lines) ----
    _bool_check(results, "records_and_red_lines",
                "parameter_backup_archived", manifest,
                ("records", "parameter_backup_archived"),
                "records: parameter backups archived per drive")
    _bool_check(results, "records_and_red_lines",
                "commissioning_sheet_archived", manifest,
                ("records", "commissioning_sheet_archived"),
                "quality gate: commissioning sheet + parameter "
                "backup archived")
    _string_check(results, "records_and_red_lines",
                  "firmware_version_noted", manifest,
                  ("records", "firmware_version"),
                  "firmware version noted in the records")
    _false_check(results, "records_and_red_lines",
                 "no_hipot_on_drive_output", manifest,
                 ("records", "hipot_performed_on_drive_output"),
                 "skill red line: never hi-pot drive output "
                 "terminals (drive killer); isolate electronics "
                 "before insulation tests")
    _false_check(results, "records_and_red_lines",
                 "no_protection_bypass_without_documented_approval",
                 manifest,
                 ("records",
                  "protections_bypassed_without_documented_approval"),
                 "skill red line: never bypass drive protections to "
                 "\"keep running\" without documented engineering "
                 "approval")

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

    exceeded_flags = [thd_exceeded, cable_exceeded, current_exceeded]
    if any(flag is True for flag in exceeded_flags):
        engineering_status = "not_sound_on_declared_values"
    elif all(flag is False for flag in exceeded_flags):
        engineering_status = "sound_on_declared_values"
    else:
        engineering_status = None

    return {
        "service": "vfd-application-engineering-check",
        "atom_version": "0.1.0",
        "asset": manifest.get("asset"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "engineering_status": engineering_status,
        "harmonic_margin_percent": _fmt4(thd_margin),
        "cable_margin_m": _fmt4(cable_margin),
        "current_margin_a": _fmt4(current_margin),
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
        "VFD APPLICATION ENGINEERING CHECK",
        f"asset: {verdict.get('asset')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<25} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: vfd_application_engineering_check.py "
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
