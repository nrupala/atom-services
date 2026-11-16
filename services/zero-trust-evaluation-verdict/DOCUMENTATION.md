# Zero trust evaluation verdict — full documentation

**Zero trust evaluation verdict** · slug `zero-trust-evaluation-verdict` · deliverable type: VERDICT · atom version 0.1.0 · status: **live — release candidate (one-week RC soak to 2026-11-22)**

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through step by step. This tutorial narrates the recorded full-pass trial run (worked example 1 below reproduces its request and response verbatim).

**Step 1 — get a key.** Sign up and issue a gateway key for this atom (the full flow is in the how-to below). Every call sends the key as `Authorization: Bearer <key>`.

**Step 2 — build the manifest.** The caller assembles one JSON manifest naming the subject in `system` (`"production-auth-service"`) and declaring the evidence the atom checks, group by group (the input reference below lists every field and its type). In the recorded run, every checked field is supplied.

**Step 3 — call the REST endpoint.** `POST https://atoms.pipavia.com/v1/zero-trust-evaluation-verdict` with the manifest as the body and the `Authorization` header set.

**Step 4 — read the verdict.** The recorded response came back HTTP 200 with verdict `CLAIM_SUSTAINED`. Its summary: "26 pass, 0 fail, 0 missing of 26 checks across six sections." Every section reports `pass` (claim_and_scope, authentication_and_server_trust, identity_and_authenticator_strength, privilege_segmentation_and_verification, trust_inventory, honest_limits) and every check in the `checks` array reports `pass` — that array, with its per-check evidence strings, is the deliverable's reasoning, not decoration.

**Step 5 — trust but verify.** The same manifest submitted twice returned byte-identical REST responses, and the MCP face returned a structurally identical result — both properties are recorded in the evidence (`determinism_byte_identical`, `parity_structured_equal`). Same input in, same deliverable out.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "zero-trust-evaluation-verdict"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.
4. `POST https://atoms.pipavia.com/v1/zero-trust-evaluation-verdict` — body = the manifest object; same `Authorization` header. HTTP 200 returns the deliverable as JSON.

### Call via MCP

- Endpoint: `POST https://atoms.pipavia.com/mcp/zero-trust-evaluation-verdict`
- Tool name: `zero_trust_evaluation_verdict` — `tools/call` arguments = the manifest object (the same object you would POST to REST).
- Send the same `Authorization: Bearer <key>` header. The MCP result's structured content is the same deliverable the REST face returns (parity is recorded in the evidence).

### Read a failing verdict and fix the manifest

The recorded violations run (worked example 2) returned HTTP 200 with verdict `CLAIM_NOT_SUSTAINED`: "20 pass, 6 fail, 0 missing of 26 checks across six sections." Read a failing response in this order:

1. **`verdict` + `summary`** — the counts tell you how many checks fail vs are missing. Fail and missing are different problems: a fail means your manifest *declares evidence against you*; missing means you *did not declare the evidence at all*.
2. **`checks` with `status: "fail"`** — in the recorded run:
   - `session_not_trusted_indefinitely` (section `authentication_and_server_trust`) — evidence: "gauntlet: if the server authenticates you and then trusts the session indefinitely, that's perimeter thinking with extra steps"
   - `password_kdf_is_argon2id` (section `identity_and_authenticator_strength`) — evidence: "NIST notes: Argon2id is the NIST-preferred password-hashing/KDF choice — prefer it over PBKDF2 and never over raw SHA-256 (not a KDF)"
   - `minimum_secret_length_meets_stated_minimum` (section `identity_and_authenticator_strength`) — evidence: "NIST notes: CISA guidance — enforce meaningful minimum entropy (mykey: 16 characters); length beats complexity rules"
   - `credential_scope_within_job` (section `privilege_segmentation_and_verification`) — evidence: "least privilege: can this credential do more than its job requires? It must not"
   - `network_not_flat` (section `privilege_segmentation_and_verification`) — evidence: "micro-segmentation: a flat network where one breach means total breach is not zero-trust"
   - `network_not_trusted_as_internal` (section `trust_inventory`) — evidence: "the network is always hostile in your analysis, even 'internal' networks — 'inside the firewall' is not an identity"
   Fix = change the underlying practice or record so the declaration becomes true, then resubmit. Editing the manifest to claim what is not true defeats the deliverable — the atom checks declared evidence, and its value is that the declaration is yours.
3. **`sections`** — a section reports `fail` when any of its checks fails, `insufficient_evidence` when nothing fails but evidence is missing, `pass` only when all its checks pass.

### Handle a 422 invalid_input

A type-violating manifest is rejected before any verdict is computed. The recorded malformed run (worked example 3) returned HTTP 422:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "evaluation",
  "detail": "evaluation must be an object"
}
```

Read `field` for the offending field and `detail` for the expected shape — here, `evaluation`: "evaluation must be an object". Fix the type at that field (per the input reference below) and resubmit. A 422 is never a verdict and is not metered as a delivered result.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/zero-trust-evaluation-verdict` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/zero-trust-evaluation-verdict` — tool name `zero_trust_evaluation_verdict`; `tools/call` arguments = the manifest object; same `Authorization` header.
- Support: info@pipavia.com

### Input reference

Every field, grouped as SERVICE.md groups them, with its type. All fields are booleans unless a type is noted.

**Group: —**

| Field | Type | Notes |
|---|---|---|
| `system` | string | carried into the verdict output, not itself checked |

**Group: `claim_and_scope`**

| Field | Type | Notes |
|---|---|---|
| `evaluation.claim_stated` | see SERVICE.md note |  |
| `evaluation.adversaries_named` | see SERVICE.md note |  |
| `evaluation.out_of_scope_named` | see SERVICE.md note |  |
| `evaluation.not_certification_acknowledged` | see SERVICE.md note |  |

**Group: `authentication_and_server_trust`**

| Field | Type | Notes |
|---|---|---|
| `gauntlet.authentication_point_identified` | see SERVICE.md note |  |
| `gauntlet.session_trusted_indefinitely` | must be `false` to pass — skill red line | must be `false` to pass — skill red line |
| `gauntlet.master_secret_leaves_client` | must be `false` to pass — skill red line | must be `false` to pass — skill red line |
| `gauntlet.server_sees_only_encrypted_data` | see SERVICE.md note |  |
| `gauntlet.server_breach_exposes_user_data` | must be `false` to pass | must be `false` to pass |

**Group: `identity_and_authenticator_strength`**

| Field | Type | Notes |
|---|---|---|
| `identity.checked_before_access` | see SERVICE.md note |  |
| `identity.proof_method_named` | see SERVICE.md note |  |
| `cryptography.password_kdf` | string | must be `"argon2id"` to pass — computed, see below |
| `cryptography.minimum_secret_length_chars` | number | must be ≥ 16 to pass — computed, see below |
| `cryptography.claims_nist_alignment` | gates the controls check below |  |
| `cryptography.nist_controls_named` | required when NIST alignment is claimed; otherwise the check passes as not applicable |  |

**Group: `privilege_segmentation_and_verification`**

| Field | Type | Notes |
|---|---|---|
| `findings.least_privilege_evaluated` | see SERVICE.md note |  |
| `findings.credential_exceeds_job` | must be `false` to pass | must be `false` to pass |
| `findings.blast_radius_bounded` | see SERVICE.md note |  |
| `findings.flat_network` | must be `false` to pass | must be `false` to pass |
| `findings.trust_rechecked_after_login` | see SERVICE.md note |  |

**Group: `trust_inventory`**

| Field | Type | Notes |
|---|---|---|
| `inventory.trusted_components_inventoried` | see SERVICE.md note |  |
| `inventory.backdoors_present` | gates the naming check below |  |
| `inventory.backdoors_named` | required when a backdoor is present; otherwise the check passes as not applicable |  |
| `inventory.convenience_decisions_surfaced` | see SERVICE.md note |  |
| `inventory.internal_network_trusted` | must be `false` to pass | must be `false` to pass |

**Group: `honest_limits`**

| Field | Type | Notes |
|---|---|---|
| `limits.compromised_endpoint_limit_acknowledged` | see SERVICE.md note |  |
| `limits.usability_tradeoff_stated` | see SERVICE.md note |  |
| `limits.design_claims_only_acknowledged` | see SERVICE.md note |  |

### Checks

Every check the atom runs — 26 in total, exactly as named in the recorded full-pass response, grouped by section. For each check: what it requires to pass (the recorded evidence text states the requirement), and the status semantics that follow the table.

**Section: `claim_and_scope`**

| Check | Requires to pass | Notes |
|---|---|---|
| `claim_stated_verbatim` | the zero-trust claim under evaluation is stated — alignment is a claim about which controls are implemented, not a certificate |  |
| `adversaries_named` | a system is zero-trust only against the adversaries it names |  |
| `out_of_scope_named` | who is out of scope is named honestly (zerok names compromised client OS and physical access as out of scope) |  |
| `evaluation_not_certification_acknowledged` | honest limit: this skill evaluates design claims — it does not replace a security audit, penetration test, or formal certification |  |
**Section: `authentication_and_server_trust`**

| Check | Requires to pass | Notes |
|---|---|---|
| `authentication_point_identified` | gauntlet: where does authentication happen? The authentication point is identified |  |
| `session_not_trusted_indefinitely` | gauntlet: if the server authenticates you and then trusts the session indefinitely, that's perimeter thinking with extra steps |  |
| `master_secret_never_leaves_client` | gauntlet: what does the server know? In a true zero-trust design the server holds no secrets it could abuse (mykey: master password never leaves the machine) |  |
| `server_sees_only_encrypted_data` | gauntlet: the server sees only encrypted data (zerok: storage server sees only encrypted blobs — no plaintext, no recoverable keys) |  |
| `server_breach_does_not_expose_user_data` | gauntlet: what survives a server breach? If breaching the server exposes user data, the trust was placed in the server — the opposite of zero-trust |  |
**Section: `identity_and_authenticator_strength`**

| Check | Requires to pass | Notes |
|---|---|---|
| `identity_checked_before_access` | identity-based access: what identity does this system check before granting access? |  |
| `identity_proof_method_named` | identity-based access: how is that identity proven? The proof method is named |  |
| `password_kdf_is_argon2id` | NIST notes: Argon2id is the NIST-preferred password-hashing/KDF choice — prefer it over PBKDF2 and never over raw SHA-256 (not a KDF) | Computed: passes only when the declared value is exactly `"argon2id"`. |
| `minimum_secret_length_meets_stated_minimum` | NIST notes: CISA guidance — enforce meaningful minimum entropy (mykey: 16 characters); length beats complexity rules | Computed: passes at or above 16 characters; equality passes. Absent = missing, not a failure. |
| `nist_controls_named_when_alignment_claimed` | NIST notes: 'NIST-compliant' without naming the controls is marketing — alignment is a claim about which controls are implemented | Conditional: required only when `cryptography.claims_nist_alignment` is true; otherwise passes as not applicable. |
**Section: `privilege_segmentation_and_verification`**

| Check | Requires to pass | Notes |
|---|---|---|
| `least_privilege_evaluated` | least privilege evaluated: every identity gets the minimum access needed, for the minimum time needed |  |
| `credential_scope_within_job` | least privilege: can this credential do more than its job requires? It must not |  |
| `breach_blast_radius_bounded` | micro-segmentation: if this component is breached, what else falls with it? The blast radius is bounded |  |
| `network_not_flat` | micro-segmentation: a flat network where one breach means total breach is not zero-trust |  |
| `trust_rechecked_after_login` | continuous verification: what happens after the initial login — is anything ever re-checked? Sessions expire, tokens rotate, anomalous behavior re-triggers authentication |  |
**Section: `trust_inventory`**

| Check | Requires to pass | Notes |
|---|---|---|
| `trusted_components_inventoried` | trust is a vulnerability: every trusted component is an attack surface — inventory them before praising the architecture |  |
| `backdoors_named_explicitly` | no backdoor (recovery / override / escrow) declared | Conditional: naming is required only when `inventory.backdoors_present` is true; with no backdoor declared it passes as not applicable (recorded evidence: "no backdoor (recovery / override / escrow) declared"). |
| `convenience_trust_decisions_surfaced` | convenience features (SSO passthrough, persistent sessions, silent re-auth) are trust decisions — surface each one |  |
| `network_not_trusted_as_internal` | the network is always hostile in your analysis, even 'internal' networks — 'inside the firewall' is not an identity |  |
**Section: `honest_limits`**

| Check | Requires to pass | Notes |
|---|---|---|
| `compromised_endpoint_limit_acknowledged` | honest limit: zero-trust does not fix a compromised endpoint — if the client device is owned, no architecture above it holds |  |
| `usability_tradeoff_stated` | usability and zero-trust are in tension (no password recovery IS the guarantee) — say what the user gives up, not just what they gain |  |
| `design_claims_only_acknowledged` | this skill evaluates design claims — the verdict is over the declared design evidence, not a live audit of the running system |  |

**Per-check status semantics:** `pass` — the requirement is met on the declared evidence (a conditional check whose gate does not bind also reports `pass`, with its evidence text saying why it does not bind, e.g. "no conveyor drives declared"); `fail` — the field is present but false/invalid, a red line is crossed, or a computed comparison fails; `missing` — the field (or a value a computed check needs) is absent. There is no separate not-applicable status value in the recorded responses: not-applicable is expressed as `pass` with explanatory evidence.

### Output format

A successful call returns one JSON object. The recorded full-pass response carries these top-level keys, in order: `service`, `atom_version`, `system`, `verdict`, `sections`, `checks`, `claim_status`, `secret_length_margin_chars`, `summary`, `stamp`. It always includes `service` and `atom_version`, the subject echo where the manifest names one, the verdict/status, a human-readable `summary`, and a text `stamp` restating the result.

The response also carries `claim_status` and `secret_length_margin_chars` — the declared minimum length minus the stated 16, as a string with exactly four decimal places by the fixed round-half-up rule (null when no numeric length is declared) — plus a `summary` and a text `stamp`.

### Verdict vocabulary

| Value | Meaning |
|---|---|
| `CLAIM_SUSTAINED` | All 26 checks pass — the zero-trust claim is sustained *on the declared evidence*. One failure breaks the claim (the skill's gauntlet rule). |
| `CLAIM_NOT_SUSTAINED` | At least one check fails — a declared boolean is false, a red line is crossed (session trusted indefinitely, master secret leaves the client, server breach exposes user data, flat network, internal network trusted), or a computed check fails (KDF not Argon2id, minimum secret length below 16, unnamed NIST controls while claiming alignment, unnamed backdoor). |
| `INSUFFICIENT_EVIDENCE` | Nothing fails, but evidence is missing (absent fields, or a computed check that cannot be completed). |
| `claim_status = sustained_on_declared_evidence / not_sustained_on_declared_evidence / null` | Derived verdict status over the declared evidence; null when either computed check cannot be completed. |
| section status `pass` | Every check in the section passes (including not-applicable passes). |
| section status `fail` | At least one check in the section fails. |
| section status `insufficient_evidence` | No check in the section fails, but at least one is missing. |
| check status `pass` / `fail` / `missing` | See the status semantics under Checks. |

### Errors

Only the shapes evidenced in the gateway code and the recorded battery are documented here:

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | Missing, malformed, unknown or revoked key (REST face shape, from the gateway call path). |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the <namespace> scope; issue it for this atom first"}` | The key is valid but was never issued for this atom — issue it for `zero-trust-evaluation-verdict` and retry. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "evaluation", "detail": "evaluation must be an object"}` (recorded verbatim in worked example 3) | The manifest violates a field type; `field` and `detail` name the problem. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for zero-trust-evaluation-verdict exceeded"}` (a per-day variant names the 10000/day limit) | Rate limit exceeded; the call is not metered. |

### Rate limits and pricing status

- Rate limits (contract.yaml, SPEC default): **60 calls/minute and 10000 calls/day per key** for this atom.
- Pricing (contract.yaml): pricing unit = deliverable; `pricing.rate` is null and `rate_status` is pending — **Free during trial — rate pending.** Prices are set only from measured production cost per unit, per the billing protocol in the contract.

## Explanation

This atom sells its deliverable — a bounded verdict artifact — never the underlying knowledge itself. teams and agents working in Security & privacy who need this verdict on demand and would rather buy it per use than build or staff the capability themselves. House self-use: **Reviewing home and product access**.

**How the verdict is decided.** Deterministic core (byte-identical repeats and REST/MCP parity recorded). Most checks read one declared boolean each; several are inverted (the passing value is `false`). Two checks are computed from the declared values, using only what the bound skill states: the declared `cryptography.password_kdf` passes only when it is exactly `"argon2id"` (the skill's NIST notes: Argon2id is the preferred password KDF, over PBKDF2 and never raw SHA-256), and the declared `cryptography.minimum_secret_length_chars` passes at or above 16 (the CISA guidance the skill cites; equality passes — a minimum, not a margin). Two checks are conditional: NIST controls must be named only when NIST alignment is claimed, and backdoors must be named only when a backdoor is declared present; otherwise each passes as not applicable. An absent computed value is missing evidence, not a failure; a present value of the wrong type is rejected as invalid input (422). Absent = missing; present-but-false/invalid = fail.

**What it does NOT do.**

- Declared evidence only: it does not probe a running system, read configurations, test credentials, or verify that a declared value is true. A claim is sustained *on the caller's declared evidence*.
- It is an evaluation verdict, not a security certification — it does not replace a security audit, penetration test, or formal certification.
- No authenticator-strength scoring beyond the two stated computed items (no AAL levels, entropy formula, or session/token lifetimes — the skill names none).
- No check of *which* NIST controls are named, only that they are named when alignment is claimed.
- Relationship to `defined-flow-auditor`: both atoms are built from the same bound skill; that atom audits declared *flows* per principle, this one returns one evaluation verdict over an evaluation pack, including the NIST authenticator-strength arithmetic the auditor does not compute. Overlapping principles are the same ground offered twice, not two different findings.

## Role views

### For integrators (Users)

One manifest in, one deliverable out, over REST or MCP with the same key. Start with the tutorial, keep the input reference beside your manifest builder, and treat the response's verdict/status, summary and per-item detail as the product. Rate: free during trial — rate pending; limits 60/min, 10000/day per key. Support: info@pipavia.com.

### For developers

Manifest authoring: field names, groupings and types are exactly as in the input reference — a type violation is a 422 before any computation, and an absent field is a deliberate signal (missing evidence), not a default. Determinism: the core is deterministic — the recorded battery proves byte-identical repeat REST responses and REST/MCP structured parity for this atom, so golden-file testing against the worked examples below is sound. Implementation: `services/zero-trust-evaluation-verdict/src/zero_trust_evaluation_verdict.py` (Python 3, stdlib only; `evaluate(manifest)`), tests: `services/zero-trust-evaluation-verdict/tests/test_zero_trust_evaluation_verdict.py` (26 tests, per contract.yaml). Fixes land in the bound skill first, then the atom re-deploys and must pass regression before its version bumps (contract R1 rule).

### For ops

Endpoints: REST `POST /v1/zero-trust-evaluation-verdict` and MCP `POST /mcp/zero-trust-evaluation-verdict` (tool `zero_trust_evaluation_verdict`) on https://atoms.pipavia.com. Key scope: per user, per atom — a key never verifies for another atom; 403 means the scope was never issued. Rate limits: 60/min, 10000/day per key (429, not metered). Error monitoring: watch the 401 (unauthorized) / 403 (scope_required) / 422 (invalid_input, with field+detail) / 429 (rate_limit) shapes in the errors table. Status: live — release candidate, one-week RC soak to 2026-11-22; atom version 0.1.0.

### For regulators

Included because this atom is compliance-facing (security): its verdict is evaluation evidence over a system's zero-trust claim. What it gives a reviewer: a deterministic verdict over the declared evaluation pack, including the two computed authenticator-strength items (Argon2id KDF; 16-character minimum secret length) and explicit honest-limits acknowledgements. What it does not give: a probe of the running system, credential testing, or a security certification — the pack itself must acknowledge that distinction for the claim to be sustained.

## Worked examples — real recorded trial runs

Provenance: recorded 2026-11-15T23:54:40.487423+00:00 against gateway v1.1.0, external verification lane, source `verification/work/zero-trust-evaluation-verdict/evidence.json`. Each example shows the case's recorded `input` and the REST execution's recorded `response_text`, reproduced verbatim (pretty-printed with indent 2 for readability; JSON values unchanged — verified mechanically against the evidence after writing).

### Example 1 — full-pass (recorded HTTP 200)

Recorded case note: All boolean constraints met, KDF is argon2id, secret length is 16. computed_spot_checks: secret_length_margin_chars = 0.0000

Input:

```json
{
  "system": "production-auth-service",
  "evaluation": {
    "claim_stated": true,
    "adversaries_named": true,
    "out_of_scope_named": true,
    "not_certification_acknowledged": true
  },
  "gauntlet": {
    "authentication_point_identified": true,
    "session_trusted_indefinitely": false,
    "master_secret_leaves_client": false,
    "server_sees_only_encrypted_data": true,
    "server_breach_exposes_user_data": false
  },
  "identity": {
    "checked_before_access": true,
    "proof_method_named": true
  },
  "cryptography": {
    "password_kdf": "argon2id",
    "minimum_secret_length_chars": 16,
    "claims_nist_alignment": true,
    "nist_controls_named": true
  },
  "findings": {
    "least_privilege_evaluated": true,
    "credential_exceeds_job": false,
    "blast_radius_bounded": true,
    "flat_network": false,
    "trust_rechecked_after_login": true
  },
  "inventory": {
    "trusted_components_inventoried": true,
    "backdoors_present": false,
    "convenience_decisions_surfaced": true,
    "internal_network_trusted": false
  },
  "limits": {
    "compromised_endpoint_limit_acknowledged": true,
    "usability_tradeoff_stated": true,
    "design_claims_only_acknowledged": true
  }
}
```

Response (REST):

```json
{
  "service": "zero-trust-evaluation-verdict",
  "atom_version": "0.1.0",
  "system": "production-auth-service",
  "verdict": "CLAIM_SUSTAINED",
  "sections": {
    "claim_and_scope": "pass",
    "authentication_and_server_trust": "pass",
    "identity_and_authenticator_strength": "pass",
    "privilege_segmentation_and_verification": "pass",
    "trust_inventory": "pass",
    "honest_limits": "pass"
  },
  "checks": [
    {
      "section": "claim_and_scope",
      "check": "claim_stated_verbatim",
      "status": "pass",
      "evidence": "the zero-trust claim under evaluation is stated — alignment is a claim about which controls are implemented, not a certificate"
    },
    {
      "section": "claim_and_scope",
      "check": "adversaries_named",
      "status": "pass",
      "evidence": "a system is zero-trust only against the adversaries it names"
    },
    {
      "section": "claim_and_scope",
      "check": "out_of_scope_named",
      "status": "pass",
      "evidence": "who is out of scope is named honestly (zerok names compromised client OS and physical access as out of scope)"
    },
    {
      "section": "claim_and_scope",
      "check": "evaluation_not_certification_acknowledged",
      "status": "pass",
      "evidence": "honest limit: this skill evaluates design claims — it does not replace a security audit, penetration test, or formal certification"
    },
    {
      "section": "authentication_and_server_trust",
      "check": "authentication_point_identified",
      "status": "pass",
      "evidence": "gauntlet: where does authentication happen? The authentication point is identified"
    },
    {
      "section": "authentication_and_server_trust",
      "check": "session_not_trusted_indefinitely",
      "status": "pass",
      "evidence": "gauntlet: if the server authenticates you and then trusts the session indefinitely, that's perimeter thinking with extra steps"
    },
    {
      "section": "authentication_and_server_trust",
      "check": "master_secret_never_leaves_client",
      "status": "pass",
      "evidence": "gauntlet: what does the server know? In a true zero-trust design the server holds no secrets it could abuse (mykey: master password never leaves the machine)"
    },
    {
      "section": "authentication_and_server_trust",
      "check": "server_sees_only_encrypted_data",
      "status": "pass",
      "evidence": "gauntlet: the server sees only encrypted data (zerok: storage server sees only encrypted blobs — no plaintext, no recoverable keys)"
    },
    {
      "section": "authentication_and_server_trust",
      "check": "server_breach_does_not_expose_user_data",
      "status": "pass",
      "evidence": "gauntlet: what survives a server breach? If breaching the server exposes user data, the trust was placed in the server — the opposite of zero-trust"
    },
    {
      "section": "identity_and_authenticator_strength",
      "check": "identity_checked_before_access",
      "status": "pass",
      "evidence": "identity-based access: what identity does this system check before granting access?"
    },
    {
      "section": "identity_and_authenticator_strength",
      "check": "identity_proof_method_named",
      "status": "pass",
      "evidence": "identity-based access: how is that identity proven? The proof method is named"
    },
    {
      "section": "identity_and_authenticator_strength",
      "check": "password_kdf_is_argon2id",
      "status": "pass",
      "evidence": "NIST notes: Argon2id is the NIST-preferred password-hashing/KDF choice — prefer it over PBKDF2 and never over raw SHA-256 (not a KDF)"
    },
    {
      "section": "identity_and_authenticator_strength",
      "check": "minimum_secret_length_meets_stated_minimum",
      "status": "pass",
      "evidence": "NIST notes: CISA guidance — enforce meaningful minimum entropy (mykey: 16 characters); length beats complexity rules"
    },
    {
      "section": "identity_and_authenticator_strength",
      "check": "nist_controls_named_when_alignment_claimed",
      "status": "pass",
      "evidence": "NIST notes: 'NIST-compliant' without naming the controls is marketing — alignment is a claim about which controls are implemented"
    },
    {
      "section": "privilege_segmentation_and_verification",
      "check": "least_privilege_evaluated",
      "status": "pass",
      "evidence": "least privilege evaluated: every identity gets the minimum access needed, for the minimum time needed"
    },
    {
      "section": "privilege_segmentation_and_verification",
      "check": "credential_scope_within_job",
      "status": "pass",
      "evidence": "least privilege: can this credential do more than its job requires? It must not"
    },
    {
      "section": "privilege_segmentation_and_verification",
      "check": "breach_blast_radius_bounded",
      "status": "pass",
      "evidence": "micro-segmentation: if this component is breached, what else falls with it? The blast radius is bounded"
    },
    {
      "section": "privilege_segmentation_and_verification",
      "check": "network_not_flat",
      "status": "pass",
      "evidence": "micro-segmentation: a flat network where one breach means total breach is not zero-trust"
    },
    {
      "section": "privilege_segmentation_and_verification",
      "check": "trust_rechecked_after_login",
      "status": "pass",
      "evidence": "continuous verification: what happens after the initial login — is anything ever re-checked? Sessions expire, tokens rotate, anomalous behavior re-triggers authentication"
    },
    {
      "section": "trust_inventory",
      "check": "trusted_components_inventoried",
      "status": "pass",
      "evidence": "trust is a vulnerability: every trusted component is an attack surface — inventory them before praising the architecture"
    },
    {
      "section": "trust_inventory",
      "check": "backdoors_named_explicitly",
      "status": "pass",
      "evidence": "no backdoor (recovery / override / escrow) declared"
    },
    {
      "section": "trust_inventory",
      "check": "convenience_trust_decisions_surfaced",
      "status": "pass",
      "evidence": "convenience features (SSO passthrough, persistent sessions, silent re-auth) are trust decisions — surface each one"
    },
    {
      "section": "trust_inventory",
      "check": "network_not_trusted_as_internal",
      "status": "pass",
      "evidence": "the network is always hostile in your analysis, even 'internal' networks — 'inside the firewall' is not an identity"
    },
    {
      "section": "honest_limits",
      "check": "compromised_endpoint_limit_acknowledged",
      "status": "pass",
      "evidence": "honest limit: zero-trust does not fix a compromised endpoint — if the client device is owned, no architecture above it holds"
    },
    {
      "section": "honest_limits",
      "check": "usability_tradeoff_stated",
      "status": "pass",
      "evidence": "usability and zero-trust are in tension (no password recovery IS the guarantee) — say what the user gives up, not just what they gain"
    },
    {
      "section": "honest_limits",
      "check": "design_claims_only_acknowledged",
      "status": "pass",
      "evidence": "this skill evaluates design claims — the verdict is over the declared design evidence, not a live audit of the running system"
    }
  ],
  "claim_status": "sustained_on_declared_evidence",
  "secret_length_margin_chars": "0.0000",
  "summary": "26 pass, 0 fail, 0 missing of 26 checks across six sections.",
  "stamp": "ZERO TRUST EVALUATION VERDICT\nsystem: production-auth-service\nVERDICT: CLAIM_SUSTAINED\n  claim_and_scope                  pass\n  authentication_and_server_trust  pass\n  identity_and_authenticator_strength pass\n  privilege_segmentation_and_verification pass\n  trust_inventory                  pass\n  honest_limits                    pass\n26 pass, 0 fail, 0 missing of 26 checks across six sections."
}
```

### Example 2 — violations (recorded HTTP 200)

Recorded case note: Multiple red-line violations triggered.

Input:

```json
{
  "system": "flawed-service",
  "evaluation": {
    "claim_stated": true,
    "adversaries_named": true,
    "out_of_scope_named": true,
    "not_certification_acknowledged": true
  },
  "gauntlet": {
    "authentication_point_identified": true,
    "session_trusted_indefinitely": true,
    "master_secret_leaves_client": false,
    "server_sees_only_encrypted_data": true,
    "server_breach_exposes_user_data": false
  },
  "identity": {
    "checked_before_access": true,
    "proof_method_named": true
  },
  "cryptography": {
    "password_kdf": "sha256",
    "minimum_secret_length_chars": 8,
    "claims_nist_alignment": false
  },
  "findings": {
    "least_privilege_evaluated": true,
    "credential_exceeds_job": true,
    "blast_radius_bounded": true,
    "flat_network": true,
    "trust_rechecked_after_login": true
  },
  "inventory": {
    "trusted_components_inventoried": true,
    "backdoors_present": false,
    "convenience_decisions_surfaced": true,
    "internal_network_trusted": true
  },
  "limits": {
    "compromised_endpoint_limit_acknowledged": true,
    "usability_tradeoff_stated": true,
    "design_claims_only_acknowledged": true
  }
}
```

Response (REST):

```json
{
  "service": "zero-trust-evaluation-verdict",
  "atom_version": "0.1.0",
  "system": "flawed-service",
  "verdict": "CLAIM_NOT_SUSTAINED",
  "sections": {
    "claim_and_scope": "pass",
    "authentication_and_server_trust": "fail",
    "identity_and_authenticator_strength": "fail",
    "privilege_segmentation_and_verification": "fail",
    "trust_inventory": "fail",
    "honest_limits": "pass"
  },
  "checks": [
    {
      "section": "claim_and_scope",
      "check": "claim_stated_verbatim",
      "status": "pass",
      "evidence": "the zero-trust claim under evaluation is stated — alignment is a claim about which controls are implemented, not a certificate"
    },
    {
      "section": "claim_and_scope",
      "check": "adversaries_named",
      "status": "pass",
      "evidence": "a system is zero-trust only against the adversaries it names"
    },
    {
      "section": "claim_and_scope",
      "check": "out_of_scope_named",
      "status": "pass",
      "evidence": "who is out of scope is named honestly (zerok names compromised client OS and physical access as out of scope)"
    },
    {
      "section": "claim_and_scope",
      "check": "evaluation_not_certification_acknowledged",
      "status": "pass",
      "evidence": "honest limit: this skill evaluates design claims — it does not replace a security audit, penetration test, or formal certification"
    },
    {
      "section": "authentication_and_server_trust",
      "check": "authentication_point_identified",
      "status": "pass",
      "evidence": "gauntlet: where does authentication happen? The authentication point is identified"
    },
    {
      "section": "authentication_and_server_trust",
      "check": "session_not_trusted_indefinitely",
      "status": "fail",
      "evidence": "gauntlet: if the server authenticates you and then trusts the session indefinitely, that's perimeter thinking with extra steps"
    },
    {
      "section": "authentication_and_server_trust",
      "check": "master_secret_never_leaves_client",
      "status": "pass",
      "evidence": "gauntlet: what does the server know? In a true zero-trust design the server holds no secrets it could abuse (mykey: master password never leaves the machine)"
    },
    {
      "section": "authentication_and_server_trust",
      "check": "server_sees_only_encrypted_data",
      "status": "pass",
      "evidence": "gauntlet: the server sees only encrypted data (zerok: storage server sees only encrypted blobs — no plaintext, no recoverable keys)"
    },
    {
      "section": "authentication_and_server_trust",
      "check": "server_breach_does_not_expose_user_data",
      "status": "pass",
      "evidence": "gauntlet: what survives a server breach? If breaching the server exposes user data, the trust was placed in the server — the opposite of zero-trust"
    },
    {
      "section": "identity_and_authenticator_strength",
      "check": "identity_checked_before_access",
      "status": "pass",
      "evidence": "identity-based access: what identity does this system check before granting access?"
    },
    {
      "section": "identity_and_authenticator_strength",
      "check": "identity_proof_method_named",
      "status": "pass",
      "evidence": "identity-based access: how is that identity proven? The proof method is named"
    },
    {
      "section": "identity_and_authenticator_strength",
      "check": "password_kdf_is_argon2id",
      "status": "fail",
      "evidence": "NIST notes: Argon2id is the NIST-preferred password-hashing/KDF choice — prefer it over PBKDF2 and never over raw SHA-256 (not a KDF)"
    },
    {
      "section": "identity_and_authenticator_strength",
      "check": "minimum_secret_length_meets_stated_minimum",
      "status": "fail",
      "evidence": "NIST notes: CISA guidance — enforce meaningful minimum entropy (mykey: 16 characters); length beats complexity rules"
    },
    {
      "section": "identity_and_authenticator_strength",
      "check": "nist_controls_named_when_alignment_claimed",
      "status": "pass",
      "evidence": "no NIST alignment claimed"
    },
    {
      "section": "privilege_segmentation_and_verification",
      "check": "least_privilege_evaluated",
      "status": "pass",
      "evidence": "least privilege evaluated: every identity gets the minimum access needed, for the minimum time needed"
    },
    {
      "section": "privilege_segmentation_and_verification",
      "check": "credential_scope_within_job",
      "status": "fail",
      "evidence": "least privilege: can this credential do more than its job requires? It must not"
    },
    {
      "section": "privilege_segmentation_and_verification",
      "check": "breach_blast_radius_bounded",
      "status": "pass",
      "evidence": "micro-segmentation: if this component is breached, what else falls with it? The blast radius is bounded"
    },
    {
      "section": "privilege_segmentation_and_verification",
      "check": "network_not_flat",
      "status": "fail",
      "evidence": "micro-segmentation: a flat network where one breach means total breach is not zero-trust"
    },
    {
      "section": "privilege_segmentation_and_verification",
      "check": "trust_rechecked_after_login",
      "status": "pass",
      "evidence": "continuous verification: what happens after the initial login — is anything ever re-checked? Sessions expire, tokens rotate, anomalous behavior re-triggers authentication"
    },
    {
      "section": "trust_inventory",
      "check": "trusted_components_inventoried",
      "status": "pass",
      "evidence": "trust is a vulnerability: every trusted component is an attack surface — inventory them before praising the architecture"
    },
    {
      "section": "trust_inventory",
      "check": "backdoors_named_explicitly",
      "status": "pass",
      "evidence": "no backdoor (recovery / override / escrow) declared"
    },
    {
      "section": "trust_inventory",
      "check": "convenience_trust_decisions_surfaced",
      "status": "pass",
      "evidence": "convenience features (SSO passthrough, persistent sessions, silent re-auth) are trust decisions — surface each one"
    },
    {
      "section": "trust_inventory",
      "check": "network_not_trusted_as_internal",
      "status": "fail",
      "evidence": "the network is always hostile in your analysis, even 'internal' networks — 'inside the firewall' is not an identity"
    },
    {
      "section": "honest_limits",
      "check": "compromised_endpoint_limit_acknowledged",
      "status": "pass",
      "evidence": "honest limit: zero-trust does not fix a compromised endpoint — if the client device is owned, no architecture above it holds"
    },
    {
      "section": "honest_limits",
      "check": "usability_tradeoff_stated",
      "status": "pass",
      "evidence": "usability and zero-trust are in tension (no password recovery IS the guarantee) — say what the user gives up, not just what they gain"
    },
    {
      "section": "honest_limits",
      "check": "design_claims_only_acknowledged",
      "status": "pass",
      "evidence": "this skill evaluates design claims — the verdict is over the declared design evidence, not a live audit of the running system"
    }
  ],
  "claim_status": "not_sustained_on_declared_evidence",
  "secret_length_margin_chars": "-8.0000",
  "summary": "20 pass, 6 fail, 0 missing of 26 checks across six sections.",
  "stamp": "ZERO TRUST EVALUATION VERDICT\nsystem: flawed-service\nVERDICT: CLAIM_NOT_SUSTAINED\n  claim_and_scope                  pass\n  authentication_and_server_trust  fail\n  identity_and_authenticator_strength fail\n  privilege_segmentation_and_verification fail\n  trust_inventory                  fail\n  honest_limits                    pass\n20 pass, 6 fail, 0 missing of 26 checks across six sections."
}
```

### Example 3 — malformed (recorded HTTP 422)

Recorded case note: Type mismatch for evaluation field triggers 422.

Input:

```json
{
  "system": "malformed-test",
  "evaluation": "not-an-object"
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "evaluation",
  "detail": "evaluation must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Y — Tutorial, How-to guides, Reference, Explanation all present |
| Role views present | Integrators Y · Developers Y · Ops Y · Regulators Y (security/compliance-facing — the verdict is evaluation evidence over a system's zero-trust claim (identity, authenticator strength — Argon2id, 16-character minimum — privilege segmentation, trust inventory, honest limits); it evaluates design claims only and is explicitly not a security certification.) |
| Checks named count vs recorded count | 26 / 26 — every check in the recorded full-pass response is documented |
| Verdict vocabulary complete | Y — 3 verdict values plus section/per-item statuses documented |
| Input reference typed | Y — 29 field rows, each with a type (SERVICE.md field table + recorded input schema) |
| Worked examples verbatim-verified | Y — full-pass, violations and malformed inputs and REST responses parsed from this file and compared as JSON values against `verification/work/zero-trust-evaluation-verdict/evidence.json` |

