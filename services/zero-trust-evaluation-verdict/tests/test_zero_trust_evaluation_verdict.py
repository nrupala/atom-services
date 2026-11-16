import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from zero_trust_evaluation_verdict import evaluate, stamp  # noqa: E402

SUSTAINED = {
    "system": "home-office vault + storage",
    "evaluation": {"claim_stated": True,
                   "adversaries_named": True,
                   "out_of_scope_named": True,
                   "not_certification_acknowledged": True},
    "gauntlet": {"authentication_point_identified": True,
                 "session_trusted_indefinitely": False,
                 "master_secret_leaves_client": False,
                 "server_sees_only_encrypted_data": True,
                 "server_breach_exposes_user_data": False},
    "identity": {"checked_before_access": True,
                 "proof_method_named": True},
    "cryptography": {"password_kdf": "argon2id",
                     "minimum_secret_length_chars": 16,
                     "claims_nist_alignment": True,
                     "nist_controls_named": True},
    "findings": {"least_privilege_evaluated": True,
                 "credential_exceeds_job": False,
                 "blast_radius_bounded": True,
                 "flat_network": False,
                 "trust_rechecked_after_login": True},
    "inventory": {"trusted_components_inventoried": True,
                  "backdoors_present": True,
                  "backdoors_named": True,
                  "convenience_decisions_surfaced": True,
                  "internal_network_trusted": False},
    "limits": {"compromised_endpoint_limit_acknowledged": True,
               "usability_tradeoff_stated": True,
               "design_claims_only_acknowledged": True},
}


class VerdictTests(unittest.TestCase):
    def test_sustained_manifest_is_claim_sustained(self):
        v = evaluate(copy.deepcopy(SUSTAINED))
        self.assertEqual(v["verdict"], "CLAIM_SUSTAINED")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["claim_status"],
                         "sustained_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 26)

    def test_secret_length_margin_serialized_at_fixed_4dp(self):
        v = evaluate(copy.deepcopy(SUSTAINED))
        self.assertEqual(v["secret_length_margin_chars"], "0.0000")
        m = copy.deepcopy(SUSTAINED)
        m["cryptography"]["minimum_secret_length_chars"] = 20
        self.assertEqual(evaluate(m)["secret_length_margin_chars"],
                         "4.0000")

    def test_secret_length_below_stated_minimum_fails(self):
        m = copy.deepcopy(SUSTAINED)
        m["cryptography"]["minimum_secret_length_chars"] = 12
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_NOT_SUSTAINED")
        self.assertEqual(
            v["sections"]["identity_and_authenticator_strength"], "fail")
        self.assertEqual(v["claim_status"],
                         "not_sustained_on_declared_evidence")
        self.assertEqual(v["secret_length_margin_chars"], "-4.0000")

    def test_secret_length_exactly_at_minimum_passes(self):
        m = copy.deepcopy(SUSTAINED)
        m["cryptography"]["minimum_secret_length_chars"] = 16
        self.assertEqual(evaluate(m)["verdict"], "CLAIM_SUSTAINED")

    def test_non_argon2id_kdf_fails(self):
        for kdf in ("pbkdf2", "sha256", "bcrypt"):
            m = copy.deepcopy(SUSTAINED)
            m["cryptography"]["password_kdf"] = kdf
            v = evaluate(m)
            self.assertEqual(v["verdict"], "CLAIM_NOT_SUSTAINED", kdf)
            self.assertEqual(v["claim_status"],
                             "not_sustained_on_declared_evidence", kdf)

    def test_missing_kdf_is_missing_not_failed(self):
        m = copy.deepcopy(SUSTAINED)
        del m["cryptography"]["password_kdf"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["claim_status"])

    def test_non_numeric_secret_length_is_missing(self):
        # F1 correction (coordinator ruling, 2026-11-15): this test
        # previously asserted an INSUFFICIENT_EVIDENCE verdict over a
        # wrong-typed documented field — that assertion encoded the
        # F1 defect itself. A non-numeric minimum_secret_length_chars
        # is invalid input and is now rejected with ValueError
        # naming the field.
        m = copy.deepcopy(SUSTAINED)
        m["cryptography"]["minimum_secret_length_chars"] = "sixteen"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("cryptography.minimum_secret_length_chars",
                      str(ctx.exception))

    def test_session_trusted_indefinitely_fails_gauntlet(self):
        m = copy.deepcopy(SUSTAINED)
        m["gauntlet"]["session_trusted_indefinitely"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_NOT_SUSTAINED")
        self.assertEqual(
            v["sections"]["authentication_and_server_trust"], "fail")

    def test_master_secret_leaving_client_fails_red_line(self):
        m = copy.deepcopy(SUSTAINED)
        m["gauntlet"]["master_secret_leaves_client"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_NOT_SUSTAINED")
        self.assertEqual(
            v["sections"]["authentication_and_server_trust"], "fail")

    def test_server_breach_exposing_data_fails(self):
        m = copy.deepcopy(SUSTAINED)
        m["gauntlet"]["server_breach_exposes_user_data"] = True
        self.assertEqual(evaluate(m)["verdict"], "CLAIM_NOT_SUSTAINED")

    def test_server_seeing_plaintext_fails(self):
        m = copy.deepcopy(SUSTAINED)
        m["gauntlet"]["server_sees_only_encrypted_data"] = False
        self.assertEqual(evaluate(m)["verdict"], "CLAIM_NOT_SUSTAINED")

    def test_claim_not_stated_fails(self):
        m = copy.deepcopy(SUSTAINED)
        m["evaluation"]["claim_stated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_NOT_SUSTAINED")
        self.assertEqual(v["sections"]["claim_and_scope"], "fail")

    def test_adversaries_not_named_fails(self):
        m = copy.deepcopy(SUSTAINED)
        m["evaluation"]["adversaries_named"] = False
        self.assertEqual(evaluate(m)["verdict"], "CLAIM_NOT_SUSTAINED")

    def test_unnamed_backdoor_fails(self):
        m = copy.deepcopy(SUSTAINED)
        m["inventory"]["backdoors_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_NOT_SUSTAINED")
        self.assertEqual(v["sections"]["trust_inventory"], "fail")

    def test_no_backdoor_passes_naming_as_not_applicable(self):
        m = copy.deepcopy(SUSTAINED)
        m["inventory"]["backdoors_present"] = False
        del m["inventory"]["backdoors_named"]
        self.assertEqual(evaluate(m)["verdict"], "CLAIM_SUSTAINED")

    def test_nist_claim_without_controls_named_fails(self):
        m = copy.deepcopy(SUSTAINED)
        m["cryptography"]["nist_controls_named"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_NOT_SUSTAINED")
        self.assertEqual(
            v["sections"]["identity_and_authenticator_strength"], "fail")

    def test_no_nist_claim_passes_controls_as_not_applicable(self):
        m = copy.deepcopy(SUSTAINED)
        m["cryptography"]["claims_nist_alignment"] = False
        del m["cryptography"]["nist_controls_named"]
        self.assertEqual(evaluate(m)["verdict"], "CLAIM_SUSTAINED")

    def test_credential_exceeding_job_fails(self):
        m = copy.deepcopy(SUSTAINED)
        m["findings"]["credential_exceeds_job"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_NOT_SUSTAINED")
        self.assertEqual(
            v["sections"]["privilege_segmentation_and_verification"],
            "fail")

    def test_flat_network_fails(self):
        m = copy.deepcopy(SUSTAINED)
        m["findings"]["flat_network"] = True
        self.assertEqual(evaluate(m)["verdict"], "CLAIM_NOT_SUSTAINED")

    def test_internal_network_trusted_fails(self):
        m = copy.deepcopy(SUSTAINED)
        m["inventory"]["internal_network_trusted"] = True
        self.assertEqual(evaluate(m)["verdict"], "CLAIM_NOT_SUSTAINED")

    def test_trust_not_rechecked_after_login_fails(self):
        m = copy.deepcopy(SUSTAINED)
        m["findings"]["trust_rechecked_after_login"] = False
        self.assertEqual(evaluate(m)["verdict"], "CLAIM_NOT_SUSTAINED")

    def test_compromised_endpoint_limit_not_acknowledged_fails(self):
        m = copy.deepcopy(SUSTAINED)
        m["limits"]["compromised_endpoint_limit_acknowledged"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIM_NOT_SUSTAINED")
        self.assertEqual(v["sections"]["honest_limits"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SUSTAINED)
        del m["limits"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["honest_limits"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["claim_status"])
        self.assertIsNone(v["secret_length_margin_chars"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SUSTAINED))
        self.assertIn("VERDICT: CLAIM_SUSTAINED", stamp(v))

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
                      "evaluation": "not-an-object"})
        self.assertIn("evaluation", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"gauntlet": "not-an-object"})
        self.assertIn("gauntlet", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SUSTAINED)
        m["limits"]["usability_tradeoff_stated"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("limits.usability_tradeoff_stated",
                      str(ctx.exception))

    def test_kdf_as_number_rejected(self):
        m = copy.deepcopy(SUSTAINED)
        m["cryptography"]["password_kdf"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("cryptography.password_kdf", str(ctx.exception))

    def test_secret_length_as_string_rejected(self):
        m = copy.deepcopy(SUSTAINED)
        m["cryptography"]["minimum_secret_length_chars"] = "sixteen"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("cryptography.minimum_secret_length_chars",
                      str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(SUSTAINED)
        m["inventory"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("inventory", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
