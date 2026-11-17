# Test report — finance-tool-design-advisory

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 38371decd3a447a1b2c82ff4ac4e8e42
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/finance-tool-design-advisory/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (tool `AlphaOptimizer`): all compliance/quant/open-building-blocks/privacy/business-model/behavioural declarations in passing polarity, margin features present with disclosure carried, one feature `BacktestEngine` showing scenarios and trade-offs, not implying advice, figures traceable, declared as a backtest with overfit/survivorship addressed, all five anti-pattern flags false | HTTP 200, verdict `FINANCE_TOOL_DESIGN_SOUND`, `features_count` `1`, `scenario_coverage` `"1.000000"`, `traceability_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `FINANCE_TOOL_DESIGN_SOUND`, 32 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except `compliance.recommendation_language_present` true and feature `BacktestEngine` with `implies_advice_present` true | HTTP 200, verdict `FINANCE_TOOL_DESIGN_NOT_SOUND`, the 2 named checks fail | HTTP 200, `FINANCE_TOOL_DESIGN_NOT_SOUND`, 30 pass / 2 fail / 0 missing; failing checks exactly `no_recommendation_language`, `no_feature_implies_advice`; `features_implying_advice` `["BacktestEngine"]`, `scenario_coverage` `"1.000000"`, `traceability_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; section `compliance_and_advice_boundary` `fail`, the other four `pass` | PASS |
| 3 | sparse — only `tool` (`MinimalTool`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 32 missing, all five sections `insufficient_evidence`, `features_count` null, `features_without_scenarios_and_tradeoffs` null, `scenario_coverage` null, `features_implying_advice` null, `features_without_traceable_figures` null, `traceability_coverage` null, `backtest_features_without_overfit_survivorship_address` null, `computed_status` null | PASS |
| 4 | malformed — `compliance: "should_be_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"compliance","detail":"compliance must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `finance_tool_design_advisory`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 32 checks and a text stamp):

```json
{"service": "finance-tool-design-advisory", "atom_version": "0.1.0", "tool": "AlphaOptimizer", "verdict": "FINANCE_TOOL_DESIGN_SOUND", "sections": {"compliance_and_advice_boundary": "pass", "quant_fundamentals": "pass", "reproducibility_privacy_and_open_finance": "pass", "business_model_and_behavioral_design": "pass", "anti_patterns": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "features_count": 1, "features_without_scenarios_and_tradeoffs": [], "scenario_coverage": "1.000000", "features_implying_advice": [], "features_without_traceable_figures": [], "traceability_coverage": "1.000000", "backtest_features_without_overfit_survivorship_address": [], "summary": "32 pass, 0 fail, 0 missing of 32 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"compliance","detail":"compliance must be an object"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 4 rejections in total — by rule: R1 check-register ×1, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` listed the section name `compliance_and_advice_boundary` instead of exact check names — 1 validator rejection. Corrected before execution to the 2 exact check names the planted values fail: `no_recommendation_language`, `no_feature_implies_advice`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`features_count` `1`, `features_without_scenarios_and_tradeoffs` `[]`, `scenario_coverage` `"1.000000"`, `features_implying_advice` `[]`, `features_without_traceable_figures` `[]`, `traceability_coverage` `"1.000000"`, `backtest_features_without_overfit_survivorship_address` `[]`, `computed_status` `within_stated_limits_on_declared_evidence`), each value computed by hand from the input per SERVICE.md.
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`features_count` `1`, `features_without_scenarios_and_tradeoffs` `[]`, `scenario_coverage` `"1.000000"`, `features_implying_advice` `["BacktestEngine"]`, `features_without_traceable_figures` `[]`, `traceability_coverage` `"1.000000"`, `backtest_features_without_overfit_survivorship_address` `[]`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3) Violations input was not a full manifest — it omitted the full-pass manifest's `features[].overfit_and_survivorship_addressed` key path (and differed structurally elsewhere: a different tool name, margin declared absent instead of present-with-disclosure, and a non-backtest feature row). Corrected before execution: rebuilt it as a full copy of the full-pass manifest carrying exactly the 2 planted violations (`compliance.recommendation_language_present` true, and feature `BacktestEngine` with `implies_advice_present` true) and nothing else changed.

The full-pass input was verified genuinely valid per SERVICE.md before execution (the Python oracle returns all 32 checks pass on it — no correction needed), the sparse case was verified genuinely sparse (only `tool` — no correction needed), and the malformed case needed no correction (exactly one type violation of a documented typed field — `compliance` as a string where an object is required).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the five primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/finance-tool-design-advisory/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `features_count` | 1 | 1 | ✓ |
| full-pass `scenario_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `traceability_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `features_without_scenarios_and_tradeoffs` / `features_implying_advice` / `features_without_traceable_figures` / `backtest_features_without_overfit_survivorship_address` | [] / [] / [] / [] | [] / [] / [] / [] | ✓ |
| full-pass `computed_status` (all five computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `features_implying_advice` (`BacktestEngine` implies advice) | ["BacktestEngine"] | ["BacktestEngine"] | ✓ |
| violations `scenario_coverage` / `traceability_coverage` (1 ÷ 1 each) | "1.000000" / "1.000000" | "1.000000" / "1.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 2 planted checks | same 2 | ✓ |
| verdicts | FINANCE_TOOL_DESIGN_SOUND / FINANCE_TOOL_DESIGN_NOT_SOUND (2 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 2-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only three quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `compliance`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
