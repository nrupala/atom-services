import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from community_support_operations import evaluate, stamp  # noqa: E402


COMPLETE = {
    "entity": "Acme Support",
    "intake": {"channels_defined": True,
               "sla_targets_documented": True,
               "outage_target_hours": 1,
               "broken_target_hours": 4,
               "question_target_hours": 24,
               "messages_received": 200,
               "messages_tracked": 200,
               "support_messages_left_untracked_in_dms": False},
    "help_docs": {"faq_covers_top_recurring_questions": True,
                  "docs_updated_from_actual_tickets": True,
                  "fixes_link_doc_where_possible": True,
                  "top_theme_count": 10,
                  "themes_with_doc_or_backlog_count": 10},
    "triage": {"categories_used": ["bug", "feature", "usage", "noise"],
               "bugs_require_reproduction": True,
               "bugs_filed_in_tracker_with_evidence": True,
               "features_routed_to_backlog": True,
               "threads_total": 180,
               "threads_closed_with_resolution_or_tracked_item": 180,
               "obvious_issues_left_unanswered": False,
               "triage_then_prioritize_deliberately": True},
    "response": {
        "acknowledge_expectation_deliver_confirm_followed": True,
        "mistakes_owned_plainly": True,
        "argues_publicly_with_users": False,
        "unshipped_dates_or_features_promised": False,
        "reporter_privacy_leaked_in_public_threads": False},
    "comms": {"changelog_highlights_for_users_published": True,
              "incident_templates_ready": True,
              "incident_templates_include_honesty_rules": True,
              "incident_status_honest_no_fake_precision": True,
              "follow_up_after_resolution_sent": True},
    "community": {"code_of_conduct_exists": True,
                  "moderation_process_documented": True,
                  "moderation_applied_consistently": True,
                  "contributors_celebrated": True,
                  "spaces_spam_free_without_hostility": True},
    "measurement": {"first_response_time_measured": True,
                    "resolution_time_measured": True,
                    "recurring_themes_tracked": True,
                    "satisfaction_signals_observed": True,
                    "monthly_review_held": True,
                    "themes_feed_product": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 38)
        self.assertEqual(v["computed_tracked_share"], "1.000000")
        self.assertEqual(v["tracked_difference"], "0.000000")
        self.assertEqual(v["computed_theme_coverage_ratio"], "1.000000")
        self.assertEqual(v["theme_coverage_difference"], "0.000000")
        self.assertEqual(v["triage_categories_not_covered"], [])
        self.assertEqual(v["computed_thread_closure_share"], "1.000000")
        self.assertEqual(v["thread_closure_difference"], "0.000000")

    def test_sla_order_at_other_values_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["intake"]["outage_target_hours"] = 0.5
        m["intake"]["broken_target_hours"] = 2
        m["intake"]["question_target_hours"] = 48
        self.assertEqual(evaluate(m)["verdict"],
                         "COMMUNITY_SUPPORT_READY")

    def test_sla_order_violated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["intake"]["broken_target_hours"] = 0.5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(v["sections"]["intake_and_slas"], "fail")
        self.assertEqual(
            check_status(v, "sla_targets_respect_severity_order"), "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_sla_equal_targets_fail_order(self):
        m = copy.deepcopy(COMPLETE)
        m["intake"]["question_target_hours"] = 4
        self.assertEqual(
            check_status(evaluate(m),
                         "sla_targets_respect_severity_order"), "fail")

    def test_missing_sla_number_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["intake"]["outage_target_hours"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "sla_targets_respect_severity_order"),
            "missing")
        self.assertIsNone(v["computed_status"])

    def test_untracked_messages_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["intake"]["messages_tracked"] = 190
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(check_status(v, "every_message_tracked"), "fail")
        self.assertEqual(v["computed_tracked_share"], "0.950000")
        self.assertEqual(v["tracked_difference"], "-10.000000")

    def test_zero_received_messages_fails_tracking(self):
        m = copy.deepcopy(COMPLETE)
        m["intake"]["messages_received"] = 0
        m["intake"]["messages_tracked"] = 0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertIsNone(v["computed_tracked_share"])
        self.assertEqual(v["tracked_difference"], "0.000000")

    def test_missing_intake_count_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["intake"]["messages_tracked"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_tracked_share"])
        self.assertIsNone(v["tracked_difference"])

    def test_support_dms_untracked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["intake"]["support_messages_left_untracked_in_dms"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(
            check_status(v, "no_support_messages_left_untracked_in_dms"),
            "fail")

    def test_channels_not_defined_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["intake"]["channels_defined"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "COMMUNITY_SUPPORT_NOT_READY")

    def test_fewer_than_top_ten_themes_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["help_docs"]["top_theme_count"] = 8
        m["help_docs"]["themes_with_doc_or_backlog_count"] = 8
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(
            check_status(v, "top_ten_themes_identified"), "fail")
        self.assertEqual(
            check_status(v, "all_top_themes_have_doc_or_backlog"),
            "pass")
        self.assertEqual(v["computed_theme_coverage_ratio"], "1.000000")

    def test_uncovered_theme_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["help_docs"]["themes_with_doc_or_backlog_count"] = 9
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(
            check_status(v, "all_top_themes_have_doc_or_backlog"),
            "fail")
        self.assertEqual(v["computed_theme_coverage_ratio"], "0.900000")
        self.assertEqual(v["theme_coverage_difference"], "-1.000000")

    def test_missing_theme_count_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["help_docs"]["themes_with_doc_or_backlog_count"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_theme_coverage_ratio"])
        self.assertIsNone(v["theme_coverage_difference"])

    def test_docs_not_updated_from_tickets_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["help_docs"]["docs_updated_from_actual_tickets"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "COMMUNITY_SUPPORT_NOT_READY")

    def test_triage_category_missing_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["categories_used"] = ["bug", "feature", "usage"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(v["triage_categories_not_covered"], ["noise"])
        self.assertEqual(
            check_status(
                v, "triage_categories_cover_stated_categories"), "fail")

    def test_triage_empty_categories_fail_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["categories_used"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(v["triage_categories_not_covered"],
                         ["bug", "feature", "usage", "noise"])

    def test_triage_unknown_categories_do_not_satisfy_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["categories_used"] = ["question", "spam"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(len(v["triage_categories_not_covered"]), 4)

    def test_missing_triage_categories_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["triage"]["categories_used"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["triage_categories_not_covered"])

    def test_open_threads_fail_closure(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["threads_closed_with_resolution_or_tracked_item"] = 175
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(
            check_status(
                v,
                "every_thread_ends_with_resolution_or_tracked_item"),
            "fail")
        self.assertEqual(v["thread_closure_difference"], "-5.000000")

    def test_zero_threads_fails_closure(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["threads_total"] = 0
        m["triage"]["threads_closed_with_resolution_or_tracked_item"] = 0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertIsNone(v["computed_thread_closure_share"])

    def test_missing_thread_count_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["triage"]["threads_total"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_thread_closure_share"])
        self.assertIsNone(v["thread_closure_difference"])

    def test_bugs_without_reproduction_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["bugs_require_reproduction"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "COMMUNITY_SUPPORT_NOT_READY")

    def test_obvious_issues_unanswered_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["obvious_issues_left_unanswered"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(v["sections"]["triage_loop"], "fail")

    def test_arguing_publicly_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["response"]["argues_publicly_with_users"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(
            check_status(v, "never_argues_publicly"), "fail")

    def test_promising_unshipped_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["response"]["unshipped_dates_or_features_promised"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(
            check_status(
                v, "never_promises_unshipped_dates_or_features"), "fail")

    def test_reporter_privacy_leak_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["response"]["reporter_privacy_leaked_in_public_threads"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(v["sections"]["response_craft_and_red_lines"],
                         "fail")

    def test_mistakes_not_owned_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["response"]["mistakes_owned_plainly"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "COMMUNITY_SUPPORT_NOT_READY")

    def test_incident_templates_not_ready_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["comms"]["incident_templates_ready"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(v["sections"]["release_and_incident_comms"],
                         "fail")

    def test_incident_templates_without_honesty_rules_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["comms"]["incident_templates_include_honesty_rules"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "COMMUNITY_SUPPORT_NOT_READY")

    def test_no_follow_up_after_resolution_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["comms"]["follow_up_after_resolution_sent"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "COMMUNITY_SUPPORT_NOT_READY")

    def test_no_code_of_conduct_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["community"]["code_of_conduct_exists"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(v["sections"]["community_norms"], "fail")

    def test_moderation_not_documented_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["community"]["moderation_process_documented"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "COMMUNITY_SUPPORT_NOT_READY")

    def test_no_monthly_review_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["measurement"]["monthly_review_held"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMMUNITY_SUPPORT_NOT_READY")
        self.assertEqual(v["sections"]["measurement"], "fail")

    def test_themes_not_feeding_product_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["measurement"]["themes_feed_product"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "COMMUNITY_SUPPORT_NOT_READY")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["comms"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["release_and_incident_comms"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["computed_tracked_share"])
        self.assertIsNone(v["computed_theme_coverage_ratio"])
        self.assertIsNone(v["triage_categories_not_covered"])
        self.assertIsNone(v["computed_thread_closure_share"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: COMMUNITY_SUPPORT_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["entity"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("entity", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"intake": "should-be-an-object"})
        self.assertIn("intake", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["categories_used"] = "bug"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("triage.categories_used", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["triage"]["categories_used"] = ["bug", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("triage.categories_used[1]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["intake"]["channels_defined"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("intake.channels_defined", str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["intake"]["messages_received"] = "200"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("intake.messages_received", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["help_docs"]["top_theme_count"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("help_docs.top_theme_count", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["community"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("community", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
