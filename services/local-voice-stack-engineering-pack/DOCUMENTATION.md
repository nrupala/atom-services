# Local voice stack engineering pack — documentation

**Local voice stack engineering pack** · slug `local-voice-stack-engineering-pack` · deliverable type DELIVERABLE · atom version 0.1.0 · status: live — release candidate, RC soak to 2026-11-22 (atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b).

Quick start: [USER-GUIDE.md](USER-GUIDE.md) · Verification evidence: [TEST-REPORT.md](TEST-REPORT.md) · Service definition: [SERVICE.md](SERVICE.md) · Machine contract: [contract.yaml](contract.yaml).

This document follows the house documentation standard (AppDoc Studio, process line N-10): Diátaxis architecture (tutorial / how-to / reference / explanation), CommonMark markdown output, and role views per audience. Every worked example below is a real recorded trial run from the external verification battery — see the provenance line under Worked examples. Where SERVICE.md, TEST-REPORT.md or USER-GUIDE.md disagree with the recorded response, this document follows the recorded response and names the disagreement under Discrepancies.

## Tutorial

A first call, walked through step by step. The walkthrough follows the recorded full-pass trial run for this atom (the `stack` "production-voice-stack-v1"); the verbatim request and response are reproduced under [Worked examples](#worked-examples), example 1.

**Step 1 — Get a key.** Sign up at https://atoms.pipavia.com (`POST /v1/signup` with your email; a sign-in link is emailed to you), open the link to mint your session, then issue a gateway key for this atom: `POST /v1/keys` with `{"atom": "local-voice-stack-engineering-pack"}`. One gateway key works across atoms; each atom's scope is granted on the same key as you issue it per atom. Send the key as `Authorization: Bearer <key>` on every call.

**Step 2 — Assemble the local-voice-stack manifest.** You declare a record of a voice stack already engineered — the atom audits the record, it does not build the stack (see Explanation). The recorded full-pass manifest declares the stack `production-voice-stack-v1`: pipeline scope (TTS, STT, or both), streaming vs file output, and local-first-by-default all declared; quality vs latency vs footprint evaluated and language coverage addressed; one engine, `engine_a`, with its license cleared for commercial use and evaluation on the caller's own golden sentences declared, declared as a voice-cloning engine with consent recorded; neither cloning red line present (`impersonation_present: false`, `covert_recording_present: false`), synthetic-audio disclosure where required, voice profiles encrypted at rest, and deletion honored; sample-rate and format choices declared, loudness normalization applied, chunking for long text with pauses, and caching of synthesized segments for repeat text; a time-to-first-audio budget stated, latency measured against the stated budget, chunked synthesis, and assistant interactive use present (`assistant_interactive_use_present: true`) with interruption/barge-in handling present (so the conditional barge-in check applies and passes); speed and pitch controls present, captions or transcripts wired, and keyboard-operable players; and golden-audio regressions in the test loop, golden hash and human spot-checks, noisy-input STT tests, and pronunciation dictionaries for names, numbers and code.

**Step 3 — Send it.** `POST https://atoms.pipavia.com/v1/local-voice-stack-engineering-pack` with the manifest as the JSON body and the `Authorization` header. The same manifest in always produces the same verdict out: the core is deterministic, and the recorded battery proves determinism (byte-identical repeat responses) and REST/MCP parity — see TEST-REPORT.md.

**Step 4 — Read the verdict.** The recorded run returned HTTP 200 with verdict `LOCAL_VOICE_STACK_SOUND`: "30 pass, 0 fail, 0 missing of 30 checks across five sections." Every section reports `pass`, and the response carries the full per-check list plus the computed outputs described in the Reference. `computed_status` is `within_stated_limits_on_declared_evidence`, `engines_count` is 1, `license_coverage` is `"1.000000"`, and `golden_evaluation_coverage` is `"1.000000"`, with all three row-name lists empty.

**Step 5 — Act on it.** A positive verdict means the declared record is complete and internally consistent — nothing more (see Explanation for what the atom does not certify). If the verdict had been `LOCAL_VOICE_STACK_NOT_SOUND` or `INSUFFICIENT_EVIDENCE`, the failing or missing checks would name exactly what to fix or supply — see the how-to guide below.

## How-to guides

### Get a key and call via REST

1. Sign up: `POST https://atoms.pipavia.com/v1/signup` with your email; a sign-in link is emailed to you.
2. Open the link (it mints your session), then issue your gateway key for this atom: `POST /v1/keys` with `{"atom": "local-voice-stack-engineering-pack"}`.
3. Call: `POST https://atoms.pipavia.com/v1/local-voice-stack-engineering-pack` — body = the manifest object (see Input reference); header `Authorization: Bearer <key>`.
4. Read the JSON response: `verdict`, `sections`, `checks`, the computed outputs, `summary` and `stamp` (see Output format). A failed call is not metered; a delivered artifact is.

### Call via MCP

1. Use the same gateway key. Connect your MCP client to `POST https://atoms.pipavia.com/mcp/local-voice-stack-engineering-pack` with the `Authorization: Bearer <key>` header — the whole MCP surface on this gateway is key-gated, including `initialize` and `tools/list`.
2. Call `tools/call` with tool name `local_voice_stack_engineering_pack`; `arguments` = the manifest object, exactly as in the REST body.
3. The tool result's `structuredContent` is the same artifact the REST face returns (parity is proven in the recorded battery); `content` carries the same JSON as text.

### Read a failing verdict and fix the manifest

A verdict of `LOCAL_VOICE_STACK_NOT_SOUND` means at least one check has status `fail`: a field is present but false/invalid, or a declared row breaks a computed rule. A verdict of `INSUFFICIENT_EVIDENCE` means nothing failed but at least one check has status `missing`: the field or rows it reads are absent. Worked example 2 under Worked examples is the recorded violations run for this atom — 6 checks fail: `every_engine_license_cleared_for_commercial_use`, `every_engine_evaluated_on_own_golden_sentences`, `no_impersonation`, `no_covert_recording`, `every_cloning_engine_has_consent_recorded`, `interruption_barge_in_when_assistant_use`, and the summary reads "24 pass, 6 fail, 0 missing of 30 checks across five sections."

1. Find the checks with status `fail` (or `missing`) in the `checks` array; each names its section and states the requirement it enforces in its `evidence` text.
2. For a `fail`: correct the declared value or the offending row in your manifest — the computed outputs name the offending rows (in the recorded violations run, `engines_without_license_clearance`, `engines_without_golden_sentence_evaluation` and `cloning_engines_without_consent_recorded` all name `bad_engine`: an engine declared with `license_cleared_for_commercial_use`, `evaluated_on_own_golden_sentences` and `cloning_consent_recorded` all `false` while `is_voice_cloning` is `true`; the run also declares `cloning.impersonation_present` and `cloning.covert_recording_present` as `true`, and `latency.interruption_barge_in_handling` as `false` with assistant interactive use present). For a `missing`: supply the absent field or list; do not guess a value — an absent field is missing evidence, a present-but-false field is a fail, and the two verdicts are different.
3. Resubmit the corrected manifest. Because the core is deterministic, the same manifest always returns the same verdict, so a fix is proven by the changed verdict, not by retrying.

### Handle a 422 invalid_input

A 422 is not a verdict: the manifest failed type validation before evaluation (for example a string where an object is required) and no checks ran. The body names the field and the expected type:

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "pipeline",
  "detail": "pipeline must be an object"
}
```

(This is the recorded malformed run for this atom — Worked examples, example 3.) Fix the type of the named `field` in your manifest — the Input reference below gives every field's type — and resubmit until the call returns 200.

## Reference

### Endpoints

- **REST:** `POST https://atoms.pipavia.com/v1/local-voice-stack-engineering-pack` — body = the manifest object; header `Authorization: Bearer <key>`.
- **MCP:** `POST https://atoms.pipavia.com/mcp/local-voice-stack-engineering-pack` — tool name `local_voice_stack_engineering_pack`; `tools/call` arguments = the manifest object; same `Authorization` header.
- **Key scope:** `local_voice_stack_engineering_pack` (this atom only — a key for one atom never verifies for another; the scope is granted on your gateway key when you issue it for this atom).

### Input reference

One JSON manifest per call. Types are as stated in SERVICE.md's field table: **all fields are booleans unless a type is noted in the field's row**. Where SERVICE.md states no type — the section container objects and the engine-row object — the type given here is grounded in the recorded evidence inputs (the full-pass input in `verification/work/local-voice-stack-engineering-pack/evidence.json` carries each of them as a JSON object), and the row says so. A field **absent** = evidence missing (the check that reads it reports `missing`, counting toward `INSUFFICIENT_EVIDENCE`); a field present but false / invalid = the check fails (counting toward `LOCAL_VOICE_STACK_NOT_SOUND`). A present value of the wrong type is rejected before evaluation with a 422 (see Errors). Fields are grouped below exactly as SERVICE.md groups them — by the section that reads them.

#### Carried into the output (not itself checked)

| Field | Type | Notes |
|---|---|---|
| `stack` | string | Carried into the verdict output, not itself checked |

#### Read by: pipeline_and_engine_selection

| Field | Type | Notes |
|---|---|---|
| `pipeline` | object | The pipeline section object — type grounded in the recorded evidence inputs; SERVICE.md states no type for the container. A present non-object value is rejected before evaluation (the recorded malformed run) |
| `pipeline.tts_stt_or_both_scope_declared` | boolean | — |
| `pipeline.streaming_vs_file_output_declared` | boolean | — |
| `pipeline.local_first_by_default` | boolean | — |
| `engine_selection` | object | The engine-selection section object — type grounded in the recorded evidence inputs; SERVICE.md states no type for the container |
| `engine_selection.quality_latency_footprint_evaluated` | boolean | — |
| `engine_selection.language_coverage_addressed` | boolean | — |
| `engines` | list | list of engine-row objects, each with the entry fields below; computed, see below |
| `engines[]` | object | One declared engine row — type grounded in the recorded evidence inputs; SERVICE.md states no type for the row object |
| `engines[].name` | string | Names the row in the computed outputs |
| `engines[].license_cleared_for_commercial_use` | boolean | — |
| `engines[].evaluated_on_own_golden_sentences` | boolean | — |
| `engines[].is_voice_cloning` | boolean (gate) | gates the consent check in cloning_consent_and_ethics below |
| `engines[].cloning_consent_recorded` | boolean | required when the row is a voice-cloning engine; otherwise the check passes as not applicable to that row; also read by cloning_consent_and_ethics |

#### Read by: cloning_consent_and_ethics

| Field | Type | Notes |
|---|---|---|
| `cloning` | object | The cloning section object — type grounded in the recorded evidence inputs; SERVICE.md states no type for the container |
| `cloning.impersonation_present` | boolean | must be `false` to pass — skill red line |
| `cloning.covert_recording_present` | boolean | must be `false` to pass — skill red line |
| `cloning.synthetic_audio_disclosure_where_required` | boolean | — |
| `cloning.voice_profiles_encrypted_at_rest` | boolean | — |
| `cloning.deletion_honored` | boolean | — |

#### Read by: audio_engineering_and_latency

| Field | Type | Notes |
|---|---|---|
| `audio_engineering` | object | The audio-engineering section object — type grounded in the recorded evidence inputs; SERVICE.md states no type for the container |
| `audio_engineering.sample_rate_and_format_choices_declared` | boolean | — |
| `audio_engineering.loudness_normalization_applied` | boolean | — |
| `audio_engineering.chunking_for_long_text_with_pauses` | boolean | — |
| `audio_engineering.caching_synthesized_segments_for_repeat_text` | boolean | — |
| `latency` | object | The latency section object — type grounded in the recorded evidence inputs; SERVICE.md states no type for the container |
| `latency.time_to_first_audio_budget_stated` | boolean | — |
| `latency.latency_measured_against_stated_budget` | boolean | — |
| `latency.chunked_synthesis` | boolean | — |
| `latency.assistant_interactive_use_present` | boolean (gate) | gates the barge-in check below |
| `latency.interruption_barge_in_handling` | boolean | required when assistant interactive use is declared present; otherwise the check passes as not applicable |

#### Read by: accessibility

| Field | Type | Notes |
|---|---|---|
| `accessibility` | object | The accessibility section object — type grounded in the recorded evidence inputs; SERVICE.md states no type for the container |
| `accessibility.speed_controls_present` | boolean | — |
| `accessibility.pitch_controls_present` | boolean | — |
| `accessibility.captions_or_transcripts_wired` | boolean | — |
| `accessibility.keyboard_operable_players` | boolean | — |

#### Read by: testing_and_quality_gates

| Field | Type | Notes |
|---|---|---|
| `testing` | object | The testing section object — type grounded in the recorded evidence inputs; SERVICE.md states no type for the container |
| `testing.golden_audio_regressions_in_test_loop` | boolean | — |
| `testing.golden_hash_and_human_spot_checks` | boolean | — |
| `testing.noisy_input_stt_tests` | boolean | — |
| `testing.pronunciation_dictionaries_for_names_numbers_code` | boolean | — |

### Checks

All 30 checks, in the recorded order, grouped by section. "Requires" quotes the check's own recorded evidence text from the full-pass run — what the check states it enforces. Recorded check names are used verbatim, even where they differ from the input field names they read (see Discrepancies). Per-check statuses are `pass`, `fail` and `missing` only: a conditional (gated) check whose gate is not triggered reports `pass` with evidence stating the gate was not declared — that is the not-applicable outcome, except where the gate field itself is absent, in which case the recorded sparse run reports `missing`. Section and verdict aggregation are defined under Verdict vocabulary.

#### Section: pipeline_and_engine_selection

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `pipeline_scope_declared` | pipeline first: the pipeline scope — TTS (synthesis), STT (transcription), or both — is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `output_mode_declared` | pipeline first: streaming vs file output is declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `local_first_by_default` | pipeline first: device-side vs server is decided local-first by default — run it local where it matters | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `quality_latency_footprint_evaluated` | engine selection: quality vs latency vs footprint (CPU/GPU) is evaluated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `language_coverage_addressed` | engine selection: language coverage is addressed | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `engines_declared` | the declared record names its engines — the engines list is present and non-empty | Computed over the declared record. Pass: the `engines` list is present and non-empty. Fail: the list is present but empty. Missing: the list is absent. |
| `every_engine_license_cleared_for_commercial_use` | engine selection / quality gate: every declared engine row declares its license cleared for the intended use (commercial) | Computed over the declared rows. Pass: every declared engine row declares `license_cleared_for_commercial_use: true`. Fail: a row declares the field present but not `true` (offending rows are named in `engines_without_license_clearance`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `engines_without_license_clearance`). |
| `every_engine_evaluated_on_own_golden_sentences` | engine selection: every declared engine row declares evaluation on the caller's own golden sentences — not vendor demos | Computed over the declared rows. Pass: every declared engine row declares `evaluated_on_own_golden_sentences: true`. Fail: a row declares the field present but not `true` (offending rows are named in `engines_without_golden_sentence_evaluation`). Missing: the list is absent, or a row has the field absent (such a row is missing evidence and does not appear in `engines_without_golden_sentence_evaluation`). |

#### Section: cloning_consent_and_ethics

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `no_impersonation` | cloning ethics & law / red line: no impersonation is present in the declared design | Pass: `cloning.impersonation_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `no_covert_recording` | red line: no covert recording is present in the declared design | Pass: `cloning.covert_recording_present` is declared `false`. Fail: it is declared `true`. Missing: the field is absent. |
| `synthetic_audio_disclosure_where_required` | cloning ethics & law / red line: synthetic audio is disclosed where required — where context demands it | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `voice_profiles_encrypted_at_rest` | cloning ethics & law: voice profiles are encrypted at rest — cloned voices are treated as the sensitive thing they are | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `deletion_honored` | cloning ethics & law: deletion of voice profiles is honored | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `every_cloning_engine_has_consent_recorded` | cloning ethics & law / quality gate / red line: every engine row declared as a voice-cloning engine declares explicit, recorded consent for the real-person voice — never clone without consent | Computed over the declared rows, conditional per row on `is_voice_cloning`. Pass: every row with `is_voice_cloning: true` declares `cloning_consent_recorded: true` — or there are no cloning rows, in which case the check passes as not applicable to those rows. Fail: a cloning row declares `cloning_consent_recorded` present but not `true` (offending rows are named in `cloning_engines_without_consent_recorded`). Missing: the list is absent, a row has `is_voice_cloning` absent, or a cloning row has the consent field absent (such a row is missing evidence and does not appear in `cloning_engines_without_consent_recorded`). |

#### Section: audio_engineering_and_latency

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `sample_rate_and_format_choices_declared` | audio engineering: sample-rate/format choices (wav/opus) are declared | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `loudness_normalization_applied` | audio engineering: loudness normalization is applied | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `chunking_for_long_text_with_pauses` | audio engineering: chunking for long text (keep-alive + pauses) is in place | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `caching_synthesized_segments_for_repeat_text` | audio engineering: synthesized segments are cached for repeat text | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `time_to_first_audio_budget_stated` | latency budgets: a time-to-first-audio target for interactive use is stated | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `latency_measured_against_stated_budget` | latency budgets / quality gate: latency is measured against a stated budget — measure latency honestly | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `chunked_synthesis` | latency budgets: chunked synthesis is used | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `interruption_barge_in_when_assistant_use` | latency budgets: interruption/barge-in handling is in place when assistant interactive use is declared present | Conditional on `latency.assistant_interactive_use_present`. Pass: the gate is declared `true` and `interruption_barge_in_handling` is declared `true` — or the gate is declared `false`, in which case the check passes as not applicable. Fail: the gate is declared `true` and `interruption_barge_in_handling` is declared `false`. Missing: the gate field is absent (the recorded sparse run reports this check `missing` with evidence "no assistant interactive use declared"), or the gate is declared `true` and the handling field is absent. |

#### Section: accessibility

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `speed_controls_present` | accessibility / quality gate: speed controls are present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `pitch_controls_present` | accessibility / quality gate: pitch controls are present | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `captions_or_transcripts_wired` | accessibility / quality gate: captions/transcripts from STT are wired | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `keyboard_operable_players` | accessibility: players are keyboard-operable — audio users are users | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

#### Section: testing_and_quality_gates

| Check | Requires (recorded evidence text) | Pass / fail / missing semantics |
|---|---|---|
| `golden_audio_regressions_in_test_loop` | testing / quality gate: golden-sample regressions are in the test loop | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `golden_hash_and_human_spot_checks` | testing: golden-audio regressions use hash + human spot-checks | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `noisy_input_stt_tests` | testing: noisy-input STT tests are run | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |
| `pronunciation_dictionaries_for_names_numbers_code` | testing: pronunciation dictionaries for names/numbers/code are in place | Pass: the field is declared `true`. Fail: it is declared `false`. Missing: the field is absent. |

### Output format

HTTP 200 returns one JSON object:

- `service` (`"local-voice-stack-engineering-pack"`), `atom_version` (`"0.1.0"`), and `stack` (the manifest's declared stack value, carried through).
- `verdict` — one of the verdict values below.
- `sections` — an object mapping each section name to its section status (below).
- `checks` — the full per-check array: `{section, check, status, evidence}` for every check, in the order listed above.
- `computed_status` — see Verdict vocabulary.
- Computed outputs: `engines_count` (the declared list length as an integer, or null when the list is not declared); the row-name lists `engines_without_license_clearance` (engines whose `license_cleared_for_commercial_use` field is present but not `true`; an engine with the field absent is missing evidence and does not appear), `engines_without_golden_sentence_evaluation` (engines whose `evaluated_on_own_golden_sentences` field is present but not `true`) and `cloning_engines_without_consent_recorded` (cloning engines whose `cloning_consent_recorded` field is present but not `true`) — all three lists are null when the `engines` list is not declared, as the recorded sparse run shows; and the ratios `license_coverage` (engines with license cleared ÷ declared engines) and `golden_evaluation_coverage` (engines evaluated on own golden sentences ÷ declared engines) — strings with exactly six decimal places; a ratio is null when its denominator list is absent or empty. Ratios use the fixed serialization rule — round half up to 6dp, `floor(v * 1000000 + 0.5) / 1000000`, formatted with exactly six decimals — which is what makes the Python and TypeScript outputs byte-identical.
- `summary` — a one-line count, e.g. "30 pass, 0 fail, 0 missing of 30 checks across five sections."
- `stamp` — a plain-text rendering of the same verdict (title, declared stack value, verdict and per-section statuses) for human-readable records.

### Verdict vocabulary

**Verdicts** (the top-level `verdict` field):

- `LOCAL_VOICE_STACK_SOUND` — all 30 checks pass: the declared local voice-stack engineering record is complete and consistent with the bound skill's checklist and red lines.
- `LOCAL_VOICE_STACK_NOT_SOUND` — at least one check fails: a declared value or row contradicts a requirement. The failing checks and the computed outputs name what is wrong.
- `INSUFFICIENT_EVIDENCE` — nothing fails, but at least one check is `missing`: evidence the record requires was not declared. The missing checks name exactly what to supply.

**`computed_status`** (computed checks only): `within_stated_limits_on_declared_evidence` — every primary computed check passes; `outside_stated_limits_on_declared_evidence` — at least one primary computed check fails; `null` — at least one of the four primary computed checks (engines declared, license per engine, golden-sentence evaluation per engine, consent per cloning engine) cannot be completed because the rows or fields it reads are absent.

**Section statuses** (each value in `sections`): `pass` — every check in the section passes (including gated checks passing as not applicable); `fail` — at least one check in the section fails; `insufficient_evidence` — no check in the section fails, but at least one is missing.

**Per-check statuses** (each entry in `checks`): `pass` — the requirement is met on the declared evidence (for gated checks: met, or the gate was not triggered — not applicable); `fail` — the declared evidence contradicts the requirement; `missing` — the field or rows the check reads are absent.

**Secondary computed fields:** `engines_count`, `engines_without_license_clearance`, `license_coverage`, `engines_without_golden_sentence_evaluation`, `golden_evaluation_coverage` and `cloning_engines_without_consent_recorded` — meanings and null rules are given under Output format above; in the recorded full-pass run they are `1`, `[]`, `"1.000000"`, `[]`, `"1.000000"` and `[]` respectively, and in the recorded sparse run all of them are `null`.

### Errors

Only the 422 body below is recorded in the verification battery. The 401, 403 and 429 rows carry HTTP status and meaning only — **no response body for them is recorded in the battery, and no payload shape is asserted here (unrecorded)**.

| HTTP | Body | Meaning |
|---|---|---|
| 401 | *(unrecorded — no body in the verification battery)* | Missing or invalid gateway key. |
| 403 | *(unrecorded — no body in the verification battery)* | The key is valid but does not hold this atom's scope. Issue the key for this atom (see How-to) and retry. |
| 422 | `{"ok":false,"error":"invalid_input","field":"pipeline","detail":"pipeline must be an object"}` (this atom's recorded malformed run, verbatim) | The manifest failed type validation before evaluation; `field` and `detail` name the violation. No verdict is returned. |
| 429 | *(unrecorded — no body in the verification battery)* | Per-key rate limit exceeded for this atom (60/minute, 10,000/day — see below). |

### Rate limits and pricing

- **Rate limits (per key, per atom, from contract.yaml):** 60 calls/minute and 10,000 calls/day. Over-limit calls return 429 (above).
- **Pricing:** unit = deliverable (one delivered result = one unit of sale). `pricing.rate` is `null` in contract.yaml — **Free during trial — rate pending.** Rates are set only from measured production cost per unit; SERVICE.md states no price is set, because prices are set only from measured production cost per unit (register test T4 is estimable, not yet measured in production).

## Explanation

**What the atom does.** Build local voice & speech stacks — TTS/STT selection, cloning consent, latency, audio quality, accessibility (the bound capability, from the `voice-and-speech-engineering` skill). You submit one declared record — the local-voice-stack manifest — and the atom audits that record for completeness and internal consistency against the bound skill's method, quality gates and red lines, returning one deterministic verdict across 5 sections (`pipeline_and_engine_selection`, `cloning_consent_and_ethics`, `audio_engineering_and_latency`, `accessibility`, `testing_and_quality_gates`). The atom sells that deliverable — a bounded judgment artifact — never the underlying knowledge itself.

**How the verdict is decided.** The core is deterministic: the same manifest in always produces the same verdict out (proven byte-identical in the recorded battery, with REST/MCP parity). Three kinds of checks combine. *Attestation checks* read a single declared boolean: declared `true` passes (for red-line / anti-pattern fields — `cloning.impersonation_present`, `cloning.covert_recording_present` — declared `false` passes); present-but-opposite fails; absent is `missing`. *Computed checks* are calculated from the declared rows themselves — the declared `engines` list must be present and non-empty, every engine row must declare its license cleared for commercial use and evaluation on the caller's own golden sentences, and every voice-cloning row must declare recorded consent — using only the declared record, with no outside threshold imported. *Conditional checks* bind only when their declared gate field says the situation applies — consent per row only when the row's `is_voice_cloning` is declared `true`, and interruption/barge-in handling only when `latency.assistant_interactive_use_present` is declared `true`; when a gate is not triggered those checks pass as not applicable to that row. Aggregation is strict: any `fail` anywhere produces `LOCAL_VOICE_STACK_NOT_SOUND`; otherwise any `missing` produces `INSUFFICIENT_EVIDENCE`; only an all-`pass` record earns `LOCAL_VOICE_STACK_SOUND`. The central semantic is the absent/false distinction: **an absent field is missing evidence, never a fail; a present-but-false or invalid field is a fail, never missing.** That is what makes the verdict actionable — `missing` tells you what to supply, `fail` tells you what to correct.

**Thresholds declined.** No numeric threshold is invented: a time-to-first-audio or overall latency budget in milliseconds (the skill requires a stated budget and measurement against it but states no number — caller attestation only); a word-error rate (WER) or character-error rate for STT, including a noisy-input WER or signal-to-noise degradation bar (the skill requires noisy-input STT tests but states no rate); an audio quality score (MOS or similar) or a golden-sample hash-match percentage (the skill requires hash + human spot-checks but states no score); a sample rate in kHz, a bit depth, or an opus/wav bitrate (the skill names wav/opus as format choices but states no rate); a loudness target in LUFS or dB (the skill requires loudness normalization but states no target); a CPU/GPU footprint, memory, model-size or real-time-factor limit (the skill requires quality vs latency vs footprint evaluation but states no limit); a number of languages or a language-coverage percentage (the skill requires language coverage to be addressed but states no count); a pronunciation accuracy rate (the skill requires pronunciation dictionaries but states no rate); a speed or pitch control range (the skill requires the controls present but states no range); and a coverage percentage below completeness. Quantities are computed and reported; the only bar on the computed rows is completeness over the caller's own declared rows.

**What it does NOT do.** The atom audits a **declared** local voice-stack engineering record: a verdict of `LOCAL_VOICE_STACK_SOUND` means the record is complete and consistent *on the caller's declared evidence* — a manifest that declares licenses cleared, consent recorded, and latency measured passes those checks even if the real stack does none of it. It is a completeness and consistency audit of the record the skill requires, **not a voice engineering service or a legal/ethics certification**. Specifically: it builds no stack, synthesizes or transcribes no audio, runs or benchmarks no engine, plays no audio, and does not verify that a declared control actually works. It never judges whether an engine is actually good, whether a license really permits the use, whether consent was genuinely obtained, whether latency is actually within budget, or whether the accessibility controls actually work — only that the record contains what the skill's method, quality gates and red lines demand, and that its declared rows are internally consistent. Named exclusions: no numeric thresholds beyond the skill's own stated rules (see the declined list above); no live verification of any declared fact; no listening — audio quality, pronunciation and transcription accuracy are caller-declared flags and test attestations, the atom hears no audio and reads no transcripts; engine quality (whether the selected engine is the right choice for the use) is a caller declaration — the atom checks only that the selection criteria are declared evaluated; legal sufficiency of consent, disclosure or licensing for any jurisdiction is not judged — only that the record declares them addressed; accessibility effectiveness (whether the controls actually serve audio users) is a caller declaration — only their declared presence is checked.

**Buyer and use context.** Teams and agents working in Engineering & code who need this deliverable on demand rather than building or staffing the capability themselves (first buyer hypothesis from the register; not yet market-tested). Internal self-use: Reader and assistant voice features (Wright is an internal caller, zero price, metered to the internal cost ledger). Call it when the work the skill describes has been done (or is being prepared) and you need a bounded, repeatable judgment on whether the record of that work is complete and consistent — for example as a gate before the work proceeds, or as a review artifact attached to it.

### Discrepancies

This document follows the recorded response wherever the other documents disagree with it. Discrepancies found:

1. **Status — SERVICE.md (and contract.yaml) are stale.** SERVICE.md states status **built-locally** — "deterministic core, Python oracle and TypeScript port built and parity-proven locally; no endpoint is live" — and contract.yaml states status `scaffolded`. The recorded evidence and TEST-REPORT.md show the atom live on atoms-gateway v1.1.0 (deployment fe07be725c5a4817ad7b7e341310a97b). This document follows the evidenced live state: live — release candidate, RC soak to 2026-11-22.
2. **Check names differ from input field names.** The recorded check names used verbatim in the Checks section differ from the input field paths they read for, among others: `pipeline_scope_declared` (reads `pipeline.tts_stt_or_both_scope_declared`), `output_mode_declared` (reads `pipeline.streaming_vs_file_output_declared`), `engines_declared` (computed over the `engines` list), `every_engine_license_cleared_for_commercial_use` (reads `engines[].license_cleared_for_commercial_use`), `every_engine_evaluated_on_own_golden_sentences` (reads `engines[].evaluated_on_own_golden_sentences`), `every_cloning_engine_has_consent_recorded` (reads `engines[].cloning_consent_recorded` on cloning rows), `no_impersonation` (reads `cloning.impersonation_present`), `no_covert_recording` (reads `cloning.covert_recording_present`), and `interruption_barge_in_when_assistant_use` (reads `latency.interruption_barge_in_handling`, gated by `latency.assistant_interactive_use_present`). TEST-REPORT.md's tester-errors section records the same divergence from the design side (input field paths were rejected in favour of exact check names). The Checks section follows the recorded names.
3. **Trimmed excerpts omit recorded fields.** The worked-example response in USER-GUIDE.md and the full-pass raw-output excerpt in TEST-REPORT.md are labelled trimmed and omit the recorded `checks` array (all 30 checks) and the recorded `stamp` field. The full recorded responses are reproduced verbatim under Worked examples below.
4. **Test date vs recorded timestamp.** TEST-REPORT.md is dated 2026-11-15 and USER-GUIDE.md describes its worked example as "from external testing 2026-11-15"; the evidence recording's timestamp is 2026-11-16T06:30:16.958985+00:00 (UTC). Provenance lines in this document use the recorded UTC timestamp from the evidence file.

No other discrepancy was found: the recorded verdicts, section statuses, computed values, summary counts (30 / 24+6 / 0+0+30), the sparse run's null computed fields, and the malformed 422 body all match SERVICE.md, TEST-REPORT.md and USER-GUIDE.md as stated there.

## Role views

*Regulators: N/A — this atom audits a declared local voice-stack engineering record; its verdict is a completeness and consistency judgment on the caller's declared evidence, not compliance evidence and not a legal/ethics certification (SERVICE.md states this explicitly, and states that legal sufficiency of consent, disclosure or licensing for any jurisdiction is not judged — only that the record declares them addressed). No regulator role view is provided for this atom.*

### For integrators (Users)

You need: a gateway key with the `local_voice_stack_engineering_pack` scope, the two endpoints (Reference), and the verdict vocabulary. Start with the Tutorial, keep the Input reference open while authoring your manifest, and treat `missing` vs `fail` as your fix list. Rate limits are 60/minute and 10,000/day per key; the atom is free during trial (rate pending). Support: info@pipavia.com (per USER-GUIDE.md).

### For developers

Manifest authoring: types are in the Input reference — all booleans unless noted; a wrong type is a 422 before evaluation, never a verdict. Determinism: the core is a deterministic function of the manifest; computed ratios are serialized as strings with exactly six decimal places under the fixed rule `floor(v * 1000000 + 0.5) / 1000000`, which is what makes the Python oracle and the TypeScript port byte-identical. Implementation: `src/local_voice_stack_engineering_pack.py` (Python oracle) with the TypeScript port in the gateway; tests: `tests/test_local_voice_stack_engineering_pack.py` in this atom's directory, plus the external battery recorded in TEST-REPORT.md. The binding rule (contract.yaml, R1): fixes land in the bound skill first; the atom re-deploys from the refined skill and must pass regression before its version bumps.

### For ops

Endpoints: `POST /v1/local-voice-stack-engineering-pack` (REST) and `POST /mcp/local-voice-stack-engineering-pack` (MCP, tool `local_voice_stack_engineering_pack`) on https://atoms.pipavia.com, gateway v1.1.0 at last verification. Key scope: `local_voice_stack_engineering_pack`. Rate limits: 60/minute, 10,000/day per key per atom (429, body unrecorded in the battery). Error monitoring: watch 401 (key problems), 403 (scope not issued), 422 `invalid_input` (caller manifest type errors — the `field` value is the signal) and 429 volume. Status: live — release candidate, RC soak to 2026-11-22 (atoms-gateway v1.1.0, deployment fe07be725c5a4817ad7b7e341310a97b); a failed call is not metered and an unset rate meters at zero (free-trial posture).

## Worked examples

Provenance: recorded 2026-11-16T06:30:16.958985+00:00 against gateway v1.1.0, source `verification/work/local-voice-stack-engineering-pack/evidence.json`. The three examples below are that battery's full-pass, violations and malformed cases: each shows the case's recorded `input` and the REST execution's recorded `response_text`, verbatim (pretty-printed with indent 2 for readability; content identical to the recorded JSON values). The battery also recorded a sparse case (verdict `INSUFFICIENT_EVIDENCE` — see TEST-REPORT.md) plus determinism and MCP/REST parity proofs.

### Example 1 — Full-pass (case `full-pass`)

Provenance: recorded 2026-11-16T06:30:16.958985+00:00 against gateway v1.1.0, source `verification/work/local-voice-stack-engineering-pack/evidence.json`.

Input:

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

Response (HTTP 200):

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
  "checks": [
    {
      "section": "pipeline_and_engine_selection",
      "check": "pipeline_scope_declared",
      "status": "pass",
      "evidence": "pipeline first: the pipeline scope \u2014 TTS (synthesis), STT (transcription), or both \u2014 is declared"
    },
    {
      "section": "pipeline_and_engine_selection",
      "check": "output_mode_declared",
      "status": "pass",
      "evidence": "pipeline first: streaming vs file output is declared"
    },
    {
      "section": "pipeline_and_engine_selection",
      "check": "local_first_by_default",
      "status": "pass",
      "evidence": "pipeline first: device-side vs server is decided local-first by default \u2014 run it local where it matters"
    },
    {
      "section": "pipeline_and_engine_selection",
      "check": "quality_latency_footprint_evaluated",
      "status": "pass",
      "evidence": "engine selection: quality vs latency vs footprint (CPU/GPU) is evaluated"
    },
    {
      "section": "pipeline_and_engine_selection",
      "check": "language_coverage_addressed",
      "status": "pass",
      "evidence": "engine selection: language coverage is addressed"
    },
    {
      "section": "pipeline_and_engine_selection",
      "check": "engines_declared",
      "status": "pass",
      "evidence": "the declared record names its engines \u2014 the engines list is present and non-empty"
    },
    {
      "section": "pipeline_and_engine_selection",
      "check": "every_engine_license_cleared_for_commercial_use",
      "status": "pass",
      "evidence": "engine selection / quality gate: every declared engine row declares its license cleared for the intended use (commercial)"
    },
    {
      "section": "pipeline_and_engine_selection",
      "check": "every_engine_evaluated_on_own_golden_sentences",
      "status": "pass",
      "evidence": "engine selection: every declared engine row declares evaluation on the caller's own golden sentences \u2014 not vendor demos"
    },
    {
      "section": "cloning_consent_and_ethics",
      "check": "no_impersonation",
      "status": "pass",
      "evidence": "cloning ethics & law / red line: no impersonation is present in the declared design"
    },
    {
      "section": "cloning_consent_and_ethics",
      "check": "no_covert_recording",
      "status": "pass",
      "evidence": "red line: no covert recording is present in the declared design"
    },
    {
      "section": "cloning_consent_and_ethics",
      "check": "synthetic_audio_disclosure_where_required",
      "status": "pass",
      "evidence": "cloning ethics & law / red line: synthetic audio is disclosed where required \u2014 where context demands it"
    },
    {
      "section": "cloning_consent_and_ethics",
      "check": "voice_profiles_encrypted_at_rest",
      "status": "pass",
      "evidence": "cloning ethics & law: voice profiles are encrypted at rest \u2014 cloned voices are treated as the sensitive thing they are"
    },
    {
      "section": "cloning_consent_and_ethics",
      "check": "deletion_honored",
      "status": "pass",
      "evidence": "cloning ethics & law: deletion of voice profiles is honored"
    },
    {
      "section": "cloning_consent_and_ethics",
      "check": "every_cloning_engine_has_consent_recorded",
      "status": "pass",
      "evidence": "cloning ethics & law / quality gate / red line: every engine row declared as a voice-cloning engine declares explicit, recorded consent for the real-person voice \u2014 never clone without consent"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "sample_rate_and_format_choices_declared",
      "status": "pass",
      "evidence": "audio engineering: sample-rate/format choices (wav/opus) are declared"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "loudness_normalization_applied",
      "status": "pass",
      "evidence": "audio engineering: loudness normalization is applied"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "chunking_for_long_text_with_pauses",
      "status": "pass",
      "evidence": "audio engineering: chunking for long text (keep-alive + pauses) is in place"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "caching_synthesized_segments_for_repeat_text",
      "status": "pass",
      "evidence": "audio engineering: synthesized segments are cached for repeat text"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "time_to_first_audio_budget_stated",
      "status": "pass",
      "evidence": "latency budgets: a time-to-first-audio target for interactive use is stated"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "latency_measured_against_stated_budget",
      "status": "pass",
      "evidence": "latency budgets / quality gate: latency is measured against a stated budget \u2014 measure latency honestly"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "chunked_synthesis",
      "status": "pass",
      "evidence": "latency budgets: chunked synthesis is used"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "interruption_barge_in_when_assistant_use",
      "status": "pass",
      "evidence": "latency budgets: interruption/barge-in handling is in place when assistant interactive use is declared present"
    },
    {
      "section": "accessibility",
      "check": "speed_controls_present",
      "status": "pass",
      "evidence": "accessibility / quality gate: speed controls are present"
    },
    {
      "section": "accessibility",
      "check": "pitch_controls_present",
      "status": "pass",
      "evidence": "accessibility / quality gate: pitch controls are present"
    },
    {
      "section": "accessibility",
      "check": "captions_or_transcripts_wired",
      "status": "pass",
      "evidence": "accessibility / quality gate: captions/transcripts from STT are wired"
    },
    {
      "section": "accessibility",
      "check": "keyboard_operable_players",
      "status": "pass",
      "evidence": "accessibility: players are keyboard-operable \u2014 audio users are users"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "golden_audio_regressions_in_test_loop",
      "status": "pass",
      "evidence": "testing / quality gate: golden-sample regressions are in the test loop"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "golden_hash_and_human_spot_checks",
      "status": "pass",
      "evidence": "testing: golden-audio regressions use hash + human spot-checks"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "noisy_input_stt_tests",
      "status": "pass",
      "evidence": "testing: noisy-input STT tests are run"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "pronunciation_dictionaries_for_names_numbers_code",
      "status": "pass",
      "evidence": "testing: pronunciation dictionaries for names/numbers/code are in place"
    }
  ],
  "computed_status": "within_stated_limits_on_declared_evidence",
  "engines_count": 1,
  "engines_without_license_clearance": [],
  "license_coverage": "1.000000",
  "engines_without_golden_sentence_evaluation": [],
  "golden_evaluation_coverage": "1.000000",
  "cloning_engines_without_consent_recorded": [],
  "summary": "30 pass, 0 fail, 0 missing of 30 checks across five sections.",
  "stamp": "LOCAL VOICE STACK ENGINEERING PACK\nstack: production-voice-stack-v1\nVERDICT: LOCAL_VOICE_STACK_SOUND\n  pipeline_and_engine_selection        pass\n  cloning_consent_and_ethics           pass\n  audio_engineering_and_latency        pass\n  accessibility                        pass\n  testing_and_quality_gates            pass\n30 pass, 0 fail, 0 missing of 30 checks across five sections."
}
```

### Example 2 — Violations (case `violations`)

Provenance: recorded 2026-11-16T06:30:16.958985+00:00 against gateway v1.1.0, source `verification/work/local-voice-stack-engineering-pack/evidence.json`.

Input:

```json
{
  "stack": "bad-stack",
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
      "name": "bad_engine",
      "license_cleared_for_commercial_use": false,
      "evaluated_on_own_golden_sentences": false,
      "is_voice_cloning": true,
      "cloning_consent_recorded": false
    }
  ],
  "cloning": {
    "impersonation_present": true,
    "covert_recording_present": true,
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
    "interruption_barge_in_handling": false
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

Response (HTTP 200):

```json
{
  "service": "local-voice-stack-engineering-pack",
  "atom_version": "0.1.0",
  "stack": "bad-stack",
  "verdict": "LOCAL_VOICE_STACK_NOT_SOUND",
  "sections": {
    "pipeline_and_engine_selection": "fail",
    "cloning_consent_and_ethics": "fail",
    "audio_engineering_and_latency": "fail",
    "accessibility": "pass",
    "testing_and_quality_gates": "pass"
  },
  "checks": [
    {
      "section": "pipeline_and_engine_selection",
      "check": "pipeline_scope_declared",
      "status": "pass",
      "evidence": "pipeline first: the pipeline scope \u2014 TTS (synthesis), STT (transcription), or both \u2014 is declared"
    },
    {
      "section": "pipeline_and_engine_selection",
      "check": "output_mode_declared",
      "status": "pass",
      "evidence": "pipeline first: streaming vs file output is declared"
    },
    {
      "section": "pipeline_and_engine_selection",
      "check": "local_first_by_default",
      "status": "pass",
      "evidence": "pipeline first: device-side vs server is decided local-first by default \u2014 run it local where it matters"
    },
    {
      "section": "pipeline_and_engine_selection",
      "check": "quality_latency_footprint_evaluated",
      "status": "pass",
      "evidence": "engine selection: quality vs latency vs footprint (CPU/GPU) is evaluated"
    },
    {
      "section": "pipeline_and_engine_selection",
      "check": "language_coverage_addressed",
      "status": "pass",
      "evidence": "engine selection: language coverage is addressed"
    },
    {
      "section": "pipeline_and_engine_selection",
      "check": "engines_declared",
      "status": "pass",
      "evidence": "the declared record names its engines \u2014 the engines list is present and non-empty"
    },
    {
      "section": "pipeline_and_engine_selection",
      "check": "every_engine_license_cleared_for_commercial_use",
      "status": "fail",
      "evidence": "engine selection / quality gate: every declared engine row declares its license cleared for the intended use (commercial)"
    },
    {
      "section": "pipeline_and_engine_selection",
      "check": "every_engine_evaluated_on_own_golden_sentences",
      "status": "fail",
      "evidence": "engine selection: every declared engine row declares evaluation on the caller's own golden sentences \u2014 not vendor demos"
    },
    {
      "section": "cloning_consent_and_ethics",
      "check": "no_impersonation",
      "status": "fail",
      "evidence": "cloning ethics & law / red line: no impersonation is present in the declared design"
    },
    {
      "section": "cloning_consent_and_ethics",
      "check": "no_covert_recording",
      "status": "fail",
      "evidence": "red line: no covert recording is present in the declared design"
    },
    {
      "section": "cloning_consent_and_ethics",
      "check": "synthetic_audio_disclosure_where_required",
      "status": "pass",
      "evidence": "cloning ethics & law / red line: synthetic audio is disclosed where required \u2014 where context demands it"
    },
    {
      "section": "cloning_consent_and_ethics",
      "check": "voice_profiles_encrypted_at_rest",
      "status": "pass",
      "evidence": "cloning ethics & law: voice profiles are encrypted at rest \u2014 cloned voices are treated as the sensitive thing they are"
    },
    {
      "section": "cloning_consent_and_ethics",
      "check": "deletion_honored",
      "status": "pass",
      "evidence": "cloning ethics & law: deletion of voice profiles is honored"
    },
    {
      "section": "cloning_consent_and_ethics",
      "check": "every_cloning_engine_has_consent_recorded",
      "status": "fail",
      "evidence": "cloning ethics & law / quality gate / red line: every engine row declared as a voice-cloning engine declares explicit, recorded consent for the real-person voice \u2014 never clone without consent"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "sample_rate_and_format_choices_declared",
      "status": "pass",
      "evidence": "audio engineering: sample-rate/format choices (wav/opus) are declared"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "loudness_normalization_applied",
      "status": "pass",
      "evidence": "audio engineering: loudness normalization is applied"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "chunking_for_long_text_with_pauses",
      "status": "pass",
      "evidence": "audio engineering: chunking for long text (keep-alive + pauses) is in place"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "caching_synthesized_segments_for_repeat_text",
      "status": "pass",
      "evidence": "audio engineering: synthesized segments are cached for repeat text"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "time_to_first_audio_budget_stated",
      "status": "pass",
      "evidence": "latency budgets: a time-to-first-audio target for interactive use is stated"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "latency_measured_against_stated_budget",
      "status": "pass",
      "evidence": "latency budgets / quality gate: latency is measured against a stated budget \u2014 measure latency honestly"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "chunked_synthesis",
      "status": "pass",
      "evidence": "latency budgets: chunked synthesis is used"
    },
    {
      "section": "audio_engineering_and_latency",
      "check": "interruption_barge_in_when_assistant_use",
      "status": "fail",
      "evidence": "latency budgets: interruption/barge-in handling is in place when assistant interactive use is declared present"
    },
    {
      "section": "accessibility",
      "check": "speed_controls_present",
      "status": "pass",
      "evidence": "accessibility / quality gate: speed controls are present"
    },
    {
      "section": "accessibility",
      "check": "pitch_controls_present",
      "status": "pass",
      "evidence": "accessibility / quality gate: pitch controls are present"
    },
    {
      "section": "accessibility",
      "check": "captions_or_transcripts_wired",
      "status": "pass",
      "evidence": "accessibility / quality gate: captions/transcripts from STT are wired"
    },
    {
      "section": "accessibility",
      "check": "keyboard_operable_players",
      "status": "pass",
      "evidence": "accessibility: players are keyboard-operable \u2014 audio users are users"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "golden_audio_regressions_in_test_loop",
      "status": "pass",
      "evidence": "testing / quality gate: golden-sample regressions are in the test loop"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "golden_hash_and_human_spot_checks",
      "status": "pass",
      "evidence": "testing: golden-audio regressions use hash + human spot-checks"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "noisy_input_stt_tests",
      "status": "pass",
      "evidence": "testing: noisy-input STT tests are run"
    },
    {
      "section": "testing_and_quality_gates",
      "check": "pronunciation_dictionaries_for_names_numbers_code",
      "status": "pass",
      "evidence": "testing: pronunciation dictionaries for names/numbers/code are in place"
    }
  ],
  "computed_status": "outside_stated_limits_on_declared_evidence",
  "engines_count": 1,
  "engines_without_license_clearance": [
    "bad_engine"
  ],
  "license_coverage": "0.000000",
  "engines_without_golden_sentence_evaluation": [
    "bad_engine"
  ],
  "golden_evaluation_coverage": "0.000000",
  "cloning_engines_without_consent_recorded": [
    "bad_engine"
  ],
  "summary": "24 pass, 6 fail, 0 missing of 30 checks across five sections.",
  "stamp": "LOCAL VOICE STACK ENGINEERING PACK\nstack: bad-stack\nVERDICT: LOCAL_VOICE_STACK_NOT_SOUND\n  pipeline_and_engine_selection        fail\n  cloning_consent_and_ethics           fail\n  audio_engineering_and_latency        fail\n  accessibility                        pass\n  testing_and_quality_gates            pass\n24 pass, 6 fail, 0 missing of 30 checks across five sections."
}
```

### Example 3 — Malformed (case `malformed`)

Provenance: recorded 2026-11-16T06:30:16.958985+00:00 against gateway v1.1.0, source `verification/work/local-voice-stack-engineering-pack/evidence.json`.

Input:

```json
{
  "stack": "malformed-stack",
  "pipeline": "not-an-object"
}
```

Response (HTTP 422):

```json
{
  "ok": false,
  "error": "invalid_input",
  "field": "pipeline",
  "detail": "pipeline must be an object"
}
```

## Documentation standard checklist

| Item | Status |
|---|---|
| Diátaxis quadrants present | Yes — Tutorial, How-to guides, Reference, Explanation |
| Role views present | Integrators (Users) Yes · Developers Yes · Ops Yes · Regulators N/A — this atom audits a declared local voice-stack engineering record; its verdict is a completeness and consistency judgment on declared evidence, not compliance evidence and not a legal/ethics certification, and legal sufficiency of consent, disclosure or licensing is not judged. |
| Checks named | 30 documented / 30 recorded in the full-pass response |
| Verdict vocabulary complete | Yes — 3 verdicts, `computed_status` (2 values + null), 3 section statuses, 3 per-check statuses (not-applicable expressed as a gated `pass`), plus the secondary computed fields (`engines_count`, the three row-name lists, and the two coverage ratios, with their null rules) |
| Input reference typed | Yes — 42 fields, each with its type from SERVICE.md, or, where SERVICE.md states no type (section containers and the engine-row object), grounded in the recorded evidence inputs and marked as such |
| Worked examples verbatim-verified | Yes — full-pass, violations and malformed inputs and REST responses parsed and compared as JSON values against `verification/work/local-voice-stack-engineering-pack/evidence.json` |
