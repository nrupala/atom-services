#!/usr/bin/env python3
"""Negotiation preparation pack — deterministic core.

Built from the bound skill `negotiation`: "Two layers: the
**fundamentals** you prepare, and the **improvisation** you do
live. Michael Wheeler's insight (*The Art of Negotiation*) is
that real negotiations are chaotic and nonlinear — you need a
sense of direction AND the agility to adapt, like a jazz
musician, not a rigid script."

This atom is a REVIEW of a declared negotiation-preparation
record: it audits the record a caller declares against the
preparation the skill defines — a BATNA known and strengthened,
a reservation price and the ZOPA, interests not positions,
value created before it is claimed, a sense of direction with
a Plan B (and C), presence of mind and situational awareness,
openings to critical moments to a clean closing, the skill's
tactics and guardrails, a debrief planned, and the skill's
anti-patterns refused. It does not prepare a negotiation
itself, negotiate, coach live improvisation, read the
counterpart, or verify that a declared preparation was ever
carried out — it checks that the preparation record the skill
requires is present and internally complete and consistent on
the declared evidence.

Distinct ground: the nearest sibling is the deployed
`difficult-conversation-coaching` (bound skill
`emotional-intelligence-manager`), which coaches a declared
record for one difficult conversation — naming and regulating
one's own emotion, empathy for the counterpart, framing and
assertiveness in the conversation, SBI-structured feedback
points, and safeguards/repair for that conversation. This atom
is about a NEGOTIATION's preparation, not a conversation's
conduct: every check here is a negotiation-preparation question
(BATNA identified and strengthened, a reservation price set and
a ZOPA assessed, interests behind positions on the declared
issue rows, value created before claiming, fallback plans B
and C carried, anchoring decided on information, a fair-enough
agreement aimed for, a debrief planned against misleading
feedback), and zero checks are shared with that atom. The
`decision-process-design` sibling designs a decision process
(criteria set before data, loss costs, reversibility) — it
shares no check with this atom either.

The caller submits a preparation manifest (a dict, or JSON on
the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- issues: the declared `issues` list must be non-empty, and
  every declared issue row must name the caller's own
  underlying interest and the counterpart's underlying interest
  (the skill: "negotiate the underlying interest, not the
  stated demand. Ask *why* they want what they ask for") and
  must have its trade potential assessed (the skill: "Trade
  across issues you each value differently");
- issue-name ownership: no declared issue name may be owned by
  more than one issue row (one primary record per issue —
  internal consistency of the declared rows).

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact).

The skill states no numeric threshold — no reservation-price
figure, no ZOPA width, no BATNA strength score, no number of
issues or fallback plans beyond the stated Plan B (and C), no
coverage percentage — so no numeric threshold check is
invented; those quantities are caller attestations at most,
and quantities here are computed and reported, with
completeness (every declared issue row) as the only bar,
exactly as stated above.

Verdict:
- any fail             -> NEGOTIATION_PREPARATION_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> NEGOTIATION_PREPARATION_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "batna_reservation_price_and_zopa",
    "interests_and_value_creation",
    "improvisation_and_adaptation",
    "openings_moments_closing_and_tactics",
    "debrief_and_anti_pattern_red_lines",
)

MANIFEST_SPEC = {
    "negotiation": "string",
    "batna_and_reservation": {
        "batna_identified": "boolean",
        "batna_strengthened": "boolean",
        "reservation_price_set": "boolean",
        "counterpart_reservation_estimated": "boolean",
        "zopa_assessed": "boolean",
        "walk_away_commitment_declared": "boolean",
        "fundamentals_prepared_before_negotiation": "boolean",
    },
    "interests": {
        "own_interests_identified": "boolean",
        "counterpart_interests_identified": "boolean",
        "counterpart_why_to_be_asked_planned": "boolean",
        "interests_not_positions_framing_adopted": "boolean",
    },
    "value_creation": {
        "value_created_before_claiming_planned": "boolean",
        "non_zero_sum_opportunities_sought": "boolean",
        "trade_across_differently_valued_issues_planned": "boolean",
    },
    "issues": [{
        "name": "string",
        "own_underlying_interest": "string",
        "counterpart_underlying_interest": "string",
        "trade_potential_assessed": "boolean",
    }],
    "direction": {
        "sense_of_direction_stated": "boolean",
        "plan_not_script_approach_adopted": "boolean",
        "plan_b_prepared": "boolean",
        "plan_c_prepared": "boolean",
    },
    "presence_and_awareness": {
        "own_emotional_state_management_planned": "boolean",
        "composure_commitment_declared": "boolean",
        "situational_awareness_planned": "boolean",
    },
    "sequence": {
        "opening_planned": "boolean",
        "critical_moments_recognition_planned": "boolean",
        "closing_cleanly_planned": "boolean",
    },
    "anchoring": {
        "informed_enough_to_anchor_first": "boolean",
        "anchor_first_planned": "boolean",
    },
    "tactics": {
        "counterpart_yes_made_easy_planned": "boolean",
        "people_separated_from_problem_declared": "boolean",
        "hard_on_problem_soft_on_person_declared": "boolean",
        "fair_enough_agreement_aim_declared": "boolean",
    },
    "learning": {
        "debrief_planned_after_negotiation": "boolean",
        "deliberate_debrief_review_committed": "boolean",
        "misleading_feedback_caution_acknowledged": "boolean",
    },
    "red_lines": {
        "no_batna_present": "boolean",
        "arguing_positions_present": "boolean",
        "treating_everything_as_zero_sum_present": "boolean",
        "rigid_script_reliance_present": "boolean",
        "losing_composure_present": "boolean",
        "never_debriefing_present": "boolean",
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


def _gated_anchor_check(results, section, name, manifest, field,
                        evidence):
    """Anchoring check gated on the declared information flag.

    Missing gate or missing field -> missing evidence. Gate
    declared false -> pass (not applicable: anchoring first is
    only for when the caller is informed). Gate declared true
    -> the field must be declared true.
    """
    gate, gate_present = _get(manifest, "anchoring",
                              "informed_enough_to_anchor_first")
    value, present = _get(manifest, "anchoring", field)
    both_present = gate_present and present
    if gate_present and gate is False:
        ok = True
    else:
        ok = value is True
    _check(results, section, name, value, both_present, ok, evidence)


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
    """Return the verdict dict for a negotiation preparation manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    issues, has_issues = _get(manifest, "issues")
    issues_is_list = has_issues and isinstance(issues, list)
    issues_count = len(issues) if issues_is_list else None
    rows = issues if issues_is_list else []

    issues_without_own_interest = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "own_underlying_interest" in c
         and not _nonempty(c, "own_underlying_interest")]
        if issues_is_list else None
    )
    issues_without_counterpart_interest = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "counterpart_underlying_interest" in c
         and not _nonempty(c, "counterpart_underlying_interest")]
        if issues_is_list else None
    )
    issues_without_trade_potential_assessed = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "trade_potential_assessed" in c
         and c.get("trade_potential_assessed") is not True]
        if issues_is_list else None
    )
    duplicate_issue_names = None
    if issues_is_list:
        seen = []
        duplicate_issue_names = []
        for c in rows:
            if isinstance(c, dict) and isinstance(c.get("name"), str):
                nm = c["name"]
                if nm in seen and nm not in duplicate_issue_names:
                    duplicate_issue_names.append(nm)
                seen.append(nm)
    own_interest_coverage = (
        sum(1 for c in rows if _nonempty(c, "own_underlying_interest"))
        / issues_count
        if issues_is_list and issues_count > 0 else None
    )
    counterpart_interest_coverage = (
        sum(1 for c in rows
            if _nonempty(c, "counterpart_underlying_interest"))
        / issues_count
        if issues_is_list and issues_count > 0 else None
    )
    trade_potential_assessed_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("trade_potential_assessed") is True)
        / issues_count
        if issues_is_list and issues_count > 0 else None
    )

    # ---- Section 1: batna_reservation_price_and_zopa (skill
    #      "Fundamentals" — BATNA known and strengthened, it is
    #      the real walk-away power; the reservation price as the
    #      walk-away number; the ZOPA where the two sides'
    #      ranges overlap; the fundamentals prepared before the
    #      table) ----
    _bool_check(results, "batna_reservation_price_and_zopa",
                "batna_identified", manifest,
                ("batna_and_reservation", "batna_identified"),
                "BATNA: the Best Alternative To a Negotiated "
                "Agreement is identified")
    _bool_check(results, "batna_reservation_price_and_zopa",
                "batna_strengthened", manifest,
                ("batna_and_reservation", "batna_strengthened"),
                "BATNA: the BATNA is strengthened, not only known "
                "— it is the real walk-away power")
    _bool_check(results, "batna_reservation_price_and_zopa",
                "reservation_price_set", manifest,
                ("batna_and_reservation", "reservation_price_set"),
                "reservation price: the walk-away number is set "
                "before the table")
    _bool_check(results, "batna_reservation_price_and_zopa",
                "counterpart_reservation_estimated", manifest,
                ("batna_and_reservation",
                 "counterpart_reservation_estimated"),
                "reservation price: the counterpart's walk-away "
                "range is estimated, so an overlap can be assessed")
    _bool_check(results, "batna_reservation_price_and_zopa",
                "zopa_assessed", manifest,
                ("batna_and_reservation", "zopa_assessed"),
                "ZOPA: the Zone of Possible Agreement — where the "
                "two reservation ranges overlap — is assessed")
    _bool_check(results, "batna_reservation_price_and_zopa",
                "walk_away_commitment_declared", manifest,
                ("batna_and_reservation",
                 "walk_away_commitment_declared"),
                "reservation price: walking away beyond the "
                "reservation number is committed to in advance")
    _bool_check(results, "batna_reservation_price_and_zopa",
                "fundamentals_prepared_before_negotiation", manifest,
                ("batna_and_reservation",
                 "fundamentals_prepared_before_negotiation"),
                "fundamentals: the fundamentals are prepared "
                "before the table, not improvised from nothing")

    # ---- Section 2: interests_and_value_creation (skill
    #      "Fundamentals" — interests not positions, ask why;
    #      create value before claiming it, trade across issues
    #      valued differently; plus the computed issue rows) ----
    _bool_check(results, "interests_and_value_creation",
                "own_interests_identified", manifest,
                ("interests", "own_interests_identified"),
                "interests: the caller's own underlying interests "
                "are identified, not only the stated demand")
    _bool_check(results, "interests_and_value_creation",
                "counterpart_interests_identified", manifest,
                ("interests", "counterpart_interests_identified"),
                "interests: the counterpart's underlying interests "
                "are identified, not only their stated demand")
    _bool_check(results, "interests_and_value_creation",
                "counterpart_why_to_be_asked_planned", manifest,
                ("interests", "counterpart_why_to_be_asked_planned"),
                "interests: asking why the counterpart wants what "
                "they ask for is planned")
    _bool_check(results, "interests_and_value_creation",
                "interests_not_positions_framing_adopted", manifest,
                ("interests",
                 "interests_not_positions_framing_adopted"),
                "interests: the negotiation is framed on "
                "underlying interests, not positions")
    _bool_check(results, "interests_and_value_creation",
                "value_created_before_claiming_planned", manifest,
                ("value_creation",
                 "value_created_before_claiming_planned"),
                "value creation: expanding the pie is planned "
                "before claiming a share of it")
    _bool_check(results, "interests_and_value_creation",
                "non_zero_sum_opportunities_sought", manifest,
                ("value_creation", "non_zero_sum_opportunities_sought"),
                "value creation: the deal is not treated as "
                "zero-sum — opportunities to create value are "
                "sought")
    _bool_check(results, "interests_and_value_creation",
                "trade_across_differently_valued_issues_planned",
                manifest,
                ("value_creation",
                 "trade_across_differently_valued_issues_planned"),
                "value creation: trading across issues the two "
                "sides value differently is planned")
    _check(results, "interests_and_value_creation",
           "issues_declared", issues, issues_is_list,
           issues_is_list and issues_count > 0,
           "the declared record names its issues — the issues "
           "list is present and non-empty")
    own_present = (
        issues_is_list
        and all(isinstance(c, dict) and "own_underlying_interest" in c
                for c in rows)
    )
    _check(results, "interests_and_value_creation",
           "every_issue_names_own_underlying_interest", issues,
           own_present,
           issues_is_list and issues_count > 0
           and all(_nonempty(c, "own_underlying_interest")
                   for c in rows),
           "interests: every declared issue row names the "
           "caller's own underlying interest behind the position")
    counterpart_present = (
        issues_is_list
        and all(isinstance(c, dict)
                and "counterpart_underlying_interest" in c
                for c in rows)
    )
    _check(results, "interests_and_value_creation",
           "every_issue_names_counterpart_underlying_interest",
           issues, counterpart_present,
           issues_is_list and issues_count > 0
           and all(_nonempty(c, "counterpart_underlying_interest")
                   for c in rows),
           "interests: every declared issue row names the "
           "counterpart's underlying interest behind their "
           "position")
    trade_present = (
        issues_is_list
        and all(isinstance(c, dict) and "trade_potential_assessed" in c
                for c in rows)
    )
    _check(results, "interests_and_value_creation",
           "every_issue_trade_potential_assessed", issues,
           trade_present,
           issues_is_list and issues_count > 0
           and all(isinstance(c, dict)
                   and c.get("trade_potential_assessed") is True
                   for c in rows),
           "value creation: every declared issue row has its "
           "trade potential — whether the two sides value it "
           "differently — assessed")
    name_present = (
        issues_is_list
        and all(isinstance(c, dict) and "name" in c for c in rows)
    )
    _check(results, "interests_and_value_creation",
           "no_issue_name_duplicated", issues, name_present,
           issues_is_list and duplicate_issue_names is not None
           and len(duplicate_issue_names) == 0,
           "issues: no declared issue name is owned by more "
           "than one issue row")

    # ---- Section 3: improvisation_and_adaptation (skill
    #      "Improvisation (Wheeler — the live game)" — a sense of
    #      direction, not a script; a Plan B (and C) carried;
    #      presence of mind and composure; situational awareness
    #      of shifting interests, constraints and emotions) ----
    _bool_check(results, "improvisation_and_adaptation",
                "sense_of_direction_stated", manifest,
                ("direction", "sense_of_direction_stated"),
                "direction: a sense of direction is stated — a "
                "map that orients even when the terrain differs")
    _bool_check(results, "improvisation_and_adaptation",
                "plan_not_script_approach_adopted", manifest,
                ("direction", "plan_not_script_approach_adopted"),
                "direction: the plan is carried as orientation, "
                "not as a rigid script")
    _bool_check(results, "improvisation_and_adaptation",
                "plan_b_prepared", manifest,
                ("direction", "plan_b_prepared"),
                "direction: a Plan B is carried")
    _bool_check(results, "improvisation_and_adaptation",
                "plan_c_prepared", manifest,
                ("direction", "plan_c_prepared"),
                "direction: a Plan C is carried, beyond Plan B")
    _bool_check(results, "improvisation_and_adaptation",
                "own_emotional_state_management_planned", manifest,
                ("presence_and_awareness",
                 "own_emotional_state_management_planned"),
                "presence of mind: managing the caller's own "
                "emotional state during the negotiation is planned")
    _bool_check(results, "improvisation_and_adaptation",
                "composure_commitment_declared", manifest,
                ("presence_and_awareness",
                 "composure_commitment_declared"),
                "presence of mind: staying composed is committed "
                "to in advance")
    _bool_check(results, "improvisation_and_adaptation",
                "situational_awareness_planned", manifest,
                ("presence_and_awareness",
                 "situational_awareness_planned"),
                "situational awareness: reading shifting "
                "interests, constraints and emotions in real time "
                "is planned")

    # ---- Section 4: openings_moments_closing_and_tactics
    #      (skill "Improvisation" — openings to critical moments
    #      to closing; and "Tactics & guardrails" — anchor first
    #      when informed, make their yes easy, separate the
    #      people from the problem, hard on the problem soft on
    #      the person, fair-enough agreements that hold) ----
    _bool_check(results, "openings_moments_closing_and_tactics",
                "opening_planned", manifest,
                ("sequence", "opening_planned"),
                "sequence: the opening is planned")
    _bool_check(results, "openings_moments_closing_and_tactics",
                "critical_moments_recognition_planned", manifest,
                ("sequence", "critical_moments_recognition_planned"),
                "sequence: recognizing the critical moments — "
                "the pivot points — is planned")
    _bool_check(results, "openings_moments_closing_and_tactics",
                "closing_cleanly_planned", manifest,
                ("sequence", "closing_cleanly_planned"),
                "sequence: closing cleanly is planned")
    gate_value, gate_present = _get(
        manifest, "anchoring", "informed_enough_to_anchor_first")
    _check(results, "openings_moments_closing_and_tactics",
           "anchoring_applicability_declared", gate_value, gate_present,
           True,
           "anchoring: whether the caller is informed enough to "
           "anchor first is declared — anchoring first applies "
           "only when informed")
    _gated_anchor_check(results,
                        "openings_moments_closing_and_tactics",
                        "anchor_first_planned_when_informed",
                        manifest, "anchor_first_planned",
                        "anchoring: anchoring first is planned for "
                        "when the caller is informed")
    _bool_check(results, "openings_moments_closing_and_tactics",
                "counterpart_yes_made_easy_planned", manifest,
                ("tactics", "counterpart_yes_made_easy_planned"),
                "tactics: making the counterpart's yes easy is "
                "planned")
    _bool_check(results, "openings_moments_closing_and_tactics",
                "people_separated_from_problem_declared", manifest,
                ("tactics", "people_separated_from_problem_declared"),
                "tactics: the people are separated from the "
                "problem")
    _bool_check(results, "openings_moments_closing_and_tactics",
                "hard_on_problem_soft_on_person_declared", manifest,
                ("tactics", "hard_on_problem_soft_on_person_declared"),
                "tactics: hard on the problem, soft on the person "
                "is declared")
    _bool_check(results, "openings_moments_closing_and_tactics",
                "fair_enough_agreement_aim_declared", manifest,
                ("tactics", "fair_enough_agreement_aim_declared"),
                "tactics: the aim is a fair-enough agreement "
                "that holds, not a maximal extraction")

    # ---- Section 5: debrief_and_anti_pattern_red_lines (skill
    #      "Improvisation" — debrief every negotiation, a wicked
    #      learning environment where feedback misleads, review
    #      deliberately; and "Anti-patterns to refuse" — no
    #      BATNA, arguing positions, treating everything as
    #      zero-sum, rigid scripts, losing composure, never
    #      debriefing) ----
    _bool_check(results, "debrief_and_anti_pattern_red_lines",
                "debrief_planned_after_negotiation", manifest,
                ("learning", "debrief_planned_after_negotiation"),
                "debrief: a debrief after the negotiation is "
                "planned — every negotiation is debriefed")
    _bool_check(results, "debrief_and_anti_pattern_red_lines",
                "deliberate_debrief_review_committed", manifest,
                ("learning", "deliberate_debrief_review_committed"),
                "debrief: the debrief is a deliberate review, "
                "committed to in advance, so learning actually "
                "happens")
    _bool_check(results, "debrief_and_anti_pattern_red_lines",
                "misleading_feedback_caution_acknowledged", manifest,
                ("learning",
                 "misleading_feedback_caution_acknowledged"),
                "debrief: negotiation is a wicked learning "
                "environment where feedback misleads — that "
                "caution is acknowledged")
    _false_check(results, "debrief_and_anti_pattern_red_lines",
                 "no_batna", manifest,
                 ("red_lines", "no_batna_present"),
                 "red line: no BATNA is present in the preparation")
    _false_check(results, "debrief_and_anti_pattern_red_lines",
                 "no_arguing_positions", manifest,
                 ("red_lines", "arguing_positions_present"),
                 "red line: arguing positions is not present in "
                 "the preparation")
    _false_check(results, "debrief_and_anti_pattern_red_lines",
                 "no_zero_sum_treatment", manifest,
                 ("red_lines",
                  "treating_everything_as_zero_sum_present"),
                 "red line: treating everything as zero-sum is "
                 "not present in the preparation")
    _false_check(results, "debrief_and_anti_pattern_red_lines",
                 "no_rigid_script_reliance", manifest,
                 ("red_lines", "rigid_script_reliance_present"),
                 "red line: reliance on a rigid script is not "
                 "present in the preparation")
    _false_check(results, "debrief_and_anti_pattern_red_lines",
                 "no_losing_composure", manifest,
                 ("red_lines", "losing_composure_present"),
                 "red line: losing composure is not present in "
                 "the preparation")
    _false_check(results, "debrief_and_anti_pattern_red_lines",
                 "no_never_debriefing", manifest,
                 ("red_lines", "never_debriefing_present"),
                 "red line: never debriefing is not present in "
                 "the preparation")

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
        verdict = "NEGOTIATION_PREPARATION_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "NEGOTIATION_PREPARATION_SOUND"

    computed_names = (
        "issues_declared",
        "every_issue_names_own_underlying_interest",
        "every_issue_names_counterpart_underlying_interest",
        "every_issue_trade_potential_assessed",
        "no_issue_name_duplicated",
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
        "service": "negotiation-preparation-pack",
        "atom_version": "0.1.0",
        "negotiation": manifest.get("negotiation"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "issues_count": issues_count,
        "issues_without_own_interest": issues_without_own_interest,
        "own_interest_coverage": _fmt6(own_interest_coverage),
        "issues_without_counterpart_interest":
            issues_without_counterpart_interest,
        "counterpart_interest_coverage":
            _fmt6(counterpart_interest_coverage),
        "issues_without_trade_potential_assessed":
            issues_without_trade_potential_assessed,
        "trade_potential_assessed_coverage":
            _fmt6(trade_potential_assessed_coverage),
        "duplicate_issue_names": duplicate_issue_names,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "NEGOTIATION PREPARATION PACK",
        f"negotiation: {verdict.get('negotiation')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: negotiation_preparation_pack.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "NEGOTIATION_PREPARATION_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
