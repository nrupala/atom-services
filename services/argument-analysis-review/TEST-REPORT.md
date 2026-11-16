# Test report — argument-analysis-review

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment babe764a73734f93a8016267e77af193
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/argument-analysis-review/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete anatomy/evidence/calibration/stress-test record, `confidence_percent` 75, all nine fallacy tokens and all six bias tokens screened, `anecdote_treated_as_data` `false` | HTTP 200, verdict `ARGUMENT_ANALYSIS_COMPLETE`, `computed_status` `within_stated_limits_on_declared_evidence`, `missing_fallacies` `[]`, `missing_biases` `[]`, `confidence_percent` 75 | HTTP 200, `ARGUMENT_ANALYSIS_COMPLETE`, 24 pass / 0 fail / 0 missing, exactly those computed values | PASS |
| 2 | violations — `anecdote_treated_as_data` `true`, `confidence_percent` 100 (binary certainty), fallacy screen `[ad_hominem]` only, bias screen `[confirmation]` only | HTTP 200, verdict `ARGUMENT_ANALYSIS_DEFICIENT`, the 4 named checks fail | HTTP 200, `ARGUMENT_ANALYSIS_DEFICIENT`, 20 pass / 4 fail / 0 missing; failing checks exactly `anecdote_not_treated_as_data`, `confidence_probabilistic_and_explicit`, `all_listed_fallacies_screened`, `all_listed_biases_screened`; `computed_status` `outside_stated_limits_on_declared_evidence`, 8 missing fallacies, 5 missing biases | PASS |
| 3 | sparse — only `argument` + `anatomy.premises_identified` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 1 pass / 0 fail / 23 missing, `computed_status` null | PASS |
| 4 | malformed — `anatomy.premises_identified: "not_a_boolean"` (string where a boolean is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"anatomy.premises_identified","detail":"anatomy.premises_identified must be a boolean"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `argument_analysis_review`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 24 checks and a text stamp):

```json
{"service": "argument-analysis-review", "atom_version": "0.1.0", "argument": "All men are mortal; Socrates is a man; therefore Socrates is mortal.", "verdict": "ARGUMENT_ANALYSIS_COMPLETE", "sections": {"anatomy_and_steelman": "pass", "evidence_weighing": "pass", "base_rates_and_calibration": "pass", "stress_testing": "pass", "fallacy_and_bias_screening": "pass", "razors_and_countercase": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "missing_fallacies": [], "missing_biases": [], "confidence_percent": 75, "summary": "24 pass, 0 fail, 0 missing of 24 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"anatomy.premises_identified","detail":"anatomy.premises_identified must be a boolean"}
```

## Findings

No findings.

## Tester errors

No tester errors in this atom's run. The designed cases were sanity-checked against `contract.yaml` + `SERVICE.md` before execution (nesting, token vocabulary, must-be-false field present) and needed no correction. The violations case's expected failing-check labels as designed named the three affected sections; they were read against the exact check names above at judging, with no change to any input value or expected verdict.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (fallacy/bias screen completeness against the skill's nine + six tokens, the strict `0 < confidence_percent < 100` rule, `computed_status`, `missing_fallacies` / `missing_biases` in skill order) and verified the artifact's numbers and verdicts. Raw output: `verification/work/argument-analysis-review/deepseek-raw.txt`.

**DeepSeek verdict: PASS** — every recomputed quantity matches the artifact; no mismatches. **AGREEMENT: full**

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass fallacy screen (9 tokens) | complete, `missing_fallacies` `[]` | complete, `[]` | ✓ |
| full-pass bias screen (6 tokens) | complete, `missing_biases` `[]` | complete, `[]` | ✓ |
| full-pass confidence 75 | pass (0 < 75 < 100) | pass | ✓ |
| violations fallacy screen (`[ad_hominem]`) | fail, 8 missing | fail, 8 missing | ✓ |
| violations bias screen (`[confirmation]`) | fail, 5 missing | fail, 5 missing | ✓ |
| violations confidence 100 | fail (binary certainty) | fail | ✓ |
| `computed_status` full-pass / violations | within / outside stated limits | same | ✓ |
| verdicts | COMPLETE / DEFICIENT (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` naming `anatomy.premises_identified`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
