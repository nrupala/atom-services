# Test report — engineering-project-budget-pack

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 5cf70cb60526415d89b4db5e5cd02744
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/engineering-project-budget-pack/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (entity `Project Alpha`): all basis/build/contingency/approval/tracking/closeout declarations true, the three must-be-false flags false, one line item `Wiring` 10 × 50 = 500 (`quote_based`), subtotal 500, contingency 10% = 50, reserve 100, total 650, one change entry +50, revised 700, forecast 400 + 100 = 500 | HTTP 200, verdict `BUDGET_PACK_READY`, `line_items_evaluated` `1`, `computed_subtotal` `"500.000000"`, `computed_contingency_amount` `"50.000000"`, `computed_total_budget` `"650.000000"`, `computed_revised_budget` `"700.000000"`, `computed_forecast_variance` `"-200.000000"`, `computed_final_variance` `"-100.000000"`, `computed_unspent_contingency` `"30.000000"`, all differences `"0.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `BUDGET_PACK_READY`, 42 pass / 0 fail / 0 missing, all six sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest with `line_items[0].pricing_basis` `invalid_token`, `totals.declared_subtotal` 600 (line sum 500), downstream declared values re-derived from the wrong subtotal (contingency 60, total 760, revised 810, forecast variance -310, final variance -210, unspent 40) so nothing else cascades | HTTP 200, verdict `BUDGET_PACK_NOT_READY`, the 2 named checks fail | HTTP 200, `BUDGET_PACK_NOT_READY`, 40 pass / 2 fail / 0 missing; failing checks exactly `line_item_pricing_basis_marked`, `subtotal_matches_sum_of_line_items`; `computed_subtotal` `"500.000000"`, `subtotal_difference` `"100.000000"`, `computed_contingency_amount` `"60.000000"`, `computed_total_budget` `"760.000000"`, `computed_revised_budget` `"810.000000"`, `computed_forecast_variance` `"-310.000000"`, `computed_final_variance` `"-210.000000"`, `computed_unspent_contingency` `"40.000000"`, all other differences `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; only section `budget_build_and_line_items` `fail`, the other five `pass` | PASS |
| 3 | sparse — only `entity` (`Minimal Project`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 42 missing, all six sections `insufficient_evidence`, `line_items_evaluated` 0, `change_entries_evaluated` 0, every computed amount and difference null, `computed_status` null | PASS |
| 4 | malformed — `basis: "not_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"basis","detail":"basis must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `engineering_project_budget_pack`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 42 checks and a text stamp):

```json
{"service": "engineering-project-budget-pack", "atom_version": "0.1.0", "entity": "Project Alpha", "verdict": "BUDGET_PACK_READY", "sections": {"basis_document": "pass", "budget_build_and_line_items": "pass", "contingency_reserve_and_totals": "pass", "approval_and_baseline": "pass", "change_control_and_tracking": "pass", "closeout_and_contingency_disposition": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "line_items_evaluated": 1, "computed_subtotal": "500.000000", "subtotal_difference": "0.000000", "change_entries_evaluated": 1, "computed_change_impact_total": "50.000000", "change_impact_difference": "0.000000", "computed_contingency_amount": "50.000000", "contingency_difference": "0.000000", "computed_total_budget": "650.000000", "total_budget_difference": "0.000000", "computed_revised_budget": "700.000000", "revised_budget_difference": "0.000000", "computed_total_forecast": "500.000000", "total_forecast_difference": "0.000000", "computed_forecast_variance": "-200.000000", "forecast_variance_difference": "0.000000", "computed_final_variance": "-100.000000", "final_variance_difference": "0.000000", "computed_unspent_contingency": "30.000000", "unspent_contingency_difference": "0.000000", "summary": "42 pass, 0 fail, 0 missing of 42 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"basis","detail":"basis must be an object"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 5 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (all eleven computed quantities with their differences, the two evaluated counts and `computed_status`, every value recomputed by hand from the manifest under SERVICE.md's fixed 6-decimal rule — see error 5 for the values after that correction).
2. (R1) Violations `expect.failing_checks` listed prose shorthand (`Line-item pricing basis`, `Subtotal`) instead of exact check names — 2 validator rejections. Corrected before execution to the 2 exact check names the planted values fail: `line_item_pricing_basis_marked`, `subtotal_matches_sum_of_line_items`.
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`computed_subtotal` `"500.000000"`, `subtotal_difference` `"100.000000"`, `computed_contingency_amount` `"60.000000"`, `computed_total_budget` `"760.000000"`, `computed_revised_budget` `"810.000000"`, `computed_forecast_variance` `"-310.000000"`, `computed_final_variance` `"-210.000000"`, `computed_unspent_contingency` `"40.000000"`, remaining differences `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3) Violations input was sparse instead of a full manifest — it carried only `line_items` and a partial `totals` object, omitting 52 key paths of the full-pass manifest. Corrected before execution: rebuilt it as a full copy of the (corrected) full-pass manifest carrying exactly the 2 planted violations (`pricing_basis` `invalid_token`; `declared_subtotal` 600 against a line sum of 500) and nothing else changed in kind — the downstream declared totals were re-derived from the wrong subtotal (contingency 600 × 10 / 100 = 60; total 600 + 60 + 100 = 760; revised 760 + 50 = 810; forecast variance 500 − 810 = −310; final variance 600 − 810 = −210; unspent 60 − 20 = 40) so the planted subtotal error cannot cascade into the contingency, total-budget, revised-budget, variance or unspent checks, which re-derive from the declared figures by design.
5. (Design validity — not caught by the validator) The raw full-pass manifest declared `change_entries: []` (an empty list). Per SERVICE.md an absent / non-list / empty `change_entries` list leaves all four computed change checks missing, so the raw manifest evaluated to `INSUFFICIENT_EVIDENCE` (38 pass / 0 fail / 4 missing, `computed_status` null), not the `BUDGET_PACK_READY` its notes claimed. Corrected before execution: added one complete change entry (`Additional conduit run`, `cost_impact` 50, impact statement present, approved before work) and re-derived the downstream chain by hand — `declared_total_change_impact` 50, `declared_revised_budget` 650 + 50 = 700, `declared_forecast_variance_amount` 500 − 700 = −200, `declared_final_variance_amount` 600 − 700 = −100 (forecast, final-cost and unspent figures otherwise unchanged) — after which the manifest genuinely passes all 42 checks.

The sparse case was verified genuinely sparse per SERVICE.md before execution (only `entity` declared; all 42 checks missing — no correction needed), and the malformed case needed no correction (exactly one type violation of a documented typed field — `basis` as a string where an object is required — which the validator accepted under R4).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (all eleven computed checks in both the full-pass and violations cases — line-item amounts, subtotal, contingency amount, total budget, change-impact total, revised budget, total forecast, forecast variance, final variance and unspent contingency, with the evaluated counts — under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, plus the derived `computed_status`, the failing-check sets and the verdicts) and verified the artifacts' values. Raw output: `verification/work/engineering-project-budget-pack/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `line_items_evaluated` / `change_entries_evaluated` | 1 / 1 | 1 / 1 | ✓ |
| full-pass `computed_subtotal` (sum of declared line amounts) | "500.000000" | "500.000000" | ✓ |
| full-pass `computed_contingency_amount` (500 × 10 / 100) | "50.000000" | "50.000000" | ✓ |
| full-pass `computed_total_budget` (500 + 50 + 100) | "650.000000" | "650.000000" | ✓ |
| full-pass `computed_change_impact_total` / `computed_revised_budget` (50; 650 + 50) | "50.000000" / "700.000000" | "50.000000" / "700.000000" | ✓ |
| full-pass `computed_total_forecast` (400 + 100) | "500.000000" | "500.000000" | ✓ |
| full-pass `computed_forecast_variance` (500 − 700) / `computed_final_variance` (600 − 700) | "-200.000000" / "-100.000000" | "-200.000000" / "-100.000000" | ✓ |
| full-pass `computed_unspent_contingency` (50 − 20) | "30.000000" | "30.000000" | ✓ |
| full-pass `computed_status` (all eleven computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `computed_subtotal` / `subtotal_difference` (600 − 500) | "500.000000" / "100.000000" | "500.000000" / "100.000000" | ✓ |
| violations `computed_contingency_amount` (declared 600 × 10 / 100) / `computed_total_budget` (600 + 60 + 100) | "60.000000" / "760.000000" | "60.000000" / "760.000000" | ✓ |
| violations `computed_revised_budget` (760 + 50) / `computed_forecast_variance` (500 − 810) / `computed_final_variance` (600 − 810) / `computed_unspent_contingency` (60 − 20) | "810.000000" / "-310.000000" / "-210.000000" / "40.000000" | same | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 2 planted checks | same 2 | ✓ |
| verdicts | BUDGET_PACK_READY / BUDGET_PACK_NOT_READY (2 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 2-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only five quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `basis`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
