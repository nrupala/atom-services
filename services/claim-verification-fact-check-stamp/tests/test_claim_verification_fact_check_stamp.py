import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from claim_verification_fact_check_stamp import evaluate, stamp  # noqa: E402


def _claim(cid, **overrides):
    claim = {
        "id": cid, "material": True, "label": "verified",
        "independent_sources": 2, "primary_source": False,
        "sources_archived": True, "source_metadata_recorded": True,
        "independence_checked": True, "has_numbers": False,
        "math_rechecked": False, "language_weakest_supported": True,
    }
    claim.update(overrides)
    return claim


STAMPED = {
    "document": "launch-post",
    "process": {"claims_extracted": True, "units_and_dates_checked": True,
                "counter_case_considered": True,
                "evidence_published_inline": True,
                "methodology_visible_for_big_claims": True,
                "corrections_policy_published": True,
                "versions_retained": True, "silent_edits_made": False},
    "claims": [
        _claim("c1", has_numbers=True, math_rechecked=True),
        _claim("c2", independent_sources=1, primary_source=True,
               label="likely"),
        _claim("c3", material=False, independent_sources=0,
               label="unverified"),
    ],
}


class VerdictTests(unittest.TestCase):
    def test_stamped_manifest_is_stamped(self):
        v = evaluate(copy.deepcopy(STAMPED))
        self.assertEqual(v["verdict"], "STAMPED")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["claims_summary"]["material_claims"], 2)

    def test_single_source_material_claim_is_not_triangulated(self):
        m = copy.deepcopy(STAMPED)
        m["claims"][0]["independent_sources"] = 1
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_STAMPED")
        self.assertEqual(v["sections"]["triangulation"], "fail")

    def test_primary_plus_confirmation_triangulates(self):
        m = copy.deepcopy(STAMPED)
        m["claims"][0]["independent_sources"] = 1
        m["claims"][0]["primary_source"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "STAMPED")

    def test_non_material_claim_needs_no_triangulation(self):
        v = evaluate(copy.deepcopy(STAMPED))
        checks = {c["check"]: c for c in v["checks"]}
        self.assertEqual(
            checks["material_claims_triangulated"]["status"], "pass")

    def test_numeric_claim_without_rederivation_fails(self):
        m = copy.deepcopy(STAMPED)
        m["claims"][0]["math_rechecked"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_STAMPED")
        self.assertEqual(v["sections"]["compute_rechecks"], "fail")

    def test_label_outside_vocabulary_fails(self):
        m = copy.deepcopy(STAMPED)
        m["claims"][0]["label"] = "proven"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_STAMPED")
        self.assertEqual(v["sections"]["uncertainty_language"], "fail")

    def test_overstated_language_fails(self):
        m = copy.deepcopy(STAMPED)
        m["claims"][1]["language_weakest_supported"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_STAMPED")

    def test_unarchived_material_source_fails(self):
        m = copy.deepcopy(STAMPED)
        m["claims"][0]["sources_archived"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_STAMPED")
        self.assertEqual(v["sections"]["source_ladder"], "fail")

    def test_silent_edits_are_a_red_line_fail(self):
        m = copy.deepcopy(STAMPED)
        m["process"]["silent_edits_made"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_STAMPED")
        self.assertEqual(v["sections"]["publication_and_corrections"],
                         "fail")

    def test_missing_source_metadata_is_insufficient(self):
        m = copy.deepcopy(STAMPED)
        del m["claims"][0]["source_metadata_recorded"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["source_ladder"],
                         "insufficient_evidence")

    def test_missing_triangulation_fields_is_insufficient(self):
        m = copy.deepcopy(STAMPED)
        del m["claims"][0]["independent_sources"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_no_claims_declared_is_insufficient(self):
        m = copy.deepcopy(STAMPED)
        m["claims"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_offending_claims_are_named(self):
        m = copy.deepcopy(STAMPED)
        m["claims"][0]["independent_sources"] = 0
        v = evaluate(m)
        checks = {c["check"]: c for c in v["checks"]}
        self.assertIn("c1",
                      checks["material_claims_triangulated"]["evidence"])

    def test_absent_process_is_insufficient_not_failed(self):
        m = copy.deepcopy(STAMPED)
        del m["process"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(STAMPED))
        self.assertIn("VERDICT: STAMPED", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict.
    The first case mirrors the recorded external malformed input."""

    def test_recorded_malformed_case_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"document": "Malformed input",
                      "process": "should_be_an_object",
                      "claims": "should_be_a_list"})
        self.assertIn("process", str(ctx.exception))

    def test_process_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"process": "should_be_an_object"})
        self.assertIn("process", str(ctx.exception))

    def test_claims_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"claims": "should_be_a_list"})
        self.assertIn("claims", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(STAMPED)
        m["process"]["silent_edits_made"] = "no"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("process.silent_edits_made", str(ctx.exception))

    def test_claim_entry_number_as_string_rejected(self):
        m = copy.deepcopy(STAMPED)
        m["claims"][0]["independent_sources"] = "two"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("claims[0].independent_sources",
                      str(ctx.exception))

    def test_claim_entry_as_string_rejected(self):
        m = copy.deepcopy(STAMPED)
        m["claims"] = ["c1"]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("claims[0]", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(STAMPED)
        m["process"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("process", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
