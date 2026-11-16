import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from network_exposure_audit import evaluate, stamp  # noqa: E402

SOUND = {
    "system": "home-server-01",
    "environment": "production",
    "inventory": {"current": True},
    "endpoints": [
        {"id": "web", "host": "example.com", "port": 443,
         "protocol": "https", "public": True, "listed": True,
         "owner": "netsec", "service": "web", "zone": "public-edge",
         "via": "direct", "tls_cert_valid": True,
         "auth_required": False},
        {"id": "api", "host": "api.example.com", "port": 443,
         "protocol": "https", "public": True, "listed": True,
         "owner": "platform", "service": "api", "zone": "app",
         "via": "direct", "tls_cert_valid": True,
         "auth_required": True},
        {"id": "admin-tunnel", "host": "admin.internal", "port": 8443,
         "protocol": "https", "public": False, "listed": True,
         "owner": "netsec", "service": "admin", "zone": "admin",
         "via": "tunnel", "tls_cert_valid": True,
         "auth_required": True},
        {"id": "db-internal", "host": "db.internal", "port": 5432,
         "protocol": "tls", "public": False, "listed": True,
         "owner": "platform", "service": "database", "zone": "data",
         "via": "direct", "tls_cert_valid": True,
         "auth_required": True},
    ],
    "segmentation": {"zones_separated": True, "admin_plane_separate": True,
                     "default_deny": True, "loopback_by_default": True},
    "tls": {"cert_expiry_monitored": True, "hsts_on_web": True,
            "min_version": "1.2"},
    "dns": {"registrar_lock": True, "registrar_2fa": True,
            "dnssec_enabled": True},
    "domains": [
        {"name": "example.com", "sending": True, "spf": True,
         "dkim": True, "dmarc": True},
        {"name": "example.org", "sending": False, "spf": False,
         "dkim": False, "dmarc": False},
    ],
    "email": {"dmarc_reports_monitored": True},
    "edge": {"waf_or_cdn_in_front_of_web": True,
             "rate_limits_enabled": True},
    "access": {"admin_authenticated_path_only": True,
               "no_default_credentials": True},
    "egress": {"outbound_allowlist": True,
               "unexpected_egress_logged": True},
    "evidence": {"events_logged_denied_and_accepted": True,
                 "reviewed_on_change_and_incident": True},
}


def check(v, name):
    return next(c for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 27)

    def test_plaintext_endpoint_is_a_fail(self):
        m = copy.deepcopy(SOUND)
        m["endpoints"][0]["protocol"] = "http"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        c = check(v, "no_plaintext_protocol_endpoints")
        self.assertEqual(c["status"], "fail")
        self.assertIn("web", c["evidence"])

    def test_public_admin_endpoint_is_a_red_line_fail(self):
        m = copy.deepcopy(SOUND)
        m["endpoints"][2]["public"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        c = check(v, "no_admin_or_db_endpoint_public")
        self.assertEqual(c["status"], "fail")
        self.assertIn("admin-tunnel", c["evidence"])

    def test_public_database_port_is_a_red_line_fail(self):
        m = copy.deepcopy(SOUND)
        m["endpoints"][3]["public"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(
            check(v, "no_admin_or_db_endpoint_public")["status"], "fail")

    def test_unlisted_public_endpoint_fails(self):
        m = copy.deepcopy(SOUND)
        m["endpoints"][0]["listed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(
            check(v, "no_unlisted_public_endpoints")["status"], "fail")

    def test_unowned_public_endpoint_fails(self):
        m = copy.deepcopy(SOUND)
        del m["endpoints"][1]["owner"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        c = check(v, "every_public_endpoint_owned")
        self.assertEqual(c["status"], "fail")
        self.assertIn("api", c["evidence"])

    def test_private_endpoint_without_owner_passes(self):
        m = copy.deepcopy(SOUND)
        del m["endpoints"][3]["owner"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SOUND")

    def test_invalid_cert_on_encrypted_endpoint_fails(self):
        m = copy.deepcopy(SOUND)
        m["endpoints"][0]["tls_cert_valid"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(
            check(v, "encrypted_endpoints_have_valid_certs")["status"],
            "fail")

    def test_old_tls_min_version_fails(self):
        m = copy.deepcopy(SOUND)
        m["tls"]["min_version"] = "1.1"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(
            check(v, "modern_tls_min_version")["status"], "fail")

    def test_tls_13_min_version_passes(self):
        m = copy.deepcopy(SOUND)
        m["tls"]["min_version"] = "1.3"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SOUND")

    def test_sending_domain_without_dmarc_fails(self):
        m = copy.deepcopy(SOUND)
        m["domains"][0]["dmarc"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        c = check(v, "every_sending_domain_has_spf_dkim_dmarc")
        self.assertEqual(c["status"], "fail")
        self.assertIn("example.com", c["evidence"])

    def test_non_sending_domain_without_auth_passes(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(
            check(v, "every_sending_domain_has_spf_dkim_dmarc")["status"],
            "pass")

    def test_unauthenticated_tunnel_is_a_red_line_fail(self):
        m = copy.deepcopy(SOUND)
        m["endpoints"][2]["auth_required"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(
            check(v, "no_unauthenticated_tunnels")["status"], "fail")

    def test_stale_inventory_fails(self):
        m = copy.deepcopy(SOUND)
        m["inventory"]["current"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["inventory"], "fail")

    def test_open_segmentation_posture_fails(self):
        m = copy.deepcopy(SOUND)
        m["segmentation"]["default_deny"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["segmentation"], "fail")

    def test_no_egress_allowlist_fails(self):
        m = copy.deepcopy(SOUND)
        m["egress"]["outbound_allowlist"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "UNSOUND")
        self.assertEqual(v["sections"]["egress_evidence"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["dns"]
        del m["email"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["dns_email"],
                         "insufficient_evidence")

    def test_absent_endpoints_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["endpoints"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check(v, "no_plaintext_protocol_endpoints")["status"],
            "missing")

    def test_non_list_endpoints_rejected(self):
        # F1 test correction (coordinator ruling, 2026-11-15): this
        # test previously asserted an in-band UNSOUND verdict over
        # endpoints as a string — a wrong-typed documented field.
        # That assertion encoded the F1 defect itself: endpoints is
        # documented as a list, so the manifest is rejected with
        # ValueError naming the field.
        m = copy.deepcopy(SOUND)
        m["endpoints"] = "all-of-them"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("endpoints", str(ctx.exception))

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(len(v["checks"]), 27)

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
            evaluate({"inventory": {"current": "not-a-boolean"}})
        self.assertIn("inventory.current", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"inventory": {"current": "not-a-boolean"}})
        self.assertIn("inventory.current", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"inventory": "current"})
        self.assertIn("inventory", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["endpoints"] = "all-of-them"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("endpoints", str(ctx.exception))

    def test_list_entry_field_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["endpoints"][0]["port"] = "443"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("endpoints[0].port", str(ctx.exception))

    def test_domain_entry_field_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["domains"][0]["spf"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("domains[0].spf", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(SOUND)
        m["tls"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("tls", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
