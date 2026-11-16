# Test report — codebase-visualization

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 56f92826f4284ec9a8570d683113aa86
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/codebase-visualization/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — 1 complete diagram entry (`arch-map`, format `mermaid`), dependency 10 included / 10 total, C4 levels `[context, containers, components]`, hotspot 5.0 × 2.0 = 10.0 declared 10.0, all red lines false | HTTP 200, verdict `CODEBASE_VISUALIZATION_READY`, `diagrams_evaluated` 1, `computed_dependency_coverage` `1.000000`, `dependency_coverage_difference` `0.000000`, `computed_hotspot_score` `10.000000`, `hotspot_score_difference` `0.000000`, `c4_levels_not_declared` `[]` | HTTP 200, `CODEBASE_VISUALIZATION_READY`, 32 pass / 0 fail / 0 missing, exactly those computed values, `computed_status` `within_stated_limits_on_declared_evidence` | PASS |
| 2 | violations — full manifest with diagram format `jpeg`, dependency included 5 vs total 10, declared hotspot score 99.0 vs 2.0 × 2.0 = 4.0 | HTTP 200, verdict `CODEBASE_VISUALIZATION_NOT_READY`, the 3 named checks fail | HTTP 200, `CODEBASE_VISUALIZATION_NOT_READY`, 29 pass / 3 fail / 0 missing; failing checks exactly `diagram_formats_use_stated_diagrams_as_code_tools`, `dependency_graph_covers_all_declared_modules`, `hotspot_score_matches_change_frequency_times_complexity`; `computed_dependency_coverage` `0.500000`, `dependency_coverage_difference` `-5.000000`, `computed_hotspot_score` `4.000000`, `hotspot_score_difference` `95.000000`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `entity` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 32 missing, computed fields null, `diagrams_evaluated` 0, `c4_levels_not_declared` null | PASS |
| 4 | malformed — `dependency.modules_total: "ten"` (string where a number is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"dependency.modules_total","detail":"dependency.modules_total must be a number"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `codebase_visualization`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 32 checks and a text stamp):

```json
{"service": "codebase-visualization", "atom_version": "0.1.0", "entity": "service-alpha", "verdict": "CODEBASE_VISUALIZATION_READY", "sections": {"diagrams_as_code": "pass", "dependency_views": "pass", "call_and_flow_views": "pass", "architecture_maps": "pass", "metrics_and_history_views": "pass", "honesty_and_currency": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "diagrams_evaluated": 1, "computed_dependency_coverage": "1.000000", "dependency_coverage_difference": "0.000000", "computed_hotspot_score": "10.000000", "hotspot_score_difference": "0.000000", "c4_levels_not_declared": [], "summary": "32 pass, 0 fail, 0 missing of 32 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"dependency.modules_total","detail":"dependency.modules_total must be a number"}
```

## Findings

No findings.

## Tester errors

5 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors):

1. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`diagrams_evaluated` 1, `computed_dependency_coverage` `1.000000`, `dependency_coverage_difference` `0.000000`, `computed_hotspot_score` `10.000000`, `hotspot_score_difference` `0.000000`, `c4_levels_not_declared` `[]`, `computed_status`).
2. Violations designed `failing_checks` listed invented shorthand names (`dependency_coverage`, `diagram_formats`, `hotspot_score`) instead of exact check names. Corrected before execution to the 3 exact check names above.
3. Violations input was sparse — most sections absent, so their checks would have been `missing`, not failing. Corrected before execution: rebuilt as a full manifest carrying exactly the three planted violations the designer intended (wrong diagram format `jpeg`, wrong dependency counts 5 vs 10, wrong declared hotspot score 99.0).
4. Violations `expect` carried no structured `computed_spot_checks` for its computed quantities. Corrected before execution: added the structured spot-check block (`computed_dependency_coverage` `0.500000`, `dependency_coverage_difference` `-5.000000`, `computed_hotspot_score` `4.000000`, `hotspot_score_difference` `95.000000`, `c4_levels_not_declared` `[]`, `computed_status`).
5. Malformed input carried two simultaneous type violations (`entity: 12345` and `dependency: "not-an-object"`), making the reported 422 field ambiguous. Corrected before execution: reduced to a single documented-field violation, `dependency.modules_total: "ten"` (string where a number is required).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (diagram-entry completeness and format membership, dependency coverage included ÷ total and its difference, C4 level coverage, hotspot score change-frequency × complexity and its difference, and `computed_status`, all with the SERVICE.md 6dp round-half-up rule) and verified the artifact's numbers and verdicts. Raw output: `verification/work/codebase-visualization/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `diagrams_evaluated` | 1 | 1 | ✓ |
| full-pass `computed_dependency_coverage` (10 / 10) | 1.000000 | 1.000000 | ✓ |
| full-pass `dependency_coverage_difference` (10 − 10) | 0.000000 | 0.000000 | ✓ |
| full-pass `computed_hotspot_score` (5.0 × 2.0) | 10.000000 | 10.000000 | ✓ |
| full-pass `hotspot_score_difference` (10.0 − 10.0) | 0.000000 | 0.000000 | ✓ |
| full-pass `c4_levels_not_declared` | [] | [] | ✓ |
| violations `computed_dependency_coverage` (5 / 10) | 0.500000 | 0.500000 | ✓ |
| violations `dependency_coverage_difference` (5 − 10) | -5.000000 | -5.000000 | ✓ |
| violations `computed_hotspot_score` (2.0 × 2.0) | 4.000000 | 4.000000 | ✓ |
| violations `hotspot_score_difference` (99.0 − 4.0) | 95.000000 | 95.000000 | ✓ |
| violations `c4_levels_not_declared` | [] | [] | ✓ |
| verdicts | CODEBASE_VISUALIZATION_READY / CODEBASE_VISUALIZATION_NOT_READY (3 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 3-check failure set on the violations case. The coordinating tester's own headline recompute also matches: 5.0 × 2.0 = 10.0 → `computed_hotspot_score` `10.000000`, and 10 / 10 → `computed_dependency_coverage` `1.000000`, identical to the artifact.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `dependency.modules_total`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
