import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from encryption_claim_audit import evaluate, stamp  # noqa: E402

SOUND = {
    "product": "example-vault",
    "claims": {
        "algorithm": "AES",
        "mode": "GCM",
        "key_length_bits": 256,
        "end_to_end_encrypted": True,
        "zero_knowledge": True,
        "vague_marketing_terms_used": False,
    },
    "construction": {
        "authenticated_encryption": True,
        "custom_crypto": False,
        "nonce_unique_per_key": True,
    },
    "asymmetric": {
        "applies": True,
        "key_exchange": "X25519",
        "signatures": "Ed25519",
    },
    "key_management": {
        "keys_from_csprng": True,
        "keys_hardcoded": False,
        "storage": "platform_keystore",
        "rotation_planned": True,
        "recovery_story_documented": True,
    },
    "password_derivation": {
        "applies": True,
        "kdf": "Argon2id",
        "salt_unique_random_per_key": True,
        "password_used_directly_as_key": False,
    },
    "randomness": {"source": "os_csprng"},
    "coverage": {
        "transport": {"tls_version": "1.3", "plaintext_fallback": False},
        "at_rest": {"encrypted": True, "key_stored_with_data": False},
        "in_use": {"plaintext_logged": False,
                   "plaintext_in_crash_dumps": False},
        "fails_closed_on_crypto_error": True,
    },
    "access": {
        "server_can_read_plaintext": False,
        "server_holds_decryption_keys": False,
    },
}


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_claims_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "CLAIMS_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))

    def test_ecb_mode_fails_standard_construction(self):
        m = copy.deepcopy(SOUND)
        m["claims"]["mode"] = "ECB"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["standard_construction"], "fail")

    def test_unauthenticated_encryption_fails(self):
        m = copy.deepcopy(SOUND)
        m["construction"]["authenticated_encryption"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["standard_construction"], "fail")

    def test_nonce_reuse_fails(self):
        m = copy.deepcopy(SOUND)
        m["construction"]["nonce_unique_per_key"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")

    def test_hardcoded_keys_fail_key_management(self):
        m = copy.deepcopy(SOUND)
        m["key_management"]["keys_hardcoded"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["key_management"], "fail")

    def test_raw_sha256_kdf_fails_derivation(self):
        m = copy.deepcopy(SOUND)
        m["password_derivation"]["kdf"] = "SHA-256"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["derivation_and_randomness"], "fail")

    def test_tls_below_1_2_fails_coverage(self):
        m = copy.deepcopy(SOUND)
        m["coverage"]["transport"]["tls_version"] = "1.1"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["coverage"], "fail")

    def test_key_stored_with_data_fails_coverage(self):
        m = copy.deepcopy(SOUND)
        m["coverage"]["at_rest"]["key_stored_with_data"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["coverage"], "fail")

    def test_end_to_end_claim_with_server_plaintext_access_fails(self):
        m = copy.deepcopy(SOUND)
        m["access"]["server_can_read_plaintext"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["claim_consistency"], "fail")

    def test_zero_knowledge_claim_with_server_keys_fails(self):
        m = copy.deepcopy(SOUND)
        m["access"]["server_holds_decryption_keys"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["claim_consistency"], "fail")

    def test_vague_marketing_terms_fail_claim_specificity(self):
        m = copy.deepcopy(SOUND)
        m["claims"]["vague_marketing_terms_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["claim_specificity"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["coverage"]["transport"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["coverage"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_no_password_or_asymmetric_declared_still_sound(self):
        m = copy.deepcopy(SOUND)
        m["password_derivation"] = {"applies": False}
        m["asymmetric"] = {"applies": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_SOUND")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertIn("VERDICT: CLAIMS_SOUND", stamp(v))

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
            evaluate({"product": 12345,
                      "claims": "invalid_string_instead_of_object"})
        self.assertIn("product", str(ctx.exception))

    def test_product_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"product": 12345})
        self.assertIn("product", str(ctx.exception))

    def test_claims_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"claims": "invalid_string_instead_of_object"})
        self.assertIn("claims", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["claims"]["key_length_bits"] = "256"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("claims.key_length_bits", str(ctx.exception))

    def test_deep_nested_leaf_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["coverage"]["transport"]["tls_version"] = 1.3
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("coverage.transport.tls_version",
                      str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(SOUND)
        m["claims"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("claims", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
