#!/usr/bin/env python3
"""Voice note narration audio — deterministic core.

Built from the bound skill `voice-notes-and-narration`: "Produce
spoken audio as short voice notes or as narration of text and
documents you want to listen to." Its method in brief is this
atom's record structure: confirm what the audio is (a short note
or a full narration) and note the audience; confirm the voice,
register and target length before generating; prepare the text
so it sounds spoken, not printed (expand abbreviations, break
long sentences, spell out numbers, remove links, tables and
formatting that do not survive aloud); chunk long text into
sections at natural breaks and narrate chunk by chunk; generate
through the voice stack and spot-check the opening and a middle
section for clarity and pace; assemble the chunks into one file
in the right order, confirming no section is missing, repeated
or out of sequence; deliver the file with its total duration
stated; and add an AI-voice disclosure when a note goes to
someone else. Its red lines are this atom's red lines: never
imitate or clone a real person's voice without their clear
consent; never send a voice note to someone else without the
AI-voice disclosure; never narrate text you do not have the
right to reproduce as audio; never present generated audio as a
recording of a real event; never change the meaning of the
source text while adapting it for speech.

This atom is a DELIVERABLE audit of a declared voice-note /
narration production record: it audits the record a caller
declares — the scoping and confirmation declarations, the voice
and consent/rights declarations, the text-adaptation
declarations, the declared segment rows, the declared
audio-spec and assembly declarations, the delivery and
disclosure declarations, and the red lines refused. It
synthesizes NO audio, records nothing, and clones no voice:
every skill step that generates, records, assembles, plays or
sends audio is EXCLUDED from this atom by name — audio
synthesis, voice recording, voice cloning, audio assembly and
editing, playback, and sending or publishing the audio are each
excluded; the atom checks only that the production record the
skill requires is present and internally consistent on the
declared evidence, and it recomputes the record's own declared
segment coverage and duration arithmetic exactly.

Voice consent is a red-line class declaration in this record:
a narration record must declare voice consent, so the consent
check (`voice_note_narration_record_declares_voice_consent`)
fails when the declaration is absent just as it fails when it
is declared false — absence of a voice-consent declaration is
never merely missing evidence. Every other check follows the
fleet convention: absent = missing, present-but-false/invalid
= fail.

Distinct ground: the nearest sibling is
`sourced-podcast-episode-production` (one sourced podcast
episode's production record — episode scoping, claim-to-source
traceability for every quote/statistic, show notes whose source
list is exactly the declared sources, and authorized episode
publishing). This atom shares zero checks with it: every check
here is a voice-note / narration question — note-vs-narration
kind and audience confirmed before generation, voice consent
and source-text reproduction rights, spoken-text adaptation
(abbreviations, numbers, links and tables removed), declared
segment rows whose sequence covers 1..N exactly and whose
declared durations sum to the declared total duration, opening
and middle spot-checks, and the AI-voice disclosure owed when
the audience includes others. The boundary is: one voice note's
or one narration's production record here; one sourced podcast
episode's production record there.

Computed checks use ONLY what the skill itself states, plus
the consistency of the declared rows themselves — no outside
threshold is imported:

- production kind: one of `voice_note` / `narration` (the two
  kinds the skill confirms);
- audience scope: one of `self_only` / `includes_others` (the
  two audiences the skill notes — disclosure is owed on the
  second);
- voice kind: one of `original_synthetic` / `licensed_voice` /
  `real_person_voice` (the record's own voice vocabulary);
- segments: at least one declared row, unique segment ids, a
  non-empty section label and a positive declared duration on
  every row, and sequence positions covering exactly 1..N,
  each once (the skill: confirm no section is missing,
  repeated, or out of sequence);
- audio file format: one of `mp3` / `wav` / `m4a` / `ogg` /
  `flac` (the record's own format vocabulary);
- total duration: the declared total duration recomputes as
  the sum of the declared segment durations, compared on the
  fixed 6dp serialization below;
- gated declarations: real-person voice consent is required
  only where a real-person voice is declared used, and the
  AI-voice disclosure is required only where the declared
  audience scope includes others.

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical. Counts are reported as integers (exact).

The skill states no numeric threshold at all — no target
length in minutes or words beyond the caller's confirmed
target, no words-per-minute pace bar, no loudness, sample-rate
or bitrate bar, no segment-count bar beyond at least one
declared segment — so no such check is invented; quantities
are computed and reported, with exact recomputation and
completeness over the caller's own declared rows as the only
bars.

Verdict:
- any fail             -> VOICE_NOTE_NARRATION_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> VOICE_NOTE_NARRATION_SOUND

No model call, no network, no clock dependence: the same
manifest always produces the same verdict. That determinism is
the product.
"""
import json
import math
import sys

SECTIONS = (
    "production_scoping_and_confirmation",
    "voice_consent_and_rights",
    "text_adaptation_for_listening",
    "segments_and_chunking",
    "audio_spec_and_assembly",
    "delivery_and_disclosure",
    "red_lines",
)

PRODUCTION_KINDS = ("voice_note", "narration")
AUDIENCE_SCOPES = ("self_only", "includes_others")
VOICE_KINDS = ("original_synthetic", "licensed_voice", "real_person_voice")
FILE_FORMATS = ("mp3", "wav", "m4a", "ogg", "flac")

MANIFEST_SPEC = {
    "production_title": "string",
    "scoping": {
        "kind_confirmed": "boolean",
        "production_kind": "string",
        "audience_noted": "boolean",
        "audience_scope": "string",
        "voice_confirmed_before_generation": "boolean",
        "register_confirmed_before_generation": "boolean",
        "target_length_confirmed_before_generation": "boolean",
        "confirmations_completed_before_generation": "boolean",
    },
    "voice": {
        "voice_kind": "string",
        "voice_selected_before_generation": "boolean",
        "uses_real_person_voice": "boolean",
        "real_person_voice_consent_recorded": "boolean",
        "voice_consent_declared": "boolean",
    },
    "rights": {
        "source_text_reproduction_right_declared": "boolean",
        "rights_basis_recorded": "boolean",
    },
    "adaptation": {
        "abbreviations_expanded": "boolean",
        "long_sentences_broken": "boolean",
        "numbers_spelled_out": "boolean",
        "links_removed": "boolean",
        "tables_and_formatting_removed": "boolean",
        "text_adapted_not_read_raw": "boolean",
        "adaptation_reviewed_for_meaning_preservation": "boolean",
    },
    "chunking": {
        "long_text_chunked_at_natural_breaks_where_long": "boolean",
        "narrated_chunk_by_chunk": "boolean",
    },
    "segments": [{
        "segment_id": "string",
        "section_label": "string",
        "sequence_position": "number",
        "duration_seconds": "number",
    }],
    "audio_spec": {
        "file_format": "string",
    },
    "assembly": {
        "audio_generated_through_voice_stack": "boolean",
        "opening_spot_checked_for_clarity_and_pace": "boolean",
        "middle_spot_checked_for_clarity_and_pace": "boolean",
        "chunks_assembled_into_one_file": "boolean",
        "assembled_order_verified": "boolean",
        "assembly_completeness_verified": "boolean",
        "total_duration_seconds_declared": "number",
    },
    "delivery": {
        "audio_file_delivered": "boolean",
        "total_duration_stated_in_delivery": "boolean",
        "played_through_voice_stack_only_if_requested": "boolean",
        "recipient_matches_declared_audience": "boolean",
        "ai_voice_disclosure_made": "boolean",
    },
    "red_lines": {
        "voice_cloned_or_imitated_without_consent_present": "boolean",
        "voice_note_sent_to_other_without_ai_disclosure_present": "boolean",
        "text_narrated_without_reproduction_right_present": "boolean",
        "generated_audio_presented_as_real_event_recording_present": "boolean",
        "source_meaning_changed_in_adaptation_present": "boolean",
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


def _is_number(value):
    return (isinstance(value, (int, float))
            and not isinstance(value, bool))


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


def evaluate(manifest):
    """Return the verdict dict for a voice note narration record."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    segments, has_segments = _get(manifest, "segments")
    seg_is_list = has_segments and isinstance(segments, list)
    seg_count = len(segments) if seg_is_list else None
    seg_rows = segments if seg_is_list else []

    production_kind, has_kind = _get(manifest, "scoping", "production_kind")
    audience_scope, has_scope = _get(manifest, "scoping", "audience_scope")
    voice_kind, has_voice_kind = _get(manifest, "voice", "voice_kind")
    file_format, has_format = _get(manifest, "audio_spec", "file_format")
    total_declared, has_total = _get(
        manifest, "assembly", "total_duration_seconds_declared")

    duplicate_segment_ids = (
        _duplicates(seg_rows, "segment_id") if seg_is_list else None)
    segments_without_section_label = (
        [_row_name(c, "segment_id") for c in seg_rows
         if _has(c, "section_label")
         and not _nonempty_str(c.get("section_label"))]
        if seg_is_list else None)
    segments_with_non_positive_duration = (
        [_row_name(c, "segment_id") for c in seg_rows
         if _has(c, "duration_seconds")
         and not (_is_number(c.get("duration_seconds"))
                  and c.get("duration_seconds") > 0)]
        if seg_is_list else None)

    def _position_valid(c, seen_positions):
        pos = c.get("sequence_position") if isinstance(c, dict) else None
        if not _is_number(pos):
            return False
        if pos != math.floor(pos):
            return False
        if pos < 1 or (seg_count is not None and pos > seg_count):
            return False
        if pos in seen_positions:
            return False
        return True

    segments_with_invalid_sequence = None
    sequence_valid_count = 0
    if seg_is_list:
        segments_with_invalid_sequence = []
        seen_positions = []
        for c in seg_rows:
            if _has(c, "sequence_position"):
                if _position_valid(c, seen_positions):
                    seen_positions.append(c.get("sequence_position"))
                    sequence_valid_count += 1
                else:
                    segments_with_invalid_sequence.append(
                        _row_name(c, "segment_id"))
            # rows without a position are missing evidence, not named
        # second pass: a valid first occurrence counts even if a
        # later duplicate exists; duplicates are named above.

    def _sequence_complete():
        if not seg_is_list or seg_count == 0:
            return False
        if not all(_has(c, "sequence_position") for c in seg_rows):
            return False
        return sequence_valid_count == seg_count

    duration_total = None
    if seg_is_list:
        duration_total = 0.0
        for c in seg_rows:
            if isinstance(c, dict) and _is_number(c.get("duration_seconds")):
                duration_total += c["duration_seconds"]

    def _total_recomputes():
        if not has_total or not _is_number(total_declared):
            return False
        if not seg_is_list:
            return False
        if not all(_has(c, "duration_seconds") for c in seg_rows):
            return False
        return _fmt6(duration_total) == _fmt6(total_declared)

    sequence_coverage_ratio = (
        sequence_valid_count / seg_count
        if seg_is_list and seg_count > 0 else None)
    section_label_ratio = (
        sum(1 for c in seg_rows
            if _nonempty_str(c.get("section_label"))) / seg_count
        if seg_is_list and seg_count > 0 else None)

    # ---- Section 1: production_scoping_and_confirmation ----
    _bool_check(results, "production_scoping_and_confirmation",
                "voice_note_narration_kind_confirmed", manifest,
                ("scoping", "kind_confirmed"),
                "scoping: what the audio is — a short note or a full narration — was confirmed")
    _check(results, "production_scoping_and_confirmation",
           "voice_note_narration_production_kind_recognised",
           production_kind, has_kind,
           has_kind and production_kind in PRODUCTION_KINDS,
           "scoping: the declared production kind is one of voice_note, narration — the two kinds the skill confirms")
    _bool_check(results, "production_scoping_and_confirmation",
                "voice_note_narration_audience_noted", manifest,
                ("scoping", "audience_noted"),
                "scoping: the audience — just the caller, or someone else as well — was noted")
    _check(results, "production_scoping_and_confirmation",
           "voice_note_narration_audience_scope_recognised",
           audience_scope, has_scope,
           has_scope and audience_scope in AUDIENCE_SCOPES,
           "scoping: the declared audience scope is one of self_only, includes_others — the two audiences the skill notes")
    _bool_check(results, "production_scoping_and_confirmation",
                "voice_note_narration_voice_confirmed_before_generation",
                manifest,
                ("scoping", "voice_confirmed_before_generation"),
                "confirmation: the voice was confirmed before generating")
    _bool_check(results, "production_scoping_and_confirmation",
                "voice_note_narration_register_confirmed_before_generation",
                manifest,
                ("scoping", "register_confirmed_before_generation"),
                "confirmation: the register — conversational for a note, steady and clear for narration — was confirmed before generating")
    _bool_check(results, "production_scoping_and_confirmation",
                "voice_note_narration_target_length_confirmed_before_generation",
                manifest,
                ("scoping", "target_length_confirmed_before_generation"),
                "confirmation: the target length was confirmed before generating")
    _bool_check(results, "production_scoping_and_confirmation",
                "voice_note_narration_confirmations_completed_before_generation",
                manifest,
                ("scoping", "confirmations_completed_before_generation"),
                "confirmation: the kind, audience, voice, register and target-length confirmations were all completed before generation began")

    # ---- Section 2: voice_consent_and_rights ----
    _check(results, "voice_consent_and_rights",
           "voice_note_narration_voice_kind_recognised",
           voice_kind, has_voice_kind,
           has_voice_kind and voice_kind in VOICE_KINDS,
           "voice: the declared voice kind is one of original_synthetic, licensed_voice, real_person_voice — the record's voice vocabulary")
    _bool_check(results, "voice_consent_and_rights",
                "voice_note_narration_voice_selected_before_generation",
                manifest,
                ("voice", "voice_selected_before_generation"),
                "voice: the voice used was selected before generation began")
    _gated_bool_check(
        results, "voice_consent_and_rights",
        "voice_note_narration_real_person_voice_consent_recorded_where_real_person_voice_used",
        manifest,
        ("voice", "uses_real_person_voice"),
        ("voice", "real_person_voice_consent_recorded"),
        "consent: where a real person's voice is used, that person's clear consent is recorded — the skill's voice-cloning red line",
        "no real-person voice declared used")
    _bool_check(results, "voice_consent_and_rights",
                "voice_note_narration_source_text_reproduction_right_declared",
                manifest,
                ("rights", "source_text_reproduction_right_declared"),
                "rights: the record declares the right to reproduce the source text as audio — the skill's narration-rights red line")
    _bool_check(results, "voice_consent_and_rights",
                "voice_note_narration_rights_basis_recorded", manifest,
                ("rights", "rights_basis_recorded"),
                "rights: the basis for the declared reproduction right is recorded in the record")

    # ---- Section 3: text_adaptation_for_listening ----
    _bool_check(results, "text_adaptation_for_listening",
                "voice_note_narration_abbreviations_expanded", manifest,
                ("adaptation", "abbreviations_expanded"),
                "adaptation: abbreviations in the source text were expanded for speech")
    _bool_check(results, "text_adaptation_for_listening",
                "voice_note_narration_long_sentences_broken", manifest,
                ("adaptation", "long_sentences_broken"),
                "adaptation: long sentences were broken up so the text sounds spoken, not printed")
    _bool_check(results, "text_adaptation_for_listening",
                "voice_note_narration_numbers_spelled_out", manifest,
                ("adaptation", "numbers_spelled_out"),
                "adaptation: numbers were spelled out for speech")
    _bool_check(results, "text_adaptation_for_listening",
                "voice_note_narration_links_removed_for_listening", manifest,
                ("adaptation", "links_removed"),
                "adaptation: links, which do not survive aloud, were removed")
    _bool_check(results, "text_adaptation_for_listening",
                "voice_note_narration_tables_and_formatting_removed_for_listening",
                manifest,
                ("adaptation", "tables_and_formatting_removed"),
                "adaptation: tables and formatting that do not survive aloud were removed")
    _bool_check(results, "text_adaptation_for_listening",
                "voice_note_narration_text_adapted_not_read_raw", manifest,
                ("adaptation", "text_adapted_not_read_raw"),
                "adaptation: the text was adapted for listening, not read raw from the page")
    _bool_check(results, "text_adaptation_for_listening",
                "voice_note_narration_adaptation_reviewed_for_meaning_preservation",
                manifest,
                ("adaptation", "adaptation_reviewed_for_meaning_preservation"),
                "adaptation: the adapted text was reviewed to confirm the source text's meaning was not changed")

    # ---- Section 4: segments_and_chunking ----
    _bool_check(results, "segments_and_chunking",
                "voice_note_narration_long_text_chunked_at_natural_breaks_where_long",
                manifest,
                ("chunking", "long_text_chunked_at_natural_breaks_where_long"),
                "chunking: long text was chunked into sections at natural breaks")
    _bool_check(results, "segments_and_chunking",
                "voice_note_narration_narrated_chunk_by_chunk", manifest,
                ("chunking", "narrated_chunk_by_chunk"),
                "chunking: the audio was narrated chunk by chunk, so a failure never loses the whole piece")
    _check(results, "segments_and_chunking",
           "voice_note_narration_segments_list_declared", segments,
           seg_is_list, seg_is_list and seg_count >= 1,
           "segments: the declared record names its segment rows — the list is present and names at least one segment; an absent list is missing evidence and an empty list declares no segmented production at all")
    seg_id_present = seg_is_list and all(
        _has(c, "segment_id") for c in seg_rows)
    _check(results, "segments_and_chunking",
           "every_voice_note_narration_segment_id_unique", segments,
           seg_id_present,
           seg_is_list and duplicate_segment_ids is not None
           and len(duplicate_segment_ids) == 0,
           "segments: no declared segment_id is owned by more than one row")
    label_present = seg_is_list and all(
        _has(c, "section_label") for c in seg_rows)
    _check(results, "segments_and_chunking",
           "every_voice_note_narration_segment_section_label_declared",
           segments, label_present,
           seg_is_list
           and all(_nonempty_str(c.get("section_label")) for c in seg_rows),
           "segments: every declared segment declares a non-empty section label naming the source section it narrates")
    duration_present = seg_is_list and all(
        _has(c, "duration_seconds") for c in seg_rows)
    _check(results, "segments_and_chunking",
           "every_voice_note_narration_segment_duration_positive",
           segments, duration_present,
           seg_is_list
           and all(_is_number(c.get("duration_seconds"))
                   and c.get("duration_seconds") > 0 for c in seg_rows),
           "segments: every declared segment declares a positive duration in seconds — a segment with no duration declares no audio")
    position_present = seg_is_list and all(
        _has(c, "sequence_position") for c in seg_rows)
    _check(results, "segments_and_chunking",
           "voice_note_narration_segment_sequence_complete", segments,
           position_present, _sequence_complete(),
           "segments: the declared sequence positions cover exactly 1..N, each once — no section is missing, repeated, or out of sequence")

    # ---- Section 5: audio_spec_and_assembly ----
    _check(results, "audio_spec_and_assembly",
           "voice_note_narration_audio_file_format_recognised",
           file_format, has_format,
           has_format and file_format in FILE_FORMATS,
           "audio spec: the declared audio file format is one of mp3, wav, m4a, ogg, flac — the record's format vocabulary")
    _bool_check(results, "audio_spec_and_assembly",
                "voice_note_narration_audio_generated_through_voice_stack",
                manifest,
                ("assembly", "audio_generated_through_voice_stack"),
                "assembly: the audio was generated through the caller's voice stack")
    _bool_check(results, "audio_spec_and_assembly",
                "voice_note_narration_opening_spot_checked_for_clarity_and_pace",
                manifest,
                ("assembly", "opening_spot_checked_for_clarity_and_pace"),
                "assembly QC: the opening section was spot-checked for clarity and pace")
    _bool_check(results, "audio_spec_and_assembly",
                "voice_note_narration_middle_spot_checked_for_clarity_and_pace",
                manifest,
                ("assembly", "middle_spot_checked_for_clarity_and_pace"),
                "assembly QC: a middle section was spot-checked for clarity and pace")
    _bool_check(results, "audio_spec_and_assembly",
                "voice_note_narration_chunks_assembled_into_one_file",
                manifest,
                ("assembly", "chunks_assembled_into_one_file"),
                "assembly: the chunks were assembled into one audio file")
    _bool_check(results, "audio_spec_and_assembly",
                "voice_note_narration_assembled_order_verified", manifest,
                ("assembly", "assembled_order_verified"),
                "assembly: the assembled order of the chunks was verified")
    _bool_check(results, "audio_spec_and_assembly",
                "voice_note_narration_assembly_completeness_verified",
                manifest,
                ("assembly", "assembly_completeness_verified"),
                "assembly: the assembled file was confirmed complete — no section missing, repeated, or out of sequence")
    total_present = has_total and seg_is_list and all(
        _has(c, "duration_seconds") for c in seg_rows)
    _check(results, "audio_spec_and_assembly",
           "voice_note_narration_total_duration_recomputes_from_segments",
           total_declared, total_present, _total_recomputes(),
           "assembly: the declared total duration recomputes exactly as the sum of the declared segment durations")

    # ---- Section 6: delivery_and_disclosure ----
    _bool_check(results, "delivery_and_disclosure",
                "voice_note_narration_audio_file_delivered", manifest,
                ("delivery", "audio_file_delivered"),
                "delivery: the finished audio file was delivered")
    _bool_check(results, "delivery_and_disclosure",
                "voice_note_narration_total_duration_stated_in_delivery",
                manifest,
                ("delivery", "total_duration_stated_in_delivery"),
                "delivery: the delivery states the audio's total duration")
    _bool_check(results, "delivery_and_disclosure",
                "voice_note_narration_played_through_voice_stack_only_if_requested",
                manifest,
                ("delivery", "played_through_voice_stack_only_if_requested"),
                "delivery: the audio was played through the voice stack instead of delivered as a file only if the caller asked for that")
    _bool_check(results, "delivery_and_disclosure",
                "voice_note_narration_recipient_matches_declared_audience",
                manifest,
                ("delivery", "recipient_matches_declared_audience"),
                "delivery: the audio was delivered to the declared audience and no one else")
    disclosure, has_disclosure = _get(
        manifest, "delivery", "ai_voice_disclosure_made")
    if has_scope and audience_scope == "includes_others":
        _check(results, "delivery_and_disclosure",
               "voice_note_narration_ai_voice_disclosure_made_where_audience_includes_others",
               disclosure, has_disclosure, disclosure is True,
               "disclosure: where the audience includes someone else, the message carrying the note states plainly that the voice is AI-generated — the skill's disclosure red line")
    else:
        _check(results, "delivery_and_disclosure",
               "voice_note_narration_ai_voice_disclosure_made_where_audience_includes_others",
               audience_scope, has_scope, True,
               "audience declared self-only — no disclosure to another recipient is owed")

    # ---- Section 7: red_lines ----
    consent, has_consent = _get(manifest, "voice", "voice_consent_declared")
    # Red-line class: a narration record must declare voice
    # consent. Absent fails exactly as declared-false fails —
    # this check is never merely missing.
    _check(results, "red_lines",
           "voice_note_narration_record_declares_voice_consent",
           consent, True, consent is True,
           "red line (consent class): the record declares voice consent — a missing voice-consent declaration fails this check exactly as a declared absence of consent does, because a narration record must declare voice consent")
    _false_check(results, "red_lines",
                 "voice_note_narration_free_of_voice_cloned_or_imitated_without_consent",
                 manifest,
                 ("red_lines", "voice_cloned_or_imitated_without_consent_present"),
                 "red line: no imitation or cloning of a real person's voice without their clear consent is present in the record")
    _false_check(results, "red_lines",
                 "voice_note_narration_free_of_voice_note_sent_to_other_without_ai_disclosure",
                 manifest,
                 ("red_lines", "voice_note_sent_to_other_without_ai_disclosure_present"),
                 "red line: no voice note sent to someone else without the AI-voice disclosure is present in the record")
    _false_check(results, "red_lines",
                 "voice_note_narration_free_of_text_narrated_without_reproduction_right",
                 manifest,
                 ("red_lines", "text_narrated_without_reproduction_right_present"),
                 "red line: no narration of text the caller does not have the right to reproduce as audio is present in the record")
    _false_check(results, "red_lines",
                 "voice_note_narration_free_of_generated_audio_presented_as_real_event_recording",
                 manifest,
                 ("red_lines", "generated_audio_presented_as_real_event_recording_present"),
                 "red line: no generated audio presented as a recording of a real event is present in the record")
    _false_check(results, "red_lines",
                 "voice_note_narration_free_of_source_meaning_changed_in_adaptation",
                 manifest,
                 ("red_lines", "source_meaning_changed_in_adaptation_present"),
                 "red line: no change to the meaning of the source text while adapting it for speech is present in the record")

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
        verdict = "VOICE_NOTE_NARRATION_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "VOICE_NOTE_NARRATION_SOUND"

    computed_names = (
        "voice_note_narration_production_kind_recognised",
        "voice_note_narration_audience_scope_recognised",
        "voice_note_narration_voice_kind_recognised",
        "voice_note_narration_segments_list_declared",
        "every_voice_note_narration_segment_id_unique",
        "every_voice_note_narration_segment_section_label_declared",
        "every_voice_note_narration_segment_duration_positive",
        "voice_note_narration_segment_sequence_complete",
        "voice_note_narration_audio_file_format_recognised",
        "voice_note_narration_total_duration_recomputes_from_segments",
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
        "service": "voice-note-narration-audio",
        "atom_version": "0.1.0",
        "production_title": manifest.get("production_title"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "voice_note_segments_count": seg_count,
        "duplicate_voice_note_segment_ids": duplicate_segment_ids,
        "voice_note_segments_without_section_label": segments_without_section_label,
        "voice_note_segments_with_non_positive_duration": segments_with_non_positive_duration,
        "voice_note_segments_with_invalid_sequence_position": segments_with_invalid_sequence,
        "voice_note_segment_duration_total": _fmt6(duration_total),
        "voice_note_total_duration_declared": (
            _fmt6(total_declared) if has_total and _is_number(total_declared)
            else None),
        "segment_sequence_coverage_ratio": _fmt6(sequence_coverage_ratio),
        "segment_section_label_ratio": _fmt6(section_label_ratio),
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
        "VOICE NOTE NARRATION AUDIO",
        f"production_title: {verdict.get('production_title')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<44} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: voice_note_narration_audio.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "VOICE_NOTE_NARRATION_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
