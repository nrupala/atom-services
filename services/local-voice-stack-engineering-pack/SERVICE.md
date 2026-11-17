# Local voice stack engineering pack — `local-voice-stack-engineering-pack`

**Deliverable type:** DELIVERABLE. This atom sells the deliverable it produces — a bounded judgment artifact — never the underlying knowledge itself.

## What it delivers

Bound capability (from the skill): Build local voice & speech stacks — TTS/STT selection, cloning consent, latency, audio quality, accessibility.

A caller submits the inputs the bound skill works on and receives one deliverable back, in the contract's output shape (see `contract.yaml`). One unit of sale = one delivered result.

## Buyer

First buyer hypothesis (from register data; not yet market-tested): teams and agents working in Engineering & code who need this deliverable on demand and would rather buy it per use than build or staff the capability themselves.

## Self-use (R3 — passed)

Our own workflow that calls it: **Reader and assistant voice features**. Wright is an internal caller on this atom (zero price, metered to the internal cost ledger — see `rails/billing.md`).

## Inputs — the local-voice-stack manifest

The caller submits one JSON manifest: a declared local
voice-stack engineering record for one stack. Every field below
is read by the named section's checks. A field **absent** =
evidence missing (`INSUFFICIENT_EVIDENCE`); a field present but
false / invalid = the check fails
(`LOCAL_VOICE_STACK_NOT_SOUND`). All fields are booleans unless
noted.

| Field | Read by |
|---|---|
| `stack` (string; carried into the verdict output, not itself checked) | — |
| `pipeline.tts_stt_or_both_scope_declared` (boolean) | pipeline_and_engine_selection |
| `pipeline.streaming_vs_file_output_declared` (boolean) | pipeline_and_engine_selection |
| `pipeline.local_first_by_default` (boolean) | pipeline_and_engine_selection |
| `engine_selection.quality_latency_footprint_evaluated` (boolean) | pipeline_and_engine_selection |
| `engine_selection.language_coverage_addressed` (boolean) | pipeline_and_engine_selection |
| `engines` (list of engine-row objects, each with the entry fields below; computed, see below) | pipeline_and_engine_selection, cloning_consent_and_ethics |
| `engines[].name` (string; names the row in the computed outputs) | pipeline_and_engine_selection, cloning_consent_and_ethics |
| `engines[].license_cleared_for_commercial_use` (boolean) | pipeline_and_engine_selection |
| `engines[].evaluated_on_own_golden_sentences` (boolean) | pipeline_and_engine_selection |
| `engines[].is_voice_cloning` (boolean; gates the consent check below) | cloning_consent_and_ethics |
| `engines[].cloning_consent_recorded` (boolean; required when the row is a voice-cloning engine; otherwise the check passes as not applicable to that row) | cloning_consent_and_ethics |
| `cloning.impersonation_present` (boolean; must be `false` to pass — skill red line) | cloning_consent_and_ethics |
| `cloning.covert_recording_present` (boolean; must be `false` to pass — skill red line) | cloning_consent_and_ethics |
| `cloning.synthetic_audio_disclosure_where_required` (boolean) | cloning_consent_and_ethics |
| `cloning.voice_profiles_encrypted_at_rest` (boolean) | cloning_consent_and_ethics |
| `cloning.deletion_honored` (boolean) | cloning_consent_and_ethics |
| `audio_engineering.sample_rate_and_format_choices_declared` (boolean) | audio_engineering_and_latency |
| `audio_engineering.loudness_normalization_applied` (boolean) | audio_engineering_and_latency |
| `audio_engineering.chunking_for_long_text_with_pauses` (boolean) | audio_engineering_and_latency |
| `audio_engineering.caching_synthesized_segments_for_repeat_text` (boolean) | audio_engineering_and_latency |
| `latency.time_to_first_audio_budget_stated` (boolean) | audio_engineering_and_latency |
| `latency.latency_measured_against_stated_budget` (boolean) | audio_engineering_and_latency |
| `latency.chunked_synthesis` (boolean) | audio_engineering_and_latency |
| `latency.assistant_interactive_use_present` (boolean; gates the barge-in check below) | audio_engineering_and_latency |
| `latency.interruption_barge_in_handling` (boolean; required when assistant interactive use is declared present; otherwise the check passes as not applicable) | audio_engineering_and_latency |
| `accessibility.speed_controls_present` (boolean) | accessibility |
| `accessibility.pitch_controls_present` (boolean) | accessibility |
| `accessibility.captions_or_transcripts_wired` (boolean) | accessibility |
| `accessibility.keyboard_operable_players` (boolean) | accessibility |
| `testing.golden_audio_regressions_in_test_loop` (boolean) | testing_and_quality_gates |
| `testing.golden_hash_and_human_spot_checks` (boolean) | testing_and_quality_gates |
| `testing.noisy_input_stt_tests` (boolean) | testing_and_quality_gates |
| `testing.pronunciation_dictionaries_for_names_numbers_code` (boolean) | testing_and_quality_gates |

Several checks are computed from the declared rows, using only
the skill's own stated rules plus the consistency of the declared
record itself — no outside threshold is imported:

- **Engines declared:** the declared `engines` list passes only
  when it is present and non-empty; an absent list is missing
  evidence, an empty list fails.
- **License per engine:** every declared engine row must declare
  `license_cleared_for_commercial_use: true` (the skill: "license
  cleared for the intended use (commercial!)"; quality gate:
  "licenses cleared"). A row with the field absent is missing
  evidence.
- **Golden-sentence evaluation per engine:** every declared
  engine row must declare
  `evaluated_on_own_golden_sentences: true` (the skill:
  "evaluate on YOUR golden sentences — not vendor demos").
- **Consent per cloning engine:** every row with
  `is_voice_cloning: true` must declare
  `cloning_consent_recorded: true` (the skill's method and red
  line: "explicit, recorded consent for any real-person voice";
  "Never clone without consent"). A row with `is_voice_cloning`
  absent, or a cloning row with the consent field absent, is
  missing evidence; stacks with no cloning rows pass as not
  applicable.

One check is conditional, following the skill's own scoping —
computed from the declared gate field:

- **Interruption / barge-in:** the skill requires
  interruption/barge-in handling "for assistants".
  `interruption_barge_in_handling` is therefore required only
  when `latency.assistant_interactive_use_present` is declared
  `true`; when no assistant interactive use is declared, the
  check passes as not applicable.

The output also reports the computed `computed_status`
(`within_stated_limits_on_declared_evidence` /
`outside_stated_limits_on_declared_evidence` / null when any of
the four primary computed checks above cannot be completed),
`engines_count` (the declared list length, or null when the list
is not declared — counts are reported as integers, exactly), the
row-name lists `engines_without_license_clearance` (engines whose
field is present but not true; an engine with the field absent
is missing evidence and does not appear),
`engines_without_golden_sentence_evaluation` (engines whose field
is present but not true) and
`cloning_engines_without_consent_recorded` (cloning engines whose
field is present but not true), and the two coverage ratios
`license_coverage` (engines with license cleared ÷ declared
engines) and `golden_evaluation_coverage` (engines evaluated on
own golden sentences ÷ declared engines).
**Fixed serialization rule:** computed ratios are reported as
strings with exactly six decimal places, produced in both
implementations by the same rule — round half up to 6dp,
`floor(v * 1000000 + 0.5) / 1000000`, then format with exactly six
decimals; comparisons use the unrounded values. A ratio is null
when its denominator list is absent or empty. That fixed
serialization is what makes the Python and TypeScript outputs
byte-identical.

The skill states no numeric pass/fail threshold — its latency,
quality and footprint quantities are engineering content the
record attests to addressing, not bars the atom can set.
Quantities are computed and reported; the only bar on the
computed rows is completeness over the caller's own declared
rows, exactly as stated above. Declined thresholds, named: a
time-to-first-audio or overall latency budget in milliseconds
(the skill requires a stated budget and measurement against it
but states no number — caller attestation only); a word-error
rate (WER) or character-error rate for STT, including a
noisy-input WER or signal-to-noise degradation bar (the skill
requires noisy-input STT tests but states no rate); an audio
quality score (MOS or similar) or a golden-sample hash-match
percentage (the skill requires hash + human spot-checks but
states no score); a sample rate in kHz, a bit depth, or an
opus/wav bitrate (the skill names wav/opus as format choices but
states no rate); a loudness target in LUFS or dB (the skill
requires loudness normalization but states no target); a CPU/GPU
footprint, memory, model-size or real-time-factor limit (the
skill requires quality vs latency vs footprint evaluation but
states no limit); a number of languages or a language-coverage
percentage (the skill requires language coverage to be addressed
but states no count); a pronunciation accuracy rate (the skill
requires pronunciation dictionaries but states no rate); a
speed or pitch control range (the skill requires the controls
present but states no range); a coverage percentage below
completeness.

The verdict is one of `LOCAL_VOICE_STACK_SOUND` (all 30 checks
pass), `LOCAL_VOICE_STACK_NOT_SOUND` (any check fails), or
`INSUFFICIENT_EVIDENCE` (nothing fails but evidence is missing),
across five sections: pipeline_and_engine_selection,
cloning_consent_and_ethics, audio_engineering_and_latency,
accessibility, testing_and_quality_gates.

## Distinct ground

`voice-note-narration-audio` (scaffolded, no built core) produces
spoken audio as its deliverable; this atom audits a declared
voice-stack *engineering* record (engine selection, consent,
latency, accessibility, testing) and produces no audio — zero
shared checks. `local-llm-serving-setup` covers LLM serving, not
speech engines; the bound skill names it as related, but no
check here reads an LLM-serving field. This atom's ground is
only the `voice-and-speech-engineering` method, quality gates
and red lines.

## Honest scoping

This atom audits a **declared** local voice-stack engineering
record — it builds no stack, synthesizes or transcribes no
audio, runs or benchmarks no engine, plays no audio, and does
not verify that a declared control actually works. A stack is
sound *on the caller's declared evidence*: a manifest that
declares licenses cleared, consent recorded, and latency
measured passes those checks even if the real stack does none
of it. It is a completeness and consistency audit of the record
the skill requires, **not a voice engineering service or a
legal/ethics certification**: it never judges whether an engine
is actually good, whether a license really permits the use,
whether consent was genuinely obtained, whether latency is
actually within budget, or whether the accessibility controls
actually work — only that the record contains what the skill's
method, quality gates and red lines demand, and that its
declared rows are internally consistent.

Named exclusions and non-reducible parts (carried as caller
declarations only, never judged): no numeric thresholds beyond
the skill's own stated rules (see the declined list above); no
live verification of any declared fact; no listening — audio
quality, pronunciation and transcription accuracy are
caller-declared flags and test attestations, the atom hears no
audio and reads no transcripts; engine quality (whether the
selected engine is the right choice for the use) is a caller
declaration — the atom checks only that the selection criteria
are declared evaluated; legal sufficiency of consent, disclosure
or licensing for any jurisdiction is not judged — only that the
record declares them addressed; accessibility effectiveness
(whether the controls actually serve audio users) is a caller
declaration — only their declared presence is checked.

## Pricing

Pricing unit: **deliverable**. No price is set. Prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Status

Tier B · status: **built-locally** — deterministic core, Python
oracle and TypeScript port built and parity-proven locally; no
endpoint is live. Release happens one by one, by the owner's GO,
per the approved queue.
