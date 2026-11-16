# Test report — bias-controlled-quant-study-pack

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment fa3faa42fac649da873fcc00cfa20f82
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/bias-controlled-quant-study-pack/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — all evidence true / must-be-false false, stability periods `["2010-2015", "2016-2020"]`, signals tested 100 / reported 5, costs included all five stated costs | HTTP 200, verdict `STUDY_PACK_COMPLETE`, `stability_period_count` 2, `signals_reported_minus_tested` -95, `costs_not_included` `[]`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `STUDY_PACK_COMPLETE`, 34 pass / 0 fail / 0 missing, exactly those computed values | PASS |
| 2 | violations — results looked at before registration, survivorship gap and restatement peeking true, Gaussian assumed, duplicate stability period, claim without regime context, reported 10 > tested 5, p-hacked screen and single-sample true, costs only `[spreads]` | HTTP 200, verdict `STUDY_PACK_NOT_COMPLETE`, the 10 named checks fail | HTTP 200, `STUDY_PACK_NOT_COMPLETE`, 0 pass / 10 fail / 24 missing; failing checks exactly `results_not_seen_before_registration`, `no_survivorship_gap`, `no_restatement_peeking`, `gaussian_not_assumed`, `stability_periods_cover_multiple_periods`, `no_claim_without_regime_context`, `reported_signals_within_tested_count`, `no_phacked_screen_presented_as_strategy`, `result_not_from_single_lucky_sample`, `all_stated_costs_included`; `stability_period_count` 1, `signals_reported_minus_tested` 5, `costs_not_included` `["fees", "slippage", "borrow", "taxes"]`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `study` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 34 missing, computed fields null | PASS |
| 4 | malformed — `hypothesis.hypothesis_written: "YES"` (string where a boolean is required), `multiple_testing.signals_tested: "many"` | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"hypothesis.hypothesis_written","detail":"hypothesis.hypothesis_written must be a boolean"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `bias_controlled_quant_study_pack`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 34 checks and a text stamp):

```json
{"service": "bias-controlled-quant-study-pack", "atom_version": "0.1.0", "study": "Market Alpha Study 2024", "verdict": "STUDY_PACK_COMPLETE", "sections": {"hypothesis_preregistration": "pass", "data_hygiene": "pass", "distribution_reality": "pass", "stationarity_and_stability": "pass", "multiple_testing": "pass", "costs": "pass", "reproducibility": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "stability_period_count": 2, "signals_tested": 100, "signals_reported": 5, "signals_reported_minus_tested": -95, "costs_not_included": [], "summary": "34 pass, 0 fail, 0 missing of 34 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"hypothesis.hypothesis_written","detail":"hypothesis.hypothesis_written must be a boolean"}
```

## Findings

No findings.

## Tester errors

3 tester errors, corrected at design time before execution and not scored against the atom:

1. Violations designed `failing_checks` listed section names (`hypothesis_preregistration`, `data_hygiene`, `distribution_reality`, `stationarity_and_stability`, `multiple_testing`, `costs`) instead of exact check names. Corrected before execution to the 10 exact check names above, with no change to any input value or expected verdict.
2. Full-pass computed spot checks were recorded only in the `notes` text instead of a structured `computed_spot_checks` list. A structured list was added before execution.
3. Full-pass designed note stated `signals_reported_minus_tested=95`; the correct value is 5 − 100 = -95. Corrected in the notes and the structured list before execution, with `costs_not_included=[]` and `computed_status` also added; no input value was changed.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (cost coverage against the five stated costs, distinct stability-period count, reported-within-tested coherence and its difference, and `computed_status`) and verified the artifact's numbers and verdicts. Raw output: `verification/work/bias-controlled-quant-study-pack/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `stability_period_count` (distinct `["2010-2015", "2016-2020"]`) | 2 | 2 | ✓ |
| full-pass `signals_reported_minus_tested` (5 − 100) | -95 | -95 | ✓ |
| full-pass `costs_not_included` | [] | [] | ✓ |
| violations `stability_period_count` (distinct `["2020-2021", "2020-2021"]`) | 1 | 1 | ✓ |
| violations `signals_reported_minus_tested` (10 − 5) | 5 | 5 | ✓ |
| violations `costs_not_included` | ["fees", "slippage", "borrow", "taxes"] | same 4 | ✓ |
| verdicts | STUDY_PACK_COMPLETE / STUDY_PACK_NOT_COMPLETE (10 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 10-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `hypothesis.hypothesis_written`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
