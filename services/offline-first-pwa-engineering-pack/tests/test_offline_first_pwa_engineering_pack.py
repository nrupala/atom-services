import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from offline_first_pwa_engineering_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "app": "vault-notes-pwa",
    "architecture": {"local_store_is_primary_source": True,
                     "server_is_sync_target_or_absent": True},
    "core_flows": [
        {"name": "read-notes", "works_fully_offline": True},
        {"name": "edit-note", "works_fully_offline": True},
        {"name": "search-vault", "works_fully_offline": True},
    ],
    "service_worker": {"app_shell_precached": True,
                       "versioned_assets_precached": True,
                       "sensitive_responses_not_cached_blindly": True,
                       "update_flow_new_version_ready_ui_present": True,
                       "skip_waiting_controlled": True},
    "storage": {"versioned_schema_migrations_present": True,
                "migrations_tested": True,
                "quota_awareness_present": True,
                "quota_exhaustion_handled_gracefully": True,
                "export_path_exists": True,
                "import_path_exists": True,
                "export_import_round_trip_verified": True},
    "sync": {"server_sync_used": True,
             "queue_with_retry_and_backoff": True,
             "operations_idempotent": True,
             "conflict_rules_explicit": True,
             "state_visible_pending_synced_failed": True,
             "indefinite_spinners_avoided": True},
    "installability": {"web_app_manifest_present": True,
                       "icons_present": True,
                       "theming_present": True,
                       "keyboard_first_usability_addressed": True,
                       "degraded_mode_messaging_present": True},
    "encryption": {"zero_knowledge_claimed": True,
                   "webcrypto_used": True,
                   "keys_never_exported_unencrypted": True,
                   "platform_limits_disclosed_honestly": True},
    "testing": {"devtools_offline_test_performed": True,
                "devtools_throttle_test_performed": True,
                "storage_full_simulation_performed": True,
                "upgrade_path_old_data_tested": True,
                "install_uninstall_flows_tested": True,
                "service_worker_update_flow_exercised": True},
    "red_lines": {"silent_data_loss_present": False,
                  "caching_of_secrets_present": False,
                  "network_required_core_flows_claimed_offline_first_present": False},
}

NO_SYNC = copy.deepcopy(COMPLETE)
NO_SYNC["sync"] = {"server_sync_used": False,
                    "queue_with_retry_and_backoff": False,
                    "operations_idempotent": False,
                    "conflict_rules_explicit": False,
                    "state_visible_pending_synced_failed": False,
                    "indefinite_spinners_avoided": True}

NO_ZK = copy.deepcopy(COMPLETE)
NO_ZK["encryption"] = {"zero_knowledge_claimed": False,
                       "webcrypto_used": False,
                       "keys_never_exported_unencrypted": False,
                       "platform_limits_disclosed_honestly": False}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "OFFLINE_FIRST_PWA_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 41)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["core_flows_count"], 3)
        self.assertEqual(v["flows_without_offline_support"], [])
        self.assertEqual(v["offline_coverage"], "1.000000")
        self.assertEqual(v["duplicate_flow_names"], [])

    def test_no_sync_app_complete_is_sound(self):
        v = evaluate(copy.deepcopy(NO_SYNC))
        self.assertEqual(v["verdict"], "OFFLINE_FIRST_PWA_SOUND")
        self.assertEqual(check_status(v, "queue_with_retry_and_backoff"), "pass")

    def test_no_zero_knowledge_app_complete_is_sound(self):
        v = evaluate(copy.deepcopy(NO_ZK))
        self.assertEqual(v["verdict"], "OFFLINE_FIRST_PWA_SOUND")
        self.assertEqual(check_status(v, "webcrypto_used"), "pass")

    def test_local_store_not_primary_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["architecture"]["local_store_is_primary_source"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "OFFLINE_FIRST_PWA_NOT_SOUND")
        self.assertEqual(v["sections"]["offline_first_architecture"], "fail")

    def test_flow_not_offline_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["core_flows"][0]["works_fully_offline"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "OFFLINE_FIRST_PWA_NOT_SOUND")
        self.assertEqual(check_status(v, "every_core_flow_works_fully_offline"), "fail")
        self.assertEqual(v["flows_without_offline_support"], ["read-notes"])
        self.assertEqual(v["offline_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_flow_missing_offline_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["core_flows"][0]["works_fully_offline"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "every_core_flow_works_fully_offline"), "missing")
        self.assertEqual(v["flows_without_offline_support"], [])

    def test_duplicate_flow_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["core_flows"][2]["name"] = "read-notes"
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_core_flow_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_flow_names"], ["read-notes"])

    def test_flow_missing_name_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["core_flows"][2]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "no_core_flow_name_duplicated"), "missing")

    def test_empty_flows_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["core_flows"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "core_flows_declared"), "fail")
        self.assertEqual(v["core_flows_count"], 0)
        self.assertIsNone(v["offline_coverage"])
        self.assertEqual(v["duplicate_flow_names"], [])

    def test_app_shell_not_precached_fails_section2(self):
        m = copy.deepcopy(COMPLETE)
        m["service_worker"]["app_shell_precached"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["service_worker_discipline"], "fail")

    def test_uncontrolled_skip_waiting_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["service_worker"]["skip_waiting_controlled"] = False
        self.assertEqual(check_status(evaluate(m), "skip_waiting_controlled"), "fail")

    def test_no_migrations_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["storage"]["versioned_schema_migrations_present"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["storage_engineering"], "fail")

    def test_quota_not_handled_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["storage"]["quota_exhaustion_handled_gracefully"] = False
        self.assertEqual(check_status(evaluate(m), "quota_exhaustion_handled_gracefully"), "fail")

    def test_export_without_round_trip_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["storage"]["export_import_round_trip_verified"] = False
        self.assertEqual(check_status(evaluate(m), "export_import_round_trip_verified"), "fail")

    def test_sync_gate_absent_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["sync"]["server_sync_used"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "sync_applicability_declared"), "missing")
        self.assertEqual(check_status(v, "operations_idempotent"), "missing")

    def test_sync_app_without_idempotence_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sync"]["operations_idempotent"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "operations_idempotent"), "fail")
        self.assertEqual(v["verdict"], "OFFLINE_FIRST_PWA_NOT_SOUND")

    def test_indefinite_spinners_fail_even_without_sync(self):
        m = copy.deepcopy(NO_SYNC)
        m["sync"]["indefinite_spinners_avoided"] = False
        self.assertEqual(check_status(evaluate(m), "indefinite_spinners_avoided"), "fail")

    def test_no_manifest_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["installability"]["web_app_manifest_present"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["installability_encryption_and_ux"], "fail")

    def test_zk_gate_absent_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["encryption"]["zero_knowledge_claimed"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "zero_knowledge_applicability_declared"), "missing")
        self.assertEqual(check_status(v, "webcrypto_used"), "missing")

    def test_zk_claim_without_webcrypto_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["encryption"]["webcrypto_used"] = False
        self.assertEqual(check_status(evaluate(m), "webcrypto_used"), "fail")

    def test_no_storage_full_simulation_fails_section6(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["storage_full_simulation_performed"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["testing_and_quality_gates"], "fail")

    def test_update_flow_not_exercised_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["service_worker_update_flow_exercised"] = False
        self.assertEqual(check_status(evaluate(m), "service_worker_update_flow_exercised"), "fail")

    def test_silent_data_loss_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["silent_data_loss_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "silent_data_loss_refused"), "fail")
        self.assertEqual(v["sections"]["pwa_red_lines"], "fail")

    def test_caching_secrets_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["caching_of_secrets_present"] = True
        self.assertEqual(check_status(evaluate(m), "secrets_caching_refused"), "fail")

    def test_network_required_claim_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["network_required_core_flows_claimed_offline_first_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "network_required_core_flow_offline_claim_refused"), "fail")
        self.assertEqual(v["verdict"], "OFFLINE_FIRST_PWA_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["testing"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["testing_and_quality_gates"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["core_flows_count"])
        self.assertIsNone(v["flows_without_offline_support"])
        self.assertIsNone(v["offline_coverage"])
        self.assertIsNone(v["duplicate_flow_names"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: OFFLINE_FIRST_PWA_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["app"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("app", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"architecture": "should-be-an-object"})
        self.assertIn("architecture", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"core_flows": {"name": "read-notes"}})
        self.assertIn("core_flows", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"core_flows": ["read-notes"]})
        self.assertIn("core_flows[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["architecture"]["local_store_is_primary_source"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("architecture.local_store_is_primary_source", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["core_flows"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("core_flows[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["core_flows"][1]["works_fully_offline"] = "true"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("core_flows[1].works_fully_offline", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["sync"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("sync", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
