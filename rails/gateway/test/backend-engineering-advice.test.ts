import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/backend-engineering-advice.js";
import { FieldTypeError } from "../src/atoms/validate.js";

// The PRODUCTION_READY manifest, copied from the Python oracle tests.
const COMPLETE: Record<string, unknown> = {
  system: "billing-api",
  contract: {
    defined_before_code: true,
    inputs_defined: true,
    outputs_defined: true,
    errors_defined: true,
    versioned: true,
    kept_in_repo: true,
  },
  validation: {
    at_boundaries: true,
    rejects_bad_input_early_with_specific_errors: true,
    clients_trusted: false,
  },
  idempotency: {
    mutating_operation_count: 4,
    keys_on_mutating_operations: true,
    double_sends_possible: false,
    double_charges_possible: false,
    behavior_verified: true,
  },
  errors: {
    taxonomy_structured: true,
    taxonomy_consistent: true,
    categories_covered: ["validation", "not_found", "conflict",
                         "retryable", "fatal"],
    validation_and_error_paths_tested: true,
    silent_catch_all_present: false,
  },
  jobs: {
    has_async_jobs: true,
    retries_with_backoff_and_jitter: true,
    dead_letter_path_present: true,
    work_can_be_lost: false,
    status_observable: true,
  },
  data: {
    has_migrations: true,
    migrations_reversible: true,
    migrations_backed_up: false,
    migrations_reviewed_before_live_data: true,
    constraints_enforced_in_database: true,
    plaintext_secrets_at_rest: false,
    direct_to_prod_changes: false,
  },
  observability: {
    structured_logs_with_ids_and_timings: true,
    metrics_at_edges: true,
    trace_ids_propagated: true,
    secrets_in_logs: false,
    pii_in_logs: false,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

// ---- The Python VerdictTests, ported ----

test("test_complete_manifest_is_production_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "PRODUCTION_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.computed_status,
    "within_stated_limits_on_declared_evidence");
  assert.equal(v.checks.length, 32);
  assert.deepEqual(v.taxonomy_categories_missing, []);
  assert.equal(v.mutating_operation_count, 4);
});

test("test_contract_not_versioned_fails", () => {
  const m = clone(COMPLETE) as any;
  m.contract.versioned = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_PRODUCTION_READY");
  assert.equal(v.sections["contract_first"], "fail");
});

test("test_contract_defined_after_code_fails", () => {
  const m = clone(COMPLETE) as any;
  m.contract.defined_before_code = false;
  assert.equal(evaluate(m).verdict, "NOT_PRODUCTION_READY");
});

test("test_clients_trusted_fails", () => {
  const m = clone(COMPLETE) as any;
  m.validation.clients_trusted = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_PRODUCTION_READY");
  assert.equal(v.sections["boundary_validation"], "fail");
});

test("test_mutating_operations_without_keys_fails", () => {
  const m = clone(COMPLETE) as any;
  m.idempotency.keys_on_mutating_operations = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_PRODUCTION_READY");
  assert.equal(
    checkStatus(v, "idempotency_keys_on_mutating_operations"), "fail");
});

test("test_zero_mutating_operations_passes_keys_as_not_applicable", () => {
  const m = clone(COMPLETE) as any;
  m.idempotency.mutating_operation_count = 0;
  delete m.idempotency.keys_on_mutating_operations;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_READY");
  assert.equal(v.mutating_operation_count, 0);
});

test("test_mutating_operations_with_keys_undeclared_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.idempotency.keys_on_mutating_operations;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "idempotency_keys_on_mutating_operations"), "missing");
});

test("test_missing_mutating_count_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.idempotency.mutating_operation_count;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.mutating_operation_count, null);
});

test("test_double_charge_possible_fails", () => {
  const m = clone(COMPLETE) as any;
  m.idempotency.double_charges_possible = true;
  assert.equal(evaluate(m).verdict, "NOT_PRODUCTION_READY");
});

test("test_double_send_possible_fails", () => {
  const m = clone(COMPLETE) as any;
  m.idempotency.double_sends_possible = true;
  assert.equal(evaluate(m).verdict, "NOT_PRODUCTION_READY");
});

test("test_taxonomy_missing_a_category_fails", () => {
  const m = clone(COMPLETE) as any;
  m.errors.categories_covered = ["validation", "not_found", "conflict",
                                 "retryable"];
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_PRODUCTION_READY");
  assert.deepEqual(v.taxonomy_categories_missing, ["fatal"]);
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_taxonomy_empty_list_fails_not_missing", () => {
  const m = clone(COMPLETE) as any;
  m.errors.categories_covered = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_PRODUCTION_READY");
  assert.deepEqual(v.taxonomy_categories_missing,
    ["validation", "not_found", "conflict", "retryable", "fatal"]);
});

test("test_taxonomy_extra_categories_still_pass", () => {
  const m = clone(COMPLETE) as any;
  m.errors.categories_covered.push("rate_limited");
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_READY");
  assert.deepEqual(v.taxonomy_categories_missing, []);
});

test("test_missing_taxonomy_list_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.errors.categories_covered;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.taxonomy_categories_missing, null);
  assert.equal(v.computed_status, null);
});

test("test_silent_catch_all_fails_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.errors.silent_catch_all_present = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_PRODUCTION_READY");
  assert.equal(v.sections["error_taxonomy"], "fail");
});

test("test_error_paths_untested_fails", () => {
  const m = clone(COMPLETE) as any;
  m.errors.validation_and_error_paths_tested = false;
  assert.equal(evaluate(m).verdict, "NOT_PRODUCTION_READY");
});

test("test_no_async_jobs_passes_job_checks_as_not_applicable", () => {
  const m = clone(COMPLETE) as any;
  m.jobs = { has_async_jobs: false };
  assert.equal(evaluate(m).verdict, "PRODUCTION_READY");
});

test("test_jobs_without_dead_letter_path_fail", () => {
  const m = clone(COMPLETE) as any;
  m.jobs.dead_letter_path_present = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_PRODUCTION_READY");
  assert.equal(v.sections["jobs_and_queues"], "fail");
});

test("test_lost_work_fails", () => {
  const m = clone(COMPLETE) as any;
  m.jobs.work_can_be_lost = true;
  assert.equal(evaluate(m).verdict, "NOT_PRODUCTION_READY");
});

test("test_job_gate_absent_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.jobs.has_async_jobs;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["jobs_and_queues"], "insufficient_evidence");
});

test("test_migrations_backed_up_but_not_reversible_passes", () => {
  const m = clone(COMPLETE) as any;
  m.data.migrations_reversible = false;
  m.data.migrations_backed_up = true;
  assert.equal(evaluate(m).verdict, "PRODUCTION_READY");
});

test("test_migrations_neither_reversible_nor_backed_up_fails", () => {
  const m = clone(COMPLETE) as any;
  m.data.migrations_reversible = false;
  m.data.migrations_backed_up = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_PRODUCTION_READY");
  assert.equal(
    checkStatus(v, "migrations_reversible_or_backed_up"), "fail");
  assert.equal(v.computed_status,
    "outside_stated_limits_on_declared_evidence");
});

test("test_migrations_reversibility_undeclared_is_missing", () => {
  const m = clone(COMPLETE) as any;
  delete m.data.migrations_reversible;
  delete m.data.migrations_backed_up;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(
    checkStatus(v, "migrations_reversible_or_backed_up"), "missing");
});

test("test_no_migrations_passes_migration_checks_as_not_applicable", () => {
  const m = clone(COMPLETE) as any;
  m.data = {
    has_migrations: false,
    constraints_enforced_in_database: true,
    plaintext_secrets_at_rest: false,
    direct_to_prod_changes: false,
  };
  assert.equal(evaluate(m).verdict, "PRODUCTION_READY");
});

test("test_unreviewed_migrations_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.data.migrations_reviewed_before_live_data = false;
  assert.equal(evaluate(m).verdict, "NOT_PRODUCTION_READY");
});

test("test_plaintext_secrets_at_rest_fails", () => {
  const m = clone(COMPLETE) as any;
  m.data.plaintext_secrets_at_rest = true;
  assert.equal(evaluate(m).verdict, "NOT_PRODUCTION_READY");
});

test("test_direct_to_prod_changes_fail_red_line", () => {
  const m = clone(COMPLETE) as any;
  m.data.direct_to_prod_changes = true;
  assert.equal(evaluate(m).verdict, "NOT_PRODUCTION_READY");
});

test("test_constraints_only_in_app_fail", () => {
  const m = clone(COMPLETE) as any;
  m.data.constraints_enforced_in_database = false;
  assert.equal(evaluate(m).verdict, "NOT_PRODUCTION_READY");
});

test("test_secrets_in_logs_fail_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  m.observability.secrets_in_logs = true;
  const v = evaluate(m);
  assert.equal(v.verdict, "NOT_PRODUCTION_READY");
  assert.equal(v.sections["observability"], "fail");
});

test("test_pii_in_logs_fails_quality_gate", () => {
  const m = clone(COMPLETE) as any;
  m.observability.pii_in_logs = true;
  assert.equal(evaluate(m).verdict, "NOT_PRODUCTION_READY");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.observability;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["observability"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.computed_status, null);
  assert.equal(v.taxonomy_categories_missing, null);
  assert.equal(v.mutating_operation_count, null);
});

test("test_stamp_names_the_verdict", () => {
  const v = evaluate(clone(COMPLETE));
  assert.ok(stamp(v).includes("VERDICT: PRODUCTION_READY"));
});

test("test_non_object_manifest_rejected", () => {
  assert.throws(
    () => evaluate(["not", "a", "manifest"]),
    (err: unknown) =>
      err instanceof TypeError &&
      (err as Error).message === "manifest must be a JSON object",
  );
});

// ---- F1 regression: malformed field types (external verification
// Wave 1) — the Python MalformedTypeTests, ported. A documented
// field present with the wrong JSON type raises FieldTypeError
// naming the field — never a verdict over garbage.

function fieldError(field: string) {
  return (err: unknown) =>
    err instanceof FieldTypeError && err.field === field;
}

test("malformed: top-level string field as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.system = 12345;
  assert.throws(() => evaluate(m), fieldError("system"));
});

test("malformed: section as string rejected", () => {
  assert.throws(
    () => evaluate({ contract: "should-be-an-object" }),
    fieldError("contract"),
  );
});

test("malformed: list field as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.errors.categories_covered = "validation";
  assert.throws(() => evaluate(m), fieldError("errors.categories_covered"));
});

test("malformed: list entry as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.errors.categories_covered = ["validation", 42];
  assert.throws(
    () => evaluate(m), fieldError("errors.categories_covered[1]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.contract.versioned = "yes";
  assert.throws(() => evaluate(m), fieldError("contract.versioned"));
});

test("malformed: numeric leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.idempotency.mutating_operation_count = "four";
  assert.throws(
    () => evaluate(m),
    fieldError("idempotency.mutating_operation_count"));
});

test("malformed: numeric leaf as boolean rejected", () => {
  const m = clone(COMPLETE) as any;
  m.idempotency.mutating_operation_count = true;
  assert.throws(
    () => evaluate(m),
    fieldError("idempotency.mutating_operation_count"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.data = null;
  assert.throws(() => evaluate(m), fieldError("data"));
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
  .filter((f) => f.startsWith("backend-engineering-advice--") && f.endsWith(".json"))
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
