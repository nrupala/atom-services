# Test report — strategy-backtest-validation

**Tester:** Gemini (`gemini-3.1-flash-lite`) via the house `custom.gemini`
connector — independent external tester (Academy Tester Doctrine: the
tester is never the builder). Gemini designed the cases from
`contract.yaml` + `SERVICE.md` and judged the recorded outputs; all HTTP
calls were executed by the verification harness against the live gateway
and recorded raw. The undersigned verification lane re-checked every
judgment against the raw evidence before disposition (one tester error
was caught and corrected — see below).
**Second tester:** DeepSeek (independent recomputation — see its section
below).
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal,
external metering, scopes = all live atoms.
**Evidence:** `verification/work/strategy-backtest-validation/evidence.json`
(cases: `cases.json`; judgment: `judgment.json`; DeepSeek raw:
`deepseek-raw.txt`).

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — all evidence true, params 10 / observations 1000, max trade $600 with clear-yes true, paper completed with live-vs-model compared | HTTP 200, verdict `VALIDATED`, 36/36 checks pass, ratio `0.0100`, 3 result sets, paper `completed`, over-$500 `true` | HTTP 200, `VALIDATED`, "36 pass, 0 fail, 0 missing", exactly those computed values | PASS (after tester-error correction, below) |
| 2 | violations — `look_ahead_used`, `costs_skipped`, `curve_fit_parameters_used`, `backtest_used_as_sole_live_confirmation` all true; paper gate neither completed nor waived | HTTP 200, verdict `NOT_VALIDATED`, the five sections harness / costs / overfit / paper / house gates fail | HTTP 200, `NOT_VALIDATED`, exactly those 5 sections fail (5 failing checks, 1 missing — the undischarged live-vs-model comparison), ratio `0.0500`, paper `not_completed`, over-$500 `false` | PASS |
| 3 | sparse — only `strategy` named | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 36 missing, ratio / paper / over-$500 all null | PASS |
| 4 | malformed — `harness: "should_be_an_object"` | HTTP 422 clean input error, never a verdict | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` (0 pass, 0 fail, 36 missing) — the type-violating value was evaluated as evidence | **FAIL — finding F1** |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical verdict core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `strategy_backtest_validation`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full
response carries all 36 checks and a text stamp):

```json
{"service":"strategy-backtest-validation","atom_version":"0.1.0","strategy":"Alpha-Trend-01","verdict":"VALIDATED","sections":{"harness_standards":"pass","protocol_and_reporting":"pass","costs_and_frictions":"pass","overfit_and_fragility":"pass","paper_gate":"pass","live_monitoring_and_house_gates":"pass"},"results_sets_reported":3,"params_to_data_ratio":"0.0100","paper_gate_status":"completed","over_500_trade_declared":true,"summary":"36 pass, 0 fail, 0 missing of 36 checks across six sections."}
```

Violations response (REST, HTTP 200; checks array trimmed):

```json
{"service":"strategy-backtest-validation","atom_version":"0.1.0","strategy":"Broken-Strategy","verdict":"NOT_VALIDATED","sections":{"harness_standards":"fail","protocol_and_reporting":"pass","costs_and_frictions":"fail","overfit_and_fragility":"fail","paper_gate":"fail","live_monitoring_and_house_gates":"fail"},"results_sets_reported":3,"params_to_data_ratio":"0.0500","paper_gate_status":"not_completed","over_500_trade_declared":false,"summary":"30 pass, 5 fail, 1 missing of 36 checks across six sections."}
```

Malformed response (REST, HTTP 200 — the finding):

```json
{"service":"strategy-backtest-validation","atom_version":"0.1.0","strategy":"Malformed-Input","verdict":"INSUFFICIENT_EVIDENCE","sections":{"harness_standards":"insufficient_evidence","protocol_and_reporting":"insufficient_evidence","costs_and_frictions":"insufficient_evidence","overfit_and_fragility":"insufficient_evidence","paper_gate":"insufficient_evidence","live_monitoring_and_house_gates":"insufficient_evidence"},"results_sets_reported":0,"params_to_data_ratio":null,"paper_gate_status":null,"over_500_trade_declared":null,"summary":"0 pass, 0 fail, 36 missing of 36 checks across six sections."}
```

## Tester error — corrected, not an atom failure

Gemini's original full-pass case omitted `paper.live_vs_model_compared`.
SERVICE.md lists that field as required unless the paper gate is waived
(the case declares `waived: false`), so the first run correctly returned
`INSUFFICIENT_EVIDENCE` with 35 pass / 1 missing — the single missing
check being `live_vs_model_behavior_compared`. Gemini's first judgment
then misread the contract, claiming the field is not listed in
SERVICE.md and recording the miss as an atom defect; SERVICE.md's input
table lists it explicitly (`paper.live_vs_model_compared`, paper_gate).
The case was corrected to `live_vs_model_compared: true`, steps 2–3
were re-run, and the corrected run passes in full (table above; the
first-run evidence and judgment are preserved as
`evidence-first-run.json` / `judgment-first-run.json` in the work
directory). **1 tester error, recorded as such — never as an atom
failure.**

## Findings

**F1 — Type-violating input returns a verdict instead of a clean input
error.** Case 4: `harness` as a string instead of an object. Expected
(test doctrine for this program + the gateway's `invalid_input`
mechanism in `callpath.ts`): HTTP 422
`{ok:false, error:"invalid_input", field:...}`. Actual: HTTP 200 with
an `INSUFFICIENT_EVIDENCE` verdict computed over the garbage value.
The atom's handler does not validate manifest field types before
evaluation. Disposition: **fix spec filed** —
`verification/fix-specs/strategy-backtest-validation.md`.
Retest on redeploy.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from
the case inputs by hand (the params-to-data ratio from the declared
parameter and observation counts under the fixed round-half-up 4dp
serialization; the reported result-set count; the paper-gate status
from the completed/waived declarations; the over-$500 flag from the
declared maximum planned trade against the $500 house-gate threshold)
and verified the artifact's numbers and verdicts. Raw output:
`verification/work/strategy-backtest-validation/deepseek-raw.txt`.

**DeepSeek verdict: FAIL** — the same single defect finding
(malformed input returns HTTP 200 with a verdict instead of HTTP 422).

Its computed checks (all match):

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass params_to_data_ratio (10/1000) | 0.0100 | 0.0100 | ✓ |
| full-pass results_sets_reported | 3 | 3 | ✓ |
| full-pass paper_gate_status (completed, not waived) | completed | completed | ✓ |
| full-pass over_500_trade_declared ($600 > $500) | true | true | ✓ |
| full-pass verdict | VALIDATED | VALIDATED | ✓ |
| violations params_to_data_ratio (5/100) | 0.0500 | 0.0500 | ✓ |
| violations results_sets_reported | 3 | 3 | ✓ |
| violations paper_gate_status (neither completed nor waived) | not_completed | not_completed | ✓ |
| violations over_500_trade_declared ($100 ≤ $500) | false | false | ✓ |
| violations verdict (5 planted red-line / gate failures) | NOT_VALIDATED | NOT_VALIDATED | ✓ |

**Agreement:** full on substance. DeepSeek and Gemini (corrected
judgment) agree on the verdict, on the single defect, and on every
recomputed quantity. No disagreement to disposition.

## Final verdict

**FAIL** — verdict logic and the computed ratio / counts / gate
statuses are exact on the valid cases (confirmed by two independent
testers), determinism and MCP/REST parity hold; the single defect is
F1 (malformed-input handling). One tester error was corrected during
the run (see above).

## Retest — 2026-11-15 (fix-stream deploy 7f9cae9fdd60417eb72062905a066554)

Gateway/deployment: live gateway https://atoms.pipavia.com, gateway version 1.1.0 (health HTTP 200), fix-stream deployment 7f9cae9fdd60417eb72062905a066554; retest evidence recorded 2026-11-15T23:50:14.990445+00:00 (`verification/work/strategy-backtest-validation/evidence.json`). Wave 1 evidence preserved as `evidence-wave1.json` / `judgment-wave1.json`. The full recorded Wave 1 battery was re-run unmodified (harness.py), judged by Gemini (`judgment.json`: **PASS**, 0 findings, 0 tester errors, all computed checks match), and verified mechanically from the raw evidence.

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass | HTTP 200, verdict VALIDATED | HTTP 200, verdict VALIDATED | PASS |
| 2 | violations | HTTP 200, verdict NOT_VALIDATED | HTTP 200, verdict NOT_VALIDATED | PASS |
| 3 | sparse | HTTP 200, verdict INSUFFICIENT_EVIDENCE | HTTP 200, verdict INSUFFICIENT_EVIDENCE | PASS |
| 4 | malformed | HTTP 422 {ok:false, error:"invalid_input"}, no verdict | HTTP 422 {ok:false, error:"invalid_input", field:"harness"} | PASS |
| 5 | determinism (full-pass repeat) | byte-identical repeat response | determinism_byte_identical = true | PASS |
| 6 | parity (MCP vs REST, full-pass) | MCP structuredContent deep-equals REST artifact | parity_structured_equal = true | PASS |

**F1 disposition: RESOLVED.** Wave 1 F1 was: type-violating manifest fields returned HTTP 200 with a verdict computed over garbage instead of HTTP 422 `{ok:false, error:"invalid_input"}`. On retest the malformed case returns HTTP 422 with body `{"ok": false, "error": "invalid_input", "field": "harness", "detail": "harness must be an object"}` — exactly the contract error, no verdict artifact. All other cases (full-pass, violations, sparse) return their Wave 1-correct outcomes unchanged, and determinism and MCP/REST parity still hold. F1 is closed by this retest; no new findings.

### Second tester — DeepSeek (retest)

DeepSeek verdict: **PASS** — findings: none. It independently recomputed, with arithmetic shown: full-pass `params_to_data_ratio` = 10/1000 = **0.0100**, violations = 5/100 = **0.0500**; `results_sets_reported` = 3 / 3; `paper_gate_status` = completed / not_completed; `over_500_trade_declared` = true ($600 > $500) / false ($100 ≤ $500); verdicts VALIDATED / NOT_VALIDATED (violations: 30 pass, 5 fail, 1 missing). Every computed check matches the artifact — **recomputed mismatches: none**. Raw output: `verification/work/strategy-backtest-validation/deepseek-retest-raw.txt`.

Tester errors: none.

**Retest verdict: PASS**
