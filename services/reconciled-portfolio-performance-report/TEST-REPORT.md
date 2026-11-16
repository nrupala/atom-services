# Test report — reconciled-portfolio-performance-report

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw. The undersigned verification lane re-checked every
judgment against the raw evidence before disposition.
**Second tester:** DeepSeek (independent recomputation — see its section
below; it raised finding F2, which Gemini missed and which this lane
upholds from the raw evidence).
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/reconciled-portfolio-performance-report/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`; DeepSeek raw:
`deepseek-raw.txt`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — beginning 1000, period-end [1100, 1210], flows [0, 0], holdings total 1210 | HTTP 200, status `complete`, period returns [0.100000, 0.100000], TWR 0.210000, holdings total 1210.000000, 0 gaps | HTTP 200, `complete`, exactly those figures, all three reconciliation legs at difference 0.000000, 0 gaps | PASS |
| 2 | violations — `external_flows` length 1 vs 2 periods; `holdings: []` against a final declared value of 1210 | HTTP 200, status `partial`; flows misalignment and holdings-vs-value reconciliation both surfaced | HTTP 200, `partial` with 2 gaps (flows misaligned; declared returns unreconcilable) — **but the holdings leg is silently nulled**: `holdings_vs_declared_value` is all-null and no gap or discrepancy names it | **FAIL — finding F2** |
| 3 | sparse — beginning value + only 1 period-end value | HTTP 200, status `insufficient_evidence` | HTTP 200, `insufficient_evidence`, gap names the missing second period-end value | PASS |
| 4 | malformed — `portfolio: 12345`, `beginning_value: "one thousand"`, `period_end_values: "not a list"` | HTTP 422 clean input error, never a report | HTTP 200, status `insufficient_evidence` — type-violating values were evaluated as evidence (`portfolio` echoed back as `12345`) | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `reconciled_portfolio_performance_report`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; sections trimmed — the full
response also carries benchmark, reconciliation, holdings rows and a
text stamp):

```json
{"service":"reconciled-portfolio-performance-report","atom_version":"0.1.0","portfolio":"Test Portfolio","status":"complete","performance":{"periods":2,"beginning_value":"1000.000000","final_value":"1210.000000","value_change":"210.000000","net_external_flows":"0.000000","total_gain_after_flows":"210.000000","period_returns":["0.100000","0.100000"],"time_weighted_return":"0.210000","money_weighted_return_per_period":"0.100000","mean_period_return":"0.100000","twr_irr_difference":"0.110000"},"reconciliation":{"holdings_vs_declared_value":{"holdings_total_value":"1210.000000","final_declared_value":"1210.000000","difference":"0.000000","difference_fraction_of_final":"0.000000"}},"summary":"Reconciled performance over 2 periods: time-weighted return 0.210000, money-weighted return per period 0.100000, final value 1210.000000; 0 gaps."}
```

Violations response — the holdings leg (REST, HTTP 200 — finding F2):

```json
{"status":"partial","gaps":["external_flows does not align with period_end_values (1 valid of 1 submitted vs 2 periods) — time-weighted and money-weighted returns are gaps","declared_returns cannot be reconciled — computed period returns are gaps"],"reconciliation":{"holdings_vs_declared_value":{"holdings_total_value":null,"final_declared_value":"1210.000000","difference":null,"difference_fraction_of_final":null}},"holdings":null,"layers":{"holdings":"absent"}}
```

Malformed response (REST, HTTP 200 — finding F1):

```json
{"service":"reconciled-portfolio-performance-report","atom_version":"0.1.0","portfolio":12345,"status":"insufficient_evidence","layers":{"values":"absent","performance":"absent","reconciliation":"absent","benchmark":"absent","holdings":"absent"},"gaps":["beginning_value: a numeric beginning value is required — reconciled performance cannot be computed","period_end_values: a series with at least 2 valid numeric period-end values is required — reconciled performance cannot be computed"]}
```

## Findings

**F1 — Type-violating input returns a report instead of a clean input
error.** Case 4: `portfolio` as a number, `beginning_value` as a
string, `period_end_values` as a string. Expected (test doctrine for
this program + the gateway's `invalid_input` mechanism in
`callpath.ts`): HTTP 422 `{ok:false, error:"invalid_input", field:...}`.
Actual: HTTP 200 with an `insufficient_evidence` report computed over
the garbage values. The atom's handler does not validate manifest
field types before evaluation. Disposition: **fix spec filed** —
`verification/fix-specs/reconciled-portfolio-performance-report.md`.
Retest on redeploy.

**F2 — An explicitly declared empty holdings ledger is silently
dropped instead of reconciled.** Case 2 submits `holdings: []` — a
declared, empty positions ledger — against a final declared value of
1210.000000. SERVICE.md defines the holdings-vs-declared-value leg as
"the holdings ledger total (Σ quantity × price) minus the final
declared period-end value", and rules that "a discrepancy is a
*finding*, not a gap". The sum over the declared empty ledger is
0.000000, so the leg should print difference **−1210.000000** and
difference fraction **−1.000000**. Actual: the atom treats the empty
list exactly like an absent field — `holdings` layer `absent`,
`holdings_vs_declared_value` all null, and no gap entry names the
holdings leg either, so the largest possible holdings discrepancy
passes in silence. (The case's `partial` status itself is correct —
it is driven by the flows gap — and Gemini's designed expectation
named `holdings_ledger_reconciliation` among the case's failing
legs.) Raised by the DeepSeek second tester; **upheld by this lane**
from the raw evidence and the SERVICE.md text quoted above.
Disposition: **fix spec filed** (same file as F1). Retest on redeploy.

No tester errors in this atom's run.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from
the case inputs by hand (flow-adjusted period returns, TWR chain
product, per-period money-weighted return, benchmark chain and excess
return, holdings total and shares, and all three reconciliation legs)
and verified the artifact's numbers and statuses. Raw output:
`verification/work/reconciled-portfolio-performance-report/deepseek-raw.txt`.

**DeepSeek verdict: FAIL** — findings F1 (agrees with Gemini) and F2
(its own, upheld above).

Its computed checks — full-pass, all 15 match:

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| period_returns[0] / [1] | 0.100000 / 0.100000 | 0.100000 / 0.100000 | ✓ |
| time_weighted_return | 0.210000 | 0.210000 | ✓ |
| money_weighted_return_per_period | 0.100000 | 0.100000 | ✓ |
| mean_period_return | 0.100000 | 0.100000 | ✓ |
| twr_irr_difference | 0.110000 | 0.110000 | ✓ |
| value_change / total_gain_after_flows | 210.000000 / 210.000000 | 210.000000 / 210.000000 | ✓ |
| net_external_flows | 0.000000 | 0.000000 | ✓ |
| holdings_total / share of holding A | 1210.000000 / 1.000000 | 1210.000000 / 1.000000 | ✓ |
| benchmark_total_return / mean | 0.102500 / 0.050000 | 0.102500 / 0.050000 | ✓ |
| excess_total_return / periods ahead | 0.107500 / 2 | 0.107500 / 2 | ✓ |
| violations: holdings difference | −1210.000000 | null | ✗ → F2 |
| violations: holdings difference fraction | −1.000000 | null | ✗ → F2 |

**Agreement / disagreement:** the testers agree on F1 and on every
full-pass figure. They disagree on the violations case: Gemini judged
it a pass on status alone; DeepSeek found the nulled holdings leg.
This lane dispositions the disagreement **in DeepSeek's favour** —
the raw artifact shows the all-null leg with no gap entry, and
SERVICE.md's "a discrepancy is a finding, not a gap" rule plus the
well-defined empty sum support DeepSeek's reading. F2 stands as a
real defect.

## Final verdict

**FAIL** — performance math and reconciliation are exact on the
full-pass case (confirmed by two independent testers), determinism
and MCP/REST parity hold; the defects are F1 (malformed-input
handling) and F2 (declared empty holdings ledger silently dropped
instead of reconciled).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway: https://atoms.pipavia.com, gateway version 1.1.0 (health 200), deployment 7f9cae9fdd60417eb72062905a066554. Full recorded battery re-run live via `verification/harness.py` against the unchanged `cases.json`; Wave 1 evidence/judgment preserved as `evidence-wave1.json` / `judgment-wave1.json`. No HTTP 429 was encountered. Gemini judge re-run on the new evidence (`judgment.json`); mechanical verification from the new `evidence.json` governs where testers and evidence conflict.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, status `complete`, period_returns [0.100000, 0.100000], TWR 0.210000, holdings_total 1210.000000 | HTTP 200, status `complete`, period_returns [0.100000, 0.100000], time_weighted_return = 0.210000, holdings total_value = 1210.000000 | PASS |
| 2 | violations | HTTP 200, status `partial`, failing checks external_flows_alignment + holdings_ledger_reconciliation; holdings leg prints difference −1210.000000 / fraction −1.000000 | HTTP 200, status `partial`, flows misaligned gap present; reconciliation.holdings_vs_declared_value = {holdings_total_value: "0.000000", final_declared_value: "1210.000000", difference: "-1210.000000", difference_fraction_of_final: "-1.000000"} | PASS |
| 3 | sparse | HTTP 200, status `insufficient_evidence` (< 2 valid period-end values) | HTTP 200, status `insufficient_evidence` | PASS |
| 4 | malformed | HTTP 422 `invalid_input` (portfolio/beginning_value/period_end_values type violations) | HTTP 422, `{ok:false, error:"invalid_input", field:"portfolio"}` — no report artifact | PASS |
| 5 | determinism | REST repeat byte-identical | `determinism_byte_identical: true` | PASS |
| 6 | parity | MCP structuredContent deep-equals REST artifact | `parity_structured_equal: true` | PASS |

F1 disposition: **CLOSED**. Wave 1: `portfolio: 12345`, `beginning_value: "one thousand"`, `period_end_values: "not a list"` returned HTTP 200 with an `insufficient_evidence` report. Retest: the same malformed case returns HTTP 422 `{ok:false, error:"invalid_input", field:"portfolio"}` ("portfolio must be a string") and no report is produced. Mechanical check of the new evidence: malformed status == 422 and body error == "invalid_input" — confirmed.

F2 disposition: **CLOSED**. Wave 1: the declared empty holdings ledger (`holdings: []`) was treated as absent — `holdings_vs_declared_value` was all-null and the holdings layer was absent. Retest, read mechanically from the violations case response JSON in the new evidence: `reconciliation.holdings_vs_declared_value.difference` = **"-1210.000000"** and `difference_fraction_of_final` = **"-1.000000"**, with `holdings_total_value` = "0.000000" and `final_declared_value` = "1210.000000"; the holdings layer is now `present` with holdings_count 0 / total_value "0.000000". Both required values print exactly — F2 closes. DeepSeek independently recomputed the same leg (empty sum = 0; 0 − 1210 = −1210; −1210/1210 = −1) and matches.

### Second tester — DeepSeek (retest)

**Second tester:** DeepSeek via the house `custom.legacy-deepseek` connector (`ds_chat.py`) — independent second read mirroring the Wave 1 scope, given SERVICE.md's computed rules, the `cases.json` inputs and the NEW evidence artifacts (full-pass and violations), and instructed to recompute the headline computed quantities by hand and show its arithmetic. Raw output: `verification/work/reconciled-portfolio-performance-report/deepseek-retest-raw.txt`.

**DeepSeek verdict: PASS** — no defects. DeepSeek's `findings` array lists per-case confirmations (expected = actual), not defects. All 15 computed checks match, including both F2 quantities.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| period_returns[0] / [1] | 0.100000 / 0.100000 | 0.100000 / 0.100000 | ✓ |
| time_weighted_return | 0.210000 ((1.1×1.1)−1) | 0.210000 | ✓ |
| money_weighted_return_per_period | 0.100000 | 0.100000 | ✓ |
| twr_irr_difference | 0.110000 | 0.110000 | ✓ |
| holdings_total (full-pass) | 1210.000000 | 1210.000000 | ✓ |
| benchmark_total_return / excess_total_return | 0.102500 / 0.107500 | 0.102500 / 0.107500 | ✓ |
| violations holdings difference (F2) | -1210.000000 | -1210.000000 | ✓ |
| violations holdings difference_fraction_of_final (F2) | -1.000000 | -1.000000 | ✓ |

**Agreement:** DeepSeek agrees with Gemini (retest verdict PASS, findings: none) on the verdict and on every recomputed quantity. No disagreement to disposition.

**Tester errors this wave:** none

**Retest verdict: PASS**
