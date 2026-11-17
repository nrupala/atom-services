import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from meaning_first_translation_with_tone_note import evaluate, stamp  # noqa: E402

COMPLETE = {
    "document": "cousin-message",
    "context": {"source_language_identified": True,
                "target_language_identified": True,
                "purpose_identified": True,
                "whole_text_read_before_translation": True,
                "translated_for_meaning_not_word_for_word": True,
                "everyday_scope_not_software_localisation": True},
    "tone": {"register_preserved": True,
             "tone_and_intent_preserved": True,
             "tone_note_provided_for_sends": True,
             "tone_variant_offered_only_when_real_choice": True,
             "could_offend_or_mislead_phrases_flagged_first": True,
             "honorifics_and_family_terms_matched_to_relationship": True,
             "voice_preserved": True,
             "translation_ready_to_paste_or_speak_for_sends": True},
    "handling": {"idioms_flagged_and_explained": True,
                 "ambiguities_named_with_both_readings": True,
                 "flagged_items_given_short_note_not_lecture": True,
                 "uncertain_or_illegible_passages_marked_as_uncertain": True,
                 "source_unclear_uncertainty_and_reason_stated": True},
    "segments": [
        {"name": "greeting", "has_translation": True,
         "meaning_preserved": True,
         "idiom_ambiguity_handling_complete": True,
         "exact_carryover_checked": True},
        {"name": "visit-plan", "has_translation": True,
         "meaning_preserved": True,
         "idiom_ambiguity_handling_complete": True,
         "exact_carryover_checked": True},
        {"name": "closing", "has_translation": True,
         "meaning_preserved": True,
         "idiom_ambiguity_handling_complete": True,
         "exact_carryover_checked": True},
    ],
    "carryover": {"names_numbers_dates_figures_checked_one_by_one": True},
    "carryover_items": [
        {"name": "sender-name", "kind": "name",
         "matches_original_exactly": True},
        {"name": "visit-date", "kind": "date",
         "matches_original_exactly": True},
        {"name": "train-number", "kind": "number",
         "matches_original_exactly": True},
    ],
    "sensitive": {"sensitive_category_identified": True,
                  "translated_faithfully_and_completely_when_sensitive": True,
                  "nothing_summarised_away_when_sensitive": True,
                  "certified_translation_flag_raised_when_sensitive": True},
    "red_lines": {"draft_upgraded_to_official_present": False,
                  "idiom_flattened_or_firm_message_softened_silently_present": False,
                  "illegible_text_guessed_present": False,
                  "name_number_date_or_figure_changed_present": False,
                  "meaning_added_beyond_original_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "MEANING_FIRST_TRANSLATION_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 37)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["segments_count"], 3)
        self.assertEqual(v["segments_without_translation"], [])
        self.assertEqual(v["translation_coverage"], "1.000000")
        self.assertEqual(v["segments_without_meaning_preserved"], [])
        self.assertEqual(v["meaning_preserved_coverage"], "1.000000")
        self.assertEqual(v["segments_without_idiom_ambiguity_handling"], [])
        self.assertEqual(v["idiom_ambiguity_handling_coverage"], "1.000000")
        self.assertEqual(v["segments_without_exact_carryover_check"], [])
        self.assertEqual(v["exact_carryover_check_coverage"], "1.000000")
        self.assertEqual(v["carryover_items_count"], 3)
        self.assertEqual(v["carryover_items_not_matching"], [])
        self.assertEqual(v["exact_match_coverage"], "1.000000")
        self.assertEqual(v["carryover_items_with_invalid_kind"], [])
        self.assertEqual(v["valid_kind_coverage"], "1.000000")

    def test_whole_text_not_read_fails_context_section(self):
        m = copy.deepcopy(COMPLETE)
        m["context"]["whole_text_read_before_translation"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MEANING_FIRST_TRANSLATION_NOT_SOUND")
        self.assertEqual(v["sections"]["context_and_meaning_first_method"],
                         "fail")
        self.assertEqual(
            check_status(v, "whole_text_read_before_translation"), "fail")

    def test_word_for_word_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["context"]["translated_for_meaning_not_word_for_word"] = False
        self.assertEqual(
            check_status(evaluate(m),
                         "translated_for_meaning_not_word_for_word"), "fail")

    def test_segment_without_meaning_preserved_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["segments"][0]["meaning_preserved"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MEANING_FIRST_TRANSLATION_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_segment_meaning_preserved"), "fail")
        self.assertEqual(v["segments_without_meaning_preserved"], ["greeting"])
        self.assertEqual(v["meaning_preserved_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_segment_missing_meaning_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["segments"][0]["meaning_preserved"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_segment_meaning_preserved"), "missing")
        self.assertEqual(v["segments_without_meaning_preserved"], [])

    def test_no_tone_note_fails_tone_section(self):
        m = copy.deepcopy(COMPLETE)
        m["tone"]["tone_note_provided_for_sends"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MEANING_FIRST_TRANSLATION_NOT_SOUND")
        self.assertEqual(v["sections"]["register_tone_and_send_readiness"],
                         "fail")
        self.assertEqual(check_status(v, "tone_note_provided_for_sends"),
                         "fail")

    def test_register_not_preserved_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tone"]["register_preserved"] = False
        self.assertEqual(
            check_status(evaluate(m), "register_preserved"), "fail")

    def test_unflagged_offence_risk_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tone"]["could_offend_or_mislead_phrases_flagged_first"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "could_offend_or_mislead_phrases_flagged_first"), "fail")

    def test_idioms_not_flagged_fails_handling_section(self):
        m = copy.deepcopy(COMPLETE)
        m["handling"]["idioms_flagged_and_explained"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["idiom_ambiguity_and_uncertainty"],
                         "fail")
        self.assertEqual(check_status(v, "idioms_flagged_and_explained"),
                         "fail")

    def test_ambiguity_single_reading_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["handling"]["ambiguities_named_with_both_readings"] = False
        self.assertEqual(
            check_status(evaluate(m),
                         "ambiguities_named_with_both_readings"), "fail")

    def test_segment_handling_incomplete_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["segments"][1]["idiom_ambiguity_handling_complete"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_segment_idiom_ambiguity_handling_complete"),
            "fail")
        self.assertEqual(v["segments_without_idiom_ambiguity_handling"],
                         ["visit-plan"])
        self.assertEqual(v["idiom_ambiguity_handling_coverage"], "0.666667")

    def test_uncertain_passages_unmarked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["handling"][
            "uncertain_or_illegible_passages_marked_as_uncertain"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "uncertain_or_illegible_passages_marked_as_uncertain"),
            "fail")

    def test_empty_segments_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["segments"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "segments_declared"), "fail")
        self.assertEqual(v["segments_count"], 0)
        self.assertIsNone(v["translation_coverage"])
        self.assertIsNone(v["meaning_preserved_coverage"])
        self.assertIsNone(v["idiom_ambiguity_handling_coverage"])
        self.assertIsNone(v["exact_carryover_check_coverage"])

    def test_segment_without_translation_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["segments"][2]["has_translation"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_segment_has_translation"), "fail")
        self.assertEqual(v["segments_without_translation"], ["closing"])
        self.assertEqual(v["translation_coverage"], "0.666667")

    def test_segment_missing_translation_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["segments"][2]["has_translation"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_segment_has_translation"), "missing")
        self.assertEqual(v["segments_without_translation"], [])

    def test_segment_carryover_unchecked_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["segments"][0]["exact_carryover_checked"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_segment_exact_carryover_checked"),
            "fail")
        self.assertEqual(v["segments_without_exact_carryover_check"],
                         ["greeting"])
        self.assertEqual(v["exact_carryover_check_coverage"], "0.666667")

    def test_one_by_one_check_skipped_fails_carryover_section(self):
        m = copy.deepcopy(COMPLETE)
        m["carryover"]["names_numbers_dates_figures_checked_one_by_one"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["exact_carryover_and_segment_coverage"], "fail")

    def test_carryover_item_not_matching_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["carryover_items"][1]["matches_original_exactly"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_carryover_item_matches_exactly"), "fail")
        self.assertEqual(v["carryover_items_not_matching"], ["visit-date"])
        self.assertEqual(v["exact_match_coverage"], "0.666667")

    def test_carryover_item_with_invalid_kind_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["carryover_items"][0]["kind"] = "currency"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_carryover_kind_valid"), "fail")
        self.assertEqual(v["carryover_items_with_invalid_kind"],
                         ["sender-name"])
        self.assertEqual(v["valid_kind_coverage"], "0.666667")

    def test_carryover_item_missing_kind_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["carryover_items"][0]["kind"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_carryover_kind_valid"), "missing")
        self.assertEqual(v["carryover_items_with_invalid_kind"], [])

    def test_empty_carryover_list_passes_vacuously(self):
        m = copy.deepcopy(COMPLETE)
        m["carryover_items"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MEANING_FIRST_TRANSLATION_SOUND")
        self.assertEqual(
            check_status(v, "carryover_items_declared"), "pass")
        self.assertEqual(
            check_status(v, "every_carryover_item_matches_exactly"), "pass")
        self.assertEqual(v["carryover_items_count"], 0)
        self.assertIsNone(v["exact_match_coverage"])
        self.assertIsNone(v["valid_kind_coverage"])

    def test_absent_carryover_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["carryover_items"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "carryover_items_declared"), "missing")
        self.assertIsNone(v["carryover_items_count"])
        self.assertIsNone(v["carryover_items_not_matching"])

    def test_no_certified_flag_fails_sensitive_section(self):
        m = copy.deepcopy(COMPLETE)
        m["sensitive"]["certified_translation_flag_raised_when_sensitive"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MEANING_FIRST_TRANSLATION_NOT_SOUND")
        self.assertEqual(v["sections"]["sensitive_documents_and_red_lines"],
                         "fail")
        self.assertEqual(
            check_status(
                v, "certified_translation_flag_raised_when_sensitive"),
            "fail")

    def test_summarised_away_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sensitive"]["nothing_summarised_away_when_sensitive"] = False
        self.assertEqual(
            check_status(evaluate(m),
                         "nothing_summarised_away_when_sensitive"), "fail")

    def test_draft_upgraded_to_official_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["draft_upgraded_to_official_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_draft_upgraded_to_official"), "fail")
        self.assertEqual(v["sections"]["sensitive_documents_and_red_lines"],
                         "fail")

    def test_silently_softened_firm_message_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "idiom_flattened_or_firm_message_softened_silently_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "no_idiom_flattened_or_firm_message_softened_silently"),
            "fail")

    def test_guessed_illegible_text_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["illegible_text_guessed_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "no_illegible_text_guessed"), "fail")

    def test_changed_figure_and_added_meaning_fail_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["name_number_date_or_figure_changed_present"] = True
        m["red_lines"]["meaning_added_beyond_original_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_name_number_date_or_figure_changed"), "fail")
        self.assertEqual(
            check_status(v, "no_meaning_added_beyond_original"), "fail")
        self.assertEqual(v["verdict"], "MEANING_FIRST_TRANSLATION_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["handling"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["idiom_ambiguity_and_uncertainty"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["segments_count"])
        self.assertIsNone(v["segments_without_translation"])
        self.assertIsNone(v["translation_coverage"])
        self.assertIsNone(v["carryover_items_count"])
        self.assertIsNone(v["carryover_items_not_matching"])
        self.assertIsNone(v["exact_match_coverage"])
        self.assertIsNone(v["valid_kind_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: MEANING_FIRST_TRANSLATION_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["document"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("document", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"context": "should-be-an-object"})
        self.assertIn("context", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"segments": {"name": "greeting"}})
        self.assertIn("segments", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"segments": ["greeting"]})
        self.assertIn("segments[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tone"]["tone_note_provided_for_sends"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("tone.tone_note_provided_for_sends", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["segments"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("segments[0].name", str(ctx.exception))

    def test_nested_carryover_kind_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["carryover_items"][1]["kind"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("carryover_items[1].kind", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["sensitive"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("sensitive", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
