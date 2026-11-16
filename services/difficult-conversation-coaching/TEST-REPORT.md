# Test report — difficult-conversation-coaching

**Tester:** Gemini (gemini-3.1-flash-lite) via the house custom.gemini connector — independent external tester
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-15
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment 7bad54c4e4a145e493e8766eb2f3bafb
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/difficult-conversation-coaching/evidence.json

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (conversation_title `Vendor Payment Dispute`): all preparation/empathy/framing/structure/safeguards declarations true, the must-be-false flags false, `preparation_domains` the four stated domains in order, one SBI-complete feedback point not targeting identity, `feedback_to_be_given` true, `thread_has_soured` false | HTTP 200, verdict `CONVERSATION_PREPARATION_COMPLETE`, `preparation_domains_count` `4`, `preparation_domains_missing` `[]`, `preparation_domain_coverage` `"1.0000"`, `feedback_points_count` `1`, `sbi_coverage` `"1.0000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `CONVERSATION_PREPARATION_COMPLETE`, 31 pass / 0 fail / 0 missing, all five sections `pass`, exactly those computed values | PASS |
| 2 | violations — full manifest with `preparation_domains` truncated to `[self_awareness, self_management]`, `self_management.venting_in_writing_present` true, `self_management.emotion_suppressed_instead_of_regulated_present` true, a feedback point with `targets_identity` true, `safeguards.target_on_do_not_respond_list` true | HTTP 200, verdict `CONVERSATION_PREPARATION_INCOMPLETE`, the 5 named checks fail | HTTP 200, `CONVERSATION_PREPARATION_INCOMPLETE`, 26 pass / 5 fail / 0 missing; failing checks exactly `preparation_domains_cover_all_four_in_stated_order`, `no_venting_in_writing`, `emotion_regulated_not_suppressed`, `no_feedback_point_targets_identity`, `target_not_on_do_not_respond_list`; `preparation_domains_count` `2`, `preparation_domains_missing` `["social_awareness", "relationship_management"]`, `preparation_domain_coverage` `"0.5000"`, `feedback_points_count` `1`, `feedback_points_without_complete_sbi` `[]`, `feedback_points_targeting_identity` `["Point 1"]`, `sbi_coverage` `"1.0000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `preparation_and_self_regulation`, `structure_feedback_and_next_step` and `safeguards_repair_and_close` `fail`, the other two `pass` | PASS |
| 3 | sparse — only `conversation_title` | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 31 missing, all five sections `insufficient_evidence`, `preparation_domains_count` null, `preparation_domains_missing` null, `preparation_domain_coverage` null, `feedback_points_count` null, `feedback_points_without_complete_sbi` null, `feedback_points_targeting_identity` null, `sbi_coverage` null, `computed_status` null | PASS |
| 4 | malformed — `self_awareness.emotion_named: "should-be-boolean"` (string where a boolean is required) | HTTP 422, body error `invalid_input`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"self_awareness.emotion_named","detail":"self_awareness.emotion_named must be a boolean"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `difficult_conversation_coaching`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 31 checks and a text stamp):

```json
{"service": "difficult-conversation-coaching", "atom_version": "0.1.0", "conversation_title": "Vendor Payment Dispute", "verdict": "CONVERSATION_PREPARATION_COMPLETE", "sections": {"preparation_and_self_regulation": "pass", "empathy_and_social_awareness": "pass", "framing_and_assertiveness": "pass", "structure_feedback_and_next_step": "pass", "safeguards_repair_and_close": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "preparation_domains_count": 4, "preparation_domains_missing": [], "preparation_domain_coverage": "1.0000", "feedback_points_count": 1, "feedback_points_without_complete_sbi": [], "feedback_points_targeting_identity": [], "sbi_coverage": "1.0000", "summary": "31 pass, 0 fail, 0 missing of 31 checks across five sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"self_awareness.emotion_named","detail":"self_awareness.emotion_named must be a boolean"}
```

## Findings

No findings.

## Tester errors

6 tester-error correction items, all corrected at design time before execution and not scored against the atom. The mechanical pre-flight validator rejected the raw Gemini design with **9 rejections by rule: R1 check-register ×5, R2 structured-spot-checks ×2, R3 violations-full-manifest ×1, R4 malformed-exactly-one ×1** (raw validation record: `verification/work/difficult-conversation-coaching/validation-raw.json`). One further error (item 6) was found in the coordinating tester's own contract review and was not caught by the validator. The Gemini judge recorded 0 additional tester errors at the judgment stage. **The executed battery passed the validator (`ok: true`) before execution.**

1. (R1) Violations `expect.failing_checks` named a section-style description (`All four domains, in the stated order`), two input field paths (`self_management.venting_in_writing_present`, `self_management.emotion_suppressed_instead_of_regulated_present`), a gated-check description (`No feedback point targets identity (gated)`) and a field path (`safeguards.target_on_do_not_respond_list`) instead of exact check names — 5 validator rejections. Corrected before execution to the 5 exact check names the planted values fail: `preparation_domains_cover_all_four_in_stated_order`, `no_venting_in_writing`, `emotion_regulated_not_suppressed`, `no_feedback_point_targets_identity`, `target_not_on_do_not_respond_list`.
2. (R2) Full-pass `expect` carried the computed quantities only in prose notes, with no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`computed_status` `within_stated_limits_on_declared_evidence`, `preparation_domains_count` `4`, `preparation_domains_missing` `[]`, `preparation_domain_coverage` `"1.0000"`, `feedback_points_count` `1`, `feedback_points_without_complete_sbi` `[]`, `feedback_points_targeting_identity` `[]`, `sbi_coverage` `"1.0000"`).
3. (R2) Violations `expect` carried no structured `computed_spot_checks`. Corrected before execution: added the structured spot-check block (`computed_status` `outside_stated_limits_on_declared_evidence`, `preparation_domains_count` `2`, `preparation_domains_missing` `["social_awareness", "relationship_management"]`, `preparation_domain_coverage` `"0.5000"`, `feedback_points_count` `1`, `feedback_points_without_complete_sbi` `[]`, `feedback_points_targeting_identity` `["Point 1"]`, `sbi_coverage` `"1.0000"`).
4. (R3) Violations input was sparse instead of a full manifest — it omitted the empathy, framing, rehearsal, structure, self-awareness and most other sections present in the full-pass manifest, so it would have read as missing evidence, not as failure. Corrected before execution: expanded it to a full manifest identical in structure to the full-pass manifest, carrying exactly the five planted violations and nothing else.
5. (R4) Malformed designed with TWO type violations (`preparation_domains` as a string instead of a list, plus `self_awareness.emotion_named` as a string instead of a boolean). Corrected before execution: reduced to exactly one type violation of a documented typed field — `self_awareness.emotion_named` as a string where a boolean is required, with `preparation_domains` restored to a valid list.
6. Full-pass input was itself incomplete (found in the coordinating tester's own review, not by the validator): its `repair` section declared only `thread_has_soured`, omitting `relationship_and_outcome_protected_over_point_scoring_declared` and `winning_argument_losing_relationship_present` (and `repair_move_planned`), so as designed it would have returned `INSUFFICIENT_EVIDENCE`, not the expected complete verdict. Corrected before execution: completed the `repair` section (`thread_has_soured` false, `repair_move_planned` false, `relationship_and_outcome_protected_over_point_scoring_declared` true, `winning_argument_losing_relationship_present` false); the violations manifest was built from the corrected full-pass structure so the R3 path comparison stays exact.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs by hand (the four-domain coverage and missing-domains in canonical order, the SBI completeness and identity-targeting row lists, both coverage ratios under SERVICE.md's fixed 4-decimal serialization rule `floor(v * 10000 + 0.5) / 10000`, and the derived `computed_status`) and verified the artifacts' values, failing-check sets and verdicts. Raw output: `verification/work/difficult-conversation-coaching/deepseek-raw.txt`.

**DeepSeek verdict: AGREEMENT: full** — every recomputed quantity matches the artifact; no mismatches.

| Quantity | DeepSeek hand-computed | Artifact | Match |
|---|---|---|---|
| full-pass `preparation_domains_count` | 4 | 4 | ✓ |
| full-pass `preparation_domains_missing` | [] | [] | ✓ |
| full-pass `preparation_domain_coverage` (4 ÷ 4) | "1.0000" | "1.0000" | ✓ |
| full-pass `feedback_points_count` | 1 | 1 | ✓ |
| full-pass `feedback_points_without_complete_sbi` | [] | [] | ✓ |
| full-pass `feedback_points_targeting_identity` | [] | [] | ✓ |
| full-pass `sbi_coverage` (1 ÷ 1) | "1.0000" | "1.0000" | ✓ |
| full-pass `computed_status` (all five primary computed checks pass) | within_stated_limits_on_declared_evidence | within_stated_limits_on_declared_evidence | ✓ |
| violations `preparation_domains_count` | 2 | 2 | ✓ |
| violations `preparation_domains_missing` | ["social_awareness", "relationship_management"] | ["social_awareness", "relationship_management"] | ✓ |
| violations `preparation_domain_coverage` (2 ÷ 4) | "0.5000" | "0.5000" | ✓ |
| violations `feedback_points_count` | 1 | 1 | ✓ |
| violations `feedback_points_without_complete_sbi` | [] | [] | ✓ |
| violations `feedback_points_targeting_identity` | ["Point 1"] | ["Point 1"] | ✓ |
| violations `sbi_coverage` (1 ÷ 1) | "1.0000" | "1.0000" | ✓ |
| violations `computed_status` (a primary computed check fails) | outside_stated_limits_on_declared_evidence | outside_stated_limits_on_declared_evidence | ✓ |
| violations failing-check set | exactly the 5 planted checks | same 5 | ✓ |
| verdicts | CONVERSATION_PREPARATION_COMPLETE / CONVERSATION_PREPARATION_INCOMPLETE (5 fails) / INSUFFICIENT_EVIDENCE / 422 | same | ✓ |

**Agreement / disagreement:** full agreement — Gemini, the mechanical checks and DeepSeek all pass the atom, including the exact 5-check failure set on the violations case. The coordinating tester's own headline recompute also matches: the declared domains list of four in stated order gives coverage `"1.0000"` and no missing domains, the truncated two-domain list gives `"0.5000"` with `["social_awareness", "relationship_management"]` missing in canonical order, and both cases' single SBI-complete feedback point gives `sbi_coverage` `"1.0000"` (identity targeting reported separately as `["Point 1"]` on violations), identical to the artifacts. Where Gemini's judgment and the raw evidence could differ, the evidence was checked directly: Gemini's judgment (PASS, 0 findings) does not contradict the raw evidence on any point.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (malformed 422 `invalid_input` on field `self_awareness.emotion_named`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms every computed quantity (AGREEMENT: full).
