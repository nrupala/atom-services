# Zero trust evaluation verdict — `zero-trust-evaluation-verdict`

**Deliverable type:** VERDICT. This atom sells the verdict it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Zero-trust security evaluation — never trust, always verify. Identity-based access, least privilege, continuous verification, NIST 800-63B alignment. Distilled from mykey and zerok-container.

A caller submits the inputs the bound skill works on and receives one verdict back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this verdict on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Reviewing home and product access**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the zero-trust evaluation manifest

The caller submits one JSON manifest: a declared evaluation pack for
one system's zero-trust claim. Every field below is read by the named
section's checks. A field **absent** = evidence missing
(`INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the
check fails (`CLAIM_NOT_SUSTAINED`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `system` (string; carried into the verdict output, not itself checked) | — |
| `evaluation.claim_stated` | claim_and_scope |
| `evaluation.adversaries_named` | claim_and_scope |
| `evaluation.out_of_scope_named` | claim_and_scope |
| `evaluation.not_certification_acknowledged` | claim_and_scope |
| `gauntlet.authentication_point_identified` | authentication_and_server_trust |
| `gauntlet.session_trusted_indefinitely` (must be `false` to pass — skill red line) | authentication_and_server_trust |
| `gauntlet.master_secret_leaves_client` (must be `false` to pass — skill red line) | authentication_and_server_trust |
| `gauntlet.server_sees_only_encrypted_data` | authentication_and_server_trust |
| `gauntlet.server_breach_exposes_user_data` (must be `false` to pass) | authentication_and_server_trust |
| `identity.checked_before_access` | identity_and_authenticator_strength |
| `identity.proof_method_named` | identity_and_authenticator_strength |
| `cryptography.password_kdf` (string; must be `"argon2id"` to pass — computed, see below) | identity_and_authenticator_strength |
| `cryptography.minimum_secret_length_chars` (number; must be ≥ 16 to pass — computed, see below) | identity_and_authenticator_strength |
| `cryptography.claims_nist_alignment` (gates the controls check below) | identity_and_authenticator_strength |
| `cryptography.nist_controls_named` (required when NIST alignment is claimed; otherwise the check passes as not applicable) | identity_and_authenticator_strength |
| `findings.least_privilege_evaluated` | privilege_segmentation_and_verification |
| `findings.credential_exceeds_job` (must be `false` to pass) | privilege_segmentation_and_verification |
| `findings.blast_radius_bounded` | privilege_segmentation_and_verification |
| `findings.flat_network` (must be `false` to pass) | privilege_segmentation_and_verification |
| `findings.trust_rechecked_after_login` | privilege_segmentation_and_verification |
| `inventory.trusted_components_inventoried` | trust_inventory |
| `inventory.backdoors_present` (gates the naming check below) | trust_inventory |
| `inventory.backdoors_named` (required when a backdoor is present; otherwise the check passes as not applicable) | trust_inventory |
| `inventory.convenience_decisions_surfaced` | trust_inventory |
| `inventory.internal_network_trusted` (must be `false` to pass) | trust_inventory |
| `limits.compromised_endpoint_limit_acknowledged` | honest_limits |
| `limits.usability_tradeoff_stated` | honest_limits |
| `limits.design_claims_only_acknowledged` | honest_limits |

Two checks are computed from the declared values, using only what
the skill itself states — no outside threshold is imported:

- **Password KDF:** the skill's NIST notes state Argon2id is the
  NIST-preferred password-hashing/KDF choice, preferred over PBKDF2
  and never over raw SHA-256 (not a KDF). The declared
  `cryptography.password_kdf` therefore passes only when it is
  exactly `"argon2id"`; any other declared value fails.
- **Minimum secret length:** the skill's NIST notes state the CISA
  guidance mykey implements — a minimum of **16 characters**. The
  declared `cryptography.minimum_secret_length_chars` passes at or
  above 16 and fails below it; equality passes, because the skill
  states a minimum, not a margin above it. An absent value is
  missing evidence, not a failure; a present value of the wrong
  type is rejected as invalid input.

The output also reports the computed `claim_status`
(`sustained_on_declared_evidence` / `not_sustained_on_declared_evidence`
/ null when either computed check cannot be completed) and
`secret_length_margin_chars` — the declared minimum length minus the
stated 16 (null when no numeric length is declared). **Fixed
serialization rule:** the margin is reported as a string with exactly
four decimal places, produced in both implementations by the same
rule — round half up to 4dp, `floor(v * 10000 + 0.5) / 10000`, then
format with exactly four decimals; comparisons use the unrounded
values. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical.

The verdict is one of `CLAIM_SUSTAINED` (all 26 checks pass),
`CLAIM_NOT_SUSTAINED` (any check fails — the skill's gauntlet rule:
one failure breaks the claim), or `INSUFFICIENT_EVIDENCE` (nothing
fails but evidence is missing), across six sections: claim_and_scope,
authentication_and_server_trust,
identity_and_authenticator_strength,
privilege_segmentation_and_verification, trust_inventory,
honest_limits.

## Honest scoping

This atom evaluates **declared** evidence about a design claim — it
does not probe a running system, read configurations, test
credentials, or verify that a declared value is true. A claim is
sustained *on the caller's declared evidence*: a system that declares
Argon2id and a 16-character minimum passes those checks even if the
deployed system does something else. It is an evaluation verdict,
**not a security certification** (the register's named doubt, and the
skill's own limit: it evaluates design claims and does not replace a
security audit, penetration test, or formal certification).

**Relationship to `defined-flow-auditor` — stated plainly:** both
atoms are built from the same bound skill (`zero-trust`), and the
skill's ground genuinely overlaps. `defined-flow-auditor` (CHECK)
audits declared *flows* against the five principles section by
section (24 checks over `auth` / `identity` / `privilege` /
`segmentation` / `verification` / `gauntlet` / `scope` fields). This
atom is the *evaluation verdict* deliverable over an evaluation pack:
its distinct ground is the skill's evaluation framing — the claim as
stated, the not-a-certification acknowledgement, the gauntlet's
server-knowledge questions in their product form (master secret never
leaves the client; server sees only encrypted data), the NIST
authenticator-strength section the auditor does not compute (the
Argon2id KDF check and the stated 16-character minimum, both
computed), and the usability trade-off statement. Where the two atoms
cover the same principle (least privilege, blast radius / flat
network, re-verification after login, backdoor naming, trusted-component
inventory, compromised-endpoint limit), that is the skill offering the
same ground twice, not two different findings — a caller who needs
per-principle flow detail wants the auditor; a caller who needs one
verdict on a claim, with the NIST arithmetic settled, wants this atom.

Named exclusions: no authenticator-strength scoring beyond the two
stated items (the skill names no AAL levels, entropy formula, or
session/token lifetimes, so none are invented); no check of *which*
NIST controls are named, only that they are named when alignment is
claimed; no live verification of any declared fact.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **built-locally** — deterministic core, Python oracle
and TypeScript port built and parity-proven locally; no endpoint is
live. Release happens one by one, by the owner's GO, per the approved
queue.

## Named doubt (from the register)

Evaluation only, not a certification
