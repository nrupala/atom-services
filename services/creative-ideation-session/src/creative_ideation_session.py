#!/usr/bin/env python3
"""Creative ideation session — deterministic core.

Built from the bound skill `creative-ideation`: "Creativity as a
practice, not a lightning strike — showing up prepared, drawing
from the well, and developing raw ideas into usable ones." This
atom audits one declared ideation-session record — brief,
constraints, preparation, capture, generation discipline,
divergence methods, the idea pool, selection criteria, dedup /
clustering, and the shortlist rationale — against the skill's
habits, its diverge-then-converge sequence, and its
anti-patterns. It does NOT generate ideas, and it does not judge
any idea — it checks that the declared session record contains
what the skill's practice requires, on the caller's declared
evidence.

The caller submits a creative-ideation-session manifest (a dict,
or JSON on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
arithmetic / set logic of the declared values — no outside
threshold is imported:

- volume against the declared target (skill: "Volume precedes
  quality — generate many ideas, then select"): the skill states
  NO number for how many ideas is "many", so none is imposed.
  When the record declares a target idea count and a captured
  count, the check passes only when the target is positive, the
  captured count is not negative, and the captured count meets
  or exceeds the caller-declared target;
- dedup arithmetic (the record declares a captured total,
  duplicates removed, and unique ideas after dedup): the check
  passes only when all three are present, none is negative, the
  duplicates removed do not exceed the captured total, and the
  declared unique count equals captured minus duplicates;
- shortlist within the unique pool (the record declares a
  shortlist count and a unique-after-dedup count): the check
  passes only when the shortlist holds at least one idea and
  does not exceed the declared unique pool;
- divergence-method vocabulary (skill diverge step: "brainstorm,
  SCAMPER, analogies, combine distant domains, ask 'what if'"):
  a declared methods-used list passes only when it is non-empty
  and every entry is one of the five techniques the skill names
  — `brainstorm`, `scamper`, `analogies`,
  `combining_distant_domains`, `what_if`. The skill requires no
  particular method and no minimum count beyond using a method,
  so none is imposed.

Computed differences (captured minus target; declared unique
minus the dedup-implied unique) are serialized as strings with
exactly six decimal places, produced in both implementations by
the same fixed rule — round half up to 6dp,
floor(v * 1000000 + 0.5) / 1000000, then format with exactly six
decimals. That fixed serialization is what makes the Python and
TypeScript outputs byte-identical. The computed outcome over the
four computed checks is reported as `computed_status`.

Verdict:
- any fail             -> SESSION_NOT_COMPLETE
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> SESSION_COMPLETE

This is a completeness and consistency audit over a declared
session record, not an ideation engine and not an idea review:
a record that declares every step passes even if the ideas are
weak, and nothing here verifies that a declared value is true.

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "brief_and_preparation",
    "capture_and_generation",
    "divergence_and_methods",
    "idea_pool_and_volume",
    "selection_and_convergence",
    "shortlist_and_ship",
)

STATED_METHODS = [
    "brainstorm",
    "scamper",
    "analogies",
    "combining_distant_domains",
    "what_if",
]

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
# The methods-used list is validated as a list of strings only,
# never membership-checked as a type — membership in the skill's
# stated set is a verdict check, not a type error.
MANIFEST_SPEC = {
    "session_title": "string",
    "brief": {
        "written": "boolean",
        "goal_or_question_stated": "boolean",
        "constraints_declared": "boolean",
    },
    "preparation": {
        "scheduled_in_advance": "boolean",
        "prepared_with_inputs_ready": "boolean",
    },
    "capture": {
        "capture_system_used": "boolean",
        "all_ideas_captured": "boolean",
        "no_judging_at_capture": "boolean",
    },
    "generation": {
        "editing_separated_from_generating": "boolean",
        "small_reps_or_low_start_bar_used": "boolean",
    },
    "divergence": {
        "diverged_before_converging": "boolean",
        "methods_used": ["string"],
        "constraints_used_as_prompt": "boolean",
    },
    "idea_pool": {
        "target_idea_count": "number",
        "total_ideas_captured": "number",
        "dedup_performed": "boolean",
        "duplicates_removed": "number",
        "unique_ideas_after_dedup": "number",
        "ideas_clustered_or_grouped": "boolean",
    },
    "selection": {
        "criteria_written_before_scoring": "boolean",
        "criteria_applied_to_all_unique_ideas": "boolean",
        "scoring_only_after_divergence_complete": "boolean",
    },
    "shortlist": {
        "shortlist_count": "number",
        "rationale_written": "boolean",
        "rationale_references_criteria": "boolean",
    },
    "outcome": {
        "shared_for_feedback": "boolean",
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


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def evaluate(manifest):
    """Return the verdict dict for a creative-ideation-session manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Section 1: brief_and_preparation (skill: creativity is
    #      a practice — "you must show up prepared and do the work
    #      to draw from the well"; "Create on a schedule, not when
    #      inspired"; constraints help — "a tight box forces
    #      invention") ----
    _bool_check(results, "brief_and_preparation", "brief_written",
                manifest, ("brief", "written"),
                "the session record carries a written brief")
    _bool_check(results, "brief_and_preparation",
                "brief_goal_or_question_stated",
                manifest, ("brief", "goal_or_question_stated"),
                "the brief states the goal or question the session "
                "works on")
    _bool_check(results, "brief_and_preparation", "constraints_declared",
                manifest, ("brief", "constraints_declared"),
                "the brief declares the session's constraints — a "
                "tight box forces invention")
    _bool_check(results, "brief_and_preparation",
                "session_scheduled_in_advance",
                manifest, ("preparation", "scheduled_in_advance"),
                "habits over moods: the session is created on a "
                "schedule, not when inspired")
    _bool_check(results, "brief_and_preparation",
                "prepared_with_inputs_ready",
                manifest, ("preparation", "prepared_with_inputs_ready"),
                "the session shows up prepared — inputs ready to "
                "draw from the well")

    # ---- Section 2: capture_and_generation (skill: "Keep an
    #      idea-capture system; raw ideas are perishable"; "Never
    #      judge at the moment of capture"; "separate drafting
    #      from editing — never edit while generating"; "Lower
    #      the bar to start, work in small reps") ----
    _bool_check(results, "capture_and_generation", "capture_system_used",
                manifest, ("capture", "capture_system_used"),
                "capture everything: an idea-capture system is used "
                "— raw ideas are perishable")
    _bool_check(results, "capture_and_generation", "all_ideas_captured",
                manifest, ("capture", "all_ideas_captured"),
                "capture everything: all raw ideas from the session "
                "are captured")
    _bool_check(results, "capture_and_generation", "no_judging_at_capture",
                manifest, ("capture", "no_judging_at_capture"),
                "never judge at the moment of capture")
    _bool_check(results, "capture_and_generation",
                "editing_separated_from_generating",
                manifest,
                ("generation", "editing_separated_from_generating"),
                "separate drafting from editing — editing never "
                "happens while generating")
    _bool_check(results, "capture_and_generation",
                "small_reps_or_low_start_bar_used",
                manifest,
                ("generation", "small_reps_or_low_start_bar_used"),
                "beat the resistance: the bar to start is lowered "
                "or the work is done in small reps")

    # ---- Section 3: divergence_and_methods (skill: "Diverge,
    #      then converge — 1. Diverge widely: brainstorm, SCAMPER,
    #      analogies, combine distant domains, ask 'what if'";
    #      "Constraints help") ----
    _bool_check(results, "divergence_and_methods",
                "diverged_before_converging",
                manifest, ("divergence", "diverged_before_converging"),
                "diverge, then converge: the session diverges "
                "widely before any convergence")
    methods, has_methods = _get(manifest, "divergence", "methods_used")
    methods_is_list = has_methods and isinstance(methods, list)
    _check(results, "divergence_and_methods",
           "methods_used_are_stated_methods", methods,
           methods_is_list,
           methods_is_list and len(methods) > 0
           and all(m in STATED_METHODS for m in methods),
           "diverge step: every method used is one the skill "
           "names — brainstorm, scamper, analogies, "
           "combining_distant_domains, or what_if — and at least "
           "one method is used; the skill requires no particular "
           "method and no minimum count beyond that")
    _bool_check(results, "divergence_and_methods",
                "constraints_used_as_prompt",
                manifest, ("divergence", "constraints_used_as_prompt"),
                "constraints help: the declared constraints are "
                "used as a prompt for invention")

    # ---- Section 4: idea_pool_and_volume (skill: "Volume
    #      precedes quality — generate many ideas, then select";
    #      the session record's dedup / clustering of the pool) ----
    target, has_target = _get(manifest, "idea_pool", "target_idea_count")
    total, has_total = _get(manifest, "idea_pool", "total_ideas_captured")
    both_counts = (
        has_target and has_total
        and _is_number(target) and _is_number(total)
    )
    volume_gap = total - target if both_counts else None
    volume_ok = (
        both_counts and target > 0 and total >= 0 and total >= target
    )
    _check(results, "idea_pool_and_volume",
           "volume_meets_declared_target", total,
           both_counts, volume_ok,
           "volume precedes quality: the captured idea count "
           "meets the caller-declared target, the target is "
           "positive, and the captured count is not negative — "
           "the skill states no number for 'many', so only the "
           "declared numbers are compared")
    _bool_check(results, "idea_pool_and_volume", "dedup_performed",
                manifest, ("idea_pool", "dedup_performed"),
                "the idea pool is deduplicated before selection")
    duplicates, has_duplicates = _get(
        manifest, "idea_pool", "duplicates_removed")
    unique, has_unique = _get(
        manifest, "idea_pool", "unique_ideas_after_dedup")
    dedup_numbers = (
        has_total and has_duplicates and has_unique
        and _is_number(total) and _is_number(duplicates)
        and _is_number(unique)
    )
    dedup_discrepancy = (
        unique - (total - duplicates) if dedup_numbers else None
    )
    dedup_ok = (
        dedup_numbers and total >= 0 and duplicates >= 0
        and unique >= 0 and duplicates <= total
        and unique == total - duplicates
    )
    _check(results, "idea_pool_and_volume",
           "dedup_arithmetic_consistent", unique,
           dedup_numbers, dedup_ok,
           "the declared unique-after-dedup count equals the "
           "declared captured total minus the declared duplicates "
           "removed, with no negative counts and no more "
           "duplicates removed than ideas captured")
    _bool_check(results, "idea_pool_and_volume",
                "ideas_clustered_or_grouped",
                manifest, ("idea_pool", "ideas_clustered_or_grouped"),
                "the deduplicated idea pool is clustered or grouped "
                "before selection")

    # ---- Section 5: selection_and_convergence (skill: "2.
    #      Converge: select, prototype, refine"; the session
    #      record declares its selection criteria before scoring
    #      so selection is not retro-fitted to favourites) ----
    _bool_check(results, "selection_and_convergence",
                "selection_criteria_written_before_scoring",
                manifest,
                ("selection", "criteria_written_before_scoring"),
                "the selection criteria are written before any "
                "idea is scored")
    _bool_check(results, "selection_and_convergence",
                "criteria_applied_to_all_unique_ideas",
                manifest,
                ("selection", "criteria_applied_to_all_unique_ideas"),
                "the declared criteria are applied to all unique "
                "ideas, not only to favourites")
    _bool_check(results, "selection_and_convergence",
                "scoring_only_after_divergence_complete",
                manifest,
                ("selection", "scoring_only_after_divergence_complete"),
                "diverge, then converge: scoring starts only after "
                "divergence is complete")
    shortlist_count, has_shortlist = _get(
        manifest, "shortlist", "shortlist_count")
    shortlist_numbers = (
        has_shortlist and has_unique
        and _is_number(shortlist_count) and _is_number(unique)
    )
    shortlist_ok = (
        shortlist_numbers and shortlist_count >= 1
        and shortlist_count <= unique
    )
    _check(results, "selection_and_convergence",
           "shortlist_within_unique_pool", shortlist_count,
           shortlist_numbers, shortlist_ok,
           "the declared shortlist holds at least one idea and "
           "does not exceed the declared unique-after-dedup pool")

    # ---- Section 6: shortlist_and_ship (skill: converge —
    #      "select, prototype, refine"; "Ship: finished and
    #      shared beats perfect and hidden. Real feedback only
    #      arrives after you ship"; anti-pattern: "perfectionism
    #      that prevents shipping") ----
    _bool_check(results, "shortlist_and_ship", "shortlist_rationale_written",
                manifest, ("shortlist", "rationale_written"),
                "a written rationale for the shortlist is recorded")
    _bool_check(results, "shortlist_and_ship",
                "shortlist_rationale_references_criteria",
                manifest, ("shortlist", "rationale_references_criteria"),
                "the shortlist rationale references the selection "
                "criteria declared before scoring")
    _bool_check(results, "shortlist_and_ship", "shared_for_feedback",
                manifest, ("outcome", "shared_for_feedback"),
                "ship: the session's output is finished and shared "
                "— real feedback only arrives after shipping; "
                "perfectionism that prevents shipping is refused")

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
        verdict = "SESSION_NOT_COMPLETE"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "SESSION_COMPLETE"

    computed_statuses = [
        r["status"] for r in results
        if r["check"] in ("volume_meets_declared_target",
                          "dedup_arithmetic_consistent",
                          "shortlist_within_unique_pool",
                          "methods_used_are_stated_methods")
    ]
    if any(s == "fail" for s in computed_statuses):
        computed_status = "outside_stated_limits_on_declared_evidence"
    elif all(s == "pass" for s in computed_statuses):
        computed_status = "within_stated_limits_on_declared_evidence"
    else:
        computed_status = None

    return {
        "service": "creative-ideation-session",
        "atom_version": "0.1.0",
        "session_title": manifest.get("session_title"),
        "methods_used": manifest.get("divergence", {}).get("methods_used")
        if isinstance(manifest.get("divergence"), dict) else None,
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "target_idea_count": target if has_target else None,
        "total_ideas_captured": total if has_total else None,
        "volume_gap_ideas": _fmt6(volume_gap),
        "duplicates_removed": duplicates if has_duplicates else None,
        "unique_ideas_after_dedup": unique if has_unique else None,
        "dedup_discrepancy_ideas": _fmt6(dedup_discrepancy),
        "shortlist_count": shortlist_count if has_shortlist else None,
        "methods_used_count": len(methods) if methods_is_list else None,
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
        "CREATIVE IDEATION SESSION",
        f"session: {verdict.get('session_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: creative_ideation_session.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "SESSION_COMPLETE" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
