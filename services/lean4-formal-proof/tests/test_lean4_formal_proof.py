import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from lean4_formal_proof import evaluate, stamp  # noqa: E402

VERIFIED = {
    "project": "consensus-core",
    "setup": {"toolchain_pinned": True, "versions_pinned": True,
              "ci_runs_lake_build": True, "lake_build_green": True},
    "statements": {"stated_before_proving": True,
                   "meaning_checked_before_proving": True,
                   "reviewed_independently_of_tactics": True,
                   "weakened_silently": False,
                   "unproven_claims_presented_as_verified": False},
    "definitions": {"total": True, "executable": True,
                    "specs_separate_from_implementation": True},
    "proof": {"structured_and_readable": True,
              "cheating_items_tracked_as_tickets": True,
              "cheating_smuggled_into_deliverable": False},
    "theorems": [
        {"name": "leader_safety", "sorry_count": 0,
         "axioms": ["propext", "Classical.choice", "Quot.sound"],
         "native_decide_used": False, "kernel_checked": True},
        {"name": "log_matching", "sorry_count": 0,
         "axioms": ["propext"],
         "native_decide_used": False, "kernel_checked": True},
    ],
    "attestation": {"build_log_retained": True,
                    "axiom_audit_performed": True,
                    "reproduction_recipe_present": True},
    "alignment": {"mapping_documented": True,
                  "changes_ported_through_model": True,
                  "model_and_implementation_in_sync": True},
}


class VerdictTests(unittest.TestCase):
    def test_verified_manifest_is_verified(self):
        v = evaluate(copy.deepcopy(VERIFIED))
        self.assertEqual(v["verdict"], "VERIFIED")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 26)
        self.assertEqual(v["theorems_evaluated"], 2)
        self.assertEqual(v["theorems_with_sorry"], 0)

    def test_red_build_fails(self):
        m = copy.deepcopy(VERIFIED)
        m["setup"]["lake_build_green"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")
        self.assertEqual(v["sections"]["project_setup"], "fail")

    def test_unpinned_toolchain_fails(self):
        m = copy.deepcopy(VERIFIED)
        m["setup"]["toolchain_pinned"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")

    def test_statement_not_reviewed_fails(self):
        m = copy.deepcopy(VERIFIED)
        m["statements"]["reviewed_independently_of_tactics"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")
        self.assertEqual(v["sections"]["statement_integrity"], "fail")

    def test_silently_weakened_statement_fails(self):
        m = copy.deepcopy(VERIFIED)
        m["statements"]["weakened_silently"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")

    def test_unproven_claim_dressed_as_verified_fails(self):
        m = copy.deepcopy(VERIFIED)
        m["statements"]["unproven_claims_presented_as_verified"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")

    def test_partial_definitions_fail(self):
        m = copy.deepcopy(VERIFIED)
        m["definitions"]["total"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")
        self.assertEqual(v["sections"]["definitions_and_model"], "fail")

    def test_smuggled_cheating_fails(self):
        m = copy.deepcopy(VERIFIED)
        m["proof"]["cheating_smuggled_into_deliverable"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")
        self.assertEqual(v["sections"]["proof_integrity"], "fail")

    def test_sorry_in_theorem_fails(self):
        m = copy.deepcopy(VERIFIED)
        m["theorems"][0]["sorry_count"] = 1
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")
        self.assertEqual(v["sections"]["theorem_declarations"], "fail")
        self.assertEqual(v["theorems_with_sorry"], 1)

    def test_extra_axiom_fails(self):
        m = copy.deepcopy(VERIFIED)
        m["theorems"][1]["axioms"] = ["propext", "my_custom_axiom"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")

    def test_standard_axioms_only_pass(self):
        m = copy.deepcopy(VERIFIED)
        m["theorems"][0]["axioms"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "VERIFIED")

    def test_native_decide_shortcut_fails(self):
        m = copy.deepcopy(VERIFIED)
        m["theorems"][0]["native_decide_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")

    def test_unchecked_theorem_fails(self):
        m = copy.deepcopy(VERIFIED)
        m["theorems"][1]["kernel_checked"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")

    def test_malformed_theorem_entry_fails(self):
        m = copy.deepcopy(VERIFIED)
        del m["theorems"][0]["sorry_count"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")

    def test_negative_sorry_count_fails(self):
        m = copy.deepcopy(VERIFIED)
        m["theorems"][0]["sorry_count"] = -1
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")

    def test_bool_sorry_count_rejected(self):
        # F1 test correction (coordinator ruling, 2026-11-15): this
        # test previously asserted a NOT_VERIFIED verdict over a
        # boolean sorry_count — a wrong-typed documented field.
        # That assertion encoded the F1 defect itself: a boolean is
        # not a number, so the manifest is rejected with ValueError
        # naming the field (the bool-is-not-an-int guard the test
        # was written to prove is preserved, as a rejection).
        m = copy.deepcopy(VERIFIED)
        m["theorems"][0]["sorry_count"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("theorems[0].sorry_count", str(ctx.exception))

    def test_no_axiom_audit_fails(self):
        m = copy.deepcopy(VERIFIED)
        m["attestation"]["axiom_audit_performed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")
        self.assertEqual(v["sections"]["build_attestation"], "fail")

    def test_model_out_of_sync_fails(self):
        m = copy.deepcopy(VERIFIED)
        m["alignment"]["model_and_implementation_in_sync"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_VERIFIED")
        self.assertEqual(v["sections"]["model_alignment"], "fail")

    def test_absent_theorems_is_insufficient_not_failed(self):
        m = copy.deepcopy(VERIFIED)
        del m["theorems"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["theorem_declarations"],
                         "insufficient_evidence")
        self.assertEqual(v["theorems_evaluated"], 0)

    def test_empty_theorems_list_is_insufficient(self):
        m = copy.deepcopy(VERIFIED)
        m["theorems"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(VERIFIED)
        del m["attestation"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["build_attestation"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(VERIFIED))
        self.assertIn("VERDICT: VERIFIED", stamp(v))

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
            evaluate({"project": "malformed-input",
                      "setup": "not-an-object",
                      "theorems": "should-be-a-list"})
        self.assertIn("setup", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"setup": "not-an-object"})
        self.assertIn("setup", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"theorems": "should-be-a-list"})
        self.assertIn("theorems", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(VERIFIED)
        m["setup"]["lake_build_green"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("setup.lake_build_green", str(ctx.exception))

    def test_list_entry_field_as_string_rejected(self):
        m = copy.deepcopy(VERIFIED)
        m["theorems"][0]["sorry_count"] = "zero"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("theorems[0].sorry_count", str(ctx.exception))

    def test_nested_list_entry_as_number_rejected(self):
        m = copy.deepcopy(VERIFIED)
        m["theorems"][0]["axioms"] = ["propext", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("theorems[0].axioms[1]", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(VERIFIED)
        m["theorems"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("theorems", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
