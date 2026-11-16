# Test report — data-visualization-design

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 05ec9d2252ec4e26a46fc028eede90ab
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/data-visualization-design/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — single comparison → bar row (y_axis_start 0, categories 5, sorted, no dual axis / truncation / 3D / red-green), all honesty, perception, colour, annotation, accessibility, dashboard and reproducibility declarations passing | HTTP 200, verdict `DATA_VISUALIZATION_DESIGN_SOUND`, `computed_max_categories` `5.000000`, `max_categories_difference_from_limit` `-2.000000`, `charts_evaluated` 1, `charts_not_matching_question` `[]`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `DATA_VISUALIZATION_DESIGN_SOUND`, 38 pass / 0 fail / 0 missing, exactly those computed values, all seven sections `pass` | PASS |
| 2 | violations — full manifest with exactly 7 planted computed violations on one comparison → bar row: y_axis_start 10, categories_count 10, bars_sorted false, dual_axis true, axis_truncated true with truncated_flagged_loudly false, uses_3d true, red_green_only true; all other sections passing | HTTP 200, verdict `DATA_VISUALIZATION_DESIGN_NOT_SOUND`, the 7 named checks fail, `computed_max_categories` `10.000000`, `max_categories_difference_from_limit` `3.000000` | HTTP 200, `DATA_VISUALIZATION_DESIGN_NOT_SOUND`, 31 pass / 7 fail / 0 missing; failing checks exactly `comparison_charts_sorted`, `bar_charts_y_axis_starts_at_zero`, `no_dual_axes_in_declared_charts`, `truncated_axes_flagged_loudly`, `no_3d_in_declared_charts`, `red_green_not_used_alone_in_declared_charts`, `category_counts_within_stated_limit`; `computed_max_categories` `10.000000`, `max_categories_difference_from_limit` `3.000000`, `charts_evaluated` 1, `charts_not_matching_question` `[]`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `entity` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 38 missing, computed fields null, `charts_evaluated` 0, `computed_status` null, all seven sections `insufficient_evidence` | PASS |
| 4 | malformed — `charts: "not_a_list"` (string where a list is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"charts","detail":"charts must be a list"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `data_visualization_design`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 38 checks and a text stamp):

```json
{"service": "data-visualization-design", "atom_version": "0.1.0", "entity": "Q3_Sales_Report", "verdict": "DATA_VISUALIZATION_DESIGN_SOUND", "sections": {"question_and_chart_choice": "pass", "honesty_and_axes": "pass", "perception_and_chart_junk": "pass", "color": "pass", "annotation_and_labels": "pass", "accessibility": "pass", "dashboards_and_reproducibility": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "charts_evaluated": 1, "computed_max_categories": "5.000000", "max_categories_difference_from_limit": "-2.000000", "charts_not_matching_question": [], "summary": "38 pass, 0 fail, 0 missing of 38 checks across seven sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"charts","detail":"charts must be a list"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at judgment stage):

1. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`computed_max_categories` `5.000000`, `max_categories_difference_from_limit` `-2.000000`, `charts_evaluated` 1, `charts_not_matching_question` `[]`, `computed_status` `within_stated_limits_on_declared_evidence`).
2. Violations designed `failing_checks` listed 4 inexact/shorthand names (`category_counts_within_limit`, `no_dual_axes`, `no_3d`, `no_red_green_only`) instead of the exact check-register names. Corrected before execution to the 7 exact names: `comparison_charts_sorted`, `bar_charts_y_axis_starts_at_zero`, `no_dual_axes_in_declared_charts`, `truncated_axes_flagged_loudly`, `no_3d_in_declared_charts`, `red_green_not_used_alone_in_declared_charts`, `category_counts_within_stated_limit`.
3. Violations input was sparse — only `entity`, `brief` and `charts` present, so the absent honesty, perception, colour, annotation, accessibility, dashboard and reproducibility checks would have been `missing`, not failing. Corrected before execution: rebuilt as a full manifest carrying exactly the seven planted violations, with all other sections set to their passing values.
4. Violations `expect` omitted the structured `computed_spot_checks`. Corrected before execution: added the structured block (`computed_max_categories` `10.000000`, `max_categories_difference_from_limit` `3.000000`, `charts_evaluated` 1, `charts_not_matching_question` `[]`, `computed_status` `outside_stated_limits_on_declared_evidence`).

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types/nesting, comparison → bar mapping correct), and the malformed case was verified to carry exactly one type violation of a documented typed field (`charts` as a string) — neither needed correction.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (chart-entry completeness, question → chart mapping, comparison sorting, bar zero-baseline, dual-axis, truncation flagging, 3D and red/green rules, category maximum and difference from the stated limit of 7, and `computed_status`, all with the SERVICE.md 6dp round-half-up rule) and verified the artifact's numbers, check statuses and verdicts. Raw output: `verification/work/data-visualization-design/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `computed_max_categories` (max of [5]) | 5.000000 | 5.000000 | ✓ |
| full-pass `max_categories_difference_from_limit` (5 − 7) | -2.000000 | -2.000000 | ✓ |
| full-pass `charts_evaluated` | 1 | 1 | ✓ |
| full-pass `charts_not_matching_question` (comparison → bar matches) | [] | [] | ✓ |
| full-pass `computed_status` (all 10 computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `computed_max_categories` (max of [10]) | 10.000000 | 10.000000 | ✓ |
| violations `max_categories_difference_from_limit` (10 − 7) | 3.000000 | 3.000000 | ✓ |
| violations `charts_evaluated` | 1 | 1 | ✓ |
| violations `charts_not_matching_question` | [] | [] | ✓ |
| violations `computed_status` (computed checks fail) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| verdicts | DATA_VISUALIZATION_DESIGN_SOUND / DATA_VISUALIZATION_DESIGN_NOT_SOUND (7 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

DeepSeek also confirmed the violations case fails exactly the seven checks the planted values should fail, with no extra and no missed failures. One cosmetic observation (not a computed quantity and not scored as a finding): in the violations artifact, the evidence strings for `comparison_charts_sorted` and `bar_charts_y_axis_starts_at_zero` retain the static "(… passes vacuously)" wording while their statuses are correctly `fail`; the statuses, counts and verdict are correct.

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 7-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `charts`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
