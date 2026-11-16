import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from electrical_test_record_preparation import evaluate, stamp  # noqa: E402

READY = {
    "asset": "MTR-101",
    "record": {
        "asset_id_present": True,
        "datetime_present": True,
        "ambient_present": True,
        "load_condition_present": True,
        "instrument_named": True,
        "calibration_status_recorded": True,
        "test_method_reference_present": True,
        "acceptance_criteria_present": True,
        "verdict_value": "pass",
        "tester_named": True,
        "reviewer_named": True,
        "has_na_fields": True,
        "na_reasons_recorded": True,
        "is_critical_test": True,
        "reviewer_signoff_present": True,
    },
    "hygiene": {
        "asset_ids_consistent": True,
        "si_units_used": True,
        "conversions_noted": True,
        "iso_timestamps": True,
        "single_source_of_truth": True,
        "raw_data_overwritten": False,
        "photos_attached_and_named": True,
    },
    "readings": [
        {"point": "IR phase A", "value": 850, "unit": "Mohm",
         "acceptance_min": 100, "acceptance_max": 10000},
        {"point": "IR phase B", "value": 920, "unit": "Mohm",
         "acceptance_min": 100, "acceptance_max": 10000},
    ],
    "format": {
        "single_header_row": True,
        "tidy_long_format": True,
        "required_columns_present": True,
    },
    "trending": {
        "same_point_method_instrument_class": True,
        "plotted_vs_time": True,
        "load_varies": True,
        "plotted_vs_load": True,
        "repair_events_annotated": True,
        "control_bands_from_limits_or_baseline": True,
        "trends_updated_on_cadence": True,
        "anomalies_present": True,
        "anomalies_flagged_with_action": True,
    },
    "plotting": {
        "axes_labeled_with_units": True,
        "version_and_date_on_charts": True,
        "dual_axis_used": False,
        "out_of_band_points_present": True,
        "out_of_band_highlighted": True,
        "summary_sheet_per_asset": True,
    },
    "retention": {
        "archived_and_findable": True,
        "retention_per_policy": True,
        "superseded_revisions_exist": True,
        "superseded_retained_marked": True,
        "corrections_made": True,
        "correction_revision_notes_present": True,
        "raw_data_destroyed": False,
    },
}


class VerdictTests(unittest.TestCase):
    def test_ready_manifest_is_record_ready(self):
        v = evaluate(copy.deepcopy(READY))
        self.assertEqual(v["verdict"], "RECORD_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["readings_evaluated"], 2)
        self.assertEqual(v["readings_out_of_criteria"], 0)

    def test_blank_template_field_is_a_defect(self):
        m = copy.deepcopy(READY)
        m["record"]["ambient_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RECORD_NOT_READY")
        self.assertEqual(v["sections"]["template_completeness"], "fail")

    def test_na_field_without_reason_fails(self):
        m = copy.deepcopy(READY)
        m["record"]["na_reasons_recorded"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RECORD_NOT_READY")
        self.assertEqual(v["sections"]["template_completeness"], "fail")

    def test_no_na_fields_passes_na_check_as_not_applicable(self):
        m = copy.deepcopy(READY)
        m["record"]["has_na_fields"] = False
        del m["record"]["na_reasons_recorded"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RECORD_READY")

    def test_critical_test_without_reviewer_signoff_fails(self):
        m = copy.deepcopy(READY)
        m["record"]["reviewer_signoff_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RECORD_NOT_READY")

    def test_non_critical_test_passes_signoff_as_not_applicable(self):
        m = copy.deepcopy(READY)
        m["record"]["is_critical_test"] = False
        del m["record"]["reviewer_signoff_present"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RECORD_READY")

    def test_declared_pass_with_out_of_criteria_reading_fails(self):
        m = copy.deepcopy(READY)
        m["readings"][0]["value"] = 50
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RECORD_NOT_READY")
        self.assertEqual(v["sections"]["machine_readable_format"], "fail")
        self.assertEqual(v["readings_out_of_criteria"], 1)

    def test_declared_fail_matching_out_of_criteria_reading_passes(self):
        m = copy.deepcopy(READY)
        m["readings"][0]["value"] = 50
        m["record"]["verdict_value"] = "fail"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RECORD_READY")
        self.assertEqual(v["readings_out_of_criteria"], 1)

    def test_reading_missing_unit_is_insufficient_evidence(self):
        m = copy.deepcopy(READY)
        del m["readings"][0]["unit"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["machine_readable_format"],
                         "insufficient_evidence")

    def test_disordered_acceptance_limits_fail(self):
        m = copy.deepcopy(READY)
        m["readings"][0]["acceptance_min"] = 20000
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RECORD_NOT_READY")

    def test_raw_data_overwritten_fails_hygiene(self):
        m = copy.deepcopy(READY)
        m["hygiene"]["raw_data_overwritten"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RECORD_NOT_READY")
        self.assertEqual(v["sections"]["data_hygiene"], "fail")

    def test_load_varies_without_vs_load_plot_fails(self):
        m = copy.deepcopy(READY)
        m["trending"]["plotted_vs_load"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RECORD_NOT_READY")
        self.assertEqual(v["sections"]["trending"], "fail")

    def test_anomalies_without_action_fail(self):
        m = copy.deepcopy(READY)
        m["trending"]["anomalies_flagged_with_action"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RECORD_NOT_READY")

    def test_dual_axis_chart_fails_plotting(self):
        m = copy.deepcopy(READY)
        m["plotting"]["dual_axis_used"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RECORD_NOT_READY")
        self.assertEqual(v["sections"]["plotting_discipline"], "fail")

    def test_correction_without_revision_note_fails_retention(self):
        m = copy.deepcopy(READY)
        m["retention"]["correction_revision_notes_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "RECORD_NOT_READY")
        self.assertEqual(v["sections"]["retention_and_audit"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(READY)
        del m["retention"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["retention_and_audit"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["readings_evaluated"], 0)

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(READY))
        self.assertIn("VERDICT: RECORD_READY", stamp(v))

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
            evaluate({"asset": 12345, "record": "not-an-object"})
        self.assertIn("asset", str(ctx.exception))

    def test_asset_as_number_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"asset": 12345})
        self.assertIn("asset", str(ctx.exception))

    def test_record_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"record": "not-an-object"})
        self.assertIn("record", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["record"]["asset_id_present"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("record.asset_id_present", str(ctx.exception))

    def test_string_leaf_as_number_rejected(self):
        m = copy.deepcopy(READY)
        m["record"]["verdict_value"] = 123
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("record.verdict_value", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["readings"] = "not-a-list"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("readings", str(ctx.exception))

    def test_reading_entry_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["readings"][0] = "not-an-object"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("readings[0]", str(ctx.exception))

    def test_reading_value_as_string_rejected(self):
        m = copy.deepcopy(READY)
        m["readings"][0]["value"] = "850"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("readings[0].value", str(ctx.exception))

    def test_null_field_rejected(self):
        m = copy.deepcopy(READY)
        m["record"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("record", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
