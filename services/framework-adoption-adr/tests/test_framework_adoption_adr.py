import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from framework_adoption_adr import evaluate, stamp  # noqa: E402

FIT = {"team_familiarity_assessed": True,
       "maintenance_health_assessed": True,
       "ecosystem_assessed": True,
       "performance_assessed": True,
       "exit_cost_assessed": True}

COMPLETE = {
    "project": "storefront-rebuild",
    "framework": "framework-b",
    "adr": {"logged": True, "alternatives_stated": True,
            "exit_cost_stated": True},
    "candidates": [
        {"name": "framework-a", **FIT, "selected": False},
        {"name": "framework-b", **FIT, "selected": True},
        {"name": "framework-c", **FIT, "selected": False},
    ],
    "house_stack": {"one_framework_per_layer": True,
                    "core_logic_imports_no_framework_code": True,
                    "framework_at_edges_ports_adapters": True,
                    "is_mid_project_change": True,
                    "migration_plan_documented": True,
                    "migration_plan_approved": True},
    "versions": {"exact_versions_pinned": True,
                 "unpinned_latest_in_production_present": False,
                 "changelogs_read": True,
                 "updates_batched": True,
                 "major_upgrade_planned": True,
                 "major_upgrade_written_plan": True,
                 "major_upgrade_full_suite_run": True},
    "runtime": {"explicit_configuration_preferred": True,
                "runtime_behaviour_understood": True,
                "lifecycle_understood": True,
                "dependency_injection_understood": True,
                "caching_behaviour_understood": True,
                "deprecated_apis_on_hot_path_present": False},
    "plugins": {"plugins_present": True,
                "plugins_treated_as_dependencies": True,
                "unused_plugins_removed": True,
                "items": [
                    {"name": "plugin-x", "reviewed": True,
                     "pinned": True},
                    {"name": "plugin-y", "reviewed": True,
                     "pinned": True},
                ]},
    "deprecations": {"warnings_tracked": True,
                     "migrations_scheduled": True,
                     "zombie_code_paths_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 30)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["candidates_count"], 3)
        self.assertEqual(v["candidates_without_name"], [])
        self.assertEqual(v["candidates_without_fit_assessment"], [])
        self.assertEqual(v["fit_assessment_coverage"], "1.000000")
        self.assertEqual(v["selected_count"], 1)
        self.assertEqual(v["selected_candidate"], "framework-b")
        self.assertEqual(v["plugins_count"], 2)
        self.assertEqual(v["plugins_without_review_or_pin"], [])
        self.assertEqual(v["plugin_compliance_coverage"], "1.000000")

    def test_adr_not_logged_fails_adr_section(self):
        m = copy.deepcopy(COMPLETE)
        m["adr"]["logged"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_NOT_SOUND")
        self.assertEqual(v["sections"]["adr_and_fit"], "fail")

    def test_adr_without_exit_cost_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["adr"]["exit_cost_stated"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "adr_states_exit_cost"), "fail")
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_NOT_SOUND")

    def test_candidate_without_name_fails_and_is_counted(self):
        m = copy.deepcopy(COMPLETE)
        m["candidates"][0]["name"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_candidate_names_framework"), "fail")
        self.assertEqual(v["candidates_without_name"], [""])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_candidate_missing_name_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["candidates"][0]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_candidate_names_framework"),
            "missing")

    def test_candidate_fit_incomplete_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["candidates"][2]["ecosystem_assessed"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_candidate_fit_fully_assessed"),
            "fail")
        self.assertEqual(v["candidates_without_fit_assessment"],
                         ["framework-c"])
        self.assertEqual(v["fit_assessment_coverage"], "0.666667")

    def test_candidate_fit_field_absent_is_missing_not_named(self):
        m = copy.deepcopy(COMPLETE)
        del m["candidates"][1]["performance_assessed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_candidate_fit_fully_assessed"),
            "missing")
        self.assertEqual(v["candidates_without_fit_assessment"],
                         ["framework-b"])

    def test_empty_candidates_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["candidates"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "candidates_declared"), "fail")
        self.assertEqual(v["candidates_count"], 0)
        self.assertEqual(v["selected_count"], 0)
        self.assertIsNone(v["selected_candidate"])
        self.assertIsNone(v["fit_assessment_coverage"])

    def test_two_selected_candidates_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["candidates"][0]["selected"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "exactly_one_candidate_selected"), "fail")
        self.assertEqual(v["selected_count"], 2)
        self.assertIsNone(v["selected_candidate"])

    def test_no_selected_candidate_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["candidates"][1]["selected"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "exactly_one_candidate_selected"), "fail")
        self.assertEqual(v["selected_count"], 0)

    def test_selected_field_absent_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["candidates"][0]["selected"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "exactly_one_candidate_selected"),
            "missing")

    def test_two_frameworks_per_layer_fails_house_section(self):
        m = copy.deepcopy(COMPLETE)
        m["house_stack"]["one_framework_per_layer"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_NOT_SOUND")
        self.assertEqual(v["sections"]["house_stack_and_core"], "fail")

    def test_core_importing_framework_code_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["house_stack"]["core_logic_imports_no_framework_code"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "core_logic_imports_no_framework_code"),
            "fail")
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_NOT_SOUND")

    def test_mid_project_change_without_approved_plan_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["house_stack"]["migration_plan_approved"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "mid_project_migration_plan_approved"),
            "fail")
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_NOT_SOUND")

    def test_mid_project_change_missing_plan_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["house_stack"]["migration_plan_documented"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "mid_project_migration_plan_documented"),
            "missing")

    def test_not_mid_project_change_passes_plan_checks_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["house_stack"] = {"one_framework_per_layer": True,
                            "core_logic_imports_no_framework_code": True,
                            "framework_at_edges_ports_adapters": True,
                            "is_mid_project_change": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_SOUND")
        self.assertEqual(
            check_status(v, "mid_project_migration_plan_approved"),
            "pass")

    def test_unpinned_versions_fail_pinning_section(self):
        m = copy.deepcopy(COMPLETE)
        m["versions"]["exact_versions_pinned"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_NOT_SOUND")
        self.assertEqual(v["sections"]["pinning_and_upgrades"], "fail")

    def test_unpinned_latest_in_production_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["versions"]["unpinned_latest_in_production_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_unpinned_latest_in_production"), "fail")
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_NOT_SOUND")

    def test_major_upgrade_without_written_plan_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["versions"]["major_upgrade_written_plan"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "major_upgrade_written_plan"), "fail")
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_NOT_SOUND")

    def test_major_upgrade_without_full_suite_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["versions"]["major_upgrade_full_suite_run"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "FRAMEWORK_ADOPTION_NOT_SOUND")

    def test_no_major_upgrade_passes_upgrade_checks_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["versions"]["major_upgrade_planned"] = False
        del m["versions"]["major_upgrade_written_plan"]
        del m["versions"]["major_upgrade_full_suite_run"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_SOUND")
        self.assertEqual(
            check_status(v, "major_upgrade_written_plan"), "pass")

    def test_runtime_not_understood_fails_runtime_section(self):
        m = copy.deepcopy(COMPLETE)
        m["runtime"]["runtime_behaviour_understood"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_NOT_SOUND")
        self.assertEqual(
            v["sections"]["explicitness_and_runtime"], "fail")

    def test_deprecated_apis_on_hot_path_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["runtime"]["deprecated_apis_on_hot_path_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_deprecated_apis_on_hot_path"), "fail")
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_NOT_SOUND")

    def test_unpinned_plugin_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["plugins"]["items"][1]["pinned"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_plugin_reviewed_and_pinned"),
            "fail")
        self.assertEqual(v["plugins_without_review_or_pin"],
                         ["plugin-y"])
        self.assertEqual(v["plugin_compliance_coverage"], "0.500000")

    def test_plugin_missing_review_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["plugins"]["items"][0]["reviewed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_plugin_reviewed_and_pinned"),
            "missing")
        self.assertEqual(v["plugins_without_review_or_pin"],
                         ["plugin-x"])

    def test_plugins_present_but_no_items_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["plugins"]["items"] = []
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_plugin_reviewed_and_pinned"),
            "fail")
        self.assertEqual(v["plugins_count"], 0)
        self.assertIsNone(v["plugin_compliance_coverage"])

    def test_no_plugins_passes_plugin_checks_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["plugins"] = {"plugins_present": False,
                        "plugins_treated_as_dependencies": True}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_SOUND")
        self.assertEqual(
            check_status(v, "every_plugin_reviewed_and_pinned"),
            "pass")
        self.assertEqual(
            check_status(v, "unused_plugins_removed"), "pass")
        self.assertIsNone(v["plugins_count"])
        self.assertIsNone(v["plugins_without_review_or_pin"])
        self.assertIsNone(v["plugin_compliance_coverage"])

    def test_unused_plugins_not_removed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["plugins"]["unused_plugins_removed"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "unused_plugins_removed"), "fail")
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_NOT_SOUND")

    def test_zombie_code_paths_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["deprecations"]["zombie_code_paths_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_zombie_code_paths"), "fail")
        self.assertEqual(v["verdict"], "FRAMEWORK_ADOPTION_NOT_SOUND")

    def test_deprecation_warnings_untracked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["deprecations"]["warnings_tracked"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "FRAMEWORK_ADOPTION_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["versions"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["pinning_and_upgrades"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["candidates_count"])
        self.assertIsNone(v["candidates_without_name"])
        self.assertIsNone(v["candidates_without_fit_assessment"])
        self.assertIsNone(v["fit_assessment_coverage"])
        self.assertIsNone(v["selected_count"])
        self.assertIsNone(v["selected_candidate"])
        self.assertIsNone(v["plugins_count"])
        self.assertIsNone(v["plugins_without_review_or_pin"])
        self.assertIsNone(v["plugin_compliance_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: FRAMEWORK_ADOPTION_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with TypeError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["framework"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("framework", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"adr": "should-be-an-object"})
        self.assertIn("adr", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"candidates": {"name": "framework-a"}})
        self.assertIn("candidates", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"candidates": ["framework-a"]})
        self.assertIn("candidates[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["versions"]["exact_versions_pinned"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("versions.exact_versions_pinned",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["candidates"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("candidates[0].name", str(ctx.exception))

    def test_nested_plugin_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["plugins"]["items"][1]["pinned"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("plugins.items[1].pinned", str(ctx.exception))

    def test_plugin_items_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"plugins": {"items": {"name": "plugin-x"}}})
        self.assertIn("plugins.items", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["deprecations"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("deprecations", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
