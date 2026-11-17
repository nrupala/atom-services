import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from ux_flow_component_spec_pack import evaluate, stamp  # noqa: E402

ALL_STATES = ["default", "hover", "active", "disabled", "focus",
              "loading", "error"]

COMPLETE = {
    "spec_title": "checkout-flow-spec",
    "flow_design": {"flows_designed_before_implementation": True,
                    "primary_journeys_documented_as_step_diagrams": True,
                    "information_hierarchy_defined_per_screen": True,
                    "content_before_decoration": True},
    "flow_steps": [
        {"step_id": "step-1", "intent": "Review cart",
         "entry_condition": "Cart has items", "exit_condition": "Cart confirmed",
         "next_step_ids": ["step-2"]},
        {"step_id": "step-2", "intent": "Pay",
         "entry_condition": "Cart confirmed", "exit_condition": "Payment submitted",
         "next_step_ids": []},
    ],
    "design_tokens": {"tokens_single_source_declared": True,
                      "color_tokens_defined": True,
                      "type_scale_tokens_defined": True,
                      "spacing_tokens_defined": True,
                      "radius_tokens_defined": True,
                      "elevation_tokens_defined": True},
    "components": [
        {"component_id": "comp-1", "purpose": "Submit payment",
         "variants_declared": "primary, secondary", "interactive": True,
         "decorative_only": False, "states_declared": list(ALL_STATES)},
        {"component_id": "comp-2", "purpose": "Show order summary",
         "variants_declared": "compact, full", "interactive": False,
         "decorative_only": False, "states_declared": ["default"]},
    ],
    "screens": [
        {"screen_id": "scr-1", "is_data_surface": True,
         "empty_state_designed": True, "loading_state_designed": True,
         "error_state_designed": True, "contrast_check_noted": True,
         "keyboard_check_noted": True},
        {"screen_id": "scr-2", "is_data_surface": False,
         "empty_state_designed": False, "loading_state_designed": False,
         "error_state_designed": False, "contrast_check_noted": True,
         "keyboard_check_noted": True},
    ],
    "accessibility": {"wcag_target_declared": "WCAG AA",
                      "keyboard_reachable_declared": True,
                      "labels_on_all_fields_declared": True,
                      "visible_focus_declared": True,
                      "reduced_motion_respected_declared": True},
    "microcopy": {"buttons_say_what_they_do": True,
                  "errors_say_how_to_fix": True,
                  "empty_states_say_what_to_do_next": True,
                  "microcopy_reviewed_for_clarity": True},
    "critique": {"compared_against_brief": True,
                 "compared_against_domain_conventions": True,
                 "non_orienting_decoration_cut": True},
    "red_lines": {"placeholder_lorem_shipped_present": False,
                  "dead_controls_present": False,
                  "accessibility_traded_for_aesthetics_present": False,
                  "aesthetics_traded_for_accessibility_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "UX_SPEC_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 45)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["ux_flow_steps_count"], 2)
        self.assertEqual(v["ux_components_count"], 2)
        self.assertEqual(v["ux_screens_count"], 2)
        self.assertEqual(v["ux_interactive_components_count"], 1)
        self.assertEqual(v["ux_data_surfaces_count"], 1)
        self.assertEqual(v["duplicate_ux_flow_step_ids"], [])
        self.assertEqual(v["flow_step_reference_resolution_ratio"], "1.000000")
        self.assertEqual(v["interactive_component_complete_state_ratio"], "1.000000")
        self.assertEqual(v["data_surface_complete_state_ratio"], "1.000000")
        self.assertEqual(v["screen_accessibility_check_ratio"], "1.000000")

    def test_flow_not_before_implementation_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["flow_design"]["flows_designed_before_implementation"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UX_SPEC_NOT_SOUND")
        self.assertEqual(v["sections"]["ux_flows_and_hierarchy"], "fail")
        self.assertEqual(check_status(v, "ux_flow_designed_before_implementation"), "fail")

    def test_duplicate_step_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["flow_steps"][1]["step_id"] = "step-1"
        m["flow_steps"][0]["next_step_ids"] = ["step-1"]
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_ux_flow_step_id_unique"), "fail")
        self.assertEqual(v["duplicate_ux_flow_step_ids"], ["step-1"])

    def test_empty_intent_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["flow_steps"][0]["intent"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_ux_flow_step_intent_declared"), "fail")
        self.assertEqual(v["ux_flow_steps_without_intent"], ["step-1"])

    def test_empty_entry_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["flow_steps"][0]["entry_condition"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_ux_flow_step_entry_condition_declared"), "fail")
        self.assertEqual(v["ux_flow_steps_without_entry_condition"], ["step-1"])

    def test_empty_exit_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["flow_steps"][1]["exit_condition"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_ux_flow_step_exit_condition_declared"), "fail")
        self.assertEqual(v["ux_flow_steps_without_exit_condition"], ["step-2"])

    def test_unresolved_next_step_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["flow_steps"][0]["next_step_ids"] = ["step-99"]
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_ux_flow_step_next_step_reference_resolves"), "fail")
        self.assertEqual(v["ux_flow_steps_with_unresolved_next_step_references"], ["step-1"])
        self.assertEqual(v["flow_step_reference_resolution_ratio"], "0.500000")

    def test_absent_flow_steps_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["flow_steps"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "ux_flow_steps_list_declared"), "missing")
        self.assertIsNone(v["ux_flow_steps_count"])
        self.assertIsNone(v["computed_status"])

    def test_empty_components_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["components"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "ux_components_list_declared"), "fail")
        self.assertEqual(v["ux_components_count"], 0)

    def test_interactive_missing_state_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][0]["states_declared"] = ["default", "hover"]
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_interactive_ux_component_state_inventory_complete"), "fail")
        self.assertEqual(v["interactive_ux_components_with_incomplete_states"], ["comp-1"])
        self.assertEqual(v["interactive_component_complete_state_ratio"], "0.000000")

    def test_interactive_missing_states_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["components"][0]["states_declared"]
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_interactive_ux_component_state_inventory_complete"), "missing")

    def test_noninteractive_incomplete_states_passes(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(check_status(v, "every_interactive_ux_component_state_inventory_complete"), "pass")

    def test_interactive_decorative_only_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][0]["decorative_only"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_interactive_ux_component_decorative_only"), "fail")
        self.assertEqual(v["interactive_ux_components_declared_decorative_only"], ["comp-1"])

    def test_component_without_purpose_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][1]["purpose"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_ux_component_purpose_declared"), "fail")
        self.assertEqual(v["ux_components_without_purpose"], ["comp-2"])

    def test_component_without_variants_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][0]["variants_declared"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_ux_component_variants_declared"), "fail")
        self.assertEqual(v["ux_components_without_variants"], ["comp-1"])

    def test_data_surface_without_empty_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["screens"][0]["empty_state_designed"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_ux_data_surface_empty_state_designed"), "fail")
        self.assertEqual(v["ux_data_surfaces_without_empty_state"], ["scr-1"])
        self.assertEqual(v["data_surface_complete_state_ratio"], "0.000000")

    def test_non_data_surface_without_states_passes(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["sections"]["ux_data_surface_states"], "pass")

    def test_data_surface_missing_loading_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["screens"][0]["loading_state_designed"]
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_ux_data_surface_loading_state_designed"), "missing")

    def test_empty_wcag_target_fails_declaration_only(self):
        m = copy.deepcopy(COMPLETE)
        m["accessibility"]["wcag_target_declared"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(v, "ux_accessibility_wcag_target_declared"), "fail")

    def test_screen_without_contrast_check_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["screens"][1]["contrast_check_noted"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_ux_screen_contrast_check_noted"), "fail")
        self.assertEqual(v["ux_screens_without_contrast_check"], ["scr-2"])
        self.assertEqual(v["screen_accessibility_check_ratio"], "0.500000")

    def test_screen_without_keyboard_check_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["screens"][0]["keyboard_check_noted"] = False
        self.assertEqual(check_status(evaluate(m), "every_ux_screen_keyboard_check_noted"), "fail")

    def test_token_missing_fails_section2(self):
        m = copy.deepcopy(COMPLETE)
        m["design_tokens"]["color_tokens_defined"] = False
        self.assertEqual(evaluate(m)["sections"]["ux_design_tokens"], "fail")

    def test_microcopy_error_fails_section6(self):
        m = copy.deepcopy(COMPLETE)
        m["microcopy"]["errors_say_how_to_fix"] = False
        self.assertEqual(evaluate(m)["sections"]["ux_microcopy_and_critique"], "fail")

    def test_dead_controls_fail_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["dead_controls_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "UX_SPEC_NOT_SOUND")

    def test_accessibility_trade_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["accessibility_traded_for_aesthetics_present"] = True
        self.assertEqual(check_status(evaluate(m), "ux_spec_free_of_accessibility_traded_for_aesthetics"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["microcopy"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["ux_microcopy_and_critique"], "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["ux_flow_steps_count"])
        self.assertIsNone(v["flow_step_reference_resolution_ratio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: UX_SPEC_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["spec_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("spec_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"flow_design": "should-be-an-object"})
        self.assertIn("flow_design", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"flow_steps": {"step_id": "step-1"}})
        self.assertIn("flow_steps", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"components": ["comp-1"]})
        self.assertIn("components[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["microcopy"]["buttons_say_what_they_do"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("microcopy.buttons_say_what_they_do", str(ctx.exception))

    def test_string_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["flow_steps"][0]["next_step_ids"] = [42]
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("flow_steps[0].next_step_ids[0]", str(ctx.exception))

    def test_states_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][0]["states_declared"] = [42]
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("components[0].states_declared[0]", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["accessibility"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("accessibility", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
