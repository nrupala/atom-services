# Encryption claim audit — user guide

## What it does

You make (or are reviewing) encryption claims for a product. This atom reads a short evidence manifest describing the claims and the construction behind them — claim specificity, standard construction, key management, derivation and randomness, coverage, and claim consistency — and returns one deterministic verdict across six sections with per-check evidence. It spots weak or vague crypto claims: the symmetric construction must be AES-256-GCM (`claims.algorithm` = `AES`, `claims.mode` = `GCM`, `claims.key_length_bits` = 256), asymmetric key exchange `X25519` with `Ed25519` signatures, key storage `platform_keystore` or `memory_only`, and randomness source `os_csprng`: **CLAIMS_SOUND**, **CLAIMS_UNSOUND**, or
**INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing —
the verdict names exactly which). Same manifest in → same verdict out;
it is built to be used as a gate. A field **absent** = evidence missing
(counts toward INSUFFICIENT_EVIDENCE). A field present but
false/invalid = the check fails (counts toward CLAIMS_UNSOUND).

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your
   email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key
   for this atom: `POST /v1/keys` with `{"atom": "encryption-claim-audit"}`.
   One gateway key works across atoms; each atom's scope is granted on
   the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/encryption-claim-audit`
  — tool name `encryption_claim_audit`; `tools/call` arguments = the
  manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/encryption-claim-audit`
  — body = the manifest object; same `Authorization` header.

## Input — the evidence manifest

| Field | Meaning |
|---|---|
| `product` | product name; named in the verdict |
| `claims.algorithm`, `.mode`, `.key_length_bits`, `.vague_marketing_terms_used`, `.end_to_end_encrypted`, `.zero_knowledge` | the claims themselves; sound symmetric claim is algorithm `AES`, mode `GCM`, 256 bits |
| `construction.authenticated_encryption`, `.custom_crypto`, `.nonce_unique_per_key` | construction; custom crypto must be `false` |
| `asymmetric.applies`, `.key_exchange`, `.signatures` | asymmetric cryptography; standard is `X25519` + `Ed25519` (dependent checks pass as not-applicable when `applies` is `false`) |
| `key_management.keys_from_csprng`, `.keys_hardcoded`, `.storage`, `.rotation_planned`, `.recovery_story_documented` | key management; storage is `platform_keystore` or `memory_only`; hardcoded keys must be `false` |
| `password_derivation.applies`, `.kdf`, `.salt_unique_random_per_key`, `.password_used_directly_as_key` | password derivation; KDF is `Argon2id` (or `PBKDF2`); passwords never used directly as keys |
| `randomness.source` | must be `os_csprng` |
| `coverage.transport.tls_version`, `.plaintext_fallback`, `coverage.at_rest.encrypted`, `.key_stored_with_data`, `coverage.in_use.plaintext_logged`, `.plaintext_in_crash_dumps`, `coverage.fails_closed_on_crypto_error` | coverage across transport (TLS 1.2+), at rest, and in use; the system must fail closed on crypto error |
| `access.server_can_read_plaintext`, `.server_holds_decryption_keys` | claim consistency — checked against any end-to-end / zero-knowledge claims |

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/encryption-claim-audit`:

```json
{
 "product": "SecureVault-v1",
 "claims": {
  "algorithm": "AES",
  "mode": "GCM",
  "key_length_bits": 256,
  "vague_marketing_terms_used": false,
  "end_to_end_encrypted": true,
  "zero_knowledge": true
 },
 "construction": {
  "authenticated_encryption": true,
  "custom_crypto": false,
  "nonce_unique_per_key": true
 },
 "asymmetric": {
  "applies": true,
  "key_exchange": "X25519",
  "signatures": "Ed25519"
 },
 "key_management": {
  "keys_from_csprng": true,
  "keys_hardcoded": false,
  "storage": "platform_keystore",
  "rotation_planned": true,
  "recovery_story_documented": true
 },
 "password_derivation": {
  "applies": true,
  "kdf": "Argon2id",
  "salt_unique_random_per_key": true,
  "password_used_directly_as_key": false
 },
 "randomness": {
  "source": "os_csprng"
 },
 "coverage": {
  "transport": {
   "tls_version": "1.3",
   "plaintext_fallback": false
  },
  "at_rest": {
   "encrypted": true,
   "key_stored_with_data": false
  },
  "in_use": {
   "plaintext_logged": false,
   "plaintext_in_crash_dumps": false
  },
  "fails_closed_on_crypto_error": true
 },
 "access": {
  "server_can_read_plaintext": false,
  "server_holds_decryption_keys": false
 }
}
```

Response — HTTP 200 (trimmed; the full response carries all 28 checks
and a text stamp of the verdict):

```json
{
 "service": "encryption-claim-audit",
 "atom_version": "0.1.0",
 "product": "SecureVault-v1",
 "verdict": "CLAIMS_SOUND",
 "sections": {
  "claim_specificity": "pass",
  "standard_construction": "pass",
  "key_management": "pass",
  "derivation_and_randomness": "pass",
  "coverage": "pass",
  "claim_consistency": "pass"
 },
 "summary": "28 pass, 0 fail, 0 missing of 28 checks across six sections."
}
```

## Verdicts

- **CLAIMS_SOUND** — every check passes; the claims clear all six sections.
- **CLAIMS_UNSOUND** — at least one check fails; the failing checks name the breached section and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

Errors: `401` missing/invalid key · `403` key lacks this atom's scope ·
`422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
