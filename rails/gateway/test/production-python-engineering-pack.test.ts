import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/production-python-engineering-pack.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  project: "conduit-worker",
  environment: { virtualenv_per_project_used: true,
                 dependencies_declared_in_pyproject: true,
                 dependency_lockfile_present: true,
                 no_installs_into_system_python: true },
  dependencies: [
    { name: "fastapi", version_pinned: true },
    { name: "pydantic", version_pinned: true },
    { name: "pytest", version_pinned: true },
  ],
  typing: { public_functions_annotated: true,
            type_checker_run_in_loop: true,
            typed_models_at_boundaries_for_validation: true },
  style: { ruff_linter_configured: true,
           formatter_ruff_format_or_black_configured: true,
           no_mutable_default_arguments: true,
           f_strings_used_for_formatting: true,
           pathlib_used_over_string_paths: true },
  errors: { specific_exceptions_caught: true,
            errors_fail_loudly_with_context: true,
            logging_used_not_print_in_libraries: true },
  resources: { context_managers_used_for_files_sockets_locks: true,
               orphaned_handles_avoided: true },
  async_practices: { no_blocking_calls_in_event_loops: true,
                     timeouts_on_every_network_call: true,
                     structured_concurrency_used_where_possible: true },
  testing: { pytest_suite_present: true,
             pytest_fixtures_used: true,
             pytest_parametrize_used: true,
             error_paths_tested_under_pytest: true,
             time_and_randomness_frozen_in_tests: true,
             unit_tests_fast_declared: true,
             pytest_green_including_error_paths: true },
  packaging: { pyproject_metadata_present: true,
               console_entry_points_declared: true,
               reproducible_builds_declared: true,
               production_dependencies_pinned: true,
               ruff_and_type_checker_clean_on_diff: true,
               virtualenv_reproducible_declared: true },
  red_lines: { secrets_in_code_or_notebooks_present: false,
               unpinned_pip_install_in_production_paths_present: false,
               bare_except_present: false },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, "PRODUCTION_PYTHON_ENGINEERING_PACK_READY");
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 39);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.dependencies_count, 3);
  assert.deepEqual(v.dependencies_without_pin, []);
  assert.equal(v.pin_coverage, "1.000000");
  assert.deepEqual(v.duplicate_dependency_names, []);
});

test("test_empty_dependencies_list_is_a_valid_declaration", () => {
  const m = clone(COMPLETE) as any;
  m.dependencies = [];
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_PYTHON_ENGINEERING_PACK_READY");
  assert.equal(v.dependencies_count, 0);
  assert.deepEqual(v.dependencies_without_pin, []);
  assert.equal(v.pin_coverage, null);
  assert.deepEqual(v.duplicate_dependency_names, []);
  assert.equal(checkStatus(v, "dependencies_declared"), "pass");
  assert.equal(checkStatus(v, "every_dependency_version_pinned"), "pass");
});

test("test_no_virtualenv_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.environment.virtualenv_per_project_used = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY");
  assert.equal(v.sections["environment_and_dependencies"], "fail");
  assert.equal(checkStatus(v, "virtualenv_per_project_used"), "fail");
});

test("test_no_lockfile_fails", () => {
  const m = clone(COMPLETE) as any;
  m.environment.dependency_lockfile_present = false;
  assert.equal(checkStatus(evaluate(m), "dependency_lockfile_present"), "fail");
});

test("test_system_python_installs_fail", () => {
  const m = clone(COMPLETE) as any;
  m.environment.no_installs_into_system_python = false;
  assert.equal(evaluate(m).verdict, "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY");
});

test("test_unpinned_dependency_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.dependencies[0].version_pinned = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY");
  assert.equal(checkStatus(v, "every_dependency_version_pinned"), "fail");
  assert.deepEqual(v.dependencies_without_pin, ["fastapi"]);
  assert.equal(v.pin_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_dependency_missing_pin_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.dependencies[0].version_pinned;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "every_dependency_version_pinned"), "missing");
  assert.deepEqual(v.dependencies_without_pin, []);
});

test("test_duplicate_dependency_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.dependencies[2].name = "fastapi";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_dependency_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_dependency_names, ["fastapi"]);
});

test("test_dependency_missing_name_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.dependencies[2].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "no_dependency_name_duplicated"), "missing");
  assert.deepEqual(v.duplicate_dependency_names, []);
});

test("test_absent_dependencies_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.dependencies;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "dependencies_declared"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.dependencies_count, null);
  assert.equal(v.dependencies_without_pin, null);
  assert.equal(v.pin_coverage, null);
  assert.equal(v.duplicate_dependency_names, null);
});

test("test_unannotated_public_functions_fail_section2", () => {
  const m = clone(COMPLETE) as any;
  m.typing.public_functions_annotated = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY");
  assert.equal(v.sections["typing_and_style"], "fail");
});

test("test_mutable_default_arguments_fail", () => {
  const m = clone(COMPLETE) as any;
  m.style.no_mutable_default_arguments = false;
  assert.equal(checkStatus(evaluate(m), "no_mutable_default_arguments"), "fail");
});

test("test_string_paths_fail", () => {
  const m = clone(COMPLETE) as any;
  m.style.pathlib_used_over_string_paths = false;
  assert.equal(evaluate(m).verdict, "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY");
});

test("test_print_in_libraries_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.errors.logging_used_not_print_in_libraries = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY");
  assert.equal(v.sections["errors_resources_and_async"], "fail");
});

test("test_no_timeouts_on_network_calls_fails", () => {
  const m = clone(COMPLETE) as any;
  m.async_practices.timeouts_on_every_network_call = false;
  assert.equal(checkStatus(evaluate(m), "timeouts_on_every_network_call"), "fail");
});

test("test_blocking_calls_in_event_loop_fail", () => {
  const m = clone(COMPLETE) as any;
  m.async_practices.no_blocking_calls_in_event_loops = false;
  assert.equal(evaluate(m).verdict, "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY");
});

test("test_no_error_path_tests_fail_section4", () => {
  const m = clone(COMPLETE) as any;
  m.testing.error_paths_tested_under_pytest = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY");
  assert.equal(v.sections["testing_discipline"], "fail");
});

test("test_no_parametrize_fails", () => {
  const m = clone(COMPLETE) as any;
  m.testing.pytest_parametrize_used = false;
  assert.equal(checkStatus(evaluate(m), "pytest_parametrize_used"), "fail");
});

test("test_unfrozen_time_and_randomness_fails", () => {
  const m = clone(COMPLETE) as any;
  m.testing.time_and_randomness_frozen_in_tests = false;
  assert.equal(evaluate(m).verdict, "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY");
});

test("test_no_console_entry_points_fail_section5", () => {
  const m = clone(COMPLETE) as any;
  m.packaging.console_entry_points_declared = false;
  const v = evaluate(m);
  assert.equal(v.verdict, "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY");
  assert.equal(v.sections["packaging_and_reproducibility"], "fail");
});

test("test_type_checker_not_clean_on_diff_fails", () => {
  const m = clone(COMPLETE) as any;
  m.packaging.ruff_and_type_checker_clean_on_diff = false;
  assert.equal(checkStatus(evaluate(m), "ruff_and_type_checker_clean_on_diff"), "fail");
});

test("test_non_reproducible_builds_fail", () => {
  const m = clone(COMPLETE) as any;
  m.packaging.reproducible_builds_declared = false;
  assert.equal(evaluate(m).verdict, "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY");
});

test("test_secrets_in_code_fail_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.secrets_in_code_or_notebooks_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_secrets_in_code_or_notebooks"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
});

test("test_unpinned_pip_install_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.unpinned_pip_install_in_production_paths_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "no_unpinned_pip_install_in_production_paths"), "fail");
  assert.equal(v.verdict, "PRODUCTION_PYTHON_ENGINEERING_PACK_NOT_READY");
});

test("test_bare_except_red_line_fails", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.bare_except_present = true;
  assert.equal(checkStatus(evaluate(m), "no_bare_except_clauses"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.testing;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["testing_discipline"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.dependencies_count, null);
  assert.equal(v.dependencies_without_pin, null);
  assert.equal(v.pin_coverage, null);
  assert.equal(v.duplicate_dependency_names, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes("VERDICT: PRODUCTION_PYTHON_ENGINEERING_PACK_READY"));
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
  assert.throws(() => evaluate({ environment: "should-be-an-object" }), fieldError("environment"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ dependencies: { name: "fastapi" } }), fieldError("dependencies"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ dependencies: ["fastapi"] }), fieldError("dependencies[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.testing.error_paths_tested_under_pytest = "yes";
  assert.throws(() => evaluate(m), fieldError("testing.error_paths_tested_under_pytest"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.dependencies[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("dependencies[0].name"));
});

test("malformed: nested list entry boolean pin rejected", () => {
  const m = clone(COMPLETE) as any;
  m.dependencies[1].version_pinned = "yes";
  assert.throws(() => evaluate(m), fieldError("dependencies[1].version_pinned"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.packaging = null;
  assert.throws(() => evaluate(m), fieldError("packaging"));
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
  .filter((f) => f.startsWith("production-python-engineering-pack--") && f.endsWith(".json"))
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
