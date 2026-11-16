import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from firewall_rules_audit import evaluate, stamp  # noqa: E402

SOUND = {
    "system": "edge-fw-01",
    "environment": "production",
    "default_policy": {"inbound": "deny", "outbound": "deny"},
    "layers_consistent": True,
    "rules": [
        {"id": "web-https", "direction": "inbound",
         "source": "203.0.113.0/24", "destination": "10.0.1.10/32",
         "port_start": 443, "port_end": 443, "protocol": "tcp",
         "action": "allow", "owner": "netsec", "reason": "public web",
         "date": "2026-10-01", "service": "web"},
        {"id": "ssh-admin", "direction": "inbound",
         "source": "198.51.100.10/32", "destination": "10.0.1.10/32",
         "port_start": 22, "port_end": 22, "protocol": "tcp",
         "action": "allow", "owner": "netsec",
         "reason": "admin ssh from jump host", "date": "2026-10-01",
         "service": "ssh"},
        {"id": "dns-egress", "direction": "outbound",
         "source": "10.0.1.10/32", "destination": "1.1.1.1/32",
         "port_start": 53, "port_end": 53, "protocol": "udp",
         "action": "allow", "owner": "netsec", "reason": "dns resolver",
         "date": "2026-10-01", "service": "dns"},
        {"id": "deny-all-in", "direction": "inbound", "source": "any",
         "destination": "any", "port_start": 0, "port_end": 65535,
         "protocol": "any", "action": "deny"},
        {"id": "deny-all-out", "direction": "outbound", "source": "any",
         "destination": "any", "port_start": 0, "port_end": 65535,
         "protocol": "any", "action": "deny"},
    ],
    "egress": {"explicit_allowlist": True, "alert_on_denies": True},
    "change_control": {"changes_reviewed": True,
                       "old_rules_retired_on_schedule": True},
    "logging": {"denials_logged": True, "rate_limited": True},
    "testing": {"allowed_and_disallowed_paths_verified": True,
                "smoke_matrix_per_service": True},
    "review": {"cadence_days": 30},
}


def check(v, name):
    return next(c for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))

    def test_any_any_allow_is_a_red_line_fail(self):
        m = copy.deepcopy(SOUND)
        m["rules"].insert(3, {
            "id": "bad-any", "direction": "inbound", "source": "any",
            "destination": "any", "port_start": 443, "port_end": 443,
            "protocol": "tcp", "action": "allow", "owner": "netsec",
            "reason": "debug", "date": "2026-10-01", "service": "web"})
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        c = check(v, "no_any_any_allow_rules")
        self.assertEqual(c["status"], "fail")
        self.assertIn("bad-any", c["evidence"])

    def test_shadowed_rule_fails(self):
        m = copy.deepcopy(SOUND)
        dupe = copy.deepcopy(m["rules"][0])
        dupe["id"] = "web-https-dupe"
        m["rules"].insert(1, dupe)
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        c = check(v, "no_shadowed_rules")
        self.assertEqual(c["status"], "fail")
        self.assertIn("web-https-dupe shadowed by web-https",
                      c["evidence"])

    def test_overly_broad_port_range_fails(self):
        m = copy.deepcopy(SOUND)
        m["rules"][0]["port_start"] = 1000
        m["rules"][0]["port_end"] = 3000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(
            check(v, "no_overly_broad_port_ranges")["status"], "fail")

    def test_direct_database_exposure_fails(self):
        m = copy.deepcopy(SOUND)
        m["rules"].insert(3, {
            "id": "db-open", "direction": "inbound", "source": "any",
            "destination": "10.0.2.20/32", "port_start": 5432,
            "port_end": 5432, "protocol": "tcp", "action": "allow",
            "owner": "netsec", "reason": "db access",
            "date": "2026-10-01", "service": "database"})
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        c = check(v, "no_direct_sensitive_exposure")
        self.assertEqual(c["status"], "fail")
        self.assertIn("db-open", c["evidence"])

    def test_open_default_policy_fails_baseline(self):
        m = copy.deepcopy(SOUND)
        m["default_policy"]["inbound"] = "allow"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["baseline"], "fail")

    def test_missing_explicit_default_deny_rule_fails(self):
        m = copy.deepcopy(SOUND)
        m["rules"] = [r for r in m["rules"] if r["action"] == "allow"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(
            check(v, "explicit_default_deny_rule_present")["status"],
            "fail")

    def test_undocumented_allow_rule_fails(self):
        m = copy.deepcopy(SOUND)
        del m["rules"][0]["owner"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        c = check(v, "every_allow_rule_documented")
        self.assertEqual(c["status"], "fail")
        self.assertIn("web-https", c["evidence"])

    def test_temporary_rule_without_ticket_fails(self):
        m = copy.deepcopy(SOUND)
        m["rules"][1]["temporary"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(
            check(v, "temporary_rules_have_ticket_and_expiry")["status"],
            "fail")

    def test_temporary_rule_with_ticket_and_expiry_passes(self):
        m = copy.deepcopy(SOUND)
        m["rules"][1]["temporary"] = True
        m["rules"][1]["ticket"] = "SEC-123"
        m["rules"][1]["expiry_date"] = "2026-12-01"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SOUND")

    def test_unreviewed_port_forward_fails(self):
        m = copy.deepcopy(SOUND)
        m["rules"][0]["port_forward"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(
            check(v, "no_port_forwards_without_review")["status"],
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["logging"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["assurance"],
                         "insufficient_evidence")

    def test_review_cadence_over_31_days_fails(self):
        m = copy.deepcopy(SOUND)
        m["review"]["cadence_days"] = 90
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["assurance"], "fail")

    def test_non_explicit_egress_fails(self):
        m = copy.deepcopy(SOUND)
        m["egress"]["explicit_allowlist"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["egress"], "fail")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(len(v["checks"]), 20)

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertIn("VERDICT: SOUND", stamp(v))

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
            evaluate({"system": "malformed-test",
                      "review": {"cadence_days": "thirty"}})
        self.assertIn("review.cadence_days", str(ctx.exception))

    def test_cadence_days_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"review": {"cadence_days": "thirty"}})
        self.assertIn("review.cadence_days", str(ctx.exception))

    def test_nested_leaf_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["default_policy"]["inbound"] = 123
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("default_policy.inbound", str(ctx.exception))

    def test_rules_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["rules"] = "not-a-list"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("rules", str(ctx.exception))

    def test_rule_entry_field_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["rules"][0]["action"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("rules[0].action", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(SOUND)
        m["review"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("review", str(ctx.exception))

    def test_documented_port_fallback_not_rejected(self):
        # SERVICE.md: port_start/port_end that are not both integers
        # mean the rule covers ports 0-65535 — documented semantics,
        # so a wrong-typed port is evaluated, never a type error.
        m = copy.deepcopy(SOUND)
        m["rules"][0]["port_start"] = "443"
        v = evaluate(m)
        self.assertIn(v["verdict"],
                      ("SOUND", "UNSOUND", "INSUFFICIENT_EVIDENCE"))


if __name__ == "__main__":
    unittest.main()
