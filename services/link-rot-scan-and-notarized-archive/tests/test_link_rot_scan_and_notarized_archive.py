import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from link_rot_scan_and_notarized_archive import evaluate, stamp  # noqa: E402


def _link(**overrides):
    row = {
        "id": "L1",
        "url": "https://example.org/paper",
        "is_published_citation": True,
        "observed_status": "ok",
        "archived": True,
        "capture_hash_present": True,
        "capture_timestamp_present": True,
        "capture_at_cite_time": True,
        "canonicalized": True,
        "stable_id_present": True,
        "content_hash": "sha256:aaa",
        "canonical_url": "https://example.org/paper",
        "notarized": True,
        "repair_action": "none_needed",
        "repair_logged": True,
    }
    row.update(overrides)
    return row


SOUND = {
    "site": "docs.example.org",
    "scan": {
        "scans_scheduled": True,
        "scan_records_status": True,
        "scan_records_content_hash": True,
        "dashboard_lists_rot_with_owners": True,
        "last_scan_within_cadence": True,
    },
    "links": [
        _link(),
        _link(id="L2", url="https://example.org/old-post",
              observed_status="dead",
              content_hash="sha256:bbb",
              canonical_url="https://example.org/old-post",
              repair_action="archived_copy"),
        _link(id="L3", url="https://example.org/draft",
              is_published_citation=False,
              content_hash="sha256:ccc",
              canonical_url="https://example.org/draft"),
    ],
    "archive": {
        "capture_format_warc_or_singlefile": True,
        "fallback_chain_configured": True,
    },
    "canonicalization": {
        "tracker_params_stripped": True,
        "redirects_resolved": True,
        "dedupe_by_content_hash": True,
    },
    "notarization": {
        "hash_algorithm_sha256": True,
        "timestamp_source": "rfc3161_tsa",
        "evidence_bundle_complete": True,
        "tool_versions_recorded": True,
        "verification_recipe_published": True,
    },
    "serving": {
        "as_seen_views_available": True,
        "live_vs_archive_diff_available": True,
        "provenance_badge_shows_capture_date": True,
        "provenance_badge_shows_verification_status": True,
        "archived_presented_as_current": False,
        "authorship_preserved": True,
    },
    "repair": {
        "repairs_logged": True,
        "silent_drops_made": False,
    },
    "compliance": {
        "robots_and_tos_honored": True,
        "rate_limits_respected": True,
        "access_controls_bypassed": False,
        "fabricated_captures_present": False,
    },
}


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_link_integrity_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 33)
        self.assertEqual(v["links_evaluated"], 3)
        self.assertEqual(v["citations_total"], 2)
        self.assertEqual(v["rotted_citations"], 1)
        self.assertEqual(v["unarchived_citations"], 0)

    def test_unarchived_citation_fails(self):
        m = copy.deepcopy(SOUND)
        m["links"][0]["archived"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")
        self.assertEqual(v["sections"]["archive_capture"], "fail")
        self.assertEqual(v["unarchived_citations"], 1)

    def test_citation_without_capture_hash_fails(self):
        m = copy.deepcopy(SOUND)
        m["links"][0]["capture_hash_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")
        self.assertEqual(v["unarchived_citations"], 1)

    def test_capture_not_at_cite_time_fails(self):
        m = copy.deepcopy(SOUND)
        m["links"][0]["capture_at_cite_time"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")
        self.assertEqual(v["sections"]["archive_capture"], "fail")

    def test_non_citation_unarchived_does_not_fail_archive_gate(self):
        m = copy.deepcopy(SOUND)
        m["links"][2]["archived"] = False
        m["links"][2]["capture_hash_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_SOUND")
        self.assertEqual(v["unarchived_citations"], 0)

    def test_rotted_citation_without_repair_fails(self):
        m = copy.deepcopy(SOUND)
        m["links"][1]["repair_action"] = "none"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")
        self.assertEqual(v["sections"]["repair_and_compliance"], "fail")

    def test_rotted_citation_with_unlogged_repair_fails(self):
        m = copy.deepcopy(SOUND)
        m["links"][1]["repair_logged"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")

    def test_rotted_citation_with_removal_note_passes(self):
        m = copy.deepcopy(SOUND)
        m["links"][1]["repair_action"] = "removal_note"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_SOUND")

    def test_paywalled_citation_is_not_rotted(self):
        m = copy.deepcopy(SOUND)
        m["links"][0]["observed_status"] = "paywalled"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_SOUND")
        self.assertEqual(v["rotted_citations"], 1)

    def test_duplicate_content_with_two_canonicals_fails(self):
        m = copy.deepcopy(SOUND)
        m["links"][2]["content_hash"] = "sha256:aaa"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")
        self.assertEqual(v["sections"]["canonicalization"], "fail")

    def test_link_without_stable_id_fails(self):
        m = copy.deepcopy(SOUND)
        m["links"][0]["stable_id_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")
        self.assertEqual(v["sections"]["canonicalization"], "fail")

    def test_unnotarized_citation_fails(self):
        m = copy.deepcopy(SOUND)
        m["links"][0]["notarized"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")
        self.assertEqual(v["sections"]["notarization"], "fail")

    def test_timestamp_source_none_fails(self):
        m = copy.deepcopy(SOUND)
        m["notarization"]["timestamp_source"] = "none"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")
        self.assertEqual(v["sections"]["notarization"], "fail")

    def test_transparency_log_timestamp_passes(self):
        m = copy.deepcopy(SOUND)
        m["notarization"]["timestamp_source"] = "transparency_log"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_SOUND")

    def test_archived_presented_as_current_fails(self):
        m = copy.deepcopy(SOUND)
        m["serving"]["archived_presented_as_current"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")
        self.assertEqual(v["sections"]["honest_serving"], "fail")

    def test_provenance_badge_missing_status_fails(self):
        m = copy.deepcopy(SOUND)
        m["serving"]["provenance_badge_shows_verification_status"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")

    def test_silent_drop_fails(self):
        m = copy.deepcopy(SOUND)
        m["repair"]["silent_drops_made"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")
        self.assertEqual(v["sections"]["repair_and_compliance"], "fail")

    def test_fabricated_captures_fail(self):
        m = copy.deepcopy(SOUND)
        m["compliance"]["fabricated_captures_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")

    def test_access_control_bypass_fails(self):
        m = copy.deepcopy(SOUND)
        m["compliance"]["access_controls_bypassed"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")

    def test_scans_not_scheduled_fails(self):
        m = copy.deepcopy(SOUND)
        m["scan"]["scans_scheduled"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LINK_INTEGRITY_UNSOUND")
        self.assertEqual(v["sections"]["scan_coverage"], "fail")

    def test_link_missing_field_is_insufficient_evidence(self):
        m = copy.deepcopy(SOUND)
        del m["links"][0]["content_hash"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["links_evaluated"], 2)

    def test_link_with_unknown_status_is_insufficient_evidence(self):
        m = copy.deepcopy(SOUND)
        m["links"][0]["observed_status"] = "redirected"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["notarization"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["notarization"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["links_evaluated"], 0)

    def test_no_links_declared_is_insufficient_evidence(self):
        m = copy.deepcopy(SOUND)
        del m["links"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertIn("VERDICT: LINK_INTEGRITY_SOUND", stamp(v))

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
            evaluate({"site": "malformed_test",
                      "scan": "not_an_object"})
        self.assertIn("scan", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"scan": "not_an_object"})
        self.assertIn("scan", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["scan"]["scans_scheduled"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("scan.scans_scheduled", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["links"] = "not-a-list"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("links", str(ctx.exception))

    def test_list_entry_field_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["links"][0]["observed_status"] = 404
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("links[0].observed_status", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["links"][0] = "not-an-object"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("links[0]", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(SOUND)
        m["notarization"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("notarization", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
