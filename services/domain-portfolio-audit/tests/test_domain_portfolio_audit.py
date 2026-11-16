import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from domain_portfolio_audit import evaluate, stamp  # noqa: E402

COMPLETE = {
    "portfolio": "personal-brand-estate",
    "evaluation_date": "2026-11-15",
    "inventory": {"inventory_current": True,
                  "single_source_of_truth": True,
                  "version_controlled": True,
                  "secrets_in_inventory_present": False},
    "brand_architecture": {"redirect_map_as_code": True,
                           "redirect_map_reviewed_in_diffs": True},
    "domains": [
        {"name": "example.com", "registrar": "Cloudflare",
         "renewal_date": "2027-08-20", "status": "active",
         "purpose": "primary brand site", "owner": "owner",
         "brand_cluster": "example-brand", "is_canonical": True,
         "is_personal_brand": True, "sends_email": True,
         "spf_declared": True, "dkim_declared": True,
         "dmarc_declared": True, "registrar_lock": True,
         "auto_renew": True},
        {"name": "example.org", "registrar": "Cloudflare",
         "renewal_date": "2027-05-01", "status": "redirect",
         "purpose": "variant spelling", "owner": "owner",
         "brand_cluster": "example-brand", "is_canonical": False,
         "is_personal_brand": False,
         "redirect_target": "example.com", "redirect_status_code": 301,
         "sends_email": False},
        {"name": "example.net", "registrar": "Namecheap",
         "renewal_date": "2026-12-20", "status": "parked",
         "purpose": "defensive registration", "owner": "owner",
         "brand_cluster": "example-brand", "is_canonical": False,
         "is_personal_brand": False, "sends_email": False,
         "spoofing_blocked": True},
    ],
    "dns": {"zones_version_controlled": True,
            "ttl_policy_defined": True,
            "wildcard_dns_present": True,
            "wildcard_justification_documented": True,
            "change_protocol_followed": True,
            "silent_changes_present": False},
    "redirects": {"redirect_map_tested": True},
    "email_auth": {"dmarc_monitoring_rua_configured": True,
                   "dmarc_progression_toward_quarantine": True,
                   "tested_after_dns_changes": True},
    "tls": {"certs_auto_renew": True,
            "hsts_enabled_once_stable": True,
            "changes_dual_verified": True,
            "cert_expiry_monitored": True,
            "uptime_and_redirect_chains_monitored": True,
            "wildcard_dns_and_cert_combo_without_review_present": False},
    "renewals": {"alerts_configured": True,
                 "alert_window_days": 90,
                 "payment_method_expiry_tracked": True,
                 "expiry_monitors_live": True},
    "audit": {"quarterly_audit_executed": True,
              "quarterly_audit_logged": True,
              "dead_redirects_checked": True,
              "dangling_dns_records_checked": True,
              "dmarc_reports_reviewed": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 44)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["domains_count"], 3)
        self.assertEqual(v["domains_without_purpose"], [])
        self.assertEqual(v["purpose_coverage"], "1.0000")
        self.assertEqual(v["email_auth_coverage"], "1.0000")
        self.assertEqual(v["domains_missing_email_auth"], [])
        self.assertEqual(v["domains_lapsed"], [])
        self.assertEqual(v["domains_within_alert_window"],
                         ["example.net"])
        self.assertEqual(v["nearest_renewal_days"], 35)
        self.assertEqual(v["redirect_loop_domains"], [])

    def test_inventory_not_current_fails_inventory_section(self):
        m = copy.deepcopy(COMPLETE)
        m["inventory"]["inventory_current"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_NOT_SOUND")
        self.assertEqual(
            v["sections"]["inventory_and_brand_architecture"], "fail")

    def test_secrets_in_inventory_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["inventory"]["secrets_in_inventory_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "DOMAIN_PORTFOLIO_NOT_SOUND")

    def test_domain_without_purpose_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][1]["purpose"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_domain_has_purpose"), "fail")
        self.assertEqual(v["domains_without_purpose"], ["example.org"])
        self.assertEqual(v["purpose_coverage"], "0.6667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_domain_missing_purpose_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["domains"][0]["purpose"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_domain_has_purpose"), "missing")
        self.assertEqual(v["domains_without_purpose"], ["example.com"])

    def test_empty_domains_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "domains_declared"), "fail")
        self.assertEqual(v["domains_count"], 0)
        self.assertIsNone(v["purpose_coverage"])
        self.assertIsNone(v["email_auth_coverage"])

    def test_two_canonicals_in_cluster_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][1]["is_canonical"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_NOT_SOUND")
        self.assertEqual(
            check_status(v, "exactly_one_canonical_per_brand_cluster"),
            "fail")

    def test_no_canonical_in_cluster_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][0]["is_canonical"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "exactly_one_canonical_per_brand_cluster"),
            "fail")

    def test_wildcard_without_justification_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["dns"]["wildcard_justification_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_NOT_SOUND")
        self.assertEqual(
            check_status(v, "wildcard_dns_justified_when_present"),
            "fail")

    def test_no_wildcard_passes_justification_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["dns"]["wildcard_dns_present"] = False
        del m["dns"]["wildcard_justification_documented"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_SOUND")
        self.assertEqual(
            check_status(v, "wildcard_dns_justified_when_present"),
            "pass")

    def test_silent_dns_changes_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["dns"]["silent_changes_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "DOMAIN_PORTFOLIO_NOT_SOUND")

    def test_redirect_without_target_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][1]["redirect_target"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_redirect_domain_declares_target"),
            "fail")

    def test_redirect_missing_target_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["domains"][1]["redirect_target"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_redirect_domain_declares_target"),
            "missing")

    def test_redirect_with_302_fails_301_check(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][1]["redirect_status_code"] = 302
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_redirect_uses_301"), "fail")
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_NOT_SOUND")

    def test_redirect_loop_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][0]["status"] = "redirect"
        m["domains"][0]["redirect_target"] = "example.org"
        m["domains"][0]["redirect_status_code"] = 301
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_NOT_SOUND")
        self.assertEqual(check_status(v, "no_redirect_loops"), "fail")
        self.assertEqual(
            check_status(v, "redirect_chains_at_most_two_hops"), "fail")
        self.assertEqual(v["redirect_loop_domains"],
                         ["example.com", "example.org"])

    def test_redirect_chain_beyond_two_hops_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"].append(
            {"name": "example.io", "registrar": "Cloudflare",
             "renewal_date": "2027-01-15", "status": "redirect",
             "purpose": "short link", "owner": "owner",
             "brand_cluster": "example-brand", "is_canonical": False,
             "is_personal_brand": False,
             "redirect_target": "example.org",
             "redirect_status_code": 301, "sends_email": False})
        m["domains"].append(
            {"name": "example.co", "registrar": "Cloudflare",
             "renewal_date": "2027-02-15", "status": "redirect",
             "purpose": "typo variant", "owner": "owner",
             "brand_cluster": "example-brand", "is_canonical": False,
             "is_personal_brand": False,
             "redirect_target": "example.io",
             "redirect_status_code": 301, "sends_email": False})
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_redirect_loops"), "pass")
        self.assertEqual(
            check_status(v, "redirect_chains_at_most_two_hops"), "fail")
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_NOT_SOUND")

    def test_sending_domain_without_dmarc_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][0]["dmarc_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_NOT_SOUND")
        self.assertEqual(
            v["sections"]["email_authentication_and_tls"], "fail")
        self.assertEqual(
            check_status(v, "every_sending_domain_has_dmarc"), "fail")
        self.assertEqual(v["domains_missing_email_auth"],
                         ["example.com"])
        self.assertEqual(v["email_auth_coverage"], "0.0000")

    def test_sending_domain_missing_spf_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["domains"][0]["spf_declared"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_sending_domain_has_spf"), "missing")
        self.assertEqual(v["domains_missing_email_auth"], [])

    def test_parked_domain_without_spoofing_block_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][2]["spoofing_blocked"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "parked_domains_block_spoofing"), "fail")
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_NOT_SOUND")

    def test_unreviewed_wildcard_combo_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tls"]["wildcard_dns_and_cert_combo_without_review_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "DOMAIN_PORTFOLIO_NOT_SOUND")

    def test_lapsed_domain_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][2]["renewal_date"] = "2026-10-01"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_NOT_SOUND")
        self.assertEqual(
            v["sections"]["renewals_and_audit"], "fail")
        self.assertEqual(
            check_status(v, "every_domain_renewal_not_lapsed"), "fail")
        self.assertEqual(v["domains_lapsed"], ["example.net"])
        self.assertEqual(v["nearest_renewal_days"], -45)
        self.assertEqual(v["domains_within_alert_window"], [])

    def test_invalid_renewal_date_string_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][0]["renewal_date"] = "next spring"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_domain_renewal_not_lapsed"), "fail")

    def test_missing_evaluation_date_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["evaluation_date"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_domain_renewal_not_lapsed"),
            "missing")
        self.assertIsNone(v["domains_lapsed"])
        self.assertIsNone(v["nearest_renewal_days"])
        self.assertIsNone(v["domains_within_alert_window"])

    def test_alert_window_absent_nulls_window_list_only(self):
        m = copy.deepcopy(COMPLETE)
        del m["renewals"]["alert_window_days"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_SOUND")
        self.assertIsNone(v["domains_within_alert_window"])
        self.assertEqual(v["nearest_renewal_days"], 35)

    def test_personal_brand_without_lock_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][0]["registrar_lock"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "personal_brand_domains_lock_and_auto_renew"),
            "fail")
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_NOT_SOUND")

    def test_personal_brand_missing_auto_renew_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["domains"][0]["auto_renew"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "personal_brand_domains_lock_and_auto_renew"),
            "missing")

    def test_quarterly_audit_not_logged_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["audit"]["quarterly_audit_logged"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DOMAIN_PORTFOLIO_NOT_SOUND")
        self.assertEqual(v["sections"]["renewals_and_audit"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["audit"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["renewals_and_audit"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["domains_count"])
        self.assertIsNone(v["domains_without_purpose"])
        self.assertIsNone(v["purpose_coverage"])
        self.assertIsNone(v["email_auth_coverage"])
        self.assertIsNone(v["domains_missing_email_auth"])
        self.assertIsNone(v["domains_lapsed"])
        self.assertIsNone(v["domains_within_alert_window"])
        self.assertIsNone(v["nearest_renewal_days"])
        self.assertIsNone(v["redirect_loop_domains"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: DOMAIN_PORTFOLIO_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["portfolio"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("portfolio", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"dns": "should-be-an-object"})
        self.assertIn("dns", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"domains": {"name": "example.com"}})
        self.assertIn("domains", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"domains": ["example.com"]})
        self.assertIn("domains[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["inventory"]["inventory_current"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("inventory.inventory_current", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][1]["redirect_target"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("domains[1].redirect_target", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][0]["spf_declared"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("domains[0].spf_declared", str(ctx.exception))

    def test_redirect_status_code_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][1]["redirect_status_code"] = "301"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("domains[1].redirect_status_code",
                      str(ctx.exception))

    def test_redirect_status_code_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["domains"][1]["redirect_status_code"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("domains[1].redirect_status_code",
                      str(ctx.exception))

    def test_alert_window_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["renewals"]["alert_window_days"] = "90"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("renewals.alert_window_days", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["audit"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("audit", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
