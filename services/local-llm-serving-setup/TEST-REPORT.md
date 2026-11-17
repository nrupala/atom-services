# Test report — local-llm-serving-setup

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment fe07be725c5a4817ad7b7e341310a97b
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/local-llm-serving-setup/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (setup `production-cluster-alpha`): all workload/model-selection/serving/performance/operations/fallback/evaluation declarations in passing polarity, one model `llama-3-8b` with budget documented, version pinned and checksum recorded, license vetted, performance measured and golden-task eval recorded | HTTP 200, verdict `LOCAL_LLM_SERVING_SOUND`, `models_count` `1`, `budget_coverage` `"1.000000"`, `performance_coverage` `"1.000000"`, `golden_eval_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `LOCAL_LLM_SERVING_SOUND`, 32 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except model `llama-3-8b` with `license_vetted_for_commercial_use` false, `serving.unauthenticated_inference_port_exposure_present` true, `performance.vram_overcommit_present` true and `evaluation.silent_model_swaps_present` true | HTTP 200, verdict `LOCAL_LLM_SERVING_NOT_SOUND`, the 4 named checks fail | HTTP 200, `LOCAL_LLM_SERVING_NOT_SOUND`, 28 pass / 4 fail / 0 missing; failing checks exactly `every_model_license_vetted_for_commercial_use`, `no_unauthenticated_inference_port_exposure`, `no_vram_overcommit`, `no_silent_model_swaps`; `models_without_vetted_license` `["llama-3-8b"]`, `budget_coverage` `"1.000000"`, `performance_coverage` `"1.000000"`, `golden_eval_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `model_selection_and_provenance`, `serving_stack_and_exposure`, `performance_and_operations`, `fallback_chains_and_evaluation` `fail`, `workload_and_memory_budget` `pass` | PASS |
| 3 | sparse — only `setup` (`incomplete-setup`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 32 missing, all five sections `insufficient_evidence`, `models_count` null, all row-name lists null, all three coverage ratios null, `computed_status` null | PASS |
| 4 | malformed — `workload: "should_be_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"workload","detail":"workload must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `local_llm_serving_setup`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 32 checks and a text stamp):

```json
{"service": "local-llm-serving-setup", "atom_version": "0.1.0", "setup": "production-cluster-alpha", "verdict": "LOCAL_LLM_SERVING_SOUND", "sections": {"workload_and_memory_budget": "pass", "model_selection_and_provenance": "pass", "serving_stack_and_exposure": "pass", "performance_and_operations": "pass", "fallback_chains_and_evaluation": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "models_count": 1, "models_without_budget_documentation": [], "budget_coverage": "1.000000", "models_without_pinned_version_and_checksum": [], "models_without_vetted_license": [], "models_without_performance_measurement": [], "performance_coverage": "1.000000", "models_without_golden_task_eval": [], "golden_eval_coverage": "1.000000", "summary": "32 pass, 0 fail, 0 missing of 32 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"workload","detail":"workload must be an object"}
```

## Findings

No findings.

## Tester errors

9 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 8 rejections in total — by rule: R1 check-register ×4, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×1. One further error (item 9) was caught by the local Python oracle pre-check, not by the validator. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` listed the input field path `models[].license_vetted_for_commercial_use` instead of an exact check name — 1 validator rejection. Corrected before execution to `every_model_license_vetted_for_commercial_use`.
2. (R1) Violations designed `failing_checks` listed the input field path `serving.unauthenticated_inference_port_exposure_present` instead of an exact check name — 1 validator rejection. Corrected before execution to `no_unauthenticated_inference_port_exposure`.
3. (R1) Violations designed `failing_checks` listed the input field path `performance.vram_overcommit_present` instead of an exact check name — 1 validator rejection. Corrected before execution to `no_vram_overcommit`.
4. (R1) Violations designed `failing_checks` listed the input field path `evaluation.silent_model_swaps_present` instead of an exact check name — 1 validator rejection. Corrected before execution to `no_silent_model_swaps`.
5. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`models_count` `1`, `models_without_budget_documentation` `[]`, `budget_coverage` `"1.000000"`, `models_without_pinned_version_and_checksum` `[]`, `models_without_vetted_license` `[]`, `models_without_performance_measurement` `[]`, `performance_coverage` `"1.000000"`, `models_without_golden_task_eval` `[]`, `golden_eval_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence`), each value computed by hand from the input per SERVICE.md.
6. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`models_count` `1`, `models_without_budget_documentation` `[]`, `budget_coverage` `"1.000000"`, `models_without_pinned_version_and_checksum` `[]`, `models_without_vetted_license` `["llama-3-8b"]`, `models_without_performance_measurement` `[]`, `performance_coverage` `"1.000000"`, `models_without_golden_task_eval` `[]`, `golden_eval_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`).
7. (R3) Violations input was not a full manifest — it omitted 27 key paths present in the full-pass manifest (all of `workload`, `model_selection`, `fallback`, most of `serving` and `performance`, and part of `evaluation`), used a different setup and model name, and carried only the planted sections. Corrected before execution: rebuilt it as a full copy of the full-pass manifest carrying exactly the 4 planted violations (model `llama-3-8b` with `license_vetted_for_commercial_use` false, `serving.unauthenticated_inference_port_exposure_present` true, `performance.vram_overcommit_present` true, `evaluation.silent_model_swaps_present` true) and nothing else changed.
8. (R4) Malformed input carried 2 type violations (`setup` as the number `12345` where a string is required, and `workload` as a string where an object is required). Corrected before execution: reduced to exactly one type violation — `workload: "should_be_an_object"` with `setup` as a correct string — so the 422 field (`workload`) is unambiguous.
9. (Oracle pre-check, no validator rule) Full-pass input nested the five operations fields (`health_endpoint_present`, `structured_logs_present`, `model_catalog_pinned`, `disk_space_for_weights_monitored`, `upgrade_path_backup_swap_verify_rollback_present`) inside `performance`, where the oracle ignores them — the oracle returned `INSUFFICIENT_EVIDENCE` (27 pass / 0 fail / 5 missing) on the raw design. Corrected before execution: moved those five fields to the documented top-level `operations` object, leaving `performance` with its three documented fields; the corrected full-pass input returns all 32 checks pass on the oracle.

The sparse case was verified genuinely sparse before execution (only `setup` — the oracle returns 0 pass / 0 fail / 32 missing, `INSUFFICIENT_EVIDENCE` — no correction needed beyond the items above), and the violations input was verified on the oracle before execution to fail exactly the 4 planted checks (28 pass / 4 fail / 0 missing).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the six primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/local-llm-serving-setup/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `models_count` | 1 | 1 | ✓ |
| full-pass `budget_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `performance_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `golden_eval_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `models_without_budget_documentation` / `models_without_pinned_version_and_checksum` / `models_without_vetted_license` / `models_without_performance_measurement` / `models_without_golden_task_eval` | [] / [] / [] / [] / [] | [] / [] / [] / [] / [] | ✓ |
| full-pass `computed_status` (all six computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `models_without_vetted_license` (`llama-3-8b` license not vetted) | ["llama-3-8b"] | ["llama-3-8b"] | ✓ |
| violations `budget_coverage` / `performance_coverage` / `golden_eval_coverage` (1 ÷ 1 each) | "1.000000" / "1.000000" / "1.000000" | "1.000000" / "1.000000" / "1.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | LOCAL_LLM_SERVING_SOUND / LOCAL_LLM_SERVING_NOT_SOUND (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity); where the Gemini judge's computed-check list covered only four quantities, the full spot-check set was verified mechanically from the evidence and by DeepSeek, so no contradiction arises — the evidence stands as recorded.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `workload`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
