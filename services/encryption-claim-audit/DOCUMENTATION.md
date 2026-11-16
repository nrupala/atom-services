# Encryption claim audit — `encryption-claim-audit`

**Display name:** Encryption claim audit · **Slug:** `encryption-claim-audit` · **Deliverable type:** CHECK · **Atom version:** 0.1.0 · **Status:** live — release candidate (one-week RC soak to 2026-11-22)

**Quick start:** [USER-GUIDE.md](USER-GUIDE.md) · **Verification evidence:** [TEST-REPORT.md](TEST-REPORT.md)

This document follows the house documentation standard (AppDocStudio PRODUCT-BRIEF standards table): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. The worked examples at the end are real recorded trial runs, reproduced verbatim from the external verification evidence.

## Tutorial

A first call, walked through end to end. This tutorial follows the recorded full-pass trial run — the exact recorded request and response are reproduced verbatim under [Worked examples](#worked-examples), Example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email), open the emailed sign-in link, then issue a key for this atom: `POST /v1/keys` with `{"atom": "encryption-claim-audit"}`. Keep the key; you send it as `Authorization: Bearer <key>` on every call. (Full detail: How-to guides, below.)

**Step 2 — Assemble the encryption-claims evidence manifest.** The manifest is one JSON object declaring the evidence the atom audits — every field is listed in the Input reference below. The recorded run's manifest declares `product`: `SecureVault-v1`. Nothing is fetched or probed by the atom: what you declare is what is judged.

**Step 3 — Call the REST endpoint.** `POST https://atoms.pipavia.com/v1/encryption-claim-audit` with the manifest as the JSON body and the `Authorization` header set.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `CLAIMS_SOUND` and the summary “28 pass, 0 fail, 0 missing of 28 checks across six sections.” — every one of the 28 checks passed. The response carries the per-section results under `sections`, the full `checks` array (each check with its `status` and the `evidence` string it was judged on), and a human-readable `stamp` restating the verdict.

**Step 5 — Use it as a gate.** `CLAIMS_SOUND` is the passing outcome. Any other verdict tells you what to do next: a failing check names the evidence against it, and a `missing` check names the field to supply (see “Read a failing verdict and fix the manifest” below). Because the core is deterministic — same manifest in, same verdict out — a corrected re-submission is a clean re-test.

## How-to guides

### Get a key and call via REST

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "encryption-claim-audit"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. This atom's key scope (namespace) is `encryption_claim_audit` — a key without this scope gets a 403 (see Errors).
3. Call `POST https://atoms.pipavia.com/v1/encryption-claim-audit` with the manifest object as the JSON body and the header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, the per-section map, the `checks` array with per-check `status` and `evidence`, the `summary`, and the text `stamp`.

### Call via MCP

1. Get a key exactly as above (the MCP surface is key-gated on this gateway too).
2. Send JSON-RPC to `POST https://atoms.pipavia.com/mcp/encryption-claim-audit` with the same `Authorization: Bearer <key>` header.
3. Call `tools/call` for the tool `encryption_claim_audit`; the call arguments are the manifest object itself (the same object you would POST to REST).
4. The tool's `structuredContent` is the same verdict object the REST face returns — recorded MCP/REST parity for the full-pass case is part of the verification evidence in TEST-REPORT.md.

### Read a failing verdict and fix the manifest

A non-passing verdict is a work list, not a dead end. Read it in this order: (1) the `verdict` — fail-type means at least one check failed, evidence-type means nothing failed but evidence is missing; (2) the section map — which sections are `fail` vs `insufficient_evidence`; (3) the `checks` array — each check's `status` (`pass` / `fail` / `missing`) and its `evidence` string, which states what was declared. Fix `fail` checks by correcting the declared value; fix `missing` checks by supplying the absent field. Then re-submit.

In the recorded violations run (Worked example 2) the verdict is `CLAIMS_UNSOUND` — 9 pass, 18 fail, 1 missing. The failing pattern is a weak-claims product (`WeakVault-v1`: `claims.algorithm` `AES-ECB`, `claims.mode` `ECB`, `claims.key_length_bits` 128, vague marketing terms used). Read it section by section:

- claim_specificity / standard_construction — name a standard construction: the recorded pass evidence is algorithm `AES`, mode `GCM`, key length 256 (`symmetric_is_aes_256_gcm`, `mode_is_not_ecb`), with authenticated encryption, no custom crypto, and unique nonces per key.
- key_management — keys from a CSPRNG, never hardcoded, stored in a keystore or memory only, with rotation planned and a documented recovery story.
- derivation_and_randomness — a real KDF (Argon2id, or PBKDF2 with high iterations), a unique random salt per key, passwords never used directly as keys, randomness from the OS CSPRNG.
- coverage — TLS 1.2+ with no plaintext fallback, encryption at rest with keys not stored with the data, plaintext never logged or put in crash dumps, and failing closed on crypto error (that last check, `fails_closed_on_crypto_failure`, was `missing` in this run — its field was absent, so supply `coverage.fails_closed_on_crypto_error` rather than changing a value).

Re-submit the corrected manifest; the same input always returns the same verdict.

### Handle a 422 invalid_input

A type-violating manifest is rejected before evaluation — you get HTTP 422, never a verdict computed over garbage. The recorded malformed run (Worked example 3) sent a manifest whose first type violation the gateway names in the response:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "product",
  "detail": "product must be a string"
}
```

Read `field` as the dotted path of the offending field and `detail` as the expected type. Fix that field's type in your manifest and re-submit; validation reports the first violation it finds, so a manifest with several type errors may need more than one pass. A 422 is not metered as a delivered verdict.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/encryption-claim-audit` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/encryption-claim-audit` — JSON-RPC; tool name `encryption_claim_audit`; `tools/call` arguments = the manifest object.
- **Key issuance:** `POST /v1/signup` then `POST /v1/keys` at https://atoms.pipavia.com (see How-to guides). Key scope namespace: `encryption_claim_audit`.

### Input reference

Every field the atom reads, grouped as SERVICE.md groups them, with its type. Types are from SERVICE.md's field table where it states them, corroborated by the gateway `inputSchema` in the recorded evidence and by the recorded full-pass manifest's actual values. A field **absent** = evidence missing (the check that reads it reports `missing`); a field present but false / invalid = the check **fails**. That distinction is deliberate and runs through every verdict this atom returns.

#### Group: output (named in the verdict)

| Field | Type | Notes |
|---|---|---|
| `product` | string | Read by: output (named in the verdict). named in the verdict; not itself a check |

#### Group: claim_specificity, standard_construction

| Field | Type | Notes |
|---|---|---|
| `claims.algorithm` | string | Read by: claim_specificity, standard_construction. |
| `claims.mode` | string | Read by: claim_specificity, standard_construction. |
| `claims.key_length_bits` | integer | Read by: claim_specificity, standard_construction. integer (recorded full-pass: 256) |

#### Group: claim_specificity

| Field | Type | Notes |
|---|---|---|
| `claims.vague_marketing_terms_used` | boolean | Read by: claim_specificity. must be `false` — vague unqualified terms are a red flag, not a credential |

#### Group: claim_consistency

| Field | Type | Notes |
|---|---|---|
| `claims.end_to_end_encrypted` | boolean | Read by: claim_consistency. |
| `claims.zero_knowledge` | boolean | Read by: claim_consistency. |
| `access.server_can_read_plaintext` | boolean | Read by: claim_consistency. read against `claims.end_to_end_encrypted` by the consistency checks |
| `access.server_holds_decryption_keys` | boolean | Read by: claim_consistency. read against `claims.zero_knowledge` by the consistency checks |

#### Group: standard_construction

| Field | Type | Notes |
|---|---|---|
| `construction.authenticated_encryption` | boolean | Read by: standard_construction. |
| `construction.custom_crypto` | boolean | Read by: standard_construction. must be `false` |
| `construction.nonce_unique_per_key` | boolean | Read by: standard_construction. |
| `asymmetric.applies` | boolean | Read by: standard_construction. |
| `asymmetric.key_exchange` | string | Read by: standard_construction. |
| `asymmetric.signatures` | string | Read by: standard_construction. |

#### Group: key_management

| Field | Type | Notes |
|---|---|---|
| `key_management.keys_from_csprng` | boolean | Read by: key_management. |
| `key_management.keys_hardcoded` | boolean | Read by: key_management. must be `false` |
| `key_management.storage` | string | Read by: key_management. string (recorded full-pass: `platform_keystore` — keystore or memory only) |
| `key_management.rotation_planned` | boolean | Read by: key_management. |
| `key_management.recovery_story_documented` | boolean | Read by: key_management. |

#### Group: derivation_and_randomness

| Field | Type | Notes |
|---|---|---|
| `password_derivation.applies` | boolean | Read by: derivation_and_randomness. |
| `password_derivation.kdf` | string | Read by: derivation_and_randomness. |
| `password_derivation.salt_unique_random_per_key` | boolean | Read by: derivation_and_randomness. |
| `password_derivation.password_used_directly_as_key` | boolean | Read by: derivation_and_randomness. must be `false` |
| `randomness.source` | string | Read by: derivation_and_randomness. string (recorded full-pass: `os_csprng`) |

#### Group: coverage

| Field | Type | Notes |
|---|---|---|
| `coverage.transport.tls_version` | string | Read by: coverage. string (recorded full-pass: `1.3`); TLS 1.2 or higher required |
| `coverage.transport.plaintext_fallback` | boolean | Read by: coverage. must be `false` |
| `coverage.at_rest.encrypted` | boolean | Read by: coverage. |
| `coverage.at_rest.key_stored_with_data` | boolean | Read by: coverage. must be `false` |
| `coverage.in_use.plaintext_logged` | boolean | Read by: coverage. must be `false` |
| `coverage.in_use.plaintext_in_crash_dumps` | boolean | Read by: coverage. must be `false` |
| `coverage.fails_closed_on_crypto_error` | boolean | Read by: coverage. |

### Checks

Every check the atom runs — 28 checks, matching the 28 entries in the recorded full-pass response's `checks` array exactly (names and sections grouping are the recorded ones; cross-checked against SERVICE.md). “Recorded pass evidence” is the `evidence` string from the recorded full-pass REST response: it states what the check read and why it passed.

Per-check status semantics, uniform across all checks unless a note says otherwise: `pass` — the declared evidence satisfies the check; `fail` — the field is present but false / invalid; `missing` — the field is absent (evidence not provided). A check whose precondition does not apply passes as not applicable — the recorded responses carry no separate not-applicable status; the `evidence` string says why it does not apply (see the noted conditional checks).

#### Section: claim_specificity

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `algorithm_named` | algorithm='AES' (skill: name the algorithm, mode, and key length) |  |
| `mode_named` | mode='GCM' (skill: name the algorithm, mode, and key length) |  |
| `key_length_stated` | key_length_bits=256 (skill: name the algorithm, mode, and key length) |  |
| `no_vague_unqualified_claim` | skill: 'military-grade encryption' without algorithm/mode/key length is a red flag, not a credential |  |
#### Section: standard_construction

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `symmetric_is_aes_256_gcm` | algorithm='AES' mode='GCM' key_length_bits=256 (skill: symmetric: AES-256-GCM) |  |
| `mode_is_not_ecb` | mode='GCM' (skill mistake: ECB mode — identical plaintext blocks give identical ciphertext blocks) |  |
| `authenticated_encryption` | skill: authenticated encryption — never raw AES-CBC without a separate MAC; ask if the ciphertext is tamper-evident |  |
| `no_custom_crypto` | skill mistake: homebrew crypto — custom ciphers, custom modes, 'improved' AES |  |
| `nonce_unique_per_key` | skill mistake: IV/nonce reuse — GCM with a reused nonce leaks the keystream; nonces must be unique per key |  |
| `asymmetric_is_standard` | key_exchange='X25519' signatures='Ed25519' (skill: X25519 for key exchange, Ed25519 for signatures) | Gated by `asymmetric.applies`. In the recorded violations run (`applies: false`) it passes with evidence “no asymmetric cryptography declared” — not-applicable is reported as `pass` with that evidence, not as a separate status. |
#### Section: key_management

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `keys_generated_from_csprng` | skill: keys come from the CSPRNG, never from passwords directly |  |
| `no_hardcoded_keys` | skill mistake: hardcoded keys or IVs — keys in source, in config, in environment dumps |  |
| `key_storage_in_keystore_or_memory` | storage='platform_keystore' (skill: keys live in the platform keystore or in memory only) |  |
| `key_rotation_planned` | skill: plan rotation before you need it — what happens to old ciphertext when the key changes? |  |
| `recovery_story_documented` | skill: the recovery story is the security story; 'no recovery possible' is a valid design when stated |  |
#### Section: derivation_and_randomness

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `kdf_is_argon2id_or_pbkdf2` | kdf='Argon2id' (skill: Argon2id; PBKDF2 acceptable with high iteration counts; raw SHA-256 is not key derivation) | Gated by `password_derivation.applies`, together with `unique_random_salt_per_key` and `password_not_used_directly_as_key`: in the recorded violations run (`applies: false`) all three pass with evidence “no password-derived keys declared”. |
| `unique_random_salt_per_key` | skill: passwords become keys through Argon2id with a unique random salt per key |  |
| `password_not_used_directly_as_key` | skill mistake: weak or missing KDF — passwords used directly as keys |  |
| `randomness_from_os_csprng` | source='os_csprng' (skill: the OS CSPRNG — never Math.random(), never a homebrew PRNG, never a hardcoded seed) |  |
#### Section: coverage

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `transport_tls_1_2_or_higher` | tls_version='1.3' (skill: TLS 1.2+ for every network hop, no exceptions) |  |
| `transport_no_plaintext_fallback` | skill: TLS 1.2+ for every network hop, no plaintext fallbacks |  |
| `at_rest_encrypted` | skill: encrypt everything stored — databases, blobs, backups, logs that might contain secrets |  |
| `key_not_stored_with_data` | skill mistake: 'encrypted' with the key next to the data is obfuscation with extra steps |  |
| `in_use_plaintext_not_logged` | skill: in use — minimize plaintext lifetime, never log it |  |
| `in_use_plaintext_not_in_crash_dumps` | skill: in use — never put plaintext in crash dumps |  |
| `fails_closed_on_crypto_failure` | skill: fail closed or open? When crypto fails, the system refuses, not proceeds unprotected |  |
#### Section: claim_consistency

| Check | What it requires to pass (recorded pass evidence) | Notes |
|---|---|---|
| `end_to_end_claim_matches_server_access` | end_to_end_encrypted=True server_can_read_plaintext=False (skill: if someone encrypts only in transit, they trust the server; follow the key) |  |
| `zero_knowledge_claim_matches_key_access` | zero_knowledge=True server_holds_decryption_keys=False (skill: ask where the key lives and who can read it — the answers draw the real trust boundary) |  |

### Output format

The REST response (and the MCP tool's `structuredContent`) is one JSON object:

```json
{
  "service": "encryption-claim-audit",
  "atom_version": "0.1.0",
  "product": "SecureVault-v1",
  "verdict": "CLAIMS_SOUND",
  "sections": {
    "claim_specificity": "...",
    "standard_construction": "...",
    "key_management": "...",
    "derivation_and_randomness": "...",
    "coverage": "...",
    "claim_consistency": "..."
  },
  "checks": [
    {
      "section": "...",
      "check": "...",
      "status": "pass|fail|missing",
      "evidence": "..."
    }
  ],
  "summary": "28 pass, 0 fail, 0 missing of 28 checks across six sections.",
  "stamp": "<human-readable text stamp of the verdict>"
}
```

Fields, in recorded order: `service`, `atom_version`, `product`, `verdict`, `sections`, `checks`, `summary`, `stamp`. `service` and `atom_version` identify the atom and its version; the subject field(s) echo your manifest; `verdict` is the headline result; `sections` maps each section to its status; `checks` is the full per-check record; `summary` counts pass / fail / missing; `stamp` is the same verdict rendered as plain text for logs and messages.

### Verdict vocabulary

**Verdicts** — every value this atom can return:

| Verdict | Meaning |
|---|---|
| `CLAIMS_SOUND` | all 28 checks pass across the six sections. |
| `CLAIMS_UNSOUND` | at least one check fails — a claim is vague, non-standard, or inconsistent with the declared posture. |
| `INSUFFICIENT_EVIDENCE` | nothing fails, but at least one check is `missing` — the verdict names exactly which evidence to supply. |

**Section statuses** (values of the `sections` map): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is `missing`.

**Per-check statuses** (values of each check's `status`): `pass`, `fail`, `missing` — as defined under Checks above. There is no separate not-applicable status: a check whose precondition does not apply reports `pass` with evidence stating why.

### Errors

Error shapes below are the gateway's recorded/documented shapes only (gateway call path, `rails/gateway/src/callpath.ts`, and the recorded evidence); no other payload is invented here.

| HTTP | Shape | When |
|---|---|---|
| 401 | `{"ok": false, "error": "unauthorized", "detail": "missing or invalid gateway API key"}` | No key, or a key that does not verify. On the MCP face the same condition returns `{"error": "missing or invalid gateway API key"}`. |
| 403 | `{"ok": false, "error": "scope_required", "detail": "this key does not hold the encryption_claim_audit scope; issue it for this atom first"}` | The key is valid but was never issued this atom's scope. On the MCP face: `{"error": "this key does not hold the encryption_claim_audit scope"}`. |
| 422 | `{"ok": false, "error": "invalid_input", "field": "product", "detail": "product must be a string"}` (this atom's recorded malformed case, verbatim) | The manifest violates a declared field type; validation names the first offending `field` and the expected type in `detail`. Never a verdict. |
| 429 | `{"ok": false, "error": "rate_limit", "detail": "per-key limit 60/minute for encryption-claim-audit exceeded"}` (day form: `per-key limit 10000/day …`) | Per-key rate limit exceeded (see Rate limits). Rate-limited calls are not metered. |

### Rate limits and pricing

- **Rate limits (contract.yaml):** 60 calls per minute and 10,000 calls per day, per key, for this atom (SPEC default — the per-key rate limit is the capacity guard for open public usage).
- **Pricing status (contract.yaml):** pricing unit is per delivered result; `pricing.rate` is `null` (rate_status: pending) — **Free during trial — rate pending.** No rate is published until the pricing protocol in `rails/billing.md` produces one.

## Explanation

Bound capability (from the bound skill): practical encryption guidance — what to encrypt, key management basics, authenticated encryption, KDF choice, and how to spot weak crypto claims (grounded in zerok-container and mykey). The audit runs 28 deterministic checks across six sections: claim_specificity, standard_construction, key_management, derivation_and_randomness, coverage, claim_consistency.

**How the verdict is decided.** The core is deterministic: no model call, no network, same manifest → same verdict, byte-identically (recorded determinism and MCP/REST parity checks are in TEST-REPORT.md). Each check reads declared manifest fields only, and the three-way distinction is the heart of the design: a field **absent** is *missing evidence* (`missing` check → evidence-type verdict if nothing fails); a field **present but false / invalid** is a *failure* (`fail` check → fail-type verdict); a field present and valid passes. “You didn't show me” and “you showed me and it's wrong” are different verdicts, on purpose. Section statuses roll up from their checks, and the verdict rolls up from the sections: any fail anywhere → the fail-type verdict; no fails but any missing → the evidence-type verdict; all pass → the passing verdict.

**What it does NOT do.**

- It audits declared claims against the declared posture. It does not test the cryptography itself — no implementation review, no ciphertext analysis, no penetration test.
- The register's named doubt is printed in SERVICE.md: “Standard constructions; differentiation is checklist” — the value is the disciplined check, not novel cryptographic knowledge.
- Field-to-check mapping is many-to-one in places: `claims.algorithm` / `claims.mode` / `claims.key_length_bits` each feed both claim_specificity and standard_construction, and the three `asymmetric.*` fields drive the single `asymmetric_is_standard` check.
- It sells the check — a bounded judgment artifact — never the underlying encryption knowledge.

**Buyer / use context.** First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Security & privacy who need this check on demand and would rather buy it per use than build or staff the capability themselves. Self-use workflow (R3, passed): release-gate crypto review for products.

The atom sells its deliverable — the verdict/check artifact — never the underlying knowledge it is built from.

## Role views

### For integrators (Users)

Integrate one call: `POST https://atoms.pipavia.com/v1/encryption-claim-audit` (REST) or the MCP tool `encryption_claim_audit` at `POST https://atoms.pipavia.com/mcp/encryption-claim-audit`, with `Authorization: Bearer <key>` and the manifest object as the body/arguments. The call contract is the Input reference above — one JSON object, no fetching, no callbacks. What you get back is the Output format above: a verdict you can gate on, a per-section map, and a `checks` array whose `evidence` strings make the result auditable without a second call. Treat the fail-type verdict as “do not proceed”, the evidence-type verdict as “not yet decidable — supply the named fields”, and the passing verdict as the gate clearing. Calls are read-only and idempotent: re-submitting the same manifest returns the same verdict.

### For developers

Manifest authoring: declare facts, don't argue — each field is a factual claim about your system (see the Input reference for types, gates, and conditionals), and the atom judges exactly what you declare. Determinism is contractual: the implementation is a pure evaluation of the manifest (`src/encryption_claim_audit.py` in this atom's directory — `evaluate(manifest)` returning the verdict dict, with a CLI that prints JSON + the text stamp), with 16 local tests in `tests/test_encryption_claim_audit.py` (all passing 2026-11-15, per contract.yaml). Fixes land in the bound skill first and the atom re-deploys from the refined skill (contract rule R1), so check names and semantics here track SERVICE.md and the recorded responses, not folklore.

### For ops

Endpoints: REST `POST /v1/encryption-claim-audit` and MCP `POST /mcp/encryption-claim-audit` on https://atoms.pipavia.com (gateway v1.1.0). Auth: per-atom key scope `encryption_claim_audit`; watch for 401 (missing/invalid key), 403 (scope not issued), 422 (client manifest type errors — a client bug signal, not an outage), and 429 (per-key limit: 60/min, 10,000/day). Pricing: no published rate — rate pending, free during trial. Status: live — release candidate (one-week RC soak to 2026-11-22); the verification record is TEST-REPORT.md and `verification/results/encryption-claim-audit.json`. Support: info@pipavia.com.

### For regulators

What the verdict constitutes as evidence: a deterministic, reproducible judgment over a *declared* evidence manifest, with the per-check `evidence` strings preserved in the response itself — an auditor can re-submit the identical manifest and must receive the identical verdict (byte-identical determinism and MCP/REST parity are recorded in the verification battery). The audit trail lives in TEST-REPORT.md (independent external tester, cases and findings), `verification/work/encryption-claim-audit/evidence.json` (the raw recorded trial runs reproduced under Worked examples), and `verification/results/encryption-claim-audit.json` (the recorded verdict on that battery). Its limits are part of the evidence: the verdict is a judgment on declared evidence, not an independent inspection of the audited system, and it is **not a certification** — it attests that the declared record satisfies (or fails, or does not yet evidence) this atom's named checks, nothing more.

## Worked examples

Provenance: recorded 2026-11-15T23:57:32.303331+00:00 against gateway v1.1.0 (https://atoms.pipavia.com), external verification lane, source `verification/work/encryption-claim-audit/evidence.json`. Inputs are the cases' recorded `input`; responses are the REST executions' recorded `response_text`, pretty-printed (indent 2) only — the JSON values are verbatim, mechanically verified against the evidence after writing (see the checklist below).

### Example 1 — Full-pass (case `full-pass`, HTTP 200)

Input:

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

Response (REST):

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
  "checks": [
    {
      "section": "claim_specificity",
      "check": "algorithm_named",
      "status": "pass",
      "evidence": "algorithm='AES' (skill: name the algorithm, mode, and key length)"
    },
    {
      "section": "claim_specificity",
      "check": "mode_named",
      "status": "pass",
      "evidence": "mode='GCM' (skill: name the algorithm, mode, and key length)"
    },
    {
      "section": "claim_specificity",
      "check": "key_length_stated",
      "status": "pass",
      "evidence": "key_length_bits=256 (skill: name the algorithm, mode, and key length)"
    },
    {
      "section": "claim_specificity",
      "check": "no_vague_unqualified_claim",
      "status": "pass",
      "evidence": "skill: 'military-grade encryption' without algorithm/mode/key length is a red flag, not a credential"
    },
    {
      "section": "standard_construction",
      "check": "symmetric_is_aes_256_gcm",
      "status": "pass",
      "evidence": "algorithm='AES' mode='GCM' key_length_bits=256 (skill: symmetric: AES-256-GCM)"
    },
    {
      "section": "standard_construction",
      "check": "mode_is_not_ecb",
      "status": "pass",
      "evidence": "mode='GCM' (skill mistake: ECB mode — identical plaintext blocks give identical ciphertext blocks)"
    },
    {
      "section": "standard_construction",
      "check": "authenticated_encryption",
      "status": "pass",
      "evidence": "skill: authenticated encryption — never raw AES-CBC without a separate MAC; ask if the ciphertext is tamper-evident"
    },
    {
      "section": "standard_construction",
      "check": "no_custom_crypto",
      "status": "pass",
      "evidence": "skill mistake: homebrew crypto — custom ciphers, custom modes, 'improved' AES"
    },
    {
      "section": "standard_construction",
      "check": "nonce_unique_per_key",
      "status": "pass",
      "evidence": "skill mistake: IV/nonce reuse — GCM with a reused nonce leaks the keystream; nonces must be unique per key"
    },
    {
      "section": "standard_construction",
      "check": "asymmetric_is_standard",
      "status": "pass",
      "evidence": "key_exchange='X25519' signatures='Ed25519' (skill: X25519 for key exchange, Ed25519 for signatures)"
    },
    {
      "section": "key_management",
      "check": "keys_generated_from_csprng",
      "status": "pass",
      "evidence": "skill: keys come from the CSPRNG, never from passwords directly"
    },
    {
      "section": "key_management",
      "check": "no_hardcoded_keys",
      "status": "pass",
      "evidence": "skill mistake: hardcoded keys or IVs — keys in source, in config, in environment dumps"
    },
    {
      "section": "key_management",
      "check": "key_storage_in_keystore_or_memory",
      "status": "pass",
      "evidence": "storage='platform_keystore' (skill: keys live in the platform keystore or in memory only)"
    },
    {
      "section": "key_management",
      "check": "key_rotation_planned",
      "status": "pass",
      "evidence": "skill: plan rotation before you need it — what happens to old ciphertext when the key changes?"
    },
    {
      "section": "key_management",
      "check": "recovery_story_documented",
      "status": "pass",
      "evidence": "skill: the recovery story is the security story; 'no recovery possible' is a valid design when stated"
    },
    {
      "section": "derivation_and_randomness",
      "check": "kdf_is_argon2id_or_pbkdf2",
      "status": "pass",
      "evidence": "kdf='Argon2id' (skill: Argon2id; PBKDF2 acceptable with high iteration counts; raw SHA-256 is not key derivation)"
    },
    {
      "section": "derivation_and_randomness",
      "check": "unique_random_salt_per_key",
      "status": "pass",
      "evidence": "skill: passwords become keys through Argon2id with a unique random salt per key"
    },
    {
      "section": "derivation_and_randomness",
      "check": "password_not_used_directly_as_key",
      "status": "pass",
      "evidence": "skill mistake: weak or missing KDF — passwords used directly as keys"
    },
    {
      "section": "derivation_and_randomness",
      "check": "randomness_from_os_csprng",
      "status": "pass",
      "evidence": "source='os_csprng' (skill: the OS CSPRNG — never Math.random(), never a homebrew PRNG, never a hardcoded seed)"
    },
    {
      "section": "coverage",
      "check": "transport_tls_1_2_or_higher",
      "status": "pass",
      "evidence": "tls_version='1.3' (skill: TLS 1.2+ for every network hop, no exceptions)"
    },
    {
      "section": "coverage",
      "check": "transport_no_plaintext_fallback",
      "status": "pass",
      "evidence": "skill: TLS 1.2+ for every network hop, no plaintext fallbacks"
    },
    {
      "section": "coverage",
      "check": "at_rest_encrypted",
      "status": "pass",
      "evidence": "skill: encrypt everything stored — databases, blobs, backups, logs that might contain secrets"
    },
    {
      "section": "coverage",
      "check": "key_not_stored_with_data",
      "status": "pass",
      "evidence": "skill mistake: 'encrypted' with the key next to the data is obfuscation with extra steps"
    },
    {
      "section": "coverage",
      "check": "in_use_plaintext_not_logged",
      "status": "pass",
      "evidence": "skill: in use — minimize plaintext lifetime, never log it"
    },
    {
      "section": "coverage",
      "check": "in_use_plaintext_not_in_crash_dumps",
      "status": "pass",
      "evidence": "skill: in use — never put plaintext in crash dumps"
    },
    {
      "section": "coverage",
      "check": "fails_closed_on_crypto_failure",
      "status": "pass",
      "evidence": "skill: fail closed or open? When crypto fails, the system refuses, not proceeds unprotected"
    },
    {
      "section": "claim_consistency",
      "check": "end_to_end_claim_matches_server_access",
      "status": "pass",
      "evidence": "end_to_end_encrypted=True server_can_read_plaintext=False (skill: if someone encrypts only in transit, they trust the server; follow the key)"
    },
    {
      "section": "claim_consistency",
      "check": "zero_knowledge_claim_matches_key_access",
      "status": "pass",
      "evidence": "zero_knowledge=True server_holds_decryption_keys=False (skill: ask where the key lives and who can read it — the answers draw the real trust boundary)"
    }
  ],
  "summary": "28 pass, 0 fail, 0 missing of 28 checks across six sections.",
  "stamp": "ENCRYPTION CLAIM AUDIT\nproduct: SecureVault-v1\nVERDICT: CLAIMS_SOUND\n  claim_specificity        pass\n  standard_construction    pass\n  key_management           pass\n  derivation_and_randomness pass\n  coverage                 pass\n  claim_consistency        pass\n28 pass, 0 fail, 0 missing of 28 checks across six sections."
}
```

### Example 2 — Violations (case `violations`, HTTP 200)

Input:

```json
{
  "product": "WeakVault-v1",
  "claims": {
    "algorithm": "AES-ECB",
    "mode": "ECB",
    "key_length_bits": 128,
    "vague_marketing_terms_used": true,
    "end_to_end_encrypted": false,
    "zero_knowledge": false
  },
  "construction": {
    "authenticated_encryption": false,
    "custom_crypto": true,
    "nonce_unique_per_key": false
  },
  "asymmetric": {
    "applies": false
  },
  "key_management": {
    "keys_from_csprng": false,
    "keys_hardcoded": true,
    "storage": "plaintext_config",
    "rotation_planned": false,
    "recovery_story_documented": false
  },
  "password_derivation": {
    "applies": false
  },
  "randomness": {
    "source": "math.random"
  },
  "coverage": {
    "transport": {
      "tls_version": "1.0",
      "plaintext_fallback": true
    },
    "at_rest": {
      "encrypted": false,
      "key_stored_with_data": true
    },
    "in_use": {
      "plaintext_logged": true,
      "plaintext_in_crash_dumps": true,
      "fails_closed_on_crypto_error": false
    }
  },
  "access": {
    "server_can_read_plaintext": true,
    "server_holds_decryption_keys": true
  }
}
```

Response (REST):

```json
{
  "service": "encryption-claim-audit",
  "atom_version": "0.1.0",
  "product": "WeakVault-v1",
  "verdict": "CLAIMS_UNSOUND",
  "sections": {
    "claim_specificity": "fail",
    "standard_construction": "fail",
    "key_management": "fail",
    "derivation_and_randomness": "fail",
    "coverage": "fail",
    "claim_consistency": "pass"
  },
  "checks": [
    {
      "section": "claim_specificity",
      "check": "algorithm_named",
      "status": "pass",
      "evidence": "algorithm='AES-ECB' (skill: name the algorithm, mode, and key length)"
    },
    {
      "section": "claim_specificity",
      "check": "mode_named",
      "status": "pass",
      "evidence": "mode='ECB' (skill: name the algorithm, mode, and key length)"
    },
    {
      "section": "claim_specificity",
      "check": "key_length_stated",
      "status": "pass",
      "evidence": "key_length_bits=128 (skill: name the algorithm, mode, and key length)"
    },
    {
      "section": "claim_specificity",
      "check": "no_vague_unqualified_claim",
      "status": "fail",
      "evidence": "skill: 'military-grade encryption' without algorithm/mode/key length is a red flag, not a credential"
    },
    {
      "section": "standard_construction",
      "check": "symmetric_is_aes_256_gcm",
      "status": "fail",
      "evidence": "algorithm='AES-ECB' mode='ECB' key_length_bits=128 (skill: symmetric: AES-256-GCM)"
    },
    {
      "section": "standard_construction",
      "check": "mode_is_not_ecb",
      "status": "fail",
      "evidence": "mode='ECB' (skill mistake: ECB mode — identical plaintext blocks give identical ciphertext blocks)"
    },
    {
      "section": "standard_construction",
      "check": "authenticated_encryption",
      "status": "fail",
      "evidence": "skill: authenticated encryption — never raw AES-CBC without a separate MAC; ask if the ciphertext is tamper-evident"
    },
    {
      "section": "standard_construction",
      "check": "no_custom_crypto",
      "status": "fail",
      "evidence": "skill mistake: homebrew crypto — custom ciphers, custom modes, 'improved' AES"
    },
    {
      "section": "standard_construction",
      "check": "nonce_unique_per_key",
      "status": "fail",
      "evidence": "skill mistake: IV/nonce reuse — GCM with a reused nonce leaks the keystream; nonces must be unique per key"
    },
    {
      "section": "standard_construction",
      "check": "asymmetric_is_standard",
      "status": "pass",
      "evidence": "no asymmetric cryptography declared"
    },
    {
      "section": "key_management",
      "check": "keys_generated_from_csprng",
      "status": "fail",
      "evidence": "skill: keys come from the CSPRNG, never from passwords directly"
    },
    {
      "section": "key_management",
      "check": "no_hardcoded_keys",
      "status": "fail",
      "evidence": "skill mistake: hardcoded keys or IVs — keys in source, in config, in environment dumps"
    },
    {
      "section": "key_management",
      "check": "key_storage_in_keystore_or_memory",
      "status": "fail",
      "evidence": "storage='plaintext_config' (skill: keys live in the platform keystore or in memory only)"
    },
    {
      "section": "key_management",
      "check": "key_rotation_planned",
      "status": "fail",
      "evidence": "skill: plan rotation before you need it — what happens to old ciphertext when the key changes?"
    },
    {
      "section": "key_management",
      "check": "recovery_story_documented",
      "status": "fail",
      "evidence": "skill: the recovery story is the security story; 'no recovery possible' is a valid design when stated"
    },
    {
      "section": "derivation_and_randomness",
      "check": "kdf_is_argon2id_or_pbkdf2",
      "status": "pass",
      "evidence": "no password-derived keys declared"
    },
    {
      "section": "derivation_and_randomness",
      "check": "unique_random_salt_per_key",
      "status": "pass",
      "evidence": "no password-derived keys declared"
    },
    {
      "section": "derivation_and_randomness",
      "check": "password_not_used_directly_as_key",
      "status": "pass",
      "evidence": "no password-derived keys declared"
    },
    {
      "section": "derivation_and_randomness",
      "check": "randomness_from_os_csprng",
      "status": "fail",
      "evidence": "source='math.random' (skill: the OS CSPRNG — never Math.random(), never a homebrew PRNG, never a hardcoded seed)"
    },
    {
      "section": "coverage",
      "check": "transport_tls_1_2_or_higher",
      "status": "fail",
      "evidence": "tls_version='1.0' (skill: TLS 1.2+ for every network hop, no exceptions)"
    },
    {
      "section": "coverage",
      "check": "transport_no_plaintext_fallback",
      "status": "fail",
      "evidence": "skill: TLS 1.2+ for every network hop, no plaintext fallbacks"
    },
    {
      "section": "coverage",
      "check": "at_rest_encrypted",
      "status": "fail",
      "evidence": "skill: encrypt everything stored — databases, blobs, backups, logs that might contain secrets"
    },
    {
      "section": "coverage",
      "check": "key_not_stored_with_data",
      "status": "fail",
      "evidence": "skill mistake: 'encrypted' with the key next to the data is obfuscation with extra steps"
    },
    {
      "section": "coverage",
      "check": "in_use_plaintext_not_logged",
      "status": "fail",
      "evidence": "skill: in use — minimize plaintext lifetime, never log it"
    },
    {
      "section": "coverage",
      "check": "in_use_plaintext_not_in_crash_dumps",
      "status": "fail",
      "evidence": "skill: in use — never put plaintext in crash dumps"
    },
    {
      "section": "coverage",
      "check": "fails_closed_on_crypto_failure",
      "status": "missing",
      "evidence": "skill: fail closed or open? When crypto fails, the system refuses, not proceeds unprotected"
    },
    {
      "section": "claim_consistency",
      "check": "end_to_end_claim_matches_server_access",
      "status": "pass",
      "evidence": "no end-to-end encryption claim declared"
    },
    {
      "section": "claim_consistency",
      "check": "zero_knowledge_claim_matches_key_access",
      "status": "pass",
      "evidence": "no zero-knowledge claim declared"
    }
  ],
  "summary": "9 pass, 18 fail, 1 missing of 28 checks across six sections.",
  "stamp": "ENCRYPTION CLAIM AUDIT\nproduct: WeakVault-v1\nVERDICT: CLAIMS_UNSOUND\n  claim_specificity        fail\n  standard_construction    fail\n  key_management           fail\n  derivation_and_randomness fail\n  coverage                 fail\n  claim_consistency        pass\n9 pass, 18 fail, 1 missing of 28 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`, HTTP 422)

Input:

```json
{
  "product": 12345,
  "claims": "invalid_string_instead_of_object"
}
```

Response (REST):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "product",
  "detail": "product must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Tutorial ✓ · How-to guides ✓ · Reference ✓ · Explanation ✓ |
| Role views present | Integrators (Users) ✓ · Developers ✓ · Ops ✓ · Regulators ✓ (audit/compliance-facing atom) |
| Checks named | 28 documented / 28 recorded in the full-pass response |
| Verdict vocabulary complete | 3 verdicts + section statuses (`pass`/`fail`/`insufficient_evidence`) + per-check statuses (`pass`/`fail`/`missing`) ✓ |
| Input reference typed | 32 fields, each with a type and notes ✓ |
| Worked examples verbatim-verified | full-pass ✓ · violations ✓ · malformed ✓ — fenced JSON blocks parsed and compared as JSON values against `verification/work/encryption-claim-audit/evidence.json` |
