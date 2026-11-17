import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/strict-typescript-engineering-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  project: "frontend-tooling-app",
  tsconfig: {
    strict_true_enabled: true,
    no_unchecked_indexed_access_enabled: true,
    tsc_no_emit_in_development_loop: true,
    tsc_no_emit_clean_under_strict: true },
  typing: {
    unknown_used_and_narrowed_instead_of_any: true,
    no_any_in_src: true,
    casts_avoided_or_remaining_justified: true,
    non_null_assertion_chains_absent: true },
  boundary_validation: {
    external_input_validated_with_schema: true,
    parse_not_trust_at_edges: true },
  boundaries: [
    { name: "api-response", schema_validated: true, schema_tested: true },
    { name: "local-storage", schema_validated: true, schema_tested: true },
  ],
  state_modelling: {
    discriminated_unions_for_status_machines: true,
    exhaustive_switch_with_never_check: true,
    illegal_states_unrepresentable_by_design: true },
  module_structure: {
    small_files_kept: true,
    deep_imports_preferred_over_barrel_files: true,
    explicit_public_surfaces: true },
  modules: [
    { name: "src/orders.ts", any_free: true, explicit_public_surface: true },
    { name: "src/billing.ts", any_free: true, explicit_public_surface: true },
  ],
  async_practices: {
    all_promises_awaited_or_handled: true,
    no_floating_promises: true,
    promise_handling_lint_rule_enabled: true,
    abort_controller_for_cancellable_work: true },
  testing: {
    unit_tests_for_logic_with_vitest: true,
    integration_tests_at_module_edges: true,
    types_tested_by_compilation: true },
  build_tooling: {
    tsc_for_types_and_bundler_for_bundling: true,
    source_maps_enabled: true,
    dependencies_pinned: true,
    lint_clean: true },
  red_lines: {
    ts_ignore_or_ts_expect_error_without_tracked_reason_present: false,
    unvalidated_runtime_shapes_assumed_present: false,
    any_in_src_present: false,
    floating_promises_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "STRICT_TYPESCRIPT_ENGINEERING_PACK_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 39);
  assert.equal(Object.keys(v.sections).length, 8);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.boundaries_count, 2);
  assert.equal(v.modules_count, 2);
  assert.deepEqual(v.boundaries_without_schema_validation, []);
  assert.deepEqual(v.boundaries_without_schema_tests, []);
  assert.deepEqual(v.modules_not_any_free, []);
  assert.deepEqual(v.modules_without_explicit_public_surface, []);
  assert.equal(v.strict_flag_coverage, "1.000000");
  assert.equal(v.schema_validation_coverage, "1.000000");
  assert.equal(v.schema_test_coverage, "1.000000");
  assert.equal(v.any_free_coverage, "1.000000");
  assert.equal(v.explicit_public_surface_coverage, "1.000000");
  assert.deepEqual(v.duplicate_boundary_names, []);
  assert.deepEqual(v.duplicate_module_names, []);
});

test("test_empty_row_lists_are_valid_declarations", () => {
  const m = clone(COMPLETE) as any;
  m.boundaries = [];
  m.modules = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "STRICT_TYPESCRIPT_ENGINEERING_PACK_READY");
  assert.equal(v.boundaries_count, 0);
  assert.equal(v.modules_count, 0);
  assert.equal(v.schema_validation_coverage, null);
  assert.equal(v.any_free_coverage, null);
  assert.equal(checkStatus(v, "ts_boundaries_declared"), "pass");
  assert.equal(checkStatus(v, "ts_modules_declared"), "pass");
});

test("test_strict_disabled_fails_and_halves_strict_flag_coverage", () => {
  const m = clone(COMPLETE) as any;
  m.tsconfig.strict_true_enabled = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY");
  assert.equal(v.sections["strict_tsconfig_and_compiler_gate"], "fail");
  assert.equal(v.strict_flag_coverage, "0.500000");
});

test("test_no_unchecked_indexed_access_disabled_fails", () => {
  const m = clone(COMPLETE) as any;
  m.tsconfig.no_unchecked_indexed_access_enabled = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "ts_no_unchecked_indexed_access_enabled"), "fail");
  assert.equal(v.strict_flag_coverage, "0.500000");
});

test("test_missing_strict_flag_is_missing_and_coverage_null", () => {
  const m = clone(COMPLETE) as any;
  delete m.tsconfig.strict_true_enabled;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.strict_flag_coverage, null);
});

test("test_any_in_src_fails_typing", () => {
  const m = clone(COMPLETE) as any;
  m.typing.no_any_in_src = false;
  const v = evaluate(m);
  assert.equal(v.sections["typing_discipline_no_any"], "fail");
  assert.equal(checkStatus(v, "ts_src_declared_any_free"), "fail");
});

test("test_unjustified_casts_fail", () => {
  const m = clone(COMPLETE) as any;
  m.typing.casts_avoided_or_remaining_justified = false;
  assert.equal(checkStatus(evaluate(m), "ts_casts_avoided_or_justified"), "fail");
});

test("test_boundary_without_schema_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.boundaries[0].schema_validated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY");
  assert.equal(checkStatus(v, "every_ts_boundary_schema_validated"), "fail");
  assert.deepEqual(v.boundaries_without_schema_validation, ["api-response"]);
  assert.equal(v.schema_validation_coverage, "0.500000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_boundary_without_schema_tests_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.boundaries[1].schema_tested = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ts_boundary_schema_tested"), "fail");
  assert.deepEqual(v.boundaries_without_schema_tests, ["local-storage"]);
  assert.equal(v.schema_test_coverage, "0.500000");
});

test("test_boundary_missing_schema_field_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.boundaries[0].schema_validated;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_ts_boundary_schema_validated"), "missing");
  assert.deepEqual(v.boundaries_without_schema_validation, []);
});

test("test_duplicate_boundary_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.boundaries[1].name = "api-response";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_ts_boundary_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_boundary_names, ["api-response"]);
});

test("test_absent_boundaries_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.boundaries;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "ts_boundaries_declared"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.boundaries_count, null);
  assert.equal(v.boundaries_without_schema_validation, null);
  assert.equal(v.schema_validation_coverage, null);
  assert.equal(v.duplicate_boundary_names, null);
});

test("test_non_union_status_machine_fails", () => {
  const m = clone(COMPLETE) as any;
  m.state_modelling.discriminated_unions_for_status_machines = false;
  assert.equal(evaluate(m).sections["state_modelling_with_discriminated_unions"], "fail");
});

test("test_missing_never_check_fails", () => {
  const m = clone(COMPLETE) as any;
  m.state_modelling.exhaustive_switch_with_never_check = false;
  assert.equal(checkStatus(evaluate(m), "ts_exhaustive_switch_never_check"), "fail");
});

test("test_module_with_any_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.modules[0].any_free = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ts_module_any_free"), "fail");
  assert.deepEqual(v.modules_not_any_free, ["src/orders.ts"]);
  assert.equal(v.any_free_coverage, "0.500000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_module_without_explicit_surface_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.modules[1].explicit_public_surface = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_ts_module_explicit_public_surface"), "fail");
  assert.deepEqual(v.modules_without_explicit_public_surface, ["src/billing.ts"]);
  assert.equal(v.explicit_public_surface_coverage, "0.500000");
});

test("test_duplicate_module_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.modules[1].name = "src/orders.ts";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_ts_module_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_module_names, ["src/orders.ts"]);
});

test("test_module_missing_name_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.modules[1].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_ts_module_name_duplicated"), "missing");
  assert.deepEqual(v.duplicate_module_names, []);
});

test("test_absent_modules_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.modules;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.modules_count, null);
  assert.equal(v.modules_not_any_free, null);
  assert.equal(v.duplicate_module_names, null);
});

test("test_floating_promises_fail_async", () => {
  const m = clone(COMPLETE) as any;
  m.async_practices.no_floating_promises = false;
  assert.equal(evaluate(m).sections["async_and_cancellation_discipline"], "fail");
});

test("test_no_abort_controller_fails", () => {
  const m = clone(COMPLETE) as any;
  m.async_practices.abort_controller_for_cancellable_work = false;
  assert.equal(checkStatus(evaluate(m), "ts_abort_controller_for_cancellable_work"), "fail");
});

test("test_no_vitest_unit_tests_fails_tooling_section", () => {
  const m = clone(COMPLETE) as any;
  m.testing.unit_tests_for_logic_with_vitest = false;
  assert.equal(evaluate(m).sections["tests_build_and_tooling"], "fail");
});

test("test_lint_not_clean_fails", () => {
  const m = clone(COMPLETE) as any;
  m.build_tooling.lint_clean = false;
  assert.equal(checkStatus(evaluate(m), "ts_lint_clean_declared"), "fail");
});

test("test_untracked_ts_ignore_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.ts_ignore_or_ts_expect_error_without_tracked_reason_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "ts_no_untracked_ts_ignore_or_expect_error"), "fail");
  assert.equal(v.sections["typescript_red_lines"], "fail");
});

test("test_unvalidated_runtime_shapes_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unvalidated_runtime_shapes_assumed_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "ts_no_unvalidated_runtime_shape_assumption"), "fail");
  assert.equal(v.verdict, "STRICT_TYPESCRIPT_ENGINEERING_PACK_NOT_READY");
});

test("test_any_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.any_in_src_present = true;
  assert.equal(checkStatus(evaluate(m), "ts_red_line_any_absent_from_src"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.testing;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["tests_build_and_tooling"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.boundaries_count, null);
  assert.equal(v.modules_count, null);
  assert.equal(v.strict_flag_coverage, null);
  assert.equal(v.schema_validation_coverage, null);
  assert.equal(v.any_free_coverage, null);
  assert.equal(v.duplicate_boundary_names, null);
  assert.equal(v.duplicate_module_names, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: STRICT_TYPESCRIPT_ENGINEERING_PACK_READY"));
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
  assert.throws(() => evaluate({ tsconfig: "should-be-an-object" }), fieldError("tsconfig"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ boundaries: { name: "api-response" } }), fieldError("boundaries"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ modules: ["src/orders.ts"] }), fieldError("modules[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.tsconfig.strict_true_enabled = "yes";
  assert.throws(() => evaluate(m), fieldError("tsconfig.strict_true_enabled"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.boundaries[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("boundaries[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.modules[1].any_free = 7;
  assert.throws(() => evaluate(m), fieldError("modules[1].any_free"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.testing = null;
  assert.throws(() => evaluate(m), fieldError("testing"));
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
  .filter((f) => f.startsWith("strict-typescript-engineering-pack--") && f.endsWith(".json"))
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
