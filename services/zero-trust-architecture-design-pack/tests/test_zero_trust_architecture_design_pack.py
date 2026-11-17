import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from zero_trust_architecture_design_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "design_title": "payments-zero-trust-design",
    "identity": {"identity_first_design_declared": True,
                 "user_identities_declared": True,
                 "workload_identities_declared": True,
                 "short_lived_credentials_declared": True,
                 "credentials_scoped_declared": True,
                 "credentials_rotated_declared": True,
                 "no_implicit_network_trust_declared": True,
                 "every_hop_authenticated_and_authorized_declared": True,
                 "policy_layer_decides_access_declared": True},
    "assets": [
        {"asset_id": "asset-1", "asset_name": "Payments API",
         "asset_kind": "service"},
        {"asset_id": "asset-2", "asset_name": "Payments worker",
         "asset_kind": "workload"},
        {"asset_id": "asset-3", "asset_name": "Payments store",
         "asset_kind": "data_store"},
    ],
    "policies": [
        {"policy_id": "pol-1", "policy_name": "API access policy",
         "covered_asset_ids": ["asset-1", "asset-2"]},
        {"policy_id": "pol-2", "policy_name": "Store access policy",
         "covered_asset_ids": ["asset-3"]},
    ],
    "segmentation": {"segmentation_declared": True,
                     "blast_radius_boundaries_declared": True,
                     "egress_restricted_declared": True,
                     "egress_monitored_declared": True,
                     "deny_by_default_declared": True,
                     "least_privilege_declared": True},
    "trust": {"device_posture_checks_declared": True,
              "device_inventory_declared": True,
              "server_posture_checks_declared": True,
              "workload_attestation_declared": True,
              "node_trust_requires_attestation_declared": True,
              "encryption_in_transit_declared": True,
              "encryption_at_rest_declared": True,
              "end_to_end_encryption_demanded": True,
              "end_to_end_encryption_declared": True},
    "monitoring": {"audit_logging_declared": True,
                   "privileged_actions_logged_immutably_declared": True,
                   "anomaly_alerting_declared": True,
                   "audit_trail_survives_component_declared": True,
                   "egress_changes_audited_declared": True,
                   "privilege_changes_audited_declared": True,
                   "incident_response_path_declared": True,
                   "break_glass_documented_declared": True,
                   "break_glass_ceremony_gated_declared": True,
                   "break_glass_tested_declared": True},
    "migration": {"migration_phases_declared": True,
                  "rollout_order_declared": True,
                  "legacy_implicit_trust_removal_declared": True,
                  "rollback_path_declared": True,
                  "per_hop_verification_during_rollout_declared": True,
                  "permissions_review_and_revocation_declared": True},
    "red_lines": {"internal_network_trusted_present": False,
                  "shared_credentials_present": False,
                  "long_lived_wide_scope_secrets_present": False,
                  "unrevocable_access_present": False,
                  "anonymous_east_west_access_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "ZERO_TRUST_DESIGN_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 54)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["zero_trust_design_assets_count"], 3)
        self.assertEqual(v["zero_trust_design_policies_count"], 2)
        self.assertEqual(v["duplicate_zero_trust_design_asset_ids"], [])
        self.assertEqual(v["zero_trust_design_policy_coverage_ratio"],
                         "1.000000")

    def test_identity_first_not_declared_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["identity"]["identity_first_design_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "ZERO_TRUST_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["identity_and_perimeter_framing"],
                         "fail")
        self.assertEqual(
            check_status(v, "zero_trust_design_identity_first_design_declared"),
            "fail")

    def test_duplicate_asset_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["assets"][1]["asset_id"] = "asset-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_zero_trust_design_asset_id_unique"), "fail")
        self.assertEqual(v["duplicate_zero_trust_design_asset_ids"],
                         ["asset-1"])

    def test_empty_assets_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["assets"] = []
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "zero_trust_design_assets_list_declared"), "fail")

    def test_absent_assets_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["assets"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "zero_trust_design_assets_list_declared"),
            "missing")
        self.assertIsNone(v["zero_trust_design_assets_count"])
        self.assertIsNone(v["computed_status"])

    def test_invalid_asset_kind_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["assets"][0]["asset_kind"] = "laptop-thing"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_zero_trust_design_asset_kind_recognised"),
            "fail")
        self.assertEqual(v["zero_trust_design_assets_with_invalid_kind"],
                         ["asset-1"])

    def test_uncovered_asset_fails_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["policies"][1]["covered_asset_ids"] = ["asset-1"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_zero_trust_design_declared_asset_covered_by_policy"),
            "fail")
        self.assertEqual(v["zero_trust_design_assets_without_policy_coverage"],
                         ["asset-3"])
        self.assertEqual(v["zero_trust_design_policy_coverage_ratio"],
                         "0.666667")

    def test_policy_ref_to_undeclared_asset_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["policies"][0]["covered_asset_ids"] = ["asset-1", "asset-99"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_zero_trust_design_policy_coverage_reference_resolves"),
            "fail")
        self.assertEqual(
            v["zero_trust_design_policy_refs_not_declared_as_assets"],
            ["asset-99"])

    def test_policy_without_coverage_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["policies"][1]["covered_asset_ids"] = []
        m["policies"][0]["covered_asset_ids"] = [
            "asset-1", "asset-2", "asset-3"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_zero_trust_design_policy_covers_at_least_one_asset"),
            "fail")
        self.assertEqual(v["zero_trust_design_policies_without_coverage"],
                         ["pol-2"])

    def test_e2e_demanded_without_declaration_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["trust"]["end_to_end_encryption_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "zero_trust_design_end_to_end_encryption_declared_where_demanded"),
            "fail")

    def test_e2e_not_demanded_passes_gated_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["trust"]["end_to_end_encryption_demanded"] = False
        m["trust"]["end_to_end_encryption_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "zero_trust_design_end_to_end_encryption_declared_where_demanded"),
            "pass")
        self.assertEqual(v["verdict"], "ZERO_TRUST_DESIGN_SOUND")

    def test_break_glass_untested_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["monitoring"]["break_glass_tested_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["monitoring_audit_and_response"],
                         "fail")

    def test_legacy_trust_removal_missing_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["migration"]["legacy_implicit_trust_removal_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["migration_and_rollout"], "fail")

    def test_internal_network_trusted_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["internal_network_trusted_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "ZERO_TRUST_DESIGN_NOT_SOUND")

    def test_shared_credentials_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["shared_credentials_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m), "zero_trust_design_free_of_shared_credentials"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["monitoring"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["monitoring_audit_and_response"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["zero_trust_design_assets_count"])
        self.assertIsNone(v["zero_trust_design_policy_coverage_ratio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: ZERO_TRUST_DESIGN_SOUND", stamp(v))

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
            evaluate({"identity": "should-be-an-object"})
        self.assertIn("identity", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"assets": {"asset_id": "asset-1"}})
        self.assertIn("assets", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"policies": ["pol-1"]})
        self.assertIn("policies[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["identity"]["identity_first_design_declared"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("identity.identity_first_design_declared",
                      str(ctx.exception))

    def test_string_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["policies"][0]["covered_asset_ids"] = [42]
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("policies[0].covered_asset_ids[0]", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["migration"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("migration", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
