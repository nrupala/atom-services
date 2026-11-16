# Test report — base-rate-card

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment babe764a73734f93a8016267e77af193
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/base-rate-card/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — reference class size 100, successes 50, stated 0.5, all seven fallacies checked, confidence 0.8 | HTTP 200, verdict `CARD_COMPLETE`, `reference_rate` `0.500000`, `base_rate_difference` `0.000000`, `fallacies_not_checked` `[]` | HTTP 200, `CARD_COMPLETE`, 23 pass / 0 fail / 0 missing, exactly those computed values, `computed_status` `within_stated_limits_on_declared_evidence` | PASS |
| 2 | violations — stated 0.9 vs implied 0.5, `opposing_view_strawmanned` true, fallacies only `[ad_hominem]`, confidence 1.5, vibes/authority and certainty-outruns true | HTTP 200, verdict `CARD_NOT_COMPLETE`, the 6 named checks fail | HTTP 200, `CARD_NOT_COMPLETE`, 17 pass / 6 fail / 0 missing; failing checks exactly `base_rate_consistent_with_reference_counts`, `no_strawmanning`, `all_stated_fallacies_checked`, `confidence_within_probability_bounds`, `conclusion_not_from_vibes_or_authority_alone`, `certainty_does_not_outrun_evidence`; `reference_rate` `0.500000`, `base_rate_difference` `0.400000`, `fallacies_not_checked` 6 omitted entries, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `claim` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 23 missing, computed fields null | PASS |
| 4 | malformed — `evidence: "should_be_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"evidence","detail":"evidence must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `base_rate_card`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 23 checks and a text stamp):

```json
{"service": "base-rate-card", "atom_version": "0.1.0", "claim": "The project will launch on time.", "verdict": "CARD_COMPLETE", "sections": {"claim_and_evidence": "pass", "base_rates": "pass", "steelman": "pass", "fallacy_spot_check": "pass", "calibration": "pass", "second_order_and_judgment": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "reference_rate": "0.500000", "base_rate_difference": "0.000000", "fallacies_not_checked": [], "summary": "23 pass, 0 fail, 0 missing of 23 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"evidence","detail":"evidence must be an object"}
```

## Findings

No findings.

## Tester errors

1 tester error, corrected at design time before execution and not scored against the atom:

1. Violations designed `failing_checks` listed section names (`base_rates`, `steelman`, `fallacy_spot_check`, `calibration`, `second_order_and_judgment`) instead of exact check names. Corrected before execution to the 6 exact check names above, with no change to any input value or expected verdict.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (base rate successes/size with the SERVICE.md 6dp round-half-up rule, fallacy coverage, confidence bounds, and `computed_status`) and verified the artifact's numbers and verdicts. Raw output: `verification/work/base-rate-card/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `reference_rate` (50 / 100) | 0.500000 | 0.500000 | ✓ |
| full-pass `base_rate_difference` (0.5 − 0.5) | 0.000000 | 0.000000 | ✓ |
| violations `reference_rate` (50 / 100) | 0.500000 | 0.500000 | ✓ |
| violations `base_rate_difference` (0.9 − 0.5) | 0.400000 | 0.400000 | ✓ |
| full-pass `fallacies_not_checked` | [] | [] | ✓ |
| violations `fallacies_not_checked` | 6 omitted entries | same 6 | ✓ |
| verdicts | CARD_COMPLETE / CARD_NOT_COMPLETE (6 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 6-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
