# Voice note narration audio — documentation

**Voice note narration audio** · slug `voice-note-narration-audio` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live (atoms-gateway v1.1.0, deployment ee6a845a54d94e829dd0aad9f8cd9d41; RC soak to 2026-11-22).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This atom audits a caller-declared voice-note / narration production record for completeness and internal consistency only, and recomputes the arithmetic the record itself declares. It surfaces two faces: REST `POST /v1/voice-note-narration-audio` and MCP `POST /mcp/voice-note-narration-audio`. It synthesizes no audio, records nothing, clones no voice, adapts no text, assembles no file, plays nothing, sends nothing and publishes nothing — see Explanation.

This document follows the house documentation standard (AppDoc Studio standard, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples.

> **Status discrepancy named:** SERVICE.md still says status: **AUTHORED + STAGED — not deployed** — "no endpoint is live", and contract.yaml still says status: **scaffolded**. That is stale. TEST-REPORT.md and the recorded evidence in `verification/work/voice-note-narration-audio/evidence.json` show the atom live on atoms-gateway v1.1.0 (deployment ee6a845a54d94e829dd0aad9f8cd9d41). This document follows the evidenced live state above. See Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the production "Test Narration"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "voice-note-narration-audio"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the voice-note / narration production manifest.** You declare a voice-note or narration production record for one production, made from the production as actually carried out — kind and audience scoped and confirmed before generation, voice consent and source-text reproduction rights declared, the text adapted for listening, the audio chunked and declared as segment rows, the assembled file spot-checked and verified, and delivery with the total duration stated and the AI-voice disclosure made where the audience includes others; the atom audits the declared record, it does not produce the audio for you (see Explanation). The recorded full-pass manifest declares the production `Test Narration`: scoping kind confirmed, kind `narration`, audience noted, scope `self_only`, and voice / register / target-length / all confirmations confirmed before generation; voice `original_synthetic`, selected before generation, `uses_real_person_voice` declared `false` — so the real-person consent check passes as not applicable and the manifest declares no `real_person_voice_consent_recorded` field at all — with voice consent declared `true`; the source-text reproduction right declared and its basis recorded; all seven adaptation flags `true`; both chunking flags `true`; one segment `s1` (section label `Intro`, sequence position 1, duration 10.0); format `mp3`; all six assembly flags `true` with declared total duration 10.0; the four delivery flags `true` — with audience scope `self_only`, so the AI-voice disclosure check passes as not applicable and the manifest declares no `ai_voice_disclosure_made` field at all; and all five red-line flags `false` (no voice cloned or imitated without consent, no voice note sent to another without the AI disclosure, no text narrated without the reproduction right, no generated audio presented as a real event recording, no source meaning changed in adaptation).

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/voice-note-narration-audio` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `VOICE_NOTE_NARRATION_SOUND`: "46 pass, 0 fail, 0 missing of 46 checks across seven sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `voice_note_segments_count` is 1, `duplicate_voice_note_segment_ids` and all three row-name lists are empty (`[]`), `voice_note_segment_duration_total` and `voice_note_total_duration_declared` are each `"10.000000"`, and `segment_sequence_coverage_ratio` and `segment_section_label_ratio` are each `"1.000000"`.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `VOICE_NOTE_NARRATION_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "voice-note-narration-audio"}`.
3. Call: `POST https://atoms.pipavia.com/v1/voice-note-narration-audio` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/voice-note-narration-audio` with the `Authorization: Bearer <key>` header.
2. Call `tools/call` with tool name `voice_note_narration_audio`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `VOICE_NOTE_NARRATION_NOT_SOUND` means at least one check has status `fail`: a field is present but false / invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 4 checks fail: `voice_note_narration_production_kind_recognised`, `every_voice_note_narration_segment_duration_positive`, `voice_note_narration_total_duration_recomputes_from_segments`, and `voice_note_narration_record_declares_voice_consent`, and the summary reads "42 pass, 4 fail, 0 missing of 46 checks across seven sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows and quantities (in the recorded violations run, `scoping.production_kind` is declared `invalid_kind`, outside the two recognised kinds `voice_note` / `narration`; segment `s1` declares `duration_seconds` -5.0, named in `voice_note_segments_with_non_positive_duration` as `["s1"]`, which drops `voice_note_segment_duration_total` to `"-5.000000"`; `assembly.total_duration_seconds_declared` is declared 100.0 against that segment sum, reported as `voice_note_total_duration_declared` `"100.000000"`, so the total-duration recomputation fails; and `voice.voice_consent_declared` is declared `false`, failing the red-line consent check; `segment_sequence_coverage_ratio` and `segment_section_label_ratio` stay `"1.000000"`; sections `production_scoping_and_confirmation`, `segments_and_chunking`, `audio_spec_and_assembly` and `red_lines` report `fail`, the other three sections report `pass`, and `computed_status` is `outside_stated_limits_on_declared_evidence`). Declare only what is true of the actual production: correct the production kind to the kind the production actually is, record the segment's real duration and the total it sums to, and record the true consent state. For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different (the one exception is the voice-consent declaration: absent fails exactly as `false` fails — see the Checks section).
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scoping",
  "detail": "scoping must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/voice-note-narration-audio` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/voice-note-narration-audio` — tool name `voice_note_narration_audio`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `voice_note_narration_audio` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**, and `production_title`, `scoping.production_kind`, `scoping.audience_scope`, `voice.voice_kind`, `segments[].segment_id` and `audio_spec.file_format` are noted as strings, `segments[].section_label` as a non-empty string, `segments[].sequence_position`, `segments[].duration_seconds` and `assembly.total_duration_seconds_declared` as numbers, and `segments` as a list of segment-row objects there. Where SERVICE.md states no type — the section container objects (`scoping`, `voice`, `rights`, `adaptation`, `chunking`, `audio_spec`, `assembly`, `delivery`, `red_lines`) and the row object (`segments[]`) — the type below is grounded in the recorded evidence inputs and the recorded MCP `inputSchema` (evidence.json `mcp_tools`, which types the top-level containers `object` and `segments` `array`), and is said so in the row note. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `VOICE_NOTE_NARRATION_NOT_SOUND`) — **with one named exception: `voice.voice_consent_declared` is a red-line class declaration, and its absence fails exactly as `false` fails.** A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below by the section that reads them, as SERVICE.md groups them — with the multi-section rows named where they occur: the `segments` rows are also read by `audio_spec_and_assembly` (their `duration_seconds` fields, for the total-duration recomputation), and `voice.voice_consent_declared` sits on the `voice` object but is read by `red_lines`, as SERVICE.md's table records it. 58 typed fields are listed in total: the 48 fields whose types SERVICE.md states, plus the 10 container / row-object fields whose types are grounded as described above.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `production_title` | string | Carried into the verdict output, not itself checked (type stated in SERVICE.md) |

#### Read by: production_scoping_and_confirmation

| Field | Type | Notes |
|---|---|---|
| `scoping` | object | The scoping section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `scoping.kind_confirmed` | boolean | — |
| `scoping.production_kind` | string | Computed — one of `voice_note`, `narration` (type stated in SERVICE.md) |
| `scoping.audience_noted` | boolean | — |
| `scoping.audience_scope` | string | Computed — one of `self_only`, `includes_others`; gates the AI-voice disclosure check below (type stated in SERVICE.md) |
| `scoping.voice_confirmed_before_generation` | boolean | — |
| `scoping.register_confirmed_before_generation` | boolean | — |
| `scoping.target_length_confirmed_before_generation` | boolean | — |
| `scoping.confirmations_completed_before_generation` | boolean | — |

#### Read by: voice_consent_and_rights

| Field | Type | Notes |
|---|---|---|
| `voice` | object | The voice section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `voice.voice_kind` | string | Computed — one of `original_synthetic`, `licensed_voice`, `real_person_voice` (type stated in SERVICE.md) |
| `voice.voice_selected_before_generation` | boolean | — |
| `voice.uses_real_person_voice` | boolean | Gates the real-person consent check below |
| `voice.real_person_voice_consent_recorded` | boolean | Required when `voice.uses_real_person_voice` is declared `true`; otherwise the check that reads it passes as not applicable — the recorded full-pass manifest omits this field entirely (its gate is declared `false`) and the check passes |
| `rights` | object | The rights section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema`. Sits as its own top-level object but is read by this section, as SERVICE.md groups it |
| `rights.source_text_reproduction_right_declared` | boolean | — |
| `rights.rights_basis_recorded` | boolean | — |

#### Read by: red_lines (field sits on the `voice` object)

| Field | Type | Notes |
|---|---|---|
| `voice.voice_consent_declared` | boolean | **Red-line class — absent fails, exactly as `false` fails**; passes only on a declared `true` (type stated in SERVICE.md). Sits on the `voice` object but is read by `red_lines`, as SERVICE.md's table records it |

#### Read by: text_adaptation_for_listening

| Field | Type | Notes |
|---|---|---|
| `adaptation` | object | The adaptation section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `adaptation.abbreviations_expanded` | boolean | — |
| `adaptation.long_sentences_broken` | boolean | — |
| `adaptation.numbers_spelled_out` | boolean | — |
| `adaptation.links_removed` | boolean | — |
| `adaptation.tables_and_formatting_removed` | boolean | — |
| `adaptation.text_adapted_not_read_raw` | boolean | — |
| `adaptation.adaptation_reviewed_for_meaning_preservation` | boolean | — |

#### Read by: segments_and_chunking

| Field | Type | Notes |
|---|---|---|
| `chunking` | object | The chunking section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema`. Sits as its own top-level object but is read by this section, as SERVICE.md groups it |
| `chunking.long_text_chunked_at_natural_breaks_where_long` | boolean | — |
| `chunking.narrated_chunk_by_chunk` | boolean | — |
| `segments` | list | List of segment-row objects, each with the entry fields below; computed, see below (type stated in SERVICE.md). Also read by `audio_spec_and_assembly` |
| `segments[]` | object | One declared segment row. SERVICE.md states no type for the row object itself; type grounded in the recorded evidence inputs |
| `segments[].segment_id` | string | Names the row in the computed outputs; computed — must be unique per row (type stated in SERVICE.md) |
| `segments[].section_label` | string (non-empty) | Computed — must be non-empty on every row (type stated in SERVICE.md) |
| `segments[].sequence_position` | number | Computed — the positions must cover exactly 1..N, each once (type stated in SERVICE.md) |
| `segments[].duration_seconds` | number | Computed — must be positive on every row; the durations must sum to the declared total below (type stated in SERVICE.md). Also read by `audio_spec_and_assembly` |

#### Read by: audio_spec_and_assembly

| Field | Type | Notes |
|---|---|---|
| `audio_spec` | object | The audio-spec section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `audio_spec.file_format` | string | Computed — one of `mp3`, `wav`, `m4a`, `ogg`, `flac` (type stated in SERVICE.md) |
| `assembly` | object | The assembly section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `assembly.audio_generated_through_voice_stack` | boolean | — |
| `assembly.opening_spot_checked_for_clarity_and_pace` | boolean | — |
| `assembly.middle_spot_checked_for_clarity_and_pace` | boolean | — |
| `assembly.chunks_assembled_into_one_file` | boolean | — |
| `assembly.assembled_order_verified` | boolean | — |
| `assembly.assembly_completeness_verified` | boolean | — |
| `assembly.total_duration_seconds_declared` | number | Computed — must recompute from the declared segment durations, see below (type stated in SERVICE.md) |

#### Read by: delivery_and_disclosure

| Field | Type | Notes |
|---|---|---|
| `delivery` | object | The delivery section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `delivery.audio_file_delivered` | boolean | — |
| `delivery.total_duration_stated_in_delivery` | boolean | — |
| `delivery.played_through_voice_stack_only_if_requested` | boolean | — |
| `delivery.recipient_matches_declared_audience` | boolean | — |
| `delivery.ai_voice_disclosure_made` | boolean | Required when `scoping.audience_scope` is declared `includes_others`; otherwise the check that reads it passes as not applicable — the recorded full-pass manifest omits this field entirely (its scope is declared `self_only`) and the check passes |

#### Read by: red_lines

| Field | Type | Notes |
|---|---|---|
| `red_lines` | object | The red-lines section object. SERVICE.md states no type for the container; type grounded in the recorded evidence inputs / recorded MCP `inputSchema` |
| `red_lines.voice_cloned_or_imitated_without_consent_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.voice_note_sent_to_other_without_ai_disclosure_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.text_narrated_without_reproduction_right_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.generated_audio_presented_as_real_event_recording_present` | boolean | must be `false` to pass — skill red line |
| `red_lines.source_meaning_changed_in_adaptation_present` | boolean | must be `false` to pass — skill red line |

### Checks

All 46 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Per-check statuses are `pass`, `fail` and `missing` only — except the red-line consent check, which has no `missing` state (absent fails, by design; see its row). Section and verdict aggregation are defined under Verdict vocabulary. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies). Note on the gated checks: the two gated checks (`voice_note_narration_real_person_voice_consent_recorded_where_real_person_voice_used` and `voice_note_narration_ai_voice_disclosure_made_where_audience_includes_others`) carry the same recorded evidence text — "no real-person voice declared used" and "audience declared self-only — no disclosure to another recipient is owed" respectively — in both their full-pass `pass` states and their sparse-run `missing` states — see Discrepancies.

#### Section: production_scoping_and_confirmation

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `voice_note_narration_kind_confirmed` | scoping: what the audio is — a short note or a full narration — was confirmed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_production_kind_recognised` | scoping: the declared production kind is one of voice_note, narration — the two kinds the skill confirms | Computed over the declared record. Pass: `scoping.production_kind` is one of `voice_note`, `narration`. Fail: any other value. Missing: the field is absent. |
| `voice_note_narration_audience_noted` | scoping: the audience — just the caller, or someone else as well — was noted | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_audience_scope_recognised` | scoping: the declared audience scope is one of self_only, includes_others — the two audiences the skill notes | Computed over the declared record. Pass: `scoping.audience_scope` is one of `self_only`, `includes_others`. Fail: any other value. Missing: the field is absent. |
| `voice_note_narration_voice_confirmed_before_generation` | confirmation: the voice was confirmed before generating | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_register_confirmed_before_generation` | confirmation: the register — conversational for a note, steady and clear for narration — was confirmed before generating | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_target_length_confirmed_before_generation` | confirmation: the target length was confirmed before generating | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_confirmations_completed_before_generation` | confirmation: the kind, audience, voice, register and target-length confirmations were all completed before generation began | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: voice_consent_and_rights

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `voice_note_narration_voice_kind_recognised` | voice: the declared voice kind is one of original_synthetic, licensed_voice, real_person_voice — the record's voice vocabulary | Computed over the declared record. Pass: `voice.voice_kind` is one of `original_synthetic`, `licensed_voice`, `real_person_voice`. Fail: any other value. Missing: the field is absent. |
| `voice_note_narration_voice_selected_before_generation` | voice: the voice used was selected before generation began | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_real_person_voice_consent_recorded_where_real_person_voice_used` | no real-person voice declared used | Computed-gated over the declared record. Pass: `voice.uses_real_person_voice` is declared `false` (the check passes as not applicable — the recorded full-pass manifest omits `voice.real_person_voice_consent_recorded` and still passes), or the gate is declared `true` and `voice.real_person_voice_consent_recorded` is declared `true`. Fail: the gate is declared `true` and the field is declared `false`. Missing: the gate field is absent, or the gate is declared `true` and the field is absent. |
| `voice_note_narration_source_text_reproduction_right_declared` | rights: the record declares the right to reproduce the source text as audio — the skill's narration-rights red line | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_rights_basis_recorded` | rights: the basis for the declared reproduction right is recorded in the record | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: text_adaptation_for_listening

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `voice_note_narration_abbreviations_expanded` | adaptation: abbreviations in the source text were expanded for speech | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_long_sentences_broken` | adaptation: long sentences were broken up so the text sounds spoken, not printed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_numbers_spelled_out` | adaptation: numbers were spelled out for speech | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_links_removed_for_listening` | adaptation: links, which do not survive aloud, were removed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_tables_and_formatting_removed_for_listening` | adaptation: tables and formatting that do not survive aloud were removed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_text_adapted_not_read_raw` | adaptation: the text was adapted for listening, not read raw from the page | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_adaptation_reviewed_for_meaning_preservation` | adaptation: the adapted text was reviewed to confirm the source text's meaning was not changed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: segments_and_chunking

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `voice_note_narration_long_text_chunked_at_natural_breaks_where_long` | chunking: long text was chunked into sections at natural breaks | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_narrated_chunk_by_chunk` | chunking: the audio was narrated chunk by chunk, so a failure never loses the whole piece | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_segments_list_declared` | segments: the declared record names its segment rows — the list is present and names at least one segment; an absent list is missing evidence and an empty list declares no segmented production at all | Computed over the declared record. Pass: the `segments` list is present and names at least one segment. Fail: the list is present but empty. Missing: the list is absent. |
| `every_voice_note_narration_segment_id_unique` | segments: no declared segment_id is owned by more than one row | Computed over the declared record. Pass: no declared `segment_id` appears on more than one row. Fail: a `segment_id` is declared on more than one row (duplicates are named in `duplicate_voice_note_segment_ids`). Missing: the list is absent, or a row has `segment_id` absent. |
| `every_voice_note_narration_segment_section_label_declared` | segments: every declared segment declares a non-empty section label naming the source section it narrates | Computed over the declared record. Pass: every declared segment row declares a non-empty `section_label`. Fail: a row declares an empty label (offending rows are named in `voice_note_segments_without_section_label`). Missing: the list is absent, or a row has `section_label` absent. |
| `every_voice_note_narration_segment_duration_positive` | segments: every declared segment declares a positive duration in seconds — a segment with no duration declares no audio | Computed over the declared record. Pass: every declared segment row declares a positive `duration_seconds`. Fail: a row declares zero or a negative duration (offending rows are named in `voice_note_segments_with_non_positive_duration`). Missing: the list is absent, or a row has `duration_seconds` absent. |
| `voice_note_narration_segment_sequence_complete` | segments: the declared sequence positions cover exactly 1..N, each once — no section is missing, repeated, or out of sequence | Computed over the declared record. Pass: the declared `sequence_position` values cover exactly 1..N (N = the declared segment count), each once. Fail: a row's position is fractional, out of range, or a repeat of an earlier row's position (offending rows are named in `voice_note_segments_with_invalid_sequence_position`). Missing: the list is absent, or a row has `sequence_position` absent. |

#### Section: audio_spec_and_assembly

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `voice_note_narration_audio_file_format_recognised` | audio spec: the declared audio file format is one of mp3, wav, m4a, ogg, flac — the record's format vocabulary | Computed over the declared record. Pass: `audio_spec.file_format` is one of `mp3`, `wav`, `m4a`, `ogg`, `flac`. Fail: any other value. Missing: the field is absent. |
| `voice_note_narration_audio_generated_through_voice_stack` | assembly: the audio was generated through the caller's voice stack | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_opening_spot_checked_for_clarity_and_pace` | assembly QC: the opening section was spot-checked for clarity and pace | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_middle_spot_checked_for_clarity_and_pace` | assembly QC: a middle section was spot-checked for clarity and pace | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_chunks_assembled_into_one_file` | assembly: the chunks were assembled into one audio file | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_assembled_order_verified` | assembly: the assembled order of the chunks was verified | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_assembly_completeness_verified` | assembly: the assembled file was confirmed complete — no section missing, repeated, or out of sequence | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_total_duration_recomputes_from_segments` | assembly: the declared total duration recomputes exactly as the sum of the declared segment durations | Computed over the declared record. Pass: `assembly.total_duration_seconds_declared` recomputes exactly as the sum of the declared segment durations, compared on the fixed 6dp serialization. Fail: the declared total differs from the recomputed sum. Missing: the total field is absent, the segments list is absent, or a segment row has no duration. |

#### Section: delivery_and_disclosure

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `voice_note_narration_audio_file_delivered` | delivery: the finished audio file was delivered | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_total_duration_stated_in_delivery` | delivery: the delivery states the audio's total duration | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_played_through_voice_stack_only_if_requested` | delivery: the audio was played through the voice stack instead of delivered as a file only if the caller asked for that | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_recipient_matches_declared_audience` | delivery: the audio was delivered to the declared audience and no one else | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_note_narration_ai_voice_disclosure_made_where_audience_includes_others` | audience declared self-only — no disclosure to another recipient is owed | Computed-gated over the declared record. Pass: `scoping.audience_scope` is declared `self_only` (the check passes as not applicable — the recorded full-pass manifest omits `delivery.ai_voice_disclosure_made` and still passes), or the scope is declared `includes_others` and `delivery.ai_voice_disclosure_made` is declared `true`; where the scope is declared but is an unrecognised value, the scope check above already fails and this check passes as not applicable on the declared record. Fail: the scope is declared `includes_others` and the field is declared `false`. Missing: the scope field is absent, or the scope is declared `includes_others` and the field is absent. |

#### Section: red_lines

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `voice_note_narration_record_declares_voice_consent` | red line (consent class): the record declares voice consent — a missing voice-consent declaration fails this check exactly as a declared absence of consent does, because a narration record must declare voice consent | Red-line class check. Pass: `voice.voice_consent_declared` is declared `true` — the only passing state. Fail: the field is declared `false`, **or the field is absent** (absent fails exactly as `false` fails, by design — see Explanation). Missing: never; this check has no missing state. |
| `voice_note_narration_free_of_voice_cloned_or_imitated_without_consent` | red line: no imitation or cloning of a real person's voice without their clear consent is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `voice_note_narration_free_of_voice_note_sent_to_other_without_ai_disclosure` | red line: no voice note sent to someone else without the AI-voice disclosure is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `voice_note_narration_free_of_text_narrated_without_reproduction_right` | red line: no narration of text the caller does not have the right to reproduce as audio is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `voice_note_narration_free_of_generated_audio_presented_as_real_event_recording` | red line: no generated audio presented as a recording of a real event is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `voice_note_narration_free_of_source_meaning_changed_in_adaptation` | red line: no change to the meaning of the source text while adapting it for speech is present in the record | Pass: the anti-pattern field is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object, with these top-level fields in the recorded order:

- `service` (`"voice-note-narration-audio"`), `atom_version` (`"0.1.0"`), and `production_title` (the manifest's declared production title, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `voice_note_segments_count` (the declared list length as an integer, exactly, or null when the list is not declared); `duplicate_voice_note_segment_ids` (ids carried by more than one row; null when the segments list is not declared, as recorded in the sparse case); `voice_note_segments_without_section_label`, `voice_note_segments_with_non_positive_duration` and `voice_note_segments_with_invalid_sequence_position` (the offending rows for each computed rule; each null when the segments list is not declared, as recorded in the sparse case); `voice_note_segment_duration_total` (the sum of the declared segment durations) and `voice_note_total_duration_declared` (the declared total as declared) — strings with exactly six decimal places; `voice_note_segment_duration_total` is null when the segments list is not declared and `voice_note_total_duration_declared` is null when the total is not declared, as recorded in the sparse case (SERVICE.md is silent on these two null rules; this document follows the recorded sparse response — see Discrepancies); and the ratios `segment_sequence_coverage_ratio` (segments with a valid, distinct, in-range sequence position ÷ declared segments) and `segment_section_label_ratio` (segments with a non-empty section label ÷ declared segments) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Computed quantities use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals; the total-duration comparison is made on the same 6dp serialization — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "46 pass, 0 fail, 0 missing of 46 checks across seven sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared production title, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `VOICE_NOTE_NARRATION_SOUND` — all 46 checks pass: the declared voice-note / narration production record is complete and internally consistent with the skill's method, quality gates and red lines.
- `VOICE_NOTE_NARRATION_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only — the ten primary computed checks named in SERVICE.md): `within_stated_limits_on_declared_evidence` — every computed check passes; `outside_stated_limits_on_declared_evidence` — at least one computed check fails; `null` — at least one of the ten primary computed checks cannot be completed because the rows or fields it reads are absent (as recorded in the sparse case).

**Section statuses** (each value in `sections`): `pass` — every check in the section passes; `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for the gated checks, including passes as not applicable when their gates are off); `fail` — the declared evidence contradicts the requirement (for the red-line consent check, including an absent consent declaration, by design); `missing` — the field or rows the check reads are absent (never for the red-line consent check).

**Secondary computed fields:** `voice_note_segments_count`, `duplicate_voice_note_segment_ids`, the three row-name lists, `voice_note_segment_duration_total`, `voice_note_total_duration_declared`, `segment_sequence_coverage_ratio` and `segment_section_label_ratio` — each defined in Output format above, with the values and null rules recorded there (11 computed fields in total, including `computed_status`).

### Errors

A failed call is not metered. The 422 body below is the recorded body from this atom's malformed run, verbatim. The 401, 403 and 429 rows have **no recorded bodies in the battery** — they are carried as HTTP status + meaning only, explicitly flagged as unrecorded; no payload shape is asserted for them.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Missing / invalid key. |
| 403 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Key lacks this atom's scope. |
| 422 | `{"ok":false,"error":"invalid_input","field":"scoping","detail":"scoping must be an object"}` (this atom's recorded malformed run) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *Unrecorded — no recorded body in the battery; status + meaning only, no payload shape asserted.* | Rate limit (60/min, 10,000/day per key). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above) and are not metered.
- **Pricing:** unit = deliverable (one delivered result = one unit of sale; deliverable type DELIVERABLE — this atom sells the deliverable it produces, never the underlying knowledge itself). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit under the billing protocol in `rails/billing.md`; no channel markup.

## Explanation

**What the atom does.** Produce spoken audio as short voice notes or as narration of text and documents you want to listen to (the bound capability, from the skill). You submit one declared record — the voice-note / narration production manifest, made from the production as actually carried out — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, and recomputes the arithmetic the record itself declares, returning one deterministic verdict across 7 sections (`production_scoping_and_confirmation`, `voice_consent_and_rights`, `text_adaptation_for_listening`, `segments_and_chunking`, `audio_spec_and_assembly`, `delivery_and_disclosure`, `red_lines`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself. This atom shares zero checks with its nearest siblings `sourced-podcast-episode-production` (a declared podcast episode production record — claim-to-source traceability, episode outlining, show notes and episode publishing authorization appear nowhere here) and `local-voice-stack-engineering-pack` (the engineering of a local TTS/STT voice stack itself — the stack is a declared means here, never the subject) (SERVICE.md, Distinct ground): every check here is a voice-note / narration production question — note-vs-narration kind and audience scope confirmed before generation, voice consent and source-text reproduction rights, spoken-text adaptation (abbreviations expanded, numbers spelled out, links, tables and formatting removed), declared segment rows whose sequence positions cover 1..N exactly and whose declared durations sum to the declared total duration, opening and middle spot-checks, delivery with the total duration stated, and the AI-voice disclosure owed when the audience includes others.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Four kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields, declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* (ten, per SERVICE.md) are calculated from the declared rows and values themselves — the declared production kind, audience scope and voice kind must each be one of their recognised vocabularies; the segments list must name at least one row with unique ids, a non-empty section label and a positive duration on every row, and sequence positions covering exactly 1..N, each once (the rows' physical order in the list is not itself checked); the declared file format must be one of the recognised formats; and the declared total duration must recompute exactly as the sum of the declared segment durations — using only the skill's own stated rules plus the consistency of the declared record itself, with no outside threshold imported. *The gated checks* (two) follow the skill's own conditional scope: the person's clear consent recorded is required only where `voice.uses_real_person_voice` is declared `true`, and the AI-voice disclosure is required only where `scoping.audience_scope` is declared `includes_others`; with a gate declared off the check passes as not applicable, and with the gate absent the check is missing evidence (where the audience scope is declared but is an unrecognised value, the scope check already fails and the disclosure check passes as not applicable on the declared record). *The red-line class check* is the recorded exception: `voice_note_narration_record_declares_voice_consent` reads `voice.voice_consent_declared` and **fails when the field is absent exactly as it fails when it is declared `false`** — a narration record must declare voice consent, mirroring the skill's discipline that voice use without consent is a red line, not an omission; it passes only on a declared `true`, so an empty manifest fails this one check (and is otherwise all-missing) and its verdict is `VOICE_NOTE_NARRATION_NOT_SOUND`, not `INSUFFICIENT_EVIDENCE`. Aggregation is strict: any `fail` anywhere produces `VOICE_NOTE_NARRATION_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `VOICE_NOTE_NARRATION_SOUND`. The central semantic is the absent / false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing** — with the single named red-line consent exception above, exactly as SERVICE.md and the contract record it. That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** The skill states no numeric threshold at all — its demands are confirmation before generation, spoken-text adaptation, chunking, spot-checks, verified assembly, delivery with the duration stated, and disclosure, not bars the atom can set. Declined, named, exactly as SERVICE.md names them: a target length in minutes or words, or a tolerance around the caller's confirmed target (length is checked as confirmed, never measured); a narration pace in words per minute; a loudness, sample-rate, bitrate or any other audio-quality bar for the generated audio (the audio-spec check is the declared format vocabulary only); a minimum or maximum number of segments beyond at least one; a segment-duration minimum beyond positivity, or a total duration ceiling; a spot-check coverage bar beyond the opening and a middle section the skill names; a reading-level, sentence-length or adaptation-quality bar for "prepared for speech" (checked as declarations only); a voice-quality, naturalness or similarity bar for the voice used; and any judgment that the narration is good, clear or worth sending (only that its declared production record contains what the skill requires). Quantities are computed and reported; the only bars on the computed rows are exact recomputation and completeness over the caller's own declared rows.

**What it does NOT do.** The atom reviews a **declared** voice-note / narration production record: a verdict of `VOICE_NOTE_NARRATION_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a record that declares its voice consented, its text adapted, its segments sequenced and its disclosure made passes those checks even if the real production did none of it. It is a completeness and consistency audit of the production record the skill requires, **not a production service, a listening check, or a guarantee that the audio is clear or lawful**: it never hears the audio, never judges whether a declared consent is legally sufficient, whether the adaptation really preserves meaning, or whether the narration sounds right — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions: audio synthesis / text-to-speech generation itself; voice recording itself; voice cloning or imitation itself — cloning without declared consent is refused as a red line on the record, and no cloning capability exists in this atom; audio assembly and editing itself; playback through the voice stack; sending, delivering or publishing the audio itself; extracting or reading the source document's text (the related `document-reader` step); designing or engineering the voice stack (the related `voice-and-speech-engineering` work); and in-reader read-aloud (the related `read-aloud` engine) — each is EXCLUDED by name from this atom, which audits only the declared record of those steps. Boundary cases, named in SERVICE.md: a production genuinely delivered as one unchunked take still fits this record format (one segment row, position 1); the voice-consent declaration is required of every record in this format, including a purely synthetic voice — the declaration is the record's statement that the voice used is consented / rights-clean, and its absence fails by design (see above); consent and reproduction rights are declared presence only, never a legal judgment of sufficiency.

**Buyer and use context.** Teams and agents working in Everyday life who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Audio versions of briefings and articles (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

## Role views

### For regulators

This atom was screened under a U-13 regulatory screen classified **(a) — No outright**, exactly as SERVICE.md's U-13 section records it: voice consent is a red-line class inside the atom, not a regulatory surface. SERVICE.md records the basis: the keyword screen names voice notes, narration, voice consent, reproduction rights and AI-voice disclosure — no engineering-practice, securities/financial-advice or psychology-adjacent subject, and no regulated profession's vocabulary; and the substance screen finds this atom's output could not read as regulated professional advice — it audits a caller-declared voice-note / narration production record for completeness and internal consistency only, and every output is a pass / fail / missing verdict on the record or a quantity recomputed from the caller's own declared rows. The one rights-adjacent surface — voice consent and source-text reproduction rights — is a rights/control matter handled by the red lines and the gated consent checks: the atom judges declared presence only, never legal sufficiency, grants no consent, clears no right, and states no legal requirement; consent and rights compliance remain the caller's responsibility, on their record. Named controls, exactly as SERVICE.md records them: (1) it produces **no audio and no advice of any kind** — no synthesis, no recording, no cloning, no recommendation about any voice, text or recipient; the skill's production steps (generation, assembly, playback, sending) are excluded from production by name in SERVICE.md's Honest scoping — this atom performs none of them; (2) it sets **no threshold** on any subject matter (see the declined list); (3) the narration's content is whatever the caller declares — the atom receives no source text and no script, takes no position on the content, and no output is addressed to any regulated decision — including where a caller narrates regulated-advice content of their own, the atom's verdict is on the production record only, never on that content; (4) the disclosure check judges a declared disclosure's presence where the declared audience includes others, never the disclosure's legal adequacy. SERVICE.md records why this is not the census class (no regulated adjacency to flag — voice consent is a rights/control matter, handled by red lines, not a regulated profession's judgment) and not the genuinely-open personal-financial-snapshot class (no personal position of any kind is handled). No deploy happens on this atom without the owner's explicit per-unit ruling in any case, as SERVICE.md records.

### For integrators (Users)

You need: a gateway key with the `voice_note_narration_audio` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed quantities are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, and the total-duration comparison is made on the same 6dp serialization, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/voice_note_narration_audio.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_voice_note_narration_audio.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/voice-note-narration-audio` (REST) and `POST /mcp/voice-note-narration-audio` (MCP, tool `voice_note_narration_audio`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification (deployment ee6a845a54d94e829dd0aad9f8cd9d41; RC soak to 2026-11-22). Key scope: `voice_note_narration_audio`. Rate limits: 60/minute, 10,000/day per key per atom (429, not metered — body unrecorded, see Errors). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live; a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Discrepancies

Docs follow the recorded response wherever SERVICE.md / contract.yaml / TEST-REPORT.md / USER-GUIDE.md disagree with it; every discrepancy found is named here, never papered over.

1. **Status — SERVICE.md and contract.yaml stale (and differently worded):** SERVICE.md says Tier B · status: **AUTHORED + STAGED — not deployed** — "no endpoint is live", and contract.yaml says status: **scaffolded**. The recorded battery (TEST-REPORT.md; evidence.json, gateway v1.1.0, deployment ee6a845a54d94e829dd0aad9f8cd9d41) shows the atom live. This document follows the evidenced live state: live.
2. **Check names differ from input field names:** the recorded check names differ from the leaf name of the input field they read — the attestation names carry the `voice_note_narration_` prefix (for example `voice_note_narration_kind_confirmed` reads `scoping.kind_confirmed`; `voice_note_narration_audio_file_delivered` reads `delivery.audio_file_delivered`), several carry suffixes the field names do not (for example `voice_note_narration_links_removed_for_listening` reads `adaptation.links_removed`; `voice_note_narration_tables_and_formatting_removed_for_listening` reads `adaptation.tables_and_formatting_removed`), the row-computed names carry an `every_voice_note_narration_` form (for example `every_voice_note_narration_segment_id_unique` reads the segment rows' `segment_id` values), the gated names carry a `_where_…` form naming their gate (for example `voice_note_narration_ai_voice_disclosure_made_where_audience_includes_others` reads `delivery.ai_voice_disclosure_made`, gated on `scoping.audience_scope`), and the five red-line checks are phrased as freedoms (for example `voice_note_narration_free_of_voice_cloned_or_imitated_without_consent` reads `red_lines.voice_cloned_or_imitated_without_consent_present`), while the consent red-line check (`voice_note_narration_record_declares_voice_consent`) reads a field that sits on the `voice` object, not on `red_lines`. The ten computed checks, the two gated checks and the consent check have no single same-named field at all. Recorded check names are used verbatim in the Checks section.
3. **Types unstated in SERVICE.md:** SERVICE.md states no type for the section container objects (`scoping`, `voice`, `rights`, `adaptation`, `chunking`, `audio_spec`, `assembly`, `delivery`, `red_lines`) or for a row object (`segments[]`). The types in the Input reference for those fields are grounded in the recorded evidence inputs and in the recorded MCP `inputSchema`, and are said so there. (The recorded MCP `inputSchema` itself types the eleven top-level properties — `production_title` as `string`, the nine containers as `object`, and `segments` correctly as `array` — so, unlike some fleet siblings, no list property is mis-typed as `object` in this atom's schema; the nested row and leaf types rest on the recorded evidence inputs and SERVICE.md's table, not on the schema.)
4. **Trimmed responses in USER-GUIDE.md and TEST-REPORT.md:** both present the full-pass response as trimmed, omitting the `checks` array and the `stamp` field (TEST-REPORT.md also presents its raw outputs as excerpts). The recorded REST response carries all 46 checks and a `stamp`; Worked examples below reproduce the full recorded response, and the Checks and Output format sections follow the full recording.
5. **Null rules unstated in SERVICE.md for the list and duration outputs:** SERVICE.md's output paragraph states the null rules for `computed_status`, `voice_note_segments_count` and the two ratios, but it does not state a null rule for the duplicate-id list, the three row-name lists, `voice_note_segment_duration_total` or `voice_note_total_duration_declared`. The recorded sparse response returns all of those as `null` when the underlying lists / fields are not declared (as the Output format section records); this document follows the recording.
6. **Section groupings merging and splitting input objects:** the recorded sections do not map one-to-one onto input objects. The `rights` and `chunking` objects are merged into other sections (`voice_consent_and_rights` and `segments_and_chunking` respectively, as SERVICE.md groups them); the single `segments` list is read by two recorded sections — `segments_and_chunking` (the row identity, label, positivity and sequence fields) and `audio_spec_and_assembly` (the rows' durations, for the total-duration recomputation); `voice.voice_consent_declared` sits on the `voice` object but is read by `red_lines`; and `scoping.audience_scope` sits in the scoping section but gates a check in `delivery_and_disclosure`. This document groups the Input reference and the Checks by the recorded section names, with those mergings and splittings named in place.
7. **The gated checks' evidence text does not vary with their state:** the evidence texts quoted in the Checks section are the full-pass run's texts. For both gated checks, the recorded sparse run carries the identical evidence strings — "no real-person voice declared used" and "audience declared self-only — no disclosure to another recipient is owed" — with status `missing` (their gate fields are absent) as the full-pass run carries with status `pass` (their gates are declared off and the target fields are absent from the manifest entirely). No distinct required-form evidence string for either check exists in the recordings; the Checks section says so at its head.
8. **Case-design prose diverging in corrections.json:** the pre-execution case design recorded in `corrections.json` diverged from the recorded executions and was corrected before execution (7 corrections, also listed as tester errors in TEST-REPORT.md): the designed violations `failing_checks` named prose labels (`Production kind recognised`, `Duration positive per segment`, `Total duration recomputes from segments`) instead of exact check names (R1 ×3); the full-pass and violations `expect` blocks carried no structured `computed_spot_checks` (R2 ×2); the designed violations input was missing the key paths present in the full-pass manifest (R3 ×1); and, beyond the validator rejections, one oracle-verification correction (unscored design prose): the sparse case was rebuilt at design time — the raw title-only sparse design (`{"production_title": "Minimal"}`) returned `VOICE_NOTE_NARRATION_NOT_SOUND` on the Python oracle (0 pass / 1 fail / 45 missing; the sole fail is `voice_note_narration_record_declares_voice_consent`), because the red-line voice-consent check fails when its field is absent by design, so the sparse input was rebuilt to declare consent and nothing else (`{"production_title": "Minimal", "voice": {"voice_consent_declared": true}}`), after which the oracle — and the live gateway — returned `INSUFFICIENT_EVIDENCE` (1 pass / 0 fail / 45 missing). The atom behaved per contract throughout; the title-only behaviour (absent consent fails) is the contract's documented design, not an atom defect. These are unscored design prose: the corrections were applied before execution, and where the corrected-away design prose differed, the recorded responses govern.

## Worked examples

Provenance: recorded 2026-11-16T15:25:46.269074+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/voice-note-narration-audio/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded response, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T15:25:46.269074+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/voice-note-narration-audio/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_kind_confirmed",
      "status": "pass",
      "evidence": "scoping: what the audio is \u2014 a short note or a full narration \u2014 was confirmed"
    },
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_production_kind_recognised",
      "status": "pass",
      "evidence": "scoping: the declared production kind is one of voice_note, narration \u2014 the two kinds the skill confirms"
    },
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_audience_noted",
      "status": "pass",
      "evidence": "scoping: the audience \u2014 just the caller, or someone else as well \u2014 was noted"
    },
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_audience_scope_recognised",
      "status": "pass",
      "evidence": "scoping: the declared audience scope is one of self_only, includes_others \u2014 the two audiences the skill notes"
    },
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_voice_confirmed_before_generation",
      "status": "pass",
      "evidence": "confirmation: the voice was confirmed before generating"
    },
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_register_confirmed_before_generation",
      "status": "pass",
      "evidence": "confirmation: the register \u2014 conversational for a note, steady and clear for narration \u2014 was confirmed before generating"
    },
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_target_length_confirmed_before_generation",
      "status": "pass",
      "evidence": "confirmation: the target length was confirmed before generating"
    },
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_confirmations_completed_before_generation",
      "status": "pass",
      "evidence": "confirmation: the kind, audience, voice, register and target-length confirmations were all completed before generation began"
    },
    {
      "section": "voice_consent_and_rights",
      "check": "voice_note_narration_voice_kind_recognised",
      "status": "pass",
      "evidence": "voice: the declared voice kind is one of original_synthetic, licensed_voice, real_person_voice \u2014 the record's voice vocabulary"
    },
    {
      "section": "voice_consent_and_rights",
      "check": "voice_note_narration_voice_selected_before_generation",
      "status": "pass",
      "evidence": "voice: the voice used was selected before generation began"
    },
    {
      "section": "voice_consent_and_rights",
      "check": "voice_note_narration_real_person_voice_consent_recorded_where_real_person_voice_used",
      "status": "pass",
      "evidence": "no real-person voice declared used"
    },
    {
      "section": "voice_consent_and_rights",
      "check": "voice_note_narration_source_text_reproduction_right_declared",
      "status": "pass",
      "evidence": "rights: the record declares the right to reproduce the source text as audio \u2014 the skill's narration-rights red line"
    },
    {
      "section": "voice_consent_and_rights",
      "check": "voice_note_narration_rights_basis_recorded",
      "status": "pass",
      "evidence": "rights: the basis for the declared reproduction right is recorded in the record"
    },
    {
      "section": "text_adaptation_for_listening",
      "check": "voice_note_narration_abbreviations_expanded",
      "status": "pass",
      "evidence": "adaptation: abbreviations in the source text were expanded for speech"
    },
    {
      "section": "text_adaptation_for_listening",
      "check": "voice_note_narration_long_sentences_broken",
      "status": "pass",
      "evidence": "adaptation: long sentences were broken up so the text sounds spoken, not printed"
    },
    {
      "section": "text_adaptation_for_listening",
      "check": "voice_note_narration_numbers_spelled_out",
      "status": "pass",
      "evidence": "adaptation: numbers were spelled out for speech"
    },
    {
      "section": "text_adaptation_for_listening",
      "check": "voice_note_narration_links_removed_for_listening",
      "status": "pass",
      "evidence": "adaptation: links, which do not survive aloud, were removed"
    },
    {
      "section": "text_adaptation_for_listening",
      "check": "voice_note_narration_tables_and_formatting_removed_for_listening",
      "status": "pass",
      "evidence": "adaptation: tables and formatting that do not survive aloud were removed"
    },
    {
      "section": "text_adaptation_for_listening",
      "check": "voice_note_narration_text_adapted_not_read_raw",
      "status": "pass",
      "evidence": "adaptation: the text was adapted for listening, not read raw from the page"
    },
    {
      "section": "text_adaptation_for_listening",
      "check": "voice_note_narration_adaptation_reviewed_for_meaning_preservation",
      "status": "pass",
      "evidence": "adaptation: the adapted text was reviewed to confirm the source text's meaning was not changed"
    },
    {
      "section": "segments_and_chunking",
      "check": "voice_note_narration_long_text_chunked_at_natural_breaks_where_long",
      "status": "pass",
      "evidence": "chunking: long text was chunked into sections at natural breaks"
    },
    {
      "section": "segments_and_chunking",
      "check": "voice_note_narration_narrated_chunk_by_chunk",
      "status": "pass",
      "evidence": "chunking: the audio was narrated chunk by chunk, so a failure never loses the whole piece"
    },
    {
      "section": "segments_and_chunking",
      "check": "voice_note_narration_segments_list_declared",
      "status": "pass",
      "evidence": "segments: the declared record names its segment rows \u2014 the list is present and names at least one segment; an absent list is missing evidence and an empty list declares no segmented production at all"
    },
    {
      "section": "segments_and_chunking",
      "check": "every_voice_note_narration_segment_id_unique",
      "status": "pass",
      "evidence": "segments: no declared segment_id is owned by more than one row"
    },
    {
      "section": "segments_and_chunking",
      "check": "every_voice_note_narration_segment_section_label_declared",
      "status": "pass",
      "evidence": "segments: every declared segment declares a non-empty section label naming the source section it narrates"
    },
    {
      "section": "segments_and_chunking",
      "check": "every_voice_note_narration_segment_duration_positive",
      "status": "pass",
      "evidence": "segments: every declared segment declares a positive duration in seconds \u2014 a segment with no duration declares no audio"
    },
    {
      "section": "segments_and_chunking",
      "check": "voice_note_narration_segment_sequence_complete",
      "status": "pass",
      "evidence": "segments: the declared sequence positions cover exactly 1..N, each once \u2014 no section is missing, repeated, or out of sequence"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_audio_file_format_recognised",
      "status": "pass",
      "evidence": "audio spec: the declared audio file format is one of mp3, wav, m4a, ogg, flac \u2014 the record's format vocabulary"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_audio_generated_through_voice_stack",
      "status": "pass",
      "evidence": "assembly: the audio was generated through the caller's voice stack"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_opening_spot_checked_for_clarity_and_pace",
      "status": "pass",
      "evidence": "assembly QC: the opening section was spot-checked for clarity and pace"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_middle_spot_checked_for_clarity_and_pace",
      "status": "pass",
      "evidence": "assembly QC: a middle section was spot-checked for clarity and pace"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_chunks_assembled_into_one_file",
      "status": "pass",
      "evidence": "assembly: the chunks were assembled into one audio file"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_assembled_order_verified",
      "status": "pass",
      "evidence": "assembly: the assembled order of the chunks was verified"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_assembly_completeness_verified",
      "status": "pass",
      "evidence": "assembly: the assembled file was confirmed complete \u2014 no section missing, repeated, or out of sequence"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_total_duration_recomputes_from_segments",
      "status": "pass",
      "evidence": "assembly: the declared total duration recomputes exactly as the sum of the declared segment durations"
    },
    {
      "section": "delivery_and_disclosure",
      "check": "voice_note_narration_audio_file_delivered",
      "status": "pass",
      "evidence": "delivery: the finished audio file was delivered"
    },
    {
      "section": "delivery_and_disclosure",
      "check": "voice_note_narration_total_duration_stated_in_delivery",
      "status": "pass",
      "evidence": "delivery: the delivery states the audio's total duration"
    },
    {
      "section": "delivery_and_disclosure",
      "check": "voice_note_narration_played_through_voice_stack_only_if_requested",
      "status": "pass",
      "evidence": "delivery: the audio was played through the voice stack instead of delivered as a file only if the caller asked for that"
    },
    {
      "section": "delivery_and_disclosure",
      "check": "voice_note_narration_recipient_matches_declared_audience",
      "status": "pass",
      "evidence": "delivery: the audio was delivered to the declared audience and no one else"
    },
    {
      "section": "delivery_and_disclosure",
      "check": "voice_note_narration_ai_voice_disclosure_made_where_audience_includes_others",
      "status": "pass",
      "evidence": "audience declared self-only \u2014 no disclosure to another recipient is owed"
    },
    {
      "section": "red_lines",
      "check": "voice_note_narration_record_declares_voice_consent",
      "status": "pass",
      "evidence": "red line (consent class): the record declares voice consent \u2014 a missing voice-consent declaration fails this check exactly as a declared absence of consent does, because a narration record must declare voice consent"
    },
    {
      "section": "red_lines",
      "check": "voice_note_narration_free_of_voice_cloned_or_imitated_without_consent",
      "status": "pass",
      "evidence": "red line: no imitation or cloning of a real person's voice without their clear consent is present in the record"
    },
    {
      "section": "red_lines",
      "check": "voice_note_narration_free_of_voice_note_sent_to_other_without_ai_disclosure",
      "status": "pass",
      "evidence": "red line: no voice note sent to someone else without the AI-voice disclosure is present in the record"
    },
    {
      "section": "red_lines",
      "check": "voice_note_narration_free_of_text_narrated_without_reproduction_right",
      "status": "pass",
      "evidence": "red line: no narration of text the caller does not have the right to reproduce as audio is present in the record"
    },
    {
      "section": "red_lines",
      "check": "voice_note_narration_free_of_generated_audio_presented_as_real_event_recording",
      "status": "pass",
      "evidence": "red line: no generated audio presented as a recording of a real event is present in the record"
    },
    {
      "section": "red_lines",
      "check": "voice_note_narration_free_of_source_meaning_changed_in_adaptation",
      "status": "pass",
      "evidence": "red line: no change to the meaning of the source text while adapting it for speech is present in the record"
    }
  ],
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
  "summary": "46 pass, 0 fail, 0 missing of 46 checks across seven sections.",
  "stamp": "VOICE NOTE NARRATION AUDIO\nproduction_title: Test Narration\nVERDICT: VOICE_NOTE_NARRATION_SOUND\n  production_scoping_and_confirmation          pass\n  voice_consent_and_rights                     pass\n  text_adaptation_for_listening                pass\n  segments_and_chunking                        pass\n  audio_spec_and_assembly                      pass\n  delivery_and_disclosure                      pass\n  red_lines                                    pass\n46 pass, 0 fail, 0 missing of 46 checks across seven sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T15:25:46.269074+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/voice-note-narration-audio/evidence.json`.

Input:

```json
{
  "production_title": "Test Narration",
  "scoping": {
    "kind_confirmed": true,
    "production_kind": "invalid_kind",
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
    "voice_consent_declared": false
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
      "duration_seconds": -5.0
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
    "total_duration_seconds_declared": 100.0
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

Response (HTTP 200):

```json
{
  "service": "voice-note-narration-audio",
  "atom_version": "0.1.0",
  "production_title": "Test Narration",
  "verdict": "VOICE_NOTE_NARRATION_NOT_SOUND",
  "sections": {
    "production_scoping_and_confirmation": "fail",
    "voice_consent_and_rights": "pass",
    "text_adaptation_for_listening": "pass",
    "segments_and_chunking": "fail",
    "audio_spec_and_assembly": "fail",
    "delivery_and_disclosure": "pass",
    "red_lines": "fail"
  },
  "checks": [
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_kind_confirmed",
      "status": "pass",
      "evidence": "scoping: what the audio is \u2014 a short note or a full narration \u2014 was confirmed"
    },
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_production_kind_recognised",
      "status": "fail",
      "evidence": "scoping: the declared production kind is one of voice_note, narration \u2014 the two kinds the skill confirms"
    },
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_audience_noted",
      "status": "pass",
      "evidence": "scoping: the audience \u2014 just the caller, or someone else as well \u2014 was noted"
    },
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_audience_scope_recognised",
      "status": "pass",
      "evidence": "scoping: the declared audience scope is one of self_only, includes_others \u2014 the two audiences the skill notes"
    },
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_voice_confirmed_before_generation",
      "status": "pass",
      "evidence": "confirmation: the voice was confirmed before generating"
    },
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_register_confirmed_before_generation",
      "status": "pass",
      "evidence": "confirmation: the register \u2014 conversational for a note, steady and clear for narration \u2014 was confirmed before generating"
    },
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_target_length_confirmed_before_generation",
      "status": "pass",
      "evidence": "confirmation: the target length was confirmed before generating"
    },
    {
      "section": "production_scoping_and_confirmation",
      "check": "voice_note_narration_confirmations_completed_before_generation",
      "status": "pass",
      "evidence": "confirmation: the kind, audience, voice, register and target-length confirmations were all completed before generation began"
    },
    {
      "section": "voice_consent_and_rights",
      "check": "voice_note_narration_voice_kind_recognised",
      "status": "pass",
      "evidence": "voice: the declared voice kind is one of original_synthetic, licensed_voice, real_person_voice \u2014 the record's voice vocabulary"
    },
    {
      "section": "voice_consent_and_rights",
      "check": "voice_note_narration_voice_selected_before_generation",
      "status": "pass",
      "evidence": "voice: the voice used was selected before generation began"
    },
    {
      "section": "voice_consent_and_rights",
      "check": "voice_note_narration_real_person_voice_consent_recorded_where_real_person_voice_used",
      "status": "pass",
      "evidence": "no real-person voice declared used"
    },
    {
      "section": "voice_consent_and_rights",
      "check": "voice_note_narration_source_text_reproduction_right_declared",
      "status": "pass",
      "evidence": "rights: the record declares the right to reproduce the source text as audio \u2014 the skill's narration-rights red line"
    },
    {
      "section": "voice_consent_and_rights",
      "check": "voice_note_narration_rights_basis_recorded",
      "status": "pass",
      "evidence": "rights: the basis for the declared reproduction right is recorded in the record"
    },
    {
      "section": "text_adaptation_for_listening",
      "check": "voice_note_narration_abbreviations_expanded",
      "status": "pass",
      "evidence": "adaptation: abbreviations in the source text were expanded for speech"
    },
    {
      "section": "text_adaptation_for_listening",
      "check": "voice_note_narration_long_sentences_broken",
      "status": "pass",
      "evidence": "adaptation: long sentences were broken up so the text sounds spoken, not printed"
    },
    {
      "section": "text_adaptation_for_listening",
      "check": "voice_note_narration_numbers_spelled_out",
      "status": "pass",
      "evidence": "adaptation: numbers were spelled out for speech"
    },
    {
      "section": "text_adaptation_for_listening",
      "check": "voice_note_narration_links_removed_for_listening",
      "status": "pass",
      "evidence": "adaptation: links, which do not survive aloud, were removed"
    },
    {
      "section": "text_adaptation_for_listening",
      "check": "voice_note_narration_tables_and_formatting_removed_for_listening",
      "status": "pass",
      "evidence": "adaptation: tables and formatting that do not survive aloud were removed"
    },
    {
      "section": "text_adaptation_for_listening",
      "check": "voice_note_narration_text_adapted_not_read_raw",
      "status": "pass",
      "evidence": "adaptation: the text was adapted for listening, not read raw from the page"
    },
    {
      "section": "text_adaptation_for_listening",
      "check": "voice_note_narration_adaptation_reviewed_for_meaning_preservation",
      "status": "pass",
      "evidence": "adaptation: the adapted text was reviewed to confirm the source text's meaning was not changed"
    },
    {
      "section": "segments_and_chunking",
      "check": "voice_note_narration_long_text_chunked_at_natural_breaks_where_long",
      "status": "pass",
      "evidence": "chunking: long text was chunked into sections at natural breaks"
    },
    {
      "section": "segments_and_chunking",
      "check": "voice_note_narration_narrated_chunk_by_chunk",
      "status": "pass",
      "evidence": "chunking: the audio was narrated chunk by chunk, so a failure never loses the whole piece"
    },
    {
      "section": "segments_and_chunking",
      "check": "voice_note_narration_segments_list_declared",
      "status": "pass",
      "evidence": "segments: the declared record names its segment rows \u2014 the list is present and names at least one segment; an absent list is missing evidence and an empty list declares no segmented production at all"
    },
    {
      "section": "segments_and_chunking",
      "check": "every_voice_note_narration_segment_id_unique",
      "status": "pass",
      "evidence": "segments: no declared segment_id is owned by more than one row"
    },
    {
      "section": "segments_and_chunking",
      "check": "every_voice_note_narration_segment_section_label_declared",
      "status": "pass",
      "evidence": "segments: every declared segment declares a non-empty section label naming the source section it narrates"
    },
    {
      "section": "segments_and_chunking",
      "check": "every_voice_note_narration_segment_duration_positive",
      "status": "fail",
      "evidence": "segments: every declared segment declares a positive duration in seconds \u2014 a segment with no duration declares no audio"
    },
    {
      "section": "segments_and_chunking",
      "check": "voice_note_narration_segment_sequence_complete",
      "status": "pass",
      "evidence": "segments: the declared sequence positions cover exactly 1..N, each once \u2014 no section is missing, repeated, or out of sequence"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_audio_file_format_recognised",
      "status": "pass",
      "evidence": "audio spec: the declared audio file format is one of mp3, wav, m4a, ogg, flac \u2014 the record's format vocabulary"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_audio_generated_through_voice_stack",
      "status": "pass",
      "evidence": "assembly: the audio was generated through the caller's voice stack"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_opening_spot_checked_for_clarity_and_pace",
      "status": "pass",
      "evidence": "assembly QC: the opening section was spot-checked for clarity and pace"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_middle_spot_checked_for_clarity_and_pace",
      "status": "pass",
      "evidence": "assembly QC: a middle section was spot-checked for clarity and pace"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_chunks_assembled_into_one_file",
      "status": "pass",
      "evidence": "assembly: the chunks were assembled into one audio file"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_assembled_order_verified",
      "status": "pass",
      "evidence": "assembly: the assembled order of the chunks was verified"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_assembly_completeness_verified",
      "status": "pass",
      "evidence": "assembly: the assembled file was confirmed complete \u2014 no section missing, repeated, or out of sequence"
    },
    {
      "section": "audio_spec_and_assembly",
      "check": "voice_note_narration_total_duration_recomputes_from_segments",
      "status": "fail",
      "evidence": "assembly: the declared total duration recomputes exactly as the sum of the declared segment durations"
    },
    {
      "section": "delivery_and_disclosure",
      "check": "voice_note_narration_audio_file_delivered",
      "status": "pass",
      "evidence": "delivery: the finished audio file was delivered"
    },
    {
      "section": "delivery_and_disclosure",
      "check": "voice_note_narration_total_duration_stated_in_delivery",
      "status": "pass",
      "evidence": "delivery: the delivery states the audio's total duration"
    },
    {
      "section": "delivery_and_disclosure",
      "check": "voice_note_narration_played_through_voice_stack_only_if_requested",
      "status": "pass",
      "evidence": "delivery: the audio was played through the voice stack instead of delivered as a file only if the caller asked for that"
    },
    {
      "section": "delivery_and_disclosure",
      "check": "voice_note_narration_recipient_matches_declared_audience",
      "status": "pass",
      "evidence": "delivery: the audio was delivered to the declared audience and no one else"
    },
    {
      "section": "delivery_and_disclosure",
      "check": "voice_note_narration_ai_voice_disclosure_made_where_audience_includes_others",
      "status": "pass",
      "evidence": "audience declared self-only \u2014 no disclosure to another recipient is owed"
    },
    {
      "section": "red_lines",
      "check": "voice_note_narration_record_declares_voice_consent",
      "status": "fail",
      "evidence": "red line (consent class): the record declares voice consent \u2014 a missing voice-consent declaration fails this check exactly as a declared absence of consent does, because a narration record must declare voice consent"
    },
    {
      "section": "red_lines",
      "check": "voice_note_narration_free_of_voice_cloned_or_imitated_without_consent",
      "status": "pass",
      "evidence": "red line: no imitation or cloning of a real person's voice without their clear consent is present in the record"
    },
    {
      "section": "red_lines",
      "check": "voice_note_narration_free_of_voice_note_sent_to_other_without_ai_disclosure",
      "status": "pass",
      "evidence": "red line: no voice note sent to someone else without the AI-voice disclosure is present in the record"
    },
    {
      "section": "red_lines",
      "check": "voice_note_narration_free_of_text_narrated_without_reproduction_right",
      "status": "pass",
      "evidence": "red line: no narration of text the caller does not have the right to reproduce as audio is present in the record"
    },
    {
      "section": "red_lines",
      "check": "voice_note_narration_free_of_generated_audio_presented_as_real_event_recording",
      "status": "pass",
      "evidence": "red line: no generated audio presented as a recording of a real event is present in the record"
    },
    {
      "section": "red_lines",
      "check": "voice_note_narration_free_of_source_meaning_changed_in_adaptation",
      "status": "pass",
      "evidence": "red line: no change to the meaning of the source text while adapting it for speech is present in the record"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "voice_note_segments_count": 1,
  "duplicate_voice_note_segment_ids": [],
  "voice_note_segments_without_section_label": [],
  "voice_note_segments_with_non_positive_duration": [
    "s1"
  ],
  "voice_note_segments_with_invalid_sequence_position": [],
  "voice_note_segment_duration_total": "-5.000000",
  "voice_note_total_duration_declared": "100.000000",
  "segment_sequence_coverage_ratio": "1.000000",
  "segment_section_label_ratio": "1.000000",
  "summary": "42 pass, 4 fail, 0 missing of 46 checks across seven sections.",
  "stamp": "VOICE NOTE NARRATION AUDIO\nproduction_title: Test Narration\nVERDICT: VOICE_NOTE_NARRATION_NOT_SOUND\n  production_scoping_and_confirmation          fail\n  voice_consent_and_rights                     pass\n  text_adaptation_for_listening                pass\n  segments_and_chunking                        fail\n  audio_spec_and_assembly                      fail\n  delivery_and_disclosure                      pass\n  red_lines                                    fail\n42 pass, 4 fail, 0 missing of 46 checks across seven sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T15:25:46.269074+00:00 · gateway v1.1.0 · external verification battery Wave 17 · source `verification/work/voice-note-narration-audio/evidence.json`.

Input:

```json
{
  "scoping": "this should be an object, not a string"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "scoping",
  "detail": "scoping must be an object"
}
```
