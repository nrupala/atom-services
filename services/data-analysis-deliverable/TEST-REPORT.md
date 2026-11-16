# Test report — data-analysis-deliverable

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 05ec9d2252ec4e26a46fc028eede90ab
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/data-analysis-deliverable/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — all framing/provenance/analysis/inference/recommendation/report/closure flags pass, sources `[db_logs, crm_data]`, values [10, 20] with stated total 30, stated mean 15, windows 100→110 with stated percent change 10 | HTTP 200, verdict `DELIVERABLE_COMPLETE`, `recomputed_total` `30.000000`, `recomputed_mean` `15.000000`, `recomputed_percent_change` `10.000000`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `DELIVERABLE_COMPLETE`, 40 pass / 0 fail / 0 missing, exactly those computed values, all six sections `pass` | PASS |
| 2 | violations — full manifest with values [10, 10] but stated total 50 (recomputed 20), stated mean 15 (recomputed 10), stated percent change 5 (recomputed 10), `cherry_picked_baselines_used` true, `causal_claims_from_observational_data_alone` true | HTTP 200, verdict `DELIVERABLE_NOT_COMPLETE`, the 5 named checks fail | HTTP 200, `DELIVERABLE_NOT_COMPLETE`, 35 pass / 5 fail / 0 missing; failing checks exactly `stated_total_matches_declared_values`, `stated_mean_matches_declared_values`, `stated_percent_change_matches_declared_windows`, `no_cherry_picked_baselines`, `no_causal_claims_from_observational_data_alone`; `recomputed_total` `20.000000`, `recomputed_mean` `10.000000`, `recomputed_percent_change` `10.000000`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `question` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 40 missing, computed fields null, `computed_status` null | PASS |
| 4 | malformed — `figures.stated_total: "thirty"` (string where a number is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"figures.stated_total","detail":"figures.stated_total must be a number"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `data_analysis_deliverable`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 40 checks and a text stamp):

```json
{"service": "data-analysis-deliverable", "atom_version": "0.1.0", "question": "Why did conversion drop?", "verdict": "DELIVERABLE_COMPLETE", "sections": {"question_framing": "pass", "data_provenance": "pass", "descriptive_and_diagnostic": "pass", "statistical_care": "pass", "insight_and_action": "pass", "reporting_and_reproducibility": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "recomputed_total": "30.000000", "recomputed_mean": "15.000000", "recomputed_percent_change": "10.000000", "summary": "40 pass, 0 fail, 0 missing of 40 checks across six sections."}
```

Violations response (REST, HTTP 200; excerpt):

```json
{"verdict": "DELIVERABLE_NOT_COMPLETE", "computed_status": "outside_stated_limits_on_declared_evidence", "recomputed_total": "20.000000", "recomputed_mean": "10.000000", "recomputed_percent_change": "10.000000", "summary": "35 pass, 5 fail, 0 missing of 40 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"figures.stated_total","detail":"figures.stated_total must be a number"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 judge-stage tester errors):

1. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`recomputed_total` `30.000000`, `recomputed_mean` `15.000000`, `recomputed_percent_change` `10.000000`, `computed_status` `within_stated_limits_on_declared_evidence`).
2. Violations designed `failing_checks` listed shorthand and field paths (`stated_total`, `stated_mean`, `stated_percent_change`, `analysis.cherry_picked_baselines_used`, `inference.causal_claims_from_observational_data_alone`) instead of exact check names. Corrected before execution to the 5 exact check names above.
3. Violations input was sparse — only `figures`, `analysis.cherry_picked_baselines_used` and `inference.causal_claims_from_observational_data_alone` present, so all other checks would have been `missing`, not failing. Corrected before execution: rebuilt as a full manifest carrying exactly the five planted violations (wrong stated total, wrong stated mean, wrong stated percent change, cherry-picked baselines true, causal claims from observational data true).
4. Malformed designed with two type violations (`question: 123` and `framing: "not_an_object"`). Corrected before execution to exactly one type violation of a documented typed field: `figures.stated_total: "thirty"` (string where a number is required).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (sum and mean of the declared values, percent change (current − prior) / prior × 100 over the declared windows, the data-sources check, and `computed_status`, all with the SERVICE.md 6dp round-half-up rule) and verified the artifact's numbers and verdicts. Raw output: `verification/work/data-analysis-deliverable/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `recomputed_total` (10 + 20) | 30.000000 | 30.000000 | ✓ |
| full-pass `recomputed_mean` (30 / 2) | 15.000000 | 15.000000 | ✓ |
| full-pass `recomputed_percent_change` ((110 − 100) / 100 × 100) | 10.000000 | 10.000000 | ✓ |
| violations `recomputed_total` (10 + 10) | 20.000000 | 20.000000 | ✓ |
| violations `recomputed_mean` (20 / 2) | 10.000000 | 10.000000 | ✓ |
| violations `recomputed_percent_change` ((110 − 100) / 100 × 100) | 10.000000 | 10.000000 | ✓ |
| verdicts | DELIVERABLE_COMPLETE / DELIVERABLE_NOT_COMPLETE (5 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 5-check failure set on the violations case. The coordinating tester's own headline recompute also matches: 10 + 20 = 30 → `recomputed_total` `30.000000`, identical to the artifact.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `figures.stated_total`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
