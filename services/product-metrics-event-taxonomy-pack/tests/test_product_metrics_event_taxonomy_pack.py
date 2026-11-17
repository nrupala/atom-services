import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from product_metrics_event_taxonomy_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "product": "vault-app",
    "decision": {"measurement_decision_named": True,
                 "tracking_only_for_a_named_decision": True,
                 "kpi_tree_from_north_star_to_inputs_declared": True},
    "metrics": [
        {"name": "weekly_active_vaults",
         "definition": "vaults opened at least once in 7 days",
         "kpi_tree_role": "north_star"},
        {"name": "document_scan_completed",
         "definition": "scans reaching a saved document",
         "kpi_tree_role": "input"},
        {"name": "sync_alert_opened",
         "definition": "sync alerts opened within a day",
         "kpi_tree_role": "input"},
    ],
    "taxonomy": {
        "naming_convention_adopted_for_event_names": True,
        "event_spec_written_before_feature_code": True,
        "event_spec_reviewed_before_code": True,
        "analytics_reviewed_in_pull_request": True,
        "event_spec_validated_in_staging": True},
    "events": [
        {"name": "document_scanned", "feature": "document-scan",
         "spec_version": "1.2.0"},
        {"name": "vault_unlocked", "feature": "vault-unlock",
         "spec_version": "1.0.0"},
        {"name": "sync_alert_opened", "feature": "sync-alerts",
         "spec_version": "0.9.0"},
    ],
    "properties": [
        {"event_name": "document_scanned", "name": "document_id",
         "data_type": "string", "requirement": "required",
         "contains_pii": False},
        {"event_name": "document_scanned", "name": "page_count",
         "data_type": "integer", "requirement": "optional",
         "contains_pii": False},
        {"event_name": "vault_unlocked", "name": "method",
         "data_type": "string", "requirement": "required",
         "contains_pii": False},
        {"event_name": "sync_alert_opened", "name": "alert_id",
         "data_type": "string", "requirement": "required",
         "contains_pii": False},
    ],
    "data_quality": {"capture_time_validation_planned": True,
                     "dashboard_dupe_and_drop_audit_planned": True,
                     "taxonomy_definitions_documented": True,
                     "two_definitions_of_one_metric_treated_as_bugs":
                         True},
    "privacy": {"pseudonymous_ids_only_in_events": True,
                "consent_gating_applied_where_required": True,
                "aggregation_before_export_applied_where_possible":
                    True},
    "dashboards": {
        "every_chart_carries_question_definition_owner_target": True,
        "trends_shown_over_snapshots": True,
        "dashboard_segmentation_done_thoughtfully": True,
        "dead_metrics_and_dashboards_retired": True},
    "experiments": {
        "hypothesis_and_primary_metric_recorded_before_launch": True,
        "guardrails_and_sample_size_rationale_recorded_before_launch":
            True,
        "single_change_per_experiment": True,
        "assignment_and_blinding_checks_planned": True,
        "experiment_results_written_down_including_no_effect": True},
    "feedback": {
        "qualitative_support_themes_placed_beside_quantitative_results":
            True,
        "qualitative_and_quantitative_feedback_both_feed_backlog":
            True},
    "red_lines": {"pii_in_analytics_events_present": False,
                  "unregistered_experiments_present": False,
                  "metrics_without_definitions_present": False,
                  "dark_pattern_measurement_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            v["verdict"], "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 48)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["metrics_count"], 3)
        self.assertEqual(v["events_count"], 3)
        self.assertEqual(v["properties_count"], 4)
        self.assertEqual(v["metrics_without_definition"], [])
        self.assertEqual(v["duplicate_metric_names"], [])
        self.assertEqual(v["duplicate_event_names"], [])
        self.assertEqual(v["duplicate_property_keys"], [])
        self.assertEqual(v["orphan_property_rows"], [])
        self.assertEqual(v["events_without_properties"], [])
        self.assertEqual(v["definition_coverage"], "1.000000")
        self.assertEqual(v["event_property_coverage"], "1.000000")

    def test_empty_row_lists_are_valid_declarations(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"] = []
        m["events"] = []
        m["properties"] = []
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY")
        self.assertEqual(v["metrics_count"], 0)
        self.assertEqual(v["events_count"], 0)
        self.assertEqual(v["properties_count"], 0)
        self.assertIsNone(v["definition_coverage"])
        self.assertIsNone(v["event_property_coverage"])
        self.assertEqual(check_status(v, "taxonomy_metrics_declared"), "pass")
        self.assertEqual(check_status(v, "events_declared"), "pass")
        self.assertEqual(check_status(v, "properties_declared"), "pass")
        self.assertEqual(
            check_status(v, "every_event_has_declared_properties"),
            "pass")

    def test_no_decision_named_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["decision"]["measurement_decision_named"] = False
        v = evaluate(m)
        self.assertEqual(
            v["verdict"],
            "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY")
        self.assertEqual(v["sections"]["decision_and_kpi_tree"], "fail")
        self.assertEqual(
            check_status(v, "measurement_decision_named"), "fail")

    def test_metric_without_definition_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"][0]["definition"] = ""
        v = evaluate(m)
        self.assertEqual(
            v["verdict"],
            "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY")
        self.assertEqual(
            check_status(v, "every_metric_names_definition"), "fail")
        self.assertEqual(v["metrics_without_definition"],
                         ["weekly_active_vaults"])
        self.assertEqual(v["definition_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_metric_missing_definition_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["metrics"][0]["definition"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_metric_names_definition"),
            "missing")
        self.assertEqual(v["metrics_without_definition"], [])

    def test_duplicate_metric_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"][2]["name"] = "weekly_active_vaults"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_taxonomy_metric_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_metric_names"],
                         ["weekly_active_vaults"])

    def test_metric_missing_name_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["metrics"][2]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_taxonomy_metric_name_duplicated"), "missing")
        self.assertEqual(v["duplicate_metric_names"], [])

    def test_unknown_kpi_tree_role_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"][1]["kpi_tree_role"] = "vanity"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_metric_kpi_tree_role_is_north_star_or_input"),
            "fail")
        self.assertEqual(
            check_status(v, "every_metric_names_kpi_tree_role"),
            "pass")

    def test_absent_metrics_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["metrics"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "taxonomy_metrics_declared"), "missing")
        self.assertIsNone(v["metrics_count"])
        self.assertIsNone(v["metrics_without_definition"])
        self.assertIsNone(v["duplicate_metric_names"])
        self.assertIsNone(v["definition_coverage"])

    def test_event_name_not_object_action_snake_case_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["events"][0]["name"] = "DocumentScanned"
        m["properties"][0]["event_name"] = "DocumentScanned"
        m["properties"][1]["event_name"] = "DocumentScanned"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_event_name_follows_object_action_snake_case"),
            "fail")

    def test_event_name_without_underscore_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["events"][1]["name"] = "vaultunlocked"
        m["properties"][2]["event_name"] = "vaultunlocked"
        self.assertEqual(
            check_status(
                evaluate(m),
                "every_event_name_follows_object_action_snake_case"),
            "fail")

    def test_duplicate_event_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["events"][2]["name"] = "document_scanned"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_event_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_event_names"],
                         ["document_scanned"])

    def test_event_without_feature_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["events"][0]["feature"] = ""
        self.assertEqual(
            check_status(evaluate(m), "every_event_names_its_feature"),
            "fail")

    def test_event_without_spec_version_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["events"][0]["spec_version"] = ""
        self.assertEqual(
            check_status(evaluate(m), "every_event_names_spec_version"),
            "fail")

    def test_duplicate_property_for_same_event_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["properties"][1]["name"] = "document_id"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_property_duplicated_for_same_event"),
            "fail")
        self.assertEqual(v["duplicate_property_keys"],
                         ["document_scanned.document_id"])

    def test_same_property_name_on_different_events_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["properties"][2]["name"] = "document_id"
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY")
        self.assertEqual(v["duplicate_property_keys"], [])

    def test_property_without_data_type_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["properties"][0]["data_type"] = ""
        self.assertEqual(
            check_status(
                evaluate(m), "every_property_declares_a_data_type"),
            "fail")

    def test_property_with_unknown_requirement_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["properties"][0]["requirement"] = "sometimes"
        self.assertEqual(
            check_status(
                evaluate(m),
                "every_property_marks_required_or_optional"),
            "fail")

    def test_orphan_property_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["properties"][3]["event_name"] = "checkout_completed"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_orphan_property_rows"), "fail")
        self.assertEqual(v["orphan_property_rows"], ["alert_id"])
        self.assertEqual(
            check_status(v, "every_event_has_declared_properties"),
            "fail")
        self.assertEqual(v["events_without_properties"],
                         ["sync_alert_opened"])
        self.assertEqual(v["event_property_coverage"], "0.666667")

    def test_event_without_any_property_fails_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["properties"] = [
            p for p in m["properties"]
            if p["event_name"] != "vault_unlocked"
        ]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_event_has_declared_properties"),
            "fail")
        self.assertEqual(v["events_without_properties"],
                         ["vault_unlocked"])
        self.assertEqual(v["event_property_coverage"], "0.666667")

    def test_absent_events_list_makes_orphan_check_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["events"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_orphan_property_rows"), "missing")
        self.assertIsNone(v["orphan_property_rows"])
        self.assertIsNone(v["events_without_properties"])
        self.assertIsNone(v["event_property_coverage"])

    def test_spec_written_after_code_fails_section2(self):
        m = copy.deepcopy(COMPLETE)
        m["taxonomy"]["event_spec_written_before_feature_code"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["event_taxonomy_and_spec"],
                         "fail")
        self.assertEqual(
            v["verdict"],
            "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY")

    def test_no_capture_validation_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["data_quality"]["capture_time_validation_planned"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["data_quality"], "fail")

    def test_two_definitions_not_treated_as_bugs_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["data_quality"][
            "two_definitions_of_one_metric_treated_as_bugs"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY")

    def test_property_declaring_pii_fails_privacy_section(self):
        m = copy.deepcopy(COMPLETE)
        m["properties"][0]["contains_pii"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_property_row_declares_pii"), "fail")
        self.assertEqual(v["sections"]["privacy_by_construction"],
                         "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_property_missing_pii_flag_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["properties"][0]["contains_pii"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_property_row_declares_pii"),
            "missing")

    def test_consent_gating_absent_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"]["consent_gating_applied_where_required"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["privacy_by_construction"],
                         "fail")

    def test_chart_without_owner_target_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["dashboards"][
            "every_chart_carries_question_definition_owner_target"] = \
            False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["dashboards_experiments_and_feedback"],
            "fail")

    def test_dead_metrics_not_retired_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["dashboards"]["dead_metrics_and_dashboards_retired"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY")

    def test_unrecorded_sample_size_rationale_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["experiments"][
            "guardrails_and_sample_size_rationale_recorded_before_launch"
        ] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "guardrails_and_sample_size_rationale_recorded_before_launch"),
            "fail")

    def test_no_effect_results_not_written_down_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["experiments"][
            "experiment_results_written_down_including_no_effect"] = \
            False
        self.assertEqual(evaluate(m)["verdict"],
                         "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY")

    def test_feedback_not_joined_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["feedback"][
            "qualitative_support_themes_placed_beside_quantitative_results"
        ] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY")

    def test_pii_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["pii_in_analytics_events_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_pii_in_analytics_events"), "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")

    def test_unregistered_experiment_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["unregistered_experiments_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_unregistered_experiments"), "fail")
        self.assertEqual(
            v["verdict"],
            "PRODUCT_METRICS_EVENT_TAXONOMY_PACK_NOT_READY")

    def test_metrics_without_definitions_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["metrics_without_definitions_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "no_metrics_without_definitions"),
            "fail")

    def test_dark_pattern_measurement_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["dark_pattern_measurement_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "no_dark_pattern_measurement"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["experiments"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            v["sections"]["dashboards_experiments_and_feedback"],
            "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["metrics_count"])
        self.assertIsNone(v["events_count"])
        self.assertIsNone(v["properties_count"])
        self.assertIsNone(v["metrics_without_definition"])
        self.assertIsNone(v["duplicate_metric_names"])
        self.assertIsNone(v["duplicate_event_names"])
        self.assertIsNone(v["duplicate_property_keys"])
        self.assertIsNone(v["orphan_property_rows"])
        self.assertIsNone(v["events_without_properties"])
        self.assertIsNone(v["definition_coverage"])
        self.assertIsNone(v["event_property_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(
            "VERDICT: PRODUCT_METRICS_EVENT_TAXONOMY_PACK_READY",
            stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["product"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("product", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"decision": "should-be-an-object"})
        self.assertIn("decision", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"metrics": {"name": "x"}})
        self.assertIn("metrics", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"events": ["document_scanned"]})
        self.assertIn("events[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["data_quality"]["capture_time_validation_planned"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("data_quality.capture_time_validation_planned",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("metrics[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["properties"][1]["contains_pii"] = "no"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("properties[1].contains_pii",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("privacy", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
