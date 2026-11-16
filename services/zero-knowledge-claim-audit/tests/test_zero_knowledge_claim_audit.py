import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from zero_knowledge_claim_audit import evaluate, stamp  # noqa: E402

SOUND = {
    "product": "example-vault",
    "claims": {"claim_basis": "cryptographic_guarantee"},
    "access": {"server_can_read_user_data": False},
    "storage": {"server_stores_only_opaque_bytes": True},
    "encryption": {
        "encryption_happens_on_client_device": True,
        "plaintext_exists_only_on_client_device": True,
        "authenticated_encryption": True,
        "relies_on_tls_alone": False,
    },
    "keys": {
        "keys_never_leave_device": True,
        "key_derivation_client_side": True,
        "key_journey_documented": True,
        "key_backup_uploads_key_to_server": False,
    },
    "trust": {
        "key_escrow": False,
        "recovery_backdoor": False,
        "admin_plaintext_view": False,
        "trusted_components": [
            "client", "operating_system", "distribution_channel",
        ],
        "trusted_third_parties_in_data_path": [],
    },
    "recovery": {
        "password_reset_recovers_data": False,
        "no_recovery_possible_claimed": True,
    },
    "scope": {
        "plaintext_locations_documented": True,
        "plaintext_in_logs": False,
        "plaintext_in_crash_dumps": False,
        "plaintext_in_thumbnails_or_previews": False,
        "metadata_leakage_acknowledged": True,
        "residual_risks_documented": True,
    },
    "theater": {
        "client_type": "locally_installed_client",
        "web_app_trust_distinction_acknowledged": False,
        "search_or_indexing_requires_server_plaintext_or_tokens": False,
        "threat_model_includes_malicious_operator": True,
    },
}


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_claims_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "CLAIMS_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 27)

    def test_server_can_read_user_data_fails_core_test(self):
        m = copy.deepcopy(SOUND)
        m["access"]["server_can_read_user_data"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["core_test"], "fail")

    def test_policy_promise_basis_fails_core_test(self):
        m = copy.deepcopy(SOUND)
        m["claims"]["claim_basis"] = "policy_promise"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["core_test"], "fail")

    def test_server_side_encryption_fails_client_side_section(self):
        m = copy.deepcopy(SOUND)
        m["encryption"]["encryption_happens_on_client_device"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["client_side_encryption"], "fail")

    def test_unauthenticated_encryption_fails(self):
        m = copy.deepcopy(SOUND)
        m["encryption"]["authenticated_encryption"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["client_side_encryption"], "fail")

    def test_tls_alone_fails(self):
        m = copy.deepcopy(SOUND)
        m["encryption"]["relies_on_tls_alone"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")

    def test_keys_leaving_device_fails_key_journey(self):
        m = copy.deepcopy(SOUND)
        m["keys"]["keys_never_leave_device"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["key_journey"], "fail")

    def test_key_backup_to_server_fails_key_journey(self):
        m = copy.deepcopy(SOUND)
        m["keys"]["key_backup_uploads_key_to_server"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["key_journey"], "fail")

    def test_key_escrow_fails_trusted_parties(self):
        m = copy.deepcopy(SOUND)
        m["trust"]["key_escrow"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["trusted_parties_and_recovery"],
                         "fail")

    def test_admin_plaintext_view_fails_trusted_parties(self):
        m = copy.deepcopy(SOUND)
        m["trust"]["admin_plaintext_view"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["trusted_parties_and_recovery"],
                         "fail")

    def test_trusted_components_missing_os_fails(self):
        m = copy.deepcopy(SOUND)
        m["trust"]["trusted_components"] = ["client",
                                            "distribution_channel"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["trusted_parties_and_recovery"],
                         "fail")

    def test_contradictory_recovery_claims_fail(self):
        m = copy.deepcopy(SOUND)
        m["recovery"]["password_reset_recovers_data"] = True
        # no_recovery_possible_claimed stays True -> both claimed
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["trusted_parties_and_recovery"],
                         "fail")

    def test_plaintext_in_logs_fails_scope(self):
        m = copy.deepcopy(SOUND)
        m["scope"]["plaintext_in_logs"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["plaintext_and_metadata_scope"],
                         "fail")

    def test_metadata_leakage_unacknowledged_fails_scope(self):
        m = copy.deepcopy(SOUND)
        m["scope"]["metadata_leakage_acknowledged"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["plaintext_and_metadata_scope"],
                         "fail")

    def test_web_app_without_distinction_fails_theater(self):
        m = copy.deepcopy(SOUND)
        m["theater"]["client_type"] = "web_app_served_by_same_server"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["theater_and_threat_model"], "fail")

    def test_web_app_with_distinction_still_sound(self):
        m = copy.deepcopy(SOUND)
        m["theater"]["client_type"] = "web_app_served_by_same_server"
        m["theater"]["web_app_trust_distinction_acknowledged"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_SOUND")

    def test_search_requiring_server_tokens_fails_theater(self):
        m = copy.deepcopy(SOUND)
        m["theater"][
            "search_or_indexing_requires_server_plaintext_or_tokens"
        ] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["theater_and_threat_model"], "fail")

    def test_threat_model_excluding_malicious_operator_fails(self):
        m = copy.deepcopy(SOUND)
        m["theater"]["threat_model_includes_malicious_operator"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CLAIMS_UNSOUND")
        self.assertEqual(v["sections"]["theater_and_threat_model"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["keys"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["key_journey"],
                         "insufficient_evidence")

    def test_partial_recovery_evidence_is_insufficient(self):
        m = copy.deepcopy(SOUND)
        del m["recovery"]["no_recovery_possible_claimed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["trusted_parties_and_recovery"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(
            s == "insufficient_evidence" for s in v["sections"].values()))

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
            evaluate({"product": "MalformedAudit",
                      "claims": {"claim_basis": 12345},
                      "access": "not_an_object"})
        self.assertIn("claims.claim_basis", str(ctx.exception))

    def test_claim_basis_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"claims": {"claim_basis": 12345}})
        self.assertIn("claims.claim_basis", str(ctx.exception))

    def test_access_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"access": "not_an_object"})
        self.assertIn("access", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["keys"]["keys_never_leave_device"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("keys.keys_never_leave_device", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["trust"]["trusted_components"] = "client"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("trust.trusted_components", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["trust"]["trusted_components"] = ["client", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("trust.trusted_components[1]", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(SOUND)
        m["scope"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("scope", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
