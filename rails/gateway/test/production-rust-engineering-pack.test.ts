import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/production-rust-engineering-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  project: "gateway-hot-path",
  ownership: { borrow_before_cloning_practised: true,
               lifetimes_kept_local: true,
               owned_data_at_boundaries_borrows_within: true,
               clones_justified_where_present: true },
  errors: { error_enums_used_for_fallible_apis: true,
            thiserror_used_for_library_errors: true,
            anyhow_used_for_binary_errors: true,
            question_mark_propagation_used: true,
            no_unwrap_or_expect_in_production_paths: true,
            unwrap_expect_exceptions_limited_to_tests_and_startup_with_messages: true },
  unsafe_policy: { unsafe_forbidden_by_default_declared: true,
                   unsafe_isolated_in_dedicated_modules: true },
  unsafe_blocks: [
    { location: "ffi::reader::read_raw", invariant_documented: true, tests_covering_block: true },
    { location: "ring::buf::as_slice_unchecked", invariant_documented: true, tests_covering_block: true },
  ],
  async_runtime: { structured_tasks_with_tokio_used: true,
                   blocking_calls_absent_from_async_code: true,
                   bounded_channels_used: true,
                   timeouts_applied_everywhere: true },
  testing: { unit_tests_beside_code_present: true,
             integration_tests_in_tests_directory_present: true,
             doc_tests_for_examples_present: true,
             error_paths_tested: true,
             criterion_benchmarks_present: true,
             tests_green_including_failure_paths: true },
  tooling: { clippy_clean_with_deny_warnings: true,
             cargo_fmt_check_clean: true,
             lints_fixed_not_silenced_without_reason: true },
  workspace: { crates_split_only_at_real_boundaries: true,
               feature_flags_kept_minimal_no_default_bloat: true },
  supply_chain: { cargo_audit_run: true,
                  msrv_pinned: true,
                  new_crates_reviewed_before_adoption: true },
  red_lines: { blocking_work_inside_async_present: false,
               unbounded_channels_present: false,
               spawn_loops_without_backpressure_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "PRODUCTION_RUST_ENGINEERING_PACK_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 37);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.unsafe_blocks_count, 2);
  assert.deepEqual(v.unsafe_blocks_without_invariant, []);
  assert.deepEqual(v.unsafe_blocks_without_tests, []);
  assert.equal(v.documented_coverage, "1.000000");
  assert.equal(v.tested_coverage, "1.000000");
  assert.deepEqual(v.duplicate_unsafe_block_locations, []);
});

test("test_empty_unsafe_blocks_list_is_a_valid_declaration", () => {
  const m = clone(COMPLETE) as any;
  m.unsafe_blocks = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_RUST_ENGINEERING_PACK_READY");
  assert.equal(v.unsafe_blocks_count, 0);
  assert.deepEqual(v.unsafe_blocks_without_invariant, []);
  assert.deepEqual(v.unsafe_blocks_without_tests, []);
  assert.equal(v.documented_coverage, null);
  assert.equal(v.tested_coverage, null);
  assert.deepEqual(v.duplicate_unsafe_block_locations, []);
  assert.equal(checkStatus(v, "unsafe_blocks_declared"), "pass");
  assert.equal(checkStatus(v, "every_unsafe_block_documents_its_invariant"), "pass");
});

test("test_clone_first_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.ownership.borrow_before_cloning_practised = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY");
  assert.equal(v.sections["ownership_and_lifetimes"], "fail");
  assert.equal(checkStatus(v, "borrow_before_cloning_practised"), "fail");
});

test("test_unwrap_in_production_paths_fails", () => {
  const m = clone(COMPLETE) as any;
  m.errors.no_unwrap_or_expect_in_production_paths = false;
  assert.equal(checkStatus(evaluate(m), "no_unwrap_or_expect_in_production_paths"), "fail");
});

test("test_no_thiserror_for_library_errors_fails", () => {
  const m = clone(COMPLETE) as any;
  m.errors.thiserror_used_for_library_errors = false;
  assert.equal(evaluate(m).verdict, "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY");
});

test("test_undocumented_unsafe_block_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.unsafe_blocks[0].invariant_documented = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY");
  assert.equal(checkStatus(v, "every_unsafe_block_documents_its_invariant"), "fail");
  assert.deepEqual(v.unsafe_blocks_without_invariant, ["ffi::reader::read_raw"]);
  assert.equal(v.documented_coverage, "0.500000");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_untested_unsafe_block_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.unsafe_blocks[1].tests_covering_block = false;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "every_unsafe_block_has_covering_tests"), "fail");
  assert.deepEqual(v.unsafe_blocks_without_tests, ["ring::buf::as_slice_unchecked"]);
  assert.equal(v.tested_coverage, "0.500000");
});

test("test_unsafe_block_missing_invariant_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.unsafe_blocks[0].invariant_documented;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_unsafe_block_documents_its_invariant"), "missing");
  assert.deepEqual(v.unsafe_blocks_without_invariant, []);
});

test("test_duplicate_unsafe_block_location_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.unsafe_blocks[1].location = "ffi::reader::read_raw";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_unsafe_block_location_duplicated"), "fail");
  assert.deepEqual(v.duplicate_unsafe_block_locations, ["ffi::reader::read_raw"]);
});

test("test_unsafe_block_missing_location_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.unsafe_blocks[1].location;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_unsafe_block_location_duplicated"), "missing");
  assert.deepEqual(v.duplicate_unsafe_block_locations, []);
});

test("test_absent_unsafe_blocks_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.unsafe_blocks;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "unsafe_blocks_declared"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.unsafe_blocks_count, null);
  assert.equal(v.unsafe_blocks_without_invariant, null);
  assert.equal(v.unsafe_blocks_without_tests, null);
  assert.equal(v.documented_coverage, null);
  assert.equal(v.tested_coverage, null);
  assert.equal(v.duplicate_unsafe_block_locations, null);
});

test("test_unsafe_not_forbidden_by_default_fails", () => {
  const m = clone(COMPLETE) as any;
  m.unsafe_policy.unsafe_forbidden_by_default_declared = false;
  assert.equal(evaluate(m).sections["unsafe_discipline"], "fail");
});

test("test_blocking_calls_in_async_fail_section4", () => {
  const m = clone(COMPLETE) as any;
  m.async_runtime.blocking_calls_absent_from_async_code = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY");
  assert.equal(v.sections["async_discipline"], "fail");
});

test("test_unbounded_channels_declaration_fails", () => {
  const m = clone(COMPLETE) as any;
  m.async_runtime.bounded_channels_used = false;
  assert.equal(checkStatus(evaluate(m), "bounded_channels_used"), "fail");
});

test("test_error_paths_untested_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.testing.error_paths_tested = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY");
  assert.equal(v.sections["testing_and_benchmarks"], "fail");
});

test("test_no_doc_tests_fails", () => {
  const m = clone(COMPLETE) as any;
  m.testing.doc_tests_for_examples_present = false;
  assert.equal(checkStatus(evaluate(m), "doc_tests_for_examples_present"), "fail");
});

test("test_clippy_warnings_fails_section6", () => {
  const m = clone(COMPLETE) as any;
  m.tooling.clippy_clean_with_deny_warnings = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY");
  assert.equal(v.sections["tooling_workspace_and_supply_chain"], "fail");
});

test("test_default_feature_bloat_fails", () => {
  const m = clone(COMPLETE) as any;
  m.workspace.feature_flags_kept_minimal_no_default_bloat = false;
  assert.equal(checkStatus(evaluate(m), "feature_flags_kept_minimal_no_default_bloat"), "fail");
});

test("test_unpinned_msrv_fails", () => {
  const m = clone(COMPLETE) as any;
  m.supply_chain.msrv_pinned = false;
  assert.equal(checkStatus(evaluate(m), "msrv_pinned"), "fail");
});

test("test_blocking_work_in_async_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.blocking_work_inside_async_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_blocking_work_inside_async"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
});

test("test_unbounded_channels_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unbounded_channels_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_unbounded_channels"), "fail");
  assert.equal(v.verdict, "PRODUCTION_RUST_ENGINEERING_PACK_NOT_READY");
});

test("test_spawn_loops_without_backpressure_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.spawn_loops_without_backpressure_present = true;
  assert.equal(checkStatus(evaluate(m), "no_spawn_loops_without_backpressure"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.testing;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["testing_and_benchmarks"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.unsafe_blocks_count, null);
  assert.equal(v.unsafe_blocks_without_invariant, null);
  assert.equal(v.unsafe_blocks_without_tests, null);
  assert.equal(v.documented_coverage, null);
  assert.equal(v.tested_coverage, null);
  assert.equal(v.duplicate_unsafe_block_locations, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: PRODUCTION_RUST_ENGINEERING_PACK_READY"));
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
  assert.throws(() => evaluate({ ownership: "should-be-an-object" }), fieldError("ownership"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ unsafe_blocks: { location: "ffi::x" } }), fieldError("unsafe_blocks"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ unsafe_blocks: ["ffi::x"] }), fieldError("unsafe_blocks[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.testing.error_paths_tested = "yes";
  assert.throws(() => evaluate(m), fieldError("testing.error_paths_tested"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.unsafe_blocks[0].location = 42;
  assert.throws(() => evaluate(m), fieldError("unsafe_blocks[0].location"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.unsafe_blocks[1].invariant_documented = 7;
  assert.throws(() => evaluate(m), fieldError("unsafe_blocks[1].invariant_documented"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.tooling = null;
  assert.throws(() => evaluate(m), fieldError("tooling"));
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
  .filter((f) => f.startsWith("production-rust-engineering-pack--") && f.endsWith(".json"))
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
