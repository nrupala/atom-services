import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from auth_design_review import evaluate, stamp  # noqa: E402

COMPLETE = {
    "system": "customer-portal",
    "human_auth": {"passkeys_preferred": True,
                   "mfa_enforced_for_admin": True,
                   "mfa_enforced_for_sensitive_ops": True,
                   "passwords_used": True,
                   "passwords_hashed_strong": True,
                   "passwords_long_not_complex": True,
                   "shared_accounts_present": False},
    "sessions": {"secure_httponly_samesite_cookies": True,
                 "rotate_on_login_and_privilege_change": True,
                 "expiry_defined": True,
                 "server_side_revocation_works": True},
    "oauth": {"oauth_used": True,
              "authorization_code_pkce": True,
              "exact_redirect_allowlists": True,
              "iss_aud_exp_validated": True,
              "implicit_flow_used": False,
              "refresh_tokens_rotated": True},
    "service_tokens": {"short_lived": True,
                       "scoped": True,
                       "audience_bound": True,
                       "jit_over_long_lived_keys": True,
                       "rotation_revocation_tested": True,
                       "lifetimes_and_scopes_documented": True,
                       "long_lived_unrevocable_credentials_present": False},
    "authorization": {"server_side_checks_per_endpoint": True,
                      "rbac_coarse": True,
                      "abac_fine": True,
                      "deny_by_default": True,
                      "client_side_only_authorization": False,
                      "hand_rolled_crypto_or_protocols": False},
    "lifecycle": {"provisioning_reviewed": True,
                  "deprovisioning_checklist_exists": True,
                  "deprovisioning_exercised": True,
                  "access_reviews_scheduled_for_admin": True},
    "anti_abuse": {"login_rate_limited": True,
                   "token_endpoints_rate_limited": True,
                   "lockout_balanced_no_user_dos": True,
                   "anomaly_alerting": True},
    "audit": {"authn_events_logged": True,
              "authz_denials_logged": True,
              "permission_changes_logged": True,
              "logs_include_actor_and_context": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "AUTH_DESIGN_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 40)

    def test_no_mfa_for_admin_fails_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["human_auth"]["mfa_enforced_for_admin"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUTH_DESIGN_DEFICIENT")
        self.assertEqual(v["sections"]["human_authentication"], "fail")

    def test_shared_accounts_fail_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["human_auth"]["shared_accounts_present"] = True
        self.assertEqual(evaluate(m)["verdict"], "AUTH_DESIGN_DEFICIENT")

    def test_passwords_weakly_hashed_fail_when_used(self):
        m = copy.deepcopy(COMPLETE)
        m["human_auth"]["passwords_hashed_strong"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUTH_DESIGN_DEFICIENT")
        self.assertEqual(
            check_status(v, "passwords_hashed_strong_when_used"),
            "fail")

    def test_no_passwords_passes_password_checks_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["human_auth"]["passwords_used"] = False
        del m["human_auth"]["passwords_hashed_strong"]
        del m["human_auth"]["passwords_long_not_complex"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUTH_DESIGN_SOUND")
        self.assertEqual(
            check_status(v, "passwords_hashed_strong_when_used"),
            "pass")

    def test_password_check_missing_when_passwords_used(self):
        m = copy.deepcopy(COMPLETE)
        del m["human_auth"]["passwords_long_not_complex"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "passwords_long_not_complex_when_used"),
            "missing")

    def test_sessions_not_rotated_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["sessions"]["rotate_on_login_and_privilege_change"] = False
        self.assertEqual(evaluate(m)["verdict"], "AUTH_DESIGN_DEFICIENT")

    def test_revocation_not_working_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sessions"]["server_side_revocation_works"] = False
        self.assertEqual(evaluate(m)["verdict"], "AUTH_DESIGN_DEFICIENT")

    def test_implicit_flow_fails_when_oauth_used(self):
        m = copy.deepcopy(COMPLETE)
        m["oauth"]["implicit_flow_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUTH_DESIGN_DEFICIENT")
        self.assertEqual(v["sections"]["oauth_and_oidc"], "fail")
        self.assertEqual(check_status(v, "implicit_flow_not_used"),
                         "fail")

    def test_no_pkce_fails_when_oauth_used(self):
        m = copy.deepcopy(COMPLETE)
        m["oauth"]["authorization_code_pkce"] = False
        self.assertEqual(evaluate(m)["verdict"], "AUTH_DESIGN_DEFICIENT")

    def test_no_oauth_passes_oauth_checks_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["oauth"]["oauth_used"] = False
        for field in ("authorization_code_pkce",
                      "exact_redirect_allowlists",
                      "iss_aud_exp_validated", "implicit_flow_used",
                      "refresh_tokens_rotated"):
            del m["oauth"][field]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUTH_DESIGN_SOUND")
        self.assertEqual(
            check_status(v, "authorization_code_with_pkce"), "pass")

    def test_long_lived_unrevocable_credentials_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["service_tokens"][
            "long_lived_unrevocable_credentials_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUTH_DESIGN_DEFICIENT")
        self.assertEqual(v["sections"]["service_tokens"], "fail")

    def test_revocation_untested_fails_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["service_tokens"]["rotation_revocation_tested"] = False
        self.assertEqual(evaluate(m)["verdict"], "AUTH_DESIGN_DEFICIENT")

    def test_endpoint_without_server_side_check_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["authorization"]["server_side_checks_per_endpoint"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUTH_DESIGN_DEFICIENT")
        self.assertEqual(v["sections"]["authorization"], "fail")

    def test_client_side_only_authorization_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["authorization"]["client_side_only_authorization"] = True
        self.assertEqual(evaluate(m)["verdict"], "AUTH_DESIGN_DEFICIENT")

    def test_hand_rolled_crypto_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["authorization"]["hand_rolled_crypto_or_protocols"] = True
        self.assertEqual(evaluate(m)["verdict"], "AUTH_DESIGN_DEFICIENT")

    def test_allow_by_default_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["authorization"]["deny_by_default"] = False
        self.assertEqual(evaluate(m)["verdict"], "AUTH_DESIGN_DEFICIENT")

    def test_deprovisioning_never_exercised_fails_quality_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["lifecycle"]["deprovisioning_exercised"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "AUTH_DESIGN_DEFICIENT")
        self.assertEqual(v["sections"]["lifecycle"], "fail")

    def test_login_not_rate_limited_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["anti_abuse"]["login_rate_limited"] = False
        self.assertEqual(evaluate(m)["verdict"], "AUTH_DESIGN_DEFICIENT")

    def test_authz_denials_not_logged_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["audit"]["authz_denials_logged"] = False
        self.assertEqual(evaluate(m)["verdict"], "AUTH_DESIGN_DEFICIENT")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["sessions"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["sessions"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: AUTH_DESIGN_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["system"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("system", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"sessions": "should-be-an-object"})
        self.assertIn("sessions", str(ctx.exception))

    def test_section_as_list_rejected(self):
        # This atom declares no list fields (the skill names no
        # caller-supplied list); the nearest list-typed corruption
        # — a list where an object section belongs — is rejected
        # naming the section.
        with self.assertRaises(ValueError) as ctx:
            evaluate({"oauth": ["not", "an", "object"]})
        self.assertIn("oauth", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["human_auth"]["mfa_enforced_for_admin"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("human_auth.mfa_enforced_for_admin",
                      str(ctx.exception))

    def test_boolean_leaf_as_number_rejected(self):
        # This atom declares no numeric fields (the skill states
        # no number — no lifetime, expiry or rate limit value);
        # a numeric value in a boolean leaf is rejected as
        # not-a-boolean, naming the leaf.
        m = copy.deepcopy(COMPLETE)
        m["sessions"]["expiry_defined"] = 30
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("sessions.expiry_defined", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["audit"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("audit", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
