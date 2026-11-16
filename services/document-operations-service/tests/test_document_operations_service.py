import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from document_operations_service import evaluate, stamp  # noqa: E402

COMPLETE = {
    "operation": "board-pack-revision",
    "source": {"file_format_and_home_identified": True,
               "authoritative_copy_opened": True,
               "read_in_source_order": True},
    "documents": [
        {"name": "board-pack.pdf", "output_reopened_and_checked": True},
        {"name": "board-pack-summary.docx",
         "output_reopened_and_checked": True},
    ],
    "findings": [
        {"name": "q3_cost_total", "location": "page 12",
         "quoted_exactly_before_interpretation": True},
        {"name": "headcount_cell", "location": "Sheet 'Costs' cell B14",
         "quoted_exactly_before_interpretation": True},
    ],
    "extraction": {"every_number_has_source_location": True,
                   "numbers_quoted_exactly_then_interpreted_separately": True,
                   "figure_quoted_without_location_present": False,
                   "unreadable_or_missing_sections_named": True},
    "editing": {"edits_performed": True,
                "edits_on_editable_source": True,
                "headings_tables_styles_preserved": True,
                "rewrite_requested": False,
                "tracked_structure_intact": True},
    "preservation": {
        "editable_source_saved_alongside_output": True,
        "revisable_deliverable_present": True,
        "editable_source_kept_for_revisable": True,
        "only_editable_source_overwritten_with_flattened_export_present": False},
    "conversion": {"conversion_performed": True,
                   "output_reopened_and_compared_section_by_section": True,
                   "headings_tables_lists_figures_totals_survive": True,
                   "content_loss_detected": True,
                   "loss_fixed_or_reported_plainly": True,
                   "conversion_with_dropped_content_shipped_present": False},
    "verification": {
        "output_reopened_and_checked_after_edit_or_conversion": True,
        "headings_tables_totals_match_source_and_output": True},
    "deliverable": {"shared_externally": True,
                    "send_copy_is_docx_not_markdown": True,
                    "markdown_sent_as_external_deliverable_present": False,
                    "draft_banners_comments_tracked_changes_stripped": True,
                    "send_copy_contains_draft_marks_present": False},
    "delivery": {"findings_first_in_decision_order_with_locations": True,
                 "change_list_provided": True,
                 "finished_file_in_send_format_plus_editable_source": True,
                 "loss_gap_unreadable_stated_in_delivery_note": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 32)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["documents_count"], 2)
        self.assertEqual(v["documents_without_output_verification"], [])
        self.assertEqual(v["output_verification_coverage"], "1.0000")
        self.assertEqual(v["findings_count"], 2)
        self.assertEqual(v["findings_without_location"], [])
        self.assertEqual(v["location_coverage"], "1.0000")
        self.assertEqual(v["findings_not_quoted_exactly_first"], [])
        self.assertEqual(v["exact_quote_coverage"], "1.0000")

    def test_stale_copy_fails_source_section(self):
        m = copy.deepcopy(COMPLETE)
        m["source"]["authoritative_copy_opened"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_NOT_SOUND")
        self.assertEqual(v["sections"]["source_and_extraction"], "fail")

    def test_finding_without_location_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["findings"][1]["location"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_finding_has_location_recorded"),
            "fail")
        self.assertEqual(v["findings_without_location"], ["headcount_cell"])
        self.assertEqual(v["location_coverage"], "0.5000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_finding_missing_location_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["findings"][0]["location"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_finding_has_location_recorded"),
            "missing")
        self.assertEqual(v["findings_without_location"], ["q3_cost_total"])

    def test_finding_not_quoted_exactly_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["findings"][0]["quoted_exactly_before_interpretation"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_NOT_SOUND")
        self.assertEqual(v["findings_not_quoted_exactly_first"],
                         ["q3_cost_total"])
        self.assertEqual(v["exact_quote_coverage"], "0.5000")

    def test_empty_findings_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["findings"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "findings_declared"), "fail")
        self.assertEqual(v["findings_count"], 0)
        self.assertIsNone(v["location_coverage"])

    def test_empty_documents_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "documents_declared"), "fail")
        self.assertEqual(v["documents_count"], 0)
        self.assertIsNone(v["output_verification_coverage"])

    def test_figure_quoted_without_location_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["extraction"]["figure_quoted_without_location_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_NOT_SOUND")
        self.assertEqual(v["sections"]["source_and_extraction"], "fail")

    def test_unreadable_sections_not_named_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["extraction"]["unreadable_or_missing_sections_named"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "DOCUMENT_OPERATIONS_NOT_SOUND")

    def test_document_output_not_verified_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][1]["output_reopened_and_checked"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_NOT_SOUND")
        self.assertEqual(v["documents_without_output_verification"],
                         ["board-pack-summary.docx"])
        self.assertEqual(v["output_verification_coverage"], "0.5000")

    def test_tracked_structure_broken_without_rewrite_request_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["editing"]["tracked_structure_intact"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_NOT_SOUND")
        self.assertEqual(
            check_status(
                v, "tracked_structure_intact_unless_rewrite_requested"),
            "fail")

    def test_rewrite_requested_passes_tracked_structure_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["editing"]["rewrite_requested"] = True
        del m["editing"]["tracked_structure_intact"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_SOUND")
        self.assertEqual(
            check_status(
                v, "tracked_structure_intact_unless_rewrite_requested"),
            "pass")

    def test_tracked_structure_missing_without_rewrite_request(self):
        m = copy.deepcopy(COMPLETE)
        del m["editing"]["tracked_structure_intact"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "tracked_structure_intact_unless_rewrite_requested"),
            "missing")

    def test_flattened_export_overwrite_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["preservation"][
            "only_editable_source_overwritten_with_flattened_export_present"
        ] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_NOT_SOUND")
        self.assertEqual(v["sections"]["editing_and_preservation"], "fail")

    def test_no_revisable_deliverable_passes_kept_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["preservation"]["revisable_deliverable_present"] = False
        del m["preservation"]["editable_source_kept_for_revisable"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_SOUND")

    def test_revisable_source_not_kept_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["preservation"]["editable_source_kept_for_revisable"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "DOCUMENT_OPERATIONS_NOT_SOUND")

    def test_no_conversion_passes_conversion_checks_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["conversion"]["conversion_performed"] = False
        m["conversion"]["content_loss_detected"] = False
        for field in (
                "output_reopened_and_compared_section_by_section",
                "headings_tables_lists_figures_totals_survive",
                "loss_fixed_or_reported_plainly",
                "conversion_with_dropped_content_shipped_present"):
            del m["conversion"][field]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_SOUND")
        self.assertEqual(
            check_status(
                v, "conversion_output_reopened_and_compared_when_converted"),
            "pass")
        self.assertEqual(
            check_status(v, "no_conversion_with_dropped_content_shipped"),
            "pass")

    def test_conversion_loss_not_reported_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["conversion"]["loss_fixed_or_reported_plainly"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_NOT_SOUND")
        self.assertEqual(
            check_status(v, "conversion_loss_fixed_or_reported_when_detected"),
            "fail")

    def test_no_loss_detected_passes_loss_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["conversion"]["content_loss_detected"] = False
        del m["conversion"]["loss_fixed_or_reported_plainly"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_SOUND")

    def test_dropped_content_shipped_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["conversion"][
            "conversion_with_dropped_content_shipped_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_NOT_SOUND")
        self.assertEqual(v["sections"]["conversion_and_verification"],
                         "fail")

    def test_conversion_content_not_surviving_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["conversion"][
            "headings_tables_lists_figures_totals_survive"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "DOCUMENT_OPERATIONS_NOT_SOUND")

    def test_markdown_sent_externally_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["deliverable"][
            "markdown_sent_as_external_deliverable_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_NOT_SOUND")
        self.assertEqual(v["sections"]["delivery_and_hygiene"], "fail")

    def test_not_shared_passes_format_checks_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["deliverable"]["shared_externally"] = False
        del m["deliverable"]["send_copy_is_docx_not_markdown"]
        del m["deliverable"][
            "markdown_sent_as_external_deliverable_present"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_SOUND")

    def test_send_copy_with_draft_marks_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["deliverable"]["send_copy_contains_draft_marks_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "DOCUMENT_OPERATIONS_NOT_SOUND")

    def test_no_edits_passes_change_list_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["editing"]["edits_performed"] = False
        del m["delivery"]["change_list_provided"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOCUMENT_OPERATIONS_SOUND")
        self.assertEqual(
            check_status(v, "change_list_provided_when_edits_performed"),
            "pass")

    def test_edits_without_change_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["delivery"]["change_list_provided"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "DOCUMENT_OPERATIONS_NOT_SOUND")

    def test_loss_not_stated_in_delivery_note_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["delivery"]["loss_gap_unreadable_stated_in_delivery_note"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "DOCUMENT_OPERATIONS_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["delivery"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["delivery_and_hygiene"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["documents_count"])
        self.assertIsNone(v["findings_without_location"])
        self.assertIsNone(v["location_coverage"])
        self.assertIsNone(v["exact_quote_coverage"])
        self.assertIsNone(v["output_verification_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: DOCUMENT_OPERATIONS_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["operation"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("operation", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"extraction": "should-be-an-object"})
        self.assertIn("extraction", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"findings": {"name": "q3_cost_total"}})
        self.assertIn("findings", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"findings": ["q3_cost_total"]})
        self.assertIn("findings[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["source"]["authoritative_copy_opened"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("source.authoritative_copy_opened",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["findings"][1]["location"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("findings[1].location", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["documents"][0]["output_reopened_and_checked"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("documents[0].output_reopened_and_checked",
                      str(ctx.exception))

    def test_gate_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["conversion"]["conversion_performed"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("conversion.conversion_performed",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["delivery"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("delivery", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
