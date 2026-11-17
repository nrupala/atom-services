import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from local_first_sync_design import evaluate, stamp  # noqa: E402

COMPLETE = {
    "app": "vault-notes",
    "local_truth": {"device_store_authoritative": True,
                    "server_is_relay_and_backup_not_gate": True,
                    "core_flows_designed_airplane_mode_first": True,
                    "core_flows_work_fully_offline": True,
                    "sync_resumes_cleanly_after_long_offline": True},
    "data_model": {"mergeable_state_uses_crdt_or_ot": True,
                   "tombstones_declared": True,
                   "compaction_policy_declared": True},
    "entities": [
        {"name": "note-body",
         "per_field_merge_semantics_declared": True,
         "stable_id_declared": True,
         "is_user_prose": True,
         "silent_last_write_wins_present": False},
        {"name": "note-counter",
         "per_field_merge_semantics_declared": True,
         "stable_id_declared": True,
         "is_user_prose": False},
        {"name": "vault-entry",
         "per_field_merge_semantics_declared": True,
         "stable_id_declared": True,
         "is_user_prose": False,
         "silent_last_write_wins_present": False},
    ],
    "sync_protocol": {"delta_sync_declared": True,
                      "causal_ordering_declared": True,
                      "resumability_declared": True,
                      "bandwidth_budgets_declared": True,
                      "store_and_forward_for_intermittent_peers": True,
                      "vector_clocks_or_version_vectors_declared": True},
    "encryption": {"e2ee_before_upload": True,
                   "keys_never_leave_devices": True,
                   "per_device_keys_declared": True,
                   "key_hierarchy_declared": True,
                   "key_recovery_ux_tested_like_a_feature": True,
                   "key_recovery_exercised_end_to_end": True,
                   "e2ee_verified": True},
    "personal_data_sync": {"personal_data_synced": True,
                           "personal_data_encrypted_before_sync": True},
    "conflicts": {"automatic_merge_for_text_and_counters": True,
                  "explicit_ui_only_for_semantic_conflicts": True,
                  "silent_data_loss_present": False,
                  "silent_last_write_wins_on_user_prose_present": False},
    "state_ui": {"offline_state_shown": True,
                 "queued_state_shown": True,
                 "syncing_state_shown": True,
                 "synced_state_shown": True,
                 "conflict_state_shown": True,
                 "export_escape_hatch_present": True,
                 "import_escape_hatch_present": True,
                 "sync_diagnostics_present": True,
                 "sync_badge_claimed": True},
    "testing": {"chaos_offline_scenario_tested": True,
                "chaos_clock_skew_scenario_tested": True,
                "chaos_concurrent_edits_scenario_tested": True,
                "chaos_device_loss_scenario_tested": True,
                "merge_invariants_property_tested": True,
                "export_import_tested_on_real_data_volumes": True,
                "real_device_matrix_tested": True,
                "multi_device_round_trip_tests_passed": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "LOCAL_FIRST_SYNC_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 47)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["entities_count"], 3)
        self.assertEqual(v["entities_without_merge_semantics"], [])
        self.assertEqual(v["merge_semantics_coverage"], "1.000000")
        self.assertEqual(v["entities_without_stable_id"], [])
        self.assertEqual(v["stable_id_coverage"], "1.000000")
        self.assertEqual(
            v["prose_entities_with_silent_last_write_wins"], [])

    def test_server_as_gate_fails_local_truth_section(self):
        m = copy.deepcopy(COMPLETE)
        m["local_truth"]["server_is_relay_and_backup_not_gate"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_FIRST_SYNC_NOT_SOUND")
        self.assertEqual(
            v["sections"]["local_truth_and_data_model"], "fail")
        self.assertEqual(
            check_status(v, "server_is_relay_and_backup_not_gate"),
            "fail")

    def test_core_flows_not_offline_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["local_truth"]["core_flows_work_fully_offline"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_FIRST_SYNC_NOT_SOUND")

    def test_no_crdt_or_ot_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["data_model"]["mergeable_state_uses_crdt_or_ot"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_FIRST_SYNC_NOT_SOUND")

    def test_entity_without_merge_semantics_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["entities"][0]["per_field_merge_semantics_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_FIRST_SYNC_NOT_SOUND")
        self.assertEqual(
            check_status(
                v, "every_entity_per_field_merge_semantics_declared"),
            "fail")
        self.assertEqual(v["entities_without_merge_semantics"],
                         ["note-body"])
        self.assertEqual(v["merge_semantics_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_entity_missing_merge_semantics_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["entities"][0]["per_field_merge_semantics_declared"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_entity_per_field_merge_semantics_declared"),
            "missing")
        self.assertEqual(v["entities_without_merge_semantics"], [])

    def test_entity_without_stable_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["entities"][1]["stable_id_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_entity_stable_id_declared"), "fail")
        self.assertEqual(v["entities_without_stable_id"],
                         ["note-counter"])
        self.assertEqual(v["stable_id_coverage"], "0.666667")

    def test_empty_entities_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["entities"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "entities_declared"), "fail")
        self.assertEqual(v["entities_count"], 0)
        self.assertIsNone(v["merge_semantics_coverage"])
        self.assertIsNone(v["stable_id_coverage"])

    def test_no_delta_sync_fails_sync_protocol_section(self):
        m = copy.deepcopy(COMPLETE)
        m["sync_protocol"]["delta_sync_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_FIRST_SYNC_NOT_SOUND")
        self.assertEqual(v["sections"]["sync_protocol"], "fail")

    def test_no_causality_tracking_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sync_protocol"][
            "vector_clocks_or_version_vectors_declared"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_FIRST_SYNC_NOT_SOUND")

    def test_keys_leaving_devices_fails_encryption_section(self):
        m = copy.deepcopy(COMPLETE)
        m["encryption"]["keys_never_leave_devices"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_FIRST_SYNC_NOT_SOUND")
        self.assertEqual(v["sections"]["encryption_and_keys"], "fail")

    def test_key_recovery_not_exercised_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["encryption"]["key_recovery_exercised_end_to_end"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_FIRST_SYNC_NOT_SOUND")

    def test_unencrypted_personal_data_sync_is_red_line_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["personal_data_sync"][
            "personal_data_encrypted_before_sync"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_FIRST_SYNC_NOT_SOUND")
        self.assertEqual(
            check_status(
                v, "personal_data_encrypted_when_personal_data_synced"),
            "fail")

    def test_no_personal_data_passes_encryption_gate_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["personal_data_sync"] = {"personal_data_synced": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_FIRST_SYNC_SOUND")
        self.assertEqual(
            check_status(
                v, "personal_data_encrypted_when_personal_data_synced"),
            "pass")

    def test_personal_data_target_missing_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["personal_data_sync"]["personal_data_encrypted_before_sync"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "personal_data_encrypted_when_personal_data_synced"),
            "missing")

    def test_silent_data_loss_is_red_line_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["conflicts"]["silent_data_loss_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_FIRST_SYNC_NOT_SOUND")
        self.assertEqual(check_status(v, "no_silent_data_loss"), "fail")
        self.assertEqual(
            v["sections"]["conflicts_and_state_ui"], "fail")

    def test_global_silent_lww_on_prose_is_red_line_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["conflicts"][
            "silent_last_write_wins_on_user_prose_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "no_silent_last_write_wins_on_user_prose"), "fail")

    def test_prose_entity_with_silent_lww_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["entities"][0]["silent_last_write_wins_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_FIRST_SYNC_NOT_SOUND")
        self.assertEqual(
            check_status(
                v, "no_prose_entity_uses_silent_last_write_wins"),
            "fail")
        self.assertEqual(
            v["prose_entities_with_silent_last_write_wins"],
            ["note-body"])

    def test_non_prose_entity_with_silent_lww_passes_prose_check(self):
        m = copy.deepcopy(COMPLETE)
        m["entities"][1]["silent_last_write_wins_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_FIRST_SYNC_SOUND")
        self.assertEqual(
            check_status(
                v, "no_prose_entity_uses_silent_last_write_wins"),
            "pass")
        self.assertEqual(
            v["prose_entities_with_silent_last_write_wins"], [])

    def test_prose_entity_missing_lww_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["entities"][0]["silent_last_write_wins_present"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "no_prose_entity_uses_silent_last_write_wins"),
            "missing")
        self.assertEqual(
            v["prose_entities_with_silent_last_write_wins"], [])

    def test_missing_conflict_state_fails_state_ui(self):
        m = copy.deepcopy(COMPLETE)
        m["state_ui"]["conflict_state_shown"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "conflict_state_shown"), "fail")
        self.assertEqual(
            v["sections"]["conflicts_and_state_ui"], "fail")

    def test_no_export_escape_hatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["state_ui"]["export_escape_hatch_present"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_FIRST_SYNC_NOT_SOUND")

    def test_sync_badge_without_round_trip_tests_is_red_line_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["multi_device_round_trip_tests_passed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_FIRST_SYNC_NOT_SOUND")
        self.assertEqual(
            check_status(
                v, "sync_badge_only_with_multi_device_round_trip_tests"),
            "fail")

    def test_no_sync_badge_passes_badge_gate_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["state_ui"]["sync_badge_claimed"] = False
        del m["testing"]["multi_device_round_trip_tests_passed"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "sync_badge_only_with_multi_device_round_trip_tests"),
            "pass")
        # the round-trip check itself is missing evidence on its own
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_merge_invariants_not_property_tested_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["merge_invariants_property_tested"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_FIRST_SYNC_NOT_SOUND")
        self.assertEqual(
            v["sections"]["testing_and_quality_gates"], "fail")

    def test_clock_skew_chaos_not_tested_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["chaos_clock_skew_scenario_tested"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_FIRST_SYNC_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["sync_protocol"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["sync_protocol"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["entities_count"])
        self.assertIsNone(v["entities_without_merge_semantics"])
        self.assertIsNone(v["merge_semantics_coverage"])
        self.assertIsNone(v["entities_without_stable_id"])
        self.assertIsNone(v["stable_id_coverage"])
        self.assertIsNone(
            v["prose_entities_with_silent_last_write_wins"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: LOCAL_FIRST_SYNC_SOUND", stamp(v))

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
            evaluate({"sync_protocol": "should-be-an-object"})
        self.assertIn("sync_protocol", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"entities": {"name": "note-body"}})
        self.assertIn("entities", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"entities": ["note-body"]})
        self.assertIn("entities[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["sync_protocol"]["delta_sync_declared"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("sync_protocol.delta_sync_declared",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["entities"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("entities[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["entities"][1]["is_user_prose"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("entities[1].is_user_prose", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["encryption"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("encryption", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
