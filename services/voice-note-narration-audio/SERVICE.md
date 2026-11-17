# Voice note narration audio — `voice-note-narration-audio`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): produce spoken audio as short voice notes or as narration of text and documents you want to listen to.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result. In this atom's deterministic form, the caller submits a **declared voice-note / narration production record** and receives the production audit verdict as the deliverable: the atom synthesizes no audio, records nothing, and clones no voice (see Honest scoping).

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Everyday life who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Audio versions of briefings and articles**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the voice-note / narration production manifest

The caller submits one JSON manifest: a declared voice-note or
narration production record for one production, made from the
production as actually carried out. Every field below is read
by the named section's checks. A field **absent** = evidence
missing (`INSUFFICIENT_EVIDENCE`); a field present but false /
invalid = the check fails (`VOICE_NOTE_NARRATION_NOT_SOUND`) —
with one named exception: the voice-consent declaration is a
red-line class declaration, and its absence **fails** (see
red_lines below). All fields are booleans unless noted.

| Field | Read by |
|---|---|
| `production_title` (string; carried into the verdict output, not itself checked) | — |
| `scoping.kind_confirmed` (boolean) | production_scoping_and_confirmation |
| `scoping.production_kind` (string; one of `voice_note`, `narration`) | production_scoping_and_confirmation |
| `scoping.audience_noted` (boolean) | production_scoping_and_confirmation |
| `scoping.audience_scope` (string; one of `self_only`, `includes_others`; gates the disclosure check below) | production_scoping_and_confirmation |
| `scoping.voice_confirmed_before_generation` (boolean) | production_scoping_and_confirmation |
| `scoping.register_confirmed_before_generation` (boolean) | production_scoping_and_confirmation |
| `scoping.target_length_confirmed_before_generation` (boolean) | production_scoping_and_confirmation |
| `scoping.confirmations_completed_before_generation` (boolean) | production_scoping_and_confirmation |
| `voice.voice_kind` (string; one of `original_synthetic`, `licensed_voice`, `real_person_voice`) | voice_consent_and_rights |
| `voice.voice_selected_before_generation` (boolean) | voice_consent_and_rights |
| `voice.uses_real_person_voice` (boolean; gates the real-person consent check below) | voice_consent_and_rights |
| `voice.real_person_voice_consent_recorded` (boolean; required when a real-person voice is declared used; otherwise the check passes as not applicable) | voice_consent_and_rights |
| `voice.voice_consent_declared` (boolean; **red-line class — absent fails, exactly as `false` fails**) | red_lines |
| `rights.source_text_reproduction_right_declared` (boolean) | voice_consent_and_rights |
| `rights.rights_basis_recorded` (boolean) | voice_consent_and_rights |
| `adaptation.abbreviations_expanded` (boolean) | text_adaptation_for_listening |
| `adaptation.long_sentences_broken` (boolean) | text_adaptation_for_listening |
| `adaptation.numbers_spelled_out` (boolean) | text_adaptation_for_listening |
| `adaptation.links_removed` (boolean) | text_adaptation_for_listening |
| `adaptation.tables_and_formatting_removed` (boolean) | text_adaptation_for_listening |
| `adaptation.text_adapted_not_read_raw` (boolean) | text_adaptation_for_listening |
| `adaptation.adaptation_reviewed_for_meaning_preservation` (boolean) | text_adaptation_for_listening |
| `chunking.long_text_chunked_at_natural_breaks_where_long` (boolean) | segments_and_chunking |
| `chunking.narrated_chunk_by_chunk` (boolean) | segments_and_chunking |
| `segments` (list of segment-row objects, each with the entry fields below; computed, see below) | segments_and_chunking, audio_spec_and_assembly |
| `segments[].segment_id` (string; must be unique per row) | segments_and_chunking |
| `segments[].section_label` (non-empty string) | segments_and_chunking |
| `segments[].sequence_position` (number; computed — the positions must cover exactly 1..N, see below) | segments_and_chunking |
| `segments[].duration_seconds` (number; must be positive; computed — the durations must sum to the declared total, see below) | segments_and_chunking, audio_spec_and_assembly |
| `audio_spec.file_format` (string; one of `mp3`, `wav`, `m4a`, `ogg`, `flac`) | audio_spec_and_assembly |
| `assembly.audio_generated_through_voice_stack` (boolean) | audio_spec_and_assembly |
| `assembly.opening_spot_checked_for_clarity_and_pace` (boolean) | audio_spec_and_assembly |
| `assembly.middle_spot_checked_for_clarity_and_pace` (boolean) | audio_spec_and_assembly |
| `assembly.chunks_assembled_into_one_file` (boolean) | audio_spec_and_assembly |
| `assembly.assembled_order_verified` (boolean) | audio_spec_and_assembly |
| `assembly.assembly_completeness_verified` (boolean) | audio_spec_and_assembly |
| `assembly.total_duration_seconds_declared` (number; computed — must recompute from the declared segment durations, see below) | audio_spec_and_assembly |
| `delivery.audio_file_delivered` (boolean) | delivery_and_disclosure |
| `delivery.total_duration_stated_in_delivery` (boolean) | delivery_and_disclosure |
| `delivery.played_through_voice_stack_only_if_requested` (boolean) | delivery_and_disclosure |
| `delivery.recipient_matches_declared_audience` (boolean) | delivery_and_disclosure |
| `delivery.ai_voice_disclosure_made` (boolean; required when the declared audience scope is `includes_others`; otherwise the check passes as not applicable) | delivery_and_disclosure |
| `red_lines.voice_cloned_or_imitated_without_consent_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.voice_note_sent_to_other_without_ai_disclosure_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.text_narrated_without_reproduction_right_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.generated_audio_presented_as_real_event_recording_present` (boolean; must be `false` to pass — skill red line) | red_lines |
| `red_lines.source_meaning_changed_in_adaptation_present` (boolean; must be `false` to pass — skill red line) | red_lines |

Ten checks are computed from the declared declarations and
rows, using only the skill's own stated rules plus the
consistency of the declared record itself — no outside
threshold is imported:

- **Production kind recognised:** the declared
  `scoping.production_kind` is one of `voice_note`,
  `narration` — the two kinds the skill confirms ("a short
  note or a full narration"). Any other value fails. Absent
  is missing evidence.
- **Audience scope recognised:** the declared
  `scoping.audience_scope` is one of `self_only`,
  `includes_others` — the two audiences the skill notes
  ("just you, or someone else as well"). Any other value
  fails.
- **Voice kind recognised:** the declared `voice.voice_kind`
  is one of `original_synthetic`, `licensed_voice`,
  `real_person_voice` — the record's own voice vocabulary.
  Any other value fails.
- **Segments declared:** the declared `segments` list passes
  when it is present and names at least one segment. An
  absent list is missing evidence; an empty list fails — it
  declares no segmented production at all.
- **Segment ids unique:** no declared `segment_id` may appear
  on more than one row. A row with `segment_id` absent is
  missing evidence for this check.
- **Section label per segment:** every declared segment row
  declares a non-empty `section_label` naming the source
  section it narrates. A row with the field absent is missing
  evidence; a row declaring an empty label fails and is named
  in `voice_note_segments_without_section_label`.
- **Duration positive per segment:** every declared segment
  row declares a positive `duration_seconds`. A row with the
  field absent is missing evidence; a row declaring zero or a
  negative duration fails — a segment with no duration
  declares no audio — and is named in
  `voice_note_segments_with_non_positive_duration`.
- **Segment sequence complete:** the declared
  `sequence_position` values cover exactly 1..N (N = the
  declared segment count), each once — the skill's assembly
  demand that no section is missing, repeated, or out of
  sequence, checked over the declared rows themselves. A row
  with the field absent is missing evidence; a row whose
  position is fractional, out of range, or a repeat of an
  earlier row's position fails and is named in
  `voice_note_segments_with_invalid_sequence_position`. (The
  rows' physical order in the list is not itself checked —
  reordering the rows while keeping positions 1..N passes,
  exactly as a declared ranking's order is not checked in the
  model atoms.)
- **Audio file format recognised:** the declared
  `audio_spec.file_format` is one of `mp3`, `wav`, `m4a`,
  `ogg`, `flac` — the record's format vocabulary. Any other
  value fails.
- **Total duration recomputes from segments:** the declared
  `assembly.total_duration_seconds_declared` recomputes as
  the sum of the declared segment durations, compared on the
  fixed 6dp serialization below. The total field absent, the
  segments list absent, or a segment row without a duration
  is missing evidence; a mismatch fails.

Two further checks are gated on the record's own declared
gate fields, following the skill's own conditional scope —
when the gate is declared off, the check passes as not
applicable; when the gate field is absent, the check is
missing evidence; when the gate is on, the target declaration
is required:

- **Real-person voice consent:** the person's clear consent
  recorded is required only where
  `voice.uses_real_person_voice` is declared `true` (the
  skill red line: never imitate or clone a real person's
  voice without their clear consent).
- **AI-voice disclosure:** disclosure made is required only
  where `scoping.audience_scope` is declared `includes_others`
  (the skill: add an AI-voice disclosure when a note goes to
  someone else; state plainly, in the message carrying it,
  that the voice is AI-generated). Where the scope field is
  absent the check is missing evidence; where the scope is
  declared but is an unrecognised value, the scope check
  above already fails and this check passes as not
  applicable on the declared record.

One check is a **red-line class** check and departs from the
absent = missing convention by design:
**`voice_note_narration_record_declares_voice_consent`** reads
`voice.voice_consent_declared` and **fails when the field is
absent exactly as it fails when it is declared `false`** — a
narration record must declare voice consent, mirroring the
skill's discipline that voice use without consent is a red
line, not an omission. It passes only on a declared `true`.
Consequence, stated plainly: an empty manifest fails this one
check (and is otherwise all-missing), so its verdict is
`VOICE_NOTE_NARRATION_NOT_SOUND`, not
`INSUFFICIENT_EVIDENCE`.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any
of the ten primary computed checks above cannot be
completed), `voice_note_segments_count` (the declared list
length, or null when the list is not declared — counts are
reported as integers, exactly), the duplicate-id list
`duplicate_voice_note_segment_ids`, the row-name lists named
in the computed checks above,
`voice_note_segment_duration_total` (the sum of the declared
segment durations) and `voice_note_total_duration_declared`
(the declared total as declared), both on the fixed
serialization below, and the ratios
`segment_sequence_coverage_ratio` (segments with a valid,
distinct, in-range sequence position ÷ declared segments)
and `segment_section_label_ratio` (segments with a non-empty
section label ÷ declared segments). **Fixed serialization
rule:** computed quantities and ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly
six decimals. A ratio is null when its denominator list is
absent or empty. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical.

The skill states no numeric threshold at all — its demands
are confirmation before generation, spoken-text adaptation,
chunking, spot-checks, verified assembly, delivery with the
duration stated, and disclosure, not bars the atom can set.
Quantities are computed and reported; the only bars on the
computed rows are exact recomputation and completeness over
the caller's own declared rows, exactly as stated above.
Declined thresholds, named: a target length in minutes or
words, or a tolerance around the caller's confirmed target
(length is checked as confirmed, never measured); a narration
pace in words per minute; a loudness, sample-rate, bitrate or
any other audio-quality bar for the generated audio (the
audio-spec check is the declared format vocabulary only); a
minimum or maximum number of segments beyond at least one;
a segment-duration minimum beyond positivity, or a total
duration ceiling; a spot-check coverage bar beyond the
opening and a middle section the skill names; a
reading-level, sentence-length or adaptation-quality bar for
"prepared for speech" (checked as declarations only); a
voice-quality, naturalness or similarity bar for the voice
used; any judgment that the narration is good, clear or worth
sending (only that its declared production record contains
what the skill requires).

The verdict is one of `VOICE_NOTE_NARRATION_SOUND` (all 46
checks pass), `VOICE_NOTE_NARRATION_NOT_SOUND` (any check
fails), or `INSUFFICIENT_EVIDENCE` (nothing fails but
evidence is missing), across seven sections:
production_scoping_and_confirmation (8 checks),
voice_consent_and_rights (5), text_adaptation_for_listening
(7), segments_and_chunking (7), audio_spec_and_assembly (8),
delivery_and_disclosure (5), red_lines (6).

## Distinct ground

The nearest sibling is `sourced-podcast-episode-production`
(a declared podcast episode production record — an episode
scoped before writing, sources collected before writing,
every declared quote/statistic claim traced to a declared
source and marked in the script, show notes whose declared
source list is exactly the declared sources, and publishing
kept inside its exact authorized scope). This atom is **not**
that: it audits one voice note's or one narration's production
record — note-vs-narration kind and audience scope confirmed
before generation, voice consent and source-text reproduction
rights for the narration, spoken-text adaptation
(abbreviations expanded, numbers spelled out, links, tables
and formatting removed), declared segment rows whose sequence
positions cover 1..N exactly and whose declared durations sum
to the declared total duration, opening and middle
spot-checks, delivery with the total duration stated, and the
AI-voice disclosure owed when the audience includes others.
Claim-to-source traceability, episode outlining, show notes
and episode publishing authorization — the podcast atom's
ground — appear nowhere here; segment sequence/duration
recomputation and voice consent — this atom's ground — appear
nowhere there. A second neighbour is
`local-voice-stack-engineering-pack` (the engineering of a
local TTS/STT voice stack itself — engine selection, latency
and accessibility of the stack): the stack is a declared
means here, never the subject. This atom shares **zero
checks** with any sibling (verified mechanically by
enumerating `evaluate({})` check names from every atom oracle
in `services/*/src/*.py` and comparing, with a grep of check
strings over the same files as the fallback for oracles whose
`evaluate({})` raises or returns a different shape — zero
overlap by both methods). The boundary is: one voice note's
or one narration's production record here; one sourced
podcast episode's production record, and a voice stack's
engineering, there.

## Honest scoping

This atom reviews a **declared** voice-note / narration
production record — it synthesizes no audio, records nothing,
clones no voice, adapts no text, assembles no file, plays
nothing, sends nothing and publishes nothing. A production is
sound *on the caller's declared evidence*: a record that
declares its voice consented, its text adapted, its segments
sequenced and its disclosure made passes those checks even if
the real production did none of it. It is a completeness and
consistency audit of the production record the skill
requires, **not a production service, a listening check, or a
guarantee that the audio is clear or lawful**: it never hears
the audio, never judges whether a declared consent is legally
sufficient, whether the adaptation really preserves meaning,
or whether the narration sounds right — only that the record
contains what the skill's method, quality gates and red lines
demand, and that its declared rows are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never performed or judged): audio
synthesis / text-to-speech generation itself; voice recording
itself; voice cloning or imitation itself — cloning without
declared consent is refused as a red line on the record, and
no cloning capability exists in this atom; audio assembly and
editing itself; playback through the voice stack; sending,
delivering or publishing the audio itself; extracting or
reading the source document's text (the related
`document-reader` step); designing or engineering the voice
stack (the related `voice-and-speech-engineering` work); and
in-reader read-aloud (the related `read-aloud` engine) — each
is EXCLUDED by name from this atom, which audits only the
declared record of those steps. Boundary cases, named: a
production genuinely delivered as one unchunked take still
fits this record format (one segment row, position 1); the
voice-consent declaration is required of every record in this
format, including a purely synthetic voice — the declaration
is the record's statement that the voice used is consented /
rights-clean, and its absence fails by design (see above);
consent and reproduction rights are declared presence only,
never a legal judgment of sufficiency.

## U-13 regulatory screen

Screen classification: **(a) — No outright.** Keyword screen:
the bound skill and this record name voice notes, narration,
voice consent, reproduction rights and AI-voice disclosure —
no engineering-practice, securities/financial-advice or
psychology-adjacent subject, and no regulated profession's
vocabulary. Substance screen: this atom's output could not
read as regulated professional advice — it audits a
caller-**declared** voice-note / narration production record
for completeness and internal consistency only (scoping and
confirmation declarations, voice-consent and rights
declarations, adaptation declarations, segment sequence and
duration recomputation over the declared rows, audio-spec and
assembly declarations, delivery and disclosure declarations,
and the red lines refused); every output is a pass / fail /
missing verdict on the record or a quantity recomputed from
the caller's own declared rows. The one rights-adjacent
surface — voice consent and source-text reproduction rights —
is a rights/control matter handled by the red lines and the
gated consent checks: the atom judges declared presence only,
never legal sufficiency, grants no consent, clears no right,
and states no legal requirement; consent and rights
compliance remain the caller's responsibility, on their
record. Named controls: (1) it produces **no audio and no
advice of any kind** — no synthesis, no recording, no
cloning, no recommendation about any voice, text or
recipient; the skill's production steps (generation,
assembly, playback, sending) are excluded from production by
name above — this atom performs none of them; (2) it sets
**no threshold** on any subject matter (see the declined
list); (3) the narration's content is whatever the caller
declares — the atom receives no source text and no script,
takes no position on the content, and no output is addressed
to any regulated decision — including where a caller narrates
regulated-advice content of their own, the atom's verdict is
on the production record only, never on that content; (4)
the disclosure check judges a declared disclosure's presence
where the declared audience includes others, never the
disclosure's legal adequacy. This is not the census class
(no regulated adjacency to flag — voice consent is a
rights/control matter, handled by red lines, not a regulated
profession's judgment) and not the genuinely-open
personal-financial-snapshot class (no personal position of
any kind is handled). No deploy happens on this atom without
the owner's explicit per-unit ruling in any case.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **AUTHORED + STAGED — not deployed** —
deterministic core, Python oracle and TypeScript port built
and parity-proven locally; no endpoint is live. Release
happens one by one, by the owner's GO, per the approved queue.
