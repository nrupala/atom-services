# Test report — pricing-unit-economics-pack

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 9595ea665b634289aad158b7fff277ac
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/pricing-unit-economics-pack/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (product `SaaS-Platform-Alpha`): revenue model `subscription` with bookings/billings/recognized revenue distinct, recognition timing documented and accountant alignment declared, value-based anchor, good-better-best tiers, grandfathering plan and annual review all true, one tier `Basic` (price `100.0`, variable cost `20.0`, units `10`, declared revenue `1000.0`, declared contribution `800.0`), all six discount-policy flags true, one discount `EarlyBird` with reason `Launch promotion`, unit economics price `100.0` / variable cost `20.0` / fixed costs `500.0` / units sold `10` / declared ratio `0.8` / declared break-even `6.25` / declared total contribution `800.0`, churn flags true, MRR bridge opening `1000.0` + new `200.0` + expansion `50.0` − contraction `10.0` − churned `40.0` = declared closing `1200.0`, reporting flags true, all three red-line flags false | HTTP 200, verdict `PRICING_UNIT_ECONOMICS_PACK_READY`, `tiers_count` `1`, `total_declared_tier_revenue` `"1000.000000"`, `total_declared_tier_contribution` `"800.000000"`, `tier_contribution_margin` `"0.800000"`, `discounts_count` `1`, `discount_reason_coverage` `"1.000000"`, `computed_contribution_margin_ratio` `"0.800000"`, `computed_break_even_units` `"6.250000"`, `computed_total_contribution` `"800.000000"`, `computed_closing_mrr` `"1200.000000"`, all differences `"0.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `PRICING_UNIT_ECONOMICS_PACK_READY`, 37 pass / 0 fail / 0 missing, all six sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except `tiers[0].declared_revenue` `999.0` (price `100.0` × units `10` = `1000.0`) | HTTP 200, verdict `PRICING_UNIT_ECONOMICS_PACK_NOT_READY`, the 1 named check fails | HTTP 200, `PRICING_UNIT_ECONOMICS_PACK_NOT_READY`, 36 pass / 1 fail / 0 missing; failing check exactly `tier_revenue_matches_price_times_units`; `tiers_count` `1`, `tiers_mismatching_revenue` `["Basic"]`, `tiers_mismatching_contribution` `[]`, `total_declared_tier_revenue` `"999.000000"`, `total_declared_tier_contribution` `"800.000000"`, `tier_contribution_margin` `"0.800801"`, `discounts_count` `1`, `discount_reason_coverage` `"1.000000"`, `computed_contribution_margin_ratio` `"0.800000"`, `computed_break_even_units` `"6.250000"`, `computed_total_contribution` `"800.000000"`, `computed_closing_mrr` `"1200.000000"`, all differences `"0.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; section `pricing_and_packaging` `fail`, other five sections `pass` | PASS |
| 3 | sparse — only `product` (`Minimal-Product`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 37 missing, all six sections `insufficient_evidence`, `tiers_count` null, `duplicate_tier_names` null, `tiers_mismatching_revenue` null, `tiers_mismatching_contribution` null, `total_declared_tier_revenue` null, `total_declared_tier_contribution` null, `tier_contribution_margin` null, `discounts_count` null, `discounts_without_reason` null, `duplicate_discount_labels` null, `discount_reason_coverage` null, `computed_contribution_margin_ratio` null, `contribution_margin_difference` null, `computed_break_even_units` null, `break_even_difference` null, `computed_total_contribution` null, `total_contribution_difference` null, `computed_closing_mrr` null, `closing_mrr_difference` null, `computed_status` null | PASS |
| 4 | malformed — `revenue_model: "should_be_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"revenue_model","detail":"revenue_model must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `pricing_unit_economics_pack`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 37 checks and a text stamp):

```json
{"service": "pricing-unit-economics-pack", "atom_version": "0.1.0", "product": "SaaS-Platform-Alpha", "verdict": "PRICING_UNIT_ECONOMICS_PACK_READY", "sections": {"revenue_model_and_recognition": "pass", "pricing_and_packaging": "pass", "discount_and_payment_guardrails": "pass", "unit_economics": "pass", "churn_retention_and_reporting": "pass", "red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "tiers_count": 1, "duplicate_tier_names": [], "tiers_mismatching_revenue": [], "tiers_mismatching_contribution": [], "total_declared_tier_revenue": "1000.000000", "total_declared_tier_contribution": "800.000000", "tier_contribution_margin": "0.800000", "discounts_count": 1, "discounts_without_reason": [], "duplicate_discount_labels": [], "discount_reason_coverage": "1.000000", "computed_contribution_margin_ratio": "0.800000", "contribution_margin_difference": "0.000000", "computed_break_even_units": "6.250000", "break_even_difference": "0.000000", "computed_total_contribution": "800.000000", "total_contribution_difference": "0.000000", "computed_closing_mrr": "1200.000000", "closing_mrr_difference": "0.000000", "summary": "37 pass, 0 fail, 0 missing of 37 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"revenue_model","detail":"revenue_model must be an object"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 4 rejections in total — by rule: R1 check-register ×1, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named the prose label `Tier revenue matches price times units` instead of an exact check name — validator rejection: "failing_checks names 'Tier revenue matches price times units', which is not in the atom's check register (37 checks)". Corrected before execution: the violations case was rebuilt as a full copy of the full-pass manifest carrying exactly the planted change — `tiers[0].declared_revenue` = `999.0` — with `failing_checks` set to exactly the 1 exact check name that change fails: `tier_revenue_matches_price_times_units`.
2. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes). Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `within_stated_limits_on_declared_evidence`, `tiers_count` `1`, `duplicate_tier_names` `[]`, `tiers_mismatching_revenue` `[]`, `tiers_mismatching_contribution` `[]`, `total_declared_tier_revenue` `"1000.000000"`, `total_declared_tier_contribution` `"800.000000"`, `tier_contribution_margin` `"0.800000"`, `discounts_count` `1`, `discounts_without_reason` `[]`, `duplicate_discount_labels` `[]`, `discount_reason_coverage` `"1.000000"`, `computed_contribution_margin_ratio` `"0.800000"`, `contribution_margin_difference` `"0.000000"`, `computed_break_even_units` `"6.250000"`, `break_even_difference` `"0.000000"`, `computed_total_contribution` `"800.000000"`, `total_contribution_difference` `"0.000000"`, `computed_closing_mrr` `"1200.000000"`, `closing_mrr_difference` `"0.000000"`).
3. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `outside_stated_limits_on_declared_evidence`, `tiers_count` `1`, `duplicate_tier_names` `[]`, `tiers_mismatching_revenue` `["Basic"]`, `tiers_mismatching_contribution` `[]`, `total_declared_tier_revenue` `"999.000000"`, `total_declared_tier_contribution` `"800.000000"`, `tier_contribution_margin` `"0.800801"`, `discounts_count` `1`, `discounts_without_reason` `[]`, `duplicate_discount_labels` `[]`, `discount_reason_coverage` `"1.000000"`, `computed_contribution_margin_ratio` `"0.800000"`, `contribution_margin_difference` `"0.000000"`, `computed_break_even_units` `"6.250000"`, `break_even_difference` `"0.000000"`, `computed_total_contribution` `"800.000000"`, `total_contribution_difference` `"0.000000"`, `computed_closing_mrr` `"1200.000000"`, `closing_mrr_difference` `"0.000000"`).
4. (R3) Violations input was missing the key paths `discounts[].label` and `discounts[].reason` present in the full-pass manifest (the raw design carried an empty `discounts` list) — validator rejection: "violations input is missing key paths present in the full-pass manifest (a sparse violations input reads as missing evidence, not as failure): discounts[].label, discounts[].reason". Corrected before execution by the same rebuild: the violations input is a deep copy of the full-pass manifest (restoring the `EarlyBird` discount row and the full-pass product name), so every key path is present and the planted mutation changes a value only.

The full-pass input was verified genuinely valid against the Python oracle before execution (the oracle returns all 37 checks pass on it — no correction needed), and the sparse case was set to an identity-only manifest (`{product}` only, as designed). The malformed case as designed already carried exactly one documented type violation (`revenue_model` as a string where an object is required) and needed no correction.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (tier revenue and contribution per row, tier totals and margin, discount coverage, the contribution-margin ratio, break-even units and total contribution, the MRR-bridge closing figure and all differences, under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/pricing-unit-economics-pack/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass tier `Basic` revenue (100 × 10) / contribution ((100 − 20) × 10) | 1000.0 / 800.0 | 1000.0 / 800.0 (no mismatch) | ✓ |
| full-pass `tiers_count` | 1 | 1 | ✓ |
| full-pass `total_declared_tier_revenue` / `total_declared_tier_contribution` | "1000.000000" / "800.000000" | "1000.000000" / "800.000000" | ✓ |
| full-pass `tier_contribution_margin` (800 ÷ 1000) | "0.800000" | "0.800000" | ✓ |
| full-pass `duplicate_tier_names` / `tiers_mismatching_revenue` / `tiers_mismatching_contribution` | [] / [] / [] | [] / [] / [] | ✓ |
| full-pass `discounts_count` / `discounts_without_reason` / `duplicate_discount_labels` | 1 / [] / [] | 1 / [] / [] | ✓ |
| full-pass `discount_reason_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `computed_contribution_margin_ratio` ((100 − 20) ÷ 100) / difference | "0.800000" / "0.000000" | "0.800000" / "0.000000" | ✓ |
| full-pass `computed_break_even_units` (500 ÷ 80) / difference | "6.250000" / "0.000000" | "6.250000" / "0.000000" | ✓ |
| full-pass `computed_total_contribution` (10 × 80) / difference | "800.000000" / "0.000000" | "800.000000" / "0.000000" | ✓ |
| full-pass `computed_closing_mrr` (1000 + 200 + 50 − 10 − 40) / difference | "1200.000000" / "0.000000" | "1200.000000" / "0.000000" | ✓ |
| full-pass `computed_status` (all thirteen computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations tier `Basic` revenue mismatch (declared 999 vs 100 × 10) | ["Basic"] | ["Basic"] | ✓ |
| violations `total_declared_tier_revenue` / `total_declared_tier_contribution` | "999.000000" / "800.000000" | "999.000000" / "800.000000" | ✓ |
| violations `tier_contribution_margin` (800 ÷ 999) | "0.800801" | "0.800801" | ✓ |
| violations unit-economics figures (unchanged inputs) | ratio "0.800000", break-even "6.250000", total "800.000000", all differences "0.000000" | same | ✓ |
| violations `computed_closing_mrr` / difference | "1200.000000" / "0.000000" | "1200.000000" / "0.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly `tier_revenue_matches_price_times_units` | same 1 | ✓ |
| verdicts | PRICING_UNIT_ECONOMICS_PACK_READY / PRICING_UNIT_ECONOMICS_PACK_NOT_READY (1 fail) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 1-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `revenue_model`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
