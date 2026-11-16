# Test report — zero-trust-evaluation-verdict

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw. The undersigned verification lane re-checked every
judgment against the raw evidence before disposition.
**Second tester:** DeepSeek (independent recomputation — see its section
below; it agreed with Gemini on the verdict, the single finding, and
every recomputed quantity).
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/zero-trust-evaluation-verdict/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`; DeepSeek raw:
`deepseek-raw.txt`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete evaluation pack, KDF `argon2id`, minimum secret length 16, NIST alignment claimed with controls named, no backdoor present | HTTP 200, verdict `CLAIM_SUSTAINED`, 26/26 checks pass, `secret_length_margin_chars` `0.0000`, `claim_status` `sustained_on_declared_evidence` | HTTP 200, `CLAIM_SUSTAINED`, exactly those figures, "26 pass, 0 fail, 0 missing of 26 checks across six sections" | PASS |
| 2 | violations — session trusted indefinitely, KDF `sha256`, minimum secret length 8, credential exceeds job, flat network, internal network trusted | HTTP 200, verdict `CLAIM_NOT_SUSTAINED`, the six checks covering those values fail, `secret_length_margin_chars` `-8.0000` | HTTP 200, `CLAIM_NOT_SUSTAINED`, exactly 6 checks fail (`session_not_trusted_indefinitely`, `password_kdf_is_argon2id`, `minimum_secret_length_meets_stated_minimum`, `credential_scope_within_job`, `network_not_flat`, `network_not_trusted_as_internal`), 20 pass, margin `-8.0000`, `claim_status` `not_sustained_on_declared_evidence` | PASS |
| 3 | sparse — only `system` declared | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 26 missing, `claim_status` and `secret_length_margin_chars` both null | PASS |
| 4 | malformed — `evaluation: "not-an-object"` (string where a section object is required) | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 26 missing) — the type-violating value was evaluated as missing evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `zero_trust_evaluation_verdict`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array and stamp trimmed —
the full response carries all 26 checks and a text stamp):

```json
{"service":"zero-trust-evaluation-verdict","atom_version":"0.1.0","system":"production-auth-service","verdict":"CLAIM_SUSTAINED","sections":{"claim_and_scope":"pass","authentication_and_server_trust":"pass","identity_and_authenticator_strength":"pass","privilege_segmentation_and_verification":"pass","trust_inventory":"pass","honest_limits":"pass"},"claim_status":"sustained_on_declared_evidence","secret_length_margin_chars":"0.0000","summary":"26 pass, 0 fail, 0 missing of 26 checks across six sections."}
```

Violations response (REST, HTTP 200; checks array and stamp trimmed):

```json
{"service":"zero-trust-evaluation-verdict","atom_version":"0.1.0","system":"flawed-service","verdict":"CLAIM_NOT_SUSTAINED","sections":{"claim_and_scope":"pass","authentication_and_server_trust":"fail","identity_and_authenticator_strength":"fail","privilege_segmentation_and_verification":"fail","trust_inventory":"fail","honest_limits":"pass"},"claim_status":"not_sustained_on_declared_evidence","secret_length_margin_chars":"-8.0000","summary":"20 pass, 6 fail, 0 missing of 26 checks across six sections."}
```

Malformed response (REST, HTTP 200 — finding F1; checks array and
stamp trimmed):

```json
{"service":"zero-trust-evaluation-verdict","atom_version":"0.1.0","system":"malformed-test","verdict":"INSUFFICIENT_EVIDENCE","sections":{"claim_and_scope":"insufficient_evidence","authentication_and_server_trust":"insufficient_evidence","identity_and_authenticator_strength":"insufficient_evidence","privilege_segmentation_and_verification":"insufficient_evidence","trust_inventory":"insufficient_evidence","honest_limits":"insufficient_evidence"},"claim_status":null,"secret_length_margin_chars":null,"summary":"0 pass, 0 fail, 26 missing of 26 checks across six sections."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `evaluation` as a string where a section object is
required. Expected (test doctrine for this program + the gateway's
`invalid_input` mechanism in `callpath.ts`): HTTP 422
`{ok:false, error:"invalid_input", field:...}`. Actual: HTTP 200 with
an `INSUFFICIENT_EVIDENCE` verdict computed over the garbage value.
The atom's handler does not validate manifest field types before
evaluation. Disposition: **fix spec filed** —
`verification/fix-specs/zero-trust-evaluation-verdict.md`.
Retest on redeploy.

No tester errors in this atom's run. Gemini's designed cases were
checked against this atom's own `SERVICE.md` (the evaluation-verdict
framing and the NIST authenticator-strength checks it shares ground
with `defined-flow-auditor` only through the bound `zero-trust`
skill): the full-pass pack is valid per the input table (Argon2id,
16-char minimum, gated `nist_controls_named` and `backdoors_named`
checks correctly satisfied), and the violations case's six expected
failures map exactly to the six checks the artifact failed.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from
the case inputs by hand (the Argon2id KDF check, the 16-character
minimum and its margin `declared − 16` at 4dp, the failing-check
counts and lists, and the `claim_status` for each case) and verified
the artifact's numbers and verdicts. Raw output:
`verification/work/zero-trust-evaluation-verdict/deepseek-raw.txt`.

**DeepSeek verdict: FAIL** — the same single finding (malformed input
returns HTTP 200 with a verdict instead of HTTP 422).

Its computed checks — all match except the malformed HTTP status,
which is finding F1:

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass passing checks | 26 | 26 | ✓ |
| full-pass verdict | CLAIM_SUSTAINED | CLAIM_SUSTAINED | ✓ |
| full-pass `secret_length_margin_chars` (16 − 16) | 0.0000 | 0.0000 | ✓ |
| full-pass `claim_status` | sustained_on_declared_evidence | sustained_on_declared_evidence | ✓ |
| violations failing checks | 6 — session trusted indefinitely, password KDF, minimum secret length, credential exceeds job, flat network, internal network trusted | same six | ✓ |
| violations verdict | CLAIM_NOT_SUSTAINED | CLAIM_NOT_SUSTAINED | ✓ |
| violations `secret_length_margin_chars` (8 − 16) | -8.0000 | -8.0000 | ✓ |
| violations `claim_status` | not_sustained_on_declared_evidence | not_sustained_on_declared_evidence | ✓ |
| sparse missing checks | 26 | 26 | ✓ |
| sparse verdict | INSUFFICIENT_EVIDENCE | INSUFFICIENT_EVIDENCE | ✓ |
| sparse `claim_status` / `secret_length_margin_chars` | null / null | null / null | ✓ |
| malformed HTTP status | 422 | 200 | ✗ → F1 |

**Agreement / disagreement:** the testers fully agree. Gemini and
DeepSeek return the same verdict (FAIL), the same single finding
(F1), and identical recomputations of both computed NIST checks —
Argon2id passes only as exactly `"argon2id"` (`sha256` fails), and
the secret-length margin is `0.0000` at the stated 16-char minimum
and `-8.0000` at 8 chars. There is no disagreement to disposition.

## Final verdict

**FAIL** — verdict logic and both computed NIST authenticator-strength
checks are exact on the valid cases (confirmed by two independent
testers), determinism and MCP/REST parity hold; the single defect is
F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway/deployment: live gateway https://atoms.pipavia.com, gateway version 1.1.0 (health HTTP 200), fix-stream deployment 7f9cae9fdd60417eb72062905a066554; retest evidence recorded 2026-11-15T23:54:40.487423+00:00 (`verification/work/zero-trust-evaluation-verdict/evidence.json`). Wave 1 evidence preserved as `evidence-wave1.json` / `judgment-wave1.json`. The full recorded Wave 1 battery was re-run unmodified (harness.py), judged by Gemini (`judgment.json`: **PASS**, 0 findings, 0 tester errors, all computed checks match), and verified mechanically from the raw evidence.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict CLAIM_SUSTAINED | HTTP 200, verdict CLAIM_SUSTAINED | PASS |
| 2 | violations | HTTP 200, verdict CLAIM_NOT_SUSTAINED | HTTP 200, verdict CLAIM_NOT_SUSTAINED | PASS |
| 3 | sparse | HTTP 200, verdict INSUFFICIENT_EVIDENCE | HTTP 200, verdict INSUFFICIENT_EVIDENCE | PASS |
| 4 | malformed | HTTP 422 {ok:false, error:"invalid_input"}, no verdict | HTTP 422 {ok:false, error:"invalid_input", field:"evaluation"} | PASS |
| 5 | determinism (full-pass repeat) | byte-identical repeat response | determinism_byte_identical = true | PASS |
| 6 | parity (MCP vs REST, full-pass) | MCP structuredContent deep-equals REST artifact | parity_structured_equal = true | PASS |

**F1 disposition: RESOLVED.** Wave 1 F1 was: type-violating manifest fields returned HTTP 200 with a verdict computed over garbage instead of HTTP 422 `{ok:false, error:"invalid_input"}`. On retest the malformed case returns HTTP 422 with body `{"ok": false, "error": "invalid_input", "field": "evaluation", "detail": "evaluation must be an object"}` — exactly the contract error, no verdict artifact. All other cases (full-pass, violations, sparse) return their Wave 1-correct outcomes unchanged, and determinism and MCP/REST parity still hold. F1 is closed by this retest; no new findings.

### Second tester — DeepSeek (retest)

DeepSeek verdict: **PASS** — its per-case entries are confirmations (each ends "Matches"), not defects. It independently recomputed, with arithmetic shown: `secret_length_margin_chars` full-pass = 16 − 16 = **0.0000**, violations = 8 − 16 = **−8.0000**; KDF passes only as exactly `"argon2id"` (violations `"sha256"` fails); full-pass 26 pass → CLAIM_SUSTAINED; violations exactly the 6 designed fails → CLAIM_NOT_SUSTAINED; sparse 26 missing → INSUFFICIENT_EVIDENCE with null status/margin; malformed 422 invalid_input confirmed (F1 fix). Every computed check matches the artifact — **recomputed mismatches: none**. Raw output: `verification/work/zero-trust-evaluation-verdict/deepseek-retest-raw.txt`.

Tester errors: none.

**Retest verdict: PASS**
