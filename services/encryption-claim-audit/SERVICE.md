# Encryption claim audit — `encryption-claim-audit`

**Deliverable type:** CHECK. This atom sells the check it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Practical encryption guidance — what to encrypt, key management basics, authenticated encryption, KDF choice, and how to spot weak crypto claims. Grounded in zerok-container and mykey.

A caller submits the inputs the bound skill works on and receives one check back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this check on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Release-gate crypto review for products**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier A · status: **scaffolded** — service unit generated from the register; no endpoint is live. Release happens one by one, by the owner's GO, per the approved queue.

## Named doubt (from the register)

Standard constructions; differentiation is checklist

## Inputs — the encryption-evidence manifest

| Field | Read by |
|---|---|
| `product` | output (named in the verdict) |
| `claims.algorithm` | claim_specificity, standard_construction |
| `claims.mode` | claim_specificity, standard_construction |
| `claims.key_length_bits` | claim_specificity, standard_construction |
| `claims.vague_marketing_terms_used` | claim_specificity |
| `claims.end_to_end_encrypted` | claim_consistency |
| `claims.zero_knowledge` | claim_consistency |
| `construction.authenticated_encryption` | standard_construction |
| `construction.custom_crypto` | standard_construction |
| `construction.nonce_unique_per_key` | standard_construction |
| `asymmetric.applies` | standard_construction |
| `asymmetric.key_exchange` | standard_construction |
| `asymmetric.signatures` | standard_construction |
| `key_management.keys_from_csprng` | key_management |
| `key_management.keys_hardcoded` | key_management |
| `key_management.storage` | key_management |
| `key_management.rotation_planned` | key_management |
| `key_management.recovery_story_documented` | key_management |
| `password_derivation.applies` | derivation_and_randomness |
| `password_derivation.kdf` | derivation_and_randomness |
| `password_derivation.salt_unique_random_per_key` | derivation_and_randomness |
| `password_derivation.password_used_directly_as_key` | derivation_and_randomness |
| `randomness.source` | derivation_and_randomness |
| `coverage.transport.tls_version` | coverage |
| `coverage.transport.plaintext_fallback` | coverage |
| `coverage.at_rest.encrypted` | coverage |
| `coverage.at_rest.key_stored_with_data` | coverage |
| `coverage.in_use.plaintext_logged` | coverage |
| `coverage.in_use.plaintext_in_crash_dumps` | coverage |
| `coverage.fails_closed_on_crypto_error` | coverage |
| `access.server_can_read_plaintext` | claim_consistency |
| `access.server_holds_decryption_keys` | claim_consistency |

A field **absent** = evidence missing (`INSUFFICIENT_EVIDENCE` if nothing
fails). A field present but false / invalid = the check fails
(`CLAIMS_UNSOUND`). All checks pass = `CLAIMS_SOUND`. When
`asymmetric.applies` or `password_derivation.applies` is false, the
dependent checks in that group pass as not applicable.
