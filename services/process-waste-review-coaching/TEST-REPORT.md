# Test report — process-waste-review-coaching

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 9595ea665b634289aad158b7fff277ac
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/process-waste-review-coaching/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (process `Order Fulfillment`): all Define/mapping declarations true, steps `Pick` (10 min, wait 2) and `Pack` (5 min, wait 1), one waste row (`waiting` on `Pick`), baseline/metrics/analyze declarations true, declared bottleneck `Pick`, all improve/control declarations true, all six red-line flags false | HTTP 200, verdict `PROCESS_WASTE_REVIEW_READY`, `steps_count` `2`, `wastes_count` `1`, `total_duration_minutes` `15`, `total_wait_minutes` `3`, `wait_share` `"0.166667"`, `distinct_waste_categories` `["waiting"]`, `duplicate_step_names` `[]`, `unmatched_waste_step_names` `[]`, `waste_step_coverage` `"1.000000"`, `bottleneck_step_computed` `"Pick"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `PROCESS_WASTE_REVIEW_READY`, 40 pass / 0 fail / 0 missing, all six sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest identical to full-pass except `define.problem_stated` false, `steps[1].name` duplicated as `Pick`, `wastes[0].category` `unknown_waste`, `wastes[0].step_name` `UnknownStep`, `constraint.bottleneck_step_name` `Pack`, and `red_lines.automating_broken_process_present` true | HTTP 200, verdict `PROCESS_WASTE_REVIEW_NOT_READY`, the 6 named checks fail | HTTP 200, `PROCESS_WASTE_REVIEW_NOT_READY`, 34 pass / 6 fail / 0 missing; failing checks exactly `declared_bottleneck_matches_longest_step`, `every_waste_category_valid_downtime`, `every_waste_step_names_declared_step`, `no_automating_broken_process`, `no_step_name_duplicated`, `process_problem_stated`; `steps_count` `2`, `wastes_count` `1`, `total_duration_minutes` `15`, `total_wait_minutes` `3`, `wait_share` `"0.166667"`, `distinct_waste_categories` `[]`, `duplicate_step_names` `["Pick"]`, `unmatched_waste_step_names` `["UnknownStep"]`, `waste_step_coverage` `"0.000000"`, `bottleneck_step_computed` `"Pick"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `define_and_visibility`, `steps_and_waste_observation`, `analysis_and_constraint` and `red_lines` `fail`, `measurement_and_metrics` and `improvement_and_control` `pass` | PASS |
| 3 | sparse — only `process` (`Minimal Review`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 40 missing, all six sections `insufficient_evidence`, `steps_count` null, `wastes_count` null, `total_duration_minutes` null, `total_wait_minutes` null, `wait_share` null, `distinct_waste_categories` null, `duplicate_step_names` null, `unmatched_waste_step_names` null, `waste_step_coverage` null, `bottleneck_step_computed` null, `computed_status` null | PASS |
| 4 | malformed — `define: "not_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"define","detail":"define must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `process_waste_review_coaching`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 40 checks and a text stamp):

```json
{"service": "process-waste-review-coaching", "atom_version": "0.1.0", "process": "Order Fulfillment", "verdict": "PROCESS_WASTE_REVIEW_READY", "sections": {"define_and_visibility": "pass", "steps_and_waste_observation": "pass", "measurement_and_metrics": "pass", "analysis_and_constraint": "pass", "improvement_and_control": "pass", "red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "steps_count": 2, "wastes_count": 1, "total_duration_minutes": 15, "total_wait_minutes": 3, "wait_share": "0.166667", "distinct_waste_categories": ["waiting"], "duplicate_step_names": [], "unmatched_waste_step_names": [], "waste_step_coverage": "1.000000", "bottleneck_step_computed": "Pick", "summary": "40 pass, 0 fail, 0 missing of 40 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"define","detail":"define must be an object"}
```

## Findings

No findings against the atom's behaviour — every executed case matched the contract in `contract.yaml` + `SERVICE.md` and the Python oracle.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 5 rejections in total — by rule: R1 check-register ×2, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named the input field path `constraint.bottleneck_step_name` instead of an exact check name — validator rejection: "failing_checks names 'constraint.bottleneck_step_name', which is not in the atom's check register (40 checks)". Corrected before execution as part of rebuilding the violations case (see item 2).
2. (R1) Violations designed `failing_checks` named the input field path `red_lines.automating_broken_process_present` instead of an exact check name — validator rejection: "failing_checks names 'red_lines.automating_broken_process_present', which is not in the atom's check register (40 checks)". Corrected before execution: the violations case was rebuilt as a full copy of the full-pass manifest carrying exactly the planted changes — `define.problem_stated` = false, `steps[1].name` = `"Pick"` (duplicated), `wastes[0].category` = `"unknown_waste"`, `wastes[0].step_name` = `"UnknownStep"`, `constraint.bottleneck_step_name` = `"Pack"`, `red_lines.automating_broken_process_present` = true — with `failing_checks` set to exactly the 6 exact check names those changes fail, confirmed by running the oracle on both inputs: `declared_bottleneck_matches_longest_step`, `every_waste_category_valid_downtime`, `every_waste_step_names_declared_step`, `no_automating_broken_process`, `no_step_name_duplicated`, `process_problem_stated`.
3. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes, and with `wait_share` as a bare number rather than the fixed 6-decimal string). Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `within_stated_limits_on_declared_evidence`, `steps_count` `2`, `wastes_count` `1`, `total_duration_minutes` `15`, `total_wait_minutes` `3`, `wait_share` `"0.166667"`, `distinct_waste_categories` `["waiting"]`, `duplicate_step_names` `[]`, `unmatched_waste_step_names` `[]`, `waste_step_coverage` `"1.000000"`, `bottleneck_step_computed` `"Pick"`).
4. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `outside_stated_limits_on_declared_evidence`, `steps_count` `2`, `wastes_count` `1`, `total_duration_minutes` `15`, `total_wait_minutes` `3`, `wait_share` `"0.166667"`, `distinct_waste_categories` `[]`, `duplicate_step_names` `["Pick"]`, `unmatched_waste_step_names` `["UnknownStep"]`, `waste_step_coverage` `"0.000000"`, `bottleneck_step_computed` `"Pick"`).
5. (R3) Violations input was a sparse manifest missing 43 key paths present in the full-pass manifest — validator rejection: "violations input is missing key paths present in the full-pass manifest (a sparse violations input reads as missing evidence, not as failure): analyze, analyze.pareto_vital_few_identified, analyze.root_cause_analysis_performed, constraint.bottleneck_identified, constraint.non_bottleneck_effort_subordinated, control, control.monitoring_in_place, control.regression_made_visible, control.win_standardized, define, define.customer_need_stated, define.goal_measurable_stated, define.problem_stated, define.scope_stated, define.whole_system_scope_declared, improve, improve.flow_and_pull_pursued_over_push, improve.improvement_piloted_before_scaling, improve.pdca_cycle_declared, improve.small_continuous_improvement_declared, improve.verified_against_baseline_before_scaling, mapping, mapping.process_defined_before_automation, mapping.whole_flow_mapped, mapping.work_made_visible, measure, measure.baseline_established_with_data, measure.baseline_from_data_not_anecdote, metrics, metrics.kpis_limited_to_meaningful_declared, metrics.lagging_indicators_declared, metrics.leading_indicators_declared, metrics.metrics_made_visible, red_lines.hero_culture_reliance_present, red_lines.local_optimization_hurting_whole_present, red_lines.optimizing_non_constraint_present, red_lines.tradition_without_data_present, red_lines.vanity_metrics_present, wastes, wastes[].category, wastes[].step_name". Corrected before execution by the same rebuild: the violations input is a deep copy of the full-pass manifest, so every key path is present and planted mutations change values only (oracle on the rebuilt input: 34 pass / 6 fail / 0 missing).

The full-pass input was verified genuinely valid against the Python oracle before execution (the oracle returns all 40 checks pass on it — no correction needed), the sparse case was already an identity-only manifest (`{process}` only, as designed), and the malformed case already carried exactly one documented type violation (`define` as a string where an object is required), so neither needed correction.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the eight primary computed checks, the declared counts and totals, the wait-share and coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, the distinct/duplicate/unmatched row-name lists, the computed bottleneck, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/process-waste-review-coaching/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `steps_count` / `wastes_count` | 2 / 1 | 2 / 1 | ✓ |
| full-pass `total_duration_minutes` (10 + 5) / `total_wait_minutes` (2 + 1) | 15 / 3 | 15 / 3 | ✓ |
| full-pass `wait_share` (3 ÷ 18) | "0.166667" | "0.166667" | ✓ |
| full-pass `distinct_waste_categories` / `duplicate_step_names` / `unmatched_waste_step_names` | ["waiting"] / [] / [] | ["waiting"] / [] / [] | ✓ |
| full-pass `waste_step_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `bottleneck_step_computed` (longest step, 10 min) | "Pick" | "Pick" | ✓ |
| full-pass `computed_status` (all eight computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `steps_count` / `wastes_count` | 2 / 1 | 2 / 1 | ✓ |
| violations `total_duration_minutes` / `total_wait_minutes` | 15 / 3 | 15 / 3 | ✓ |
| violations `wait_share` (3 ÷ 18) | "0.166667" | "0.166667" | ✓ |
| violations `distinct_waste_categories` (`unknown_waste` not a DOWNTIME category) | [] | [] | ✓ |
| violations `duplicate_step_names` | ["Pick"] | ["Pick"] | ✓ |
| violations `unmatched_waste_step_names` | ["UnknownStep"] | ["UnknownStep"] | ✓ |
| violations `waste_step_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `bottleneck_step_computed` (first longest step) | "Pick" | "Pick" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 6 planted checks | same 6 | ✓ |
| verdicts | PROCESS_WASTE_REVIEW_READY / PROCESS_WASTE_REVIEW_NOT_READY (6 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 6-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `define`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
