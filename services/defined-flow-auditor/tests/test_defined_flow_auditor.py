import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from defined_flow_auditor import evaluate, stamp  # noqa: E402

DEFINED = {
    "system": "vault-service",
    "auth": {"every_request_authenticated": True,
             "every_request_authorized": True,
             "internal_traffic_trusted": False},
    "identity": {"access_follows_identity": True,
                 "checked_before_access": True,
                 "proof_method_named": True},
    "privilege": {"minimum_access": True, "access_expires": True,
                  "credential_exceeds_job": False},
    "segmentation": {"components_segmented": True,
                     "blast_radius_bounded": True,
                     "flat_network": False},
    "verification": {"sessions_expire": True, "tokens_rotate": True,
                     "anomalies_retrigger_auth": True},
    "gauntlet": {"server_holds_plaintext_or_keys": False,
                 "server_breach_exposes_user_data": False,
                 "trusted_components_inventoried": True,
                 "convenience_decisions_surfaced": True,
                 "backdoors_present": True, "backdoors_named": True},
    "scope": {"adversaries_named": True, "out_of_scope_named": True,
              "compromised_endpoint_limit_acknowledged": True,
              "claims_nist_alignment": True, "nist_controls_named": True},
}


class VerdictTests(unittest.TestCase):
    def test_defined_manifest_is_defined(self):
        v = evaluate(copy.deepcopy(DEFINED))
        self.assertEqual(v["verdict"], "DEFINED")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))

    def test_internal_traffic_trusted_breaks_the_claim(self):
        m = copy.deepcopy(DEFINED)
        m["auth"]["internal_traffic_trusted"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEFINED")
        self.assertEqual(v["sections"]["never_trust_always_verify"],
                         "fail")

    def test_unauthenticated_requests_fail(self):
        m = copy.deepcopy(DEFINED)
        m["auth"]["every_request_authenticated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEFINED")

    def test_overprivileged_credential_fails_least_privilege(self):
        m = copy.deepcopy(DEFINED)
        m["privilege"]["credential_exceeds_job"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEFINED")
        self.assertEqual(v["sections"]["least_privilege"], "fail")

    def test_non_expiring_access_fails(self):
        m = copy.deepcopy(DEFINED)
        m["privilege"]["access_expires"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEFINED")

    def test_flat_network_fails_segmentation(self):
        m = copy.deepcopy(DEFINED)
        m["segmentation"]["flat_network"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEFINED")
        self.assertEqual(v["sections"]["micro_segmentation"], "fail")

    def test_sessions_that_never_expire_fail_continuous_verification(self):
        m = copy.deepcopy(DEFINED)
        m["verification"]["sessions_expire"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEFINED")
        self.assertEqual(v["sections"]["continuous_verification"],
                         "fail")

    def test_server_holding_plaintext_fails_the_gauntlet(self):
        m = copy.deepcopy(DEFINED)
        m["gauntlet"]["server_holds_plaintext_or_keys"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEFINED")
        self.assertEqual(v["sections"]["claim_gauntlet"], "fail")

    def test_server_breach_exposing_data_fails_the_gauntlet(self):
        m = copy.deepcopy(DEFINED)
        m["gauntlet"]["server_breach_exposes_user_data"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEFINED")

    def test_unnamed_backdoor_fails(self):
        m = copy.deepcopy(DEFINED)
        m["gauntlet"]["backdoors_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEFINED")

    def test_no_backdoor_passes_as_not_applicable(self):
        m = copy.deepcopy(DEFINED)
        m["gauntlet"]["backdoors_present"] = False
        del m["gauntlet"]["backdoors_named"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DEFINED")

    def test_nist_claim_without_named_controls_fails(self):
        m = copy.deepcopy(DEFINED)
        m["scope"]["nist_controls_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEFINED")
        self.assertEqual(v["sections"]["scope_and_limits"], "fail")

    def test_no_nist_claim_passes_controls_check_as_not_applicable(self):
        m = copy.deepcopy(DEFINED)
        m["scope"]["claims_nist_alignment"] = False
        del m["scope"]["nist_controls_named"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DEFINED")

    def test_unnamed_adversaries_fail_scope(self):
        m = copy.deepcopy(DEFINED)
        m["scope"]["adversaries_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_DEFINED")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(DEFINED)
        del m["verification"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["continuous_verification"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(DEFINED))
        self.assertIn("VERDICT: DEFINED", stamp(v))

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
            evaluate({"system": "malformed-test",
                      "auth": {"every_request_authenticated":
                               "YES_PLEASE"}})
        self.assertIn("auth.every_request_authenticated",
                      str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"auth": "not-an-object"})
        self.assertIn("auth", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(DEFINED)
        m["auth"]["every_request_authenticated"] = "YES_PLEASE"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("auth.every_request_authenticated",
                      str(ctx.exception))

    def test_nested_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(DEFINED)
        m["gauntlet"]["backdoors_named"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("gauntlet.backdoors_named", str(ctx.exception))

    def test_system_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"system": 42})
        self.assertIn("system", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(DEFINED)
        m["scope"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("scope", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
