import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from crypto_inventory_pq_migration_map import evaluate, stamp  # noqa: E402

COMPLETE = {
    "system": "product-signing-and-archives",
    "inventory": [
        {"id": "archive-envelope", "surface": "at_rest_envelope",
         "algorithm": "RSA-2048", "purpose": "key_exchange",
         "shelf_life_years": 30, "owner": "platform"},
        {"id": "tls-edge", "surface": "tls",
         "algorithm": "ECDHE-X25519", "purpose": "key_exchange",
         "shelf_life_years": 5, "owner": "platform"},
        {"id": "firmware-signing", "surface": "firmware_signing",
         "algorithm": "ECDSA-P256", "purpose": "signature",
         "shelf_life_years": 15, "owner": "release"},
        {"id": "agent-trust-hybrid", "surface": "agent_trust_root",
         "algorithm": "X25519+ML-KEM-768", "purpose": "key_exchange",
         "shelf_life_years": 10, "owner": "agents"},
        {"id": "new-kem", "surface": "tls",
         "algorithm": "ML-KEM-768", "purpose": "key_exchange",
         "shelf_life_years": 10, "owner": "platform"},
        {"id": "archive-aes", "surface": "at_rest_envelope",
         "algorithm": "AES-256-GCM", "purpose": "encryption",
         "shelf_life_years": 30, "owner": "platform"},
    ],
}


def _by_id(result):
    return {row["id"]: row for row in result["migration_map"]}


class MigrationMapTests(unittest.TestCase):
    def test_complete_inventory_is_complete_and_prioritised(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["status"], "complete")
        self.assertEqual(
            [row["id"] for row in v["migration_map"]],
            ["archive-envelope", "firmware-signing", "tls-edge",
             "agent-trust-hybrid", "new-kem", "archive-aes"])
        self.assertEqual(
            [row["priority_rank"] for row in v["migration_map"]],
            [1, 2, 3, 4, 5, 6])
        self.assertEqual(v["counts"]["migration_needed"], 3)

    def test_rsa_key_exchange_targets_ml_kem_hybrid(self):
        row = _by_id(evaluate(copy.deepcopy(COMPLETE)))["archive-envelope"]
        self.assertEqual(row["classification"], "quantum_vulnerable")
        self.assertEqual(row["action"], "migrate_hybrid")
        self.assertEqual(row["target_family"], "ML-KEM (FIPS 203)")

    def test_ecdsa_signature_targets_ml_dsa_or_slh_dsa(self):
        row = _by_id(evaluate(copy.deepcopy(COMPLETE)))["firmware-signing"]
        self.assertEqual(row["classification"], "quantum_vulnerable")
        self.assertEqual(row["target_family"],
                         "ML-DSA (FIPS 204) / SLH-DSA (FIPS 205)")

    def test_vulnerable_without_purpose_gets_dual_family_target(self):
        v = evaluate({"inventory": [
            {"id": "bare-rsa", "algorithm": "RSA-4096",
             "shelf_life_years": 20}]})
        row = v["migration_map"][0]
        self.assertEqual(
            row["target_family"],
            "ML-KEM (FIPS 203) for key exchange; ML-DSA (FIPS 204) / "
            "SLH-DSA (FIPS 205) for signatures")

    def test_ml_kem_is_pq_ready_and_retained(self):
        row = _by_id(evaluate(copy.deepcopy(COMPLETE)))["new-kem"]
        self.assertEqual(row["classification"], "pq_ready")
        self.assertEqual(row["action"], "retain_pq")
        self.assertEqual(row["target_family"], "ML-KEM (FIPS 203)")

    def test_slh_dsa_is_pq_ready_with_its_own_family(self):
        v = evaluate({"inventory": [
            {"id": "root-signing", "algorithm": "SLH-DSA-SHA2-128s",
             "purpose": "signature", "shelf_life_years": 25}]})
        row = v["migration_map"][0]
        self.assertEqual(row["classification"], "pq_ready")
        self.assertEqual(row["target_family"], "SLH-DSA (FIPS 205)")
        self.assertEqual(v["status"], "complete")

    def test_classical_plus_pq_is_hybrid(self):
        row = _by_id(evaluate(copy.deepcopy(COMPLETE)))[
            "agent-trust-hybrid"]
        self.assertEqual(row["classification"], "hybrid_classical_pq")
        self.assertEqual(row["action"], "complete_hybrid_transition")
        self.assertEqual(row["target_family"], "ML-KEM (FIPS 203)")

    def test_aes_256_is_not_quantum_broken_and_needs_no_migration(self):
        row = _by_id(evaluate(copy.deepcopy(COMPLETE)))["archive-aes"]
        self.assertEqual(row["classification"],
                         "symmetric_or_hash_not_broken")
        self.assertEqual(row["action"], "no_pq_migration_needed")
        self.assertIsNone(row["target_family"])
        self.assertEqual(row["priority_rank"], 6)

    def test_hash_algorithm_is_symmetric_or_hash(self):
        v = evaluate({"inventory": [
            {"id": "integrity", "algorithm": "SHA-256",
             "shelf_life_years": 10}]})
        self.assertEqual(v["migration_map"][0]["classification"],
                         "symmetric_or_hash_not_broken")
        self.assertEqual(v["status"], "complete")

    def test_ed25519_signing_is_quantum_vulnerable(self):
        v = evaluate({"inventory": [
            {"id": "code-signing", "algorithm": "Ed25519",
             "purpose": "signature", "shelf_life_years": 12}]})
        row = v["migration_map"][0]
        self.assertEqual(row["classification"], "quantum_vulnerable")
        self.assertEqual(row["target_family"],
                         "ML-DSA (FIPS 204) / SLH-DSA (FIPS 205)")

    def test_unknown_algorithm_is_partial_and_unranked_by_family(self):
        v = evaluate({"inventory": [
            {"id": "mystery", "algorithm": "CustomCipher-9000",
             "shelf_life_years": 40},
            {"id": "known-rsa", "algorithm": "RSA-2048",
             "purpose": "key_exchange", "shelf_life_years": 1}]})
        self.assertEqual(v["status"], "partial")
        rows = _by_id(v)
        self.assertEqual(rows["mystery"]["classification"], "unknown")
        self.assertEqual(rows["mystery"]["action"],
                         "classify_before_planning")
        self.assertIsNone(rows["mystery"]["target_family"])
        # Vulnerable outranks unknown despite the shorter shelf-life:
        # priority is group order first, shelf-life within the group.
        self.assertEqual(rows["known-rsa"]["priority_rank"], 1)
        self.assertEqual(rows["mystery"]["priority_rank"], 2)

    def test_missing_shelf_life_is_partial_and_sorts_last_in_group(self):
        v = evaluate({"inventory": [
            {"id": "no-shelf", "algorithm": "RSA-2048",
             "purpose": "key_exchange"},
            {"id": "short-shelf", "algorithm": "RSA-2048",
             "purpose": "key_exchange", "shelf_life_years": 2}]})
        self.assertEqual(v["status"], "partial")
        self.assertEqual(v["counts"]["missing_shelf_life"], 1)
        self.assertEqual([row["id"] for row in v["migration_map"]],
                         ["short-shelf", "no-shelf"])
        self.assertIsNone(v["migration_map"][1]["shelf_life_years"])

    def test_equal_shelf_life_keeps_submission_order(self):
        v = evaluate({"inventory": [
            {"id": "first", "algorithm": "RSA-2048",
             "shelf_life_years": 10},
            {"id": "second", "algorithm": "ECDSA-P384",
             "shelf_life_years": 10}]})
        self.assertEqual([row["id"] for row in v["migration_map"]],
                         ["first", "second"])

    def test_non_object_entries_are_invalid_and_partial(self):
        v = evaluate({"inventory": [
            "not-an-entry",
            {"id": "ok", "algorithm": "ML-DSA-65",
             "purpose": "signature", "shelf_life_years": 20}]})
        self.assertEqual(v["status"], "partial")
        self.assertEqual(v["counts"]["invalid_entries"], 1)
        self.assertEqual(v["counts"]["total"], 1)
        self.assertEqual(v["migration_map"][0]["target_family"],
                         "ML-DSA (FIPS 204)")

    def test_all_invalid_entries_are_insufficient_evidence(self):
        v = evaluate({"inventory": ["nope", 42]})
        self.assertEqual(v["status"], "insufficient_evidence")
        self.assertEqual(v["migration_map"], [])
        self.assertEqual(v["counts"]["invalid_entries"], 2)

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["status"], "insufficient_evidence")
        self.assertEqual(v["migration_map"], [])

    def test_empty_inventory_is_insufficient_evidence(self):
        self.assertEqual(evaluate({"inventory": []})["status"],
                         "insufficient_evidence")

    def test_non_list_inventory_is_rejected(self):
        # Split from the former
        # test_empty_or_non_list_inventory_is_insufficient_evidence:
        # a non-list inventory is a type violation (F1), not evidence.
        with self.assertRaises(ValueError) as ctx:
            evaluate({"inventory": "tls-everywhere"})
        self.assertIn("inventory", str(ctx.exception))

    def test_missing_owner_is_counted_not_blocking(self):
        v = evaluate({"inventory": [
            {"id": "owned", "algorithm": "RSA-2048",
             "shelf_life_years": 10, "owner": "platform"},
            {"id": "unowned", "algorithm": "RSA-2048",
             "shelf_life_years": 9}]})
        self.assertEqual(v["status"], "complete")
        self.assertEqual(v["counts"]["missing_owner"], 1)
        self.assertIsNone(_by_id(v)["unowned"]["owner"])

    def test_stamp_names_the_status(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        text = stamp(v)
        self.assertIn("STATUS: complete", text)
        self.assertIn("system: product-signing-and-archives", text)

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict.
    The first case mirrors the recorded external malformed input.
    Inventory entries stay unvalidated by design: non-object
    entries are counted invalid and skipped (see the entry tests
    in MigrationMapTests, which remain verdict tests)."""

    def test_recorded_malformed_case_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"system": 12345, "inventory": "not-a-list"})
        self.assertIn("system", str(ctx.exception))

    def test_inventory_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"system": "ok", "inventory": "not-a-list"})
        self.assertIn("inventory", str(ctx.exception))

    def test_null_system_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"system": None, "inventory": []})
        self.assertIn("system", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
