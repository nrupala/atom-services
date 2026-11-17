# Test report — ml-project-framing-review

**Tester:** external-verification@aimlds.org — Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment a15298eb9b7f40bf80d306cea4a33f80
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/ml-project-framing-review/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (project `Test Project`): all framing / metric / data-plan / evaluation-plan / approach / serving declarations in passing polarity, LLM/RAG gate `uses_llm_or_rag` false with the four gated fields declared false (pass as not-applicable), all six red-line flags false, baseline fields under `baseline.*`, one metric row `m1` with `decision_action` `update_threshold`, tied to a decision, baseline recorded | HTTP 200, verdict `ML_FRAMING_SOUND`, `metrics_count` `1`, `tied_to_decision_coverage` `"1.000000"`, `baseline_recorded_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `ML_FRAMING_SOUND`, 43 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except `metric.accuracy_for_its_own_sake_present` true, plus an appended copy of the single designed metric carrying `tied_to_decision` false, `decision_action` `""` and the same name `m1` | HTTP 200, verdict `ML_FRAMING_NOT_SOUND`, the 4 named checks fail | HTTP 200, `ML_FRAMING_NOT_SOUND`, 39 pass / 4 fail / 0 missing; failing checks exactly `no_accuracy_for_its_own_sake`, `every_metric_tied_to_decision`, `every_metric_names_decision_action`, `no_metric_name_duplicated`; `metrics_count` `2`, `metrics_without_tied_decision` `["m1"]`, `tied_to_decision_coverage` `"0.500000"`, `metrics_without_baseline_recorded` `[]`, `baseline_recorded_coverage` `"1.000000"`, `duplicate_metric_names` `["m1"]`, `computed_status` `outside_stated_limits_on_declared_evidence`; section `metric_and_baseline_framing` `fail`, the other four `pass` | PASS |
| 3 | sparse — only `project` (`churn-pilot`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 43 missing, all five sections `insufficient_evidence`, `metrics_count` null, `metrics_without_tied_decision` null, `tied_to_decision_coverage` null, `metrics_without_baseline_recorded` null, `baseline_recorded_coverage` null, `duplicate_metric_names` null, `computed_status` null | PASS |
| 4 | malformed — `framing: "not_an_object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"framing","detail":"framing must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `ml_project_framing_review`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 43 checks and a text stamp):

```json
{"service": "ml-project-framing-review", "atom_version": "0.1.0", "project": "Test Project", "verdict": "ML_FRAMING_SOUND", "sections": {"ml_necessity_and_decision_framing": "pass", "metric_and_baseline_framing": "pass", "data_and_evaluation_plan": "pass", "approach_reproducibility_and_llm_framing": "pass", "anti_pattern_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "metrics_count": 1, "metrics_without_tied_decision": [], "tied_to_decision_coverage": "1.000000", "metrics_without_baseline_recorded": [], "baseline_recorded_coverage": "1.000000", "duplicate_metric_names": [], "summary": "43 pass, 0 fail, 0 missing of 43 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"framing","detail":"framing must be an object"}
```

## Findings

No findings. The Gemini judge returned verdict `PASS` with 0 findings and 0 tester errors at the judgment stage (`verification/work/ml-project-framing-review/judgment.json`: verdict `PASS`, findings `[]`, tester_errors `[]`; computed checks verified: full-pass `metrics_count` 1, `tied_to_decision_coverage` `"1.000000"`, `baseline_recorded_coverage` `"1.000000"`; violations `metrics_count` 2, `tied_to_decision_coverage` `"0.500000"` — all match).

## Tester errors

5 tester errors in total — all raw-design validator rejections, caught pre-execution at design time and not scored against the atom — plus a genuine-validity design error, also corrected during the design-time correction before execution. Zero executed-case tester errors (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 5 rejections in total — by rule: R1 check-register ×3, R2 structured-spot-checks ×2. The corrected, executed battery passed the validator (`ok: true`, register size 43) before execution.

1. (R1 ×3) Violations designed `failing_checks` named section names / non-register names — `metric_and_baseline_framing`, `decision_action_per_metric` and `tied_to_decision_per_metric` — instead of exact check names in the atom's 43-check register — 3 validator rejections. Corrected before execution to the exact check names the planted values fail.
2. (R2 ×2) Full-pass and violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks` — 2 validator rejections. Corrected before execution by structured injection from the oracle: full-pass (`computed_status` `within_stated_limits_on_declared_evidence`, `metrics_count` `1`, `metrics_without_tied_decision` `[]`, `tied_to_decision_coverage` `"1.000000"`, `metrics_without_baseline_recorded` `[]`, `baseline_recorded_coverage` `"1.000000"`, `duplicate_metric_names` `[]`) and the corresponding violations block.
3. (Genuine-validity design error — not a validator rejection count) Gemini nested the three baseline fields under `metric.*` instead of `baseline.*`, and its `llm` object carried only the gate (`uses_llm_or_rag` false) with the four gated fields absent — an absent gated field reads as missing even when the gate is false. Both corrected during the design-time correction: the baseline fields were moved to `baseline.*`, and the four gated `llm` fields were declared `false`, consistent with the declared gate (they pass as not-applicable). The violations case was also rebuilt in that correction as the full manifest plus the planted violations (`metric.accuracy_for_its_own_sake_present` true, and an appended copy of the single designed metric carrying `tied_to_decision` false, `decision_action` `""` and the same name — producing the duplicate-name, tied and decision-action failures).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the five primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/ml-project-framing-review/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `metrics_count` | 1 | 1 | ✓ |
| full-pass `tied_to_decision_coverage` (1 ÷ 1) | `"1.000000"` | `"1.000000"` | ✓ |
| full-pass `baseline_recorded_coverage` (1 ÷ 1) | `"1.000000"` | `"1.000000"` | ✓ |
| full-pass `metrics_without_tied_decision` / `metrics_without_baseline_recorded` / `duplicate_metric_names` | [] / [] / [] | [] / [] / [] | ✓ |
| full-pass `computed_status` (all five computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `metrics_count` | 2 | 2 | ✓ |
| violations `metrics_without_tied_decision` (appended `m1` row tied_to_decision false) | `["m1"]` | `["m1"]` | ✓ |
| violations `duplicate_metric_names` | `["m1"]` | `["m1"]` | ✓ |
| violations `tied_to_decision_coverage` (1 ÷ 2) | `"0.500000"` | `"0.500000"` | ✓ |
| violations `baseline_recorded_coverage` (2 ÷ 2) | `"1.000000"` | `"1.000000"` | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | ML_FRAMING_SOUND / ML_FRAMING_NOT_SOUND (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence matches on every point (per-case HTTP status, verdicts, failing-check set, sparse outcome, malformed 422 field, determinism and parity).

## Documentation link (designed absence — recorded, never scored)

The atom's documentation page is absent by design at this wave. Checked 2026-11-16 with a browser user-agent (the sandbox Python-urllib default UA is banned by the Cloudflare zones, error 1010):

- `GET https://atoms.pipavia.com/docs/ml-project-framing-review` → **404**.
- `GET https://atoms.pipavia.com/api.json` → 200; the catalogue lists **107** atoms in total; the `ml-project-framing-review` entry carries **no `documentation` key**; **93** entries in total carry a `documentation` key.

This absence is designed — Batch 16's WS1 documentation pass follows this wave — and is never scored against the atom.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `framing`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
