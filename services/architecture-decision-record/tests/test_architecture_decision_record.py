import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from architecture_decision_record import evaluate, stamp  # noqa: E402

COMPLETE = {
    "decision": "0007-choice-of-database",
    "nfrs": {"written": True,
             "quantified_where_possible": True,
             "agreed_before_design_freeze": True},
    "boundaries": {"contexts_drawn": True,
                   "core_kept_small": True,
                   "hidden_coupling_present": False,
                   "backdoor_paths_present": False},
    "contracts": {"interfaces_documented": True,
                  "interfaces_versioned": True,
                  "inputs_outputs_defined": True,
                  "errors_defined": True,
                  "defined_before_code": True},
    "options": {"alternatives": [
                    {"name": "postgres", "serious": True,
                     "tradeoffs_stated": True},
                    {"name": "sqlite", "serious": True,
                     "tradeoffs_stated": True},
                    {"name": "dynamodb", "serious": False,
                     "tradeoffs_stated": True}],
                "prefers_boring_replaceable_tech": True},
    "adr": {"numbered": True,
            "context_stated": True,
            "decision_stated": True,
            "consequences_positive_stated": True,
            "consequences_negative_stated": True,
            "consequences_risks_stated": True,
            "status_stated": True,
            "page_count": 1},
    "reversibility": {"assessed": True,
                      "expensive_choices_isolated_behind_interfaces": True,
                      "irreversible_decisions_deferred": False},
    "security": {"data_flows_mapped": True,
                 "encryption_verification_addressed": True},
    "dependencies": {"new_dependency_introduced": True,
                     "new_dependency_reason_stated": True},
    "supersession": {"has_superseded_adrs": True,
                     "superseded_adrs_linked_to_replacements": True,
                     "superseded_silently_rewritten": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_adr_complete(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "ADR_COMPLETE")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 32)

    def test_alternatives_count_reported(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["alternatives_count"], 3)

    def test_page_over_limit_serialized_at_fixed_4dp(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["page_count_over_limit"], "0.0000")
        m = copy.deepcopy(COMPLETE)
        m["adr"]["page_count"] = 2
        self.assertEqual(evaluate(m)["page_count_over_limit"], "1.0000")
        m["adr"]["page_count"] = 0.5
        self.assertEqual(evaluate(m)["page_count_over_limit"], "-0.5000")

    def test_page_count_above_one_page_max_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["adr"]["page_count"] = 2
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ADR_NOT_COMPLETE")
        self.assertEqual(v["sections"]["adr_format"], "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_page_count_exactly_one_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["adr"]["page_count"] = 1
        self.assertEqual(evaluate(m)["verdict"], "ADR_COMPLETE")

    def test_page_count_fractional_above_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["adr"]["page_count"] = 1.5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ADR_NOT_COMPLETE")
        self.assertEqual(v["page_count_over_limit"], "0.5000")

    def test_non_numeric_page_count_is_missing(self):
        # Corrected under the F1 ruling: previously expected a
        # verdict over a wrong-typed documented field (the F1
        # defect). A non-numeric page count is now rejected with
        # ValueError naming the field.
        m = copy.deepcopy(COMPLETE)
        m["adr"]["page_count"] = "one"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("adr.page_count", str(ctx.exception))

    def test_boolean_page_count_is_missing_not_numeric(self):
        # Corrected under the F1 ruling: a boolean is not a
        # number — previously expected a verdict over the
        # wrong-typed field (the F1 defect); now rejected.
        m = copy.deepcopy(COMPLETE)
        m["adr"]["page_count"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("adr.page_count", str(ctx.exception))

    def test_too_few_alternatives_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["options"]["alternatives"] = m["options"]["alternatives"][:1]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ADR_NOT_COMPLETE")
        self.assertEqual(v["sections"]["options_and_tradeoffs"], "fail")
        self.assertEqual(v["alternatives_count"], 1)
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_too_many_alternatives_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["options"]["alternatives"].append(
            {"name": "couchdb", "serious": False,
             "tradeoffs_stated": True})
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ADR_NOT_COMPLETE")
        self.assertEqual(v["alternatives_count"], 4)

    def test_two_alternatives_passes_lower_boundary(self):
        m = copy.deepcopy(COMPLETE)
        m["options"]["alternatives"] = m["options"]["alternatives"][:2]
        self.assertEqual(evaluate(m)["verdict"], "ADR_COMPLETE")

    def test_alternative_without_tradeoffs_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["options"]["alternatives"][1]["tradeoffs_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ADR_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "all_alternatives_tradeoffs_stated"), "fail")

    def test_no_serious_alternative_fails_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        for alt in m["options"]["alternatives"]:
            alt["serious"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ADR_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "at_least_one_serious_alternative"), "fail")

    def test_empty_alternatives_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["options"]["alternatives"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ADR_NOT_COMPLETE")
        self.assertEqual(v["alternatives_count"], 0)
        self.assertEqual(
            check_status(v, "alternatives_count_in_stated_range"), "fail")

    def test_missing_alternatives_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["options"]["alternatives"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["alternatives_count"])
        self.assertIsNone(v["computed_status"])

    def test_non_list_alternatives_is_missing(self):
        # Corrected under the F1 ruling: previously expected a
        # verdict over a wrong-typed documented field (the F1
        # defect). A non-list alternatives value is now rejected
        # with ValueError naming the field.
        m = copy.deepcopy(COMPLETE)
        m["options"]["alternatives"] = "postgres-or-sqlite"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("options.alternatives", str(ctx.exception))

    def test_non_object_alternative_entries_fail(self):
        # Corrected under the F1 ruling: previously expected a
        # verdict over wrong-typed list entries (the F1 defect).
        # A non-object entry is now rejected with ValueError
        # naming the entry.
        m = copy.deepcopy(COMPLETE)
        m["options"]["alternatives"] = ["postgres", "sqlite"]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("options.alternatives[0]", str(ctx.exception))

    def test_nfrs_not_agreed_before_freeze_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["nfrs"]["agreed_before_design_freeze"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ADR_NOT_COMPLETE")
        self.assertEqual(v["sections"]["nfrs_first"], "fail")

    def test_nfrs_not_quantified_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["nfrs"]["quantified_where_possible"] = False
        self.assertEqual(evaluate(m)["verdict"], "ADR_NOT_COMPLETE")

    def test_hidden_coupling_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["boundaries"]["hidden_coupling_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ADR_NOT_COMPLETE")
        self.assertEqual(v["sections"]["boundaries_and_contracts"],
                         "fail")

    def test_backdoor_path_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["boundaries"]["backdoor_paths_present"] = True
        self.assertEqual(evaluate(m)["verdict"], "ADR_NOT_COMPLETE")

    def test_interfaces_not_versioned_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["contracts"]["interfaces_versioned"] = False
        self.assertEqual(evaluate(m)["verdict"], "ADR_NOT_COMPLETE")

    def test_contract_errors_not_defined_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["contracts"]["errors_defined"] = False
        self.assertEqual(evaluate(m)["verdict"], "ADR_NOT_COMPLETE")

    def test_adr_not_numbered_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["adr"]["numbered"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ADR_NOT_COMPLETE")
        self.assertEqual(v["sections"]["adr_format"], "fail")

    def test_consequences_risks_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["adr"]["consequences_risks_stated"] = False
        self.assertEqual(evaluate(m)["verdict"], "ADR_NOT_COMPLETE")

    def test_status_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["adr"]["status_stated"] = False
        self.assertEqual(evaluate(m)["verdict"], "ADR_NOT_COMPLETE")

    def test_irreversible_decision_deferred_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["reversibility"]["irreversible_decisions_deferred"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ADR_NOT_COMPLETE")
        self.assertEqual(v["sections"]["reversibility_and_security"],
                         "fail")

    def test_expensive_choices_not_isolated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["reversibility"][
            "expensive_choices_isolated_behind_interfaces"] = False
        self.assertEqual(evaluate(m)["verdict"], "ADR_NOT_COMPLETE")

    def test_data_flows_not_mapped_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["data_flows_mapped"] = False
        self.assertEqual(evaluate(m)["verdict"], "ADR_NOT_COMPLETE")

    def test_new_dependency_without_reason_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["dependencies"]["new_dependency_reason_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ADR_NOT_COMPLETE")
        self.assertEqual(v["sections"]["lifecycle_and_dependencies"],
                         "fail")

    def test_no_new_dependency_passes_reason_as_not_applicable(self):
        m = copy.deepcopy(COMPLETE)
        m["dependencies"]["new_dependency_introduced"] = False
        del m["dependencies"]["new_dependency_reason_stated"]
        self.assertEqual(evaluate(m)["verdict"], "ADR_COMPLETE")

    def test_superseded_adr_without_link_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["supersession"][
            "superseded_adrs_linked_to_replacements"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ADR_NOT_COMPLETE")
        self.assertEqual(v["sections"]["lifecycle_and_dependencies"],
                         "fail")

    def test_no_superseded_adrs_passes_link_as_not_applicable(self):
        m = copy.deepcopy(COMPLETE)
        m["supersession"]["has_superseded_adrs"] = False
        del m["supersession"]["superseded_adrs_linked_to_replacements"]
        self.assertEqual(evaluate(m)["verdict"], "ADR_COMPLETE")

    def test_silently_rewritten_superseded_adr_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["supersession"]["superseded_silently_rewritten"] = True
        self.assertEqual(evaluate(m)["verdict"], "ADR_NOT_COMPLETE")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["security"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["reversibility_and_security"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["alternatives_count"])
        self.assertIsNone(v["page_count_over_limit"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: ADR_COMPLETE", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["decision"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("decision", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"nfrs": "should-be-an-object"})
        self.assertIn("nfrs", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["options"]["alternatives"] = "postgres-or-sqlite"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("options.alternatives", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["options"]["alternatives"] = ["postgres", "sqlite"]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("options.alternatives[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["nfrs"]["written"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("nfrs.written", str(ctx.exception))

    def test_boolean_leaf_in_list_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["options"]["alternatives"][0]["serious"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("options.alternatives[0].serious",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["adr"]["page_count"] = "one"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("adr.page_count", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["security"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("security", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
