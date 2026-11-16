import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from license_compliance_check import evaluate, stamp  # noqa: E402

COMPLIANT = {
    "product": "example-app",
    "distribution_model": "proprietary_binary",
    "project_license": "MIT",
    "license_decision": {"logged": True},
    "license_file": {"present": True, "texts_unmodified": True},
    "notice_file": {"present": True},
    "source_headers": {"present": True},
    "components": [
        {"name": "lib-a", "license": "MIT",
         "requires_attribution": True, "requires_bundled_license": True},
        {"name": "lib-b", "license": "Apache-2.0",
         "requires_attribution": True, "requires_bundled_license": True},
    ],
    "dependency_scan": {"completed": True, "clean": True,
                        "accepted_with_record": False,
                        "incompatible_shipped": False},
    "attribution": {"shipped": True},
    "bundled_licenses": {"shipped": True},
    "contributor_terms": {"policy": "DCO",
                          "documented_in_contributing": True,
                          "enforced": True},
    "trademark": {"usage_rules_documented": True,
                  "implied_endorsement": False},
    "public_claims": {"claims_made": ["compliant"],
                      "attestation_present": True},
    "client_work": {"is_client_work": False,
                    "contract_constraints_reviewed": False},
}


class VerdictTests(unittest.TestCase):
    def test_compliant_manifest_is_compliant(self):
        v = evaluate(copy.deepcopy(COMPLIANT))
        self.assertEqual(v["verdict"], "COMPLIANT")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 19)

    def test_copyleft_in_proprietary_binary_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["components"].append(
            {"name": "lib-gpl", "license": "GPL-3.0",
             "requires_attribution": False, "requires_bundled_license": False}
        )
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")
        self.assertEqual(v["sections"]["dependency_compatibility"], "fail")

    def test_copyleft_in_open_source_distribution_passes_that_check(self):
        m = copy.deepcopy(COMPLIANT)
        m["distribution_model"] = "open_source"
        m["project_license"] = "GPL-3.0"
        m["components"] = [
            {"name": "lib-gpl", "license": "GPL-3.0",
             "requires_attribution": False, "requires_bundled_license": False}
        ]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMPLIANT")

    def test_edited_license_text_is_a_red_line_fail(self):
        m = copy.deepcopy(COMPLIANT)
        m["license_file"]["texts_unmodified"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")
        self.assertEqual(v["sections"]["license_files"], "fail")

    def test_missing_attribution_shipment_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["attribution"]["shipped"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")

    def test_incompatible_dependency_shipped_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["dependency_scan"]["incompatible_shipped"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")

    def test_dirty_scan_accepted_with_record_passes(self):
        m = copy.deepcopy(COMPLIANT)
        m["dependency_scan"]["clean"] = False
        m["dependency_scan"]["accepted_with_record"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "COMPLIANT")

    def test_dirty_scan_without_record_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["dependency_scan"]["clean"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")

    def test_absent_notice_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLIANT)
        del m["notice_file"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["license_files"],
                         "insufficient_evidence")

    def test_unattested_public_claim_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["public_claims"]["attestation_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")
        self.assertEqual(v["sections"]["claims_and_contracts"], "fail")

    def test_unknown_contributor_policy_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["contributor_terms"]["policy"] = "none"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")
        self.assertEqual(v["sections"]["contributor_terms"], "fail")

    def test_copyleft_project_without_decision_log_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["distribution_model"] = "open_source"
        m["project_license"] = "AGPL-3.0"
        m["license_decision"]["logged"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")

    def test_client_work_without_contract_review_fails(self):
        m = copy.deepcopy(COMPLIANT)
        m["client_work"] = {"is_client_work": True,
                            "contract_constraints_reviewed": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NON_COMPLIANT")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_stamp_names_the_verdict_and_not_legal_advice(self):
        v = evaluate(copy.deepcopy(COMPLIANT))
        s = stamp(v)
        self.assertIn("VERDICT: COMPLIANT", s)
        self.assertIn("Not legal advice", s)

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
            evaluate({"product": "BadTypeApp", "distribution_model": 123,
                      "components": "not-an-array"})
        self.assertIn("distribution_model", str(ctx.exception))

    def test_distribution_model_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"distribution_model": 123})
        self.assertIn("distribution_model", str(ctx.exception))

    def test_components_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"components": "not-an-array"})
        self.assertIn("components", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLIANT)
        m["license_file"]["present"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("license_file.present", str(ctx.exception))

    def test_component_entry_leaf_as_number_rejected(self):
        m = copy.deepcopy(COMPLIANT)
        m["components"][0]["license"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("components[0].license", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(COMPLIANT)
        m["components"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("components", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
