# Test report — cost-estimate-preparation

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 56f92826f4284ec9a8570d683113aa86
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/cost-estimate-preparation/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — 1 line item (Labor, 100 × 50 = 5000 = subtotal), 1 three-point item (10/20/30, spread 20), contingency 10% = 500, escalation 5% = 250, grand total 5750, quote variance (110−100)/100 = 10%, class `definitive`, method `bottom_up`, all red lines false | HTTP 200, verdict `COST_ESTIMATE_READY`, `computed_subtotal` `5000.000000`, `computed_total_spread` `20.000000`, `computed_contingency_amount` `500.000000`, `computed_escalation_amount` `250.000000`, `computed_grand_total` `5750.000000`, `computed_quote_variance_percent` `10.000000`, all differences `0.000000` | HTTP 200, `COST_ESTIMATE_READY`, 35 pass / 0 fail / 0 missing, exactly those computed values, `line_items_evaluated` 1, `uncertainty_items_evaluated` 1, `computed_status` `within_stated_limits_on_declared_evidence` | PASS |
| 2 | violations — full manifest with class `invalid_class`, `hidden_padding_in_rates` true, line declared 6000 vs 100 × 50 = 5000, spread declared 50 vs 30 − 10 = 20, contingency declared 500 vs 6000 × 10% = 600 (subtotal 6000 = sum of declared amounts, escalation 300, grand total 6800 on declared amounts, variance 10 all hold) | HTTP 200, verdict `COST_ESTIMATE_NOT_READY`, the 5 named checks fail | HTTP 200, `COST_ESTIMATE_NOT_READY`, 30 pass / 5 fail / 0 missing; failing checks exactly `estimate_class_in_stated_classes`, `no_hidden_padding_in_rates`, `line_item_amounts_match_quantity_times_rate`, `three_point_spreads_match_pessimistic_minus_optimistic`, `contingency_amount_matches_subtotal_times_percent`; `computed_subtotal` `6000.000000`, `total_spread_difference` `30.000000`, `computed_contingency_amount` `600.000000`, `contingency_difference` `-100.000000`, `computed_grand_total` `6800.000000`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `entity` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 35 missing, computed fields null, `line_items_evaluated` 0, `uncertainty_items_evaluated` 0, `computed_status` null | PASS |
| 4 | malformed — `totals.declared_subtotal: "five thousand"` (string where a number is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"totals.declared_subtotal","detail":"totals.declared_subtotal must be a number"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `cost_estimate_preparation`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array and text stamp trimmed — the full response carries all 35 checks and a text stamp):

```json
{"service": "cost-estimate-preparation", "atom_version": "0.1.0", "entity": "Project Alpha", "verdict": "COST_ESTIMATE_READY", "sections": {"basis_and_class": "pass", "elements_and_line_items": "pass", "uncertainty_and_ranges": "pass", "totals_escalation_and_currency": "pass", "should_cost_and_quotes": "pass", "feedback_loop": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "line_items_evaluated": 1, "computed_subtotal": "5000.000000", "subtotal_difference": "0.000000", "uncertainty_items_evaluated": 1, "computed_total_spread": "20.000000", "total_spread_difference": "0.000000", "computed_contingency_amount": "500.000000", "contingency_difference": "0.000000", "computed_escalation_amount": "250.000000", "escalation_difference": "0.000000", "computed_grand_total": "5750.000000", "grand_total_difference": "0.000000", "computed_quote_variance_percent": "10.000000", "quote_variance_difference": "0.000000", "summary": "35 pass, 0 fail, 0 missing of 35 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"totals.declared_subtotal","detail":"totals.declared_subtotal must be a number"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at judge stage):

1. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`computed_subtotal` `5000.000000`, `subtotal_difference` `0.000000`, `computed_total_spread` `20.000000`, `total_spread_difference` `0.000000`, `computed_contingency_amount` `500.000000`, `contingency_difference` `0.000000`, `computed_escalation_amount` `250.000000`, `escalation_difference` `0.000000`, `computed_grand_total` `5750.000000`, `grand_total_difference` `0.000000`, `computed_quote_variance_percent` `10.000000`, `quote_variance_difference` `0.000000`, `line_items_evaluated` 1, `uncertainty_items_evaluated` 1, `computed_status`).
2. Violations designed `failing_checks` listed section names (`basis_and_class`, `elements_and_line_items`) instead of exact check names. Corrected before execution to the 5 exact check names above.
3. Violations input was sparse — only a partial `basis` object and one line item, with all other sections absent, so 30 of 35 checks would have been `missing`, not failing (verified against the local oracle: 3 pass / 2 fail / 30 missing). Corrected before execution: rebuilt as a full manifest carrying exactly the five planted violations intended (invalid class token, hidden padding red line true, wrong line amount, wrong spread, wrong contingency amount), with the subtotal, escalation, grand-total and variance arithmetic held consistent on the declared amounts so no unintended check fails.
4. Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`computed_subtotal` `6000.000000`, `subtotal_difference` `0.000000`, `computed_total_spread` `20.000000`, `total_spread_difference` `30.000000`, `computed_contingency_amount` `600.000000`, `contingency_difference` `-100.000000`, `computed_escalation_amount` `300.000000`, `escalation_difference` `0.000000`, `computed_grand_total` `6800.000000`, `grand_total_difference` `0.000000`, `computed_quote_variance_percent` `10.000000`, `quote_variance_difference` `0.000000`, `line_items_evaluated` 1, `uncertainty_items_evaluated` 1, `computed_status`).
5. Malformed designed as `basis: "not_an_object"` — a section-level object type that the SERVICE.md input table does not list as a typed field. Corrected before execution: replaced with a documented typed field, `totals.declared_subtotal` (number), carrying the string `"five thousand"`, so the 422 names that exact field.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (line amount quantity × rate and subtotal sum, three-point spread pessimistic − optimistic and ordering, contingency and escalation subtotal × percent, grand total on declared amounts, should-cost variance (quote − benchmark) / benchmark × 100, and `computed_status`, all with the SERVICE.md 6dp round-half-up rule) and verified the artifact's numbers and verdicts. Raw output: `verification/work/cost-estimate-preparation/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `computed_subtotal` (sum of declared amounts; line 100 × 50) | 5000.000000 | 5000.000000 | ✓ |
| full-pass `computed_total_spread` (30 − 10) | 20.000000 | 20.000000 | ✓ |
| full-pass `computed_contingency_amount` (5000 × 10%) | 500.000000 | 500.000000 | ✓ |
| full-pass `computed_escalation_amount` (5000 × 5%) | 250.000000 | 250.000000 | ✓ |
| full-pass `computed_grand_total` (5000 + 500 + 250) | 5750.000000 | 5750.000000 | ✓ |
| full-pass `computed_quote_variance_percent` ((110 − 100) / 100 × 100) | 10.000000 | 10.000000 | ✓ |
| violations `computed_subtotal` (sum of declared amounts) | 6000.000000 | 6000.000000 | ✓ |
| violations `total_spread_difference` (50 − 20) | 30.000000 | 30.000000 | ✓ |
| violations `computed_contingency_amount` (6000 × 10%) | 600.000000 | 600.000000 | ✓ |
| violations `contingency_difference` (500 − 600) | -100.000000 | -100.000000 | ✓ |
| violations `computed_grand_total` (6000 + 500 + 300, declared amounts) | 6800.000000 | 6800.000000 | ✓ |
| verdicts | COST_ESTIMATE_READY / COST_ESTIMATE_NOT_READY (5 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 5-check failure set on the violations case. The coordinating tester's own headline recompute also matches: line 100 × 50 = 5000, contingency 5000 × 10% = 500, escalation 5000 × 5% = 250, grand total 5000 + 500 + 250 = 5750 → `computed_grand_total` `5750.000000`, identical to the artifact.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `totals.declared_subtotal`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
