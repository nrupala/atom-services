import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from audience_contract_design import evaluate, stamp  # noqa: E402

COMPLETE = {
    "artifact": "release-gate-report",
    "classes": {"human_path_defined": True,
                "agent_path_defined": True,
                "system_path_defined": True,
                "software_path_defined": True,
                "single_class_only_shipment": False},
    "single_truth": {"canonical_source_declared": True,
                     "renderings_generated_not_maintained": True,
                     "truth_forked_per_class": False},
    "progressive_formality": {"formality_progressive_declared": True},
    "failure": {"human_failure_defined": True,
                "agent_failure_defined": True,
                "system_failure_defined": True,
                "software_failure_defined": True},
    "authority": {"dangerous_actions_present": True,
                  "capability_required": True,
                  "human_approval_required": True,
                  "software_determinism_required": True,
                  "system_audit_required": True,
                  "dangerous_path_skips_lattice": False},
    "verification": {"agents_verified_by_software": True,
                     "humans_verified_by_evidence": True,
                     "software_verified_by_spec_tests": True,
                     "systems_verified_by_audit_trails": True},
    "identity": {"human_passkey_or_mfa": True,
                 "agent_scoped_short_lived_tokens": True,
                 "system_policy_engine": True,
                 "software_service_creds_or_mtls": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_contract_complete(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "AUDIENCE_CONTRACT_COMPLETE")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 26)
        self.assertEqual(v["classes_with_path_count"], 4)

    def test_missing_class_path_fails_and_counts(self):
        m = copy.deepcopy(COMPLETE)
        m["classes"]["software_path_defined"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUDIENCE_CONTRACT_INCOMPLETE")
        self.assertEqual(v["sections"]["classes_and_paths"], "fail")
        self.assertEqual(v["classes_with_path_count"], 3)
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_absent_class_path_is_missing_and_counts_rest(self):
        m = copy.deepcopy(COMPLETE)
        del m["classes"]["agent_path_defined"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["classes_with_path_count"], 3)
        self.assertIsNone(v["computed_status"])

    def test_no_class_paths_declared_count_is_null(self):
        v = evaluate({})
        self.assertIsNone(v["classes_with_path_count"])
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_single_class_only_shipment_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["classes"]["single_class_only_shipment"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "AUDIENCE_CONTRACT_INCOMPLETE")

    def test_forked_truth_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["single_truth"]["truth_forked_per_class"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUDIENCE_CONTRACT_INCOMPLETE")
        self.assertEqual(v["sections"]["single_truth"], "fail")

    def test_renderings_maintained_separately_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["single_truth"]["renderings_generated_not_maintained"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "AUDIENCE_CONTRACT_INCOMPLETE")

    def test_failure_undefined_for_a_class_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["failure"]["agent_failure_defined"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUDIENCE_CONTRACT_INCOMPLETE")
        self.assertEqual(
            v["sections"]["progressive_formality_and_failure"], "fail")

    def test_lattice_missing_one_element_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["authority"]["system_audit_required"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUDIENCE_CONTRACT_INCOMPLETE")
        self.assertEqual(v["sections"]["authority_lattice"], "fail")
        self.assertEqual(
            check_status(v, "lattice_system_audit_required"), "fail")

    def test_lattice_element_absent_with_danger_fails_as_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["authority"]["capability_required"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "lattice_capability_required"), "missing")

    def test_no_dangerous_actions_passes_lattice_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["authority"]["dangerous_actions_present"] = False
        for field in ("capability_required", "human_approval_required",
                      "software_determinism_required",
                      "system_audit_required"):
            del m["authority"][field]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUDIENCE_CONTRACT_COMPLETE")
        self.assertEqual(
            check_status(v, "lattice_capability_required"), "pass")

    def test_dangerous_path_skipping_lattice_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["authority"]["dangerous_path_skips_lattice"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "AUDIENCE_CONTRACT_INCOMPLETE")

    def test_agent_verified_by_self_report_only_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["verification"]["agents_verified_by_software"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "AUDIENCE_CONTRACT_INCOMPLETE")

    def test_identity_missing_for_a_class_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["identity"]["system_policy_engine"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUDIENCE_CONTRACT_INCOMPLETE")
        self.assertEqual(v["sections"]["identity_by_class"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["verification"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["verification_by_class"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: AUDIENCE_CONTRACT_COMPLETE", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["artifact"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("artifact", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"classes": "should-be-an-object"})
        self.assertIn("classes", str(ctx.exception))

    def test_section_as_list_rejected(self):
        # This atom declares no list fields (the skill names a
        # fixed set of four classes, no caller list); the nearest
        # list-typed corruption — a list where an object section
        # belongs — is rejected naming the section.
        with self.assertRaises(ValueError) as ctx:
            evaluate({"failure": ["not", "an", "object"]})
        self.assertIn("failure", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["classes"]["human_path_defined"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("classes.human_path_defined", str(ctx.exception))

    def test_boolean_leaf_as_number_rejected(self):
        # This atom declares no numeric fields (the skill states
        # no number); a numeric value in a boolean leaf is
        # rejected as not-a-boolean, naming the leaf.
        m = copy.deepcopy(COMPLETE)
        m["identity"]["human_passkey_or_mfa"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("identity.human_passkey_or_mfa",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["authority"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("authority", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
