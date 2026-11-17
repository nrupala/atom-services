import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from meeting_decisions_and_actions_extract import evaluate, stamp  # noqa: E402

COMPLETE = {
    "meeting": "weekly-ops-2026-11-10",
    "source": {"read_in_full": True,
               "attendees_recorded": True,
               "meeting_date_recorded": True,
               "meeting_identity_confirmed": True,
               "absent_attendees_named_when_relevant": True,
               "speaker_attribution_kept_where_it_matters": True,
               "numbers_dates_amounts_copied_exactly": True,
               "names_spelled_as_in_source_or_contacts": True},
    "decisions_record": {
        "decisions_stated_close_to_source_wording": True,
        "inferred_items_labelled_as_inferred": True},
    "decisions": [
        {"name": "ship-date", "source_anchor": "notes p.1",
         "faithful_to_source": True, "is_inferred": False,
         "inference_marked": False},
        {"name": "budget-cap", "source_anchor": "transcript 12:40",
         "faithful_to_source": True, "is_inferred": True,
         "inference_marked": True},
    ],
    "actions_record": {
        "owners_and_due_dates_drawn_from_source": True,
        "loose_deadlines_flagged_not_guessed": True},
    "actions": [
        {"name": "send-quote", "owner": "Priya",
         "due_date": "2026-11-14", "source_anchor": "notes p.2"},
        {"name": "book-site-visit", "owner": "Omar",
         "due_date": "2026-11-17", "source_anchor": "transcript 31:05"},
    ],
    "open_questions_record": {
        "unresolved_items_collected_separately": True,
        "ownerless_we_should_listed_as_open_questions": True,
        "prior_open_items_carried_forward_visibly": True},
    "open_questions": [
        {"name": "hire-contractor", "source_anchor": "notes p.3"},
    ],
    "recap": {
        "decisions_first_then_actions_then_open_questions": True,
        "concise_enough_to_be_read": True,
        "shown_as_draft_before_any_send": True},
    "handoff": {
        "confirmed_actions_handed_off_with_owners_and_dates_on_approval": True,
        "recap_sent_only_through_directed_channel_on_approval": True},
    "red_lines": {
        "inferred_decision_presented_as_made_present": False,
        "invented_owner_or_due_date_present": False,
        "recap_sent_without_approval_present": False,
        "unresolved_question_dropped_for_cleanliness_present": False,
        "meeting_contents_disclosed_beyond_named_attendees_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "MEETING_EXTRACTION_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 35)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["decisions_count"], 2)
        self.assertEqual(v["decisions_without_source_anchor"], [])
        self.assertEqual(v["decision_anchor_coverage"], "1.000000")
        self.assertEqual(v["decisions_not_faithful"], [])
        self.assertEqual(v["decision_faithful_coverage"], "1.000000")
        self.assertEqual(v["inferred_decisions_unmarked"], [])
        self.assertEqual(v["inferred_marking_coverage"], "1.000000")
        self.assertEqual(v["actions_count"], 2)
        self.assertEqual(v["actions_without_owner"], [])
        self.assertEqual(v["action_owner_coverage"], "1.000000")
        self.assertEqual(v["actions_without_due_date"], [])
        self.assertEqual(v["action_due_date_coverage"], "1.000000")
        self.assertEqual(v["actions_without_source_anchor"], [])
        self.assertEqual(v["action_anchor_coverage"], "1.000000")
        self.assertEqual(v["open_questions_count"], 1)
        self.assertEqual(v["open_questions_without_source_anchor"], [])
        self.assertEqual(v["open_question_anchor_coverage"], "1.000000")

    def test_source_not_read_in_full_fails_source_section(self):
        m = copy.deepcopy(COMPLETE)
        m["source"]["read_in_full"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MEETING_EXTRACTION_NOT_SOUND")
        self.assertEqual(v["sections"]["source_and_meeting_identity"], "fail")
        self.assertEqual(check_status(v, "source_read_in_full"), "fail")

    def test_attendees_not_recorded_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["source"]["attendees_recorded"] = False
        self.assertEqual(
            check_status(evaluate(m), "attendees_recorded"), "fail")

    def test_numbers_not_copied_exactly_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["source"]["numbers_dates_amounts_copied_exactly"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "MEETING_EXTRACTION_NOT_SOUND")

    def test_decisions_not_close_to_wording_fails_decisions_section(self):
        m = copy.deepcopy(COMPLETE)
        m["decisions_record"][
            "decisions_stated_close_to_source_wording"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MEETING_EXTRACTION_NOT_SOUND")
        self.assertEqual(v["sections"]["decisions_fidelity"], "fail")

    def test_decision_with_empty_anchor_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["decisions"][0]["source_anchor"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_decision_has_source_anchor"), "fail")
        self.assertEqual(v["decisions_without_source_anchor"], ["ship-date"])
        self.assertEqual(v["decision_anchor_coverage"], "0.500000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_decision_missing_anchor_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["decisions"][0]["source_anchor"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_decision_has_source_anchor"), "missing")
        self.assertEqual(v["decisions_without_source_anchor"], [])

    def test_decision_not_faithful_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["decisions"][1]["faithful_to_source"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_decision_faithful_to_source"), "fail")
        self.assertEqual(v["decisions_not_faithful"], ["budget-cap"])
        self.assertEqual(v["decision_faithful_coverage"], "0.500000")

    def test_inferred_decision_unmarked_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["decisions"][1]["inference_marked"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_inferred_decision_marked"), "fail")
        self.assertEqual(v["inferred_decisions_unmarked"], ["budget-cap"])
        self.assertEqual(v["inferred_marking_coverage"], "0.000000")

    def test_inferred_decision_missing_mark_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["decisions"][1]["inference_marked"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_inferred_decision_marked"), "missing")
        self.assertEqual(v["inferred_decisions_unmarked"], [])

    def test_no_inferred_decisions_marking_coverage_is_null(self):
        m = copy.deepcopy(COMPLETE)
        m["decisions"][1]["is_inferred"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MEETING_EXTRACTION_SOUND")
        self.assertIsNone(v["inferred_marking_coverage"])
        self.assertEqual(
            check_status(v, "every_inferred_decision_marked"), "pass")

    def test_empty_decisions_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["decisions"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "decisions_declared"), "fail")
        self.assertEqual(v["decisions_count"], 0)
        self.assertIsNone(v["decision_anchor_coverage"])
        self.assertIsNone(v["inferred_marking_coverage"])

    def test_action_with_empty_owner_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["actions"][0]["owner"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MEETING_EXTRACTION_NOT_SOUND")
        self.assertEqual(v["sections"]["action_ownership_and_dates"], "fail")
        self.assertEqual(
            check_status(v, "every_action_has_named_owner"), "fail")
        self.assertEqual(v["actions_without_owner"], ["send-quote"])
        self.assertEqual(v["action_owner_coverage"], "0.500000")

    def test_action_missing_owner_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["actions"][0]["owner"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_action_has_named_owner"), "missing")
        self.assertEqual(v["actions_without_owner"], [])

    def test_action_with_empty_due_date_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["actions"][1]["due_date"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_action_has_due_date"), "fail")
        self.assertEqual(v["actions_without_due_date"], ["book-site-visit"])
        self.assertEqual(v["action_due_date_coverage"], "0.500000")

    def test_action_with_empty_anchor_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["actions"][1]["source_anchor"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_action_has_source_anchor"), "fail")
        self.assertEqual(v["actions_without_source_anchor"],
                         ["book-site-visit"])
        self.assertEqual(v["action_anchor_coverage"], "0.500000")

    def test_loose_deadlines_guessed_fails_actions_section(self):
        m = copy.deepcopy(COMPLETE)
        m["actions_record"]["loose_deadlines_flagged_not_guessed"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["action_ownership_and_dates"], "fail")

    def test_empty_actions_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["actions"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "actions_declared"), "fail")
        self.assertEqual(v["actions_count"], 0)
        self.assertIsNone(v["action_owner_coverage"])

    def test_ownerless_we_should_not_listed_fails_open_section(self):
        m = copy.deepcopy(COMPLETE)
        m["open_questions_record"][
            "ownerless_we_should_listed_as_open_questions"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["open_questions_and_carry_forward"], "fail")

    def test_open_question_with_empty_anchor_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["open_questions"][0]["source_anchor"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_open_question_has_source_anchor"),
            "fail")
        self.assertEqual(v["open_questions_without_source_anchor"],
                         ["hire-contractor"])
        self.assertEqual(v["open_question_anchor_coverage"], "0.000000")

    def test_empty_open_questions_list_passes_declared(self):
        m = copy.deepcopy(COMPLETE)
        m["open_questions"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MEETING_EXTRACTION_SOUND")
        self.assertEqual(check_status(v, "open_questions_declared"), "pass")
        self.assertEqual(
            check_status(v, "every_open_question_has_source_anchor"),
            "pass")
        self.assertEqual(v["open_questions_count"], 0)
        self.assertIsNone(v["open_question_anchor_coverage"])

    def test_recap_not_shown_as_draft_fails_recap_section(self):
        m = copy.deepcopy(COMPLETE)
        m["recap"]["shown_as_draft_before_any_send"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "MEETING_EXTRACTION_NOT_SOUND")
        self.assertEqual(v["sections"]["recap_draft_and_handoff"], "fail")
        self.assertEqual(
            check_status(v, "recap_shown_as_draft_before_any_send"),
            "fail")

    def test_handoff_without_owners_dates_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["handoff"][
            "confirmed_actions_handed_off_with_owners_and_dates_on_approval"
        ] = False
        self.assertEqual(
            check_status(evaluate(m),
                         "confirmed_actions_handed_off_on_approval"),
            "fail")

    def test_inferred_presented_as_made_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["inferred_decision_presented_as_made_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_inferred_decision_presented_as_made"),
            "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")

    def test_invented_owner_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["invented_owner_or_due_date_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_invented_owner_or_due_date"), "fail")
        self.assertEqual(v["verdict"], "MEETING_EXTRACTION_NOT_SOUND")

    def test_recap_sent_without_approval_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["recap_sent_without_approval_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "no_recap_sent_without_approval"),
            "fail")

    def test_dropped_question_and_disclosure_fail_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "unresolved_question_dropped_for_cleanliness_present"] = True
        m["red_lines"][
            "meeting_contents_disclosed_beyond_named_attendees_present"
        ] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "no_unresolved_question_dropped_for_cleanliness"),
            "fail")
        self.assertEqual(
            check_status(v, "no_disclosure_beyond_named_attendees"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["recap"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["recap_draft_and_handoff"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["decisions_count"])
        self.assertIsNone(v["decisions_without_source_anchor"])
        self.assertIsNone(v["decision_anchor_coverage"])
        self.assertIsNone(v["inferred_marking_coverage"])
        self.assertIsNone(v["actions_count"])
        self.assertIsNone(v["actions_without_owner"])
        self.assertIsNone(v["action_owner_coverage"])
        self.assertIsNone(v["open_questions_count"])
        self.assertIsNone(v["open_question_anchor_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: MEETING_EXTRACTION_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["meeting"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("meeting", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"source": "should-be-an-object"})
        self.assertIn("source", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"decisions": {"name": "ship-date"}})
        self.assertIn("decisions", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"actions": ["send-quote"]})
        self.assertIn("actions[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["source"]["read_in_full"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("source.read_in_full", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["actions"][0]["owner"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("actions[0].owner", str(ctx.exception))

    def test_nested_list_entry_boolean_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["decisions"][1]["is_inferred"] = "true"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("decisions[1].is_inferred", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["recap"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("recap", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
