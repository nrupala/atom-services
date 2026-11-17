# Test report — long-form-authoring-pipeline

**Tester:** external-verification@aimlds.org
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Judge:** Gemini (gemini_judge.py — independent external tester)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment a15298eb9b7f40bf80d306cea4a33f80
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/long-form-authoring-pipeline/evidence.json
**Validation:** verification/work/long-form-authoring-pipeline/validation.json — `ok: true`

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (work `The Art of Authoring`): all outline/drafting/review/versioning/builds/publishing/feedback declarations in passing polarity, all three red-line flags false, one unit row `Intro` with a single point and non-empty point/outcome, four review passes covering `structure`, `technical_accuracy`, `style_read_aloud`, `facts_attribution`, all recorded | HTTP 200, verdict `AUTHORING_PIPELINE_SOUND`, `units_count` `1`, `review_passes_count` `4`, `single_point_coverage` `"1.000000"`, `point_or_outcome_coverage` `"1.000000"`, `recorded_review_pass_coverage` `"1.000000"`, `valid_review_pass_type_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `AUTHORING_PIPELINE_SOUND`, 36 pass / 0 fail / 0 missing, all six sections `pass`, exactly those computed values (all row-name lists `[]`, `missing_review_pass_types` `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except unit `Intro` with `has_single_point` false and `point_or_outcome` `""`, and review pass `P4` with `pass_type` changed `facts_attribution`→`"structure"` (duplicate) and `recorded` false | HTTP 200, verdict `AUTHORING_PIPELINE_NOT_SOUND`, the 4 named checks fail | HTTP 200, `AUTHORING_PIPELINE_NOT_SOUND`, 32 pass / 4 fail / 0 missing; failing checks exactly `every_unit_has_single_point`, `every_unit_point_or_outcome_declared`, `all_required_review_pass_types_present`, `every_review_pass_recorded`; `units_without_single_point` `["Intro"]`, `single_point_coverage` `"0.000000"`, `units_without_point_or_outcome` `["Intro"]`, `point_or_outcome_coverage` `"0.000000"`, `review_passes_without_record` `["P4"]`, `recorded_review_pass_coverage` `"0.750000"`, `review_passes_with_invalid_type` `[]`, `valid_review_pass_type_coverage` `"1.000000"`, `missing_review_pass_types` `["facts_attribution"]`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `outline_as_contract` and `review_passes` `fail`, the other four `pass` | PASS |
| 3 | sparse — only `work` (`Untitled Draft`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 36 missing, all six sections `insufficient_evidence`, `units_count` null, `units_without_single_point` null, `single_point_coverage` null, `units_without_point_or_outcome` null, `point_or_outcome_coverage` null, `review_passes_count` null, `review_passes_without_record` null, `recorded_review_pass_coverage` null, `review_passes_with_invalid_type` null, `valid_review_pass_type_coverage` null, `missing_review_pass_types` null, `computed_status` null | PASS |
| 4 | malformed — `units: "not_a_list"` (string where a list is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"units","detail":"units must be a list"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `long_form_authoring_pipeline`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 36 checks and a text stamp):

```json
{"service": "long-form-authoring-pipeline", "atom_version": "0.1.0", "work": "The Art of Authoring", "verdict": "AUTHORING_PIPELINE_SOUND", "sections": {"outline_as_contract": "pass", "drafting_loop": "pass", "review_passes": "pass", "versioning_and_builds": "pass", "publishing": "pass", "feedback_loop_and_red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "units_count": 1, "units_without_single_point": [], "single_point_coverage": "1.000000", "units_without_point_or_outcome": [], "point_or_outcome_coverage": "1.000000", "review_passes_count": 4, "review_passes_without_record": [], "recorded_review_pass_coverage": "1.000000", "review_passes_with_invalid_type": [], "valid_review_pass_type_coverage": "1.000000", "missing_review_pass_types": [], "summary": "36 pass, 0 fail, 0 missing of 36 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"units","detail":"units must be a list"}
```

## Findings

No findings. Gemini judge verdict: **PASS**, findings: [], tester_errors: [] (0 findings, 0 tester errors at the judgment stage).

## Tester errors

7 tester errors in total from the raw validator rejections, plus one genuine-validity tester error — all caught pre-execution and not scored against the atom; zero executed-case tester errors. The mechanical pre-flight validator rejected the raw Gemini design with 7 rejections in total — by rule: R1 check-register ×4, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1 ×4) Violations designed `failing_checks` named `units_without_single_point`, `review_passes_with_invalid_type`, `missing_review_pass_types` and `red_lines.published_without_accuracy_pass_present`, none of which is in the atom's check register (36 checks) — 4 validator rejections. Corrected before execution to the exact check names the planted values fail.
2. (R2 ×2) Full-pass and violations `expect` carried no structured `computed_spot_checks` (quantities stated only in prose notes do not count) — 2 validator rejections. Corrected before execution: added the structured spot-check blocks, each value computed from the input per SERVICE.md and confirmed against the Python oracle (full-pass: `computed_status` `within_stated_limits_on_declared_evidence`, `units_count` `1`, `units_without_single_point` `[]`, `single_point_coverage` `"1.000000"`, `units_without_point_or_outcome` `[]`, `point_or_outcome_coverage` `"1.000000"`, `review_passes_count` `4`, `review_passes_without_record` `[]`, `recorded_review_pass_coverage` `"1.000000"`, `review_passes_with_invalid_type` `[]`, `valid_review_pass_type_coverage` `"1.000000"`, `missing_review_pass_types` `[]`; violations: `computed_status` `outside_stated_limits_on_declared_evidence`, `units_count` `1`, `units_without_single_point` `["Intro"]`, `single_point_coverage` `"0.000000"`, `units_without_point_or_outcome` `["Intro"]`, `point_or_outcome_coverage` `"0.000000"`, `review_passes_count` `4`, `review_passes_without_record` `["P4"]`, `recorded_review_pass_coverage` `"0.750000"`, `review_passes_with_invalid_type` `[]`, `valid_review_pass_type_coverage` `"1.000000"`, `missing_review_pass_types` `["facts_attribution"]`).
3. (R3 ×1) Violations input was not a full manifest — it was missing 29 key paths present in the full-pass manifest, so it read as missing evidence rather than failure. Corrected before execution: rebuilt it as a full copy of the full-pass manifest carrying exactly the planted violations (unit `Intro` single-point fields, and review pass `P4` `pass_type` changed `facts_attribution`→`"structure"` duplicate and `recorded=false`) and nothing else changed.
4. Genuine-validity error (flat dotted keys): Gemini wrote the section fields as flat dotted keys (e.g. `"outline.toc_approved_before_drafting"`) instead of nested objects, leaving 29 checks missing. The coordinator's correction driver unflattened them into nested objects, rebuilt the violations case as the full manifest plus the planted violations, and injected structured computed spot checks from the oracle. All caught pre-execution; the executed design is nested and validator-passed.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the seven primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/long-form-authoring-pipeline/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `units_count` | 1 | 1 | ✓ |
| full-pass `review_passes_count` | 4 | 4 | ✓ |
| full-pass `single_point_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `point_or_outcome_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `recorded_review_pass_coverage` (4 ÷ 4) | "1.000000" | "1.000000" | ✓ |
| full-pass `valid_review_pass_type_coverage` (4 ÷ 4) | "1.000000" | "1.000000" | ✓ |
| full-pass `units_without_single_point` / `units_without_point_or_outcome` / `review_passes_without_record` / `review_passes_with_invalid_type` / `missing_review_pass_types` | [] / [] / [] / [] / [] | [] / [] / [] / [] / [] | ✓ |
| full-pass `computed_status` (all seven computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `units_without_single_point` (`Intro` has_single_point false) | ["Intro"] | ["Intro"] | ✓ |
| violations `single_point_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `point_or_outcome_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `review_passes_without_record` (`P4` recorded false) | ["P4"] | ["P4"] | ✓ |
| violations `recorded_review_pass_coverage` (3 ÷ 4) | "0.750000" | "0.750000" | ✓ |
| violations `valid_review_pass_type_coverage` (4 ÷ 4) | "1.000000" | "1.000000" | ✓ |
| violations `missing_review_pass_types` | ["facts_attribution"] | ["facts_attribution"] | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | AUTHORING_PIPELINE_SOUND / AUTHORING_PIPELINE_NOT_SOUND (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case.

## Documentation link — designed absence (recorded, never scored)

Checked 2026-11-16 with curl and a browser user-agent (the sandbox Python-urllib default UA is banned by our Cloudflare zones, error 1010): `GET https://atoms.pipavia.com/docs/long-form-authoring-pipeline` returned **404**, and `GET https://atoms.pipavia.com/api.json` listed **107 atoms** in total, of which **93** entries carry a `documentation` key — this atom's entry has **no `documentation` key**. This absence is designed: Batch 16's WS1 documentation pass follows this wave. It is recorded here only and was never scored against the atom.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `units`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
