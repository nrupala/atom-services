#!/usr/bin/env python3
"""Distribution equipment rating condition check — deterministic core.

Built from the bound skill `power-distribution-equipment` (v1):
"MCC, switchgear, transformers — ratings, protection basics,
testing, condition checks, safe work discipline"; "ratings must
match reality, protection must work, tests must be traceable, and
work on it happens only inside the safety system."

The caller submits a distribution-equipment evidence manifest (a
dict, or JSON on the CLI): the rating-vs-fault-study record, the
equipment ratings with the fault/load currents they face, the MCC
and switchgear specifics, the transformer records (loading against
nameplate, temperatures against the caller's declared limits,
paralleling matches, tap / K-factor record), the condition-
awareness record, and the coordination / safety record.

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Four checks are computed, not declared, and use ONLY comparisons
the skill itself states, over values the caller declares — no
outside standard or threshold is imported:

- interrupting rating >= available fault current (skill method 1:
  "interrupting rating vs available fault current")
- continuous current rating >= declared load current (method 1:
  "continuous current")
- transformer load <= nameplate rating (method 4: "loading per
  nameplate"; quality gate: "loading/temperature within limits")
- transformer temperatures <= the caller's declared temperature
  limits (method 4: "temperature context (top-oil/winding trends)")

A fifth computed check enforces method 4's paralleling rule: a
transformer declared paralleled requires matching vector group,
ratio and impedance — "verify, never assume".

The computed outcome is also reported as `rating_status`:
"exceeded" when any computed comparison fails,
"within_declared_ratings" when every computed comparison is
complete and passes, otherwise null.

Verdict:
- any fail             -> RATING_CONDITION_UNSOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> RATING_CONDITION_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "ratings_vs_fault_study",
    "mcc_specifics",
    "switchgear_specifics",
    "transformers",
    "condition_awareness",
    "coordination_and_safety",
)


# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "lineup": "string",
    "ratings": {
        "fault_study_current": "boolean",
        "gaps_documented": "boolean",
    },
    "equipment": [{
        "id": "string",
        "interrupting_rating_ka": "number",
        "available_fault_current_ka": "number",
        "continuous_current_rating_a": "number",
        "load_current_a": "number",
    }],
    "mcc": {
        "section_bus_rating_verified": "boolean",
        "starter_types_recorded": "boolean",
        "segregation_and_barriers_verified": "boolean",
        "heat_load_assessed": "boolean",
        "planned_spare_capacity_recorded": "boolean",
        "labeling_matches_lineup_drawing": "boolean",
    },
    "switchgear": {
        "breaker_relay_schemes_verified": "boolean",
        "ct_ratios_and_wiring_checked": "boolean",
        "trip_tests_per_plan": "boolean",
        "interlock_function_tests_done": "boolean",
        "torque_checks_per_oem": "boolean",
    },
    "transformers": [{
        "id": "string",
        "nameplate_kva": "number",
        "load_kva": "number",
        "top_oil_temp_c": "number",
        "top_oil_limit_c": "number",
        "winding_temp_c": "number",
        "winding_limit_c": "number",
        "paralleled": "boolean",
        "vector_group_match": "boolean",
        "ratio_match": "boolean",
        "impedance_match": "boolean",
    }],
    "transformer": {
        "tap_positions_recorded": "boolean",
        "harmonic_rich_load": "boolean",
        "k_factor_assessed": "boolean",
    },
    "condition": {
        "oil_dga_screening_on_schedule": "boolean",
        "ir_scans_done": "boolean",
        "audible_corona_logged_vs_baseline": "boolean",
    },
    "coordination": {
        "settings_labels_study_aligned": "boolean",
        "equipment_changed": "boolean",
        "study_refresh_flagged": "boolean",
        "test_records_complete_with_instruments_and_calibration": "boolean",
        "energized_work_outside_permit_system": "boolean",
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


def _equipment_checks(results, manifest):
    """Computed rating checks over equipment[]; True/False/None exceeded."""
    equipment, has_equipment = _get(manifest, "equipment")
    if not has_equipment or not isinstance(equipment, list) \
            or not equipment:
        _check(results, "ratings_vs_fault_study",
               "interrupting_rating_covers_fault_current",
               equipment, False, False, "no equipment declared")
        _check(results, "ratings_vs_fault_study",
               "continuous_current_rating_covers_load",
               equipment, False, False, "no equipment declared")
        return None
    int_incomplete = False
    int_violating = False
    cont_incomplete = False
    cont_violating = False
    for entry in equipment:
        if not isinstance(entry, dict):
            int_incomplete = True
            cont_incomplete = True
            continue
        rating, has_rating = _get(entry, "interrupting_rating_ka")
        fault, has_fault = _get(entry, "available_fault_current_ka")
        if not (has_rating and has_fault and _is_number(rating)
                and _is_number(fault)):
            int_incomplete = True
        elif rating < fault:
            int_violating = True
        continuous, has_cont = _get(entry, "continuous_current_rating_a")
        load, has_load = _get(entry, "load_current_a")
        if not (has_cont and has_load and _is_number(continuous)
                and _is_number(load)):
            cont_incomplete = True
        elif continuous < load:
            cont_violating = True
    if int_incomplete:
        _check(results, "ratings_vs_fault_study",
               "interrupting_rating_covers_fault_current",
               equipment, False, False,
               "an equipment entry is missing its interrupting rating "
               "or available fault current")
    else:
        _check(results, "ratings_vs_fault_study",
               "interrupting_rating_covers_fault_current",
               equipment, True, not int_violating,
               "interrupting rating vs available fault current, from "
               "the current short-circuit study")
    if cont_incomplete:
        _check(results, "ratings_vs_fault_study",
               "continuous_current_rating_covers_load",
               equipment, False, False,
               "an equipment entry is missing its continuous current "
               "rating or load current")
    else:
        _check(results, "ratings_vs_fault_study",
               "continuous_current_rating_covers_load",
               equipment, True, not cont_violating,
               "continuous current rating covers the declared load "
               "current")
    if int_incomplete or cont_incomplete:
        return True if (int_violating or cont_violating) else None
    return int_violating or cont_violating


def _transformer_checks(results, manifest):
    """Computed transformer checks over transformers[].

    Returns True/False/None for the rating-exceedance outcome
    (loading / temperature only; paralleling is not an exceedance).
    """
    transformers, has_transformers = _get(manifest, "transformers")
    if not has_transformers or not isinstance(transformers, list) \
            or not transformers:
        _check(results, "transformers",
               "transformer_loading_within_nameplate",
               transformers, False, False, "no transformers declared")
        _check(results, "transformers",
               "transformer_temperatures_within_declared_limits",
               transformers, False, False, "no transformers declared")
        _check(results, "transformers",
               "paralleling_requirements_match",
               transformers, False, False, "no transformers declared")
        return None
    load_incomplete = False
    load_violating = False
    temp_incomplete = False
    temp_violating = False
    par_incomplete = False
    par_violating = False
    for entry in transformers:
        if not isinstance(entry, dict):
            load_incomplete = True
            temp_incomplete = True
            par_incomplete = True
            continue
        nameplate, has_np = _get(entry, "nameplate_kva")
        load, has_load = _get(entry, "load_kva")
        if not (has_np and has_load and _is_number(nameplate)
                and _is_number(load)):
            load_incomplete = True
        elif load > nameplate:
            load_violating = True
        oil, has_oil = _get(entry, "top_oil_temp_c")
        oil_limit, has_oil_limit = _get(entry, "top_oil_limit_c")
        winding, has_winding = _get(entry, "winding_temp_c")
        winding_limit, has_winding_limit = _get(entry, "winding_limit_c")
        if not (has_oil and has_oil_limit and has_winding
                and has_winding_limit and _is_number(oil)
                and _is_number(oil_limit) and _is_number(winding)
                and _is_number(winding_limit)):
            temp_incomplete = True
        elif oil > oil_limit or winding > winding_limit:
            temp_violating = True
        paralleled, has_paralleled = _get(entry, "paralleled")
        if not has_paralleled:
            par_incomplete = True
        elif paralleled:
            vector, has_vector = _get(entry, "vector_group_match")
            ratio, has_ratio = _get(entry, "ratio_match")
            impedance, has_impedance = _get(entry, "impedance_match")
            if not (has_vector and has_ratio and has_impedance):
                par_incomplete = True
            elif not (vector is True and ratio is True
                      and impedance is True):
                par_violating = True
    if load_incomplete:
        _check(results, "transformers",
               "transformer_loading_within_nameplate",
               transformers, False, False,
               "a transformer entry is missing its nameplate rating "
               "or load")
    else:
        _check(results, "transformers",
               "transformer_loading_within_nameplate",
               transformers, True, not load_violating,
               "loading per nameplate — load does not exceed the "
               "nameplate rating")
    if temp_incomplete:
        _check(results, "transformers",
               "transformer_temperatures_within_declared_limits",
               transformers, False, False,
               "a transformer entry is missing its top-oil/winding "
               "temperatures or declared limits")
    else:
        _check(results, "transformers",
               "transformer_temperatures_within_declared_limits",
               transformers, True, not temp_violating,
               "top-oil and winding temperatures within the declared "
               "limits, with temperature context")
    if par_incomplete:
        _check(results, "transformers", "paralleling_requirements_match",
               transformers, False, False,
               "a transformer entry is missing its paralleled flag or "
               "paralleling match fields")
    else:
        _check(results, "transformers", "paralleling_requirements_match",
               transformers, True, not par_violating,
               "paralleling requires matching vector group/ratio/"
               "impedance — verify, never assume")
    if load_incomplete or temp_incomplete:
        return True if (load_violating or temp_violating) else None
    return load_violating or temp_violating


def evaluate(manifest):
    """Return the verdict dict for a distribution-equipment manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: ratings_vs_fault_study (skill method 1 +
    #      quality gate) ----
    _bool_check(results, "ratings_vs_fault_study",
                "ratings_verified_vs_current_fault_study", manifest,
                ("ratings", "fault_study_current"),
                "quality gate: ratings verified vs current fault "
                "study — voltage class, continuous current, "
                "interrupting rating, bus bracing — from a current "
                "short-circuit study, not memory")
    _bool_check(results, "ratings_vs_fault_study",
                "rating_gaps_documented", manifest,
                ("ratings", "gaps_documented"),
                "rating gaps against the fault study are documented")
    equipment_exceeded = _equipment_checks(results, manifest)

    # ---- Section 2: mcc_specifics (skill method 2) ----
    _bool_check(results, "mcc_specifics", "section_bus_rating_verified",
                manifest, ("mcc", "section_bus_rating_verified"),
                "MCC section/bus rating verified")
    _bool_check(results, "mcc_specifics", "starter_types_recorded",
                manifest, ("mcc", "starter_types_recorded"),
                "starter types recorded (DOL/soft/VFD buckets)")
    _bool_check(results, "mcc_specifics",
                "segregation_and_barriers_verified", manifest,
                ("mcc", "segregation_and_barriers_verified"),
                "segregation and barriers verified")
    _bool_check(results, "mcc_specifics", "heat_load_assessed", manifest,
                ("mcc", "heat_load_assessed"), "heat load assessed")
    _bool_check(results, "mcc_specifics",
                "planned_spare_capacity_recorded", manifest,
                ("mcc", "planned_spare_capacity_recorded"),
                "planned spare capacity recorded")
    _bool_check(results, "mcc_specifics",
                "labeling_matches_lineup_drawing", manifest,
                ("mcc", "labeling_matches_lineup_drawing"),
                "labeling matches the line-up drawing")

    # ---- Section 3: switchgear_specifics (skill method 3) ----
    _bool_check(results, "switchgear_specifics",
                "breaker_relay_schemes_verified", manifest,
                ("switchgear", "breaker_relay_schemes_verified"),
                "breaker/relay schemes verified")
    _bool_check(results, "switchgear_specifics",
                "ct_ratios_and_wiring_checked", manifest,
                ("switchgear", "ct_ratios_and_wiring_checked"),
                "CT ratios + wiring checks done")
    _bool_check(results, "switchgear_specifics", "trip_tests_per_plan",
                manifest, ("switchgear", "trip_tests_per_plan"),
                "trip tests (primary/secondary injection per plan) done")
    _bool_check(results, "switchgear_specifics",
                "interlock_function_tests_done", manifest,
                ("switchgear", "interlock_function_tests_done"),
                "interlock function tests done")
    _bool_check(results, "switchgear_specifics",
                "torque_checks_per_oem", manifest,
                ("switchgear", "torque_checks_per_oem"),
                "torque checks per OEM — skill red line: no torque "
                "specs from memory; OEM procedures only")

    # ---- Section 4: transformers (skill method 4 + quality gate) ----
    transformer_exceeded = _transformer_checks(results, manifest)
    _bool_check(results, "transformers", "tap_positions_recorded",
                manifest, ("transformer", "tap_positions_recorded"),
                "quality gate: tap position recorded")
    harmonic, has_harmonic = _get(manifest, "transformer",
                                  "harmonic_rich_load")
    k_factor, has_k_factor = _get(manifest, "transformer",
                                  "k_factor_assessed")
    if has_harmonic and harmonic:
        _check(results, "transformers",
               "k_factor_assessed_for_harmonic_loads",
               k_factor, has_k_factor, k_factor is True,
               "K-factor assessed for harmonic-rich loads")
    else:
        _check(results, "transformers",
               "k_factor_assessed_for_harmonic_loads",
               harmonic, has_harmonic, True,
               "no harmonic-rich load declared")

    # ---- Section 5: condition_awareness (skill method 5) ----
    _bool_check(results, "condition_awareness",
                "oil_dga_screening_on_schedule", manifest,
                ("condition", "oil_dga_screening_on_schedule"),
                "transformer oil/DGA screening on schedule")
    _bool_check(results, "condition_awareness",
                "ir_scans_of_terminations_and_bus_done", manifest,
                ("condition", "ir_scans_done"),
                "IR scans of terminations/bus done")
    _bool_check(results, "condition_awareness",
                "audible_corona_observations_logged_vs_baseline",
                manifest,
                ("condition", "audible_corona_logged_vs_baseline"),
                "audible/corona observations logged vs baseline")

    # ---- Section 6: coordination_and_safety (skill method 6 +
    #      quality gates + red line) ----
    _bool_check(results, "coordination_and_safety",
                "settings_labels_and_study_aligned", manifest,
                ("coordination", "settings_labels_study_aligned"),
                "quality gate: labels, settings, and drawings "
                "consistent — keep settings, labels, and the study "
                "aligned")
    changed, has_changed = _get(manifest, "coordination",
                                "equipment_changed")
    refresh, has_refresh = _get(manifest, "coordination",
                                "study_refresh_flagged")
    if has_changed and changed:
        _check(results, "coordination_and_safety",
               "study_refresh_flagged_when_equipment_changes",
               refresh, has_refresh, refresh is True,
               "when equipment changes, flag a study refresh")
    else:
        _check(results, "coordination_and_safety",
               "study_refresh_flagged_when_equipment_changes",
               changed, has_changed, True,
               "no equipment change declared")
    _bool_check(results, "coordination_and_safety",
                "test_records_complete_with_calibration", manifest,
                ("coordination",
                 "test_records_complete_with_instruments_and_calibration"),
                "quality gate: test/inspection records complete with "
                "instruments + calibration; records archived")
    energized, has_energized = _get(
        manifest, "coordination", "energized_work_outside_permit_system")
    _check(results, "coordination_and_safety",
           "no_energized_work_outside_permit_system",
           energized, has_energized, energized is False,
           "skill red line: no energized work outside the site "
           "permit/PPE system")

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
        verdict = "RATING_CONDITION_UNSOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "RATING_CONDITION_SOUND"

    exceeded_flags = [equipment_exceeded, transformer_exceeded]
    if any(flag is True for flag in exceeded_flags):
        rating_status = "exceeded"
    elif all(flag is False for flag in exceeded_flags):
        rating_status = "within_declared_ratings"
    else:
        rating_status = None

    return {
        "service": "distribution-equipment-rating-condition-check",
        "atom_version": "0.1.0",
        "lineup": manifest.get("lineup"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "rating_status": rating_status,
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
        "DISTRIBUTION EQUIPMENT RATING CONDITION CHECK",
        f"lineup: {verdict.get('lineup')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<24} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: distribution_equipment_rating_condition_check.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "RATING_CONDITION_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
