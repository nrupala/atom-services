# Meeting decisions and actions extract — `meeting-decisions-and-actions-extract`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Turn meeting notes or a transcript into decisions, owned action items, open questions, and a recap draft ready for your approval

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Writing & documents who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Meeting notes to action items**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the meeting extraction manifest

The caller submits one JSON manifest: a declared extraction
record for one meeting — the decisions, action items and open
questions the caller declares were extracted, with their
owners, due dates and source anchors as declared. Every field
below is read by the named section's checks. A field **absent**
= evidence missing (`INSUFFICIENT_EVIDENCE`); a field present
but false / invalid = the check fails
(`MEETING_EXTRACTION_NOT_SOUND`). All fields are booleans
unless noted.

| Field | Read by |
|---|---|
| `meeting` (string; carried into the verdict output, not itself checked) | — |
| `source.read_in_full` (boolean) | source_and_meeting_identity |
| `source.attendees_recorded` (boolean) | source_and_meeting_identity |
| `source.meeting_date_recorded` (boolean) | source_and_meeting_identity |
| `source.meeting_identity_confirmed` (boolean) | source_and_meeting_identity |
| `source.absent_attendees_named_when_relevant` (boolean) | source_and_meeting_identity |
| `source.speaker_attribution_kept_where_it_matters` (boolean) | source_and_meeting_identity |
| `source.numbers_dates_amounts_copied_exactly` (boolean) | source_and_meeting_identity |
| `source.names_spelled_as_in_source_or_contacts` (boolean) | source_and_meeting_identity |
| `decisions_record.decisions_stated_close_to_source_wording` (boolean) | decisions_fidelity |
| `decisions_record.inferred_items_labelled_as_inferred` (boolean) | decisions_fidelity |
| `decisions` (list of decision-row objects, each with the entry fields below; computed, see below) | decisions_fidelity |
| `decisions[].name` (string; names the row in the computed outputs) | decisions_fidelity |
| `decisions[].source_anchor` (string; must be non-empty to pass) | decisions_fidelity |
| `decisions[].faithful_to_source` (boolean) | decisions_fidelity |
| `decisions[].is_inferred` (boolean) | decisions_fidelity |
| `decisions[].inference_marked` (boolean; must be `true` on every inferred row) | decisions_fidelity |
| `actions_record.owners_and_due_dates_drawn_from_source` (boolean) | action_ownership_and_dates |
| `actions_record.loose_deadlines_flagged_not_guessed` (boolean) | action_ownership_and_dates |
| `actions` (list of action-row objects, each with the entry fields below; computed, see below) | action_ownership_and_dates |
| `actions[].name` (string; names the row in the computed outputs) | action_ownership_and_dates |
| `actions[].owner` (string; must be non-empty to pass) | action_ownership_and_dates |
| `actions[].due_date` (string; must be non-empty to pass) | action_ownership_and_dates |
| `actions[].source_anchor` (string; must be non-empty to pass) | action_ownership_and_dates |
| `open_questions_record.unresolved_items_collected_separately` (boolean) | open_questions_and_carry_forward |
| `open_questions_record.ownerless_we_should_listed_as_open_questions` (boolean) | open_questions_and_carry_forward |
| `open_questions_record.prior_open_items_carried_forward_visibly` (boolean) | open_questions_and_carry_forward |
| `open_questions` (list of open-question-row objects, each with the entry fields below; computed, see below) | open_questions_and_carry_forward |
| `open_questions[].name` (string; names the row in the computed outputs) | open_questions_and_carry_forward |
| `open_questions[].source_anchor` (string; must be non-empty to pass) | open_questions_and_carry_forward |
| `recap.decisions_first_then_actions_then_open_questions` (boolean) | recap_draft_and_handoff |
| `recap.concise_enough_to_be_read` (boolean) | recap_draft_and_handoff |
| `recap.shown_as_draft_before_any_send` (boolean) | recap_draft_and_handoff |
| `handoff.confirmed_actions_handed_off_with_owners_and_dates_on_approval` (boolean) | recap_draft_and_handoff |
| `handoff.recap_sent_only_through_directed_channel_on_approval` (boolean) | recap_draft_and_handoff |
| `red_lines.inferred_decision_presented_as_made_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.invented_owner_or_due_date_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.recap_sent_without_approval_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.unresolved_question_dropped_for_cleanliness_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.meeting_contents_disclosed_beyond_named_attendees_present` (boolean; must be `false` to pass — skill red line) | red_lines |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the
declared record itself — no outside threshold is imported:

- **Decisions declared:** the declared `decisions` list passes
  only when it is present and non-empty; an absent list is
  missing evidence, an empty list fails.
- **Source anchor per decision:** every declared decision row
  must carry a non-empty `source_anchor` string. A row with the
  field absent is missing evidence; a row declaring an empty
  string fails and is named.
- **Faithful per decision:** every declared decision row must
  declare `faithful_to_source: true` (the skill: decisions
  match the source, stated close to its own wording). A row
  with the field absent is missing evidence.
- **Every inferred decision marked:** every declared decision
  row with `is_inferred: true` must also declare
  `inference_marked: true` (the skill: mark anything inferred
  as inferred). A row whose `inference_marked` field is absent
  while `is_inferred` is true is missing evidence; a row
  declaring it false fails and is named. Rows that are not
  inferred impose no marking requirement.
- **Actions declared:** the declared `actions` list passes
  only when it is present and non-empty; an absent list is
  missing evidence, an empty list fails.
- **Named owner per action:** every declared action row must
  carry a non-empty `owner` string (quality gate: every action
  item carries a named owner and a due date, or sits in open
  questions — an ownerless row does not belong in the actions
  list). Absent field = missing evidence; empty string = fail,
  named.
- **Due date per action:** every declared action row must
  carry a non-empty `due_date` string, on the same rule as the
  owner check.
- **Source anchor per action:** every declared action row must
  carry a non-empty `source_anchor` string, on the same rule
  as the owner check.
- **Open questions declared:** the declared `open_questions`
  list passes when it is present; an empty list is a valid
  declaration that nothing is open and passes. An absent list
  is missing evidence.
- **Source anchor per open question:** every declared
  open-question row must carry a non-empty `source_anchor`
  string. For an empty list this passes vacuously. Absent
  field = missing evidence; empty string = fail, named.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the ten primary computed checks above cannot be completed),
`decisions_count`, `actions_count` and `open_questions_count`
(the declared list lengths, or null when a list is not declared
— counts are reported as integers, exactly), the row-name lists
`decisions_without_source_anchor` (rows whose anchor is present
but empty; a row with the field absent is missing evidence and
does not appear), `decisions_not_faithful`,
`inferred_decisions_unmarked` (inferred rows whose marking is
present but not true), `actions_without_owner`,
`actions_without_due_date`, `actions_without_source_anchor`,
and `open_questions_without_source_anchor`, and the coverage
ratios `decision_anchor_coverage` (decisions with a non-empty
anchor ÷ declared decisions), `decision_faithful_coverage`,
`inferred_marking_coverage` (marked inferred decisions ÷
declared inferred decisions), `action_owner_coverage`,
`action_due_date_coverage`, `action_anchor_coverage` and
`open_question_anchor_coverage`. **Fixed serialization rule:**
computed ratios are reported as strings with exactly six
decimal places, produced in both implementations by the same
rule — round half up to 6dp, `floor(v * 1000000 + 0.5) /
1000000`, then format with exactly six decimals; comparisons
use the unrounded values. A ratio is null when its denominator
list is absent or empty (for `inferred_marking_coverage`, when
no decision is declared inferred). That fixed serialization is
what makes the Python and TypeScript outputs byte-identical.

The skill states no numeric pass/fail threshold — no count,
length or deadline bar: its requirements are qualitative
attestations the record declares, plus completeness over its
own declared rows. Quantities are computed and reported; the
only bar on the computed rows is completeness over the caller's
own declared rows, exactly as stated above. Declined
thresholds, named: a minimum number of decisions, action items
or open questions a record must contain (beyond the declared
non-empty bar on the decisions and actions lists themselves);
a recap word count or length limit (the skill says only "short
enough to actually be read" — caller attestation only); a due
date format, calendar validity rule, or a maximum days-out for
due dates (the skill requires a due date drawn from the source
and copied exactly, and states no format or horizon); a
response-time, send-deadline or follow-up interval; a
source-anchor format (page, timestamp or otherwise — any
non-empty declared anchor counts); a coverage percentage below
completeness.

The verdict is one of `MEETING_EXTRACTION_SOUND` (all 35
checks pass), `MEETING_EXTRACTION_NOT_SOUND` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but evidence
is missing), across six sections:
source_and_meeting_identity, decisions_fidelity,
action_ownership_and_dates, open_questions_and_carry_forward,
recap_draft_and_handoff, red_lines.

## Distinct ground

No live or staged sibling atom audits a declared meeting
extraction record. The nearest siblings are
`architecture-decision-record`, which audits a single declared
architecture decision record (one decision, its context and
consequences — not a meeting's full extraction of decisions,
actions and open questions), and `decision-process-design`,
which audits the design of a decision-making process (how
decisions get made, not what one meeting decided or who owes
what by when) — zero checks are shared with either; the
boundary is: single-decision records and decision-process
design there, meeting-source fidelity, per-action owner /
due-date completeness, open-question carry-forward, recap
draft discipline and meeting red lines here.

## Honest scoping

This atom audits a **declared** extraction record — it parses
no notes or transcript, performs no extraction itself, reads
no contacts or calendar, drafts no recap, sends nothing, hands
nothing off, and does not verify that a declared decision,
owner, date or anchor actually appears in the source. A record
is sound *on the caller's declared evidence*: a manifest that
declares every action owned and dated and no inferred decision
presented as made passes those checks even if the real meeting
did none of it. It is a completeness and consistency audit of
the record the skill requires, **not a meeting-notes service,
a transcription or extraction engine, or a guarantee that the
extraction is substantively correct**: it never judges whether
a decision was really made, whether an owner really agreed,
whether a due date is sensible, or whether the recap reads
well — only that the record contains what the skill's method,
quality gates and red lines demand, and that its declared rows
are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds beyond
the skill's own stated rules (see the declined list above); no
live verification of any declared fact; no text inspection —
faithfulness to source wording, inference marking in substance
and recap quality are caller-declared flags and row fields, the
atom reads no source text and no recap text; the writing voice
of the recap (the skill drafts in `nrupal-writing-voice`) is a
caller attestation of structure and draft discipline only — the
atom checks the declared recap order (decisions, then actions,
then open questions) and draft-before-send discipline, never
the voice itself; whether an item is genuinely an open
question versus an action is a caller declaration — the atom
checks only that ownerless items are declared to sit in open
questions and that every declared action row is owned and
dated.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.

## Named doubt (from the register)

Commodity productivity service
