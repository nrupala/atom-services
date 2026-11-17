#!/usr/bin/env python3
"""Smart grid DER design pack — deterministic core.

Built from the bound skill `smart-grid-engineering`: "Design and
analyze smart-grid systems — ADMS and SCADA, DER integration,
IEC 61850, AMI, microgrids, cyber." ("Modern grid = power
engineering + communications + software + security. The failure
mode is treating any layer in isolation.")

This atom is a DELIVERABLE audit of a CALLER-DECLARED smart-grid
/ DER design record: it audits the record a caller declares
against the practice the skill defines — a layered architecture
with a single-line + communications diagram pair, a standards
map (IEEE 1547, IEC 61850, IEEE 2030.5 / OpenADR, CIM,
NERC-CIP-style cyber controls), a network model before the
telemetry point list before the control loops, DER hosting
capacity and protection coordination across min/max DER
conditions, latency tiers with a budget per control loop,
Purdue-style OT cybersecurity, pilot discipline with KPIs and
safe fallback defined before energization, and operational
authority clarified in writing — plus the skill's red lines
refused. It produces NO engineering design, NO sizing, NO
protection settings, NO interconnection approval and NO
professional advice, and it stamps nothing: it does not run a
power flow, a hosting-capacity study or a coordination study,
inspect a real feeder, or verify that any declared fact is
true — it checks that the design record the skill requires is
present and internally complete and consistent on the declared
evidence.

Distinct ground: the nearest siblings are
`distribution-equipment-rating-condition-check` (a declared
record of distribution equipment — MCC, switchgear and
transformer ratings against a fault study, nameplate and
declared temperature limits, and condition evidence) and
`electrical-machinery-engineering-check` (a declared record of
a rotating machine — duty, torque/power sizing against its own
ratings, specification, acceptance tests and failure trending).
This atom shares zero checks with either: every check here is
a smart-grid / DER question — the five-layer architecture and
its diagram pair, the grid standards map, telemetry points
each carrying purpose, units, latency class and owner, DER
units each declaring ride-through and anti-islanding with the
declared aggregate capacity held against the record's own
declared hosting capacity, control loops each declaring a
recognized latency tier and a latency budget with tier-mixing
on a shared path justified, Purdue segmentation and
unidirectional telemetry egress, pilot KPIs and fallback
before energization, and who-opens-the-breaker in writing.
The boundary is: a declared smart-grid / DER design record
here; physical distribution equipment ratings and condition
there; a single machine's duty and sizing there.

The caller submits a design manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves and limits the
record itself declares — no outside threshold is imported:

- telemetry points: the declared `telemetry_points` list must
  be present (an empty list is a valid declaration — the
  record declares no telemetry points), and every declared
  point row must record all four attributes the skill requires
  of every point (purpose, units, latency class, owner), and
  no point id may be owned by more than one row;
- DER units: the declared `der_units` list must be present
  (an empty list is a valid declaration), every declared unit
  row must declare ride-through and anti-islanding, and the
  declared aggregate capacity (the sum of the rows' declared
  `capacity_kw`) must not exceed the hosting capacity the
  record itself declares (`der.hosting_capacity_kw`) — the
  limit is the caller's declared study result, this atom
  supplies no hosting number;
- control loops: the declared `control_loops` list must be
  present (an empty list is a valid declaration), every
  declared loop row must declare a latency budget and a
  latency tier drawn from the skill's own three tiers
  (protection / control / analytics), every loop that shares
  its path with other tiers must record a tier-mixing
  justification (the skill: never mix tier traffic on one path
  without justification), and no loop id may be duplicated.

Computed quantities are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold for this record — no
hosting-capacity value or penetration percentage, no latency
budget number for any tier, no ride-through curve or duration,
no anti-islanding detection time, no protection setting or
coordination margin, no point or loop count — so no numeric
threshold check is invented; those quantities are caller
declarations at most, and quantities here are computed and
reported, with completeness (every declared row) and the
record's own declared hosting limit as the only bars, exactly
as stated above.

Verdict:
- any fail             -> SMART_GRID_DER_DESIGN_PACK_NOT_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> SMART_GRID_DER_DESIGN_PACK_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "layered_architecture_and_standards",
    "network_model_and_telemetry_points",
    "der_interconnection_and_protection",
    "latency_tiers_and_control_loops",
    "ot_cybersecurity",
    "pilot_economics_and_authority",
    "red_lines",
)

LATENCY_TIERS = ("protection", "control", "analytics")

MANIFEST_SPEC = {
    "project": "string",
    "architecture": {
        "single_line_diagram_recorded": "boolean",
        "comms_diagram_paired": "boolean",
        "five_layers_mapped": "boolean",
        "ieee_1547_cited": "boolean",
        "iec_61850_cited": "boolean",
        "der_dr_protocol_cited": "boolean",
        "cim_model_cited": "boolean",
        "clause_level_citations_where_claims_matter": "boolean",
    },
    "network_model": {
        "gis_power_flow_model_recorded": "boolean",
        "point_list_derived_from_model": "boolean",
        "control_loops_derived_from_point_list": "boolean",
    },
    "telemetry_points": [{
        "point_id": "string",
        "purpose_recorded": "boolean",
        "units_recorded": "boolean",
        "latency_class_recorded": "boolean",
        "owner_recorded": "boolean",
    }],
    "der": {
        "hosting_capacity_study_recorded": "boolean",
        "hosting_capacity_kw": "number",
        "protection_coordination_min_max_der": "boolean",
        "inverter_dominance_protection_addressed": "boolean",
        "islanding_addressed": "boolean",
        "black_start_addressed": "boolean",
        "point_of_interconnection_recorded": "boolean",
    },
    "der_units": [{
        "unit_id": "string",
        "capacity_kw": "number",
        "ride_through_declared": "boolean",
        "anti_islanding_declared": "boolean",
    }],
    "latency": {
        "tiers_distinguished": "boolean",
    },
    "control_loops": [{
        "loop_id": "string",
        "latency_tier": "string",
        "latency_budget_declared": "boolean",
        "shares_path_with_other_tiers": "boolean",
        "tier_mixing_justification_recorded": "boolean",
    }],
    "cyber": {
        "purdue_segmentation_documented": "boolean",
        "unidirectional_gateway_telemetry_egress": "boolean",
        "key_management_documented": "boolean",
        "patching_windows_documented": "boolean",
        "incident_fallback_safe_state_documented": "boolean",
        "posture_against_recognized_framework": "boolean",
    },
    "pilot": {
        "measurable_outcomes_before_deployment": "boolean",
        "exit_criteria_before_deployment": "boolean",
        "capabilities_staged": "boolean",
        "safe_fallback_specified": "boolean",
        "kpis_and_fallback_before_energization": "boolean",
    },
    "economics": {
        "cost_stack_recorded": "boolean",
        "rate_treatment_and_incentives_recorded": "boolean",
        "operational_authority_in_writing": "boolean",
    },
    "review": {
        "architecture_reviewed_by_qualified_peng": "boolean",
    },
    "red_lines": {
        "protection_setting_changed_without_coordination_study_present": "boolean",
        "safety_disabled_for_demo_present": "boolean",
        "flat_it_ot_network_present": "boolean",
        "field_change_without_switching_authority_clarity_present": "boolean",
        "vendor_lockin_without_export_exit_plan_present": "boolean",
        "customer_data_without_consent_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
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


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry, field):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


def _duplicates(rows, field):
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get(field), str):
            nm = c[field]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


POINT_ATTRS = ("purpose_recorded", "units_recorded",
               "latency_class_recorded", "owner_recorded")


def evaluate(manifest):
    """Return the verdict dict for a smart-grid DER design manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    points, has_points = _get(manifest, "telemetry_points")
    points_is_list = has_points and isinstance(points, list)
    points_count = len(points) if points_is_list else None
    point_rows = points if points_is_list else []

    units, has_units = _get(manifest, "der_units")
    units_is_list = has_units and isinstance(units, list)
    units_count = len(units) if units_is_list else None
    unit_rows = units if units_is_list else []

    loops, has_loops = _get(manifest, "control_loops")
    loops_is_list = has_loops and isinstance(loops, list)
    loops_count = len(loops) if loops_is_list else None
    loop_rows = loops if loops_is_list else []

    hosting_kw, has_hosting = _get(manifest, "der", "hosting_capacity_kw")

    points_incomplete = (
        [_row_name(c, "point_id") for c in point_rows
         if isinstance(c, dict)
         and any(a in c and c.get(a) is not True for a in POINT_ATTRS)]
        if points_is_list else None
    )
    duplicate_point_ids = (
        _duplicates(point_rows, "point_id") if points_is_list else None
    )
    points_complete_share = (
        sum(1 for c in point_rows
            if isinstance(c, dict)
            and all(c.get(a) is True for a in POINT_ATTRS))
        / points_count
        if points_is_list and points_count > 0 else None
    )

    units_without_ride_or_anti = (
        [_row_name(c, "unit_id") for c in unit_rows
         if isinstance(c, dict)
         and (("ride_through_declared" in c
               and c.get("ride_through_declared") is not True)
              or ("anti_islanding_declared" in c
                  and c.get("anti_islanding_declared") is not True))]
        if units_is_list else None
    )
    capacities_complete = (
        units_is_list
        and all(isinstance(c, dict) and "capacity_kw" in c
                for c in unit_rows)
    )
    der_total_kw = (
        sum(c["capacity_kw"] for c in unit_rows
            if isinstance(c, dict) and "capacity_kw" in c)
        if capacities_complete else None
    )
    hosting_margin_kw = (
        hosting_kw - der_total_kw
        if has_hosting and der_total_kw is not None else None
    )

    loops_without_budget = (
        [_row_name(c, "loop_id") for c in loop_rows
         if isinstance(c, dict)
         and "latency_budget_declared" in c
         and c.get("latency_budget_declared") is not True]
        if loops_is_list else None
    )
    loops_with_invalid_tier = (
        [_row_name(c, "loop_id") for c in loop_rows
         if isinstance(c, dict)
         and "latency_tier" in c
         and c.get("latency_tier") not in LATENCY_TIERS]
        if loops_is_list else None
    )
    loops_unjustified_shared = (
        [_row_name(c, "loop_id") for c in loop_rows
         if isinstance(c, dict)
         and c.get("shares_path_with_other_tiers") is True
         and "tier_mixing_justification_recorded" in c
         and c.get("tier_mixing_justification_recorded") is not True]
        if loops_is_list else None
    )
    duplicate_loop_ids = (
        _duplicates(loop_rows, "loop_id") if loops_is_list else None
    )

    # ---- Section 1: layered_architecture_and_standards (skill
    #      Method 1 "Layer the architecture" — primary equipment
    #      -> protection & control -> communications -> platforms
    #      -> programs & markets, with a single-line + comms
    #      diagram pair; Method 2 "Standards map" — IEEE 1547,
    #      IEC 61850, IEEE 2030.5 / OpenADR, CIM, clause-level
    #      citation where claims matter) ----
    _bool_check(results, "layered_architecture_and_standards",
                "sg_single_line_diagram_recorded", manifest,
                ("architecture", "single_line_diagram_recorded"),
                "architecture: a single-line diagram is recorded "
                "for the declared design")
    _bool_check(results, "layered_architecture_and_standards",
                "sg_comms_diagram_paired_with_single_line", manifest,
                ("architecture", "comms_diagram_paired"),
                "architecture: a communications diagram is paired "
                "with the single-line diagram")
    _bool_check(results, "layered_architecture_and_standards",
                "sg_five_layer_architecture_mapped", manifest,
                ("architecture", "five_layers_mapped"),
                "architecture: all five layers are mapped — primary "
                "equipment, protection & control, communications, "
                "platforms, programs & markets")
    _bool_check(results, "layered_architecture_and_standards",
                "sg_ieee_1547_interconnection_standard_cited", manifest,
                ("architecture", "ieee_1547_cited"),
                "standards map: IEEE 1547 (interconnection) is cited")
    _bool_check(results, "layered_architecture_and_standards",
                "sg_iec_61850_substation_standard_cited", manifest,
                ("architecture", "iec_61850_cited"),
                "standards map: IEC 61850 (substation) is cited")
    _bool_check(results, "layered_architecture_and_standards",
                "sg_der_dr_protocol_standard_cited", manifest,
                ("architecture", "der_dr_protocol_cited"),
                "standards map: IEEE 2030.5 / OpenADR (DER & DR) "
                "is cited")
    _bool_check(results, "layered_architecture_and_standards",
                "sg_cim_model_standard_cited", manifest,
                ("architecture", "cim_model_cited"),
                "standards map: CIM (models) is cited")
    _bool_check(results, "layered_architecture_and_standards",
                "sg_clause_level_citation_where_claims_matter", manifest,
                ("architecture",
                 "clause_level_citations_where_claims_matter"),
                "standards map: clause-level citation is recorded "
                "where claims matter")

    # ---- Section 2: network_model_and_telemetry_points (skill
    #      Method 3 "Model before points" — network model ->
    #      telemetry point list -> control loops; every point
    #      has a purpose, units, latency class, and owner; plus
    #      the computed row checks over the declared points) ----
    _bool_check(results, "network_model_and_telemetry_points",
                "sg_network_model_from_gis_and_power_flow", manifest,
                ("network_model", "gis_power_flow_model_recorded"),
                "network model: a GIS + power-flow network model "
                "is recorded")
    _bool_check(results, "network_model_and_telemetry_points",
                "sg_point_list_derived_from_network_model", manifest,
                ("network_model", "point_list_derived_from_model"),
                "network model: the telemetry point list is "
                "derived from the network model")
    _bool_check(results, "network_model_and_telemetry_points",
                "sg_control_loops_derived_from_point_list", manifest,
                ("network_model", "control_loops_derived_from_point_list"),
                "network model: the control loops are derived "
                "from the point list")
    _check(results, "network_model_and_telemetry_points",
           "sg_telemetry_points_declared", points, points_is_list,
           points_is_list,
           "the declared record names its telemetry points — the "
           "telemetry_points list is present; an empty list "
           "declares that the record contains no telemetry points")
    attrs_present = (
        points_is_list
        and all(isinstance(c, dict)
                and all(a in c for a in POINT_ATTRS) for c in point_rows)
    )
    _check(results, "network_model_and_telemetry_points",
           "sg_every_telemetry_point_records_purpose_units_latency_class_and_owner",
           points, attrs_present,
           points_is_list
           and all(isinstance(c, dict)
                   and all(c.get(a) is True for a in POINT_ATTRS)
                   for c in point_rows),
           "telemetry points: every declared point records its "
           "purpose, units, latency class and owner — every point "
           "has a purpose, units, latency class, and owner")
    point_id_present = (
        points_is_list
        and all(isinstance(c, dict) and "point_id" in c
                for c in point_rows)
    )
    _check(results, "network_model_and_telemetry_points",
           "sg_no_telemetry_point_id_duplicated", points,
           point_id_present,
           points_is_list
           and duplicate_point_ids is not None
           and len(duplicate_point_ids) == 0,
           "telemetry points: no declared point id is owned by "
           "more than one row")

    # ---- Section 3: der_interconnection_and_protection (skill
    #      Method 4 "DER & microgrids" — hosting capacity,
    #      protection coordination under inverter dominance,
    #      ride-through, islanding/island formation, black-start
    #      needs; plus the quality gate's coordination studied
    #      across min/max DER conditions, and the computed row
    #      checks over the declared DER units, including the
    #      declared aggregate against the record's own declared
    #      hosting capacity) ----
    _bool_check(results, "der_interconnection_and_protection",
                "sg_hosting_capacity_study_recorded", manifest,
                ("der", "hosting_capacity_study_recorded"),
                "DER: a hosting-capacity study is recorded for "
                "the declared interconnection")
    _bool_check(results, "der_interconnection_and_protection",
                "sg_protection_coordination_across_min_max_der", manifest,
                ("der", "protection_coordination_min_max_der"),
                "DER: protection coordination is studied across "
                "min/max DER conditions")
    _bool_check(results, "der_interconnection_and_protection",
                "sg_inverter_dominance_protection_addressed", manifest,
                ("der", "inverter_dominance_protection_addressed"),
                "DER: protection coordination under inverter "
                "dominance is addressed")
    _bool_check(results, "der_interconnection_and_protection",
                "sg_islanding_formation_and_detection_addressed",
                manifest,
                ("der", "islanding_addressed"),
                "DER: islanding / island formation and detection "
                "are addressed")
    _bool_check(results, "der_interconnection_and_protection",
                "sg_black_start_requirement_addressed", manifest,
                ("der", "black_start_addressed"),
                "DER: black-start needs are addressed")
    _bool_check(results, "der_interconnection_and_protection",
                "sg_point_of_interconnection_recorded", manifest,
                ("der", "point_of_interconnection_recorded"),
                "DER: the point of interconnection is recorded")
    _check(results, "der_interconnection_and_protection",
           "sg_der_units_declared", units, units_is_list,
           units_is_list,
           "the declared record names its DER units — the "
           "der_units list is present; an empty list declares "
           "that the record contains no DER units")
    ride_present = (
        units_is_list
        and all(isinstance(c, dict)
                and "ride_through_declared" in c
                and "anti_islanding_declared" in c for c in unit_rows)
    )
    _check(results, "der_interconnection_and_protection",
           "sg_every_der_unit_declares_ride_through_and_anti_islanding",
           units, ride_present,
           units_is_list
           and all(isinstance(c, dict)
                   and c.get("ride_through_declared") is True
                   and c.get("anti_islanding_declared") is True
                   for c in unit_rows),
           "DER units: every declared unit declares ride-through "
           "and anti-islanding")
    hosting_present = bool(capacities_complete and has_hosting)
    _check(results, "der_interconnection_and_protection",
           "sg_der_total_capacity_within_declared_hosting_capacity",
           units, hosting_present,
           hosting_present
           and der_total_kw is not None
           and der_total_kw <= hosting_kw,
           "DER units: the declared aggregate DER capacity does "
           "not exceed the hosting capacity the record itself "
           "declares — the limit is the caller's declared study "
           "result, not a number this atom supplies")

    # ---- Section 4: latency_tiers_and_control_loops (skill
    #      Method 5 "Latency tiers" — protection (ms) vs control
    #      (s) vs analytics (min+), budgets per loop, never mix
    #      tier traffic on one path without justification; plus
    #      the quality gate's latency budget stated per control
    #      loop, as the computed row checks) ----
    _bool_check(results, "latency_tiers_and_control_loops",
                "sg_latency_tiers_distinguished", manifest,
                ("latency", "tiers_distinguished"),
                "latency: the protection / control / analytics "
                "latency tiers are distinguished in the record")
    _check(results, "latency_tiers_and_control_loops",
           "sg_control_loops_declared", loops, loops_is_list,
           loops_is_list,
           "the declared record names its control loops — the "
           "control_loops list is present; an empty list declares "
           "that the record contains no control loops")
    budget_present = (
        loops_is_list
        and all(isinstance(c, dict) and "latency_budget_declared" in c
                for c in loop_rows)
    )
    _check(results, "latency_tiers_and_control_loops",
           "sg_every_control_loop_declares_latency_budget", loops,
           budget_present,
           loops_is_list
           and all(isinstance(c, dict)
                   and c.get("latency_budget_declared") is True
                   for c in loop_rows),
           "control loops: every declared loop states a latency "
           "budget")
    tier_present = (
        loops_is_list
        and all(isinstance(c, dict) and "latency_tier" in c
                for c in loop_rows)
    )
    _check(results, "latency_tiers_and_control_loops",
           "sg_every_control_loop_declares_recognized_latency_tier",
           loops, tier_present,
           loops_is_list
           and all(isinstance(c, dict)
                   and c.get("latency_tier") in LATENCY_TIERS
                   for c in loop_rows),
           "control loops: every declared loop declares one of "
           "the skill's three latency tiers — protection, "
           "control or analytics")
    shared_present = (
        loops_is_list
        and all(isinstance(c, dict)
                and "shares_path_with_other_tiers" in c
                and (c.get("shares_path_with_other_tiers") is not True
                     or "tier_mixing_justification_recorded" in c)
                for c in loop_rows)
    )
    _check(results, "latency_tiers_and_control_loops",
           "sg_shared_path_loops_carry_tier_mixing_justification",
           loops, shared_present,
           loops_is_list
           and all(isinstance(c, dict)
                   and (c.get("shares_path_with_other_tiers") is not True
                        or c.get("tier_mixing_justification_recorded")
                        is True)
                   for c in loop_rows),
           "control loops: every loop that mixes tier traffic on "
           "one path records a justification — tier traffic is "
           "never mixed on one path without justification")
    loop_id_present = (
        loops_is_list
        and all(isinstance(c, dict) and "loop_id" in c
                for c in loop_rows)
    )
    _check(results, "latency_tiers_and_control_loops",
           "sg_no_control_loop_id_duplicated", loops, loop_id_present,
           loops_is_list
           and duplicate_loop_ids is not None
           and len(duplicate_loop_ids) == 0,
           "control loops: no declared loop id is owned by more "
           "than one row")

    # ---- Section 5: ot_cybersecurity (skill Method 6
    #      "Cybersecurity" — Purdue-style segmentation,
    #      unidirectional gateways for telemetry egress, key
    #      management, patching window realities, incident
    #      fallback to safe state; plus the quality gate's cyber
    #      posture documented against a recognized framework) ----
    _bool_check(results, "ot_cybersecurity",
                "sg_purdue_style_segmentation_documented", manifest,
                ("cyber", "purdue_segmentation_documented"),
                "cyber: Purdue-style segmentation is documented")
    _bool_check(results, "ot_cybersecurity",
                "sg_unidirectional_gateway_for_telemetry_egress",
                manifest,
                ("cyber", "unidirectional_gateway_telemetry_egress"),
                "cyber: a unidirectional gateway is used for "
                "telemetry egress")
    _bool_check(results, "ot_cybersecurity",
                "sg_cyber_key_management_documented", manifest,
                ("cyber", "key_management_documented"),
                "cyber: key management is documented")
    _bool_check(results, "ot_cybersecurity",
                "sg_patching_windows_documented", manifest,
                ("cyber", "patching_windows_documented"),
                "cyber: patching windows are documented")
    _bool_check(results, "ot_cybersecurity",
                "sg_incident_fallback_to_safe_state_documented",
                manifest,
                ("cyber", "incident_fallback_safe_state_documented"),
                "cyber: incident fallback to a safe state is "
                "documented")
    _bool_check(results, "ot_cybersecurity",
                "sg_cyber_posture_against_recognized_framework",
                manifest,
                ("cyber", "posture_against_recognized_framework"),
                "cyber: the cyber posture is documented against a "
                "recognized framework")

    # ---- Section 6: pilot_economics_and_authority (skill
    #      Method 7 "Pilot discipline" — measurable outcomes and
    #      exit criteria before deployment, staged capabilities,
    #      safe fallback specified; Method 8 "Economics &
    #      regulation" — cost stack, rate treatment, incentives,
    #      who-opens-the-breaker clarified in writing; plus the
    #      quality gates' single-line + comms architecture
    #      reviewed by a qualified P.Eng, recorded as a caller
    #      declaration, and pilot KPIs + fallback defined before
    #      energization) ----
    _bool_check(results, "pilot_economics_and_authority",
                "sg_pilot_measurable_outcomes_defined_before_deployment",
                manifest,
                ("pilot", "measurable_outcomes_before_deployment"),
                "pilot: measurable outcomes are defined before "
                "deployment")
    _bool_check(results, "pilot_economics_and_authority",
                "sg_pilot_exit_criteria_defined_before_deployment",
                manifest,
                ("pilot", "exit_criteria_before_deployment"),
                "pilot: exit criteria are defined before deployment")
    _bool_check(results, "pilot_economics_and_authority",
                "sg_pilot_capabilities_staged", manifest,
                ("pilot", "capabilities_staged"),
                "pilot: capabilities are staged")
    _bool_check(results, "pilot_economics_and_authority",
                "sg_safe_fallback_behavior_specified", manifest,
                ("pilot", "safe_fallback_specified"),
                "pilot: the safe fallback behavior is specified")
    _bool_check(results, "pilot_economics_and_authority",
                "sg_pilot_kpis_and_fallback_before_energization",
                manifest,
                ("pilot", "kpis_and_fallback_before_energization"),
                "pilot: pilot KPIs and fallback behavior are "
                "defined before energization")
    _bool_check(results, "pilot_economics_and_authority",
                "sg_cost_stack_recorded", manifest,
                ("economics", "cost_stack_recorded"),
                "economics: the cost stack is recorded")
    _bool_check(results, "pilot_economics_and_authority",
                "sg_rate_treatment_and_incentives_recorded", manifest,
                ("economics", "rate_treatment_and_incentives_recorded"),
                "economics: rate treatment and incentives are "
                "recorded")
    _bool_check(results, "pilot_economics_and_authority",
                "sg_operational_authority_who_opens_breaker_in_writing",
                manifest,
                ("economics", "operational_authority_in_writing"),
                "economics: operational authority — who opens the "
                "breaker — is clarified in writing")
    _bool_check(results, "pilot_economics_and_authority",
                "sg_architecture_reviewed_by_qualified_peng_recorded",
                manifest,
                ("review", "architecture_reviewed_by_qualified_peng"),
                "review: the single-line + communications "
                "architecture is recorded as reviewed by a "
                "qualified P.Eng — a caller declaration this atom "
                "records, never a review it performs or verifies")

    # ---- Section 7: red_lines (skill "Red lines" — no
    #      protection setting changes without a coordination
    #      study, never disable safety for demos, no flat IT/OT
    #      networks, no field changes without switching
    #      authority clarity, no vendor lock-in without data
    #      export + exit plan, no customer data without
    #      consent) ----
    _false_check(results, "red_lines",
                 "sg_no_protection_setting_change_without_coordination_study",
                 manifest,
                 ("red_lines",
                  "protection_setting_changed_without_coordination_study_present"),
                 "red line: no protection setting change without a "
                 "coordination study is present in the record")
    _false_check(results, "red_lines",
                 "sg_no_safety_disabled_for_demos", manifest,
                 ("red_lines", "safety_disabled_for_demo_present"),
                 "red line: no safety disabled for demos is "
                 "present in the record")
    _false_check(results, "red_lines",
                 "sg_no_flat_it_ot_network", manifest,
                 ("red_lines", "flat_it_ot_network_present"),
                 "red line: no flat IT/OT network is present in "
                 "the record")
    _false_check(results, "red_lines",
                 "sg_no_field_change_without_switching_authority_clarity",
                 manifest,
                 ("red_lines",
                  "field_change_without_switching_authority_clarity_present"),
                 "red line: no field change without switching "
                 "authority clarity is present in the record")
    _false_check(results, "red_lines",
                 "sg_no_vendor_lockin_without_export_and_exit_plan",
                 manifest,
                 ("red_lines",
                  "vendor_lockin_without_export_exit_plan_present"),
                 "red line: no vendor lock-in without data export "
                 "+ exit plan is present in the record")
    _false_check(results, "red_lines",
                 "sg_no_customer_data_without_consent", manifest,
                 ("red_lines", "customer_data_without_consent_present"),
                 "red line: no customer data without consent is "
                 "present in the record")

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
        verdict = "SMART_GRID_DER_DESIGN_PACK_NOT_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "SMART_GRID_DER_DESIGN_PACK_READY"

    computed_names = (
        "sg_telemetry_points_declared",
        "sg_every_telemetry_point_records_purpose_units_latency_class_and_owner",
        "sg_no_telemetry_point_id_duplicated",
        "sg_der_units_declared",
        "sg_every_der_unit_declares_ride_through_and_anti_islanding",
        "sg_der_total_capacity_within_declared_hosting_capacity",
        "sg_control_loops_declared",
        "sg_every_control_loop_declares_latency_budget",
        "sg_every_control_loop_declares_recognized_latency_tier",
        "sg_shared_path_loops_carry_tier_mixing_justification",
        "sg_no_control_loop_id_duplicated",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "smart-grid-der-design-pack",
        "atom_version": "0.1.0",
        "project": manifest.get("project"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "telemetry_points_count": points_count,
        "telemetry_points_incomplete": points_incomplete,
        "telemetry_points_complete_share": _fmt6(points_complete_share),
        "duplicate_telemetry_point_ids": duplicate_point_ids,
        "der_units_count": units_count,
        "der_units_without_ride_through_or_anti_islanding":
            units_without_ride_or_anti,
        "der_total_capacity_kw": _fmt6(der_total_kw),
        "declared_hosting_capacity_kw": _fmt6(
            hosting_kw if has_hosting else None),
        "hosting_capacity_margin_kw": _fmt6(hosting_margin_kw),
        "control_loops_count": loops_count,
        "control_loops_without_latency_budget": loops_without_budget,
        "control_loops_with_invalid_latency_tier": loops_with_invalid_tier,
        "control_loops_with_unjustified_shared_path":
            loops_unjustified_shared,
        "duplicate_control_loop_ids": duplicate_loop_ids,
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
        "SMART GRID DER DESIGN PACK",
        f"project: {verdict.get('project')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: smart_grid_der_design_pack.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "SMART_GRID_DER_DESIGN_PACK_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
