import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from vendor_evaluation_three_way_match_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "pack_title": "q4-laptop-refresh",
    "spec": {"spec_written_before_quotes": True,
             "spec_includes_functional_requirements": True,
             "spec_includes_compliance_requirements": True,
             "spec_includes_interface_requirements": True},
    "sourcing": {"quotes_comparable_same_scope_declared": True,
                 "single_source_used": False,
                 "single_source_justification_recorded": False},
    "evaluation_setup": {
        "criteria_set_before_scoring": True,
        "tco_evaluation_documented": True,
        "tco_includes_acquisition_cost": True,
        "tco_includes_operations_cost": True,
        "tco_includes_spares_cost": True,
        "tco_includes_support_cost": True,
        "tco_includes_switching_cost": True,
        "evidence_basis_recorded": True,
        "evaluation_applied_consistently_across_vendors": True},
    "vendors": [
        {"vendor_id": "vend-1", "vendor_name": "Northwind Supply",
         "evidence_note": "Quote and references recorded",
         "scores": [{"criterion_id": "crit-1", "score": 4},
                    {"criterion_id": "crit-2", "score": 5},
                    {"criterion_id": "crit-3", "score": 3}],
         "weighted_total_declared": 26},
        {"vendor_id": "vend-2", "vendor_name": "Contoso Trading",
         "evidence_note": "Quote and delivery terms recorded",
         "scores": [{"criterion_id": "crit-1", "score": 3},
                    {"criterion_id": "crit-2", "score": 4},
                    {"criterion_id": "crit-3", "score": 2}],
         "weighted_total_declared": 20},
    ],
    "criteria": [
        {"criterion_id": "crit-1", "criterion_name": "Total cost fit",
         "weight": 2},
        {"criterion_id": "crit-2", "criterion_name": "Delivery reliability",
         "weight": 3},
        {"criterion_id": "crit-3", "criterion_name": "Support quality",
         "weight": 1},
    ],
    "contract": {"exclusions_reviewed": True,
                 "payment_terms_reviewed": True,
                 "penalties_reviewed": True,
                 "warranty_reviewed": True,
                 "price_escalation_clauses_reviewed": True,
                 "binding_terms_reviewed": True},
    "po_discipline": {"po_issued_before_delivery": True,
                      "changes_via_change_order_declared": True,
                      "verbal_commitments_papered_same_day_declared": True,
                      "po_references_spec_declared": True},
    "three_way_match": {
        "match_performed_before_payment_declared": True,
        "discrepancies_resolved_before_payment_declared": True,
        "inspection_against_spec_on_arrival_declared": True,
        "receipt_verification_before_payment_declared": True,
        "purchase_order_total_declared": 655,
        "invoice_total_declared": 655},
    "purchase_order_lines": [
        {"line_id": "line-1", "quantity": 10, "unit_price": 25.5,
         "line_total_declared": 255},
        {"line_id": "line-2", "quantity": 4, "unit_price": 100,
         "line_total_declared": 400},
    ],
    "receipt_lines": [
        {"line_id": "line-1", "quantity": 10},
        {"line_id": "line-2", "quantity": 4},
    ],
    "invoice_lines": [
        {"line_id": "line-1", "quantity": 10, "unit_price": 25.5,
         "line_total_declared": 255},
        {"line_id": "line-2", "quantity": 4, "unit_price": 100,
         "line_total_declared": 400},
    ],
    "vendor_records": {
        "vendor_terms_recorded": True,
        "vendor_contacts_recorded": True,
        "performance_log_maintained": True,
        "performance_log_covers_on_time_quality_responsiveness": True,
        "annual_review_cadence_set": True,
        "two_viable_sources_for_critical_items_declared": True,
        "banking_detail_changes_verified_via_known_contacts": True,
        "segregation_of_duties_declared": True,
        "gifts_conflict_policy_respected_declared": True},
    "red_lines": {"po_less_purchase_above_threshold_present": False,
                  "payment_without_delivery_confirmation_present": False,
                  "payment_before_three_way_match_present": False,
                  "silent_bank_detail_change_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "VENDOR_EVALUATION_AND_MATCH_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 66)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["vendor_evaluation_vendors_count"], 2)
        self.assertEqual(v["vendor_evaluation_criteria_count"], 3)
        self.assertEqual(v["purchase_order_lines_count"], 2)
        self.assertEqual(v["receipt_lines_count"], 2)
        self.assertEqual(v["invoice_lines_count"], 2)
        self.assertEqual(v["duplicate_vendor_evaluation_vendor_ids"], [])
        self.assertEqual(v["vendor_evaluation_criteria_weights_sum"],
                         "6.000000")
        self.assertEqual(v["purchase_order_lines_total"], "655.000000")
        self.assertEqual(v["invoice_lines_total"], "655.000000")
        self.assertEqual(v["vendor_score_coverage_ratio"], "1.000000")
        self.assertEqual(v["vendor_weighted_total_match_ratio"], "1.000000")
        self.assertEqual(v["three_way_quantity_match_ratio"], "1.000000")
        self.assertEqual(v["three_way_amount_match_ratio"], "1.000000")

    def test_spec_not_written_before_quotes_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["spec"]["spec_written_before_quotes"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "VENDOR_EVALUATION_AND_MATCH_NOT_SOUND")
        self.assertEqual(v["sections"]["spec_and_sourcing"], "fail")
        self.assertEqual(
            check_status(v, "vendor_evaluation_spec_written_before_quotes"),
            "fail")

    def test_single_source_without_justification_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["sourcing"]["single_source_used"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "vendor_evaluation_single_source_justification_recorded_where_single_source_used"),
            "fail")

    def test_no_single_source_passes_gated_as_na(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            check_status(
                v,
                "vendor_evaluation_single_source_justification_recorded_where_single_source_used"),
            "pass")
        self.assertEqual(v["verdict"], "VENDOR_EVALUATION_AND_MATCH_SOUND")

    def test_single_source_with_justification_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["sourcing"]["single_source_used"] = True
        m["sourcing"]["single_source_justification_recorded"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "VENDOR_EVALUATION_AND_MATCH_SOUND")

    def test_duplicate_vendor_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["vendors"][1]["vendor_id"] = "vend-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_vendor_evaluation_vendor_id_unique"),
            "fail")
        self.assertEqual(v["duplicate_vendor_evaluation_vendor_ids"],
                         ["vend-1"])

    def test_single_vendor_fails_comparison(self):
        m = copy.deepcopy(COMPLETE)
        m["vendors"] = m["vendors"][:1]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "vendor_evaluation_vendors_list_declared"),
            "fail")

    def test_absent_vendors_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["vendors"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "vendor_evaluation_vendors_list_declared"),
            "missing")
        self.assertIsNone(v["vendor_evaluation_vendors_count"])
        self.assertIsNone(v["computed_status"])

    def test_empty_evidence_note_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["vendors"][1]["evidence_note"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_vendor_evaluation_vendor_evidence_note_declared"),
            "fail")
        self.assertEqual(v["vendor_evaluation_vendors_without_evidence_note"],
                         ["vend-2"])
        self.assertEqual(v["vendor_evidence_note_ratio"], "0.500000")

    def test_negative_weight_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][0]["weight"] = -1
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_vendor_evaluation_criterion_weight_non_negative"),
            "fail")
        self.assertEqual(
            v["vendor_evaluation_criteria_with_invalid_weight"], ["crit-1"])

    def test_zero_weight_sum_fails(self):
        m = copy.deepcopy(COMPLETE)
        for c in m["criteria"]:
            c["weight"] = 0
        for vend in m["vendors"]:
            vend["weighted_total_declared"] = 0
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "vendor_evaluation_criteria_weights_sum_positive"),
            "fail")
        self.assertEqual(v["vendor_evaluation_criteria_weights_sum"],
                         "0.000000")

    def test_missing_score_fails_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["vendors"][0]["scores"] = m["vendors"][0]["scores"][:2]
        m["vendors"][0]["weighted_total_declared"] = 23
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_vendor_evaluation_vendor_scores_every_declared_criterion"),
            "fail")
        self.assertEqual(
            v["vendor_evaluation_vendors_with_incomplete_or_extra_scores"],
            ["vend-1"])
        self.assertEqual(v["vendor_score_coverage_ratio"], "0.500000")

    def test_weighted_total_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["vendors"][1]["weighted_total_declared"] = 21
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_vendor_evaluation_vendor_weighted_total_recomputes"),
            "fail")
        self.assertEqual(
            v["vendor_evaluation_vendors_with_weighted_total_mismatch"],
            ["vend-2"])
        self.assertEqual(v["vendor_weighted_total_match_ratio"], "0.500000")

    def test_criterion_missing_weight_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["criteria"][0]["weight"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "every_vendor_evaluation_criterion_weight_non_negative"),
            "missing")

    def test_exclusions_not_reviewed_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["contract"]["exclusions_reviewed"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["contract_and_terms"], "fail")

    def test_po_after_delivery_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["po_discipline"]["po_issued_before_delivery"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["purchase_order_discipline"], "fail")
        self.assertEqual(
            check_status(v, "vendor_evaluation_po_issued_before_delivery"),
            "fail")

    def test_receipt_quantity_short_fails_quantity_match(self):
        m = copy.deepcopy(COMPLETE)
        m["receipt_lines"][1]["quantity"] = 3
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_vendor_evaluation_three_way_line_quantity_matches_across_documents"),
            "fail")
        self.assertEqual(v["three_way_lines_with_quantity_mismatch"],
                         ["line-2"])
        self.assertEqual(v["three_way_quantity_match_ratio"], "0.500000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_invoice_unit_price_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["invoice_lines"][0]["unit_price"] = 26
        m["invoice_lines"][0]["line_total_declared"] = 260
        m["three_way_match"]["invoice_total_declared"] = 660
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_vendor_evaluation_three_way_line_unit_price_matches_po_to_invoice"),
            "fail")
        self.assertEqual(v["three_way_lines_with_unit_price_mismatch"],
                         ["line-1"])

    def test_po_line_total_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["purchase_order_lines"][0]["line_total_declared"] = 250
        m["three_way_match"]["purchase_order_total_declared"] = 650
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_vendor_evaluation_purchase_order_line_total_recomputes"),
            "fail")
        self.assertEqual(
            v["purchase_order_lines_with_line_total_mismatch"], ["line-1"])

    def test_invoice_line_total_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["invoice_lines"][1]["line_total_declared"] = 401
        m["three_way_match"]["invoice_total_declared"] = 656
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_vendor_evaluation_invoice_line_total_recomputes"),
            "fail")
        self.assertEqual(v["invoice_lines_with_line_total_mismatch"],
                         ["line-2"])

    def test_receipt_missing_line_fails_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["receipt_lines"] = m["receipt_lines"][:1]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "vendor_evaluation_receipt_lines_cover_purchase_order_lines_exactly"),
            "fail")
        self.assertEqual(
            v["purchase_order_line_ids_missing_from_receipt"], ["line-2"])

    def test_invoice_extra_line_fails_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["invoice_lines"].append(
            {"line_id": "line-9", "quantity": 1, "unit_price": 5,
             "line_total_declared": 5})
        m["three_way_match"]["invoice_total_declared"] = 660
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "vendor_evaluation_invoice_lines_cover_purchase_order_lines_exactly"),
            "fail")
        self.assertEqual(v["invoice_line_ids_not_on_purchase_order"],
                         ["line-9"])

    def test_duplicate_receipt_line_id_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["receipt_lines"][1]["line_id"] = "line-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_vendor_evaluation_receipt_line_id_unique"),
            "fail")
        self.assertEqual(v["duplicate_receipt_line_ids"], ["line-1"])

    def test_po_grand_total_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["three_way_match"]["purchase_order_total_declared"] = 650
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "vendor_evaluation_purchase_order_total_recomputes_from_line_totals"),
            "fail")

    def test_grand_totals_disagree_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["three_way_match"]["invoice_total_declared"] = 650
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "vendor_evaluation_three_way_grand_totals_match"),
            "fail")

    def test_absent_receipt_lines_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["receipt_lines"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "vendor_evaluation_receipt_lines_cover_purchase_order_lines_exactly"),
            "missing")
        self.assertIsNone(v["receipt_lines_count"])
        self.assertIsNone(v["three_way_quantity_match_ratio"])

    def test_fractional_amounts_recompute_exactly(self):
        m = copy.deepcopy(COMPLETE)
        m["purchase_order_lines"][0]["quantity"] = 3
        m["purchase_order_lines"][0]["unit_price"] = 0.1
        m["purchase_order_lines"][0]["line_total_declared"] = 0.3
        m["receipt_lines"][0]["quantity"] = 3
        m["invoice_lines"][0]["quantity"] = 3
        m["invoice_lines"][0]["unit_price"] = 0.1
        m["invoice_lines"][0]["line_total_declared"] = 0.3
        m["three_way_match"]["purchase_order_total_declared"] = 400.3
        m["three_way_match"]["invoice_total_declared"] = 400.3
        v = evaluate(m)
        self.assertEqual(v["verdict"], "VENDOR_EVALUATION_AND_MATCH_SOUND")
        self.assertEqual(v["purchase_order_lines_total"], "400.300000")

    def test_performance_log_not_maintained_fails_section6(self):
        m = copy.deepcopy(COMPLETE)
        m["vendor_records"]["performance_log_maintained"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["vendor_records_and_performance"], "fail")

    def test_payment_without_delivery_confirmation_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["payment_without_delivery_confirmation_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"],
                         "VENDOR_EVALUATION_AND_MATCH_NOT_SOUND")

    def test_silent_bank_detail_change_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["silent_bank_detail_change_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "vendor_evaluation_free_of_silent_bank_detail_change"),
            "fail")

    def test_po_less_purchase_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["po_less_purchase_above_threshold_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "vendor_evaluation_free_of_po_less_purchase_above_threshold"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["contract"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["contract_and_terms"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["vendor_evaluation_vendors_count"])
        self.assertIsNone(v["vendor_evaluation_criteria_weights_sum"])
        self.assertIsNone(v["three_way_quantity_match_ratio"])
        self.assertIsNone(v["purchase_order_lines_total"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: VENDOR_EVALUATION_AND_MATCH_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["pack_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("pack_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"spec": "should-be-an-object"})
        self.assertIn("spec", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"vendors": {"vendor_id": "vend-1"}})
        self.assertIn("vendors", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"criteria": ["crit-1"]})
        self.assertIn("criteria[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["spec"]["spec_written_before_quotes"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("spec.spec_written_before_quotes", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"][0]["weight"] = "2"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("criteria[0].weight", str(ctx.exception))

    def test_nested_score_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["vendors"][0]["scores"][0]["score"] = "4"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("vendors[0].scores[0].score", str(ctx.exception))

    def test_line_quantity_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["purchase_order_lines"][0]["quantity"] = "10"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("purchase_order_lines[0].quantity", str(ctx.exception))

    def test_grand_total_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["three_way_match"]["invoice_total_declared"] = "655"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("three_way_match.invoice_total_declared",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["vendor_records"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("vendor_records", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
