import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from release_pack_changelog_seal_rollback import evaluate, stamp  # noqa: E402

SHA256_A = "a" * 64
SHA256_B = "0123456789abcdef" * 4
SHA512_C = "f" * 128

COMPLETE = {
    "release_label": "gateway-2.4.0",
    "version_detail": {"declared_version": "2.4.0",
                       "previous_version": "2.3.1",
                       "bump_kind": "minor",
                       "breaking_change_in_pack": False},
    "changelog_pack": {"keep_a_changelog_layout_followed": True,
                       "unreleased_backlog_maintained_continuously": True,
                       "pack_release_notes_state_why_changes_matter": True,
                       "pack_breaking_items_pair_migration_steps": True},
    "changelog_entries": [
        {"entry_heading": "Faster sync engine",
         "entry_category": "Added", "entry_summary_present": True,
         "entry_version_heading": "2.4.0"},
        {"entry_heading": "Token refresh race",
         "entry_category": "Fixed", "entry_summary_present": True,
         "entry_version_heading": "2.4.0"},
    ],
    "seal_record": {"pack_artifacts_hashed_and_signed_declared": True,
                    "seal_manifest_generated_from_build_outputs": True,
                    "declared_sealed_artifact_total": 2},
    "sealed_artifacts": [
        {"artifact_filename": "gateway-2.4.0-linux.tar.gz",
         "checksum_algorithm": "sha256", "checksum_value": SHA256_A,
         "signature_recorded": True},
        {"artifact_filename": "gateway-2.4.0-macos.tar.gz",
         "checksum_algorithm": "sha512", "checksum_value": SHA512_C,
         "signature_recorded": True},
    ],
    "tag_and_attachment": {
        "pack_tag_created_as_annotated": True,
        "pack_tag_signature_recorded_when_signing_key_exists": True,
        "seal_manifest_attached_to_pack_record": True,
        "signature_file_attached_to_pack_record": True,
        "pack_checksums_rechecked_before_announcement": True},
    "rollback_detail": {
        "rollback_path_written_before_rollout_began": True,
        "rollback_sequence_is_executable_as_written": True,
        "rollback_trigger_conditions_named_in_pack": True},
    "rollback_steps": [
        {"step_label": "Drain canary nodes", "step_order": 1,
         "step_action_recorded": True,
         "step_verification_recorded": True},
        {"step_label": "Restore previous build", "step_order": 2,
         "step_action_recorded": True,
         "step_verification_recorded": True},
    ],
    "rollout_record": {
        "rollout_staging_or_canary_declared_for_pack": True,
        "rollout_approver_recorded_for_pack": True,
        "defined_health_window_stated_for_pack": True,
        "post_release_health_verification_completed_for_pack": True,
        "post_release_discrepancies_logged_for_pack": True},
    "red_lines": {"untagged_pack_release_present": False,
                  "published_history_rewrite_present": False,
                  "unattended_pack_deploy_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            v["verdict"], "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 41)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["changelog_entries_count"], 2)
        self.assertEqual(v["sealed_artifacts_count"], 2)
        self.assertEqual(v["rollback_steps_count"], 2)
        self.assertEqual(v["changelog_summary_coverage"], "1.000000")
        self.assertEqual(v["recognised_category_coverage"], "1.000000")
        self.assertEqual(v["checksum_format_coverage"], "1.000000")
        self.assertEqual(v["signature_coverage"], "1.000000")
        self.assertEqual(v["rollback_action_coverage"], "1.000000")
        self.assertEqual(v["rollback_verification_coverage"], "1.000000")
        self.assertEqual(v["duplicate_changelog_entry_headings"], [])
        self.assertEqual(v["duplicate_sealed_artifact_filenames"], [])
        self.assertEqual(v["duplicate_rollback_step_labels"], [])

    def test_malformed_version_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["version_detail"]["declared_version"] = "2.4"
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY")
        self.assertEqual(
            v["sections"]["version_stamp_and_bump_classification"], "fail")
        self.assertEqual(
            check_status(v, "pack_version_is_wellformed_semver"), "fail")

    def test_version_not_advancing_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["version_detail"]["declared_version"] = "2.3.1"
        m["version_detail"]["bump_kind"] = "patch"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "pack_version_advances_from_previous_declared_version"),
            "fail")

    def test_bump_kind_mismatching_delta_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["version_detail"]["bump_kind"] = "patch"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "pack_bump_kind_matches_version_delta"),
            "fail")

    def test_breaking_change_without_major_bump_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["version_detail"]["breaking_change_in_pack"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "pack_bump_kind_follows_declared_breaking_flag"),
            "fail")

    def test_major_bump_with_breaking_change_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["version_detail"].update(
            {"declared_version": "3.0.0", "bump_kind": "major",
             "breaking_change_in_pack": True})
        for entry in m["changelog_entries"]:
            entry["entry_version_heading"] = "3.0.0"
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY")

    def test_unrecognised_changelog_category_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["changelog_entries"][0]["entry_category"] = "Tweaked"
        v = evaluate(m)
        self.assertEqual(v["sections"]["changelog_pack_completeness"],
                         "fail")
        self.assertEqual(
            check_status(
                v, "every_changelog_entry_uses_recognised_category"),
            "fail")
        self.assertEqual(
            v["changelog_entries_with_unrecognised_category"],
            ["Faster sync engine"])
        self.assertEqual(v["recognised_category_coverage"], "0.500000")

    def test_entry_without_summary_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["changelog_entries"][1]["entry_summary_present"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_changelog_entry_carries_summary"),
            "fail")
        self.assertEqual(v["changelog_entries_without_summary"],
                         ["Token refresh race"])
        self.assertEqual(v["changelog_summary_coverage"], "0.500000")

    def test_entry_filed_under_other_version_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["changelog_entries"][0]["entry_version_heading"] = "2.3.0"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_changelog_entry_filed_under_pack_version"),
            "fail")
        self.assertEqual(
            v["changelog_entries_filed_under_other_version"],
            ["Faster sync engine"])

    def test_duplicate_entry_heading_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["changelog_entries"][1]["entry_heading"] = "Faster sync engine"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_changelog_entry_heading_duplicated"),
            "fail")
        self.assertEqual(v["duplicate_changelog_entry_headings"],
                         ["Faster sync engine"])

    def test_entry_missing_category_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["changelog_entries"][0]["entry_category"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_changelog_entry_uses_recognised_category"),
            "missing")
        self.assertEqual(
            v["changelog_entries_with_unrecognised_category"], [])

    def test_empty_changelog_entries_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["changelog_entries"] = []
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "changelog_entry_rows_declared"), "fail")
        self.assertEqual(v["changelog_entries_count"], 0)
        self.assertIsNone(v["changelog_summary_coverage"])

    def test_absent_changelog_entries_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["changelog_entries"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "changelog_entry_rows_declared"), "missing")
        self.assertIsNone(v["changelog_entries_count"])
        self.assertIsNone(v["duplicate_changelog_entry_headings"])

    def test_malformed_checksum_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["sealed_artifacts"][0]["checksum_value"] = "abcd"
        v = evaluate(m)
        self.assertEqual(v["sections"]["seal_manifest_integrity"], "fail")
        self.assertEqual(
            check_status(
                v,
                "every_sealed_artifact_checksum_matches_declared_algorithm_format"),
            "fail")
        self.assertEqual(v["sealed_artifacts_with_malformed_checksum"],
                         ["gateway-2.4.0-linux.tar.gz"])
        self.assertEqual(v["checksum_format_coverage"], "0.500000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_checksum_algorithm_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sealed_artifacts"][0]["checksum_algorithm"] = "sha512"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_sealed_artifact_checksum_matches_declared_algorithm_format"),
            "fail")

    def test_non_hex_checksum_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sealed_artifacts"][1]["checksum_value"] = "z" * 128
        self.assertEqual(
            check_status(
                evaluate(m),
                "every_sealed_artifact_checksum_matches_declared_algorithm_format"),
            "fail")

    def test_artifact_without_signature_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["sealed_artifacts"][1]["signature_recorded"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_sealed_artifact_signature_recorded"), "fail")
        self.assertEqual(v["sealed_artifacts_without_signature"],
                         ["gateway-2.4.0-macos.tar.gz"])
        self.assertEqual(v["signature_coverage"], "0.500000")

    def test_duplicate_artifact_filename_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["sealed_artifacts"][1]["artifact_filename"] = \
            "gateway-2.4.0-linux.tar.gz"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_sealed_artifact_filename_duplicated"),
            "fail")
        self.assertEqual(v["duplicate_sealed_artifact_filenames"],
                         ["gateway-2.4.0-linux.tar.gz"])

    def test_seal_total_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["seal_record"]["declared_sealed_artifact_total"] = 3
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "seal_artifact_count_matches_pack_manifest_total"),
            "fail")

    def test_empty_sealed_artifacts_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sealed_artifacts"] = []
        m["seal_record"]["declared_sealed_artifact_total"] = 0
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "sealed_artifact_rows_declared"), "fail")

    def test_unattached_signature_file_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["tag_and_attachment"]["signature_file_attached_to_pack_record"] \
            = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY")
        self.assertEqual(
            v["sections"]["tag_signature_and_attachment"], "fail")

    def test_rollback_written_after_rollout_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["rollback_detail"]["rollback_path_written_before_rollout_began"] \
            = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["rollback_sequence_detail"],
                         "fail")

    def test_non_contiguous_step_orders_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["rollback_steps"][1]["step_order"] = 3
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "rollback_step_orders_form_contiguous_sequence"),
            "fail")

    def test_duplicate_step_orders_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["rollback_steps"][1]["step_order"] = 1
        self.assertEqual(
            check_status(
                evaluate(m),
                "rollback_step_orders_form_contiguous_sequence"),
            "fail")

    def test_out_of_order_steps_with_contiguous_orders_pass(self):
        m = copy.deepcopy(COMPLETE)
        m["rollback_steps"] = list(reversed(m["rollback_steps"]))
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY")

    def test_step_without_action_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["rollback_steps"][0]["step_action_recorded"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_rollback_step_records_its_action"),
            "fail")
        self.assertEqual(v["rollback_steps_without_action"],
                         ["Drain canary nodes"])
        self.assertEqual(v["rollback_action_coverage"], "0.500000")

    def test_step_without_verification_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["rollback_steps"][1]["step_verification_recorded"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_rollback_step_records_post_step_verification"),
            "fail")
        self.assertEqual(v["rollback_steps_without_verification"],
                         ["Restore previous build"])
        self.assertEqual(v["rollback_verification_coverage"], "0.500000")

    def test_duplicate_step_label_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["rollback_steps"][1]["step_label"] = "Drain canary nodes"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_rollback_step_label_duplicated"),
            "fail")
        self.assertEqual(v["duplicate_rollback_step_labels"],
                         ["Drain canary nodes"])

    def test_step_missing_order_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["rollback_steps"][0]["step_order"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "rollback_step_orders_form_contiguous_sequence"),
            "missing")

    def test_empty_rollback_steps_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["rollback_steps"] = []
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "rollback_step_rows_declared"), "fail")
        self.assertEqual(v["rollback_steps_count"], 0)

    def test_unstaged_rollout_fails_section6(self):
        m = copy.deepcopy(COMPLETE)
        m["rollout_record"]["rollout_staging_or_canary_declared_for_pack"] \
            = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["staged_rollout_and_health_record"], "fail")

    def test_untagged_pack_release_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["untagged_pack_release_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_untagged_pack_release_in_record"), "fail")
        self.assertEqual(v["sections"]["pack_red_lines"], "fail")

    def test_history_rewrite_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["published_history_rewrite_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_published_history_rewrite_in_record"),
            "fail")
        self.assertEqual(
            v["verdict"], "RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_NOT_READY")

    def test_unattended_deploy_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["unattended_pack_deploy_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m), "no_unattended_pack_deploy_in_record"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["rollout_record"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            v["sections"]["staged_rollout_and_health_record"],
            "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["changelog_entries_count"])
        self.assertIsNone(v["sealed_artifacts_count"])
        self.assertIsNone(v["rollback_steps_count"])
        self.assertIsNone(v["changelog_summary_coverage"])
        self.assertIsNone(v["checksum_format_coverage"])
        self.assertIsNone(v["rollback_action_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(
            "VERDICT: RELEASE_PACK_CHANGELOG_SEAL_ROLLBACK_READY",
            stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["release_label"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("release_label", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"version_detail": "should-be-an-object"})
        self.assertIn("version_detail", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"changelog_entries": {"entry_heading": "x"}})
        self.assertIn("changelog_entries", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"rollback_steps": ["drain"]})
        self.assertIn("rollback_steps[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["changelog_pack"]["keep_a_changelog_layout_followed"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn(
            "changelog_pack.keep_a_changelog_layout_followed",
            str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["seal_record"]["declared_sealed_artifact_total"] = "2"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn(
            "seal_record.declared_sealed_artifact_total",
            str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["sealed_artifacts"][0]["checksum_value"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("sealed_artifacts[0].checksum_value",
                      str(ctx.exception))

    def test_nested_list_entry_number_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["rollback_steps"][1]["step_order"] = "second"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("rollback_steps[1].step_order",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tag_and_attachment"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("tag_and_attachment", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
