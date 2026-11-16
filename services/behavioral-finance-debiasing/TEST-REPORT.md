# Test report — behavioral-finance-debiasing

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment babe764a73734f93a8016267e77af193
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/behavioral-finance-debiasing/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — big trade (`is_big_trade` true) with cooling-off taken, all eleven biases screened, one found pattern with technique named and surfaced, rebalancing target 50.0 / current 51.0 / band 2.0, position 1000.0 of portfolio 10000.0, all must-be-false fields false | HTTP 200, verdict `DEBIASED`, `allocation_drift_over_band_percent` `-1.0000`, `position_share_percent_of_portfolio` `10.0000`, `computed_status` `within_declared_band_on_declared_evidence`, `bias_patterns_found_count` 1 | HTTP 200, `DEBIASED`, 36 pass / 0 fail / 0 missing, exactly those computed values | PASS |
| 2 | violations — rebalancing target 50.0 / current 60.0 / band 5.0 (drift 10 > band 5), `single_position_pnl_framing_used` true, `biases_used_to_manipulate` true; all other sections absent or partial | HTTP 200, verdict `NOT_DEBIASED`, the 3 named checks fail | HTTP 200, `NOT_DEBIASED`, 1 pass / 3 fail / 32 missing; failing checks exactly `allocation_within_rebalancing_band`, `not_framed_as_single_position_pnl`, `biases_not_used_to_manipulate`; `allocation_drift_over_band_percent` `5.0000`, `computed_status` `outside_declared_band_on_declared_evidence` | PASS |
| 3 | sparse — only `decision` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 36 missing, computed fields null | PASS |
| 4 | malformed — `context: "not_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"context","detail":"context must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `behavioral_finance_debiasing`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 36 checks and a text stamp):

```json
{"service": "behavioral-finance-debiasing", "atom_version": "0.1.0", "decision": "Sell 50 shares of AAPL", "verdict": "DEBIASED", "sections": {"bias_screening": "pass", "prospect_theory_reframing": "pass", "precommitment_rules": "pass", "journal_checklists_and_cooling_off": "pass", "whole_portfolio_reframing": "pass", "guardrails_and_anti_patterns": "pass"}, "computed_status": "within_declared_band_on_declared_evidence", "bias_patterns_found_count": 1, "allocation_drift_over_band_percent": "-1.0000", "position_share_percent_of_portfolio": "10.0000", "summary": "36 pass, 0 fail, 0 missing of 36 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"context","detail":"context must be an object"}
```

## Findings

No findings.

## Tester errors

2 design-time tester errors, both corrected in `cases.json` before execution; neither was scored against the atom:

1. **violations — expected failing checks named sections, and one named section has no failing check.** As designed, `expect.failing_checks` listed section names (`bias_screening`, `precommitment_rules`, `whole_portfolio_reframing`, `guardrails_and_anti_patterns`). That contradicts the contract twice over: the output names checks, not sections; and the case's `bias_screening` fields are absent, which the contract scores as missing evidence, not failure — that section returns `insufficient_evidence`, not `fail`. Normalised before execution to the exact check names the planted wrong values fail (`allocation_within_rebalancing_band`, `not_framed_as_single_position_pnl`, `biases_not_used_to_manipulate`), and the case notes rewritten to say the remaining sections are missing evidence. No input value was changed; the live artifact failed exactly those three checks and returned `NOT_DEBIASED` as expected.
2. **full-pass — computed spot checks recorded only in notes.** As designed, the spot-check values appeared in the `notes` text instead of the structured `expect.computed_spot_checks` field the design brief requires. The structured field was added before execution with the same (correct) values; no input value was changed.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (rebalancing-band distance and drift-over-band, position share of portfolio, found-pattern technique/surfaced rules, `computed_status`, and the SERVICE.md 4dp round-half-up serialization) and verified the artifact's numbers and verdicts. Raw output: `verification/work/behavioral-finance-debiasing/deepseek-raw.txt`.

**DeepSeek verdict: PASS** — every recomputed quantity matches the artifact; no mismatches. Agreement line: `AGREEMENT: full`.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `allocation_drift_over_band_percent` (\|51.0 − 50.0\| − 2.0) | -1.0000 | -1.0000 | ✓ |
| full-pass `position_share_percent_of_portfolio` (100 × 1000.0 / 10000.0) | 10.0000 | 10.0000 | ✓ |
| violations `allocation_drift_over_band_percent` (\|60.0 − 50.0\| − 5.0) | 5.0000 | 5.0000 | ✓ |
| violations `bias_patterns_found_count` / `position_share_percent_of_portfolio` (undeclared) | null | null | ✓ |
| `computed_status` full-pass / violations | within_declared_band / outside_declared_band | same | ✓ |
| verdicts | DEBIASED / NOT_DEBIASED (exactly the 3 planted fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 3-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity.
