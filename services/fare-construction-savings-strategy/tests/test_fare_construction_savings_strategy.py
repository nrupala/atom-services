import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from fare_construction_savings_strategy import evaluate, stamp  # noqa: E402


COMPLETE = {
    "trip_label": "Calgary to Mumbai, December",
    "trip": {"origin": "Calgary",
             "destination": "Mumbai",
             "travel_dates": "2026-12-10 to 2026-12-20",
             "flexibility": "plus or minus 3 days"},
    "drivers": {"advance_purchase_explained": True,
                "day_of_week_explained": True,
                "nearby_airports_considered": True,
                "split_tickets_considered": True},
    "strategy": {"search_strategy_given": True,
                 "price_only_without_strategy": False},
    "total_cost": {"headline_fare": 800,
                   "fees": 120,
                   "baggage_fees": 75,
                   "seat_fees": 45,
                   "declared_total_cost": 1040,
                   "total_cost_surfaced": True,
                   "headline_presented_as_total_cost": False},
    "construction": {"legs": [{"label": "leg_1_calgary_toronto",
                               "price": 300},
                              {"label": "leg_2_toronto_mumbai",
                               "price": 450}],
                     "declared_constructed_total": 750,
                     "baseline_direct_fare": 900,
                     "declared_savings": 150,
                     "constructed_option_compared_to_direct": True},
    "integrity": {"prices_invented": False,
                  "quoted_fare_presented_as_starting_point": True,
                  "recheck_before_booking_advised": True,
                  "uncheckable_items_disclosed": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(
            v["verdict"], "FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 21)
        self.assertEqual(v["legs_evaluated"], 2)
        self.assertEqual(v["computed_constructed_total"], "750.000000")
        self.assertEqual(v["constructed_total_difference"], "0.000000")
        self.assertEqual(v["computed_total_cost"], "1040.000000")
        self.assertEqual(v["total_cost_difference"], "0.000000")
        self.assertEqual(v["computed_savings"], "150.000000")
        self.assertEqual(v["savings_difference"], "0.000000")

    def test_total_cost_at_other_values_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["total_cost"].update({"headline_fare": 500, "fees": 50,
                                "baggage_fees": 0, "seat_fees": 25,
                                "declared_total_cost": 575})
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY")
        self.assertEqual(v["computed_total_cost"], "575.000000")

    def test_total_cost_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["total_cost"]["declared_total_cost"] = 1000
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY")
        self.assertEqual(v["sections"]["total_cost_surface"], "fail")
        self.assertEqual(
            check_status(
                v, "total_cost_matches_headline_plus_fees_bags_seats"),
            "fail")
        self.assertEqual(v["total_cost_difference"], "-40.000000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_missing_total_cost_number_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["total_cost"]["baggage_fees"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_total_cost"])
        self.assertIsNone(v["total_cost_difference"])
        self.assertIsNone(v["computed_status"])

    def test_headline_presented_as_total_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["total_cost"]["headline_presented_as_total_cost"] = True
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY")
        self.assertEqual(
            check_status(v, "headline_not_presented_as_total_cost"),
            "fail")

    def test_total_cost_not_surfaced_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["total_cost"]["total_cost_surfaced"] = False
        self.assertEqual(
            evaluate(m)["verdict"],
            "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY")

    def test_constructed_total_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["construction"]["declared_constructed_total"] = 700
        m["construction"]["declared_savings"] = 200
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY")
        self.assertEqual(
            check_status(
                v, "constructed_total_matches_sum_of_leg_prices"),
            "fail")
        self.assertEqual(v["constructed_total_difference"],
                         "-50.000000")
        self.assertEqual(v["computed_savings"], "200.000000")

    def test_savings_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["construction"]["declared_savings"] = 100
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY")
        self.assertEqual(
            check_status(
                v,
                "declared_savings_matches_baseline_minus_constructed_total"),
            "fail")
        self.assertEqual(v["savings_difference"], "-50.000000")

    def test_savings_at_other_values_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["construction"]["baseline_direct_fare"] = 1000
        m["construction"]["declared_savings"] = 250
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY")
        self.assertEqual(v["computed_savings"], "250.000000")

    def test_missing_savings_number_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["construction"]["baseline_direct_fare"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_savings"])
        self.assertEqual(v["computed_constructed_total"], "750.000000")

    def test_missing_legs_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["construction"]["legs"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "construction_legs_complete"), "missing")
        self.assertEqual(v["legs_evaluated"], 0)
        self.assertIsNone(v["computed_constructed_total"])
        self.assertEqual(v["computed_savings"], "150.000000")

    def test_empty_legs_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["construction"]["legs"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "constructed_total_matches_sum_of_leg_prices"),
            "missing")

    def test_incomplete_leg_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["construction"]["legs"][1]["price"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "construction_legs_complete"), "missing")
        self.assertEqual(v["legs_evaluated"], 1)
        self.assertIsNone(v["computed_constructed_total"])

    def test_missing_declared_constructed_total_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["construction"]["declared_constructed_total"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "constructed_total_matches_sum_of_leg_prices"),
            "missing")
        self.assertEqual(v["computed_constructed_total"], "750.000000")
        self.assertIsNone(v["constructed_total_difference"])

    def test_single_leg_construction_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["construction"]["legs"] = [{"label": "only_leg", "price": 750}]
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY")
        self.assertEqual(v["legs_evaluated"], 1)

    def test_origin_missing_is_insufficient(self):
        m = copy.deepcopy(COMPLETE)
        del m["trip"]["origin"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["trip_definition"],
                         "insufficient_evidence")

    def test_empty_destination_string_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["trip"]["destination"] = ""
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY")
        self.assertEqual(check_status(v, "destination_declared"), "fail")

    def test_flexibility_not_declared_section_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["trip"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["trip_definition"],
                         "insufficient_evidence")

    def test_advance_purchase_not_explained_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["drivers"]["advance_purchase_explained"] = False
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY")
        self.assertEqual(v["sections"]["fare_drivers_explained"], "fail")

    def test_nearby_airports_not_considered_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["drivers"]["nearby_airports_considered"] = False
        self.assertEqual(
            evaluate(m)["verdict"],
            "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY")

    def test_price_only_without_strategy_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["strategy"]["price_only_without_strategy"] = True
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY")
        self.assertEqual(v["sections"]["search_strategy"], "fail")
        self.assertEqual(
            check_status(v, "not_price_only_without_strategy"), "fail")

    def test_search_strategy_not_given_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["strategy"]["search_strategy_given"] = False
        self.assertEqual(
            evaluate(m)["verdict"],
            "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY")

    def test_prices_invented_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["integrity"]["prices_invented"] = True
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY")
        self.assertEqual(v["sections"]["price_integrity"], "fail")
        self.assertEqual(check_status(v, "prices_not_invented"), "fail")

    def test_recheck_not_advised_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["integrity"]["recheck_before_booking_advised"] = False
        self.assertEqual(
            evaluate(m)["verdict"],
            "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY")

    def test_uncheckable_items_not_disclosed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["integrity"]["uncheckable_items_disclosed"] = False
        self.assertEqual(
            evaluate(m)["verdict"],
            "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY")

    def test_constructed_not_compared_to_direct_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["construction"]["constructed_option_compared_to_direct"] = False
        v = evaluate(m)
        self.assertEqual(
            v["verdict"], "FARE_CONSTRUCTION_SAVINGS_STRATEGY_NOT_READY")
        self.assertEqual(v["sections"]["fare_construction"], "fail")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["integrity"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["price_integrity"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertEqual(v["legs_evaluated"], 0)
        self.assertIsNone(v["computed_constructed_total"])
        self.assertIsNone(v["computed_total_cost"])
        self.assertIsNone(v["computed_savings"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn(
            "VERDICT: FARE_CONSTRUCTION_SAVINGS_STRATEGY_READY",
            stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with TypeError naming the field — never
    evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["trip_label"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("trip_label", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"trip": "should-be-an-object"})
        self.assertIn("trip", str(ctx.exception))

    def test_trip_string_leaf_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["trip"]["origin"] = 403
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("trip.origin", str(ctx.exception))

    def test_legs_list_as_object_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["construction"]["legs"] = {"label": "leg_1"}
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("construction.legs", str(ctx.exception))

    def test_leg_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["construction"]["legs"][0] = "leg_1"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("construction.legs[0]", str(ctx.exception))

    def test_leg_price_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["construction"]["legs"][1]["price"] = "450"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("construction.legs[1].price", str(ctx.exception))

    def test_leg_label_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["construction"]["legs"][0]["label"] = 1
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("construction.legs[0].label", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["drivers"]["split_tickets_considered"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("drivers.split_tickets_considered",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["total_cost"]["headline_fare"] = "800"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("total_cost.headline_fare", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["construction"]["declared_savings"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("construction.declared_savings",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["integrity"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("integrity", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
