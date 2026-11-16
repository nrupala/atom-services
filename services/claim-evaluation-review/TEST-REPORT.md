# Test report — claim-evaluation-review

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 56f92826f4284ec9a8570d683113aa86
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/claim-evaluation-review/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — 1 complete claim entry (all four entry booleans true), all section booleans true, all three red lines false, base rate 50 in 0–100, fallacy screen covering all eight stated fallacies, confidence 80 in 0–100, hit rate 8/10 = 80 declared 80 | HTTP 200, verdict `CLAIM_EVALUATION_COMPLETE`, `claims_evaluated` 1, `base_rate_percent` `50.000000`, `confidence_percent` `80.000000`, `computed_hit_rate_percent` `80.000000`, `hit_rate_difference` `0.000000`, `fallacies_not_checked` `[]` | HTTP 200, `CLAIM_EVALUATION_COMPLETE`, 26 pass / 0 fail / 0 missing, exactly those computed values, `computed_status` `within_stated_limits_on_declared_evidence` | PASS |
| 2 | violations — full manifest with claim restated flag false, `conclusions_from_vibes_or_authority_alone` true, base rate 150, `straw_manning_in_own_favor` true, `fallacies_checked` only `[ad_hominem]`, declared hit rate 99 vs rederived 5/10 = 50, `certainty_outruns_evidence` true | HTTP 200, verdict `CLAIM_EVALUATION_NOT_COMPLETE`, the 7 named checks fail | HTTP 200, `CLAIM_EVALUATION_NOT_COMPLETE`, 19 pass / 7 fail / 0 missing; failing checks exactly `all_claims_restated_precisely`, `no_conclusions_from_vibes_or_authority_alone`, `base_rate_percent_within_percent_range`, `no_straw_manning_in_own_favor`, `fallacy_screen_covers_stated_fallacies`, `declared_hit_rate_matches_correct_divided_by_total`, `certainty_does_not_outrun_evidence`; `computed_hit_rate_percent` `50.000000`, `hit_rate_difference` `49.000000`, `fallacies_not_checked` the 7 omitted entries, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `entity` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 26 missing, computed fields null, `claims_evaluated` 0 | PASS |
| 4 | malformed — `claims: "not-a-list"` (string where a list of claim entries is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"claims","detail":"claims must be a list"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `claim_evaluation_review`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 26 checks and a text stamp):

```json
{"service": "claim-evaluation-review", "atom_version": "0.1.0", "entity": "Test Entity", "verdict": "CLAIM_EVALUATION_COMPLETE", "sections": {"claim_set_and_evidence": "pass", "evidence_hierarchy_and_conflicts": "pass", "base_rates_and_reference_class": "pass", "steelman_and_fallacy_screen": "pass", "calibration": "pass", "second_order_and_judgment": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "claims_evaluated": 1, "base_rate_percent": "50.000000", "confidence_percent": "80.000000", "computed_hit_rate_percent": "80.000000", "hit_rate_difference": "0.000000", "fallacies_not_checked": [], "summary": "26 pass, 0 fail, 0 missing of 26 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"claims","detail":"claims must be a list"}
```

## Findings

No findings.

## Tester errors

3 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 tester errors at judge stage):

1. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`claims_evaluated` 1, `base_rate_percent` `50.000000`, `confidence_percent` `80.000000`, `computed_hit_rate_percent` `80.000000`, `hit_rate_difference` `0.000000`, `fallacies_not_checked` `[]`, `computed_status` `within_stated_limits_on_declared_evidence`).
2. Violations `expect` omitted the structured `computed_spot_checks` entirely. Corrected before execution: added the structured spot-check block (`claims_evaluated` 1, `base_rate_percent` `150.000000`, `confidence_percent` `80.000000`, `computed_hit_rate_percent` `50.000000`, `hit_rate_difference` `49.000000`, `fallacies_not_checked` the 7 omitted stated fallacies, `computed_status` `outside_stated_limits_on_declared_evidence`).
3. Malformed designed with two simultaneous type violations (`claims` as a string and `hierarchy` as a number), which would have made the reported 422 field ambiguous. Corrected before execution: reduced to the single documented typed-field violation `claims: "not-a-list"` (string where a list of claim entries is required).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (claim-entry completeness over the declared claim set, base-rate and confidence percent ranges, fallacy coverage against the eight stated tokens, calibration hit rate correct ÷ total × 100 and its difference, and `computed_status`, all with the SERVICE.md 6dp round-half-up rule) and verified the artifact's numbers and verdicts. Raw output: `verification/work/claim-evaluation-review/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `claims_evaluated` | 1 | 1 | ✓ |
| full-pass `base_rate_percent` (declared 50, in 0–100) | 50.000000 | 50.000000 | ✓ |
| full-pass `confidence_percent` (declared 80, in 0–100) | 80.000000 | 80.000000 | ✓ |
| full-pass `computed_hit_rate_percent` (8 / 10 × 100) | 80.000000 | 80.000000 | ✓ |
| full-pass `hit_rate_difference` (80 − 80) | 0.000000 | 0.000000 | ✓ |
| full-pass `fallacies_not_checked` | [] | [] | ✓ |
| violations `computed_hit_rate_percent` (5 / 10 × 100) | 50.000000 | 50.000000 | ✓ |
| violations `hit_rate_difference` (99 − 50) | 49.000000 | 49.000000 | ✓ |
| violations `base_rate_percent` (declared 150, outside 0–100) | 150.000000 | 150.000000 | ✓ |
| violations `fallacies_not_checked` | 7 omitted entries | same 7 | ✓ |
| verdicts | CLAIM_EVALUATION_COMPLETE / CLAIM_EVALUATION_NOT_COMPLETE (7 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 7-check failure set on the violations case. The coordinating tester's own headline recompute also matches: 8/10 × 100 = 80 → `computed_hit_rate_percent` `80.000000`, identical to the artifact.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `claims`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
