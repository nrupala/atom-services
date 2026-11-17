# Test report — meeting-decisions-and-actions-extract

**Tester:** external-verification@aimlds.org
**Second tester:** DeepSeek (independent recomputation — see its section below)
**Date:** 2026-11-16
**Gateway:** atoms-gateway v1.1.0 at https://atoms.pipavia.com, deployment a15298eb9b7f40bf80d306cea4a33f80
**Tester key:** `atm_1_ac543f43d09d66…` (last-4 `b1a2`), non-internal, external metering
**Evidence:** verification/work/meeting-decisions-and-actions-extract/evidence.json
**Validation:** verification/work/meeting-decisions-and-actions-extract/validation.json — `ok: true`, 0 rejections

## Cases

| # | Case | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | full-pass — complete manifest (meeting `Project Alpha Sync`): all source/decisions-record/actions-record/open-questions-record/recap/handoff declarations in passing polarity, all five red-line flags false, one decision row `Launch Q3` with anchor `p1` and faithful, one action row `Send email` owned by `Alice` due `2023-12-01` with anchor `p2`, one open-question row `Budget approval` with anchor `p3` | HTTP 200, verdict `MEETING_EXTRACTION_SOUND`, `decisions_count` `1`, `actions_count` `1`, `open_questions_count` `1`, `decision_anchor_coverage` `"1.000000"`, `decision_faithful_coverage` `"1.000000"`, `action_owner_coverage` `"1.000000"`, `action_due_date_coverage` `"1.000000"`, `action_anchor_coverage` `"1.000000"`, `open_question_anchor_coverage` `"1.000000"`, `computed_status` `within_stated_limits_on_declared_evidence` | HTTP 200, `MEETING_EXTRACTION_SOUND`, 35 pass / 0 fail / 0 missing, all six sections `pass`, exactly those computed values (all row-name lists `[]`; `inferred_marking_coverage` null — no inferred decisions) | PASS |
| 2 | violations — full manifest identical to full-pass except planted violations on `decisions[0]` (`source_anchor` `""`, `faithful_to_source` false) and `actions[0]` (`owner` `""`, `due_date` `""`) | HTTP 200, verdict `MEETING_EXTRACTION_NOT_SOUND`, failing checks exactly `every_decision_has_source_anchor`, `every_decision_faithful_to_source`, `every_action_has_named_owner`, `every_action_has_due_date` | HTTP 200, `MEETING_EXTRACTION_NOT_SOUND`, 31 pass / 4 fail / 0 missing; failing checks exactly `every_action_has_due_date`, `every_action_has_named_owner`, `every_decision_faithful_to_source`, `every_decision_has_source_anchor`; `decisions_without_source_anchor` `["Launch Q3"]`, `decision_anchor_coverage` `"0.000000"`, `decisions_not_faithful` `["Launch Q3"]`, `decision_faithful_coverage` `"0.000000"`, `actions_without_owner` `["Send email"]`, `action_owner_coverage` `"0.000000"`, `actions_without_due_date` `["Send email"]`, `action_due_date_coverage` `"0.000000"`, `action_anchor_coverage` `"1.000000"`, `open_question_anchor_coverage` `"1.000000"`, `computed_status` `outside_stated_limits_on_declared_evidence`; sections `decisions_fidelity` and `action_ownership_and_dates` `fail`, the other four `pass` | PASS |
| 3 | sparse — only `meeting` (`sync-2026-11-10`) | HTTP 200, verdict `INSUFFICIENT_EVIDENCE` | HTTP 200, `INSUFFICIENT_EVIDENCE`, 0 pass / 0 fail / 35 missing, all six sections `insufficient_evidence`, all computed counts, row-name lists, coverages and `computed_status` null | PASS |
| 4 | malformed — `meeting` as integer `12345` where a string is documented (exactly one type violation; `source` set to a type-correct `{}`) | HTTP 422, body error `invalid_input` naming field `meeting`, never a verdict | HTTP 422, `{"ok":false,"error":"invalid_input","field":"meeting","detail":"meeting must be a string"}` | PASS |
| 5 | determinism — full-pass manifest submitted twice (REST) | byte-identical responses | byte-identical: **true** | PASS |
| 6 | face parity — full-pass manifest via MCP `tools/call` vs REST | identical report core | `structuredContent` deep-equal to the REST artifact: **true** (tool name `meeting_decisions_and_actions_extract`) | PASS |

## Raw outputs (excerpts)

Full-pass response (REST, HTTP 200; checks array trimmed — the full response carries all 35 checks and a text stamp):

```json
{"service": "meeting-decisions-and-actions-extract", "atom_version": "0.1.0", "meeting": "Project Alpha Sync", "verdict": "MEETING_EXTRACTION_SOUND", "sections": {"source_and_meeting_identity": "pass", "decisions_fidelity": "pass", "action_ownership_and_dates": "pass", "open_questions_and_carry_forward": "pass", "recap_draft_and_handoff": "pass", "red_lines": "pass"}, "computed_status": "within_stated_limits_on_declared_evidence", "decisions_count": 1, "decisions_without_source_anchor": [], "decision_anchor_coverage": "1.000000", "decisions_not_faithful": [], "decision_faithful_coverage": "1.000000", "inferred_decisions_unmarked": [], "inferred_marking_coverage": null, "actions_count": 1, "actions_without_owner": [], "action_owner_coverage": "1.000000", "actions_without_due_date": [], "action_due_date_coverage": "1.000000", "actions_without_source_anchor": [], "action_anchor_coverage": "1.000000", "open_questions_count": 1, "open_questions_without_source_anchor": [], "open_question_anchor_coverage": "1.000000", "summary": "35 pass, 0 fail, 0 missing of 35 checks across six sections."}
```

Malformed response (REST, HTTP 422):

```json
{"ok":false,"error":"invalid_input","field":"meeting","detail":"meeting must be a string"}
```

## Judge

Gemini judge (`verification/gemini_judge.py --atom meeting-decisions-and-actions-extract`):

```json
{"atom": "meeting-decisions-and-actions-extract", "verdict": "PASS", "findings": 0, "tester_errors": 0}
```

Judge verdict: **PASS**, 0 findings, 0 tester errors at the judgment stage.

## Tester errors

6 tester errors in the raw Gemini design, all caught by the mechanical pre-flight validator and corrected at design time before execution — not scored against the atom. Zero executed-case tester errors. The corrected, executed battery passed the validator (`ok: true`) before execution.

1. (R1 ×2) Raw design rejections under rule R1 — `failing_checks` named section names instead of exact check names (2 rejections). Corrected before execution to exact check names.
2. (R2 ×2) Raw design rejections under rule R2 — spot checks were prose-only, with no structured `computed_spot_checks` (2 rejections). Corrected before execution by structured injection of computed spot checks from the oracle.
3. (R3 ×1) Raw design rejection under rule R3 — the violations input was missing the `open_questions` key paths of the full-pass manifest, so it did not read as a full manifest plus planted violations (1 rejection). Corrected before execution: rebuilt the violations case as the full manifest plus planted violations on `decisions[0]` / `actions[0]` only (`decisions[0].source_anchor` `""`, `decisions[0].faithful_to_source` false, `actions[0].owner` `""`, `actions[0].due_date` `""`).
4. (R4 ×1) Raw design rejection under rule R4 — the malformed case carried two type violations instead of exactly one (1 rejection). Corrected before execution: kept `meeting` (integer `12345` where a string is documented) as the single designed malformed field and set `source` to a type-correct `{}`.

## Second tester — DeepSeek

DeepSeek independently recomputed the atom's computed quantities from the case inputs (`verification/deepseek_recompute.py --atom meeting-decisions-and-actions-extract`).

**DeepSeek verdict: AGREEMENT: full**

Raw output:

```json
{"atom": "meeting-decisions-and-actions-extract", "agreement": "AGREEMENT: full"}
```

## Documentation link — designed absence (recorded, never scored)

Checked 2026-11-16 with curl and a browser user-agent (the sandbox Python-urllib default user-agent is banned by our Cloudflare zones, error 1010):

- `GET https://atoms.pipavia.com/docs/meeting-decisions-and-actions-extract` → **404**.
- `GET https://atoms.pipavia.com/api.json` → 200; **107** atoms in total; this atom's entry carries **no `documentation` key**; **93** entries carry a `documentation` key.

This absence is designed: Batch 16's WS1 documentation pass follows this wave. It is recorded here for completeness and is never scored against the atom.

## Final verdict

**PASS** — all four cases pass on judgment (Gemini: PASS, 0 findings) and on mechanical verification (violations failing set exactly the four planted checks; sparse `INSUFFICIENT_EVIDENCE`; malformed 422 `invalid_input` on field `meeting`; determinism byte-identical true; MCP/REST parity true), and the DeepSeek second tester independently confirms agreement in full (AGREEMENT: full).
