#!/usr/bin/env python3
"""Electrical machines expert advice — deterministic core.

Built from the bound skill `electrical-machines-sme`:
"A peer-level expert in motors, drives, and power systems —
rigorous, assumptions shown, protection and safety never
hand-waved."

The caller submits a declared expert-advice record (a dict, or
JSON on the CLI): the record of one piece of SME advice /
assessment — what was asked, which machine family it concerned,
and what the advice addressed. This atom gives no engineering
advice itself; it audits the declared record against only rules
the skill itself states:

- engagement: the question and operating context are stated,
  assumptions are stated explicitly, and protection / safety is
  declared addressed without hand-waving (the skill's own terms);
- machine analysis, gated by the declared machine family:
  induction (equivalent circuit / slip, torque-speed curve,
  starting current recorded as a multiple of FLA, efficiency and
  loss breakdown), synchronous (excitation / AVR, capability
  curve / power-angle, synchronization), transformer (vector
  group / impedance, inrush / tap changers / cooling classes,
  thermal aging), DC (excitation type — separately / series /
  shunt excited — and the legacy / retrofit context);
- drives, gated on a VFD being involved: control mode in the
  skill's vocabulary (V/f, sensorless vector, closed-loop
  vector), harmonics, reflected-wave / dV/dt, bearing currents
  (shaft grounding) and cable charging addressed;
- protection, gated on protection being in scope: selectivity /
  coordination, primary + backup, the declared ANSI device
  numbers drawn from the skill's own list (50/51, 87, 27/59, 81,
  49, 46, 32, 25, 86), CT/PT selection / saturation / burden and
  IDMT curves / grading addressed — plus the skill's standing
  rules, which bind whether or not protection is in scope:
  final settings are deferred to a documented coordination /
  arc-flash study, and settings are never published as fact;
- standards and hazardous area: applicable standards named with
  applicability reasons stated (IEEE / IEC / CSA / CEC / APEGA
  in the skill), and — gated on a hazardous area being involved
  — zone / division, gas group and temperature class, and the
  Ex protection method with IECEx / CSA certification stated;
- calculations, gated on calculations being relied upon: the
  skill's honesty list — short-circuit, motor-starting voltage
  dip, grounding, load flow, arc-flash incident energy — each
  declared addressed;
- documents and disclosure, gated per workflow: a document
  review addresses SoW, SDRL, SQRL and supplier qualification;
  content going public declares the public-sanitization rules
  applied (the skill's confidentiality note).

The skill states exactly one numeric reference — induction
starting current of ~6x FLA — and states it as an approximation
with no tolerance band, so the declared multiple is RECORDED
(formatted to six decimals in the evidence), never graded. The
skill states no other numeric threshold (no voltage-dip limit,
no THD limit, no dV/dt or cable-length limit, no grading margin,
no incident-energy limit), so none is invented here: those items
are checked as declared-addressed, never re-graded.

Whether the advice itself is correct, whether the assumptions
are the right ones, and whether a protection scheme actually
coordinates are judgment — carried only as caller declarations,
never judged by this atom.

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Verdict:
- any fail             -> NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> SOUND

No model call, no network, no clock dependence: the same record
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "engagement",
    "machine_analysis",
    "drives",
    "protection",
    "standards_and_hazloc",
    "calculations",
    "documents_and_disclosure",
)

MACHINE_FAMILIES = ("induction", "synchronous", "transformer", "dc")
CONTROL_MODES = ("vf", "sensorless_vector", "closed_loop_vector")
DC_EXCITATION_TYPES = ("separately_excited", "series", "shunt")
ANSI_DEVICE_NUMBERS = (
    "50", "51", "87", "27", "59", "81", "49", "46", "32", "25", "86",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# Vocabulary strings (machine.machine_family, drives.control_mode,
# machine.dc_excitation_type) are validated as "string" only,
# never enum-checked here.
MANIFEST_SPEC = {
    "advice_id": "string",
    "engagement": {
        "question_or_problem_stated": "boolean",
        "operating_context_stated": "boolean",
        "assumptions_stated_explicitly": "boolean",
        "protection_and_safety_not_handwaved": "boolean",
    },
    "machine": {
        "machine_family": "string",
        "full_load_current_a": "number",
        "starting_current_a": "number",
        "induction_slip_or_equivalent_circuit_addressed": "boolean",
        "induction_torque_speed_addressed": "boolean",
        "induction_losses_or_efficiency_addressed": "boolean",
        "synchronous_excitation_or_avr_addressed": "boolean",
        "synchronous_capability_or_power_angle_addressed": "boolean",
        "synchronous_synchronization_addressed": "boolean",
        "transformer_vector_group_or_impedance_addressed": "boolean",
        "transformer_inrush_tap_cooling_addressed": "boolean",
        "transformer_thermal_aging_addressed": "boolean",
        "dc_excitation_type": "string",
        "dc_retrofit_or_legacy_context_addressed": "boolean",
    },
    "drives": {
        "vfd_involved": "boolean",
        "control_mode": "string",
        "harmonics_addressed": "boolean",
        "reflected_wave_dvdt_addressed": "boolean",
        "bearing_currents_addressed": "boolean",
        "cable_charging_addressed": "boolean",
    },
    "protection": {
        "protection_in_scope": "boolean",
        "selectivity_coordination_addressed": "boolean",
        "primary_and_backup_addressed": "boolean",
        "ansi_device_numbers": ["string"],
        "ct_pt_selection_saturation_burden_addressed": "boolean",
        "idmt_curves_and_grading_addressed": "boolean",
        "final_settings_deferred_to_study": "boolean",
        "settings_published_as_fact": "boolean",
    },
    "standards": {
        "applicable_standards_named": "boolean",
        "standards_applicability_reasons_stated": "boolean",
        "hazardous_area_involved": "boolean",
        "hazloc_zone_or_division_stated": "boolean",
        "hazloc_gas_group_and_temp_class_stated": "boolean",
        "hazloc_ex_method_and_certification_stated": "boolean",
    },
    "calculations": {
        "calculations_relied_upon": "boolean",
        "short_circuit_addressed": "boolean",
        "motor_starting_voltage_dip_addressed": "boolean",
        "grounding_addressed": "boolean",
        "load_flow_addressed": "boolean",
        "arc_flash_addressed": "boolean",
    },
    "documents": {
        "document_review_in_scope": "boolean",
        "sow_addressed": "boolean",
        "sdrl_addressed": "boolean",
        "sqrl_addressed": "boolean",
        "supplier_qualification_addressed": "boolean",
        "going_public": "boolean",
        "public_sanitization_applied": "boolean",
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


def _enum_check(results, section, name, manifest, path, allowed, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value in allowed,
           evidence)


def _gated_bool_check(results, section, name, manifest, path, gate_on,
                      na_evidence, evidence):
    """Check that binds only while its gate is on; otherwise it
    passes as not applicable (the sibling failure-gate pattern)."""
    if gate_on:
        _bool_check(results, section, name, manifest, path, evidence)
    else:
        _check(results, section, name, None, True, True, na_evidence)


def _gated_enum_check(results, section, name, manifest, path, allowed,
                      gate_on, na_evidence, evidence):
    if gate_on:
        _enum_check(results, section, name, manifest, path, allowed,
                    evidence)
    else:
        _check(results, section, name, None, True, True, na_evidence)


def _family_gate(manifest, family):
    value, present = _get(manifest, "machine", "machine_family")
    return present and value == family


def evaluate(manifest):
    """Return the verdict dict for an expert-advice record."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: engagement (skill posture — peer-level,
    #      rigorous, assumptions shown) ----
    _bool_check(results, "engagement", "question_or_problem_stated",
                manifest, ("engagement", "question_or_problem_stated"),
                "the question or problem the advice answers is stated")
    _bool_check(results, "engagement", "operating_context_stated",
                manifest, ("engagement", "operating_context_stated"),
                "the operating context the advice applies to is stated")
    _bool_check(results, "engagement", "assumptions_stated_explicitly",
                manifest,
                ("engagement", "assumptions_stated_explicitly"),
                "assumptions are stated explicitly — the skill "
                "requires assumptions shown, never buried")
    _bool_check(results, "engagement",
                "protection_and_safety_not_handwaved", manifest,
                ("engagement", "protection_and_safety_not_handwaved"),
                "protection and safety are addressed, never "
                "hand-waved (caller declaration; the atom does not "
                "judge the advice itself)")

    # ---- Section 2: machine_analysis (skill Machines — gated by
    #      the declared machine family) ----
    _enum_check(results, "machine_analysis", "machine_family_named",
                manifest, ("machine", "machine_family"),
                MACHINE_FAMILIES,
                "machine family is one of induction / synchronous / "
                "transformer / dc — the skill's own machine "
                "vocabulary")
    ind = _family_gate(manifest, "induction")
    _gated_bool_check(
        results, "machine_analysis",
        "induction_slip_or_equivalent_circuit_addressed", manifest,
        ("machine", "induction_slip_or_equivalent_circuit_addressed"),
        ind, "not applicable: declared machine family is not induction",
        "induction machines: equivalent circuit and slip are "
        "addressed")
    _gated_bool_check(
        results, "machine_analysis",
        "induction_torque_speed_addressed", manifest,
        ("machine", "induction_torque_speed_addressed"),
        ind, "not applicable: declared machine family is not induction",
        "induction machines: the torque-speed curve is addressed")
    # Computed check: the declared starting-current multiple of
    # FLA is recorded (six decimals), never graded — the skill
    # states ~6x FLA as an approximation with no tolerance band.
    if ind:
        fla, has_fla = _get(manifest, "machine", "full_load_current_a")
        sta, has_sta = _get(manifest, "machine", "starting_current_a")
        present = has_fla and has_sta
        ok = _is_number(fla) and _is_number(sta) and fla > 0 and sta > 0
        if ok:
            evidence = (
                "induction starting current recorded as a multiple "
                "of FLA (the skill states ~6x FLA as an "
                "approximation with no tolerance band, so the "
                f"multiple is recorded, not graded): {sta / fla:.6f} "
                "x FLA declared"
            )
        else:
            evidence = (
                "induction starting current recorded as a multiple "
                "of FLA (the skill states ~6x FLA as an "
                "approximation with no tolerance band, so the "
                "multiple is recorded, not graded)"
            )
        _check(results, "machine_analysis",
               "induction_starting_current_multiple_recorded",
               sta, present, ok, evidence)
    else:
        _check(results, "machine_analysis",
               "induction_starting_current_multiple_recorded",
               None, True, True,
               "not applicable: declared machine family is not "
               "induction")
    _gated_bool_check(
        results, "machine_analysis",
        "induction_losses_or_efficiency_addressed", manifest,
        ("machine", "induction_losses_or_efficiency_addressed"),
        ind, "not applicable: declared machine family is not induction",
        "induction machines: efficiency and the loss breakdown "
        "(copper, iron, windage / friction, stray) are addressed")
    syn = _family_gate(manifest, "synchronous")
    _gated_bool_check(
        results, "machine_analysis",
        "synchronous_excitation_or_avr_addressed", manifest,
        ("machine", "synchronous_excitation_or_avr_addressed"),
        syn,
        "not applicable: declared machine family is not synchronous",
        "synchronous machines: excitation and AVR are addressed")
    _gated_bool_check(
        results, "machine_analysis",
        "synchronous_capability_or_power_angle_addressed", manifest,
        ("machine",
         "synchronous_capability_or_power_angle_addressed"),
        syn,
        "not applicable: declared machine family is not synchronous",
        "synchronous machines: the capability curve and "
        "power-angle behaviour (V-curves) are addressed")
    _gated_bool_check(
        results, "machine_analysis",
        "synchronous_synchronization_addressed", manifest,
        ("machine", "synchronous_synchronization_addressed"),
        syn,
        "not applicable: declared machine family is not synchronous",
        "synchronous machines: synchronization is addressed")
    trf = _family_gate(manifest, "transformer")
    _gated_bool_check(
        results, "machine_analysis",
        "transformer_vector_group_or_impedance_addressed", manifest,
        ("machine",
         "transformer_vector_group_or_impedance_addressed"),
        trf,
        "not applicable: declared machine family is not transformer",
        "transformers: vector group, per-unit and impedance are "
        "addressed")
    _gated_bool_check(
        results, "machine_analysis",
        "transformer_inrush_tap_cooling_addressed", manifest,
        ("machine", "transformer_inrush_tap_cooling_addressed"),
        trf,
        "not applicable: declared machine family is not transformer",
        "transformers: inrush, tap changers and cooling classes "
        "are addressed")
    _gated_bool_check(
        results, "machine_analysis",
        "transformer_thermal_aging_addressed", manifest,
        ("machine", "transformer_thermal_aging_addressed"),
        trf,
        "not applicable: declared machine family is not transformer",
        "transformers: thermal aging is addressed")
    dc = _family_gate(manifest, "dc")
    _gated_enum_check(
        results, "machine_analysis", "dc_excitation_type_named",
        manifest, ("machine", "dc_excitation_type"),
        DC_EXCITATION_TYPES, dc,
        "not applicable: declared machine family is not dc",
        "DC machines: excitation type is one of separately_excited "
        "/ series / shunt — the skill's own vocabulary")
    _gated_bool_check(
        results, "machine_analysis",
        "dc_retrofit_or_legacy_context_addressed", manifest,
        ("machine", "dc_retrofit_or_legacy_context_addressed"),
        dc, "not applicable: declared machine family is not dc",
        "DC machines: the legacy / retrofit context is addressed")

    # ---- Section 3: drives (skill Drives / VFDs — gated on a VFD
    #      being involved) ----
    vfd, has_vfd = _get(manifest, "drives", "vfd_involved")
    vfd_on = has_vfd and vfd is True
    na_vfd = "not applicable: no VFD declared involved"
    _gated_enum_check(
        results, "drives", "control_mode_named", manifest,
        ("drives", "control_mode"), CONTROL_MODES, vfd_on, na_vfd,
        "drive control mode is one of vf / sensorless_vector / "
        "closed_loop_vector — the skill's own vocabulary (V/f vs "
        "sensorless vector vs closed-loop vector control)")
    _gated_bool_check(
        results, "drives", "harmonics_addressed", manifest,
        ("drives", "harmonics_addressed"), vfd_on, na_vfd,
        "power quality: harmonics and their mitigation (line "
        "reactors, filters) are addressed")
    _gated_bool_check(
        results, "drives", "reflected_wave_dvdt_addressed", manifest,
        ("drives", "reflected_wave_dvdt_addressed"), vfd_on, na_vfd,
        "reflected-wave / dV/dt effects on long cables are "
        "addressed")
    _gated_bool_check(
        results, "drives", "bearing_currents_addressed", manifest,
        ("drives", "bearing_currents_addressed"), vfd_on, na_vfd,
        "bearing currents and shaft grounding are addressed")
    _gated_bool_check(
        results, "drives", "cable_charging_addressed", manifest,
        ("drives", "cable_charging_addressed"), vfd_on, na_vfd,
        "cable charging is addressed")

    # ---- Section 4: protection (skill Protection philosophy —
    #      gated on protection being in scope; the deferral rules
    #      bind always) ----
    prot, has_prot = _get(manifest, "protection", "protection_in_scope")
    prot_on = has_prot and prot is True
    na_prot = "not applicable: protection not declared in scope"
    _gated_bool_check(
        results, "protection", "selectivity_coordination_addressed",
        manifest, ("protection", "selectivity_coordination_addressed"),
        prot_on, na_prot,
        "selectivity / coordination is addressed")
    _gated_bool_check(
        results, "protection", "primary_and_backup_addressed",
        manifest, ("protection", "primary_and_backup_addressed"),
        prot_on, na_prot,
        "primary + backup protection and the fail-safe / "
        "dependability-vs-security balance are addressed")
    if prot_on:
        numbers, present = _get(manifest, "protection",
                                "ansi_device_numbers")
        ok = (
            isinstance(numbers, list)
            and len(numbers) > 0
            and all(n in ANSI_DEVICE_NUMBERS for n in numbers)
        )
        _check(results, "protection", "ansi_device_numbers_valid",
               numbers, present, ok,
               "every declared ANSI device number is in the "
               "skill's own list (50/51, 87, 27/59, 81, 49, 46, 32, "
               "25, 86)")
    else:
        _check(results, "protection", "ansi_device_numbers_valid",
               None, True, True, na_prot)
    _gated_bool_check(
        results, "protection",
        "ct_pt_selection_saturation_burden_addressed", manifest,
        ("protection",
         "ct_pt_selection_saturation_burden_addressed"),
        prot_on, na_prot,
        "CT / PT selection, saturation and burden are addressed")
    _gated_bool_check(
        results, "protection", "idmt_curves_and_grading_addressed",
        manifest, ("protection", "idmt_curves_and_grading_addressed"),
        prot_on, na_prot,
        "IDMT curves and grading are addressed (differential and "
        "distance principles where relied upon)")
    _bool_check(results, "protection",
                "final_settings_deferred_to_study", manifest,
                ("protection", "final_settings_deferred_to_study"),
                "standing rule: final settings are deferred to a "
                "documented coordination / arc-flash study")
    _false_check(results, "protection",
                 "settings_not_published_as_fact", manifest,
                 ("protection", "settings_published_as_fact"),
                 "standing rule: settings are not published as fact "
                 "— assumptions are stated explicitly instead")

    # ---- Section 5: standards_and_hazloc (skill Standards &
    #      regulatory; hazloc gated on a hazardous area) ----
    _bool_check(results, "standards_and_hazloc",
                "applicable_standards_named", manifest,
                ("standards", "applicable_standards_named"),
                "applicable standards are named (IEEE, IEC, CSA, "
                "the Canadian Electrical Code, APEGA obligations "
                "in the skill)")
    _bool_check(results, "standards_and_hazloc",
                "standards_applicability_reasons_stated", manifest,
                ("standards",
                 "standards_applicability_reasons_stated"),
                "which standards do / do not apply to the scope, "
                "and why, is stated")
    haz, has_haz = _get(manifest, "standards", "hazardous_area_involved")
    haz_on = has_haz and haz is True
    na_haz = "not applicable: no hazardous area declared involved"
    _gated_bool_check(
        results, "standards_and_hazloc",
        "hazloc_zone_or_division_stated", manifest,
        ("standards", "hazloc_zone_or_division_stated"),
        haz_on, na_haz,
        "hazardous-area classification: zone / division is stated")
    _gated_bool_check(
        results, "standards_and_hazloc",
        "hazloc_gas_group_and_temp_class_stated", manifest,
        ("standards", "hazloc_gas_group_and_temp_class_stated"),
        haz_on, na_haz,
        "hazardous-area classification: gas group and temperature "
        "class are stated")
    _gated_bool_check(
        results, "standards_and_hazloc",
        "hazloc_ex_method_and_certification_stated", manifest,
        ("standards", "hazloc_ex_method_and_certification_stated"),
        haz_on, na_haz,
        "Ex protection method (Ex d / e / i) and IECEx / CSA "
        "certification are stated")

    # ---- Section 6: calculations (skill honesty list — gated on
    #      calculations being relied upon) ----
    calc, has_calc = _get(manifest, "calculations",
                          "calculations_relied_upon")
    calc_on = has_calc and calc is True
    na_calc = "not applicable: no calculations declared relied upon"
    _gated_bool_check(
        results, "calculations", "short_circuit_addressed", manifest,
        ("calculations", "short_circuit_addressed"),
        calc_on, na_calc,
        "calculations kept honest: short-circuit is addressed")
    _gated_bool_check(
        results, "calculations",
        "motor_starting_voltage_dip_addressed", manifest,
        ("calculations", "motor_starting_voltage_dip_addressed"),
        calc_on, na_calc,
        "calculations kept honest: motor-starting voltage dip is "
        "addressed")
    _gated_bool_check(
        results, "calculations", "grounding_addressed", manifest,
        ("calculations", "grounding_addressed"),
        calc_on, na_calc,
        "calculations kept honest: grounding is addressed")
    _gated_bool_check(
        results, "calculations", "load_flow_addressed", manifest,
        ("calculations", "load_flow_addressed"),
        calc_on, na_calc,
        "calculations kept honest: load flow basics are addressed")
    _gated_bool_check(
        results, "calculations", "arc_flash_addressed", manifest,
        ("calculations", "arc_flash_addressed"),
        calc_on, na_calc,
        "calculations kept honest: arc-flash incident energy is "
        "addressed")

    # ---- Section 7: documents_and_disclosure (skill Industrial
    #      document workflows + confidentiality note) ----
    doc, has_doc = _get(manifest, "documents", "document_review_in_scope")
    doc_on = has_doc and doc is True
    na_doc = "not applicable: no document review declared in scope"
    _gated_bool_check(
        results, "documents_and_disclosure", "sow_addressed",
        manifest, ("documents", "sow_addressed"), doc_on, na_doc,
        "document workflow: the scope of work (SoW) is addressed")
    _gated_bool_check(
        results, "documents_and_disclosure", "sdrl_addressed",
        manifest, ("documents", "sdrl_addressed"), doc_on, na_doc,
        "document workflow: the supplier document requirements "
        "list (SDRL) is addressed — expected with the proposal")
    _gated_bool_check(
        results, "documents_and_disclosure", "sqrl_addressed",
        manifest, ("documents", "sqrl_addressed"), doc_on, na_doc,
        "document workflow: the supplier quality requirements "
        "list (SQRL) is addressed — expected with the proposal")
    _gated_bool_check(
        results, "documents_and_disclosure",
        "supplier_qualification_addressed", manifest,
        ("documents", "supplier_qualification_addressed"),
        doc_on, na_doc,
        "document workflow: supplier qualification is addressed")
    pub, has_pub = _get(manifest, "documents", "going_public")
    pub_on = has_pub and pub is True
    _gated_bool_check(
        results, "documents_and_disclosure",
        "public_sanitization_applied", manifest,
        ("documents", "public_sanitization_applied"), pub_on,
        "not applicable: content not declared as going public",
        "content going public: the public-sanitization rules are "
        "declared applied (internal / work content otherwise "
        "keeps its real detail)")

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
        "service": "electrical-machines-expert-advice",
        "atom_version": "0.1.0",
        "advice_id": manifest.get("advice_id"),
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
        "ELECTRICAL-MACHINES EXPERT ADVICE",
        f"advice_id: {verdict.get('advice_id')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<24} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: electrical_machines_expert_advice.py "
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
