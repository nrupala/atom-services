# Zero trust evaluation verdict — user guide

## What it does

You have a zero-trust claim for a system — never trust, always verify,
identity-based access, least privilege, continuous verification. This
atom reads a short evidence manifest: the evaluation pack declaring
the claim, its adversaries and scope, the authentication gauntlet, the
identity and authenticator-strength posture, the privilege /
segmentation / re-verification findings, the trust inventory, and the
honest limits — and returns one deterministic verdict across 26
checks in six sections: **CLAIM_SUSTAINED**, **CLAIM_NOT_SUSTAINED**,
or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Two checks are computed from your
declared values, using only what the underlying skill states: the
password KDF passes only when it is exactly `argon2id` (the
NIST-preferred choice), and the minimum secret length passes at or
above the stated **16 characters**. Everything else is your declared
posture, audited — the atom does not probe a running system, read
configurations, or test credentials, and the verdict is an
evaluation, **not a security certification**. Same manifest in → same
verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "zero-trust-evaluation-verdict"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/zero-trust-evaluation-verdict`
  — tool name `zero_trust_evaluation_verdict`; `tools/call`
  arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/zero-trust-evaluation-verdict`
  — body = the manifest object; same `Authorization` header.

## Input — the zero-trust evaluation manifest

All fields are booleans unless noted.

| Field | Meaning |
|---|---|
| `system` | system name (string; carried into the output, not itself checked) |
| `evaluation.claim_stated`, `evaluation.adversaries_named`, `evaluation.out_of_scope_named`, `evaluation.not_certification_acknowledged` | claim & scope |
| `gauntlet.authentication_point_identified`, `gauntlet.session_trusted_indefinitely` (must be `false`), `gauntlet.master_secret_leaves_client` (must be `false`), `gauntlet.server_sees_only_encrypted_data`, `gauntlet.server_breach_exposes_user_data` (must be `false`) | authentication & server trust (the gauntlet) |
| `identity.checked_before_access`, `identity.proof_method_named` | identity |
| `cryptography.password_kdf` (string; must be `"argon2id"`), `cryptography.minimum_secret_length_chars` (number; must be ≥ 16), `cryptography.claims_nist_alignment`, `cryptography.nist_controls_named` (required when NIST alignment is claimed; otherwise the check passes as not applicable) | authenticator strength (the two computed checks live here) |
| `findings.least_privilege_evaluated`, `findings.credential_exceeds_job` (must be `false`), `findings.blast_radius_bounded`, `findings.flat_network` (must be `false`), `findings.trust_rechecked_after_login` | privilege, segmentation & verification |
| `inventory.trusted_components_inventoried`, `inventory.backdoors_present`, `inventory.backdoors_named` (required when a backdoor is present; otherwise the check passes as not applicable), `inventory.convenience_decisions_surfaced`, `inventory.internal_network_trusted` (must be `false`) | trust inventory |
| `limits.compromised_endpoint_limit_acknowledged`, `limits.usability_tradeoff_stated`, `limits.design_claims_only_acknowledged` | honest limits |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false / invalid, a KDF
other than `argon2id`, or a minimum secret length below 16 = the
check fails (counts toward CLAIM_NOT_SUSTAINED).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/zero-trust-evaluation-verdict`:

```json
{
  "system": "production-auth-service",
  "evaluation": {"claim_stated": true, "adversaries_named": true, "out_of_scope_named": true, "not_certification_acknowledged": true},
  "gauntlet": {"authentication_point_identified": true, "session_trusted_indefinitely": false, "master_secret_leaves_client": false, "server_sees_only_encrypted_data": true, "server_breach_exposes_user_data": false},
  "identity": {"checked_before_access": true, "proof_method_named": true},
  "cryptography": {"password_kdf": "argon2id", "minimum_secret_length_chars": 16, "claims_nist_alignment": true, "nist_controls_named": true},
  "findings": {"least_privilege_evaluated": true, "credential_exceeds_job": false, "blast_radius_bounded": true, "flat_network": false, "trust_rechecked_after_login": true},
  "inventory": {"trusted_components_inventoried": true, "backdoors_present": false, "convenience_decisions_surfaced": true, "internal_network_trusted": false},
  "limits": {"compromised_endpoint_limit_acknowledged": true, "usability_tradeoff_stated": true, "design_claims_only_acknowledged": true}
}
```

Response — HTTP 200 (trimmed; the full response carries all 26 checks
and a text stamp of the verdict):

```json
{
  "service": "zero-trust-evaluation-verdict",
  "atom_version": "0.1.0",
  "system": "production-auth-service",
  "verdict": "CLAIM_SUSTAINED",
  "sections": {"claim_and_scope": "pass", "authentication_and_server_trust": "pass", "identity_and_authenticator_strength": "pass", "privilege_segmentation_and_verification": "pass", "trust_inventory": "pass", "honest_limits": "pass"},
  "claim_status": "sustained_on_declared_evidence",
  "secret_length_margin_chars": "0.0000",
  "summary": "26 pass, 0 fail, 0 missing of 26 checks across six sections."
}
```

`secret_length_margin_chars` is your declared minimum minus the
stated 16, as a string with exactly four decimals (`null` when no
numeric length is declared); `claim_status` is
`sustained_on_declared_evidence` / `not_sustained_on_declared_evidence`
(`null` when either computed check cannot be completed).

## Verdicts

- **CLAIM_SUSTAINED** — every check passes, including the computed
  Argon2id KDF check and the 16-character minimum, on your declared
  evidence.
- **CLAIM_NOT_SUSTAINED** — at least one check fails; one failure
  breaks the claim, and the failing checks name the breached section.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing;
  the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
