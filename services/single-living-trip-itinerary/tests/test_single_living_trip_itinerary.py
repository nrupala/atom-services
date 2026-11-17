import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from single_living_trip_itinerary import evaluate, stamp  # noqa: E402

COMPLETE = {
    "trip_title": "family-mumbai-2027",
    "header": {"purpose": "Family visit and wedding in Mumbai",
               "travellers": "Two adults and one child",
               "trip_start_date": "2027-02-10",
               "trip_end_date": "2027-02-20",
               "single_itinerary_maintained": True},
    "constraints": {"entry_checked_before_routing": True,
                    "transit_checked_before_routing": True,
                    "passport_validity_checked": True,
                    "visa_needs_checked": True,
                    "baggage_rules_checked": True,
                    "connection_minimums_checked": True},
    "entries": [
        {"entry_id": "outbound-flight", "kind": "flight",
         "state": "booked", "start_date": "2027-02-10",
         "end_date": "2027-02-11", "origin": "ORD",
         "destination": "BOM", "total_amount": 1200,
         "price_timestamp": "2027-01-05T10:00:00Z",
         "booking_reference": "UA-REF-1", "terms_recorded": True},
        {"entry_id": "airport-transfer", "kind": "ground_transport",
         "state": "held", "start_date": "2027-02-11",
         "end_date": "2027-02-11", "origin": "BOM",
         "destination": "BOM", "total_amount": 40,
         "price_timestamp": "2027-01-06T09:00:00Z",
         "held_expiry_or_timestamp": "2027-01-20T00:00:00Z"},
        {"entry_id": "mumbai-stay", "kind": "stay",
         "state": "booked", "start_date": "2027-02-11",
         "end_date": "2027-02-18", "total_amount": 800,
         "price_timestamp": "2027-01-05T11:00:00Z",
         "booking_reference": "HTL-REF-2", "terms_recorded": True},
        {"entry_id": "gateway-day-out", "kind": "activity",
         "state": "idea", "start_date": "2027-02-14",
         "end_date": "2027-02-14"},
        {"entry_id": "return-transfer", "kind": "ground_transport",
         "state": "held", "start_date": "2027-02-18",
         "end_date": "2027-02-18", "origin": "BOM",
         "destination": "BOM",
         "held_expiry_or_timestamp": "2027-01-20T00:00:00Z"},
        {"entry_id": "return-flight", "kind": "flight",
         "state": "booked", "start_date": "2027-02-19",
         "end_date": "2027-02-20", "origin": "BOM",
         "destination": "ORD", "total_amount": 1100,
         "price_timestamp": "2027-01-05T10:30:00Z",
         "booking_reference": "UA-REF-3", "terms_recorded": True},
    ],
    "skeleton": {"outbound_laid": True, "stays_laid": True,
                 "internal_moves_laid_or_none_needed": True,
                 "return_laid": True},
    "totals": {"declared_booked_total": 3100},
    "conflicts": {"scanned_early": True,
                  "tight_connections_flagged": True,
                  "arrival_after_checkin_flagged": True,
                  "clashing_plans_flagged": True,
                  "conflicts_name_pieces_and_cost": True},
    "readiness": {"full_readthrough_completed": True,
                  "documents_checked": True,
                  "times_with_timezones_checked": True,
                  "contacts_checked": True,
                  "gaps_checked": True},
    "red_lines": {"date_change_suggested_present": False,
                  "idea_or_quote_presented_as_booking_present": False,
                  "invented_facts_present": False,
                  "routing_before_constraints_checked_present": False,
                  "unauthorized_booking_or_payment_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "SINGLE_LIVING_TRIP_ITINERARY_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 45)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["entries_count"], 6)
        self.assertEqual(v["booked_entries_count"], 3)
        self.assertEqual(v["computed_booked_total"], "3100.000000")
        self.assertEqual(v["booked_total_difference"], "0.000000")
        self.assertEqual(v["duplicate_itinerary_entry_ids"], [])
        self.assertEqual(v["itinerary_entry_ids_without_valid_state"], [])
        self.assertEqual(v["movement_leg_break_entry_ids"], [])
        self.assertEqual(v["entries_out_of_date_order"], [])
        self.assertEqual(v["entries_ending_before_start"], [])
        self.assertEqual(v["entries_outside_trip_window"], [])

    def test_empty_entries_list_is_a_valid_declaration(self):
        m = copy.deepcopy(COMPLETE)
        m["entries"] = []
        m["totals"]["declared_booked_total"] = 0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SINGLE_LIVING_TRIP_ITINERARY_READY")
        self.assertEqual(v["entries_count"], 0)
        self.assertEqual(v["computed_booked_total"], "0.000000")
        self.assertEqual(check_status(v, "itinerary_entries_declared"),
                         "pass")
        self.assertEqual(
            check_status(
                v, "every_itinerary_entry_labelled_with_valid_state"),
            "pass")

    def test_missing_purpose_fails_header_string_check_as_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["header"]["purpose"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "trip_purpose_stated_in_header"), "missing")

    def test_reversed_trip_window_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["header"]["trip_start_date"] = "2027-02-20"
        m["header"]["trip_end_date"] = "2027-02-10"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "trip_window_start_not_after_end"), "fail")
        self.assertEqual(v["verdict"],
                         "SINGLE_LIVING_TRIP_ITINERARY_NOT_READY")

    def test_second_itinerary_fails_single_itinerary_check(self):
        m = copy.deepcopy(COMPLETE)
        m["header"]["single_itinerary_maintained"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "single_living_itinerary_maintained"), "fail")
        self.assertEqual(v["sections"]["trip_header"], "fail")

    def test_constraints_not_checked_before_routing_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["constraints"]["entry_checked_before_routing"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["entry_and_transit_constraints"],
                         "fail")
        self.assertEqual(
            check_status(
                v, "entry_constraints_checked_before_routing_choices"),
            "fail")

    def test_invalid_entry_state_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["entries"][3]["state"] = "maybe"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_itinerary_entry_labelled_with_valid_state"),
            "fail")
        self.assertEqual(v["itinerary_entry_ids_without_valid_state"],
                         ["gateway-day-out"])

    def test_entry_missing_state_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["entries"][3]["state"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_itinerary_entry_labelled_with_valid_state"),
            "missing")

    def test_duplicate_entry_id_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["entries"][1]["entry_id"] = "outbound-flight"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_itinerary_entry_id_duplicated"), "fail")
        self.assertEqual(v["duplicate_itinerary_entry_ids"],
                         ["outbound-flight"])

    def test_booked_entry_without_reference_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["entries"][0]["booking_reference"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_booked_entry_carries_booking_reference"),
            "fail")

    def test_booked_entry_missing_reference_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["entries"][0]["booking_reference"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_booked_entry_carries_booking_reference"),
            "missing")

    def test_booked_entry_without_terms_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["entries"][2]["terms_recorded"] = False
        self.assertEqual(
            check_status(
                evaluate(m), "every_booked_entry_records_its_terms"),
            "fail")

    def test_held_entry_without_expiry_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["entries"][1]["held_expiry_or_timestamp"] = ""
        self.assertEqual(
            check_status(
                evaluate(m),
                "every_held_entry_states_expiry_or_timestamp"),
            "fail")

    def test_idea_entry_with_booking_reference_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["entries"][3]["booking_reference"] = "FAKE-REF"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_idea_entry_free_of_booking_reference"),
            "fail")
        self.assertEqual(v["sections"]["entry_states_and_totals"], "fail")

    def test_priced_entry_without_timestamp_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["entries"][0]["price_timestamp"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "every_priced_itinerary_entry_carries_price_timestamp"),
            "missing")

    def test_declared_booked_total_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_booked_total"] = 3000
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v,
                "declared_booked_total_matches_sum_of_booked_entry_totals"),
            "fail")
        self.assertEqual(v["booked_total_difference"], "-100.000000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_absent_entries_list_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["entries"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "itinerary_entries_declared"),
                         "missing")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["entries_count"])
        self.assertIsNone(v["computed_booked_total"])
        self.assertIsNone(v["duplicate_itinerary_entry_ids"])

    def test_out_of_order_entries_fail_and_are_named(self):
        m = copy.deepcopy(COMPLETE)
        m["entries"][3]["start_date"] = "2027-02-12"
        m["entries"][3]["end_date"] = "2027-02-12"
        # swap activity before the stay by date: move stay later is
        # complex; instead push the transfer earlier than the flight
        m["entries"][1]["start_date"] = "2027-02-09"
        m["entries"][1]["end_date"] = "2027-02-09"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "itinerary_entries_in_declared_date_order"), "fail")
        self.assertEqual(v["entries_out_of_date_order"],
                         ["airport-transfer"])

    def test_entry_ending_before_start_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["entries"][3]["end_date"] = "2027-02-13"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "no_itinerary_entry_ends_before_it_starts"), "fail")
        self.assertEqual(v["entries_ending_before_start"],
                         ["gateway-day-out"])

    def test_entry_outside_trip_window_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["entries"][5]["end_date"] = "2027-02-21"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_itinerary_entry_within_trip_window"), "fail")
        self.assertEqual(v["entries_outside_trip_window"],
                         ["return-flight"])

    def test_disconnected_movement_leg_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["entries"][5]["origin"] = "DEL"
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "declared_movement_legs_connect_in_sequence"),
            "fail")
        self.assertEqual(v["movement_leg_break_entry_ids"],
                         ["return-flight"])

    def test_skeleton_return_missing_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["skeleton"]["return_laid"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["skeleton_and_ordering"], "fail")

    def test_unflagged_tight_connections_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["conflicts"]["tight_connections_flagged"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["conflicts_flagged"], "fail")
        self.assertEqual(
            check_status(v, "tight_connections_flagged_in_itinerary"),
            "fail")

    def test_readthrough_not_completed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["readiness"]["full_readthrough_completed"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["predeparture_readthrough"],
                         "fail")

    def test_date_change_suggested_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["date_change_suggested_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "no_trip_date_change_suggested_in_itinerary"),
            "fail")
        self.assertEqual(v["sections"]["red_lines"], "fail")

    def test_idea_presented_as_booking_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["idea_or_quote_presented_as_booking_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "no_idea_or_held_quote_presented_as_booking"),
            "fail")
        self.assertEqual(v["verdict"],
                         "SINGLE_LIVING_TRIP_ITINERARY_NOT_READY")

    def test_unauthorized_booking_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["unauthorized_booking_or_payment_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "no_booking_or_payment_without_traveller_authorization"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["conflicts"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["conflicts_flagged"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["entries_count"])
        self.assertIsNone(v["booked_entries_count"])
        self.assertIsNone(v["computed_booked_total"])
        self.assertIsNone(v["booked_total_difference"])
        self.assertIsNone(v["duplicate_itinerary_entry_ids"])
        self.assertIsNone(v["movement_leg_break_entry_ids"])
        self.assertIsNone(v["entries_outside_trip_window"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(
            "VERDICT: SINGLE_LIVING_TRIP_ITINERARY_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["trip_title"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("trip_title", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"header": "should-be-an-object"})
        self.assertIn("header", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"entries": {"entry_id": "x"}})
        self.assertIn("entries", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"entries": ["x"]})
        self.assertIn("entries[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["readiness"]["documents_checked"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("readiness.documents_checked", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["totals"]["declared_booked_total"] = "3100"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("totals.declared_booked_total", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["entries"][0]["entry_id"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("entries[0].entry_id", str(ctx.exception))

    def test_nested_list_entry_number_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["entries"][1]["total_amount"] = "40"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("entries[1].total_amount", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["conflicts"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("conflicts", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
