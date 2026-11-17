import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from voice_note_narration_audio import evaluate, stamp  # noqa: E402

COMPLETE = {
    "production_title": "walk-briefing-audio",
    "scoping": {"kind_confirmed": True,
                "production_kind": "narration",
                "audience_noted": True,
                "audience_scope": "includes_others",
                "voice_confirmed_before_generation": True,
                "register_confirmed_before_generation": True,
                "target_length_confirmed_before_generation": True,
                "confirmations_completed_before_generation": True},
    "voice": {"voice_kind": "original_synthetic",
              "voice_selected_before_generation": True,
              "uses_real_person_voice": False,
              "real_person_voice_consent_recorded": False,
              "voice_consent_declared": True},
    "rights": {"source_text_reproduction_right_declared": True,
               "rights_basis_recorded": True},
    "adaptation": {"abbreviations_expanded": True,
                   "long_sentences_broken": True,
                   "numbers_spelled_out": True,
                   "links_removed": True,
                   "tables_and_formatting_removed": True,
                   "text_adapted_not_read_raw": True,
                   "adaptation_reviewed_for_meaning_preservation": True},
    "chunking": {"long_text_chunked_at_natural_breaks_where_long": True,
                 "narrated_chunk_by_chunk": True},
    "segments": [
        {"segment_id": "seg-1", "section_label": "Opening",
         "sequence_position": 1, "duration_seconds": 62.5},
        {"segment_id": "seg-2", "section_label": "Middle",
         "sequence_position": 2, "duration_seconds": 120.25},
        {"segment_id": "seg-3", "section_label": "Close",
         "sequence_position": 3, "duration_seconds": 45.25},
    ],
    "audio_spec": {"file_format": "mp3"},
    "assembly": {"audio_generated_through_voice_stack": True,
                 "opening_spot_checked_for_clarity_and_pace": True,
                 "middle_spot_checked_for_clarity_and_pace": True,
                 "chunks_assembled_into_one_file": True,
                 "assembled_order_verified": True,
                 "assembly_completeness_verified": True,
                 "total_duration_seconds_declared": 228},
    "delivery": {"audio_file_delivered": True,
                 "total_duration_stated_in_delivery": True,
                 "played_through_voice_stack_only_if_requested": True,
                 "recipient_matches_declared_audience": True,
                 "ai_voice_disclosure_made": True},
    "red_lines": {"voice_cloned_or_imitated_without_consent_present": False,
                  "voice_note_sent_to_other_without_ai_disclosure_present": False,
                  "text_narrated_without_reproduction_right_present": False,
                  "generated_audio_presented_as_real_event_recording_present": False,
                  "source_meaning_changed_in_adaptation_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "VOICE_NOTE_NARRATION_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 46)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["voice_note_segments_count"], 3)
        self.assertEqual(v["duplicate_voice_note_segment_ids"], [])
        self.assertEqual(v["voice_note_segment_duration_total"], "228.000000")
        self.assertEqual(v["voice_note_total_duration_declared"], "228.000000")
        self.assertEqual(v["segment_sequence_coverage_ratio"], "1.000000")
        self.assertEqual(v["segment_section_label_ratio"], "1.000000")

    def test_kind_not_confirmed_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["scoping"]["kind_confirmed"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "VOICE_NOTE_NARRATION_NOT_SOUND")
        self.assertEqual(
            v["sections"]["production_scoping_and_confirmation"], "fail")
        self.assertEqual(
            check_status(v, "voice_note_narration_kind_confirmed"), "fail")

    def test_invalid_production_kind_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scoping"]["production_kind"] = "podcast_episode"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "voice_note_narration_production_kind_recognised"),
            "fail")

    def test_voice_note_kind_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["scoping"]["production_kind"] = "voice_note"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "voice_note_narration_production_kind_recognised"),
            "pass")
        self.assertEqual(v["verdict"], "VOICE_NOTE_NARRATION_SOUND")

    def test_invalid_audience_scope_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["scoping"]["audience_scope"] = "public"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "voice_note_narration_audience_scope_recognised"),
            "fail")

    def test_real_person_voice_without_consent_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["voice"]["uses_real_person_voice"] = True
        m["voice"]["voice_kind"] = "real_person_voice"
        m["voice"]["real_person_voice_consent_recorded"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "voice_note_narration_real_person_voice_consent_recorded_where_real_person_voice_used"),
            "fail")

    def test_real_person_voice_with_consent_passes_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["voice"]["uses_real_person_voice"] = True
        m["voice"]["voice_kind"] = "real_person_voice"
        m["voice"]["real_person_voice_consent_recorded"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "voice_note_narration_real_person_voice_consent_recorded_where_real_person_voice_used"),
            "pass")
        self.assertEqual(v["verdict"], "VOICE_NOTE_NARRATION_SOUND")

    def test_no_real_person_voice_passes_gated_as_na(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            check_status(
                v,
                "voice_note_narration_real_person_voice_consent_recorded_where_real_person_voice_used"),
            "pass")

    def test_missing_voice_consent_declaration_fails_red_line_class(self):
        # Red-line class: absence fails, it is never merely missing.
        m = copy.deepcopy(COMPLETE)
        del m["voice"]["voice_consent_declared"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "voice_note_narration_record_declares_voice_consent"),
            "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "VOICE_NOTE_NARRATION_NOT_SOUND")

    def test_false_voice_consent_declaration_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["voice"]["voice_consent_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "voice_note_narration_record_declares_voice_consent"),
            "fail")

    def test_numbers_not_spelled_out_fails_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["adaptation"]["numbers_spelled_out"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["text_adaptation_for_listening"], "fail")
        self.assertEqual(
            check_status(v, "voice_note_narration_numbers_spelled_out"),
            "fail")

    def test_duplicate_segment_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["segments"][1]["segment_id"] = "seg-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_voice_note_narration_segment_id_unique"),
            "fail")
        self.assertEqual(v["duplicate_voice_note_segment_ids"], ["seg-1"])

    def test_empty_segments_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["segments"] = []
        m["assembly"]["total_duration_seconds_declared"] = 0
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "voice_note_narration_segments_list_declared"),
            "fail")
        self.assertEqual(v["voice_note_segments_count"], 0)
        self.assertIsNone(v["segment_sequence_coverage_ratio"])

    def test_absent_segments_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["segments"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "voice_note_narration_segments_list_declared"),
            "missing")
        self.assertIsNone(v["voice_note_segments_count"])
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["voice_note_segment_duration_total"])

    def test_empty_section_label_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["segments"][1]["section_label"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_voice_note_narration_segment_section_label_declared"),
            "fail")
        self.assertEqual(v["voice_note_segments_without_section_label"],
                         ["seg-2"])
        self.assertEqual(v["segment_section_label_ratio"], "0.666667")

    def test_zero_duration_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["segments"][0]["duration_seconds"] = 0
        m["assembly"]["total_duration_seconds_declared"] = 165.5
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_voice_note_narration_segment_duration_positive"),
            "fail")
        self.assertEqual(
            v["voice_note_segments_with_non_positive_duration"], ["seg-1"])

    def test_sequence_gap_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["segments"][2]["sequence_position"] = 4
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "voice_note_narration_segment_sequence_complete"),
            "fail")
        self.assertEqual(
            v["voice_note_segments_with_invalid_sequence_position"],
            ["seg-3"])
        self.assertEqual(v["segment_sequence_coverage_ratio"], "0.666667")

    def test_sequence_duplicate_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["segments"][2]["sequence_position"] = 2
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "voice_note_narration_segment_sequence_complete"),
            "fail")
        self.assertEqual(
            v["voice_note_segments_with_invalid_sequence_position"],
            ["seg-3"])

    def test_sequence_reordered_still_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["segments"][0]["sequence_position"] = 2
        m["segments"][1]["sequence_position"] = 1
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "voice_note_narration_segment_sequence_complete"),
            "pass")
        self.assertEqual(v["verdict"], "VOICE_NOTE_NARRATION_SOUND")

    def test_segment_missing_duration_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["segments"][0]["duration_seconds"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_voice_note_narration_segment_duration_positive"),
            "missing")

    def test_invalid_file_format_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["audio_spec"]["file_format"] = "aiff"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "voice_note_narration_audio_file_format_recognised"),
            "fail")

    def test_total_duration_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["assembly"]["total_duration_seconds_declared"] = 230
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "voice_note_narration_total_duration_recomputes_from_segments"),
            "fail")
        self.assertEqual(v["voice_note_total_duration_declared"], "230.000000")
        self.assertEqual(v["voice_note_segment_duration_total"], "228.000000")

    def test_middle_not_spot_checked_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["assembly"]["middle_spot_checked_for_clarity_and_pace"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["audio_spec_and_assembly"], "fail")

    def test_disclosure_missing_where_audience_includes_others_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["delivery"]["ai_voice_disclosure_made"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "voice_note_narration_ai_voice_disclosure_made_where_audience_includes_others"),
            "fail")

    def test_disclosure_not_owed_for_self_only_audience(self):
        m = copy.deepcopy(COMPLETE)
        m["scoping"]["audience_scope"] = "self_only"
        m["delivery"]["ai_voice_disclosure_made"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "voice_note_narration_ai_voice_disclosure_made_where_audience_includes_others"),
            "pass")
        self.assertEqual(v["verdict"], "VOICE_NOTE_NARRATION_SOUND")

    def test_clone_without_consent_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["voice_cloned_or_imitated_without_consent_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "VOICE_NOTE_NARRATION_NOT_SOUND")

    def test_meaning_changed_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["source_meaning_changed_in_adaptation_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "voice_note_narration_free_of_source_meaning_changed_in_adaptation"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["adaptation"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["text_adaptation_for_listening"],
                         "insufficient_evidence")

    def test_empty_manifest_fails_only_on_consent_red_line_class(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "VOICE_NOTE_NARRATION_NOT_SOUND")
        self.assertEqual(v["sections"]["red_lines"], "fail")
        statuses = {c["check"]: c["status"] for c in v["checks"]}
        self.assertEqual(
            statuses["voice_note_narration_record_declares_voice_consent"],
            "fail")
        others = [s for name, s in statuses.items()
                  if name != "voice_note_narration_record_declares_voice_consent"]
        self.assertTrue(all(s == "missing" for s in others))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["voice_note_segments_count"])
        self.assertIsNone(v["segment_sequence_coverage_ratio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: VOICE_NOTE_NARRATION_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["production_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("production_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"scoping": "should-be-an-object"})
        self.assertIn("scoping", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"segments": {"segment_id": "seg-1"}})
        self.assertIn("segments", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"segments": ["seg-1"]})
        self.assertIn("segments[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["scoping"]["kind_confirmed"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("scoping.kind_confirmed", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["segments"][0]["duration_seconds"] = "62.5"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("segments[0].duration_seconds", str(ctx.exception))

    def test_enum_leaf_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["scoping"]["production_kind"] = 7
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("scoping.production_kind", str(ctx.exception))

    def test_total_duration_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["assembly"]["total_duration_seconds_declared"] = "228"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("assembly.total_duration_seconds_declared",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["delivery"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("delivery", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
