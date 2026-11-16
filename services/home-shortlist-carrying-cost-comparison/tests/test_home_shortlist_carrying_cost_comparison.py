import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from home_shortlist_carrying_cost_comparison import (  # noqa: E402
    evaluate, stamp)

COMPLETE = {
    "search_name": "calgary-family-search",
    "currency": "CAD",
    "criteria": {"written_before_search": True,
                 "area": "Calgary NW",
                 "property_type": "detached",
                 "budget_ceiling": 800000,
                 "must_haves_defined": True,
                 "deal_breakers_defined": True},
    "homes": [
        {"name": "maple-house", "listing_source": "realtor-ca",
         "fetch_date": "2026-11-10", "status": "live",
         "asking_price": 750000,
         "monthly_housing_payment": 3200,
         "monthly_property_tax": 350.5,
         "monthly_utilities_estimate": 280,
         "monthly_condo_or_hoa_fees": 0,
         "declared_monthly_carrying_cost": 3830.5,
         "open_questions": ["age of roof?"],
         "meets_criteria": True},
        {"name": "birch-condo", "listing_source": "mls-feed",
         "fetch_date": "2026-11-11", "status": "viewed",
         "asking_price": 520000,
         "monthly_housing_payment": 2100,
         "monthly_property_tax": 210,
         "monthly_utilities_estimate": 150,
         "monthly_condo_or_hoa_fees": 425,
         "declared_monthly_carrying_cost": 2885,
         "open_questions": [],
         "meets_criteria": True},
        {"name": "cedar-house", "listing_source": "realtor-ca",
         "fetch_date": "2026-11-09", "status": "ruled_out",
         "ruled_out_reason": "no garage — deal-breaker",
         "asking_price": 690000,
         "monthly_housing_payment": 2900,
         "monthly_property_tax": 310,
         "monthly_utilities_estimate": 260,
         "monthly_condo_or_hoa_fees": 0,
         "declared_monthly_carrying_cost": 3470,
         "open_questions": ["furnace age?"],
         "meets_criteria": False},
    ],
    "tracking": {"tracked_in_one_list": True,
                 "refreshed_before_comparison": True,
                 "criteria_market_conflict_addressed": True},
    "presentation": {
        "ranked_on_carrying_cost_not_price_alone": True,
        "sources_and_fetch_dates_attached": True,
        "unknowns_presented_as_questions": True,
        "freshness_limits_stated": True,
        "presented_as_research_not_advice": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "HOME_SHORTLIST_COMPARISON_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 25)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["homes_count"], 3)

    def test_computed_carrying_costs_totals_and_ranking(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["monthly_carrying_costs"], [
            {"name": "maple-house",
             "monthly_carrying_cost": "3830.500000"},
            {"name": "birch-condo",
             "monthly_carrying_cost": "2885.000000"},
            {"name": "cedar-house",
             "monthly_carrying_cost": "3470.000000"},
        ])
        self.assertEqual(v["total_monthly_carrying_cost"], "10185.500000")
        self.assertEqual(v["lowest_monthly_carrying_cost"], "2885.000000")
        self.assertEqual(v["highest_monthly_carrying_cost"], "3830.500000")
        self.assertEqual(v["carrying_cost_spread"], "945.500000")
        # Ranked on carrying cost, NOT asking price: the cheapest
        # to carry (birch-condo) leads although cedar-house is not
        # the cheapest by price order either — cost order is
        # birch (2885) < cedar (3470) < maple (3830.5).
        self.assertEqual(v["ranked_home_names"],
                         ["birch-condo", "cedar-house", "maple-house"])
        self.assertEqual(v["cheapest_home_name"], "birch-condo")
        self.assertEqual(v["cost_figure_coverage"], "1.000000")
        self.assertEqual(v["homes_over_budget_ceiling"], [])
        self.assertEqual(v["homes_within_budget_count"], 3)
        self.assertIs(v["any_home_within_budget"], True)
        self.assertEqual(v["homes_not_meeting_criteria"], ["cedar-house"])
        self.assertEqual(v["homes_with_carrying_cost_mismatch"], [])

    def test_ranking_ties_keep_declared_order(self):
        m = copy.deepcopy(COMPLETE)
        m["homes"][2]["monthly_housing_payment"] = 2315
        m["homes"][2]["declared_monthly_carrying_cost"] = 2885
        v = evaluate(m)
        self.assertEqual(v["ranked_home_names"],
                         ["birch-condo", "cedar-house", "maple-house"])

    def test_criteria_not_written_first_fails_criteria_section(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"]["written_before_search"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "HOME_SHORTLIST_COMPARISON_NOT_READY")
        self.assertEqual(v["sections"]["criteria_first"], "fail")

    def test_empty_area_fails_and_missing_area_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"]["area"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(v, "criteria_area_declared"), "fail")
        m2 = copy.deepcopy(COMPLETE)
        del m2["criteria"]["area"]
        v2 = evaluate(m2)
        self.assertEqual(v2["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v2, "criteria_area_declared"),
                         "missing")

    def test_zero_budget_ceiling_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"]["budget_ceiling"] = 0
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "criteria_budget_ceiling_declared"), "fail")
        # No computable budget comparison at a declared ceiling of
        # zero is still arithmetic: every priced home is over it.
        self.assertEqual(v["homes_over_budget_ceiling"],
                         ["maple-house", "birch-condo", "cedar-house"])
        self.assertIs(v["any_home_within_budget"], False)

    def test_home_over_budget_is_reported_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        m["homes"][0]["asking_price"] = 850000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "HOME_SHORTLIST_COMPARISON_READY")
        self.assertEqual(v["homes_over_budget_ceiling"], ["maple-house"])
        self.assertEqual(v["homes_within_budget_count"], 2)
        self.assertIs(v["any_home_within_budget"], True)

    def test_missing_budget_ceiling_nulls_budget_outputs(self):
        m = copy.deepcopy(COMPLETE)
        del m["criteria"]["budget_ceiling"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["homes_over_budget_ceiling"])
        self.assertIsNone(v["homes_within_budget_count"])
        self.assertIsNone(v["any_home_within_budget"])

    def test_empty_currency_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["currency"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(v, "currency_declared"), "fail")

    def test_empty_homes_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["homes"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "homes_declared"), "fail")
        self.assertEqual(v["homes_count"], 0)
        self.assertEqual(v["monthly_carrying_costs"], [])
        self.assertEqual(v["ranked_home_names"], [])
        self.assertIsNone(v["cheapest_home_name"])
        self.assertIsNone(v["total_monthly_carrying_cost"])
        self.assertIsNone(v["cost_figure_coverage"])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_home_without_source_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["homes"][1]["listing_source"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "HOME_SHORTLIST_COMPARISON_NOT_READY")
        self.assertEqual(
            check_status(v, "every_home_names_listing_source"), "fail")
        self.assertEqual(v["homes_without_listing_source"], ["birch-condo"])

    def test_home_missing_source_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["homes"][0]["listing_source"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_home_names_listing_source"), "missing")
        self.assertEqual(v["homes_without_listing_source"], ["maple-house"])

    def test_home_missing_fetch_date_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["homes"][2]["fetch_date"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_home_names_fetch_date"), "missing")
        self.assertEqual(v["homes_without_fetch_date"], ["cedar-house"])

    def test_invalid_status_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["homes"][0]["status"] = "pending"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_home_declares_stated_status"), "fail")
        self.assertEqual(v["homes_with_invalid_status"], ["maple-house"])
        self.assertEqual(v["verdict"], "HOME_SHORTLIST_COMPARISON_NOT_READY")

    def test_ruled_out_without_reason_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["homes"][2]["ruled_out_reason"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_ruled_out_home_has_reason"), "fail")
        self.assertEqual(v["ruled_out_homes_without_reason"],
                         ["cedar-house"])

    def test_ruled_out_missing_reason_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["homes"][2]["ruled_out_reason"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_ruled_out_home_has_reason"), "missing")
        self.assertEqual(v["ruled_out_homes_without_reason"], [])

    def test_no_ruled_out_homes_passes_reason_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["homes"][2]["status"] = "viewed"
        del m["homes"][2]["ruled_out_reason"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "HOME_SHORTLIST_COMPARISON_READY")
        self.assertEqual(
            check_status(v, "every_ruled_out_home_has_reason"), "pass")

    def test_missing_open_questions_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["homes"][1]["open_questions"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_home_lists_open_questions"), "missing")

    def test_missing_cost_component_nulls_that_home_only(self):
        m = copy.deepcopy(COMPLETE)
        del m["homes"][1]["monthly_condo_or_hoa_fees"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "every_home_declares_all_monthly_cost_components"),
            "missing")
        self.assertEqual(v["monthly_carrying_costs"][1],
                         {"name": "birch-condo",
                          "monthly_carrying_cost": None})
        self.assertEqual(v["total_monthly_carrying_cost"], "7300.500000")
        self.assertEqual(v["ranked_home_names"],
                         ["cedar-house", "maple-house"])
        self.assertEqual(v["cost_figure_coverage"], "0.666667")

    def test_negative_cost_component_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["homes"][0]["monthly_utilities_estimate"] = -10
        m["homes"][0]["declared_monthly_carrying_cost"] = 3540.5
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "every_home_declares_all_monthly_cost_components"),
            "fail")
        self.assertEqual(v["verdict"], "HOME_SHORTLIST_COMPARISON_NOT_READY")

    def test_declared_total_mismatch_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["homes"][0]["declared_monthly_carrying_cost"] = 3800
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "declared_carrying_costs_match_rederived"),
            "fail")
        self.assertEqual(v["homes_with_carrying_cost_mismatch"],
                         ["maple-house"])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")
        self.assertEqual(v["verdict"], "HOME_SHORTLIST_COMPARISON_NOT_READY")

    def test_missing_declared_total_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["homes"][2]["declared_monthly_carrying_cost"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "declared_carrying_costs_match_rederived"),
            "missing")
        self.assertEqual(v["homes_with_carrying_cost_mismatch"], [])

    def test_zero_or_negative_asking_price_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["homes"][1]["asking_price"] = 0
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_home_declares_asking_price"), "fail")

    def test_stale_candidates_not_refreshed_fails_tracking_section(self):
        m = copy.deepcopy(COMPLETE)
        m["tracking"]["refreshed_before_comparison"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "HOME_SHORTLIST_COMPARISON_NOT_READY")
        self.assertEqual(v["sections"]["tracking_and_refresh"], "fail")

    def test_ranked_on_price_alone_fails_presentation_section(self):
        m = copy.deepcopy(COMPLETE)
        m["presentation"]["ranked_on_carrying_cost_not_price_alone"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "HOME_SHORTLIST_COMPARISON_NOT_READY")
        self.assertEqual(v["sections"]["ranking_and_presentation"], "fail")
        self.assertEqual(
            check_status(
                v, "shortlist_ranked_on_carrying_cost_not_price_alone"),
            "fail")

    def test_freshness_limits_not_stated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["presentation"]["freshness_limits_stated"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "freshness_limits_stated"), "fail")
        self.assertEqual(v["verdict"], "HOME_SHORTLIST_COMPARISON_NOT_READY")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["tracking"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["tracking_and_refresh"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["homes_count"])
        self.assertIsNone(v["monthly_carrying_costs"])
        self.assertIsNone(v["total_monthly_carrying_cost"])
        self.assertIsNone(v["ranked_home_names"])
        self.assertIsNone(v["cheapest_home_name"])
        self.assertIsNone(v["homes_over_budget_ceiling"])
        self.assertIsNone(v["any_home_within_budget"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: HOME_SHORTLIST_COMPARISON_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with TypeError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["search_name"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("search_name", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"criteria": "should-be-an-object"})
        self.assertIn("criteria", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"homes": {"name": "maple-house"}})
        self.assertIn("homes", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"homes": ["maple-house"]})
        self.assertIn("homes[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"]["written_before_search"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("criteria.written_before_search", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"]["budget_ceiling"] = "800000"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("criteria.budget_ceiling", str(ctx.exception))

    def test_number_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["homes"][0]["asking_price"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("homes[0].asking_price", str(ctx.exception))

    def test_nested_list_entry_number_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["homes"][1]["monthly_condo_or_hoa_fees"] = "425"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("homes[1].monthly_condo_or_hoa_fees",
                      str(ctx.exception))

    def test_string_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["homes"][0]["open_questions"] = [42]
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("homes[0].open_questions[0]", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tracking"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("tracking", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
