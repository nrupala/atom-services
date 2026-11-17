#!/usr/bin/env python3
"""Meeting decisions and actions extract — deterministic core.

Built from the bound skill `meeting-follow-up`: "Turn meeting
notes or a transcript into decisions, owned action items, open
questions, and a recap draft ready for your approval."

This atom is an AUDIT of a declared extraction record: it
validates the record a caller declares was extracted from one
meeting — the decisions, action items and open questions, with
their owners, due dates and source anchors as declared —
against the skill's method, quality gates and red lines. It
does not parse notes or a transcript, extract anything itself,
read contacts or calendars, draft or send a recap, or verify
that a declared item really appears in the source — it checks
that the record the skill requires is present and internally
complete and consistent on the declared evidence.

The caller submits an extraction manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- decisions: the declared `decisions` list must be non-empty,
  and every declared decision row must carry a non-empty source
  anchor and declare itself faithful to the source;
- inferred decisions: every row declared inferred must also be
  declared marked as inferred (the skill: mark anything
  inferred as inferred; red line: never present an inferred
  decision as one that was actually made);
- actions: the declared `actions` list must be non-empty, and
  every declared action row must carry a non-empty named owner,
  a non-empty due date and a non-empty source anchor (quality
  gate: every action item carries a named owner and a due date,
  or sits in open questions — an ownerless or undated row does
  not belong in the actions list);
- open questions: the declared `open_questions` list must be
  present (an empty list is a valid declaration that nothing is
  open), and every declared open-question row must carry a
  non-empty source anchor.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold — no minimum number of
decisions, actions or questions, no recap word count, no
response-time or follow-up deadline — so no numeric threshold
check is invented; quantities are computed and reported, with
completeness (every declared row) as the only bar, exactly as
stated above.

Verdict:
- any fail             -> MEETING_EXTRACTION_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> MEETING_EXTRACTION_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "source_and_meeting_identity",
    "decisions_fidelity",
    "action_ownership_and_dates",
    "open_questions_and_carry_forward",
    "recap_draft_and_handoff",
    "red_lines",
)

MANIFEST_SPEC = {
    "meeting": "string",
    "source": {
        "read_in_full": "boolean",
        "attendees_recorded": "boolean",
        "meeting_date_recorded": "boolean",
        "meeting_identity_confirmed": "boolean",
        "absent_attendees_named_when_relevant": "boolean",
        "speaker_attribution_kept_where_it_matters": "boolean",
        "numbers_dates_amounts_copied_exactly": "boolean",
        "names_spelled_as_in_source_or_contacts": "boolean",
    },
    "decisions_record": {
        "decisions_stated_close_to_source_wording": "boolean",
        "inferred_items_labelled_as_inferred": "boolean",
    },
    "decisions": [{
        "name": "string",
        "source_anchor": "string",
        "faithful_to_source": "boolean",
        "is_inferred": "boolean",
        "inference_marked": "boolean",
    }],
    "actions_record": {
        "owners_and_due_dates_drawn_from_source": "boolean",
        "loose_deadlines_flagged_not_guessed": "boolean",
    },
    "actions": [{
        "name": "string",
        "owner": "string",
        "due_date": "string",
        "source_anchor": "string",
    }],
    "open_questions_record": {
        "unresolved_items_collected_separately": "boolean",
        "ownerless_we_should_listed_as_open_questions": "boolean",
        "prior_open_items_carried_forward_visibly": "boolean",
    },
    "open_questions": [{
        "name": "string",
        "source_anchor": "string",
    }],
    "recap": {
        "decisions_first_then_actions_then_open_questions": "boolean",
        "concise_enough_to_be_read": "boolean",
        "shown_as_draft_before_any_send": "boolean",
    },
    "handoff": {
        "confirmed_actions_handed_off_with_owners_and_dates_on_approval": "boolean",
        "recap_sent_only_through_directed_channel_on_approval": "boolean",
    },
    "red_lines": {
        "inferred_decision_presented_as_made_present": "boolean",
        "invented_owner_or_due_date_present": "boolean",
        "recap_sent_without_approval_present": "boolean",
        "unresolved_question_dropped_for_cleanliness_present": "boolean",
        "meeting_contents_disclosed_beyond_named_attendees_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise TypeError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise TypeError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise TypeError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise TypeError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise TypeError(f"{path} must be an object")
        _validate_fields(value, spec, path)
        return
    raise AssertionError(f"unknown manifest spec at {path}")


def _validate_fields(obj, spec, prefix):
    for field, field_spec in spec.items():
        if field not in obj:
            continue
        value = obj[field]
        path = f"{prefix}.{field}" if prefix else field
        _validate_value(value, field_spec, path)


def _validate_manifest(manifest):
    _validate_fields(manifest, MANIFEST_SPEC, "")


def _get(manifest, *path):
    cur = manifest
    for key in path:
        if not isinstance(cur, dict) or key not in cur:
            return None, False
        cur = cur[key]
    return cur, True


def _check(results, section, name, value, present, ok, evidence):
    if not present:
        status = "missing"
    else:
        status = "pass" if ok else "fail"
    results.append(
        {"section": section, "check": name, "status": status,
         "evidence": evidence}
    )


def _bool_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is True, evidence)


def _false_check(results, section, name, manifest, path, evidence):
    value, present = _get(manifest, *path)
    _check(results, section, name, value, present, value is False,
           evidence)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def _nonempty(entry, field):
    return (isinstance(entry, dict)
            and isinstance(entry.get(field), str)
            and entry.get(field) != "")


def evaluate(manifest):
    """Return the verdict dict for a meeting extraction manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    decisions, has_decisions = _get(manifest, "decisions")
    decisions_is_list = has_decisions and isinstance(decisions, list)
    decisions_count = len(decisions) if decisions_is_list else None
    d_rows = decisions if decisions_is_list else []

    actions, has_actions = _get(manifest, "actions")
    actions_is_list = has_actions and isinstance(actions, list)
    actions_count = len(actions) if actions_is_list else None
    a_rows = actions if actions_is_list else []

    open_questions, has_open_questions = _get(manifest, "open_questions")
    oq_is_list = has_open_questions and isinstance(open_questions, list)
    oq_count = len(open_questions) if oq_is_list else None
    q_rows = open_questions if oq_is_list else []

    decisions_without_source_anchor = (
        [_row_name(c) for c in d_rows
         if isinstance(c, dict)
         and "source_anchor" in c
         and not _nonempty(c, "source_anchor")]
        if decisions_is_list else None
    )
    decisions_not_faithful = (
        [_row_name(c) for c in d_rows
         if isinstance(c, dict)
         and "faithful_to_source" in c
         and c.get("faithful_to_source") is not True]
        if decisions_is_list else None
    )
    inferred_decisions_unmarked = (
        [_row_name(c) for c in d_rows
         if isinstance(c, dict)
         and c.get("is_inferred") is True
         and "inference_marked" in c
         and c.get("inference_marked") is not True]
        if decisions_is_list else None
    )
    inferred_count = (
        sum(1 for c in d_rows
            if isinstance(c, dict) and c.get("is_inferred") is True)
        if decisions_is_list else None
    )
    actions_without_owner = (
        [_row_name(c) for c in a_rows
         if isinstance(c, dict)
         and "owner" in c
         and not _nonempty(c, "owner")]
        if actions_is_list else None
    )
    actions_without_due_date = (
        [_row_name(c) for c in a_rows
         if isinstance(c, dict)
         and "due_date" in c
         and not _nonempty(c, "due_date")]
        if actions_is_list else None
    )
    actions_without_source_anchor = (
        [_row_name(c) for c in a_rows
         if isinstance(c, dict)
         and "source_anchor" in c
         and not _nonempty(c, "source_anchor")]
        if actions_is_list else None
    )
    open_questions_without_source_anchor = (
        [_row_name(c) for c in q_rows
         if isinstance(c, dict)
         and "source_anchor" in c
         and not _nonempty(c, "source_anchor")]
        if oq_is_list else None
    )
    decision_anchor_coverage = (
        sum(1 for c in d_rows if _nonempty(c, "source_anchor"))
        / decisions_count
        if decisions_is_list and decisions_count > 0 else None
    )
    decision_faithful_coverage = (
        sum(1 for c in d_rows
            if isinstance(c, dict)
            and c.get("faithful_to_source") is True)
        / decisions_count
        if decisions_is_list and decisions_count > 0 else None
    )
    inferred_marking_coverage = (
        sum(1 for c in d_rows
            if isinstance(c, dict)
            and c.get("is_inferred") is True
            and c.get("inference_marked") is True)
        / inferred_count
        if decisions_is_list and inferred_count is not None
        and inferred_count > 0 else None
    )
    action_owner_coverage = (
        sum(1 for c in a_rows if _nonempty(c, "owner"))
        / actions_count
        if actions_is_list and actions_count > 0 else None
    )
    action_due_date_coverage = (
        sum(1 for c in a_rows if _nonempty(c, "due_date"))
        / actions_count
        if actions_is_list and actions_count > 0 else None
    )
    action_anchor_coverage = (
        sum(1 for c in a_rows if _nonempty(c, "source_anchor"))
        / actions_count
        if actions_is_list and actions_count > 0 else None
    )
    open_question_anchor_coverage = (
        sum(1 for c in q_rows if _nonempty(c, "source_anchor"))
        / oq_count
        if oq_is_list and oq_count > 0 else None
    )

    # ---- Section 1: source_and_meeting_identity (skill method
    #      step 1 and quality gate — source read end to end;
    #      attendees, date and meeting identity confirmed from
    #      the source; absentees named when relevant; speaker
    #      attribution kept; numbers, dates and amounts copied
    #      exactly; names spelled as in the source or contacts)
    _bool_check(results, "source_and_meeting_identity",
                "source_read_in_full", manifest,
                ("source", "read_in_full"),
                "source: the notes or transcript were read in "
                "full, end to end, before extraction")
    _bool_check(results, "source_and_meeting_identity",
                "attendees_recorded", manifest,
                ("source", "attendees_recorded"),
                "meeting identity: who attended is recorded from "
                "the source")
    _bool_check(results, "source_and_meeting_identity",
                "meeting_date_recorded", manifest,
                ("source", "meeting_date_recorded"),
                "meeting identity: when the meeting happened is "
                "recorded from the source")
    _bool_check(results, "source_and_meeting_identity",
                "meeting_identity_confirmed", manifest,
                ("source", "meeting_identity_confirmed"),
                "meeting identity: attendees, date and meeting "
                "identity are confirmed from the source")
    _bool_check(results, "source_and_meeting_identity",
                "absent_attendees_named_when_relevant", manifest,
                ("source", "absent_attendees_named_when_relevant"),
                "meeting identity: who was absent is named as "
                "well as who attended, when attendance matters "
                "to a decision")
    _bool_check(results, "source_and_meeting_identity",
                "speaker_attribution_kept_where_it_matters",
                manifest,
                ("source",
                 "speaker_attribution_kept_where_it_matters"),
                "source: speaker attribution is kept where it "
                "matters for ownership")
    _bool_check(results, "source_and_meeting_identity",
                "numbers_dates_amounts_copied_exactly", manifest,
                ("source", "numbers_dates_amounts_copied_exactly"),
                "source: numbers, dates and amounts are copied "
                "exactly from the source, never rounded or tidied")
    _bool_check(results, "source_and_meeting_identity",
                "names_spelled_as_in_source_or_contacts", manifest,
                ("source", "names_spelled_as_in_source_or_contacts"),
                "source: names are spelled as in the source or "
                "the contacts, checked when a name is unclear")

    # ---- Section 2: decisions_fidelity (skill method steps
    #      2-3 and quality gate — decisions stated as actually
    #      made, close to the source's own wording; inferred
    #      items explicitly marked as inferred) ----
    _bool_check(results, "decisions_fidelity",
                "decisions_stated_close_to_source_wording", manifest,
                ("decisions_record",
                 "decisions_stated_close_to_source_wording"),
                "decisions: each decision is stated as it was "
                "actually made, close to the source's own wording")
    _bool_check(results, "decisions_fidelity",
                "inferred_items_labelled_as_inferred", manifest,
                ("decisions_record",
                 "inferred_items_labelled_as_inferred"),
                "decisions: anything inferred is marked as "
                "inferred, not presented as settled")
    _check(results, "decisions_fidelity",
           "decisions_declared", decisions, decisions_is_list,
           decisions_is_list and decisions_count > 0,
           "the declared record names its decisions — the "
           "decisions list is present and non-empty")
    anchor_present = (
        decisions_is_list
        and all(isinstance(c, dict) and "source_anchor" in c
                for c in d_rows)
    )
    _check(results, "decisions_fidelity",
           "every_decision_has_source_anchor", decisions,
           anchor_present,
           decisions_is_list and decisions_count > 0
           and all(_nonempty(c, "source_anchor") for c in d_rows),
           "decisions: every declared decision row carries a "
           "non-empty source anchor")
    faithful_present = (
        decisions_is_list
        and all(isinstance(c, dict) and "faithful_to_source" in c
                for c in d_rows)
    )
    _check(results, "decisions_fidelity",
           "every_decision_faithful_to_source", decisions,
           faithful_present,
           decisions_is_list and decisions_count > 0
           and all(isinstance(c, dict)
                   and c.get("faithful_to_source") is True
                   for c in d_rows),
           "decisions: every declared decision row declares "
           "itself faithful to the source")
    inferred_present = (
        decisions_is_list
        and all(isinstance(c, dict) and "is_inferred" in c
                and (c.get("is_inferred") is not True
                     or "inference_marked" in c)
                for c in d_rows)
    )
    _check(results, "decisions_fidelity",
           "every_inferred_decision_marked", decisions,
           inferred_present,
           decisions_is_list and decisions_count > 0
           and all(isinstance(c, dict)
                   and (c.get("is_inferred") is not True
                        or c.get("inference_marked") is True)
                   for c in d_rows),
           "decisions: every declared decision row that is "
           "inferred is marked as inferred")

    # ---- Section 3: action_ownership_and_dates (skill method
    #      steps 4-5 and quality gate — every action item
    #      carries a named owner and a due date drawn from the
    #      source, or sits in open questions; loose deadlines
    #      are flagged, not guessed) ----
    _bool_check(results, "action_ownership_and_dates",
                "owners_and_due_dates_drawn_from_source", manifest,
                ("actions_record",
                 "owners_and_due_dates_drawn_from_source"),
                "actions: each action's owner and due date are "
                "drawn from the source")
    _bool_check(results, "action_ownership_and_dates",
                "loose_deadlines_flagged_not_guessed", manifest,
                ("actions_record",
                 "loose_deadlines_flagged_not_guessed"),
                "actions: deadlines stated loosely in the "
                "meeting are flagged to pin, not guessed")
    _check(results, "action_ownership_and_dates",
           "actions_declared", actions, actions_is_list,
           actions_is_list and actions_count > 0,
           "the declared record names its action items — the "
           "actions list is present and non-empty")
    owner_present = (
        actions_is_list
        and all(isinstance(c, dict) and "owner" in c for c in a_rows)
    )
    _check(results, "action_ownership_and_dates",
           "every_action_has_named_owner", actions, owner_present,
           actions_is_list and actions_count > 0
           and all(_nonempty(c, "owner") for c in a_rows),
           "actions: every declared action row carries a "
           "non-empty named owner")
    due_present = (
        actions_is_list
        and all(isinstance(c, dict) and "due_date" in c
                for c in a_rows)
    )
    _check(results, "action_ownership_and_dates",
           "every_action_has_due_date", actions, due_present,
           actions_is_list and actions_count > 0
           and all(_nonempty(c, "due_date") for c in a_rows),
           "actions: every declared action row carries a "
           "non-empty due date")
    a_anchor_present = (
        actions_is_list
        and all(isinstance(c, dict) and "source_anchor" in c
                for c in a_rows)
    )
    _check(results, "action_ownership_and_dates",
           "every_action_has_source_anchor", actions,
           a_anchor_present,
           actions_is_list and actions_count > 0
           and all(_nonempty(c, "source_anchor") for c in a_rows),
           "actions: every declared action row carries a "
           "non-empty source anchor")

    # ---- Section 4: open_questions_and_carry_forward (skill
    #      method steps 5-6 and when-to-use — genuine open
    #      questions collected separately, including ownerless
    #      "we should" items; a series' open items carried
    #      forward visibly) ----
    _bool_check(results, "open_questions_and_carry_forward",
                "unresolved_items_collected_separately", manifest,
                ("open_questions_record",
                 "unresolved_items_collected_separately"),
                "open questions: anything raised and left "
                "unresolved is collected separately")
    _bool_check(results, "open_questions_and_carry_forward",
                "ownerless_we_should_listed_as_open_questions",
                manifest,
                ("open_questions_record",
                 "ownerless_we_should_listed_as_open_questions"),
                "open questions: a \"we should\" with no owner "
                "is listed as an open question, not an action item")
    _bool_check(results, "open_questions_and_carry_forward",
                "prior_open_items_carried_forward_visibly", manifest,
                ("open_questions_record",
                 "prior_open_items_carried_forward_visibly"),
                "open questions: a second meeting in a series "
                "carries its open items forward visibly")
    _check(results, "open_questions_and_carry_forward",
           "open_questions_declared", open_questions, oq_is_list,
           oq_is_list,
           "the declared record names its open questions — "
           "the open_questions list is present (an empty list "
           "declares that nothing is open)")
    q_anchor_present = (
        oq_is_list
        and all(isinstance(c, dict) and "source_anchor" in c
                for c in q_rows)
    )
    _check(results, "open_questions_and_carry_forward",
           "every_open_question_has_source_anchor", open_questions,
           q_anchor_present,
           oq_is_list
           and all(_nonempty(c, "source_anchor") for c in q_rows),
           "open questions: every declared open-question row "
           "carries a non-empty source anchor")

    # ---- Section 5: recap_draft_and_handoff (skill method
    #      steps 7-9 and quality gate — recap drafted in the
    #      agreed writing voice, decisions first, then actions
    #      with owners and dates, then open questions, short
    #      enough to be read, shown as a draft before any send;
    #      on approval, confirmed actions handed off with their
    #      owners and dates and the recap sent as directed) ----
    _bool_check(results, "recap_draft_and_handoff",
                "recap_decisions_first_then_actions_then_open_questions",
                manifest,
                ("recap",
                 "decisions_first_then_actions_then_open_questions"),
                "recap: the draft runs decisions first, then "
                "action items with owners and dates, then open "
                "questions")
    _bool_check(results, "recap_draft_and_handoff",
                "recap_concise_enough_to_be_read", manifest,
                ("recap", "concise_enough_to_be_read"),
                "recap: the draft is short enough to actually "
                "be read")
    _bool_check(results, "recap_draft_and_handoff",
                "recap_shown_as_draft_before_any_send", manifest,
                ("recap", "shown_as_draft_before_any_send"),
                "recap: the recap is shown as a draft; it goes "
                "nowhere until it is approved")
    _bool_check(results, "recap_draft_and_handoff",
                "confirmed_actions_handed_off_on_approval", manifest,
                ("handoff",
                 "confirmed_actions_handed_off_with_owners_and_dates_on_approval"),
                "handoff: on approval, confirmed action items "
                "are handed off with their owners and dates")
    _bool_check(results, "recap_draft_and_handoff",
                "recap_sent_only_through_directed_channel_on_approval",
                manifest,
                ("handoff",
                 "recap_sent_only_through_directed_channel_on_approval"),
                "handoff: on approval, the recap is sent through "
                "the directed channel only")

    # ---- Section 6: red_lines (skill red lines — never present
    #      an inferred decision as made, never invent an owner
    #      or due date, never send the recap without approval,
    #      never drop an unresolved question for cleanliness,
    #      meeting contents go only to named attendees) ----
    _false_check(results, "red_lines",
                 "no_inferred_decision_presented_as_made", manifest,
                 ("red_lines",
                  "inferred_decision_presented_as_made_present"),
                 "red line: no inferred decision is presented "
                 "as one that was actually made")
    _false_check(results, "red_lines",
                 "no_invented_owner_or_due_date", manifest,
                 ("red_lines", "invented_owner_or_due_date_present"),
                 "red line: no invented owner or due date the "
                 "meeting did not set is present")
    _false_check(results, "red_lines",
                 "no_recap_sent_without_approval", manifest,
                 ("red_lines",
                  "recap_sent_without_approval_present"),
                 "red line: the recap was not sent without "
                 "approval for that send")
    _false_check(results, "red_lines",
                 "no_unresolved_question_dropped_for_cleanliness",
                 manifest,
                 ("red_lines",
                  "unresolved_question_dropped_for_cleanliness_present"),
                 "red line: no unresolved question was dropped "
                 "because the recap reads cleaner without it")
    _false_check(results, "red_lines",
                 "no_disclosure_beyond_named_attendees", manifest,
                 ("red_lines",
                  "meeting_contents_disclosed_beyond_named_attendees_present"),
                 "red line: meeting contents go only to the "
                 "attendees named — no disclosure beyond them "
                 "is present")

    sections = {}
    for section in SECTIONS:
        sec_results = [r for r in results if r["section"] == section]
        if any(r["status"] == "fail" for r in sec_results):
            sections[section] = "fail"
        elif any(r["status"] == "missing" for r in sec_results):
            sections[section] = "insufficient_evidence"
        else:
            sections[section] = "pass"

    if any(v == "fail" for v in sections.values()):
        verdict = "MEETING_EXTRACTION_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "MEETING_EXTRACTION_SOUND"

    computed_names = (
        "decisions_declared",
        "every_decision_has_source_anchor",
        "every_decision_faithful_to_source",
        "every_inferred_decision_marked",
        "actions_declared",
        "every_action_has_named_owner",
        "every_action_has_due_date",
        "every_action_has_source_anchor",
        "open_questions_declared",
        "every_open_question_has_source_anchor",
    )
    computed_statuses = [
        r["status"] for r in results if r["check"] in computed_names
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "meeting-decisions-and-actions-extract",
        "atom_version": "0.1.0",
        "meeting": manifest.get("meeting"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "decisions_count": decisions_count,
        "decisions_without_source_anchor": decisions_without_source_anchor,
        "decision_anchor_coverage": _fmt6(decision_anchor_coverage),
        "decisions_not_faithful": decisions_not_faithful,
        "decision_faithful_coverage": _fmt6(decision_faithful_coverage),
        "inferred_decisions_unmarked": inferred_decisions_unmarked,
        "inferred_marking_coverage": _fmt6(inferred_marking_coverage),
        "actions_count": actions_count,
        "actions_without_owner": actions_without_owner,
        "action_owner_coverage": _fmt6(action_owner_coverage),
        "actions_without_due_date": actions_without_due_date,
        "action_due_date_coverage": _fmt6(action_due_date_coverage),
        "actions_without_source_anchor": actions_without_source_anchor,
        "action_anchor_coverage": _fmt6(action_anchor_coverage),
        "open_questions_count": oq_count,
        "open_questions_without_source_anchor": open_questions_without_source_anchor,
        "open_question_anchor_coverage": _fmt6(open_question_anchor_coverage),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across six sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "MEETING DECISIONS AND ACTIONS EXTRACT",
        f"meeting: {verdict.get('meeting')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: meeting_decisions_and_actions_extract.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "MEETING_EXTRACTION_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
