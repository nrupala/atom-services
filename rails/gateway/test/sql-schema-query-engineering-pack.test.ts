import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/sql-schema-query-engineering-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  project: "orders-db",
  schema_design: {
    precise_column_types_declared: true,
    not_null_default_with_nullable_exceptions_explicit: true,
    check_and_foreign_key_constraints_in_database: true,
    snake_case_naming_consistent: true },
  tables: [
    { name: "customer_orders", primary_key_declared: true, schema_constraints_declared: true, not_null_default_declared: true },
    { name: "order_items", primary_key_declared: true, schema_constraints_declared: true, not_null_default_declared: true },
  ],
  index_design: {
    indexes_derived_from_real_access_patterns: true,
    composite_index_column_order_follows_query_order: true,
    index_write_cost_measured_before_adding: true },
  indexes: [
    { name: "idx_orders_customer", table: "customer_orders", columns: ["customer_id", "created_at"] },
    { name: "idx_items_order", table: "order_items", columns: ["order_id"] },
  ],
  queries: [
    { name: "orders_by_customer", table: "customer_orders", supporting_index_name: "idx_orders_customer", explicit_column_list_declared: true, bounded_or_paginated_declared: true, parameterized_inputs_declared: true, n_plus_one_avoidance_declared: true },
    { name: "items_by_order", table: "order_items", supporting_index_name: "idx_items_order", explicit_column_list_declared: true, bounded_or_paginated_declared: true, parameterized_inputs_declared: true, n_plus_one_avoidance_declared: true },
  ],
  query_practice: {
    set_based_queries_preferred: true,
    complex_reads_use_ctes_or_window_functions: true,
    large_results_paginated: true,
    related_data_joined_batched_or_preloaded: true,
    query_count_tests_verify_no_n_plus_one: true },
  transactions: {
    transactions_kept_short: true,
    isolation_level_known: true,
    deadlock_retry_with_backoff_declared: true },
  sql_safety: {
    all_external_input_bound_as_parameters: true,
    update_and_delete_statements_all_carry_where: true,
    bounded_writes_rehearsed_before_execution: true },
  migrations: {
    forward_and_rollback_scripts_present: true,
    migrations_tested_on_a_copy: true,
    expand_migrate_contract_for_zero_downtime: true,
    one_logical_change_per_migration: true },
  performance_evidence: {
    explain_analyze_captured_before_and_after_heavy_changes: true,
    query_plan_regressions_watched: true },
  sql_red_lines: {
    string_concatenated_sql_with_user_input_present: false,
    unreviewed_migration_on_live_data_present: false,
    direct_to_production_schema_edit_present: false,
    unbounded_write_without_where_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 44);
  assert.equal(Object.keys(v.sections).length, 8);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.tables_count, 2);
  assert.equal(v.indexes_count, 2);
  assert.equal(v.queries_count, 2);
  assert.equal(v.table_primary_key_coverage, "1.000000");
  assert.equal(v.query_index_support_coverage, "1.000000");
  assert.deepEqual(v.uncovered_sql_queries, []);
  assert.deepEqual(v.duplicate_sql_table_names, []);
});

test("test_empty_lists_fail_declared_checks", () => {
  const m = clone(COMPLETE) as any;
  m.tables = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY");
  assert.equal(checkStatus(v, "sql_tables_declared"), "fail");
  assert.equal(v.table_primary_key_coverage, null);
});

test("test_table_without_primary_key_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.tables[0].primary_key_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_sql_table_declares_primary_key"), "fail");
  assert.deepEqual(v.tables_without_primary_key, ["customer_orders"]);
  assert.equal(v.table_primary_key_coverage, "0.500000");
  assert.equal(v.sections["schema_constraints_and_naming"], "fail");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_table_missing_constraints_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.tables[1].schema_constraints_declared;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_sql_table_declares_schema_constraints"), "missing");
  assert.deepEqual(v.tables_without_schema_constraints, []);
});

test("test_non_snake_case_table_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.tables[0].name = "CustomerOrders";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_sql_table_name_is_snake_case"), "fail");
  assert.deepEqual(v.tables_with_non_snake_case_names, ["CustomerOrders"]);
});

test("test_duplicate_table_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.tables[1].name = "customer_orders";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_sql_table_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_sql_table_names, ["customer_orders"]);
});

test("test_index_without_columns_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.indexes[0].columns = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_sql_index_declares_nonempty_columns"), "fail");
  assert.deepEqual(v.indexes_without_columns, ["idx_orders_customer"]);
  assert.equal(v.index_columns_coverage, "0.500000");
});

test("test_query_with_wrong_table_index_is_uncovered", () => {
  const m = clone(COMPLETE) as any;
  m.queries[0].supporting_index_name = "idx_items_order";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_declared_sql_query_has_matching_declared_index"), "fail");
  assert.deepEqual(v.uncovered_sql_queries, ["orders_by_customer"]);
  assert.equal(v.query_index_support_coverage, "0.500000");
});

test("test_query_missing_supporting_index_field_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.queries[0].supporting_index_name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_declared_sql_query_has_matching_declared_index"), "missing");
  assert.deepEqual(v.uncovered_sql_queries, []);
});

test("test_select_star_query_fails_explicit_column_check", () => {
  const m = clone(COMPLETE) as any;
  m.queries[1].explicit_column_list_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_sql_query_declares_explicit_column_list"), "fail");
  assert.deepEqual(v.queries_without_explicit_column_list, ["items_by_order"]);
  assert.equal(v.sections["query_construction_pagination_and_n_plus_one_prevention"], "fail");
});

test("test_unparameterized_query_fails_safety_section", () => {
  const m = clone(COMPLETE) as any;
  m.queries[0].parameterized_inputs_declared = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_sql_query_declares_parameterized_inputs"), "fail");
  assert.deepEqual(v.queries_without_parameterized_inputs, ["orders_by_customer"]);
  assert.equal(v.sections["sql_safety_and_bounded_writes"], "fail");
});

test("test_duplicate_query_name_fails", () => {
  const m = clone(COMPLETE) as any;
  m.queries[1].name = "orders_by_customer";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_sql_query_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_sql_query_names, ["orders_by_customer"]);
});

test("test_duplicate_index_name_fails", () => {
  const m = clone(COMPLETE) as any;
  m.indexes[1].name = "idx_orders_customer";
  assert.equal(checkStatus(evaluate(m), "no_sql_index_name_duplicated"), "fail");
});

test("test_long_transaction_declaration_fails", () => {
  const m = clone(COMPLETE) as any;
  m.transactions.transactions_kept_short = false;
  assert.equal(evaluate(m).sections["transactions_and_concurrency"], "fail");
});

test("test_migration_without_rollback_fails", () => {
  const m = clone(COMPLETE) as any;
  m.migrations.forward_and_rollback_scripts_present = false;
  assert.equal(evaluate(m).sections["migrations_and_migration_safety"], "fail");
});

test("test_no_explain_evidence_fails_performance_section", () => {
  const m = clone(COMPLETE) as any;
  m.performance_evidence.explain_analyze_captured_before_and_after_heavy_changes = false;
  assert.equal(evaluate(m).sections["performance_evidence_and_plan_regression"], "fail");
});

test("test_string_concatenated_sql_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sql_red_lines.string_concatenated_sql_with_user_input_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "sql_no_string_concatenated_sql_with_user_input"), "fail");
  assert.equal(v.sections["sql_red_lines"], "fail");
  assert.equal(v.verdict, "SQL_SCHEMA_QUERY_ENGINEERING_PACK_NOT_READY");
});

test("test_unreviewed_live_migration_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.sql_red_lines.unreviewed_migration_on_live_data_present = true;
  assert.equal(checkStatus(evaluate(m), "sql_no_unreviewed_migration_on_live_data"), "fail");
});

test("test_absent_section_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.migrations;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["migrations_and_migration_safety"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.tables_count, null);
  assert.equal(v.tables_without_primary_key, null);
  assert.equal(v.uncovered_sql_queries, null);
  assert.equal(v.query_index_support_coverage, null);
});

test("test_absent_queries_list_is_missing_for_matching_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.queries;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.uncovered_sql_queries, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: SQL_SCHEMA_QUERY_ENGINEERING_PACK_READY"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.project = 12345;
  assert.throws(() => evaluate(m), fieldError("project"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(() => evaluate({ schema_design: "should-be-an-object" }), fieldError("schema_design"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ tables: { name: "x" } }), fieldError("tables"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ queries: ["orders_by_customer"] }), fieldError("queries[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.transactions.isolation_level_known = "yes";
  assert.throws(() => evaluate(m), fieldError("transactions.isolation_level_known"));
});

test("malformed: columns entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.indexes[0].columns = [42];
  assert.throws(() => evaluate(m), fieldError("indexes[0].columns[0]"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.tables[1].primary_key_declared = 7;
  assert.throws(() => evaluate(m), fieldError("tables[1].primary_key_declared"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.migrations = null;
  assert.throws(() => evaluate(m), fieldError("migrations"));
});

// ---- Golden-fixture parity against the Python oracle ----

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "test",
  "fixtures",
);

interface Fixture {
  name: string;
  manifest: unknown;
  expected: unknown;
}

const fixtureFiles = readdirSync(fixturesDir)
  .filter((f) => f.startsWith("sql-schema-query-engineering-pack--") && f.endsWith(".json"))
  .sort();

assert.ok(fixtureFiles.length > 0, "no golden fixtures found for this atom");

for (const file of fixtureFiles) {
  const fixture = JSON.parse(
    readFileSync(path.join(fixturesDir, file), "utf-8"),
  ) as Fixture;
  test(`golden fixture parity: ${fixture.name}`, () => {
    assert.deepStrictEqual(evaluate(fixture.manifest), fixture.expected);
  });
}
