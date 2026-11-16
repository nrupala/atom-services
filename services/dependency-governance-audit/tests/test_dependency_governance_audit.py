import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from dependency_governance_audit import evaluate, stamp  # noqa: E402

GOVERNED = {
    "project": "example-app",
    "justification": {"recorded": True, "alternatives_considered": True},
    "sources": {"all_official": True, "publisher_signing_checked": True,
                "binaries_present": True, "binary_checksums_verified": True},
    "pinning": {"exact_versions": True, "lockfile_committed": True,
                "lockfile_updated_in_same_change": True,
                "ci_installs_from_lockfile": True,
                "ci_actions_images_pinned_to_hashes": True},
    "audit": {"automated_in_workflow": True, "bot_bumps_reviewed": True,
              "automerge_without_green_suite": False},
    "updates": {"batched": True, "stale_dependencies_flagged": True,
                "unused_retired": True},
    "licences": {"checked": True, "non_permissive_present": False,
                 "human_decision_recorded": False,
                 "notice_required": True, "notice_updated": True},
    "sbom": {"generated_per_release": True, "kept_with_artifacts": True},
}


class VerdictTests(unittest.TestCase):
    def test_governed_manifest_is_governed(self):
        v = evaluate(copy.deepcopy(GOVERNED))
        self.assertEqual(v["verdict"], "GOVERNED")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))

    def test_unpinned_versions_fail_pinning(self):
        m = copy.deepcopy(GOVERNED)
        m["pinning"]["exact_versions"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GOVERNED")
        self.assertEqual(v["sections"]["pinning"], "fail")

    def test_unknown_sources_are_a_red_line_fail(self):
        m = copy.deepcopy(GOVERNED)
        m["sources"]["all_official"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GOVERNED")
        self.assertEqual(v["sections"]["verified_sources"], "fail")

    def test_automerge_without_green_suite_is_a_red_line_fail(self):
        m = copy.deepcopy(GOVERNED)
        m["audit"]["automerge_without_green_suite"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GOVERNED")
        self.assertEqual(v["sections"]["audit_and_updates"], "fail")

    def test_lockfile_not_updated_in_same_change_fails(self):
        m = copy.deepcopy(GOVERNED)
        m["pinning"]["lockfile_updated_in_same_change"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GOVERNED")
        self.assertEqual(v["sections"]["pinning"], "fail")

    def test_unpinned_ci_actions_fail(self):
        m = copy.deepcopy(GOVERNED)
        m["pinning"]["ci_actions_images_pinned_to_hashes"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GOVERNED")

    def test_copyleft_without_human_decision_fails(self):
        m = copy.deepcopy(GOVERNED)
        m["licences"]["non_permissive_present"] = True
        m["licences"]["human_decision_recorded"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GOVERNED")
        self.assertEqual(v["sections"]["licences"], "fail")

    def test_copyleft_with_human_decision_passes(self):
        m = copy.deepcopy(GOVERNED)
        m["licences"]["non_permissive_present"] = True
        m["licences"]["human_decision_recorded"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GOVERNED")

    def test_notice_required_but_not_updated_fails(self):
        m = copy.deepcopy(GOVERNED)
        m["licences"]["notice_updated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GOVERNED")
        self.assertEqual(v["sections"]["licences"], "fail")

    def test_binaries_without_checksums_fail(self):
        m = copy.deepcopy(GOVERNED)
        m["sources"]["binary_checksums_verified"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GOVERNED")
        self.assertEqual(v["sections"]["verified_sources"], "fail")

    def test_no_binaries_passes_checksum_check(self):
        m = copy.deepcopy(GOVERNED)
        m["sources"]["binaries_present"] = False
        del m["sources"]["binary_checksums_verified"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "GOVERNED")

    def test_unjustified_dependency_fails(self):
        m = copy.deepcopy(GOVERNED)
        m["justification"]["recorded"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_GOVERNED")
        self.assertEqual(v["sections"]["justification"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(GOVERNED)
        del m["sbom"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["sbom"], "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(GOVERNED))
        self.assertIn("VERDICT: GOVERNED", stamp(v))

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
            evaluate({"project": "malformed-project",
                      "justification": "not-an-object",
                      "sources": {"all_official": "should-be-boolean"}})
        self.assertIn("justification", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"justification": "not-an-object"})
        self.assertIn("justification", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"sources": {"all_official": "should-be-boolean"}})
        self.assertIn("sources.all_official", str(ctx.exception))

    def test_nested_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(GOVERNED)
        m["pinning"]["exact_versions"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("pinning.exact_versions", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(GOVERNED)
        m["sources"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("sources", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
