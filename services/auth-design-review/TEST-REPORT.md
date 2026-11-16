# Test report — auth-design-review

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment babe764a73734f93a8016267e77af193
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/auth-design-review/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — passkeys/MFA, sound sessions, `passwords_used` `false` and `oauth_used` `false` (so the two password checks and five OAuth checks pass as not applicable), sound service tokens / authorization / lifecycle / anti-abuse / audit, all must-be-false red lines `false` | HTTP 200, verdict `AUTH_DESIGN_SOUND` | HTTP 200, `AUTH_DESIGN_SOUND`, 40 pass / 0 fail / 0 missing | PASS |
| 2 | violations — `shared_accounts_present` `true`, `long_lived_unrevocable_credentials_present` `true`, `client_side_only_authorization` `true` | HTTP 200, verdict `AUTH_DESIGN_DEFICIENT`, the 3 named checks fail | HTTP 200, `AUTH_DESIGN_DEFICIENT`, 37 pass / 3 fail / 0 missing; failing checks exactly `no_shared_accounts`, `no_long_lived_unrevocable_credentials`, `no_client_side_only_authorization` | PASS |
| 3 | sparse — only `system` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 40 missing | PASS |
| 4 | malformed — `human_auth: "should-be-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"human_auth","detail":"human_auth must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `auth_design_review`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 40 checks and a text stamp):

```json
{"service": "auth-design-review", "atom_version": "0.1.0", "system": "secure-auth-service", "verdict": "AUTH_DESIGN_SOUND", "sections": {"human_authentication": "pass", "sessions": "pass", "oauth_and_oidc": "pass", "service_tokens": "pass", "authorization": "pass", "lifecycle": "pass", "anti_abuse_and_audit": "pass"}, "summary": "40 pass, 0 fail, 0 missing of 40 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"human_auth","detail":"human_auth must be an object"}
```

## Findings

No findings.

## Tester errors

No tester errors in this atom's run. The designed cases were sanity-checked against `contract.yaml` + `SERVICE.md` before execution (nesting under `human_auth` / `sessions` / `oauth` / `service_tokens` / `authorization` / `lifecycle` / `anti_abuse` / `audit`, must-be-false red lines present, gated password and OAuth checks correctly omitted while their gates are `false` — the SERVICE.md conditional rule passes them as not applicable) and needed no correction.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's checks from the case inputs by hand (the two conditional groups — password checks required only when `passwords_used` is `true`, the five OAuth checks required only when `oauth_used` is `true`, otherwise not applicable — plus the per-section tallies over all 40 checks) and verified the artifact's counts and verdicts. Raw output: `verification/work/auth-design-review/deepseek-raw.txt`.

**DeepSeek verdict: PASS** — every recomputed quantity matches the artifact; no mismatches. **AGREEMENT: full**

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass password checks (`passwords_used` false) | 2 × N/A pass | 2 × pass | ✓ |
| full-pass OAuth checks (`oauth_used` false) | 5 × N/A pass | 5 × pass | ✓ |
| full-pass tally | 40 pass / 0 fail / 0 missing | 40 / 0 / 0 | ✓ |
| violations tally | 37 pass / 3 fail / 0 missing | 37 / 3 / 0 | ✓ |
| violations failing checks | exactly the 3 planted red lines | same 3 | ✓ |
| verdicts | SOUND / DEFICIENT (3 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 3-check red-line failure set on the violations case and the conditional password/OAuth handling.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` naming `human_auth`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
