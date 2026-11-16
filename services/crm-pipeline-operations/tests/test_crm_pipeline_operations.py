import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from crm_pipeline_operations import evaluate, stamp  # noqa: E402


COMPLETE = {
    "entity": "Acme Pipeline",
    "source": {"single_system_maintained": True,
               "contacts_carry_who_what_context_minimum": True,
               "dedupe_cadence_set": True,
               "stale_contacts_flagged_not_trusted": True},
    "contact_rules": {
        "sensitivity_flags_honored": True,
        "sensitivity_flags_override_everything": True,
        "outreach_drafted_for_review_never_auto_sent": True,
        "nothing_personal_shared_beyond_purpose": True,
        "unapproved_outreach_sent": False,
        "bulk_unsolicited_outreach_sent": False,
        "personal_contacts_uploaded_to_third_parties_without_purpose_and_consent": False},
    "pipeline": {
        "stages_used": ["lead", "qualified", "proposal", "decision",
                        "won", "lost"],
        "entry_criteria_defined_for_each_stage": True,
        "exit_criteria_defined_for_each_stage": True,
        "deals_advance_on_evidence_not_optimism": True,
        "stale_threshold_days": 30,
        "deals": [
            {"stage": "lead", "value": 1000, "age_days": 5,
             "has_next_step": True, "has_next_step_date": True,
             "open": True},
            {"stage": "qualified", "value": 2000, "age_days": 10,
             "has_next_step": True, "has_next_step_date": True,
             "open": True},
            {"stage": "proposal", "value": 3000, "age_days": 12,
             "has_next_step": True, "has_next_step_date": True,
             "open": True},
            {"stage": "won", "value": 4000, "age_days": 20,
             "has_next_step": False, "has_next_step_date": False,
             "open": False},
            {"stage": "lost", "value": 500, "age_days": 25,
             "has_next_step": False, "has_next_step_date": False,
             "open": False},
        ]},
    "follow_up": {"cadence_scheduled": True,
                  "every_touch_carries_value": True,
                  "every_interaction_logged_with_what_said_promised_next": True,
                  "promises_tracked_until_delivered": True},
    "reporting": {"pipeline_reported_by_stage_and_age": True,
                  "conversion_rates_by_stage_reported": True,
                  "stuck_deal_list_maintained": True,
                  "stuck_deal_review_held_on_cadence": True,
                  "forecasts_use_honest_probabilities": True},
    "consent": {"marketing_consent_recorded": True,
                "consent_flags_current": True,
                "unsubscribe_honored_instantly": True,
                "segmentation_per_consent": True,
                "scraped_third_party_personal_data_into_crm": False},
    "win_loss": {"reasons_captured": True,
                 "reasons_include_yours_and_theirs": True,
                 "feeds_messaging_product_and_process_improvements": True},
    "minimal_data": {"only_relationship_needed_data_collected": True,
                     "retention_for_dead_leads_defined": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "CRM_PIPELINE_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 38)
        self.assertEqual(v["pipeline_stages_not_covered"], [])
        self.assertEqual(v["deal_count"], 5)
        self.assertEqual(v["open_deal_count"], 3)
        self.assertEqual(v["stale_deal_count"], 0)
        self.assertEqual(
            v["open_deals_without_next_step_or_date_count"], 0)
        self.assertEqual(v["stage_distribution"],
                         {"lead": 1, "qualified": 1, "proposal": 1,
                          "decision": 0, "won": 1, "lost": 1})
        self.assertEqual(v["computed_open_value_total"], "6000.000000")
        self.assertEqual(v["computed_pipeline_value_total"], "10500.000000")

    def test_stage_missing_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stages_used"] = ["lead", "qualified", "proposal",
                                        "decision", "won"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(v["pipeline_stages_not_covered"], ["lost"])
        self.assertEqual(
            check_status(v, "pipeline_stages_cover_stated_stages"), "fail")

    def test_empty_stages_fail_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stages_used"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(len(v["pipeline_stages_not_covered"]), 6)

    def test_missing_stages_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["pipeline"]["stages_used"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["pipeline_stages_not_covered"])

    def test_open_deal_without_next_step_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["deals"][0]["has_next_step"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(
            check_status(v, "every_open_deal_has_next_step_and_date"),
            "fail")
        self.assertEqual(
            v["open_deals_without_next_step_or_date_count"], 1)

    def test_closed_deal_without_next_step_passes(self):
        # COMPLETE already has closed rows without next steps.
        self.assertEqual(evaluate(copy.deepcopy(COMPLETE))["verdict"],
                         "CRM_PIPELINE_READY")

    def test_stale_open_deal_fails_against_declared_threshold(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["deals"][1]["age_days"] = 45
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(v["stale_deal_count"], 1)
        self.assertEqual(
            check_status(
                v, "no_open_deal_stale_beyond_declared_threshold"),
            "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_stale_closed_deal_does_not_count(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["deals"][3]["age_days"] = 90
        self.assertEqual(evaluate(m)["verdict"], "CRM_PIPELINE_READY")

    def test_age_equal_to_threshold_is_not_stale(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["deals"][0]["age_days"] = 30
        self.assertEqual(evaluate(m)["verdict"], "CRM_PIPELINE_READY")

    def test_missing_threshold_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["pipeline"]["stale_threshold_days"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["stale_deal_count"])
        self.assertEqual(
            check_status(
                v, "no_open_deal_stale_beyond_declared_threshold"),
            "missing")

    def test_unknown_deal_stage_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["deals"][0]["stage"] = "negotiation"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(
            check_status(v, "deal_stages_are_stated_stages"), "fail")

    def test_incomplete_deal_row_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["pipeline"]["deals"][0]["value"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "deal_rows_complete"), "missing")
        self.assertIsNone(v["stage_distribution"])
        self.assertIsNone(v["computed_open_value_total"])
        self.assertEqual(v["deal_count"], 5)

    def test_empty_deals_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["deals"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(check_status(v, "deal_rows_complete"), "fail")
        self.assertEqual(v["deal_count"], 0)
        self.assertIsNone(v["open_deal_count"])

    def test_missing_deals_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["pipeline"]["deals"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["deal_count"])

    def test_no_exit_criteria_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["exit_criteria_defined_for_each_stage"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["pipeline_stages_and_deals"], "fail")

    def test_single_system_not_maintained_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["source"]["single_system_maintained"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["single_source_of_truth"], "fail")

    def test_dedupe_cadence_not_set_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["source"]["dedupe_cadence_set"] = False
        self.assertEqual(evaluate(m)["verdict"], "CRM_PIPELINE_NOT_READY")

    def test_unapproved_outreach_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["contact_rules"]["unapproved_outreach_sent"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(check_status(v, "no_unapproved_outreach"), "fail")

    def test_bulk_unsolicited_outreach_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["contact_rules"]["bulk_unsolicited_outreach_sent"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["contact_rules_and_privacy"], "fail")

    def test_upload_without_consent_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["contact_rules"][
            "personal_contacts_uploaded_to_third_parties_without_purpose_and_consent"] = True
        self.assertEqual(evaluate(m)["verdict"], "CRM_PIPELINE_NOT_READY")

    def test_sensitivity_flags_not_honored_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["contact_rules"]["sensitivity_flags_honored"] = False
        self.assertEqual(evaluate(m)["verdict"], "CRM_PIPELINE_NOT_READY")

    def test_promises_not_tracked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["follow_up"]["promises_tracked_until_delivered"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(
            v["sections"]["follow_up_cadence_and_logging"], "fail")

    def test_stuck_review_not_held_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["reporting"]["stuck_deal_review_held_on_cadence"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["reporting_and_forecasts"], "fail")

    def test_scraping_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["consent"]["scraped_third_party_personal_data_into_crm"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(
            check_status(v, "no_scraping_third_party_personal_data"),
            "fail")

    def test_consent_flags_not_current_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["consent"]["consent_flags_current"] = False
        self.assertEqual(evaluate(m)["verdict"], "CRM_PIPELINE_NOT_READY")

    def test_win_loss_reasons_not_captured_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["win_loss"]["reasons_captured"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(v["sections"]["win_loss_discipline"], "fail")

    def test_retention_not_defined_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["minimal_data"]["retention_for_dead_leads_defined"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CRM_PIPELINE_NOT_READY")
        self.assertEqual(
            v["sections"]["minimal_data_and_retention"], "fail")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["consent"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["consent_and_comms"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["pipeline_stages_not_covered"])
        self.assertIsNone(v["deal_count"])
        self.assertIsNone(v["stage_distribution"])
        self.assertIsNone(v["computed_pipeline_value_total"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: CRM_PIPELINE_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["entity"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("entity", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"pipeline": "should-be-an-object"})
        self.assertIn("pipeline", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stages_used"] = "lead"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pipeline.stages_used", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stages_used"] = ["lead", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pipeline.stages_used[1]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["source"]["single_system_maintained"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("source.single_system_maintained",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stale_threshold_days"] = "30"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pipeline.stale_threshold_days", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["stale_threshold_days"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pipeline.stale_threshold_days", str(ctx.exception))

    def test_deals_as_object_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["deals"] = {"stage": "lead"}
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pipeline.deals", str(ctx.exception))

    def test_deal_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["deals"] = ["lead"]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pipeline.deals[0]", str(ctx.exception))

    def test_deal_row_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["deals"][1]["value"] = "2000"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pipeline.deals[1].value", str(ctx.exception))

    def test_deal_row_boolean_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["deals"][0]["open"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pipeline.deals[0].open", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["consent"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("consent", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
