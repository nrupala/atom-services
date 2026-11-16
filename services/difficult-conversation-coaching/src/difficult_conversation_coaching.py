#!/usr/bin/env python3
"""Difficult conversation coaching — deterministic core.

Built from the bound skill `emotional-intelligence-manager`:
"When the emotional stakes drive the outcome, manage those
first. Be firm on substance and warm on tone."

This atom is an AUDIT of a declared conversation-preparation
record: it validates the record a caller declares against the
skill's preparation practice — Goleman's four domains in their
stated order, self-regulation first, empathy steps, assertive
framing, the difficult-conversation structure, SBI feedback,
safeguards and repair, and the anti-patterns it refuses. It does
not coach, generate dialogue, rehearse anyone, or judge tone,
empathy, wording or timing — it checks that the record the skill
requires is present and internally complete and consistent on
the declared evidence. The human work is never generated or
judged; only the declared record is audited.

The caller submits a conversation-preparation manifest (a dict,
or JSON on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- preparation domains: the declared `preparation_domains` list
  must be non-empty, every entry must be one of the four domains
  the skill names — `self_awareness`, `self_management`,
  `social_awareness`, `relationship_management` — all four must
  be declared, and they must be declared in the skill's stated
  order ("They build in that order");
- feedback points: the declared `feedback_points` rows are
  checked only when feedback is declared to be given (skill:
  feedback uses SBI — Situation, Behavior, Impact; critique the
  behavior, never the identity). Every declared row must state
  all three SBI elements and must not target identity;
- the repair-move check binds only when a soured thread is
  declared (skill: "When a thread sours, name it and make the
  high-functioning move").

Computed ratios are serialized as strings with exactly four
decimal places, produced in both implementations by the same
fixed rule — round half up to 4dp, floor(v * 10000 + 0.5) /
10000, then format with exactly four decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact). Declared feedback rows that fail the SBI
and identity computations are reported by name as
`feedback_points_without_complete_sbi` and
`feedback_points_targeting_identity`; canonical preparation
domains not declared are reported as
`preparation_domains_missing`. The computed outcome over the
five primary computed checks is reported as `computed_status`.

The skill states no numeric threshold — no pause duration, no
rehearsal count or duration, no number of facts or specifics, no
next-step deadline, no empathy or tone score — so no numeric
threshold check is invented; quantities are computed and
reported, and completeness (every declared feedback row, all
four stated domains) is the only bar, exactly as the task's
declared-row consistency requires.

Verdict:
- any fail             -> CONVERSATION_PREPARATION_INCOMPLETE
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> CONVERSATION_PREPARATION_COMPLETE

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "preparation_and_self_regulation",
    "empathy_and_social_awareness",
    "framing_and_assertiveness",
    "structure_feedback_and_next_step",
    "safeguards_repair_and_close",
)

STATED_DOMAINS = (
    "self_awareness",
    "self_management",
    "social_awareness",
    "relationship_management",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below. The
# preparation-domains list is validated as a list of strings only,
# never membership-checked as a type — membership in the skill's
# stated set is a verdict check, not a type error.
MANIFEST_SPEC = {
    "conversation_title": "string",
    "preparation_domains": ["string"],
    "self_awareness": {
        "emotion_named": "boolean",
        "pause_before_reacting_planned": "boolean",
    },
    "self_management": {
        "firm_not_hot_stance_declared": "boolean",
        "regulation_approach_declared": "boolean",
        "venting_in_writing_present": "boolean",
        "emotion_suppressed_instead_of_regulated_present": "boolean",
    },
    "rehearsal": {
        "rehearsal_completed": "boolean",
    },
    "empathy": {
        "counterpart_emotion_considered": "boolean",
        "emotion_separated_from_position": "boolean",
        "acknowledgement_before_redirect_planned": "boolean",
        "strongest_reasonable_version_identified": "boolean",
    },
    "framing": {
        "facts_led_with": "boolean",
        "specifics_prepared": "boolean",
        "ask_stated_clearly": "boolean",
        "boundary_stated_clearly": "boolean",
        "firm_on_substance_warm_on_tone_declared": "boolean",
        "hostility_mirroring_present": "boolean",
    },
    "structure": {
        "own_part_owned": "boolean",
        "other_view_invited": "boolean",
        "concrete_next_step_proposed": "boolean",
    },
    "feedback": {
        "feedback_to_be_given": "boolean",
    },
    "feedback_points": [{
        "name": "string",
        "situation_stated": "boolean",
        "behavior_described": "boolean",
        "impact_stated": "boolean",
        "targets_identity": "boolean",
    }],
    "safeguards": {
        "do_not_respond_list_checked": "boolean",
        "target_on_do_not_respond_list": "boolean",
        "register_appropriate_to_relationship_declared": "boolean",
    },
    "repair": {
        "thread_has_soured": "boolean",
        "repair_move_planned": "boolean",
        "relationship_and_outcome_protected_over_point_scoring_declared": "boolean",
        "winning_argument_losing_relationship_present": "boolean",
    },
}


def _validate_value(value, spec, path):
    if spec == "any":
        return
    if spec == "string":
        if not isinstance(value, str):
            raise ValueError(f"{path} must be a string")
        return
    if spec == "boolean":
        if not isinstance(value, bool):
            raise ValueError(f"{path} must be a boolean")
        return
    if spec == "number":
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{path} must be a number")
        return
    if isinstance(spec, list):
        if not isinstance(value, list):
            raise ValueError(f"{path} must be a list")
        for index, entry in enumerate(value):
            _validate_value(entry, spec[0], f"{path}[{index}]")
        return
    if isinstance(spec, dict):
        if not isinstance(value, dict):
            raise ValueError(f"{path} must be an object")
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


def _gated_bool_check(results, section, name, manifest, gate_path,
                      target_path, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    target, has_target = _get(manifest, *target_path)
    if has_gate and gate:
        _check(results, section, name, target, has_target,
               target is True, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _gated_computed_check(results, section, name, manifest, gate_path,
                          present, ok, evidence, na_evidence):
    gate, has_gate = _get(manifest, *gate_path)
    if has_gate and gate:
        _check(results, section, name, gate, present, ok, evidence)
    else:
        _check(results, section, name, gate, has_gate, True,
               na_evidence)


def _fmt4(value):
    """Fixed 4dp serialization: round half up, then 4 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 10000 + 0.5) / 10000
    return f"{rounded:.4f}"


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def _sbi_complete(entry):
    return (
        isinstance(entry, dict)
        and entry.get("situation_stated") is True
        and entry.get("behavior_described") is True
        and entry.get("impact_stated") is True
    )


def evaluate(manifest):
    """Return the verdict dict for a conversation-preparation manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    domains, has_domains = _get(manifest, "preparation_domains")
    domains_is_list = has_domains and isinstance(domains, list)
    points, has_points = _get(manifest, "feedback_points")
    points_is_list = has_points and isinstance(points, list)

    domains_count = len(domains) if domains_is_list else None
    points_count = len(points) if points_is_list else None

    declared_domains = (
        [d for d in domains if isinstance(d, str)]
        if domains_is_list else []
    )
    valid_declared = [d for d in declared_domains if d in STATED_DOMAINS]
    domains_missing = (
        [d for d in STATED_DOMAINS if d not in declared_domains]
        if domains_is_list else None
    )
    domain_coverage = (
        len(set(valid_declared)) / len(STATED_DOMAINS)
        if domains_is_list else None
    )
    domains_cover_in_order = (
        domains_is_list
        and declared_domains == list(STATED_DOMAINS)
    )

    points_without_sbi = (
        [_row_name(p) for p in points if not _sbi_complete(p)]
        if points_is_list else None
    )
    points_targeting_identity = (
        [_row_name(p) for p in points
         if isinstance(p, dict) and p.get("targets_identity") is True]
        if points_is_list else None
    )
    sbi_coverage = (
        (points_count - len(points_without_sbi)) / points_count
        if points_is_list and points_count > 0 else None
    )

    # ---- Section 1: preparation_and_self_regulation (skill:
    #      Goleman's four domains build in order — self-awareness
    #      -> self-management -> social awareness -> relationship
    #      management; self-regulation first — name the emotion,
    #      pause before reacting, firm not hot, regulate rather
    #      than suppress; anti-patterns: venting in writing,
    #      suppressing emotion instead of regulating it) ----
    _check(results, "preparation_and_self_regulation",
           "preparation_domains_declared", domains, domains_is_list,
           domains_is_list and domains_count > 0,
           "Goleman's four domains: the declared preparation record "
           "names the domains it worked through — the preparation "
           "domains list is present and non-empty")
    _check(results, "preparation_and_self_regulation",
           "preparation_domains_cover_all_four_in_stated_order",
           domains, domains_is_list,
           domains_cover_in_order,
           "Goleman's four domains: self-awareness, self-management, "
           "social awareness and relationship management are all "
           "declared, in that order — they build in that order")
    _bool_check(results, "preparation_and_self_regulation",
                "emotion_named", manifest,
                ("self_awareness", "emotion_named"),
                "self-regulation first: the emotion is named before "
                "reacting")
    _bool_check(results, "preparation_and_self_regulation",
                "pause_before_reacting_planned", manifest,
                ("self_awareness", "pause_before_reacting_planned"),
                "self-regulation first: a pause before reacting is "
                "planned")
    _bool_check(results, "preparation_and_self_regulation",
                "firm_not_hot_stance_declared", manifest,
                ("self_management", "firm_not_hot_stance_declared"),
                "self-management: the stance is firm, not hot — "
                "persistent and precise, not heated")
    _bool_check(results, "preparation_and_self_regulation",
                "regulation_approach_declared", manifest,
                ("self_management", "regulation_approach_declared"),
                "self-management: an approach for regulating the "
                "named emotion is declared")
    _false_check(results, "preparation_and_self_regulation",
                 "no_venting_in_writing", manifest,
                 ("self_management", "venting_in_writing_present"),
                 "anti-pattern: no venting in writing")
    _false_check(results, "preparation_and_self_regulation",
                 "emotion_regulated_not_suppressed", manifest,
                 ("self_management",
                  "emotion_suppressed_instead_of_regulated_present"),
                 "anti-pattern: emotion is regulated, not suppressed "
                 "instead of regulated")
    _bool_check(results, "preparation_and_self_regulation",
                "rehearsal_completed", manifest,
                ("rehearsal", "rehearsal_completed"),
                "preparation: the conversation is rehearsed before "
                "it happens — the preparation record declares the "
                "rehearsal done")

    # ---- Section 2: empathy_and_social_awareness (skill: social
    #      awareness / empathy — separate the person's emotion from
    #      their position, acknowledge before redirecting, respond
    #      to the strongest reasonable version of their point) ----
    _bool_check(results, "empathy_and_social_awareness",
                "counterpart_emotion_considered", manifest,
                ("empathy", "counterpart_emotion_considered"),
                "social awareness (empathy): the other person's "
                "emotional state is considered in preparation")
    _bool_check(results, "empathy_and_social_awareness",
                "emotion_separated_from_position", manifest,
                ("empathy", "emotion_separated_from_position"),
                "empathy: the person's emotion is separated from "
                "their position")
    _bool_check(results, "empathy_and_social_awareness",
                "acknowledgement_before_redirect_planned", manifest,
                ("empathy",
                 "acknowledgement_before_redirect_planned"),
                "empathy: acknowledgement before redirecting is "
                "planned — acknowledge first, then redirect")
    _bool_check(results, "empathy_and_social_awareness",
                "strongest_reasonable_version_identified", manifest,
                ("empathy",
                 "strongest_reasonable_version_identified"),
                "empathy: the strongest reasonable version of the "
                "other person's point is identified, and the "
                "preparation responds to that version")

    # ---- Section 3: framing_and_assertiveness (skill: assertive,
    #      not aggressive — state the ask and the boundary clearly
    #      and calmly, firm on substance while respectful in tone;
    #      difficult conversations lead with facts and are
    #      specific; anti-pattern: mirroring hostility) ----
    _bool_check(results, "framing_and_assertiveness",
                "facts_led_with", manifest,
                ("framing", "facts_led_with"),
                "difficult conversations: the framing leads with "
                "facts")
    _bool_check(results, "framing_and_assertiveness",
                "specifics_prepared", manifest,
                ("framing", "specifics_prepared"),
                "difficult conversations: the framing is specific — "
                "the specifics are prepared")
    _bool_check(results, "framing_and_assertiveness",
                "ask_stated_clearly", manifest,
                ("framing", "ask_stated_clearly"),
                "assertive, not aggressive: the ask is stated "
                "clearly and calmly")
    _bool_check(results, "framing_and_assertiveness",
                "boundary_stated_clearly", manifest,
                ("framing", "boundary_stated_clearly"),
                "assertive, not aggressive: the boundary is stated "
                "clearly and calmly")
    _bool_check(results, "framing_and_assertiveness",
                "firm_on_substance_warm_on_tone_declared", manifest,
                ("framing",
                 "firm_on_substance_warm_on_tone_declared"),
                "the combination that moves people: completely firm "
                "on the substance while staying respectful — warm — "
                "in tone is declared")
    _false_check(results, "framing_and_assertiveness",
                 "no_hostility_mirroring", manifest,
                 ("framing", "hostility_mirroring_present"),
                 "anti-pattern: no mirroring hostility")

    # ---- Section 4: structure_feedback_and_next_step (skill:
    #      difficult conversations — own your part, invite the
    #      other view, agree on a concrete next step; feedback —
    #      SBI: Situation, Behavior, Impact; critique the behavior,
    #      never the identity) ----
    _bool_check(results, "structure_feedback_and_next_step",
                "own_part_owned", manifest,
                ("structure", "own_part_owned"),
                "difficult conversations: your own part is owned")
    _bool_check(results, "structure_feedback_and_next_step",
                "other_view_invited", manifest,
                ("structure", "other_view_invited"),
                "difficult conversations: the other view is invited")
    _bool_check(results, "structure_feedback_and_next_step",
                "concrete_next_step_proposed", manifest,
                ("structure", "concrete_next_step_proposed"),
                "difficult conversations: a concrete next step is "
                "prepared to agree on")
    _gated_computed_check(
        results, "structure_feedback_and_next_step",
        "feedback_points_declared_when_feedback_to_be_given",
        manifest, ("feedback", "feedback_to_be_given"),
        points_is_list,
        points_is_list and points_count > 0,
        "feedback: the declared preparation record names its "
        "feedback points — the feedback points list is present "
        "and non-empty",
        "no feedback declared to be given")
    sbi_fields_present = (
        points_is_list
        and all(isinstance(p, dict)
                and "situation_stated" in p
                and "behavior_described" in p
                and "impact_stated" in p for p in points)
    )
    _gated_computed_check(
        results, "structure_feedback_and_next_step",
        "every_feedback_point_sbi_complete",
        manifest, ("feedback", "feedback_to_be_given"),
        sbi_fields_present,
        points_is_list and points_count > 0
        and len(points_without_sbi) == 0,
        "feedback: every declared feedback point is in SBI form "
        "— Situation, Behavior, Impact all stated",
        "no feedback declared to be given")
    identity_fields_present = (
        points_is_list
        and all(isinstance(p, dict) and "targets_identity" in p
                for p in points)
    )
    _gated_computed_check(
        results, "structure_feedback_and_next_step",
        "no_feedback_point_targets_identity",
        manifest, ("feedback", "feedback_to_be_given"),
        identity_fields_present,
        points_is_list and points_count > 0
        and len(points_targeting_identity) == 0,
        "feedback: critique the behavior, never the identity — "
        "no declared feedback point targets identity",
        "no feedback declared to be given")

    # ---- Section 5: safeguards_repair_and_close (skill:
    #      guardrails — respect the do-not-respond list, keep the
    #      register appropriate to the relationship; repair — when
    #      a thread sours, name it and make the high-functioning
    #      move, protect the relationship and the outcome, don't
    #      score points; anti-pattern: winning the argument but
    #      losing the relationship) ----
    _bool_check(results, "safeguards_repair_and_close",
                "do_not_respond_list_checked", manifest,
                ("safeguards", "do_not_respond_list_checked"),
                "guardrails: the do-not-respond list is checked "
                "before the conversation — people on it are handled "
                "by the owner himself")
    _false_check(results, "safeguards_repair_and_close",
                 "target_not_on_do_not_respond_list", manifest,
                 ("safeguards", "target_on_do_not_respond_list"),
                 "guardrails: the conversation's counterpart is not "
                 "on the do-not-respond list")
    _bool_check(results, "safeguards_repair_and_close",
                "register_appropriate_to_relationship_declared",
                manifest,
                ("safeguards",
                 "register_appropriate_to_relationship_declared"),
                "guardrails: the register appropriate to the "
                "relationship is declared — strictly professional "
                "where that rule applies, warm where the "
                "relationship carries it")
    _gated_bool_check(
        results, "safeguards_repair_and_close",
        "repair_move_planned_when_thread_soured",
        manifest, ("repair", "thread_has_soured"),
        ("repair", "repair_move_planned"),
        "repair: the thread has soured, and a repair move is "
        "planned — name it and make the high-functioning move",
        "no soured thread declared")
    _bool_check(results, "safeguards_repair_and_close",
                "relationship_and_outcome_protected_over_point_scoring",
                manifest,
                ("repair",
                 "relationship_and_outcome_protected_over_point_scoring_declared"),
                "repair: the preparation protects the relationship "
                "and the outcome over scoring points")
    _false_check(results, "safeguards_repair_and_close",
                 "no_winning_argument_losing_relationship", manifest,
                 ("repair",
                  "winning_argument_losing_relationship_present"),
                 "anti-pattern: no winning the argument but losing "
                 "the relationship")

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
        verdict = "CONVERSATION_PREPARATION_INCOMPLETE"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "CONVERSATION_PREPARATION_COMPLETE"

    computed_names = (
        "preparation_domains_declared",
        "preparation_domains_cover_all_four_in_stated_order",
        "feedback_points_declared_when_feedback_to_be_given",
        "every_feedback_point_sbi_complete",
        "no_feedback_point_targets_identity",
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
        "service": "difficult-conversation-coaching",
        "atom_version": "0.1.0",
        "conversation_title": manifest.get("conversation_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "preparation_domains_count": domains_count,
        "preparation_domains_missing": domains_missing,
        "preparation_domain_coverage": _fmt4(domain_coverage),
        "feedback_points_count": points_count,
        "feedback_points_without_complete_sbi": points_without_sbi,
        "feedback_points_targeting_identity": points_targeting_identity,
        "sbi_coverage": _fmt4(sbi_coverage),
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
        "DIFFICULT CONVERSATION COACHING",
        f"conversation_title: {verdict.get('conversation_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: difficult_conversation_coaching.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "CONVERSATION_PREPARATION_COMPLETE" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
