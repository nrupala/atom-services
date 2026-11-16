# Test report — portfolio-risk-analytics-report

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw.
**Second tester:** DeepSeek (via the house `custom.legacy-deepseek`
connector) independently recomputed the headline risk metrics by hand
from the same evidence — see its own section below.
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/portfolio-risk-analytics-report/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — returns `[0.01, -0.02, 0.03]`, aligned benchmark, `periods_per_year=12`, `risk_free_per_period=0.001`, `var_confidence=0.95`, two holdings | HTTP 200, status `complete`, headline metrics computed, 0 gaps | HTTP 200, `complete`, "Risk analytics over 3 periods: total return 0.019494, volatility per period 0.025166, max drawdown -0.020000; 0 gaps", stamp present and well-formed | PASS |
| 2 | violations — benchmark series misaligned (1 vs 2 periods), one holding with a non-numeric weight | HTTP 200, status `partial`, gaps naming both defects | HTTP 200, `partial`, 5 gaps including "benchmark_returns does not align with returns" and "holdings: 1 entries without a numeric weight excluded" (the remaining gaps are the unsubmitted optional inputs, correctly named) | PASS |
| 3 | sparse — a single return observation | HTTP 200, status `insufficient_evidence` | HTTP 200, `insufficient_evidence`, "returns series has 1 valid numeric observations (need at least 2)" | PASS |
| 4 | malformed — `portfolio: 12345`, `returns: "not_a_list"`, `holdings: "should_be_a_list"` | HTTP 422 clean input error, never a report | HTTP 200, status `insufficient_evidence` (periods 0) — the type-violating values were coerced/ignored instead of rejected | **FAIL — finding F1** |
| 5 | determinism — full-pass input submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass input via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `portfolio_risk_analytics_report`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200):

```json
{"service": "portfolio-risk-analytics-report", "atom_version": "0.1.0", "portfolio": "Test Portfolio", "status": "complete", "layers": {"holdings": "present", "risk_metrics": "present", "factor_exposures": "absent", "concentration": "present", "decisions": "absent"}, "counts": {"periods": 3, "invalid_return_entries": 0, "holdings": 2, "invalid_holdings": 0, "journal_entries": 0, "invalid_journal_entries": 0, "scenarios": 0, "invalid_scenarios": 0, "factors": 0, "holding_series": 0, "invalid_holding_series": 0}, "gaps": [], "risk_metrics": {"periods": 3, "mean_return_per_period": "0.006667", "total_return": "0.019494", "best_period_return": "0.030000", "worst_period_return": "-0.020000", "positive_period_fraction": "0.666667", "volatility_per_period": "0.025166", "annualized_volatility": "0.087178", "annualized_return": "0.080286", "downside_deviation_per_period": "0.012124", "sharpe_per_period": "0.225171", "sharpe_annualized": "0.780013", "sortino_per_period": "0.467379", "sortino_annualized": "1.619048", "max_drawdown": "-0.020000", "max_drawdown_peak_period": 0, "max_drawdown_trough_period": 1, "current_drawdown": "0.000000", "longest_underwater_periods": 1, "var_confidence": "0.950000", "historical_var": "0.020000", "historical_cvar": "0.020000"}, "benchmark": {"aligned": true, "periods": 3, "mean_return_per_period": "0.005000", "volatility_per_period": "0.015000", "total_return": "0.014849", "beta": "1.666667", "correlation": "0.993399", "tracking_error_per_period": "0.010408", "alpha_per_period": "-0.001000"}, "concentration": {"holdings_count": 2, "weight_sum": "1.000000", "hhi": "0.500000", "effective_holdings": "2.000000", "largest_holding_id": "A", "largest_holding_share": "0.500000", "currency_shares": [{"currency": "USD", "share": "1.000000"}]}, "carry": null, "factor_decomposition": null, "holding_correlations": null, "stress_tests": [], "decision_journal": null, "disclaimer": "Educational analytics only \u2014 not financial advice. The tool calculates; the user decides.", "summary": "Risk analytics over 3 periods: total return 0.019494, volatility per period 0.025166, max drawdown -0.020000; 0 gaps.", "stamp": "PORTFOLIO RISK ANALYTICS REPORT\nportfolio: Test Portfolio\nSTATUS: complete\nRisk analytics over 3 periods: total return 0.019494, volatility per period 0.025166, max drawdown -0.020000; 0 gaps.\nEducational analytics only \u2014 not financial advice. The tool calculates; the user decides."}
```

Malformed response (REST, HTTP 200 — the finding):

```json
{"service": "portfolio-risk-analytics-report", "atom_version": "0.1.0", "portfolio": 12345, "status": "insufficient_evidence", "layers": {"holdings": "absent", "risk_metrics": "absent", "factor_exposures": "absent", "concentration": "absent", "decisions": "absent"}, "counts": {"periods": 0, "invalid_return_entries": 0, "holdings": 0, "invalid_holdings": 0, "journal_entries": 0, "invalid_journal_entries": 0, "scenarios": 0, "invalid_scenarios": 0, "factors": 0, "holding_series": 0, "invalid_holding_series": 0}, "gaps": ["returns: a returns series with at least 2 valid numeric observations is required \u2014 risk analytics cannot be computed"], "risk_metrics": null, "benchmark": null, "concentration": null, "carry": null, "factor_decomposition": null, "holding_correlations": null, "stress_tests": [], "decision_journal": null, "disclaimer": "Educational analytics only \u2014 not financial advice. The tool calculates; the user decides.", "summary": "Insufficient evidence: returns series has 0 valid numeric observations (need at least 2) \u2014 portfolio risk analytics cannot be computed.", "stamp": "PORTFOLIO RISK ANALYTICS REPORT\nportfolio: 12345\nSTATUS: insufficient_evidence\nInsufficient evidence: returns series has 0 valid numeric observations (need at least 2) \u2014 portfolio risk analytics cannot be computed.\nEducational analytics only \u2014 not financial advice. The tool calculates; the user decides."}
```

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `portfolio` as a number where a string is required, `returns` and `holdings` as strings where lists are required. Expected (test doctrine for
this program + the gateway's `invalid_input` mechanism in
`callpath.ts`): HTTP 422 `{ok:false, error:"invalid_input", field:...}`.
Actual: HTTP 200, status `insufficient_evidence` computed over the garbage values (portfolio echoed as `12345`, periods 0). The atom's handler does not validate
manifest field types before evaluation. Disposition: **fix spec filed** —
`verification/fix-specs/portfolio-risk-analytics-report.md`. Retest on redeploy.

Gemini recomputed from the full-pass input by hand: mean return per period = 0.006667, sample volatility per period = 0.025166 — both match the artifact.

## Second tester — DeepSeek

DeepSeek (house `custom.legacy-deepseek` connector, temperature 0.1)
received the atom's `contract.yaml` + `SERVICE.md` and the same recorded
evidence the Gemini judge used, and was instructed to independently
recompute the headline risk metrics from the full-pass input by hand
and verify the artifact's numbers and status. Raw output:
`verification/work/portfolio-risk-analytics-report/deepseek-raw.txt`.

**DeepSeek verdict: FAIL** — the same verdict as Gemini, on
the same single ground: the malformed case (HTTP 200 with a status
instead of HTTP 422). On every other case DeepSeek's reading matches
Gemini's exactly: full-pass `complete`, violations `partial` with the
gaps naming the misaligned benchmark and the invalid holding, sparse
`insufficient_evidence`. (DeepSeek's JSON lists the passing cases under
its `findings` array with details stating they match — a formatting
quirk of its answer, not additional findings; its only substantive
finding is the malformed case, identical to F1 above.)

DeepSeek's hand recomputation of the full-pass artifact (returns
`[0.01, -0.02, 0.03]`, benchmark `[0.005, -0.01, 0.02]`,
`risk_free_per_period=0.001`, `periods_per_year=12`, VaR 95%):

| Quantity | DeepSeek (by hand) | Artifact | |
|---|---|---|---|
| mean_return_per_period | 0.006667 | 0.006667 | match |
| total_return | 0.019494 | 0.019494 | match |
| volatility_per_period (sample) | 0.025166 | 0.025166 | match |
| annualized_volatility | 0.087178 | 0.087178 | match |
| annualized_return (geometric) | 0.080286 | 0.080286 | match |
| max_drawdown | -0.020000 | -0.020000 | match |
| historical_var (95%, nearest-rank) | 0.020000 | 0.020000 | match |
| historical_cvar | 0.020000 | 0.020000 | match |
| sharpe_per_period | 0.225171 | 0.225171 | match |
| sortino_per_period | 0.467379 | 0.467379 | match |
| beta | 1.666667 | 1.666667 | match |
| alpha_per_period | -0.001000 | -0.001000 | match |
| correlation | 0.993399 | 0.993399 | match |
| tracking_error_per_period | 0.010408 | 0.010408 | match |

All 14 computed checks match, including drawdown, VaR/CVaR, Sharpe,
Sortino, beta and alpha — extending Gemini's two spot checks
(mean return, volatility) to the full headline set. DeepSeek also
hand-checked the violations case arithmetic (mean 0.015000, total
return 0.030200, sample volatility 0.007071, max drawdown 0.000000) —
all match the artifact.

**Agreement:** Gemini and DeepSeek agree completely — verdict, the
single finding, and every recomputed number. No disagreement required
disposition from the raw evidence.

## Final verdict

**FAIL** — core verdict logic is exact on all three verdict cases,
determinism and MCP/REST parity hold, the stamp is well-formed; the
single defect is F1 (malformed-input handling).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: https://atoms.pipavia.com, gateway version 1.1.0 (health 200), deployment 7f9cae9fdd60417eb72062905a066554. Full recorded battery re-run live via `verification/harness.py` against the unchanged `cases.json`; Wave 1 evidence/judgment preserved as `evidence-wave1.json` / `judgment-wave1.json`. No HTTP 429 was encountered. Gemini judge re-run on the new evidence (`judgment.json`); mechanical verification from the new `evidence.json` governs where testers and evidence conflict.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, status `complete`, mean return 0.006667, sample volatility 0.025166 | HTTP 200, status `complete`, mean_return_per_period = 0.006667, volatility_per_period = 0.025166, total_return = 0.019494 | PASS |
| 2 | violations | HTTP 200, status `partial`, gaps: misaligned benchmark series + invalid holdings count | HTTP 200, status `partial`, gaps include benchmark misalignment (1 vs 2 periods) and 1 holding without a numeric weight excluded; invalid_holdings = 1 | PASS |
| 3 | sparse | HTTP 200, status `insufficient_evidence` (< 2 valid observations) | HTTP 200, status `insufficient_evidence` | PASS |
| 4 | malformed | HTTP 422 `invalid_input` (portfolio/returns/holdings type violations) | HTTP 422, `{ok:false, error:"invalid_input", field:"portfolio"}` — no report artifact | PASS |
| 5 | determinism | REST repeat byte-identical | `determinism_byte_identical: true` | PASS |
| 6 | parity | MCP structuredContent deep-equals REST artifact | `parity_structured_equal: true` | PASS |

F1 disposition: **CLOSED**. Wave 1: type-violating input returned HTTP 200 with an `insufficient_evidence` report. Retest: the same malformed case returns HTTP 422 `{ok:false, error:"invalid_input", field:"portfolio"}` and no report is produced. Mechanical check of the new evidence: malformed status == 422 and body error == "invalid_input" — confirmed. The computed risk metrics on the valid cases are unchanged and exact under both testers.

### Second tester — DeepSeek (retest)

**Second tester:** DeepSeek via the house `custom.legacy-deepseek` connector (`ds_chat.py`) — independent second read mirroring the Wave 1 scope, given SERVICE.md's computed rules, the `cases.json` inputs and the NEW evidence artifacts (full-pass and violations), and instructed to recompute the headline computed quantities by hand and show its arithmetic. Raw output: `verification/work/portfolio-risk-analytics-report/deepseek-retest-raw.txt`.

**DeepSeek verdict: PASS** — no defects. DeepSeek's `findings` array lists per-case confirmations (expected = actual), not defects. All 14 computed checks match, with hand arithmetic shown (mean = 0.02/3, wealth = 1.01×0.98×1.03, sample vol = √(0.001266667/2)).

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| mean_return_per_period | 0.006667 | 0.006667 | ✓ |
| total_return | 0.019494 | 0.019494 | ✓ |
| volatility_per_period (sample) | 0.025166 | 0.025166 | ✓ |
| annualized_volatility / annualized_return | 0.087178 / 0.080286 | 0.087178 / 0.080286 | ✓ |
| max_drawdown | -0.020000 | -0.020000 | ✓ |
| historical_var (95%) | 0.020000 | 0.020000 | ✓ |
| sharpe_per_period | 0.225171 | 0.225171 | ✓ |
| beta / alpha_per_period | 1.666667 / -0.001000 | 1.666667 / -0.001000 | ✓ |
| violations mean / total / vol / drawdown | 0.015000 / 0.030200 / 0.007071 / 0.000000 | 0.015000 / 0.030200 / 0.007071 / 0.000000 | ✓ |

**Agreement:** DeepSeek agrees with Gemini (retest verdict PASS, findings: none) on the verdict and on every recomputed quantity. No disagreement to disposition.

**Tester errors this wave:** none

**Retest verdict: PASS**
