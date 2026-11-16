import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from browser_extension_engineering import evaluate, stamp  # noqa: E402

COMPLETE = {
    "extension_name": "Reader Capture",
    "mv3": {"service_worker_background": True,
            "persistent_background_page_used": False,
            "alarms_used_instead_of_timers": True,
            "declarative_apis_used_where_possible": True,
            "remote_code_executed": False,
            "all_code_bundled": True},
    "permissions": {"only_needed_requested": True,
                    "host_patterns_narrow": True,
                    "optional_permissions_for_power_features": True,
                    "permission_list_reviewed_as_security_audit": True,
                    "overbroad_permissions_present": False,
                    "requested": ["storage", "activeTab"],
                    "justified": ["storage", "activeTab"]},
    "architecture": {
        "content_scripts_isolated_from_page_context": True,
        "message_passing_well_defined": True,
        "messages_validated_on_both_ends": True,
        "storage_scoped_sync_vs_local": True,
        "secrets_stored_in_extension_storage": False},
    "ux": {"popup_or_options_pages_provided": True,
           "logged_out_and_unavailable_states_provided": True,
           "keyboard_shortcuts_provided": True,
           "drive_by_dom_changes_without_user_intent": False},
    "privacy": {"page_data_processed_locally_by_default": True,
                "telemetry_requires_explicit_consent": True,
                "telemetry_clearly_disclosed": True,
                "privacy_disclosure_matches_behavior_tested": True,
                "browsing_data_exfiltrated": False,
                "hidden_data_collection_present": False},
    "distribution": {"store_listing_screenshots_provided": True,
                     "store_privacy_form_accurate": True,
                     "staged_rollout_planned": True,
                     "version_discipline_followed": True,
                     "firefox_mv3_differences_addressed": True,
                     "target_browsers": ["chrome", "firefox"],
                     "tested_browsers": ["chrome"],
                     "difference_documented_browsers": ["firefox"]},
    "security": {"csp_discipline_followed": True,
                 "injected_ui_sanitized": True,
                 "auto_update_via_store_only": True,
                 "eval_or_remote_scripts_used": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "EXTENSION_DESIGN_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 37)
        self.assertEqual(v["permissions_without_justification"], [])
        self.assertEqual(v["browsers_not_covered"], [])

    def test_persistent_background_page_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["mv3"]["persistent_background_page_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EXTENSION_DESIGN_DEFICIENT")
        self.assertEqual(v["sections"]["mv3_architecture"], "fail")

    def test_remote_code_executed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["mv3"]["remote_code_executed"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "EXTENSION_DESIGN_DEFICIENT")

    def test_timers_instead_of_alarms_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["mv3"]["alarms_used_instead_of_timers"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "EXTENSION_DESIGN_DEFICIENT")

    def test_unjustified_permission_fails_computed(self):
        m = copy.deepcopy(COMPLETE)
        m["permissions"]["requested"] = ["storage", "activeTab", "tabs"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EXTENSION_DESIGN_DEFICIENT")
        self.assertEqual(v["permissions_without_justification"], ["tabs"])
        self.assertEqual(
            check_status(
                v, "all_requested_permissions_justified_in_writing"),
            "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_extra_justifications_do_not_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["permissions"]["justified"] = ["storage", "activeTab", "alarms"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EXTENSION_DESIGN_SOUND")
        self.assertEqual(v["permissions_without_justification"], [])

    def test_empty_requested_permissions_passes_vacuously(self):
        m = copy.deepcopy(COMPLETE)
        m["permissions"]["requested"] = []
        m["permissions"]["justified"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EXTENSION_DESIGN_SOUND")
        self.assertEqual(v["permissions_without_justification"], [])

    def test_missing_permission_lists_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["permissions"]["justified"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["permissions_without_justification"])
        self.assertIsNone(v["computed_status"])

    def test_overbroad_permissions_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["permissions"]["overbroad_permissions_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EXTENSION_DESIGN_DEFICIENT")
        self.assertEqual(v["sections"]["least_privilege_permissions"],
                         "fail")

    def test_wide_host_patterns_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["permissions"]["host_patterns_narrow"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "EXTENSION_DESIGN_DEFICIENT")

    def test_secrets_in_storage_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["architecture"]["secrets_stored_in_extension_storage"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "EXTENSION_DESIGN_DEFICIENT")

    def test_unvalidated_messages_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["architecture"]["messages_validated_on_both_ends"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EXTENSION_DESIGN_DEFICIENT")
        self.assertEqual(v["sections"]["architecture_and_messaging"],
                         "fail")

    def test_drive_by_dom_changes_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["ux"]["drive_by_dom_changes_without_user_intent"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "EXTENSION_DESIGN_DEFICIENT")

    def test_missing_logged_out_states_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["ux"]["logged_out_and_unavailable_states_provided"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "EXTENSION_DESIGN_DEFICIENT")

    def test_browsing_data_exfiltrated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"]["browsing_data_exfiltrated"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EXTENSION_DESIGN_DEFICIENT")
        self.assertEqual(v["sections"]["privacy"], "fail")

    def test_hidden_data_collection_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"]["hidden_data_collection_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "EXTENSION_DESIGN_DEFICIENT")

    def test_telemetry_without_consent_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"]["telemetry_requires_explicit_consent"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "EXTENSION_DESIGN_DEFICIENT")

    def test_disclosure_not_tested_against_behavior_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"]["privacy_disclosure_matches_behavior_tested"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "EXTENSION_DESIGN_DEFICIENT")

    def test_uncovered_target_browser_fails_computed(self):
        m = copy.deepcopy(COMPLETE)
        m["distribution"]["target_browsers"] = ["chrome", "edge"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EXTENSION_DESIGN_DEFICIENT")
        self.assertEqual(v["browsers_not_covered"], ["edge"])
        self.assertEqual(
            check_status(
                v,
                "all_target_browsers_tested_or_differences_documented"),
            "fail")

    def test_documented_difference_covers_target_browser(self):
        m = copy.deepcopy(COMPLETE)
        m["distribution"]["target_browsers"] = ["chrome", "edge"]
        m["distribution"]["difference_documented_browsers"] = [
            "firefox", "edge"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EXTENSION_DESIGN_SOUND")
        self.assertEqual(v["browsers_not_covered"], [])

    def test_empty_target_browsers_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["distribution"]["target_browsers"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EXTENSION_DESIGN_DEFICIENT")
        self.assertEqual(v["browsers_not_covered"], [])
        self.assertEqual(
            check_status(
                v,
                "all_target_browsers_tested_or_differences_documented"),
            "fail")

    def test_missing_browser_lists_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["distribution"]["tested_browsers"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["browsers_not_covered"])

    def test_firefox_differences_not_addressed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["distribution"]["firefox_mv3_differences_addressed"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "EXTENSION_DESIGN_DEFICIENT")

    def test_inaccurate_privacy_form_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["distribution"]["store_privacy_form_accurate"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "EXTENSION_DESIGN_DEFICIENT")

    def test_eval_or_remote_scripts_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["eval_or_remote_scripts_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EXTENSION_DESIGN_DEFICIENT")
        self.assertEqual(v["sections"]["security"], "fail")

    def test_unsanitized_injected_ui_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["injected_ui_sanitized"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "EXTENSION_DESIGN_DEFICIENT")

    def test_non_store_auto_update_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["auto_update_via_store_only"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "EXTENSION_DESIGN_DEFICIENT")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["privacy"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["privacy"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["permissions_without_justification"])
        self.assertIsNone(v["browsers_not_covered"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: EXTENSION_DESIGN_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["extension_name"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("extension_name", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"mv3": "should-be-an-object"})
        self.assertIn("mv3", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["permissions"]["requested"] = "storage"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("permissions.requested", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["permissions"]["requested"] = ["storage", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("permissions.requested[1]", str(ctx.exception))

    def test_browser_list_entry_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["distribution"]["target_browsers"] = ["chrome", True]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("distribution.target_browsers[1]",
                      str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["mv3"]["service_worker_background"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("mv3.service_worker_background",
                      str(ctx.exception))

    def test_boolean_leaf_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"]["browsing_data_exfiltrated"] = 0
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("privacy.browsing_data_exfiltrated",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["permissions"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("permissions", str(ctx.exception))

    def test_null_list_entry_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["distribution"]["tested_browsers"] = [None]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("distribution.tested_browsers[0]",
                      str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
