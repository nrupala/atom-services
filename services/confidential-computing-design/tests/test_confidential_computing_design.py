import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from confidential_computing_design import evaluate, stamp  # noqa: E402


COMPLETE = {
    "entity": "Acme Enclave Design",
    "threat_model": {
        "documented": True,
        "protects_against": ["host_access", "operator_access",
                             "co_tenant_access"],
        "does_not_protect_against": ["side_channels", "supply_chain",
                                      "flawed_enclave_code",
                                      "unsealed_inputs_outputs"],
        "claims_require_threat_model": True},
    "technology": {"name": "AMD SEV-SNP",
                   "distinctions_considered": True,
                   "chosen_by_workload_shape": True,
                   "chosen_by_available_hardware": True},
    "attestation": {"verification_implemented": True,
                    "verification_tested": True,
                    "measurement_verified": True,
                    "fresh_nonce_verified": True,
                    "verified_before_trusting": True},
    "enclave": {
        "sealed_keys_bound_to_identity_or_measurement": True,
        "attested_tls_used": True,
        "surface_area_minimized": True,
        "trusted_components": [
            {"name": "loader", "trusted_lines": 1200},
            {"name": "crypto", "trusted_lines": 3400},
            {"name": "api", "trusted_lines": 800}],
        "declared_trusted_codebase_lines": 5400,
        "debug_enabled_in_production": False},
    "engineering": {"reproducible_builds": True,
                    "signed_enclave_images": True,
                    "measurements_versioned_and_pinned": True,
                    "real_attestation_in_ci_or_staging": True,
                    "fallback_documented": True,
                    "silent_downgrade_used": False},
    "keys": {"sealed_keys_tested_including_recovery": True,
             "root_keys_stored_unsealed_beside_enclave": False,
             "rotation_designed": True,
             "recovery_designed": True,
             "measurement_changes_invalidating_seals_documented": True},
    "claims": {
        "claims_match_evidence": True,
        "marketing_mechanism_audit_done": True,
        "public_exclusions": ["side_channels", "supply_chain",
                              "flawed_enclave_code",
                              "unsealed_inputs_outputs"],
        "unverifiable_secure_enclave_claims_made": False,
        "regulatory_compliance_paired_where_required": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 35)
        self.assertEqual(v["components_evaluated"], 3)
        self.assertEqual(v["computed_trusted_codebase_lines"],
                         "5400.000000")
        self.assertEqual(v["trusted_codebase_difference"], "0.000000")
        self.assertEqual(v["threat_protects_not_covered"], [])
        self.assertEqual(v["threat_exclusions_not_covered"], [])
        self.assertEqual(v["claims_exclusions_not_listed"], [])

    def test_trusted_codebase_at_other_values_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["enclave"]["trusted_components"] = [
            {"name": "core", "trusted_lines": 250.5}]
        m["enclave"]["declared_trusted_codebase_lines"] = 250.5
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_READY")
        self.assertEqual(v["computed_trusted_codebase_lines"],
                         "250.500000")

    def test_trusted_codebase_total_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["enclave"]["declared_trusted_codebase_lines"] = 5000
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")
        self.assertEqual(v["sections"]["enclave_patterns"], "fail")
        self.assertEqual(
            check_status(
                v, "trusted_codebase_total_matches_component_sum"),
            "fail")
        self.assertEqual(v["trusted_codebase_difference"],
                         "-400.000000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_missing_components_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["enclave"]["trusted_components"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "trusted_codebase_total_matches_component_sum"),
            "missing")
        self.assertEqual(v["components_evaluated"], 0)
        self.assertIsNone(v["computed_trusted_codebase_lines"])
        self.assertIsNone(v["computed_status"])

    def test_empty_components_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["enclave"]["trusted_components"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "trusted_component_entries_complete"),
            "missing")

    def test_incomplete_component_entry_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["enclave"]["trusted_components"][1]["trusted_lines"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "trusted_component_entries_complete"),
            "missing")
        self.assertEqual(v["components_evaluated"], 2)
        self.assertIsNone(v["computed_trusted_codebase_lines"])

    def test_missing_declared_total_is_missing_but_sum_computed(self):
        m = copy.deepcopy(COMPLETE)
        del m["enclave"]["declared_trusted_codebase_lines"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "trusted_codebase_total_matches_component_sum"),
            "missing")
        self.assertEqual(v["computed_trusted_codebase_lines"],
                         "5400.000000")
        self.assertIsNone(v["trusted_codebase_difference"])

    def test_protects_coverage_missing_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["threat_model"]["protects_against"] = [
            c for c in m["threat_model"]["protects_against"]
            if c != "co_tenant_access"]
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")
        self.assertEqual(v["threat_protects_not_covered"],
                         ["co_tenant_access"])
        self.assertEqual(
            check_status(v, "threat_protects_against_covers_stated"),
            "fail")

    def test_protects_empty_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["threat_model"]["protects_against"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")
        self.assertEqual(v["threat_protects_not_covered"],
                         ["host_access", "operator_access",
                          "co_tenant_access"])

    def test_protects_unknown_entries_do_not_satisfy_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["threat_model"]["protects_against"] = ["malware", "insiders"]
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")
        self.assertEqual(len(v["threat_protects_not_covered"]), 3)

    def test_missing_protects_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["threat_model"]["protects_against"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["threat_protects_not_covered"])

    def test_exclusions_coverage_missing_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["threat_model"]["does_not_protect_against"].remove(
            "supply_chain")
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")
        self.assertEqual(v["threat_exclusions_not_covered"],
                         ["supply_chain"])
        self.assertEqual(v["sections"]["threat_model"], "fail")

    def test_threat_model_not_documented_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["threat_model"]["documented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")
        self.assertEqual(v["sections"]["threat_model"], "fail")

    def test_technology_not_named_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["technology"]["name"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")
        self.assertEqual(check_status(v, "technology_named"), "fail")
        self.assertEqual(v["sections"]["technology_selection"], "fail")

    def test_missing_technology_name_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["technology"]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "technology_named"), "missing")

    def test_unlisted_technology_name_still_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["technology"]["name"] = "Some Future TEE"
        self.assertEqual(evaluate(m)["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_READY")

    def test_distinctions_not_considered_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["technology"]["distinctions_considered"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")

    def test_fresh_nonce_not_verified_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["attestation"]["fresh_nonce_verified"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")
        self.assertEqual(v["sections"]["attestation"], "fail")
        self.assertEqual(check_status(v, "fresh_nonce_verified"),
                         "fail")

    def test_attestation_not_tested_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["attestation"]["verification_tested"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")

    def test_production_debug_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["enclave"]["debug_enabled_in_production"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")
        self.assertEqual(v["sections"]["enclave_patterns"], "fail")
        self.assertEqual(
            check_status(v, "production_debug_disabled"), "fail")

    def test_sealed_keys_not_bound_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["enclave"]["sealed_keys_bound_to_identity_or_measurement"] = \
            False
        self.assertEqual(evaluate(m)["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")

    def test_silent_downgrade_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["engineering"]["silent_downgrade_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")
        self.assertEqual(v["sections"]["engineering_discipline"],
                         "fail")

    def test_unsigned_images_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["engineering"]["signed_enclave_images"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")

    def test_root_keys_unsealed_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["keys"]["root_keys_stored_unsealed_beside_enclave"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")
        self.assertEqual(v["sections"]["key_management"], "fail")
        self.assertEqual(
            check_status(v, "root_keys_never_stored_unsealed"), "fail")

    def test_sealed_keys_not_tested_with_recovery_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["keys"]["sealed_keys_tested_including_recovery"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")

    def test_public_exclusions_missing_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"]["public_exclusions"].remove("side_channels")
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")
        self.assertEqual(v["claims_exclusions_not_listed"],
                         ["side_channels"])
        self.assertEqual(
            check_status(
                v, "public_exclusions_cover_stated_exclusions"),
            "fail")

    def test_public_exclusions_empty_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"]["public_exclusions"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")
        self.assertEqual(len(v["claims_exclusions_not_listed"]), 4)

    def test_missing_public_exclusions_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["claims"]["public_exclusions"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["claims_exclusions_not_listed"])

    def test_unverifiable_claims_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"]["unverifiable_secure_enclave_claims_made"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")
        self.assertEqual(v["sections"]["claims_discipline"], "fail")

    def test_claims_not_matching_evidence_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"]["claims_match_evidence"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CONFIDENTIAL_COMPUTING_DESIGN_NOT_READY")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["attestation"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["attestation"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertEqual(v["components_evaluated"], 0)
        self.assertIsNone(v["computed_trusted_codebase_lines"])
        self.assertIsNone(v["threat_protects_not_covered"])
        self.assertIsNone(v["threat_exclusions_not_covered"])
        self.assertIsNone(v["claims_exclusions_not_listed"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(
            "VERDICT: CONFIDENTIAL_COMPUTING_DESIGN_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["entity"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("entity", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"threat_model": "should-be-an-object"})
        self.assertIn("threat_model", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["threat_model"]["protects_against"] = "host_access"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("threat_model.protects_against",
                      str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"]["public_exclusions"] = ["side_channels", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("claims.public_exclusions[1]", str(ctx.exception))

    def test_components_list_as_object_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["enclave"]["trusted_components"] = {"name": "loader"}
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("enclave.trusted_components", str(ctx.exception))

    def test_component_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["enclave"]["trusted_components"][0] = "loader"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("enclave.trusted_components[0]",
                      str(ctx.exception))

    def test_component_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["enclave"]["trusted_components"][2]["trusted_lines"] = "800"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("enclave.trusted_components[2].trusted_lines",
                      str(ctx.exception))

    def test_component_name_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["enclave"]["trusted_components"][0]["name"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("enclave.trusted_components[0].name",
                      str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["attestation"]["fresh_nonce_verified"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("attestation.fresh_nonce_verified",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["enclave"]["declared_trusted_codebase_lines"] = "5400"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("enclave.declared_trusted_codebase_lines",
                      str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["enclave"]["trusted_components"][0]["trusted_lines"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("enclave.trusted_components[0].trusted_lines",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["keys"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("keys", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
