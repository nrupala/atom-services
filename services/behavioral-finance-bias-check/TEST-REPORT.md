# Test report — behavioral-finance-bias-check

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment babe764a73734f93a8016267e77af193
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/behavioral-finance-bias-check/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — entry decision (`is_entry` true, not a major move), sizing cap 10.0 vs size 5.0, cooling-off 48.0h elapsed, one considered bias with counter applied, all playbook/journal/watch fields true, all must-be-false fields false | HTTP 200, verdict `BIAS_CHECK_CLEAR`, `position_size_over_cap_percent` `-5.0000`, `cooling_off_hours_below_48` `0.0000`, `computed_status` `within_limits_on_declared_evidence`, `biases_considered_count` 1 | HTTP 200, `BIAS_CHECK_CLEAR`, 30 pass / 0 fail / 0 missing, exactly those computed values | PASS |
| 2 | violations — non-entry decision, sizing cap 5.0 vs size 10.0, considered bias with `counter_applied` false, `continuous_price_watching` true, `decision_driven_by_headlines` true | HTTP 200, verdict `BIAS_CHECK_FAILED`, the 4 named checks fail | HTTP 200, `BIAS_CHECK_FAILED`, 26 pass / 4 fail / 0 missing; failing checks exactly `position_size_within_sizing_cap`, `all_considered_biases_have_counter_applied`, `no_continuous_price_watching`, `decision_not_driven_by_headlines`; `position_size_over_cap_percent` `5.0000`, `computed_status` `outside_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `decision` + `decision_context` (`is_entry` false, `is_major_move` false) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 3 pass (the three gated not-applicable checks) / 0 fail / 27 missing, computed fields null | PASS |
| 4 | malformed — `decision_context: "not_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"decision_context","detail":"decision_context must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `behavioral_finance_bias_check`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 30 checks and a text stamp):

```json
{"service": "behavioral-finance-bias-check", "atom_version": "0.1.0", "decision": "Buy AAPL", "verdict": "BIAS_CHECK_CLEAR", "sections": {"bias_playbook": "pass", "precommitment_and_thesis": "pass", "cooling_off": "pass", "decision_journal": "pass", "watch_and_challenge": "pass", "temptation_and_red_lines": "pass"}, "computed_status": "within_limits_on_declared_evidence", "biases_considered_count": 1, "position_size_over_cap_percent": "-5.0000", "cooling_off_hours_below_48": "0.0000", "summary": "30 pass, 0 fail, 0 missing of 30 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"decision_context","detail":"decision_context must be an object"}
```

## Findings

No findings.

## Tester errors

2 design-time tester errors, both corrected in `cases.json` before execution; neither was scored against the atom:

1. **violations — expected failing checks named input fields, not checks.** As designed, `expect.failing_checks` listed the manifest field names (`overconfidence_sizing_cap_percent`, `biases_considered`, `continuous_price_watching`, `decision_driven_by_headlines`). Normalised before execution to the exact check names the contract's output carries (`position_size_within_sizing_cap`, `all_considered_biases_have_counter_applied`, `no_continuous_price_watching`, `decision_not_driven_by_headlines`). No input value was changed; the live artifact failed exactly those four checks.
2. **full-pass — computed spot checks recorded only in notes.** As designed, the spot-check values appeared in the `notes` text instead of the structured `expect.computed_spot_checks` field the design brief requires. The structured field was added before execution with the same (correct) values; no input value was changed.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (sizing-cap comparison and excess, the 48h cooling-off rule for entry decisions, counters-per-considered-bias, `computed_status`, and the SERVICE.md 4dp round-half-up serialization) and verified the artifact's numbers and verdicts. Raw output: `verification/work/behavioral-finance-bias-check/deepseek-raw.txt`.

**DeepSeek verdict: PASS** — every recomputed quantity matches the artifact; no mismatches. Agreement line: `AGREEMENT: full`.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `position_size_over_cap_percent` (5.0 − 10.0) | -5.0000 | -5.0000 | ✓ |
| full-pass `cooling_off_hours_below_48` (48 − 48.0, entry) | 0.0000 | 0.0000 | ✓ |
| violations `position_size_over_cap_percent` (10.0 − 5.0) | 5.0000 | 5.0000 | ✓ |
| violations `cooling_off_hours_below_48` (non-entry) | null | null | ✓ |
| `biases_considered_count` (both cases) | 1 | 1 | ✓ |
| `computed_status` full-pass / violations | within_limits / outside_limits | same | ✓ |
| verdicts | BIAS_CHECK_CLEAR / BIAS_CHECK_FAILED (exactly the 4 planted fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity.
