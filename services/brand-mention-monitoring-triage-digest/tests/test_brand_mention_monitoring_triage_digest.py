import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from brand_mention_monitoring_triage_digest import evaluate, stamp  # noqa: E402

COMPLETE = {
    "brand": "AIMLDS",
    "inventory": {"names_handles_products_listed": True,
                  "misspellings_and_variants_included": True,
                  "owned_vs_third_party_distinguished": True},
    "coverage": {"sources_listed": True,
                 "blind_spots_acknowledged": True,
                 "mechanism_configured_per_source": True,
                 "cadence_defined": True,
                 "crisis_cadence_realtime": True,
                 "routine_cadence_daily_digest": True},
    "triage": {"rubric_documented": True,
               "dimensions": ["severity", "reach", "authenticity"],
               "routes": ["ignore", "monitor", "reply", "escalate",
                          "legal"],
               "escalation_path_documented": True,
               "false_positives_tracked": True},
    "response": {"authority_to_speak_defined": True,
                 "tone_rules_defined": True,
                 "dm_move_criteria_defined": True,
                 "statement_criteria_defined": True,
                 "templates_approved": True},
    "alerts": {"thresholds_defined": True,
               "dedupe_enabled": True,
               "quiet_hours_defined": True,
               "tested_after_setup": True},
    "evidence": {"archiving_required_before_response": True},
    "counts": {"total_mentions": 120,
               "actions_taken": 14,
               "actions_with_evidence_archived": 14},
    "digest": {"weekly_cadence": True,
               "includes_notable_mentions": True,
               "includes_trend_notes": True,
               "sentiment_included": True,
               "sentiment_caveats_stated": True,
               "actions_taken_listed": True,
               "signal_separated_from_noise": True},
    "conduct": {
        "astroturfing_fake_reviews_or_manufactured_engagement": False,
        "public_argument_without_policy_backing": False,
        "retaliation_against_mentioners": False,
        "private_data_of_individuals_exposed": False,
        "defamation_or_impersonation_fought_publicly_instead_of_counsel":
            False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 37)
        self.assertEqual(v["triage_dimensions_missing"], [])
        self.assertEqual(v["triage_routes_missing"], [])
        self.assertEqual(v["actions_without_archived_evidence"], 0)

    def test_blind_spots_not_acknowledged_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["coverage"]["blind_spots_acknowledged"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_NOT_READY")
        self.assertEqual(v["sections"]["inventory_and_coverage"], "fail")

    def test_variants_not_included_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["inventory"]["misspellings_and_variants_included"] = False
        self.assertEqual(evaluate(m)["verdict"], "TRIAGE_DIGEST_NOT_READY")

    def test_routine_cadence_not_daily_digest_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["coverage"]["routine_cadence_daily_digest"] = False
        self.assertEqual(evaluate(m)["verdict"], "TRIAGE_DIGEST_NOT_READY")

    def test_dimension_coverage_missing_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["dimensions"] = ["severity", "reach"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_NOT_READY")
        self.assertEqual(v["triage_dimensions_missing"], ["authenticity"])
        self.assertEqual(
            check_status(v, "all_stated_triage_dimensions_used"), "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_dimension_empty_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["dimensions"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_NOT_READY")
        self.assertEqual(v["triage_dimensions_missing"],
                         ["severity", "reach", "authenticity"])

    def test_dimension_unknown_entries_do_not_satisfy_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["dimensions"] = ["volume", "velocity"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_NOT_READY")
        self.assertEqual(len(v["triage_dimensions_missing"]), 3)

    def test_missing_dimension_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["triage"]["dimensions"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["triage_dimensions_missing"])
        self.assertIsNone(v["computed_status"])

    def test_route_coverage_missing_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["routes"] = [
            r for r in m["triage"]["routes"] if r != "legal"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_NOT_READY")
        self.assertEqual(v["triage_routes_missing"], ["legal"])
        self.assertEqual(
            check_status(v, "all_stated_triage_routes_defined"), "fail")

    def test_route_empty_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["routes"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_NOT_READY")
        self.assertEqual(v["triage_routes_missing"],
                         ["ignore", "monitor", "reply", "escalate",
                          "legal"])

    def test_missing_route_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["triage"]["routes"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["triage_routes_missing"])

    def test_escalation_path_not_documented_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["escalation_path_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_NOT_READY")
        self.assertEqual(v["sections"]["triage_rubric"], "fail")

    def test_false_positives_not_tracked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["false_positives_tracked"] = False
        self.assertEqual(evaluate(m)["verdict"], "TRIAGE_DIGEST_NOT_READY")

    def test_templates_not_approved_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["response"]["templates_approved"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_NOT_READY")
        self.assertEqual(v["sections"]["response_policy"], "fail")

    def test_authority_to_speak_not_defined_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["response"]["authority_to_speak_defined"] = False
        self.assertEqual(evaluate(m)["verdict"], "TRIAGE_DIGEST_NOT_READY")

    def test_alerts_not_tested_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["alerts"]["tested_after_setup"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_NOT_READY")
        self.assertEqual(v["sections"]["alert_hygiene_and_evidence"],
                         "fail")

    def test_evidence_not_archived_for_every_action_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["counts"]["actions_with_evidence_archived"] = 11
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_NOT_READY")
        self.assertEqual(
            check_status(v, "evidence_archived_for_every_action"), "fail")
        self.assertEqual(v["actions_without_archived_evidence"], 3)
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_actions_above_total_mentions_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["counts"]["actions_taken"] = 200
        m["counts"]["actions_with_evidence_archived"] = 200
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_NOT_READY")
        self.assertEqual(
            check_status(v, "evidence_archived_for_every_action"), "fail")

    def test_archived_above_actions_taken_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["counts"]["actions_with_evidence_archived"] = 20
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_NOT_READY")
        self.assertEqual(v["actions_without_archived_evidence"], -6)

    def test_negative_counts_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["counts"]["total_mentions"] = -1
        self.assertEqual(evaluate(m)["verdict"], "TRIAGE_DIGEST_NOT_READY")

    def test_zero_actions_with_zero_archived_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["counts"] = {"total_mentions": 40, "actions_taken": 0,
                       "actions_with_evidence_archived": 0}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_READY")
        self.assertEqual(v["actions_without_archived_evidence"], 0)

    def test_missing_counts_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["counts"]["actions_taken"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "evidence_archived_for_every_action"),
            "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["actions_without_archived_evidence"])

    def test_sentiment_without_caveats_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["digest"]["sentiment_caveats_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_NOT_READY")
        self.assertEqual(v["sections"]["digest_reporting"], "fail")

    def test_signal_not_separated_from_noise_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["digest"]["signal_separated_from_noise"] = False
        self.assertEqual(evaluate(m)["verdict"], "TRIAGE_DIGEST_NOT_READY")

    def test_astroturfing_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["conduct"][
            "astroturfing_fake_reviews_or_manufactured_engagement"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_DIGEST_NOT_READY")
        self.assertEqual(v["sections"]["red_lines"], "fail")

    def test_public_argument_without_policy_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["conduct"]["public_argument_without_policy_backing"] = True
        self.assertEqual(evaluate(m)["verdict"], "TRIAGE_DIGEST_NOT_READY")

    def test_retaliation_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["conduct"]["retaliation_against_mentioners"] = True
        self.assertEqual(evaluate(m)["verdict"], "TRIAGE_DIGEST_NOT_READY")

    def test_private_data_exposed_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["conduct"]["private_data_of_individuals_exposed"] = True
        self.assertEqual(evaluate(m)["verdict"], "TRIAGE_DIGEST_NOT_READY")

    def test_defamation_fought_publicly_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["conduct"][
            "defamation_or_impersonation_fought_publicly_instead_of_counsel"
        ] = True
        self.assertEqual(evaluate(m)["verdict"], "TRIAGE_DIGEST_NOT_READY")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["digest"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["digest_reporting"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["triage_dimensions_missing"])
        self.assertIsNone(v["triage_routes_missing"])
        self.assertIsNone(v["actions_without_archived_evidence"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: TRIAGE_DIGEST_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["brand"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("brand", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"coverage": "should-be-an-object"})
        self.assertIn("coverage", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["routes"] = "reply"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("triage.routes", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["dimensions"] = ["severity", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("triage.dimensions[1]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["coverage"]["blind_spots_acknowledged"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("coverage.blind_spots_acknowledged",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["counts"]["total_mentions"] = "120"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("counts.total_mentions", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["counts"]["actions_taken"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("counts.actions_taken", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("triage", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
