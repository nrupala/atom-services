# Auth design review — `auth-design-review`

**Auth design review** · slug `auth-design-review` · deliverable type REVIEW · atom version 0.1.0 · status live — release candidate (one-week RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md)

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (Worked example 1 below reproduces it verbatim); every value named here is from that recording.

1. **Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a key for this atom: `POST /v1/keys` with `{"atom": "auth-design-review"}`. Send the key as `Authorization: Bearer <key>` on every call.
2. **Assemble the manifest.** The manifest is one JSON object: a declared record for one system. In the recorded run the system is `secure-auth-service` — an auth design record for one system — human authentication (passkeys preferred, MFA enforced; no passwords and no OAuth declared in this run, so the conditional password and OAuth checks pass as not applicable), sessions, service tokens, authorization, lifecycle, anti-abuse and audit logging. Build yours field by field from the Input reference below; leave a field out only if you want it reported as missing evidence.
3. **Call the atom.** `POST https://atoms.pipavia.com/v1/auth-design-review` with the manifest as the body and the `Authorization` header set (see How-to guides for the MCP form of the same call).
4. **Read the verdict.** The recorded run returned HTTP 200 with verdict `AUTH_DESIGN_SOUND`: 40 pass, 0 fail, 0 missing of 40 checks across seven sections. Every section status is `pass` and every check status is `pass`.
5. **Use the detail.** The `checks` array names each of the 40 checks with its section and the evidence it read; `summary` counts pass / fail / missing; `stamp` is the same verdict as a plain-text stamp you can paste into a record. If any check had failed or been missing, the verdict, the section statuses and the check statuses would name exactly which — that is the subject of the third how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "auth-design-review"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. Call: `POST https://atoms.pipavia.com/v1/auth-design-review` — body = the manifest object (see Input reference). The response is the verdict object (see Output format).

### Call via MCP

Connect your MCP client to `POST https://atoms.pipavia.com/mcp/auth-design-review` with the same `Authorization: Bearer <key>` header, and call the tool `auth_design_review`. The `tools/call` arguments are the manifest object itself — the same JSON you would send as the REST body. The MCP result's structured content is the same verdict object the REST face returns (external verification confirmed MCP/REST parity on the full-pass case; see TEST-REPORT.md).

### Read a failing verdict and fix the manifest

A verdict other than `AUTH_DESIGN_SOUND` is not an error — it is the deliverable doing its job. Read it in this order:

1. **Verdict.** `AUTH_DESIGN_DEFICIENT` — At least one check fails; the failing checks name the breached section and the evidence against it. `INSUFFICIENT_EVIDENCE` means nothing failed but evidence is missing.
2. **Sections.** The `sections` object gives one status per section: `pass`, `fail`, or `insufficient_evidence`. Start with the sections that are not `pass`.
3. **Checks.** In the `checks` array, find entries with status `fail` (a field was present but did not meet the requirement — for a must-be-`false` field, it was declared `true`; for a computed check, the declared values did not satisfy the computed rule) and entries with status `missing` (the supporting field was absent from the manifest). Each check's `evidence` string states what the check requires.
4. **Fix the manifest, not the verdict.** For a `fail`, correct the declared value in the underlying record, then redeclare it truthfully. For a `missing`, supply the absent field. Then resubmit the whole manifest — the atom is stateless and deterministic, so the same manifest always returns the same verdict.
Worked example 2 below is a real failing run of this atom: verdict `AUTH_DESIGN_DEFICIENT`, 37 pass, 3 fail, 0 missing of 40 checks across seven sections. The failing checks are: `no_shared_accounts`, `no_long_lived_unrevocable_credentials`, `no_client_side_only_authorization`.

### Handle a 422 invalid_input

A type error is rejected before any check runs — you get HTTP 422, never a verdict. The recorded malformed run for this atom (Worked example 3) returned:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "human_auth",
  "detail": "human_auth must be an object"
}
```

`field` names the offending field (`human_auth`) and `detail` states the expected type ("human_auth must be an object"). Fix that field's type in the manifest — consult the Input reference for each field's type — and resubmit. Do not drop the field to silence the 422 unless you intend it to be reported as missing evidence instead.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/auth-design-review` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/auth-design-review` — tool name `auth_design_review`; `tools/call` arguments = the manifest object.
- **Keys:** sign up via `POST /v1/signup`, then `POST /v1/keys` with `{"atom": "auth-design-review"}`. Key scope: this atom only — a key's scope for one atom never verifies for another (per `contract.yaml`, keys are per user, per atom; the key itself is regenerated on demand after authentication and never stored).

### Input reference

The manifest is one JSON object with 43 fields. All fields are booleans unless a different type is stated in the Type column. A field **absent** = evidence missing (counts toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails. Fields are grouped below exactly as SERVICE.md groups them (by the section that reads them).

#### Top level

| Field | Type | Notes |
|---|---|---|
| `system` | string | string; carried into the verdict output, not itself checked |

#### `human_authentication`

| Field | Type | Notes |
|---|---|---|
| `human_auth.passkeys_preferred` | boolean | — |
| `human_auth.mfa_enforced_for_admin` | boolean | — |
| `human_auth.mfa_enforced_for_sensitive_ops` | boolean | — |
| `human_auth.passwords_used` | boolean | gates the two password checks below |
| `human_auth.passwords_hashed_strong` | boolean | required when passwords are used; otherwise the check passes as not applicable |
| `human_auth.passwords_long_not_complex` | boolean | required when passwords are used; otherwise not applicable |
| `human_auth.shared_accounts_present` | boolean | must be `false` to pass — skill quality gate |

#### `sessions`

| Field | Type | Notes |
|---|---|---|
| `sessions.secure_httponly_samesite_cookies` | boolean | — |
| `sessions.rotate_on_login_and_privilege_change` | boolean | — |
| `sessions.expiry_defined` | boolean | — |
| `sessions.server_side_revocation_works` | boolean | — |

#### `oauth_and_oidc`

| Field | Type | Notes |
|---|---|---|
| `oauth.oauth_used` | boolean | gates the five OAuth checks below |
| `oauth.authorization_code_pkce` | boolean | required when OAuth is used; otherwise not applicable |
| `oauth.exact_redirect_allowlists` | boolean | required when OAuth is used; otherwise not applicable |
| `oauth.iss_aud_exp_validated` | boolean | required when OAuth is used; otherwise not applicable |
| `oauth.implicit_flow_used` | boolean | must be `false` when OAuth is used — skill method; otherwise not applicable |
| `oauth.refresh_tokens_rotated` | boolean | required when OAuth is used; otherwise not applicable |

#### `service_tokens`

| Field | Type | Notes |
|---|---|---|
| `service_tokens.short_lived` | boolean | — |
| `service_tokens.scoped` | boolean | — |
| `service_tokens.audience_bound` | boolean | — |
| `service_tokens.jit_over_long_lived_keys` | boolean | — |
| `service_tokens.rotation_revocation_tested` | boolean | — |
| `service_tokens.lifetimes_and_scopes_documented` | boolean | — |
| `service_tokens.long_lived_unrevocable_credentials_present` | boolean | must be `false` to pass — skill red line |

#### `authorization`

| Field | Type | Notes |
|---|---|---|
| `authorization.server_side_checks_per_endpoint` | boolean | — |
| `authorization.rbac_coarse` | boolean | — |
| `authorization.abac_fine` | boolean | — |
| `authorization.deny_by_default` | boolean | — |
| `authorization.client_side_only_authorization` | boolean | must be `false` to pass — skill red line |
| `authorization.hand_rolled_crypto_or_protocols` | boolean | must be `false` to pass — skill red line |

#### `lifecycle`

| Field | Type | Notes |
|---|---|---|
| `lifecycle.provisioning_reviewed` | boolean | — |
| `lifecycle.deprovisioning_checklist_exists` | boolean | — |
| `lifecycle.deprovisioning_exercised` | boolean | — |
| `lifecycle.access_reviews_scheduled_for_admin` | boolean | — |

#### `anti_abuse_and_audit`

| Field | Type | Notes |
|---|---|---|
| `anti_abuse.login_rate_limited` | boolean | — |
| `anti_abuse.token_endpoints_rate_limited` | boolean | — |
| `anti_abuse.lockout_balanced_no_user_dos` | boolean | — |
| `anti_abuse.anomaly_alerting` | boolean | — |
| `audit.authn_events_logged` | boolean | — |
| `audit.authz_denials_logged` | boolean | — |
| `audit.permission_changes_logged` | boolean | — |
| `audit.logs_include_actor_and_context` | boolean | — |

### Checks

The recorded full-pass response carries 40 checks across 7 sections (`human_authentication`, `sessions`, `oauth_and_oidc`, `service_tokens`, `authorization`, `lifecycle`, `anti_abuse_and_audit`). Every check is listed below with the requirement stated in its recorded `evidence` string. General semantics: a check's status is `pass` when its requirement is met on the declared values, `fail` when the supporting field is present but the requirement is not met, and `missing` when the supporting field is absent. A section's status is `pass` when all its checks pass, `fail` when any check fails, and `insufficient_evidence` when no check fails but at least one is missing.

Two check groups are conditional, following the skill's own scoping. **Password checks** (`passwords_hashed_strong_when_used`, `passwords_long_not_complex_when_used`): required only when `human_auth.passwords_used` is declared `true`; when no passwords are declared, each passes as not applicable (recorded status `pass`). **OAuth/OIDC checks** (`authorization_code_with_pkce`, `exact_redirect_allowlists`, `iss_aud_exp_validated`, `implicit_flow_not_used`, `refresh_tokens_rotated`): required only when `oauth.oauth_used` is declared `true`; when OAuth is not declared in use, each passes as not applicable (recorded status `pass`). When a gate is on, an absent required field is `missing` and a present-but-`false` field is `fail` (for `implicit_flow_not_used`, present-but-`true` is `fail`).

| Section | Check | What passing requires (recorded evidence) | Pass / fail / missing semantics |
|---|---|---|---|
| `human_authentication` | `passkeys_preferred` | method 1: passkeys / WebAuthn are the preferred human authenticator — strong first | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `human_authentication` | `mfa_enforced_for_admin` | method 1 / quality gate: MFA or passkey is enforced for admin surfaces | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `human_authentication` | `mfa_enforced_for_sensitive_ops` | method 1: MFA is enforced for sensitive operations | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `human_authentication` | `passwords_hashed_strong_when_used` | no passwords declared in use | Conditional: required when passwords are used (`true` → `pass`, `false` → `fail`, absent → `missing`); passwords not used → `pass` (not applicable) |
| `human_authentication` | `passwords_long_not_complex_when_used` | no passwords declared in use | Conditional: required when passwords are used (`true` → `pass`, `false` → `fail`, absent → `missing`); passwords not used → `pass` (not applicable) |
| `human_authentication` | `no_shared_accounts` | quality gate: no shared accounts | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `sessions` | `secure_httponly_samesite_cookies` | method 2: session cookies are Secure, HttpOnly and SameSite | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `sessions` | `sessions_rotate_on_privilege_change` | method 2: sessions rotate on login and on privilege change | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `sessions` | `session_expiry_defined` | method 2: sessions expire sensibly — an expiry is defined | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `sessions` | `server_side_revocation_works` | method 2: the server-side revocation list works | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `oauth_and_oidc` | `authorization_code_with_pkce` | no OAuth/OIDC declared in use | Conditional: required when OAuth is used (`true` → `pass`, `false` → `fail`, absent → `missing`); OAuth not used → `pass` (not applicable) |
| `oauth_and_oidc` | `exact_redirect_allowlists` | no OAuth/OIDC declared in use | Conditional: required when OAuth is used (`true` → `pass`, `false` → `fail`, absent → `missing`); OAuth not used → `pass` (not applicable) |
| `oauth_and_oidc` | `iss_aud_exp_validated` | no OAuth/OIDC declared in use | Conditional: required when OAuth is used (`true` → `pass`, `false` → `fail`, absent → `missing`); OAuth not used → `pass` (not applicable) |
| `oauth_and_oidc` | `implicit_flow_not_used` | no OAuth/OIDC declared in use | Conditional: when OAuth is used, `implicit_flow_used: false` → `pass`, `true` → `fail`, absent → `missing`; OAuth not used → `pass` (not applicable) |
| `oauth_and_oidc` | `refresh_tokens_rotated` | no OAuth/OIDC declared in use | Conditional: required when OAuth is used (`true` → `pass`, `false` → `fail`, absent → `missing`); OAuth not used → `pass` (not applicable) |
| `service_tokens` | `tokens_short_lived` | method 4: service tokens are short-lived | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `service_tokens` | `tokens_scoped` | method 4: service tokens are scoped | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `service_tokens` | `tokens_audience_bound` | method 4: service tokens are audience-bound | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `service_tokens` | `jit_issuance_over_long_lived_keys` | method 4: just-in-time issuance is preferred over long-lived keys | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `service_tokens` | `rotation_revocation_tested` | method 4 / quality gate: rotate and revoke paths are tested — revocation tested | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `service_tokens` | `lifetimes_and_scopes_documented` | quality gate: token lifetimes and scopes are documented | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `service_tokens` | `no_long_lived_unrevocable_credentials` | red line: no long-lived unrevocable credentials | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `authorization` | `server_side_checks_per_endpoint` | method 5 / quality gate: authorization is server-side, always — every endpoint performs a server-side permission check | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `authorization` | `rbac_for_coarse` | method 5: RBAC roles cover coarse-grained authorization | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `authorization` | `abac_for_fine` | method 5: ABAC / policies (OPA-style) cover fine-grained authorization | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `authorization` | `deny_by_default` | method 5: deny by default — never trust the UI | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `authorization` | `no_client_side_only_authorization` | red line: no client-side-only authorization | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `authorization` | `no_hand_rolled_crypto_or_protocols` | red line: no hand-rolled crypto or auth protocols | `false` → `pass`; `true` → `fail`; absent → `missing` |
| `lifecycle` | `provisioning_reviewed` | method 6: provisioning is reviewed | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `lifecycle` | `deprovisioning_checklist_exists` | method 6 / quality gate: deprovisioning is a checklist — tokens revoked, keys rotated — and the runbook exists | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `lifecycle` | `deprovisioning_exercised` | quality gate: the deprovisioning runbook was exercised once | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `lifecycle` | `access_reviews_scheduled_for_admin` | method 6: access reviews run on schedule for admin surfaces | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `anti_abuse_and_audit` | `login_endpoints_rate_limited` | method 7: login endpoints are rate-limited | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `anti_abuse_and_audit` | `token_endpoints_rate_limited` | method 7: token endpoints are rate-limited | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `anti_abuse_and_audit` | `lockout_balanced_no_user_dos` | method 7: lockout policies are balanced — no user-lockout denial of service | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `anti_abuse_and_audit` | `anomaly_alerting` | method 7: anomalies alert — new geography, spikes | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `anti_abuse_and_audit` | `authn_events_logged` | method 8: authentication events — success and failure — are logged | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `anti_abuse_and_audit` | `authz_denials_logged` | method 8: authorization denials are logged | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `anti_abuse_and_audit` | `permission_changes_logged` | method 8: permission changes are logged | `true` → `pass`; `false` → `fail`; absent → `missing` |
| `anti_abuse_and_audit` | `logs_include_actor_and_context` | method 8: auth logs carry actor and context | `true` → `pass`; `false` → `fail`; absent → `missing` |

### Output format

A successful call (HTTP 200) returns one JSON object:

| Field | Meaning |
|---|---|
| `service` | Always `"auth-design-review"` |
| `atom_version` | Atom version that produced the verdict (`"0.1.0"`) |
| `system` | The declared system, carried through from the manifest (not itself checked) |
| `verdict` | One of the verdict values below |
| `sections` | Object mapping each section name to its section status (`pass` / `fail` / `insufficient_evidence`) |
| `checks` | Array of 40 objects, each `{section, check, status, evidence}` — `status` is `pass` / `fail` / `missing`; `evidence` states what the check requires |
| `summary` | Plain-language count, e.g. the recorded full-pass summary: "40 pass, 0 fail, 0 missing of 40 checks across seven sections." |
| `stamp` | The same verdict rendered as a plain-text stamp for pasting into a record |

### Verdict vocabulary

**Verdicts** (the `verdict` field — every value this atom can return):

- `AUTH_DESIGN_SOUND` — Every check passes; the design is sound on the declared evidence.
- `AUTH_DESIGN_DEFICIENT` — At least one check fails; the failing checks name the breached section and the evidence against it.
- `INSUFFICIENT_EVIDENCE` — Nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

**Section statuses** (values in the `sections` object): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (the `status` field of each `checks` entry): `pass` — the requirement is met on the declared values (for a conditional check whose gate is off, `pass` is recorded with not-applicable semantics — see Checks); `fail` — the supporting field is present but the requirement is not met; `missing` — the supporting field is absent, so there is no evidence to judge.

### Errors

Only the error shapes evidenced in the gateway documentation (USER-GUIDE.md) and the recorded trial runs are documented here; no other payload shapes are claimed.

- **401 — unauthenticated:** missing or invalid key. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)
- **403 — scope:** the key lacks this atom's scope. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)
- **422 — `invalid_input`:** a manifest field has the wrong type. Recorded body shape: `{"ok": false, "error": "invalid_input", "field": "<field>", "detail": "<detail>"}` — this atom's recorded instance is `human_auth` / "human_auth must be an object" (Worked example 3, verbatim). No verdict is returned.
- **429 — rate limit:** the per-key rate limit (below) is exceeded. (Status and meaning per USER-GUIDE.md; no recorded body in the evidence for this atom.)

### Rate limits and pricing

- **Rate limits (from `contract.yaml`):** 60 requests per key per minute; 10,000 requests per key per day. The contract notes this is the SPEC default capacity guard for open public usage, tuned per atom at build-out from measured production cost.
- **Pricing:** Free during trial — rate pending. `contract.yaml` sets pricing unit `deliverable` with `rate: null` (`rate_status: pending`); SERVICE.md states no price is set and prices are set only from measured production cost per unit.

## Explanation

What this atom does, in depth: you submit a declared record — the manifest — and the atom audits that record, deterministically, against the method, quality gates and red lines of its bound skill. It runs 40 checks grouped into 7 sections (human_authentication, sessions, oauth_and_oidc, service_tokens, authorization, lifecycle, anti_abuse_and_audit), computes the computed checks described below from the declared values alone, and returns a single verdict with per-section and per-check evidence. Same manifest in → same verdict out: external verification confirmed byte-identical repeat REST responses and MCP/REST parity (see TEST-REPORT.md). One unit of sale is one delivered verdict — the atom sells the review it produces, never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic; there is no model judgment in the loop. Each check reads declared field(s): an **absent** field is missing evidence (check status `missing`), while a field **present but false / invalid** is a failure (check status `fail`) — that distinction is the atom's central semantics, and it drives the verdict: any `fail` produces the failing verdict; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only when every check passes does the atom return its pass verdict. Section statuses aggregate the same way (`pass` / `fail` / `insufficient_evidence`).

**Computed checks.** No numeric check is computed in this atom: the bound skill states no numeric threshold — no token lifetime, session expiry, or rate limit in numbers — so no numeric check is invented; lifetimes, expiries and limits are checked only for being defined/documented, exactly as the skill's quality gates state them. Two check groups are conditional (see below). This atom's response carries no `computed_status` field.

**What it does NOT do.** This atom audits a **declared** auth design record — it does not
probe the live system, attempt a login, inspect code or
configuration, or verify that a declared control actually works.
A design is sound *on the caller's declared evidence*: a manifest
that declares passkeys, rotating sessions, and tested revocation
passes those checks even if the implementation does none of it.
It is a completeness audit of the record the skill requires,
**not a penetration test or a security certification**: it never
judges whether the chosen factors are strong enough for the
system's actual risk, whether the hashing cost is tuned, or
whether the allowlists are correct — only that the record
contains what the skill's method, quality gates, and red lines
demand.

Named exclusions: no numeric thresholds (token lifetimes, session
expiries, lockout counts, rate limits — the skill states none, so
none is invented); no check of which hashing algorithm is
actually deployed beyond the declared Argon2id/bcrypt-class
attestation; no verification that revocation, rotation, or the
deprovisioning exercise actually happened; no live verification
of any declared fact.

**Buyer and use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this review on demand and would rather buy it per use than build or staff the capability themselves. Self-use (passed): see SERVICE.md — the house itself calls this atom in its own workflow, as an internal caller at zero price metered to the internal cost ledger. The recorded trial runs below are the external-verification battery for the release candidate now in its one-week RC soak.

## Role views

### For integrators

You need the verdict inside another system or agent loop. Use the REST endpoint `POST https://atoms.pipavia.com/v1/auth-design-review` (or the MCP tool `auth_design_review`) with a per-atom scoped key, treat HTTP 200 verdicts — including failing verdicts — as successful deliveries, and branch on `verdict`, `sections` and the per-check `status` values rather than on HTTP status. Reserve error handling for 401 / 403 / 422 / 429 (see Errors). The call is stateless and deterministic: cache or replay a manifest freely; an identical manifest returns an identical verdict. Respect the per-key limits (60/min, 10,000/day) and note pricing is free during trial with the rate pending.

### For developers

Manifest authoring: declare every field in the Input reference truthfully — omitting a field is a positive statement that the evidence does not exist (`missing`), not a neutral default, and declaring `false` where the record is actually silent converts a fixable `INSUFFICIENT_EVIDENCE` into a failing verdict. Mind the must-be-`false` fields, the computed checks (their rules are stated in full under Explanation), and the conditional gates where this atom has them. Determinism: the verdict core is a deterministic function of the manifest alone. Implementation pointers: core in `src/auth_design_review.py`, tests in `tests/test_auth_design_review.py` (see TEST-REPORT.md for the external battery: full-pass, violations, sparse, malformed, determinism, and MCP/REST parity).

### For ops

Endpoints: REST `POST https://atoms.pipavia.com/v1/auth-design-review` and MCP `POST https://atoms.pipavia.com/mcp/auth-design-review` on gateway v1.1.0 at https://atoms.pipavia.com. Keys are per user, per atom; a 403 spike means callers are presenting keys without this atom's scope, a 401 spike means missing/invalid keys, 422s mean malformed manifests naming the field in the body, and 429s mean the per-key limit (60/min, 10,000/day) is being hit — monitor those four codes separately from verdict mix, since failing verdicts are HTTP 200 by design. Status: live — release candidate (one-week RC soak to 2026-11-22); atom version 0.1.0. Pricing is free during trial (rate pending), so trial traffic is metered, not billed, per `contract.yaml`.

### For regulators

This atom is compliance-facing. Its verdict is security-design evidence: a deterministic, per-check record of what an authentication and authorization design declares — human authentication, sessions, OAuth/OIDC, service tokens, authorization, lifecycle, anti-abuse and audit logging — that a security review, an internal audit, or a compliance evidence pack can cite and re-run. Use it as evidence-production support: it assembles the declared-design record an auditor asks for. It never certifies: as SERVICE.md states, it is not a penetration test or a security certification, it does not probe the live system, and a `AUTH_DESIGN_SOUND` verdict attests only that the declared record is complete against the bound skill's method, quality gates and red lines — not that any control actually works in the implementation.

## Worked examples

Provenance: recorded 2026-11-16T00:45:05.394321+00:00 against gateway v1.1.0, external verification lane, source `verification/work/auth-design-review/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, pretty-printed with two-space indent; the JSON values are verbatim.

### Example 1 — full-pass

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

Response — HTTP 200:

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
  "checks": [
    {
      "section": "human_authentication",
      "check": "passkeys_preferred",
      "status": "pass",
      "evidence": "method 1: passkeys / WebAuthn are the preferred human authenticator \u2014 strong first"
    },
    {
      "section": "human_authentication",
      "check": "mfa_enforced_for_admin",
      "status": "pass",
      "evidence": "method 1 / quality gate: MFA or passkey is enforced for admin surfaces"
    },
    {
      "section": "human_authentication",
      "check": "mfa_enforced_for_sensitive_ops",
      "status": "pass",
      "evidence": "method 1: MFA is enforced for sensitive operations"
    },
    {
      "section": "human_authentication",
      "check": "passwords_hashed_strong_when_used",
      "status": "pass",
      "evidence": "no passwords declared in use"
    },
    {
      "section": "human_authentication",
      "check": "passwords_long_not_complex_when_used",
      "status": "pass",
      "evidence": "no passwords declared in use"
    },
    {
      "section": "human_authentication",
      "check": "no_shared_accounts",
      "status": "pass",
      "evidence": "quality gate: no shared accounts"
    },
    {
      "section": "sessions",
      "check": "secure_httponly_samesite_cookies",
      "status": "pass",
      "evidence": "method 2: session cookies are Secure, HttpOnly and SameSite"
    },
    {
      "section": "sessions",
      "check": "sessions_rotate_on_privilege_change",
      "status": "pass",
      "evidence": "method 2: sessions rotate on login and on privilege change"
    },
    {
      "section": "sessions",
      "check": "session_expiry_defined",
      "status": "pass",
      "evidence": "method 2: sessions expire sensibly \u2014 an expiry is defined"
    },
    {
      "section": "sessions",
      "check": "server_side_revocation_works",
      "status": "pass",
      "evidence": "method 2: the server-side revocation list works"
    },
    {
      "section": "oauth_and_oidc",
      "check": "authorization_code_with_pkce",
      "status": "pass",
      "evidence": "no OAuth/OIDC declared in use"
    },
    {
      "section": "oauth_and_oidc",
      "check": "exact_redirect_allowlists",
      "status": "pass",
      "evidence": "no OAuth/OIDC declared in use"
    },
    {
      "section": "oauth_and_oidc",
      "check": "iss_aud_exp_validated",
      "status": "pass",
      "evidence": "no OAuth/OIDC declared in use"
    },
    {
      "section": "oauth_and_oidc",
      "check": "implicit_flow_not_used",
      "status": "pass",
      "evidence": "no OAuth/OIDC declared in use"
    },
    {
      "section": "oauth_and_oidc",
      "check": "refresh_tokens_rotated",
      "status": "pass",
      "evidence": "no OAuth/OIDC declared in use"
    },
    {
      "section": "service_tokens",
      "check": "tokens_short_lived",
      "status": "pass",
      "evidence": "method 4: service tokens are short-lived"
    },
    {
      "section": "service_tokens",
      "check": "tokens_scoped",
      "status": "pass",
      "evidence": "method 4: service tokens are scoped"
    },
    {
      "section": "service_tokens",
      "check": "tokens_audience_bound",
      "status": "pass",
      "evidence": "method 4: service tokens are audience-bound"
    },
    {
      "section": "service_tokens",
      "check": "jit_issuance_over_long_lived_keys",
      "status": "pass",
      "evidence": "method 4: just-in-time issuance is preferred over long-lived keys"
    },
    {
      "section": "service_tokens",
      "check": "rotation_revocation_tested",
      "status": "pass",
      "evidence": "method 4 / quality gate: rotate and revoke paths are tested \u2014 revocation tested"
    },
    {
      "section": "service_tokens",
      "check": "lifetimes_and_scopes_documented",
      "status": "pass",
      "evidence": "quality gate: token lifetimes and scopes are documented"
    },
    {
      "section": "service_tokens",
      "check": "no_long_lived_unrevocable_credentials",
      "status": "pass",
      "evidence": "red line: no long-lived unrevocable credentials"
    },
    {
      "section": "authorization",
      "check": "server_side_checks_per_endpoint",
      "status": "pass",
      "evidence": "method 5 / quality gate: authorization is server-side, always \u2014 every endpoint performs a server-side permission check"
    },
    {
      "section": "authorization",
      "check": "rbac_for_coarse",
      "status": "pass",
      "evidence": "method 5: RBAC roles cover coarse-grained authorization"
    },
    {
      "section": "authorization",
      "check": "abac_for_fine",
      "status": "pass",
      "evidence": "method 5: ABAC / policies (OPA-style) cover fine-grained authorization"
    },
    {
      "section": "authorization",
      "check": "deny_by_default",
      "status": "pass",
      "evidence": "method 5: deny by default \u2014 never trust the UI"
    },
    {
      "section": "authorization",
      "check": "no_client_side_only_authorization",
      "status": "pass",
      "evidence": "red line: no client-side-only authorization"
    },
    {
      "section": "authorization",
      "check": "no_hand_rolled_crypto_or_protocols",
      "status": "pass",
      "evidence": "red line: no hand-rolled crypto or auth protocols"
    },
    {
      "section": "lifecycle",
      "check": "provisioning_reviewed",
      "status": "pass",
      "evidence": "method 6: provisioning is reviewed"
    },
    {
      "section": "lifecycle",
      "check": "deprovisioning_checklist_exists",
      "status": "pass",
      "evidence": "method 6 / quality gate: deprovisioning is a checklist \u2014 tokens revoked, keys rotated \u2014 and the runbook exists"
    },
    {
      "section": "lifecycle",
      "check": "deprovisioning_exercised",
      "status": "pass",
      "evidence": "quality gate: the deprovisioning runbook was exercised once"
    },
    {
      "section": "lifecycle",
      "check": "access_reviews_scheduled_for_admin",
      "status": "pass",
      "evidence": "method 6: access reviews run on schedule for admin surfaces"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "login_endpoints_rate_limited",
      "status": "pass",
      "evidence": "method 7: login endpoints are rate-limited"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "token_endpoints_rate_limited",
      "status": "pass",
      "evidence": "method 7: token endpoints are rate-limited"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "lockout_balanced_no_user_dos",
      "status": "pass",
      "evidence": "method 7: lockout policies are balanced \u2014 no user-lockout denial of service"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "anomaly_alerting",
      "status": "pass",
      "evidence": "method 7: anomalies alert \u2014 new geography, spikes"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "authn_events_logged",
      "status": "pass",
      "evidence": "method 8: authentication events \u2014 success and failure \u2014 are logged"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "authz_denials_logged",
      "status": "pass",
      "evidence": "method 8: authorization denials are logged"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "permission_changes_logged",
      "status": "pass",
      "evidence": "method 8: permission changes are logged"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "logs_include_actor_and_context",
      "status": "pass",
      "evidence": "method 8: auth logs carry actor and context"
    }
  ],
  "summary": "40 pass, 0 fail, 0 missing of 40 checks across seven sections.",
  "stamp": "AUTH DESIGN REVIEW\nsystem: secure-auth-service\nVERDICT: AUTH_DESIGN_SOUND\n  human_authentication         pass\n  sessions                     pass\n  oauth_and_oidc               pass\n  service_tokens               pass\n  authorization                pass\n  lifecycle                    pass\n  anti_abuse_and_audit         pass\n40 pass, 0 fail, 0 missing of 40 checks across seven sections."
}
```

### Example 2 — violations

Request — `POST /v1/auth-design-review`:

```json
{
  "system": "insecure-auth-service",
  "human_auth": {
    "passkeys_preferred": true,
    "mfa_enforced_for_admin": true,
    "mfa_enforced_for_sensitive_ops": true,
    "passwords_used": false,
    "shared_accounts_present": true
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
    "long_lived_unrevocable_credentials_present": true
  },
  "authorization": {
    "server_side_checks_per_endpoint": true,
    "rbac_coarse": true,
    "abac_fine": true,
    "deny_by_default": true,
    "client_side_only_authorization": true,
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

Response — HTTP 200:

```json
{
  "service": "auth-design-review",
  "atom_version": "0.1.0",
  "system": "insecure-auth-service",
  "verdict": "AUTH_DESIGN_DEFICIENT",
  "sections": {
    "human_authentication": "fail",
    "sessions": "pass",
    "oauth_and_oidc": "pass",
    "service_tokens": "fail",
    "authorization": "fail",
    "lifecycle": "pass",
    "anti_abuse_and_audit": "pass"
  },
  "checks": [
    {
      "section": "human_authentication",
      "check": "passkeys_preferred",
      "status": "pass",
      "evidence": "method 1: passkeys / WebAuthn are the preferred human authenticator \u2014 strong first"
    },
    {
      "section": "human_authentication",
      "check": "mfa_enforced_for_admin",
      "status": "pass",
      "evidence": "method 1 / quality gate: MFA or passkey is enforced for admin surfaces"
    },
    {
      "section": "human_authentication",
      "check": "mfa_enforced_for_sensitive_ops",
      "status": "pass",
      "evidence": "method 1: MFA is enforced for sensitive operations"
    },
    {
      "section": "human_authentication",
      "check": "passwords_hashed_strong_when_used",
      "status": "pass",
      "evidence": "no passwords declared in use"
    },
    {
      "section": "human_authentication",
      "check": "passwords_long_not_complex_when_used",
      "status": "pass",
      "evidence": "no passwords declared in use"
    },
    {
      "section": "human_authentication",
      "check": "no_shared_accounts",
      "status": "fail",
      "evidence": "quality gate: no shared accounts"
    },
    {
      "section": "sessions",
      "check": "secure_httponly_samesite_cookies",
      "status": "pass",
      "evidence": "method 2: session cookies are Secure, HttpOnly and SameSite"
    },
    {
      "section": "sessions",
      "check": "sessions_rotate_on_privilege_change",
      "status": "pass",
      "evidence": "method 2: sessions rotate on login and on privilege change"
    },
    {
      "section": "sessions",
      "check": "session_expiry_defined",
      "status": "pass",
      "evidence": "method 2: sessions expire sensibly \u2014 an expiry is defined"
    },
    {
      "section": "sessions",
      "check": "server_side_revocation_works",
      "status": "pass",
      "evidence": "method 2: the server-side revocation list works"
    },
    {
      "section": "oauth_and_oidc",
      "check": "authorization_code_with_pkce",
      "status": "pass",
      "evidence": "no OAuth/OIDC declared in use"
    },
    {
      "section": "oauth_and_oidc",
      "check": "exact_redirect_allowlists",
      "status": "pass",
      "evidence": "no OAuth/OIDC declared in use"
    },
    {
      "section": "oauth_and_oidc",
      "check": "iss_aud_exp_validated",
      "status": "pass",
      "evidence": "no OAuth/OIDC declared in use"
    },
    {
      "section": "oauth_and_oidc",
      "check": "implicit_flow_not_used",
      "status": "pass",
      "evidence": "no OAuth/OIDC declared in use"
    },
    {
      "section": "oauth_and_oidc",
      "check": "refresh_tokens_rotated",
      "status": "pass",
      "evidence": "no OAuth/OIDC declared in use"
    },
    {
      "section": "service_tokens",
      "check": "tokens_short_lived",
      "status": "pass",
      "evidence": "method 4: service tokens are short-lived"
    },
    {
      "section": "service_tokens",
      "check": "tokens_scoped",
      "status": "pass",
      "evidence": "method 4: service tokens are scoped"
    },
    {
      "section": "service_tokens",
      "check": "tokens_audience_bound",
      "status": "pass",
      "evidence": "method 4: service tokens are audience-bound"
    },
    {
      "section": "service_tokens",
      "check": "jit_issuance_over_long_lived_keys",
      "status": "pass",
      "evidence": "method 4: just-in-time issuance is preferred over long-lived keys"
    },
    {
      "section": "service_tokens",
      "check": "rotation_revocation_tested",
      "status": "pass",
      "evidence": "method 4 / quality gate: rotate and revoke paths are tested \u2014 revocation tested"
    },
    {
      "section": "service_tokens",
      "check": "lifetimes_and_scopes_documented",
      "status": "pass",
      "evidence": "quality gate: token lifetimes and scopes are documented"
    },
    {
      "section": "service_tokens",
      "check": "no_long_lived_unrevocable_credentials",
      "status": "fail",
      "evidence": "red line: no long-lived unrevocable credentials"
    },
    {
      "section": "authorization",
      "check": "server_side_checks_per_endpoint",
      "status": "pass",
      "evidence": "method 5 / quality gate: authorization is server-side, always \u2014 every endpoint performs a server-side permission check"
    },
    {
      "section": "authorization",
      "check": "rbac_for_coarse",
      "status": "pass",
      "evidence": "method 5: RBAC roles cover coarse-grained authorization"
    },
    {
      "section": "authorization",
      "check": "abac_for_fine",
      "status": "pass",
      "evidence": "method 5: ABAC / policies (OPA-style) cover fine-grained authorization"
    },
    {
      "section": "authorization",
      "check": "deny_by_default",
      "status": "pass",
      "evidence": "method 5: deny by default \u2014 never trust the UI"
    },
    {
      "section": "authorization",
      "check": "no_client_side_only_authorization",
      "status": "fail",
      "evidence": "red line: no client-side-only authorization"
    },
    {
      "section": "authorization",
      "check": "no_hand_rolled_crypto_or_protocols",
      "status": "pass",
      "evidence": "red line: no hand-rolled crypto or auth protocols"
    },
    {
      "section": "lifecycle",
      "check": "provisioning_reviewed",
      "status": "pass",
      "evidence": "method 6: provisioning is reviewed"
    },
    {
      "section": "lifecycle",
      "check": "deprovisioning_checklist_exists",
      "status": "pass",
      "evidence": "method 6 / quality gate: deprovisioning is a checklist \u2014 tokens revoked, keys rotated \u2014 and the runbook exists"
    },
    {
      "section": "lifecycle",
      "check": "deprovisioning_exercised",
      "status": "pass",
      "evidence": "quality gate: the deprovisioning runbook was exercised once"
    },
    {
      "section": "lifecycle",
      "check": "access_reviews_scheduled_for_admin",
      "status": "pass",
      "evidence": "method 6: access reviews run on schedule for admin surfaces"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "login_endpoints_rate_limited",
      "status": "pass",
      "evidence": "method 7: login endpoints are rate-limited"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "token_endpoints_rate_limited",
      "status": "pass",
      "evidence": "method 7: token endpoints are rate-limited"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "lockout_balanced_no_user_dos",
      "status": "pass",
      "evidence": "method 7: lockout policies are balanced \u2014 no user-lockout denial of service"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "anomaly_alerting",
      "status": "pass",
      "evidence": "method 7: anomalies alert \u2014 new geography, spikes"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "authn_events_logged",
      "status": "pass",
      "evidence": "method 8: authentication events \u2014 success and failure \u2014 are logged"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "authz_denials_logged",
      "status": "pass",
      "evidence": "method 8: authorization denials are logged"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "permission_changes_logged",
      "status": "pass",
      "evidence": "method 8: permission changes are logged"
    },
    {
      "section": "anti_abuse_and_audit",
      "check": "logs_include_actor_and_context",
      "status": "pass",
      "evidence": "method 8: auth logs carry actor and context"
    }
  ],
  "summary": "37 pass, 3 fail, 0 missing of 40 checks across seven sections.",
  "stamp": "AUTH DESIGN REVIEW\nsystem: insecure-auth-service\nVERDICT: AUTH_DESIGN_DEFICIENT\n  human_authentication         fail\n  sessions                     pass\n  oauth_and_oidc               pass\n  service_tokens               fail\n  authorization                fail\n  lifecycle                    pass\n  anti_abuse_and_audit         pass\n37 pass, 3 fail, 0 missing of 40 checks across seven sections."
}
```

### Example 3 — malformed

Request — `POST /v1/auth-design-review`:

```json
{
  "system": "malformed-test",
  "human_auth": "should-be-an-object"
}
```

Response — HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "human_auth",
  "detail": "human_auth must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present (tutorial / how-to / reference / explanation) | Yes — Tutorial, How-to guides, Reference and Explanation sections above; output is CommonMark markdown |
| Role views present (integrators / developers / ops / regulators) | Integrators Yes; developers Yes; ops Yes; regulators Yes |
| Checks named (documented / recorded) | 40 / 40 — every check in the recorded full-pass response is listed under Reference → Checks |
| Verdict vocabulary complete | Yes — 3 verdict values, plus section statuses and per-check statuses |
| Input reference typed | Yes — 43 fields, each with its type, grouped as in SERVICE.md |
| Worked examples verbatim-verified | Yes — full-pass / violations / malformed inputs and REST responses compared as JSON values against `verification/work/auth-design-review/evidence.json` after writing |

