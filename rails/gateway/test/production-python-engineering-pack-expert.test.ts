import assert from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { evaluate, stamp } from "../src/atoms/production-python-engineering-pack-expert.js";
import { FieldTypeError } from "../src/atoms/validate.js";

const COMPLETE: Record<string, unknown> = {
  project: "expert-svc",
  expert_typing: {
    type_hints_cover_all_functions_expert: true,
    strict_type_checker_mode_where_feasible_expert: true,
    types_used_as_executable_documentation_expert: true },
  expert_idioms: {
    structured_data_modelled_with_dataclasses_or_pydantic_expert: true,
    pathlib_preferred_over_os_path_expert: true,
    f_strings_used_for_formatting_expert: true,
    context_managers_used_for_resources_expert: true,
    enumerate_and_zip_used_over_manual_indexing_expert: true,
    comprehensions_preferred_over_manual_loops_expert: true },
  expert_packaging: {
    venv_pip_pythonpath_environment_declared_expert: true,
    pyproject_toml_declares_project_expert: true,
    requirements_pinned_expert: true,
    reproducible_environment_without_containers_expert: true,
    src_layout_used_expert: true,
    clear_module_boundaries_declared_expert: true,
    no_circular_imports_declared_expert: true,
    main_guard_on_entry_modules_expert: true },
  expert_async: {
    asyncio_used_for_async_paths_expert: true,
    taskgroup_structured_concurrency_used_expert: true,
    no_blocking_calls_in_async_paths_expert: true,
    blocking_work_offloaded_to_thread_or_process_pool_expert: true,
    async_http_via_httpx_or_aiohttp_expert: true },
  expert_performance: {
    profiling_before_optimizing_declared_expert: true,
    profiler_tooling_cprofile_or_py_spy_declared_expert: true,
    numpy_vectorization_applied_where_data_parallel_expert: true,
    cold_code_left_un_micro_optimized_expert: true },
  hot_paths: [
    { name: "tokenizer-loop", profiled_before_optimizing_expert: true, acceleration_route_expert: "rust_pyo3" },
    { name: "matrix-grade", profiled_before_optimizing_expert: true, acceleration_route_expert: "numpy_vectorization" },
    { name: "parser-core", profiled_before_optimizing_expert: true, acceleration_route_expert: "c_extension" },
  ],
  expert_surfaces: {
    fastapi_used_for_typed_services_expert: true,
    pydantic_contracts_on_api_boundaries_expert: true,
    api_health_endpoint_provided_expert: true,
    cli_built_with_argparse_or_typer_expert: true,
    cli_sane_exit_codes_declared_expert: true,
    cli_pipe_friendly_output_declared_expert: true },
  expert_testing: {
    pytest_fixtures_and_parametrize_used_expert: true,
    hypothesis_property_tests_on_core_logic_expert: true,
    coverage_measured_on_critical_path_expert: true,
    ruff_lint_and_format_applied_expert: true,
    mypy_run_as_tooling_gate_expert: true,
    pre_commit_hooks_configured_expert: true,
    failures_loud_in_development_expert: true },
  red_lines: {
    untyped_sprawling_script_present: false,
    mutable_default_arguments_present: false,
    bare_except_present: false,
    hidden_global_state_present: false,
    docker_used_to_paper_over_venv_problem_present: false },
};

const READY = "PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_READY";
const NOT_READY = "PRODUCTION_PYTHON_ENGINEERING_PACK_EXPERT_NOT_READY";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkStatus(v: ReturnType<typeof evaluate>, name: string) {
  return v.checks.find((c) => c.check === name)?.status;
}

test("test_complete_manifest_is_ready", () => {
  const v = evaluate(clone(COMPLETE));
  assert.equal(v.verdict, READY);
  assert.ok(Object.values(v.sections).every((s) => s === "pass"));
  assert.equal(v.checks.length, 48);
  assert.equal(Object.keys(v.sections).length, 7);
  assert.equal(v.computed_status, "within_stated_limits_on_declared_evidence");
  assert.equal(v.hot_paths_count, 3);
  assert.deepEqual(v.hot_paths_not_profiled_first, []);
  assert.deepEqual(v.hot_paths_with_non_skill_route, []);
  assert.equal(v.profiled_first_coverage, "1.000000");
  assert.equal(v.skill_route_coverage, "1.000000");
  assert.deepEqual(v.duplicate_hot_path_names, []);
});

test("test_empty_hot_paths_list_is_a_valid_declaration", () => {
  const m = clone(COMPLETE) as any;
  m.hot_paths = [];
  const v = evaluate(m);
  assert.equal(v.verdict, READY);
  assert.equal(v.hot_paths_count, 0);
  assert.deepEqual(v.hot_paths_not_profiled_first, []);
  assert.deepEqual(v.hot_paths_with_non_skill_route, []);
  assert.equal(v.profiled_first_coverage, null);
  assert.equal(v.skill_route_coverage, null);
  assert.deepEqual(v.duplicate_hot_path_names, []);
  assert.equal(checkStatus(v, "expert_hot_paths_declared"), "pass");
  assert.equal(checkStatus(v, "expert_every_hot_path_profiled_before_optimizing"), "pass");
});

test("test_no_strict_typing_fails_section1", () => {
  const m = clone(COMPLETE) as any;
  m.expert_typing.strict_type_checker_mode_where_feasible_expert = false;
  const v = evaluate(m);
  assert.equal(v.verdict, NOT_READY);
  assert.equal(v.sections["expert_typing_and_idiomatic_style"], "fail");
  assert.equal(checkStatus(v, "expert_strict_type_checker_mode_where_feasible"), "fail");
});

test("test_manual_loops_over_comprehensions_fails", () => {
  const m = clone(COMPLETE) as any;
  m.expert_idioms.comprehensions_preferred_over_manual_loops_expert = false;
  assert.equal(checkStatus(evaluate(m), "expert_comprehensions_preferred_over_manual_loops"), "fail");
});

test("test_circular_imports_fail_section2", () => {
  const m = clone(COMPLETE) as any;
  m.expert_packaging.no_circular_imports_declared_expert = false;
  const v = evaluate(m);
  assert.equal(v.verdict, NOT_READY);
  assert.equal(v.sections["expert_packaging_and_module_boundaries"], "fail");
});

test("test_container_dependent_environment_fails", () => {
  const m = clone(COMPLETE) as any;
  m.expert_packaging.reproducible_environment_without_containers_expert = false;
  assert.equal(evaluate(m).verdict, NOT_READY);
});

test("test_no_main_guard_fails", () => {
  const m = clone(COMPLETE) as any;
  m.expert_packaging.main_guard_on_entry_modules_expert = false;
  assert.equal(checkStatus(evaluate(m), "expert_main_guard_on_entry_modules"), "fail");
});

test("test_blocking_in_async_path_fails_section3", () => {
  const m = clone(COMPLETE) as any;
  m.expert_async.no_blocking_calls_in_async_paths_expert = false;
  const v = evaluate(m);
  assert.equal(v.verdict, NOT_READY);
  assert.equal(v.sections["expert_async_concurrency"], "fail");
});

test("test_no_taskgroup_fails", () => {
  const m = clone(COMPLETE) as any;
  m.expert_async.taskgroup_structured_concurrency_used_expert = false;
  assert.equal(checkStatus(evaluate(m), "expert_taskgroup_structured_concurrency_used"), "fail");
});

test("test_blocking_not_offloaded_fails", () => {
  const m = clone(COMPLETE) as any;
  m.expert_async.blocking_work_offloaded_to_thread_or_process_pool_expert = false;
  assert.equal(evaluate(m).verdict, NOT_READY);
});

test("test_hot_path_not_profiled_first_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.hot_paths[0].profiled_before_optimizing_expert = false;
  const v = evaluate(m);
  assert.equal(v.verdict, NOT_READY);
  assert.equal(checkStatus(v, "expert_every_hot_path_profiled_before_optimizing"), "fail");
  assert.deepEqual(v.hot_paths_not_profiled_first, ["tokenizer-loop"]);
  assert.equal(v.profiled_first_coverage, "0.666667");
  assert.equal(v.computed_status, "outside_stated_limits_on_declared_evidence");
});

test("test_hot_path_missing_profiling_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.hot_paths[0].profiled_before_optimizing_expert;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "expert_every_hot_path_profiled_before_optimizing"), "missing");
  assert.deepEqual(v.hot_paths_not_profiled_first, []);
});

test("test_hot_path_non_skill_route_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.hot_paths[1].acceleration_route_expert = "pure_python_tweaks";
  const v = evaluate(m);
  assert.equal(v.verdict, NOT_READY);
  assert.equal(checkStatus(v, "expert_every_hot_path_uses_skill_named_acceleration_route"), "fail");
  assert.deepEqual(v.hot_paths_with_non_skill_route, ["matrix-grade"]);
  assert.equal(v.skill_route_coverage, "0.666667");
});

test("test_hot_path_empty_route_fails", () => {
  const m = clone(COMPLETE) as any;
  m.hot_paths[2].acceleration_route_expert = "";
  const v = evaluate(m);
  assert.deepEqual(v.hot_paths_with_non_skill_route, ["parser-core"]);
  assert.equal(checkStatus(v, "expert_every_hot_path_uses_skill_named_acceleration_route"), "fail");
});

test("test_hot_path_missing_route_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.hot_paths[1].acceleration_route_expert;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "expert_every_hot_path_uses_skill_named_acceleration_route"), "missing");
  assert.deepEqual(v.hot_paths_with_non_skill_route, []);
});

test("test_duplicate_hot_path_name_fails_and_is_named", () => {
  const m = clone(COMPLETE) as any;
  m.hot_paths[2].name = "tokenizer-loop";
  const v = evaluate(m);
  assert.equal(checkStatus(v, "expert_no_hot_path_name_duplicated"), "fail");
  assert.deepEqual(v.duplicate_hot_path_names, ["tokenizer-loop"]);
});

test("test_hot_path_missing_name_is_missing_for_duplicate_check", () => {
  const m = clone(COMPLETE) as any;
  delete m.hot_paths[2].name;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "expert_no_hot_path_name_duplicated"), "missing");
  assert.deepEqual(v.duplicate_hot_path_names, []);
});

test("test_absent_hot_paths_list_is_missing_evidence", () => {
  const m = clone(COMPLETE) as any;
  delete m.hot_paths;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(checkStatus(v, "expert_hot_paths_declared"), "missing");
  assert.equal(v.computed_status, null);
  assert.equal(v.hot_paths_count, null);
  assert.equal(v.hot_paths_not_profiled_first, null);
  assert.equal(v.hot_paths_with_non_skill_route, null);
  assert.equal(v.profiled_first_coverage, null);
  assert.equal(v.skill_route_coverage, null);
  assert.equal(v.duplicate_hot_path_names, null);
});

test("test_cold_code_micro_optimized_fails_section4", () => {
  const m = clone(COMPLETE) as any;
  m.expert_performance.cold_code_left_un_micro_optimized_expert = false;
  const v = evaluate(m);
  assert.equal(v.verdict, NOT_READY);
  assert.equal(v.sections["expert_performance_and_profiling"], "fail");
});

test("test_no_health_endpoint_fails_section5", () => {
  const m = clone(COMPLETE) as any;
  m.expert_surfaces.api_health_endpoint_provided_expert = false;
  const v = evaluate(m);
  assert.equal(v.verdict, NOT_READY);
  assert.equal(v.sections["expert_api_and_cli_surfaces"], "fail");
  assert.equal(checkStatus(v, "expert_api_health_endpoint_provided"), "fail");
});

test("test_cli_not_pipe_friendly_fails", () => {
  const m = clone(COMPLETE) as any;
  m.expert_surfaces.cli_pipe_friendly_output_declared_expert = false;
  assert.equal(evaluate(m).verdict, NOT_READY);
});

test("test_no_hypothesis_fails_section6", () => {
  const m = clone(COMPLETE) as any;
  m.expert_testing.hypothesis_property_tests_on_core_logic_expert = false;
  const v = evaluate(m);
  assert.equal(v.verdict, NOT_READY);
  assert.equal(v.sections["expert_testing_and_tooling"], "fail");
});

test("test_no_pre_commit_fails", () => {
  const m = clone(COMPLETE) as any;
  m.expert_testing.pre_commit_hooks_configured_expert = false;
  assert.equal(checkStatus(evaluate(m), "expert_pre_commit_hooks_configured"), "fail");
});

test("test_untyped_sprawling_script_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.untyped_sprawling_script_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "expert_no_untyped_sprawling_scripts"), "fail");
  assert.equal(v.sections["red_lines"], "fail");
});

test("test_mutable_defaults_fail_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.mutable_default_arguments_present = true;
  const v = evaluate(m);
  assert.equal(checkStatus(v, "expert_no_mutable_default_arguments"), "fail");
  assert.equal(v.verdict, NOT_READY);
});

test("test_bare_except_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.bare_except_present = true;
  assert.equal(checkStatus(evaluate(m), "expert_no_bare_except_clauses"), "fail");
});

test("test_hidden_global_state_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.hidden_global_state_present = true;
  assert.equal(checkStatus(evaluate(m), "expert_no_hidden_global_state"), "fail");
});

test("test_docker_for_venv_problem_fails_red_lines", () => {
  const m = clone(COMPLETE) as any;
  m.red_lines.docker_used_to_paper_over_venv_problem_present = true;
  assert.equal(checkStatus(evaluate(m), "expert_no_docker_substitute_for_venv_fix"), "fail");
});

test("test_absent_evidence_is_insufficient_not_failed", () => {
  const m = clone(COMPLETE) as any;
  delete m.expert_testing;
  const v = evaluate(m);
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.equal(v.sections["expert_testing_and_tooling"], "insufficient_evidence");
});

test("test_empty_manifest_is_insufficient_evidence", () => {
  const v = evaluate({});
  assert.equal(v.verdict, "INSUFFICIENT_EVIDENCE");
  assert.ok(v.checks.every((c) => c.status === "missing"));
  assert.equal(v.computed_status, null);
  assert.equal(v.hot_paths_count, null);
  assert.equal(v.hot_paths_not_profiled_first, null);
  assert.equal(v.hot_paths_with_non_skill_route, null);
  assert.equal(v.profiled_first_coverage, null);
  assert.equal(v.skill_route_coverage, null);
  assert.equal(v.duplicate_hot_path_names, null);
});

test("test_stamp_names_the_verdict", () => {
  assert.ok(stamp(evaluate(clone(COMPLETE))).includes(`VERDICT: ${READY}`));
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
  assert.throws(() => evaluate({ expert_typing: "should-be-an-object" }), fieldError("expert_typing"));
});

test("malformed: list field as object rejected", () => {
  assert.throws(() => evaluate({ hot_paths: { name: "tokenizer-loop" } }), fieldError("hot_paths"));
});

test("malformed: list entry as string rejected", () => {
  assert.throws(() => evaluate({ hot_paths: ["tokenizer-loop"] }), fieldError("hot_paths[0]"));
});

test("malformed: boolean leaf as string rejected", () => {
  const m = clone(COMPLETE) as any;
  m.expert_async.no_blocking_calls_in_async_paths_expert = "yes";
  assert.throws(() => evaluate(m), fieldError("expert_async.no_blocking_calls_in_async_paths_expert"));
});

test("malformed: nested list entry string field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.hot_paths[0].name = 42;
  assert.throws(() => evaluate(m), fieldError("hot_paths[0].name"));
});

test("malformed: nested list entry boolean field rejected", () => {
  const m = clone(COMPLETE) as any;
  m.hot_paths[1].profiled_before_optimizing_expert = "yes";
  assert.throws(() => evaluate(m), fieldError("hot_paths[1].profiled_before_optimizing_expert"));
});

test("malformed: nested list entry route as number rejected", () => {
  const m = clone(COMPLETE) as any;
  m.hot_paths[1].acceleration_route_expert = 7;
  assert.throws(() => evaluate(m), fieldError("hot_paths[1].acceleration_route_expert"));
});

test("malformed: null section rejected", () => {
  const m = clone(COMPLETE) as any;
  m.expert_packaging = null;
  assert.throws(() => evaluate(m), fieldError("expert_packaging"));
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
  .filter((f) => f.startsWith("production-python-engineering-pack-expert--") && f.endsWith(".json"))
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
