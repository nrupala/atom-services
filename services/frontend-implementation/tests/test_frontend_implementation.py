import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from frontend_implementation import evaluate, stamp  # noqa: E402

COMPLETE = {
    "project": "storefront-ui",
    "structure": {"semantic_html_first": True,
                  "small_single_responsibility_components": True,
                  "data_down_events_up": True,
                  "god_components_present": False,
                  "follows_project_stack_and_styles": True,
                  "uses_design_tokens": True},
    "framework": {"new_framework_introduced": False},
    "data_views": [
        {"name": "product-list", "loading_implemented": True,
         "empty_implemented": True, "error_implemented": True,
         "success_implemented": True},
        {"name": "cart", "loading_implemented": True,
         "empty_implemented": True, "error_implemented": True,
         "success_implemented": True},
        {"name": "account", "loading_implemented": True,
         "empty_implemented": True, "error_implemented": True,
         "success_implemented": True},
    ],
    "interactions": {"buttons_disabled_while_submitting": True,
                     "dead_controls_present": False,
                     "silent_failures_present": False},
    "data_layer": {"single_small_client_per_app": True,
                   "retries_with_backoff_for_transient_errors": True,
                   "whole_screen_blocked_by_single_widget_present": False},
    "verification": {"state_matrix_documented": True,
                     "smoke_tests_for_key_flows": True,
                     "keyboard_only_primary_journey_passed": True},
    "responsive": {"fluid_grids_used": True, "wrap_safe_text": True,
                   "stable_dimensions": True,
                   "widths_verified_360_to_desktop": True,
                   "overflow_present": False, "overlap_present": False,
                   "has_fixed_bars": True,
                   "nothing_hidden_behind_fixed_bars": True},
    "accessibility": {"labels_on_all_fields": True,
                      "logical_focus_order": True,
                      "aria_live_for_async_results": True,
                      "fully_keyboard_operable": True},
    "performance": {"budget_defined_before_build": True,
                    "lazy_load_below_fold": True,
                    "layout_shift_avoided": True,
                    "static_assets_cached": True,
                    "budget_checked_bundle_and_first_paint": True,
                    "budget_checked_on_slow_throttle": True},
    "errors": {"human_readable_messages_in_ui": True,
               "details_sent_to_logs_not_ui": True,
               "console_spam_present": False},
    "security": {"secrets_in_frontend_code_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "FRONTEND_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 39)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["data_views_count"], 3)
        self.assertEqual(v["data_views_without_complete_states"], [])
        self.assertEqual(v["state_coverage"], "1.000000")

    def test_non_semantic_html_fails_structure_section(self):
        m = copy.deepcopy(COMPLETE)
        m["structure"]["semantic_html_first"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FRONTEND_NOT_SOUND")
        self.assertEqual(v["sections"]["structure_and_components"], "fail")

    def test_god_components_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["structure"]["god_components_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_god_components"), "fail")
        self.assertEqual(v["verdict"], "FRONTEND_NOT_SOUND")

    def test_new_framework_without_adr_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["framework"] = {"new_framework_introduced": True,
                          "adr_recorded": False}
        v = evaluate(m)
        self.assertEqual(check_status(v, "new_framework_has_adr"), "fail")
        self.assertEqual(v["verdict"], "FRONTEND_NOT_SOUND")

    def test_new_framework_with_adr_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["framework"] = {"new_framework_introduced": True,
                          "adr_recorded": True}
        self.assertEqual(evaluate(m)["verdict"], "FRONTEND_SOUND")

    def test_new_framework_missing_adr_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["framework"] = {"new_framework_introduced": True}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "new_framework_has_adr"), "missing")

    def test_no_new_framework_passes_adr_check_as_na(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(check_status(v, "new_framework_has_adr"), "pass")

    def test_view_missing_a_state_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["data_views"][1]["empty_implemented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FRONTEND_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_data_view_has_all_four_states"), "fail")
        self.assertEqual(v["data_views_without_complete_states"], ["cart"])
        self.assertEqual(v["state_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_view_missing_state_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["data_views"][0]["error_implemented"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_data_view_has_all_four_states"), "missing")
        self.assertEqual(v["data_views_without_complete_states"], [])

    def test_empty_data_views_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["data_views"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "data_views_declared"), "fail")
        self.assertEqual(v["data_views_count"], 0)
        self.assertIsNone(v["state_coverage"])

    def test_dead_controls_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["interactions"]["dead_controls_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_dead_controls"), "fail")
        self.assertEqual(v["verdict"], "FRONTEND_NOT_SOUND")

    def test_silent_failures_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["interactions"]["silent_failures_present"] = True
        self.assertEqual(evaluate(m)["verdict"], "FRONTEND_NOT_SOUND")

    def test_whole_screen_blocking_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["data_layer"]["whole_screen_blocked_by_single_widget_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_whole_screen_blocked_by_single_widget"),
            "fail")

    def test_no_retries_fail_data_section(self):
        m = copy.deepcopy(COMPLETE)
        m["data_layer"]["retries_with_backoff_for_transient_errors"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["states_and_data_layer"], "fail")

    def test_overflow_fails_responsive_section(self):
        m = copy.deepcopy(COMPLETE)
        m["responsive"]["overflow_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FRONTEND_NOT_SOUND")
        self.assertEqual(
            v["sections"]["responsive_and_accessibility"], "fail")
        self.assertEqual(check_status(v, "no_overflow"), "fail")

    def test_content_hidden_behind_fixed_bars_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["responsive"]["nothing_hidden_behind_fixed_bars"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "nothing_hidden_behind_fixed_bars"), "fail")

    def test_no_fixed_bars_passes_hidden_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["responsive"] = {**m["responsive"], "has_fixed_bars": False}
        del m["responsive"]["nothing_hidden_behind_fixed_bars"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FRONTEND_SOUND")
        self.assertEqual(
            check_status(v, "nothing_hidden_behind_fixed_bars"), "pass")

    def test_fixed_bars_missing_hidden_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["responsive"]["nothing_hidden_behind_fixed_bars"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "nothing_hidden_behind_fixed_bars"), "missing")

    def test_missing_labels_fail_accessibility(self):
        m = copy.deepcopy(COMPLETE)
        m["accessibility"]["labels_on_all_fields"] = False
        self.assertEqual(evaluate(m)["verdict"], "FRONTEND_NOT_SOUND")

    def test_no_aria_live_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["accessibility"]["aria_live_for_async_results"] = False
        self.assertEqual(evaluate(m)["verdict"], "FRONTEND_NOT_SOUND")

    def test_budget_not_checked_on_throttle_fails_perf_section(self):
        m = copy.deepcopy(COMPLETE)
        m["performance"]["budget_checked_on_slow_throttle"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FRONTEND_NOT_SOUND")
        self.assertEqual(v["sections"]["performance_and_errors"], "fail")

    def test_raw_error_details_in_ui_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["errors"]["details_sent_to_logs_not_ui"] = False
        self.assertEqual(evaluate(m)["verdict"], "FRONTEND_NOT_SOUND")

    def test_console_spam_fails_red_line_section(self):
        m = copy.deepcopy(COMPLETE)
        m["errors"]["console_spam_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_console_spam"), "fail")
        self.assertEqual(
            v["sections"]["verification_and_red_lines"], "fail")

    def test_secrets_in_frontend_code_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["secrets_in_frontend_code_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_secrets_in_frontend_code"), "fail")
        self.assertEqual(v["verdict"], "FRONTEND_NOT_SOUND")

    def test_keyboard_only_journey_not_passed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["verification"]["keyboard_only_primary_journey_passed"] = False
        self.assertEqual(evaluate(m)["verdict"], "FRONTEND_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["performance"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["performance_and_errors"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["data_views_count"])
        self.assertIsNone(v["data_views_without_complete_states"])
        self.assertIsNone(v["state_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: FRONTEND_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with TypeError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["project"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("project", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"structure": "should-be-an-object"})
        self.assertIn("structure", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"data_views": {"name": "cart"}})
        self.assertIn("data_views", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"data_views": ["cart"]})
        self.assertIn("data_views[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["structure"]["semantic_html_first"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("structure.semantic_html_first", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["data_views"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("data_views[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["data_views"][1]["empty_implemented"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("data_views[1].empty_implemented", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["performance"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("performance", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
