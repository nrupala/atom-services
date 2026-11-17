# Test report — prd-with-testable-acceptance-criteria

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 9595ea665b634289aad158b7fff277ac
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/prd-with-testable-acceptance-criteria/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (product `Test Product`): problem declared with who/why-now and sentence count `3`, outcome defined as behaviour/metric, one story `S1` (role `User`, capability `Login`, benefit `Access`, priority `P0`), one criterion `AC1` traced to `S1` and declared testable and binary, out-of-scope items `["Legacy support"]`, all scope/priorities/decisions/open-question-tracking/approval declarations true, `open_questions` `[]`, all three red-line flags false | HTTP 200, verdict `PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY`, `problem_statement_sentence_count` `3`, `stories_count` `1`, `acceptance_criteria_count` `1`, `p0_story_count` `1`, `story_criteria_coverage` `"1.000000"`, `testable_criteria_coverage` `"1.000000"`, `binary_criteria_coverage` `"1.000000"`, `out_of_scope_items_count` `1`, `open_questions_count` `0`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY`, 38 pass / 0 fail / 0 missing, all six sections `pass`, exactly those computed values (all row-name lists `[]`, `misc_bucket_items` `[]`, `architecture_changing_open_questions_count` `0`, `blocking_open_questions_count` `0`) | PASS |
| 2 | violations — full manifest identical to full-pass except `problem.statement_sentence_count` `10`, `stories[0].priority` `P99`, `acceptance_criteria[0].testable_declared` false, `out_of_scope_items` `["misc"]`, and `red_lines.build_started_before_approved_spec_present` true | HTTP 200, verdict `PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY`, the 5 named checks fail | HTTP 200, `PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY`, 33 pass / 5 fail / 0 missing; failing checks exactly `problem_statement_within_five_sentences`, `every_prd_story_priority_is_p0_p1_or_p2`, `every_acceptance_criterion_declared_testable`, `no_misc_bucket_in_out_of_scope_items`, `no_build_before_approved_spec`; `problem_statement_sentence_count` `10`, `stories_count` `1`, `acceptance_criteria_count` `1`, `p0_story_count` `0`, `story_criteria_coverage` `"1.000000"`, `testable_criteria_coverage` `"0.000000"`, `binary_criteria_coverage` `"1.000000"`, `out_of_scope_items_count` `1`, `misc_bucket_items` `["misc"]`, `open_questions_count` `0`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `problem_and_outcome`, `stories_and_acceptance_criteria`, `scope_fences` and `red_lines` `fail`, `priorities_and_decisions` and `open_questions_and_approval` `pass` | PASS |
| 3 | sparse — only `product` (`Empty Product`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 38 missing, all six sections `insufficient_evidence`, `problem_statement_sentence_count` null, `stories_count` null, `acceptance_criteria_count` null, `p0_story_count` null, `stories_without_criteria` null, `criteria_without_declared_story` null, `duplicate_story_ids` null, `duplicate_criterion_ids` null, `story_criteria_coverage` null, `testable_criteria_coverage` null, `binary_criteria_coverage` null, `out_of_scope_items_count` null, `misc_bucket_items` null, `open_questions_count` null, `architecture_changing_open_questions_count` null, `blocking_open_questions_count` null, `computed_status` null | PASS |
| 4 | malformed — `problem: "This should be an object, not a string"` (string where an object is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"problem","detail":"problem must be an object"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `prd_with_testable_acceptance_criteria`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 38 checks and a text stamp):

```json
{"service": "prd-with-testable-acceptance-criteria", "atom_version": "0.1.0", "product": "Test Product", "verdict": "PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY", "sections": {"problem_and_outcome": "pass", "stories_and_acceptance_criteria": "pass", "scope_fences": "pass", "priorities_and_decisions": "pass", "open_questions_and_approval": "pass", "red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "problem_statement_sentence_count": 3, "stories_count": 1, "acceptance_criteria_count": 1, "p0_story_count": 1, "stories_without_criteria": [], "criteria_without_declared_story": [], "duplicate_story_ids": [], "duplicate_criterion_ids": [], "story_criteria_coverage": "1.000000", "testable_criteria_coverage": "1.000000", "binary_criteria_coverage": "1.000000", "out_of_scope_items_count": 1, "misc_bucket_items": [], "open_questions_count": 0, "architecture_changing_open_questions_count": 0, "blocking_open_questions_count": 0, "summary": "38 pass, 0 fail, 0 missing of 38 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"problem","detail":"problem must be an object"}
```

## Findings

No findings.

## Tester errors

8 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at the judgment stage). The mechanical pre-flight validator rejected the raw Gemini design with 8 rejections in total — by rule: R1 check-register ×5, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×0. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1) Violations designed `failing_checks` named `Problem statement within five sentences` instead of an exact check name — validator rejection: "failing_checks names 'Problem statement within five sentences', which is not in the atom's check register (38 checks)". Corrected before execution as part of rebuilding the violations case (see item 5).
2. (R1) Violations designed `failing_checks` named `Story priority is P0, P1 or P2` instead of an exact check name — validator rejection: "failing_checks names 'Story priority is P0, P1 or P2', which is not in the atom's check register (38 checks)". Corrected before execution as part of rebuilding the violations case (see item 5).
3. (R1) Violations designed `failing_checks` named `Every criterion declared testable` instead of an exact check name — validator rejection: "failing_checks names 'Every criterion declared testable', which is not in the atom's check register (38 checks)". Corrected before execution as part of rebuilding the violations case (see item 5).
4. (R1) Violations designed `failing_checks` named `No "misc" bucket in the out-of-scope items` instead of an exact check name — validator rejection: "failing_checks names 'No \"misc\" bucket in the out-of-scope items', which is not in the atom's check register (38 checks)". Corrected before execution as part of rebuilding the violations case (see item 5).
5. (R1) Violations designed `failing_checks` named the input field path `red_lines.build_started_before_approved_spec_present` instead of an exact check name — validator rejection: "failing_checks names 'red_lines.build_started_before_approved_spec_present', which is not in the atom's check register (38 checks)". Corrected before execution: the violations case was rebuilt as a full copy of the full-pass manifest carrying exactly the planted changes — `problem.statement_sentence_count` = 10, `stories[0].priority` = `"P99"`, `acceptance_criteria[0].testable_declared` = false, `out_of_scope_items` = `["misc"]`, `red_lines.build_started_before_approved_spec_present` = true — with `failing_checks` set to exactly the 5 exact check names those changes fail: `problem_statement_within_five_sentences`, `every_prd_story_priority_is_p0_p1_or_p2`, `every_acceptance_criterion_declared_testable`, `no_misc_bucket_in_out_of_scope_items`, `no_build_before_approved_spec`.
6. (R2) Full-pass `expect` carried no structured `computed_spot_checks` (the computed quantities appeared only in prose notes). Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `within_stated_limits_on_declared_evidence`, `problem_statement_sentence_count` `3`, `stories_count` `1`, `acceptance_criteria_count` `1`, `p0_story_count` `1`, `stories_without_criteria` `[]`, `criteria_without_declared_story` `[]`, `duplicate_story_ids` `[]`, `duplicate_criterion_ids` `[]`, `story_criteria_coverage` `"1.000000"`, `testable_criteria_coverage` `"1.000000"`, `binary_criteria_coverage` `"1.000000"`, `out_of_scope_items_count` `1`, `misc_bucket_items` `[]`, `open_questions_count` `0`, `architecture_changing_open_questions_count` `0`, `blocking_open_questions_count` `0`).
7. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: structured spot checks were injected in structured form, computed per SERVICE.md and confirmed against the Python oracle (`computed_status` `outside_stated_limits_on_declared_evidence`, `problem_statement_sentence_count` `10`, `stories_count` `1`, `acceptance_criteria_count` `1`, `p0_story_count` `0`, `stories_without_criteria` `[]`, `criteria_without_declared_story` `[]`, `duplicate_story_ids` `[]`, `duplicate_criterion_ids` `[]`, `story_criteria_coverage` `"1.000000"`, `testable_criteria_coverage` `"0.000000"`, `binary_criteria_coverage` `"1.000000"`, `out_of_scope_items_count` `1`, `misc_bucket_items` `["misc"]`, `open_questions_count` `0`, `architecture_changing_open_questions_count` `0`, `blocking_open_questions_count` `0`).
8. (R3) Violations input was missing 25 key paths present in the full-pass manifest — validator rejection: "violations input is missing key paths present in the full-pass manifest (a sparse violations input reads as missing evidence, not as failure): approval, approval.approved_spec_declared, decisions, decisions.decision_owner_named, decisions.key_decisions_logged_in_prd, open_question_tracking, open_question_tracking.architecture_changing_questions_block_build, open_question_tracking.non_architecture_questions_do_not_block_build, open_question_tracking.tracked_explicitly, open_questions, outcome, outcome.observable_change_defined, outcome.outcome_is_behavior_or_metric_not_feature_only, priorities, priorities.p0_items_shippable_alone_declared, priorities.priority_conflicts_resolved_with_decision_owner, priorities.priority_scheme_p0_p1_p2_applied, priorities.priority_tiers_applied_in_shipping_order, red_lines.scope_widened_mid_phase_without_prd_update_and_reapproval_present, red_lines.unlabeled_spike_treated_as_approved_spec_present, scope, scope.deferrals_not_silently_inside_scope, scope.deferrals_placed_in_later_list, scope.explicit_out_of_scope_list_declared, scope.explicit_scope_boundaries_declared". Corrected before execution by the same rebuild: the violations input is a deep copy of the full-pass manifest, so every key path is present and planted mutations change values only.

The full-pass input was verified genuinely valid against the Python oracle before execution (the oracle returns all 38 checks pass on it — no correction needed), the sparse case was set to an identity-only manifest (`{product}` only, as designed), and the malformed case as designed already carried exactly one documented type violation (`problem` as a string where an object is required) — no R4 correction was needed.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the fifteen primary computed checks, the declared counts, the row-name lists, the coverage ratios under SERVICE.md's fixed 6-decimal serialization rule `floor(v * 1000000 + 0.5) / 1000000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/prd-with-testable-acceptance-criteria/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `problem_statement_sentence_count` | 3 | 3 | ✓ |
| full-pass `stories_count` / `acceptance_criteria_count` | 1 / 1 | 1 / 1 | ✓ |
| full-pass `p0_story_count` | 1 | 1 | ✓ |
| full-pass `story_criteria_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `testable_criteria_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `binary_criteria_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| full-pass `stories_without_criteria` / `criteria_without_declared_story` / `duplicate_story_ids` / `duplicate_criterion_ids` / `misc_bucket_items` | [] / [] / [] / [] / [] | [] / [] / [] / [] / [] | ✓ |
| full-pass `out_of_scope_items_count` / `open_questions_count` | 1 / 0 | 1 / 0 | ✓ |
| full-pass `architecture_changing_open_questions_count` / `blocking_open_questions_count` | 0 / 0 | 0 / 0 | ✓ |
| full-pass `computed_status` (all fifteen computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `problem_statement_sentence_count` | 10 | 10 | ✓ |
| violations `stories_count` / `acceptance_criteria_count` / `p0_story_count` | 1 / 1 / 0 | 1 / 1 / 0 | ✓ |
| violations `story_criteria_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| violations `testable_criteria_coverage` (0 ÷ 1) | "0.000000" | "0.000000" | ✓ |
| violations `binary_criteria_coverage` (1 ÷ 1) | "1.000000" | "1.000000" | ✓ |
| violations `misc_bucket_items` (`misc` entry) | ["misc"] | ["misc"] | ✓ |
| violations `out_of_scope_items_count` / `open_questions_count` | 1 / 0 | 1 / 0 | ✓ |
| violations `computed_status` (a computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 5 planted checks | same 5 | ✓ |
| verdicts | PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_READY / PRD_WITH_TESTABLE_ACCEPTANCE_CRITERIA_NOT_READY (5 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 5-check failure set on the violations case.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `problem`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
