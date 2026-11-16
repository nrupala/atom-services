# Test report — data-ml-pipeline-engineering

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 05ec9d2252ec4e26a46fc028eede90ab
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/data-ml-pipeline-engineering/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — sources 100+50=150 declared 150, splits 80+40+30=150 declared 150, latency 100 within caller budget 200, cost 50 within caller budget 100, all evidence booleans true and the three must-be-false red lines (`silent_coercion_present`, `unrecorded_manual_reruns_present`, `pii_in_training_data_without_lawful_basis`) false | HTTP 200, verdict `DATA_ML_PIPELINE_READY`, `computed_total_rows` `150.000000`, `total_rows_difference` `0.000000`, `computed_split_total_rows` `150.000000`, `split_total_difference` `0.000000`, `latency_headroom_ms` `100.000000`, `monthly_cost_headroom` `50.000000`, `sources_evaluated` 2, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `DATA_ML_PIPELINE_READY`, 46 pass / 0 fail / 0 missing, exactly those computed values | PASS |
| 2 | violations — full manifest with sources declared total 999 vs sum 150, `silent_coercion_present` true, splits declared total 100 vs sum 150, estimated latency 500 vs caller budget 200, estimated cost 500 vs caller budget 100, PII without lawful basis true | HTTP 200, verdict `DATA_ML_PIPELINE_NOT_READY`, the 6 named checks fail | HTTP 200, `DATA_ML_PIPELINE_NOT_READY`, 40 pass / 6 fail / 0 missing; failing checks exactly `total_rows_matches_sum_of_source_rows`, `no_silent_coercion`, `split_total_matches_sum_of_split_rows`, `no_pii_in_training_data_without_lawful_basis`, `latency_within_caller_declared_budget`, `cost_within_caller_declared_budget`; `computed_total_rows` `150.000000`, `total_rows_difference` `849.000000`, `computed_split_total_rows` `150.000000`, `split_total_difference` `-50.000000`, `latency_headroom_ms` `-300.000000`, `monthly_cost_headroom` `-400.000000`, `sources_evaluated` 2, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `entity` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 46 missing, computed fields null, `sources_evaluated` 0, `computed_status` null | PASS |
| 4 | malformed — `sources.declared_total_rows: "one-hundred"` (string where a number is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"sources.declared_total_rows","detail":"sources.declared_total_rows must be a number"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `data_ml_pipeline_engineering`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 46 checks and a text stamp):

```json
{"service": "data-ml-pipeline-engineering", "atom_version": "0.1.0", "entity": "test-pipeline-001", "verdict": "DATA_ML_PIPELINE_READY", "sections": {"contracts_and_ingestion": "pass", "idempotency_and_orchestration": "pass", "quality_gates": "pass", "lineage_and_reproducibility": "pass", "ml_hygiene_and_splits": "pass", "lifecycle_and_serving": "pass", "monitoring_and_drift": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "sources_evaluated": 2, "computed_total_rows": "150.000000", "total_rows_difference": "0.000000", "computed_split_total_rows": "150.000000", "split_total_difference": "0.000000", "latency_headroom_ms": "100.000000", "monthly_cost_headroom": "50.000000", "summary": "46 pass, 0 fail, 0 missing of 46 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"sources.declared_total_rows","detail":"sources.declared_total_rows must be a number"}
```

## Findings

No findings.

## Tester errors

6 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 judge-stage tester errors):

1. Full-pass mis-nested three documented field groups — `training.reproducible_with_seeds_and_pinned_env` was placed under `lineage`, the `features.*` fields under `splits`, and `privacy.pii_in_training_data_without_lawful_basis` under `splits` — so 5 checks would have been `missing` and the case would have returned `INSUFFICIENT_EVIDENCE`, not `DATA_ML_PIPELINE_READY`. Corrected before execution: moved all three groups to their documented top-level `training` / `features` / `privacy` objects, with no change to any value or the expected verdict.
2. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`computed_total_rows` `150.000000`, `total_rows_difference` `0.000000`, `computed_split_total_rows` `150.000000`, `split_total_difference` `0.000000`, `latency_headroom_ms` `100.000000`, `monthly_cost_headroom` `50.000000`, `sources_evaluated` 2, `computed_status`).
3. Violations designed `failing_checks` listed field paths (`sources.declared_total_rows`, `sources.silent_coercion_present`, `splits.declared_total_rows`, `serving.latency_budget_ms`, `serving.monthly_cost_budget`, `privacy.pii_in_training_data_without_lawful_basis`) instead of exact check names. Corrected before execution to the 6 exact check names above.
4. Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`computed_total_rows` `150.000000`, `total_rows_difference` `849.000000`, `computed_split_total_rows` `150.000000`, `split_total_difference` `-50.000000`, `latency_headroom_ms` `-300.000000`, `monthly_cost_headroom` `-400.000000`, `sources_evaluated` 2, `computed_status`).
5. Violations input was sparse — most sections absent, so their checks would have been `missing`, not failing. Corrected before execution: rebuilt as a full manifest (the corrected full-pass manifest) carrying exactly the six planted violations the designer intended (wrong sources total, silent coercion true, wrong splits total, latency over the caller's own budget, cost over the caller's own budget, PII without lawful basis true).
6. Malformed carried two type violations (`sources.datasets` as a string and `sources.declared_total_rows` as a string) instead of exactly one. Corrected before execution: reduced to the single documented typed field `sources.declared_total_rows: "one-hundred"`.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (source-row sums, split-row sums, latency and cost headrooms against the caller-declared budgets, `sources_evaluated`, and `computed_status`, all with the SERVICE.md 6dp round-half-up rule) and verified the artifact's numbers and verdicts. Raw output: `verification/work/data-ml-pipeline-engineering/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `computed_total_rows` (100 + 50) | 150.000000 | 150.000000 | ✓ |
| full-pass `total_rows_difference` (150 − 150) | 0.000000 | 0.000000 | ✓ |
| full-pass `computed_split_total_rows` (80 + 40 + 30) | 150.000000 | 150.000000 | ✓ |
| full-pass `split_total_difference` (150 − 150) | 0.000000 | 0.000000 | ✓ |
| full-pass `latency_headroom_ms` (200 − 100) | 100.000000 | 100.000000 | ✓ |
| full-pass `monthly_cost_headroom` (100 − 50) | 50.000000 | 50.000000 | ✓ |
| full-pass `sources_evaluated` | 2 | 2 | ✓ |
| violations `computed_total_rows` (100 + 50) | 150.000000 | 150.000000 | ✓ |
| violations `total_rows_difference` (999 − 150) | 849.000000 | 849.000000 | ✓ |
| violations `split_total_difference` (100 − 150) | -50.000000 | -50.000000 | ✓ |
| violations `latency_headroom_ms` (200 − 500) | -300.000000 | -300.000000 | ✓ |
| violations `monthly_cost_headroom` (100 − 500) | -400.000000 | -400.000000 | ✓ |
| verdicts | DATA_ML_PIPELINE_READY / DATA_ML_PIPELINE_NOT_READY (6 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 6-check failure set on the violations case. The coordinating tester's own headline recompute also matches: sources 100 + 50 = 150 and splits 80 + 40 + 30 = 150 → `computed_total_rows` / `computed_split_total_rows` `150.000000`, identical to the artifact.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `sources.declared_total_rows`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
