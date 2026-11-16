import copy
import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "src")
)
from database_design_review import evaluate, stamp  # noqa: E402

COMPLETE = {
    "design": "orders-platform",
    "store_selection": {"access_patterns_mapped": True,
                        "store_chosen_from_access_patterns": True,
                        "relational_default_or_fit_justified": True},
    "tables": [
        {"name": "orders", "primary_key": "id",
         "constraints_declared": True},
        {"name": "order_items", "primary_key": "id",
         "constraints_declared": True},
    ],
    "normalization": {"normalized_to_3nf": True,
                      "denormalized": True,
                      "denormalization_reasons_documented": True},
    "query_patterns": [
        {"name": "orders_by_customer", "table": "orders",
         "supporting_index": "idx_orders_customer"},
        {"name": "items_by_order", "table": "order_items",
         "supporting_index": "idx_items_order"},
    ],
    "indexes": [
        {"name": "idx_orders_customer", "table": "orders",
         "columns": ["customer_id", "created_at"]},
        {"name": "idx_items_order", "table": "order_items",
         "columns": ["order_id"]},
    ],
    "indexing": {"composite_column_order_equality_then_range": True,
                 "covering_indexes_for_hot_queries": True,
                 "write_cost_considered": True,
                 "explain_analyze_before_and_after": True},
    "performance": {"measured_first": True,
                    "n_plus_one_queries_addressed": True,
                    "keyset_pagination_for_large_sets": True,
                    "offset_pagination_at_scale_present": False,
                    "connection_pooling_declared": True,
                    "bounded_result_sets": True,
                    "cache_deliberate_with_honest_invalidation": True},
    "integrity": {"constraints_enforce_invariants": True,
                  "appropriate_types_used": True,
                  "money_stored_as_float": False},
    "transactions": {"isolation_level_and_anomalies_known": True,
                     "transactions_kept_short": True,
                     "writes_idempotent_where_retries_possible": True,
                     "distributed_store_used": True,
                     "consistency_availability_tradeoff_explicit": True},
    "security": {"parametrized_queries_only": True,
                 "string_concatenated_sql_present": False,
                 "least_privilege_users_per_service": True,
                 "shared_superuser_present": False,
                 "encryption_at_rest": True},
    "migrations": {"forward_only": True,
                   "past_migrations_edited": False,
                   "expand_contract_pattern_used": True,
                   "big_bang_schema_swap_present": False},
    "backups": {"backups_scheduled": True,
                "restores_tested_on_schedule": True,
                "untested_backup_trusted": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_sound(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "DATABASE_DESIGN_SOUND")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 42)
        self.assertEqual(v["computed_status"],
                         "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["tables_count"], 2)
        self.assertEqual(v["tables_without_primary_key"], [])
        self.assertEqual(v["primary_key_coverage"], "1.0000")
        self.assertEqual(v["query_patterns_count"], 2)
        self.assertEqual(v["indexes_count"], 2)
        self.assertEqual(v["uncovered_query_patterns"], [])
        self.assertEqual(v["query_pattern_index_coverage"], "1.0000")

    def test_access_patterns_not_mapped_fails_schema_section(self):
        m = copy.deepcopy(COMPLETE)
        m["store_selection"]["access_patterns_mapped"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATABASE_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["schema_and_normalization"],
                         "fail")

    def test_table_without_primary_key_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["tables"][1]["primary_key"] = ""
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATABASE_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(v, "every_table_has_primary_key_named"),
            "fail")
        self.assertEqual(v["tables_without_primary_key"],
                         ["order_items"])
        self.assertEqual(v["primary_key_coverage"], "0.5000")
        self.assertEqual(v["computed_status"],
                         "outside_stated_limits_on_declared_evidence")

    def test_table_missing_primary_key_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["tables"][0]["primary_key"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(v, "every_table_has_primary_key_named"),
            "missing")
        self.assertEqual(v["tables_without_primary_key"], ["orders"])

    def test_table_without_constraints_declared_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tables"][0]["constraints_declared"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATABASE_DESIGN_NOT_SOUND")
        self.assertEqual(v["tables_without_constraints_declared"],
                         ["orders"])

    def test_empty_tables_list_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["tables"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "tables_declared"), "fail")
        self.assertEqual(v["tables_count"], 0)
        self.assertIsNone(v["primary_key_coverage"])

    def test_not_normalized_to_3nf_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["normalization"]["normalized_to_3nf"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "DATABASE_DESIGN_NOT_SOUND")

    def test_denormalization_without_reasons_fails_when_denormalized(self):
        m = copy.deepcopy(COMPLETE)
        m["normalization"]["denormalization_reasons_documented"] = False
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATABASE_DESIGN_NOT_SOUND")
        self.assertEqual(
            check_status(
                v,
                "denormalization_reasons_documented_when_denormalized"),
            "fail")

    def test_no_denormalization_passes_reason_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["normalization"]["denormalized"] = False
        del m["normalization"]["denormalization_reasons_documented"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATABASE_DESIGN_SOUND")
        self.assertEqual(
            check_status(
                v,
                "denormalization_reasons_documented_when_denormalized"),
            "pass")

    def test_denormalization_reason_missing_when_denormalized(self):
        m = copy.deepcopy(COMPLETE)
        del m["normalization"]["denormalization_reasons_documented"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "denormalization_reasons_documented_when_denormalized"),
            "missing")

    def test_query_pattern_without_matching_index_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["query_patterns"][1]["supporting_index"] = "idx_missing"
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATABASE_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["indexing_and_performance"],
                         "fail")
        self.assertEqual(
            check_status(v, "every_query_pattern_has_matching_index"),
            "fail")
        self.assertEqual(v["uncovered_query_patterns"],
                         ["items_by_order"])
        self.assertEqual(v["query_pattern_index_coverage"], "0.5000")

    def test_index_on_wrong_table_does_not_match(self):
        m = copy.deepcopy(COMPLETE)
        m["indexes"][0]["table"] = "order_items"
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_query_pattern_has_matching_index"),
            "fail")
        self.assertEqual(v["uncovered_query_patterns"],
                         ["orders_by_customer"])

    def test_index_without_columns_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["indexes"][1]["columns"] = []
        v = evaluate(m)
        self.assertEqual(
            check_status(v, "every_index_declares_columns"), "fail")

    def test_offset_pagination_at_scale_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["performance"]["offset_pagination_at_scale_present"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATABASE_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["indexing_and_performance"],
                         "fail")

    def test_money_stored_as_float_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["integrity"]["money_stored_as_float"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATABASE_DESIGN_NOT_SOUND")
        self.assertEqual(
            v["sections"]["integrity_transactions_and_security"],
            "fail")

    def test_string_concatenated_sql_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["string_concatenated_sql_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "DATABASE_DESIGN_NOT_SOUND")

    def test_shared_superuser_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["security"]["shared_superuser_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "DATABASE_DESIGN_NOT_SOUND")

    def test_tradeoff_missing_when_distributed(self):
        m = copy.deepcopy(COMPLETE)
        del m["transactions"][
            "consistency_availability_tradeoff_explicit"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(
            check_status(
                v,
                "consistency_availability_tradeoff_explicit_when_distributed"),  # noqa: E501
            "missing")

    def test_no_distributed_store_passes_tradeoff_check_as_na(self):
        m = copy.deepcopy(COMPLETE)
        m["transactions"]["distributed_store_used"] = False
        del m["transactions"][
            "consistency_availability_tradeoff_explicit"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATABASE_DESIGN_SOUND")

    def test_past_migrations_edited_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["migrations"]["past_migrations_edited"] = True
        v = evaluate(m)
        self.assertEqual(v["verdict"], "DATABASE_DESIGN_NOT_SOUND")
        self.assertEqual(v["sections"]["migrations_and_backups"],
                         "fail")

    def test_big_bang_swap_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["migrations"]["big_bang_schema_swap_present"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "DATABASE_DESIGN_NOT_SOUND")

    def test_untested_backup_trusted_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["backups"]["untested_backup_trusted"] = True
        self.assertEqual(evaluate(m)["verdict"],
                         "DATABASE_DESIGN_NOT_SOUND")

    def test_restores_not_tested_fail(self):
        m = copy.deepcopy(COMPLETE)
        m["backups"]["restores_tested_on_schedule"] = False
        self.assertEqual(evaluate(m)["verdict"],
                         "DATABASE_DESIGN_NOT_SOUND")

    def test_absent_evidence_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["backups"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["migrations_and_backups"],
                         "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(
            all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["tables_count"])
        self.assertIsNone(v["tables_without_primary_key"])
        self.assertIsNone(v["primary_key_coverage"])
        self.assertIsNone(v["uncovered_query_patterns"])
        self.assertIsNone(v["query_pattern_index_coverage"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: DATABASE_DESIGN_SOUND", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    """F1 regression: a documented field present with the wrong
    JSON type is rejected with ValueError naming the field."""

    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["design"] = 12345
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("design", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"normalization": "should-be-an-object"})
        self.assertIn("normalization", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"tables": {"name": "orders"}})
        self.assertIn("tables", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(ValueError) as ctx:
            evaluate({"tables": ["orders"]})
        self.assertIn("tables[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["store_selection"]["access_patterns_mapped"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("store_selection.access_patterns_mapped",
                      str(ctx.exception))

    def test_nested_list_entry_string_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tables"][1]["primary_key"] = 42
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("tables[1].primary_key", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tables"][0]["constraints_declared"] = "yes"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("tables[0].constraints_declared",
                      str(ctx.exception))

    def test_columns_list_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["indexes"][0]["columns"] = [123]
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("indexes[0].columns[0]", str(ctx.exception))

    def test_columns_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["indexes"][0]["columns"] = "customer_id"
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("indexes[0].columns", str(ctx.exception))

    def test_query_pattern_entry_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["query_patterns"][0]["supporting_index"] = True
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("query_patterns[0].supporting_index",
                      str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["backups"] = None
        with self.assertRaises(ValueError) as ctx:
            evaluate(m)
        self.assertIn("backups", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
