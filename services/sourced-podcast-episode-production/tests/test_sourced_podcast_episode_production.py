import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from sourced_podcast_episode_production import evaluate, stamp  # noqa: E402

COMPLETE = {
    "episode_title": "grid-reliability-briefing",
    "scoping": {"topic_scoped": True, "audience_scoped": True,
                "target_length_scoped": True, "main_point_scoped": True,
                "distribution_intent_confirmed": True,
                "scoped_before_writing": True},
    "episode_sections": [
        {"section_id": "sec-1", "purpose": "Open with the reliability point",
         "supports_main_point": True},
        {"section_id": "sec-2", "purpose": "Evidence on outage causes",
         "supports_main_point": True},
    ],
    "source_work": {"sources_collected_before_writing": True,
                    "source_list_kept_beside_draft": True,
                    "script_checked_claim_by_claim_against_sources": True,
                    "unsupported_claims_cut_or_softened": True},
    "sources": [
        {"source_id": "src-1", "citation": "EIA reliability report, link recorded"},
        {"source_id": "src-2", "citation": "Utility reliability study, citation recorded"},
    ],
    "claims": [
        {"claim_id": "claim-1", "claim_kind": "quote", "source_id": "src-1",
         "source_marked_in_script": True},
        {"claim_id": "claim-2", "claim_kind": "statistic", "source_id": "src-2",
         "source_marked_in_script": True},
    ],
    "script": {"written_for_the_ear": True, "uses_short_sentences": True,
               "uses_signposts": True, "has_no_visual_references": True,
               "opens_with_main_point": True, "supports_point_in_order": True,
               "closes_with_what_matters": True,
               "approved_before_narration": True},
    "narration": {"voice_confirmed": True, "pace_confirmed": True,
                  "long_script_chunked_at_section_breaks_where_long": True,
                  "audio_assembled": True, "opening_listen_back_checked": True,
                  "section_joins_listen_back_checked": True,
                  "misreads_and_awkward_joins_fixed": True,
                  "ai_narrated": True},
    "show_notes": {"summary_included": True, "main_points_included": True,
                   "complete_source_list_included": True,
                   "source_ids_included": ["src-1", "src-2"]},
    "rights": {"copyrighted_audio_or_music_used": True,
               "right_to_copyrighted_audio_or_music_cleared": True},
    "guests": {"guest_voices_present": True,
               "releases_recorded_for_all_guests": True},
    "publishing": {"publishing_or_scheduling_planned": True,
                    "authorization_recorded_for_this_episode": True,
                    "destination_matches_authorized_scope": True,
                    "timing_matches_authorized_scope": True,
                    "ai_narration_disclosure_made": True},
    "red_lines": {"fabricated_quote_statistic_or_source_present": False,
                  "words_attributed_beyond_source_present": False,
                  "publishing_beyond_authorized_scope_present": False,
                  "ai_narration_presented_as_human_without_disclosure_present": False,
                  "copyrighted_audio_without_clear_right_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "EPISODE_PRODUCTION_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 52)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["episode_outline_sections_count"], 2)
        self.assertEqual(v["podcast_sources_count"], 2)
        self.assertEqual(v["podcast_claims_count"], 2)
        self.assertEqual(v["duplicate_episode_outline_section_ids"], [])
        self.assertEqual(v["duplicate_podcast_source_ids"], [])
        self.assertEqual(v["duplicate_podcast_claim_ids"], [])
        self.assertEqual(v["traced_claim_ratio"], "1.000000")
        self.assertEqual(v["source_citation_ratio"], "1.000000")
        self.assertEqual(v["outline_section_support_ratio"], "1.000000")
        self.assertEqual(v["show_notes_source_coverage_ratio"], "1.000000")

    def test_topic_not_scoped_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["scoping"]["topic_scoped"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "EPISODE_PRODUCTION_NOT_SOUND")
        self.assertEqual(v["sections"]["episode_scoping_and_outline"], "fail")
        self.assertEqual(check_status(v, "podcast_episode_topic_scoped"), "fail")

    def test_duplicate_section_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["episode_sections"][1]["section_id"] = "sec-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_podcast_episode_outline_section_id_unique"),
            "fail")
        self.assertEqual(v["duplicate_episode_outline_section_ids"], ["sec-1"])

    def test_empty_section_purpose_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["episode_sections"][0]["purpose"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_podcast_episode_outline_section_purpose_declared"),
            "fail")
        self.assertEqual(v["episode_outline_sections_without_purpose"],
                         ["sec-1"])

    def test_section_not_supporting_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["episode_sections"][1]["supports_main_point"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_podcast_episode_outline_section_supports_main_point"),
            "fail")
        self.assertEqual(
            v["episode_outline_sections_not_supporting_main_point"], ["sec-2"])
        self.assertEqual(v["outline_section_support_ratio"], "0.500000")

    def test_absent_sections_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["episode_sections"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "podcast_episode_outline_sections_list_declared"),
            "missing")
        self.assertIsNone(v["episode_outline_sections_count"])
        self.assertIsNone(v["computed_status"])

    def test_empty_sources_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"] = []
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "podcast_episode_sources_list_declared"), "fail")
        self.assertEqual(v["podcast_sources_count"], 0)

    def test_claim_with_unknown_source_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][0]["source_id"] = "src-99"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_podcast_claim_traced_to_declared_source"),
            "fail")
        self.assertEqual(v["podcast_claims_with_unknown_source_reference"],
                         ["claim-1"])
        self.assertEqual(v["traced_claim_ratio"], "0.500000")

    def test_claim_unmarked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][1]["source_marked_in_script"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_podcast_claim_source_marked_in_script"),
            "fail")
        self.assertEqual(v["podcast_claims_with_unmarked_source"], ["claim-2"])

    def test_claim_invalid_kind_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][0]["claim_kind"] = "anecdote"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_podcast_claim_kind_recognised"), "fail")
        self.assertEqual(v["podcast_claims_with_invalid_kind"], ["claim-1"])

    def test_source_without_citation_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sources"][0]["citation"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_podcast_source_citation_recorded"), "fail")
        self.assertEqual(v["podcast_sources_without_citation"], ["src-1"])
        self.assertEqual(v["source_citation_ratio"], "0.500000")

    def test_claim_missing_source_id_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["claims"][0]["source_id"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_podcast_claim_traced_to_declared_source"),
            "missing")

    def test_script_visual_references_fail_section3(self):
        m = copy.deepcopy(COMPLETE)
        m["script"]["has_no_visual_references"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["script_for_listening"], "fail")

    def test_joins_not_checked_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["narration"]["section_joins_listen_back_checked"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["narration_and_assembly_qc"], "fail")
        self.assertEqual(
            check_status(
                v, "podcast_episode_section_joins_listen_back_checked"),
            "fail")

    def test_show_notes_missing_source_fails_match(self):
        m = copy.deepcopy(COMPLETE)
        m["show_notes"]["source_ids_included"] = ["src-1"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "podcast_episode_show_notes_source_ids_match_declared_sources"),
            "fail")
        self.assertEqual(v["podcast_sources_missing_from_show_notes"],
                         ["src-2"])
        self.assertEqual(v["show_notes_source_coverage_ratio"], "0.500000")

    def test_show_notes_extra_source_fails_match(self):
        m = copy.deepcopy(COMPLETE)
        m["show_notes"]["source_ids_included"] = ["src-1", "src-2", "src-9"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "podcast_episode_show_notes_source_ids_match_declared_sources"),
            "fail")
        self.assertEqual(
            v["show_notes_source_ids_not_declared_as_sources"], ["src-9"])

    def test_copyrighted_use_without_right_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["rights"]["right_to_copyrighted_audio_or_music_cleared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "podcast_episode_copyrighted_audio_rights_cleared_where_used"),
            "fail")

    def test_no_copyrighted_use_passes_gated_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["rights"]["copyrighted_audio_or_music_used"] = False
        m["rights"]["right_to_copyrighted_audio_or_music_cleared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "podcast_episode_copyrighted_audio_rights_cleared_where_used"),
            "pass")
        self.assertEqual(v["verdict"], "EPISODE_PRODUCTION_SOUND")

    def test_guest_without_release_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["guests"]["releases_recorded_for_all_guests"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "podcast_episode_guest_releases_recorded_where_guests_present"),
            "fail")

    def test_no_publishing_planned_passes_publishing_gates(self):
        m = copy.deepcopy(COMPLETE)
        m["publishing"]["publishing_or_scheduling_planned"] = False
        m["publishing"]["authorization_recorded_for_this_episode"] = False
        m["publishing"]["destination_matches_authorized_scope"] = False
        m["publishing"]["timing_matches_authorized_scope"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["publishing_and_disclosure"], "pass")

    def test_publishing_without_authorization_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["publishing"]["authorization_recorded_for_this_episode"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "podcast_episode_publishing_authorization_recorded_where_planned"),
            "fail")

    def test_ai_narration_without_disclosure_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["publishing"]["ai_narration_disclosure_made"] = False
        self.assertEqual(
            check_status(
                evaluate(m),
                "podcast_episode_ai_narration_disclosed_where_ai_narrated"),
            "fail")

    def test_human_narration_passes_disclosure_gate(self):
        m = copy.deepcopy(COMPLETE)
        m["narration"]["ai_narrated"] = False
        m["publishing"]["ai_narration_disclosure_made"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "podcast_episode_ai_narration_disclosed_where_ai_narrated"),
            "pass")

    def test_fabricated_source_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["fabricated_quote_statistic_or_source_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "EPISODE_PRODUCTION_NOT_SOUND")

    def test_publishing_beyond_scope_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["publishing_beyond_authorized_scope_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "podcast_episode_free_of_publishing_beyond_authorized_scope"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["script"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["script_for_listening"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["podcast_sources_count"])
        self.assertIsNone(v["traced_claim_ratio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: EPISODE_PRODUCTION_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["episode_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("episode_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"scoping": "should-be-an-object"})
        self.assertIn("scoping", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"sources": {"source_id": "src-1"}})
        self.assertIn("sources", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"claims": ["claim-1"]})
        self.assertIn("claims[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["script"]["written_for_the_ear"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("script.written_for_the_ear", str(ctx.exception))

    def test_string_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["show_notes"]["source_ids_included"] = [42]
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("show_notes.source_ids_included[0]",
                      str(ctx.exception))

    def test_nested_list_entry_bool_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["claims"][0]["source_marked_in_script"] = "true"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("claims[0].source_marked_in_script",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["narration"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("narration", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
