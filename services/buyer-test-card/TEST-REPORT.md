# Test report — buyer-test-card

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment fa3faa42fac649da873fcc00cfa20f82
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/buyer-test-card/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — decision `adopt`, disposition `disposable`, timebox limit 10 / elapsed 5, both production-boundary flags false, all other evidence true | HTTP 200, verdict `CARD_COMPLETE`, `timebox_overrun_days` `-5.000000`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `CARD_COMPLETE`, 22 pass / 0 fail / 0 missing, exactly those computed values | PASS |
| 2 | violations — decision `maybe`, disposition `production-ready`, timebox limit 5 / elapsed 10, both production-boundary flags true | HTTP 200, verdict `CARD_NOT_COMPLETE`, the 5 named checks fail | HTTP 200, `CARD_NOT_COMPLETE`, 17 pass / 5 fail / 0 missing; failing checks exactly `timebox_within_declared_limit`, `disposition_is_a_stated_option`, `no_silent_poc_to_production`, `poc_result_not_claimed_as_production_evidence`, `decision_is_a_stated_option`; `timebox_overrun_days` `5.000000`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `idea` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 22 missing, computed fields null | PASS |
| 4 | malformed — `hypothesis: "this should be an object, not a string"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"hypothesis","detail":"hypothesis must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `buyer_test_card`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 22 checks and a text stamp):

```json
{"service": "buyer-test-card", "atom_version": "0.1.0", "idea": "AI-driven inventory forecasting", "decision": "adopt", "disposition": "disposable", "verdict": "CARD_COMPLETE", "sections": {"hypothesis": "pass", "criteria_upfront": "pass", "timebox_and_scope": "pass", "disposition_and_production_boundary": "pass", "evidence": "pass", "decision_and_findings": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "timebox_limit_days": 10, "timebox_elapsed_days": 5, "timebox_overrun_days": "-5.000000", "summary": "22 pass, 0 fail, 0 missing of 22 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"hypothesis","detail":"hypothesis must be an object"}
```

## Findings

No findings.

## Tester errors

2 tester errors, corrected at design time before execution and not scored against the atom:

1. Violations designed `failing_checks` listed section names (`decision_and_findings`, `disposition_and_production_boundary`, `timebox_and_scope`) instead of exact check names. Corrected before execution to the 5 exact check names above, with no change to any input value or expected verdict.
2. Full-pass designed `expect` carried the computed quantities only as text in `notes`, with no structured `computed_spot_checks`. Corrected before execution by adding the structured `computed_spot_checks` (`timebox_limit_days` 10, `timebox_elapsed_days` 5, `timebox_overrun_days` `-5.000000`, `computed_status` `within_stated_limits_on_declared_evidence`; the same structured block was added to the violations case), with no change to any input value or expected verdict.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (timebox elapsed-minus-limit with the SERVICE.md 6dp round-half-up rule, decision and disposition vocabulary membership, production-boundary red lines, and `computed_status`) and verified the artifact's numbers and verdicts. Raw output: `verification/work/buyer-test-card/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `timebox_overrun_days` (5 − 10) | -5.000000 | -5.000000 | ✓ |
| violations `timebox_overrun_days` (10 − 5) | 5.000000 | 5.000000 | ✓ |
| full-pass computed checks (timebox / decision `adopt` / disposition `disposable`) | pass / pass / pass | pass / pass / pass | ✓ |
| violations computed checks (timebox / decision `maybe` / disposition `production-ready`) | fail / fail / fail | fail / fail / fail | ✓ |
| violations failing checks | exactly the 5 planted | same 5 | ✓ |
| verdicts | CARD_COMPLETE / CARD_NOT_COMPLETE (5 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 5-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
