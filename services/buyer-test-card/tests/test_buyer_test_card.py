import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from buyer_test_card import evaluate, stamp  # noqa: E402

COMPLETE = {
    "idea": "A two-week POC of a new search backend for the house stack",
    "decision": "adopt",
    "disposition": "disposable",
    "hypothesis": {"written": True,
                   "single": True,
                   "states_capability_under_constraints": True},
    "criteria": {"success_written_before_start": True,
                 "kill_written_before_start": True,
                 "agreed_by_decision_owner_before_build": True},
    "timebox": {"hard_limit_set": True,
                "limit_days": 10,
                "elapsed_days": 8,
                "scope_limited_to_critical_path": True,
                "scope_creep_refused_politely": True},
    "evidence": {"from_measurements_tests_or_demo": True,
                 "numbers_over_impressions": True,
                 "stubs_and_mocks_recorded": True},
    "production_boundary": {"slid_into_production": False,
                            "claimed_as_production_evidence": False},
    "findings": {"memo_written": True,
                 "rationale_references_criteria": True,
                 "decision_logged": True,
                 "not_tested_list_clear": True,
                 "adopting_routed_through_full_team_process": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_card_complete(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "CARD_COMPLETE")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 22)
        self.assertEqual(v["timebox_limit_days"], 10)
        self.assertEqual(v["timebox_elapsed_days"], 8)
        self.assertEqual(v["timebox_overrun_days"], "-2.000000")
        self.assertEqual(v["decision"], "adopt")
        self.assertEqual(v["disposition"], "disposable")

    def test_elapsed_exactly_at_limit_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["elapsed_days"] = 10
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_COMPLETE")
        self.assertEqual(v["timebox_overrun_days"], "0.000000")

    def test_elapsed_above_limit_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["elapsed_days"] = 13
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(v["sections"]["timebox_and_scope"], "fail")
        self.assertEqual(
            check_status(v, "timebox_within_declared_limit"), "fail")
        self.assertEqual(v["timebox_overrun_days"], "3.000000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_zero_timebox_limit_fails_unbounded(self):
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["limit_days"] = 0
        m["timebox"]["elapsed_days"] = 0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "timebox_within_declared_limit"), "fail")

    def test_negative_elapsed_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["elapsed_days"] = -1
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_fractional_days_within_limit_pass(self):
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["limit_days"] = 2.5
        m["timebox"]["elapsed_days"] = 2.25
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_COMPLETE")
        self.assertEqual(v["timebox_overrun_days"], "-0.250000")

    def test_missing_timebox_numbers_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["timebox"]["elapsed_days"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "timebox_within_declared_limit"), "missing")
        self.assertIsNone(v["computed_status"])
        self.assertEqual(v["timebox_limit_days"], 10)
        self.assertIsNone(v["timebox_elapsed_days"])
        self.assertIsNone(v["timebox_overrun_days"])

    def test_long_timebox_not_capped_by_invented_threshold(self):
        # The skill states no numeric cap ("days, not weeks" states
        # no number); a 60-day declared limit honoured by the
        # elapsed time passes the computed check on its own terms.
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["limit_days"] = 60
        m["timebox"]["elapsed_days"] = 45
        self.assertEqual(evaluate(m)["verdict"], "CARD_COMPLETE")

    def test_each_stated_decision_passes(self):
        for decision in ("adopt", "adapt", "abandon"):
            m = copy.deepcopy(COMPLETE)
            m["decision"] = decision
            self.assertEqual(evaluate(m)["verdict"], "CARD_COMPLETE")

    def test_unstated_decision_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["decision"] = "ship_it"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "decision_is_a_stated_option"), "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_missing_decision_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["decision"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "decision_is_a_stated_option"), "missing")

    def test_each_stated_disposition_passes(self):
        for disposition in ("disposable", "slated_for_hardening"):
            m = copy.deepcopy(COMPLETE)
            m["disposition"] = disposition
            self.assertEqual(evaluate(m)["verdict"], "CARD_COMPLETE")

    def test_unstated_disposition_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["disposition"] = "production"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(
            check_status(v, "disposition_is_a_stated_option"), "fail")

    def test_missing_disposition_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["disposition"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "disposition_is_a_stated_option"),
            "missing")

    def test_hypothesis_not_written_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["hypothesis"]["written"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(v["sections"]["hypothesis"], "fail")

    def test_multiple_hypotheses_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["hypothesis"]["single"] = False
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_kill_criteria_not_written_before_start_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"]["kill_written_before_start"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(v["sections"]["criteria_upfront"], "fail")

    def test_criteria_not_agreed_by_owner_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"]["agreed_by_decision_owner_before_build"] = False
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_scope_creep_not_refused_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["scope_creep_refused_politely"] = False
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_slid_into_production_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["production_boundary"]["slid_into_production"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(
            v["sections"]["disposition_and_production_boundary"],
            "fail")

    def test_claimed_as_production_evidence_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["production_boundary"]["claimed_as_production_evidence"] = True
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_stubs_not_recorded_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["evidence"]["stubs_and_mocks_recorded"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CARD_NOT_COMPLETE")
        self.assertEqual(v["sections"]["evidence"], "fail")

    def test_rationale_not_referencing_criteria_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["findings"]["rationale_references_criteria"] = False
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_not_tested_list_not_clear_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["findings"]["not_tested_list_clear"] = False
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_adopting_not_routed_through_full_process_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["findings"]["adopting_routed_through_full_team_process"] = False
        self.assertEqual(evaluate(m)["verdict"], "CARD_NOT_COMPLETE")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["evidence"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["evidence"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["timebox_limit_days"])
        self.assertIsNone(v["timebox_elapsed_days"])
        self.assertIsNone(v["timebox_overrun_days"])
        self.assertIsNone(v["decision"])
        self.assertIsNone(v["disposition"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: CARD_COMPLETE", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["idea"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("idea", str(ctx.exception))

    def test_vocabulary_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["decision"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("decision", str(ctx.exception))

    def test_vocabulary_string_field_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["disposition"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("disposition", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"hypothesis": "should-be-an-object"})
        self.assertIn("hypothesis", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["hypothesis"]["written"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("hypothesis.written", str(ctx.exception))

    def test_boolean_leaf_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["production_boundary"]["slid_into_production"] = 1
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("production_boundary.slid_into_production",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["limit_days"] = "10 days"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("timebox.limit_days", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["timebox"]["elapsed_days"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("timebox.elapsed_days", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["criteria"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("criteria", str(ctx.exception))

    def test_null_leaf_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["findings"]["decision_logged"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("findings.decision_logged", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
