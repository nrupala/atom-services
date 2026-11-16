import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from codebase_visualization import evaluate, stamp  # noqa: E402


def _diagrams():
    return [
        {"name": "dependency_graph", "format": "mermaid",
         "scope": "all modules", "generation_source": "import script",
         "generated_at": "2026-11-10"},
        {"name": "architecture_context", "format": "plantuml",
         "scope": "system context", "generation_source": "c4 export",
         "generated_at": "2026-11-10"},
        {"name": "hot_path_calls", "format": "graphviz",
         "scope": "hot paths", "generation_source": "profiler export",
         "generated_at": "2026-11-10"},
    ]


COMPLETE = {
    "entity": "Acme Codebase",
    "diagrams_as_code": {
        "key_diagrams_exist_as_code_in_repo": True,
        "regenerable": True,
        "versioned_and_diffable": True,
        "regenerated_on_change": True,
        "diagrams": _diagrams(),
    },
    "dependency": {
        "graph_present": True,
        "cycles_highlighted": True,
        "layering_violations_highlighted": True,
        "known_issues_list_maintained": True,
        "modules_total": 40,
        "modules_included": 40,
    },
    "call_and_flow": {
        "call_graph_for_hot_paths_present": True,
        "sequence_diagrams_for_critical_journeys_present": True,
        "data_flow_for_pipelines_present": True,
    },
    "architecture": {
        "map_present": True,
        "levels_declared": ["context", "containers", "components"],
        "one_page_per_level": True,
        "owners_annotated": True,
        "boundaries_annotated": True,
        "adrs_live_beside_maps": True,
    },
    "metrics": {
        "complexity_heatmap_present": True,
        "coverage_overlay_present": True,
        "hotspot_view_considered": True,
        "hotspot_change_frequency": 12,
        "hotspot_complexity": 8,
        "declared_hotspot_score": 96,
    },
    "history": {
        "churn_timeline_present": True,
        "ownership_map_present": True,
        "incident_overlays_present": True,
    },
    "honesty": {
        "each_diagram_labeled_scope_and_generation_source": True,
        "diagrams_labeled_generated_at_tool_scope": True,
        "generatable_diagrams_generated": True,
        "stale_diagrams_shipped_as_truth": False,
        "unlabeled_hand_drawn_maps_guiding_decisions": False,
    },
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(len(v["checks"]), 32)
        self.assertEqual(v["diagrams_evaluated"], 3)
        self.assertEqual(v["computed_dependency_coverage"], "1.000000")
        self.assertEqual(v["dependency_coverage_difference"], "0.000000")
        self.assertEqual(v["computed_hotspot_score"], "96.000000")
        self.assertEqual(v["hotspot_score_difference"], "0.000000")
        self.assertEqual(v["c4_levels_not_declared"], [])

    def test_diagrams_not_as_code_in_repo_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["diagrams_as_code"]["key_diagrams_exist_as_code_in_repo"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_NOT_READY")
        self.assertEqual(v["sections"]["diagrams_as_code"], "fail")

    def test_diagrams_not_regenerated_on_change_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["diagrams_as_code"]["regenerated_on_change"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CODEBASE_VISUALIZATION_NOT_READY")

    def test_unstated_diagram_format_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["diagrams_as_code"]["diagrams"][1]["format"] = "png_screenshot"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_NOT_READY")
        self.assertEqual(
            check_status(
                v, "diagram_formats_use_stated_diagrams_as_code_tools"),
            "fail")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")
        self.assertEqual(v["diagrams_evaluated"], 3)

    def test_each_stated_format_passes(self):
        for fmt in ("mermaid", "graphviz", "plantuml"):
            m = copy.deepcopy(COMPLETE)
            for d in m["diagrams_as_code"]["diagrams"]:
                d["format"] = fmt
            self.assertEqual(evaluate(m)["verdict"],
                             "CODEBASE_VISUALIZATION_READY")

    def test_missing_diagrams_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["diagrams_as_code"]["diagrams"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "diagram_entries_complete"),
                         "missing")
        self.assertEqual(v["diagrams_evaluated"], 0)
        self.assertIsNone(v["computed_status"])

    def test_empty_diagrams_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["diagrams_as_code"]["diagrams"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "diagram_formats_use_stated_diagrams_as_code_tools"),
            "missing")

    def test_incomplete_diagram_entry_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["diagrams_as_code"]["diagrams"][1]["scope"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "diagram_entries_complete"),
                         "missing")
        self.assertEqual(v["diagrams_evaluated"], 2)

    def test_empty_string_diagram_field_is_incomplete(self):
        m = copy.deepcopy(COMPLETE)
        m["diagrams_as_code"]["diagrams"][0]["generated_at"] = ""
        v = evaluate(m)
        self.assertEqual(check_status(v, "diagram_entries_complete"),
                         "missing")
        self.assertEqual(v["diagrams_evaluated"], 2)

    def test_cycles_not_highlighted_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["dependency"]["cycles_highlighted"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_NOT_READY")
        self.assertEqual(v["sections"]["dependency_views"], "fail")

    def test_known_issues_list_not_maintained_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["dependency"]["known_issues_list_maintained"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CODEBASE_VISUALIZATION_NOT_READY")

    def test_dependency_partial_coverage_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["dependency"]["modules_included"] = 30
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_NOT_READY")
        self.assertEqual(
            check_status(v, "dependency_graph_covers_all_declared_modules"),
            "fail")
        self.assertEqual(v["computed_dependency_coverage"], "0.750000")
        self.assertEqual(v["dependency_coverage_difference"], "-10.000000")

    def test_dependency_coverage_at_other_counts_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["dependency"]["modules_total"] = 7
        m["dependency"]["modules_included"] = 7
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_READY")
        self.assertEqual(v["computed_dependency_coverage"], "1.000000")

    def test_dependency_included_above_total_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["dependency"]["modules_included"] = 41
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "dependency_graph_covers_all_declared_modules"),
            "fail")
        self.assertEqual(v["dependency_coverage_difference"], "1.000000")

    def test_zero_modules_total_fails_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["dependency"]["modules_total"] = 0
        m["dependency"]["modules_included"] = 0
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_NOT_READY")
        self.assertIsNone(v["computed_dependency_coverage"])
        self.assertEqual(v["dependency_coverage_difference"], "0.000000")

    def test_missing_dependency_number_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["dependency"]["modules_total"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_dependency_coverage"])
        self.assertIsNone(v["dependency_coverage_difference"])

    def test_call_graph_missing_view_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["call_and_flow"]["call_graph_for_hot_paths_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_NOT_READY")
        self.assertEqual(v["sections"]["call_and_flow_views"], "fail")

    def test_data_flow_view_absent_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["call_and_flow"]["data_flow_for_pipelines_present"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["call_and_flow_views"],
                         "insufficient_evidence")

    def test_c4_levels_missing_one_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["architecture"]["levels_declared"] = ["context", "containers"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_NOT_READY")
        self.assertEqual(v["c4_levels_not_declared"], ["components"])
        self.assertEqual(
            check_status(v, "c4_levels_cover_stated_levels"), "fail")

    def test_c4_empty_list_fails_not_missing(self):
        m = copy.deepcopy(COMPLETE)
        m["architecture"]["levels_declared"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_NOT_READY")
        self.assertEqual(v["c4_levels_not_declared"],
                         ["context", "containers", "components"])

    def test_c4_unknown_levels_do_not_satisfy_coverage(self):
        m = copy.deepcopy(COMPLETE)
        m["architecture"]["levels_declared"] = ["system", "modules"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_NOT_READY")
        self.assertEqual(len(v["c4_levels_not_declared"]), 3)

    def test_c4_extra_levels_still_pass(self):
        m = copy.deepcopy(COMPLETE)
        m["architecture"]["levels_declared"] = [
            "context", "containers", "components", "code"]
        self.assertEqual(evaluate(m)["verdict"],
                         "CODEBASE_VISUALIZATION_READY")

    def test_missing_c4_list_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["architecture"]["levels_declared"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["c4_levels_not_declared"])

    def test_owners_not_annotated_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["architecture"]["owners_annotated"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_NOT_READY")
        self.assertEqual(v["sections"]["architecture_maps"], "fail")

    def test_hotspot_score_mismatch_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"]["declared_hotspot_score"] = 80
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_NOT_READY")
        self.assertEqual(
            check_status(
                v,
                "hotspot_score_matches_change_frequency_times_complexity"),
            "fail")
        self.assertEqual(v["hotspot_score_difference"], "-16.000000")
        self.assertEqual(v["computed_hotspot_score"], "96.000000")

    def test_hotspot_score_at_other_values_passes(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"]["hotspot_change_frequency"] = 5
        m["metrics"]["hotspot_complexity"] = 7.5
        m["metrics"]["declared_hotspot_score"] = 37.5
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_READY")
        self.assertEqual(v["computed_hotspot_score"], "37.500000")

    def test_missing_hotspot_number_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["metrics"]["hotspot_complexity"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_hotspot_score"])
        self.assertIsNone(v["hotspot_score_difference"])

    def test_hotspot_view_not_considered_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"]["hotspot_view_considered"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CODEBASE_VISUALIZATION_NOT_READY")

    def test_churn_timeline_absent_section_fails_history(self):
        m = copy.deepcopy(COMPLETE)
        m["history"]["churn_timeline_present"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_NOT_READY")
        self.assertEqual(v["sections"]["metrics_and_history_views"],
                         "fail")

    def test_stale_diagrams_shipped_as_truth_fails_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["honesty"]["stale_diagrams_shipped_as_truth"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_NOT_READY")
        self.assertEqual(
            check_status(v, "stale_diagrams_not_shipped_as_truth"),
            "fail")
        self.assertEqual(v["sections"]["honesty_and_currency"], "fail")

    def test_unlabeled_hand_drawn_maps_guiding_decisions_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["honesty"]["unlabeled_hand_drawn_maps_guiding_decisions"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "CODEBASE_VISUALIZATION_NOT_READY")
        self.assertEqual(
            check_status(
                v, "unlabeled_hand_drawn_maps_not_guiding_decisions"),
            "fail")

    def test_diagrams_unlabeled_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["honesty"][
            "each_diagram_labeled_scope_and_generation_source"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "CODEBASE_VISUALIZATION_NOT_READY")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["honesty"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["honesty_and_currency"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertEqual(v["diagrams_evaluated"], 0)
        self.assertIsNone(v["computed_dependency_coverage"])
        self.assertIsNone(v["computed_hotspot_score"])
        self.assertIsNone(v["c4_levels_not_declared"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: CODEBASE_VISUALIZATION_READY", stamp(v))

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
            evaluate({"dependency": "should-be-an-object"})
        self.assertIn("dependency", str(ctx.exception))

    def test_list_field_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["architecture"]["levels_declared"] = "context"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("architecture.levels_declared", str(ctx.exception))

    def test_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["architecture"]["levels_declared"] = ["context", 42]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("architecture.levels_declared[1]",
                      str(ctx.exception))

    def test_diagrams_list_as_object_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["diagrams_as_code"]["diagrams"] = {"name": "dependency_graph"}
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("diagrams_as_code.diagrams", str(ctx.exception))

    def test_diagram_entry_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["diagrams_as_code"]["diagrams"][0] = "dependency_graph"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("diagrams_as_code.diagrams[0]", str(ctx.exception))

    def test_diagram_string_leaf_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["diagrams_as_code"]["diagrams"][2]["format"] = 7
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("diagrams_as_code.diagrams[2].format",
                      str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["honesty"]["stale_diagrams_shipped_as_truth"] = "no"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("honesty.stale_diagrams_shipped_as_truth",
                      str(ctx.exception))

    def test_numeric_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["metrics"]["hotspot_complexity"] = "8"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("metrics.hotspot_complexity", str(ctx.exception))

    def test_numeric_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["dependency"]["modules_total"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("dependency.modules_total", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["architecture"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("architecture", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
