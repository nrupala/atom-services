#!/usr/bin/env python3
"""Local voice stack engineering pack — deterministic core.

Built from the bound skill `voice-and-speech-engineering`: "Build
local voice & speech stacks — TTS/STT selection, cloning consent,
latency, audio quality, accessibility."

This atom is an AUDIT of a declared local voice-stack engineering
record: it validates the record a caller declares against the
skill's method — pipeline first, engine selection, cloning ethics
& law, audio engineering, latency budgets, accessibility, and
testing — and its quality gates and red lines. It does not build
a voice stack, synthesize or transcribe audio, run or benchmark
an engine, or verify that a declared control actually works — it
checks that the record the skill requires is present and
internally complete and consistent on the declared evidence.

The caller submits a voice-stack manifest (a dict, or JSON on the
CLI). Every check reads declared manifest fields:

- field present and true/valid   -> pass
- field present and false/invalid -> fail
- field absent                    -> missing (evidence not provided)

Computed checks use ONLY what the skill itself states, plus the
consistency of the declared rows themselves — no outside
threshold is imported:

- engines: the declared `engines` list must be non-empty, and
  every declared engine row must show its license cleared for
  the intended (commercial) use and evaluation on the caller's
  own golden sentences (the skill: "license cleared for the
  intended use (commercial!)"; "evaluate on YOUR golden
  sentences — not vendor demos");
- cloning engines: every engine row declared as a voice-cloning
  engine must declare consent recorded (the skill's red line:
  "Never clone without consent").

Computed ratios are serialized as strings with exactly six
decimal places, produced in both implementations by the same
fixed rule — round half up to 6dp, floor(v * 1000000 + 0.5) /
1000000, then format with exactly six decimals; comparisons use
the unrounded values. That fixed serialization is what makes the
Python and TypeScript outputs byte-identical. Counts are reported
as integers (exact).

The skill states no numeric threshold — no time-to-first-audio
or latency budget in milliseconds, no word-error rate, no audio
quality / MOS score, no sample rate or bitrate, no loudness
target, no CPU/GPU footprint or model-size limit, no language
count — so no numeric threshold check is invented; those
quantities are caller attestations at most (the record declares
that a budget is stated and latency measured against it), and
quantities here are computed and reported, with completeness
(every declared engine) as the only bar, exactly as stated above.

Verdict:
- any fail             -> LOCAL_VOICE_STACK_NOT_SOUND
- no fail, any missing -> INSUFFICIENT_EVIDENCE
- all pass             -> LOCAL_VOICE_STACK_SOUND

No model call, no network, no clock dependence: the same manifest
always produces the same verdict. That determinism is the product.
"""
import json
import math
import sys

SECTIONS = (
    "pipeline_and_engine_selection",
    "cloning_consent_and_ethics",
    "audio_engineering_and_latency",
    "accessibility",
    "testing_and_quality_gates",
)

MANIFEST_SPEC = {
    "stack": "string",
    "pipeline": {
        "tts_stt_or_both_scope_declared": "boolean",
        "streaming_vs_file_output_declared": "boolean",
        "local_first_by_default": "boolean",
    },
    "engine_selection": {
        "quality_latency_footprint_evaluated": "boolean",
        "language_coverage_addressed": "boolean",
    },
    "engines": [{
        "name": "string",
        "license_cleared_for_commercial_use": "boolean",
        "evaluated_on_own_golden_sentences": "boolean",
        "is_voice_cloning": "boolean",
        "cloning_consent_recorded": "boolean",
    }],
    "cloning": {
        "impersonation_present": "boolean",
        "covert_recording_present": "boolean",
        "synthetic_audio_disclosure_where_required": "boolean",
        "voice_profiles_encrypted_at_rest": "boolean",
        "deletion_honored": "boolean",
    },
    "audio_engineering": {
        "sample_rate_and_format_choices_declared": "boolean",
        "loudness_normalization_applied": "boolean",
        "chunking_for_long_text_with_pauses": "boolean",
        "caching_synthesized_segments_for_repeat_text": "boolean",
    },
    "latency": {
        "time_to_first_audio_budget_stated": "boolean",
        "latency_measured_against_stated_budget": "boolean",
        "chunked_synthesis": "boolean",
        "assistant_interactive_use_present": "boolean",
        "interruption_barge_in_handling": "boolean",
    },
    "accessibility": {
        "speed_controls_present": "boolean",
        "pitch_controls_present": "boolean",
        "captions_or_transcripts_wired": "boolean",
        "keyboard_operable_players": "boolean",
    },
    "testing": {
        "golden_audio_regressions_in_test_loop": "boolean",
        "golden_hash_and_human_spot_checks": "boolean",
        "noisy_input_stt_tests": "boolean",
        "pronunciation_dictionaries_for_names_numbers_code": "boolean",
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


def _row_name(entry):
    if isinstance(entry, dict) and isinstance(entry.get("name"), str):
        return entry["name"]
    return "unnamed"


def evaluate(manifest):
    """Return the verdict dict for a voice-stack manifest."""
    if not isinstance(manifest, dict):
        raise TypeError("manifest must be a JSON object")
    _validate_manifest(manifest)
    results = []

    # ---- Declared rows, read once for the computed checks ----
    engines, has_engines = _get(manifest, "engines")
    engines_is_list = has_engines and isinstance(engines, list)
    engines_count = len(engines) if engines_is_list else None
    rows = engines if engines_is_list else []

    engines_without_license = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "license_cleared_for_commercial_use" in c
         and c.get("license_cleared_for_commercial_use") is not True]
        if engines_is_list else None
    )
    engines_without_golden_evaluation = (
        [_row_name(c) for c in rows
         if isinstance(c, dict)
         and "evaluated_on_own_golden_sentences" in c
         and c.get("evaluated_on_own_golden_sentences") is not True]
        if engines_is_list else None
    )
    cloning_rows = [
        c for c in rows
        if isinstance(c, dict) and c.get("is_voice_cloning") is True
    ]
    cloning_engines_without_consent = (
        [_row_name(c) for c in cloning_rows
         if "cloning_consent_recorded" in c
         and c.get("cloning_consent_recorded") is not True]
        if engines_is_list else None
    )
    license_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("license_cleared_for_commercial_use") is True)
        / engines_count
        if engines_is_list and engines_count > 0 else None
    )
    golden_evaluation_coverage = (
        sum(1 for c in rows
            if isinstance(c, dict)
            and c.get("evaluated_on_own_golden_sentences") is True)
        / engines_count
        if engines_is_list and engines_count > 0 else None
    )

    # ---- Section 1: pipeline_and_engine_selection (skill:
    #      method 1 pipeline first — TTS, STT, or both; streaming
    #      vs file output; device-side vs server, local-first by
    #      default. Method 2 engine selection — quality vs latency
    #      vs footprint (CPU/GPU); license cleared; language
    #      coverage; evaluate on YOUR golden sentences) ----
    _bool_check(results, "pipeline_and_engine_selection",
                "pipeline_scope_declared", manifest,
                ("pipeline", "tts_stt_or_both_scope_declared"),
                "pipeline first: the pipeline scope — TTS "
                "(synthesis), STT (transcription), or both — is "
                "declared")
    _bool_check(results, "pipeline_and_engine_selection",
                "output_mode_declared", manifest,
                ("pipeline", "streaming_vs_file_output_declared"),
                "pipeline first: streaming vs file output is "
                "declared")
    _bool_check(results, "pipeline_and_engine_selection",
                "local_first_by_default", manifest,
                ("pipeline", "local_first_by_default"),
                "pipeline first: device-side vs server is decided "
                "local-first by default — run it local where it "
                "matters")
    _bool_check(results, "pipeline_and_engine_selection",
                "quality_latency_footprint_evaluated", manifest,
                ("engine_selection",
                 "quality_latency_footprint_evaluated"),
                "engine selection: quality vs latency vs footprint "
                "(CPU/GPU) is evaluated")
    _bool_check(results, "pipeline_and_engine_selection",
                "language_coverage_addressed", manifest,
                ("engine_selection", "language_coverage_addressed"),
                "engine selection: language coverage is addressed")
    _check(results, "pipeline_and_engine_selection",
           "engines_declared", engines, engines_is_list,
           engines_is_list and engines_count > 0,
           "the declared record names its engines — the engines "
           "list is present and non-empty")
    license_present = (
        engines_is_list
        and all(isinstance(c, dict)
                and "license_cleared_for_commercial_use" in c
                for c in rows)
    )
    _check(results, "pipeline_and_engine_selection",
           "every_engine_license_cleared_for_commercial_use",
           engines, license_present,
           engines_is_list and engines_count > 0
           and all(isinstance(c, dict)
                   and c.get("license_cleared_for_commercial_use")
                   is True for c in rows),
           "engine selection / quality gate: every declared "
           "engine row declares its license cleared for the "
           "intended use (commercial)")
    golden_present = (
        engines_is_list
        and all(isinstance(c, dict)
                and "evaluated_on_own_golden_sentences" in c
                for c in rows)
    )
    _check(results, "pipeline_and_engine_selection",
           "every_engine_evaluated_on_own_golden_sentences",
           engines, golden_present,
           engines_is_list and engines_count > 0
           and all(isinstance(c, dict)
                   and c.get("evaluated_on_own_golden_sentences")
                   is True for c in rows),
           "engine selection: every declared engine row declares "
           "evaluation on the caller's own golden sentences — "
           "not vendor demos")

    # ---- Section 2: cloning_consent_and_ethics (skill: method 3
    #      cloning ethics & law — explicit, recorded consent for
    #      any real-person voice; no impersonation; synthetic-audio
    #      disclosure where required; voice profiles encrypted at
    #      rest; deletion honored. Red lines — never clone without
    #      consent; no covert recording; disclose synthetic audio
    #      where context demands it) ----
    _false_check(results, "cloning_consent_and_ethics",
                 "no_impersonation", manifest,
                 ("cloning", "impersonation_present"),
                 "cloning ethics & law / red line: no impersonation "
                 "is present in the declared design")
    _false_check(results, "cloning_consent_and_ethics",
                 "no_covert_recording", manifest,
                 ("cloning", "covert_recording_present"),
                 "red line: no covert recording is present in the "
                 "declared design")
    _bool_check(results, "cloning_consent_and_ethics",
                "synthetic_audio_disclosure_where_required", manifest,
                ("cloning",
                 "synthetic_audio_disclosure_where_required"),
                "cloning ethics & law / red line: synthetic audio "
                "is disclosed where required — where context "
                "demands it")
    _bool_check(results, "cloning_consent_and_ethics",
                "voice_profiles_encrypted_at_rest", manifest,
                ("cloning", "voice_profiles_encrypted_at_rest"),
                "cloning ethics & law: voice profiles are "
                "encrypted at rest — cloned voices are treated as "
                "the sensitive thing they are")
    _bool_check(results, "cloning_consent_and_ethics",
                "deletion_honored", manifest,
                ("cloning", "deletion_honored"),
                "cloning ethics & law: deletion of voice profiles "
                "is honored")
    cloning_gate_present = (
        engines_is_list
        and all(isinstance(c, dict) and "is_voice_cloning" in c
                for c in rows)
    )
    cloning_present = (
        engines_is_list and cloning_gate_present
        and all("cloning_consent_recorded" in c for c in cloning_rows)
    )
    _check(results, "cloning_consent_and_ethics",
           "every_cloning_engine_has_consent_recorded", engines,
           cloning_present,
           engines_is_list
           and all(c.get("cloning_consent_recorded") is True
                   for c in cloning_rows),
           "cloning ethics & law / quality gate / red line: every "
           "engine row declared as a voice-cloning engine "
           "declares explicit, recorded consent for the "
           "real-person voice — never clone without consent")

    # ---- Section 3: audio_engineering_and_latency (skill:
    #      method 4 audio engineering — sample-rate/format choices
    #      (wav/opus), loudness normalization, chunking for long
    #      text (keep-alive + pauses), caching synthesized
    #      segments for repeat text. Method 5 latency budgets —
    #      time-to-first-audio target for interactive use; chunked
    #      synthesis; interruption/barge-in handling for
    #      assistants. Quality gate — latency measured against a
    #      stated budget) ----
    _bool_check(results, "audio_engineering_and_latency",
                "sample_rate_and_format_choices_declared", manifest,
                ("audio_engineering",
                 "sample_rate_and_format_choices_declared"),
                "audio engineering: sample-rate/format choices "
                "(wav/opus) are declared")
    _bool_check(results, "audio_engineering_and_latency",
                "loudness_normalization_applied", manifest,
                ("audio_engineering", "loudness_normalization_applied"),
                "audio engineering: loudness normalization is "
                "applied")
    _bool_check(results, "audio_engineering_and_latency",
                "chunking_for_long_text_with_pauses", manifest,
                ("audio_engineering",
                 "chunking_for_long_text_with_pauses"),
                "audio engineering: chunking for long text "
                "(keep-alive + pauses) is in place")
    _bool_check(results, "audio_engineering_and_latency",
                "caching_synthesized_segments_for_repeat_text",
                manifest,
                ("audio_engineering",
                 "caching_synthesized_segments_for_repeat_text"),
                "audio engineering: synthesized segments are "
                "cached for repeat text")
    _bool_check(results, "audio_engineering_and_latency",
                "time_to_first_audio_budget_stated", manifest,
                ("latency", "time_to_first_audio_budget_stated"),
                "latency budgets: a time-to-first-audio target for "
                "interactive use is stated")
    _bool_check(results, "audio_engineering_and_latency",
                "latency_measured_against_stated_budget", manifest,
                ("latency", "latency_measured_against_stated_budget"),
                "latency budgets / quality gate: latency is "
                "measured against a stated budget — measure "
                "latency honestly")
    _bool_check(results, "audio_engineering_and_latency",
                "chunked_synthesis", manifest,
                ("latency", "chunked_synthesis"),
                "latency budgets: chunked synthesis is used")
    _gated_bool_check(
        results, "audio_engineering_and_latency",
        "interruption_barge_in_when_assistant_use", manifest,
        ("latency", "assistant_interactive_use_present"),
        ("latency", "interruption_barge_in_handling"),
        "latency budgets: interruption/barge-in handling is in "
        "place when assistant interactive use is declared present",
        "no assistant interactive use declared")

    # ---- Section 4: accessibility (skill: method 6 accessibility
    #      — speed/pitch controls, captions/transcripts from STT,
    #      keyboard-operable players — audio users are users.
    #      Quality gate — accessibility controls present;
    #      transcripts/captions wired) ----
    _bool_check(results, "accessibility",
                "speed_controls_present", manifest,
                ("accessibility", "speed_controls_present"),
                "accessibility / quality gate: speed controls are "
                "present")
    _bool_check(results, "accessibility",
                "pitch_controls_present", manifest,
                ("accessibility", "pitch_controls_present"),
                "accessibility / quality gate: pitch controls are "
                "present")
    _bool_check(results, "accessibility",
                "captions_or_transcripts_wired", manifest,
                ("accessibility", "captions_or_transcripts_wired"),
                "accessibility / quality gate: captions/transcripts "
                "from STT are wired")
    _bool_check(results, "accessibility",
                "keyboard_operable_players", manifest,
                ("accessibility", "keyboard_operable_players"),
                "accessibility: players are keyboard-operable — "
                "audio users are users")

    # ---- Section 5: testing_and_quality_gates (skill: method 7
    #      testing — golden-audio regressions (hash + human
    #      spot-checks); noisy-input STT tests; pronunciation
    #      dictionaries for names/numbers/code. Quality gate —
    #      golden-sample regressions in the test loop) ----
    _bool_check(results, "testing_and_quality_gates",
                "golden_audio_regressions_in_test_loop", manifest,
                ("testing", "golden_audio_regressions_in_test_loop"),
                "testing / quality gate: golden-sample regressions "
                "are in the test loop")
    _bool_check(results, "testing_and_quality_gates",
                "golden_hash_and_human_spot_checks", manifest,
                ("testing", "golden_hash_and_human_spot_checks"),
                "testing: golden-audio regressions use hash + "
                "human spot-checks")
    _bool_check(results, "testing_and_quality_gates",
                "noisy_input_stt_tests", manifest,
                ("testing", "noisy_input_stt_tests"),
                "testing: noisy-input STT tests are run")
    _bool_check(results, "testing_and_quality_gates",
                "pronunciation_dictionaries_for_names_numbers_code",
                manifest,
                ("testing",
                 "pronunciation_dictionaries_for_names_numbers_code"),
                "testing: pronunciation dictionaries for "
                "names/numbers/code are in place")

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
        verdict = "LOCAL_VOICE_STACK_NOT_SOUND"
    elif any(v == "insufficient_evidence" for v in sections.values()):
        verdict = "INSUFFICIENT_EVIDENCE"
    else:
        verdict = "LOCAL_VOICE_STACK_SOUND"

    computed_names = (
        "engines_declared",
        "every_engine_license_cleared_for_commercial_use",
        "every_engine_evaluated_on_own_golden_sentences",
        "every_cloning_engine_has_consent_recorded",
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
        "service": "local-voice-stack-engineering-pack",
        "atom_version": "0.1.0",
        "stack": manifest.get("stack"),
        "verdict": verdict,
        "sections": sections,
        "checks": results,
        "computed_status": computed_status,
        "engines_count": engines_count,
        "engines_without_license_clearance": engines_without_license,
        "license_coverage": _fmt6(license_coverage),
        "engines_without_golden_sentence_evaluation":
            engines_without_golden_evaluation,
        "golden_evaluation_coverage": _fmt6(golden_evaluation_coverage),
        "cloning_engines_without_consent_recorded":
            cloning_engines_without_consent,
        "summary": (
            f"{sum(1 for r in results if r['status'] == 'pass')} pass, "
            f"{sum(1 for r in results if r['status'] == 'fail')} fail, "
            f"{sum(1 for r in results if r['status'] == 'missing')} missing "
            f"of {len(results)} checks across five sections."
        ),
    }


def stamp(verdict):
    """Human-readable stamp of a verdict dict."""
    lines = [
        "LOCAL VOICE STACK ENGINEERING PACK",
        f"stack: {verdict.get('stack')}",
        f"VERDICT: {verdict['verdict']}",
    ]
    for section in SECTIONS:
        lines.append(f"  {section:<36} {verdict['sections'][section]}")
    lines.append(verdict["summary"])
    return "\n".join(lines)


def main(argv):
    if len(argv) != 2:
        print("usage: local_voice_stack_engineering_pack.py "
              "<manifest.json>", file=sys.stderr)
        return 2
    with open(argv[1], encoding="utf-8") as fh:
        manifest = json.load(fh)
    verdict = evaluate(manifest)
    print(json.dumps(verdict, indent=2))
    print()
    print(stamp(verdict))
    return 0 if verdict["verdict"] == "LOCAL_VOICE_STACK_SOUND" else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
