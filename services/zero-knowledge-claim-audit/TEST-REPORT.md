# Test report — zero-knowledge-claim-audit

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
**Evidence:** `verification/work/zero-knowledge-claim-audit/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete valid evidence manifest | HTTP 200, verdict `CLAIMS_SOUND` | HTTP 200, `CLAIMS_SOUND`, "27 pass, 0 fail, 0 missing of 27 checks across six sections." stamp present and well-formed | PASS |
| 2 | violations — deliberate contract violations | HTTP 200, verdict `CLAIMS_UNSOUND` | HTTP 200, `CLAIMS_UNSOUND`, failing checks: `server_operator_cannot_read_user_data`, `trusted_components_named_including_client_os_distribution`, `recovery_claims_consistent`, `web_app_trust_distinction_acknowledged` (23 pass, 4 fail, 0 missing) | PASS |
| 3 | sparse — minimal manifest | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 26 missing | PASS |
| 4 | malformed — `claims.claim_basis` as a number, `access` as a string instead of an object | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `CLAIMS_UNSOUND` (0 pass, 1 fail, 26 missing) — type-violating values were evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `zero_knowledge_claim_audit`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service":"zero-knowledge-claim-audit","atom_version":"0.1.0","product":"SecureVault","verdict":"CLAIMS_SOUND","sections":{"core_test":"pass","client_side_encryption":"pass","key_journey":"pass","trusted_parties_and_recovery":"pass","plaintext_and_metadata_scope":"pass","theater_and_threat_model":"pass"},"checks":[{"section":"core_test","check":"server_operator_cannot_read_user_data","status":"pass","evidence":"skill: the core test — can the server operator (malicious, curious, or compelled) read user data? If yes, the system is not zero-knowledge"},{"section":"core_test","check":"server_stores_only_opaque_bytes","status":"pass","evidence":"skill: the server receives and stores opaque bytes; plaintext exists only on the user's device"},{"section":"core_test","check":"claim_basis_is_cryptographic_guarantee","status":"pass","evidence":"claim_basis='cryptographic_guarantee' (skill: distinguish can't read (cryptographic guarantee) from won't read (policy promise); only the first is ZK)"},{"section":"client_side_encryption","check":"encryption_on_client_device","status":"pass","evidence":"skill: client-side encryption, always — if encryption does not happen on your device, it is not zero-knowledge, whatever the marketing page says"},{"section":"client_side_encryption","check":"plaintext_only_on_client_device","status":"pass","evidence":"skill: plaintext exists only on the user's device; the server stores unreadable bytes and only the user decrypts"},{"section":"client_side_encryption","check":"authenticated_encryption","status":"pass","evidence":"skill: authenticated encryption — ciphertext must be tamper-evident; encryption without authentication lets an attacker modify data silently"},{"section":"client_side_encryption","check":"encryption_independent_of_transport","status":"pass","evidence":"skill: encryption independent of transport — TLS protects the pipe, ZK protects the data; a system that relies on TLS alone trusts the server at the end of the pipe"},{"section":"key_journey","check":"keys_never_leave_device","status":"pass","evidence":"skill: keys never leave the device — not in transit, not 'temporarily', not for 'convenience features'"},{"section":"key_journey","check":"key_derivation_client_side","status":"pass","evidence":"skill: key derivation happens locally (password -> KDF -> key, all client-side)"},{"section":"key_journey","check":"key_journey_documented","status":"pass","evidence":"skill: follow the key — where is it generated, where is it stored, what crosses the network? Gaps in the diagram are the audit findings"},{"section":"key_journey","check":"no_key_backup_uploaded_to_server","status":"pass","evidence":"skill (theater): key 'backup' uploads the key to the server under another name"},{"section":"trusted_parties_and_recovery","check":"no_key_escrow","status":"pass","evidence":"skill: no trusted third parties in the data path — no key escrow"},{"section":"trusted_parties_and_recovery","check":"no_recovery_backdoor","status":"pass","evidence":"skill: no trusted third parties in the data path — no recovery backdoor"},{"section":"trusted_parties_and_recovery","check":"no_admin_plaintext_view","status":"pass","evidence":"skill: no trusted third parties in the data path — no admin plaintext view"},{"section":"trusted_parties_and_recovery","check":"trusted_components_named_including_client_os_distribution","status":"pass","evidence":"trusted_components=['client', 'operating_system', 'distribution_channel'] (skill: name every trusted component explicitly — including the client itself, the OS, and the distribution channel)"},{"section":"trusted_parties_and_recovery","check":"trusted_third_parties_in_data_path_listed","status":"pass","evidence":"trusted_third_parties_in_data_path=[] (skill: each exception is a named party you now trust — list them; an empty list declares none)"},{"section":"trusted_parties_and_recovery","check":"recovery_claims_consistent","status":"pass","evidence":"password_reset_recovers_data=False no_recovery_possible_claimed=True (skill: read the recovery story — 'forgot password' recovery and 'we can't recover your data' cannot both be true; the recovery mechanism defines the real trust model)"},{"section":"plaintext_and_metadata_scope","check":"plaintext_locations_documented","status":"pass","evidence":"skill: follow the plaintext — list every place plaintext exists, however briefly (memory, logs, crash dumps, thumbnails, previews); each is a scope boundary"},{"section":"plaintext_and_metadata_scope","check":"plaintext_not_in_logs","status":"pass","evidence":"skill: follow the plaintext — plaintext in logs is a scope boundary where plaintext exists outside the device guarantee"},{"section":"plaintext_and_metadata_scope","check":"plaintext_not_in_crash_dumps","status":"pass","evidence":"skill: follow the plaintext — plaintext in crash dumps is a scope boundary where plaintext exists outside the device guarantee"},{"section":"plaintext_and_metadata_scope","check":"plaintext_not_in_thumbnails_or_previews","status":"pass","evidence":"skill: follow the plaintext — plaintext in thumbnails and previews is a scope boundary where plaintext exists outside the device guarantee"},{"section":"plaintext_and_metadata_scope","check":"metadata_leakage_acknowledged","status":"pass","evidence":"skill: check the metadata — traffic analysis and blob-size leakage survive encryption; sizes, timing, and access patterns are data too, and ZK does not hide that you store data, how much, or when you access it"},{"section":"plaintext_and_metadata_scope","check":"residual_risks_documented","status":"pass","evidence":"skill: residual risks are part of the answer, not a footnote"},{"section":"theater_and_threat_model","check":"client_type_declared","status":"pass","evidence":"client_type='native_app' (skill: say which one you are looking at — a locally installed client or a web app served by the same server)"},{"section":"theater_and_threat_model","check":"web_app_trust_distinction_acknowledged","status":"pass","evidence":"client is not declared as a web app served by the same server"},{"section":"theater_and_threat_model","check":"search_indexing_does_not_expose_plaintext_or_tokens","status":"pass","evidence":"skill (theater): the 'encrypted' search/indexing requires the server to see plaintext or searchable tokens"},{"section":"theater_and_threat_model","check":"threat_model_includes_malicious_operator","status":"pass","evidence":"skill (theater): the threat model quietly excludes the actual adversary (a malicious operator)"}],"summary":"27 pass, 0 fail, 0 missing of 27 checks across six sections.","stamp":"ZERO-KNOWLEDGE CLAIM AUDIT\nproduct: SecureVault\nVERDICT: CLAIMS_SOUND\n  core_test                    pass\n  client_side_encryption       pass\n  key_journey                  pass\n  trusted_parties_and_recovery pass\n  plaintext_and_metadata_scope pass\n  theater_and_threat_model     pass\n27 pass, 0 fail, 0 missing of 27 checks across six sections."}
```

Malformed response (REST, HTTP 200 — the finding; key fields, full
response in the evidence file):

```json
{
 "service": "zero-knowledge-claim-audit",
 "atom_version": "0.1.0",
 "product": "MalformedAudit",
 "verdict": "CLAIMS_UNSOUND",
 "sections": {
  "core_test": "fail",
  "client_side_encryption": "insufficient_evidence",
  "key_journey": "insufficient_evidence",
  "trusted_parties_and_recovery": "insufficient_evidence",
  "plaintext_and_metadata_scope": "insufficient_evidence",
  "theater_and_threat_model": "insufficient_evidence"
 },
 "summary": "0 pass, 1 fail, 26 missing of 27 checks across six sections."
}
```

Malformed input submitted:

```json
{"product": "MalformedAudit", "claims": {"claim_basis": 12345}, "access": "not_an_object"}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `claims.claim_basis` as a number, `access` as a string instead of an object. Expected (test doctrine for
this program + the gateway's `invalid_input` mechanism in
`callpath.ts`): HTTP 422 `{ok:false, error:"invalid_input", field:...}`.
Actual: HTTP 200 with a `CLAIMS_UNSOUND` verdict computed over the
garbage values (0 pass, 1 fail, 26 missing of 27 checks across six sections.; failing check: `claim_basis_is_cryptographic_guarantee`). The atom's
handler does not validate manifest field types before evaluation.
Contract clause: SERVICE.md: Inputs — the zero-knowledge-evidence manifest. Disposition: **fix spec filed** —
`verification/fix-specs/zero-knowledge-claim-audit.md`, entry `zero-knowledge-claim-audit F1`.
Retest on redeploy.

No tester errors. Gemini's four designed cases were contract-valid as
written and were run unmodified. One design note, verified against the
evidence and not an error: the violations case lists both `recovery.*`
input fields in its expected failing set; SERVICE.md defines recovery
consistency as a single combined check over both fields, and the live
response fails exactly that one check (`recovery_claims_consistent`)
alongside the other three designed breaches — the verdict and every
designed breach match the contract.

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases,
determinism and MCP/REST parity hold, the stamp is well-formed; the
single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway/deployment: live gateway https://atoms.pipavia.com, gateway version 1.1.0 (health HTTP 200), fix-stream deployment 7f9cae9fdd60417eb72062905a066554; retest evidence recorded 2026-11-15T23:55:56.371091+00:00 (`verification/work/zero-knowledge-claim-audit/evidence.json`). Wave 1 evidence preserved as `evidence-wave1.json` / `judgment-wave1.json`. The full recorded Wave 1 battery was re-run unmodified (harness.py), judged by Gemini (`judgment.json`: **PASS**, 0 findings, 0 tester errors, all computed checks match), and verified mechanically from the raw evidence.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict CLAIMS_SOUND | HTTP 200, verdict CLAIMS_SOUND | PASS |
| 2 | violations | HTTP 200, verdict CLAIMS_UNSOUND | HTTP 200, verdict CLAIMS_UNSOUND | PASS |
| 3 | sparse | HTTP 200, verdict INSUFFICIENT_EVIDENCE | HTTP 200, verdict INSUFFICIENT_EVIDENCE | PASS |
| 4 | malformed | HTTP 422 {ok:false, error:"invalid_input"}, no verdict | HTTP 422 {ok:false, error:"invalid_input", field:"claims.claim_basis"} | PASS |
| 5 | determinism (full-pass repeat) | byte-identical repeat response | determinism_byte_identical = true | PASS |
| 6 | parity (MCP vs REST, full-pass) | MCP structuredContent deep-equals REST artifact | parity_structured_equal = true | PASS |

**F1 disposition: RESOLVED.** Wave 1 F1 was: type-violating manifest fields returned HTTP 200 with a verdict computed over garbage instead of HTTP 422 `{ok:false, error:"invalid_input"}`. On retest the malformed case returns HTTP 422 with body `{"ok": false, "error": "invalid_input", "field": "claims.claim_basis", "detail": "claims.claim_basis must be a string"}` — exactly the contract error, no verdict artifact. All other cases (full-pass, violations, sparse) return their Wave 1-correct outcomes unchanged, and determinism and MCP/REST parity still hold. F1 is closed by this retest; no new findings.

Tester errors: none.

**Retest verdict: PASS**
