import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from data_visualization_design import evaluate, stamp  # noqa: E402


def _charts():
    return [
        {"name": "revenue_by_region", "question_type": "comparison",
         "chart_type": "bar", "x_axis_label": "Region",
         "y_axis_label": "Revenue", "y_axis_unit": "USD",
         "y_axis_start": 0, "categories_count": 4, "bars_sorted": True,
         "dual_axis": False, "axis_truncated": False,
         "truncated_flagged_loudly": False, "uses_3d": False,
         "red_green_only": False},
        {"name": "revenue_trend", "question_type": "trend",
         "chart_type": "line", "x_axis_label": "Quarter",
         "y_axis_label": "Revenue", "y_axis_unit": "USD",
         "y_axis_start": 0, "categories_count": 1, "bars_sorted": False,
         "dual_axis": False, "axis_truncated": False,
         "truncated_flagged_loudly": False, "uses_3d": False,
         "red_green_only": False},
        {"name": "margin_scatter", "question_type": "relationship",
         "chart_type": "scatter", "x_axis_label": "Spend",
         "y_axis_label": "Margin", "y_axis_unit": "percent",
         "y_axis_start": 0, "categories_count": 2, "bars_sorted": False,
         "dual_axis": False, "axis_truncated": True,
         "truncated_flagged_loudly": True, "uses_3d": False,
         "red_green_only": False},
    ]


COMPLETE = {
    "entity": "Q3 Board Report Charts",
    "brief": {
        "audience": "Board members deciding Q4 spend",
        "question": "Where did revenue change and why?",
    },
    "charts": _charts(),
    "honesty": {
        "consistent_scales_when_comparing_panels": True,
        "data_source_labeled": True,
        "data_date_labeled": True,
        "misleading_axes_or_scales_present": False,
    },
    "perception": {
        "primary_encoding_uses_position_or_length": True,
        "most_important_element_top_left_or_largest": True,
        "gridlines_faint": True,
        "chart_junk_minimized": True,
        "chart_junk_used_as_branding": False,
    },
    "color": {
        "palette_colorblind_safe": True,
        "sequential_palette_for_magnitude": True,
        "diverging_palette_around_real_midpoint": True,
    },
    "annotation": {
        "title_states_finding_not_topic": True,
        "events_and_thresholds_marked": True,
        "outliers_called_out_directly": True,
        "key_values_annotated": True,
    },
    "accessibility": {
        "legible_sizes": True,
        "alt_text_or_table_fallback_present": True,
        "values_readable_without_hover": True,
        "contrast_sufficient_for_print_and_screen": True,
    },
    "dashboard": {
        "one_screen_one_story": True,
        "metric_definitions_and_owners_declared": True,
        "refresh_cadence_visible": True,
        "stale_panels_retired": True,
    },
    "reproducibility": {
        "tool_version_and_data_snapshot_recorded": True,
        "data_reproducible": True,
    },
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "DATA_VISUALIZATION_DESIGN_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 38)
        self.assertEqual(v["charts_evaluated"], 3)
        self.assertEqual(v["computed_max_categories"], "4.000000")
        self.assertEqual(
            v["max_categories_difference_from_limit"], "-3.000000")
        self.assertEqual(v["charts_not_matching_question"], [])

    def test_empty_audience_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["brief"]["audience"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "DATA_VISUALIZATION_DESIGN_NOT_SOUND")
        self.assertEqual(check_status(v, "audience_declared"), "fail")
        self.assertEqual(v["sections"]["question_and_chart_choice"],
                         "fail")

    def test_absent_question_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["brief"]["question"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "question_declared"), "missing")

    def test_chart_type_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][0]["chart_type"] = "line"
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "DATA_VISUALIZATION_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "chart_types_match_declared_questions"),
            "fail")
        self.assertEqual(v["charts_not_matching_question"],
                         ["revenue_by_region"])
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_each_stated_mapping_passes(self):
        cases = [
            ("comparison", "bar"), ("trend", "line"),
            ("distribution", "histogram"), ("distribution", "box_plot"),
            ("relationship", "scatter"), ("composition", "stacked_bar"),
            ("part_to_whole_over_time", "small_multiples"),
        ]
        for qtype, ctype in cases:
            m = copy.deepcopy(COMPLETE)
            for row in m["charts"]:
                row["question_type"] = qtype
                row["chart_type"] = ctype
                row["bars_sorted"] = True
                row["y_axis_start"] = 0
            self.assertEqual(evaluate(m)["verdict"],
                             "DATA_VISUALIZATION_DESIGN_SOUND",
                             (qtype, ctype))

    def test_unknown_question_type_fails_mapping(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][1]["question_type"] = "ranking"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "chart_types_match_declared_questions"),
            "fail")
        self.assertEqual(v["charts_not_matching_question"],
                         ["revenue_trend"])

    def test_unsorted_comparison_bars_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][0]["bars_sorted"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "DATA_VISUALIZATION_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "comparison_charts_sorted"), "fail")

    def test_missing_charts_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["charts"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "chart_entries_complete"),
                         "missing")
        self.assertEqual(v["charts_evaluated"], 0)
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["charts_not_matching_question"])
        self.assertIsNone(v["computed_max_categories"])

    def test_empty_charts_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "chart_types_match_declared_questions"),
            "missing")

    def test_incomplete_chart_entry_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["charts"][1]["y_axis_unit"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "chart_entries_complete"),
                         "missing")
        self.assertEqual(v["charts_evaluated"], 2)
        self.assertIsNone(v["computed_max_categories"])

    def test_empty_string_chart_field_is_incomplete(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][0]["x_axis_label"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(v, "chart_entries_complete"),
                         "missing")
        self.assertEqual(v["charts_evaluated"], 2)

    def test_bar_chart_not_at_zero_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][0]["y_axis_start"] = 50
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "DATA_VISUALIZATION_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "bar_charts_y_axis_starts_at_zero"),
            "fail")
        self.assertEqual(v["sections"]["honesty_and_axes"], "fail")

    def test_stacked_bar_not_at_zero_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][0]["question_type"] = "composition"
        m["charts"][0]["chart_type"] = "stacked_bar"
        m["charts"][0]["y_axis_start"] = 10
        self.assertEqual(
            check_status(evaluate(m),
                         "bar_charts_y_axis_starts_at_zero"), "fail")

    def test_non_bar_chart_not_at_zero_passes_zero_check(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][1]["y_axis_start"] = 20
        m["charts"][1]["axis_truncated"] = True
        m["charts"][1]["truncated_flagged_loudly"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "bar_charts_y_axis_starts_at_zero"),
            "pass")
        self.assertEqual(v["verdict"], "DATA_VISUALIZATION_DESIGN_SOUND")

    def test_dual_axis_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][2]["dual_axis"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "DATA_VISUALIZATION_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "no_dual_axes_in_declared_charts"), "fail")

    def test_truncated_axis_not_flagged_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][2]["truncated_flagged_loudly"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "truncated_axes_flagged_loudly"), "fail")

    def test_inconsistent_scales_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["honesty"]["consistent_scales_when_comparing_panels"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "DATA_VISUALIZATION_DESIGN_NOT_SOUND")

    def test_misleading_axes_fail_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["honesty"]["misleading_axes_or_scales_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "misleading_axes_or_scales_not_present"),
            "fail")
        self.assertEqual(v["sections"]["honesty_and_axes"], "fail")

    def test_source_not_labeled_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["honesty"]["data_source_labeled"] = False
        self.assertEqual(evaluate(m)["sections"]["honesty_and_axes"],
                         "fail")

    def test_3d_chart_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][0]["uses_3d"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "no_3d_in_declared_charts"), "fail")
        self.assertEqual(v["sections"]["perception_and_chart_junk"],
                         "fail")

    def test_chart_junk_as_branding_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["perception"]["chart_junk_used_as_branding"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "chart_junk_not_used_as_branding"), "fail")

    def test_position_length_not_primary_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["perception"][
            "primary_encoding_uses_position_or_length"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "DATA_VISUALIZATION_DESIGN_NOT_SOUND")

    def test_palette_not_colorblind_safe_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["color"]["palette_colorblind_safe"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "DATA_VISUALIZATION_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["color"], "fail")

    def test_red_green_only_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][1]["red_green_only"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "red_green_not_used_alone_in_declared_charts"),
            "fail")

    def test_category_count_at_limit_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][0]["categories_count"] = 7
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATA_VISUALIZATION_DESIGN_SOUND")
        self.assertEqual(v["computed_max_categories"], "7.000000")
        self.assertEqual(
            v["max_categories_difference_from_limit"], "0.000000")

    def test_category_count_above_limit_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][0]["categories_count"] = 9
        v = evaluate(m)
        self.assertEqual(v["verdict"],
                         "DATA_VISUALIZATION_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "category_counts_within_stated_limit"),
            "fail")
        self.assertEqual(v["computed_max_categories"], "9.000000")
        self.assertEqual(
            v["max_categories_difference_from_limit"], "2.000000")

    def test_title_states_topic_not_finding_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["annotation"]["title_states_finding_not_topic"] = False
        v = evaluate(m)
        self.assertEqual(v["sections"]["annotation_and_labels"], "fail")

    def test_outliers_not_called_out_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["annotation"]["outliers_called_out_directly"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "DATA_VISUALIZATION_DESIGN_NOT_SOUND")

    def test_alt_fallback_absent_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["accessibility"]["alt_text_or_table_fallback_present"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["accessibility"],
                         "insufficient_evidence")

    def test_values_require_hover_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["accessibility"]["values_readable_without_hover"] = False
        self.assertEqual(evaluate(m)["sections"]["accessibility"],
                         "fail")

    def test_dashboard_stale_panels_not_retired_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["dashboard"]["stale_panels_retired"] = False
        v = evaluate(m)
        self.assertEqual(
            v["sections"]["dashboards_and_reproducibility"], "fail")

    def test_snapshot_not_recorded_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["reproducibility"][
            "tool_version_and_data_snapshot_recorded"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "DATA_VISUALIZATION_DESIGN_NOT_SOUND")

    def test_irreproducible_data_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["reproducibility"]["data_reproducible"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "chart_data_reproducible"), "fail")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["color"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["color"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertEqual(v["charts_evaluated"], 0)
        self.assertIsNone(v["computed_max_categories"])
        self.assertIsNone(v["max_categories_difference_from_limit"])
        self.assertIsNone(v["charts_not_matching_question"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: DATA_VISUALIZATION_DESIGN_SOUND",
                      stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_top_level_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["entity"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("entity", str(ctx.exception))

    def test_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"honesty": "should-be-an-object"})
        self.assertIn("honesty", str(ctx.exception))

    def test_brief_string_leaf_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["brief"]["audience"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("brief.audience", str(ctx.exception))

    def test_charts_list_as_object_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"] = {"name": "revenue_by_region"}
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("charts", str(ctx.exception))

    def test_chart_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][0] = "revenue_by_region"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("charts[0]", str(ctx.exception))

    def test_chart_string_leaf_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][2]["chart_type"] = 7
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("charts[2].chart_type", str(ctx.exception))

    def test_chart_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][0]["y_axis_start"] = "0"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("charts[0].y_axis_start", str(ctx.exception))

    def test_chart_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][1]["categories_count"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("charts[1].categories_count", str(ctx.exception))

    def test_chart_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["charts"][0]["dual_axis"] = "no"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("charts[0].dual_axis", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["honesty"]["misleading_axes_or_scales_present"] = "no"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("honesty.misleading_axes_or_scales_present",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["color"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("color", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
