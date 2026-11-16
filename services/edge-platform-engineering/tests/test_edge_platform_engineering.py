import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from edge_platform_engineering import evaluate, stamp  # noqa: E402

COMPLETE = {
    "project": "ops-worker-suite",
    "platform_fit": {"storage_choices_documented": True,
                     "consistency_access_pattern_reviewed": True},
    "components": [
        {"name": "api-worker", "storage_backend": "d1",
         "storage_rationale_documented": True,
         "requires_strong_consistency": True,
         "is_admin_surface": False},
        {"name": "config-cache", "storage_backend": "kv",
         "storage_rationale_documented": True,
         "requires_strong_consistency": False,
         "is_admin_surface": False},
        {"name": "admin-console", "storage_backend": "r2",
         "storage_rationale_documented": True,
         "requires_strong_consistency": False,
         "is_admin_surface": True, "access_protected": True},
    ],
    "deploy": {"wrangler_workflows_used": True,
               "tested_with_real_bindings_locally": True,
               "deploys_from_git": True,
               "versioned_deploys": True,
               "rollback_path_tested": True,
               "previous_versions_kept_deployable": True,
               "staging_separated_from_prod": True},
    "security": {"secrets_only_in_platform_store": True,
                 "secrets_in_code_or_repo_present": False,
                 "secrets_in_logs_present": False,
                 "rate_limits_configured": True,
                 "waf_configured": True,
                 "input_validation_at_boundary": True,
                 "tls_https_disabled_present": False},
    "reliability": {"cpu_budget_respected": True,
                    "cold_start_addressed": True,
                    "error_capture_configured": True,
                    "alerts_configured": True,
                    "staged_rules_used": True,
                    "external_health_checks_configured": True},
    "tunnels": {"tunnels_present": True,
                "origin_stays_loopback": True,
                "access_policies_for_humans": True,
                "service_tokens_for_machines": True,
                "origin_exposed_publicly_present": False},
    "quotas": {"free_tier_limits_known": True,
               "quota_alarms_set": True,
               "monthly_log_driven_cost_review": True},
    "dns_tls": {"zones_documented": True,
                "certs_automatic": True,
                "cert_expiry_monitored": True,
                "email_routing_consistent": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "EDGE_PLATFORM_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 38)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["components_count"], 3)
        self.assertEqual(v["components_without_storage_backend"], [])
        self.assertEqual(v["storage_documentation_coverage"], "1.000000")
        self.assertEqual(
            v["components_on_kv_requiring_strong_consistency"], [])
        self.assertEqual(v["admin_components_without_access"], [])
        self.assertEqual(v["access_protection_coverage"], "1.000000")

    def test_storage_choices_not_documented_fails_platform_section(self):
        m = copy.deepcopy(COMPLETE)
        m["platform_fit"]["storage_choices_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EDGE_PLATFORM_NOT_SOUND")
        self.assertEqual(
            v["sections"]["platform_fit_and_storage"], "fail")

    def test_component_without_backend_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][1]["storage_backend"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EDGE_PLATFORM_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_component_names_storage_backend"),
            "fail")
        self.assertEqual(v["components_without_storage_backend"],
                         ["config-cache"])
        self.assertEqual(v["storage_documentation_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_component_missing_backend_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["components"][0]["storage_backend"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_component_names_storage_backend"),
            "missing")

    def test_component_without_rationale_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][2]["storage_rationale_documented"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_component_documents_storage_rationale"),
            "fail")
        self.assertEqual(v["storage_documentation_coverage"], "0.666667")

    def test_empty_components_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["components"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "components_declared"), "fail")
        self.assertEqual(v["components_count"], 0)
        self.assertIsNone(v["storage_documentation_coverage"])
        self.assertIsNone(v["access_protection_coverage"])

    def test_strong_consistency_on_kv_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][1]["requires_strong_consistency"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EDGE_PLATFORM_NOT_SOUND")
        self.assertEqual(
            check_status(v, "no_strong_consistency_component_on_kv"),
            "fail")
        self.assertEqual(
            v["components_on_kv_requiring_strong_consistency"],
            ["config-cache"])

    def test_strong_consistency_missing_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["components"][1]["requires_strong_consistency"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "no_strong_consistency_component_on_kv"),
            "missing")

    def test_unversioned_deploys_fail_deploy_section(self):
        m = copy.deepcopy(COMPLETE)
        m["deploy"]["versioned_deploys"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EDGE_PLATFORM_NOT_SOUND")
        self.assertEqual(v["sections"]["deploy_and_versioning"], "fail")

    def test_rollback_not_tested_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["deploy"]["rollback_path_tested"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "EDGE_PLATFORM_NOT_SOUND")

    def test_staging_not_separated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["deploy"]["staging_separated_from_prod"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "EDGE_PLATFORM_NOT_SOUND")

    def test_secrets_in_repo_fail_security_section(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["secrets_in_code_or_repo_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EDGE_PLATFORM_NOT_SOUND")
        self.assertEqual(v["sections"]["security_and_access"], "fail")
        self.assertEqual(
            check_status(v, "no_secrets_in_code_or_repo"), "fail")

    def test_secrets_in_logs_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["secrets_in_logs_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "EDGE_PLATFORM_NOT_SOUND")

    def test_tls_disabled_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["tls_https_disabled_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_tls_https_disabled"), "fail")
        self.assertEqual(v["verdict"], "EDGE_PLATFORM_NOT_SOUND")

    def test_admin_component_without_access_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][2]["access_protected"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EDGE_PLATFORM_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_admin_component_access_protected"),
            "fail")
        self.assertEqual(v["admin_components_without_access"],
                         ["admin-console"])
        self.assertEqual(v["access_protection_coverage"], "0.000000")

    def test_admin_component_missing_access_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["components"][2]["access_protected"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_admin_component_access_protected"),
            "missing")
        self.assertEqual(v["admin_components_without_access"], [])

    def test_no_admin_components_passes_access_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][2]["is_admin_surface"] = False
        del m["components"][2]["access_protected"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EDGE_PLATFORM_SOUND")
        self.assertEqual(
            check_status(v, "every_admin_component_access_protected"),
            "pass")
        self.assertIsNone(v["access_protection_coverage"])

    def test_cpu_budget_not_respected_fails_reliability_section(self):
        m = copy.deepcopy(COMPLETE)
        m["reliability"]["cpu_budget_respected"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EDGE_PLATFORM_NOT_SOUND")
        self.assertEqual(
            v["sections"]["reliability_and_observability"], "fail")

    def test_no_external_health_checks_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["reliability"]["external_health_checks_configured"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "EDGE_PLATFORM_NOT_SOUND")

    def test_tunnel_origin_not_loopback_fails_tunnels_section(self):
        m = copy.deepcopy(COMPLETE)
        m["tunnels"]["origin_stays_loopback"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EDGE_PLATFORM_NOT_SOUND")
        self.assertEqual(
            v["sections"]["tunnels_quotas_and_hygiene"], "fail")
        self.assertEqual(
            check_status(v, "tunnel_origin_stays_loopback"), "fail")

    def test_public_origin_exposure_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tunnels"]["origin_exposed_publicly_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_public_origin_exposure"), "fail")
        self.assertEqual(v["verdict"], "EDGE_PLATFORM_NOT_SOUND")

    def test_no_tunnels_passes_tunnel_checks_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["tunnels"] = {"tunnels_present": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EDGE_PLATFORM_SOUND")
        self.assertEqual(
            check_status(v, "tunnel_origin_stays_loopback"), "pass")
        self.assertEqual(
            check_status(v, "no_public_origin_exposure"), "pass")

    def test_tunnels_missing_target_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["tunnels"]["service_tokens_for_machines"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "tunnel_service_tokens_for_machines"),
            "missing")

    def test_quota_alarms_not_set_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["quotas"]["quota_alarms_set"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "quota_alarms_set"), "fail")
        self.assertEqual(v["verdict"], "EDGE_PLATFORM_NOT_SOUND")

    def test_cert_expiry_not_monitored_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["dns_tls"]["cert_expiry_monitored"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "EDGE_PLATFORM_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["deploy"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["deploy_and_versioning"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["components_count"])
        self.assertIsNone(v["components_without_storage_backend"])
        self.assertIsNone(v["storage_documentation_coverage"])
        self.assertIsNone(
            v["components_on_kv_requiring_strong_consistency"])
        self.assertIsNone(v["admin_components_without_access"])
        self.assertIsNone(v["access_protection_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: EDGE_PLATFORM_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with TypeError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["project"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("project", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"deploy": "should-be-an-object"})
        self.assertIn("deploy", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"components": {"name": "api-worker"}})
        self.assertIn("components", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"components": ["api-worker"]})
        self.assertIn("components[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["deploy"]["versioned_deploys"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("deploy.versioned_deploys", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][0]["storage_backend"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("components[0].storage_backend",
                      str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["components"][2]["access_protected"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("components[2].access_protected",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["quotas"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("quotas", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
