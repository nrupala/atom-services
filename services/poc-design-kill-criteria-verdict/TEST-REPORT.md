# Test report — poc-design-kill-criteria-verdict

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment c64bdc48fce84cd4817fe3a293be6ae5
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/poc-design-kill-criteria-verdict/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (poc `Test POC`): all four design-premise declarations true, `evaluates_vendor_or_tool` true, criteria `C1` (success) and `C2` (kill) both with condition stated and declared before the run, `C1` assessing house-stack fit, timebox `2023-01-01` to `2023-01-10`, one scope item `S1` on the critical path, all three red-line flags false | HTTP 200, verdict `POC_DESIGN_SOUND`, `criteria_count` `2`, `success_criteria_count` `1`, `kill_criteria_count` `1`, `timebox_duration_days` `9`, `scope_items_count` `1`, `condition_stated_coverage` `"1.000000"`, `declared_before_run_coverage` `"1.000000"`, `critical_path_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `POC_DESIGN_SOUND`, 22 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values (all row-name lists `[]`) | PASS |
| 2 | violations — full manifest identical to full-pass except `criteria[0].condition_stated` false, `criteria[1].kind` `other` and `criteria[1].name` duplicated as `C1`, `timebox.end_date` `2023-01-01` (equal to the start date), `scope_items[0].on_critical_path` false, and `red_lines.poc_code_planned_for_direct_production_use_present` true | HTTP 200, verdict `POC_DESIGN_NOT_SOUND`, the 7 named checks fail | HTTP 200, `POC_DESIGN_NOT_SOUND`, 15 pass / 7 fail / 0 missing; failing checks exactly `at_least_one_kill_criterion_declared`, `every_criterion_condition_stated`, `every_criterion_kind_is_success_or_kill`, `every_scope_item_on_critical_path`, `no_criterion_name_duplicated`, `no_poc_code_planned_for_direct_production_use`, `timebox_end_after_start`; `criteria_count` `2`, `success_criteria_count` `1`, `kill_criteria_count` `0`, `criteria_without_condition` `["C1"]`, `condition_stated_coverage` `"0.500000"`, `criteria_not_declared_before_run` `[]`, `declared_before_run_coverage` `"1.000000"`, `criteria_with_invalid_kind` `["C1"]`, `duplicate_criterion_names` `["C1"]`, `timebox_start_date` `"2023-01-01"`, `timebox_end_date` `"2023-01-01"`, `timebox_duration_days` `0`, `scope_items_count` `1`, `scope_items_off_critical_path` `["S1"]`, `critical_path_coverage` `"0.000000"`, `duplicate_scope_item_names` `[]`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `criteria_row_consistency`, `timebox_window`, `scope_row_consistency` and `production_boundary_by_design` `fail`, `design_premise` `pass` | PASS |
| 3 | sparse — only `poc` (`Sparse POC`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 22 missing, all five sections `insufficient_evidence`, `criteria_count` null, `success_criteria_count` null, `kill_criteria_count` null, `criteria_without_condition` null, `condition_stated_coverage` null, `criteria_not_declared_before_run` null, `declared_before_run_coverage` null, `criteria_with_invalid_kind` null, `duplicate_criterion_names` null, `timebox_start_date` null, `timebox_end_date` null, `timebox_duration_days` null, `scope_items_count` null, `scope_items_off_critical_path` null, `critical_path_coverage` null, `duplicate_scope_item_names` null, `computed_status` null | PASS |
| 4 | malformed — `design: "not-an-object"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"design","detail":"design must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `poc_design_kill_criteria_verdict`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 22 checks and a text stamp):

```json
{"service": "poc-design-kill-criteria-verdict", "atom_version": "0.1.0", "poc": "Test POC", "verdict": "POC_DESIGN_SOUND", "sections": {"design_premise": "pass", "criteria_row_consistency": "pass", "timebox_window": "pass", "scope_row_consistency": "pass", "production_boundary_by_design": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "criteria_count": 2, "success_criteria_count": 1, "kill_criteria_count": 1, "criteria_without_condition": [], "condition_stated_coverage": "1.000000", "criteria_not_declared_before_run": [], "declared_before_run_coverage": "1.000000", "criteria_with_invalid_kind": [], "duplicate_criterion_names": [], "timebox_start_date": "2023-01-01", "timebox_end_date": "2023-01-10", "timebox_duration_days": 9, "scope_items_count": 1, "scope_items_off_critical_path": [], "critical_path_coverage": "1.000000", "duplicate_scope_item_names": [], "summary": "22 pass, 0 fail, 0 missing of 22 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"design","detail":"design must be an object"}
```

## Findings

No findings.

## Tester errors

8 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 8 rejections in total — by rule: R1 check-register ×4, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×1. The corrected, executed battery passed the validator (`final_ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named the section name `criteria_row_consistency` instead of an exact check name — validator rejection: "failing_checks names 'criteria_row_consistency', which is not in the atom's check register (22 checks)". Corrected before execution as part of rebuilding the violations case (see below).
2. (R1) Violations designed `failing_checks` named the section name `timebox_window` instead of an exact check name — validator rejection: "failing_checks names 'timebox_window', which is not in the atom's check register (22 checks)". Corrected before execution as part of rebuilding the violations case (see below).
3. (R1) Violations designed `failing_checks` named the section name `scope_row_consistency` instead of an exact check name — validator rejection: "failing_checks names 'scope_row_consistency', which is not in the atom's check register (22 checks)". Corrected before execution as part of rebuilding the violations case (see below).
4. (R1) Violations designed `failing_checks` named the section name `production_boundary_by_design` instead of an exact check name — validator rejection: "failing_checks names 'production_boundary_by_design', which is not in the atom's check register (22 checks)". Corrected before execution: the violations case was rebuilt as a full copy of the full-pass manifest carrying exactly the planted changes — `criteria[0].condition_stated` = false, `criteria[1].kind` = `"other"`, `criteria[1].name` = `"C1"`, `timebox.end_date` = `"2023-01-01"`, `scope_items[0].on_critical_path` = false, `red_lines.poc_code_planned_for_direct_production_use_present` = true — with `failing_checks` set to exactly the 7 exact check names those changes fail: `at_least_one_kill_criterion_declared`, `every_criterion_condition_stated`, `every_criterion_kind_is_success_or_kill`, `every_scope_item_on_critical_path`, `no_criterion_name_duplicated`, `no_poc_code_planned_for_direct_production_use`, `timebox_end_after_start`.
5. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes). Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `within_stated_limits_on_declared_evidence`, `criteria_count` `2`, `success_criteria_count` `1`, `kill_criteria_count` `1`, `criteria_without_condition` `[]`, `condition_stated_coverage` `"1.000000"`, `criteria_not_declared_before_run` `[]`, `declared_before_run_coverage` `"1.000000"`, `criteria_with_invalid_kind` `[]`, `duplicate_criterion_names` `[]`, `timebox_start_date` `"2023-01-01"`, `timebox_end_date` `"2023-01-10"`, `timebox_duration_days` `9`, `scope_items_count` `1`, `scope_items_off_critical_path` `[]`, `critical_path_coverage` `"1.000000"`, `duplicate_scope_item_names` `[]`).
6. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `outside_stated_limits_on_declared_evidence`, `criteria_count` `2`, `success_criteria_count` `1`, `kill_criteria_count` `0`, `criteria_without_condition` `["C1"]`, `condition_stated_coverage` `"0.500000"`, `criteria_not_declared_before_run` `[]`, `declared_before_run_coverage` `"1.000000"`, `criteria_with_invalid_kind` `["C1"]`, `duplicate_criterion_names` `["C1"]`, `timebox_start_date` `"2023-01-01"`, `timebox_end_date` `"2023-01-01"`, `timebox_duration_days` `0`, `scope_items_count` `1`, `scope_items_off_critical_path` `["S1"]`, `critical_path_coverage` `"0.000000"`, `duplicate_scope_item_names` `[]`).
7. (R3) Violations input was missing the key path `criteria[].assesses_house_stack_fit` present in the full-pass manifest — validator rejection: "violations input is missing key paths present in the full-pass manifest (a sparse violations input reads as missing evidence, not as failure): criteria[].assesses_house_stack_fit". Corrected before execution by the same rebuild: the violations input is a deep copy of the full-pass manifest, so every key path is present and planted mutations change values only.
8. (R4) Malformed input carried 2 type violations — validator rejection: "malformed input carries 2 type violations (design must be a object, criteria must be a list); exactly one is required so the 422 field is unambiguous". Corrected before execution: the extra violation (`criteria` as a string) was removed, keeping exactly one documented type violation (`design` as a string where an object is required).

The full-pass input was verified genuinely valid against the Python oracle before execution (the oracle returns all 22 checks pass on it — no correction needed), and the sparse case was set to an identity-only manifest (`{poc}` only, as designed).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the thirteen primary computed checks, the declared counts, the row-name lists, the timebox duration, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/poc-design-kill-criteria-verdict/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `criteria_count` | 2 | 2 | ✓ |
| full-pass `success_criteria_count` | 1 | 1 | ✓ |
| full-pass `kill_criteria_count` | 1 | 1 | ✓ |
| full-pass `condition_stated_coverage` (2 ÷ 2) | "1.000000" | "1.000000" | ✓ |
| full-pass `declared_before_run_coverage` (2 ÷ 2) | "1.000000" | "1.000000" | ✓ |
| full-pass `critical_path_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `criteria_without_condition` / `criteria_not_declared_before_run` / `criteria_with_invalid_kind` / `duplicate_criterion_names` / `scope_items_off_critical_path` / `duplicate_scope_item_names` | [] / [] / [] / [] / [] / [] | [] / [] / [] / [] / [] / [] | ✓ |
| full-pass `timebox_start_date` / `timebox_end_date` / `timebox_duration_days` (Jan 10 − Jan 1) | "2023-01-01" / "2023-01-10" / 9 | "2023-01-01" / "2023-01-10" / 9 | ✓ |
| full-pass `scope_items_count` | 1 | 1 | ✓ |
| full-pass `computed_status` (all thirteen computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `criteria_count` / `success_criteria_count` / `kill_criteria_count` | 2 / 1 / 0 | 2 / 1 / 0 | ✓ |
| violations `criteria_without_condition` (`C1` condition false) | ["C1"] | ["C1"] | ✓ |
| violations `condition_stated_coverage` (1 ÷ 2) | "0.500000" | "0.500000" | ✓ |
| violations `declared_before_run_coverage` (2 ÷ 2) | "1.000000" | "1.000000" | ✓ |
| violations `criteria_with_invalid_kind` (kind `other`) | ["C1"] | ["C1"] | ✓ |
| violations `duplicate_criterion_names` | ["C1"] | ["C1"] | ✓ |
| violations `timebox_start_date` / `timebox_end_date` / `timebox_duration_days` (Jan 1 − Jan 1) | "2023-01-01" / "2023-01-01" / 0 | "2023-01-01" / "2023-01-01" / 0 | ✓ |
| violations `scope_items_count` / `scope_items_off_critical_path` | 1 / ["S1"] | 1 / ["S1"] | ✓ |
| violations `critical_path_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 7 planted checks | same 7 | ✓ |
| verdicts | POC_DESIGN_SOUND / POC_DESIGN_NOT_SOUND (7 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 7-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `design`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
