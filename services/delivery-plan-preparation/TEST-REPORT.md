# Test report — delivery-plan-preparation

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 7bad54c4e4a145e493e8766eb2f3bafb
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/delivery-plan-preparation/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (plan `Project Alpha`): all framing/execution/status declarations true, the three must-be-false flags false, one phase `Phase1` (owner `Alice`, size `S`, 2023-01-01 to 2023-01-10, `depends_on` `[]`), one milestone, one risk, one decision | HTTP 200, verdict `DELIVERY_PLAN_READY`, counts 1/1/1/1, `total_duration_days` `9`, `owner_coverage` `1.0000`, `milestone_phase_coverage` `1.0000`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `DELIVERY_PLAN_READY`, 38 pass / 0 fail / 0 missing, all four sections `pass`, exactly those computed values (`dependency_coverage` null — no dependency declared) | PASS |
| 2 | violations — full manifest identical to full-pass except `phases[0].owner` `""`, `phases[0].exit_criteria_declared` false, `phases[0].size` `XL`, `risks[0].mitigation_declared` false | HTTP 200, verdict `DELIVERY_PLAN_NOT_READY`, the 4 named checks fail | HTTP 200, `DELIVERY_PLAN_NOT_READY`, 34 pass / 4 fail / 0 missing; failing checks exactly `every_phase_has_owner_named`, `every_phase_has_exit_criteria`, `every_phase_has_skill_size`, `every_risk_has_mitigation`; `owner_coverage` `0.0000`, `phases_without_owner` `["Phase1"]`, `risks_without_mitigation` `["Risk1"]`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `phases_milestones_and_dependencies` and `risks_estimates_and_decisions` `fail`, the other two `pass` | PASS |
| 3 | sparse — only `plan` (`Minimal Plan`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 38 missing, all four sections `insufficient_evidence`, all counts and computed quantities null, `computed_status` null | PASS |
| 4 | malformed — `phases: "not-a-list"` (string where a list is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"phases","detail":"phases must be a list"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `delivery_plan_preparation`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 38 checks and a text stamp):

```json
{"service": "delivery-plan-preparation", "atom_version": "0.1.0", "plan": "Project Alpha", "verdict": "DELIVERY_PLAN_READY", "sections": {"framing_and_approval": "pass", "phases_milestones_and_dependencies": "pass", "risks_estimates_and_decisions": "pass", "execution_discipline_and_status": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "phases_count": 1, "milestones_count": 1, "risks_count": 1, "decisions_count": 1, "total_duration_days": 9, "owner_coverage": "1.0000", "dependency_coverage": null, "milestone_phase_coverage": "1.0000", "summary": "38 pass, 0 fail, 0 missing of 38 checks across four sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"phases","detail":"phases must be a list"}
```

## Findings

No findings.

## Tester errors

The mechanical pre-flight validator rejected the raw Gemini design with **8 rejections, by rule: R1 check-register ×4, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×1**. All corrections below were made at design time before execution and are not scored against the atom; the executed battery passed the validator (`ok: true`). The Gemini judge recorded 0 additional tester errors at the judgment stage.

1. (R1) Violations `expect.failing_checks` named prose section-style labels (`Owner per phase`, `Exit criteria per phase`, `Size per phase`, `Phase dates valid and in order`) instead of exact check names from the atom's 38-check register. Corrected before execution to exact register names (see item 6 for the final fourth name): `every_phase_has_owner_named`, `every_phase_has_exit_criteria`, `every_phase_has_skill_size`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`phases_count` `1`, `milestones_count` `1`, `risks_count` `1`, `decisions_count` `1`, `total_duration_days` `9`, `owner_coverage` `1.0000`, `milestone_phase_coverage` `1.0000`, `computed_status` `within_stated_limits_on_declared_evidence`).
3. (R2) Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`phases_count` `1`, `milestones_count` `1`, `risks_count` `1`, `decisions_count` `1`, `total_duration_days` `9`, `owner_coverage` `0.0000`, `milestone_phase_coverage` `1.0000`, `phases_without_owner` `["Phase1"]`, `risks_without_mitigation` `["Risk1"]`, `computed_status` `outside_stated_limits_on_declared_evidence`).
4. (R3) Violations input was sparse — only a single `phases` row, missing every other key path present in the full-pass manifest (the validator listed, among others, `framing` and all its fields, `milestones`, `risks`, `decisions`, `decision_log`, `estimation`, `execution`, `risk_management`, `status`, `plan` and `phases[].depends_on`) — so it would have read as missing evidence, not as failure. Corrected before execution: rebuilt it as a full manifest identical to the full-pass manifest except exactly the planted violations.
5. (R4) Malformed designed with TWO type violations (`framing` as a number instead of an object, plus `phases` as a string instead of a list). Corrected before execution: reduced to exactly one type violation of a documented typed field — `phases` as a string where a list is required.
6. (Planted-value cascade, found in the tester's own contract review, not flagged by the validator) The raw violations case planted reversed phase dates (`start_date` `2023-01-10`, `end_date` `2023-01-01`). Verified against the contract logic before execution that this cascades: it would also fail `every_dependency_precedes_dependent` (which requires no date problems) and `every_milestone_due_within_phase_dates` (no due date can fall inside a reversed interval) — 6 failing checks, not the named 4. Corrected before execution: restored the valid full-pass dates and planted instead an isolated fourth violation, `risks[0].mitigation_declared` false, failing exactly `every_risk_has_mitigation`.

The full-pass input was verified genuinely valid per SERVICE.md before execution (every required field present, correct types and nesting — no correction needed), and the sparse input and its `INSUFFICIENT_EVIDENCE` expectation needed no correction.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the counts, the row-name lists, `total_duration_days` as the exact day count from the earliest phase start to the latest phase end, the three coverage ratios under SERVICE.md's fixed round-half-up 4dp string serialization, and the derived `computed_status` from the six primary computed checks) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/delivery-plan-preparation/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass counts (`phases_count` / `milestones_count` / `risks_count` / `decisions_count`) | 1 / 1 / 1 / 1 | 1 / 1 / 1 / 1 | ✓ |
| full-pass `total_duration_days` (2023-01-10 − 2023-01-01) | 9 | 9 | ✓ |
| full-pass `owner_coverage` (1/1) / `milestone_phase_coverage` (1/1) / `dependency_coverage` (no dependencies declared) | `1.0000` / `1.0000` / null | `1.0000` / `1.0000` / null | ✓ |
| full-pass `computed_status` (all six primary computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations counts / `total_duration_days` | 1 / 1 / 1 / 1, 9 | 1 / 1 / 1 / 1, 9 | ✓ |
| violations `owner_coverage` (0/1) / `milestone_phase_coverage` (1/1) / `dependency_coverage` | `0.0000` / `1.0000` / null | `0.0000` / `1.0000` / null | ✓ |
| violations `phases_without_owner` / `risks_without_mitigation` | `["Phase1"]` / `["Risk1"]` | `["Phase1"]` / `["Risk1"]` | ✓ |
| violations `computed_status` (a primary computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 4 planted checks | same 4 | ✓ |
| verdicts | DELIVERY_PLAN_READY / DELIVERY_PLAN_NOT_READY (4 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 4-check failure set on the violations case. The coordinating tester's own mechanical re-verification of the raw evidence also matches on every point above; where any judgment had differed from the raw evidence, the evidence would have won — no such contradiction occurred.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `phases`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
