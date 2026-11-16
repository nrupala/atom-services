import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from correctness_verification_certificate import evaluate, stamp  # noqa: E402

CERTIFIED = {
    "component": "ledger-kernel",
    "register": {"exists": True, "property_named": True,
                 "scope_named": True, "evidence_level_assigned": True,
                 "expiry_set": True},
    "ladder": {"cheapest_sufficient_level_selected": True,
               "claim_exceeds_evidence_level": False,
               "tests_presented_as_proof": False},
    "specs": {"invariants_written": True,
              "pre_post_conditions_written": True,
              "liveness_properties_written": True,
              "written_before_tools_run": True},
    "artifacts": {"machine_checkable_per_claim": True,
                  "proof_scripts_or_solver_logs_retained": True,
                  "counterexample_suppressed": False,
                  "reproduction_recipe_present": True},
    "scope": {"exclusions_written": True, "claims_versioned": True,
              "reverification_triggers_defined": True,
              "verified_at_current_version": True},
    "ci": {"verification_in_pipeline": True,
           "broken_proof_fails_build": True},
    "review": {"independent_review_done": True,
               "counterexample_found": True,
               "counterexample_disclosed": True},
    "certificate": {
        "signed_attestation_binds_claim_artifact_commit": True,
        "independently_reproducible": True},
}


class VerdictTests(unittest.TestCase):
    def test_certified_manifest_is_certified(self):
        v = evaluate(copy.deepcopy(CERTIFIED))
        self.assertEqual(v["verdict"], "CERTIFIED")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 26)

    def test_no_register_no_claim(self):
        m = copy.deepcopy(CERTIFIED)
        m["register"]["exists"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")
        self.assertEqual(v["sections"]["claims_register"], "fail")

    def test_claim_without_property_fails(self):
        m = copy.deepcopy(CERTIFIED)
        m["register"]["property_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")

    def test_claim_exceeding_evidence_level_fails(self):
        m = copy.deepcopy(CERTIFIED)
        m["ladder"]["claim_exceeds_evidence_level"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")
        self.assertEqual(v["sections"]["evidence_ladder"], "fail")

    def test_tests_presented_as_proof_fails(self):
        m = copy.deepcopy(CERTIFIED)
        m["ladder"]["tests_presented_as_proof"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")

    def test_specs_written_after_tools_fail(self):
        m = copy.deepcopy(CERTIFIED)
        m["specs"]["written_before_tools_run"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")
        self.assertEqual(v["sections"]["specs_before_tools"], "fail")

    def test_missing_invariants_fail(self):
        m = copy.deepcopy(CERTIFIED)
        m["specs"]["invariants_written"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")

    def test_claim_without_machine_checkable_artifact_fails(self):
        m = copy.deepcopy(CERTIFIED)
        m["artifacts"]["machine_checkable_per_claim"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")
        self.assertEqual(v["sections"]["evidence_artifacts"], "fail")

    def test_suppressed_counterexample_fails(self):
        m = copy.deepcopy(CERTIFIED)
        m["artifacts"]["counterexample_suppressed"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")

    def test_no_reproduction_recipe_no_certificate(self):
        m = copy.deepcopy(CERTIFIED)
        m["artifacts"]["reproduction_recipe_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")

    def test_unwritten_exclusions_fail_scope_honesty(self):
        m = copy.deepcopy(CERTIFIED)
        m["scope"]["exclusions_written"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")
        self.assertEqual(v["sections"]["scope_honesty"], "fail")

    def test_stale_version_not_verified_fails(self):
        m = copy.deepcopy(CERTIFIED)
        m["scope"]["verified_at_current_version"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")

    def test_broken_proof_not_failing_build_fails_ci(self):
        m = copy.deepcopy(CERTIFIED)
        m["ci"]["broken_proof_fails_build"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")
        self.assertEqual(v["sections"]["ci_integration"], "fail")

    def test_no_adversarial_review_fails(self):
        m = copy.deepcopy(CERTIFIED)
        m["review"]["independent_review_done"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")
        self.assertEqual(
            v["sections"]["adversarial_and_certification"], "fail")

    def test_undisclosed_counterexample_fails(self):
        m = copy.deepcopy(CERTIFIED)
        m["review"]["counterexample_disclosed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")

    def test_no_counterexample_passes_as_not_applicable(self):
        m = copy.deepcopy(CERTIFIED)
        m["review"]["counterexample_found"] = False
        del m["review"]["counterexample_disclosed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CERTIFIED")

    def test_unsigned_attestation_fails(self):
        m = copy.deepcopy(CERTIFIED)
        m["certificate"][
            "signed_attestation_binds_claim_artifact_commit"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_CERTIFIED")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(CERTIFIED)
        del m["ci"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["ci_integration"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(CERTIFIED))
        self.assertIn("VERDICT: CERTIFIED", stamp(v))

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
            evaluate({"component": 12345, "register": "not-an-object"})
        self.assertIn("component", str(ctx.exception))

    def test_component_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"component": 12345})
        self.assertIn("component", str(ctx.exception))

    def test_register_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"register": "not-an-object"})
        self.assertIn("register", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(CERTIFIED)
        m["register"]["exists"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("register.exists", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(CERTIFIED)
        m["register"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("register", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
