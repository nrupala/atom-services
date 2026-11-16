import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/database-design-review.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The DATABASE_DESIGN_SOUND manifest, copied from the Python
// VerdictTests oracle.
const COMPLETE: Record<string, unknown> = {
  design: "orders-platform",
  store_selection: { access_patterns_mapped: true,
                     store_chosen_from_access_patterns: true,
                     relational_default_or_fit_justified: true },
  tables: [
    { name: "orders", primary_key: "id", constraints_declared: true },
    { name: "order_items", primary_key: "id", constraints_declared: true },
  ],
  normalization: { normalized_to_3nf: true,
                   denormalized: true,
                   denormalization_reasons_documented: true },
  query_patterns: [
    { name: "orders_by_customer", table: "orders",
      supporting_index: "idx_orders_customer" },
    { name: "items_by_order", table: "order_items",
      supporting_index: "idx_items_order" },
  ],
  indexes: [
    { name: "idx_orders_customer", table: "orders",
      columns: ["customer_id", "created_at"] },
    { name: "idx_items_order", table: "order_items",
      columns: ["order_id"] },
  ],
  indexing: { composite_column_order_equality_then_range: true,
              covering_indexes_for_hot_queries: true,
              write_cost_considered: true,
              explain_analyze_before_and_after: true },
  performance: { measured_first: true,
                 n_plus_one_queries_addressed: true,
                 keyset_pagination_for_large_sets: true,
                 offset_pagination_at_scale_present: false,
                 connection_pooling_declared: true,
                 bounded_result_sets: true,
                 cache_deliberate_with_honest_invalidation: true },
  integrity: { constraints_enforce_invariants: true,
               appropriate_types_used: true,
               money_stored_as_float: false },
  transactions: { isolation_level_and_anomalies_known: true,
                  transactions_kept_short: true,
                  writes_idempotent_where_retries_possible: true,
                  distributed_store_used: true,
                  consistency_availability_tradeoff_explicit: true },
  security: { parametrized_queries_only: true,
              string_concatenated_sql_present: false,
              least_privilege_users_per_service: true,
              shared_superuser_present: false,
              encryption_at_rest: true },
  migrations: { forward_only: true,
                past_migrations_edited: false,
                expand_contract_pattern_used: true,
                big_bang_schema_swap_present: false },
  backups: { backups_scheduled: true,
             restores_tested_on_schedule: true,
             untested_backup_trusted: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The 27 Python VerdictTests, ported ----

test("test_complete_manifest_is_sound", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "DATABASE_DESIGN_SOUND");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 42);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.tables_count, 2);
  assert.deepEqual(v.tables_without_primary_key, []);
  assert.equal(v.primary_key_coverage, "1.0000");
  assert.equal(v.query_patterns_count, 2);
  assert.equal(v.indexes_count, 2);
  assert.deepEqual(v.uncovered_query_patterns, []);
  assert.equal(v.query_pattern_index_coverage, "1.0000");
});

test("test_access_patterns_not_mapped_fails_schema_section", () => {
  const m = clone(COMPLETE) as any;
  m.store_selection.access_patterns_mapped = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATABASE_DESIGN_NOT_SOUND");
  assert.equal(v.sections["schema_and_normalization"], "fail");
});

test("test_table_without_primary_key_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.tables[1].primary_key = "";
  const v = evaluate(m);
  assert.equal(v.verdict, "DATABASE_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "every_table_has_primary_key_named"), "fail");
  assert.deepEqual(v.tables_without_primary_key, ["order_items"]);
  assert.equal(v.primary_key_coverage, "0.5000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_table_missing_primary_key_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.tables[0].primary_key;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_table_has_primary_key_named"), "missing");
  assert.deepEqual(v.tables_without_primary_key, ["orders"]);
});

test("test_table_without_constraints_declared_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tables[0].constraints_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATABASE_DESIGN_NOT_SOUND");
  assert.deepEqual(v.tables_without_constraints_declared, ["orders"]);
});

test("test_empty_tables_list_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tables = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "tables_declared"), "fail");
  assert.equal(v.tables_count, 0);
  assert.equal(v.primary_key_coverage, null);
});

test("test_not_normalized_to_3nf_fails", () => {
  const m = clone(COMPLETE) as any;
  m.normalization.normalized_to_3nf = false;
  assert.equal(evaluate(m).verdict, "DATABASE_DESIGN_NOT_SOUND");
});

test("test_denormalization_without_reasons_fails_when_denormalized", () => {
  const m = clone(COMPLETE) as any;
  m.normalization.denormalization_reasons_documented = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATABASE_DESIGN_NOT_SOUND");
  assert.equal(checkStatus(v, "denormalization_reasons_documented_when_denormalized"), "fail");
});

test("test_no_denormalization_passes_reason_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.normalization.denormalized = false;
  delete m.normalization.denormalization_reasons_documented;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATABASE_DESIGN_SOUND");
  assert.equal(checkStatus(v, "denormalization_reasons_documented_when_denormalized"), "pass");
});

test("test_denormalization_reason_missing_when_denormalized", () => {
  const m = clone(COMPLETE) as any;
  delete m.normalization.denormalization_reasons_documented;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "denormalization_reasons_documented_when_denormalized"), "missing");
});

test("test_query_pattern_without_matching_index_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.query_patterns[1].supporting_index = "idx_missing";
  const v = evaluate(m);
  assert.equal(v.verdict, "DATABASE_DESIGN_NOT_SOUND");
  assert.equal(v.sections["indexing_and_performance"], "fail");
  assert.equal(checkStatus(v, "every_query_pattern_has_matching_index"), "fail");
  assert.deepEqual(v.uncovered_query_patterns, ["items_by_order"]);
  assert.equal(v.query_pattern_index_coverage, "0.5000");
});

test("test_index_on_wrong_table_does_not_match", () => {
  const m = clone(COMPLETE) as any;
  m.indexes[0].table = "order_items";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_query_pattern_has_matching_index"), "fail");
  assert.deepEqual(v.uncovered_query_patterns, ["orders_by_customer"]);
});

test("test_index_without_columns_fails", () => {
  const m = clone(COMPLETE) as any;
  m.indexes[1].columns = [];
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_index_declares_columns"), "fail");
});

test("test_offset_pagination_at_scale_fails", () => {
  const m = clone(COMPLETE) as any;
  m.performance.offset_pagination_at_scale_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATABASE_DESIGN_NOT_SOUND");
  assert.equal(v.sections["indexing_and_performance"], "fail");
});

test("test_money_stored_as_float_fails", () => {
  const m = clone(COMPLETE) as any;
  m.integrity.money_stored_as_float = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATABASE_DESIGN_NOT_SOUND");
  assert.equal(v.sections["integrity_transactions_and_security"], "fail");
});

test("test_string_concatenated_sql_fails", () => {
  const m = clone(COMPLETE) as any;
  m.security.string_concatenated_sql_present = true;
  assert.equal(evaluate(m).verdict, "DATABASE_DESIGN_NOT_SOUND");
});

test("test_shared_superuser_fails", () => {
  const m = clone(COMPLETE) as any;
  m.security.shared_superuser_present = true;
  assert.equal(evaluate(m).verdict, "DATABASE_DESIGN_NOT_SOUND");
});

test("test_tradeoff_missing_when_distributed", () => {
  const m = clone(COMPLETE) as any;
  delete m.transactions.consistency_availability_tradeoff_explicit;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "consistency_availability_tradeoff_explicit_when_distributed"), "missing");
});

test("test_no_distributed_store_passes_tradeoff_check_as_na", () => {
  const m = clone(COMPLETE) as any;
  m.transactions.distributed_store_used = false;
  delete m.transactions.consistency_availability_tradeoff_explicit;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATABASE_DESIGN_SOUND");
});

test("test_past_migrations_edited_fail", () => {
  const m = clone(COMPLETE) as any;
  m.migrations.past_migrations_edited = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "DATABASE_DESIGN_NOT_SOUND");
  assert.equal(v.sections["migrations_and_backups"], "fail");
});

test("test_big_bang_swap_fails", () => {
  const m = clone(COMPLETE) as any;
  m.migrations.big_bang_schema_swap_present = true;
  assert.equal(evaluate(m).verdict, "DATABASE_DESIGN_NOT_SOUND");
});

test("test_untested_backup_trusted_fails", () => {
  const m = clone(COMPLETE) as any;
  m.backups.untested_backup_trusted = true;
  assert.equal(evaluate(m).verdict, "DATABASE_DESIGN_NOT_SOUND");
});

test("test_restores_not_tested_fail", () => {
  const m = clone(COMPLETE) as any;
  m.backups.restores_tested_on_schedule = false;
  assert.equal(evaluate(m).verdict, "DATABASE_DESIGN_NOT_SOUND");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.backups;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["migrations_and_backups"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.tables_count, null);
  assert.equal(v.tables_without_primary_key, null);
  assert.equal(v.primary_key_coverage, null);
  assert.equal(v.uncovered_query_patterns, null);
  assert.equal(v.query_pattern_index_coverage, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: DATABASE_DESIGN_SOUND"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types — the Python
// MalformedTypeTests, ported.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.design = 12345;
  assert.throws(() => evaluate(m), fieldError("design"));
});

test("malformed: object section as string rejected", () => {
  assert.throws(
    () => evaluate({ normalization: "should-be-an-object" }),
    fieldError("normalization"),
  );
});

test("malformed: list field as object rejected", () => {
  assert.throws(
    () => evaluate({ tables: { name: "orders" } }),
    fieldError("tables"),
  );
});

test("malformed: list entry as string rejected", () => {
  assert.throws(
    () => evaluate({ tables: ["orders"] }),
    fieldError("tables[0]"),
  );
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.store_selection.access_patterns_mapped = "yes";
  assert.throws(() => evaluate(m), fieldError("store_selection.access_patterns_mapped"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.tables[1].primary_key = 42;
  assert.throws(() => evaluate(m), fieldError("tables[1].primary_key"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.tables[0].constraints_declared = "yes";
  assert.throws(() => evaluate(m), fieldError("tables[0].constraints_declared"));
});

test("malformed: columns list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.indexes[0].columns = [123];
  assert.throws(() => evaluate(m), fieldError("indexes[0].columns[0]"));
});

test("malformed: columns as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.indexes[0].columns = "customer_id";
  assert.throws(() => evaluate(m), fieldError("indexes[0].columns"));
});

test("malformed: query pattern entry field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.query_patterns[0].supporting_index = true;
  assert.throws(() => evaluate(m), fieldError("query_patterns[0].supporting_index"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.backups = null;
  assert.throws(() => evaluate(m), fieldError("backups"));
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
  .filter((f) => f.startsWith("database-design-review--") && f.endsWith(".json"))
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
