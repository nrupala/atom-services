# Test report — code-review-service

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 56f92826f4284ec9a8570d683113aa86
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/code-review-service/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — changed_lines 300 (≤ 400), checklist covers all five stated items (`correctness`, `security`, `tests`, `readability`, `docs`), labeled 2/2, answered 2/2, non-trivial with 1 reviewer, 0 unresolved, behavior-changing with docs updated, all red lines false | HTTP 200, verdict `CODE_REVIEW_READY`, `computed_changed_lines` `300.000000`, `changed_lines_over_stated_aim` `-100.000000`, `checklist_items_not_covered` `[]`, `labeled_comment_difference` `0.000000`, `answered_comment_difference` `0.000000`, `computed_reviewer_count` `1.000000`, `computed_unresolved_comments` `0.000000`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `CODE_REVIEW_READY`, 29 pass / 0 fail / 0 missing, exactly those computed values | PASS |
| 2 | violations — full manifest with changed_lines 500 vs aim 400, `covered_items` only `[correctness]`, labeled 3 vs total 5, answered 2 vs total 5, non-trivial with reviewer_count 0, unresolved_comments 2, `force_push_over_review_without_telling` true, `self_merged_unreviewed` true | HTTP 200, verdict `CODE_REVIEW_NOT_READY`, the 8 named checks fail | HTTP 200, `CODE_REVIEW_NOT_READY`, 21 pass / 8 fail / 0 missing; failing checks exactly `pr_size_within_stated_aim`, `checklist_items_cover_stated_checklist`, `feedback_comments_all_labeled`, `authors_answer_every_comment`, `at_least_one_reviewer_for_nontrivial_change`, `no_unresolved_comments_before_approval`, `no_force_push_over_review_without_telling`, `no_self_merged_unreviewed_work`; `computed_changed_lines` `500.000000`, `changed_lines_over_stated_aim` `100.000000`, `checklist_items_not_covered` `[security, tests, readability, docs]`, `labeled_comment_difference` `-2.000000`, `answered_comment_difference` `-3.000000`, `computed_reviewer_count` `0.000000`, `computed_unresolved_comments` `2.000000`, `computed_status` `outside_stated_limits_on_declared_evidence` | PASS |
| 3 | sparse — only `entity` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 29 missing, computed fields null, `computed_status` null | PASS |
| 4 | malformed — `pr.changed_lines: "four-hundred"` (string where a number is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"pr.changed_lines","detail":"pr.changed_lines must be a number"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `code_review_service`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 29 checks and a text stamp):

```json
{"service": "code-review-service", "atom_version": "0.1.0", "entity": "PR-123", "verdict": "CODE_REVIEW_READY", "sections": {"pr_size_and_description": "pass", "review_checklist": "pass", "feedback_etiquette": "pass", "response_and_resolution": "pass", "approval_gates": "pass", "red_lines_and_merge_discipline": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "computed_changed_lines": "300.000000", "changed_lines_over_stated_aim": "-100.000000", "checklist_items_not_covered": [], "labeled_comment_difference": "0.000000", "answered_comment_difference": "0.000000", "computed_reviewer_count": "1.000000", "computed_unresolved_comments": "0.000000", "summary": "29 pass, 0 fail, 0 missing of 29 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"pr.changed_lines","detail":"pr.changed_lines must be a number"}
```

## Findings

No findings.

## Tester errors

4 tester errors, all corrected at design time before execution and not scored against the atom (the Gemini judge recorded 0 additional tester errors at judge stage):

1. Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`computed_changed_lines` `300.000000`, `changed_lines_over_stated_aim` `-100.000000`, `checklist_items_not_covered` `[]`, `labeled_comment_difference` `0.000000`, `answered_comment_difference` `0.000000`, `computed_reviewer_count` `1.000000`, `computed_unresolved_comments` `0.000000`, `computed_status` `within_stated_limits_on_declared_evidence`).
2. Violations designed `failing_checks` listed the six section names (`pr_size_and_description`, `review_checklist`, `feedback_etiquette`, `response_and_resolution`, `approval_gates`, `red_lines_and_merge_discipline`) instead of exact check names. Corrected before execution to the 8 exact check names above.
3. Violations input was sparse — most sections and fields absent, so their checks would have been `missing`, not failing (and the hotfix gate's second input was absent entirely). Corrected before execution: rebuilt as a full manifest carrying exactly the eight planted violations the designer intended (wrong changed-line count, incomplete checklist coverage, labeled/answered mismatches, zero reviewers on a non-trivial change, unresolved comments at approval, force-push red line, self-merged unreviewed work), with every other field passing.
4. Violations `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`computed_changed_lines` `500.000000`, `changed_lines_over_stated_aim` `100.000000`, `checklist_items_not_covered` `[security, tests, readability, docs]`, `labeled_comment_difference` `-2.000000`, `answered_comment_difference` `-3.000000`, `computed_reviewer_count` `0.000000`, `computed_unresolved_comments` `2.000000`, `computed_status` `outside_stated_limits_on_declared_evidence`).

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (changed lines minus the stated 400 aim, checklist coverage against the five stated items, labeled minus total, answered minus total, reviewer and unresolved counts, the gated reviewer/docs/hotfix checks, and `computed_status`, all with the SERVICE.md 6dp round-half-up rule) and verified the artifact's numbers and verdicts. Raw output: `verification/work/code-review-service/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `computed_changed_lines` (declared 300) | 300.000000 | 300.000000 | ✓ |
| full-pass `changed_lines_over_stated_aim` (300 − 400) | -100.000000 | -100.000000 | ✓ |
| full-pass `checklist_items_not_covered` | [] | [] | ✓ |
| full-pass `labeled_comment_difference` (2 − 2) | 0.000000 | 0.000000 | ✓ |
| full-pass `answered_comment_difference` (2 − 2) | 0.000000 | 0.000000 | ✓ |
| full-pass `computed_reviewer_count` | 1.000000 | 1.000000 | ✓ |
| full-pass `computed_unresolved_comments` | 0.000000 | 0.000000 | ✓ |
| violations `computed_changed_lines` (declared 500) | 500.000000 | 500.000000 | ✓ |
| violations `changed_lines_over_stated_aim` (500 − 400) | 100.000000 | 100.000000 | ✓ |
| violations `checklist_items_not_covered` | [security, tests, readability, docs] | same 4 | ✓ |
| violations `labeled_comment_difference` (3 − 5) | -2.000000 | -2.000000 | ✓ |
| violations `answered_comment_difference` (2 − 5) | -3.000000 | -3.000000 | ✓ |
| violations `computed_reviewer_count` | 0.000000 | 0.000000 | ✓ |
| violations `computed_unresolved_comments` | 2.000000 | 2.000000 | ✓ |
| verdicts | CODE_REVIEW_READY / CODE_REVIEW_NOT_READY (8 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 8-check failure set on the violations case. The coordinating tester's own headline recompute also matches: 300 − 400 = −100 → `changed_lines_over_stated_aim` `-100.000000`, identical to the artifact.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `pr.changed_lines`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
