# Meeting decisions and actions extract — documentation

**Meeting decisions and actions extract** · slug `meeting-decisions-and-actions-extract` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment a15298eb9b7f40bf80d306cea4a33f80).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **built-locally** — “no endpoint is live”, and contract.yaml still says status: scaffolded. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/meeting-decisions-and-actions-extract/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment a15298eb9b7f40bf80d306cea4a33f80). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `meeting` "Project Alpha Sync"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "meeting-decisions-and-actions-extract"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the meeting extraction manifest.** You declare a record of one meeting's extraction — the decisions, action items and open questions declared extracted, with their owners, due dates and source anchors — the atom audits the declared record, it does not parse notes or a transcript or perform the extraction itself (see Explanation). The recorded full-pass manifest declares the meeting `Project Alpha Sync`: all eight source declarations in passing polarity (source read in full, attendees recorded, meeting date recorded, meeting identity confirmed, absent attendees named when relevant, speaker attribution kept where it matters, numbers / dates / amounts copied exactly, names spelled as in source or contacts); decisions stated close to source wording and inferred items labelled as inferred; one decision row, `Launch Q3`, with source anchor `p1`, `faithful_to_source: true` and `is_inferred: false`; owners and due dates drawn from source and loose deadlines flagged not guessed; one action row, `Send email`, owned by `Alice`, due `2023-12-01`, with source anchor `p2`; unresolved items collected separately, ownerless "we should" items listed as open questions and prior open items carried forward visibly; one open-question row, `Budget approval`, with source anchor `p3`; a recap running decisions first, then actions, then open questions, concise enough to be read and shown as a draft before any send; confirmed actions handed off with owners and dates on approval and the recap sent only through the directed channel on approval; and all five red-line flags `false` (no inferred decision presented as made, no invented owner or due date, no recap sent without approval, no unresolved question dropped for cleanliness, no meeting contents disclosed beyond named attendees).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/meeting-decisions-and-actions-extract` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `MEETING_EXTRACTION_SOUND`: "35 pass, 0 fail, 0 missing of 35 checks across six sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `decisions_count`, `actions_count` and `open_questions_count` are each 1, `decision_anchor_coverage`, `decision_faithful_coverage`, `action_owner_coverage`, `action_due_date_coverage`, `action_anchor_coverage` and `open_question_anchor_coverage` are each `"1.000000"`, `inferred_marking_coverage` is null (no inferred decisions), and all seven row-name lists are empty (`[]`).

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `MEETING_EXTRACTION_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "meeting-decisions-and-actions-extract"}`.
3. Call: `POST https://atoms.pipavia.com/v1/meeting-decisions-and-actions-extract` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format).

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/meeting-decisions-and-actions-extract` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `meeting_decisions_and_actions_extract`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `MEETING_EXTRACTION_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `every_decision_has_source_anchor`, `every_decision_faithful_to_source`, `every_action_has_named_owner`, `every_action_has_due_date`, and the summary reads "31 pass, 4 fail, 0 missing of 35 checks across six sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `decisions_without_source_anchor` and `decisions_not_faithful` each name `Launch Q3` — that row declares `source_anchor` `""` and `faithful_to_source` `false`, so `decision_anchor_coverage` and `decision_faithful_coverage` are each `"0.000000"` — and `actions_without_owner` and `actions_without_due_date` each name `Send email` — that row declares `owner` `""` and `due_date` `""`, so `action_owner_coverage` and `action_due_date_coverage` are each `"0.000000"`, while `action_anchor_coverage` and `open_question_anchor_coverage` remain `"1.000000"`; sections `decisions_fidelity` and `action_ownership_and_dates` report `fail`, the other four `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example an integer where a string is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "meeting",
  "detail": "meeting must be a string"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/meeting-decisions-and-actions-extract` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/meeting-decisions-and-actions-extract` — tool name `meeting_decisions_and_actions_extract`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `meeting_decisions_and_actions_extract` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `meeting` and the row string fields are noted as strings and `decisions`, `actions` and `open_questions` as lists there. Where SERVICE.md states no type — the section container objects (`source`, `decisions_record`, `actions_record`, `open_questions_record`, `recap`, `handoff`, `red_lines`) and a row object (`decisions[]`, `actions[]`, `open_questions[]`) — the type below is grounded in the recorded evidence inputs (and, for the top-level containers and lists, in the MCP `inputSchema` recorded in evidence.json, which types them `object` and `array`); that grounding is said so in the Notes column. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `MEETING_EXTRACTION_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, exactly as SERVICE.md groups them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `meeting` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: source_and_meeting_identity

| Field | Type | Notes |
|---|---|---|
| `source` | object | The source section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `source.read_in_full` | boolean | — |
| `source.attendees_recorded` | boolean | — |
| `source.meeting_date_recorded` | boolean | — |
| `source.meeting_identity_confirmed` | boolean | — |
| `source.absent_attendees_named_when_relevant` | boolean | — |
| `source.speaker_attribution_kept_where_it_matters` | boolean | — |
| `source.numbers_dates_amounts_copied_exactly` | boolean | — |
| `source.names_spelled_as_in_source_or_contacts` | boolean | — |

#### Read by: decisions_fidelity

| Field | Type | Notes |
|---|---|---|
| `decisions_record` | object | The decisions-record section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `decisions_record.decisions_stated_close_to_source_wording` | boolean | — |
| `decisions_record.inferred_items_labelled_as_inferred` | boolean | — |
| `decisions` | list | list of decision-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `decisions[]` | object | One declared decision row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `decisions[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `decisions[].source_anchor` | string | Must be non-empty to pass (type stated in SERVICE.md) |
| `decisions[].faithful_to_source` | boolean | — |
| `decisions[].is_inferred` | boolean | — |
| `decisions[].inference_marked` | boolean | Must be `true` on every inferred row |

#### Read by: action_ownership_and_dates

| Field | Type | Notes |
|---|---|---|
| `actions_record` | object | The actions-record section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `actions_record.owners_and_due_dates_drawn_from_source` | boolean | — |
| `actions_record.loose_deadlines_flagged_not_guessed` | boolean | — |
| `actions` | list | list of action-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `actions[]` | object | One declared action row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `actions[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `actions[].owner` | string | Must be non-empty to pass (type stated in SERVICE.md) |
| `actions[].due_date` | string | Must be non-empty to pass (type stated in SERVICE.md) |
| `actions[].source_anchor` | string | Must be non-empty to pass (type stated in SERVICE.md) |

#### Read by: open_questions_and_carry_forward

| Field | Type | Notes |
|---|---|---|
| `open_questions_record` | object | The open-questions-record section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `open_questions_record.unresolved_items_collected_separately` | boolean | — |
| `open_questions_record.ownerless_we_should_listed_as_open_questions` | boolean | — |
| `open_questions_record.prior_open_items_carried_forward_visibly` | boolean | — |
| `open_questions` | list | list of open-question-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md) |
| `open_questions[]` | object | One declared open-question row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `open_questions[].name` | string | Names the row in the computed outputs (type stated in SERVICE.md) |
| `open_questions[].source_anchor` | string | Must be non-empty to pass (type stated in SERVICE.md) |

#### Read by: recap_draft_and_handoff

| Field | Type | Notes |
|---|---|---|
| `recap` | object | The recap section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `recap.decisions_first_then_actions_then_open_questions` | boolean | — |
| `recap.concise_enough_to_be_read` | boolean | — |
| `recap.shown_as_draft_before_any_send` | boolean | — |
| `handoff` | object | The handoff section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `handoff.confirmed_actions_handed_off_with_owners_and_dates_on_approval` | boolean | — |
| `handoff.recap_sent_only_through_directed_channel_on_approval` | boolean | — |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.inferred_decision_presented_as_made_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.invented_owner_or_due_date_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.recap_sent_without_approval_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.unresolved_question_dropped_for_cleanliness_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.meeting_contents_disclosed_beyond_named_attendees_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 35 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only. Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies).

#### Section: source_and_meeting_identity

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `source_read_in_full` | source: the notes or transcript were read in full, end to end, before extraction | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `attendees_recorded` | meeting identity: who attended is recorded from the source | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `meeting_date_recorded` | meeting identity: when the meeting happened is recorded from the source | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `meeting_identity_confirmed` | meeting identity: attendees, date and meeting identity are confirmed from the source | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `absent_attendees_named_when_relevant` | meeting identity: who was absent is named as well as who attended, when attendance matters to a decision | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `speaker_attribution_kept_where_it_matters` | source: speaker attribution is kept where it matters for ownership | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `numbers_dates_amounts_copied_exactly` | source: numbers, dates and amounts are copied exactly from the source, never rounded or tidied | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `names_spelled_as_in_source_or_contacts` | source: names are spelled as in the source or the contacts, checked when a name is unclear | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: decisions_fidelity

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `decisions_stated_close_to_source_wording` | decisions: each decision is stated as it was actually made, close to the source's own wording | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `inferred_items_labelled_as_inferred` | decisions: anything inferred is marked as inferred, not presented as settled | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `decisions_declared` | the declared record names its decisions — the decisions list is present and non-empty | Computed over the declared record. Pass: the `decisions` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_decision_has_source_anchor` | decisions: every declared decision row carries a non-empty source anchor | Computed over the declared record. Pass: every declared decision row carries a non-empty `source_anchor`. Fail: a row declares `source_anchor` present but empty (offending rows are named in `decisions_without_source_anchor`). Missing: the list is absent, or a row has `source_anchor` absent (such a row is missing evidence and does not appear in `decisions_without_source_anchor`). |
| `every_decision_faithful_to_source` | decisions: every declared decision row declares itself faithful to the source | Computed over the declared record. Pass: every declared decision row declares `faithful_to_source: true`. Fail: a row declares `faithful_to_source` present but not `true` (offending rows are named in `decisions_not_faithful`). Missing: the list is absent, or a row has `faithful_to_source` absent (such a row is missing evidence and does not appear in `decisions_not_faithful`). |
| `every_inferred_decision_marked` | decisions: every declared decision row that is inferred is marked as inferred | Computed over the declared record. Pass: every declared decision row with `is_inferred: true` also declares `inference_marked: true` (rows that are not inferred impose no marking requirement). Fail: an inferred row declares `inference_marked` present but not `true` (offending rows are named in `inferred_decisions_unmarked`). Missing: the list is absent, or an inferred row has `inference_marked` absent (such a row is missing evidence and does not appear in `inferred_decisions_unmarked`). |

#### Section: action_ownership_and_dates

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `owners_and_due_dates_drawn_from_source` | actions: each action's owner and due date are drawn from the source | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `loose_deadlines_flagged_not_guessed` | actions: deadlines stated loosely in the meeting are flagged to pin, not guessed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `actions_declared` | the declared record names its action items — the actions list is present and non-empty | Computed over the declared record. Pass: the `actions` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_action_has_named_owner` | actions: every declared action row carries a non-empty named owner | Computed over the declared record. Pass: every declared action row carries a non-empty `owner`. Fail: a row declares `owner` present but empty (offending rows are named in `actions_without_owner`). Missing: the list is absent, or a row has `owner` absent (such a row is missing evidence and does not appear in `actions_without_owner`). |
| `every_action_has_due_date` | actions: every declared action row carries a non-empty due date | Computed over the declared record. Pass: every declared action row carries a non-empty `due_date`. Fail: a row declares `due_date` present but empty (offending rows are named in `actions_without_due_date`). Missing: the list is absent, or a row has `due_date` absent (such a row is missing evidence and does not appear in `actions_without_due_date`). |
| `every_action_has_source_anchor` | actions: every declared action row carries a non-empty source anchor | Computed over the declared record. Pass: every declared action row carries a non-empty `source_anchor`. Fail: a row declares `source_anchor` present but empty (offending rows are named in `actions_without_source_anchor`). Missing: the list is absent, or a row has `source_anchor` absent (such a row is missing evidence and does not appear in `actions_without_source_anchor`). |

#### Section: open_questions_and_carry_forward

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `unresolved_items_collected_separately` | open questions: anything raised and left unresolved is collected separately | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `ownerless_we_should_listed_as_open_questions` | open questions: a "we should" with no owner is listed as an open question, not an action item | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `prior_open_items_carried_forward_visibly` | open questions: a second meeting in a series carries its open items forward visibly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `open_questions_declared` | the declared record names its open questions — the open_questions list is present (an empty list declares that nothing is open) | Computed over the declared record. Pass: the `open_questions` list is present — an empty list is a valid declaration that nothing is open and passes. Missing: the list is absent. No fail case for this check is stated in SERVICE.md: a present list passes. |
| `every_open_question_has_source_anchor` | open questions: every declared open-question row carries a non-empty source anchor | Computed over the declared record. Pass: every declared open-question row carries a non-empty `source_anchor` (for an empty list this passes vacuously). Fail: a row declares `source_anchor` present but empty (offending rows are named in `open_questions_without_source_anchor`). Missing: the list is absent, or a row has `source_anchor` absent (such a row is missing evidence and does not appear in `open_questions_without_source_anchor`). |

#### Section: recap_draft_and_handoff

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `recap_decisions_first_then_actions_then_open_questions` | recap: the draft runs decisions first, then action items with owners and dates, then open questions | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `recap_concise_enough_to_be_read` | recap: the draft is short enough to actually be read | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `recap_shown_as_draft_before_any_send` | recap: the recap is shown as a draft; it goes nowhere until it is approved | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `confirmed_actions_handed_off_on_approval` | handoff: on approval, confirmed action items are handed off with their owners and dates | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `recap_sent_only_through_directed_channel_on_approval` | handoff: on approval, the recap is sent through the directed channel only | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_inferred_decision_presented_as_made` | red line: no inferred decision is presented as one that was actually made | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_invented_owner_or_due_date` | red line: no invented owner or due date the meeting did not set is present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_recap_sent_without_approval` | red line: the recap was not sent without approval for that send | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_unresolved_question_dropped_for_cleanliness` | red line: no unresolved question was dropped because the recap reads cleaner without it | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_disclosure_beyond_named_attendees` | red line: meeting contents go only to the attendees named — no disclosure beyond them is present | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"meeting-decisions-and-actions-extract"`), `atom_version` (`"0.1.0"`), and `meeting` (the manifest's declared meeting value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `decisions_count`, `actions_count` and `open_questions_count` (the declared list lengths as integers, or null when a list is not declared); the row-name lists `decisions_without_source_anchor` (decisions whose `source_anchor` is present but empty; a decision with the field absent is missing evidence and does not appear), `decisions_not_faithful` (decisions whose `faithful_to_source` is present but not `true`), `inferred_decisions_unmarked` (inferred decisions whose `inference_marked` is present but not `true`), `actions_without_owner`, `actions_without_due_date`, `actions_without_source_anchor` and `open_questions_without_source_anchor` (rows whose relevant field is present but empty) — all seven lists are null when the relevant list is not declared, as recorded in the sparse case; and the ratios `decision_anchor_coverage` (decisions with a non-empty anchor ÷ declared decisions), `decision_faithful_coverage`, `inferred_marking_coverage` (marked inferred decisions ÷ declared inferred decisions), `action_owner_coverage`, `action_due_date_coverage`, `action_anchor_coverage` and `open_question_anchor_coverage` — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty (for `inferred_marking_coverage`, when no decision is declared inferred). Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "35 pass, 0 fail, 0 missing of 35 checks across six sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared meeting value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `MEETING_EXTRACTION_SOUND` — all 35 checks pass: the declared extraction record is complete and consistent with the bound skill's checklist and red lines.
- `MEETING_EXTRACTION_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the ten primary computed checks cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence; `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `decisions_count`, `actions_count`, `open_questions_count`, `decisions_without_source_anchor`, `decision_anchor_coverage`, `decisions_not_faithful`, `decision_faithful_coverage`, `inferred_decisions_unmarked`, `inferred_marking_coverage`, `actions_without_owner`, `action_owner_coverage`, `actions_without_due_date`, `action_due_date_coverage`, `actions_without_source_anchor`, `action_anchor_coverage`, `open_questions_without_source_anchor`, `open_question_anchor_coverage` and `computed_status` — each defined in Output format above, with the values and null rules recorded there.

### Errors

The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"meeting","detail":"meeting must be a string"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above).
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, a bounded judgment artifact, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Turn meeting notes or a transcript into decisions, owned action items, open questions, and a recap draft ready for your approval (the bound capability, from the skill). You submit one declared record — the meeting extraction manifest — and the atom audits that record for completeness and internal consistency against the bound skill's checklist, quality gates and red lines, returning one deterministic verdict across 6 sections (`source_and_meeting_identity`, `decisions_fidelity`, `action_ownership_and_dates`, `open_questions_and_carry_forward`, `recap_draft_and_handoff`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Two kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `decisions` and `actions` lists must be present and non-empty, every decision row must carry a non-empty source anchor and declare itself faithful to the source, every inferred decision must be marked as inferred, every action row must carry a non-empty named owner, due date and source anchor, the `open_questions` list must be present (an empty list is a valid declaration that nothing is open) and every open-question row must carry a non-empty source anchor — using only the declared record, with no outside threshold imported. Aggregation is strict: any `fail` anywhere produces `MEETING_EXTRACTION_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `MEETING_EXTRACTION_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a minimum number of decisions, action items or open questions a record must contain (beyond the declared non-empty bar on the decisions and actions lists themselves); a recap word count or length limit (the skill says only "short enough to actually be read" — caller attestation only); a due date format, calendar validity rule, or a maximum days-out for due dates (the skill requires a due date drawn from the source and copied exactly, and states no format or horizon); a response-time, send-deadline or follow-up interval; a source-anchor format (page, timestamp or otherwise — any non-empty declared anchor counts); a coverage percentage below completeness. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** extraction record: a verdict of `MEETING_EXTRACTION_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares every action owned and dated and no inferred decision presented as made passes those checks even if the real meeting did none of it. It is a completeness and consistency audit of the record the skill requires, **not a meeting-notes service, a transcription or extraction engine, or a guarantee that the extraction is substantively correct**. Specifically: it parses no notes or transcript, performs no extraction itself, reads no contacts or calendar, drafts no recap, sends nothing, hands nothing off, and does not verify that a declared decision, owner, date or anchor actually appears in the source. It never judges whether a decision was really made, whether an owner really agreed, whether a due date is sensible, or whether the recap reads well — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no text inspection — faithfulness to source wording, inference marking in substance and recap quality are caller-declared flags and row fields, the atom reads no source text and no recap text; the writing voice of the recap (the skill drafts in `nrupal-writing-voice`) is a caller attestation of structure and draft discipline only — the atom checks the declared recap order (decisions, then actions, then open questions) and draft-before-send discipline, never the voice itself; whether an item is genuinely an open question versus an action is a caller declaration — the atom checks only that ownerless items are declared to sit in open questions and that every declared action row is owned and dated.

**Buyer and use context.** Teams and agents working in Writing & documents who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Meeting notes to action items (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

*Regulators: N/A — this atom audits a declared meeting extraction record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence, and SERVICE.md states explicitly that it is not a meeting-notes service, a transcription or extraction engine, or a guarantee that the extraction is substantively correct, and that it parses no notes or transcript and verifies no declared fact against the source. No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `meeting_decisions_and_actions_extract` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/meeting_decisions_and_actions_extract.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_meeting_decisions_and_actions_extract.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/meeting-decisions-and-actions-extract` (REST) and `POST /mcp/meeting-decisions-and-actions-extract` (MCP, tool `meeting_decisions_and_actions_extract`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment a15298eb9b7f40bf80d306cea4a33f80). Key scope: `meeting_decisions_and_actions_extract`. Rate limits: 60/minute, 10,000/day per key per atom (429 — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; the atom is free during trial (rate pending, per USER-GUIDE.md).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale:** SERVICE.md says Tier B · status: **built-locally**, “no endpoint is live”, and contract.yaml says status: scaffolded. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment a15298eb9b7f40bf80d306cea4a33f80) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names are not the input field names for several attestation checks and for the computed checks. Recorded check names used verbatim in the Checks section include `source_read_in_full` (input `source.read_in_full`), `recap_decisions_first_then_actions_then_open_questions` (input `recap.decisions_first_then_actions_then_open_questions`), `recap_concise_enough_to_be_read` (input `recap.concise_enough_to_be_read`), `recap_shown_as_draft_before_any_send` (input `recap.shown_as_draft_before_any_send`), `confirmed_actions_handed_off_on_approval` (input `handoff.confirmed_actions_handed_off_with_owners_and_dates_on_approval` — the recorded check name drops “with owners and dates”), `no_inferred_decision_presented_as_made` (input `red_lines.inferred_decision_presented_as_made_present`), `no_invented_owner_or_due_date` (input `red_lines.invented_owner_or_due_date_present`), `no_recap_sent_without_approval` (input `red_lines.recap_sent_without_approval_present`), `no_unresolved_question_dropped_for_cleanliness` (input `red_lines.unresolved_question_dropped_for_cleanliness_present`) and `no_disclosure_beyond_named_attendees` (input `red_lines.meeting_contents_disclosed_beyond_named_attendees_present`), plus the computed checks `decisions_declared`, `every_decision_has_source_anchor`, `every_decision_faithful_to_source`, `every_inferred_decision_marked`, `actions_declared`, `every_action_has_named_owner`, `every_action_has_due_date`, `every_action_has_source_anchor`, `open_questions_declared` and `every_open_question_has_source_anchor`, which read the declared rows rather than any single input field.
3. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field. The recorded REST response carries all 35 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
4. **Date presentation:** USER-GUIDE.md describes its worked example as “from external testing 2026-11-16” and TEST-REPORT.md is dated 2026-11-16 — the same calendar day as the recording, presented as a date only — while evidence.json records `tested_at_utc` as `2026-11-16T07:35:40.750962+00:00`. The provenance lines in this document use the recorded UTC timestamp and gateway version from evidence.json.
5. **Section grouping vs input objects:** the recorded section `recap_draft_and_handoff` reads two separate input objects — `recap` and `handoff`. This document groups the Input reference and the Checks by the recorded section names.
6. **Null lists on undeclared lists:** SERVICE.md's output paragraph states the null rules for `computed_status`, the counts and the coverage ratios, but does not state a null rule for the seven row-name lists. The recorded sparse response returns all seven lists as `null` when the relevant list is not declared (as USER-GUIDE.md also states); this document follows the recording.
7. **Case-design notes vs the recorded executions:** the `expect.notes` for the malformed case in cases.json / evidence.json say “meeting should be string, source should be object”, but the executed malformed input sets `source` to a type-correct `{}` and the recorded 422 names only `meeting` as the single violation (TEST-REPORT.md's tester-errors section records that correction). Likewise the violations case's `expect.notes` mention an “unmarked inference”, but the recorded violations response fails exactly the four planted checks, with `inferred_decisions_unmarked` `[]` and `inferred_marking_coverage` null — the decision row declares `is_inferred: false`. This document follows the recorded executions.
8. **Documentation link absent at verification time (designed):** TEST-REPORT.md records that at verification `GET https://atoms.pipavia.com/docs/meeting-decisions-and-actions-extract` returned 404 and this atom's entry in `api.json` carried no `documentation` key, and states that absence was designed — Batch 16's WS1 documentation pass follows that wave. This document is that follow-on pass.

## Worked examples

Provenance: recorded 2026-11-16T07:35:40.750962+00:00 against gateway v1.1.0, external verification lane, source `verification/work/meeting-decisions-and-actions-extract/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T07:35:40.750962+00:00 · gateway v1.1.0 · source `verification/work/meeting-decisions-and-actions-extract/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "source_and_meeting_identity",
      "check": "source_read_in_full",
      "status": "pass",
      "evidence": "source: the notes or transcript were read in full, end to end, before extraction"
    },
    {
      "section": "source_and_meeting_identity",
      "check": "attendees_recorded",
      "status": "pass",
      "evidence": "meeting identity: who attended is recorded from the source"
    },
    {
      "section": "source_and_meeting_identity",
      "check": "meeting_date_recorded",
      "status": "pass",
      "evidence": "meeting identity: when the meeting happened is recorded from the source"
    },
    {
      "section": "source_and_meeting_identity",
      "check": "meeting_identity_confirmed",
      "status": "pass",
      "evidence": "meeting identity: attendees, date and meeting identity are confirmed from the source"
    },
    {
      "section": "source_and_meeting_identity",
      "check": "absent_attendees_named_when_relevant",
      "status": "pass",
      "evidence": "meeting identity: who was absent is named as well as who attended, when attendance matters to a decision"
    },
    {
      "section": "source_and_meeting_identity",
      "check": "speaker_attribution_kept_where_it_matters",
      "status": "pass",
      "evidence": "source: speaker attribution is kept where it matters for ownership"
    },
    {
      "section": "source_and_meeting_identity",
      "check": "numbers_dates_amounts_copied_exactly",
      "status": "pass",
      "evidence": "source: numbers, dates and amounts are copied exactly from the source, never rounded or tidied"
    },
    {
      "section": "source_and_meeting_identity",
      "check": "names_spelled_as_in_source_or_contacts",
      "status": "pass",
      "evidence": "source: names are spelled as in the source or the contacts, checked when a name is unclear"
    },
    {
      "section": "decisions_fidelity",
      "check": "decisions_stated_close_to_source_wording",
      "status": "pass",
      "evidence": "decisions: each decision is stated as it was actually made, close to the source's own wording"
    },
    {
      "section": "decisions_fidelity",
      "check": "inferred_items_labelled_as_inferred",
      "status": "pass",
      "evidence": "decisions: anything inferred is marked as inferred, not presented as settled"
    },
    {
      "section": "decisions_fidelity",
      "check": "decisions_declared",
      "status": "pass",
      "evidence": "the declared record names its decisions — the decisions list is present and non-empty"
    },
    {
      "section": "decisions_fidelity",
      "check": "every_decision_has_source_anchor",
      "status": "pass",
      "evidence": "decisions: every declared decision row carries a non-empty source anchor"
    },
    {
      "section": "decisions_fidelity",
      "check": "every_decision_faithful_to_source",
      "status": "pass",
      "evidence": "decisions: every declared decision row declares itself faithful to the source"
    },
    {
      "section": "decisions_fidelity",
      "check": "every_inferred_decision_marked",
      "status": "pass",
      "evidence": "decisions: every declared decision row that is inferred is marked as inferred"
    },
    {
      "section": "action_ownership_and_dates",
      "check": "owners_and_due_dates_drawn_from_source",
      "status": "pass",
      "evidence": "actions: each action's owner and due date are drawn from the source"
    },
    {
      "section": "action_ownership_and_dates",
      "check": "loose_deadlines_flagged_not_guessed",
      "status": "pass",
      "evidence": "actions: deadlines stated loosely in the meeting are flagged to pin, not guessed"
    },
    {
      "section": "action_ownership_and_dates",
      "check": "actions_declared",
      "status": "pass",
      "evidence": "the declared record names its action items — the actions list is present and non-empty"
    },
    {
      "section": "action_ownership_and_dates",
      "check": "every_action_has_named_owner",
      "status": "pass",
      "evidence": "actions: every declared action row carries a non-empty named owner"
    },
    {
      "section": "action_ownership_and_dates",
      "check": "every_action_has_due_date",
      "status": "pass",
      "evidence": "actions: every declared action row carries a non-empty due date"
    },
    {
      "section": "action_ownership_and_dates",
      "check": "every_action_has_source_anchor",
      "status": "pass",
      "evidence": "actions: every declared action row carries a non-empty source anchor"
    },
    {
      "section": "open_questions_and_carry_forward",
      "check": "unresolved_items_collected_separately",
      "status": "pass",
      "evidence": "open questions: anything raised and left unresolved is collected separately"
    },
    {
      "section": "open_questions_and_carry_forward",
      "check": "ownerless_we_should_listed_as_open_questions",
      "status": "pass",
      "evidence": "open questions: a \"we should\" with no owner is listed as an open question, not an action item"
    },
    {
      "section": "open_questions_and_carry_forward",
      "check": "prior_open_items_carried_forward_visibly",
      "status": "pass",
      "evidence": "open questions: a second meeting in a series carries its open items forward visibly"
    },
    {
      "section": "open_questions_and_carry_forward",
      "check": "open_questions_declared",
      "status": "pass",
      "evidence": "the declared record names its open questions — the open_questions list is present (an empty list declares that nothing is open)"
    },
    {
      "section": "open_questions_and_carry_forward",
      "check": "every_open_question_has_source_anchor",
      "status": "pass",
      "evidence": "open questions: every declared open-question row carries a non-empty source anchor"
    },
    {
      "section": "recap_draft_and_handoff",
      "check": "recap_decisions_first_then_actions_then_open_questions",
      "status": "pass",
      "evidence": "recap: the draft runs decisions first, then action items with owners and dates, then open questions"
    },
    {
      "section": "recap_draft_and_handoff",
      "check": "recap_concise_enough_to_be_read",
      "status": "pass",
      "evidence": "recap: the draft is short enough to actually be read"
    },
    {
      "section": "recap_draft_and_handoff",
      "check": "recap_shown_as_draft_before_any_send",
      "status": "pass",
      "evidence": "recap: the recap is shown as a draft; it goes nowhere until it is approved"
    },
    {
      "section": "recap_draft_and_handoff",
      "check": "confirmed_actions_handed_off_on_approval",
      "status": "pass",
      "evidence": "handoff: on approval, confirmed action items are handed off with their owners and dates"
    },
    {
      "section": "recap_draft_and_handoff",
      "check": "recap_sent_only_through_directed_channel_on_approval",
      "status": "pass",
      "evidence": "handoff: on approval, the recap is sent through the directed channel only"
    },
    {
      "section": "red_lines",
      "check": "no_inferred_decision_presented_as_made",
      "status": "pass",
      "evidence": "red line: no inferred decision is presented as one that was actually made"
    },
    {
      "section": "red_lines",
      "check": "no_invented_owner_or_due_date",
      "status": "pass",
      "evidence": "red line: no invented owner or due date the meeting did not set is present"
    },
    {
      "section": "red_lines",
      "check": "no_recap_sent_without_approval",
      "status": "pass",
      "evidence": "red line: the recap was not sent without approval for that send"
    },
    {
      "section": "red_lines",
      "check": "no_unresolved_question_dropped_for_cleanliness",
      "status": "pass",
      "evidence": "red line: no unresolved question was dropped because the recap reads cleaner without it"
    },
    {
      "section": "red_lines",
      "check": "no_disclosure_beyond_named_attendees",
      "status": "pass",
      "evidence": "red line: meeting contents go only to the attendees named — no disclosure beyond them is present"
    }
  ],
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
  "summary": "35 pass, 0 fail, 0 missing of 35 checks across six sections.",
  "stamp": "MEETING DECISIONS AND ACTIONS EXTRACT\nmeeting: Project Alpha Sync\nVERDICT: MEETING_EXTRACTION_SOUND\n  source_and_meeting_identity          pass\n  decisions_fidelity                   pass\n  action_ownership_and_dates           pass\n  open_questions_and_carry_forward     pass\n  recap_draft_and_handoff              pass\n  red_lines                            pass\n35 pass, 0 fail, 0 missing of 35 checks across six sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T07:35:40.750962+00:00 · gateway v1.1.0 · source `verification/work/meeting-decisions-and-actions-extract/evidence.json`.

Input:

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
      "source_anchor": "",
      "faithful_to_source": false,
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
      "owner": "",
      "due_date": "",
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

Response (HTTP 200):

```json
{
  "service": "meeting-decisions-and-actions-extract",
  "atom_version": "0.1.0",
  "meeting": "Project Alpha Sync",
  "verdict": "MEETING_EXTRACTION_NOT_SOUND",
  "sections": {
    "source_and_meeting_identity": "pass",
    "decisions_fidelity": "fail",
    "action_ownership_and_dates": "fail",
    "open_questions_and_carry_forward": "pass",
    "recap_draft_and_handoff": "pass",
    "red_lines": "pass"
  },
  "checks": [
    {
      "section": "source_and_meeting_identity",
      "check": "source_read_in_full",
      "status": "pass",
      "evidence": "source: the notes or transcript were read in full, end to end, before extraction"
    },
    {
      "section": "source_and_meeting_identity",
      "check": "attendees_recorded",
      "status": "pass",
      "evidence": "meeting identity: who attended is recorded from the source"
    },
    {
      "section": "source_and_meeting_identity",
      "check": "meeting_date_recorded",
      "status": "pass",
      "evidence": "meeting identity: when the meeting happened is recorded from the source"
    },
    {
      "section": "source_and_meeting_identity",
      "check": "meeting_identity_confirmed",
      "status": "pass",
      "evidence": "meeting identity: attendees, date and meeting identity are confirmed from the source"
    },
    {
      "section": "source_and_meeting_identity",
      "check": "absent_attendees_named_when_relevant",
      "status": "pass",
      "evidence": "meeting identity: who was absent is named as well as who attended, when attendance matters to a decision"
    },
    {
      "section": "source_and_meeting_identity",
      "check": "speaker_attribution_kept_where_it_matters",
      "status": "pass",
      "evidence": "source: speaker attribution is kept where it matters for ownership"
    },
    {
      "section": "source_and_meeting_identity",
      "check": "numbers_dates_amounts_copied_exactly",
      "status": "pass",
      "evidence": "source: numbers, dates and amounts are copied exactly from the source, never rounded or tidied"
    },
    {
      "section": "source_and_meeting_identity",
      "check": "names_spelled_as_in_source_or_contacts",
      "status": "pass",
      "evidence": "source: names are spelled as in the source or the contacts, checked when a name is unclear"
    },
    {
      "section": "decisions_fidelity",
      "check": "decisions_stated_close_to_source_wording",
      "status": "pass",
      "evidence": "decisions: each decision is stated as it was actually made, close to the source's own wording"
    },
    {
      "section": "decisions_fidelity",
      "check": "inferred_items_labelled_as_inferred",
      "status": "pass",
      "evidence": "decisions: anything inferred is marked as inferred, not presented as settled"
    },
    {
      "section": "decisions_fidelity",
      "check": "decisions_declared",
      "status": "pass",
      "evidence": "the declared record names its decisions — the decisions list is present and non-empty"
    },
    {
      "section": "decisions_fidelity",
      "check": "every_decision_has_source_anchor",
      "status": "fail",
      "evidence": "decisions: every declared decision row carries a non-empty source anchor"
    },
    {
      "section": "decisions_fidelity",
      "check": "every_decision_faithful_to_source",
      "status": "fail",
      "evidence": "decisions: every declared decision row declares itself faithful to the source"
    },
    {
      "section": "decisions_fidelity",
      "check": "every_inferred_decision_marked",
      "status": "pass",
      "evidence": "decisions: every declared decision row that is inferred is marked as inferred"
    },
    {
      "section": "action_ownership_and_dates",
      "check": "owners_and_due_dates_drawn_from_source",
      "status": "pass",
      "evidence": "actions: each action's owner and due date are drawn from the source"
    },
    {
      "section": "action_ownership_and_dates",
      "check": "loose_deadlines_flagged_not_guessed",
      "status": "pass",
      "evidence": "actions: deadlines stated loosely in the meeting are flagged to pin, not guessed"
    },
    {
      "section": "action_ownership_and_dates",
      "check": "actions_declared",
      "status": "pass",
      "evidence": "the declared record names its action items — the actions list is present and non-empty"
    },
    {
      "section": "action_ownership_and_dates",
      "check": "every_action_has_named_owner",
      "status": "fail",
      "evidence": "actions: every declared action row carries a non-empty named owner"
    },
    {
      "section": "action_ownership_and_dates",
      "check": "every_action_has_due_date",
      "status": "fail",
      "evidence": "actions: every declared action row carries a non-empty due date"
    },
    {
      "section": "action_ownership_and_dates",
      "check": "every_action_has_source_anchor",
      "status": "pass",
      "evidence": "actions: every declared action row carries a non-empty source anchor"
    },
    {
      "section": "open_questions_and_carry_forward",
      "check": "unresolved_items_collected_separately",
      "status": "pass",
      "evidence": "open questions: anything raised and left unresolved is collected separately"
    },
    {
      "section": "open_questions_and_carry_forward",
      "check": "ownerless_we_should_listed_as_open_questions",
      "status": "pass",
      "evidence": "open questions: a \"we should\" with no owner is listed as an open question, not an action item"
    },
    {
      "section": "open_questions_and_carry_forward",
      "check": "prior_open_items_carried_forward_visibly",
      "status": "pass",
      "evidence": "open questions: a second meeting in a series carries its open items forward visibly"
    },
    {
      "section": "open_questions_and_carry_forward",
      "check": "open_questions_declared",
      "status": "pass",
      "evidence": "the declared record names its open questions — the open_questions list is present (an empty list declares that nothing is open)"
    },
    {
      "section": "open_questions_and_carry_forward",
      "check": "every_open_question_has_source_anchor",
      "status": "pass",
      "evidence": "open questions: every declared open-question row carries a non-empty source anchor"
    },
    {
      "section": "recap_draft_and_handoff",
      "check": "recap_decisions_first_then_actions_then_open_questions",
      "status": "pass",
      "evidence": "recap: the draft runs decisions first, then action items with owners and dates, then open questions"
    },
    {
      "section": "recap_draft_and_handoff",
      "check": "recap_concise_enough_to_be_read",
      "status": "pass",
      "evidence": "recap: the draft is short enough to actually be read"
    },
    {
      "section": "recap_draft_and_handoff",
      "check": "recap_shown_as_draft_before_any_send",
      "status": "pass",
      "evidence": "recap: the recap is shown as a draft; it goes nowhere until it is approved"
    },
    {
      "section": "recap_draft_and_handoff",
      "check": "confirmed_actions_handed_off_on_approval",
      "status": "pass",
      "evidence": "handoff: on approval, confirmed action items are handed off with their owners and dates"
    },
    {
      "section": "recap_draft_and_handoff",
      "check": "recap_sent_only_through_directed_channel_on_approval",
      "status": "pass",
      "evidence": "handoff: on approval, the recap is sent through the directed channel only"
    },
    {
      "section": "red_lines",
      "check": "no_inferred_decision_presented_as_made",
      "status": "pass",
      "evidence": "red line: no inferred decision is presented as one that was actually made"
    },
    {
      "section": "red_lines",
      "check": "no_invented_owner_or_due_date",
      "status": "pass",
      "evidence": "red line: no invented owner or due date the meeting did not set is present"
    },
    {
      "section": "red_lines",
      "check": "no_recap_sent_without_approval",
      "status": "pass",
      "evidence": "red line: the recap was not sent without approval for that send"
    },
    {
      "section": "red_lines",
      "check": "no_unresolved_question_dropped_for_cleanliness",
      "status": "pass",
      "evidence": "red line: no unresolved question was dropped because the recap reads cleaner without it"
    },
    {
      "section": "red_lines",
      "check": "no_disclosure_beyond_named_attendees",
      "status": "pass",
      "evidence": "red line: meeting contents go only to the attendees named — no disclosure beyond them is present"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "decisions_count": 1,
  "decisions_without_source_anchor": [
    "Launch Q3"
  ],
  "decision_anchor_coverage": "0.000000",
  "decisions_not_faithful": [
    "Launch Q3"
  ],
  "decision_faithful_coverage": "0.000000",
  "inferred_decisions_unmarked": [],
  "inferred_marking_coverage": null,
  "actions_count": 1,
  "actions_without_owner": [
    "Send email"
  ],
  "action_owner_coverage": "0.000000",
  "actions_without_due_date": [
    "Send email"
  ],
  "action_due_date_coverage": "0.000000",
  "actions_without_source_anchor": [],
  "action_anchor_coverage": "1.000000",
  "open_questions_count": 1,
  "open_questions_without_source_anchor": [],
  "open_question_anchor_coverage": "1.000000",
  "summary": "31 pass, 4 fail, 0 missing of 35 checks across six sections.",
  "stamp": "MEETING DECISIONS AND ACTIONS EXTRACT\nmeeting: Project Alpha Sync\nVERDICT: MEETING_EXTRACTION_NOT_SOUND\n  source_and_meeting_identity          pass\n  decisions_fidelity                   fail\n  action_ownership_and_dates           fail\n  open_questions_and_carry_forward     pass\n  recap_draft_and_handoff              pass\n  red_lines                            pass\n31 pass, 4 fail, 0 missing of 35 checks across six sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T07:35:40.750962+00:00 · gateway v1.1.0 · source `verification/work/meeting-decisions-and-actions-extract/evidence.json`.

Input:

```json
{
  "meeting": 12345,
  "source": {}
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "meeting",
  "detail": "meeting must be a string"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared meeting extraction record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence, not a meeting-notes service, a transcription or extraction engine or a guarantee that the extraction is substantively correct, and it verifies no declared fact against the source. |
| Checks named | 35 documented / 35 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses, plus the secondary computed fields (the three counts, the seven row-name lists and the seven coverage ratios) |
| Input reference typed | Yes — 50 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type, grounded in the recorded evidence inputs and said so |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/meeting-decisions-and-actions-extract/evidence.json` |
