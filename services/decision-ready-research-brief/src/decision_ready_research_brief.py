#!/usr/bin/env python3
"""Decision-ready research brief — deterministic core.

Built from the bound skill `research-tooling`: "Research exists
to answer a question someone will act on. Scope it, triangulate
sources, keep evidence notes, and deliver a decision-ready
report."

This atom is an AUDIT of a declared research-brief record: it
validates the record a caller declares against the skill's
method — scope first, source strategy, notes discipline,
synthesis, report format, reuse, tooling discipline, quality
gates and red lines. It does not perform research, fetch any
source, read any link, or verify that a declared source, claim
or control is actually true — it checks that the record the
skill requires is present and internally complete and
consistent on the declared evidence.

The caller submits a research-brief manifest (a dict, or JSON
on the CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- questions, sources and claims: the declared `questions`,
  `sources` and `claims` lists must each be present and
  non-empty;
- provenance: every declared source row must name a non-empty
  link, a non-empty date and a non-empty quote (skill: track
  provenance — link + date + quote), declare its source type,
  and declare its incentives noted;
- sourcing: every material claim must name at least one
  supporting source that is actually declared (skill / red line:
  "Every material claim sourced", "No unsourced claims");
- triangulation: every important claim must name at least two
  distinct supporting sources that are actually declared
  (skill: "triangulate important claims across independent
  sources"; red line: "no single-source conclusions on
  important facts" — so one source is not enough and two
  matching declared sources is the skill's own bar, not an
  imported threshold);
- confidence and kind: every declared claim row must declare
  `confidence_stated: true` and a non-empty `kind` (fact /
  estimate / opinion separation starts from each claim being
  labelled — no kind vocabulary is imposed, the skill names
  the three kinds as examples of the separation it requires);
- report structure: the declared `report_sections` list must
  equal the skill's report format in order — bluf, findings,
  evidence, risks, open_questions, sources — and the report
  must declare a non-empty version and a non-empty date
  (skill: "version + date on every report");
- four check groups are conditional, following the skill's own
  scoping: the AI-summary citation and spot-check checks bind
  only when AI summaries are declared in use, the scraped /
  automated data quality check binds only when such data is
  declared in use, and the conflict-disclosure check binds
  only when conflicts are declared present.

Computed ratios are serialized as strings with exactly four
decimal places, produced in both implementations by the same
fixed rule — round half up to 4dp, floor(v * 10000 + 0.5) /
10000, then format with exactly four decimals; comparisons use
the unrounded values. That fixed serialization is what makes
the Python and TypeScript outputs byte-identical. Counts are
reported as integers (exact). Declared sources without complete
provenance are reported by name as
`sources_without_complete_provenance`; material claims naming
no matching declared source are reported as
`material_claims_without_sources`; important claims naming
fewer than two distinct matching declared sources are reported
as `important_claims_not_triangulated`. The computed outcome
over the six primary computed checks is reported as
`computed_status`.

The skill states no numeric threshold — no source count, claim
count, question count, confidence level, timebox duration,
source-age / freshness limit, or quantification rate — so no
numeric threshold check is invented; quantities are computed
and reported, and completeness (every declared source / every
material claim / every important claim) is the only bar,
exactly as stated above.

Verdict:
- any fail             -> RESEARCH_BRIEF_NOT_DECISION_READY
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> RESEARCH_BRIEF_DECISION_READY

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism
is the product.
"""
import json
import math
import sys

SECTIONS = (
    "scoping_and_sources",
    "evidence_and_notes",
    "synthesis_and_report_structure",
    "reuse_verification_and_red_lines",
)

REPORT_SECTION_ORDER = (
    "bluf",
    "findings",
    "evidence",
    "risks",
    "open_questions",
    "sources",
)

# Documented manifest field types (SERVICE.md input table). Every
# field the core reads is listed, in read order. A field present
# with the wrong JSON type is a caller error (ValueError -> the
# gateway's HTTP 422 invalid_input), never evidence: F1 remedy,
# external verification Wave 1. Absent fields are not validated —
# absence is missing evidence, decided by the checks below.
MANIFEST_SPEC = {
    "brief": "string",
    "scope": {
        "decision_named": "boolean",
        "questions_ranked": "boolean",
        "timebox_declared": "boolean",
        "timebox_respected": "boolean",
        "enough_criteria_defined": "boolean",
    },
    "questions": [{
        "name": "string",
    }],
    "source_strategy": {
        "primary_preferred_over_secondary_and_tertiary": "boolean",
    },
    "sources": [{
        "name": "string",
        "link": "string",
        "date": "string",
        "quote": "string",
        "source_type": "string",
        "incentives_noted": "boolean",
    }],
    "evidence": {
        "notes_question_oriented": "boolean",
        "evidence_table_present": "boolean",
        "fact_estimate_opinion_separated": "boolean",
        "gaps_recorded": "boolean",
    },
    "claims": [{
        "name": "string",
        "kind": "string",
        "material": "boolean",
        "important": "boolean",
        "supporting_source_names": ["string"],
        "confidence_stated": "boolean",
    }],
    "synthesis": {
        "structured_by_question": "boolean",
        "opposing_view_steelmanned": "boolean",
        "quantified_where_possible": "boolean",
        "confidence_stated": "boolean",
        "unknowns_stated_explicitly": "boolean",
    },
    "report": {
        "version": "string",
        "date": "string",
        "open_questions_listed": "boolean",
    },
    "report_sections": ["string"],
    "reuse": {
        "notes_archived_for_reuse": "boolean",
        "updates_via_changelog": "boolean",
        "silent_edits_present": "boolean",
    },
    "tooling": {
        "automation_does_not_replace_verification": "boolean",
        "ai_summaries_used": "boolean",
        "ai_summaries_cite_sources": "boolean",
        "ai_summaries_spot_checked": "boolean",
        "seo_spam_and_content_farms_screened": "boolean",
        "scraped_or_automated_data_used": "boolean",
        "scraped_or_automated_data_quality_checked": "boolean",
    },
    "disclosure": {
        "conflicts_present": "boolean",
        "conflicts_disclosed": "boolean",
        "unsourced_claims_present": "boolean",
        "single_source_conclusions_on_important_facts_present": "boolean",
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


def _nonempty_str(entry, field):
    return (
        isinstance(entry, dict)
        and isinstance(entry.get(field), str)
        and len(entry[field]) > 0
    )


def _has_complete_provenance(entry):
    return (
        _nonempty_str(entry, "link")
        and _nonempty_str(entry, "date")
        and _nonempty_str(entry, "quote")
    )


def evaluate(manifest):
    """Return the verdict dict for a research-brief manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    questions, has_questions = _get(manifest, "questions")
    questions_is_list = has_questions and isinstance(questions, list)
    sources, has_sources = _get(manifest, "sources")
    sources_is_list = has_sources and isinstance(sources, list)
    claims, has_claims = _get(manifest, "claims")
    claims_is_list = has_claims and isinstance(claims, list)
    report_sections, has_report_sections = _get(manifest, "report_sections")
    report_sections_is_list = (
        has_report_sections and isinstance(report_sections, list)
    )

    questions_count = len(questions) if questions_is_list else None
    sources_count = len(sources) if sources_is_list else None
    claims_count = len(claims) if claims_is_list else None

    declared_source_names = (
        {s["name"] for s in sources
         if isinstance(s, dict) and isinstance(s.get("name"), str)}
        if sources_is_list else set()
    )

    def _matching_count(claim):
        if not isinstance(claim, dict):
            return 0
        supporting = claim.get("supporting_source_names")
        if not isinstance(supporting, list):
            return 0
        return len({n for n in supporting
                    if isinstance(n, str)
                    and n in declared_source_names})

    sources_without_provenance = (
        [_row_name(s) for s in sources
         if not _has_complete_provenance(s)]
        if sources_is_list else None
    )
    provenance_coverage = (
        (sources_count - len(sources_without_provenance)) / sources_count
        if sources_is_list and sources_count > 0 else None
    )

    material_claims = (
        [c for c in claims
         if isinstance(c, dict) and c.get("material") is True]
        if claims_is_list else []
    )
    material_without_sources = (
        [_row_name(c) for c in material_claims
         if isinstance(c.get("supporting_source_names"), list)
         and _matching_count(c) == 0]
        if claims_is_list and sources_is_list else None
    )
    material_covered = (
        sum(1 for c in material_claims if _matching_count(c) >= 1)
        if claims_is_list and sources_is_list else None
    )
    material_coverage = (
        material_covered / len(material_claims)
        if material_covered is not None and len(material_claims) > 0
        else None
    )

    important_claims = (
        [c for c in claims
         if isinstance(c, dict) and c.get("important") is True]
        if claims_is_list else []
    )
    important_not_triangulated = (
        [_row_name(c) for c in important_claims
         if isinstance(c.get("supporting_source_names"), list)
         and _matching_count(c) < 2]
        if claims_is_list and sources_is_list else None
    )
    important_triangulated = (
        sum(1 for c in important_claims if _matching_count(c) >= 2)
        if claims_is_list and sources_is_list else None
    )
    triangulation_coverage = (
        important_triangulated / len(important_claims)
        if important_triangulated is not None
        and len(important_claims) > 0 else None
    )

    # ---- Section 1: scoping_and_sources (skill: scope first —
    #      the decision this serves, ranked questions, timebox,
    #      what "enough" looks like; source strategy — primary >
    #      secondary > tertiary, note each source's incentives,
    #      track provenance link + date + quote) ----
    _bool_check(results, "scoping_and_sources", "decision_named",
                manifest, ("scope", "decision_named"),
                "scope first: the decision this research serves is "
                "named — no decision, the research is questioned")
    _bool_check(results, "scoping_and_sources", "questions_ranked",
                manifest, ("scope", "questions_ranked"),
                "scope first: the questions are ranked")
    _check(results, "scoping_and_sources", "questions_declared",
           questions, questions_is_list,
           questions_is_list and questions_count > 0,
           "scope first: the declared brief record names its "
           "questions — the questions list is present and non-empty")
    _bool_check(results, "scoping_and_sources", "timebox_declared",
                manifest, ("scope", "timebox_declared"),
                "scope first: a timebox is declared")
    _bool_check(results, "scoping_and_sources", "timebox_respected",
                manifest, ("scope", "timebox_respected"),
                "quality gate: the timebox is respected")
    _bool_check(results, "scoping_and_sources",
                "enough_criteria_defined", manifest,
                ("scope", "enough_criteria_defined"),
                "scope first: what \"enough\" looks like is defined")
    _bool_check(results, "scoping_and_sources",
                "primary_sources_preferred", manifest,
                ("source_strategy",
                 "primary_preferred_over_secondary_and_tertiary"),
                "source strategy: primary sources (filings, docs, "
                "data) are preferred over secondary, and secondary "
                "over tertiary")
    _check(results, "scoping_and_sources", "sources_declared",
           sources, sources_is_list,
           sources_is_list and sources_count > 0,
           "source strategy: the declared brief record names its "
           "sources — the sources list is present and non-empty")
    for field, check_name, label in (
        ("link", "every_source_has_link",
         "every declared source row names a non-empty link"),
        ("date", "every_source_has_date",
         "every declared source row names a non-empty date"),
        ("quote", "every_source_has_quote",
         "every declared source row names a non-empty quote"),
        ("source_type", "every_source_declares_source_type",
         "every declared source row declares its source type"),
    ):
        field_present = (
            sources_is_list
            and all(isinstance(s, dict) and field in s for s in sources)
        )
        _check(results, "scoping_and_sources", check_name, sources,
               field_present,
               sources_is_list and sources_count > 0
               and all(_nonempty_str(s, field) for s in sources),
               f"source strategy / provenance: {label} — provenance "
               "is tracked as link + date + quote")
    incentives_present = (
        sources_is_list
        and all(isinstance(s, dict) and "incentives_noted" in s
                for s in sources)
    )
    _check(results, "scoping_and_sources",
           "every_source_incentives_noted", sources,
           incentives_present,
           sources_is_list and sources_count > 0
           and all(isinstance(s, dict)
                   and s.get("incentives_noted") is True
                   for s in sources),
           "source strategy: every declared source row declares "
           "its incentives noted")

    # ---- Section 2: evidence_and_notes (skill: notes discipline
    #      — question-oriented notes, an evidence table of claim
    #      -> sources -> confidence -> gaps, separate fact /
    #      estimate / opinion; quality gate — every material claim
    #      sourced, confidence stated; red line — no single-source
    #      conclusions on important facts) ----
    _check(results, "evidence_and_notes", "claims_declared",
           claims, claims_is_list,
           claims_is_list and claims_count > 0,
           "notes discipline: the declared brief record names its "
           "claims — the claims list is present and non-empty")
    _bool_check(results, "evidence_and_notes",
                "notes_question_oriented", manifest,
                ("evidence", "notes_question_oriented"),
                "notes discipline: notes are question-oriented, "
                "not dumps")
    _bool_check(results, "evidence_and_notes",
                "evidence_table_present", manifest,
                ("evidence", "evidence_table_present"),
                "notes discipline: an evidence table is present — "
                "claim to sources to confidence to gaps")
    _bool_check(results, "evidence_and_notes",
                "fact_estimate_opinion_separated", manifest,
                ("evidence", "fact_estimate_opinion_separated"),
                "notes discipline: fact, estimate and opinion are "
                "separated")
    _bool_check(results, "evidence_and_notes", "gaps_recorded",
                manifest, ("evidence", "gaps_recorded"),
                "notes discipline: gaps are recorded in the "
                "evidence table")
    material_present = (
        claims_is_list and sources_is_list
        and all(isinstance(c, dict) and "material" in c for c in claims)
        and all("supporting_source_names" in c
                for c in material_claims)
    )
    _check(results, "evidence_and_notes",
           "every_material_claim_sourced_from_declared_sources",
           claims, material_present,
           claims_is_list and sources_is_list and claims_count > 0
           and material_without_sources is not None
           and len(material_without_sources) == 0
           and material_covered == len(material_claims),
           "quality gate / red line: every material claim is "
           "sourced — it names at least one supporting source "
           "that is actually declared; no unsourced claims")
    important_present = (
        claims_is_list and sources_is_list
        and all(isinstance(c, dict) and "important" in c for c in claims)
        and all("supporting_source_names" in c
                for c in important_claims)
    )
    _check(results, "evidence_and_notes",
           "every_important_claim_triangulated_across_declared_sources",
           claims, important_present,
           claims_is_list and sources_is_list and claims_count > 0
           and important_not_triangulated is not None
           and len(important_not_triangulated) == 0
           and important_triangulated == len(important_claims),
           "source strategy / red line: every important claim is "
           "triangulated — it names at least two distinct "
           "supporting sources that are actually declared; no "
           "single-source conclusions on important facts")
    confidence_present = (
        claims_is_list
        and all(isinstance(c, dict) and "confidence_stated" in c
                for c in claims)
    )
    _check(results, "evidence_and_notes",
           "every_claim_confidence_stated", claims,
           confidence_present,
           claims_is_list and claims_count > 0
           and all(isinstance(c, dict)
                   and c.get("confidence_stated") is True
                   for c in claims),
           "quality gate: every declared claim row declares its "
           "confidence stated")
    kind_present = (
        claims_is_list
        and all(isinstance(c, dict) and "kind" in c for c in claims)
    )
    _check(results, "evidence_and_notes",
           "every_claim_kind_declared", claims, kind_present,
           claims_is_list and claims_count > 0
           and all(_nonempty_str(c, "kind") for c in claims),
           "notes discipline: every declared claim row declares "
           "a non-empty kind — the fact / estimate / opinion "
           "separation starts from each claim being labelled")

    # ---- Section 3: synthesis_and_report_structure (skill:
    #      synthesis — structure by question, steelman opposing
    #      views, quantify where possible, state confidence and
    #      unknowns explicitly; report format — BLUF, findings,
    #      evidence, risks, open questions, sources, in that
    #      order; version + date on every report; quality gate —
    #      opposing view presented, open questions listed) ----
    _bool_check(results, "synthesis_and_report_structure",
                "synthesis_structured_by_question", manifest,
                ("synthesis", "structured_by_question"),
                "synthesis: the brief is structured by question")
    _bool_check(results, "synthesis_and_report_structure",
                "opposing_view_steelmanned", manifest,
                ("synthesis", "opposing_view_steelmanned"),
                "synthesis / quality gate: opposing views are "
                "presented as a steelman")
    _bool_check(results, "synthesis_and_report_structure",
                "quantified_where_possible", manifest,
                ("synthesis", "quantified_where_possible"),
                "synthesis: findings are quantified where possible")
    _bool_check(results, "synthesis_and_report_structure",
                "synthesis_confidence_stated", manifest,
                ("synthesis", "confidence_stated"),
                "synthesis: confidence is stated explicitly")
    _bool_check(results, "synthesis_and_report_structure",
                "unknowns_stated_explicitly", manifest,
                ("synthesis", "unknowns_stated_explicitly"),
                "synthesis: unknowns are stated explicitly")
    _check(results, "synthesis_and_report_structure",
           "report_sections_in_skill_order", report_sections,
           report_sections_is_list,
           report_sections_is_list
           and list(report_sections) == list(REPORT_SECTION_ORDER),
           "report format: the declared report sections are "
           "exactly the skill's format in order — bluf, findings, "
           "evidence, risks, open_questions, sources")
    version, has_version = _get(manifest, "report", "version")
    _check(results, "synthesis_and_report_structure",
           "report_version_declared", version, has_version,
           isinstance(version, str) and len(version) > 0,
           "report format: the report declares a non-empty "
           "version — version and date go on every report")
    date, has_date = _get(manifest, "report", "date")
    _check(results, "synthesis_and_report_structure",
           "report_date_declared", date, has_date,
           isinstance(date, str) and len(date) > 0,
           "report format: the report declares a non-empty date "
           "— version and date go on every report")
    _bool_check(results, "synthesis_and_report_structure",
                "open_questions_listed", manifest,
                ("report", "open_questions_listed"),
                "quality gate: open questions are listed")

    # ---- Section 4: reuse_verification_and_red_lines (skill:
    #      reuse — store notes for future questions, update
    #      reports when facts change via changelog, not silent
    #      edits; tooling discipline — automation never replaces
    #      verification, AI summaries cite sources and are
    #      spot-checked, watch for SEO spam and content farms,
    #      quality-check scraped / automated data before use;
    #      red lines — disclose conflicts, no unsourced claims,
    #      no single-source conclusions on important facts) ----
    _bool_check(results, "reuse_verification_and_red_lines",
                "notes_archived_for_reuse", manifest,
                ("reuse", "notes_archived_for_reuse"),
                "reuse: notes are stored and archived for future "
                "questions")
    _bool_check(results, "reuse_verification_and_red_lines",
                "updates_via_changelog", manifest,
                ("reuse", "updates_via_changelog"),
                "reuse: reports are updated when facts change via "
                "a changelog")
    _false_check(results, "reuse_verification_and_red_lines",
                 "no_silent_edits", manifest,
                 ("reuse", "silent_edits_present"),
                 "reuse / anti-pattern: no silent edits — updates "
                 "are a changelog, not silent edits")
    _bool_check(results, "reuse_verification_and_red_lines",
                "automation_does_not_replace_verification", manifest,
                ("tooling",
                 "automation_does_not_replace_verification"),
                "tooling discipline: automation speeds collection "
                "but never replaces verification")
    _gated_bool_check(
        results, "reuse_verification_and_red_lines",
        "ai_summaries_cite_sources_when_used", manifest,
        ("tooling", "ai_summaries_used"),
        ("tooling", "ai_summaries_cite_sources"),
        "tooling discipline: AI summaries cite sources",
        "no AI summaries declared in use")
    _gated_bool_check(
        results, "reuse_verification_and_red_lines",
        "ai_summaries_spot_checked_when_used", manifest,
        ("tooling", "ai_summaries_used"),
        ("tooling", "ai_summaries_spot_checked"),
        "tooling discipline: AI summaries are spot-checked",
        "no AI summaries declared in use")
    _bool_check(results, "reuse_verification_and_red_lines",
                "seo_spam_and_content_farms_screened", manifest,
                ("tooling", "seo_spam_and_content_farms_screened"),
                "tooling discipline: results are watched for SEO "
                "spam and content farms")
    _gated_bool_check(
        results, "reuse_verification_and_red_lines",
        "scraped_or_automated_data_quality_checked_when_used",
        manifest, ("tooling", "scraped_or_automated_data_used"),
        ("tooling", "scraped_or_automated_data_quality_checked"),
        "tooling discipline / red line: scraped and automated "
        "data is quality-checked before use",
        "no scraped or automated data declared in use")
    _gated_bool_check(
        results, "reuse_verification_and_red_lines",
        "conflicts_disclosed_when_present", manifest,
        ("disclosure", "conflicts_present"),
        ("disclosure", "conflicts_disclosed"),
        "red line: conflicts are disclosed",
        "no conflicts declared present")
    _false_check(results, "reuse_verification_and_red_lines",
                 "no_unsourced_claims", manifest,
                 ("disclosure", "unsourced_claims_present"),
                 "red line: no unsourced claims")
    _false_check(results, "reuse_verification_and_red_lines",
                 "no_single_source_conclusions_on_important_facts",
                 manifest,
                 ("disclosure",
                  "single_source_conclusions_on_important_facts_present"),
                 "red line: no single-source conclusions on "
                 "important facts")

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
        verdict = "RESEARCH_BRIEF_NOT_DECISION_READY"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "RESEARCH_BRIEF_DECISION_READY"

    computed_names = (
        "questions_declared",
        "sources_declared",
        "claims_declared",
        "every_material_claim_sourced_from_declared_sources",
        "every_important_claim_triangulated_across_declared_sources",
        "report_sections_in_skill_order",
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
        "service": "decision-ready-research-brief",
        "atom_version": "0.1.0",
        "brief": manifest.get("brief"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "questions_count": questions_count,
        "sources_count": sources_count,
        "sources_without_complete_provenance": sources_without_provenance,
        "source_provenance_coverage": _fmt4(provenance_coverage),
        "claims_count": claims_count,
        "material_claims_without_sources": material_without_sources,
        "material_claim_source_coverage": _fmt4(material_coverage),
        "important_claims_not_triangulated": important_not_triangulated,
        "important_claim_triangulation_coverage": _fmt4(
            triangulation_coverage),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across four sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "DECISION-READY RESEARCH BRIEF",
        f"brief: {verdict.get('brief')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: decision_ready_research_brief.py <manifest.json>",
              file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "RESEARCH_BRIEF_DECISION_READY" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
