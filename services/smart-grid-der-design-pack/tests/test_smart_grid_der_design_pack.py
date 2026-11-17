import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from smart_grid_der_design_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "project": "feeder-12-der-pilot",
    "architecture": {
        "single_line_diagram_recorded": True,
        "comms_diagram_paired": True,
        "five_layers_mapped": True,
        "ieee_1547_cited": True,
        "iec_61850_cited": True,
        "der_dr_protocol_cited": True,
        "cim_model_cited": True,
        "clause_level_citations_where_claims_matter": True},
    "network_model": {
        "gis_power_flow_model_recorded": True,
        "point_list_derived_from_model": True,
        "control_loops_derived_from_point_list": True},
    "telemetry_points": [
        {"point_id": "FDR12.VOLT.A", "purpose_recorded": True,
         "units_recorded": True, "latency_class_recorded": True,
         "owner_recorded": True},
        {"point_id": "FDR12.DER.SOC", "purpose_recorded": True,
         "units_recorded": True, "latency_class_recorded": True,
         "owner_recorded": True},
    ],
    "der": {
        "hosting_capacity_study_recorded": True,
        "hosting_capacity_kw": 900,
        "protection_coordination_min_max_der": True,
        "inverter_dominance_protection_addressed": True,
        "islanding_addressed": True,
        "black_start_addressed": True,
        "point_of_interconnection_recorded": True},
    "der_units": [
        {"unit_id": "PV-1", "capacity_kw": 400,
         "ride_through_declared": True, "anti_islanding_declared": True},
        {"unit_id": "BESS-1", "capacity_kw": 350,
         "ride_through_declared": True, "anti_islanding_declared": True},
    ],
    "latency": {"tiers_distinguished": True},
    "control_loops": [
        {"loop_id": "volt-var", "latency_tier": "control",
         "latency_budget_declared": True,
         "shares_path_with_other_tiers": False,
         "tier_mixing_justification_recorded": False},
        {"loop_id": "feeder-protection", "latency_tier": "protection",
         "latency_budget_declared": True,
         "shares_path_with_other_tiers": True,
         "tier_mixing_justification_recorded": True},
    ],
    "cyber": {
        "purdue_segmentation_documented": True,
        "unidirectional_gateway_telemetry_egress": True,
        "key_management_documented": True,
        "patching_windows_documented": True,
        "incident_fallback_safe_state_documented": True,
        "posture_against_recognized_framework": True},
    "pilot": {
        "measurable_outcomes_before_deployment": True,
        "exit_criteria_before_deployment": True,
        "capabilities_staged": True,
        "safe_fallback_specified": True,
        "kpis_and_fallback_before_energization": True},
    "economics": {
        "cost_stack_recorded": True,
        "rate_treatment_and_incentives_recorded": True,
        "operational_authority_in_writing": True},
    "review": {"architecture_reviewed_by_qualified_peng": True},
    "red_lines": {
        "protection_setting_changed_without_coordination_study_present": False,
        "safety_disabled_for_demo_present": False,
        "flat_it_ot_network_present": False,
        "field_change_without_switching_authority_clarity_present": False,
        "vendor_lockin_without_export_exit_plan_present": False,
        "customer_data_without_consent_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "SMART_GRID_DER_DESIGN_PACK_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 50)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["telemetry_points_count"], 2)
        self.assertEqual(v["telemetry_points_incomplete"], [])
        self.assertEqual(v["telemetry_points_complete_share"], "1.000000")
        self.assertEqual(v["duplicate_telemetry_point_ids"], [])
        self.assertEqual(v["der_units_count"], 2)
        self.assertEqual(
            v["der_units_without_ride_through_or_anti_islanding"], [])
        self.assertEqual(v["der_total_capacity_kw"], "750.000000")
        self.assertEqual(v["declared_hosting_capacity_kw"], "900.000000")
        self.assertEqual(v["hosting_capacity_margin_kw"], "150.000000")
        self.assertEqual(v["control_loops_count"], 2)
        self.assertEqual(v["control_loops_without_latency_budget"], [])
        self.assertEqual(v["control_loops_with_invalid_latency_tier"], [])
        self.assertEqual(
            v["control_loops_with_unjustified_shared_path"], [])
        self.assertEqual(v["duplicate_control_loop_ids"], [])

    def test_empty_lists_are_valid_declarations(self):
        m = copy.deepcopy(COMPLETE)
        m["telemetry_points"] = []
        m["der_units"] = []
        m["control_loops"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SMART_GRID_DER_DESIGN_PACK_READY")
        self.assertEqual(v["telemetry_points_count"], 0)
        self.assertIsNone(v["telemetry_points_complete_share"])
        self.assertEqual(v["der_total_capacity_kw"], "0.000000")
        self.assertEqual(v["hosting_capacity_margin_kw"], "900.000000")
        self.assertEqual(
            check_status(v, "sg_telemetry_points_declared"), "pass")
        self.assertEqual(
            check_status(
                v, "sg_der_total_capacity_within_declared_hosting_capacity"),
            "pass")

    def test_missing_single_line_diagram_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["architecture"]["single_line_diagram_recorded"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "SMART_GRID_DER_DESIGN_PACK_NOT_READY")
        self.assertEqual(
            v["sections"]["layered_architecture_and_standards"], "fail")
        self.assertEqual(
            check_status(v, "sg_single_line_diagram_recorded"), "fail")

    def test_no_ieee_1547_citation_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["architecture"]["ieee_1547_cited"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "sg_ieee_1547_interconnection_standard_cited"),
            "fail")

    def test_point_without_owner_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["telemetry_points"][1]["owner_recorded"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "SMART_GRID_DER_DESIGN_PACK_NOT_READY")
        self.assertEqual(
            check_status(
                v,
                "sg_every_telemetry_point_records_purpose_units_latency_class_and_owner"),
            "fail")
        self.assertEqual(v["telemetry_points_incomplete"], ["FDR12.DER.SOC"])
        self.assertEqual(v["telemetry_points_complete_share"], "0.500000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_point_missing_attribute_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["telemetry_points"][0]["units_recorded"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "sg_every_telemetry_point_records_purpose_units_latency_class_and_owner"),
            "missing")
        self.assertEqual(v["telemetry_points_incomplete"], [])

    def test_duplicate_point_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["telemetry_points"][1]["point_id"] = "FDR12.VOLT.A"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "sg_no_telemetry_point_id_duplicated"), "fail")
        self.assertEqual(v["duplicate_telemetry_point_ids"],
                         ["FDR12.VOLT.A"])

    def test_absent_telemetry_points_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["telemetry_points"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "sg_telemetry_points_declared"), "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["telemetry_points_count"])
        self.assertIsNone(v["telemetry_points_incomplete"])
        self.assertIsNone(v["duplicate_telemetry_point_ids"])

    def test_der_total_over_declared_hosting_capacity_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["der_units"][1]["capacity_kw"] = 600
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "SMART_GRID_DER_DESIGN_PACK_NOT_READY")
        self.assertEqual(
            check_status(
                v, "sg_der_total_capacity_within_declared_hosting_capacity"),
            "fail")
        self.assertEqual(v["der_total_capacity_kw"], "1000.000000")
        self.assertEqual(v["hosting_capacity_margin_kw"], "-100.000000")

    def test_der_total_equal_to_hosting_capacity_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["der_units"][1]["capacity_kw"] = 500
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "sg_der_total_capacity_within_declared_hosting_capacity"),
            "pass")
        self.assertEqual(v["hosting_capacity_margin_kw"], "0.000000")

    def test_unit_without_anti_islanding_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["der_units"][0]["anti_islanding_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "sg_every_der_unit_declares_ride_through_and_anti_islanding"),
            "fail")
        self.assertEqual(
            v["der_units_without_ride_through_or_anti_islanding"], ["PV-1"])

    def test_unit_missing_capacity_is_missing_for_hosting_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["der_units"][0]["capacity_kw"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "sg_der_total_capacity_within_declared_hosting_capacity"),
            "missing")
        self.assertIsNone(v["der_total_capacity_kw"])
        self.assertIsNone(v["hosting_capacity_margin_kw"])
        self.assertEqual(v["declared_hosting_capacity_kw"], "900.000000")

    def test_absent_hosting_capacity_is_missing_for_hosting_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["der"]["hosting_capacity_kw"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "sg_der_total_capacity_within_declared_hosting_capacity"),
            "missing")
        self.assertEqual(v["der_total_capacity_kw"], "750.000000")
        self.assertIsNone(v["declared_hosting_capacity_kw"])
        self.assertIsNone(v["hosting_capacity_margin_kw"])

    def test_no_coordination_across_min_max_der_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["der"]["protection_coordination_min_max_der"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["der_interconnection_and_protection"], "fail")

    def test_loop_without_budget_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["control_loops"][0]["latency_budget_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "sg_every_control_loop_declares_latency_budget"), "fail")
        self.assertEqual(v["control_loops_without_latency_budget"],
                         ["volt-var"])

    def test_loop_with_unrecognized_tier_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["control_loops"][0]["latency_tier"] = "real-time-ish"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "sg_every_control_loop_declares_recognized_latency_tier"),
            "fail")
        self.assertEqual(v["control_loops_with_invalid_latency_tier"],
                         ["volt-var"])

    def test_shared_path_without_justification_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["control_loops"][1]["tier_mixing_justification_recorded"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "sg_shared_path_loops_carry_tier_mixing_justification"),
            "fail")
        self.assertEqual(
            v["control_loops_with_unjustified_shared_path"],
            ["feeder-protection"])

    def test_shared_path_missing_justification_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["control_loops"][1]["tier_mixing_justification_recorded"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "sg_shared_path_loops_carry_tier_mixing_justification"),
            "missing")
        self.assertEqual(
            v["control_loops_with_unjustified_shared_path"], [])

    def test_unshared_path_needs_no_justification(self):
        m = copy.deepcopy(COMPLETE)
        del m["control_loops"][0]["tier_mixing_justification_recorded"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "sg_shared_path_loops_carry_tier_mixing_justification"),
            "pass")

    def test_duplicate_loop_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["control_loops"][1]["loop_id"] = "volt-var"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "sg_no_control_loop_id_duplicated"), "fail")
        self.assertEqual(v["duplicate_control_loop_ids"], ["volt-var"])

    def test_flat_it_ot_network_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["flat_it_ot_network_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "sg_no_flat_it_ot_network"), "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"],
                         "SMART_GRID_DER_DESIGN_PACK_NOT_READY")

    def test_protection_change_without_study_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "protection_setting_changed_without_coordination_study_present"
        ] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "sg_no_protection_setting_change_without_coordination_study"),
            "fail")

    def test_customer_data_without_consent_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["customer_data_without_consent_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m), "sg_no_customer_data_without_consent"), "fail")

    def test_no_purdue_segmentation_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["cyber"]["purdue_segmentation_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["ot_cybersecurity"], "fail")

    def test_no_operational_authority_in_writing_fails_section6(self):
        m = copy.deepcopy(COMPLETE)
        m["economics"]["operational_authority_in_writing"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["pilot_economics_and_authority"], "fail")
        self.assertEqual(
            check_status(
                v,
                "sg_operational_authority_who_opens_breaker_in_writing"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["cyber"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["ot_cybersecurity"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["telemetry_points_count"])
        self.assertIsNone(v["der_units_count"])
        self.assertIsNone(v["der_total_capacity_kw"])
        self.assertIsNone(v["declared_hosting_capacity_kw"])
        self.assertIsNone(v["hosting_capacity_margin_kw"])
        self.assertIsNone(v["control_loops_count"])
        self.assertIsNone(v["duplicate_control_loop_ids"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(
            "VERDICT: SMART_GRID_DER_DESIGN_PACK_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["project"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("project", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"architecture": "should-be-an-object"})
        self.assertIn("architecture", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"der_units": {"unit_id": "PV-1"}})
        self.assertIn("der_units", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"telemetry_points": ["FDR12.VOLT.A"]})
        self.assertIn("telemetry_points[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["cyber"]["key_management_documented"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("cyber.key_management_documented", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["der"]["hosting_capacity_kw"] = "900"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("der.hosting_capacity_kw", str(ctx.exception))

    def test_number_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["der_units"][0]["capacity_kw"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("der_units[0].capacity_kw", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["control_loops"][0]["latency_tier"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("control_loops[0].latency_tier", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pilot"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("pilot", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
