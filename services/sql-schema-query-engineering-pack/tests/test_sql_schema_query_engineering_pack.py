import copy
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
from sql_schema_query_engineering_pack import evaluate, stamp  # noqa: E402

COMPLETE = {
    "project": "orders-db",
    "schema_design": {
        "precise_column_types_declared": True,
        "not_null_default_with_nullable_exceptions_explicit": True,
        "check_and_foreign_key_constraints_in_database": True,
        "snake_case_naming_consistent": True},
    "tables": [
        {"name": "customer_orders", "primary_key_declared": True,
         "schema_constraints_declared": True, "not_null_default_declared": True},
        {"name": "order_items", "primary_key_declared": True,
         "schema_constraints_declared": True, "not_null_default_declared": True},
    ],
    "index_design": {
        "indexes_derived_from_real_access_patterns": True,
        "composite_index_column_order_follows_query_order": True,
        "index_write_cost_measured_before_adding": True},
    "indexes": [
        {"name": "idx_orders_customer", "table": "customer_orders",
         "columns": ["customer_id", "created_at"]},
        {"name": "idx_items_order", "table": "order_items",
         "columns": ["order_id"]},
    ],
    "queries": [
        {"name": "orders_by_customer", "table": "customer_orders",
         "supporting_index_name": "idx_orders_customer",
         "explicit_column_list_declared": True,
         "bounded_or_paginated_declared": True,
         "parameterized_inputs_declared": True,
         "n_plus_one_avoidance_declared": True},
        {"name": "items_by_order", "table": "order_items",
         "supporting_index_name": "idx_items_order",
         "explicit_column_list_declared": True,
         "bounded_or_paginated_declared": True,
         "parameterized_inputs_declared": True,
         "n_plus_one_avoidance_declared": True},
    ],
    "query_practice": {
        "set_based_queries_preferred": True,
        "complex_reads_use_ctes_or_window_functions": True,
        "large_results_paginated": True,
        "related_data_joined_batched_or_preloaded": True,
        "query_count_tests_verify_no_n_plus_one": True},
    "transactions": {
        "transactions_kept_short": True,
        "isolation_level_known": True,
        "deadlock_retry_with_backoff_declared": True},
    "sql_safety": {
        "all_external_input_bound_as_parameters": True,
        "update_and_delete_statements_all_carry_where": True,
        "bounded_writes_rehearsed_before_execution": True},
    "migrations": {
        "forward_and_rollback_scripts_present": True,
        "migrations_tested_on_a_copy": True,
        "expand_migrate_contract_for_zero_downtime": True,
        "one_logical_change_per_migration": True},
    "performance_evidence": {
        "explain_analyze_captured_before_and_after_heavy_changes": True,
        "query_plan_regressions_watched": True},
    "sql_red_lines": {
        "string_concatenated_sql_with_user_input_present": False,
        "unreviewed_migration_on_live_data_present": False,
        "direct_to_production_schema_edit_present": False,
        "unbounded_write_without_where_present": False},
}


def check_status(v, name):
    return next(c["status"] for c in v["checks"] if c["check"] == name)


class VerdictTests(unittest.TestCase):
    def test_complete_manifest_is_ready(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertEqual(v["verdict"], "SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY")
        self.assertTrue(all(s == "pass" for s in v["sections"].values()))
        self.assertEqual(len(v["checks"]), 44)
        self.assertEqual(len(v["sections"]), 8)
        self.assertEqual(v["computed_status"], "within_stated_limits_on_declared_evidence")
        self.assertEqual(v["tables_count"], 2)
        self.assertEqual(v["indexes_count"], 2)
        self.assertEqual(v["queries_count"], 2)
        self.assertEqual(v["table_primary_key_coverage"], "1.000000")
        self.assertEqual(v["query_index_support_coverage"], "1.000000")
        self.assertEqual(v["uncovered_sql_queries"], [])
        self.assertEqual(v["duplicate_sql_table_names"], [])

    def test_empty_lists_fail_declared_checks(self):
        m = copy.deepcopy(COMPLETE)
        m["tables"] = []
        v = evaluate(m)
        self.assertEqual(v["verdict"], "SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY")
        self.assertEqual(check_status(v, "sql_tables_declared"), "fail")
        self.assertIsNone(v["table_primary_key_coverage"])

    def test_table_without_primary_key_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["tables"][0]["primary_key_declared"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_sql_table_declares_primary_key"), "fail")
        self.assertEqual(v["tables_without_primary_key"], ["customer_orders"])
        self.assertEqual(v["table_primary_key_coverage"], "0.500000")
        self.assertEqual(v["sections"]["schema_constraints_and_naming"], "fail")
        self.assertEqual(v["computed_status"], "outside_stated_limits_on_declared_evidence")

    def test_table_missing_constraints_field_is_missing_evidence(self):
        m = copy.deepcopy(COMPLETE)
        del m["tables"][1]["schema_constraints_declared"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "every_sql_table_declares_schema_constraints"), "missing")
        self.assertEqual(v["tables_without_schema_constraints"], [])

    def test_non_snake_case_table_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["tables"][0]["name"] = "CustomerOrders"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_sql_table_name_is_snake_case"), "fail")
        self.assertEqual(v["tables_with_non_snake_case_names"], ["CustomerOrders"])

    def test_duplicate_table_name_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["tables"][1]["name"] = "customer_orders"
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_sql_table_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_sql_table_names"], ["customer_orders"])

    def test_index_without_columns_fails_and_is_named(self):
        m = copy.deepcopy(COMPLETE)
        m["indexes"][0]["columns"] = []
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_sql_index_declares_nonempty_columns"), "fail")
        self.assertEqual(v["indexes_without_columns"], ["idx_orders_customer"])
        self.assertEqual(v["index_columns_coverage"], "0.500000")

    def test_query_with_wrong_table_index_is_uncovered(self):
        m = copy.deepcopy(COMPLETE)
        m["queries"][0]["supporting_index_name"] = "idx_items_order"
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_declared_sql_query_has_matching_declared_index"), "fail")
        self.assertEqual(v["uncovered_sql_queries"], ["orders_by_customer"])
        self.assertEqual(v["query_index_support_coverage"], "0.500000")

    def test_query_missing_supporting_index_field_is_missing(self):
        m = copy.deepcopy(COMPLETE)
        del m["queries"][0]["supporting_index_name"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(check_status(v, "every_declared_sql_query_has_matching_declared_index"), "missing")
        self.assertEqual(v["uncovered_sql_queries"], [])

    def test_select_star_query_fails_explicit_column_check(self):
        m = copy.deepcopy(COMPLETE)
        m["queries"][1]["explicit_column_list_declared"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_sql_query_declares_explicit_column_list"), "fail")
        self.assertEqual(v["queries_without_explicit_column_list"], ["items_by_order"])
        self.assertEqual(v["sections"]["query_construction_pagination_and_n_plus_one_prevention"], "fail")

    def test_unparameterized_query_fails_safety_section(self):
        m = copy.deepcopy(COMPLETE)
        m["queries"][0]["parameterized_inputs_declared"] = False
        v = evaluate(m)
        self.assertEqual(check_status(v, "every_sql_query_declares_parameterized_inputs"), "fail")
        self.assertEqual(v["queries_without_parameterized_inputs"], ["orders_by_customer"])
        self.assertEqual(v["sections"]["sql_safety_and_bounded_writes"], "fail")

    def test_duplicate_query_name_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["queries"][1]["name"] = "orders_by_customer"
        v = evaluate(m)
        self.assertEqual(check_status(v, "no_sql_query_name_duplicated"), "fail")
        self.assertEqual(v["duplicate_sql_query_names"], ["orders_by_customer"])

    def test_duplicate_index_name_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["indexes"][1]["name"] = "idx_orders_customer"
        self.assertEqual(check_status(evaluate(m), "no_sql_index_name_duplicated"), "fail")

    def test_long_transaction_declaration_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["transactions"]["transactions_kept_short"] = False
        self.assertEqual(evaluate(m)["sections"]["transactions_and_concurrency"], "fail")

    def test_migration_without_rollback_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["migrations"]["forward_and_rollback_scripts_present"] = False
        self.assertEqual(evaluate(m)["sections"]["migrations_and_migration_safety"], "fail")

    def test_no_explain_evidence_fails_performance_section(self):
        m = copy.deepcopy(COMPLETE)
        m["performance_evidence"]["explain_analyze_captured_before_and_after_heavy_changes"] = False
        self.assertEqual(evaluate(m)["sections"]["performance_evidence_and_plan_regression"], "fail")

    def test_string_concatenated_sql_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sql_red_lines"]["string_concatenated_sql_with_user_input_present"] = True
        v = evaluate(m)
        self.assertEqual(check_status(v, "sql_no_string_concatenated_sql_with_user_input"), "fail")
        self.assertEqual(v["sections"]["sql_red_lines"], "fail")
        self.assertEqual(v["verdict"], "SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY")

    def test_unreviewed_live_migration_red_line_fails(self):
        m = copy.deepcopy(COMPLETE)
        m["sql_red_lines"]["unreviewed_migration_on_live_data_present"] = True
        self.assertEqual(check_status(evaluate(m), "sql_no_unreviewed_migration_on_live_data"), "fail")

    def test_absent_section_is_insufficient_not_failed(self):
        m = copy.deepcopy(COMPLETE)
        del m["migrations"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertEqual(v["sections"]["migrations_and_migration_safety"], "insufficient_evidence")

    def test_empty_manifest_is_insufficient_evidence(self):
        v = evaluate({})
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertTrue(all(c["status"] == "missing" for c in v["checks"]))
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["tables_count"])
        self.assertIsNone(v["tables_without_primary_key"])
        self.assertIsNone(v["uncovered_sql_queries"])
        self.assertIsNone(v["query_index_support_coverage"])

    def test_absent_queries_list_is_missing_for_matching_check(self):
        m = copy.deepcopy(COMPLETE)
        del m["queries"]
        v = evaluate(m)
        self.assertEqual(v["verdict"], "INSUFFICIENT_EVIDENCE")
        self.assertIsNone(v["computed_status"])
        self.assertIsNone(v["uncovered_sql_queries"])

    def test_stamp_names_the_verdict(self):
        v = evaluate(copy.deepcopy(COMPLETE))
        self.assertIn("VERDICT: SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY", stamp(v))

    def test_non_object_manifest_rejected(self):
        with self.assertRaises(TypeError):
            evaluate(["not", "a", "manifest"])


class MalformedTypeTests(unittest.TestCase):
    def test_string_field_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["project"] = 12345
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("project", str(ctx.exception))

    def test_object_section_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"schema_design": "should-be-an-object"})
        self.assertIn("schema_design", str(ctx.exception))

    def test_list_field_as_object_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"tables": {"name": "x"}})
        self.assertIn("tables", str(ctx.exception))

    def test_list_entry_as_string_rejected(self):
        with self.assertRaises(TypeError) as ctx:
            evaluate({"queries": ["orders_by_customer"]})
        self.assertIn("queries[0]", str(ctx.exception))

    def test_boolean_leaf_as_string_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["transactions"]["isolation_level_known"] = "yes"
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("transactions.isolation_level_known", str(ctx.exception))

    def test_columns_entry_as_number_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["indexes"][0]["columns"] = [42]
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("indexes[0].columns[0]", str(ctx.exception))

    def test_nested_list_entry_boolean_field_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["tables"][1]["primary_key_declared"] = 7
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("tables[1].primary_key_declared", str(ctx.exception))

    def test_null_section_rejected(self):
        m = copy.deepcopy(COMPLETE)
        m["migrations"] = None
        with self.assertRaises(TypeError) as ctx:
            evaluate(m)
        self.assertIn("migrations", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
