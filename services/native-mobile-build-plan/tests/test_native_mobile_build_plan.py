import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from native_mobile_build_plan import evaluate, stamp  # noqa: E402

COMPLETE = {
    "app": "vault-mobile",
    "constraints": {"screen_sizes_considered": True,
                    "safe_areas_considered": True,
                    "touch_targets_minimum_44px_declared": True,
                    "battery_and_thermal_considered": True,
                    "background_limits_considered": True,
                    "worst_device_in_scope_named": True},
    "platform_citizenship": {
        "back_button_and_gestures_handled": True,
        "notification_permission_timing_planned": True,
        "deep_links_planned": True,
        "lifecycle_pause_resume_testing_planned": True,
        "gestures_have_non_gesture_alternative": True},
    "permissions": [
        {"name": "camera", "feature_needing_it": "document-scan"},
        {"name": "notifications", "feature_needing_it": "sync-alerts"},
        {"name": "biometrics", "feature_needing_it": "vault-unlock"},
    ],
    "offline": {"local_store_is_truth_for_user_data": True,
                "sync_retry_and_queue_planned": True,
                "sync_states_pending_and_failed_visible": True,
                "indefinite_spinner_avoided": True,
                "conflict_rules_documented": True},
    "builds": {"toolchain_versions_pinned": True,
               "sdk_versions_pinned": True,
               "deterministic_builds_planned": True,
               "signing_keys_held_in_keystore_outside_repos": True,
               "version_code_and_name_discipline_planned": True,
               "ci_builds_the_artifact": True,
               "human_sign_off_on_release_build": True},
    "testing": {"device_matrix_includes_low_end_device": True,
                "device_matrix_includes_current_device": True,
                "largest_font_size_test_planned": True,
                "offline_tests_planned": True,
                "slow_network_tests_planned": True,
                "upgrade_tests_from_old_app_planned": True,
                "accessibility_pass_on_primary_flows_planned": True,
                "talkback_and_voiceover_in_accessibility_pass": True},
    "release": {"staged_rollout_internal_beta_prod_planned": True,
                "store_metadata_prepared": True,
                "privacy_labels_prepared": True,
                "data_safety_forms_prepared": True,
                "crash_reporting_live_before_full_rollout": True,
                "halt_rollout_rollback_plan_prepared": True},
    "privacy": {"minimum_collection_declared": True,
                "collection_disclosed_in_store_and_in_app": True,
                "analytics_without_pii_declared": True},
    "red_lines": {"secrets_in_app_bundle_present": False,
                  "permissions_without_feature_present": False,
                  "untested_upgrade_path_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "NATIVE_MOBILE_BUILD_PLAN_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 46)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["permissions_count"], 3)
        self.assertEqual(v["permissions_without_feature"], [])
        self.assertEqual(v["feature_coverage"], "1.000000")
        self.assertEqual(v["duplicate_permission_names"], [])

    def test_empty_permissions_list_is_a_valid_declaration(self):
        m = copy.deepcopy(COMPLETE)
        m["permissions"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NATIVE_MOBILE_BUILD_PLAN_READY")
        self.assertEqual(v["permissions_count"], 0)
        self.assertEqual(v["permissions_without_feature"], [])
        self.assertIsNone(v["feature_coverage"])
        self.assertEqual(v["duplicate_permission_names"], [])
        self.assertEqual(check_status(v, "permissions_declared"), "pass")
        self.assertEqual(
            check_status(v, "every_permission_names_feature_needing_it"),
            "pass")

    def test_no_worst_device_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["constraints"]["worst_device_in_scope_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "NATIVE_MOBILE_BUILD_PLAN_NOT_READY")
        self.assertEqual(
            v["sections"]["device_constraints_and_platform_citizenship"],
            "fail")
        self.assertEqual(
            check_status(v, "worst_device_in_scope_named"), "fail")

    def test_touch_targets_below_skill_floor_declaration_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["constraints"]["touch_targets_minimum_44px_declared"] = False
        self.assertEqual(
            check_status(
                evaluate(m), "touch_targets_minimum_44px_declared"),
            "fail")

    def test_gesture_only_path_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["platform_citizenship"][
            "gestures_have_non_gesture_alternative"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "NATIVE_MOBILE_BUILD_PLAN_NOT_READY")

    def test_permission_without_feature_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["permissions"][0]["feature_needing_it"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "NATIVE_MOBILE_BUILD_PLAN_NOT_READY")
        self.assertEqual(
            check_status(
                v, "every_permission_names_feature_needing_it"), "fail")
        self.assertEqual(v["permissions_without_feature"], ["camera"])
        self.assertEqual(v["feature_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_permission_missing_feature_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["permissions"][0]["feature_needing_it"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_permission_names_feature_needing_it"),
            "missing")
        self.assertEqual(v["permissions_without_feature"], [])

    def test_duplicate_permission_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["permissions"][2]["name"] = "camera"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_permission_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_permission_names"], ["camera"])

    def test_permission_missing_name_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["permissions"][2]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_permission_name_duplicated"), "missing")
        self.assertEqual(v["duplicate_permission_names"], [])

    def test_absent_permissions_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["permissions"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "permissions_declared"),
                         "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["permissions_count"])
        self.assertIsNone(v["permissions_without_feature"])
        self.assertIsNone(v["feature_coverage"])
        self.assertIsNone(v["duplicate_permission_names"])

    def test_local_store_not_truth_fails_section2(self):
        m = copy.deepcopy(COMPLETE)
        m["offline"]["local_store_is_truth_for_user_data"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "NATIVE_MOBILE_BUILD_PLAN_NOT_READY")
        self.assertEqual(v["sections"]["offline_first_and_sync"], "fail")

    def test_indefinite_spinner_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["offline"]["indefinite_spinner_avoided"] = False
        self.assertEqual(
            check_status(evaluate(m), "indefinite_spinner_avoided"),
            "fail")

    def test_conflict_rules_not_documented_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["offline"]["conflict_rules_documented"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "NATIVE_MOBILE_BUILD_PLAN_NOT_READY")

    def test_signing_keys_in_repo_plan_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["builds"][
            "signing_keys_held_in_keystore_outside_repos"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "NATIVE_MOBILE_BUILD_PLAN_NOT_READY")
        self.assertEqual(v["sections"]["builds_and_signing"], "fail")

    def test_unpinned_sdk_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["builds"]["sdk_versions_pinned"] = False
        self.assertEqual(
            check_status(evaluate(m), "sdk_versions_pinned"), "fail")

    def test_no_human_sign_off_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["builds"]["human_sign_off_on_release_build"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "NATIVE_MOBILE_BUILD_PLAN_NOT_READY")

    def test_no_low_end_device_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["device_matrix_includes_low_end_device"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "NATIVE_MOBILE_BUILD_PLAN_NOT_READY")
        self.assertEqual(v["sections"]["testing_and_accessibility"],
                         "fail")

    def test_no_upgrade_tests_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["upgrade_tests_from_old_app_planned"] = False
        self.assertEqual(
            check_status(
                evaluate(m), "upgrade_tests_from_old_app_planned"),
            "fail")

    def test_no_largest_font_test_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["largest_font_size_test_planned"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "NATIVE_MOBILE_BUILD_PLAN_NOT_READY")

    def test_crash_reporting_after_rollout_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["release"]["crash_reporting_live_before_full_rollout"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "NATIVE_MOBILE_BUILD_PLAN_NOT_READY")
        self.assertEqual(v["sections"]["release_store_and_privacy"],
                         "fail")

    def test_no_data_safety_forms_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["release"]["data_safety_forms_prepared"] = False
        self.assertEqual(
            check_status(evaluate(m), "data_safety_forms_prepared"),
            "fail")

    def test_analytics_with_pii_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"]["analytics_without_pii_declared"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "NATIVE_MOBILE_BUILD_PLAN_NOT_READY")

    def test_secrets_in_bundle_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["secrets_in_app_bundle_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_secrets_in_app_bundle"), "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")

    def test_permission_without_feature_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["permissions_without_feature_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_permissions_without_feature"), "fail")
        self.assertEqual(v["verdict"],
                         "NATIVE_MOBILE_BUILD_PLAN_NOT_READY")

    def test_untested_upgrade_path_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["untested_upgrade_path_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_untested_upgrade_path"), "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["testing"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["testing_and_accessibility"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["permissions_count"])
        self.assertIsNone(v["permissions_without_feature"])
        self.assertIsNone(v["feature_coverage"])
        self.assertIsNone(v["duplicate_permission_names"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(
            "VERDICT: NATIVE_MOBILE_BUILD_PLAN_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["app"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("app", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"constraints": "should-be-an-object"})
        self.assertIn("constraints", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"permissions": {"name": "camera"}})
        self.assertIn("permissions", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"permissions": ["camera"]})
        self.assertIn("permissions[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["offline"]["conflict_rules_documented"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("offline.conflict_rules_documented",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["permissions"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("permissions[0].name", str(ctx.exception))

    def test_nested_list_entry_string_feature_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["permissions"][1]["feature_needing_it"] = 7
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("permissions[1].feature_needing_it",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["builds"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("builds", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
