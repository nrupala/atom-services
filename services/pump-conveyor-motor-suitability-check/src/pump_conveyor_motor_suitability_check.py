#!/usr/bin/env python3
"""Pump conveyor motor suitability check — deterministic core.

Built from the bound skill `pump-conveyor-systems` (v1): "The load
defines the duty: read the pump curve or conveyor profile before
sizing the motor or setting the drive. Electrical problems are
often load problems in disguise."

The caller submits a driven-equipment suitability manifest (a dict,
or JSON on the CLI): the declared equipment kind (pump / conveyor /
mixed), the curve-or-profile and operating-point record, the drive
list with declared required duty against declared motor ratings,
the pump record (NPSH, minimum flow, protection, wear trend, drive
transients), the conveyor record (starting study, holdback,
backstops/brakes, sequence/interlocks, belt slip/jam), the
commissioning-baseline record, and the mechanical-interface /
protection record.

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Five checks are computed, not declared, and use ONLY comparisons
the skill itself states, over values the caller declares — no
outside standard or threshold is imported:

- motor rated power >= required power for every drive (method 1/3:
  the load defines the duty; sizing is against the curve/profile)
- motor rated torque >= required running torque for every drive
- for pump drives: NPSH available >= NPSH required (method 1:
  "NPSH margin noted") and operating flow >= declared minimum
  flow (method 1: "minimum-flow protection respected")
- for conveyor drives: motor starting torque >= required starting
  torque (method 3: "starting torque >> running torque"; quality
  gate: "starting study considered (conveyors)")

Pump checks bind only when a pump is declared (equipment_kind
pump / mixed) and conveyor checks only when a conveyor is declared
(conveyor / mixed); the other kind's checks pass as not applicable.

Computed quantities (the minimum — worst — power, running-torque,
NPSH and starting-torque margins across the applicable drives) are
reported as strings with exactly four decimal places, produced in
both implementations by the same fixed rule: round half up to 4dp
— floor(v * 10000 + 0.5) / 10000 — then format with exactly four
decimals. Comparisons use the unrounded values. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The computed outcome is also reported as `suitability_status`:
"not_suitable_on_declared_values" when any computed comparison
fails, "suitable_on_declared_values" when every applicable
computed comparison is complete and passes, otherwise null.

Verdict:
- any fail             -> NOT_SUITABLE
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> SUITABLE

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "load_and_operating_point",
    "motor_sizing",
    "pump_checks",
    "conveyor_checks",
    "baselines",
    "interface_and_protection",
)

KINDS = ("pump", "conveyor", "mixed")

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below. The
# drives[] entry spec is the union of the documented entry fields:
# the universal rating fields plus the pump-only and conveyor-only
# fields, each validated only when present.
MANIFEST_SPEC = {
    "asset": "string",
    "equipment_kind": "string",
    "duty": {
        "curve_or_profile_read": "boolean",
        "operating_point_documented": "boolean",
        "operating_point_within_limits": "boolean",
        "operating_modes_defined": "boolean",
    },
    "drives": [{
        "id": "string",
        "kind": "string",
        "required_power_kw": "number",
        "motor_rated_power_kw": "number",
        "required_running_torque_nm": "number",
        "motor_rated_torque_nm": "number",
        "npsh_available_m": "number",
        "npsh_required_m": "number",
        "operating_flow_m3h": "number",
        "minimum_flow_m3h": "number",
        "required_starting_torque_nm": "number",
        "motor_starting_torque_nm": "number",
    }],
    "sizing": {
        "verified_against_curve_or_profile": "boolean",
        "suitable_because_it_runs_only": "boolean",
    },
    "pump": {
        "minimum_flow_protection_set": "boolean",
        "impeller_wear_trend_checked": "boolean",
        "vfd_soft_start_reviewed": "boolean",
    },
    "conveyor": {
        "starting_study_considered": "boolean",
        "loaded_starts_holdback_considered": "boolean",
        "backstops_brake_interlocks_verified": "boolean",
        "sequence_interlock_review_done": "boolean",
        "belt_slip_jam_reviewed": "boolean",
    },
    "baselines": {
        "recorded_per_operating_mode": "boolean",
        "flow_head_current_pressure_recorded": "boolean",
        "compared_at_same_conditions": "boolean",
    },
    "interface": {
        "mechanical_data_in_asset_record": "boolean",
        "data_shared_single_source": "boolean",
        "changes_made": "boolean",
        "changes_revalidated": "boolean",
    },
    "protection": {
        "protection_changed_without_engineering_review": "boolean",
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


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def _kind(manifest):
    kind, has_kind = _get(manifest, "equipment_kind")
    if has_kind and kind in KINDS:
        return kind
    return None


def _gated_bool_check(results, section, name, manifest, path, applies_to,
                      evidence, na_evidence):
    """Bool check that binds only for the declared equipment kinds."""
    kind = _kind(manifest)
    if kind is None:
        _check(results, section, name, None, False, False,
               "equipment_kind not declared as pump / conveyor / mixed")
    elif kind in applies_to:
        _bool_check(results, section, name, manifest, path, evidence)
    else:
        _check(results, section, name, kind, True, True, na_evidence)


def _drives_checks(results, manifest):
    """Computed universal drive checks over drives[].

    Returns (exceeded, min_power_margin, min_torque_margin) where
    exceeded is True/False/None and the margins are raw floats or
    None when a comparison cannot be completed.
    """
    drives, has_drives = _get(manifest, "drives")
    if not has_drives or not isinstance(drives, list) or not drives:
        _check(results, "motor_sizing", "motor_power_covers_required_power",
               drives, False, False, "no drives declared")
        _check(results, "motor_sizing", "motor_torque_covers_running_torque",
               drives, False, False, "no drives declared")
        return None, None, None
    power_incomplete = False
    power_violating = False
    power_margin = None
    torque_incomplete = False
    torque_violating = False
    torque_margin = None
    for entry in drives:
        if not isinstance(entry, dict):
            power_incomplete = True
            torque_incomplete = True
            continue
        required, has_req = _get(entry, "required_power_kw")
        rated, has_rated = _get(entry, "motor_rated_power_kw")
        if not (has_req and has_rated and _is_number(required)
                and _is_number(rated)):
            power_incomplete = True
        else:
            margin = rated - required
            if power_margin is None or margin < power_margin:
                power_margin = margin
            if rated < required:
                power_violating = True
        req_torque, has_req_t = _get(entry, "required_running_torque_nm")
        rated_torque, has_rated_t = _get(entry, "motor_rated_torque_nm")
        if not (has_req_t and has_rated_t and _is_number(req_torque)
                and _is_number(rated_torque)):
            torque_incomplete = True
        else:
            margin = rated_torque - req_torque
            if torque_margin is None or margin < torque_margin:
                torque_margin = margin
            if rated_torque < req_torque:
                torque_violating = True
    if power_incomplete:
        _check(results, "motor_sizing", "motor_power_covers_required_power",
               drives, False, False,
               "a drive entry is missing its required power or motor "
               "rated power")
    else:
        _check(results, "motor_sizing", "motor_power_covers_required_power",
               drives, True, not power_violating,
               "motor rated power covers the declared required power "
               "for every drive — the load defines the duty")
    if torque_incomplete:
        _check(results, "motor_sizing",
               "motor_torque_covers_running_torque",
               drives, False, False,
               "a drive entry is missing its required running torque "
               "or motor rated torque")
    else:
        _check(results, "motor_sizing",
               "motor_torque_covers_running_torque",
               drives, True, not torque_violating,
               "motor rated torque covers the declared required "
               "running torque for every drive")
    if power_incomplete or torque_incomplete:
        exceeded = True if (power_violating or torque_violating) else None
        return exceeded, None, None
    return (power_violating or torque_violating), power_margin, torque_margin


def _pump_checks(results, manifest):
    """Computed pump checks; returns (exceeded, min_npsh_margin)."""
    kind = _kind(manifest)
    if kind is None:
        _check(results, "pump_checks", "npsh_available_covers_required",
               None, False, False,
               "equipment_kind not declared as pump / conveyor / mixed")
        _check(results, "pump_checks", "operating_flow_covers_minimum_flow",
               None, False, False,
               "equipment_kind not declared as pump / conveyor / mixed")
        return None, None
    if kind not in ("pump", "mixed"):
        _check(results, "pump_checks", "npsh_available_covers_required",
               kind, True, True, "no pump drives declared")
        _check(results, "pump_checks", "operating_flow_covers_minimum_flow",
               kind, True, True, "no pump drives declared")
        return False, None
    drives, _ = _get(manifest, "drives")
    pumps = []
    if isinstance(drives, list):
        pumps = [e for e in drives
                 if isinstance(e, dict) and e.get("kind") == "pump"]
    if not pumps:
        _check(results, "pump_checks", "npsh_available_covers_required",
               drives, False, False, "no pump drives declared")
        _check(results, "pump_checks", "operating_flow_covers_minimum_flow",
               drives, False, False, "no pump drives declared")
        return None, None
    npsh_incomplete = False
    npsh_violating = False
    npsh_margin = None
    flow_incomplete = False
    flow_violating = False
    for entry in pumps:
        available, has_avail = _get(entry, "npsh_available_m")
        required, has_req = _get(entry, "npsh_required_m")
        if not (has_avail and has_req and _is_number(available)
                and _is_number(required)):
            npsh_incomplete = True
        else:
            margin = available - required
            if npsh_margin is None or margin < npsh_margin:
                npsh_margin = margin
            if available < required:
                npsh_violating = True
        flow, has_flow = _get(entry, "operating_flow_m3h")
        minimum, has_min = _get(entry, "minimum_flow_m3h")
        if not (has_flow and has_min and _is_number(flow)
                and _is_number(minimum)):
            flow_incomplete = True
        elif flow < minimum:
            flow_violating = True
    if npsh_incomplete:
        _check(results, "pump_checks", "npsh_available_covers_required",
               drives, False, False,
               "a pump drive entry is missing its NPSH available or "
               "NPSH required")
    else:
        _check(results, "pump_checks", "npsh_available_covers_required",
               drives, True, not npsh_violating,
               "NPSH margin noted — NPSH available covers NPSH "
               "required for every pump drive (cavitation destroys "
               "more than pumps)")
    if flow_incomplete:
        _check(results, "pump_checks", "operating_flow_covers_minimum_flow",
               drives, False, False,
               "a pump drive entry is missing its operating flow or "
               "declared minimum flow")
    else:
        _check(results, "pump_checks", "operating_flow_covers_minimum_flow",
               drives, True, not flow_violating,
               "minimum-flow protection respected — operating flow "
               "is at or above the declared minimum flow for every "
               "pump drive")
    if npsh_incomplete or flow_incomplete:
        exceeded = True if (npsh_violating or flow_violating) else None
        return exceeded, None
    return (npsh_violating or flow_violating), npsh_margin


def _conveyor_checks(results, manifest):
    """Computed conveyor starting-torque check.

    Returns (exceeded, min_starting_torque_margin).
    """
    kind = _kind(manifest)
    if kind is None:
        _check(results, "conveyor_checks",
               "motor_starting_torque_covers_required",
               None, False, False,
               "equipment_kind not declared as pump / conveyor / mixed")
        return None, None
    if kind not in ("conveyor", "mixed"):
        _check(results, "conveyor_checks",
               "motor_starting_torque_covers_required",
               kind, True, True, "no conveyor drives declared")
        return False, None
    drives, _ = _get(manifest, "drives")
    conveyors = []
    if isinstance(drives, list):
        conveyors = [e for e in drives
                     if isinstance(e, dict) and e.get("kind") == "conveyor"]
    if not conveyors:
        _check(results, "conveyor_checks",
               "motor_starting_torque_covers_required",
               drives, False, False, "no conveyor drives declared")
        return None, None
    incomplete = False
    violating = False
    margin_min = None
    for entry in conveyors:
        required, has_req = _get(entry, "required_starting_torque_nm")
        starting, has_start = _get(entry, "motor_starting_torque_nm")
        if not (has_req and has_start and _is_number(required)
                and _is_number(starting)):
            incomplete = True
        else:
            margin = starting - required
            if margin_min is None or margin < margin_min:
                margin_min = margin
            if starting < required:
                violating = True
    if incomplete:
        _check(results, "conveyor_checks",
               "motor_starting_torque_covers_required",
               drives, False, False,
               "a conveyor drive entry is missing its required "
               "starting torque or motor starting torque")
        return (True if violating else None), None
    _check(results, "conveyor_checks",
           "motor_starting_torque_covers_required",
           drives, True, not violating,
           "starting torque >> running torque — motor starting "
           "torque covers the declared required starting torque "
           "for every conveyor drive")
    return violating, margin_min


def evaluate(manifest):
    """Return the verdict dict for a driven-equipment manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: load_and_operating_point (skill method 1/3 +
    #      quality gate) ----
    _bool_check(results, "load_and_operating_point",
                "curve_or_profile_read_before_sizing", manifest,
                ("duty", "curve_or_profile_read"),
                "the load defines the duty: pump curve or conveyor "
                "profile read before sizing the motor or setting "
                "the drive")
    _bool_check(results, "load_and_operating_point",
                "operating_point_documented", manifest,
                ("duty", "operating_point_documented"),
                "quality gate: operating point documented — pump "
                "curve vs system curve, or the conveyor profile")
    _bool_check(results, "load_and_operating_point",
                "operating_point_within_equipment_limits", manifest,
                ("duty", "operating_point_within_limits"),
                "quality gate: operating point within equipment limits")
    _bool_check(results, "load_and_operating_point",
                "operating_modes_defined", manifest,
                ("duty", "operating_modes_defined"),
                "operating modes defined — baselines are recorded "
                "per operating mode")

    # ---- Section 2: motor_sizing (skill methods 1/3 + red line) ----
    drives_exceeded, power_margin, torque_margin = _drives_checks(
        results, manifest)
    _bool_check(results, "motor_sizing",
                "sizing_verified_against_curve_or_profile", manifest,
                ("sizing", "verified_against_curve_or_profile"),
                "skill red line: verify against the curve/profile — "
                "sizing is verified, not assumed")
    _false_check(results, "motor_sizing",
                 "no_it_runs_so_sizing_is_fine", manifest,
                 ("sizing", "suitable_because_it_runs_only"),
                 "skill red line: no \"it runs, so sizing is fine\"")

    # ---- Section 3: pump_checks (skill methods 1-2 + quality gate)
    pump_exceeded, npsh_margin = _pump_checks(results, manifest)
    _gated_bool_check(results, "pump_checks",
                      "minimum_flow_protection_set", manifest,
                      ("pump", "minimum_flow_protection_set"),
                      ("pump", "mixed"),
                      "quality gate: min-flow protection set (pumps)",
                      "no pump drives declared")
    _gated_bool_check(results, "pump_checks",
                      "impeller_wear_or_fouling_trend_checked", manifest,
                      ("pump", "impeller_wear_trend_checked"),
                      ("pump", "mixed"),
                      "impeller wear/fouling shows as head/flow loss "
                      "at the same speed — trend it",
                      "no pump drives declared")
    _gated_bool_check(results, "pump_checks",
                      "vfd_and_soft_start_transients_reviewed", manifest,
                      ("pump", "vfd_soft_start_reviewed"),
                      ("pump", "mixed"),
                      "VFD control (pressure/flow) reviewed for "
                      "resonance and minimum speed; soft starts "
                      "avoid water-hammer transients",
                      "no pump drives declared")

    # ---- Section 4: conveyor_checks (skill methods 3-4 + gate) ----
    conveyor_exceeded, starting_margin = _conveyor_checks(
        results, manifest)
    _gated_bool_check(results, "conveyor_checks",
                      "starting_study_considered", manifest,
                      ("conveyor", "starting_study_considered"),
                      ("conveyor", "mixed"),
                      "quality gate: starting study considered "
                      "(conveyors)",
                      "no conveyor drives declared")
    _gated_bool_check(results, "conveyor_checks",
                      "loaded_starts_and_holdback_considered", manifest,
                      ("conveyor", "loaded_starts_holdback_considered"),
                      ("conveyor", "mixed"),
                      "conveyor dynamics: loaded starts, "
                      "incline/holdback, belt stretch considered",
                      "no conveyor drives declared")
    _gated_bool_check(results, "conveyor_checks",
                      "backstops_and_brake_interlocks_verified", manifest,
                      ("conveyor", "backstops_brake_interlocks_verified"),
                      ("conveyor", "mixed"),
                      "backstops and brake interlocks verified",
                      "no conveyor drives declared")
    _gated_bool_check(results, "conveyor_checks",
                      "sequence_and_interlock_review_done", manifest,
                      ("conveyor", "sequence_interlock_review_done"),
                      ("conveyor", "mixed"),
                      "sequence and interlock review (start/stop "
                      "order, pull-cord e-stops per site) done",
                      "no conveyor drives declared")
    _gated_bool_check(results, "conveyor_checks",
                      "belt_slip_vs_overload_and_jam_reviewed", manifest,
                      ("conveyor", "belt_slip_jam_reviewed"),
                      ("conveyor", "mixed"),
                      "belt slip vs overload tradeoffs reviewed; "
                      "current signature for jam detection reviewed",
                      "no conveyor drives declared")

    # ---- Section 5: baselines (skill method 5 + quality gate) ----
    _bool_check(results, "baselines", "baselines_recorded_per_mode",
                manifest, ("baselines", "recorded_per_operating_mode"),
                "quality gate: commissioning baselines recorded "
                "per mode")
    _bool_check(results, "baselines",
                "flow_head_current_pressure_recorded", manifest,
                ("baselines", "flow_head_current_pressure_recorded"),
                "record flow/head/current/pressure per operating "
                "mode at commissioning")
    _bool_check(results, "baselines",
                "readings_compared_at_same_conditions", manifest,
                ("baselines", "compared_at_same_conditions"),
                "compare later readings at the SAME conditions — "
                "deltas are the signal")

    # ---- Section 6: interface_and_protection (skill method 6 +
    #      quality gate + red line) ----
    _bool_check(results, "interface_and_protection",
                "mechanical_data_in_asset_record", manifest,
                ("interface", "mechanical_data_in_asset_record"),
                "quality gate: mechanical data (ratios/diameters) "
                "in the asset record")
    _bool_check(results, "interface_and_protection",
                "mechanical_electrical_data_single_source", manifest,
                ("interface", "data_shared_single_source"),
                "interface discipline: mechanical↔electrical data "
                "shared (coupling, ratios, sheave diameters) — one "
                "source of truth")
    changed, has_changed = _get(manifest, "interface", "changes_made")
    revalidated, has_revalidated = _get(
        manifest, "interface", "changes_revalidated")
    if has_changed and changed:
        _check(results, "interface_and_protection",
               "changes_revalidated_on_both_sides",
               revalidated, has_revalidated, revalidated is True,
               "changes on either side re-validated")
    else:
        _check(results, "interface_and_protection",
               "changes_revalidated_on_both_sides",
               changed, has_changed, True,
               "no interface change declared")
    _false_check(results, "interface_and_protection",
                 "no_protection_change_without_engineering_review",
                 manifest,
                 ("protection",
                  "protection_changed_without_engineering_review"),
                 "skill red line: no protection changes (min flow, "
                 "overload class) without engineering review")

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
        verdict = "NOT_SUITABLE"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "SUITABLE"

    exceeded_flags = [drives_exceeded, pump_exceeded, conveyor_exceeded]
    if any(flag is True for flag in exceeded_flags):
        suitability_status = "not_suitable_on_declared_values"
    elif all(flag is False for flag in exceeded_flags):
        suitability_status = "suitable_on_declared_values"
    else:
        suitability_status = None

    return {
        "service": "pump-conveyor-motor-suitability-check",
        "atom_version": "0.1.0",
        "asset": manifest.get("asset"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "suitability_status": suitability_status,
        "min_power_margin_kw": _fmt4(power_margin),
        "min_running_torque_margin_nm": _fmt4(torque_margin),
        "min_npsh_margin_m": _fmt4(npsh_margin),
        "min_starting_torque_margin_nm": _fmt4(starting_margin),
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
        "PUMP CONVEYOR MOTOR SUITABILITY CHECK",
        f"asset: {verdict.get('asset')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<25} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: pump_conveyor_motor_suitability_check.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "SUITABLE" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
