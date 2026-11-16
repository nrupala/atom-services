# Test report — encryption-claim-audit

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw.
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/encryption-claim-audit/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete valid evidence manifest | HTTP 200, verdict `CLAIMS_SOUND` | HTTP 200, `CLAIMS_SOUND`, "28 pass, 0 fail, 0 missing of 28 checks across six sections." stamp present and well-formed | PASS |
| 2 | violations — deliberate contract violations | HTTP 200, verdict `CLAIMS_UNSOUND` | HTTP 200, `CLAIMS_UNSOUND`, failing checks: `no_vague_unqualified_claim`, `symmetric_is_aes_256_gcm`, `mode_is_not_ecb`, `authenticated_encryption`, `no_custom_crypto`, `nonce_unique_per_key`, `keys_generated_from_csprng`, `no_hardcoded_keys`, `key_storage_in_keystore_or_memory`, `key_rotation_planned`, `recovery_story_documented`, `randomness_from_os_csprng`, `transport_tls_1_2_or_higher`, `transport_no_plaintext_fallback`, `at_rest_encrypted`, `key_not_stored_with_data`, `in_use_plaintext_not_logged`, `in_use_plaintext_not_in_crash_dumps` (9 pass, 18 fail, 1 missing) | PASS |
| 3 | sparse — minimal manifest | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 28 missing | PASS |
| 4 | malformed — `product` as a number, `claims` as a string instead of an object | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 28 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `encryption_claim_audit`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"encryption-claim-audit","atom_version":"0.1.0","product":"SecureVault-v1","verdict":"CLAIMS_SOUND","sections":{"claim_specificity":"pass","standard_construction":"pass","key_management":"pass","derivation_and_randomness":"pass","coverage":"pass","claim_consistency":"pass"},"checks":[{"section":"claim_specificity","check":"algorithm_named","status":"pass","evidence":"algorithm='AES' (skill: name the algorithm, mode, and key length)"},{"section":"claim_specificity","check":"mode_named","status":"pass","evidence":"mode='GCM' (skill: name the algorithm, mode, and key length)"},{"section":"claim_specificity","check":"key_length_stated","status":"pass","evidence":"key_length_bits=256 (skill: name the algorithm, mode, and key length)"},{"section":"claim_specificity","check":"no_vague_unqualified_claim","status":"pass","evidence":"skill: 'military-grade encryption' without algorithm/mode/key length is a red flag, not a credential"},{"section":"standard_construction","check":"symmetric_is_aes_256_gcm","status":"pass","evidence":"algorithm='AES' mode='GCM' key_length_bits=256 (skill: symmetric: AES-256-GCM)"},{"section":"standard_construction","check":"mode_is_not_ecb","status":"pass","evidence":"mode='GCM' (skill mistake: ECB mode — identical plaintext blocks give identical ciphertext blocks)"},{"section":"standard_construction","check":"authenticated_encryption","status":"pass","evidence":"skill: authenticated encryption — never raw AES-CBC without a separate MAC; ask if the ciphertext is tamper-evident"},{"section":"standard_construction","check":"no_custom_crypto","status":"pass","evidence":"skill mistake: homebrew crypto — custom ciphers, custom modes, 'improved' AES"},{"section":"standard_construction","check":"nonce_unique_per_key","status":"pass","evidence":"skill mistake: IV/nonce reuse — GCM with a reused nonce leaks the keystream; nonces must be unique per key"},{"section":"standard_construction","check":"asymmetric_is_standard","status":"pass","evidence":"key_exchange='X25519' signatures='Ed25519' (skill: X25519 for key exchange, Ed25519 for signatures)"},{"section":"key_management","check":"keys_generated_from_csprng","status":"pass","evidence":"skill: keys come from the CSPRNG, never from passwords directly"},{"section":"key_management","check":"no_hardcoded_keys","status":"pass","evidence":"skill mistake: hardcoded keys or IVs — keys in source, in config, in environment dumps"},{"section":"key_management","check":"key_storage_in_keystore_or_memory","status":"pass","evidence":"storage='platform_keystore' (skill: keys live in the platform keystore or in memory only)"},{"section":"key_management","check":"key_rotation_planned","status":"pass","evidence":"skill: plan rotation before you need it — what happens to old ciphertext when the key changes?"},{"section":"key_management","check":"recovery_story_documented","status":"pass","evidence":"skill: the recovery story is the security story; 'no recovery possible' is a valid design when stated"},{"section":"derivation_and_randomness","check":"kdf_is_argon2id_or_pbkdf2","status":"pass","evidence":"kdf='Argon2id' (skill: Argon2id; PBKDF2 acceptable with high iteration counts; raw SHA-256 is not key derivation)"},{"section":"derivation_and_randomness","check":"unique_random_salt_per_key","status":"pass","evidence":"skill: passwords become keys through Argon2id with a unique random salt per key"},{"section":"derivation_and_randomness","check":"password_not_used_directly_as_key","status":"pass","evidence":"skill mistake: weak or missing KDF — passwords used directly as keys"},{"section":"derivation_and_randomness","check":"randomness_from_os_csprng","status":"pass","evidence":"source='os_csprng' (skill: the OS CSPRNG — never Math.random(), never a homebrew PRNG, never a hardcoded seed)"},{"section":"coverage","check":"transport_tls_1_2_or_higher","status":"pass","evidence":"tls_version='1.3' (skill: TLS 1.2+ for every network hop, no exceptions)"},{"section":"coverage","check":"transport_no_plaintext_fallback","status":"pass","evidence":"skill: TLS 1.2+ for every network hop, no plaintext fallbacks"},{"section":"coverage","check":"at_rest_encrypted","status":"pass","evidence":"skill: encrypt everything stored — databases, blobs, backups, logs that might contain secrets"},{"section":"coverage","check":"key_not_stored_with_data","status":"pass","evidence":"skill mistake: 'encrypted' with the key next to the data is obfuscation with extra steps"},{"section":"coverage","check":"in_use_plaintext_not_logged","status":"pass","evidence":"skill: in use — minimize plaintext lifetime, never log it"},{"section":"coverage","check":"in_use_plaintext_not_in_crash_dumps","status":"pass","evidence":"skill: in use — never put plaintext in crash dumps"},{"section":"coverage","check":"fails_closed_on_crypto_failure","status":"pass","evidence":"skill: fail closed or open? When crypto fails, the system refuses, not proceeds unprotected"},{"section":"claim_consistency","check":"end_to_end_claim_matches_server_access","status":"pass","evidence":"end_to_end_encrypted=True server_can_read_plaintext=False (skill: if someone encrypts only in transit, they trust the server; follow the key)"},{"section":"claim_consistency","check":"zero_knowledge_claim_matches_key_access","status":"pass","evidence":"zero_knowledge=True server_holds_decryption_keys=False (skill: ask where the key lives and who can read it — the answers draw the real trust boundary)"}],"summary":"28 pass, 0 fail, 0 missing of 28 checks across six sections.","stamp":"ENCRYPTION CLAIM AUDIT\nproduct: SecureVault-v1\nVERDICT: CLAIMS_SOUND\n  claim_specificity        pass\n  standard_construction    pass\n  key_management           pass\n  derivation_and_randomness pass\n  coverage                 pass\n  claim_consistency        pass\n28 pass, 0 fail, 0 missing of 28 checks across six sections."}
```

Malformed response (REST, HTTP 200 — the finding; key fields, full
response in the evidence file):

```json
{
 "service": "encryption-claim-audit",
 "atom_version": "0.1.0",
 "product": 12345,
 "verdict": "INSUFFICIENT_EVIDENCE",
 "sections": {
  "claim_specificity": "insufficient_evidence",
  "standard_construction": "insufficient_evidence",
  "key_management": "insufficient_evidence",
  "derivation_and_randomness": "insufficient_evidence",
  "coverage": "insufficient_evidence",
  "claim_consistency": "insufficient_evidence"
 },
 "summary": "0 pass, 0 fail, 28 missing of 28 checks across six sections."
}
```

Malformed input submitted:

```json
{"product": 12345, "claims": "invalid_string_instead_of_object"}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `product` as a number, `claims` as a string instead of an object. Expected (test doctrine for
this program + the gateway's `invalid_input` mechanism in
`callpath.ts`): HTTP 422 `{ok:false, error:"invalid_input", field:...}`.
Actual: HTTP 200 with a `INSUFFICIENT_EVIDENCE` verdict computed over the
garbage values (0 pass, 0 fail, 28 missing of 28 checks across six sections.; failing checks: none). The atom's
handler does not validate manifest field types before evaluation.
Contract clause: SERVICE.md: Inputs — the encryption-evidence manifest. Disposition: **fix spec filed** —
`verification/fix-specs/encryption-claim-audit.md`, entry `encryption-claim-audit F1`.
Retest on redeploy.

One tester error, corrected and re-run (never recorded as an atom
failure). Gemini's first full-pass design used semantically plausible
but non-contract values — `claims.algorithm` `AES-256-GCM` (the check
requires `AES` with mode `GCM` and 256 bits as separate fields),
`asymmetric.key_exchange` `ECDH` (requires `X25519`),
`key_management.storage` `HSM` (requires `platform_keystore` or
`memory_only`), `randomness.source` `/dev/urandom` (requires
`os_csprng`) — and nested `fails_closed_on_crypto_error` under
`coverage.in_use` instead of at `coverage` level. The case was
corrected to the atom's exact check vocabulary (as in its own test
manifest), the harness and judgment were re-run, and the corrected
full-pass case passes 28/28 (`CLAIMS_SOUND`). Gemini's second judgment
acknowledged the correction in its `tester_errors` entry. The original
run's full-pass "failure" was the tester's, not the atom's.

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases,
determinism and MCP/REST parity hold, the stamp is well-formed; the
single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: https://atoms.pipavia.com, gateway version 1.1.0 (health HTTP 200), deployment `7f9cae9fdd60417eb72062905a066554`. Full recorded Wave 1 battery re-run unchanged via `verification/harness.py`; judgment via `verification/gemini_judge.py` (Gemini verdict: PASS); mechanical verification from the new `evidence.json` governs where the two conflict.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict=CLAIMS_SOUND | HTTP 200, verdict=CLAIMS_SOUND | PASS |
| 2 | violations | HTTP 200, verdict=CLAIMS_UNSOUND | HTTP 200, verdict=CLAIMS_UNSOUND | PASS |
| 3 | sparse | HTTP 200, verdict=INSUFFICIENT_EVIDENCE | HTTP 200, verdict=INSUFFICIENT_EVIDENCE | PASS |
| 4 | malformed | HTTP 422, error=invalid_input | HTTP 422, error=invalid_input, field=product | PASS |
| 5 | determinism | byte-identical repeat (full-pass) | byte_identical=True | PASS |
| 6 | parity | MCP structuredContent deep-equal to REST (full-pass) | structured_equal=True | PASS |

F1 disposition: F1 closed — malformed now returns 422 invalid_input (field: product). The Wave 1 defect (HTTP 200 verdict computed over wrong-typed fields) no longer reproduces; all other recorded cases return their expected HTTP status and verdict, and the full-pass case is deterministic (byte-identical) with MCP/REST parity (structuredContent deep-equal).

Tester errors this wave: none. Gemini's judgment (PASS, no findings, no tester errors) agrees with the mechanical evidence.

**Retest verdict: PASS**

