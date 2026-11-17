# Meeting decisions and actions extract — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You have turned meeting notes or a transcript into decisions, owned action items, open questions, and a recap draft ready for approval — and you have a record of that extraction. This atom reads one declared manifest and returns one deterministic verdict across six sections: **MEETING_EXTRACTION_SOUND**, **MEETING_EXTRACTION_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it parses no notes or transcript, performs no extraction itself, reads no contacts or calendar, drafts no recap, sends nothing, hands nothing off, and does not verify that a declared decision, owner, date or anchor actually appears in the source. A record is sound *on your declared evidence*: it never judges whether a decision was really made, whether an owner really agreed, whether a due date is sensible, or whether the recap reads well — only that the record contains what the method, quality gates and red lines demand, and that its declared rows are internally consistent. Computed checks: the declared `decisions` and `actions` lists must be present and non-empty; every decision row must carry a non-empty source anchor and declare itself faithful to the source; every inferred decision must be marked as inferred; every action row must carry a non-empty named owner, due date and source anchor; the `open_questions` list must be present (an empty list is a valid declaration that nothing is open) and every open-question row must carry a non-empty source anchor. No numeric threshold is imposed — no minimum number of decisions, actions or open questions beyond the non-empty bar on the decisions and actions lists, no recap word count, no due-date format or horizon, no source-anchor format, and no coverage percentage below completeness. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "meeting-decisions-and-actions-extract"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/meeting-decisions-and-actions-extract` — tool name `meeting_decisions_and_actions_extract`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/meeting-decisions-and-actions-extract` — body = the manifest object; same `Authorization` header.

## Input — the meeting extraction manifest

| Field | Meaning |
|---|---|
| `meeting` | meeting the extraction covers (string; carried into the output, not checked) |
| `source.read_in_full` | source evidence: the notes or transcript were read in full before extraction |
| `source.attendees_recorded` | source evidence: who attended is recorded from the source |
| `source.meeting_date_recorded` | source evidence: when the meeting happened is recorded from the source |
| `source.meeting_identity_confirmed` | source evidence: attendees, date and meeting identity are confirmed from the source |
| `source.absent_attendees_named_when_relevant` | source evidence: absent attendees are named when relevant |
| `source.speaker_attribution_kept_where_it_matters` | source evidence: speaker attribution is kept where it matters |
| `source.numbers_dates_amounts_copied_exactly` | source evidence: numbers, dates and amounts are copied exactly |
| `source.names_spelled_as_in_source_or_contacts` | source evidence: names are spelled as in the source or contacts |
| `decisions_record.decisions_stated_close_to_source_wording` | decisions evidence: decisions are stated close to the source wording |
| `decisions_record.inferred_items_labelled_as_inferred` | decisions evidence: inferred items are labelled as inferred |
| `decisions` (list of decision-row objects) | computed: must be present and non-empty; reported as `decisions_count` |
| `decisions[].name` (string) | names the row in the computed outputs |
| `decisions[].source_anchor` (string) | computed: must be non-empty; rows with an empty anchor are reported in `decisions_without_source_anchor` |
| `decisions[].faithful_to_source` | computed: every row must declare `true`; rows that do not are reported in `decisions_not_faithful` |
| `decisions[].is_inferred` | whether the decision is inferred |
| `decisions[].inference_marked` | computed: must be `true` on every inferred row; unmarked inferred rows are reported in `inferred_decisions_unmarked` |
| `actions_record.owners_and_due_dates_drawn_from_source` | actions evidence: owners and due dates are drawn from the source |
| `actions_record.loose_deadlines_flagged_not_guessed` | actions evidence: loose deadlines are flagged, not guessed |
| `actions` (list of action-row objects) | computed: must be present and non-empty; reported as `actions_count` |
| `actions[].name` (string) | names the row in the computed outputs |
| `actions[].owner` (string) | computed: must be non-empty; rows with an empty owner are reported in `actions_without_owner` |
| `actions[].due_date` (string) | computed: must be non-empty; rows with an empty due date are reported in `actions_without_due_date` |
| `actions[].source_anchor` (string) | computed: must be non-empty; rows with an empty anchor are reported in `actions_without_source_anchor` |
| `open_questions_record.unresolved_items_collected_separately` | open-questions evidence: unresolved items are collected separately |
| `open_questions_record.ownerless_we_should_listed_as_open_questions` | open-questions evidence: ownerless "we should" items are listed as open questions |
| `open_questions_record.prior_open_items_carried_forward_visibly` | open-questions evidence: prior open items are carried forward visibly |
| `open_questions` (list of open-question-row objects) | computed: must be present (empty is valid); reported as `open_questions_count` |
| `open_questions[].name` (string) | names the row in the computed outputs |
| `open_questions[].source_anchor` (string) | computed: must be non-empty; rows with an empty anchor are reported in `open_questions_without_source_anchor` |
| `recap.decisions_first_then_actions_then_open_questions` | recap evidence: the recap runs decisions first, then actions, then open questions |
| `recap.concise_enough_to_be_read` | recap evidence: the recap is concise enough to be read |
| `recap.shown_as_draft_before_any_send` | recap evidence: the recap is shown as a draft before any send |
| `handoff.confirmed_actions_handed_off_with_owners_and_dates_on_approval` | handoff evidence: confirmed actions are handed off with owners and dates, on approval |
| `handoff.recap_sent_only_through_directed_channel_on_approval` | handoff evidence: the recap is sent only through the directed channel, on approval |
| `red_lines.inferred_decision_presented_as_made_present` | must be `false` to pass (red line: no inferred decision presented as made) |
| `red_lines.invented_owner_or_due_date_present` | must be `false` to pass (red line: no invented owner or due date) |
| `red_lines.recap_sent_without_approval_present` | must be `false` to pass (red line: no recap sent without approval) |
| `red_lines.unresolved_question_dropped_for_cleanliness_present` | must be `false` to pass (red line: no unresolved question dropped for cleanliness) |
| `red_lines.meeting_contents_disclosed_beyond_named_attendees_present` | must be `false` to pass (red line: no meeting contents disclosed beyond named attendees) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward MEETING_EXTRACTION_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/meeting-decisions-and-actions-extract`:

```json
{
  "meeting": "Project Alpha Sync",
  "source": {
    "read_in_full": true,
    "attendees_recorded": true,
    "meeting_date_recorded": true,
    "meeting_identity_confirmed": true,
    "absent_attendees_named_when_relevant": true,
    "speaker_attribution_kept_where_it_matters": true,
    "numbers_dates_amounts_copied_exactly": true,
    "names_spelled_as_in_source_or_contacts": true
  },
  "decisions_record": {
    "decisions_stated_close_to_source_wording": true,
    "inferred_items_labelled_as_inferred": true
  },
  "decisions": [
    {
      "name": "Launch Q3",
      "source_anchor": "p1",
      "faithful_to_source": true,
      "is_inferred": false
    }
  ],
  "actions_record": {
    "owners_and_due_dates_drawn_from_source": true,
    "loose_deadlines_flagged_not_guessed": true
  },
  "actions": [
    {
      "name": "Send email",
      "owner": "Alice",
      "due_date": "2023-12-01",
      "source_anchor": "p2"
    }
  ],
  "open_questions_record": {
    "unresolved_items_collected_separately": true,
    "ownerless_we_should_listed_as_open_questions": true,
    "prior_open_items_carried_forward_visibly": true
  },
  "open_questions": [
    {
      "name": "Budget approval",
      "source_anchor": "p3"
    }
  ],
  "recap": {
    "decisions_first_then_actions_then_open_questions": true,
    "concise_enough_to_be_read": true,
    "shown_as_draft_before_any_send": true
  },
  "handoff": {
    "confirmed_actions_handed_off_with_owners_and_dates_on_approval": true,
    "recap_sent_only_through_directed_channel_on_approval": true
  },
  "red_lines": {
    "inferred_decision_presented_as_made_present": false,
    "invented_owner_or_due_date_present": false,
    "recap_sent_without_approval_present": false,
    "unresolved_question_dropped_for_cleanliness_present": false,
    "meeting_contents_disclosed_beyond_named_attendees_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 35 checks and a text stamp of the verdict):

```json
{
  "service": "meeting-decisions-and-actions-extract",
  "atom_version": "0.1.0",
  "meeting": "Project Alpha Sync",
  "verdict": "MEETING_EXTRACTION_SOUND",
  "sections": {
    "source_and_meeting_identity": "pass",
    "decisions_fidelity": "pass",
    "action_ownership_and_dates": "pass",
    "open_questions_and_carry_forward": "pass",
    "recap_draft_and_handoff": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "decisions_count": 1,
  "decisions_without_source_anchor": [],
  "decision_anchor_coverage": "1.000000",
  "decisions_not_faithful": [],
  "decision_faithful_coverage": "1.000000",
  "inferred_decisions_unmarked": [],
  "inferred_marking_coverage": null,
  "actions_count": 1,
  "actions_without_owner": [],
  "action_owner_coverage": "1.000000",
  "actions_without_due_date": [],
  "action_due_date_coverage": "1.000000",
  "actions_without_source_anchor": [],
  "action_anchor_coverage": "1.000000",
  "open_questions_count": 1,
  "open_questions_without_source_anchor": [],
  "open_question_anchor_coverage": "1.000000",
  "summary": "35 pass, 0 fail, 0 missing of 35 checks across six sections."
}
```

## Verdicts

- **MEETING_EXTRACTION_SOUND** — every check passes; the declared extraction record is complete and consistent with the method's checklist and red lines.
- **MEETING_EXTRACTION_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `decisions_count`, `actions_count` and `open_questions_count` (the declared list lengths as integers, or null when a list is not declared), the row-name lists `decisions_without_source_anchor`, `decisions_not_faithful`, `inferred_decisions_unmarked`, `actions_without_owner`, `actions_without_due_date`, `actions_without_source_anchor` and `open_questions_without_source_anchor` (null when the relevant list is not declared; a row with the relevant field absent is missing evidence and does not appear in these lists), the coverage values `decision_anchor_coverage`, `decision_faithful_coverage`, `inferred_marking_coverage`, `action_owner_coverage`, `action_due_date_coverage`, `action_anchor_coverage` and `open_question_anchor_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty — for `inferred_marking_coverage`, when no decision is declared inferred), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
