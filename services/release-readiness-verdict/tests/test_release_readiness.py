import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from release_readiness import evaluate, stamp  # noqa: E402
import keys  # noqa: E402

READY = {
    "product": "example-app",
    "version": "1.2.0",
    "version_bump_locations": ["VERSION"],
    "tag": {"name": "v1.2.0", "annotated": True, "moved": False},
    "changelog": {"has_entry_for_version": True,
                  "unreleased_section_moved": True},
    "release_notes": {"present": True, "breaking_changes": [],
                      "migration_steps": []},
    "approver": "release-owner",
    "approval": {"hitl_recorded": True},
    "rollout_plan": {"present": True, "staged": True},
    "rollback_plan": {"present": True, "testable": True},
    "health_check": {"window_hours": 36},
    "artifacts": {"sealed": True, "checksum_manifest": True,
                  "verified_before_announcement": True},
    "tests": {"passing": True},
}


class VerdictTests(unittest.TestCase):
    def test_ready_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(READY))
        self.assertEqual(v["verdict"], "READY")
        self.assertTrue(all(s == "pass" for s in v["bars"].values()))

    def test_missing_rollback_plan_is_not_ready(self):
        m = copy.deepcopy(READY)
        m["rollback_plan"]["present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_READY")
        self.assertEqual(v["bars"]["lifecycle"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(READY)
        del m["health_check"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["bars"]["lifecycle"], "insufficient_evidence")

    def test_bad_semver_fails_control(self):
        m = copy.deepcopy(READY)
        m["version"] = "1.2"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_READY")
        self.assertEqual(v["bars"]["control"], "fail")

    def test_moved_tag_is_a_red_line_fail(self):
        m = copy.deepcopy(READY)
        m["tag"]["moved"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_READY")

    def test_breaking_change_without_migration_steps_fails(self):
        m = copy.deepcopy(READY)
        m["release_notes"]["breaking_changes"] = ["config format changed"]
        m["release_notes"]["migration_steps"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_READY")
        self.assertEqual(v["bars"]["understanding"], "fail")

    def test_breaking_change_with_migration_steps_passes(self):
        m = copy.deepcopy(READY)
        m["release_notes"]["breaking_changes"] = ["config format changed"]
        m["release_notes"]["migration_steps"] = ["run migrate-config"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "READY")

    def test_health_window_outside_24_to_48_fails(self):
        m = copy.deepcopy(READY)
        m["health_check"]["window_hours"] = 6
        v = evaluate(m)
        self.assertEqual(v["verdict"], "NOT_READY")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(READY))
        self.assertIn("VERDICT: READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class KeyTests(unittest.TestCase):
    SECRET = "test-master-secret-not-a-real-one"

    def test_derivation_is_deterministic(self):
        a = keys.derive_key(self.SECRET, "User@Example.com",
                            "release-readiness-verdict", "2026-11-15T00:00:00Z")
        b = keys.derive_key(self.SECRET, "user@example.com",
                            "release-readiness-verdict", "2026-11-15T00:00:00Z")
        self.assertEqual(a, b)  # email case-normalised
        self.assertTrue(a.startswith("atm_1_release_readiness_verdict_"))

    def test_key_is_per_atom(self):
        a = keys.derive_key(self.SECRET, "u@example.com",
                            "release-readiness-verdict", "2026-11-15T00:00:00Z")
        self.assertFalse(keys.verify(a, self.SECRET, "u@example.com",
                                     "assumption-audit",
                                     "2026-11-15T00:00:00Z"))

    def test_verify_roundtrip_and_tamper(self):
        k = keys.derive_key(self.SECRET, "u@example.com",
                            "release-readiness-verdict", "2026-11-15T00:00:00Z")
        self.assertTrue(keys.verify(k, self.SECRET, "u@example.com",
                                    "release-readiness-verdict",
                                    "2026-11-15T00:00:00Z"))
        tampered = k[:-1] + ("0" if k[-1] != "0" else "1")
        self.assertFalse(keys.verify(tampered, self.SECRET,
                                     "u@example.com",
                                     "release-readiness-verdict",
                                     "2026-11-15T00:00:00Z"))

    def test_revoked_issuance_fails(self):
        k = keys.derive_key(self.SECRET, "u@example.com",
                            "release-readiness-verdict", "2026-11-15T00:00:00Z")
        self.assertFalse(keys.verify(k, self.SECRET, "u@example.com",
                                     "release-readiness-verdict",
                                     "2026-11-15T00:00:00Z", revoked=True))

    def test_fingerprint_is_not_the_key(self):
        k = keys.derive_key(self.SECRET, "u@example.com",
                            "release-readiness-verdict", "2026-11-15T00:00:00Z")
        self.assertEqual(len(keys.fingerprint(k)), 16)
        self.assertNotIn(keys.fingerprint(k), k)


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict.
    The first case mirrors the recorded external malformed input."""

    def test_recorded_malformed_case_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"product": 123, "version": "1.2.3",
                      "version_bump_locations": "not-a-list",
                      "tag": "invalid-object-type"})
        self.assertIn("product", str(ctx.exception))

    def test_product_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"product": 123})
        self.assertIn("product", str(ctx.exception))

    def test_version_bump_locations_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"version_bump_locations": "not-a-list"})
        self.assertIn("version_bump_locations", str(ctx.exception))

    def test_tag_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"tag": "invalid-object-type"})
        self.assertIn("tag", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["tag"]["annotated"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("tag.annotated", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(READY)
        m["version_bump_locations"] = [42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("version_bump_locations[0]", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(READY)
        m["tag"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("tag", str(ctx.exception))


class F3RegressionTests(unittest.TestCase):
    """F3 regression (external verification retest, 2026-11-15):
    release_notes.breaking_changes and release_notes.migration_steps
    carry no documented type in SERVICE.md, so they are not
    type-validated. The recorded Wave 1 battery manifests below are
    embedded verbatim from
    verification/work/release-readiness-verdict/cases.json —
    breaking_changes: false and migration_steps: "none" must return
    verdicts, not raise ValueError (HTTP 422)."""

    FULL_PASS = {
        "product": "milo-core",
        "version": "1.2.3",
        "version_bump_locations": [
            "src/version.py"
        ],
        "tag": {
            "name": "v1.2.3",
            "annotated": True,
            "moved": False
        },
        "changelog": {
            "has_entry_for_version": True,
            "unreleased_section_moved": True
        },
        "release_notes": {
            "present": True,
            "breaking_changes": False,
            "migration_steps": "none"
        },
        "approver": "jane.doe",
        "approval": {
            "hitl_recorded": True
        },
        "rollout_plan": {
            "present": True
        },
        "rollback_plan": {
            "present": True,
            "testable": True
        },
        "health_check": {
            "window_hours": 24
        },
        "artifacts": {
            "sealed": True,
            "checksum_manifest": True,
            "verified_before_announcement": True
        },
        "tests": {
            "passing": True
        }
    }

    VIOLATIONS = {
        "product": "milo-core",
        "version": "1.2.3",
        "version_bump_locations": [
            "src/version.py"
        ],
        "tag": {
            "name": "v1.2.3",
            "annotated": True,
            "moved": False
        },
        "changelog": {
            "has_entry_for_version": True,
            "unreleased_section_moved": True
        },
        "release_notes": {
            "present": True,
            "breaking_changes": False,
            "migration_steps": "none"
        },
        "approver": "jane.doe",
        "approval": {
            "hitl_recorded": True
        },
        "rollout_plan": {
            "present": True
        },
        "rollback_plan": {
            "present": True,
            "testable": False
        },
        "health_check": {
            "window_hours": 10
        },
        "artifacts": {
            "sealed": True,
            "checksum_manifest": True,
            "verified_before_announcement": True
        },
        "tests": {
            "passing": True
        }
    }

    MALFORMED = {
        "product": 123,
        "version": "1.2.3",
        "version_bump_locations": "not-a-list",
        "tag": "invalid-object-type"
    }

    def test_recorded_full_pass_returns_ready(self):
        v = evaluate(copy.deepcopy(self.FULL_PASS))
        self.assertEqual(v["verdict"], "READY")

    def test_recorded_violations_returns_not_ready(self):
        v = evaluate(copy.deepcopy(self.VIOLATIONS))
        self.assertEqual(v["verdict"], "NOT_READY")

    def test_recorded_malformed_still_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate(copy.deepcopy(self.MALFORMED))
        self.assertIn("product", str(ctx.exception))

    def test_minimal_false_breaking_and_string_migration_not_rejected(self):
        v = evaluate({"release_notes": {"present": True,
                                        "breaking_changes": False,
                                        "migration_steps": "none"}})
        self.assertIn("verdict", v)


if __name__ == "__main__":
    unittest.main()
