import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from verified_place_shortlist import evaluate, stamp  # noqa: E402

COMPLETE = {
    "shortlist_title": "sunday-cafe-shortlist",
    "constraints": {"constraints_declared": True,
                    "area_declared": True,
                    "visit_timing_declared": True,
                    "budget_constraint_declared": True,
                    "noise_constraint_declared": True,
                    "parking_constraint_declared": True,
                    "accessibility_needs_declared": True,
                    "candidates_searched_within_declared_constraints": True,
                    "only_real_named_results_kept": True},
    "criteria": [
        {"criterion_id": "crit-1", "criterion_name": "Quiet enough to work"},
        {"criterion_id": "crit-2", "criterion_name": "Open Sunday morning"},
        {"criterion_id": "crit-3", "criterion_name": "Parking available"},
    ],
    "places": [
        {"place_id": "place-1", "place_name": "North Hill Cafe",
         "address": "101 10 Ave NW, Calgary, AB",
         "address_verified_from_listing": True,
         "existence_confirmed": True,
         "hours_status": "same_day_verified",
         "verification_method": "listing itself",
         "verification_date": "2026-11-15",
         "rating": 4.5, "review_count": 320,
         "recent_complaints_noted": True,
         "photo_checked": True,
         "special_hours_noted_where_shown": True,
         "criterion_ids_met": ["crit-1", "crit-2", "crit-3"]},
        {"place_id": "place-2", "place_name": "Riverbend Coffee",
         "address": "22 River Ave SE, Calgary, AB",
         "address_verified_from_listing": True,
         "existence_confirmed": True,
         "hours_status": "flagged_unverified",
         "verification_method": "listing itself",
         "verification_date": "2026-11-15",
         "rating": 4.2, "review_count": 140,
         "recent_complaints_noted": True,
         "photo_checked": True,
         "special_hours_noted_where_shown": True,
         "criterion_ids_met": ["crit-1", "crit-2", "crit-3"]},
    ],
    "evaluation": {"rating_signals_read_critically": True,
                   "fit_checked_beyond_rating": True},
    "ranking": {"ranking_recorded": True,
                "ranking_based_on_declared_criteria": True,
                "winner_place_id": "place-1",
                "winner_rationale_recorded": True,
                "winner_drawback_recorded": True,
                "winner_map_ready_address_declared": True,
                "winner_hours_recorded": True,
                "winner_booking_or_queue_warning_recorded": True,
                "timing_matters": True,
                "backup_place_id": "place-2"},
    "handling": {"hours_flagged_unverified_when_not_same_day_confirmed": True,
                 "listings_checked_for_staleness_duplication_and_closure": True,
                 "stale_duplicate_or_closed_listings_flagged": True,
                 "no_unconfirmed_place_used_to_fill_gap": True,
                 "original_area_has_no_verified_options": False,
                 "nearest_verified_area_offered": False},
    "red_lines": {"invented_address_hours_rating_or_photo_present": False,
                  "stale_hours_presented_as_current_fact_present": False,
                  "place_breaking_stated_constraint_recommended_present": False,
                  "ranking_by_rating_alone_present": False,
                  "unverified_listing_passed_as_confirmed_open_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "VERIFIED_PLACE_SHORTLIST_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 51)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["verified_places_count"], 2)
        self.assertEqual(v["verified_place_criteria_count"], 3)
        self.assertEqual(v["duplicate_verified_place_ids"], [])
        self.assertEqual(v["duplicate_verified_place_addresses"], [])
        self.assertEqual(v["verified_places_total_review_count"], "460.000000")
        self.assertEqual(v["place_address_verification_ratio"], "1.000000")
        self.assertEqual(v["place_hours_same_day_verified_ratio"], "0.500000")
        self.assertEqual(v["place_criterion_coverage_ratio"], "1.000000")
        self.assertEqual(v["place_rating_evidence_ratio"], "1.000000")

    def test_constraints_not_declared_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["constraints"]["constraints_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "VERIFIED_PLACE_SHORTLIST_NOT_SOUND")
        self.assertEqual(v["sections"]["constraints_and_criteria"], "fail")
        self.assertEqual(
            check_status(v, "verified_place_shortlist_constraints_declared"),
            "fail")

    def test_duplicate_place_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["places"][1]["place_id"] = "place-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_verified_place_id_unique"), "fail")
        self.assertEqual(v["duplicate_verified_place_ids"], ["place-1"])

    def test_duplicate_address_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["places"][1]["address"] = m["places"][0]["address"]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_verified_place_address_unique"), "fail")
        self.assertEqual(
            v["duplicate_verified_place_addresses"],
            ["101 10 Ave NW, Calgary, AB"])

    def test_single_place_fails_shortlist(self):
        m = copy.deepcopy(COMPLETE)
        m["places"] = m["places"][:1]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "verified_place_shortlist_places_list_declared"),
            "fail")

    def test_absent_places_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["places"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "verified_place_shortlist_places_list_declared"),
            "missing")
        self.assertIsNone(v["verified_places_count"])
        self.assertIsNone(v["computed_status"])

    def test_unrecognised_hours_status_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["places"][0]["hours_status"] = "probably_open"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_verified_place_hours_status_recognised"),
            "fail")
        self.assertEqual(
            v["verified_places_with_unrecognised_hours_status"], ["place-1"])

    def test_empty_address_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["places"][1]["address"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_verified_place_address_declared"), "fail")
        self.assertEqual(v["verified_places_without_address"], ["place-2"])

    def test_address_not_verified_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["places"][0]["address_verified_from_listing"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_verified_place_address_verified_from_listing"),
            "fail")
        self.assertEqual(v["place_address_verification_ratio"], "0.500000")

    def test_zero_review_count_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["places"][0]["review_count"] = 0
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_verified_place_review_count_positive"),
            "fail")
        self.assertEqual(v["verified_places_with_invalid_review_count"],
                         ["place-1"])

    def test_negative_rating_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["places"][1]["rating"] = -1
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_verified_place_rating_declared"), "fail")
        self.assertEqual(v["verified_places_with_invalid_rating"],
                         ["place-2"])

    def test_place_missing_a_criterion_fails_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["places"][1]["criterion_ids_met"] = ["crit-1", "crit-2"]
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_verified_place_meets_all_declared_criteria"),
            "fail")
        self.assertEqual(
            v["verified_places_not_meeting_all_declared_criteria"],
            ["place-2"])
        self.assertEqual(v["place_criterion_coverage_ratio"], "0.500000")

    def test_place_with_extra_criterion_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["places"][0]["criterion_ids_met"] = [
            "crit-1", "crit-2", "crit-3", "crit-9"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "every_verified_place_criterion_mapping_names_only_declared_criteria"),
            "fail")
        self.assertEqual(v["verified_places_with_extra_criterion_ids"],
                         ["place-1"])

    def test_missing_verification_date_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["places"][0]["verification_date"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_verified_place_verification_date_declared"),
            "missing")

    def test_winner_unknown_place_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["ranking"]["winner_place_id"] = "place-99"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "verified_place_shortlist_winner_resolves_to_declared_place"),
            "fail")

    def test_winner_not_highest_rated_still_passes(self):
        # Audit boundary: the atom never checks that the winner is
        # the highest-rated or top-ranked place.
        m = copy.deepcopy(COMPLETE)
        m["ranking"]["winner_place_id"] = "place-2"
        m["ranking"]["backup_place_id"] = "place-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "verified_place_shortlist_winner_resolves_to_declared_place"),
            "pass")
        self.assertEqual(v["verdict"], "VERIFIED_PLACE_SHORTLIST_SOUND")

    def test_backup_same_as_winner_fails_where_timing_matters(self):
        m = copy.deepcopy(COMPLETE)
        m["ranking"]["backup_place_id"] = "place-1"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "verified_place_shortlist_backup_resolves_and_differs_where_timing_matters"),
            "fail")

    def test_no_timing_matters_passes_backup_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["ranking"]["timing_matters"] = False
        del m["ranking"]["backup_place_id"]
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "verified_place_shortlist_backup_resolves_and_differs_where_timing_matters"),
            "pass")
        self.assertEqual(v["verdict"], "VERIFIED_PLACE_SHORTLIST_SOUND")

    def test_no_verified_options_without_nearest_area_fails_gated(self):
        m = copy.deepcopy(COMPLETE)
        m["handling"]["original_area_has_no_verified_options"] = True
        m["handling"]["nearest_verified_area_offered"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "verified_place_shortlist_nearest_verified_area_offered_where_no_verified_options"),
            "fail")

    def test_verified_options_present_passes_gated_as_na(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            check_status(
                v,
                "verified_place_shortlist_nearest_verified_area_offered_where_no_verified_options"),
            "pass")

    def test_special_hours_not_noted_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["places"][0]["special_hours_noted_where_shown"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["freshness_uncertainty_and_alternatives"], "fail")

    def test_invented_evidence_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["invented_address_hours_rating_or_photo_present"] = True
        v = evaluate(m)
        self.assertEqual(v["sections"]["red_lines"], "fail")
        self.assertEqual(v["verdict"], "VERIFIED_PLACE_SHORTLIST_NOT_SOUND")

    def test_unverified_listing_passed_as_open_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["unverified_listing_passed_as_confirmed_open_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "verified_place_shortlist_free_of_unverified_listing_passed_as_confirmed_open"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["handling"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            v["sections"]["freshness_uncertainty_and_alternatives"],
            "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["verified_places_count"])
        self.assertIsNone(v["verified_places_total_review_count"])
        self.assertIsNone(v["place_criterion_coverage_ratio"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: VERIFIED_PLACE_SHORTLIST_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["shortlist_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("shortlist_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"constraints": "should-be-an-object"})
        self.assertIn("constraints", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"places": {"place_id": "place-1"}})
        self.assertIn("places", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"criteria": ["crit-1"]})
        self.assertIn("criteria[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["constraints"]["constraints_declared"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("constraints.constraints_declared", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["places"][0]["rating"] = "4.5"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("places[0].rating", str(ctx.exception))

    def test_nested_mapping_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["places"][0]["criterion_ids_met"] = [42]
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("places[0].criterion_ids_met[0]", str(ctx.exception))

    def test_string_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["places"][0]["criterion_ids_met"] = "crit-1"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("places[0].criterion_ids_met", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["handling"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("handling", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
