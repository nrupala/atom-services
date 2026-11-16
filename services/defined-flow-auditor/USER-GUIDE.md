# Defined Flow Auditor — user guide

## What it does

You claim a system is zero-trust. This atom reads a short evidence
manifest describing the system's actual flows — every request
authenticated and authorized, network location never trusted, access
following identity not network, least-privilege credentials that
expire, segmented components with a bounded blast radius, sessions
that expire and tokens that rotate, a server that holds no abusable
secrets, adversaries and out-of-scope named, NIST controls named
when alignment is claimed — and returns one deterministic verdict
across seven sections with per-check evidence: **DEFINED**,
**NOT_DEFINED** (one failure breaks the claim), or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Same manifest in → same verdict
out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "defined-flow-auditor"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/defined-flow-auditor`
  — tool name `defined_flow_auditor`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/defined-flow-auditor`
  — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `system` (string) | system name; carried into the output, not itself checked |
| `auth.every_request_authenticated`, `auth.every_request_authorized`, `auth.internal_traffic_trusted` (must be `false`) | never trust, always verify |
| `identity.access_follows_identity`, `identity.checked_before_access`, `identity.proof_method_named` | identity-based access |
| `privilege.minimum_access`, `privilege.access_expires`, `privilege.credential_exceeds_job` (must be `false`) | least privilege |
| `segmentation.components_segmented`, `segmentation.blast_radius_bounded`, `segmentation.flat_network` (must be `false`) | micro-segmentation |
| `verification.sessions_expire`, `verification.tokens_rotate`, `verification.anomalies_retrigger_auth` | continuous verification |
| `gauntlet.server_holds_plaintext_or_keys` (must be `false`), `gauntlet.server_breach_exposes_user_data` (must be `false`), `gauntlet.trusted_components_inventoried`, `gauntlet.convenience_decisions_surfaced`, `gauntlet.backdoors_present`, `gauntlet.backdoors_named` (required when a backdoor is present; otherwise passes as not applicable) | claim gauntlet |
| `scope.adversaries_named`, `scope.out_of_scope_named`, `scope.compromised_endpoint_limit_acknowledged`, `scope.claims_nist_alignment`, `scope.nist_controls_named` (required when NIST alignment is claimed; otherwise passes as not applicable) | scope and limits |

A field **absent** = evidence missing (counts toward
INSUFFICIENT_EVIDENCE). A field present but false/invalid = the
section fails (counts toward NOT_DEFINED).

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/defined-flow-auditor`:

```json
{
  "system": "production-cluster-alpha",
  "auth": {
    "every_request_authenticated": true,
    "every_request_authorized": true,
    "internal_traffic_trusted": false
  },
  "identity": {
    "access_follows_identity": true,
    "checked_before_access": true,
    "proof_method_named": true
  },
  "privilege": {
    "minimum_access": true,
    "access_expires": true,
    "credential_exceeds_job": false
  },
  "segmentation": {
    "components_segmented": true,
    "blast_radius_bounded": true,
    "flat_network": false
  },
  "verification": {
    "sessions_expire": true,
    "tokens_rotate": true,
    "anomalies_retrigger_auth": true
  },
  "gauntlet": {
    "server_holds_plaintext_or_keys": false,
    "server_breach_exposes_user_data": false,
    "trusted_components_inventoried": true,
    "convenience_decisions_surfaced": true,
    "backdoors_present": false
  },
  "scope": {
    "adversaries_named": true,
    "out_of_scope_named": true,
    "compromised_endpoint_limit_acknowledged": true,
    "claims_nist_alignment": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries every check
and a text stamp of the verdict):

```json
{
  "service": "defined-flow-auditor",
  "atom_version": "0.1.0",
  "system": "production-cluster-alpha",
  "verdict": "DEFINED",
  "sections": {"never_trust_always_verify": "pass", "identity_based_access": "pass", "least_privilege": "pass", "micro_segmentation": "pass", "continuous_verification": "pass", "claim_gauntlet": "pass", "scope_and_limits": "pass"},
  "summary": "24 pass, 0 fail, 0 missing of 24 checks across seven sections."
}
```

## Verdicts

- **DEFINED** — every check passes; the defined-flow claim clears all seven sections.
- **NOT_DEFINED** — at least one check fails (one failure breaks the claim); the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
