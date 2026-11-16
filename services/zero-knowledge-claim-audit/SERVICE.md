# Zero knowledge claim audit — `zero-knowledge-claim-audit`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Zero-knowledge principles for software — the server learns nothing. Client-side encryption, proof without revelation, when ZK matters vs when it's theater. Distilled from zerok-container.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Auditing vault and zerok claims**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **live** — live on Conduit Atoms (atoms.pipavia.com) as a release candidate since 2026-11-15, one-week soak to 2026-11-22.

## Named doubt (from the register)

Evaluation only, not a certification

## Inputs — the zero-knowledge-evidence manifest

| Field | Read by |
|---|---|
| `product` | output (named in the verdict) |
| `claims.claim_basis` | core_test |
| `access.server_can_read_user_data` | core_test |
| `storage.server_stores_only_opaque_bytes` | core_test |
| `encryption.encryption_happens_on_client_device` | client_side_encryption |
| `encryption.plaintext_exists_only_on_client_device` | client_side_encryption |
| `encryption.authenticated_encryption` | client_side_encryption |
| `encryption.relies_on_tls_alone` | client_side_encryption |
| `keys.keys_never_leave_device` | key_journey |
| `keys.key_derivation_client_side` | key_journey |
| `keys.key_journey_documented` | key_journey |
| `keys.key_backup_uploads_key_to_server` | key_journey |
| `trust.key_escrow` | trusted_parties_and_recovery |
| `trust.recovery_backdoor` | trusted_parties_and_recovery |
| `trust.admin_plaintext_view` | trusted_parties_and_recovery |
| `trust.trusted_components` | trusted_parties_and_recovery |
| `trust.trusted_third_parties_in_data_path` | trusted_parties_and_recovery |
| `recovery.password_reset_recovers_data` | trusted_parties_and_recovery |
| `recovery.no_recovery_possible_claimed` | trusted_parties_and_recovery |
| `scope.plaintext_locations_documented` | plaintext_and_metadata_scope |
| `scope.plaintext_in_logs` | plaintext_and_metadata_scope |
| `scope.plaintext_in_crash_dumps` | plaintext_and_metadata_scope |
| `scope.plaintext_in_thumbnails_or_previews` | plaintext_and_metadata_scope |
| `scope.metadata_leakage_acknowledged` | plaintext_and_metadata_scope |
| `scope.residual_risks_documented` | plaintext_and_metadata_scope |
| `theater.client_type` | theater_and_threat_model |
| `theater.web_app_trust_distinction_acknowledged` | theater_and_threat_model |
| `theater.search_or_indexing_requires_server_plaintext_or_tokens` | theater_and_threat_model |
| `theater.threat_model_includes_malicious_operator` | theater_and_threat_model |

A field **absent** = evidence missing (`INSUFFICIENT_EVIDENCE` if nothing
fails). A field present but false / invalid = the check fails
(`CLAIMS_UNSOUND`). All 27 checks pass across the six sections =
`CLAIMS_SOUND`. `trust.trusted_components` passes only when the declared
list includes `client`, `operating_system` and `distribution_channel`
(the skill: name every trusted component explicitly, including the client
itself, the OS, and the distribution channel).
`trust.trusted_third_parties_in_data_path` passes for any declared list —
an empty list declares no trusted third party; a non-empty list names
them. The recovery-consistency check needs both `recovery.*` fields:
declaring both password-reset recovery and "no recovery is possible"
fails, because the skill states the two cannot both be true. The web-app
check is conditional: only a `client_type` of
`web_app_served_by_same_server` must also declare
`web_app_trust_distinction_acknowledged`.

## Honest scoping — what this audit does NOT do

- **Declared claims only.** This is an audit of the consistency and
  completeness of *declared* claims and *declared* evidence. It does not
  inspect a running system, read its code, or test whether the declared
  posture is true in operation.
- **No proof verification.** This atom does not verify any cryptographic
  proof, and it is not a privacy certification (the register's named
  doubt). The bound skill evaluates design claims; it does not replace a
  cryptographic review or a formal security audit.
- **Zero-knowledge proof systems are excluded, by name:** proof systems,
  trusted setups, circuits and constraint systems are NOT checked,
  because the bound skill states no facts or thresholds about them — it
  is about zero-knowledge *software architecture* (client-side
  encryption, keys that never leave the device, a server that stores
  only opaque bytes). Inventing proof-system checks the skill does not
  state would be fabrication, so they are out of scope until the skill
  itself is refined to cover them (R1).
- **No invented thresholds.** No key length, KDF, algorithm or iteration
  threshold is checked: the bound skill names none for this architecture
  audit (that specificity belongs to the sibling `encryption-claim-audit`
  atom). `claim_basis` is checked only against the skill's own
  distinction — `cryptographic_guarantee` ("can't read") vs a policy
  promise ("won't read").
- **Honest limits carried from the skill:** zero-knowledge does not
  protect against a compromised client device, malware, or physical
  access to an unlocked device, and it does not hide *that* data is
  stored, how much, or when it is accessed — only *what* it contains.
  Those limits are why metadata acknowledgement and documented residual
  risks are checks, not footnotes.
