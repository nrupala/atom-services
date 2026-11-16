import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from decision_ready_research_brief import evaluate, stamp  # noqa: E402

COMPLETE = {
    "brief": "vendor-selection-brief",
    "scope": {"decision_named": True,
              "questions_ranked": True,
              "timebox_declared": True,
              "timebox_respected": True,
              "enough_criteria_defined": True},
    "questions": [
        {"name": "which_vendor"},
        {"name": "what_risks"},
    ],
    "source_strategy": {
        "primary_preferred_over_secondary_and_tertiary": True},
    "sources": [
        {"name": "vendor_filing", "link": "https://example.test/filing",
         "date": "2026-11-01", "quote": "filing quote",
         "source_type": "primary", "incentives_noted": True},
        {"name": "trade_review", "link": "https://example.test/review",
         "date": "2026-11-03", "quote": "review quote",
         "source_type": "secondary", "incentives_noted": True},
    ],
    "evidence": {"notes_question_oriented": True,
                 "evidence_table_present": True,
                 "fact_estimate_opinion_separated": True,
                 "gaps_recorded": True},
    "claims": [
        {"name": "vendor_is_reliable", "kind": "fact",
         "material": True, "important": True,
         "supporting_source_names": ["vendor_filing", "trade_review"],
         "confidence_stated": True},
        {"name": "price_is_fair", "kind": "estimate",
         "material": True, "important": False,
         "supporting_source_names": ["trade_review"],
         "confidence_stated": True},
    ],
    "synthesis": {"structured_by_question": True,
                  "opposing_view_steelmanned": True,
                  "quantified_where_possible": True,
                  "confidence_stated": True,
                  "unknowns_stated_explicitly": True},
    "report": {"version": "1.0", "date": "2026-11-10",
               "open_questions_listed": True},
    "report_sections": ["bluf", "findings", "evidence", "risks",
                        "open_questions", "sources"],
    "reuse": {"notes_archived_for_reuse": True,
              "updates_via_changelog": True,
              "silent_edits_present": False},
    "tooling": {"automation_does_not_replace_verification": True,
                "ai_summaries_used": True,
                "ai_summaries_cite_sources": True,
                "ai_summaries_spot_checked": True,
                "seo_spam_and_content_farms_screened": True,
                "scraped_or_automated_data_used": True,
                "scraped_or_automated_data_quality_checked": True},
    "disclosure": {"conflicts_present": True,
                   "conflicts_disclosed": True,
                   "unsourced_claims_present": False,
                   "single_source_conclusions_on_important_facts_present": False},  # noqa: E501
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_decision_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "RESEARCH_BRIEF_DECISION_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 42)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["questions_count"], 2)
        self.assertEqual(v["sources_count"], 2)
        self.assertEqual(v["sources_without_complete_provenance"], [])
        self.assertEqual(v["source_provenance_coverage"], "1.0000")
        self.assertEqual(v["claims_count"], 2)
        self.assertEqual(v["material_claims_without_sources"], [])
        self.assertEqual(v["material_claim_source_coverage"], "1.0000")
        self.assertEqual(v["important_claims_not_triangulated"], [])
        self.assertEqual(v["important_claim_triangulation_coverage"],
                         "1.0000")

    def test_decision_not_named_fails_scoping_section(self):
        m = copy.deepcopy(COMPLETE)
        m["scope"]["decision_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RESEARCH_BRIEF_NOT_DECISION_READY")
        self.assertEqual(v["sections"]["scoping_and_sources"], "fail")

    def test_empty_questions_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["questions"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "questions_declared"), "fail")
        self.assertEqual(v["questions_count"], 0)

    def test_source_without_link_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"][1]["link"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RESEARCH_BRIEF_NOT_DECISION_READY")
        self.assertEqual(check_status(v, "every_source_has_link"), "fail")
        self.assertEqual(v["sources_without_complete_provenance"],
                         ["trade_review"])
        self.assertEqual(v["source_provenance_coverage"], "0.5000")

    def test_source_missing_date_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["sources"][0]["date"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "every_source_has_date"),
                         "missing")
        self.assertEqual(v["sources_without_complete_provenance"],
                         ["vendor_filing"])

    def test_source_incentives_not_noted_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"][0]["incentives_noted"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_source_incentives_noted"), "fail")

    def test_material_claim_without_matching_source_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][1]["supporting_source_names"] = ["undeclared_source"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RESEARCH_BRIEF_NOT_DECISION_READY")
        self.assertEqual(
            check_status(
                v, "every_material_claim_sourced_from_declared_sources"),
            "fail")
        self.assertEqual(v["material_claims_without_sources"],
                         ["price_is_fair"])
        self.assertEqual(v["material_claim_source_coverage"], "0.5000")

    def test_material_claim_missing_supporting_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["claims"][0]["supporting_source_names"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_material_claim_sourced_from_declared_sources"),
            "missing")
        # absent supporting field does not appear in the without list
        self.assertEqual(v["material_claims_without_sources"], [])

    def test_non_material_claim_needs_no_source(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][1]["material"] = False
        del m["claims"][1]["supporting_source_names"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RESEARCH_BRIEF_DECISION_READY")
        self.assertEqual(v["material_claim_source_coverage"], "1.0000")

    def test_important_claim_with_one_source_is_not_triangulated(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][0]["supporting_source_names"] = ["vendor_filing"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RESEARCH_BRIEF_NOT_DECISION_READY")
        self.assertEqual(
            check_status(
                v,
                "every_important_claim_triangulated_across_declared_sources"),  # noqa: E501
            "fail")
        self.assertEqual(v["important_claims_not_triangulated"],
                         ["vendor_is_reliable"])
        self.assertEqual(v["important_claim_triangulation_coverage"],
                         "0.0000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_duplicate_supporting_source_does_not_triangulate(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][0]["supporting_source_names"] = [
            "vendor_filing", "vendor_filing"]
        v = evaluate(m)
        self.assertEqual(v["important_claims_not_triangulated"],
                         ["vendor_is_reliable"])

    def test_claim_without_confidence_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][1]["confidence_stated"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_claim_confidence_stated"), "fail")

    def test_claim_without_kind_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][0]["kind"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_claim_kind_declared"), "fail")

    def test_opposing_view_not_steelmanned_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["synthesis"]["opposing_view_steelmanned"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RESEARCH_BRIEF_NOT_DECISION_READY")
        self.assertEqual(
            v["sections"]["synthesis_and_report_structure"], "fail")

    def test_report_sections_out_of_order_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["report_sections"] = ["findings", "bluf", "evidence", "risks",
                                "open_questions", "sources"]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "report_sections_in_skill_order"), "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_report_section_missing_fails_order_check(self):
        m = copy.deepcopy(COMPLETE)
        m["report_sections"] = ["bluf", "findings", "evidence",
                                "open_questions", "sources"]
        self.assertEqual(
            check_status(evaluate(m), "report_sections_in_skill_order"),
            "fail")

    def test_empty_report_version_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["report"]["version"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "report_version_declared"), "fail")

    def test_absent_report_date_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["report"]["date"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "report_date_declared"),
                         "missing")

    def test_silent_edits_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["reuse"]["silent_edits_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RESEARCH_BRIEF_NOT_DECISION_READY")
        self.assertEqual(
            v["sections"]["reuse_verification_and_red_lines"], "fail")

    def test_ai_summary_not_spot_checked_fails_when_used(self):
        m = copy.deepcopy(COMPLETE)
        m["tooling"]["ai_summaries_spot_checked"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "ai_summaries_spot_checked_when_used"),
            "fail")

    def test_no_ai_summaries_passes_ai_checks_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["tooling"]["ai_summaries_used"] = False
        del m["tooling"]["ai_summaries_cite_sources"]
        del m["tooling"]["ai_summaries_spot_checked"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RESEARCH_BRIEF_DECISION_READY")
        self.assertEqual(
            check_status(v, "ai_summaries_cite_sources_when_used"),
            "pass")

    def test_ai_spot_check_missing_when_used(self):
        m = copy.deepcopy(COMPLETE)
        del m["tooling"]["ai_summaries_spot_checked"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "ai_summaries_spot_checked_when_used"),
            "missing")

    def test_scraped_data_not_quality_checked_fails_when_used(self):
        m = copy.deepcopy(COMPLETE)
        m["tooling"]["scraped_or_automated_data_quality_checked"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "scraped_or_automated_data_quality_checked_when_used"),
            "fail")

    def test_no_scraped_data_passes_quality_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["tooling"]["scraped_or_automated_data_used"] = False
        del m["tooling"]["scraped_or_automated_data_quality_checked"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RESEARCH_BRIEF_DECISION_READY")

    def test_conflicts_not_disclosed_fail_when_present(self):
        m = copy.deepcopy(COMPLETE)
        m["disclosure"]["conflicts_disclosed"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "conflicts_disclosed_when_present"), "fail")

    def test_no_conflicts_passes_disclosure_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["disclosure"]["conflicts_present"] = False
        del m["disclosure"]["conflicts_disclosed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RESEARCH_BRIEF_DECISION_READY")

    def test_unsourced_claims_present_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["disclosure"]["unsourced_claims_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "RESEARCH_BRIEF_NOT_DECISION_READY")

    def test_single_source_conclusions_present_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["disclosure"][
            "single_source_conclusions_on_important_facts_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "RESEARCH_BRIEF_NOT_DECISION_READY")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["evidence"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["evidence_and_notes"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["questions_count"])
        self.assertIsNone(v["sources_count"])
        self.assertIsNone(v["sources_without_complete_provenance"])
        self.assertIsNone(v["source_provenance_coverage"])
        self.assertIsNone(v["material_claims_without_sources"])
        self.assertIsNone(v["material_claim_source_coverage"])
        self.assertIsNone(v["important_claims_not_triangulated"])
        self.assertIsNone(v["important_claim_triangulation_coverage"])

    def test_no_material_or_important_claims_ratios_are_null(self):
        m = copy.deepcopy(COMPLETE)
        for c in m["claims"]:
            c["material"] = False
            c["important"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RESEARCH_BRIEF_DECISION_READY")
        self.assertIsNone(v["material_claim_source_coverage"])
        self.assertIsNone(v["important_claim_triangulation_coverage"])
        self.assertEqual(v["material_claims_without_sources"], [])
        self.assertEqual(v["important_claims_not_triangulated"], [])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: RESEARCH_BRIEF_DECISION_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["brief"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("brief", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"scope": "should-be-an-object"})
        self.assertIn("scope", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"sources": {"name": "vendor_filing"}})
        self.assertIn("sources", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"sources": ["vendor_filing"]})
        self.assertIn("sources[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["scope"]["decision_named"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("scope.decision_named", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"][1]["link"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("sources[1].link", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"][0]["incentives_noted"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("sources[0].incentives_noted", str(ctx.exception))

    def test_supporting_names_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][0]["supporting_source_names"] = [123]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("claims[0].supporting_source_names[0]",
                      str(ctx.exception))

    def test_supporting_names_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][0]["supporting_source_names"] = "vendor_filing"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("claims[0].supporting_source_names",
                      str(ctx.exception))

    def test_report_sections_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["report_sections"] = ["bluf", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("report_sections[1]", str(ctx.exception))

    def test_claim_entry_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][0]["confidence_stated"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("claims[0].confidence_stated", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tooling"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("tooling", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
