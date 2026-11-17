# Voice note narration audio — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You produced a voice note or a narration of a text or document and you keep a production record for it. This atom reads one declared voice-note / narration production record and returns one deterministic verdict across seven sections (production_scoping_and_confirmation, voice_consent_and_rights, text_adaptation_for_listening, segments_and_chunking, audio_spec_and_assembly, delivery_and_disclosure, red_lines): **VOICE_NOTE_NARRATION_SOUND**, **VOICE_NOTE_NARRATION_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It runs 46 checks. It audits the declared production record's completeness and internal consistency only — it synthesizes no audio, records nothing, clones no voice, adapts no text, assembles no file, plays nothing, sends nothing and publishes nothing. A production is sound *on your declared evidence*: a record that declares its voice consented, its text adapted, its segments sequenced and its disclosure made passes those checks even if the real production did none of it. It is not a production service, a listening check, or a guarantee that the audio is clear or lawful: it never hears the audio, never judges whether a declared consent is legally sufficient, whether the adaptation really preserves meaning, or whether the narration sounds right — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. The computed checks: the declared `scoping.production_kind` must be one of `voice_note`, `narration`; the declared `scoping.audience_scope` must be one of `self_only`, `includes_others`; the declared `voice.voice_kind` must be one of `original_synthetic`, `licensed_voice`, `real_person_voice`; the declared `segments` list must be present and name at least one segment, with unique `segment_id` values, a non-empty `section_label` and a positive `duration_seconds` on every row, and `sequence_position` values covering exactly 1..N, each once (the rows' physical order in the list is not itself checked); the declared `audio_spec.file_format` must be one of `mp3`, `wav`, `m4a`, `ogg`, `flac`; and the declared `assembly.total_duration_seconds_declared` must recompute exactly as the sum of the declared segment durations. Two checks are gated on the record's own declared gate fields — when the gate is declared off, the check passes as not applicable; when the gate field is absent, the check is missing evidence; when the gate is on, the target declaration is required: the person's clear consent recorded is required only where `voice.uses_real_person_voice` is declared `true`, and the AI-voice disclosure is required only where `scoping.audience_scope` is declared `includes_others` (where the scope is declared but is an unrecognised value, the scope check already fails and the disclosure check passes as not applicable on the declared record). One check is a red-line class check and departs from the absent = missing convention by design: `voice.voice_consent_declared` **fails when the field is absent exactly as it fails when it is declared `false`** — a narration record must declare voice consent, and it passes only on a declared `true`; consequently an empty manifest fails this one check (and is otherwise all-missing), so its verdict is `VOICE_NOTE_NARRATION_NOT_SOUND`, not `INSUFFICIENT_EVIDENCE`. No numeric threshold is imposed — no target length in minutes or words, or tolerance around your confirmed target (length is checked as confirmed, never measured); no narration pace in words per minute; no loudness, sample-rate, bitrate or any other audio-quality bar (the audio-spec check is the declared format vocabulary only); no minimum or maximum number of segments beyond at least one; no segment-duration minimum beyond positivity, and no total-duration ceiling; no spot-check coverage bar beyond the opening and a middle section; no reading-level, sentence-length or adaptation-quality bar (adaptation is checked as declarations only); no voice-quality, naturalness or similarity bar; and no judgment that the narration is good, clear or worth sending (only that its declared production record contains what the skill requires). The only bars on the computed rows are exact recomputation and completeness over your own declared rows. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "voice-note-narration-audio"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/voice-note-narration-audio` — tool name `voice_note_narration_audio`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/voice-note-narration-audio` — body = the manifest object; same `Authorization` header.

## Input

| Field | Meaning |
|---|---|
| `production_title` | Production title (string; carried into the output, not checked) |
| `scoping.kind_confirmed` | scoping evidence: what the audio is — a short note or a full narration — was confirmed |
| `scoping.production_kind` (string) | computed: must be one of `voice_note`, `narration` — the two kinds the skill confirms |
| `scoping.audience_noted` | scoping evidence: the audience — just you, or someone else as well — was noted |
| `scoping.audience_scope` (string) | computed: must be one of `self_only`, `includes_others`; gates the AI-voice disclosure check below |
| `scoping.voice_confirmed_before_generation` | confirmation evidence: the voice was confirmed before generating |
| `scoping.register_confirmed_before_generation` | confirmation evidence: the register was confirmed before generating |
| `scoping.target_length_confirmed_before_generation` | confirmation evidence: the target length was confirmed before generating (confirmed only — never measured) |
| `scoping.confirmations_completed_before_generation` | confirmation evidence: all confirmations were completed before generation began |
| `voice.voice_kind` (string) | computed: must be one of `original_synthetic`, `licensed_voice`, `real_person_voice` |
| `voice.voice_selected_before_generation` | voice evidence: the voice used was selected before generation began |
| `voice.uses_real_person_voice` | gates the real-person consent check: it applies only where a real-person voice is declared used |
| `voice.real_person_voice_consent_recorded` | required when `voice.uses_real_person_voice` is `true`; otherwise the check passes as not applicable |
| `voice.voice_consent_declared` | **red-line class — must be `true` to pass; absent fails exactly as `false` fails** (every record must declare voice consent, including a purely synthetic voice) |
| `rights.source_text_reproduction_right_declared` | rights evidence: the record declares the right to reproduce the source text as audio |
| `rights.rights_basis_recorded` | rights evidence: the basis for the declared reproduction right is recorded |
| `adaptation.abbreviations_expanded` | adaptation evidence: abbreviations were expanded for speech |
| `adaptation.long_sentences_broken` | adaptation evidence: long sentences were broken up |
| `adaptation.numbers_spelled_out` | adaptation evidence: numbers were spelled out for speech |
| `adaptation.links_removed` | adaptation evidence: links were removed |
| `adaptation.tables_and_formatting_removed` | adaptation evidence: tables and formatting were removed |
| `adaptation.text_adapted_not_read_raw` | adaptation evidence: the text was adapted for listening, not read raw |
| `adaptation.adaptation_reviewed_for_meaning_preservation` | adaptation evidence: the adapted text was reviewed to confirm the source meaning was not changed |
| `chunking.long_text_chunked_at_natural_breaks_where_long` | chunking evidence: long text was chunked at natural breaks where long |
| `chunking.narrated_chunk_by_chunk` | chunking evidence: the audio was narrated chunk by chunk |
| `segments` (list of segment objects) | computed: must be present and name at least one segment; reported as `voice_note_segments_count` |
| `segments[].segment_id` (string) | names the row in the computed outputs; computed: no id may appear on more than one row |
| `segments[].section_label` (string) | computed: must be present and non-empty on every row — names the source section the segment narrates |
| `segments[].sequence_position` (number) | computed: the positions must cover exactly 1..N, each once |
| `segments[].duration_seconds` (number) | computed: must be positive on every row; the durations must sum to the declared total below |
| `audio_spec.file_format` (string) | computed: must be one of `mp3`, `wav`, `m4a`, `ogg`, `flac` |
| `assembly.audio_generated_through_voice_stack` | assembly evidence: the audio was generated through your voice stack |
| `assembly.opening_spot_checked_for_clarity_and_pace` | assembly evidence: the opening section was spot-checked for clarity and pace |
| `assembly.middle_spot_checked_for_clarity_and_pace` | assembly evidence: a middle section was spot-checked for clarity and pace |
| `assembly.chunks_assembled_into_one_file` | assembly evidence: the chunks were assembled into one file |
| `assembly.assembled_order_verified` | assembly evidence: the assembled order was verified |
| `assembly.assembly_completeness_verified` | assembly evidence: the assembled file was confirmed complete |
| `assembly.total_duration_seconds_declared` (number) | computed: must recompute exactly as the sum of the declared segment durations |
| `delivery.audio_file_delivered` | delivery evidence: the finished audio file was delivered |
| `delivery.total_duration_stated_in_delivery` | delivery evidence: the delivery states the audio's total duration |
| `delivery.played_through_voice_stack_only_if_requested` | delivery evidence: the audio was played through the voice stack only if requested |
| `delivery.recipient_matches_declared_audience` | delivery evidence: the audio was delivered to the declared audience and no one else |
| `delivery.ai_voice_disclosure_made` | required when `scoping.audience_scope` is `includes_others`; otherwise the check passes as not applicable |
| `red_lines.voice_cloned_or_imitated_without_consent_present` | must be `false` to pass (red line: no voice cloned or imitated without consent) |
| `red_lines.voice_note_sent_to_other_without_ai_disclosure_present` | must be `false` to pass (red line: no voice note sent to another without the AI-voice disclosure) |
| `red_lines.text_narrated_without_reproduction_right_present` | must be `false` to pass (red line: no text narrated without the reproduction right) |
| `red_lines.generated_audio_presented_as_real_event_recording_present` | must be `false` to pass (red line: no generated audio presented as a real event recording) |
| `red_lines.source_meaning_changed_in_adaptation_present` | must be `false` to pass (red line: no source meaning changed in adaptation) |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward VOICE_NOTE_NARRATION_NOT_SOUND). The one exception is `voice.voice_consent_declared`: absent fails, exactly as `false` fails (red-line class). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-16)

Request — `POST /v1/voice-note-narration-audio`:

```json
{
  "production_title": "Test Narration",
  "scoping": {
    "kind_confirmed": true,
    "production_kind": "narration",
    "audience_noted": true,
    "audience_scope": "self_only",
    "voice_confirmed_before_generation": true,
    "register_confirmed_before_generation": true,
    "target_length_confirmed_before_generation": true,
    "confirmations_completed_before_generation": true
  },
  "voice": {
    "voice_kind": "original_synthetic",
    "voice_selected_before_generation": true,
    "uses_real_person_voice": false,
    "voice_consent_declared": true
  },
  "rights": {
    "source_text_reproduction_right_declared": true,
    "rights_basis_recorded": true
  },
  "adaptation": {
    "abbreviations_expanded": true,
    "long_sentences_broken": true,
    "numbers_spelled_out": true,
    "links_removed": true,
    "tables_and_formatting_removed": true,
    "text_adapted_not_read_raw": true,
    "adaptation_reviewed_for_meaning_preservation": true
  },
  "chunking": {
    "long_text_chunked_at_natural_breaks_where_long": true,
    "narrated_chunk_by_chunk": true
  },
  "segments": [
    {
      "segment_id": "s1",
      "section_label": "Intro",
      "sequence_position": 1,
      "duration_seconds": 10.0
    }
  ],
  "audio_spec": {
    "file_format": "mp3"
  },
  "assembly": {
    "audio_generated_through_voice_stack": true,
    "opening_spot_checked_for_clarity_and_pace": true,
    "middle_spot_checked_for_clarity_and_pace": true,
    "chunks_assembled_into_one_file": true,
    "assembled_order_verified": true,
    "assembly_completeness_verified": true,
    "total_duration_seconds_declared": 10.0
  },
  "delivery": {
    "audio_file_delivered": true,
    "total_duration_stated_in_delivery": true,
    "played_through_voice_stack_only_if_requested": true,
    "recipient_matches_declared_audience": true
  },
  "red_lines": {
    "voice_cloned_or_imitated_without_consent_present": false,
    "voice_note_sent_to_other_without_ai_disclosure_present": false,
    "text_narrated_without_reproduction_right_present": false,
    "generated_audio_presented_as_real_event_recording_present": false,
    "source_meaning_changed_in_adaptation_present": false
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 46 checks and a text stamp of the verdict):

```json
{
  "service": "voice-note-narration-audio",
  "atom_version": "0.1.0",
  "production_title": "Test Narration",
  "verdict": "VOICE_NOTE_NARRATION_SOUND",
  "sections": {
    "production_scoping_and_confirmation": "pass",
    "voice_consent_and_rights": "pass",
    "text_adaptation_for_listening": "pass",
    "segments_and_chunking": "pass",
    "audio_spec_and_assembly": "pass",
    "delivery_and_disclosure": "pass",
    "red_lines": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "voice_note_segments_count": 1,
  "duplicate_voice_note_segment_ids": [],
  "voice_note_segments_without_section_label": [],
  "voice_note_segments_with_non_positive_duration": [],
  "voice_note_segments_with_invalid_sequence_position": [],
  "voice_note_segment_duration_total": "10.000000",
  "voice_note_total_duration_declared": "10.000000",
  "segment_sequence_coverage_ratio": "1.000000",
  "segment_section_label_ratio": "1.000000",
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across seven sections."
}
```

## Verdicts

- **VOICE_NOTE_NARRATION_SOUND** — every check passes; the declared voice-note / narration production record is complete and internally consistent with the skill's method, quality gates and red lines.
- **VOICE_NOTE_NARRATION_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `voice_note_segments_count` (integer, exactly; null when the segments list is not declared), `duplicate_voice_note_segment_ids` (ids carried by more than one row; null when the list is not declared), `voice_note_segments_without_section_label`, `voice_note_segments_with_non_positive_duration` and `voice_note_segments_with_invalid_sequence_position` (the offending rows for each computed rule; each null when the segments list is not declared), `voice_note_segment_duration_total` (the sum of the declared segment durations) and `voice_note_total_duration_declared` (the declared total as declared), `segment_sequence_coverage_ratio` (segments with a valid, distinct, in-range sequence position ÷ declared segments) and `segment_section_label_ratio` (segments with a non-empty section label ÷ declared segments; each quantity and ratio a string with exactly six decimal places, and null when its denominator list is absent or empty — `voice_note_segment_duration_total` is null when the list is not declared and `voice_note_total_duration_declared` is null when the total is not declared as a number), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the ten primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
