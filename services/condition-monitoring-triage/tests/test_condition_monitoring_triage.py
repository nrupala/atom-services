import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from condition_monitoring_triage import evaluate, stamp  # noqa: E402

SOUND = {
    "asset": "MTR-101",
    "baseline": {"exists": True, "captured_under_known_load": True,
                 "repair_since_baseline": True,
                 "post_repair_baseline_captured": True},
    "monitoring": {"techniques_match_asset": True,
                   "fixed_route_points": True,
                   "same_instrument_class": True},
    "context": {"load_recorded": True, "ambient_recorded": True,
                "speed_recorded": True},
    "trending": {"deltas_vs_baseline_computed": True,
                 "rate_of_change_considered": True,
                 "repair_events_annotated": True},
    "bands": {"defined_per_standard_or_oem": True},
    "readings": [
        {"parameter": "vibration_mm_s", "value": 3.1, "watch_limit": 4.5,
         "warning_limit": 7.1, "action_limit": 11.0},
        {"parameter": "winding_temp_c", "value": 96, "watch_limit": 110,
         "warning_limit": 130, "action_limit": 155},
    ],
    "alarms": [
        {"id": "a1", "disposition": "watch", "reasoning_recorded": True,
         "recheck_interval_set": True, "work_request_raised": False},
    ],
    "escalation": {"findings_sent_with_trend_pack": True,
                   "alarm_closed_without_triage_note": False,
                   "condemned_or_cleared_on_single_reading": False},
}


class VerdictTests(unittest.TestCase):
    def test_sound_manifest_is_triage_sound(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertEqual(v["verdict"], "TRIAGE_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["highest_band"], "normal")

    def test_no_baseline_fails(self):
        m = copy.deepcopy(SOUND)
        m["baseline"]["exists"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_UNSOUND")
        self.assertEqual(v["sections"]["baseline"], "fail")

    def test_repair_without_post_repair_baseline_fails(self):
        m = copy.deepcopy(SOUND)
        m["baseline"]["post_repair_baseline_captured"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_UNSOUND")

    def test_no_repair_passes_post_repair_check_as_not_applicable(self):
        m = copy.deepcopy(SOUND)
        m["baseline"]["repair_since_baseline"] = False
        del m["baseline"]["post_repair_baseline_captured"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_SOUND")

    def test_readings_without_load_context_fail(self):
        m = copy.deepcopy(SOUND)
        m["context"]["load_recorded"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_UNSOUND")
        self.assertEqual(v["sections"]["context"], "fail")

    def test_action_band_reading_without_act_triage_fails(self):
        m = copy.deepcopy(SOUND)
        m["readings"][0]["value"] = 12.5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_UNSOUND")
        self.assertEqual(v["highest_band"], "action")
        self.assertEqual(v["sections"]["alert_bands_and_triage"], "fail")

    def test_action_band_reading_with_act_triage_passes(self):
        m = copy.deepcopy(SOUND)
        m["readings"][0]["value"] = 12.5
        m["alarms"].append(
            {"id": "a2", "disposition": "act", "reasoning_recorded": True,
             "recheck_interval_set": False, "work_request_raised": True})
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_SOUND")
        self.assertEqual(v["highest_band"], "action")

    def test_act_triage_without_work_request_fails(self):
        m = copy.deepcopy(SOUND)
        m["alarms"] = [
            {"id": "a2", "disposition": "act", "reasoning_recorded": True,
             "recheck_interval_set": False, "work_request_raised": False}]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_UNSOUND")

    def test_watch_triage_without_recheck_interval_fails(self):
        m = copy.deepcopy(SOUND)
        m["alarms"][0]["recheck_interval_set"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_UNSOUND")

    def test_alarm_without_reasoning_fails(self):
        m = copy.deepcopy(SOUND)
        m["alarms"][0]["reasoning_recorded"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_UNSOUND")

    def test_disordered_band_limits_fail(self):
        m = copy.deepcopy(SOUND)
        m["readings"][0]["warning_limit"] = 3.0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_UNSOUND")

    def test_warning_band_is_reported(self):
        m = copy.deepcopy(SOUND)
        m["readings"][1]["value"] = 140
        v = evaluate(m)
        self.assertEqual(v["highest_band"], "warning")

    def test_alarm_closed_without_note_is_a_red_line_fail(self):
        m = copy.deepcopy(SOUND)
        m["escalation"]["alarm_closed_without_triage_note"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_UNSOUND")
        self.assertEqual(v["sections"]["escalation"], "fail")

    def test_single_reading_condemnation_is_a_red_line_fail(self):
        m = copy.deepcopy(SOUND)
        m["escalation"]["condemned_or_cleared_on_single_reading"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "TRIAGE_UNSOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(SOUND)
        del m["trending"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["trending"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["highest_band"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(SOUND))
        self.assertIn("VERDICT: TRIAGE_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression (external verification Wave 1): a documented
    field present with the wrong JSON type is rejected with
    ValueError naming the field — never evaluated into a verdict.
    The first case mirrors the recorded external malformed input."""

    def test_recorded_malformed_case_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"asset": "Motor-001",
                      "baseline": "NOT_A_BOOLEAN_OBJECT"})
        self.assertIn("baseline", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"baseline": "NOT_A_BOOLEAN_OBJECT"})
        self.assertIn("baseline", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["baseline"]["exists"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("baseline.exists", str(ctx.exception))

    def test_readings_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"readings": "not-a-list"})
        self.assertIn("readings", str(ctx.exception))

    def test_reading_entry_number_as_string_rejected(self):
        m = copy.deepcopy(SOUND)
        m["readings"][0]["value"] = "high"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("readings[0].value", str(ctx.exception))

    def test_alarm_entry_string_as_number_rejected(self):
        m = copy.deepcopy(SOUND)
        m["alarms"][0]["disposition"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("alarms[0].disposition", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(SOUND)
        m["baseline"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("baseline", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
