import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from local_voice_stack_engineering_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "stack": "reader-voice",
    "pipeline": {"tts_stt_or_both_scope_declared": True,
                 "streaming_vs_file_output_declared": True,
                 "local_first_by_default": True},
    "engine_selection": {"quality_latency_footprint_evaluated": True,
                         "language_coverage_addressed": True},
    "engines": [
        {"name": "local-tts",
         "license_cleared_for_commercial_use": True,
         "evaluated_on_own_golden_sentences": True,
         "is_voice_cloning": False},
        {"name": "cloning-tts",
         "license_cleared_for_commercial_use": True,
         "evaluated_on_own_golden_sentences": True,
         "is_voice_cloning": True,
         "cloning_consent_recorded": True},
        {"name": "local-stt",
         "license_cleared_for_commercial_use": True,
         "evaluated_on_own_golden_sentences": True,
         "is_voice_cloning": False},
    ],
    "cloning": {"impersonation_present": False,
                "covert_recording_present": False,
                "synthetic_audio_disclosure_where_required": True,
                "voice_profiles_encrypted_at_rest": True,
                "deletion_honored": True},
    "audio_engineering": {
        "sample_rate_and_format_choices_declared": True,
        "loudness_normalization_applied": True,
        "chunking_for_long_text_with_pauses": True,
        "caching_synthesized_segments_for_repeat_text": True},
    "latency": {"time_to_first_audio_budget_stated": True,
                "latency_measured_against_stated_budget": True,
                "chunked_synthesis": True,
                "assistant_interactive_use_present": True,
                "interruption_barge_in_handling": True},
    "accessibility": {"speed_controls_present": True,
                      "pitch_controls_present": True,
                      "captions_or_transcripts_wired": True,
                      "keyboard_operable_players": True},
    "testing": {"golden_audio_regressions_in_test_loop": True,
                "golden_hash_and_human_spot_checks": True,
                "noisy_input_stt_tests": True,
                "pronunciation_dictionaries_for_names_numbers_code": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "LOCAL_VOICE_STACK_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 30)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["engines_count"], 3)
        self.assertEqual(v["engines_without_license_clearance"], [])
        self.assertEqual(v["license_coverage"], "1.000000")
        self.assertEqual(v["engines_without_golden_sentence_evaluation"], [])
        self.assertEqual(v["golden_evaluation_coverage"], "1.000000")
        self.assertEqual(v["cloning_engines_without_consent_recorded"], [])

    def test_not_local_first_fails_pipeline_section(self):
        m = copy.deepcopy(COMPLETE)
        m["pipeline"]["local_first_by_default"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_VOICE_STACK_NOT_SOUND")
        self.assertEqual(
            v["sections"]["pipeline_and_engine_selection"], "fail")
        self.assertEqual(check_status(v, "local_first_by_default"), "fail")

    def test_language_coverage_not_addressed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["engine_selection"]["language_coverage_addressed"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_VOICE_STACK_NOT_SOUND")

    def test_engine_without_license_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["engines"][0]["license_cleared_for_commercial_use"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_VOICE_STACK_NOT_SOUND")
        self.assertEqual(
            check_status(
                v, "every_engine_license_cleared_for_commercial_use"),
            "fail")
        self.assertEqual(v["engines_without_license_clearance"],
                         ["local-tts"])
        self.assertEqual(v["license_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_engine_missing_license_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["engines"][0]["license_cleared_for_commercial_use"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_engine_license_cleared_for_commercial_use"),
            "missing")
        self.assertEqual(v["engines_without_license_clearance"], [])

    def test_engine_evaluated_on_vendor_demos_only_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["engines"][2]["evaluated_on_own_golden_sentences"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_engine_evaluated_on_own_golden_sentences"),
            "fail")
        self.assertEqual(
            v["engines_without_golden_sentence_evaluation"], ["local-stt"])
        self.assertEqual(v["golden_evaluation_coverage"], "0.666667")

    def test_empty_engines_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["engines"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "engines_declared"), "fail")
        self.assertEqual(v["engines_count"], 0)
        self.assertIsNone(v["license_coverage"])
        self.assertIsNone(v["golden_evaluation_coverage"])

    def test_impersonation_fails_cloning_section(self):
        m = copy.deepcopy(COMPLETE)
        m["cloning"]["impersonation_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_impersonation"), "fail")
        self.assertEqual(
            v["sections"]["cloning_consent_and_ethics"], "fail")

    def test_covert_recording_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["cloning"]["covert_recording_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_VOICE_STACK_NOT_SOUND")

    def test_no_synthetic_audio_disclosure_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["cloning"]["synthetic_audio_disclosure_where_required"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_VOICE_STACK_NOT_SOUND")

    def test_unencrypted_voice_profiles_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["cloning"]["voice_profiles_encrypted_at_rest"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_VOICE_STACK_NOT_SOUND")

    def test_cloning_engine_without_consent_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["engines"][1]["cloning_consent_recorded"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_VOICE_STACK_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_cloning_engine_has_consent_recorded"),
            "fail")
        self.assertEqual(v["cloning_engines_without_consent_recorded"],
                         ["cloning-tts"])

    def test_cloning_engine_missing_consent_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["engines"][1]["cloning_consent_recorded"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_cloning_engine_has_consent_recorded"),
            "missing")
        self.assertEqual(v["cloning_engines_without_consent_recorded"], [])

    def test_no_cloning_engines_passes_consent_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["engines"][1]["is_voice_cloning"] = False
        del m["engines"][1]["cloning_consent_recorded"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_VOICE_STACK_SOUND")
        self.assertEqual(
            check_status(v, "every_cloning_engine_has_consent_recorded"),
            "pass")

    def test_no_loudness_normalization_fails_audio_section(self):
        m = copy.deepcopy(COMPLETE)
        m["audio_engineering"]["loudness_normalization_applied"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_VOICE_STACK_NOT_SOUND")
        self.assertEqual(
            v["sections"]["audio_engineering_and_latency"], "fail")

    def test_latency_not_measured_against_budget_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["latency"]["latency_measured_against_stated_budget"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_VOICE_STACK_NOT_SOUND")

    def test_barge_in_missing_when_assistant_present_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["latency"]["interruption_barge_in_handling"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "interruption_barge_in_when_assistant_use"),
            "fail")

    def test_no_assistant_use_passes_barge_in_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["latency"] = {"time_to_first_audio_budget_stated": True,
                        "latency_measured_against_stated_budget": True,
                        "chunked_synthesis": True,
                        "assistant_interactive_use_present": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "LOCAL_VOICE_STACK_SOUND")
        self.assertEqual(
            check_status(v, "interruption_barge_in_when_assistant_use"),
            "pass")

    def test_barge_in_target_missing_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["latency"]["interruption_barge_in_handling"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "interruption_barge_in_when_assistant_use"),
            "missing")

    def test_no_captions_fails_accessibility_section(self):
        m = copy.deepcopy(COMPLETE)
        m["accessibility"]["captions_or_transcripts_wired"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "captions_or_transcripts_wired"),
                         "fail")
        self.assertEqual(v["sections"]["accessibility"], "fail")

    def test_non_keyboard_operable_players_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["accessibility"]["keyboard_operable_players"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_VOICE_STACK_NOT_SOUND")

    def test_no_golden_regressions_fails_testing_section(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["golden_audio_regressions_in_test_loop"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "golden_audio_regressions_in_test_loop"),
            "fail")
        self.assertEqual(
            v["sections"]["testing_and_quality_gates"], "fail")

    def test_no_noisy_input_tests_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["testing"]["noisy_input_stt_tests"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "LOCAL_VOICE_STACK_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["accessibility"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["accessibility"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["engines_count"])
        self.assertIsNone(v["engines_without_license_clearance"])
        self.assertIsNone(v["license_coverage"])
        self.assertIsNone(v["engines_without_golden_sentence_evaluation"])
        self.assertIsNone(v["golden_evaluation_coverage"])
        self.assertIsNone(v["cloning_engines_without_consent_recorded"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: LOCAL_VOICE_STACK_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["stack"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("stack", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"latency": "should-be-an-object"})
        self.assertIn("latency", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"engines": {"name": "local-tts"}})
        self.assertIn("engines", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"engines": ["local-tts"]})
        self.assertIn("engines[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["latency"]["chunked_synthesis"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("latency.chunked_synthesis", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["engines"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("engines[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["engines"][1]["is_voice_cloning"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("engines[1].is_voice_cloning", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["cloning"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("cloning", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
