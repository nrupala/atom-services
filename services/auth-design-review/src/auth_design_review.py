#!/usr/bin/env python3
"""Auth design review — deterministic core.

Built from the bound skill `authentication-authorization` (v1):
"Do auth properly — passkeys/MFA, sound sessions and tokens,
least-privilege authorization, lifecycle. Prove identity once,
check permission every time."

This atom is an AUDIT of a declared auth design: it validates the
design record a caller declares against the skill's eight method
steps, its four quality gates, and its red lines. It does not
probe the live system, test a login, or verify that a declared
control actually works — it checks that the record the skill
requires is present and internally complete on the declared
evidence.

The caller submits an auth-design manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Two check groups are conditional, following the skill's own
scoping — computed from the declared gate fields, not merely
declared:

- password checks bind only when passwords are declared in use
  (skill step 1: "passwords (when unavoidable) long not complex,
  hashed with Argon2id (or bcrypt cost-tuned)") — when no
  passwords are declared, each passes as not applicable;
- the five OAuth2/OIDC checks bind only when OAuth/OIDC is
  declared in use (skill step 3) — when it is not declared, each
  passes as not applicable.

The skill states no numeric threshold (no token lifetime, expiry
or rate limit in numbers), so no numeric check is invented.

Verdict:
- any fail             -> AUTH_DESIGN_DEFICIENT
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> AUTH_DESIGN_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import sys

SECTIONS = (
    "human_authentication",
    "sessions",
    "oauth_and_oidc",
    "service_tokens",
    "authorization",
    "lifecycle",
    "anti_abuse_and_audit",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "system": "string",
    "human_auth": {
        "passkeys_preferred": "boolean",
        "mfa_enforced_for_admin": "boolean",
        "mfa_enforced_for_sensitive_ops": "boolean",
        "passwords_used": "boolean",
        "passwords_hashed_strong": "boolean",
        "passwords_long_not_complex": "boolean",
        "shared_accounts_present": "boolean",
    },
    "sessions": {
        "secure_httponly_samesite_cookies": "boolean",
        "rotate_on_login_and_privilege_change": "boolean",
        "expiry_defined": "boolean",
        "server_side_revocation_works": "boolean",
    },
    "oauth": {
        "oauth_used": "boolean",
        "authorization_code_pkce": "boolean",
        "exact_redirect_allowlists": "boolean",
        "iss_aud_exp_validated": "boolean",
        "implicit_flow_used": "boolean",
        "refresh_tokens_rotated": "boolean",
    },
    "service_tokens": {
        "short_lived": "boolean",
        "scoped": "boolean",
        "audience_bound": "boolean",
        "jit_over_long_lived_keys": "boolean",
        "rotation_revocation_tested": "boolean",
        "lifetimes_and_scopes_documented": "boolean",
        "long_lived_unrevocable_credentials_present": "boolean",
    },
    "authorization": {
        "server_side_checks_per_endpoint": "boolean",
        "rbac_coarse": "boolean",
        "abac_fine": "boolean",
        "deny_by_default": "boolean",
        "client_side_only_authorization": "boolean",
        "hand_rolled_crypto_or_protocols": "boolean",
    },
    "lifecycle": {
        "provisioning_reviewed": "boolean",
        "deprovisioning_checklist_exists": "boolean",
        "deprovisioning_exercised": "boolean",
        "access_reviews_scheduled_for_admin": "boolean",
    },
    "anti_abuse": {
        "login_rate_limited": "boolean",
        "token_endpoints_rate_limited": "boolean",
        "lockout_balanced_no_user_dos": "boolean",
        "anomaly_alerting": "boolean",
    },
    "audit": {
        "authn_events_logged": "boolean",
        "authz_denials_logged": "boolean",
        "permission_changes_logged": "boolean",
        "logs_include_actor_and_context": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _gated_false_check(results, section, name, manifest, gate_path,
                       target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is False, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def evaluate(manifest):
    """Return the verdict dict for an auth-design manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: human_authentication (skill method step 1:
    #      humans strong first — passkeys/WebAuthn preferred; MFA
    #      enforced for admin and sensitive ops; passwords when
    #      unavoidable long not complex, hashed Argon2id/bcrypt;
    #      quality gate: "Admin surfaces require MFA/passkey; no
    #      shared accounts") ----
    _bool_check(results, "human_authentication",
                "passkeys_preferred", manifest,
                ("human_auth", "passkeys_preferred"),
                "method 1: passkeys / WebAuthn are the preferred "
                "human authenticator — strong first")
    _bool_check(results, "human_authentication",
                "mfa_enforced_for_admin", manifest,
                ("human_auth", "mfa_enforced_for_admin"),
                "method 1 / quality gate: MFA or passkey is "
                "enforced for admin surfaces")
    _bool_check(results, "human_authentication",
                "mfa_enforced_for_sensitive_ops", manifest,
                ("human_auth", "mfa_enforced_for_sensitive_ops"),
                "method 1: MFA is enforced for sensitive operations")
    _gated_bool_check(
        results, "human_authentication",
        "passwords_hashed_strong_when_used", manifest,
        ("human_auth", "passwords_used"),
        ("human_auth", "passwords_hashed_strong"),
        "method 1: passwords in use are hashed with Argon2id "
        "(or bcrypt, cost-tuned)",
        "no passwords declared in use")
    _gated_bool_check(
        results, "human_authentication",
        "passwords_long_not_complex_when_used", manifest,
        ("human_auth", "passwords_used"),
        ("human_auth", "passwords_long_not_complex"),
        "method 1: passwords in use are long, not complex",
        "no passwords declared in use")
    _false_check(results, "human_authentication",
                 "no_shared_accounts", manifest,
                 ("human_auth", "shared_accounts_present"),
                 "quality gate: no shared accounts")

    # ---- Section 2: sessions (skill method step 2) ----
    _bool_check(results, "sessions",
                "secure_httponly_samesite_cookies", manifest,
                ("sessions", "secure_httponly_samesite_cookies"),
                "method 2: session cookies are Secure, HttpOnly "
                "and SameSite")
    _bool_check(results, "sessions",
                "sessions_rotate_on_privilege_change", manifest,
                ("sessions", "rotate_on_login_and_privilege_change"),
                "method 2: sessions rotate on login and on "
                "privilege change")
    _bool_check(results, "sessions", "session_expiry_defined",
                manifest, ("sessions", "expiry_defined"),
                "method 2: sessions expire sensibly — an expiry "
                "is defined")
    _bool_check(results, "sessions",
                "server_side_revocation_works", manifest,
                ("sessions", "server_side_revocation_works"),
                "method 2: the server-side revocation list works")

    # ---- Section 3: oauth_and_oidc (skill method step 3, gated
    #      on OAuth/OIDC being in use) ----
    _gated_bool_check(
        results, "oauth_and_oidc", "authorization_code_with_pkce",
        manifest, ("oauth", "oauth_used"),
        ("oauth", "authorization_code_pkce"),
        "method 3: the authorization code flow with PKCE is used",
        "no OAuth/OIDC declared in use")
    _gated_bool_check(
        results, "oauth_and_oidc", "exact_redirect_allowlists",
        manifest, ("oauth", "oauth_used"),
        ("oauth", "exact_redirect_allowlists"),
        "method 3: redirect URIs are held to exact allowlists",
        "no OAuth/OIDC declared in use")
    _gated_bool_check(
        results, "oauth_and_oidc", "iss_aud_exp_validated",
        manifest, ("oauth", "oauth_used"),
        ("oauth", "iss_aud_exp_validated"),
        "method 3: iss, aud and exp claims are validated",
        "no OAuth/OIDC declared in use")
    _gated_false_check(
        results, "oauth_and_oidc", "implicit_flow_not_used",
        manifest, ("oauth", "oauth_used"),
        ("oauth", "implicit_flow_used"),
        "method 3: no implicit flow",
        "no OAuth/OIDC declared in use")
    _gated_bool_check(
        results, "oauth_and_oidc", "refresh_tokens_rotated",
        manifest, ("oauth", "oauth_used"),
        ("oauth", "refresh_tokens_rotated"),
        "method 3: refresh tokens are rotated — sender-"
        "constrained where possible",
        "no OAuth/OIDC declared in use")

    # ---- Section 4: service_tokens (skill method step 4 +
    #      quality gate: "Token lifetimes + scopes documented;
    #      revocation tested"; red line: "no long-lived
    #      unrevocable credentials") ----
    _bool_check(results, "service_tokens", "tokens_short_lived",
                manifest, ("service_tokens", "short_lived"),
                "method 4: service tokens are short-lived")
    _bool_check(results, "service_tokens", "tokens_scoped",
                manifest, ("service_tokens", "scoped"),
                "method 4: service tokens are scoped")
    _bool_check(results, "service_tokens", "tokens_audience_bound",
                manifest, ("service_tokens", "audience_bound"),
                "method 4: service tokens are audience-bound")
    _bool_check(results, "service_tokens",
                "jit_issuance_over_long_lived_keys", manifest,
                ("service_tokens", "jit_over_long_lived_keys"),
                "method 4: just-in-time issuance is preferred "
                "over long-lived keys")
    _bool_check(results, "service_tokens",
                "rotation_revocation_tested", manifest,
                ("service_tokens", "rotation_revocation_tested"),
                "method 4 / quality gate: rotate and revoke paths "
                "are tested — revocation tested")
    _bool_check(results, "service_tokens",
                "lifetimes_and_scopes_documented", manifest,
                ("service_tokens", "lifetimes_and_scopes_documented"),
                "quality gate: token lifetimes and scopes are "
                "documented")
    _false_check(results, "service_tokens",
                 "no_long_lived_unrevocable_credentials", manifest,
                 ("service_tokens",
                  "long_lived_unrevocable_credentials_present"),
                 "red line: no long-lived unrevocable credentials")

    # ---- Section 5: authorization (skill method step 5 +
    #      quality gate: "Every endpoint performs a server-side
    #      authorization check"; red lines: "no client-side-only
    #      authorization; no hand-rolled crypto or auth
    #      protocols") ----
    _bool_check(results, "authorization",
                "server_side_checks_per_endpoint", manifest,
                ("authorization", "server_side_checks_per_endpoint"),
                "method 5 / quality gate: authorization is "
                "server-side, always — every endpoint performs a "
                "server-side permission check")
    _bool_check(results, "authorization", "rbac_for_coarse",
                manifest, ("authorization", "rbac_coarse"),
                "method 5: RBAC roles cover coarse-grained "
                "authorization")
    _bool_check(results, "authorization", "abac_for_fine",
                manifest, ("authorization", "abac_fine"),
                "method 5: ABAC / policies (OPA-style) cover "
                "fine-grained authorization")
    _bool_check(results, "authorization", "deny_by_default",
                manifest, ("authorization", "deny_by_default"),
                "method 5: deny by default — never trust the UI")
    _false_check(results, "authorization",
                 "no_client_side_only_authorization", manifest,
                 ("authorization", "client_side_only_authorization"),
                 "red line: no client-side-only authorization")
    _false_check(results, "authorization",
                 "no_hand_rolled_crypto_or_protocols", manifest,
                 ("authorization", "hand_rolled_crypto_or_protocols"),
                 "red line: no hand-rolled crypto or auth protocols")

    # ---- Section 6: lifecycle (skill method step 6 + quality
    #      gate: "Deprovisioning runbook exists and was exercised
    #      once") ----
    _bool_check(results, "lifecycle", "provisioning_reviewed",
                manifest, ("lifecycle", "provisioning_reviewed"),
                "method 6: provisioning is reviewed")
    _bool_check(results, "lifecycle",
                "deprovisioning_checklist_exists", manifest,
                ("lifecycle", "deprovisioning_checklist_exists"),
                "method 6 / quality gate: deprovisioning is a "
                "checklist — tokens revoked, keys rotated — and "
                "the runbook exists")
    _bool_check(results, "lifecycle", "deprovisioning_exercised",
                manifest, ("lifecycle", "deprovisioning_exercised"),
                "quality gate: the deprovisioning runbook was "
                "exercised once")
    _bool_check(results, "lifecycle",
                "access_reviews_scheduled_for_admin", manifest,
                ("lifecycle", "access_reviews_scheduled_for_admin"),
                "method 6: access reviews run on schedule for "
                "admin surfaces")

    # ---- Section 7: anti_abuse_and_audit (skill method steps
    #      7-8) ----
    _bool_check(results, "anti_abuse_and_audit",
                "login_endpoints_rate_limited", manifest,
                ("anti_abuse", "login_rate_limited"),
                "method 7: login endpoints are rate-limited")
    _bool_check(results, "anti_abuse_and_audit",
                "token_endpoints_rate_limited", manifest,
                ("anti_abuse", "token_endpoints_rate_limited"),
                "method 7: token endpoints are rate-limited")
    _bool_check(results, "anti_abuse_and_audit",
                "lockout_balanced_no_user_dos", manifest,
                ("anti_abuse", "lockout_balanced_no_user_dos"),
                "method 7: lockout policies are balanced — no "
                "user-lockout denial of service")
    _bool_check(results, "anti_abuse_and_audit",
                "anomaly_alerting", manifest,
                ("anti_abuse", "anomaly_alerting"),
                "method 7: anomalies alert — new geography, "
                "spikes")
    _bool_check(results, "anti_abuse_and_audit",
                "authn_events_logged", manifest,
                ("audit", "authn_events_logged"),
                "method 8: authentication events — success and "
                "failure — are logged")
    _bool_check(results, "anti_abuse_and_audit",
                "authz_denials_logged", manifest,
                ("audit", "authz_denials_logged"),
                "method 8: authorization denials are logged")
    _bool_check(results, "anti_abuse_and_audit",
                "permission_changes_logged", manifest,
                ("audit", "permission_changes_logged"),
                "method 8: permission changes are logged")
    _bool_check(results, "anti_abuse_and_audit",
                "logs_include_actor_and_context", manifest,
                ("audit", "logs_include_actor_and_context"),
                "method 8: auth logs carry actor and context")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "AUTH_DESIGN_DEFICIENT"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "AUTH_DESIGN_SOUND"

    return {
        "service": "auth-design-review",
        "atom_version": "0.1.0",
        "system": manifest.get("system"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "AUTH DESIGN REVIEW",
        f"system: {verdict.get('system')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<28} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: auth_design_review.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "AUTH_DESIGN_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
