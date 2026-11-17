import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from zero_knowledge_system_design_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "design_title": "vault-notes-zk-design",
    "trust_model": {"server_content_visibility_declared": True,
                    "server_metadata_visibility_declared": True,
                    "server_access_pattern_visibility_declared": True,
                    "server_role_in_design_declared": True,
                    "key_custody_description_declared": True,
                    "key_generation_location_declared": True,
                    "key_storage_location_declared": True,
                    "threat_actors_in_design_declared": True},
    "e2ee_design": {
        "client_encryption_architecture_declared": True,
        "key_derivation_approach_declared": True,
        "ciphertext_envelope_format_declared": True,
        "auth_flow_without_credential_exposure_declared": True,
        "pake_style_auth_approach_addressed": True,
        "sharing_key_wrapping_design_declared": True,
        "share_revocation_design_declared": True,
        "share_reencryption_path_declared": True},
    "proof_design": {"zkp_use_justification_declared": True,
                     "zkp_specific_claim_statement_declared": True,
                     "e2ee_alternative_for_proof_need_addressed": True,
                     "circuit_work_budget_declared": True,
                     "total_constraint_count_declared": 1500},
    "circuits": [
        {"circuit_id": "circ-1", "circuit_name": "Membership circuit",
         "statement_description": "Prover knows a secret in the set",
         "constraint_count_declared": 1000},
        {"circuit_id": "circ-2", "circuit_name": "Range circuit",
         "statement_description": "Prover knows a value in range",
         "constraint_count_declared": 500},
    ],
    "setup_and_verifier": {"trusted_setup_required": True,
                           "ceremony_procedure_declared": True,
                           "setup_parameter_generation_declared": True,
                           "setup_transcript_publication_declared": True,
                           "verifier_location_declared": True,
                           "verification_failure_handling_declared": True},
    "verifiers": [
        {"verifier_id": "ver-1", "verifier_name": "API verifier",
         "deployment_target": "api-service",
         "verification_key_reference": "vk-membership-v1"},
        {"verifier_id": "ver-2", "verifier_name": "Client verifier",
         "deployment_target": "mobile-client",
         "verification_key_reference": "vk-range-v1"},
    ],
    "properties": {"soundness_property_declaration_recorded": True,
                   "completeness_property_declaration_recorded": True,
                   "zero_knowledge_property_declaration_recorded": True,
                   "soundness_assumptions_declared": True,
                   "cryptographic_assumptions_declared": True,
                   "proof_system_selection_rationale_recorded": True,
                   "proof_system_alternatives_compared_declared": True,
                   "proof_system_selection_tradeoffs_recorded": True},
    "recovery_and_limits": {"recovery_mechanism_design_declared": True,
                            "recovery_weakening_effects_declared": True,
                            "recovery_choice_rationale_declared": True,
                            "encrypted_search_limits_declared": True,
                            "server_inference_limits_declared": True,
                            "design_limitations_declared": True},
    "claim_mappings": [
        {"mapping_id": "map-1",
         "claim_text": "The server cannot read note content",
         "mechanism_reference": "trust-model section 2, envelope format"},
        {"mapping_id": "map-2",
         "claim_text": "Membership is proved without revealing the secret",
         "mechanism_reference": "circ-1 membership circuit"},
    ],
    "red_lines": {"zk_label_without_key_custody_description_present": False,
                  "zkp_promotion_without_declared_proof_system_present": False,
                  "trusted_setup_ceremony_omitted_where_required_present": False,
                  "verifier_without_failure_handling_in_design_present": False,
                  "recovery_weakening_undisclosed_in_design_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "ZK_DESIGN_RECORD_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 59)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["zk_design_circuits_count"], 2)
        self.assertEqual(v["zk_design_verifiers_count"], 2)
        self.assertEqual(v["zk_design_claim_mappings_count"], 2)
        self.assertEqual(v["duplicate_zk_design_circuit_ids"], [])
        self.assertEqual(v["zk_design_constraint_count_sum"], "1500.000000")
        self.assertEqual(v["circuit_statement_coverage_ratio"], "1.000000")
        self.assertEqual(v["verifier_key_reference_coverage_ratio"],
                         "1.000000")
        self.assertEqual(v["claim_mapping_mechanism_coverage_ratio"],
                         "1.000000")

    def test_key_custody_not_declared_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["trust_model"]["key_custody_description_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ZK_DESIGN_RECORD_NOT_SOUND")
        self.assertEqual(v["sections"]["trust_model_and_key_custody"], "fail")
        self.assertEqual(
            check_status(v, "zk_design_pack_key_custody_description_declared"),
            "fail")

    def test_duplicate_circuit_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["circuits"][1]["circuit_id"] = "circ-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_zk_design_pack_circuit_id_unique"), "fail")
        self.assertEqual(v["duplicate_zk_design_circuit_ids"], ["circ-1"])

    def test_empty_circuits_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["circuits"] = []
        m["proof_design"]["total_constraint_count_declared"] = 0
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "zk_design_pack_circuits_list_declared"), "fail")

    def test_absent_circuits_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["circuits"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "zk_design_pack_circuits_list_declared"),
            "missing")
        self.assertIsNone(v["zk_design_circuits_count"])
        self.assertIsNone(v["computed_status"])

    def test_empty_circuit_statement_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["circuits"][0]["statement_description"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_zk_design_pack_circuit_statement_declared"),
            "fail")
        self.assertEqual(v["zk_design_circuits_without_statement"],
                         ["circ-1"])
        self.assertEqual(v["circuit_statement_coverage_ratio"], "0.500000")

    def test_negative_constraint_count_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["circuits"][0]["constraint_count_declared"] = -5
        m["proof_design"]["total_constraint_count_declared"] = 495
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_zk_design_pack_circuit_constraint_count_non_negative"),
            "fail")
        self.assertEqual(
            v["zk_design_circuits_with_invalid_constraint_count"], ["circ-1"])

    def test_total_constraint_count_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["proof_design"]["total_constraint_count_declared"] = 1501
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "zk_design_pack_total_constraint_count_recomputes"),
            "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_circuit_missing_constraint_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["circuits"][0]["constraint_count_declared"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "every_zk_design_pack_circuit_constraint_count_non_negative"),
            "missing")

    def test_ceremony_missing_where_trusted_setup_required_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["setup_and_verifier"]["ceremony_procedure_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "zk_design_pack_ceremony_procedure_declared_where_trusted_setup_required"),
            "fail")

    def test_no_trusted_setup_passes_gated_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["setup_and_verifier"]["trusted_setup_required"] = False
        m["setup_and_verifier"]["ceremony_procedure_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "zk_design_pack_ceremony_procedure_declared_where_trusted_setup_required"),
            "pass")
        self.assertEqual(v["verdict"], "ZK_DESIGN_RECORD_SOUND")

    def test_duplicate_verifier_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["verifiers"][1]["verifier_id"] = "ver-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_zk_design_pack_verifier_id_unique"),
            "fail")
        self.assertEqual(v["duplicate_zk_design_verifier_ids"], ["ver-1"])

    def test_empty_verification_key_reference_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["verifiers"][1]["verification_key_reference"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_zk_design_pack_verifier_verification_key_reference_declared"),
            "fail")
        self.assertEqual(
            v["zk_design_verifiers_without_verification_key_reference"],
            ["ver-2"])
        self.assertEqual(v["verifier_key_reference_coverage_ratio"],
                         "0.500000")

    def test_empty_mechanism_reference_fails_mapping(self):
        m = copy.deepcopy(COMPLETE)
        m["claim_mappings"][0]["mechanism_reference"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_zk_design_pack_claim_mapping_mechanism_reference_declared"),
            "fail")
        self.assertEqual(
            v["zk_design_claim_mappings_without_mechanism_reference"],
            ["map-1"])
        self.assertEqual(v["claim_mapping_mechanism_coverage_ratio"],
                         "0.500000")

    def test_soundness_declaration_absent_is_missing_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["properties"]["soundness_property_declaration_recorded"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "zk_design_pack_soundness_property_declaration_recorded"),
            "missing")

    def test_zkp_promotion_without_proof_system_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "zkp_promotion_without_declared_proof_system_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "ZK_DESIGN_RECORD_NOT_SOUND")

    def test_zk_label_without_key_custody_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "zk_label_without_key_custody_description_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "zk_design_pack_free_of_zk_label_without_key_custody_description"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["properties"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["properties_and_proof_selection"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["zk_design_circuits_count"])
        self.assertIsNone(v["zk_design_constraint_count_sum"])
        self.assertIsNone(v["circuit_statement_coverage_ratio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: ZK_DESIGN_RECORD_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["design_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("design_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"trust_model": "should-be-an-object"})
        self.assertIn("trust_model", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"circuits": {"circuit_id": "circ-1"}})
        self.assertIn("circuits", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"verifiers": ["ver-1"]})
        self.assertIn("verifiers[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["trust_model"]["key_custody_description_declared"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("trust_model.key_custody_description_declared",
                      str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["circuits"][0]["constraint_count_declared"] = "1000"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("circuits[0].constraint_count_declared",
                      str(ctx.exception))

    def test_total_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["proof_design"]["total_constraint_count_declared"] = "1500"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("proof_design.total_constraint_count_declared",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["properties"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("properties", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
