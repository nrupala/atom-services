import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from javascript_review_and_build import evaluate, stamp  # noqa: E402

COMPLETE = {
    "subject": "site-widget",
    "modules": {"esm_used_everywhere": True,
                "implicit_globals_present": False,
                "var_used_present": False,
                "const_by_default_let_when_reassigned": True,
                "strict_mode_in_effect": True,
                "jsdoc_types_for_reused_code": True},
    "async": {"async_await_with_real_error_handling": True,
              "every_promise_handled_or_explicitly_caught": True,
              "network_calls_present": True,
              "network_timeouts_via_abort_controller": True},
    "dom": {"nodes_built_with_text_content_and_create_element": True,
            "user_input_via_inner_html_present": False,
            "html_truly_needed_present": True,
            "sanitization_applied_when_html_truly_needed": True},
    "environment": {"no_dom_apis_in_node_code": True,
                    "shared_code_present": True,
                    "feature_detection_when_shared_code": True},
    "bundle": {"bundle_contents_known": True,
               "huge_dependencies_for_small_jobs_present": False,
               "optional_code_split": True},
    "files": [
        {"name": "main.js",
         "esm_module": True,
         "var_present": False,
         "unhandled_promise_present": False,
         "inner_html_with_user_input_present": False},
        {"name": "api.js",
         "esm_module": True,
         "var_present": False,
         "unhandled_promise_present": False,
         "inner_html_with_user_input_present": False},
        {"name": "widget.js",
         "esm_module": True,
         "var_present": False,
         "unhandled_promise_present": False,
         "inner_html_with_user_input_present": False},
    ],
    "tests": {"pure_logic_unit_tested": True,
              "ui_present": True,
              "manual_smoke_for_ui": True,
              "logic_extracted_from_event_handlers_and_tested": True},
    "red_lines": {
        "eval_or_function_on_untrusted_input_present": False,
        "secrets_in_client_side_code_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "JAVASCRIPT_REVIEW_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 27)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["files_count"], 3)
        self.assertEqual(v["files_without_esm"], [])
        self.assertEqual(v["esm_coverage"], "1.000000")
        self.assertEqual(v["files_using_var"], [])
        self.assertEqual(v["files_with_unhandled_promises"], [])
        self.assertEqual(v["files_injecting_user_input_via_inner_html"], [])

    def test_implicit_globals_fail_modules_section(self):
        m = copy.deepcopy(COMPLETE)
        m["modules"]["implicit_globals_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "JAVASCRIPT_REVIEW_NOT_SOUND")
        self.assertEqual(v["sections"]["modules_and_strictness"], "fail")
        self.assertEqual(check_status(v, "no_implicit_globals"), "fail")

    def test_var_used_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["modules"]["var_used_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "JAVASCRIPT_REVIEW_NOT_SOUND")

    def test_non_esm_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["modules"]["esm_used_everywhere"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "JAVASCRIPT_REVIEW_NOT_SOUND")

    def test_network_timeout_missing_when_calls_present_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["async"]["network_timeouts_via_abort_controller"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "network_timeouts_via_abort_controller_when_network_calls"),
            "fail")

    def test_no_network_calls_passes_timeout_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["async"] = {"async_await_with_real_error_handling": True,
                      "every_promise_handled_or_explicitly_caught": True,
                      "network_calls_present": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "JAVASCRIPT_REVIEW_SOUND")
        self.assertEqual(
            check_status(
                v,
                "network_timeouts_via_abort_controller_when_network_calls"),
            "pass")

    def test_network_target_missing_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["async"]["network_timeouts_via_abort_controller"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "network_timeouts_via_abort_controller_when_network_calls"),
            "missing")

    def test_unhandled_promise_declaration_fails_async_section(self):
        m = copy.deepcopy(COMPLETE)
        m["async"]["every_promise_handled_or_explicitly_caught"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "JAVASCRIPT_REVIEW_NOT_SOUND")
        self.assertEqual(v["sections"]["async_discipline"], "fail")

    def test_file_without_esm_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["files"][0]["esm_module"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "JAVASCRIPT_REVIEW_NOT_SOUND")
        self.assertEqual(check_status(v, "every_file_is_esm"), "fail")
        self.assertEqual(v["files_without_esm"], ["main.js"])
        self.assertEqual(v["esm_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_file_missing_esm_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["files"][0]["esm_module"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "every_file_is_esm"), "missing")
        self.assertEqual(v["files_without_esm"], [])

    def test_file_using_var_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["files"][2]["var_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_file_uses_var"), "fail")
        self.assertEqual(v["files_using_var"], ["widget.js"])

    def test_file_with_unhandled_promise_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["files"][1]["unhandled_promise_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_file_has_unhandled_promise"), "fail")
        self.assertEqual(v["files_with_unhandled_promises"], ["api.js"])

    def test_file_injecting_user_input_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["files"][1]["inner_html_with_user_input_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "no_file_injects_user_input_via_inner_html"), "fail")
        self.assertEqual(
            v["files_injecting_user_input_via_inner_html"], ["api.js"])

    def test_empty_files_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["files"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "files_declared"), "fail")
        self.assertEqual(v["files_count"], 0)
        self.assertIsNone(v["esm_coverage"])

    def test_user_input_via_inner_html_fails_dom_section(self):
        m = copy.deepcopy(COMPLETE)
        m["dom"]["user_input_via_inner_html_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_user_input_via_inner_html"), "fail")
        self.assertEqual(v["sections"]["dom_safety"], "fail")

    def test_sanitization_missing_when_html_needed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["dom"]["sanitization_applied_when_html_truly_needed"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "sanitization_when_html_truly_needed"),
            "fail")

    def test_no_html_needed_passes_sanitization_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["dom"] = {
            "nodes_built_with_text_content_and_create_element": True,
            "user_input_via_inner_html_present": False,
            "html_truly_needed_present": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "JAVASCRIPT_REVIEW_SOUND")
        self.assertEqual(
            check_status(v, "sanitization_when_html_truly_needed"),
            "pass")

    def test_dom_apis_in_node_fail_environment_section(self):
        m = copy.deepcopy(COMPLETE)
        m["environment"]["no_dom_apis_in_node_code"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "JAVASCRIPT_REVIEW_NOT_SOUND")
        self.assertEqual(
            v["sections"]["environment_and_bundle"], "fail")

    def test_feature_detection_missing_when_shared_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["environment"]["feature_detection_when_shared_code"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "feature_detection_when_shared_code"),
            "fail")

    def test_no_shared_code_passes_feature_detection_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["environment"] = {"no_dom_apis_in_node_code": True,
                            "shared_code_present": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "JAVASCRIPT_REVIEW_SOUND")
        self.assertEqual(
            check_status(v, "feature_detection_when_shared_code"),
            "pass")

    def test_huge_dependencies_fail_bundle(self):
        m = copy.deepcopy(COMPLETE)
        m["bundle"]["huge_dependencies_for_small_jobs_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_huge_dependencies_for_small_jobs"),
            "fail")

    def test_optional_not_split_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["bundle"]["optional_code_split"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "JAVASCRIPT_REVIEW_NOT_SOUND")

    def test_pure_logic_untested_fails_tests_section(self):
        m = copy.deepcopy(COMPLETE)
        m["tests"]["pure_logic_unit_tested"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "JAVASCRIPT_REVIEW_NOT_SOUND")
        self.assertEqual(v["sections"]["tests_and_red_lines"], "fail")

    def test_manual_smoke_missing_when_ui_present_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tests"]["manual_smoke_for_ui"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "manual_smoke_for_ui_when_ui_present"),
            "fail")

    def test_no_ui_passes_manual_smoke_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["tests"] = {
            "pure_logic_unit_tested": True,
            "ui_present": False,
            "logic_extracted_from_event_handlers_and_tested": True}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "JAVASCRIPT_REVIEW_SOUND")
        self.assertEqual(
            check_status(v, "manual_smoke_for_ui_when_ui_present"),
            "pass")

    def test_logic_in_handlers_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tests"]["logic_extracted_from_event_handlers_and_tested"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "JAVASCRIPT_REVIEW_NOT_SOUND")

    def test_eval_on_untrusted_input_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["eval_or_function_on_untrusted_input_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_eval_or_function_on_untrusted_input"),
            "fail")
        self.assertEqual(v["sections"]["tests_and_red_lines"], "fail")

    def test_secrets_in_client_code_fail_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["secrets_in_client_side_code_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_secrets_in_client_side_code"), "fail")
        self.assertEqual(v["verdict"], "JAVASCRIPT_REVIEW_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["async"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["async_discipline"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["files_count"])
        self.assertIsNone(v["files_without_esm"])
        self.assertIsNone(v["esm_coverage"])
        self.assertIsNone(v["files_using_var"])
        self.assertIsNone(v["files_with_unhandled_promises"])
        self.assertIsNone(v["files_injecting_user_input_via_inner_html"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: JAVASCRIPT_REVIEW_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["subject"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("subject", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"async": "should-be-an-object"})
        self.assertIn("async", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"files": {"name": "main.js"}})
        self.assertIn("files", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"files": ["main.js"]})
        self.assertIn("files[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["modules"]["strict_mode_in_effect"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("modules.strict_mode_in_effect", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["files"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("files[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["files"][1]["esm_module"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("files[1].esm_module", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["dom"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("dom", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
