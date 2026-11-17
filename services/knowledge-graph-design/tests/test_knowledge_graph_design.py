import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from knowledge_graph_design import evaluate, stamp  # noqa: E402

COMPLETE = {
    "graph": "research-notes",
    "schema": {"entities_relations_attributes_modeled": True,
               "schema_changes_go_through_migrations": True,
               "migration_path_documented": True,
               "stable_ids_everywhere": True,
               "core_type_count": 14},
    "provenance": {"provenance_on_every_assertion": True,
                   "user_asserted_inferred_imported_distinguished": True},
    "assertions": [
        {"name": "paper-supports-claim",
         "source_declared": True,
         "date_declared": True,
         "confidence_declared": True,
         "origin_classified": True},
        {"name": "author-works-at-lab",
         "source_declared": True,
         "date_declared": True,
         "confidence_declared": True,
         "origin_classified": True},
        {"name": "note-links-project",
         "source_declared": True,
         "date_declared": True,
         "confidence_declared": True,
         "origin_classified": True},
    ],
    "history": {"append_only_event_log_is_source_of_truth": True,
                "current_state_is_projection": True,
                "corrections_are_new_events_referencing_old": True,
                "silent_edits_present": False},
    "storage": {"storage_fit_selected": True,
                "dedicated_graph_db_used": True,
                "graph_db_justified_by_query_complexity_or_scale": True},
    "query": {"canonical_query_patterns_defined": True,
              "full_text_and_vector_indexes_paired": True,
              "agent_queries_bounded": True,
              "counts_first_expand_on_request": True,
              "full_graph_dumps_present": False},
    "portability": {"export_import_formats_json_or_jsonld": True,
                    "export_import_round_trip_tested": True,
                    "versioned_snapshots": True,
                    "deletion_is_real": True,
                    "tombstones_where_required_addressed": True},
    "privacy": {"access_scoped": True,
                "encryption_at_rest": True,
                "sensitive_nodes_redactable": True,
                "third_party_personal_data_without_lawful_basis_present":
                    False},
    "red_lines": {
        "unprovenanced_assertions_presented_as_fact_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "KNOWLEDGE_GRAPH_DESIGN_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 31)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["assertions_count"], 3)
        self.assertEqual(v["assertions_without_full_provenance"], [])
        self.assertEqual(v["provenance_coverage"], "1.000000")
        self.assertEqual(v["assertions_without_origin_classification"], [])
        self.assertEqual(v["origin_classification_coverage"], "1.000000")
        self.assertEqual(v["declared_core_type_count"], 14)

    def test_unmodeled_schema_fails_schema_section(self):
        m = copy.deepcopy(COMPLETE)
        m["schema"]["entities_relations_attributes_modeled"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["schema_and_modeling"], "fail")

    def test_core_type_count_above_stated_range_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["schema"]["core_type_count"] = 25
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "core_type_count_within_stated_start_range"),
            "fail")
        self.assertEqual(v["declared_core_type_count"], 25)
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_core_type_count_below_stated_range_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["schema"]["core_type_count"] = 9
        self.assertEqual(
            check_status(
                evaluate(m), "core_type_count_within_stated_start_range"),
            "fail")

    def test_core_type_count_at_stated_bounds_passes(self):
        for count in (10, 20):
            m = copy.deepcopy(COMPLETE)
            m["schema"]["core_type_count"] = count
            self.assertEqual(
                check_status(
                    evaluate(m),
                    "core_type_count_within_stated_start_range"),
                "pass")

    def test_core_type_count_missing_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["schema"]["core_type_count"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["declared_core_type_count"])
        self.assertIsNone(v["computed_status"])

    def test_no_stable_ids_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["schema"]["stable_ids_everywhere"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND")

    def test_assertion_without_source_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["assertions"][0]["source_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_assertion_carries_full_provenance"),
            "fail")
        self.assertEqual(v["assertions_without_full_provenance"],
                         ["paper-supports-claim"])
        self.assertEqual(v["provenance_coverage"], "0.666667")

    def test_assertion_missing_provenance_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["assertions"][1]["date_declared"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_assertion_carries_full_provenance"),
            "missing")
        self.assertEqual(v["assertions_without_full_provenance"], [])

    def test_assertion_without_origin_classification_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["assertions"][2]["origin_classified"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_assertion_origin_classified"), "fail")
        self.assertEqual(v["assertions_without_origin_classification"],
                         ["note-links-project"])
        self.assertEqual(v["origin_classification_coverage"], "0.666667")

    def test_empty_assertions_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["assertions"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "assertions_declared"), "fail")
        self.assertEqual(v["assertions_count"], 0)
        self.assertIsNone(v["provenance_coverage"])
        self.assertIsNone(v["origin_classification_coverage"])

    def test_silent_edits_fail_history_as_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["history"]["silent_edits_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_silent_edits"), "fail")
        self.assertEqual(v["sections"]["immutable_history"], "fail")

    def test_mutable_history_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["history"]["append_only_event_log_is_source_of_truth"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND")

    def test_graph_db_without_justification_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["storage"][
            "graph_db_justified_by_query_complexity_or_scale"] = False
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "graph_db_justified_when_dedicated_graph_db_used"),
            "fail")

    def test_no_dedicated_graph_db_passes_justification_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["storage"] = {"storage_fit_selected": True,
                        "dedicated_graph_db_used": False}
        v = evaluate(m)
        self.assertEqual(v["verdict"], "KNOWLEDGE_GRAPH_DESIGN_SOUND")
        self.assertEqual(
            check_status(
                v, "graph_db_justified_when_dedicated_graph_db_used"),
            "pass")

    def test_graph_db_target_missing_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["storage"][
            "graph_db_justified_by_query_complexity_or_scale"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v, "graph_db_justified_when_dedicated_graph_db_used"),
            "missing")

    def test_unbounded_agent_queries_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["query"]["agent_queries_bounded"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND")
        self.assertEqual(
            v["sections"]["storage_and_query_retrieval"], "fail")

    def test_full_graph_dumps_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["query"]["full_graph_dumps_present"] = True
        self.assertEqual(
            check_status(evaluate(m), "no_full_graph_dumps"), "fail")

    def test_round_trip_not_tested_fails_portability(self):
        m = copy.deepcopy(COMPLETE)
        m["portability"]["export_import_round_trip_tested"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND")
        self.assertEqual(
            v["sections"]["portability_and_ownership"], "fail")

    def test_deletion_not_real_fails_as_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["portability"]["deletion_is_real"] = False
        self.assertEqual(
            check_status(evaluate(m), "deletion_is_real"), "fail")

    def test_unscoped_access_fails_privacy(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"]["access_scoped"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "KNOWLEDGE_GRAPH_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["privacy_and_red_lines"], "fail")

    def test_third_party_personal_data_without_basis_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"][
            "third_party_personal_data_without_lawful_basis_present"] = True
        self.assertEqual(
            check_status(
                evaluate(m),
                "no_third_party_personal_data_without_lawful_basis"),
            "fail")

    def test_unprovenanced_assertions_as_fact_fail_as_red_line(self):
        m = copy.deepcopy(COMPLETE)
        m["red_lines"][
            "unprovenanced_assertions_presented_as_fact_present"] = True
        v = evaluate(m)
        self.assertEqual(
            check_status(
                v, "no_unprovenanced_assertions_presented_as_fact"),
            "fail")
        self.assertEqual(v["sections"]["privacy_and_red_lines"], "fail")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["history"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["immutable_history"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["assertions_count"])
        self.assertIsNone(v["assertions_without_full_provenance"])
        self.assertIsNone(v["provenance_coverage"])
        self.assertIsNone(v["assertions_without_origin_classification"])
        self.assertIsNone(v["origin_classification_coverage"])
        self.assertIsNone(v["declared_core_type_count"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: KNOWLEDGE_GRAPH_DESIGN_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["graph"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("graph", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"schema": "should-be-an-object"})
        self.assertIn("schema", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"assertions": {"name": "paper-supports-claim"}})
        self.assertIn("assertions", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"assertions": ["paper-supports-claim"]})
        self.assertIn("assertions[0]", str(ctx.exception))

    def test_number_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["schema"]["core_type_count"] = "fourteen"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("schema.core_type_count", str(ctx.exception))

    def test_number_leaf_as_boolean_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["schema"]["core_type_count"] = True
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("schema.core_type_count", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["schema"]["stable_ids_everywhere"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("schema.stable_ids_everywhere", str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["assertions"][0]["name"] = 42
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("assertions[0].name", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["assertions"][1]["origin_classified"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("assertions[1].origin_classified",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["privacy"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("privacy", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
