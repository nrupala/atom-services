#!/usr/bin/env python3
"""Sourced podcast episode production — deterministic core.

Built from the bound skill `podcast-production`: "Scope, script,
narrate, and document an episode where every claim traces to a
source in the notes." Its method is this atom's method: scope
topic, audience, length and single main point (and whether the
episode is private or for publishing) before writing; collect
sources before writing and keep the list beside the draft;
outline so each section earns its place (open with the point,
support it in order, close with what matters); write for the
ear (short sentences, signposts, no visual references) and mark
every quote and statistic with its source; check the script
claim by claim and cut or soften anything unsupported; narrate
only the approved script (voice and pace confirmed, long
scripts chunked at section breaks); assemble and listen back to
the opening and the joins, fixing misreads and awkward joins;
write show notes with a summary, the main points and the
complete source list; publish or schedule only inside the exact
authorized scope. Its red lines are this atom's red lines:
never fabricate a quote, statistic or source; never attribute
words a source does not show a person saying; never publish
beyond the authorized scope; never present an AI-narrated
episode as a human recording without disclosure; never use
copyrighted audio or music without a clear right to it.

This atom is a DELIVERABLE audit of a declared episode
production record: it audits the record a caller declares —
the scoping, the declared outline-section rows, the declared
source rows, the declared quote/statistic claim rows with
their declared source references, the script, narration and
assembly declarations, the show-notes source list, the rights,
guest-release and publishing declarations, and the red lines
refused. It produces no audio, writes no script, fetches no
source, verifies no citation against the world and judges no
episode's quality — it checks that the production record the
skill requires is present and internally consistent on the
declared evidence, and it recomputes the traceability of the
declared claims against the declared sources exactly.

Distinct ground: the nearest siblings are
`long-form-authoring-pipeline` (a declared long-form written
work — outline, drafting loop, review passes, versioning and
publishing of prose), `local-voice-stack-engineering-pack`
(the engineering of a local TTS/STT stack itself) and
`meeting-decisions-and-actions-extract` (decisions, actions
and open questions extracted from one meeting's notes). This
atom shares zero checks with any of them: every check here is
an episode-production question — an episode scoped before
writing, declared sources collected first, every declared
quote/statistic claim marked in the script and tracing to a
declared source, a script written for the ear, narration and
assembly listened back at the opening and joins, show notes
whose declared source list matches the declared sources, and
publishing kept inside its authorized scope. The boundary is:
one sourced episode's production record here; a written work's
authoring pipeline, a voice stack's engineering, and a
meeting's extraction there.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- outline sections: at least one declared row, unique section
  ids, a non-empty purpose on every row, and every row declared
  to support the episode's main point;
- sources: at least one declared row, unique source ids, and a
  non-empty recorded citation on every row;
- claims: at least one declared row, unique claim ids, every
  claim kind one of `quote` / `statistic` (the two kinds the
  skill names for source-marking), every claim's declared
  source_id naming one of the declared sources, and every claim
  declared marked with its source in the script;
- show notes: the source ids declared included in the show
  notes must be exactly the declared source ids — none missing,
  none extra;
- gated declarations: a right to copyrighted audio/music is
  required only where such use is declared, guest releases only
  where guest voices are declared, publishing authorization /
  destination / timing only where publishing or scheduling is
  declared planned, and AI-narration disclosure only where AI
  narration is declared.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no numeric threshold at all — no target
length in minutes, no source count, no claim count, no
listening-back duration, no loudness or audio-quality bar — so
no such check is invented; those quantities are caller
declarations at most, and quantities here are computed and
reported, with exact traceability and completeness over the
caller's own declared rows as the only bars.

Verdict:
- any fail             -> EPISODE_PRODUCTION_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> EPISODE_PRODUCTION_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "episode_scoping_and_outline",
    "sources_and_claim_traceability",
    "script_for_listening",
    "narration_and_assembly_qc",
    "show_notes_and_rights",
    "publishing_and_disclosure",
    "red_lines",
)

CLAIM_KINDS = ("quote", "statistic")

MANIFEST_SPEC = {
    "episode_title": "string",
    "scoping": {
        "topic_scoped": "boolean",
        "audience_scoped": "boolean",
        "target_length_scoped": "boolean",
        "main_point_scoped": "boolean",
        "distribution_intent_confirmed": "boolean",
        "scoped_before_writing": "boolean",
    },
    "episode_sections": [{
        "section_id": "string",
        "purpose": "string",
        "supports_main_point": "boolean",
    }],
    "source_work": {
        "sources_collected_before_writing": "boolean",
        "source_list_kept_beside_draft": "boolean",
        "script_checked_claim_by_claim_against_sources": "boolean",
        "unsupported_claims_cut_or_softened": "boolean",
    },
    "sources": [{
        "source_id": "string",
        "citation": "string",
    }],
    "claims": [{
        "claim_id": "string",
        "claim_kind": "string",
        "source_id": "string",
        "source_marked_in_script": "boolean",
    }],
    "script": {
        "written_for_the_ear": "boolean",
        "uses_short_sentences": "boolean",
        "uses_signposts": "boolean",
        "has_no_visual_references": "boolean",
        "opens_with_main_point": "boolean",
        "supports_point_in_order": "boolean",
        "closes_with_what_matters": "boolean",
        "approved_before_narration": "boolean",
    },
    "narration": {
        "voice_confirmed": "boolean",
        "pace_confirmed": "boolean",
        "long_script_chunked_at_section_breaks_where_long": "boolean",
        "audio_assembled": "boolean",
        "opening_listen_back_checked": "boolean",
        "section_joins_listen_back_checked": "boolean",
        "misreads_and_awkward_joins_fixed": "boolean",
        "ai_narrated": "boolean",
    },
    "show_notes": {
        "summary_included": "boolean",
        "main_points_included": "boolean",
        "complete_source_list_included": "boolean",
        "source_ids_included": ["string"],
    },
    "rights": {
        "copyrighted_audio_or_music_used": "boolean",
        "right_to_copyrighted_audio_or_music_cleared": "boolean",
    },
    "guests": {
        "guest_voices_present": "boolean",
        "releases_recorded_for_all_guests": "boolean",
    },
    "publishing": {
        "publishing_or_scheduling_planned": "boolean",
        "authorization_recorded_for_this_episode": "boolean",
        "destination_matches_authorized_scope": "boolean",
        "timing_matches_authorized_scope": "boolean",
        "ai_narration_disclosure_made": "boolean",
    },
    "red_lines": {
        "fabricated_quote_statistic_or_source_present": "boolean",
        "words_attributed_beyond_source_present": "boolean",
        "publishing_beyond_authorized_scope_present": "boolean",
        "ai_narration_presented_as_human_without_disclosure_present": "boolean",
        "copyrighted_audio_without_clear_right_present": "boolean",
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


def _fmt6(value):
    """Fixed 6dp serialization: round half up, then 6 decimals."""
    if value is None:
        return None
    rounded = math.floor(value * 1000000 + 0.5) / 1000000
    return f"{rounded:.6f}"


def _has(entry, field):
    return isinstance(entry, dict) and field in entry


def _nonempty_str(value):
    return isinstance(value, str) and len(value) > 0


def _row_name(entry, field):
    if isinstance(entry, dict) and isinstance(entry.get(field), str):
        return entry[field]
    return "unnamed"


def _duplicates(rows, field):
    seen = []
    dups = []
    for c in rows:
        if isinstance(c, dict) and isinstance(c.get(field), str):
            nm = c[field]
            if nm in seen and nm not in dups:
                dups.append(nm)
            seen.append(nm)
    return dups


def _ids(rows, field):
    return [c[field] for c in rows
            if isinstance(c, dict) and isinstance(c.get(field), str)]


def evaluate(manifest):
    """Return the verdict dict for a podcast episode manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    ep_sections, has_ep_sections = _get(manifest, "episode_sections")
    ep_is_list = has_ep_sections and isinstance(ep_sections, list)
    ep_count = len(ep_sections) if ep_is_list else None
    ep_rows = ep_sections if ep_is_list else []

    sources, has_sources = _get(manifest, "sources")
    sources_is_list = has_sources and isinstance(sources, list)
    sources_count = len(sources) if sources_is_list else None
    source_rows = sources if sources_is_list else []
    source_ids = _ids(source_rows, "source_id")

    claims, has_claims = _get(manifest, "claims")
    claims_is_list = has_claims and isinstance(claims, list)
    claims_count = len(claims) if claims_is_list else None
    claim_rows = claims if claims_is_list else []

    notes_ids, has_notes_ids = _get(
        manifest, "show_notes", "source_ids_included")
    notes_is_list = has_notes_ids and isinstance(notes_ids, list)
    notes_rows = notes_ids if notes_is_list else []

    duplicate_section_ids = (
        _duplicates(ep_rows, "section_id") if ep_is_list else None)
    duplicate_source_ids = (
        _duplicates(source_rows, "source_id") if sources_is_list else None)
    duplicate_claim_ids = (
        _duplicates(claim_rows, "claim_id") if claims_is_list else None)

    sections_without_purpose = (
        [_row_name(c, "section_id") for c in ep_rows
         if _has(c, "purpose") and not _nonempty_str(c.get("purpose"))]
        if ep_is_list else None)
    sections_not_supporting = (
        [_row_name(c, "section_id") for c in ep_rows
         if _has(c, "supports_main_point")
         and c.get("supports_main_point") is not True]
        if ep_is_list else None)
    sources_without_citation = (
        [_row_name(c, "source_id") for c in source_rows
         if _has(c, "citation") and not _nonempty_str(c.get("citation"))]
        if sources_is_list else None)
    claims_with_invalid_kind = (
        [_row_name(c, "claim_id") for c in claim_rows
         if _has(c, "claim_kind") and c.get("claim_kind") not in CLAIM_KINDS]
        if claims_is_list else None)
    claims_with_unknown_source = (
        [_row_name(c, "claim_id") for c in claim_rows
         if _has(c, "source_id")
         and c.get("source_id") not in source_ids]
        if claims_is_list and sources_is_list else None)
    claims_with_unmarked_source = (
        [_row_name(c, "claim_id") for c in claim_rows
         if _has(c, "source_marked_in_script")
         and c.get("source_marked_in_script") is not True]
        if claims_is_list else None)

    def _claim_traced(c):
        return (sources_is_list and _has(c, "source_id")
                and c.get("source_id") in source_ids
                and c.get("source_marked_in_script") is True)

    notes_missing = None
    notes_extra = None
    if sources_is_list and notes_is_list:
        notes_missing = []
        for sid in source_ids:
            if sid not in notes_rows and sid not in notes_missing:
                notes_missing.append(sid)
        notes_extra = []
        for nid in notes_rows:
            if nid not in source_ids and nid not in notes_extra:
                notes_extra.append(nid)

    outline_support_ratio = (
        sum(1 for c in ep_rows
            if c.get("supports_main_point") is True) / ep_count
        if ep_is_list and ep_count > 0 else None)
    source_citation_ratio = (
        sum(1 for c in source_rows
            if _nonempty_str(c.get("citation"))) / sources_count
        if sources_is_list and sources_count > 0 else None)
    traced_claim_ratio = (
        sum(1 for c in claim_rows if _claim_traced(c)) / claims_count
        if claims_is_list and claims_count > 0 else None)
    show_notes_coverage_ratio = (
        len([s for s in source_ids if s in notes_rows]) / sources_count
        if sources_is_list and notes_is_list and sources_count > 0
        else None)

    # ---- Section 1: episode_scoping_and_outline ----
    _bool_check(results, "episode_scoping_and_outline",
                "podcast_episode_topic_scoped", manifest,
                ("scoping", "topic_scoped"),
                "scoping: the episode topic was scoped before writing")
    _bool_check(results, "episode_scoping_and_outline",
                "podcast_episode_audience_scoped", manifest,
                ("scoping", "audience_scoped"),
                "scoping: the episode audience was scoped before writing")
    _bool_check(results, "episode_scoping_and_outline",
                "podcast_episode_target_length_scoped", manifest,
                ("scoping", "target_length_scoped"),
                "scoping: the episode target length was scoped before writing")
    _bool_check(results, "episode_scoping_and_outline",
                "podcast_episode_main_point_scoped", manifest,
                ("scoping", "main_point_scoped"),
                "scoping: the episode's single main point was scoped before writing")
    _bool_check(results, "episode_scoping_and_outline",
                "podcast_episode_distribution_intent_confirmed", manifest,
                ("scoping", "distribution_intent_confirmed"),
                "scoping: whether the episode is for the caller alone or for publishing later was confirmed")
    _bool_check(results, "episode_scoping_and_outline",
                "podcast_episode_scoped_before_writing", manifest,
                ("scoping", "scoped_before_writing"),
                "scoping / quality gate: topic, audience, length and main point were scoped before writing began")
    _check(results, "episode_scoping_and_outline",
           "podcast_episode_outline_sections_list_declared", ep_sections,
           ep_is_list, ep_is_list and ep_count > 0,
           "outline: the declared record names its episode outline sections — the list is present and names at least one section; an absent list is missing evidence and an empty list declares no outline at all")
    sec_id_present = ep_is_list and all(
        _has(c, "section_id") for c in ep_rows)
    _check(results, "episode_scoping_and_outline",
           "every_podcast_episode_outline_section_id_unique", ep_sections,
           sec_id_present,
           ep_is_list and duplicate_section_ids is not None
           and len(duplicate_section_ids) == 0,
           "outline sections: no declared section_id is owned by more than one row")
    purpose_present = ep_is_list and all(
        _has(c, "purpose") for c in ep_rows)
    _check(results, "episode_scoping_and_outline",
           "every_podcast_episode_outline_section_purpose_declared",
           ep_sections, purpose_present,
           ep_is_list
           and all(_nonempty_str(c.get("purpose")) for c in ep_rows),
           "outline: every declared section declares a non-empty purpose — each section earns its place")
    supports_present = ep_is_list and all(
        _has(c, "supports_main_point") for c in ep_rows)
    _check(results, "episode_scoping_and_outline",
           "every_podcast_episode_outline_section_supports_main_point",
           ep_sections, supports_present,
           ep_is_list
           and all(c.get("supports_main_point") is True for c in ep_rows),
           "outline: every declared section is declared to support the episode's single main point")

    # ---- Section 2: sources_and_claim_traceability ----
    _bool_check(results, "sources_and_claim_traceability",
                "podcast_episode_sources_collected_before_writing", manifest,
                ("source_work", "sources_collected_before_writing"),
                "research: sources were collected before writing anything")
    _bool_check(results, "sources_and_claim_traceability",
                "podcast_episode_source_list_kept_beside_draft", manifest,
                ("source_work", "source_list_kept_beside_draft"),
                "research: the source list was kept beside the draft from the first line onward")
    _bool_check(results, "sources_and_claim_traceability",
                "podcast_episode_script_checked_claim_by_claim", manifest,
                ("source_work", "script_checked_claim_by_claim_against_sources"),
                "claim check: the script was checked claim by claim against the source list")
    _bool_check(results, "sources_and_claim_traceability",
                "podcast_episode_unsupported_claims_cut_or_softened", manifest,
                ("source_work", "unsupported_claims_cut_or_softened"),
                "claim check: anything no collected source supports was cut or softened")
    _check(results, "sources_and_claim_traceability",
           "podcast_episode_sources_list_declared", sources,
           sources_is_list, sources_is_list and sources_count > 0,
           "sources: the declared record names its sources — the list is present and names at least one source; an absent list is missing evidence and an empty list declares no sourced episode at all")
    src_id_present = sources_is_list and all(
        _has(c, "source_id") for c in source_rows)
    _check(results, "sources_and_claim_traceability",
           "every_podcast_source_id_unique", sources, src_id_present,
           sources_is_list and duplicate_source_ids is not None
           and len(duplicate_source_ids) == 0,
           "sources: no declared source_id is owned by more than one row")
    citation_present = sources_is_list and all(
        _has(c, "citation") for c in source_rows)
    _check(results, "sources_and_claim_traceability",
           "every_podcast_source_citation_recorded", sources,
           citation_present,
           sources_is_list
           and all(_nonempty_str(c.get("citation")) for c in source_rows),
           "sources: every declared source declares a non-empty citation or link as recorded")
    _check(results, "sources_and_claim_traceability",
           "podcast_episode_claims_list_declared", claims,
           claims_is_list, claims_is_list and claims_count > 0,
           "claims: the declared record names its quote and statistic claim rows — the list is present and names at least one claim; an absent list is missing evidence and an empty list declares no traced claims at all")
    claim_id_present = claims_is_list and all(
        _has(c, "claim_id") for c in claim_rows)
    _check(results, "sources_and_claim_traceability",
           "every_podcast_claim_id_unique", claims, claim_id_present,
           claims_is_list and duplicate_claim_ids is not None
           and len(duplicate_claim_ids) == 0,
           "claims: no declared claim_id is owned by more than one row")
    kind_present = claims_is_list and all(
        _has(c, "claim_kind") for c in claim_rows)
    _check(results, "sources_and_claim_traceability",
           "every_podcast_claim_kind_recognised", claims, kind_present,
           claims_is_list
           and all(c.get("claim_kind") in CLAIM_KINDS for c in claim_rows),
           "claims: every declared claim's kind is one of quote, statistic — the two kinds the skill requires to be marked with a source")
    traced_present = (claims_is_list and sources_is_list and all(
        _has(c, "source_id") for c in claim_rows))
    _check(results, "sources_and_claim_traceability",
           "every_podcast_claim_traced_to_declared_source", claims,
           traced_present,
           claims_is_list and sources_is_list
           and all(_has(c, "source_id")
                   and c.get("source_id") in source_ids
                   for c in claim_rows),
           "claims / quality gate: every declared quote and statistic traces to a source_id named in the declared source list")
    marked_present = claims_is_list and all(
        _has(c, "source_marked_in_script") for c in claim_rows)
    _check(results, "sources_and_claim_traceability",
           "every_podcast_claim_source_marked_in_script", claims,
           marked_present,
           claims_is_list
           and all(c.get("source_marked_in_script") is True
                   for c in claim_rows),
           "claims: every declared quote and statistic is marked in the script with the source it came from")

    # ---- Section 3: script_for_listening ----
    _bool_check(results, "script_for_listening",
                "podcast_episode_script_written_for_the_ear", manifest,
                ("script", "written_for_the_ear"),
                "script / quality gate: the script was written for listening, not adapted from dense prose")
    _bool_check(results, "script_for_listening",
                "podcast_episode_script_uses_short_sentences", manifest,
                ("script", "uses_short_sentences"),
                "script: the script uses short sentences written for the ear")
    _bool_check(results, "script_for_listening",
                "podcast_episode_script_uses_signposts", manifest,
                ("script", "uses_signposts"),
                "script: the script uses signposts written for the ear")
    _bool_check(results, "script_for_listening",
                "podcast_episode_script_has_no_visual_references", manifest,
                ("script", "has_no_visual_references"),
                "script: the script contains no visual references")
    _bool_check(results, "script_for_listening",
                "podcast_episode_script_opens_with_main_point", manifest,
                ("script", "opens_with_main_point"),
                "outline / script: the script opens with the point")
    _bool_check(results, "script_for_listening",
                "podcast_episode_script_supports_point_in_order", manifest,
                ("script", "supports_point_in_order"),
                "outline / script: the script supports the point in order")
    _bool_check(results, "script_for_listening",
                "podcast_episode_script_closes_with_what_matters", manifest,
                ("script", "closes_with_what_matters"),
                "outline / script: the script closes with what matters")
    _bool_check(results, "script_for_listening",
                "podcast_episode_script_approved_before_narration", manifest,
                ("script", "approved_before_narration"),
                "script: the script was approved before narration — narration is of the approved script")

    # ---- Section 4: narration_and_assembly_qc ----
    _bool_check(results, "narration_and_assembly_qc",
                "podcast_episode_narration_voice_confirmed", manifest,
                ("narration", "voice_confirmed"),
                "narration: the narration voice was confirmed before narration")
    _bool_check(results, "narration_and_assembly_qc",
                "podcast_episode_narration_pace_confirmed", manifest,
                ("narration", "pace_confirmed"),
                "narration: the narration pace was confirmed before narration")
    _bool_check(results, "narration_and_assembly_qc",
                "podcast_episode_long_script_chunked_at_section_breaks", manifest,
                ("narration", "long_script_chunked_at_section_breaks_where_long"),
                "narration: a long script was chunked at section breaks, where the script is long")
    _bool_check(results, "narration_and_assembly_qc",
                "podcast_episode_audio_assembled", manifest,
                ("narration", "audio_assembled"),
                "assembly: the episode audio was assembled")
    _bool_check(results, "narration_and_assembly_qc",
                "podcast_episode_opening_listen_back_checked", manifest,
                ("narration", "opening_listen_back_checked"),
                "assembly / quality gate: narration was checked by listening back to the opening")
    _bool_check(results, "narration_and_assembly_qc",
                "podcast_episode_section_joins_listen_back_checked", manifest,
                ("narration", "section_joins_listen_back_checked"),
                "assembly / quality gate: narration was checked by listening back at the section joins")
    _bool_check(results, "narration_and_assembly_qc",
                "podcast_episode_misreads_and_awkward_joins_fixed", manifest,
                ("narration", "misreads_and_awkward_joins_fixed"),
                "assembly: misreads and awkward joins found on listen-back were fixed before the episode was called done")

    # ---- Section 5: show_notes_and_rights ----
    _bool_check(results, "show_notes_and_rights",
                "podcast_episode_show_notes_include_summary", manifest,
                ("show_notes", "summary_included"),
                "show notes: the show notes include a short summary")
    _bool_check(results, "show_notes_and_rights",
                "podcast_episode_show_notes_include_main_points", manifest,
                ("show_notes", "main_points_included"),
                "show notes: the show notes include the main points")
    _bool_check(results, "show_notes_and_rights",
                "podcast_episode_show_notes_include_complete_source_list", manifest,
                ("show_notes", "complete_source_list_included"),
                "show notes / quality gate: the show notes include the complete source list")
    notes_match_present = (sources_is_list and notes_is_list and all(
        _has(c, "source_id") for c in source_rows))
    _check(results, "show_notes_and_rights",
           "podcast_episode_show_notes_source_ids_match_declared_sources",
           notes_ids, notes_match_present,
           notes_match_present
           and notes_missing == [] and notes_extra == [],
           "show notes: the source ids declared included in the show notes are exactly the declared source ids — none missing, none extra")
    _gated_bool_check(
        results, "show_notes_and_rights",
        "podcast_episode_copyrighted_audio_rights_cleared_where_used",
        manifest,
        ("rights", "copyrighted_audio_or_music_used"),
        ("rights", "right_to_copyrighted_audio_or_music_cleared"),
        "rights / red line: a clear right to the copyrighted audio or music used in the episode is recorded",
        "no copyrighted audio or music use declared")
    _gated_bool_check(
        results, "show_notes_and_rights",
        "podcast_episode_guest_releases_recorded_where_guests_present",
        manifest,
        ("guests", "guest_voices_present"),
        ("guests", "releases_recorded_for_all_guests"),
        "guests: releases are recorded for all guest voices present in the episode",
        "no guest voices declared")

    # ---- Section 6: publishing_and_disclosure ----
    _gated_bool_check(
        results, "publishing_and_disclosure",
        "podcast_episode_publishing_authorization_recorded_where_planned",
        manifest,
        ("publishing", "publishing_or_scheduling_planned"),
        ("publishing", "authorization_recorded_for_this_episode"),
        "publishing / quality gate: publishing or scheduling was authorized for this episode",
        "no publishing or scheduling declared planned")
    _gated_bool_check(
        results, "publishing_and_disclosure",
        "podcast_episode_publishing_destination_matches_authorization_where_planned",
        manifest,
        ("publishing", "publishing_or_scheduling_planned"),
        ("publishing", "destination_matches_authorized_scope"),
        "publishing: the publishing destination matches the authorization for this episode exactly",
        "no publishing or scheduling declared planned")
    _gated_bool_check(
        results, "publishing_and_disclosure",
        "podcast_episode_publishing_timing_matches_authorization_where_planned",
        manifest,
        ("publishing", "publishing_or_scheduling_planned"),
        ("publishing", "timing_matches_authorized_scope"),
        "publishing: the publishing timing matches the authorization for this episode exactly",
        "no publishing or scheduling declared planned")
    _gated_bool_check(
        results, "publishing_and_disclosure",
        "podcast_episode_ai_narration_disclosed_where_ai_narrated",
        manifest,
        ("narration", "ai_narrated"),
        ("publishing", "ai_narration_disclosure_made"),
        "disclosure / red line: the AI narration is disclosed — the episode is not presented as a human recording",
        "no AI narration declared")

    # ---- Section 7: red_lines ----
    _false_check(results, "red_lines",
                 "podcast_episode_free_of_fabricated_quote_statistic_or_source",
                 manifest,
                 ("red_lines", "fabricated_quote_statistic_or_source_present"),
                 "red line: no fabricated quote, statistic or source is present in the record")
    _false_check(results, "red_lines",
                 "podcast_episode_free_of_words_attributed_beyond_source",
                 manifest,
                 ("red_lines", "words_attributed_beyond_source_present"),
                 "red line: no words are attributed to a person that the source does not show them saying")
    _false_check(results, "red_lines",
                 "podcast_episode_free_of_publishing_beyond_authorized_scope",
                 manifest,
                 ("red_lines", "publishing_beyond_authorized_scope_present"),
                 "red line: no publishing or scheduling beyond the scope authorized for this episode is present in the record")
    _false_check(results, "red_lines",
                 "podcast_episode_free_of_ai_narration_presented_as_human_without_disclosure",
                 manifest,
                 ("red_lines",
                  "ai_narration_presented_as_human_without_disclosure_present"),
                 "red line: no AI-narrated episode presented as a human recording without disclosure is present in the record")
    _false_check(results, "red_lines",
                 "podcast_episode_free_of_copyrighted_audio_without_clear_right",
                 manifest,
                 ("red_lines", "copyrighted_audio_without_clear_right_present"),
                 "red line: no copyrighted audio or music used without a clear right to it is present in the record")

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
        verdict = "EPISODE_PRODUCTION_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "EPISODE_PRODUCTION_SOUND"

    computed_names = (
        "podcast_episode_outline_sections_list_declared",
        "every_podcast_episode_outline_section_id_unique",
        "every_podcast_episode_outline_section_purpose_declared",
        "every_podcast_episode_outline_section_supports_main_point",
        "podcast_episode_sources_list_declared",
        "every_podcast_source_id_unique",
        "every_podcast_source_citation_recorded",
        "podcast_episode_claims_list_declared",
        "every_podcast_claim_id_unique",
        "every_podcast_claim_kind_recognised",
        "every_podcast_claim_traced_to_declared_source",
        "every_podcast_claim_source_marked_in_script",
        "podcast_episode_show_notes_source_ids_match_declared_sources",
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
        "service": "sourced-podcast-episode-production",
        "atom_version": "0.1.0",
        "episode_title": manifest.get("episode_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "episode_outline_sections_count": ep_count,
        "podcast_sources_count": sources_count,
        "podcast_claims_count": claims_count,
        "duplicate_episode_outline_section_ids": duplicate_section_ids,
        "duplicate_podcast_source_ids": duplicate_source_ids,
        "duplicate_podcast_claim_ids": duplicate_claim_ids,
        "episode_outline_sections_without_purpose": sections_without_purpose,
        "episode_outline_sections_not_supporting_main_point": sections_not_supporting,
        "podcast_sources_without_citation": sources_without_citation,
        "podcast_claims_with_invalid_kind": claims_with_invalid_kind,
        "podcast_claims_with_unknown_source_reference": claims_with_unknown_source,
        "podcast_claims_with_unmarked_source": claims_with_unmarked_source,
        "podcast_sources_missing_from_show_notes": notes_missing,
        "show_notes_source_ids_not_declared_as_sources": notes_extra,
        "outline_section_support_ratio": _fmt6(outline_support_ratio),
        "source_citation_ratio": _fmt6(source_citation_ratio),
        "traced_claim_ratio": _fmt6(traced_claim_ratio),
        "show_notes_source_coverage_ratio": _fmt6(show_notes_coverage_ratio),
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across seven sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "SOURCED PODCAST EPISODE PRODUCTION",
        f"episode_title: {verdict.get('episode_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: sourced_podcast_episode_production.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "EPISODE_PRODUCTION_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
