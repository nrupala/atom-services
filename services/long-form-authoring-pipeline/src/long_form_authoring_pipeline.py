#!/usr/bin/env python3
"""Long-form authoring pipeline — deterministic core.

Built from the bound skill `authoring-pipeline`: "Produce
long-form work systematically — approved outlines, review passes,
versioned builds, clean publishing."

This atom is an AUDIT of a declared long-form authoring record:
it validates the record a caller declares against the skill's
sections — outline as contract, the drafting loop, recorded
review passes, versioning and builds, publishing, and the
feedback loop with the skill's red lines. It does not write,
draft, edit or publish any work, fetch any manuscript, or verify
that a declared control actually happened — it checks that the
record the skill requires is present and internally complete and
consistent on the declared evidence.

The caller submits an authoring manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- units: the declared `units` list must be non-empty, and every
  declared unit row must have a single point and declare a
  non-empty point or outcome (the skill: "each unit has one
  point (courses: one testable outcome)"; quality gate: "units
  map to outcomes/claims");
- review passes: the declared `review_passes` list must be
  non-empty, every declared pass row must be recorded, declare a
  pass type from the skill's own set (structure /
  technical_accuracy / style_read_aloud / facts_attribution),
  and all four of the skill's pass types must be present (the
  skill: "structure pass → technical/accuracy pass (domain
  expert) → style/read-aloud pass → facts/attribution pass";
  quality gate: "Review passes recorded (who, when, what
  changed)").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact).

The skill states no numeric threshold — no word count, unit
count, schedule, readability score, error rate, feedback volume
or drop-off percentage — so no numeric threshold check is
invented; quantities are computed and reported, with completeness
(every declared unit / review pass) as the only bar, exactly as
stated above.

Verdict:
- any fail             -> AUTHORING_PIPELINE_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> AUTHORING_PIPELINE_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "outline_as_contract",
    "drafting_loop",
    "review_passes",
    "versioning_and_builds",
    "publishing",
    "feedback_loop_and_red_lines",
)

REVIEW_PASS_TYPES = (
    "structure",
    "technical_accuracy",
    "style_read_aloud",
    "facts_attribution",
)

MANIFEST_SPEC = {
    "work": "string",
    "outline": {
        "toc_approved_before_drafting": "boolean",
        "chapters_or_modules_defined": "boolean",
        "scope_fences_defined": "boolean",
    },
    "units": [{
        "name": "string",
        "point_or_outcome": "string",
        "has_single_point": "boolean",
    }],
    "drafting": {
        "small_units_used": "boolean",
        "examples_before_abstractions": "boolean",
        "style_sheet_maintained": "boolean",
        "glossary_maintained": "boolean",
    },
    "review": {
        "comments_triaged_not_blind_applied": "boolean",
    },
    "review_passes": [{
        "name": "string",
        "pass_type": "string",
        "recorded": "boolean",
    }],
    "versioning": {
        "sources_in_git_markdown": "boolean",
        "research_kept_separate_from_prose": "boolean",
        "editions_tagged": "boolean",
        "changelog_per_edition": "boolean",
    },
    "builds": {
        "deterministic_pipeline": "boolean",
        "templates_pinned": "boolean",
        "preview_builds_for_reviewers": "boolean",
        "artifacts_hashed": "boolean",
        "artifacts_signed": "boolean",
    },
    "publishing": {
        "distribution_channels_defined": "boolean",
        "metadata_or_platform_setup_complete": "boolean",
        "launch_checklist_completed": "boolean",
        "sample_and_errata_pages_published": "boolean",
    },
    "feedback": {
        "reader_learner_feedback_collected": "boolean",
        "corrections_list_maintained": "boolean",
        "corrections_feed_next_edition": "boolean",
        "errata_visible": "boolean",
        "drop_off_analytics_reviewed": "boolean",
    },
    "red_lines": {
        "published_without_accuracy_pass_present": "boolean",
        "silent_edition_edits_present": "boolean",
        "unverified_quotes_or_attributions_present": "boolean",
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


def evaluate(manifest):
    """Return the verdict dict for an authoring-pipeline manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    units, has_units = _get(manifest, "units")
    units_is_list = has_units and isinstance(units, list)
    units_count = len(units) if units_is_list else None
    urows = units if units_is_list else []

    units_without_single_point = (
        [_row_name(c) for c in urows
         if isinstance(c, dict)
         and "has_single_point" in c
         and c.get("has_single_point") is not True]
        if units_is_list else None
    )
    units_without_point_or_outcome = (
        [_row_name(c) for c in urows
         if isinstance(c, dict)
         and "point_or_outcome" in c
         and c.get("point_or_outcome") == ""]
        if units_is_list else None
    )
    single_point_coverage = (
        sum(1 for c in urows
            if isinstance(c, dict)
            and c.get("has_single_point") is True)
        / units_count
        if units_is_list and units_count > 0 else None
    )
    point_or_outcome_coverage = (
        sum(1 for c in urows
            if isinstance(c, dict)
            and isinstance(c.get("point_or_outcome"), str)
            and len(c.get("point_or_outcome")) > 0)
        / units_count
        if units_is_list and units_count > 0 else None
    )

    passes, has_passes = _get(manifest, "review_passes")
    passes_is_list = has_passes and isinstance(passes, list)
    passes_count = len(passes) if passes_is_list else None
    prows = passes if passes_is_list else []

    review_passes_without_record = (
        [_row_name(c) for c in prows
         if isinstance(c, dict)
         and "recorded" in c
         and c.get("recorded") is not True]
        if passes_is_list else None
    )
    review_passes_with_invalid_type = (
        [_row_name(c) for c in prows
         if isinstance(c, dict)
         and "pass_type" in c
         and c.get("pass_type") not in REVIEW_PASS_TYPES]
        if passes_is_list else None
    )
    missing_review_pass_types = None
    if passes_is_list:
        declared_types = [
            c["pass_type"] for c in prows
            if isinstance(c, dict)
            and isinstance(c.get("pass_type"), str)
        ]
        missing_review_pass_types = [
            t for t in REVIEW_PASS_TYPES if t not in declared_types
        ]
    recorded_coverage = (
        sum(1 for c in prows
            if isinstance(c, dict)
            and c.get("recorded") is True)
        / passes_count
        if passes_is_list and passes_count > 0 else None
    )
    valid_type_coverage = (
        sum(1 for c in prows
            if isinstance(c, dict)
            and c.get("pass_type") in REVIEW_PASS_TYPES)
        / passes_count
        if passes_is_list and passes_count > 0 else None
    )

    # ---- Section 1: outline_as_contract (skill step 1 —
    #      chapters/modules to claims or learning outcomes, TOC
    #      approved BEFORE drafting, scope fences; quality gate:
    #      outline approved before drafting, units map to
    #      outcomes/claims, each unit has one point) ----
    _bool_check(results, "outline_as_contract",
                "toc_approved_before_drafting", manifest,
                ("outline", "toc_approved_before_drafting"),
                "outline as contract: the TOC is approved before "
                "drafting")
    _bool_check(results, "outline_as_contract",
                "chapters_or_modules_defined", manifest,
                ("outline", "chapters_or_modules_defined"),
                "outline as contract: chapters or modules are "
                "defined")
    _bool_check(results, "outline_as_contract",
                "scope_fences_defined", manifest,
                ("outline", "scope_fences_defined"),
                "outline as contract: scope fences — what the "
                "work won't cover — are defined")
    _check(results, "outline_as_contract",
           "units_declared", units, units_is_list,
           units_is_list and units_count > 0,
           "the declared record names its units — the units "
           "list is present and non-empty")
    single_present = (
        units_is_list
        and all(isinstance(c, dict) and "has_single_point" in c
                for c in urows)
    )
    _check(results, "outline_as_contract",
           "every_unit_has_single_point", units, single_present,
           units_is_list and units_count > 0
           and all(isinstance(c, dict)
                   and c.get("has_single_point") is True
                   for c in urows),
           "outline as contract: every declared unit row has "
           "one point")
    outcome_present = (
        units_is_list
        and all(isinstance(c, dict) and "point_or_outcome" in c
                for c in urows)
    )
    _check(results, "outline_as_contract",
           "every_unit_point_or_outcome_declared", units,
           outcome_present,
           units_is_list and units_count > 0
           and all(isinstance(c, dict)
                   and isinstance(c.get("point_or_outcome"), str)
                   and len(c.get("point_or_outcome")) > 0
                   for c in urows),
           "outline as contract: every declared unit row maps "
           "to a claim or learning outcome — its point or "
           "outcome is declared and non-empty")

    # ---- Section 2: drafting_loop (skill step 2 — small units,
    #      examples before abstractions, running style sheet and
    #      glossary for consistency) ----
    _bool_check(results, "drafting_loop",
                "small_units_used", manifest,
                ("drafting", "small_units_used"),
                "drafting loop: drafting proceeds in small units")
    _bool_check(results, "drafting_loop",
                "examples_before_abstractions", manifest,
                ("drafting", "examples_before_abstractions"),
                "drafting loop: examples come before abstractions")
    _bool_check(results, "drafting_loop",
                "style_sheet_maintained", manifest,
                ("drafting", "style_sheet_maintained"),
                "drafting loop: a running style sheet is "
                "maintained for consistency")
    _bool_check(results, "drafting_loop",
                "glossary_maintained", manifest,
                ("drafting", "glossary_maintained"),
                "drafting loop: a glossary is maintained for "
                "consistency")

    # ---- Section 3: review_passes (skill step 3 — structure,
    #      technical/accuracy, style/read-aloud and
    #      facts/attribution passes, recorded; comments triaged,
    #      not blind-applied; quality gate: review passes
    #      recorded — who, when, what changed) ----
    _bool_check(results, "review_passes",
                "comments_triaged_not_blind_applied", manifest,
                ("review", "comments_triaged_not_blind_applied"),
                "review passes: comments are triaged, not "
                "blind-applied")
    _check(results, "review_passes",
           "review_passes_declared", passes, passes_is_list,
           passes_is_list and passes_count > 0,
           "the declared record names its review passes — the "
           "review_passes list is present and non-empty")
    recorded_present = (
        passes_is_list
        and all(isinstance(c, dict) and "recorded" in c
                for c in prows)
    )
    _check(results, "review_passes",
           "every_review_pass_recorded", passes, recorded_present,
           passes_is_list and passes_count > 0
           and all(isinstance(c, dict)
                   and c.get("recorded") is True
                   for c in prows),
           "review passes: every declared review pass row is "
           "recorded — who, when, what changed")
    ptype_present = (
        passes_is_list
        and all(isinstance(c, dict) and "pass_type" in c
                for c in prows)
    )
    _check(results, "review_passes",
           "every_review_pass_type_valid", passes, ptype_present,
           passes_is_list and passes_count > 0
           and all(isinstance(c, dict)
                   and c.get("pass_type") in REVIEW_PASS_TYPES
                   for c in prows),
           "review passes: every declared review pass row "
           "declares a pass type from the skill's set — "
           "structure / technical_accuracy / style_read_aloud / "
           "facts_attribution")
    _check(results, "review_passes",
           "all_required_review_pass_types_present", passes,
           ptype_present,
           passes_is_list and missing_review_pass_types is not None
           and len(missing_review_pass_types) == 0,
           "review passes: all four of the skill's pass types "
           "are present — structure, technical/accuracy, "
           "style/read-aloud and facts/attribution")

    # ---- Section 4: versioning_and_builds (skill steps 4-5 —
    #      sources in git (markdown), research separate from
    #      prose, editions tagged, changelog per edition;
    #      deterministic pipeline, pinned templates, preview
    #      builds, artifacts hashed and signed; quality gate:
    #      build reproducible, artifacts signed, previews
    #      distributed) ----
    _bool_check(results, "versioning_and_builds",
                "sources_in_git_markdown", manifest,
                ("versioning", "sources_in_git_markdown"),
                "versioning: sources are in git, in markdown")
    _bool_check(results, "versioning_and_builds",
                "research_kept_separate_from_prose", manifest,
                ("versioning", "research_kept_separate_from_prose"),
                "versioning: research is kept separate from prose")
    _bool_check(results, "versioning_and_builds",
                "editions_tagged", manifest,
                ("versioning", "editions_tagged"),
                "versioning: editions are tagged")
    _bool_check(results, "versioning_and_builds",
                "changelog_per_edition", manifest,
                ("versioning", "changelog_per_edition"),
                "versioning: a changelog is kept per edition")
    _bool_check(results, "versioning_and_builds",
                "deterministic_pipeline", manifest,
                ("builds", "deterministic_pipeline"),
                "builds: the build pipeline is deterministic — "
                "markdown to HTML / ebook / PDF")
    _bool_check(results, "versioning_and_builds",
                "templates_pinned", manifest,
                ("builds", "templates_pinned"),
                "builds: templates are pinned")
    _bool_check(results, "versioning_and_builds",
                "preview_builds_for_reviewers", manifest,
                ("builds", "preview_builds_for_reviewers"),
                "builds: preview builds are distributed for "
                "reviewers")
    _bool_check(results, "versioning_and_builds",
                "artifacts_hashed", manifest,
                ("builds", "artifacts_hashed"),
                "builds: artifacts are hashed")
    _bool_check(results, "versioning_and_builds",
                "artifacts_signed", manifest,
                ("builds", "artifacts_signed"),
                "builds: artifacts are signed")

    # ---- Section 5: publishing (skill step 6 — distribution
    #      channels defined; book metadata or course platform
    #      setup; launch checklist; sample/errata pages) ----
    _bool_check(results, "publishing",
                "distribution_channels_defined", manifest,
                ("publishing", "distribution_channels_defined"),
                "publishing: distribution channels are defined")
    _bool_check(results, "publishing",
                "metadata_or_platform_setup_complete", manifest,
                ("publishing", "metadata_or_platform_setup_complete"),
                "publishing: book metadata — ISBN, description, "
                "cover — or course platform setup, including "
                "entitlements, is complete")
    _bool_check(results, "publishing",
                "launch_checklist_completed", manifest,
                ("publishing", "launch_checklist_completed"),
                "publishing: the launch checklist is completed")
    _bool_check(results, "publishing",
                "sample_and_errata_pages_published", manifest,
                ("publishing", "sample_and_errata_pages_published"),
                "publishing: sample and errata pages are "
                "published")

    # ---- Section 6: feedback_loop_and_red_lines (skill step 7
    #      and quality gates — reader/learner feedback to a
    #      corrections list to the next edition, errata visible,
    #      drop-off analytics for courses, errata/feedback
    #      channel live; red lines — no publishing without an
    #      accuracy pass, no silent edits across editions,
    #      quotes and attributions verified) ----
    _bool_check(results, "feedback_loop_and_red_lines",
                "reader_learner_feedback_collected", manifest,
                ("feedback", "reader_learner_feedback_collected"),
                "feedback loop: reader or learner feedback is "
                "collected")
    _bool_check(results, "feedback_loop_and_red_lines",
                "corrections_list_maintained", manifest,
                ("feedback", "corrections_list_maintained"),
                "feedback loop: feedback feeds a corrections list")
    _bool_check(results, "feedback_loop_and_red_lines",
                "corrections_feed_next_edition", manifest,
                ("feedback", "corrections_feed_next_edition"),
                "feedback loop: the corrections list feeds the "
                "next edition")
    _bool_check(results, "feedback_loop_and_red_lines",
                "errata_visible", manifest,
                ("feedback", "errata_visible"),
                "feedback loop: errata are visible — the errata "
                "and feedback channel is live")
    _bool_check(results, "feedback_loop_and_red_lines",
                "drop_off_analytics_reviewed", manifest,
                ("feedback", "drop_off_analytics_reviewed"),
                "feedback loop: analytics on drop-off points are "
                "reviewed")
    _false_check(results, "feedback_loop_and_red_lines",
                 "no_publishing_without_accuracy_pass", manifest,
                 ("red_lines", "published_without_accuracy_pass_present"),
                 "red line: no publishing without an accuracy "
                 "pass is present")
    _false_check(results, "feedback_loop_and_red_lines",
                 "no_silent_edition_edits", manifest,
                 ("red_lines", "silent_edition_edits_present"),
                 "red line: no silent edition edits are present "
                 "— no silent edits across editions")
    _false_check(results, "feedback_loop_and_red_lines",
                 "no_unverified_quotes_or_attributions", manifest,
                 ("red_lines",
                  "unverified_quotes_or_attributions_present"),
                 "red line: no unverified quotes or attributions "
                 "are present — quotes and attributions are "
                 "verified")

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
        verdict = "AUTHORING_PIPELINE_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "AUTHORING_PIPELINE_SOUND"

    computed_names = (
        "units_declared",
        "every_unit_has_single_point",
        "every_unit_point_or_outcome_declared",
        "review_passes_declared",
        "every_review_pass_recorded",
        "every_review_pass_type_valid",
        "all_required_review_pass_types_present",
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
        "service": "long-form-authoring-pipeline",
        "atom_version": "0.1.0",
        "work": manifest.get("work"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "units_count": units_count,
        "units_without_single_point": units_without_single_point,
        "single_point_coverage": _fmt6(single_point_coverage),
        "units_without_point_or_outcome": units_without_point_or_outcome,
        "point_or_outcome_coverage": _fmt6(point_or_outcome_coverage),
        "review_passes_count": passes_count,
        "review_passes_without_record": review_passes_without_record,
        "recorded_review_pass_coverage": _fmt6(recorded_coverage),
        "review_passes_with_invalid_type": review_passes_with_invalid_type,
        "valid_review_pass_type_coverage": _fmt6(valid_type_coverage),
        "missing_review_pass_types": missing_review_pass_types,
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
        "LONG FORM AUTHORING PIPELINE",
        f"work: {verdict.get('work')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: long_form_authoring_pipeline.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "AUTHORING_PIPELINE_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
