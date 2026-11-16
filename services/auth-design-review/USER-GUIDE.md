# Auth design review — user guide
Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are reviewing an authentication and authorization design. This
atom reads a declared auth design record for one system — human
authentication, sessions, OAuth/OIDC, service tokens,
authorization, lifecycle, anti-abuse and audit — and returns one
deterministic verdict across seven sections: **AUTH_DESIGN_SOUND**,
**AUTH_DESIGN_DEFICIENT**, or **INSUFFICIENT_EVIDENCE** (nothing
failed, but evidence is missing — the verdict names exactly which).
Two check groups are conditional: the password rules apply only
when passwords are declared in use, and the five OAuth/OIDC rules
only when OAuth is declared in use; otherwise those checks pass as
not applicable. No numeric thresholds are invented — lifetimes,
expiries and limits are checked only for being defined/documented.
Same manifest in → same verdict out. It audits the declared record;
it is not a penetration test or a security certification.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "auth-design-review"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/auth-design-review`
  — tool name `auth_design_review`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/auth-design-review`
  — body = the manifest object; same `Authorization` header.

## Input — the auth-design manifest

| Field | Meaning |
|---|---|
| `system` | system name (string; carried into the output, not checked) |
| `human_auth.passkeys_preferred` / `mfa_enforced_for_admin` / `mfa_enforced_for_sensitive_ops` | human authentication evidence |
| `human_auth.passwords_used` | gates the two password checks below |
| `human_auth.passwords_hashed_strong` / `passwords_long_not_complex` | required when passwords are used; otherwise each passes as not applicable |
| `human_auth.shared_accounts_present` | must be `false` to pass |
| `sessions.secure_httponly_samesite_cookies` / `rotate_on_login_and_privilege_change` / `expiry_defined` / `server_side_revocation_works` | session evidence |
| `oauth.oauth_used` | gates the five OAuth checks below |
| `oauth.authorization_code_pkce` / `exact_redirect_allowlists` / `iss_aud_exp_validated` / `refresh_tokens_rotated` | required when OAuth is used; otherwise not applicable |
| `oauth.implicit_flow_used` | must be `false` when OAuth is used; otherwise not applicable |
| `service_tokens.short_lived` / `scoped` / `audience_bound` / `jit_over_long_lived_keys` / `rotation_revocation_tested` / `lifetimes_and_scopes_documented` | service-token evidence |
| `service_tokens.long_lived_unrevocable_credentials_present` | must be `false` to pass (red line) |
| `authorization.server_side_checks_per_endpoint` / `rbac_coarse` / `abac_fine` / `deny_by_default` | authorization evidence |
| `authorization.client_side_only_authorization` / `hand_rolled_crypto_or_protocols` | both must be `false` to pass (red lines) |
| `lifecycle.provisioning_reviewed` / `deprovisioning_checklist_exists` / `deprovisioning_exercised` / `access_reviews_scheduled_for_admin` | lifecycle evidence |
| `anti_abuse.login_rate_limited` / `token_endpoints_rate_limited` / `lockout_balanced_no_user_dos` / `anomaly_alerting` | anti-abuse evidence |
| `audit.authn_events_logged` / `authz_denials_logged` / `permission_changes_logged` / `logs_include_actor_and_context` | audit evidence |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false = the check
fails (counts toward AUTH_DESIGN_DEFICIENT).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/auth-design-review`:

```json
{
  "system": "secure-auth-service",
  "human_auth": {
    "passkeys_preferred": true,
    "mfa_enforced_for_admin": true,
    "mfa_enforced_for_sensitive_ops": true,
    "passwords_used": false,
    "shared_accounts_present": false
  },
  "sessions": {
    "secure_httponly_samesite_cookies": true,
    "rotate_on_login_and_privilege_change": true,
    "expiry_defined": true,
    "server_side_revocation_works": true
  },
  "oauth": {
    "oauth_used": false
  },
  "service_tokens": {
    "short_lived": true,
    "scoped": true,
    "audience_bound": true,
    "jit_over_long_lived_keys": true,
    "rotation_revocation_tested": true,
    "lifetimes_and_scopes_documented": true,
    "long_lived_unrevocable_credentials_present": false
  },
  "authorization": {
    "server_side_checks_per_endpoint": true,
    "rbac_coarse": true,
    "abac_fine": true,
    "deny_by_default": true,
    "client_side_only_authorization": false,
    "hand_rolled_crypto_or_protocols": false
  },
  "lifecycle": {
    "provisioning_reviewed": true,
    "deprovisioning_checklist_exists": true,
    "deprovisioning_exercised": true,
    "access_reviews_scheduled_for_admin": true
  },
  "anti_abuse": {
    "login_rate_limited": true,
    "token_endpoints_rate_limited": true,
    "lockout_balanced_no_user_dos": true,
    "anomaly_alerting": true
  },
  "audit": {
    "authn_events_logged": true,
    "authz_denials_logged": true,
    "permission_changes_logged": true,
    "logs_include_actor_and_context": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 40 checks
and a text stamp of the verdict):

```json
{
  "service": "auth-design-review",
  "atom_version": "0.1.0",
  "system": "secure-auth-service",
  "verdict": "AUTH_DESIGN_SOUND",
  "sections": {
    "human_authentication": "pass",
    "sessions": "pass",
    "oauth_and_oidc": "pass",
    "service_tokens": "pass",
    "authorization": "pass",
    "lifecycle": "pass",
    "anti_abuse_and_audit": "pass"
  },
  "summary": "40 pass, 0 fail, 0 missing of 40 checks across seven sections."
}
```

## Verdicts

- **AUTH_DESIGN_SOUND** — every check passes; the design is sound on the declared evidence.
- **AUTH_DESIGN_DEFICIENT** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
