# Defined-flow auditor — `defined-flow-auditor`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Zero-trust security evaluation — never trust, always verify. Identity-based access, least privilege, continuous verification, NIST 800-63B alignment. Distilled from mykey and zerok-container.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one service call.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Guardian Mesh audits of our systems**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **call**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Inputs — the zero-trust evidence manifest

The caller submits one JSON manifest. Every field below is read by the
named section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`NOT_DEFINED`). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `system` (string; carried into the verdict output, not itself checked) | — |
| `auth.every_request_authenticated` | never_trust_always_verify |
| `auth.every_request_authorized` | never_trust_always_verify |
| `auth.internal_traffic_trusted` (must be `false` to pass) | never_trust_always_verify |
| `identity.access_follows_identity` | identity_based_access |
| `identity.checked_before_access` | identity_based_access |
| `identity.proof_method_named` | identity_based_access |
| `privilege.minimum_access` | least_privilege |
| `privilege.access_expires` | least_privilege |
| `privilege.credential_exceeds_job` (must be `false` to pass) | least_privilege |
| `segmentation.components_segmented` | micro_segmentation |
| `segmentation.blast_radius_bounded` | micro_segmentation |
| `segmentation.flat_network` (must be `false` to pass) | micro_segmentation |
| `verification.sessions_expire` | continuous_verification |
| `verification.tokens_rotate` | continuous_verification |
| `verification.anomalies_retrigger_auth` | continuous_verification |
| `gauntlet.server_holds_plaintext_or_keys` (must be `false` to pass) | claim_gauntlet |
| `gauntlet.server_breach_exposes_user_data` (must be `false` to pass) | claim_gauntlet |
| `gauntlet.trusted_components_inventoried` | claim_gauntlet |
| `gauntlet.convenience_decisions_surfaced` | claim_gauntlet |
| `gauntlet.backdoors_present` (gates the naming check below) | claim_gauntlet |
| `gauntlet.backdoors_named` (required when a backdoor is present; otherwise the check passes as not applicable) | claim_gauntlet |
| `scope.adversaries_named` | scope_and_limits |
| `scope.out_of_scope_named` | scope_and_limits |
| `scope.compromised_endpoint_limit_acknowledged` | scope_and_limits |
| `scope.claims_nist_alignment` (gates the controls check below) | scope_and_limits |
| `scope.nist_controls_named` (required when NIST alignment is claimed; otherwise the check passes as not applicable) | scope_and_limits |

The verdict is one of `DEFINED` (all 24 checks pass), `NOT_DEFINED`
(any check fails — one failure breaks the claim), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across seven sections: never_trust_always_verify,
identity_based_access, least_privilege, micro_segmentation,
continuous_verification, claim_gauntlet, scope_and_limits.

## Status

Tier A · status: **scaffolded** — service unit generated from the register; no endpoint is live. Release happens one by one, by the owner's GO, per the approved queue.

## Named doubt (from the register)

Guardian Mesh capabilities are spec inputs until behaviour-proven
