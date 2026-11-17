# Local voice stack engineering pack — user guide

Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)

## What it does

You are building a local voice stack — text-to-speech, speech-to-text, or both — and you have a record of how that stack was engineered. This atom reads one declared manifest and returns one deterministic verdict across five sections: **LOCAL_VOICE_STACK_SOUND**, **LOCAL_VOICE_STACK_NOT_SOUND**, or **INSUFFICIENT_EVIDENCE** (nothing failed, but evidence is missing — the verdict names exactly which). It audits the declared record's completeness and consistency only — it builds no stack, synthesizes or transcribes no audio, runs or benchmarks no engine, plays no audio, and does not verify that a declared control actually works. A stack is sound *on your declared evidence*: it never judges whether an engine is actually good, whether a license really permits the use, whether consent was genuinely obtained, whether latency is actually within budget, or whether the accessibility controls actually work. Computed checks: the declared `engines` list must be present and non-empty; every engine row must declare its license cleared for commercial use and evaluation on your own golden sentences; and every row declared as a voice-cloning engine must declare recorded consent. The barge-in check is conditional: it is required only when `latency.assistant_interactive_use_present` is declared `true`; otherwise it passes as not applicable. No numeric threshold is imposed — no time-to-first-audio or overall latency budget in milliseconds, no word-error rate (WER) or character-error rate for STT (including a noisy-input bar), no audio quality score (MOS or similar) or golden-sample hash-match percentage, no sample rate, bit depth or bitrate, no loudness target in LUFS or dB, no CPU/GPU footprint, memory, model-size or real-time-factor limit, no number of languages or language-coverage percentage, no pronunciation accuracy rate, no speed or pitch control range, and no coverage percentage below completeness. Same manifest in → same verdict out.

## Get a key

1. Sign up at https://atoms.pipavia.com — `POST /v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "local-voice-stack-engineering-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom.
3. Send the key as `Authorization: Bearer <key>` on every call.

## Endpoints

- **MCP:** `POST https://atoms.pipavia.com/mcp/local-voice-stack-engineering-pack` — tool name `local_voice_stack_engineering_pack`; `tools/call` arguments = the manifest object below.
- **REST:** `POST https://atoms.pipavia.com/v1/local-voice-stack-engineering-pack` — body = the manifest object; same `Authorization` header.

## Input — the local-voice-stack manifest

| Field | Meaning |
|---|---|
| `stack` | stack name (string; carried into the output, not checked) |
| `pipeline.tts_stt_or_both_scope_declared` | pipeline evidence: the pipeline scope — TTS, STT, or both — is declared |
| `pipeline.streaming_vs_file_output_declared` | pipeline evidence: streaming vs file output is declared |
| `pipeline.local_first_by_default` | pipeline evidence: the stack is local-first by default |
| `engine_selection.quality_latency_footprint_evaluated` | engine-selection evidence: quality vs latency vs footprint is evaluated |
| `engine_selection.language_coverage_addressed` | engine-selection evidence: language coverage is addressed |
| `engines` (list of engine-row objects) | computed: must be present and non-empty; reported as `engines_count` |
| `engines[].name` (string) | names the row in the computed outputs |
| `engines[].license_cleared_for_commercial_use` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `engines_without_license_clearance` |
| `engines[].evaluated_on_own_golden_sentences` | computed: every row must declare `true`; rows with the field present but not `true` are reported in `engines_without_golden_sentence_evaluation` |
| `engines[].is_voice_cloning` | computed gate: declares the row is a voice-cloning engine |
| `engines[].cloning_consent_recorded` | computed: required `true` when the row is a voice-cloning engine; otherwise passes as not applicable to that row; cloning rows with the field present but not `true` are reported in `cloning_engines_without_consent_recorded` |
| `cloning.impersonation_present` | must be `false` to pass (red line: no impersonation) |
| `cloning.covert_recording_present` | must be `false` to pass (red line: no covert recording) |
| `cloning.synthetic_audio_disclosure_where_required` | cloning evidence: synthetic audio is disclosed where required |
| `cloning.voice_profiles_encrypted_at_rest` | cloning evidence: voice profiles are encrypted at rest |
| `cloning.deletion_honored` | cloning evidence: deletion of voice profiles is honored |
| `audio_engineering.sample_rate_and_format_choices_declared` | audio-engineering evidence: sample-rate and format choices are declared |
| `audio_engineering.loudness_normalization_applied` | audio-engineering evidence: loudness normalization is applied |
| `audio_engineering.chunking_for_long_text_with_pauses` | audio-engineering evidence: chunking for long text with pauses is in place |
| `audio_engineering.caching_synthesized_segments_for_repeat_text` | audio-engineering evidence: synthesized segments are cached for repeat text |
| `latency.time_to_first_audio_budget_stated` | latency evidence: a time-to-first-audio budget is stated |
| `latency.latency_measured_against_stated_budget` | latency evidence: latency is measured against the stated budget |
| `latency.chunked_synthesis` | latency evidence: chunked synthesis is used |
| `latency.assistant_interactive_use_present` | gate: declares whether assistant interactive use is present |
| `latency.interruption_barge_in_handling` | required `true` only when `latency.assistant_interactive_use_present` is `true`; otherwise passes as not applicable |
| `accessibility.speed_controls_present` | accessibility evidence: speed controls are present |
| `accessibility.pitch_controls_present` | accessibility evidence: pitch controls are present |
| `accessibility.captions_or_transcripts_wired` | accessibility evidence: captions or transcripts are wired |
| `accessibility.keyboard_operable_players` | accessibility evidence: players are keyboard-operable |
| `testing.golden_audio_regressions_in_test_loop` | testing evidence: golden-audio regressions are in the test loop |
| `testing.golden_hash_and_human_spot_checks` | testing evidence: golden checks use hash and human spot-checks |
| `testing.noisy_input_stt_tests` | testing evidence: noisy-input STT tests are run |
| `testing.pronunciation_dictionaries_for_names_numbers_code` | testing evidence: pronunciation dictionaries for names, numbers and code are in place |

A field **absent** = evidence missing (counts toward INSUFFICIENT_EVIDENCE). A field present but false/invalid = the check fails (counts toward LOCAL_VOICE_STACK_NOT_SOUND). All fields are booleans unless noted.

## Worked example (real request + real response, from external testing 2026-11-15)

Request — `POST /v1/local-voice-stack-engineering-pack`:

```json
{
  "stack": "production-voice-stack-v1",
  "pipeline": {
    "tts_stt_or_both_scope_declared": true,
    "streaming_vs_file_output_declared": true,
    "local_first_by_default": true
  },
  "engine_selection": {
    "quality_latency_footprint_evaluated": true,
    "language_coverage_addressed": true
  },
  "engines": [
    {
      "name": "engine_a",
      "license_cleared_for_commercial_use": true,
      "evaluated_on_own_golden_sentences": true,
      "is_voice_cloning": true,
      "cloning_consent_recorded": true
    }
  ],
  "cloning": {
    "impersonation_present": false,
    "covert_recording_present": false,
    "synthetic_audio_disclosure_where_required": true,
    "voice_profiles_encrypted_at_rest": true,
    "deletion_honored": true
  },
  "audio_engineering": {
    "sample_rate_and_format_choices_declared": true,
    "loudness_normalization_applied": true,
    "chunking_for_long_text_with_pauses": true,
    "caching_synthesized_segments_for_repeat_text": true
  },
  "latency": {
    "time_to_first_audio_budget_stated": true,
    "latency_measured_against_stated_budget": true,
    "chunked_synthesis": true,
    "assistant_interactive_use_present": true,
    "interruption_barge_in_handling": true
  },
  "accessibility": {
    "speed_controls_present": true,
    "pitch_controls_present": true,
    "captions_or_transcripts_wired": true,
    "keyboard_operable_players": true
  },
  "testing": {
    "golden_audio_regressions_in_test_loop": true,
    "golden_hash_and_human_spot_checks": true,
    "noisy_input_stt_tests": true,
    "pronunciation_dictionaries_for_names_numbers_code": true
  }
}
```

Response — HTTP 200 (trimmed; the full response carries all 30 checks and a text stamp of the verdict):

```json
{
  "service": "local-voice-stack-engineering-pack",
  "atom_version": "0.1.0",
  "stack": "production-voice-stack-v1",
  "verdict": "LOCAL_VOICE_STACK_SOUND",
  "sections": {
    "pipeline_and_engine_selection": "pass",
    "cloning_consent_and_ethics": "pass",
    "audio_engineering_and_latency": "pass",
    "accessibility": "pass",
    "testing_and_quality_gates": "pass"
  },
  "computed_status": "within_stated_limits_on_declared_evidence",
  "engines_count": 1,
  "engines_without_license_clearance": [],
  "license_coverage": "1.000000",
  "engines_without_golden_sentence_evaluation": [],
  "golden_evaluation_coverage": "1.000000",
  "cloning_engines_without_consent_recorded": [],
  "summary": "30 pass, 0 fail, 0 missing of 30 checks across five sections."
}
```

## Verdicts

- **LOCAL_VOICE_STACK_SOUND** — every check passes; the declared local voice-stack engineering record is complete and consistent with the skill's checklist and lines.
- **LOCAL_VOICE_STACK_NOT_SOUND** — at least one check fails; the failing checks name the breached requirement and the evidence against it.
- **INSUFFICIENT_EVIDENCE** — nothing failed, but evidence is missing; the checks marked `missing` say exactly what to supply.

The response also reports `engines_count` (the declared list length as an integer, or null when the list is not declared), the row-name lists `engines_without_license_clearance`, `engines_without_golden_sentence_evaluation` and `cloning_engines_without_consent_recorded` (null when the `engines` list is not declared; an engine with the relevant field absent is missing evidence and does not appear in the lists), the coverage values `license_coverage` and `golden_evaluation_coverage` (ratios as strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty), and `computed_status` (`within_stated_limits_on_declared_evidence` / `outside_stated_limits_on_declared_evidence` / null when any of the four primary computed checks cannot be completed).

Errors: `401` missing/invalid key · `403` key lacks this atom's scope · `422` invalid input · `429` rate limit (60/min, 10,000/day per key).

## Rate

Free during trial — rate pending.

## Support

info@pipavia.com
