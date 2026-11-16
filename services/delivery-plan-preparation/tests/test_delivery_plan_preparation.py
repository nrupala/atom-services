import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from delivery_plan_preparation import evaluate, stamp  # noqa: E402

COMPLETE = {
    "plan": "atlas-launch",
    "framing": {"goal_declared": True,
                "deliverable_declared": True,
                "constraints_declared": True,
                "definition_of_done_declared": True,
                "plan_approved_before_build": True,
                "build_started_before_approval": False},
    "phases": [
        {"name": "discovery", "owner": "lead",
         "exit_criteria_declared": True,
         "start_date": "2027-01-05", "end_date": "2027-01-16",
         "depends_on": [], "size": "S", "assumptions_declared": True},
        {"name": "build", "owner": "lead",
         "exit_criteria_declared": True,
         "start_date": "2027-01-19", "end_date": "2027-02-13",
         "depends_on": ["discovery"], "size": "L",
         "assumptions_declared": True},
        {"name": "rollout", "owner": "ops",
         "exit_criteria_declared": True,
         "start_date": "2027-02-16", "end_date": "2027-02-27",
         "depends_on": ["build"], "size": "M",
         "assumptions_declared": True},
    ],
    "milestones": [
        {"name": "scope-locked", "phase": "discovery",
         "owner": "lead", "due_date": "2027-01-16"},
        {"name": "beta-ready", "phase": "build",
         "owner": "lead", "due_date": "2027-02-13"},
        {"name": "launched", "phase": "rollout",
         "owner": "ops", "due_date": "2027-02-27"},
    ],
    "estimation": {"least_known_item_flagged_as_top_risk": True},
    "risks": [
        {"name": "vendor-delay", "mitigation_declared": True,
         "trigger_declared": True},
        {"name": "scope-creep", "mitigation_declared": True,
         "trigger_declared": True},
    ],
    "risk_management": {"register_reviewed_each_phase": True},
    "decisions": [
        {"date": "2027-01-06", "decision": "phase-gate rollout",
         "rationale_declared": True, "alternatives_declared": True},
    ],
    "decision_log": {"append_only": True,
                     "logged_at_decision_time": True},
    "execution": {"wip_limit_declared": True,
                  "one_worked_item_per_lane": True,
                  "plan_updates_through_approval": True,
                  "silent_rescoping_present": False,
                  "deploys_hitl_approved": True,
                  "direct_to_production_change_present": False},
    "status": {"phase_declared": True, "done_declared": True,
               "next_declared": True, "blockers_declared": True,
               "confidence_declared": True},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "DELIVERY_PLAN_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 38)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["phases_count"], 3)
        self.assertEqual(v["phases_without_owner"], [])
        self.assertEqual(v["owner_coverage"], "1.0000")
        self.assertEqual(v["unknown_dependencies"], [])
        self.assertEqual(v["dependency_order_violations"], [])
        self.assertEqual(v["dependency_coverage"], "1.0000")
        self.assertEqual(v["total_duration_days"], 53)
        self.assertEqual(v["milestones_count"], 3)
        self.assertEqual(v["milestone_phase_coverage"], "1.0000")
        self.assertEqual(v["risks_count"], 2)
        self.assertEqual(v["decisions_count"], 1)
        self.assertEqual(v["decisions_incomplete"], [])

    def test_plan_not_approved_fails_framing_section(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["plan_approved_before_build"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERY_PLAN_NOT_READY")
        self.assertEqual(v["sections"]["framing_and_approval"], "fail")

    def test_build_started_before_approval_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["build_started_before_approval"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERY_PLAN_NOT_READY")
        self.assertEqual(
            check_status(v, "no_build_started_before_approval"), "fail")

    def test_phase_without_owner_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["phases"][1]["owner"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERY_PLAN_NOT_READY")
        self.assertEqual(
            check_status(v, "every_phase_has_owner_named"), "fail")
        self.assertEqual(v["phases_without_owner"], ["build"])
        self.assertEqual(v["owner_coverage"], "0.6667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_phase_missing_owner_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["phases"][0]["owner"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_phase_has_owner_named"), "missing")
        self.assertEqual(v["phases_without_owner"], ["discovery"])

    def test_phase_without_exit_criteria_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["phases"][0]["exit_criteria_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERY_PLAN_NOT_READY")
        self.assertEqual(v["phases_without_exit_criteria"],
                         ["discovery"])

    def test_empty_phases_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["phases"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "phases_declared"), "fail")
        self.assertEqual(v["phases_count"], 0)
        self.assertIsNone(v["owner_coverage"])
        self.assertIsNone(v["total_duration_days"])

    def test_invalid_size_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["phases"][0]["size"] = "XL"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_phase_has_skill_size"), "fail")

    def test_inverted_phase_dates_fail_and_are_named(self):
        m = copy.deepcopy(COMPLETE)
        m["phases"][0]["end_date"] = "2027-01-01"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_phase_dates_valid_and_in_order"),
            "fail")
        self.assertEqual(v["phases_with_date_problems"], ["discovery"])

    def test_invalid_date_string_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["phases"][1]["start_date"] = "2027-02-30"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_phase_dates_valid_and_in_order"),
            "fail")
        self.assertEqual(v["phases_with_date_problems"], ["build"])
        self.assertIsNone(v["total_duration_days"])

    def test_unknown_dependency_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["phases"][1]["depends_on"] = ["discovery", "qa-signoff"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERY_PLAN_NOT_READY")
        self.assertEqual(
            check_status(v, "every_dependency_names_declared_phase"),
            "fail")
        self.assertEqual(v["unknown_dependencies"],
                         ["build->qa-signoff"])
        self.assertEqual(v["dependency_coverage"], "0.6667")

    def test_dependency_ending_after_dependent_starts_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["phases"][1]["start_date"] = "2027-01-10"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_dependency_precedes_dependent"),
            "fail")
        self.assertEqual(v["dependency_order_violations"],
                         ["build->discovery"])

    def test_milestone_with_unknown_phase_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["milestones"][0]["phase"] = "research"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_milestone_names_declared_phase"),
            "fail")
        self.assertEqual(v["milestones_with_unknown_phase"],
                         ["scope-locked"])
        self.assertEqual(v["milestone_phase_coverage"], "0.6667")

    def test_milestone_due_outside_phase_dates_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["milestones"][1]["due_date"] = "2027-02-20"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_milestone_due_within_phase_dates"),
            "fail")
        self.assertEqual(v["milestones_due_outside_phase_dates"],
                         ["beta-ready"])

    def test_milestone_without_owner_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["milestones"][2]["owner"] = ""
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_milestone_has_owner_named"), "fail")
        self.assertEqual(v["milestones_without_owner"], ["launched"])

    def test_risk_without_trigger_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["risks"][0]["trigger_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERY_PLAN_NOT_READY")
        self.assertEqual(v["sections"]["risks_estimates_and_decisions"],
                         "fail")
        self.assertEqual(v["risks_without_trigger"], ["vendor-delay"])

    def test_risk_without_mitigation_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["risks"][1]["mitigation_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["risks_without_mitigation"], ["scope-creep"])

    def test_phase_without_assumptions_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["phases"][2]["assumptions_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_phase_declares_assumptions"),
            "fail")

    def test_least_known_not_flagged_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["estimation"]["least_known_item_flagged_as_top_risk"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "DELIVERY_PLAN_NOT_READY")

    def test_decision_without_alternatives_is_incomplete(self):
        m = copy.deepcopy(COMPLETE)
        m["decisions"][0]["alternatives_declared"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_decision_entry_complete"), "fail")
        self.assertEqual(v["decisions_incomplete"],
                         ["phase-gate rollout"])

    def test_decision_with_invalid_date_is_incomplete(self):
        m = copy.deepcopy(COMPLETE)
        m["decisions"][0]["date"] = "Jan 6"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_decision_entry_complete"), "fail")

    def test_decision_log_not_append_only_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["decision_log"]["append_only"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "DELIVERY_PLAN_NOT_READY")

    def test_silent_rescoping_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["execution"]["silent_rescoping_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DELIVERY_PLAN_NOT_READY")
        self.assertEqual(
            v["sections"]["execution_discipline_and_status"], "fail")

    def test_direct_to_production_change_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["execution"]["direct_to_production_change_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "DELIVERY_PLAN_NOT_READY")

    def test_deploys_not_hitl_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["execution"]["deploys_hitl_approved"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "DELIVERY_PLAN_NOT_READY")

    def test_status_confidence_missing_is_insufficient(self):
        m = copy.deepcopy(COMPLETE)
        del m["status"]["confidence_declared"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            v["sections"]["execution_discipline_and_status"],
            "insufficient_evidence")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["status"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            v["sections"]["execution_discipline_and_status"],
            "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["phases_count"])
        self.assertIsNone(v["phases_without_owner"])
        self.assertIsNone(v["owner_coverage"])
        self.assertIsNone(v["unknown_dependencies"])
        self.assertIsNone(v["dependency_coverage"])
        self.assertIsNone(v["total_duration_days"])
        self.assertIsNone(v["milestone_phase_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: DELIVERY_PLAN_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["plan"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("plan", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"framing": "should-be-an-object"})
        self.assertIn("framing", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"phases": {"name": "discovery"}})
        self.assertIn("phases", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"phases": ["discovery"]})
        self.assertIn("phases[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["framing"]["goal_declared"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("framing.goal_declared", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["phases"][1]["owner"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("phases[1].owner", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["phases"][0]["exit_criteria_declared"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("phases[0].exit_criteria_declared",
                      str(ctx.exception))

    def test_depends_on_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["phases"][1]["depends_on"] = [123]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("phases[1].depends_on[0]", str(ctx.exception))

    def test_depends_on_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["phases"][1]["depends_on"] = "discovery"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("phases[1].depends_on", str(ctx.exception))

    def test_milestone_entry_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["milestones"][0]["due_date"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("milestones[0].due_date", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["status"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("status", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
