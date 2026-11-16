# Test report — cash-flow-forecast

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment fa3faa42fac649da873fcc00cfa20f82
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/cash-flow-forecast/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — 13 weekly buckets (opening 1000, +500/−200 per week, cumulative closings 1300…4900), reserve 2.0 × 100 = 200 declared 200, runway 1000/100 = 10 declared 10, all three stated stress cases run, all red lines false | HTTP 200, verdict `CASH_FLOW_FORECAST_READY`, `computed_final_balance` `4900.000000`, `final_balance_difference` `0.000000`, `computed_reserve_target` `200.000000`, `computed_runway_months` `10.000000`, `stress_cases_not_run` `[]` | HTTP 200, `CASH_FLOW_FORECAST_READY`, 30 pass / 0 fail / 0 missing, exactly those computed values, `weeks_evaluated` 13, `computed_status` `within_stated_limits_on_declared_evidence` | PASS |
| 2 | violations — full manifest with W13 closing declared 9999 vs rederived 4900, reserve declared 500 vs computed 200, runway declared 5 vs computed 10, stress `cases_run` only `[revenue_minus_20_percent]`, `committed_against_unlanded_receivables` true | HTTP 200, verdict `CASH_FLOW_FORECAST_NOT_READY`, the 5 named checks fail | HTTP 200, `CASH_FLOW_FORECAST_NOT_READY`, 25 pass / 5 fail / 0 missing; failing checks exactly `weekly_closing_balances_match_rederived`, `reserve_target_amount_matches_months_times_fixed_costs`, `runway_matches_cash_divided_by_burn`, `stress_cases_cover_stated_cases`, `no_commitments_against_unlanded_receivables`; `computed_final_balance` `4900.000000`, `final_balance_difference` `5099.000000`, `reserve_target_difference` `300.000000`, `runway_difference` `-5.000000`, `stress_cases_not_run` the 2 omitted entries, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `entity` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 30 missing, computed fields null, `weeks_evaluated` 0 | PASS |
| 4 | malformed — `forecast.opening_balance: "one thousand"` (string where a number is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"forecast.opening_balance","detail":"forecast.opening_balance must be a number"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `cash_flow_forecast`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 30 checks and a text stamp):

```json
{"service": "cash-flow-forecast", "atom_version": "0.1.0", "entity": "Test Corp", "verdict": "CASH_FLOW_FORECAST_READY", "sections": {"flows_and_lags": "pass", "thirteen_week_forecast": "pass", "reserves_and_runway": "pass", "working_capital_and_levers": "pass", "stress_tests": "pass", "reporting_and_commitments": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "weeks_evaluated": 13, "computed_final_balance": "4900.000000", "final_balance_difference": "0.000000", "computed_reserve_target": "200.000000", "reserve_target_difference": "0.000000", "computed_runway_months": "10.000000", "runway_difference": "0.000000", "stress_cases_not_run": [], "summary": "30 pass, 0 fail, 0 missing of 30 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"forecast.opening_balance","detail":"forecast.opening_balance must be a number"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded them as 2 case-level tester errors, one per corrected case; no judge-stage tester errors were added):

1. Full-pass designed with only 1 weekly bucket — SERVICE.md's coverage check passes only with exactly 13 buckets, so the designer's own "full-pass" would have failed `forecast_covers_thirteen_weeks`. Corrected before execution: expanded to 13 buckets (inflows 500, outflows 200 each; cumulative closings 1300…4900), with no change to any other input value or the expected verdict.
2. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`computed_final_balance` `4900.000000`, `final_balance_difference` `0.000000`, `computed_reserve_target` `200.000000`, `reserve_target_difference` `0.000000`, `computed_runway_months` `10.000000`, `runway_difference` `0.000000`, `stress_cases_not_run` `[]`, `weeks_evaluated` 13, `computed_status`).
3. Violations designed `failing_checks` listed section names (`thirteen_week_forecast`, `reserves_and_runway`, `stress_tests`, `reporting_and_commitments`) instead of exact check names. Corrected before execution to the 5 exact check names above.
4. Violations input was sparse — most sections absent, so their checks would have been `missing`, not failing, and its single weekly bucket would have added an unintended `forecast_covers_thirteen_weeks` failure. Corrected before execution: rebuilt as a full manifest carrying exactly the five planted violations the designer intended (wrong W13 closing, wrong reserve amount, wrong runway, incomplete stress cases, prohibited commitment flag).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (cumulative weekly closing balances over 13 weeks, reserve target months × fixed costs, runway cash ÷ burn, stress-case coverage, and `computed_status`, all with the SERVICE.md 6dp round-half-up rule) and verified the artifact's numbers and verdicts. Raw output: `verification/work/cash-flow-forecast/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `computed_final_balance` (1000 + 13 × (500 − 200)) | 4900.000000 | 4900.000000 | ✓ |
| full-pass `final_balance_difference` (4900 − 4900) | 0.000000 | 0.000000 | ✓ |
| full-pass `computed_reserve_target` (2.0 × 100) | 200.000000 | 200.000000 | ✓ |
| full-pass `computed_runway_months` (1000 / 100) | 10.000000 | 10.000000 | ✓ |
| full-pass `stress_cases_not_run` | [] | [] | ✓ |
| violations `computed_final_balance` (rederived) | 4900.000000 | 4900.000000 | ✓ |
| violations `final_balance_difference` (9999 − 4900) | 5099.000000 | 5099.000000 | ✓ |
| violations `reserve_target_difference` (500 − 200) | 300.000000 | 300.000000 | ✓ |
| violations `runway_difference` (5 − 10) | -5.000000 | -5.000000 | ✓ |
| violations `stress_cases_not_run` | 2 omitted entries | same 2 | ✓ |
| verdicts | CASH_FLOW_FORECAST_READY / CASH_FLOW_FORECAST_NOT_READY (5 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 5-check failure set on the violations case. The coordinating tester's own headline recompute also matches: opening 1000 plus 13 × (500 − 200) = 4900 → `computed_final_balance` `4900.000000`, identical to the artifact.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `forecast.opening_balance`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
