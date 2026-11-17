import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from observability_and_runbook_design import evaluate, stamp  # noqa: E402

COMPLETE = {
    "service_name": "checkout-api",
    "signals": {"structured_logs_with_correlation_ids": True,
                "metrics_cover_requests": True,
                "metrics_cover_errors": True,
                "metrics_cover_latency": True,
                "metrics_cover_saturation": True,
                "traces_or_timings_at_every_edge": True,
                "health_signal_emitted": True,
                "error_rate_signal_emitted": True,
                "latency_signal_emitted": True,
                "dashboards_present": True},
    "alert_design": {"alert_set_symptom_based": True,
                     "alert_thresholds_tuned_to_reality": True,
                     "alert_noise_controls_present": True},
    "alerts": [
        {"name": "checkout-error-rate-high", "owner": "checkout-oncall",
         "runbook_linked": True, "actionable": True,
         "symptom_based": True},
        {"name": "checkout-latency-high", "owner": "checkout-oncall",
         "runbook_linked": True, "actionable": True,
         "symptom_based": True},
        {"name": "payment-queue-saturated", "owner": "payments-oncall",
         "runbook_linked": True, "actionable": True,
         "symptom_based": True},
    ],
    "failure_modes": [
        {"name": "database-unavailable", "runbook_present": True,
         "symptoms_described": True, "check_steps_present": True,
         "mitigation_present": True, "escalation_present": True,
         "recovery_verification_present": True},
        {"name": "payment-provider-outage", "runbook_present": True,
         "symptoms_described": True, "check_steps_present": True,
         "mitigation_present": True, "escalation_present": True,
         "recovery_verification_present": True},
    ],
    "incident": {"acknowledge_step_defined": True,
                 "blast_radius_assessment_step_defined": True,
                 "stabilize_step_defined": True,
                 "rollback_as_first_stabilize_option": True,
                 "status_communication_step_defined": True,
                 "fix_step_defined": True,
                 "blameless_postmortem_required": True,
                 "postmortem_actions_tracked_to_closure": True},
    "resilience": {"backup_schedule_declared": True,
                   "backup_restores_tested": True,
                   "restore_tested_at_least_once_per_season": True,
                   "unattended_jobs_have_health_signals": True,
                   "jobs_emit_success_heartbeats": True},
    "red_lines": {"paging_on_unactionable_causes_present": False,
                  "unowned_alerts_present": False,
                  "monitoring_disabled_to_hide_problem_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "OBSERVABILITY_DESIGN_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 43)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["alerts_count"], 3)
        self.assertEqual(v["alerts_without_owner"], [])
        self.assertEqual(v["owner_coverage"], "1.000000")
        self.assertEqual(v["alerts_without_runbook_link"], [])
        self.assertEqual(v["runbook_link_coverage"], "1.000000")
        self.assertEqual(v["duplicate_alert_names"], [])
        self.assertEqual(v["failure_modes_count"], 2)
        self.assertEqual(v["failure_modes_without_runbook"], [])
        self.assertEqual(v["runbook_coverage"], "1.000000")
        self.assertEqual(v["duplicate_failure_mode_names"], [])

    def test_no_health_signal_fails_section1(self):
        m = copy.deepcopy(COMPLETE)
        m["signals"]["health_signal_emitted"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "OBSERVABILITY_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["signals_and_dashboards"], "fail")
        self.assertEqual(check_status(v, "health_signal_emitted"), "fail")

    def test_no_correlation_ids_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["signals"]["structured_logs_with_correlation_ids"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "OBSERVABILITY_DESIGN_NOT_SOUND")

    def test_alert_without_owner_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["alerts"][0]["owner"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "OBSERVABILITY_DESIGN_NOT_SOUND")
        self.assertEqual(check_status(v, "every_alert_has_owner"), "fail")
        self.assertEqual(v["alerts_without_owner"],
                         ["checkout-error-rate-high"])
        self.assertEqual(v["owner_coverage"], "0.666667")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_alert_missing_owner_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["alerts"][0]["owner"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "every_alert_has_owner"),
                         "missing")
        self.assertEqual(v["alerts_without_owner"], [])

    def test_alert_without_runbook_link_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["alerts"][1]["runbook_linked"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_alert_links_runbook"),
                         "fail")
        self.assertEqual(v["alerts_without_runbook_link"],
                         ["checkout-latency-high"])
        self.assertEqual(v["runbook_link_coverage"], "0.666667")

    def test_alert_not_actionable_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["alerts"][2]["actionable"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_alert_is_actionable"),
                         "fail")
        self.assertEqual(v["alerts_without_actionable"],
                         ["payment-queue-saturated"])
        self.assertEqual(v["actionable_coverage"], "0.666667")

    def test_alert_not_symptom_based_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["alerts"][0]["symptom_based"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_alert_is_symptom_based"), "fail")
        self.assertEqual(v["alerts_without_symptom_basis"],
                         ["checkout-error-rate-high"])
        self.assertEqual(v["symptom_based_coverage"], "0.666667")

    def test_duplicate_alert_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["alerts"][2]["name"] = "checkout-error-rate-high"
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_alert_name_duplicated"),
                         "fail")
        self.assertEqual(v["duplicate_alert_names"],
                         ["checkout-error-rate-high"])

    def test_alert_missing_name_is_missing_for_duplicate_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["alerts"][2]["name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "no_alert_name_duplicated"),
                         "missing")
        self.assertEqual(v["duplicate_alert_names"], [])

    def test_empty_alerts_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["alerts"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "alerts_declared"), "fail")
        self.assertEqual(v["alerts_count"], 0)
        self.assertIsNone(v["owner_coverage"])
        self.assertIsNone(v["runbook_link_coverage"])
        self.assertEqual(v["duplicate_alert_names"], [])

    def test_failure_mode_without_runbook_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"][0]["runbook_present"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_failure_mode_has_runbook"), "fail")
        self.assertEqual(v["failure_modes_without_runbook"],
                         ["database-unavailable"])
        self.assertEqual(v["runbook_coverage"], "0.500000")

    def test_runbook_without_mitigation_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"][1]["mitigation_present"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_runbook_has_mitigation"), "fail")
        self.assertEqual(v["failure_modes_without_mitigation"],
                         ["payment-provider-outage"])
        self.assertEqual(v["mitigation_coverage"], "0.500000")

    def test_runbook_missing_escalation_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["failure_modes"][0]["escalation_present"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_runbook_has_escalation"), "missing")
        self.assertEqual(v["failure_modes_without_escalation"], [])

    def test_runbook_without_recovery_verification_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"][0]["recovery_verification_present"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_runbook_has_recovery_verification"),
            "fail")
        self.assertEqual(
            v["failure_modes_without_recovery_verification"],
            ["database-unavailable"])
        self.assertEqual(v["recovery_verification_coverage"], "0.500000")

    def test_duplicate_failure_mode_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"][1]["name"] = "database-unavailable"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_failure_mode_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_failure_mode_names"],
                         ["database-unavailable"])

    def test_empty_failure_modes_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "failure_modes_declared"),
                         "fail")
        self.assertEqual(v["failure_modes_count"], 0)
        self.assertIsNone(v["runbook_coverage"])

    def test_no_rollback_first_option_fails_section4(self):
        m = copy.deepcopy(COMPLETE)
        m["incident"]["rollback_as_first_stabilize_option"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "OBSERVABILITY_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["incident_flow_and_postmortem"],
                         "fail")

    def test_postmortem_actions_not_tracked_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["incident"]["postmortem_actions_tracked_to_closure"] = False
        self.assertEqual(
            check_status(evaluate(m),
                         "postmortem_actions_tracked_to_closure"),
            "fail")

    def test_restores_not_tested_fails_section5(self):
        m = copy.deepcopy(COMPLETE)
        m["resilience"]["backup_restores_tested"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "OBSERVABILITY_DESIGN_NOT_SOUND")
        self.assertEqual(
            v["sections"]["backups_silent_failure_and_red_lines"],
            "fail")

    def test_no_success_heartbeats_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["resilience"]["jobs_emit_success_heartbeats"] = False
        self.assertEqual(
            check_status(evaluate(m), "jobs_emit_success_heartbeats"),
            "fail")

    def test_paging_on_unactionable_causes_fails_red_lines(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["paging_on_unactionable_causes_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_paging_on_unactionable_causes"), "fail")
        self.assertEqual(
            v["sections"]["backups_silent_failure_and_red_lines"],
            "fail")

    def test_unowned_alerts_and_disabled_monitoring_red_lines_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"]["unowned_alerts_present"] = True
        m["red_lines"]["monitoring_disabled_to_hide_problem_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_unowned_alerts"), "fail")
        self.assertEqual(
            check_status(v, "monitoring_never_disabled_to_hide_problem"),
            "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["incident"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["incident_flow_and_postmortem"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["alerts_count"])
        self.assertIsNone(v["alerts_without_owner"])
        self.assertIsNone(v["owner_coverage"])
        self.assertIsNone(v["duplicate_alert_names"])
        self.assertIsNone(v["failure_modes_count"])
        self.assertIsNone(v["failure_modes_without_runbook"])
        self.assertIsNone(v["runbook_coverage"])
        self.assertIsNone(v["duplicate_failure_mode_names"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: OBSERVABILITY_DESIGN_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["service_name"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("service_name", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"signals": "should-be-an-object"})
        self.assertIn("signals", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"alerts": {"name": "checkout-error-rate-high"}})
        self.assertIn("alerts", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"alerts": ["checkout-error-rate-high"]})
        self.assertIn("alerts[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["signals"]["health_signal_emitted"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("signals.health_signal_emitted",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["alerts"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("alerts[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["failure_modes"][1]["mitigation_present"] = "true"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("failure_modes[1].mitigation_present",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["incident"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("incident", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
