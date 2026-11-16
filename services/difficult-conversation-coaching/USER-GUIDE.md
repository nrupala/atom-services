# Difficult conversation coaching — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are preparing for a difficult conversation and have a record of that preparation — the emotion named and a pause planned, a firm-not-hot stance, empathy steps, assertive framing, conversation structure, any feedback points in SBI form, safeguards and repair. This atom reads one declared manifest and returns one deterministic verdict across five sections: **CONVERSATION_PREPARATION_COMPLETE**, **CONVERSATION_PREPARATION_INCOMPLETE**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared evidence's completeness and consistency only — it does not coach, does not generate dialogue or wording, does not rehearse anyone, does not sit in on or verify any conversation, and does not verify that a declared preparation step actually happened or was done well. Computed checks: the declared `preparation_domains` list must be present and non-empty and must be exactly Goleman's four stated domains — `self_awareness`, `self_management`, `social_awareness`, `relationship_management` — in that stated order; and, only when `feedback.feedback_to_be_given` is true, the declared `feedback_points` list must be present and non-empty, every row must be SBI-complete (`situation_stated`, `behavior_described` and `impact_stated` all true), and no row may target identity (`targets_identity` must be false — critique the behavior, never the identity). A repair move is likewise required only when `repair.thread_has_soured` is true. No numeric threshold is applied — no pause duration, rehearsal count, empathy or tone score is invented. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "difficult-conversation-coaching"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/difficult-conversation-coaching` — tool name `difficult_conversation_coaching`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/difficult-conversation-coaching` — body = the manifest object; same `Authorization` header.

## Input — the difficult-conversation-coaching manifest

| Field | Meaning |
|---|---|
| `conversation_title` | conversation title (string; carried into the output, not checked) |
| `preparation_domains` (list of strings) | computed: passes only when present and non-empty, and only when it is exactly `self_awareness`, `self_management`, `social_awareness`, `relationship_management` in that order; the canonical domains not declared are reported as `preparation_domains_missing`, or null when no list is declared |
| `self_awareness.emotion_named` / `pause_before_reacting_planned` | self-awareness evidence: the emotion is named; a pause before reacting is planned |
| `self_management.firm_not_hot_stance_declared` / `regulation_approach_declared` | self-management evidence: a firm-not-hot stance and a regulation approach are declared |
| `self_management.venting_in_writing_present` | must be `false` to pass (anti-pattern: no venting in writing) |
| `self_management.emotion_suppressed_instead_of_regulated_present` | must be `false` to pass (anti-pattern: emotion regulated, not suppressed) |
| `rehearsal.rehearsal_completed` | preparation evidence: the conversation was rehearsed |
| `empathy.counterpart_emotion_considered` / `emotion_separated_from_position` / `acknowledgement_before_redirect_planned` / `strongest_reasonable_version_identified` | empathy / social-awareness evidence |
| `framing.facts_led_with` / `specifics_prepared` / `ask_stated_clearly` / `boundary_stated_clearly` / `firm_on_substance_warm_on_tone_declared` | framing and assertiveness evidence: facts led with, specifics prepared, ask and boundary stated clearly, firm on substance and warm on tone |
| `framing.hostility_mirroring_present` | must be `false` to pass (anti-pattern: no mirroring hostility) |
| `structure.own_part_owned` / `other_view_invited` / `concrete_next_step_proposed` | structure evidence: own part owned, other view invited, a concrete next step proposed |
| `feedback.feedback_to_be_given` (boolean gate) | gates the three feedback-points checks below |
| `feedback_points` (list of objects) | computed (gated): required, present and non-empty, only when feedback is to be given; each row is `{name, situation_stated, behavior_described, impact_stated, targets_identity}` |
| `feedback_points[].name` (string) | names the row in the computed `feedback_points_without_complete_sbi` / `feedback_points_targeting_identity` outputs |
| `feedback_points[].situation_stated` / `behavior_described` / `impact_stated` | SBI evidence per row: Situation, Behavior and Impact all stated for the row to be SBI-complete |
| `feedback_points[].targets_identity` | must be `false` on every row to pass (rule: critique the behavior, never the identity) |
| `safeguards.do_not_respond_list_checked` | safeguard evidence: the do-not-respond list was checked |
| `safeguards.target_on_do_not_respond_list` | must be `false` to pass (guardrail: the counterpart is not on the do-not-respond list) |
| `safeguards.register_appropriate_to_relationship_declared` | safeguard evidence: the register appropriate to the relationship is declared |
| `repair.thread_has_soured` (boolean gate) | gates the repair-move check below |
| `repair.repair_move_planned` | required when a soured thread is declared; otherwise the check passes as not applicable |
| `repair.relationship_and_outcome_protected_over_point_scoring_declared` | repair evidence: the relationship and the outcome are protected over scoring points |
| `repair.winning_argument_losing_relationship_present` | must be `false` to pass (anti-pattern: no winning the argument but losing the relationship) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward CONVERSATION_PREPARATION_INCOMPLETE). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/difficult-conversation-coaching`:

```json
{
  "conversation_title": "Vendor Payment Dispute",
  "preparation_domains": [
    "self_awareness",
    "self_management",
    "social_awareness",
    "relationship_management"
  ],
  "self_awareness": {
    "emotion_named": true,
    "pause_before_reacting_planned": true
  },
  "self_management": {
    "firm_not_hot_stance_declared": true,
    "regulation_approach_declared": true,
    "venting_in_writing_present": false,
    "emotion_suppressed_instead_of_regulated_present": false
  },
  "rehearsal": {
    "rehearsal_completed": true
  },
  "empathy": {
    "counterpart_emotion_considered": true,
    "emotion_separated_from_position": true,
    "acknowledgement_before_redirect_planned": true,
    "strongest_reasonable_version_identified": true
  },
  "framing": {
    "facts_led_with": true,
    "specifics_prepared": true,
    "ask_stated_clearly": true,
    "boundary_stated_clearly": true,
    "firm_on_substance_warm_on_tone_declared": true,
    "hostility_mirroring_present": false
  },
  "structure": {
    "own_part_owned": true,
    "other_view_invited": true,
    "concrete_next_step_proposed": true
  },
  "feedback": {
    "feedback_to_be_given": true
  },
  "feedback_points": [
    {
      "name": "Point 1",
      "situation_stated": true,
      "behavior_described": true,
      "impact_stated": true,
      "targets_identity": false
    }
  ],
  "safeguards": {
    "do_not_respond_list_checked": true,
    "target_on_do_not_respond_list": false,
    "register_appropriate_to_relationship_declared": true
  },
  "repair": {
    "thread_has_soured": false,
    "repair_move_planned": false,
    "relationship_and_outcome_protected_over_point_scoring_declared": true,
    "winning_argument_losing_relationship_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 31 checks and a text stamp of the verdict):

```json
{
  "service": "difficult-conversation-coaching",
  "atom_version": "0.1.0",
  "conversation_title": "Vendor Payment Dispute",
  "verdict": "CONVERSATION_PREPARATION_COMPLETE",
  "sections": {
    "preparation_and_self_regulation": "pass",
    "empathy_and_social_awareness": "pass",
    "framing_and_assertiveness": "pass",
    "structure_feedback_and_next_step": "pass",
    "safeguards_repair_and_close": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "preparation_domains_count": 4,
  "preparation_domains_missing": [],
  "preparation_domain_coverage": "1.0000",
  "feedback_points_count": 1,
  "feedback_points_without_complete_sbi": [],
  "feedback_points_targeting_identity": [],
  "sbi_coverage": "1.0000",
  "summary": "31 pass, 0 fail, 0 missing of 31 checks across five sections."
}
```

## Verdicts

- **CONVERSATION_PREPARATION_COMPLETE** — every check passes; the declared conversation-preparation evidence is complete and consistent with the skill's method, gates and anti-patterns.
- **CONVERSATION_PREPARATION_INCOMPLETE** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `preparation_domains_count` and `feedback_points_count` (the declared list lengths as integers, or null when the list is not declared), `preparation_domains_missing` (the canonical domains not declared, in canonical order, or null when the list is not declared), `feedback_points_without_complete_sbi` and `feedback_points_targeting_identity` (row-name lists, or null when the `feedback_points` list is not declared), `preparation_domain_coverage` and `sbi_coverage` (ratios as strings with exactly four decimal places, or null when their list is absent — and, for `sbi_coverage`, also when the declared list is empty) and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the five primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
